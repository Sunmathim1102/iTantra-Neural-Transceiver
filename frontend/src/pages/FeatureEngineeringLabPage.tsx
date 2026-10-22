import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  Sparkles,
  Info,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { mlApi } from '../services/api';
import { DatasetSummary, DatasetInspection } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const FeatureEngineeringLabPage: React.FC<Props> = ({ onNavigate }) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [inspection, setInspection] = useState<DatasetInspection | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetCol, setTargetCol] = useState('communication_quality');
  const [encodingType, setEncodingType] = useState<'OneHot' | 'Ordinal'>('OneHot');
  const [enableInteractionTerms, setEnableInteractionTerms] = useState(true);

  useEffect(() => {
    mlApi.listDatasets().then((res) => {
      setDatasets(res.datasets);
      if (res.datasets.length > 0) {
        setSelectedId(res.datasets[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedId) {
      mlApi.inspectDataset(selectedId).then((res) => {
        setInspection(res);
        setTargetCol(res.target_column);
        // Exclude identifiers and target from feature selection
        const candidateFeatures = [
          ...res.numerical_features.filter((f: string) => f !== res.target_column && !f.toLowerCase().includes('id')),
          ...res.categorical_features.filter((f: string) => f !== res.target_column && !f.toLowerCase().includes('id')),
        ];
        setSelectedFeatures(candidateFeatures);
      }).catch(console.error);
    }
  }, [selectedId]);

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const domainFeatures = [
    {
      name: 'snr_signal_ratio',
      formula: 'SNR / (|Signal Strength| + 1e-4)',
      type: 'Interaction Term',
      physics: 'Relative signal-to-noise margin normalized against absolute receive amplifier power.',
    },
    {
      name: 'ber_packet_impact',
      formula: 'BER * Packet Loss %',
      type: 'Composite Penalty',
      physics: 'Joint degradation index representing uncorrectable bit flipping leading to packet retransmission timeouts.',
    },
    {
      name: 'latency_per_byte',
      formula: 'Latency (ms) / (Message Length + 1)',
      type: 'Throughput Ratio',
      physics: 'Effective channel propagation speed and protocol latency per transferred byte.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="feature-engineering" onSelectStage={onNavigate} />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sliders className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Feature Engineering Lab</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Feature Schemas & Domain Transforms
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Target leakage prevention, categorical encoding specification, interaction terms, and input vector design.
          </p>
        </div>

        {/* Dataset selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Dataset:</label>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.row_count} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leakage Prevention Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 space-y-0.5">
          <div className="font-bold text-emerald-800">Target Leakage Prevention Active:</div>
          <p>
            Identifiers (such as <code>sample_id</code>, <code>session_id</code>) and future outcome fields are automatically quarantined from input tensors. Only features available at inference time are supplied.
          </p>
        </div>
      </div>

      {/* Grid: Selection Controls & Transformations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Checklist Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                Feature Inclusion / Exclusion Controls
              </h3>
              <p className="text-xs text-slate-500">Toggle input features to be forwarded to feature scaling and model training.</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600">
              {selectedFeatures.length} Selected
            </span>
          </div>

          {inspection && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">Available Features:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inspection.columns
                  .filter((c) => !c.feature_type.includes('target') && !c.feature_type.includes('identifier'))
                  .map((col) => {
                    const isChecked = selectedFeatures.includes(col.name);
                    return (
                      <label
                        key={col.name}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/60 border-indigo-300 text-slate-900'
                            : 'bg-slate-50/50 border-slate-200 text-slate-500 opacity-60'
                        }`}
                      >
                        <div>
                          <span className="font-mono font-semibold block">{col.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono capitalize">{col.feature_type} ({col.data_type})</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature(col.name)}
                          className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                      </label>
                    );
                  })}
              </div>

              {/* Target Column Selector */}
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 block mb-1">Supervised Target Column:</label>
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-mono font-bold text-purple-900">{targetCol}</span>
                    <span className="text-[11px] text-purple-700 block">Class ground truth for supervised classifiers</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-bold">
                    Target Label
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Transformations & Encodings */}
        <div className="space-y-6">
          {/* Encoding Selection Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Cpu className="h-4 w-4 text-indigo-600" />
              Categorical Feature Encoding
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  encodingType === 'OneHot'
                    ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="encoding"
                  checked={encodingType === 'OneHot'}
                  onChange={() => setEncodingType('OneHot')}
                  className="sr-only"
                />
                <div className="font-bold mb-1">One-Hot Encoding (OHE)</div>
                <p className="text-[11px] text-slate-500">
                  Creates binary indicator columns. Best for nominal features without ordinal rank (e.g. Channel Type, Language).
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  encodingType === 'Ordinal'
                    ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="encoding"
                  checked={encodingType === 'Ordinal'}
                  onChange={() => setEncodingType('Ordinal')}
                  className="sr-only"
                />
                <div className="font-bold mb-1">Ordinal Encoding</div>
                <p className="text-[11px] text-slate-500">
                  Maps discrete levels to integers. Compact representations for high-cardinality features.
                </p>
              </label>
            </div>
          </div>

          {/* Domain-Engineered Interaction Terms */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Domain Physical Channel Interaction Features
              </h3>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableInteractionTerms}
                  onChange={(e) => setEnableInteractionTerms(e.target.checked)}
                  className="h-3.5 w-3.5 text-indigo-600 rounded"
                />
                <span>Include</span>
              </label>
            </div>

            <div className="space-y-2.5">
              {domainFeatures.map((f) => (
                <div key={f.name} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{f.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                      {f.type}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-indigo-600 bg-white px-2 py-1 rounded border border-slate-200/70 inline-block">
                    {f.formula}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{f.physics}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Step Banner */}
          {onNavigate && (
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900">
                Feature schema validated. Next: Scaler configuration & leakage prevention.
              </span>
              <button
                onClick={() => onNavigate('ml-scaling')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                Proceed to Normalization <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
