import datetime
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal, engine, Base
from app.models.db_models import User, CommunicationSession, TransmissionRecord, MLPrediction, AudioRecord, SystemLog
from app.auth.security import get_password_hash

SEED_SESSIONS = [
    {
        "session_id": "SES-IND-001",
        "lang": "Hindi",
        "transcript": "आपातकालीन स्थिति! सेक्टर 4 में प्राथमिक रेडियो ट्रांससीवर चैनल में रुकावट आ रही है।",
        "translated": "Emergency condition! Primary radio transceiver channel in Sector 4 is experiencing interference.",
        "target_lang": "en",
        "intent": "Emergency",
        "intent_conf": 0.96,
        "sentiment": "Negative",
        "sentiment_score": -0.8,
        "snr": 12.4,
        "ber": 0.0084,
        "latency": 54.2,
        "packet_loss": 3.8,
        "quality": "Moderate",
        "status": "DEGRADED"
    },
    {
        "session_id": "SES-IND-002",
        "lang": "Tamil",
        "transcript": "அனைத்து அமைப்புகளும் சீராக இயங்குகின்றன, விமானம் சரியான திசையில் பயணிக்கிறது.",
        "translated": "All systems are operating normally, flight is navigating on the correct heading.",
        "target_lang": "en",
        "intent": "Status Update",
        "intent_conf": 0.94,
        "sentiment": "Positive",
        "sentiment_score": 0.7,
        "snr": 24.8,
        "ber": 0.00001,
        "latency": 28.5,
        "packet_loss": 0.0,
        "quality": "Excellent",
        "status": "SUCCESS"
    },
    {
        "session_id": "SES-IND-003",
        "lang": "Telugu",
        "transcript": "ట్రాన్స్‌సీవర్ ఫ్రీక్వెన్సీ 2.45 GHz మరియు QPSK మాడ్యులేషన్ క్యాలిబ్రేట్ చేయబడింది.",
        "translated": "Transceiver frequency 2.45 GHz and QPSK modulation calibrated successfully.",
        "target_lang": "en",
        "intent": "Technical",
        "intent_conf": 0.95,
        "sentiment": "Positive",
        "sentiment_score": 0.5,
        "snr": 20.2,
        "ber": 0.00015,
        "latency": 32.1,
        "packet_loss": 0.1,
        "quality": "Good",
        "status": "SUCCESS"
    },
    {
        "session_id": "SES-IND-004",
        "lang": "Kannada",
        "transcript": "ದಯವಿಟ್ಟು ಮುಂದಿನ ಏರ್‌ಸ್ಪೇಸ್ ಪ್ರವೇಶಿಸಲು ಅನುಮತಿ ನೀಡಿ.",
        "translated": "Kindly grant permission to enter the upcoming airspace sector.",
        "target_lang": "en",
        "intent": "Request",
        "intent_conf": 0.92,
        "sentiment": "Neutral",
        "sentiment_score": 0.0,
        "snr": 18.6,
        "ber": 0.00042,
        "latency": 36.4,
        "packet_loss": 0.5,
        "quality": "Good",
        "status": "SUCCESS"
    },
    {
        "session_id": "SES-IND-005",
        "lang": "Malayalam",
        "transcript": "മുന്നറിയിപ്പ്: മലയോര മേഖലയിൽ കനത്ത മൂടൽമഞ്ഞും ദൃശ്യപരിമിതിയും ഉണ്ട്.",
        "translated": "Warning: Heavy fog and low visibility reported in the mountainous terrain.",
        "target_lang": "en",
        "intent": "Warning",
        "intent_conf": 0.97,
        "sentiment": "Negative",
        "sentiment_score": -0.6,
        "snr": 9.5,
        "ber": 0.0245,
        "latency": 78.2,
        "packet_loss": 8.4,
        "quality": "Poor",
        "status": "DEGRADED"
    },
    {
        "session_id": "SES-IND-006",
        "lang": "Bengali",
        "transcript": "বর্তমান অবস্থান: 22 ডিগ্রি উত্তর, 88 ডিগ্রি পূর্ব, গতি স্বাভাবিক।",
        "translated": "Current position: 22 degrees North, 88 degrees East, cruising speed normal.",
        "target_lang": "en",
        "intent": "Navigation",
        "intent_conf": 0.93,
        "sentiment": "Positive",
        "sentiment_score": 0.4,
        "snr": 22.1,
        "ber": 0.00005,
        "latency": 30.2,
        "packet_loss": 0.0,
        "quality": "Excellent",
        "status": "SUCCESS"
    },
    {
        "session_id": "SES-IND-007",
        "lang": "Marathi",
        "transcript": "शुभ प्रभात बेस स्टेशन, ऑडिओ फ्रिक्वेन्सी चाचणी यशस्वी झाली आहे.",
        "translated": "Good morning base station, audio frequency test completed successfully.",
        "target_lang": "en",
        "intent": "Normal Communication",
        "intent_conf": 0.91,
        "sentiment": "Positive",
        "sentiment_score": 0.8,
        "snr": 26.5,
        "ber": 0.00000,
        "latency": 25.1,
        "packet_loss": 0.0,
        "quality": "Excellent",
        "status": "SUCCESS"
    },
    {
        "session_id": "SES-IND-008",
        "lang": "English",
        "transcript": "Control, this is iTantra tactical flight 902. Radio access link established with ground command.",
        "translated": "Control, this is iTantra tactical flight 902. Radio access link established with ground command.",
        "target_lang": "hi",
        "intent": "Normal Communication",
        "intent_conf": 0.95,
        "sentiment": "Positive",
        "sentiment_score": 0.6,
        "snr": 21.0,
        "ber": 0.00008,
        "latency": 31.0,
        "packet_loss": 0.1,
        "quality": "Good",
        "status": "SUCCESS"
    }
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@itantra.ai").first()
        if not admin:
            admin = User(
                name="iTantra Mission Commander",
                email="admin@itantra.ai",
                password_hash=get_password_hash("AdminPassword123!"),
                role="ADMIN"
            )
            db.add(admin)

        pilot = db.query(User).filter(User.email == "pilot@itantra.ai").first()
        if not pilot:
            pilot = User(
                name="Pilot Officer Aryan",
                email="pilot@itantra.ai",
                password_hash=get_password_hash("UserPassword123!"),
                role="USER"
            )
            db.add(pilot)

        db.flush()

        # Seed sample sessions if table is empty
        if db.query(CommunicationSession).count() == 0:
            for idx, item in enumerate(SEED_SESSIONS):
                created_time = datetime.datetime.utcnow() - datetime.timedelta(hours=(len(SEED_SESSIONS) - idx) * 4)
                
                session = CommunicationSession(
                    user_id=pilot.id,
                    session_id=item["session_id"],
                    detected_language=item["lang"],
                    language_confidence=0.96,
                    transcript=item["transcript"],
                    translated_text=item["translated"],
                    target_language=item["target_lang"],
                    stt_confidence=0.92,
                    audio_duration=3.8,
                    intent=item["intent"],
                    intent_confidence=item["intent_conf"],
                    sentiment=item["sentiment"],
                    sentiment_score=item["sentiment_score"],
                    keywords=["radio", "transceiver", "signal", item["lang"].lower()],
                    processing_time=item["latency"],
                    is_demo=1,
                    created_at=created_time
                )
                db.add(session)
                db.flush()

                tx = TransmissionRecord(
                    session_id=item["session_id"],
                    snr=item["snr"],
                    ber=item["ber"],
                    latency_ms=item["latency"],
                    packet_loss=item["packet_loss"],
                    signal_strength=round(-90.0 + item["snr"] * 1.5, 1),
                    channel_type="AWGN",
                    carrier_frequency=2.4,
                    modulation_scheme="BPSK",
                    transmission_status=item["status"],
                    created_at=created_time
                )
                db.add(tx)

                ml_p = MLPrediction(
                    session_id=item["session_id"],
                    model_name="RandomForest-CommQuality-v1.0",
                    prediction=item["quality"],
                    confidence=0.94,
                    features={"snr": item["snr"], "ber": item["ber"]},
                    created_at=created_time
                )
                db.add(ml_p)

                audio_rec = AudioRecord(
                    session_id=item["session_id"],
                    input_audio_path=f"sample_{item['lang'].lower()}.wav",
                    output_audio_path=f"sample_{item['lang'].lower()}_out.mp3",
                    file_size_bytes=48200,
                    created_at=created_time
                )
                db.add(audio_rec)

                log_entry = SystemLog(
                    user_id=pilot.id,
                    action="TRANSMISSION_LOG",
                    details=f"Demo seed session {item['session_id']} logged with {item['lang']} speech payload.",
                    level="INFO",
                    timestamp=created_time
                )
                db.add(log_entry)

        db.commit()
        print("Database seeded successfully with default Admin, Pilot user, and Indian multilingual communication records.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
