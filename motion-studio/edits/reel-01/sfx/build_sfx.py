#!/usr/bin/env python3
"""Synthesize the SFX library + 2 loopable beds.  Run:  python3 build_sfx.py
All outputs: 48 kHz, stereo, 24-bit WAV, true-peak <= -3 dBFS, click-free edges.
Deterministic (fixed seeds) so re-running reproduces the same files."""
import os, glob, json, subprocess
import numpy as np
import soundfile as sf
from scipy import signal as ss
from scipy.signal import fftconvolve, butter, sosfilt, resample_poly

SR = 48000
OUT = os.path.dirname(os.path.abspath(__file__))
FFMPEG = "/usr/local/bin/ffmpeg"
META = {}


# ----------------------------------------------------------------- helpers
def N(d): return int(round(d * SR))
def tt(d): return np.arange(N(d)) / SR
def rng(seed): return np.random.default_rng(seed)


def pink(n, r):
    X = np.fft.rfft(r.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); f[0] = f[1]
    x = np.fft.irfft(X / np.sqrt(f), n); return x / (np.std(x) + 1e-12)


def _f(x, sos): return sosfilt(sos, x, axis=0)
def lp(x, fc, o=4): return _f(x, butter(o, min(fc, SR * 0.45), 'lowpass', fs=SR, output='sos'))
def hp(x, fc, o=4): return _f(x, butter(o, fc, 'highpass', fs=SR, output='sos'))
def bp(x, lo, hi, o=2): return _f(x, butter(o, [lo, min(hi, SR * 0.45)], 'bandpass', fs=SR, output='sos'))


def pan(x, p):
    th = (np.asarray(p, float) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], axis=1)


def st(x): return pan(x, 0.0) if x.ndim == 1 else x


def osc(freq, n=None, phase0=0.0):
    f = np.full(n, float(freq)) if np.ndim(freq) == 0 else np.asarray(freq, float)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase0)


def additive(freq, n=None, fc=None, kind='saw', maxk=200, phase0=0.0):
    """Band-limited saw/triangle/square with optional (time-varying) 2-pole-ish lowpass on harmonics."""
    f = np.full(n, float(freq)) if np.ndim(freq) == 0 else np.asarray(freq, float)
    ph = 2 * np.pi * np.cumsum(f) / SR + phase0
    K = int(min(maxk, 20000 / max(f.max(), 1)))
    y = np.zeros(len(f))
    for k in range(1, K + 1):
        if kind == 'saw': w = 1.0 / k
        elif kind == 'tri': w = (1.0 / k ** 2) if k % 2 else 0.0
        else: w = (1.0 / k) if k % 2 else 0.0          # square
        if w == 0: continue
        w = w * ((k * f) < 20000)
        if fc is not None: w = w / np.sqrt(1 + (k * f / fc) ** 4)
        y += w * np.sin(k * ph)
    return y


def tv_band(x, fc, sigma, nper=1024):
    """Time-varying band-pass (Gaussian in log-frequency) via STFT masking. fc/sigma: scalars or per-sample arrays."""
    n = len(x); ts = np.arange(n) / SR
    f, t, Z = ss.stft(x, SR, nperseg=nper, noverlap=nper - nper // 4)
    fcs = np.interp(t, ts, np.broadcast_to(fc, (n,)))
    sg = np.interp(t, ts, np.broadcast_to(sigma, (n,)))
    lf = np.log2(np.maximum(f, 1.0))[:, None]
    M = np.exp(-0.5 * ((lf - np.log2(fcs)[None, :]) / sg[None, :]) ** 2)
    _, y = ss.istft(Z * M, SR, nperseg=nper, noverlap=nper - nper // 4)
    y = y[:n]
    return np.pad(y, (0, n - len(y)))


def make_ir(rt60=1.2, predelay=0.012, bright=0.5, seed=1, dur=None):
    r = rng(seed); dur = dur or rt60 * 1.15
    n = N(dur); t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    e = lambda rt: 10 ** (-3 * t / rt)
    for c in range(2):
        w = r.standard_normal(n)
        ir[:, c] = (lp(w, 350, 2) * e(rt60 * 1.15) + bp(w, 350, 4000) * e(rt60)
                    + hp(w, 4000, 2) * e(rt60 * (0.3 + 0.4 * bright)) * (0.35 + 0.65 * bright))
    ir *= (1 - np.exp(-t / 0.015))[:, None]
    for _ in range(10):                                   # early reflections
        d = N(r.uniform(0.002, 0.035)); ir[d, r.integers(2)] += r.uniform(-1, 1) * 0.08 * np.sqrt(n / SR)
    ir = np.vstack([np.zeros((N(predelay), 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, mix, ir, wet_hp=150, wet_lp=9000):
    x = st(x)
    wet = np.stack([fftconvolve(x[:, 0], ir[:, 0]), fftconvolve(x[:, 1], ir[:, 1])], 1)
    wet = hp(lp(wet, wet_lp, 2), wet_hp, 2)
    out = mix * wet; out[:len(x)] += x
    return out


def true_peak(x):
    return np.max(np.abs(resample_poly(x, 4, 1, axis=0))) + 1e-12


def lufs(x):
    """ITU-R BS.1770-4 integrated loudness (48 kHz K-weighting)."""
    x = x[:, None] if x.ndim == 1 else x
    y = ss.lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285],
                   [1, -1.69065929318241, 0.73248077421585], x, axis=0)
    y = ss.lfilter([1, -2, 1], [1, -1.99004745483398, 0.99007225036621], y, axis=0)
    c = np.concatenate([[0], np.cumsum((y ** 2).sum(1))])
    blk, hop = N(0.4), N(0.1)
    s = np.arange(0, len(y) - blk + 1, hop)
    z = (c[s + blk] - c[s]) / blk
    L = -0.691 + 10 * np.log10(z + 1e-20)
    z = z[L > -70]
    if not len(z): return -np.inf
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]
    return -0.691 + 10 * np.log10(z.mean())


def fade(x, fin, fout):
    x = x.copy(); a, b = max(1, N(fin)), max(1, min(N(fout), len(x) // 3))
    x[:a] *= (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a)))[:, None]
    x[-b:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b)))[:, None]
    return x


