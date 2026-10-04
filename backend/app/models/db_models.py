import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="USER", nullable=False)  # "USER" or "ADMIN"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sessions = relationship("CommunicationSession", back_populates="user", cascade="all, delete-orphan")
    logs = relationship("SystemLog", back_populates="user")


class CommunicationSession(Base):
    __tablename__ = "communication_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    
    # Speech & Language
    detected_language = Column(String(50), nullable=True)
    language_confidence = Column(Float, default=1.0)
    transcript = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)
    target_language = Column(String(50), nullable=True)
    stt_confidence = Column(Float, default=0.0)
    audio_duration = Column(Float, default=0.0)  # seconds
    
    # NLP & Intent
    intent = Column(String(100), nullable=True)
    intent_confidence = Column(Float, default=0.0)
    sentiment = Column(String(50), nullable=True)
    sentiment_score = Column(Float, default=0.0)
    keywords = Column(JSON, nullable=True)
    
    # Processing Metrics
    processing_time = Column(Float, default=0.0)  # total latency ms
    is_demo = Column(Integer, default=0)  # 0 = normal, 1 = demo
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="sessions")
    transmissions = relationship("TransmissionRecord", back_populates="session", cascade="all, delete-orphan")
    ml_predictions = relationship("MLPrediction", back_populates="session", cascade="all, delete-orphan")
    audio_records = relationship("AudioRecord", back_populates="session", cascade="all, delete-orphan")


class TransmissionRecord(Base):
    __tablename__ = "transmission_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("communication_sessions.session_id"), nullable=False, index=True)
    
    # Radio & Channel Simulation Parameters
    snr = Column(Float, nullable=False)  # dB
    ber = Column(Float, nullable=False)  # Bit Error Rate (0.0 to 1.0)
    latency_ms = Column(Float, nullable=False)
    packet_loss = Column(Float, nullable=False)  # Percentage (0.0 to 100.0)
    signal_strength = Column(Float, nullable=False)  # dBm or %
    channel_type = Column(String(50), default="AWGN")  # AWGN, Rayleigh, Rician
    carrier_frequency = Column(Float, default=2.4)  # GHz
    sampling_rate = Column(Float, default=44100)  # Hz
    bit_rate = Column(Float, default=128)  # kbps
    modulation_scheme = Column(String(20), default="BPSK")  # BPSK, QPSK, 16-QAM
    transmission_status = Column(String(50), default="SUCCESS")  # SUCCESS, DEGRADED, FAILED
    
    # Waveform previews (JSON arrays of sampled values)
    waveform_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("CommunicationSession", back_populates="transmissions")


class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("communication_sessions.session_id"), nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    prediction = Column(String(100), nullable=False)  # e.g., "Excellent", "Good", "Moderate", "Poor"
    confidence = Column(Float, nullable=False)
    features = Column(JSON, nullable=True)  # Snapshot of feature vector
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("CommunicationSession", back_populates="ml_predictions")


class AudioRecord(Base):
    __tablename__ = "audio_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("communication_sessions.session_id"), nullable=False, index=True)
    input_audio_path = Column(String(255), nullable=True)
    output_audio_path = Column(String(255), nullable=True)
    sample_rate = Column(Integer, default=16000)
    channels = Column(Integer, default=1)
    file_size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("CommunicationSession", back_populates="audio_records")


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    level = Column(String(20), default="INFO")  # INFO, WARNING, ERROR
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="logs")
