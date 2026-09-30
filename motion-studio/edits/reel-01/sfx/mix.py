#!/usr/bin/env python3
"""Mix a voice track + ducked music bed + timed SFX cues, then loudness-normalise.

usage:  python3 mix.py VOICE.wav CUES.json OUT.wav [--sfx-dir DIR] [--target -14] [--tp -1.5]

CUES.json:
{
  "bed": "bed_tech.wav",            # file in --sfx-dir (default: this folder) or absolute path; optional
  "bed_db": -8,                     # plain gain on the bed file (beds are delivered at -18 LUFS) ...
  "bed_lu_below_voice": 12,         # ... OR level the bed N LU under the voice (overrides bed_db). 12 ~= -26 LUFS in a -14 mix
  "bed_offset": 0.0,                # seconds into the bed file to start from (loops seamlessly)
  "bed_fade_in": 0.4, "bed_fade_out": 1.5,
  "duck_db": 9, "attack_ms": 150, "release_ms": 400, "hold_ms": 200, "lookahead_ms": 60,
  "voice_db": 0,
  "cues": [ {"t": 1.23, "file": "impact_hit_a.wav", "db": -6, "pan": 0.0}, ... ]
}
Cue "t" is the exact time (s) at which the FIRST SAMPLE of the SFX file lands.  "pan" optional (-1..1).
Output: 48 kHz stereo 24-bit WAV at -14 LUFS integrated, true peak <= -1.5 dBTP (ffmpeg loudnorm two-pass, linear).
Any input format ffmpeg can decode is accepted for the voice (wav/mp3/m4a/mp4...).
"""
import argparse, json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from scipy import signal as ss
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
FFMPEG = os.environ.get('FFMPEG', '/usr/local/bin/ffmpeg')
HERE = os.path.dirname(os.path.abspath(__file__))


def load(path):
    """Decode anything to 48 kHz stereo float64 via ffmpeg."""
    raw = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-vn', '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def lufs(x):
    """ITU-R BS.1770-4 integrated loudness, 48 kHz."""
    y = ss.lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, axis=0)
    y = ss.lfilter([1, -2, 1], [1, -1.99004745483398, 0.99007225036621], y, axis=0)
    c = np.concatenate([[0], np.cumsum((y ** 2).sum(1))])
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    s = np.arange(0, len(y) - blk + 1, hop)
    if not len(s): return -np.inf
    z = (c[s + blk] - c[s]) / blk
    z = z[-0.691 + 10 * np.log10(z + 1e-20) > -70]
    if not len(z): return -np.inf
    z = z[-0.691 + 10 * np.log10(z) > -0.691 + 10 * np.log10(z.mean()) - 10]
    return -0.691 + 10 * np.log10(z.mean())


def db(g): return 10 ** (g / 20)


def fade(x, fi, fo):
    a, b = int(fi * SR), int(fo * SR)
    if a > 0: x[:a] *= (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a)))[:, None]
    if b > 0: x[-b:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b)))[:, None]
    return x


