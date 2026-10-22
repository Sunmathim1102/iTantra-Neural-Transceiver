import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  BarChart2,
  Table,
  Info,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { mlApi } from '../services/api';
import { ScalingResult, DatasetSummary } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const FeatureNormalizationStudioPage: React.FC<Props> = ({ onNavigate }) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scalerType, setScalerType] = useState('StandardScaler');
  const [scalingResult, setScalingResult] = useState<ScalingResult | null>(null);
  const [loading, setLoading] = useState(false);

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
      runScaling(selectedId, scalerType);
    }
  }, [selectedId, scalerType]);

  const runScaling = async (id: number, scaler: string) => {
    try {
      setLoading(true);
      const res = await mlApi.runScalingAnalysis(id, { scaler_type: scaler });
      setScalingResult(res);
    } catch (err) {
      console.error('Scaling analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const scalersInfo = [
    {
      id: 'StandardScaler',
      title: 'StandardScaler (Z-Score)',
      formula: 'z = (x - μ) / σ',
      description: 'Transforms features to zero mean (μ ≈ 0) and unit variance (σ ≈ 1). Best for Logistic Regression, PCA, and Neural Networks.',
    },
    {
      id: 'MinMaxScaler',
      title: 'MinMaxScaler (Bounded Range)',
      formula: 'x_scaled = (x - min) / (max - min)',
      description: 'Normalizes features into strict [0, 1] interval. Preserves exact zero values, suitable for bounded RF power measurements.',
    },
    {
      id: 'RobustScaler',
      title: 'RobustScaler (IQR-Based)',
      formula: 'x_scaled = (x - Q2) / (Q3 - Q1)',
      description: 'Subtracts median and divides by interquartile range. Resists extreme signal noise and impulsive interference spikes.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="feature-scaling" onSelectStage={onNavigate} />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sliders className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Feature Normalization Studio</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero-Leakage Preprocessing
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Compare StandardScaler, MinMaxScaler, and RobustScaler with rigorous train/test partition isolation.
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

      {/* Strict Data Leakage Prevention Guarantee Card */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 space-y-1">
          <div className="font-bold text-indigo-900 flex items-center gap-2">
            <span>Rigorous Train/Test Split Separation Verified</span>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-indigo-200 font-mono text-indigo-700 font-bold">
              Fit on Train ONLY
            </span>
          </div>
          <p className="text-indigo-800 leading-relaxed">
            The scaler is fitted strictly on the 80% training partition (<code>scaler.fit(X_train)</code>). Test samples are transformed using the previously computed training parameters (<code>scaler.transform(X_test)</code>). No test statistics leak into the pipeline.
          </p>
        </div>
      </div>

      {/* Scaler Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scalersInfo.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScalerType(s.id)}
            className={`p-4 rounded-2xl border text-left transition-all card-hover ${
              scalerType === s.id
                ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
                : 'bg-white border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">{s.title}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${scalerType === s.id ? 'bg-indigo-600' : 'bg-slate-300'}`} />
            </div>
            <div className="font-mono text-[11px] font-semibold text-indigo-600 bg-white px-2 py-1 rounded border border-slate-200/80 inline-block mb-2">
              {s.formula}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">{s.description}</p>
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/90">
          <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">Fitting Scaler on Training Partition and Transforming Test Split...</p>
        </div>
      )}

      {scalingResult && !loading && (
        <>
          {/* Comparison Statistics Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Table className="h-4 w-4 text-indigo-600" />
                  Before vs After Normalization Metrics (Partition Statistics)
                </h3>
                <p className="text-xs text-slate-500">
                  Train Samples: <strong className="font-mono text-slate-800">{scalingResult.train_samples}</strong> | Test Samples: <strong className="font-mono text-slate-800">{scalingResult.test_samples}</strong>
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
                {scalingResult.scaler_type}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4">Original Mean</th>
                    <th className="py-3 px-4">Original Std</th>
                    <th className="py-3 px-4">Original Range</th>
                    <th className="py-3 px-4 bg-indigo-50/50 text-indigo-900 font-bold">Scaled Train Mean (μ)</th>
                    <th className="py-3 px-4 bg-indigo-50/50 text-indigo-900 font-bold">Scaled Train Std (σ)</th>
                    <th className="py-3 px-4">Scaled Test Mean</th>
                    <th className="py-3 px-4">Scaled Test Std</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {scalingResult.comparisons.map((c) => (
                    <tr key={c.feature} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{c.feature}</td>
                      <td className="py-2.5 px-4">{c.original_mean}</td>
                      <td className="py-2.5 px-4">{c.original_std}</td>
                      <td className="py-2.5 px-4 text-slate-500">{c.original_range}</td>
                      <td className="py-2.5 px-4 bg-indigo-50/30 font-bold text-indigo-700">{c.scaled_train_mean}</td>
                      <td className="py-2.5 px-4 bg-indigo-50/30 font-bold text-indigo-700">{c.scaled_train_std}</td>
                      <td className="py-2.5 px-4">{c.scaled_test_mean}</td>
                      <td className="py-2.5 px-4">{c.scaled_test_std}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribution Comparison Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-600" />
                  Side-by-Side Distribution: {scalingResult.distribution_comparison.feature}
                </h3>
                <p className="text-xs text-slate-500">
                  Verifies shape preservation while standardizing numerical magnitude.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-xs font-bold text-slate-700 mb-2">Original Distribution (Raw Domain Units)</div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scalingResult.distribution_comparison.bins} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="original_label" tick={{ fontSize: 9, fill: '#64748b' }} angle={-25} textAnchor="end" />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Bar dataKey="original_count" fill="#64748b" radius={[4, 4, 0, 0]} name="Raw Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="text-xs font-bold text-indigo-900 mb-2">Normalized Distribution ({scalingResult.scaler_type})</div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scalingResult.distribution_comparison.bins} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="scaled_label" tick={{ fontSize: 9, fill: '#4f46e5' }} angle={-25} textAnchor="end" />
                      <YAxis tick={{ fontSize: 9, fill: '#4f46e5' }} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Bar dataKey="scaled_count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Normalized Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Transformed Values Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Table className="h-4 w-4 text-indigo-600" />
              Transformed Matrix Sample (First 8 Rows)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                  <tr>
                    {scalingResult.scaled_features.map((f) => (
                      <th key={f} className="py-2 px-3 whitespace-nowrap">{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {scalingResult.preview_transformed_head.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      {scalingResult.scaled_features.map((f) => (
                        <td key={f} className="py-1.5 px-3 whitespace-nowrap">
                          {row[f] !== undefined ? row[f] : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Next Step Banner */}
          {onNavigate && (
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900">
                Normalization pipeline fitted on train split without leakage. Next: Principal Component Analysis.
              </span>
              <button
                onClick={() => onNavigate('ml-pca')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                Proceed to Principal Component Explorer <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