def finalize(name, x, desc, use, peak_db=-3.0, fin=0.0015, fout=0.03, trim_db=-62, hpf=20, sub=''):
    x = st(np.asarray(x, float))
    x = hp(x - x.mean(0), hpf, 2)
    a = np.max(np.abs(x), 1); idx = np.where(a > a.max() * 10 ** (trim_db / 20))[0]
    x = x[max(0, idx[0] - N(0.001)): min(len(x), idx[-1] + N(0.004))]
    x = fade(x, fin, fout)
    x *= 10 ** (peak_db / 20) / true_peak(x)
    d = os.path.join(OUT, sub); os.makedirs(d, exist_ok=True)
    sf.write(os.path.join(d, name + '.wav'), x, SR, subtype='PCM_24')
    META[os.path.join(sub, name + '.wav')] = dict(dur=len(x) / SR, desc=desc, use=use)
    return x


# ----------------------------------------------------------------- whooshes
def whoosh(dur, f0, fpk, f1, apk, p0, p1, seed, flutter=0.0, body=0.35, whistle=0.35, rt=0.6, wet=0.18):
    r = rng(seed); n = N(dur); t = tt(dur); u = t / dur
    env = np.where(u < apk, (u / apk) ** 2.0, ((1 - u) / (1 - apk)) ** 1.5)
    env = np.convolve(env, np.hanning(N(0.02)) / np.hanning(N(0.02)).sum(), 'same')
    fc = 2 ** np.interp(u, [0, apk, 1], np.log2([f0, fpk, f1]))
    fc = np.convolve(np.pad(fc, N(0.03), 'edge'), np.ones(N(0.03)) / N(0.03), 'same')[N(0.03):-N(0.03)]
    main = tv_band(pink(n, r), fc, 0.55) + whistle * tv_band(pink(n, r), fc * 1.2, 0.09)
    main = main / (np.std(main) + 1e-9) * env
    if flutter:
        rate = 18 + 30 * env
        main *= 1 - flutter * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(rate) / SR))
    low = lp(pink(n, r), 220) * env ** 1.6
    low = low / (np.std(low) + 1e-9) * body
    s = 0.5 + 0.5 * np.tanh((u - apk) * 7)
    p = p0 + (p1 - p0) * (s - s[0]) / (s[-1] - s[0])
    wide = np.stack([tv_band(pink(n, r), fc, 0.6), tv_band(pink(n, r), fc, 0.6)], 1)
    wide = wide / np.std(wide) * env[:, None] * 0.25
    x = pan(main, p) + wide + st(low)
    return reverb(x, wet, make_ir(rt, 0.008, 0.6, seed + 1))


def swoosh_down(seed=31):
    r = rng(seed); dur = 0.6; n = N(dur); t = tt(dur); u = t / dur
    env = np.minimum(1, t / 0.035) * np.exp(-np.maximum(t - 0.035, 0) / 0.16)
    fc = 2 ** np.interp(u, [0, 0.15, 1], np.log2([7000, 4200, 220]))
    x = tv_band(pink(n, r), fc, 0.5) + 0.4 * tv_band(pink(n, r), fc, 0.1)
    x = x / np.std(x) * env
    tone = osc(2 ** np.interp(u, [0, 1], np.log2([900, 110]))) * env ** 1.3 * 0.25
    p = np.interp(u, [0, 1], [0.35, -0.25])
    y = pan(x + tone, p) + pan(lp(pink(n, r), 250) / 3 * env ** 1.5, 0)
    return reverb(y, 0.2, make_ir(0.7, 0.01, 0.5, seed))


def riser(dur, seed):
    r = rng(seed); n = N(dur); t = tt(dur); u = t / dur
    g_n = u ** 2.4; g_t = u ** 1.7
    fc = 2 ** np.interp(u ** 1.3, [0, 1], np.log2([250, 9500]))
    noise = tv_band(pink(n, r), fc, 0.55 + 0.5 * u) + 0.3 * tv_band(pink(n, r), fc * 0.7, 0.08)
    noise = noise / np.std(noise) * g_n
    f = 2 ** np.interp(u ** 1.2, [0, 1], np.log2([110, 440]))      # 2-octave climb
    cut = 400 + 6000 * u ** 2
    tones = np.zeros((n, 2))
    for ch, det in ((0, [-0.012, 0.004]), (1, [-0.004, 0.012])):
        for d in det:
            tones[:, ch] += additive(f * 2 ** d, fc=cut, phase0=r.uniform(0, 6.28))
        tones[:, ch] += 0.5 * additive(f * 0.5, fc=cut * 0.5, kind='tri')
    rate = 3 + 17 * u ** 1.5                                       # accelerating pulse
    trem = 0.65 + 0.35 * np.sin(2 * np.pi * np.cumsum(rate) / SR)
    tones = tones / np.std(tones) * (g_t * trem)[:, None] * 0.55
    sub = osc(f * 0.25) * g_t * 0.3
    x = tones + st(noise) * 1.1 + st(sub)
    x = reverb(x, 0.25, make_ir(1.4, 0.02, 0.7, seed))[:n]         # ends exactly at the peak
    return x


