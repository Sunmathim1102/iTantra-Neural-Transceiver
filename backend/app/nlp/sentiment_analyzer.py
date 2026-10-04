import re
from typing import Dict, Any

class SentimentAnalyzer:
    POSITIVE_WORDS = {
        "good", "clear", "success", "fine", "stable", "optimal", "safe", "ready", "received", "confirmed",
        "अच्छा", "सफल", "सुरक्षित", "उत्तम", "ठीक",
        "நல்லது", "வெற்றி", "பாதுகாப்பானது", "சரி",
        "మంచిది", "విజయం", "సురక్షితం", "సరే",
        "ಒಳ್ಳೆಯದು", "ಯಶಸ್ಸು", "ಸುರಕ್ಷಿತ",
        "നല്ലത്", "വിജയം", "സുരക്ഷിതം",
        "ভালো", "সফল", "নিরাপদ",
        "चांगले", "यशस्वी", "सुरक्षित"
    }

    NEGATIVE_WORDS = {
        "emergency", "danger", "failure", "failed", "critical", "error", "lost", "bad", "abort", "warning", "distress",
        "खतरा", "आपातकालीन", "विफलता", "त्रुटि", "खराब", "रद्द",
        "அவசரம்", "ஆபத்து", "தோல்வி", "பிழை", "மோசமான",
        "అత్యవసర", "ప్రమాదం", "వైఫల్యం", "లోపం", "చెడు",
        "ತುರ್ತು", "ಅಪಾಯ", "ವಿಫಲ", "ದೋಷ",
        "അടിയന്തരം", "അപകടം", "പരാജയം", "പിശക്",
        "জরুরি", "বিপদ", "ব্যর্থ", "ত্রুটি",
        "धोका", "आणीबाणी", "अयशस्वी", "त्रुटी"
    }

    @classmethod
    def analyze(cls, text: str) -> Dict[str, Any]:
        cleaned = text.lower()
        tokens = set(re.findall(r'\w+', cleaned))

        pos_count = len(tokens.intersection(cls.POSITIVE_WORDS))
        neg_count = len(tokens.intersection(cls.NEGATIVE_WORDS))

        if neg_count > pos_count:
            sentiment = "Negative"
            score = -round(min(1.0, 0.4 + 0.2 * neg_count), 2)
        elif pos_count > neg_count:
            sentiment = "Positive"
            score = round(min(1.0, 0.4 + 0.2 * pos_count), 2)
        else:
            sentiment = "Neutral"
            score = 0.0

        return {
            "sentiment": sentiment,
            "sentiment_score": score
        }
