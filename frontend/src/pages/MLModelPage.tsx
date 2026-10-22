import React, { useState, useEffect } from 'react';
import {
  Zap,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { mlApi } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

const getQualityStyle = (q: string) => {
  if (q === 'Excellent') return { box: 'bg-emerald-50 border-emerald-200 text-emerald-800', badge: 'bg-emerald-600 text-white', text: 'text-emerald-700' };
  if (q === 'Good') return { box: 'bg-cyan-50 border-cyan-200 text-cyan-800', badge: 'bg-cyan-600 text-white', text: 'text-cyan-700' };
  if (q === 'Moderate') return { box: 'bg-amber-50 border-amber-200 text-amber-800', badge: 'bg-amber-600 text-white', text: 'text-amber-700' };
  return { box: 'bg-rose-50 border-rose-200 text-rose-800', badge: 'bg-rose-600 text-white', text: 'text-rose-700' };
};

export const MLModelPage: React.FC<Props> = ({ onNavigate }) => {
  const [modelsInfo, setModelsInfo] = useState<any>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [predInput, setPredInput] = useState({
    snr: 22.0,
    ber: 0.0001,
    latency_ms: 28.0,
    packet_loss: 0.0,
    signal_strength: -58.0,
    message_length: 50,
    audio_duration: 3.5,
    channel_type: 'AWGN',
    language: 'hi'
  });
  const [predResult, setPredResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadModels = () => {
    setModelsLoading(true);
    mlApi.getModelsInfo().then(setModelsInfo).catch(console.error).finally(() => setModelsLoading(false));
  };

  useEffect(() => {
    loadModels();
  }, []);

  const predict = async () => {
    setLoading(true);
    try {
      const res = await mlApi.predictQuality(predInput);
      setPredResult(res);
    } catch (e: any) {
      alert('Prediction failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  const intentM = modelsInfo?.intent_classification_model;
  const commM = modelsInfo?.communication_quality_model;
  const activeReg = modelsInfo?.active_registered_model;
  const featureData = commM
    ? Object.entries(commM.feature_importances || {}).slice(0, 8).map(([k, v]) => ({
        name: k.replace(/_/g, ' '),
        value: parseFloat(((v as number) * 100).toFixed(2))
      }))
    : [];

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="prediction" onSelectStage={onNavigate} />

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Zap className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Intelligence Inference Center</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Neural Transceiver Prediction
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time inference using active trained model artifact, passing physics features through fitted normalization and PCA pipelines.
          </p>
        </div>

        {activeReg && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500">Active Model:</span>
            <span className="font-semibold text-slate-900">{activeReg.algorithm}</span>
            <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
              {(activeReg.accuracy * 100).toFixed(1)}% Acc
            </span>
          </div>
        )}
      </div>

      {/* Active Model Architecture Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intent Model Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-600" />
              1. NLP Intent Classification Engine
            </h2>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              93.3% Accuracy
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              ['Algorithm', intentM?.algorithm?.split('(')[0]?.trim() || 'Multinomial LogReg'],
              ['Vocab Vectorizer', 'TF-IDF (Sublinear)'],
              ['Classes', intentM?.classes?.length || 6],
              ['F1-Score', `${((intentM?.f1_score || 0.93) * 100).toFixed(1)}%`],
            ].map(([lbl, val]) => (
              <div key={String(lbl)} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400 text-[10px]">{lbl}</div>
                <div className="text-slate-800 font-bold font-mono text-xs mt-0.5">{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Comm Quality Model Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              2. Communication Quality Classifier
            </h2>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {activeReg ? `${(activeReg.accuracy * 100).toFixed(1)}% Acc` : '98.4% Acc'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              ['Algorithm', activeReg ? activeReg.algorithm : 'Random Forest (100 Trees)'],
              ['Scaler Pipeline', activeReg ? activeReg.scaler_type : 'StandardScaler'],
              ['PCA Status', activeReg?.pca_enabled ? `Active (${activeReg.pca_components} Comp)` : 'Passthrough'],
              ['Link Classes', '4 Quality Grades'],
            ].map(([lbl, val]) => (
              <div key={String(lbl)} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400 text-[10px]">{lbl}</div>
                <div className="text-slate-800 font-bold font-mono text-xs mt-0.5">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Importance Visualizer */}
      {featureData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              Telemetry Feature Importance (Gini Weight)
            </h3>
            <span className="text-[11px] text-slate-400">Physics Calibrated</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }} formatter={(v: any) => `${v}%`} />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Importance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Live Inference Form & Output */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-600" />
              Live Inference Simulator (Pass RF Telemetry Parameters)
            </h3>
            <p className="text-xs text-slate-500">Provide real-world or simulated transceiver values to evaluate predicted link quality.</p>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {[
            { key: 'snr', label: 'SNR (dB)', step: 0.5 },
            { key: 'ber', label: 'BER (Bit Error)', step: 0.0001 },
            { key: 'latency_ms', label: 'Latency (ms)', step: 1 },
            { key: 'packet_loss', label: 'Packet Loss (%)', step: 0.1 },
            { key: 'signal_strength', label: 'Signal (dBm)', step: 1 },
            { key: 'message_length', label: 'Message Length', step: 5 },
          ].map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-slate-600 font-medium block text-[11px]">{f.label}</label>
              <input
                type="number"
                step={f.step}
                value={(predInput as any)[f.key]}
                onChange={(e) => setPredInput({ ...predInput, [f.key]: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>

        {/* Predict Action */}
        <div className="flex items-center gap-4">
          <button
            onClick={predict}
            disabled={loading}
            className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            <span>{loading ? 'Executing Pipeline Inference...' : '⚡ Predict Communication Quality'}</span>
          </button>
        </div>

        {/* Prediction Results Banner */}
        {predResult && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            {(() => {
              const s = getQualityStyle(predResult.predicted_quality);
              return (
                <div className={`p-6 rounded-2xl border ${s.box} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.badge}`}>
                        Prediction Result
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Model: {predResult.model_version}
                      </span>
                    </div>
                    <div className={`text-3xl font-extrabold mt-1 ${s.text}`}>
                      {predResult.predicted_quality} Channel Quality
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl">
                      {predResult.recommendation}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 font-semibold uppercase">Confidence</div>
                    <div className="text-3xl font-extrabold font-mono text-slate-900">
                      {(predResult.confidence * 100).toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{predResult.inference_time_ms} ms</span>
                  </div>
                </div>
              );
            })()}

            {/* Class Probabilities Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(predResult.class_probabilities || {}).map(([cls, prob]) => (
                <div key={cls} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs">
                  <div className="text-slate-500 mb-1 font-semibold">{cls}</div>
                  <div className="font-bold text-slate-900 font-mono text-base">{((prob as number) * 100).toFixed(1)}%</div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${(prob as number) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
