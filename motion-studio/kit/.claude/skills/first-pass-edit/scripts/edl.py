#!/usr/bin/env python3
"""
First-pass edit helper. Deterministic, evidence-based, no guessing.

  edl.py propose transcript.json --source raw/take.mp4 [--duration 123.4] > edl.json
  edl.py apply   edl.json out.mp4 [--dry-run]      # renders keep-segments with ffmpeg
  edl.py retime  edl.json transcript.json > transcript.cut.json   # shift word times to the cut video

transcript.json = [{"text": str, "start": sec, "end": sec}, ...]  (npx hyperframes transcribe / WhisperX word level)
Cuts with status "auto" or "approved" are applied; "review" and "rejected" are not.
"""
import argparse, json, re, subprocess, sys

TASHKEEL = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")
PUNCT = re.compile(r"[^\w\s]", re.UNICODE)
HARD_FILLERS = {"امم", "اممم", "ام", "مم", "ممم", "اا", "ااا", "اه", "اهه", "um", "uh", "uhm", "erm"}
SOFT_FILLERS = {"يعني", "هيك", "اسمو", "اسمه"}
MIN_KEEP = 0.15  # never keep a fragment shorter than this between two cuts
RESTART_CUES = [("لا", "لا"), ("خليني", "اعيد"), ("من", "الاول"), ("عفوا",), ("بعيد",), ("sorry",)]


def norm(w):
    w = TASHKEEL.sub("", w)
    w = PUNCT.sub("", w)
    w = re.sub("[أإآ]", "ا", w).replace("ة", "ه").replace("ى", "ي")
    return w.strip().lower()


def probe_duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def propose(args):
    words = json.load(open(args.transcript, encoding="utf-8"))
    words = [w for w in words if w.get("end", 0) > w.get("start", 0)]
    dur = args.duration if args.duration else probe_duration(args.source)
    P, cuts = args.pad, []

    def add(start, end, typ, idx, evidence, status):
        start, end = max(0.0, round(start, 3)), min(dur, round(end, 3))
        if end - start >= 0.05:
            cuts.append({"start": start, "end": end, "type": typ, "words": idx,
                         "evidence": evidence, "status": status})

    # 1) silences: head, gaps between words, tail
    if words and words[0]["start"] > P + 0.05:
        add(0, words[0]["start"] - P, "silence", [], f"lead-in silence {words[0]['start']:.2f}s", "auto")
    for i in range(len(words) - 1):
        gap = words[i + 1]["start"] - words[i]["end"]
        if gap >= args.min_silence:
            add(words[i]["end"] + P, words[i + 1]["start"] - P, "silence", [i, i + 1],
                f"gap {gap:.2f}s between «{words[i]['text']}»(#{i}) and «{words[i+1]['text']}»(#{i+1})", "auto")
    if words and dur - words[-1]["end"] > P + 0.05:
        add(words[-1]["end"] + P, dur, "silence", [], f"tail silence {dur - words[-1]['end']:.2f}s", "auto")

    # 2) fillers
    toks = [norm(w["text"]) for w in words]
    for i, t in enumerate(toks):
        if t in HARD_FILLERS:
            add(words[i]["start"] - 0.02, words[i]["end"] + 0.02, "filler", [i, i],
                f"hard filler «{words[i]['text']}»", "auto")
        elif t in SOFT_FILLERS:
            before = words[i]["start"] - words[i - 1]["end"] if i > 0 else 1
            after = words[i + 1]["start"] - words[i]["end"] if i + 1 < len(words) else 1
            if before >= 0.25 and after >= 0.25:
                add(words[i]["start"] - 0.02, words[i]["end"] + 0.02, "filler", [i, i],
                    f"soft filler «{words[i]['text']}» isolated by pauses {before:.2f}s/{after:.2f}s", "review")

    # 3) retakes: a phrase of >= n words repeated within the window -> earlier attempt is a candidate
    i = 0
    while i < len(toks):
        found = None
        for n in (5, 4, 3):
            if i + n > len(toks):
                continue
            phrase = toks[i:i + n]
            if any(not t for t in phrase):
                continue
            j = i + n
            while j + n <= len(toks) and words[j]["start"] - words[i]["start"] <= args.retake_window:
                if toks[j:j + n] == phrase:
                    found = (n, j)
                    break
                j += 1
            if found:
                break
        if found:
            n, j = found
            add(words[i]["start"] - P, words[j]["start"] - P, "retake", [i, j - 1],
                f"phrase «{' '.join(w['text'] for w in words[i:i+n])}» restarts at {words[j]['start']:.2f}s (#{j}); keeping the later take",
                "review")
            i = j
        else:
            i += 1

    # 4) explicit restart cues (self-corrections) -> cut back to the previous pause
    for i in range(len(toks)):
        for cue in RESTART_CUES:
            if tuple(toks[i:i + len(cue)]) == cue:
                k = i
                while k > 0 and words[k]["start"] - words[k - 1]["end"] < 0.4:
                    k -= 1
                add(words[k]["start"] - P, words[i + len(cue) - 1]["end"] + P, "mistake", [k, i + len(cue) - 1],
                    f"restart cue «{' '.join(w['text'] for w in words[i:i+len(cue)])}» at {words[i]['start']:.2f}s", "review")

    cuts.sort(key=lambda c: (c["start"], c["end"]))
    for n, c in enumerate(cuts, 1):
        c["id"] = f"c{n:03d}"
    edl = {"source": args.source, "transcript": args.transcript, "duration": round(dur, 3), "fps": args.fps,
           "params": {"min_silence": args.min_silence, "pad": P, "retake_window": args.retake_window},
           "cuts": cuts}
    edl["keep"] = keep_segments(edl)
    edl["summary"] = summarize(edl)
    json.dump(edl, sys.stdout, ensure_ascii=False, indent=2)
    print()


