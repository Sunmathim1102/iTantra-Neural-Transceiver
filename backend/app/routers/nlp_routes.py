from fastapi import APIRouter
from app.nlp.language_detector import IndianLanguageDetector
from app.nlp.intent_classifier import intent_classifier
from app.schemas.api_schemas import (
    LanguageDetectRequest,
    LanguageDetectResponse,
    IntentAnalyzeRequest,
    IntentAnalyzeResponse
)

router = APIRouter(prefix="/nlp", tags=["NLP & Language Intelligence"])

@router.post("/detect-language", response_model=LanguageDetectResponse)
def detect_language_endpoint(req: LanguageDetectRequest):
    return IndianLanguageDetector.detect_language(req.text)

@router.post("/analyze", response_model=IntentAnalyzeResponse)
def analyze_intent_endpoint(req: IntentAnalyzeRequest):
    return intent_classifier.classify_intent(req.text)
