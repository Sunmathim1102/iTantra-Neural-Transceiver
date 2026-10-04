export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface STTResult {
  transcript: string;
  detected_language: string;
  language_code: string;
  language_confidence: number;
  stt_confidence: number;
  audio_duration: number;
  processing_time_ms: number;
  audio_url?: string;
  audio_metrics?: {
    sampling_rate: number;
    channels: number;
    rms_energy: number;
    peak_amplitude: number;
    estimated_snr: number;
    waveform_envelope: number[];
  };
}

export interface NLPResult {
  intent: string;
  confidence: number;
  all_intent_scores: Record<string, number>;
  sentiment: string;
  sentiment_score: number;
  token_count: number;
  char_count: number;
  keywords: string[];
  processing_time_ms: number;
}

export interface TranslationResult {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  translation_time_ms: number;
}

export interface RadioResult {
  snr: number;
  ber: number;
  theoretical_ber: number;
  latency_ms: number;
  packet_loss: number;
  signal_strength_dbm: number;
  channel_condition: string;
  transmission_status: string;
  bit_count: number;
  error_bits: number;
  waveform_original: number[];
  waveform_noisy: number[];
  waveform_demodulated: number[];
  constellation_points: Array<{ i: number; q: number }>;
  processing_time_ms: number;
}

export interface MLQualityResult {
  predicted_quality: string;
  confidence: number;
  class_probabilities: Record<string, number>;
  feature_importance: Record<string, number>;
  recommendation: string;
  model_version: string;
  inference_time_ms?: number;
}

export interface TTSResult {
  audio_filename: string;
  audio_url: string;
  file_path: string;
  language: string;
  text_length: number;
  audio_duration: number;
  file_size_bytes: number;
  generation_time_ms: number;
}

export interface TransceiverPipelineResponse {
  session_id: string;
  status: string;
  stt_result?: STTResult;
  detected_language_info: {
    language: string;
    language_code: string;
    confidence: number;
    script: string;
  };
  nlp_result: NLPResult;
  translation_result?: TranslationResult;
  radio_result: RadioResult;
  ml_quality_result: MLQualityResult;
  tts_result?: TTSResult;
  total_pipeline_time_ms: number;
  created_at: string;
}

export interface SessionSummary {
  id: number;
  session_id: string;
  user_id: number;
  user_name?: string;
  detected_language?: string;
  transcript?: string;
  translated_text?: string;
  intent?: string;
  intent_confidence?: number;
  sentiment?: string;
  snr?: number;
  ber?: number;
  latency_ms?: number;
  packet_loss?: number;
  quality_prediction?: string;
  transmission_status?: string;
  created_at: string;
}

export interface PaginatedSessions {
  total: number;
  page: number;
  limit: number;
  sessions: SessionSummary[];
}

export interface AnalyticsOverview {
  total_sessions: number;
  today_sessions: number;
  supported_languages_count: number;
  avg_stt_confidence: number;
  avg_latency_ms: number;
  avg_snr_db: number;
  avg_ber: number;
  sessions_timeline: Array<{ date: string; sessions: number; avg_snr: number; avg_ber: number }>;
  language_distribution: Array<{ name: string; value: number }>;
  intent_distribution: Array<{ name: string; value: number }>;
  sentiment_distribution: Array<{ name: string; value: number }>;
  quality_distribution: Array<{ name: string; value: number }>;
  channel_metrics: Array<{ channel: string; avg_snr: number; avg_ber: number; packet_loss: number; count: number }>;
  recent_alerts: Array<{ id: number; action: string; details: string; level: string; timestamp: string }>;
}

export interface DemoSample {
  id: string;
  language: string;
  language_code: string;
  text: string;
  suggested_target: string;
  default_snr: number;
  channel_type: string;
  modulation: string;
  expected_intent: string;
}
