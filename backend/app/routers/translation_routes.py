from fastapi import APIRouter
from app.translation.translator import MultilingualTranslator
from app.schemas.api_schemas import TranslateRequest, TranslateResponse

router = APIRouter(prefix="/translation", tags=["Translation"])

@router.post("/translate", response_model=TranslateResponse)
def translate_endpoint(req: TranslateRequest):
    return MultilingualTranslator.translate_text(
        text=req.text,
        source_lang=req.source_language,
        target_lang=req.target_language
    )
