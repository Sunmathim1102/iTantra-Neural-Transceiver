import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  RefreshCw,
  Layers,
  Award,
  Zap,
  TrendingUp,
  Sliders,
  Check,
  Star
} from 'lucide-react';
import { mlApi } from '../services/api';
import { ExperimentRecord } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const MLExperimentRegistryPage: React.FC<Props> = ({ onNavigate }) => {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const res = await mlApi.getExperiments();
      setExperiments(res.experiments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (expId: string) => {
    try {
      setActivatingId(expId);
      setStatusMsg(null);
      await mlApi.activateExperiment(expId);
      setStatusMsg({
        type: 'success',
        text: `Experiment ${expId} is now the active production model for all transceiver predictions.`
      });
      await loadExperiments();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Failed to activate model.'
      });
    } finally {
      setActivatingId(null);
    }
  };

  const activeExp = experiments.find((e) => e.is_active);

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="model-monitoring" onSelectStage={onNavigate} />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ML Experiment Registry</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {experiments.length} Model Versions
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Immutable tracking of training runs, hyperparameters, test set benchmarks, and 1-click active production deployment.
          </p>
        </div>

        <button
          onClick={loadExperiments}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Registry</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Activity className="h-4 w-4 text-rose-600" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Active Model Spotlight */}
      {activeExp && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-emerald-50/60 border border-indigo-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
              <Star className="h-5 w-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-700">Active Production Transceiver Pipeline</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  ONLINE
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {activeExp.algorithm} <span className="font-mono text-xs text-slate-500 font-normal">({activeExp.experiment_id})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Scaler: <strong className="text-slate-700">{activeExp.scaler_type}</strong> | PCA: <strong className="text-slate-700">{activeExp.pca_enabled ? `Active (${activeExp.pca_components} comp)` : 'Disabled'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Held-Out Accuracy</div>
              <div className="text-2xl font-bold font-mono text-emerald-600">{(activeExp.accuracy * 100).toFixed(2)}%</div>
            </div>
            <div className="text-right border-l border-slate-200 pl-3">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">F1-Score</div>
              <div className="text-2xl font-bold font-mono text-indigo-600">{(activeExp.f1_score * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Experiments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              Experiment Ledger & Version History
            </h3>
            <p className="text-xs text-slate-500">Audit trail of all fitted preprocessing pipelines, PCA configurations, and classifier weights.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Experiment ID</th>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4">Dataset Version</th>
                <th className="py-3 px-4">Scaler</th>
                <th className="py-3 px-4">PCA</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">F1-Score</th>
                <th className="py-3 px-4">Trained At</th>
                <th className="py-3 px-4 text-right">Production Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
              {experiments.map((e) => (
                <tr key={e.experiment_id} className={`hover:bg-slate-50/60 ${e.is_active ? 'bg-indigo-50/30' : ''}`}>
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    {e.is_active && <Star className="h-3 w-3 fill-indigo-600 text-indigo-600 shrink-0" />}
                    <span>{e.experiment_id}</span>
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-800">{e.algorithm}</td>
                  <td className="py-3 px-4 text-slate-500">{e.dataset_version}</td>
                  <td className="py-3 px-4 text-slate-600">{e.scaler_type}</td>
                  <td className="py-3 px-4">{e.pca_enabled ? `Yes (${e.pca_components} comp)` : 'No'}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">{(e.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 font-bold text-indigo-600">{(e.f1_score * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-slate-400 font-sans text-[10px]">
                    {e.created_at ? new Date(e.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {e.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        <Check className="h-3 w-3" /> Active Model
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivate(e.experiment_id)}
                        disabled={activatingId === e.experiment_id}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-all disabled:opacity-50"
                      >
                        {activatingId === e.experiment_id ? 'Deploying...' : 'Deploy Active'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
