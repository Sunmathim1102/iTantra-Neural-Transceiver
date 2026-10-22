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


class DatasetRecord(Base):
    __tablename__ = "dataset_records"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    target_column = Column(String(100), default="communication_quality")
    is_synthetic = Column(Integer, default=0)
    is_active = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    columns_info = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    versions = relationship("DatasetVersion", back_populates="dataset", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="dataset", cascade="all, delete-orphan")
    transformations = relationship("TransformationConfig", back_populates="dataset", cascade="all, delete-orphan")


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("dataset_records.id"), nullable=False, index=True)
    version_tag = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=False)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    transformation_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("DatasetRecord", back_populates="versions")


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("dataset_records.id"), nullable=False, index=True)
    analysis_type = Column(String(50), default="EDA")  # EDA, QUALITY, PCA, CORRELATION
    summary = Column(Text, nullable=True)
    results_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    dataset = relationship("DatasetRecord", back_populates="analysis_runs")


class TransformationConfig(Base):
    __tablename__ = "transformation_configs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("dataset_records.id"), nullable=False, index=True)
    config_name = Column(String(100), nullable=False)
    config_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("DatasetRecord", back_populates="transformations")


class TrainingExperiment(Base):
    __tablename__ = "training_experiments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(String(64), unique=True, index=True, nullable=False)
    dataset_name = Column(String(150), nullable=False)
    dataset_version = Column(String(50), default="v1.0")
    algorithm = Column(String(100), nullable=False)
    scaler_type = Column(String(50), default="StandardScaler")
    pca_enabled = Column(Integer, default=0)
    pca_components = Column(Integer, default=0)
    hyperparameters = Column(JSON, nullable=True)
    features_used = Column(JSON, nullable=True)
    target_column = Column(String(100), default="communication_quality")
    test_size = Column(Float, default=0.2)
    random_seed = Column(Integer, default=42)
    
    # Evaluation metrics
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    confusion_matrix = Column(JSON, nullable=True)
    classification_report = Column(JSON, nullable=True)
    feature_importances = Column(JSON, nullable=True)
    pca_explained_variance = Column(JSON, nullable=True)
    
    artifact_path = Column(String(500), nullable=False)
    is_active = Column(Integer, default=0)  # 1 = active production model
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(64), unique=True, index=True, nullable=False)
    pipeline_type = Column(String(50), default="ML_LIFECYCLE")  # ML_LIFECYCLE, TRANSCEIVER
    current_stage = Column(String(50), nullable=False)
    status = Column(String(50), default="COMPLETED")  # PENDING, RUNNING, COMPLETED, FAILED
    stages_data = Column(JSON, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

