# Synthetic take: tone bursts where "words" are spoken, silence elsewhere + a mock WhisperX-style words.json
import json, subprocess
W = []
def utt(t0, text, wd=0.42, gap=0.12):
    t = t0
    for x in text.split():
        W.append({"w": x, "s": round(t, 2), "e": round(t + wd, 2), "p": 0.9}); t += wd + gap
    return t
utt(0.5, "مرحبا بكم في")                          # false start (retake)
utt(3.5, "مرحبا بكم في قناة الموشن.")              # the good take
W.append({"w": "اممم", "s": 6.9, "e": 7.5, "p": 0.5})   # filler
utt(9.0, "اليوم نتكلم عن عن الذكاء الاصطناعي")     # stutter
utt(13.2, "خليني أعيد")                            # explicit retake marker (drops itself + previous utt)
utt(15.0, "اليوم نتكلم عن الذكاء الاصطناعي في المونتاج.")
json.dump(W, open("words.json", "w"), ensure_ascii=False, indent=1)
dur = 20
expr = "+".join(f"between(t,{w['s']},{w['e']})" for w in W)
subprocess.run(["ffmpeg", "-y", "-v", "error",
  "-f", "lavfi", "-i", f"testsrc2=s=540x960:r=30:d={dur}",
  "-f", "lavfi", "-i", f"aevalsrc='0.4*sin(2*PI*440*t)*gt({expr},0)':s=48000:d={dur}",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "take.mp4"], check=True)
print(len(W), "words; take.mp4", dur, "s")
