import os
import time
import json
import joblib
from typing import Dict, Any, List
from app.config.settings import settings
from app.nlp.preprocessor import NLPPreprocessor
from app.nlp.sentiment_analyzer import SentimentAnalyzer

class IntentClassifier:
    def __init__(self):
        self.model_path = os.path.join(settings.MODELS_STORAGE_PATH, "intent_model.joblib")
        self.metrics_path = os.path.join(settings.MODELS_STORAGE_PATH, "intent_metrics.json")
        self.pipeline = None
        self.metrics = {}
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.pipeline = joblib.load(self.model_path)
            except Exception as e:
                print(f"Failed to load intent model: {e}")
        
        if os.path.exists(self.metrics_path):
            try:
                with open(self.metrics_path, "r", encoding="utf-8") as f:
                    self.metrics = json.load(f)
            except Exception:
                pass

    def classify_intent(self, text: str) -> Dict[str, Any]:
        start_time = time.time()
        
        if not text or not text.strip():
            return {
                "intent": "Information",
                "confidence": 0.5,
                "all_intent_scores": {"Information": 1.0},
                "sentiment": "Neutral",
                "sentiment_score": 0.0,
                "token_count": 0,
                "char_count": 0,
                "keywords": [],
                "processing_time_ms": 0.5
            }

        cleaned_text = NLPPreprocessor.normalize_unicode(text)
        keywords = NLPPreprocessor.extract_keywords(cleaned_text, top_k=5)
        tokens = cleaned_text.split()
        sentiment_res = SentimentAnalyzer.analyze(cleaned_text)

        intent = "Normal Communication"
        confidence = 0.85
        all_scores = {}

        if self.pipeline and "vectorizer" in self.pipeline and "classifier" in self.pipeline:
            vectorizer = self.pipeline["vectorizer"]
            clf = self.pipeline["classifier"]
            classes = self.pipeline["classes"]

            X_vec = vectorizer.transform([cleaned_text])
            probs = clf.predict_proba(X_vec)[0]

            for cls_name, prob in zip(classes, probs):
                all_scores[cls_name] = round(float(prob), 4)

            top_idx = int(probs.argmax())
            intent = classes[top_idx]
            confidence = round(float(probs[top_idx]), 4)
        else:
            # Heuristic fallback if model not loaded
            lower_text = cleaned_text.lower()
            if any(w in lower_text for w in ["mayday", "sos", "emergency", "आपातकालीन", "अவசரம்", "అత్యవసర", "ತುರ್ತು"]):
                intent = "Emergency"
                confidence = 0.95
            elif any(w in lower_text for w in ["warning", "caution", "danger", "चेतावनी", "எச்சரிக்கை"]):
                intent = "Warning"
                confidence = 0.90
            elif any(w in lower_text for w in ["heading", "bearing", "coordinates", "altitude", "दिशा", "मार्ग"]):
                intent = "Navigation"
                confidence = 0.88
            elif any(w in lower_text for w in ["snr", "ber", "qpsk", "bpsk", "frequency", "आवृत्ति", "அலைவரிசை"]):
                intent = "Technical"
                confidence = 0.92
            elif any(w in lower_text for w in ["request", "permission", "authorize", "कृपया", "அனுமதி"]):
                intent = "Request"
                confidence = 0.89
            elif any(w in lower_text for w in ["status", "nominal", "diagnostics", "रिपोर्ट", "அறிக்கை"]):
                intent = "Status Update"
                confidence = 0.87
            else:
                intent = "Normal Communication"
                confidence = 0.80
            all_scores = {intent: confidence}

        elapsed_ms = (time.time() - start_time) * 1000.0

        return {
            "intent": intent,
            "confidence": confidence,
            "all_intent_scores": all_scores,
            "sentiment": sentiment_res["sentiment"],
            "sentiment_score": sentiment_res["sentiment_score"],
            "token_count": len(tokens),
            "char_count": len(cleaned_text),
            "keywords": keywords,
            "processing_time_ms": round(elapsed_ms, 2)
        }

intent_classifier = IntentClassifier()
