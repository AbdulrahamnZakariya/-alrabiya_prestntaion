#!/usr/bin/env python3
"""
autocut.py — Arabic-aware first-pass cutter.
  transcribe  : media -> words.json   (WhisperX on NVIDIA/CPU, or mlx-whisper on Apple Silicon)
  plan        : words.json -> edl.json (removes silences, fillers, stutters, retakes: keeps the LAST take)
  render      : edl.json -> cut.mp4    (ffmpeg trim/atrim + concat, 10 ms audio fades = no clicks)

Python 3.10+ (tested on 3.11; WhisperX requires >=3.10,<3.14). Only stdlib needed for plan/render.

Usage:
  python autocut.py transcribe raw/take.mp4 -o work/words.json --backend whisperx --lang ar
  python autocut.py plan work/words.json raw/take.mp4 -o edl.json
  python autocut.py render edl.json -o work/aroll.mp4
"""
from __future__ import annotations
import argparse, json, re, subprocess, sys
from difflib import SequenceMatcher
from pathlib import Path

# ----------------------------------------------------------------------------- transcription
def transcribe(media: str, backend: str, lang: str, model: str | None) -> list[dict]:
    words: list[dict] = []
    if backend == "whisperx":                      # NVIDIA GPU (float16) or CPU (int8)
        import whisperx, torch                     # pip install whisperx
        device = "cuda" if torch.cuda.is_available() else "cpu"
        ctype = "float16" if device == "cuda" else "int8"
        asr = whisperx.load_model(model or "large-v3", device, compute_type=ctype, language=lang)
        audio = whisperx.load_audio(media)
        res = asr.transcribe(audio, batch_size=16 if device == "cuda" else 4, language=lang)
        # Arabic default align model: jonatasgrosman/wav2vec2-large-xlsr-53-arabic
        align_model, meta = whisperx.load_align_model(language_code=lang, device=device)
        res = whisperx.align(res["segments"], align_model, meta, audio, device, return_char_alignments=False)
        for seg in res["segments"]:
            for w in seg.get("words", []):
                words.append({"w": w["word"].strip(), "s": w.get("start"), "e": w.get("end"),
                              "p": w.get("score")})
    elif backend == "mlx":                         # Apple Silicon (M1..M4)
        import mlx_whisper                         # pip install mlx-whisper
        res = mlx_whisper.transcribe(media, path_or_hf_repo=model or "mlx-community/whisper-large-v3-mlx",
                                     word_timestamps=True, language=lang)
        for seg in res["segments"]:
            for w in seg.get("words", []):
                words.append({"w": w["word"].strip(), "s": w["start"], "e": w["end"], "p": w.get("probability")})
    else:
        sys.exit(f"unknown backend {backend}")
    # WhisperX can leave numbers/symbols unaligned (no start/end): interpolate from neighbours
    for i, w in enumerate(words):
        if w["s"] is None or w["e"] is None:
            prev_e = words[i - 1]["e"] if i else 0.0
            nxt = next((x["s"] for x in words[i + 1:] if x["s"] is not None), prev_e + 0.3)
            w["s"], w["e"] = prev_e, max(prev_e + 0.05, nxt)
    return words

# ----------------------------------------------------------------------------- Arabic normalisation
TASHKEEL = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")  # harakat + tatweel
PUNCT = re.compile(r"[^\w\s]", re.UNICODE)
FILLER_RE = re.compile(r"^(ا+م+|ا+ه+|ا{2,}|م{2,}|ه+م+|ا+|um+|uh+|eh+|hmm+)$")   # conservative on purpose
RETAKE_MARKERS = {"خليني اعيد", "اعيدها", "من جديد", "نعيد", "كات", "cut", "again"}

def norm(t: str) -> str:
    t = TASHKEEL.sub("", t)
    t = re.sub("[إأآٱ]", "ا", t).replace("ى", "ي").replace("ة", "ه")
    return PUNCT.sub("", t).strip().lower()

