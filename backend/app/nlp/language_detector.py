import time
import re
from typing import Dict, Any, List

class IndianLanguageDetector:
    # Unicode script ranges for Indian languages
    SCRIPT_RANGES = {
        "hi": ("Hindi / Devanagari", "\u0900-\u097F", "Devanagari"),
        "mr": ("Marathi", "\u0900-\u097F", "Devanagari"),
        "bn": ("Bengali", "\u0980-\u09FF", "Bengali"),
        "ta": ("Tamil", "\u0B80-\u0BFF", "Tamil"),
        "te": ("Telugu", "\u0C00-\u0C7F", "Telugu"),
        "kn": ("Kannada", "\u0C80-\u0CFF", "Kannada"),
        "ml": ("Malayalam", "\u0D00-\u0D7F", "Malayalam"),
        "en": ("English", "a-zA-Z", "Latin")
    }

    # Distinctive character cues / vocabulary markers
    MARATHI_MARKERS = ["आहे", "नाही", "करा", "झाले", "कृपया", "संदेश", "माहिती", "काय"]
    HINDI_MARKERS = ["है", "नहीं", "करना", "होगा", "कृपया", "संदेश", "सूचना", "कहाँ", "आप"]
    
    SUPPORTED_LANGUAGES = [
        {"code": "en", "name": "English", "script": "Latin", "region": "Pan-India"},
        {"code": "hi", "name": "Hindi", "script": "Devanagari", "region": "North India"},
        {"code": "ta", "name": "Tamil", "script": "Tamil", "region": "Tamil Nadu"},
        {"code": "te", "name": "Telugu", "script": "Telugu", "region": "Andhra Pradesh & Telangana"},
        {"code": "kn", "name": "Kannada", "script": "Kannada", "region": "Karnataka"},
        {"code": "ml", "name": "Malayalam", "script": "Malayalam", "region": "Kerala"},
        {"code": "bn", "name": "Bengali", "script": "Bengali", "region": "West Bengal"},
        {"code": "mr", "name": "Marathi", "script": "Devanagari", "region": "Maharashtra"}
    ]

    @classmethod
    def detect_language(cls, text: str) -> Dict[str, Any]:
        start_time = time.time()
        
        if not text or not text.strip():
            return {
                "language": "English",
                "language_code": "en",
                "confidence": 0.5,
                "script": "Latin",
                "processing_time_ms": 0.5,
                "supported_languages": cls.SUPPORTED_LANGUAGES
            }

        cleaned = text.strip()
        total_chars = max(1, len(re.findall(r'\S', cleaned)))

        script_counts = {}
        for code, (name, pattern, script_name) in cls.SCRIPT_RANGES.items():
            if code in ["hi", "mr"]:
                # Shared Devanagari script, handled with lexical check below
                matched = len(re.findall(f"[{pattern}]", cleaned))
                script_counts["devanagari"] = matched
            else:
                matched = len(re.findall(f"[{pattern}]", cleaned))
                script_counts[code] = matched

        # Find best script
        best_code = "en"
        highest_ratio = 0.0
        detected_script = "Latin"
        detected_name = "English"

        # Check South Indian & Bengali scripts
        for code in ["ta", "te", "kn", "ml", "bn"]:
            count = script_counts.get(code, 0)
            ratio = count / total_chars
            if ratio > highest_ratio and ratio > 0.15:
                highest_ratio = ratio
                best_code = code
                detected_name = cls.SCRIPT_RANGES[code][0]
                detected_script = cls.SCRIPT_RANGES[code][2]

        # Check Devanagari (Hindi vs Marathi)
        dev_count = script_counts.get("devanagari", 0)
        dev_ratio = dev_count / total_chars
        if dev_ratio > highest_ratio and dev_ratio > 0.15:
            highest_ratio = dev_ratio
            detected_script = "Devanagari"
            # Distinguish Marathi vs Hindi
            marathi_hits = sum(1 for m in cls.MARATHI_MARKERS if m in cleaned)
            hindi_hits = sum(1 for m in cls.HINDI_MARKERS if m in cleaned)
            if marathi_hits > hindi_hits:
                best_code = "mr"
                detected_name = "Marathi"
            else:
                best_code = "hi"
                detected_name = "Hindi"

        # If mostly Latin characters or unrecognized
        if highest_ratio < 0.15:
            best_code = "en"
            detected_name = "English"
            detected_script = "Latin"
            confidence = 0.92
        else:
            confidence = min(0.99, max(0.70, round(0.65 + highest_ratio * 0.35, 3)))

        elapsed_ms = (time.time() - start_time) * 1000.0

        return {
            "language": detected_name,
            "language_code": best_code,
            "confidence": confidence,
            "script": detected_script,
            "processing_time_ms": round(elapsed_ms, 2),
            "supported_languages": cls.SUPPORTED_LANGUAGES
        }