# ----------------------------------------------------------------- impacts / sub
def impact(seed, boom=False):
    r = rng(seed); dur = 3.2 if boom else 2.4; n = N(dur); t = tt(dur)
    if boom:
        f = 36 + 150 * np.exp(-t / 0.07); a_sub = np.exp(-t / 0.75)
    else:
        f = 44 + 110 * np.exp(-t / 0.035); a_sub = np.exp(-t / 0.45)
    sub = np.tanh(1.8 * osc(f) * np.minimum(1, t / 0.0015) * a_sub) / np.tanh(1.8)
    click = hp(r.standard_normal(n), 2500) * np.exp(-t / 0.0012) * 0.9
    snap = osc(1900 * np.exp(-t / 0.01) + 900) * np.exp(-t / 0.006) * 0.35
    body = bp(r.standard_normal(n), 90, 900) * np.exp(-t / (0.12 if boom else 0.08)) * 1.3
    crunch = np.tanh(3 * bp(r.standard_normal(n), 900, 4500) * np.exp(-t / 0.03)) * 0.35
    x = st(sub * 1.0) + pan(click + snap, 0) + np.stack([body, bp(r.standard_normal(n), 90, 900) * np.exp(-t / 0.1) * 1.3], 1) * 0.6 + st(crunch)
    if boom:   # dark metallic cinematic layer
        met = sum(a * osc(110 * k, n) * np.exp(-t / (0.9 / k ** 0.6)) for k, a in
                  ((1, .5), (1.47, .35), (2.09, .3), (2.56, .22), (3.24, .15), (4.1, .1)))
        x += pan(lp(met, 3000) * 0.35, 0)
    ir = make_ir(3.0 if boom else 2.0, 0.015, 0.35, seed)
    y = reverb(x, 0.42 if boom else 0.32, ir, wet_hp=80, wet_lp=5000)
    return y


def sub_drop(seed=51):
    dur = 1.35; t = tt(dur)
    f = 34 + 96 * np.exp(-t / 0.33)
    a = np.minimum(1, t / 0.004) * np.exp(-t / 1.0)
    x = np.tanh(2.2 * osc(f) * a) / np.tanh(2.2)
    x += 0.12 * osc(2 * f) * a                                          # upper harmonic = audible on phones
    x += hp(rng(seed).standard_normal(len(t)), 3000) * np.exp(-t / 0.001) * 0.25
    return st(x)


# ----------------------------------------------------------------- UI
def click_ui(seed, variant):
    r = rng(seed); t = tt(0.09); n = len(t)
    if variant == 'a':
        x = (hp(r.standard_normal(n), 3500) * np.exp(-t / 0.0007) * 0.8
             + osc(4300, n) * np.exp(-t / 0.005) * 0.5 + osc(2150, n) * np.exp(-t / 0.009) * 0.25)
    else:
        x = (bp(r.standard_normal(n), 2000, 7000) * np.exp(-t / 0.0012) * 0.6
             + osc(1500 * (1 + 0.25 * np.exp(-t / 0.004))) * np.exp(-t / 0.012) * 0.6
             + osc(640, n) * np.exp(-t / 0.02) * 0.35)
    return reverb(pan(x, 0), 0.07, make_ir(0.25, 0.004, 0.7, seed))


def pop(seed, variant):
    r = rng(seed); t = tt(0.22); n = len(t)
    if variant == 'a':
        f = 330 * (1100 / 330) ** np.minimum(t / 0.06, 1)
        a = np.minimum(1, t / 0.002) * np.exp(-t / 0.035)
        x = osc(f) * a + 0.15 * osc(2 * f) * a
    else:
        f = 520 * (1650 / 520) ** np.minimum(t / 0.04, 1)
        a = np.minimum(1, t / 0.0015) * np.exp(-t / 0.028)
        x = osc(f) * a + 0.2 * osc(2 * f) * a + 0.4 * osc(180 * np.exp(-t / 0.02) + 90) * np.exp(-t / 0.018)
    x += lp(r.standard_normal(n), 3000) * np.exp(-t / 0.0015) * 0.15
    return reverb(pan(x, 0), 0.1, make_ir(0.35, 0.005, 0.6, seed))


