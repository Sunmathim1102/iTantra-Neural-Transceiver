import time
import uuid
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.speech.stt_engine import stt_engine
from app.speech.tts_engine import tts_engine
from app.nlp.language_detector import IndianLanguageDetector
from app.nlp.intent_classifier import intent_classifier
from app.translation.translator import MultilingualTranslator
from app.radio.transceiver_sim import TransceiverSimulator
from app.ml.comm_quality_model import comm_quality_model
from app.models.db_models import User, CommunicationSession, TransmissionRecord, MLPrediction, AudioRecord, SystemLog

class TransceiverPipelineRunner:
    @classmethod
    def run_full_pipeline(
        cls,
        db: Session,
        user_id: int,
        input_text: Optional[str] = None,
        audio_file_path: Optional[str] = None,
        target_language: str = "en",
        snr: float = 18.0,
        channel_type: str = "AWGN",
        modulation: str = "BPSK",
        carrier_frequency: float = 2.4,
        is_demo: bool = False
    ) -> Dict[str, Any]:
        pipeline_start = time.time()
        session_id = f"SES-{uuid.uuid4().hex[:10].upper()}"

        # 1. STT / Audio Ingestion
        stt_result = None
        text_to_process = input_text or ""
        audio_duration = 0.0
        stt_conf = 1.0

        if audio_file_path:
            stt_result = stt_engine.transcribe_audio_file(audio_file_path)
            text_to_process = stt_result["transcript"]
            audio_duration = stt_result["audio_duration"]
            stt_conf = stt_result["stt_confidence"]
        
        if not text_to_process:
            text_to_process = "Sector clear. Relaying transceiver baseline signal."

        # 2. Language Detection
        lang_res = IndianLanguageDetector.detect_language(text_to_process)
        detected_lang = lang_res["language"]
        lang_code = lang_res["language_code"]
        lang_conf = lang_res["confidence"]

        # 3. NLP & Intent Classification
        nlp_res = intent_classifier.classify_intent(text_to_process)
        intent = nlp_res["intent"]
        intent_conf = nlp_res["confidence"]
        sentiment = nlp_res["sentiment"]
        sentiment_score = nlp_res["sentiment_score"]
        keywords = nlp_res["keywords"]

        # 4. Multilingual Translation
        translation_res = None
        translated_text = text_to_process
        if target_language and target_language.lower() != lang_code.lower():
            translation_res = MultilingualTranslator.translate_text(
                text=text_to_process,
                source_lang=lang_code,
                target_lang=target_language
            )
            translated_text = translation_res["translated_text"]

        # 5. Radio Transceiver Simulation
        radio_res = TransceiverSimulator.simulate_transmission(
            message=translated_text or text_to_process,
            snr=snr,
            carrier_frequency=carrier_frequency,
            channel_type=channel_type,
            modulation=modulation
        )

        # 6. ML Communication Quality Prediction
        ml_quality_res = comm_quality_model.predict_quality(
            snr=radio_res["snr"],
            ber=radio_res["ber"],
            latency_ms=radio_res["latency_ms"],
            packet_loss=radio_res["packet_loss"],
            signal_strength=radio_res["signal_strength_dbm"],
            message_length=len(translated_text),
            audio_duration=max(1.5, audio_duration),
            channel_type=channel_type,
            language=target_language or lang_code
        )

        # 7. Text to Speech Synthesis
        tts_res = tts_engine.synthesize_speech(
            text=translated_text,
            language=target_language or "en"
        )

        total_time_ms = round((time.time() - pipeline_start) * 1000.0, 2)

        # 8. Persist to Relational Database
        try:
            comm_session = CommunicationSession(
                user_id=user_id,
                session_id=session_id,
                detected_language=detected_lang,
                language_confidence=lang_conf,
                transcript=text_to_process,
                translated_text=translated_text,
                target_language=target_language,
                stt_confidence=stt_conf,
                audio_duration=audio_duration,
                intent=intent,
                intent_confidence=intent_conf,
                sentiment=sentiment,
                sentiment_score=sentiment_score,
                keywords=keywords,
                processing_time=total_time_ms,
                is_demo=1 if is_demo else 0
            )
            db.add(comm_session)
            db.flush()

            # Transmission record
            tx_record = TransmissionRecord(
                session_id=session_id,
                snr=radio_res["snr"],
                ber=radio_res["ber"],
                latency_ms=radio_res["latency_ms"],
                packet_loss=radio_res["packet_loss"],
                signal_strength=radio_res["signal_strength_dbm"],
                channel_type=channel_type,
                carrier_frequency=carrier_frequency,
                modulation_scheme=modulation,
                transmission_status=radio_res["transmission_status"],
                waveform_data={
                    "original": radio_res["waveform_original"][:50],
                    "noisy": radio_res["waveform_noisy"][:50],
                    "demodulated": radio_res["waveform_demodulated"][:50]
                }
            )
            db.add(tx_record)

            # ML prediction record
            ml_rec = MLPrediction(
                session_id=session_id,
                model_name=ml_quality_res.get("model_version", "RandomForest-CommQuality-v1.0"),
                prediction=ml_quality_res["predicted_quality"],
                confidence=ml_quality_res["confidence"],
                features={
                    "snr": radio_res["snr"],
                    "ber": radio_res["ber"],
                    "latency": radio_res["latency_ms"],
                    "packet_loss": radio_res["packet_loss"]
                }
            )
            db.add(ml_rec)

            # Audio record
            audio_rec = AudioRecord(
                session_id=session_id,
                input_audio_path=audio_file_path,
                output_audio_path=tts_res.get("file_path"),
                file_size_bytes=tts_res.get("file_size_bytes", 0)
            )
            db.add(audio_rec)

            # Log record
            log_rec = SystemLog(
                user_id=user_id,
                action="PIPELINE_EXECUTION",
                details=f"Session {session_id} processed. Language: {detected_lang}, Intent: {intent}, Quality: {ml_quality_res['predicted_quality']}",
                level="INFO"
            )
            db.add(log_rec)

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Database save error: {e}")

        return {
            "session_id": session_id,
            "status": "SUCCESS",
            "stt_result": stt_result,
            "detected_language_info": lang_res,
            "nlp_result": nlp_res,
            "translation_result": translation_res,
            "radio_result": radio_res,
            "ml_quality_result": ml_quality_res,
            "tts_result": tts_res,
            "total_pipeline_time_ms": total_time_ms,
            "created_at": datetime.datetime.utcnow().isoformat()
        }
