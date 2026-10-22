import axios from 'axios';
import {
  User,
  TransceiverPipelineResponse,
  PaginatedSessions,
  AnalyticsOverview,
  DemoSample,
  STTResult,
  TTSResult,
  NLPResult,
  TranslationResult,
  RadioResult,
  MLQualityResult
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('itantra_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const pipelineApi = {
  executePipeline: async (formData: FormData): Promise<TransceiverPipelineResponse> => {
    const res = await api.post('/sessions/pipeline', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  runPipeline: async (params: {
    audioBlob?: Blob;
    textInput?: string;
    targetLanguage: string;
    snrDb: number;
    channelType: string;
    modulation: string;
    carrierFreqGhz: number;
  }): Promise<TransceiverPipelineResponse> => {
    const formData = new FormData();
    if (params.audioBlob) {
      formData.append('audio_file', params.audioBlob, 'recorded_audio.wav');
    }
    if (params.textInput) {
      formData.append('text_input', params.textInput);
    }
    formData.append('target_language', params.targetLanguage);
    formData.append('snr_db', params.snrDb.toString());
    formData.append('channel_type', params.channelType);
    formData.append('modulation', params.modulation);
    formData.append('carrier_freq_ghz', params.carrierFreqGhz.toString());
    return pipelineApi.executePipeline(formData);
  },
};

export const speechApi = {
  transcribeAudio: async (audioBlob: Blob, hintLanguage?: string): Promise<STTResult> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    if (hintLanguage) formData.append('hint_language', hintLanguage);
    const res = await api.post('/speech/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  synthesizeText: async (text: string, language: string = 'en', slow: boolean = false): Promise<TTSResult> => {
    const res = await api.post('/speech/synthesize', { text, language, slow });
    return res.data;
  },
};

export const nlpApi = {
  detectLanguage: async (text: string) => {
    const res = await api.post('/nlp/detect-language', { text });
    return res.data;
  },
  analyzeIntent: async (text: string): Promise<NLPResult> => {
    const res = await api.post('/nlp/analyze', { text });
    return res.data;
  },
};

export const translationApi = {
  translate: async (text: string, sourceLang: string = 'auto', targetLang: string = 'hi'): Promise<TranslationResult> => {
    const res = await api.post('/translation/translate', {
      text,
      source_language: sourceLang,
      target_language: targetLang,
    });
    return res.data;
  },
};

export const radioApi = {
  simulate: async (params: {
    message: string;
    snr: number;
    carrier_frequency?: number;
    sampling_rate?: number;
    bit_rate?: number;
    channel_type?: string;
    modulation?: string;
  }): Promise<RadioResult> => {
    const res = await api.post('/radio/simulate', params);
    return res.data;
  },
};

export const mlApi = {
  predictQuality: async (params: {
    snr: number;
    ber: number;
    latency_ms: number;
    packet_loss: number;
    signal_strength: number;
    message_length?: number;
    audio_duration?: number;
    channel_type?: string;
    language?: string;
  }): Promise<MLQualityResult> => {
    const res = await api.post('/ml/predict-quality', params);
    return res.data;
  },
  getModelsInfo: async () => {
    const res = await api.get('/ml/models');
    return res.data;
  },
  getDatasetPreview: async () => {
    const res = await api.get('/ml/dataset/preview');
    return res.data;
  },
  listDatasets: async () => {
    const res = await api.get('/ml/datasets');
    return res.data;
  },
  uploadDataset: async (formData: FormData) => {
    const res = await api.post('/ml/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  inspectDataset: async (datasetId: number) => {
    const res = await api.get(`/ml/datasets/${datasetId}/inspection`);
    return res.data;
  },
  runEDA: async (datasetId: number) => {
    const res = await api.post(`/ml/datasets/${datasetId}/eda`);
    return res.data;
  },
  cleanDataset: async (datasetId: number, options: any) => {
    const res = await api.post(`/ml/datasets/${datasetId}/clean`, options);
    return res.data;
  },
  runScalingAnalysis: async (datasetId: number, options: any) => {
    const res = await api.post(`/ml/datasets/${datasetId}/scale-analysis`, options);
    return res.data;
  },
  runPCAAnalysis: async (datasetId: number, options: any) => {
    const res = await api.post(`/ml/datasets/${datasetId}/pca-analysis`, options);
    return res.data;
  },
  trainModel: async (params: any) => {
    const res = await api.post('/ml/train', params);
    return res.data;
  },
  getExperiments: async () => {
    const res = await api.get('/ml/experiments');
    return res.data;
  },
  activateExperiment: async (experimentId: string) => {
    const res = await api.post(`/ml/experiments/${experimentId}/activate`);
    return res.data;
  },
  getWorkflowStatus: async () => {
    const res = await api.get('/ml/lifecycle/workflow-status');
    return res.data;
  },
  getDatasetDownloadUrl: (datasetId: number) => `/api/ml/datasets/${datasetId}/download`
};

export const sessionsApi = {
  listSessions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    language?: string;
    intent?: string;
  }): Promise<PaginatedSessions> => {
    const res = await api.get('/sessions', { params });
    return res.data;
  },
  getSessionDetails: async (sessionId: string) => {
    const res = await api.get(`/sessions/${sessionId}`);
    return res.data;
  },
  deleteSession: async (sessionId: string) => {
    const res = await api.delete(`/sessions/${sessionId}`);
    return res.data;
  },
};

export const analyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },
  getHealth: async () => {
    const res = await api.get('/analytics/health');
    return res.data;
  },
};

export const demoApi = {
  getSamples: async (): Promise<{ description: string; samples: DemoSample[] }> => {
    const res = await api.get('/demo/samples');
    return res.data;
  },
};

export const adminApi = {
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  getLogs: async () => {
    const res = await api.get('/admin/logs');
    return res.data;
  },
  resetDemoData: async () => {
    const res = await api.post('/admin/reset-demo-data');
    return res.data;
  },
};

export default api;
