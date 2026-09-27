import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createLogger } from '../utils/logger';

const execFileAsync = promisify(execFile);
const logger = createLogger('whisper');

export interface WhisperTranscriptionResult {
  success: boolean;
  text?: string;
  language?: string;
  language_probability?: number;
  duration?: number;
  error?: string;
}

/**
 * Checks if Python and faster-whisper are available on the host machine.
 */
export const isWhisperAvailable = async (): Promise<boolean> => {
  try {
    const { stdout } = await execFileAsync('python', ['-c', 'import faster_whisper; print("ok")'], { timeout: 3000 });
    return stdout.trim().includes('ok');
  } catch {
    return false;
  }
};

/**
 * Transcribes base64 audio offline using faster-whisper.
 */
export const transcribeAudioWhisper = async (
  base64Audio: string,
  language?: string,
  modelSize = 'base'
): Promise<string> => {
  const tmpId = `trido_whisper_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tmpFilePath = path.join(os.tmpdir(), `${tmpId}.webm`);
  const scriptPath = path.resolve(__dirname, 'whisperService.py');

  try {
    // 1. Strip data URL header if present
    const cleanBase64 = base64Audio.replace(/^data:audio\/[a-zA-Z0-9]+;base64,/, '');
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    if (audioBuffer.length === 0) {
      logger.warn('[Whisper] Received empty audio buffer.');
      return '';
    }

    // 2. Write temp audio file
    fs.writeFileSync(tmpFilePath, audioBuffer);

    // 3. Prepare CLI arguments
    const args = [
      scriptPath,
      '--audio', tmpFilePath,
      '--model', modelSize,
    ];

    if (language && language !== 'auto') {
      args.push('--language', language);
    }

    logger.info(`[Whisper] Executing offline transcription with model: ${modelSize}, language: ${language || 'auto-detect'}...`);
    const { stdout, stderr } = await execFileAsync('python', args, { timeout: 30000 });

    if (stderr) {
      logger.debug(`[Whisper] stderr notice: ${stderr.trim()}`);
    }

    // 4. Parse JSON result
    const trimmed = stdout.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error(`[Whisper] Non-JSON output received: ${trimmed}`);
      return '';
    }

    const parsed: WhisperTranscriptionResult = JSON.parse(jsonMatch[0]);

    if (!parsed.success) {
      logger.warn(`[Whisper] Transcription engine error: ${parsed.error}`);
      return '';
    }

    logger.info(`[Whisper] Transcription complete (${parsed.language}, prob: ${parsed.language_probability}): "${parsed.text}"`);
    return parsed.text || '';
  } catch (err: any) {
    logger.error(`[Whisper] Failed to execute offline transcription: ${err.message || err}`);
    return '';
  } finally {
    // 5. Clean up temp audio file
    try {
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
      }
    } catch {
      // Ignore cleanup error
    }
  }
};