def typing_burst(seed=71):
    r = rng(seed); dur = 0.75; n = N(dur); out = np.zeros((n, 2))
    k = 0.01
    while k < 0.53:
        vel = r.uniform(0.55, 1.0); L = N(0.08); t = np.arange(L) / SR
        s = (bp(r.standard_normal(L), 1500, 6500) * np.exp(-t / 0.0025) * 0.9
             + osc(r.uniform(210, 290), L) * np.exp(-t / 0.022) * 0.5
             + osc(r.uniform(620, 780), L) * np.exp(-t / 0.011) * 0.3
             + osc(r.uniform(1600, 2100), L) * np.exp(-t / 0.005) * 0.2)
        rel = N(r.uniform(0.035, 0.05))
        s[rel:] += (bp(r.standard_normal(L - rel), 2500, 8000) * np.exp(-t[:L - rel] / 0.0015) * 0.35)
        i = N(k); out[i:i + L] += pan(s * vel, r.uniform(-0.3, 0.3))[:n - i]
        k += r.uniform(0.05, 0.1)
    return reverb(out, 0.12, make_ir(0.3, 0.004, 0.5, seed))


def glitch(seed, style):
    r = rng(seed)
    dur = 0.45 if style == 'a' else 0.36
    n = N(dur); t = tt(dur)
    src = (0.5 * additive(110 * r.choice([1, 1.5, 2]), n, fc=3500)
           + 0.35 * np.sin(2 * np.pi * 880 * t + 3 * np.sin(2 * np.pi * 1320 * t))
           + 0.3 * bp(r.standard_normal(n), 1500, 7000))
    out = np.zeros((n, 2)); pos = 0; mf = N(0.0005)
    ramp = lambda L: np.minimum(1, np.minimum(np.arange(L), np.arange(L)[::-1]) / mf)
    if style == 'a':
        while pos < n:
            L = min(N(r.uniform(0.012, 0.05)), n - pos)
            seg = src[pos:pos + L].copy()
            act = r.choice(['clean', 'stutter', 'crush', 'hold', 'gap', 'pitch'], p=[.15, .3, .2, .15, .1, .1])
            if act == 'stutter':
                g = seg[:max(8, L // r.integers(2, 5))]; seg = np.tile(g, L // len(g) + 1)[:L]
            elif act == 'crush':
                q = 2 ** (r.integers(3, 6) - 1); seg = np.round(seg * q) / q
            elif act == 'hold':
                h = r.integers(6, 24); seg = np.repeat(seg[::h], h)[:L]; seg = np.pad(seg, (0, L - len(seg)))
            elif act == 'gap' and 0 < pos < n - N(0.06):
                seg *= 0
            elif act == 'pitch':
                rate = r.choice([0.5, 2.0]); idx = pos + np.arange(L) * rate
                seg = np.interp(idx, np.arange(n), src, period=n)
            out[pos:pos + L] += pan(seg * ramp(L), r.uniform(-0.8, 0.8))
            pos += L
    else:   # stutter roll: buffer repeat that tightens + pitches up, then crushed tail
        g = src[N(0.05):N(0.05) + N(0.05)]
        lens = np.geomspace(0.05, 0.008, 12)
        for i, gl in enumerate(lens):
            L = N(gl); if_end = pos + L
            if if_end > n: break
            seg = np.interp(np.arange(L) * (0.05 / gl) ** 0.35, np.arange(len(g)), g)
            q = 2 ** (7 - i // 3)
            seg = np.round(seg * q) / q
            out[pos:pos + L] += pan(seg * ramp(L), 0.6 * (-1) ** i)
            pos += L
        rest = n - pos
        if rest > 0:
            tail = np.repeat(src[:rest][::10], 10)[:rest]
            tail = np.pad(tail, (0, rest - len(tail))) * np.exp(-np.arange(rest) / N(0.05))
            out[pos:] += pan(np.round(tail * 8) / 8 * ramp(rest), 0)
    out = hp(lp(out, 13000), 130)
    return out


# ----------------------------------------------------------------- tonal
def bell(freq, dur, tau=1.2, r=None):
    t = tt(dur); x = np.zeros(len(t))
    for ratio, a in ((1, 1.0), (2.0, 0.22), (2.76, 0.35), (5.40, 0.14), (8.93, 0.05)):
        if ratio * freq > 20000: continue
        x += a * osc(freq * ratio, len(t), r.uniform(0, 6.28)) * np.exp(-t / (tau / ratio ** 0.7))
    x *= np.minimum(1, t / 0.0008)
    x += hp(r.standard_normal(len(t)), 5000) * np.exp(-t / 0.001) * 0.15
    return x


def ding_success(seed=91):
    r = rng(seed); dur = 2.6; n = N(dur); out = np.zeros((n, 2))
    for t0, f, p, a in ((0.0, 1046.5, -0.25, 0.8), (0.085, 1568.0, 0.25, 1.0), (0.085, 2093.0, 0.1, 0.25)):
        b = bell(f, dur - t0, 1.3, r); i = N(t0)
        out[i:] += pan(b * a, p)
    t = tt(dur); out += st(osc(523.25, n) * np.exp(-t / 0.6) * np.minimum(1, t / 0.01) * 0.12)
    return reverb(out, 0.3, make_ir(1.8, 0.02, 0.8, seed))


def shimmer(seed=101):
    r = rng(seed); dur = 2.0; n = N(dur); out = np.zeros((n, 2)); t = tt(dur)
    pent = [2093.0, 2349.3, 2637.0, 3136.0, 3520.0, 4186.0, 4698.6, 5274.0, 6272.0, 7040.0]
    for _ in range(85):
        t0 = r.beta(2.2, 3.5) * 1.3; L = N(0.25); tg = np.arange(L) / SR
        f = r.choice(pent) * r.choice([1, 1, 1.0029])
        g = (osc(f, L, r.uniform(0, 6)) + 0.2 * osc(2 * f, L)) * np.minimum(1, tg / 0.002) * np.exp(-tg / r.uniform(0.03, 0.13))
        i = N(t0); out[i:i + L] += pan(g * r.uniform(0.2, 0.7), r.uniform(-0.9, 0.9))[:n - i]
    sw = np.exp(-0.5 * ((t - 0.55) / 0.3) ** 2)
    air = tv_band(pink(n, r), 2 ** np.interp(t, [0, 0.6, 2], np.log2([5000, 10000, 7000])), 0.5)
    out += np.stack([air, np.roll(air, 211)], 1) / np.std(air) * sw[:, None] * 0.12
    pad = sum(osc(f, n) for f in (1046.5, 1318.5, 1568.0)) * np.minimum(1, t / 0.25) * np.exp(-t / 0.7) * 0.07
    out += st(pad)
    return reverb(out, 0.45, make_ir(2.5, 0.03, 0.9, seed), wet_hp=600, wet_lp=12000)


def camera_shutter(seed=111):
    r = rng(seed); dur = 0.4; n = N(dur); out = np.zeros(n)

    def clk(amp, fm, sd):
        L = N(0.06); t = np.arange(L) / SR; rr = rng(sd)
        return amp * (bp(rr.standard_normal(L), 1800, 9000) * np.exp(-t / 0.0022)
                      + 0.45 * osc(fm, L) * np.exp(-t / 0.007)
                      + 0.5 * osc(170 * np.exp(-t / 0.01) + 110) * np.exp(-t / 0.014))
    for t0, a, fm in ((0.008, 1.0, 3400), (0.092, 0.8, 2900)):
        i = N(t0); c = clk(a, fm, seed + i); out[i:i + len(c)] += c
    L = N(0.07); i = N(0.02); tg = np.arange(L) / SR
    out[i:i + L] += bp(r.standard_normal(L), 900, 3200) * np.sin(np.pi * tg / tg[-1]) * 0.12   # mechanism whirr
    return reverb(pan(out, 0), 0.14, make_ir(0.3, 0.004, 0.6, seed))


def tape_stop(src):
    """Decelerating playback (turntable/tape brake) of a musical source."""
    pre, stop = 0.12, 0.95
    t = tt(pre + stop)
    rate = np.where(t < pre, 1.0, (1 - np.clip((t - pre) / stop, 0, 1)) ** 1.6)
    pos = np.cumsum(rate)
    y = np.stack([np.interp(pos, np.arange(len(src)), src[:, c]) for c in range(2)], 1)
    y *= (0.35 + 0.65 * rate ** 0.3)[:, None]
    return lp(y, 9000)


def data_blips(seed=121):
    r = rng(seed); dur = 0.95; n = N(dur); out = np.zeros((n, 2))
    notes = [1318.5, 1568.0, 1760.0, 1975.5, 2349.3, 2637.0]
    k, i = 0.0, 0
    while k < 0.78:
        L = N(r.choice([0.018, 0.03, 0.045])); tg = np.arange(L) / SR
        f = r.choice(notes)
        b = (osc(f, L) + 0.18 * osc(3 * f, L) + 0.06 * osc(5 * f, L)) * np.minimum(1, tg / 0.001) * np.minimum(1, (tg[-1] - tg) / 0.004)
        s = N(k); out[s:s + L] += pan(b * r.uniform(0.6, 1.0), 0.45 * (-1) ** i)[:n - s]
        k += L / SR + r.choice([0.012, 0.025, 0.045]); i += 1
    ir = np.zeros((N(0.5), 2))
    for j in range(1, 5): ir[N(0.09 * j), j % 2] = 0.3 ** j   # ping-pong echo
    ir[0] = 1
    y = np.stack([fftconvolve(out[:, 0] + out[:, 1] * 0, ir[:, 0]), fftconvolve(out[:, 1], ir[:, 1])], 1)
    y[:, 0] += fftconvolve(out[:, 1], ir[:, 0])[:len(y)] * 0.5
    return lp(y, 11000)


# ----------------------------------------------------------------- beds (circular = perfectly loopable)
BED = 40.0
NB = N(BED)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)


def place(buf, sig, start):
    s = int(start) % len(buf); i = 0
    while i < len(sig):
        k = min(len(sig) - i, len(buf) - s); buf[s:s + k] += sig[i:i + k]; i += k; s = 0


def circ_conv(x, ir):
    n = len(x)
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c]) * np.fft.rfft(ir[:, c], n), n) for c in range(2)], 1)


