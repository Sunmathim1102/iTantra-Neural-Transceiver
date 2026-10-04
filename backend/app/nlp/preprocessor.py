import unicodedata
import re
from typing import List, Dict, Any

class NLPPreprocessor:
    INDIAN_COMMON_STOPWORDS = {
        "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "with",
        "and", "or", "of", "this", "that", "it", "we", "you", "they", "i", "me",
        "है", "के", "में", "की", "का", "और", "से", "को", "पर", "एक", "हो", "था", "थी",
        "ஆகும்", "மற்றும்", "இல்", "ஒரு", "இந்த", "என்று", "உள்ளது",
        "మరియు", "ఉంది", "ఒక", "ఈ", "అని",
        "ಮತ್ತು", "ಇದೆ", "ಒಂದು", "ಈ",
        "ആണ്", "ഒരു", "എന്ന", "ഈ",
        "এবং", "একটি", "এই", "হয়",
        "आणि", "एक", "आहे", "हे"
    }

    @classmethod
    def normalize_unicode(cls, text: str) -> str:
        """Applies NFC Unicode normalization to properly compose Indian language diacritics/matras."""
        if not text:
            return ""
        # Unicode normalization
        normalized = unicodedata.normalize("NFC", text)
        # Whitespace cleanup
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        return normalized

    @classmethod
    def clean_text(cls, text: str, remove_stopwords: bool = False) -> str:
        normalized = cls.normalize_unicode(text)
        # Remove noisy non-linguistic symbols while keeping native Indic script alphabets
        cleaned = re.sub(r'[^\w\s\u0900-\u0D7F]', ' ', normalized)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip().lower()

        if remove_stopwords:
            tokens = cleaned.split()
            tokens = [t for t in tokens if t not in cls.INDIAN_COMMON_STOPWORDS]
            cleaned = " ".join(tokens)

        return cleaned

    @classmethod
    def extract_keywords(cls, text: str, top_k: int = 5) -> List[str]:
        cleaned = cls.clean_text(text, remove_stopwords=True)
        tokens = [t for t in cleaned.split() if len(t) > 2]
        # Frequency count
        freq: Dict[str, int] = {}
        for t in tokens:
            freq[t] = freq.get(t, 0) + 1
        
        sorted_tokens = sorted(freq.items(), key=lambda item: item[1], reverse=True)
        return [item[0] for item in sorted_tokens[:top_k]]
