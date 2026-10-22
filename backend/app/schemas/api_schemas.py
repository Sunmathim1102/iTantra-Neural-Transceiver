import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth Schemas -----------------
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = "USER"

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime.datetime

# ----------------- Speech Schemas -----------------
class STTResponse(BaseModel):
    transcript: str
    detected_language: str
    language_confidence: float
    stt_confidence: float
    audio_duration: float
    processing_time_ms: float
    audio_url: Optional[str] = None

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: str = "en"
    slow: bool = False

class TTSResponse(BaseModel):
    audio_url: str
    language: str
    text_length: int
    audio_duration: float
    generation_time_ms: float

# ----------------- NLP & Intent Schemas -----------------
class LanguageDetectRequest(BaseModel):
    text: str = Field(..., min_length=1)

class LanguageDetectResponse(BaseModel):
    language: str
    language_code: str
    confidence: float
    script: str
    processing_time_ms: float
    supported_languages: List[Dict[str, str]]

class IntentAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1)

class IntentAnalyzeResponse(BaseModel):
    intent: str
    confidence: float
    all_intent_scores: Dict[str, float]
    sentiment: str
    sentiment_score: float
    token_count: int
    char_count: int
    keywords: List[str]
    processing_time_ms: float

# ----------------- Translation Schemas -----------------
class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source_language: str = "auto"
    target_language: str = "hi"

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    translation_time_ms: float

# ----------------- Radio Simulation Schemas -----------------
class RadioSimulationRequest(BaseModel):
    message: str = "iTantra Transceiver Active"
    snr: float = Field(15.0, ge=-10.0, le=40.0)  # dB
    carrier_frequency: float = 2.4  # GHz
    sampling_rate: float = 44100.0  # Hz
    bit_rate: float = 128.0  # kbps
    channel_type: str = "AWGN"  # AWGN, Rayleigh, Rician
    modulation: str = "BPSK"  # BPSK, QPSK, 16QAM

class RadioSimulationResponse(BaseModel):
    snr: float
    ber: float
    theoretical_ber: float
    latency_ms: float
    packet_loss: float
    signal_strength_dbm: float
    channel_condition: str  # "Excellent", "Good", "Degraded", "Critical"
    transmission_status: str  # "SUCCESS", "DEGRADED", "FAILED"
    bit_count: int
    error_bits: int
    waveform_original: List[float]
    waveform_noisy: List[float]
    waveform_demodulated: List[float]
    constellation_points: List[Dict[str, float]]
    processing_time_ms: float

# ----------------- ML Quality Prediction Schemas -----------------
class MLQualityPredictRequest(BaseModel):
    snr: float
    ber: float
    latency_ms: float
    packet_loss: float
    signal_strength: float
    message_length: int = 50
    audio_duration: float = 3.5
    channel_type: str = "AWGN"
    language: str = "hi"

class MLQualityPredictResponse(BaseModel):
    predicted_quality: str  # Excellent, Good, Moderate, Poor
    confidence: float
    class_probabilities: Dict[str, float]
    feature_importance: Dict[str, float]
    recommendation: str
    model_version: str

# ----------------- Full Pipeline Transceiver Session Schemas -----------------
class TransceiverPipelineRequest(BaseModel):
    text: Optional[str] = None
    target_language: Optional[str] = "en"
    snr: float = 18.0
    channel_type: str = "AWGN"
    modulation: str = "BPSK"
    is_demo: bool = False

class TransceiverPipelineResponse(BaseModel):
    session_id: str
    status: str
    stt_result: Optional[STTResponse] = None
    nlp_result: IntentAnalyzeResponse
    translation_result: Optional[TranslateResponse] = None
    radio_result: RadioSimulationResponse
    ml_quality_result: MLQualityPredictResponse
    tts_result: Optional[TTSResponse] = None
    total_pipeline_time_ms: float
    created_at: datetime.datetime

# ----------------- History & Session Details Schemas -----------------
class SessionSummary(BaseModel):
    id: int
    session_id: str
    user_id: int
    user_name: Optional[str] = None
    detected_language: Optional[str] = None
    transcript: Optional[str] = None
    translated_text: Optional[str] = None
    intent: Optional[str] = None
    intent_confidence: Optional[float] = None
    sentiment: Optional[str] = None
    snr: Optional[float] = None
    ber: Optional[float] = None
    latency_ms: Optional[float] = None
    packet_loss: Optional[float] = None
    quality_prediction: Optional[str] = None
    transmission_status: Optional[str] = None
    created_at: datetime.datetime

class PaginatedSessionsResponse(BaseModel):
    total: int
    page: int
    limit: int
    sessions: List[SessionSummary]

# ----------------- Analytics & Health -----------------
class AnalyticsOverviewResponse(BaseModel):
    total_sessions: int
    today_sessions: int
    supported_languages_count: int
    avg_stt_confidence: float
    avg_latency_ms: float
    avg_snr_db: float
    avg_ber: float
    sessions_timeline: List[Dict[str, Any]]
    language_distribution: List[Dict[str, Any]]
    intent_distribution: List[Dict[str, Any]]
    sentiment_distribution: List[Dict[str, Any]]
    quality_distribution: List[Dict[str, Any]]
    channel_metrics: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]

class SystemHealthResponse(BaseModel):
    status: str
    database_status: str
    stt_engine: str
    tts_engine: str
    ml_models_loaded: bool
    nlp_intent_model: str
    comm_quality_model: str
    uptime_seconds: float
    system_time: datetime.datetime

# ----------------- ML Lifecycle Schemas -----------------
class CleanDatasetRequest(BaseModel):
    remove_duplicates: bool = True
    impute_numeric: str = "median"
    impute_categorical: str = "mode"
    outlier_strategy: str = "clip"
    drop_constant_features: bool = True
    preview_only: bool = True

class ScaleAnalysisRequest(BaseModel):
    scaler_type: str = "StandardScaler"
    features: Optional[List[str]] = None

class PCAnalysisRequest(BaseModel):
    n_components: int = 2
    features: Optional[List[str]] = None
    scale_first: bool = True

class TrainModelRequest(BaseModel):
    dataset_id: int
    algorithm: str = "Random Forest"
    scaler_type: str = "StandardScaler"
    pca_enabled: bool = False
    pca_components: int = 2
    test_size: float = 0.2
    random_seed: int = 42
    hyperparameters: Optional[Dict[str, Any]] = None
    selected_features: Optional[List[str]] = None

