import sherpa_onnx, soundfile as sf, numpy as np
M='models/sherpa-onnx-whisper-turbo/'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M+'turbo-encoder.int8.onnx', decoder=M+'turbo-decoder.int8.onnx', tokens=M+'turbo-tokens.txt', language='ar', task='transcribe', num_threads=4, tail_paddings=8000)
a, sr = sf.read('a.wav', dtype='float32')
pad=np.zeros(16000,dtype='float32')
for s,e in [(0,11.0),(10.9,24.0),(23.9,34.3),(34.3,42.6),(0,23.6),(23.9,42.6)]:
    st=rec.create_stream(); st.accept_waveform(16000, np.concatenate([a[int(s*16000):int(e*16000)],pad])); rec.decode_stream(st)
    print(f'{s}-{e}:', st.result.text, flush=True)
