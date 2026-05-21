// Web Worker: Whisper ASR chạy hoàn toàn trong nền (không block UI)
// Audio đã được decode thành Float32Array (16 kHz, mono) từ main thread trước khi gửi sang.

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.allowLocalModels = false;

let _pipe = null;

self.onmessage = async ({ data }) => {
  if (data.type !== 'run') return;
  const { audio } = data; // Float32Array, 16 kHz mono
  try {
    if (!_pipe) {
      self.postMessage({ type: 'status', text: 'Đang tải Whisper model (lần đầu ~244 MB — tự cache lại)...' });
      _pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
        progress_callback: (p) => {
          if (p.status === 'progress') {
            self.postMessage({ type: 'progress', file: p.file || '', pct: Math.round(p.progress || 0) });
          }
        }
      });
    }
    self.postMessage({ type: 'status', text: 'Đang phiên âm audio tiếng Đức...' });
    const result = await _pipe(audio, {
      language: 'german',
      return_timestamps: 'word',
      chunk_length_s: 30,
    });
    self.postMessage({ type: 'result', text: result.text || '', chunks: result.chunks || [] });
  } catch (e) {
    self.postMessage({ type: 'error', message: e.message || String(e) });
  }
};