def duck_gain(voice, n, duck_db, attack_ms, release_ms, hold_ms, look_ms):
    """Sample-rate gain curve for the bed: -duck_db while voice is active, smoothed attack/release."""
    hop = SR // 1000                                         # 1 ms control rate
    m = voice.mean(1)
    pw = uniform_filter1d(m ** 2, int(0.02 * SR))[::hop]      # 20 ms RMS
    lev = 10 * np.log10(pw + 1e-12)
    ref = np.percentile(lev, 95)
    active = lev > max(ref - 28, -50)                         # speech gate relative to the speech level
    cs = np.concatenate([[0], np.cumsum(active)])             # forward hold: bridges gaps between words
    i = np.arange(len(active)); active = (cs[i + 1] - cs[np.maximum(0, i - hold_ms)]) > 0
    if look_ms > 0:                                           # lookahead: start ducking just before speech
        active = np.concatenate([active[look_ms:], np.repeat(active[-1:], look_ms)])
    target = np.where(active, -duck_db, 0.0)
    target = np.pad(target, (0, max(0, n // hop + 2 - len(target))))
    a_att, a_rel = np.exp(-1 / attack_ms), np.exp(-1 / release_ms)
    g = np.empty_like(target); cur = 0.0
    for i, tg in enumerate(target):
        a = a_att if tg < cur else a_rel
        cur = a * cur + (1 - a) * tg; g[i] = cur
    gs = np.interp(np.arange(n) / hop, np.arange(len(g)), g)
    return db(gs)[:, None], active


def limiter(x, ceil_db, look=0.004, win=0.03):
    """Transparent true-peak-ish lookahead limiter (4x oversampled detection, no overshoot)."""
    up = np.abs(ss.resample_poly(x, 4, 1, axis=0)).max(1)
    pk = up[:len(x) * 4].reshape(-1, 4).max(1)
    pk = np.pad(pk, (0, len(x) - len(pk)), constant_values=0)
    req = np.minimum(1.0, db(ceil_db) / np.maximum(pk, 1e-9))
    w = int(win * SR) | 1
    g = minimum_filter1d(req, w)
    g = uniform_filter1d(g, w)
    return x * g[:, None], 20 * np.log10(g.min())


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True).stderr


def last_json(txt):
    return json.loads(re.findall(r'\{[^{}]*\}', txt, re.S)[-1])


def measure(path):
    e = run([FFMPEG, '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)[-1])
    LRA = float(re.findall(r'LRA:\s+(-?[\d.]+) LU', e)[-1])
    return I, TP, LRA


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('voice'); ap.add_argument('cues'); ap.add_argument('out')
    ap.add_argument('--sfx-dir', default=HERE)
    ap.add_argument('--target', type=float, default=-14.0)
    ap.add_argument('--tp', type=float, default=-1.5)
    ap.add_argument('--keep-temp', action='store_true')
    a = ap.parse_args()
    C = json.load(open(a.cues))
    res = lambda f: f if os.path.isabs(f) else os.path.join(a.sfx_dir, f)

    voice = load(a.voice) * db(C.get('voice_db', 0))
    n = len(voice)
    cache, placed = {}, []
    for c in C.get('cues', []):
        f = res(c['file'])
        if f not in cache: cache[f] = load(f)
        s = cache[f] * db(c.get('db', 0))
        if 'pan' in c:
            p = float(c['pan']); th = (p + 1) * np.pi / 4
            s = s * np.array([np.cos(th), np.sin(th)]) * np.sqrt(2)
        i = int(round(float(c['t']) * SR))
        placed.append((i, s)); n = max(n, i + len(s))
    mix = np.zeros((n, 2)); mix[:len(voice)] += voice
    report = {'voice_lufs_raw': round(lufs(voice), 2), 'cues': len(placed)}

    if C.get('bed'):
        b = load(res(C['bed']))
        off = int(C.get('bed_offset', 0) * SR) % len(b)
        idx = (off + np.arange(n)) % len(b)                    # seamless loop (beds are circular)
        bed = b[idx].copy()
        if C.get('bed_lu_below_voice') is not None:
            g = report['voice_lufs_raw'] - float(C['bed_lu_below_voice']) - lufs(bed)
        else:
            g = float(C.get('bed_db', -8))
        bed *= db(g)
        bed = fade(bed, C.get('bed_fade_in', 0.4), C.get('bed_fade_out', 1.5))
        vpad = np.zeros((n, 2)); vpad[:len(voice)] = voice
        gcurve, active = duck_gain(vpad, n, C.get('duck_db', 9), C.get('attack_ms', 150), C.get('release_ms', 400),
                                   C.get('hold_ms', 200), C.get('lookahead_ms', 60))
        mix += bed * gcurve
        gd = 20 * np.log10(gcurve[::SR // 1000, 0][:len(active)])
        report.update(bed_gain_db=round(g, 2), bed_lufs_undocked=round(lufs(bed), 2),
                      voice_active_pct=round(100 * active.mean(), 1),
                      duck_median_db_speech=round(float(np.median(gd[active[:len(gd)]])), 2),
                      duck_median_db_gaps=round(float(np.median(gd[~active[:len(gd)]])), 2) if (~active).any() else 0.0)
    for i, s in placed:
        mix[i:i + len(s)] += s

    # pre-normalise + limit so loudnorm pass 2 stays in LINEAR mode (no pumping)
    L0 = lufs(mix)
    mix *= db(a.target - L0)
    mix, gr = limiter(mix, a.tp - 0.6)
    report.update(premix_lufs=round(L0, 2), limiter_max_gr_db=round(-gr, 2))  # peak-only; transparent 30 ms ramps

    tmpd = tempfile.mkdtemp(); tmp = os.path.join(tmpd, 'premix.wav')
    sf.write(tmp, mix.astype(np.float32), SR, subtype='FLOAT')
    base = f'loudnorm=I={a.target}:TP={a.tp}'
    m1 = last_json(run([FFMPEG, '-hide_banner', '-nostats', '-i', tmp, '-af', base + ':LRA=11:print_format=json', '-f', 'null', '-']))
    lra = min(50, max(11, float(m1['input_lra']) + 1))
    f2 = (f'{base}:LRA={lra}:measured_I={m1["input_i"]}:measured_TP={m1["input_tp"]}:measured_LRA={m1["input_lra"]}'
          f':measured_thresh={m1["input_thresh"]}:offset={m1["target_offset"]}:linear=true:print_format=json')
    m2 = last_json(run([FFMPEG, '-hide_banner', '-nostats', '-y', '-i', tmp, '-af', f2, '-ar', str(SR), '-c:a', 'pcm_s24le', a.out]))
    I, TP, LRA = measure(a.out)
    trim = min(a.target - I, a.tp - 0.1 - TP)                 # loudnorm lands within ~0.3 LU; nudge onto target
    if abs(trim) > 0.05:
        x, _ = sf.read(a.out); sf.write(a.out, x * db(trim), SR, subtype='PCM_24')
        I, TP, LRA = measure(a.out)
    report.update(loudnorm_mode=m2.get('normalization_type'), out_I_lufs=I, out_TP_dbtp=TP, out_LRA=LRA,
                  duration_s=round(n / SR, 3), out=os.path.abspath(a.out))
    if not a.keep_temp:
        os.remove(tmp); os.rmdir(tmpd)
    print(json.dumps(report, indent=1))


if __name__ == '__main__':
    main()
