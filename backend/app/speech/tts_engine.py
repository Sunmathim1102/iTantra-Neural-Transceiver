import os
import time
import uuid
from gtts import gTTS
from typing import Dict, Any
from app.config.settings import settings
from app.speech.audio_processor import AudioProcessor

class TTSEngine:
    def __init__(self):
        # Mapping ISO code to gTTS supported Indian languages
        self.supported_tts_langs = {
            "en": "en",
            "hi": "hi",
            "ta": "ta",
            "te": "te",
            "kn": "kn",
            "ml": "ml",
            "bn": "bn",
            "mr": "mr"
        }

    def synthesize_speech(self, text: str, language: str = "en", slow: bool = False) -> Dict[str, Any]:
        start_time = time.time()
        
        tts_lang = self.supported_tts_langs.get(language.lower(), "en")
        unique_id = f"tts_{uuid.uuid4().hex[:12]}.mp3"
        output_filepath = os.path.join(settings.AUDIO_STORAGE_PATH, "outputs", unique_id)
        
        try:
            tts = gTTS(text=text, lang=tts_lang, slow=slow)
            tts.save(output_filepath)
        except Exception as e:
            # Fallback to English TTS or synthetic tone if offline
            try:
                tts = gTTS(text=text, lang="en", slow=slow)
                tts.save(output_filepath)
            except Exception:
                wav_path = output_filepath.replace(".mp3", ".wav")
                AudioProcessor.generate_synthetic_audio_wav(wav_path, duration_sec=2.0)
                output_filepath = wav_path
                unique_id = os.path.basename(wav_path)

        elapsed_ms = (time.time() - start_time) * 1000.0
        file_size = os.path.getsize(output_filepath) if os.path.exists(output_filepath) else 0

        # Approximate speech duration based on word count (avg 130 words per min)
        word_count = len(text.split())
        estimated_duration = max(1.2, round((word_count / 130.0) * 60.0, 2))

        return {
            "audio_filename": unique_id,
            "audio_url": f"/api/audio/file/{unique_id}",
            "file_path": output_filepath,
            "language": language,
            "text_length": len(text),
            "audio_duration": estimated_duration,
            "file_size_bytes": file_size,
            "generation_time_ms": round(elapsed_ms, 2)
        }

tts_engine = TTSEngine()
