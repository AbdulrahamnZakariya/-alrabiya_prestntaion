import sherpa_onnx, soundfile as sf, json, numpy as np, sys
M='models/sherpa-onnx-whisper-turbo/'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M+'turbo-encoder.int8.onnx', decoder=M+'turbo-decoder.int8.onnx', tokens=M+'turbo-tokens.txt', language='ar', task='transcribe', num_threads=4)
audio, sr = sf.read('a.wav', dtype='float32')
cfg = sherpa_onnx.VadModelConfig(); cfg.silero_vad.model='models/silero_vad.onnx'; cfg.silero_vad.min_silence_duration=float(sys.argv[1]) if len(sys.argv)>1 else 0.12; cfg.silero_vad.min_speech_duration=0.15; cfg.silero_vad.threshold=0.4; cfg.sample_rate=16000
vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=60)
win = cfg.silero_vad.window_size
segs=[]
for i in range(0, len(audio), win):
    vad.accept_waveform(audio[i:i+win])
    while not vad.empty():
        s = vad.front; segs.append((s.start/16000, np.array(s.samples))); vad.pop()
vad.flush()
while not vad.empty():
    s=vad.front; segs.append((s.start/16000, np.array(s.samples))); vad.pop()
out=[]
for st, smp in segs:
    stream = rec.create_stream(); stream.accept_waveform(16000, smp); rec.decode_stream(stream)
    r = stream.result
    out.append({'start':round(st,3),'end':round(st+len(smp)/16000,3),'text':r.text.strip(), 'ts': list(getattr(r,'timestamps',[]) or []), 'tokens': list(getattr(r,'tokens',[]) or [])})
    print(f"{st:6.2f}-{st+len(smp)/16000:6.2f} | {r.text.strip()}", flush=True)
json.dump(out, open('segments.json','w'), ensure_ascii=False, indent=1)
print('ts available:', any(o['ts'] for o in out))
