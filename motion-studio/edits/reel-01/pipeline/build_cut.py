import json, numpy as np, soundfile as sf, subprocess
SEG = [
 (0.11,1.86,"طفرة في عالم التصميم"),
 (2.09,4.49,"المصممين رح يزعلوا علينا بعد هذا الفيديو"),
 (5.03,5.54,"طبعاً"),
 (5.71,7.40,"للتأكيد وللمعلومية"),
 (7.72,10.54,"إنو الذكاء الاصطناعي فعلياً بيعملك مونتاج الفيديوهات"),
 (11.18,13.35,"بس كل ما كان إنت عندك حس بصري"),
 (14.03,17.42,"وعندك أشياء في بالك بتقدر تدخلها داخل الفيديو"),
 (17.55,18.95,"كل ما كانت النتيجة أفضل"),
 (19.63,20.68,"فالذكاء الاصطناعي"),
 (20.94,22.02,"كل ما كلّمته أكتر"),
 (22.15,23.37,"كل ما أعطاك نتائج أفضل"),
 (24.04,28.55,"فهل فعلاً اللي بيستخدم الذكاء الاصطناعي باحترافية وبيضيف الإضافات الصح"),
 (28.65,30.66,"داخل الفيديو داخل الماكينة"),
 (30.89,32.55,"نفس اللي بيستخدم استخدام عادي؟"),
 (33.00,33.77,"أكيد لا"),
 (34.70,35.37,"فبشرى"),
 (35.56,36.58,"للمصممين"),
 (36.94,40.62,"إنه إنت رح هاي الأداة تكون مساعد إلك"),
 (40.78,42.06,"وليس تحل محلك"),
]
a, sr = sf.read('a.wav', dtype='float32')
# energy envelope 10ms
hop=160; env=np.sqrt(np.convolve(a**2, np.ones(400)/400, 'same'))[::hop]
def snap(t, lo, hi):
    i0=max(int((t-0.10)*100), int(lo*100)+1); i1=min(int((t+0.10)*100), int(hi*100)-1)
    if i1<=i0: return t
    j=i0+int(np.argmin(env[i0:i1])); return j/100
# keep ranges (source time)
PADL, PADR, GAP = 0.06, 0.10, 0.12
keeps=[]
for s,e,_ in SEG:
    s0=max(0,s-PADL); e0=min(len(a)/sr, e+PADR)
    if keeps and s0-keeps[-1][1] < GAP: keeps[-1][1]=e0
    else: keeps.append([s0,e0])
# map source->cut
def to_cut(t):
    acc=0
    for s,e in keeps:
        if t<s: return acc
        if t<=e: return acc+(t-s)
        acc+=e-s
    return acc
words=[]; sents=[]
for si,(s,e,txt) in enumerate(SEG):
    ws=txt.split(); L=[len(w.replace('ّ',''))+1.2 for w in ws]; tot=sum(L)
    bounds=[s]; c=s
    for l in L[:-1]:
        c+= (e-s)*l/tot; bounds.append(snap(c, s, e))
    bounds.append(e)
    idx0=len(words)
    for k,w in enumerate(ws):
        words.append({"w":w,"s":round(to_cut(bounds[k]),3),"e":round(to_cut(bounds[k+1]),3),"src_s":round(bounds[k],3),"sent":si})
    sents.append({"i":si,"text":txt,"s":round(to_cut(s),3),"e":round(to_cut(e),3),"w0":idx0,"w1":len(words)-1})
dur=sum(e-s for s,e in keeps)
json.dump({"duration":round(dur,3),"fps":30,"keeps":keeps,"sentences":sents,"words":words}, open('caps.json','w'), ensure_ascii=False, indent=1)
print('keeps',len(keeps),'dur',round(dur,2))
# ffmpeg cut
vf=[];af=[]
for i,(s,e) in enumerate(keeps):
    vf.append(f"[0:v]trim={s:.3f}:{e:.3f},setpts=PTS-STARTPTS[v{i}]")
    af.append(f"[0:a]atrim={s:.3f}:{e:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={e-s-0.015:.3f}:d=0.015[a{i}]")
n=len(keeps)
fc=";".join(vf+af)+";"+"".join(f"[v{i}][a{i}]" for i in range(n))+f"concat=n={n}:v=1:a=1[v][a]"
subprocess.run(['ffmpeg','-v','error','-y','-i','source.mp4','-filter_complex',fc,'-map','[v]','-map','[a]','-r','30','-c:v','libx264','-crf','12','-preset','slow','-pix_fmt','yuv420p','-c:a','pcm_s16le','cut_src.mov'],check=True)