def applied(edl):
    spans = sorted((c["start"], c["end"]) for c in edl["cuts"] if c["status"] in ("auto", "approved"))
    merged = []
    for s, e in spans:
        if merged and s - merged[-1][1] < MIN_KEEP:   # also swallow slivers shorter than MIN_KEEP
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return merged


def keep_segments(edl):
    keep, t = [], 0.0
    for s, e in applied(edl):
        if s - t >= 0.05:
            keep.append({"start": round(t, 3), "end": round(s, 3)})
        t = max(t, e)
    if edl["duration"] - t >= 0.05:
        keep.append({"start": round(t, 3), "end": edl["duration"]})
    return keep


def summarize(edl):
    kept = sum(k["end"] - k["start"] for k in edl["keep"])
    by = {}
    for c in edl["cuts"]:
        by.setdefault(f'{c["type"]}:{c["status"]}', 0)
        by[f'{c["type"]}:{c["status"]}'] += 1
    return {"original_s": edl["duration"], "after_applied_cuts_s": round(kept, 3), "counts": by}


def apply(args):
    edl = json.load(open(args.edl, encoding="utf-8"))
    keep = keep_segments(edl)
    parts, labels = [], ""
    for k, seg in enumerate(keep):
        parts.append(f"[0:v]trim=start={seg['start']}:end={seg['end']},setpts=PTS-STARTPTS[v{k}]")
        parts.append(f"[0:a]atrim=start={seg['start']}:end={seg['end']},asetpts=PTS-STARTPTS[a{k}]")
        labels += f"[v{k}][a{k}]"
    fc = ";".join(parts) + f";{labels}concat=n={len(keep)}:v=1:a=1[v][a]"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-stats", "-i", edl["source"], "-filter_complex", fc,
           "-map", "[v]", "-map", "[a]", "-r", str(edl.get("fps", 30)), "-fps_mode", "cfr",
           "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", args.out]
    print(" ".join(c if c != fc else "'" + fc + "'" for c in cmd), file=sys.stderr)
    if not args.dry_run:
        subprocess.run(cmd, check=True)


def retime(args):
    edl = json.load(open(args.edl, encoding="utf-8"))
    words = json.load(open(args.transcript, encoding="utf-8"))
    keep, out, offset_map = keep_segments(edl), [], []
    acc = 0.0
    for seg in keep:
        offset_map.append((seg["start"], seg["end"], acc - seg["start"]))
        acc += seg["end"] - seg["start"]
    for w in words:
        mid = (w["start"] + w["end"]) / 2
        for s, e, off in offset_map:
            if s <= mid < e:
                out.append({**w, "start": round(max(s, w["start"]) + off, 3), "end": round(min(e, w["end"]) + off, 3)})
                break
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
    print()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("propose"); p.add_argument("transcript"); p.add_argument("--source", required=True)
    p.add_argument("--duration", type=float); p.add_argument("--fps", type=int, default=30)
    p.add_argument("--min-silence", type=float, default=0.45); p.add_argument("--pad", type=float, default=0.08)
    p.add_argument("--retake-window", type=float, default=15.0); p.set_defaults(fn=propose)
    a = sub.add_parser("apply"); a.add_argument("edl"); a.add_argument("out"); a.add_argument("--dry-run", action="store_true")
    a.set_defaults(fn=apply)
    r = sub.add_parser("retime"); r.add_argument("edl"); r.add_argument("transcript"); r.set_defaults(fn=retime)
    args = ap.parse_args(); args.fn(args)