# ----------------------------------------------------------------------------- planning
def plan(words: list[dict], utt_gap: float, keep_gap: float, pre: float, post: float,
         prefix_thr: float, full_thr: float, lookahead: int) -> tuple[list[dict], list[dict]]:
    for i, w in enumerate(words):
        w["i"], w["n"], w["drop"] = i, norm(w["w"]), None

    # 1) fillers (only whole-token matches — never guess on real words like "يعني")
    for w in words:
        if not w["n"] or FILLER_RE.match(w["n"]):
            w["drop"] = "filler"

    # 2) utterances: split on long pauses or sentence punctuation
    utts, cur = [], []
    for i, w in enumerate(words):
        if cur and (w["s"] - cur[-1]["e"] > utt_gap):
            utts.append(cur); cur = []
        cur.append(w)
        if re.search(r"[.!?؟]$", w["w"]):
            utts.append(cur); cur = []
    if cur: utts.append(cur)

    def toks(u): return [w["n"] for w in u if not w["drop"]]

    # 3) stutters inside an utterance: "عن عن" / "في هذا في هذا" -> drop the first copy
    for u in utts:
        live = [w for w in u if not w["drop"]]
        for n in (3, 2, 1):
            k = 0
            while k + 2 * n <= len(live):
                if [x["n"] for x in live[k:k + n]] == [x["n"] for x in live[k + n:k + 2 * n]]:
                    for x in live[k:k + n]: x["drop"] = f"stutter{n}"
                    live = [w for w in live if not w["drop"]]
                else:
                    k += 1

    # 4) retakes across utterances: if utterance i ~ prefix of / whole of a later one -> drop i (keep LAST take)
    decisions = []
    for a_idx, ua in enumerate(utts):
        a = toks(ua)
        if not a: continue
        text_a = " ".join(a)
        if any(m in text_a for m in RETAKE_MARKERS):          # explicit "let me redo it"
            for w in ua: w["drop"] = "retake-marker"
            if a_idx:
                for w in utts[a_idx - 1]: w["drop"] = w["drop"] or "retake-before-marker"
            continue
        if len(a) < 2: continue
        for b_idx in range(a_idx + 1, min(len(utts), a_idx + 1 + lookahead)):
            b = toks(utts[b_idx])
            if not b: continue
            pref = SequenceMatcher(None, a, b[:len(a) + 1]).ratio()
            full = SequenceMatcher(None, a, b).ratio()
            if pref >= prefix_thr or full >= full_thr:
                for w in ua: w["drop"] = w["drop"] or "retake"
                decisions.append({"dropped_utt": " ".join(x["w"] for x in ua),
                                  "kept_utt": " ".join(x["w"] for x in utts[b_idx]),
                                  "prefix_sim": round(pref, 2), "full_sim": round(full, 2)})
                break

    # 5) keep-segments: consecutive kept words with gap <= keep_gap, padded
    kept = [w for w in words if not w["drop"]]
    segs: list[dict] = []
    for w in kept:
        if segs and w["i"] == segs[-1]["last_i"] + 1 and w["s"] - segs[-1]["e"] <= keep_gap:
            segs[-1]["e"], segs[-1]["last_i"] = w["e"], w["i"]
        elif segs and w["s"] - segs[-1]["e"] <= keep_gap and all(
                words[j]["drop"] == "filler" and words[j]["e"] - words[j]["s"] < 0.25
                for j in range(segs[-1]["last_i"] + 1, w["i"])):
            segs[-1]["e"], segs[-1]["last_i"] = w["e"], w["i"]    # tiny filler inside speech: don't chop
        else:
            segs.append({"s": w["s"], "e": w["e"], "last_i": w["i"]})
    for k, sg in enumerate(segs):                                  # pad without overlapping neighbours
        lo = (segs[k - 1]["e"] + sg["s"]) / 2 if k else 0.0
        sg["in"] = round(max(lo, sg["s"] - pre), 3)
        sg["out"] = round(sg["e"] + post, 3)
    for k in range(len(segs) - 1):
        if segs[k]["out"] > segs[k + 1]["in"]:
            mid = round((segs[k]["e"] + segs[k + 1]["s"]) / 2, 3)
            segs[k]["out"], segs[k + 1]["in"] = mid, mid
    return segs, decisions

