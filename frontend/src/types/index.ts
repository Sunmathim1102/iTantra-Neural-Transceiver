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

// ----------------- ML Lifecycle Types -----------------
export interface DatasetSummary {
  id: number;
  name: string;
  filename: string;
  file_size_bytes: number;
  file_size_kb: number;
  row_count: number;
  column_count: number;
  target_column: string;
  is_synthetic: boolean;
  is_active: boolean;
  description?: string;
  columns_info?: Record<string, string>;
  created_at: string;
  updated_at: string;
  version_count: number;
}

export interface ColumnInspection {
  name: string;
  data_type: string;
  feature_type: string;
  missing_count: number;
  missing_percentage: number;
  infinite_count: number;
  unique_count: number;
  sample_values: string[];
}

export interface DatasetInspection {
  dataset_id: number;
  name: string;
  filename: string;
  file_size_bytes: number;
  total_rows: number;
  total_columns: number;
  numerical_features: string[];
  categorical_features: string[];
  identifier_features: string[];
  target_column: string;
  completeness_percentage: number;
  duplicate_rows: number;
  missing_cells: number;
  columns: ColumnInspection[];
  warnings: string[];
  head_records: Array<Record<string, any>>;
  versions: Array<{ id: number; tag: string; rows: number; summary: string; created_at: string }>;
}

export interface EDAResults {
  dataset_id: number;
  dataset_name: string;
  total_rows: number;
  total_columns: number;
  completeness_percentage: number;
  duplicate_rows: number;
  numerical_features_count: number;
  categorical_features_count: number;
  numerical_statistics: Record<string, {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
    iqr: number;
    skewness: number;
    outlier_count: number;
    outlier_percentage: number;
  }>;
  categorical_statistics: Record<string, {
    unique_count: number;
    top_value: string;
    top_frequency: number;
    distribution: Array<{ category: string; count: number; percentage: number }>;
    rare_categories_count: number;
    rare_categories: string[];
  }>;
  histograms: Record<string, Array<{ bin: string; count: number; mid: number }>>;
  box_plots: Record<string, {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    lower_bound: number;
    upper_bound: number;
    outlier_count: number;
  }>;
  correlation_matrix: Record<string, Record<string, number>>;
  top_correlations: Array<{ feature1: string; feature2: string; correlation: number; abs_correlation: number }>;
  target_distribution: Array<{ class: string; count: number; percentage: number }>;
  scatter_features: { x: string; y: string };
  scatter_sample: Array<{ x: number; y: number; target: string }>;
  analyzed_at: string;
}

export interface CleaningResult {
  original_rows: number;
  original_columns: number;
  cleaned_rows: number;
  cleaned_columns: number;
  operations_applied: string[];
  preview_samples: Array<Record<string, any>>;
  is_preview: boolean;
  version_tag?: string;
}

export interface ScalingComparison {
  feature: string;
  original_mean: number;
  original_std: number;
  original_range: string;
  scaled_train_mean: number;
  scaled_train_std: number;
  scaled_train_range: string;
  scaled_test_mean: number;
  scaled_test_std: number;
}

export interface ScalingResult {
  scaler_type: string;
  train_samples: number;
  test_samples: number;
  scaled_features: string[];
  leakage_prevention: string;
  comparisons: ScalingComparison[];
  distribution_comparison: {
    feature: string;
    bins: Array<{ bin_index: number; original_label: string; original_count: number; scaled_label: string; scaled_count: number }>;
  };
  preview_transformed_head: Array<Record<string, any>>;
}

export interface PCAResult {
  n_components: number;
  original_dimensions: number;
  reduced_dimensions: number;
  total_variance_preserved_pct: number;
  explained_variance_ratio: number[];
  cumulative_variance_ratio: number[];
  scree_plot: Array<{ component: string; explained_variance: number; cumulative_variance: number }>;
  feature_loadings: Array<Record<string, any>>;
  projections_sample: Array<{ pc1: number; pc2: number; pc3?: number; target: string }>;
  selected_features: string[];
  scientific_interpretation: {
    purpose: string;
    variance_preserved: string;
    variance_lost: string;
    guidance: string;
  };
}

export interface TrainingResult {
  experiment_id: string;
  algorithm: string;
  scaler_type: string;
  pca_enabled: boolean;
  pca_components: number;
  train_samples: number;
  test_samples: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_time_ms: number;
  confusion_matrix: number[][];
  classes: string[];
  classification_report: Record<string, any>;
  feature_importances: Record<string, number>;
  pca_explained_variance?: number[];
  artifact_path: string;
  status: string;
}

export interface ExperimentRecord {
  id: number;
  experiment_id: string;
  dataset_name: string;
  dataset_version: string;
  algorithm: string;
  scaler_type: string;
  pca_enabled: boolean;
  pca_components: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix?: number[][];
  classification_report?: Record<string, any>;
  feature_importances?: Record<string, number>;
  pca_explained_variance?: number[];
  is_active: boolean;
  created_at: string;
}

export interface LifecycleWorkflowStage {
  id: string;
  name: string;
  category: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'FAILED';
  summary: string;
}

export interface LifecycleWorkflowStatus {
  pipeline_name: string;
  stages: LifecycleWorkflowStage[];
  total_stages: number;
  completed_stages: number;
  active_stages: number;
  active_model: {
    algorithm: string;
    accuracy: number;
    f1_score: number;
    experiment_id: string;
  };
}

