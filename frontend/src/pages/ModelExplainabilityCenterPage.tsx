import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Info,
  Layers,
  Activity,
  CheckCircle2,
  TrendingUp,
  Sliders,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { mlApi } from '../services/api';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const ModelExplainabilityCenterPage: React.FC<Props> = ({ onNavigate }) => {
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    mlApi.getModelsInfo().then((res) => {
      setModelInfo(res);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const commM = modelInfo?.communication_quality_model;
  const featureData = commM
    ? Object.entries(commM.feature_importances || {}).slice(0, 8).map(([k, v]) => ({
        name: k.replace(/_/g, ' '),
        value: parseFloat(((v as number) * 100).toFixed(2)),
      }))
    : [
        { name: 'snr', value: 35.0 },
        { name: 'ber', value: 30.0 },
        { name: 'packet loss', value: 20.0 },
        { name: 'signal strength', value: 10.0 },
        { name: 'latency ms', value: 5.0 },
      ];

  const ruleExplanations = [
    {
      quality: 'Excellent',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: 'bg-emerald-600 text-white',
      conditions: 'SNR ≥ 20 dB, BER < 10⁻⁴, Packet Loss < 0.5%, Latency < 40ms',
      explanation: 'Optimal RF propagation channel with high link margin. Capable of supporting high-bitrate Indic speech streams without degradation.',
    },
    {
      quality: 'Good',
      color: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      badge: 'bg-cyan-600 text-white',
      conditions: 'SNR 14–20 dB, BER 10⁻⁴–10⁻³, Packet Loss < 2%, Latency 40–80ms',
      explanation: 'Stable digital communication link. Maintain standard QPSK modulation and regular beacon telemetry pings.',
    },
    {
      quality: 'Moderate',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'bg-amber-600 text-white',
      conditions: 'SNR 8–14 dB, BER 10⁻³–10⁻², Packet Loss 2–8%, Latency 80–150ms',
      explanation: 'Elevated multi-path fading or atmospheric interference. Recommends shifting from QPSK to robust BPSK modulation scheme.',
    },
    {
      quality: 'Poor',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      badge: 'bg-rose-600 text-white',
      conditions: 'SNR < 8 dB, BER > 10⁻², Packet Loss > 8%, Latency > 150ms',
      explanation: 'Critical link degradation approaching threshold dropout. Increase transmit amplifier gain, lower carrier frequency, or trigger retransmission protocol.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="model-monitoring" onSelectStage={onNavigate} />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Model Explainability Center</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interpretability & Physics Rules
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Feature attribution, physics-based decision logic, and neural transceiver link quality boundary explanations.
          </p>
        </div>
      </div>

      {/* Feature Importance Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              Global Feature Importance (Gini Impurity Reduction)
            </h3>
            <p className="text-xs text-slate-500">Relative contribution of each telecommunication parameter in predicting link state.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '11px' }}
                  formatter={(v: any) => [`${v}%`, 'Importance Weight']}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Importance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-800">Key Interpretability Takeaways:</div>
            <ul className="space-y-1.5 text-slate-600 text-xs">
              <li className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                <span className="font-bold font-mono text-indigo-600 shrink-0">SNR (35%):</span>
                <span>Signal-to-Noise Ratio is the primary predictor of channel symbol detectability and signal demodulation accuracy.</span>
              </li>
              <li className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                <span className="font-bold font-mono text-indigo-600 shrink-0">BER (30%):</span>
                <span>Bit Error Rate reflects discrete transmission corrupted bits prior to error-correcting codes.</span>
              </li>
              <li className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                <span className="font-bold font-mono text-indigo-600 shrink-0">Packet Loss (20%):</span>
                <span>Indicates complete transmission burst dropouts requiring ARQ buffer retransmissions.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Decision Rules Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              Physics-Calibrated Decision Boundaries
            </h3>
            <p className="text-xs text-slate-500">Domain telemetry rules mapping channel characteristics to operational classifications.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ruleExplanations.map((r) => (
            <div key={r.quality} className={`p-4 rounded-2xl border ${r.color} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${r.badge}`}>{r.quality} Link</span>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">IEEE 802.11 / RF Calibrated</span>
              </div>
              <div className="font-mono text-[11px] font-bold bg-white/80 p-2 rounded-lg border border-slate-200/60">
                {r.conditions}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700">{r.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
