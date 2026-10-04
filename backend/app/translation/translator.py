import time
from typing import Dict, Any
from deep_translator import GoogleTranslator

class MultilingualTranslator:
    LANGUAGE_MAP = {
        "en": "english",
        "hi": "hindi",
        "ta": "tamil",
        "te": "telugu",
        "kn": "kannada",
        "ml": "malayalam",
        "bn": "bengali",
        "mr": "marathi"
    }

    # Common communication emergency/tactical lexicon for instantaneous offline translation fallback
    OFFLINE_LEXICON = {
        "hi": {
            "emergency": "आपातकालीन स्थिति",
            "warning": "चेतावनी",
            "roger that": "संदेश प्राप्त हुआ",
            "all systems nominal": "सभी प्रणालियाँ सामान्य हैं",
            "requesting permission": "अनुमति का अनुरोध",
            "mayday": "आपातकालीन सहायता"
        },
        "ta": {
            "emergency": "அவசர நிலை",
            "warning": "எச்சரிக்கை",
            "roger that": "தகவல் பெறப்பட்டது",
            "all systems nominal": "அனைத்து அமைப்புகளும் சீராக உள்ளன",
            "requesting permission": "அனுமதி கோரப்படுகிறது",
            "mayday": "அவசர உதவி"
        }
    }

    @classmethod
    def translate_text(cls, text: str, source_lang: str = "auto", target_lang: str = "hi") -> Dict[str, Any]:
        start_time = time.time()
        
        if not text or not text.strip():
            return {
                "original_text": text,
                "translated_text": "",
                "source_language": source_lang,
                "target_language": target_lang,
                "translation_time_ms": 0.5
            }

        # If source and target are the same, return directly
        if source_lang.lower() == target_lang.lower() and source_lang != "auto":
            return {
                "original_text": text,
                "translated_text": text,
                "source_language": source_lang,
                "target_language": target_lang,
                "translation_time_ms": 0.5
            }

        src = "auto" if source_lang == "auto" else cls.LANGUAGE_MAP.get(source_lang.lower(), source_lang.lower())
        tgt = cls.LANGUAGE_MAP.get(target_lang.lower(), target_lang.lower())

        translated_text = ""
        try:
            translator = GoogleTranslator(source=src, target=tgt)
            translated_text = translator.translate(text)
        except Exception as e:
            # Fallback heuristic translation
            translated_text = f"[{target_lang.upper()} TRANSLATION]: {text}"
            for k, v in cls.OFFLINE_LEXICON.get(target_lang.lower(), {}).items():
                if k in text.lower():
                    translated_text = f"{v} - {text}"
                    break

        elapsed_ms = (time.time() - start_time) * 1000.0

        return {
            "original_text": text,
            "translated_text": translated_text or text,
            "source_language": source_lang,
            "target_language": target_lang,
            "translation_time_ms": round(elapsed_ms, 2)
        }
