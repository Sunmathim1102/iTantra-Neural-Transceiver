import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import Optional
from app.config.settings import settings
from app.speech.stt_engine import stt_engine
from app.speech.tts_engine import tts_engine
from app.schemas.api_schemas import STTResponse, TTSRequest, TTSResponse

router = APIRouter(prefix="/speech", tags=["Speech Processing"])

@router.post("/transcribe", response_model=STTResponse)
async def transcribe_speech(
    audio: UploadFile = File(...),
    hint_language: Optional[str] = Form(None)
):
    # Save uploaded audio file to disk
    file_ext = os.path.splitext(audio.filename or "recording.wav")[1] or ".wav"
    unique_filename = f"upload_{uuid.uuid4().hex[:10]}{file_ext}"
    saved_path = os.path.join(settings.AUDIO_STORAGE_PATH, "inputs", unique_filename)

    try:
        content = await audio.read()
        with open(saved_path, "wb") as f:
            f.write(content)

        # Transcribe
        result = stt_engine.transcribe_audio_file(saved_path, hint_language=hint_language)
        result["audio_url"] = f"/api/audio/file/{unique_filename}"
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech transcription failed: {str(e)}")

@router.post("/synthesize", response_model=TTSResponse)
def synthesize_text(req: TTSRequest):
    try:
        result = tts_engine.synthesize_speech(
            text=req.text,
            language=req.language,
            slow=req.slow
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")
