import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  RefreshCw,
  Table,
  BarChart2,
  Sliders,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { mlApi } from '../services/api';
import { ExperimentRecord } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const ModelPerformanceLabPage: React.FC<Props> = ({ onNavigate }) => {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const res = await mlApi.getExperiments();
      setExperiments(res.experiments);
      if (res.experiments.length > 0 && !selectedExpId) {
        const active = res.experiments.find((e: any) => e.is_active) || res.experiments[0];
        setSelectedExpId(active.experiment_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedExp = experiments.find((e) => e.experiment_id === selectedExpId) || experiments[0];

  const classLabels = ['Excellent', 'Good', 'Moderate', 'Poor'];

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="model-evaluation" onSelectStage={onNavigate} />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Award className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Model Performance Lab</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Held-Out Test Set Verification
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Unbiased held-out test evaluation, confusion matrices, classification reports, and cross-model benchmarks.
          </p>
        </div>

        {/* Experiment selector */}
        {experiments.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Experiment:</label>
            <select
              value={selectedExpId || ''}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {experiments.map((e) => (
                <option key={e.experiment_id} value={e.experiment_id}>
                  {e.algorithm} ({e.experiment_id}) - {(e.accuracy * 100).toFixed(1)}% Acc {e.is_active ? '★ Active' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/90">
          <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">Loading Experiment Metrics & Confusion Matrices...</p>
        </div>
      )}

      {selectedExp && !loading && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Test Accuracy</span>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                {(selectedExp.accuracy * 100).toFixed(2)}%
              </div>
              <span className="text-[10px] text-emerald-700">Held-out test split</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Weighted Precision</span>
              <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                {(selectedExp.precision * 100).toFixed(2)}%
              </div>
              <span className="text-[10px] text-slate-400">Positive predictive value</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Weighted Recall</span>
              <div className="text-2xl font-bold font-mono text-cyan-600 mt-1">
                {(selectedExp.recall * 100).toFixed(2)}%
              </div>
              <span className="text-[10px] text-slate-400">Sensitivity rate</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Weighted F1-Score</span>
              <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
                {(selectedExp.f1_score * 100).toFixed(2)}%
              </div>
              <span className="text-[10px] text-indigo-600 font-semibold">Harmonic mean balance</span>
            </div>
          </div>

          {/* Confusion Matrix & Classification Report Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix Heatmap */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Table className="h-4 w-4 text-indigo-600" />
                    Confusion Matrix Heatmap (Held-Out Test Set)
                  </h3>
                  <p className="text-xs text-slate-500">Rows: Actual True Class | Columns: Model Predicted Class.</p>
                </div>
              </div>

              {selectedExp.confusion_matrix && selectedExp.confusion_matrix.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-slate-400 font-mono text-[10px]">Actual \ Pred</th>
                        {classLabels.map((lbl) => (
                          <th key={lbl} className="p-2 text-slate-700 font-bold text-[11px]">{lbl}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedExp.confusion_matrix.map((row, rIdx) => {
                        const trueLabel = classLabels[rIdx] || `Class ${rIdx}`;
                        const rowTotal = row.reduce((a, b) => a + b, 0);

                        return (
                          <tr key={rIdx}>
                            <td className="p-2 text-left font-bold text-slate-800 text-[11px]">{trueLabel}</td>
                            {row.map((count, cIdx) => {
                              const isDiagonal = rIdx === cIdx;
                              const intensity = rowTotal > 0 ? count / rowTotal : 0;

                              return (
                                <td key={cIdx} className="p-1.5">
                                  <div
                                    className={`py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all ${
                                      isDiagonal
                                        ? intensity > 0.8
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-emerald-100 text-emerald-900'
                                        : count > 0
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-slate-50 text-slate-400'
                                    }`}
                                  >
                                    {count}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-slate-400 text-center mt-3">
                    Diagonal cells indicate accurate predictions. Off-diagonal cells represent misclassification errors.
                  </p>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs">Confusion matrix unavailable for this experiment.</div>
              )}
            </div>

            {/* Per-Class Classification Report */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-indigo-600" />
                    Per-Class Performance Report (Precision & F1)
                  </h3>
                  <p className="text-xs text-slate-500">Breakdown across all 4 link quality conditions.</p>
                </div>
              </div>

              {selectedExp.classification_report ? (
                <div className="space-y-3">
                  {classLabels.map((cls) => {
                    const stats = selectedExp.classification_report?.[cls];
                    if (!stats) return null;

                    const prec = (stats.precision * 100).toFixed(1);
                    const rec = (stats.recall * 100).toFixed(1);
                    const f1 = (stats['f1-score'] * 100).toFixed(1);
                    const support = stats.support;

                    return (
                      <div key={cls} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{cls}</span>
                          <span className="text-[11px] text-slate-500 font-mono">Support: {support} test samples</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                          <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-[9px]">Precision</span>
                            <span className="font-bold text-slate-800">{prec}%</span>
                          </div>
                          <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-[9px]">Recall</span>
                            <span className="font-bold text-slate-800">{rec}%</span>
                          </div>
                          <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-[9px]">F1-Score</span>
                            <span className="font-bold text-indigo-600">{f1}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs">Classification report unavailable.</div>
              )}
            </div>
          </div>

          {/* Multi-Model Benchmark Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Cross-Model Architecture Benchmark
                </h3>
                <p className="text-xs text-slate-500">Direct comparison across algorithms, normalizations, and PCA on identical test partitions.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Experiment ID</th>
                    <th className="py-3 px-4">Algorithm</th>
                    <th className="py-3 px-4">Scaler</th>
                    <th className="py-3 px-4">PCA</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Precision</th>
                    <th className="py-3 px-4">Recall</th>
                    <th className="py-3 px-4">F1-Score</th>
                    <th className="py-3 px-4">Deployment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {experiments.map((e) => (
                    <tr
                      key={e.experiment_id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        e.experiment_id === selectedExp.experiment_id ? 'bg-indigo-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-900">{e.experiment_id}</td>
                      <td className="py-2.5 px-4">{e.algorithm}</td>
                      <td className="py-2.5 px-4 text-slate-500">{e.scaler_type}</td>
                      <td className="py-2.5 px-4">{e.pca_enabled ? `Yes (${e.pca_components} comp)` : 'None'}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-600">{(e.accuracy * 100).toFixed(2)}%</td>
                      <td className="py-2.5 px-4">{(e.precision * 100).toFixed(2)}%</td>
                      <td className="py-2.5 px-4">{(e.recall * 100).toFixed(2)}%</td>
                      <td className="py-2.5 px-4 font-bold text-indigo-600">{(e.f1_score * 100).toFixed(2)}%</td>
                      <td className="py-2.5 px-4">
                        {e.is_active ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Active Transceiver
                          </span>
                        ) : (
                          <span className="text-slate-400">Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
