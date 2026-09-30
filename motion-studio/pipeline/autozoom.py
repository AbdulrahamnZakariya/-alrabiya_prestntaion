#!/usr/bin/env python3
"""autozoom.py clicks.json out.mp4 — reframe a 16:9 screen recording to 9:16, following click points,
with a short smooth pan between targets (deterministic ffmpeg crop expression)."""
import json, subprocess, sys
d = json.load(open(sys.argv[1])); out = sys.argv[2]
W, H = 1280, 720; cw = round(H * 9 / 16 / 2) * 2          # 9:16 window inside a 720p frame -> 404x720
xs = [min(max(c["x"] - cw / 2, 0), W - cw) for c in d["clicks"]] or [(W - cw) / 2]
ts = [c["t"] for c in d["clicks"]]
# piecewise: before first click hold first target; between clicks ease over 0.4 s
expr = f"{xs[0]:.0f}"
for i in range(1, len(xs)):
    a, b, t = xs[i-1], xs[i], ts[i] - 0.4
    expr = f"if(lt(t,{t:.2f}),{expr},if(lt(t,{t+0.4:.2f}),{a:.0f}+({b-a:.0f})*(t-{t:.2f})/0.4,{b:.0f}))"
vf = f"crop=w={cw}:h={H}:x='{expr}':y=0,scale=1080:1920:flags=lanczos,fps=30"
cmd = ["ffmpeg","-y","-v","error","-i",d["video"],"-vf",vf,"-c:v","libx264","-crf","18","-pix_fmt","yuv420p","-an",out]
print("+", " ".join(cmd)); subprocess.run(cmd, check=True)
