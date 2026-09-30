import onnxruntime as ort, numpy as np, cv2, json, subprocess
sess = ort.InferenceSession('models/u2net_human_seg.onnx', providers=['CPUExecutionProvider'])
iname = sess.get_inputs()[0].name
cap = cv2.VideoCapture('up.mp4')
W,H=1080,1920
enc = subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','gray','-s',f'{W}x{H}','-r','30','-i','-','-c:v','libx264','-crf','10','-pix_fmt','yuv420p','mask.mp4'], stdin=subprocess.PIPE)
prev=None; track=[]; i=0
mean=np.array([0.485,0.456,0.406]); std=np.array([0.229,0.224,0.225])
while True:
    ok, fr = cap.read()
    if not ok: break
    img = cv2.cvtColor(cv2.resize(fr,(320,320),interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB).astype(np.float32)
    img = img/ max(img.max(),1e-6)
    img = (img-mean)/std
    x = img.transpose(2,0,1)[None].astype(np.float32)
    m = sess.run(None,{iname:x})[0][0,0]
    m = (m-m.min())/(m.max()-m.min()+1e-6)
    m = cv2.resize(m,(W,H),interpolation=cv2.INTER_CUBIC)
    if prev is not None: m = 0.65*m+0.35*prev
    prev=m
    mm = np.clip((m-0.35)/0.3,0,1)
    mm = cv2.GaussianBlur(mm,(0,0),2.0)
    ys,xs=np.where(mm>0.5)
    if len(ys):
        top=int(ys.min()); 
        # head region: rows within top..top+420
        hy = ys<top+420; hx=xs[hy]
        track.append({"f":i,"top":top,"head_x0":int(hx.min()),"head_x1":int(hx.max()),"cx":int(xs.mean()),"body_x0":int(np.percentile(xs,2)),"body_x1":int(np.percentile(xs,98))})
    else: track.append({"f":i})
    enc.stdin.write((mm*255).astype(np.uint8).tobytes()); i+=1
    if i%100==0: print(i, flush=True)
enc.stdin.close(); enc.wait()
json.dump(track, open('person_track.json','w'))
print('done', i)
