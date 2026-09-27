#!/usr/bin/env python3
"""
Trido Offline Speech-to-Text Engine powered by Faster-Whisper.
Provides sub-second local transcription for 99+ languages (Indonesian, English, UN languages).
"""

import sys
import os
import json
import argparse
import warnings

# Suppress huggingface warnings in JSON output
warnings.filterwarnings("ignore")
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

def transcribe(audio_path: str, model_size: str = "base", language: str = None):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return {
            "error": "faster-whisper is not installed. Please run: pip install faster-whisper",
            "success": False
        }

    if not os.path.exists(audio_path):
        return {
            "error": f"Audio file not found: {audio_path}",
            "success": False
        }

    # Automatically choose CPU int8 or CUDA if available
    try:
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
    except Exception as e:
        return {
            "error": f"Failed to initialize WhisperModel({model_size}): {str(e)}",
            "success": False
        }

    lang_param = None
    if language and language not in ["auto", "auto-detect", ""]:
        # Extract 2-letter language code if given as id-ID, en-US, etc.
        lang_param = language.split("-")[0].lower()

    try:
        segments, info = model.transcribe(
            audio_path,
            beam_size=5,
            language=lang_param,
            vad_filter=True, # Voice activity detection to remove background classroom noise
            vad_parameters=dict(min_silence_duration_ms=500)
        )

        text_list = []
        for segment in segments:
            text_list.append(segment.text.strip())

        full_text = " ".join(text_list).strip()

        return {
            "success": True,
            "text": full_text,
            "language": info.language,
            "language_probability": round(float(info.language_probability), 4),
            "duration": round(float(info.duration), 2)
        }
    except Exception as e:
        return {
            "error": f"Transcription failed: {str(e)}",
            "success": False
        }

def main():
    parser = argparse.ArgumentParser(description="Trido Faster-Whisper Offline Transcriber")
    parser.add_argument("--audio", required=True, help="Path to input audio file")
    parser.add_argument("--model", default="base", help="Model size: tiny, base, small")
    parser.add_argument("--language", default=None, help="Language code (e.g. 'id', 'en', 'ar')")
    args = parser.parse_args()

    result = transcribe(args.audio, args.model, args.language)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
