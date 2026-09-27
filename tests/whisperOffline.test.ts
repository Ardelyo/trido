import { describe, it, expect } from 'vitest';
import { isWhisperAvailable, transcribeAudioWhisper } from '../server/whisperAdapter';

describe('Faster-Whisper Offline Multilingual Speech-to-Text', () => {
  it('detects faster_whisper presence on the host machine', async () => {
    const available = await isWhisperAvailable();
    expect(typeof available).toBe('boolean');
    expect(available).toBe(true);
  });

  it('handles empty audio gracefully without crashing', async () => {
    const text = await transcribeAudioWhisper('');
    expect(text).toBe('');
  });

  it('handles invalid base64 audio gracefully', async () => {
    // Uses tiny model for fast test execution
    const text = await transcribeAudioWhisper('invalid_base64_audio_sample', 'auto', 'tiny');
    expect(typeof text).toBe('string');
  }, 30000);
});
