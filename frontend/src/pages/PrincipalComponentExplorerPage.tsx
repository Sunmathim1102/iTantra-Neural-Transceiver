import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Sliders,
  Table,
  Info,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, ScatterChart, Scatter, Cell, ZAxis } from 'recharts';
import { mlApi } from '../services/api';
import { PCAResult, DatasetSummary } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const PrincipalComponentExplorerPage: React.FC<Props> = ({ onNavigate }) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [nComponents, setNComponents] = useState<number>(2);
  const [scaleFirst, setScaleFirst] = useState<boolean>(true);
  const [pcaResult, setPcaResult] = useState<PCAResult | null>(null);
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
      runPCA(selectedId, nComponents, scaleFirst);
    }
  }, [selectedId, nComponents, scaleFirst]);

  const runPCA = async (id: number, k: number, scale: boolean) => {
    try {
      setLoading(true);
      const res = await mlApi.runPCAAnalysis(id, {
        n_components: k,
        scale_first: scale,
      });
      setPcaResult(res);
    } catch (err) {
      console.error('PCA error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTargetColor = (target: string) => {
    if (target === 'Excellent') return '#10b981';
    if (target === 'Good') return '#06b6d4';
    if (target === 'Moderate') return '#f59e0b';
    if (target === 'Poor') return '#f43f5e';
    return '#6366f1';
  };

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="pca" onSelectStage={onNavigate} />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Principal Component Explorer</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Orthogonal Dimensionality Reduction
            </span>
          </div>
          <p className="text-xs text-slate-500">
            True scikit-learn PCA fitted on training partition, scree plot analysis, feature loading eigenvectors, and 2D/3D projections.
          </p>
        </div>

        {/* Dataset and Component Controls */}
        <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="px-2 text-slate-500 font-medium">Components:</span>
            {[2, 3, 4].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setNComponents(k)}
                className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all ${
                  nComponents === k ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scientific Caution Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <div className="font-bold text-amber-900">Academic & Scientific Note on PCA:</div>
          <p className="text-amber-800 leading-relaxed">
            PCA is an <strong>unsupervised</strong> transformation that maximizes variance capture along orthogonal axes. It reduces multicollinearity and computational cost, but does not inherently optimize classification boundaries. In Model Performance Lab, compare baseline vs PCA models side-by-side on identical test splits.
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/90">
          <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">Decomposing Covariance Matrix into Eigenvalues and Eigenvectors...</p>
        </div>
      )}

      {pcaResult && !loading && (
        <>
          {/* Dimensionality Reduction Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Original Dimensions</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{pcaResult.original_dimensions} Features</div>
              <span className="text-[10px] text-slate-400">Pre-reduction feature space</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Reduced Components</span>
              <div className="text-2xl font-bold text-indigo-600 font-mono mt-1">{pcaResult.reduced_dimensions} (PC1..PC{pcaResult.reduced_dimensions})</div>
              <span className="text-[10px] text-indigo-600 font-semibold">{pcaResult.reduced_dimensions} Orthogonal axes</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Total Variance Preserved</span>
              <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">{pcaResult.total_variance_preserved_pct}%</div>
              <span className="text-[10px] text-emerald-700">Retained information</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Variance Discarded</span>
              <div className="text-2xl font-bold text-slate-500 font-mono mt-1">
                {(100 - pcaResult.total_variance_preserved_pct).toFixed(2)}%
              </div>
              <span className="text-[10px] text-slate-400">Compressed noise</span>
            </div>
          </div>

          {/* Scree Plot & 2D Projection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scree Plot */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    Scree Plot (Explained Variance by Component)
                  </h3>
                  <p className="text-xs text-slate-500">Individual component variance contribution vs cumulative curve.</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pcaResult.scree_plot} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <XAxis dataKey="component" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(v: any, name: any) => [`${v}%`, name === 'explained_variance' ? 'Individual Variance' : 'Cumulative Variance']}
                    />
                    <Bar dataKey="explained_variance" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Individual Variance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                {pcaResult.scree_plot.map((s) => (
                  <div key={s.component} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-mono font-bold text-slate-800">{s.component}</div>
                    <div className="text-indigo-600 font-mono font-bold">{s.explained_variance}%</div>
                    <div className="text-[10px] text-slate-400">Cum: {s.cumulative_variance}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2D Feature Space Projection */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    Feature Space Projection (PC1 vs PC2)
                  </h3>
                  <p className="text-xs text-slate-500">Projected sample coordinates colored by Communication Quality class.</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <XAxis type="number" dataKey="pc1" name="PC1" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis type="number" dataKey="pc2" name="PC2" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', fontSize: '11px' }}
                      formatter={(val: any, name: any) => [val, name]}
                    />
                    <Scatter name="Samples" data={pcaResult.projections_sample}>
                      {pcaResult.projections_sample.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={getTargetColor(entry.target)} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-xs pt-1">
                {['Excellent', 'Good', 'Moderate', 'Poor'].map((cls) => (
                  <div key={cls} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getTargetColor(cls) }} />
                    <span className="font-semibold text-slate-700 text-[11px]">{cls}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Loadings Matrix (Eigenvector Weights) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Table className="h-4 w-4 text-indigo-600" />
                  Feature Loadings Matrix (Eigenvector Coefficients)
                </h3>
                <p className="text-xs text-slate-500">Explains how original RF features map into each principal component.</p>
              </div>
              <span className="text-[11px] text-slate-500">Higher absolute value = Stronger influence</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Original Feature</th>
                    {Array.from({ length: pcaResult.reduced_dimensions }).map((_, i) => (
                      <th key={i} className="py-3 px-4">PC{i + 1} Loading</th>
                    ))}
                    <th className="py-3 px-4">Dominant Axis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {pcaResult.feature_loadings.map((row) => {
                    let maxAxis = 'PC1';
                    let maxVal = 0;
                    Array.from({ length: pcaResult.reduced_dimensions }).forEach((_, i) => {
                      const val = Math.abs(row[`PC${i + 1}`] || 0);
                      if (val > maxVal) {
                        maxVal = val;
                        maxAxis = `PC${i + 1}`;
                      }
                    });

                    return (
                      <tr key={row.feature} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{row.feature}</td>
                        {Array.from({ length: pcaResult.reduced_dimensions }).map((_, i) => {
                          const val = row[`PC${i + 1}`];
                          return (
                            <td key={i} className="py-2.5 px-4 font-semibold">
                              <span
                                className={`px-2 py-0.5 rounded font-mono ${
                                  Math.abs(val) > 0.4
                                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                                    : 'text-slate-600'
                                }`}
                              >
                                {val !== undefined ? (val > 0 ? `+${val.toFixed(4)}` : val.toFixed(4)) : '-'}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {maxAxis} ({maxVal.toFixed(2)})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Next Step Banner */}
          {onNavigate && (
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900">
                Principal components fitted and verified. Ready for Model Training Center.
              </span>
              <button
                onClick={() => onNavigate('ml-training')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                Proceed to Model Training Center <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
