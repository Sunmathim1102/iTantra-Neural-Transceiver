import os
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database.connection import get_db
from app.models.db_models import CommunicationSession, TransmissionRecord, MLPrediction, AudioRecord, User
from app.auth.dependencies import get_current_user
from app.ml.pipeline_runner import TransceiverPipelineRunner
from app.schemas.api_schemas import (
    TransceiverPipelineResponse,
    PaginatedSessionsResponse,
    SessionSummary
)
from app.config.settings import settings

router = APIRouter(prefix="/sessions", tags=["Transceiver Sessions & Pipeline"])

@router.post("/pipeline", response_model=TransceiverPipelineResponse)
async def execute_transceiver_pipeline(
    text: Optional[str] = Form(None),
    target_language: str = Form("en"),
    snr: float = Form(18.0),
    channel_type: str = Form("AWGN"),
    modulation: str = Form("BPSK"),
    carrier_frequency: float = Form(2.4),
    is_demo: bool = Form(False),
    audio: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    saved_audio_path = None
    if audio and audio.filename:
        file_ext = os.path.splitext(audio.filename)[1] or ".wav"
        unique_name = f"pipe_in_{os.urandom(6).hex()}{file_ext}"
        saved_audio_path = os.path.join(settings.AUDIO_STORAGE_PATH, "inputs", unique_name)
        content = await audio.read()
        with open(saved_audio_path, "wb") as f:
            f.write(content)

    user_id = current_user.id if current_user else 1

    result = TransceiverPipelineRunner.run_full_pipeline(
        db=db,
        user_id=user_id,
        input_text=text,
        audio_file_path=saved_audio_path,
        target_language=target_language,
        snr=snr,
        channel_type=channel_type,
        modulation=modulation,
        carrier_frequency=carrier_frequency,
        is_demo=is_demo
    )
    return result

@router.get("", response_model=PaginatedSessionsResponse)
def list_sessions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    intent: Optional[str] = Query(None),
    quality: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CommunicationSession).order_by(CommunicationSession.created_at.desc())

    if search:
        query = query.filter(
            CommunicationSession.transcript.ilike(f"%{search}%") |
            CommunicationSession.session_id.ilike(f"%{search}%") |
            CommunicationSession.translated_text.ilike(f"%{search}%")
        )

    if language:
        query = query.filter(CommunicationSession.detected_language.ilike(f"%{language}%"))

    if intent:
        query = query.filter(CommunicationSession.intent == intent)

    total = query.count()
    offset = (page - 1) * limit
    sessions = query.offset(offset).limit(limit).all()

    summary_list = []
    for s in sessions:
        tx = db.query(TransmissionRecord).filter(TransmissionRecord.session_id == s.session_id).first()
        ml_p = db.query(MLPrediction).filter(MLPrediction.session_id == s.session_id).first()
        u = db.query(User).filter(User.id == s.user_id).first()

        summary_list.append(SessionSummary(
            id=s.id,
            session_id=s.session_id,
            user_id=s.user_id,
            user_name=u.name if u else "Pilot Officer",
            detected_language=s.detected_language,
            transcript=s.transcript,
            translated_text=s.translated_text,
            intent=s.intent,
            intent_confidence=s.intent_confidence,
            sentiment=s.sentiment,
            snr=tx.snr if tx else 18.0,
            ber=tx.ber if tx else 0.0001,
            latency_ms=tx.latency_ms if tx else 35.0,
            packet_loss=tx.packet_loss if tx else 0.0,
            quality_prediction=ml_p.prediction if ml_p else "Good",
            transmission_status=tx.transmission_status if tx else "SUCCESS",
            created_at=s.created_at
        ))

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "sessions": summary_list
    }

@router.get("/{session_id}")
def get_session_details(session_id: str, db: Session = Depends(get_db)):
    session = db.query(CommunicationSession).filter(CommunicationSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    tx = db.query(TransmissionRecord).filter(TransmissionRecord.session_id == session_id).first()
    ml_p = db.query(MLPrediction).filter(MLPrediction.session_id == session_id).first()
    audio = db.query(AudioRecord).filter(AudioRecord.session_id == session_id).first()
    u = db.query(User).filter(User.id == session.user_id).first()

    output_audio_url = None
    if audio and audio.output_audio_path:
        fname = os.path.basename(audio.output_audio_path)
        output_audio_url = f"/api/audio/file/{fname}"

    return {
        "session": {
            "id": session.id,
            "session_id": session.session_id,
            "user_name": u.name if u else "Commander",
            "detected_language": session.detected_language,
            "language_confidence": session.language_confidence,
            "transcript": session.transcript,
            "translated_text": session.translated_text,
            "target_language": session.target_language,
            "stt_confidence": session.stt_confidence,
            "audio_duration": session.audio_duration,
            "intent": session.intent,
            "intent_confidence": session.intent_confidence,
            "sentiment": session.sentiment,
            "sentiment_score": session.sentiment_score,
            "keywords": session.keywords,
            "processing_time": session.processing_time,
            "created_at": session.created_at
        },
        "transmission": {
            "snr": tx.snr if tx else 18.0,
            "ber": tx.ber if tx else 0.0001,
            "latency_ms": tx.latency_ms if tx else 32.0,
            "packet_loss": tx.packet_loss if tx else 0.0,
            "signal_strength": tx.signal_strength if tx else -65.0,
            "channel_type": tx.channel_type if tx else "AWGN",
            "carrier_frequency": tx.carrier_frequency if tx else 2.4,
            "modulation_scheme": tx.modulation_scheme if tx else "BPSK",
            "transmission_status": tx.transmission_status if tx else "SUCCESS",
            "waveform_data": tx.waveform_data if tx else {}
        },
        "ml_prediction": {
            "model_name": ml_p.model_name if ml_p else "RandomForest-CommQuality-v1.0",
            "prediction": ml_p.prediction if ml_p else "Good",
            "confidence": ml_p.confidence if ml_p else 0.92,
            "features": ml_p.features if ml_p else {}
        },
        "audio": {
            "input_audio_path": audio.input_audio_path if audio else None,
            "output_audio_path": audio.output_audio_path if audio else None,
            "output_audio_url": output_audio_url,
            "file_size_bytes": audio.file_size_bytes if audio else 0
        }
    }

@router.delete("/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(CommunicationSession).filter(CommunicationSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"status": "DELETED", "session_id": session_id}
