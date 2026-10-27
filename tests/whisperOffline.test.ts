import { describe, it, expect } from 'vitest';
import { isWhisperAvailable, transcribeAudioWhisper } from '../server/whisperAdapter';

describe('Faster-Whisper Offline STT', () => {
  it('cek ketersediaan faster_whisper di mesin host', async () => {
    const available = await isWhisperAvailable();
    expect(typeof available).toBe('boolean');
    // di runner CI github actions emang ga di-install pip faster-whisper biar cepet
    if (!process.env.CI) {
      expect(available).toBe(true);
    }
  }, 15000);

  it('ga crash kalo dikasih audio kosong', async () => {
    const text = await transcribeAudioWhisper('');
    expect(text).toBe('');
  });

  it('tetep aman kalo base64 audionya rusak/invalid', async () => {
    // pake model tiny biar ngetesnya ga kelamaan
    const text = await transcribeAudioWhisper('invalid_base64_audio_sample', 'auto', 'tiny');
    expect(typeof text).toBe('string');
  }, 30000);
});