def fft_gain(x, fn):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * fn(f)[:, None], len(x), axis=0)


def circ_noise(r, fn):
    x = np.stack([r.standard_normal(NB), r.standard_normal(NB)], 1)
    x = fft_gain(x, fn); return x / np.std(x)


def peq(f, f0, db, oct_w):  # smooth bell in log-f, linear gain
    return 10 ** (db / 20 * np.exp(-0.5 * (np.log2(np.maximum(f, 1) / f0) / oct_w) ** 2))


def set_lufs(x, target): return x * 10 ** ((target - lufs(x)) / 20)


def bed_tech(seed=201):
    r = rng(seed); bpm = 120; beat = 60 / bpm; s16 = beat / 4
    chords = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 67], [52, 55, 59, 60, 64], [55, 59, 62, 64, 69]]
    roots = [33, 29, 36, 31]
    bar = 4 * beat; nbars = int(BED / bar)                   # 20 bars
    kick, arp, pad, bass, hat = (np.zeros((NB, 2)) for _ in range(5))
    tB = np.arange(NB) / SR
    # kick on beats 1 & 3
    tk = tt(0.45)
    k = np.sin(2 * np.pi * np.cumsum(48 + 95 * np.exp(-tk / 0.028)) / SR) * np.exp(-tk / 0.2) * np.minimum(1, tk / 0.001)
    k = lp(k + 0.05 * hp(r.standard_normal(len(tk)), 2000) * np.exp(-tk / 0.002), 1800)
    for b in range(nbars):
        for bt in (0, 2): place(kick, st(k), N(b * bar + bt * beat))
    # offbeat shaker + ghost 16ths
    th = tt(0.08)
    for i in range(int(BED / s16)):
        if i % 2 == 0: continue
        amp = 1.0 if i % 4 == 2 else 0.35
        h = lp(hp(r.standard_normal(len(th)), 6500), 12000) * np.exp(-th / (0.03 if amp == 1 else 0.012)) * amp
        place(hat, pan(h, 0.25), N(i * s16))
    # arp: 16ths, pluck = 2 detuned saws with decaying filter; brightness LFO period 20 s
    pat = [0, 2, 4, 2, 1, 3, -1, 3, 0, 2, 4, 2, 1, 3, 4, 1]
    tp_ = tt(0.32)
    for i in range(int(BED / s16)):
        ci = (i // 32) % 4; note = pat[i % 16]
        if note < 0: continue
        m = chords[ci][note] + 12
        t0 = i * s16
        bright = 0.75 + 0.45 * np.sin(2 * np.pi * t0 / 20)
        fc = (500 + 2600 * bright * np.exp(-tp_ / 0.045))
        f = mtof(m)
        v = (additive(f * 2 ** (6 / 1200), len(tp_), fc=fc, maxk=40) + additive(f * 2 ** (-6 / 1200), len(tp_), fc=fc, maxk=40))
        v *= np.minimum(1, tp_ / 0.003) * np.exp(-tp_ / 0.11) * (1.0 if i % 4 == 0 else 0.7)
        v = fade(st(v), 0.001, 0.03)[:, 0] * np.sqrt(2)
        place(arp, pan(v, 0.15 * (-1) ** i), N(t0))
    irD = np.zeros((N(3.2), 2)); irD[0] = [1, 1]
    for j in range(1, 8): irD[N(0.375 * j), j % 2] += 0.38 ** j
    arp_wet = circ_conv(arp, irD) - arp
    arp = arp + fft_gain(arp_wet, lambda f: (f > 300) / np.sqrt(1 + (f / 3000) ** 4)) * 0.8
    # pad: chords every 2 bars, slow attack, crossfaded, L/R detune
    seg = 2 * bar
    for c in range(int(BED / seg)):
        ch = chords[c % 4]; L = N(seg + 1.6); tpd = np.arange(L) / SR
        env = np.minimum(1, tpd / 1.2) * np.clip((seg + 1.6 - tpd) / 1.6, 0, 1)
        v = np.zeros((L, 2))
        for m in ch:
            for cc, dets in ((0, (-9, 4)), (1, (-4, 9))):
                for d in dets:
                    v[:, cc] += additive(mtof(m) * 2 ** (d / 1200), L, fc=1300, maxk=24, phase0=r.uniform(0, 6.28))
        place(pad, v * env[:, None], N(c * seg))
        rt = mtof(roots[c % 4]); b = np.tanh(1.5 * osc(rt, L)) * env
        place(bass, st(b), N(c * seg))
    air = circ_noise(r, lambda f: np.exp(-0.5 * (np.log2(np.maximum(f, 1) / 6500) / 0.4) ** 2))
    air *= (0.7 + 0.3 * np.sin(2 * np.pi * tB / 8))[:, None]
    ir = make_ir(2.4, 0.03, 0.6, seed); ir = ir[:N(3.5)]
    pad = pad + circ_conv(pad, ir) * 0.5
    arp = arp + circ_conv(arp, ir) * 0.25
    stems = dict(kick=(kick, -24), arp=(arp, -23), pad=(pad, -24.5), bass=(bass, -29), hat=(hat, -36), air=(air, -41))
    mix = sum(set_lufs(x, l) for x, l in stems.values())
    raw = mix.copy()
    mix = fft_gain(mix, lambda f: (1 / np.sqrt(1 + (28 / np.maximum(f, 1)) ** 8)) * peq(f, 2600, -3.5, 0.8) / np.sqrt(1 + (f / 14000) ** 6))  # HP + voice-pocket dip
    return mix, raw


def bed_cinematic(seed=301):
    r = rng(seed); tB = np.arange(NB) / SR
    q = lambda f: round(f * BED) / BED                     # integer cycles in 40 s -> seamless loop
    drone, pad, tex, heart, grains = (np.zeros((NB, 2)) for _ in range(5))
    for base, amp in ((36.71, 1.0), (73.42, 0.7), (110.0, 0.35)):
        for c, d in ((0, 0.0), (1, 0.1)):
            f = q(base + d)
            fc = 180 + 160 * (0.5 + 0.5 * np.sin(2 * np.pi * tB / 20 + c))
            drone[:, c] += amp * (additive(f, NB, fc=fc, maxk=14, phase0=r.uniform(0, 6)) + 0.8 * osc(f, NB, r.uniform(0, 6)))
    notes = [146.83, 174.61, 220.0, 261.63, 329.63]           # Dm7(add9) colour
    for i, f0 in enumerate(notes):
        lfo = 0.55 + 0.45 * np.sin(2 * np.pi * tB / (BED / (i % 4 + 1)) + r.uniform(0, 6.28))
        fc = 500 + 700 * (0.5 + 0.5 * np.sin(2 * np.pi * tB / 40 + i))
        for c in range(2):
            f = q(f0 + (0.05 if c else -0.05) * (i + 1))
            pad[:, c] += additive(f, NB, fc=fc, kind='saw', maxk=20, phase0=r.uniform(0, 6)) * lfo
    for (lo, hi, per, ph) in ((200, 600, 40, 0), (800, 2000, 20, 2), (3000, 8000, 40 / 3, 4)):
        band = circ_noise(r, lambda f, lo=lo, hi=hi: ((f > lo) & (f < hi)).astype(float))
        tex += band * (0.5 + 0.5 * np.sin(2 * np.pi * tB / per + ph))[:, None] ** 2
    period = 60 / 72
    th = tt(0.5)
    def thump(fb, a):
        x = np.tanh(2 * osc(fb + 35 * np.exp(-th / 0.025)) * np.minimum(1, th / 0.006) * np.exp(-th / 0.075)) * a
        return x + lp(r.standard_normal(len(th)), 180) * np.exp(-th / 0.04) * a * 0.3
    for b in range(int(round(BED / period))):
        sw = 0.8 + 0.2 * np.sin(2 * np.pi * b * period / 40)
        place(heart, st(thump(50, sw)), N(b * period))
        place(heart, st(thump(56, sw * 0.62)), N(b * period + 0.22))
    for _ in range(60):
        t0 = r.uniform(0, BED); L = N(1.2); tg = np.arange(L) / SR
        f = r.choice([587.3, 698.5, 880.0, 1174.7, 1396.9, 1760.0])
        g = osc(f, L) * np.minimum(1, tg / 0.15) * np.exp(-tg / 0.35)
        place(grains, pan(g * r.uniform(0.3, 1), r.uniform(-0.8, 0.8)), N(t0))
    ir = make_ir(4.5, 0.05, 0.3, seed)[:N(6)]
    pad = pad + circ_conv(pad, ir) * 0.8
    grains = circ_conv(grains, ir) * 1.0 + grains * 0.2
    tex = tex + circ_conv(tex, ir) * 0.5
    heart = heart + circ_conv(heart, make_ir(1.5, 0.02, 0.2, seed + 1)) * 0.25
    stems = dict(drone=(drone, -23), pad=(pad, -22), tex=(tex, -30), heart=(heart, -24), grains=(grains, -31))
    mix = sum(set_lufs(x, l) for x, l in stems.values())
    return fft_gain(mix, lambda f: (1 / np.sqrt(1 + (25 / np.maximum(f, 1)) ** 8)) * peq(f, 2600, -3.0, 0.8))


def write_bed(name, x, desc, use, target=-18.0):
    x = set_lufs(x, target)
    tp = 20 * np.log10(true_peak(x))
    if tp > -3.0:
        x *= 10 ** ((-3.0 - tp) / 20)
    x = fade(x, 0.005, 0.005)             # 5 ms edge fades: click-free, loop dip is inaudible
    sf.write(os.path.join(OUT, name + '.wav'), x, SR, subtype='PCM_24')
    META[name + '.wav'] = dict(dur=len(x) / SR, desc=desc + f' Integrated {lufs(x):.1f} LUFS.', use=use)


# ----------------------------------------------------------------- CC0 imports (uisfx, CC0-1.0)
CC0 = [('cinematic/success', 'success_cinematic'), ('cinematic/level-up', 'level_up_cinematic'),
       ('cinematic/swipe', 'swipe_cinematic'), ('scifi/scanning', 'scanning_scifi'),
       ('scifi/processing', 'processing_scifi'), ('glass/notification', 'notification_glass'),
       ('dreamy/achievement', 'achievement_dreamy'), ('minimal/toggle-on', 'toggle_on_minimal'),
       ('mechanical/typing', 'typing_key_mechanical'), ('soft/select', 'select_soft')]


def import_cc0(pkg):
    for src, name in CC0:
        p = os.path.join(pkg, 'sounds', src + '.mp3')
        if not os.path.exists(p): continue
        raw = subprocess.run([FFMPEG, '-v', 'error', '-i', p, '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'],
                             capture_output=True, check=True).stdout
        x = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(float)
        finalize('cc0_' + name, x, f'CC0 import from npm `uisfx` 0.4.0 ({src}).', 'Alternative UI/notification layer.',
                 sub='cc0_uisfx', fout=0.02)


# ----------------------------------------------------------------- main
if __name__ == '__main__':
    F = finalize
    F('whoosh_short_a', whoosh(0.42, 350, 2800, 700, 0.58, -0.8, 0.8, 1),
      'Pink-noise band-pass sweep 350->2.8k->700 Hz, L->R pan crossing at peak, airy whistle.',
      'Text/element slide-ins, quick transitions. Place peak (~0.24 s in) on the cut.', trim_db=-42, fout=0.12)
    F('whoosh_short_b', whoosh(0.38, 600, 5000, 1500, 0.5, 0.7, -0.7, 2, flutter=0.35, whistle=0.2),
      'Brighter, faster whoosh with blade-like flutter, R->L pan.', 'Snappy transitions, card flips, zoom punches.', trim_db=-42, fout=0.12)
    F('whoosh_long', whoosh(0.9, 200, 2200, 400, 0.62, -0.9, 0.9, 3, body=0.6, whistle=0.45, rt=0.9, wet=0.22),
      'Long doppler-style pass-by with low body, wide pan.', 'Scene changes, big camera moves, title reveals.', trim_db=-48, fout=0.2)
    F('swoosh_down', swoosh_down(), 'High->low falling sweep with pitched tail.', 'Exits, elements dropping/leaving frame.', fout=0.12, trim_db=-45)
    F('riser_2s', riser(2.0, 41), 'Noise + 2-octave rising saw stack with accelerating pulse; hard stop at peak.',
      'Short build into a reveal; end of file = hit point.', fout=0.012)
    F('riser_4s', riser(4.0, 42), 'Longer tension build, same design, wider.', 'Intro build / pre-drop before a big statement.', fout=0.012)
    F('impact_hit_a', impact(61), 'Tight sub thump + transient click + snap, 2 s hall tail.', 'Word/number slams, logo hits.', fout=0.3)
    F('impact_hit_b', impact(62, boom=True), 'Cinematic BOOM: longer sub, dark metallic layer, 3 s tail.', 'Big reveals, hook moment, final CTA.', fout=0.4)
    F('sub_drop', sub_drop(), '808-style sub glide 130->34 Hz, 1.3 s, saturated for phone speakers.', 'Under an impact or after a riser; tension release.', fout=0.15)
    F('click_ui_a', click_ui(81, 'a'), 'Tiny crisp high tick.', 'Cursor clicks, toggles, small caption pops.', fout=0.02)
    F('click_ui_b', click_ui(82, 'b'), 'Softer woody "tock" click.', 'Button presses, selections, list items.', fout=0.02)
    F('pop_a', pop(83, 'a'), 'Round bubble pop (rising pitch).', 'Icons/emoji appearing.', fout=0.03)
    F('pop_b', pop(84, 'b'), 'Brighter "bloop" pop with small low thump.', 'Stickers, badges, bullet points appearing.', fout=0.03)
    F('typing_burst', typing_burst(), '~8 keystrokes, mechanical-keyboard style.', 'Text typing on screen, prompt-typing into AI.', fout=0.06, trim_db=-42)
    F('glitch_a', glitch(131, 'a'), 'Random digital stutter/bitcrush/sample-hold bursts.', 'Glitch transitions, "AI processing" moments, errors.', fout=0.02)
    F('glitch_b', glitch(132, 'b'), 'Tightening buffer-repeat stutter roll + crushed tail.', 'Glitch-cut into a new scene, data corruption FX.', fout=0.02)
    F('ding_success', ding_success(), 'Two-note bright bell chime (C6->G6), plate reverb.', 'Success, checkmark, "done" moments.', fout=0.3)
    F('shimmer_sparkle', shimmer(), 'Pentatonic sparkle grains + air swell + glass pad, big reverb.', '"AI magic" moments, reveals of generated results.', fout=0.4)
    F('camera_shutter', camera_shutter(), 'Two-stage DSLR shutter "ka-chk".', 'Freeze-frames, screenshot/photo moments.', fout=0.03)
    F('data_blips', data_blips(), 'Sequence of soft square-ish beeps with ping-pong echo.', 'Data/HUD animations, loading, analysis graphics.', fout=0.1, trim_db=-40)
    tech, tech_raw = bed_tech()
    write_bed('bed_tech', tech, '120 BPM, A-minor (Am9-Fmaj7-Cmaj7-G6, 2 bars each). Soft kick on 1&3, filtered pluck arp w/ dotted-8th ping-pong, airy pad, sub, shaker. 2.6 kHz -3.5 dB voice pocket. Seamless loop.',
              'Default bed for the energetic/tech edit. Loops every 40 s (20 bars).')
    src = tech_raw[N(6.0):N(9.0)] / true_peak(tech_raw[N(6.0):N(9.0)])
    F('tape_stop', tape_stop(src), 'Music (from bed_tech) decelerating to a stop, ~1.1 s.', 'Dramatic "stop"/record-scratch moment; cut bed at file start.', fout=0.06)
    write_bed('bed_cinematic', bed_cinematic(), 'D-minor dark drone + evolving pad (slow filter/LFO), noise texture, soft 72 BPM heartbeat, sparse reverb grains. Seamless loop.',
              'Serious/dramatic edit, "what does this mean for editors" sections.')
    pkg = os.path.join(OUT, '..', '..', '..', 'npmsfx', 'package')
    if os.environ.get('UISFX_PKG'): pkg = os.environ['UISFX_PKG']
    if os.path.isdir(pkg): import_cc0(pkg)
    json.dump(META, open(os.path.join(OUT, 'sfx_index.json'), 'w'), indent=1)
    print('done', len(META))