def build_edl(words, segs, decisions, media, args) -> dict:
    out_t, segments, remapped = 0.0, [], []
    for k, sg in enumerate(segs):
        dur = round(sg["out"] - sg["in"], 3)
        segments.append({"id": k, "src": media, "in": sg["in"], "out": sg["out"],
                         "rec_in": round(out_t, 3), "rec_out": round(out_t + dur, 3)})
        for w in words:
            if not w["drop"] and sg["in"] <= w["s"] < sg["out"]:
                remapped.append({"w": w["w"], "s": round(w["s"] - sg["in"] + out_t, 3),
                                 "e": round(min(w["e"], sg["out"]) - sg["in"] + out_t, 3)})
        out_t += dur
    return {"version": 1, "source": media, "params": vars(args) | {"cmd": None},
            "segments": segments, "duration_out": round(out_t, 3),
            "removed": [{"w": w["w"], "s": w["s"], "e": w["e"], "why": w["drop"]} for w in words if w["drop"]],
            "retake_decisions": decisions,
            "captions_words": remapped}   # words re-timed to the CUT timeline -> arabic-captions skill

# ----------------------------------------------------------------------------- rendering
def render(edl: dict, out: str, crf: int, fade: float = 0.01) -> None:
    parts, labels = [], []
    for k, s in enumerate(edl["segments"]):
        d = s["out"] - s["in"]
        parts.append(f"[0:v]trim=start={s['in']}:end={s['out']},setpts=PTS-STARTPTS[v{k}];")
        parts.append(f"[0:a]atrim=start={s['in']}:end={s['out']},asetpts=PTS-STARTPTS,"
                     f"afade=t=in:d={fade},afade=t=out:st={max(0, d - fade):.3f}:d={fade}[a{k}];")
        labels.append(f"[v{k}][a{k}]")
    fc = "".join(parts) + "".join(labels) + f"concat=n={len(labels)}:v=1:a=1[v][a]"
    script = Path(out).with_suffix(".filter.txt"); script.write_text(fc, encoding="utf-8")
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", edl["source"], "-filter_complex_script", str(script),
           "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", str(crf), "-preset", "medium",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    print("+", " ".join(cmd)); subprocess.run(cmd, check=True)

# ----------------------------------------------------------------------------- CLI
def main():
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("transcribe"); t.add_argument("media"); t.add_argument("-o", required=True)
    t.add_argument("--backend", choices=["whisperx", "mlx"], default="whisperx")
    t.add_argument("--lang", default="ar"); t.add_argument("--model")
    p = sub.add_parser("plan"); p.add_argument("words"); p.add_argument("media"); p.add_argument("-o", required=True)
    p.add_argument("--utt-gap", type=float, default=0.7, help="pause (s) that ends an utterance")
    p.add_argument("--keep-gap", type=float, default=0.35, help="pauses longer than this are cut")
    p.add_argument("--pre", type=float, default=0.06); p.add_argument("--post", type=float, default=0.12)
    p.add_argument("--prefix-thr", type=float, default=0.7); p.add_argument("--full-thr", type=float, default=0.75)
    p.add_argument("--lookahead", type=int, default=3, help="how many later utterances to compare")
    r = sub.add_parser("render"); r.add_argument("edl"); r.add_argument("-o", required=True)
    r.add_argument("--crf", type=int, default=18)
    a = ap.parse_args()
    if a.cmd == "transcribe":
        w = transcribe(a.media, a.backend, a.lang, a.model)
        Path(a.o).write_text(json.dumps(w, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{len(w)} words -> {a.o}")
    elif a.cmd == "plan":
        words = json.loads(Path(a.words).read_text(encoding="utf-8"))
        segs, dec = plan(words, a.utt_gap, a.keep_gap, a.pre, a.post, a.prefix_thr, a.full_thr, a.lookahead)
        edl = build_edl(words, segs, dec, a.media, a)
        Path(a.o).write_text(json.dumps(edl, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{len(segs)} segments, {edl['duration_out']}s out, removed {len(edl['removed'])} words -> {a.o}")
    else:
        render(json.loads(Path(a.edl).read_text(encoding="utf-8")), a.o, a.crf)

if __name__ == "__main__":
    main()
