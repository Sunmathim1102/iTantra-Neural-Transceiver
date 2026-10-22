import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  PieChart as PieIcon,
  Activity,
  Layers,
  RefreshCw,
  Sliders,
  Filter,
  Download,
  Info,
  CheckCircle2,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ScatterChart, Scatter, Cell } from 'recharts';
import { mlApi } from '../services/api';
import { EDAResults, DatasetSummary } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const DatasetInsightsStudioPage: React.FC<Props> = ({ onNavigate }) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [eda, setEda] = useState<EDAResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeNumFeature, setActiveNumFeature] = useState<string>('');
  const [activeCatFeature, setActiveCatFeature] = useState<string>('');

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
      loadEDA(selectedId);
    }
  }, [selectedId]);

  const loadEDA = async (id: number) => {
    try {
      setLoading(true);
      const res = await mlApi.runEDA(id);
      setEda(res);
      const numKeys = Object.keys(res.numerical_statistics || {});
      if (numKeys.length > 0) {
        setActiveNumFeature(numKeys.includes('snr') ? 'snr' : numKeys[0]);
      }
      const catKeys = Object.keys(res.categorical_statistics || {});
      if (catKeys.length > 0) {
        setActiveCatFeature(catKeys[0]);
      }
    } catch (err) {
      console.error('EDA calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (val: number) => {
    if (val === 1) return 'bg-indigo-600 text-white';
    if (val > 0.6) return 'bg-indigo-500 text-white';
    if (val > 0.3) return 'bg-indigo-200 text-indigo-900';
    if (val > 0) return 'bg-indigo-50 text-indigo-800';
    if (val > -0.3) return 'bg-slate-50 text-slate-700';
    if (val > -0.6) return 'bg-rose-100 text-rose-900';
    return 'bg-rose-500 text-white';
  };

  const activeStats = activeNumFeature && eda?.numerical_statistics?.[activeNumFeature];
  const activeHist = activeNumFeature && eda?.histograms?.[activeNumFeature];
  const activeBox = activeNumFeature && eda?.box_plots?.[activeNumFeature];
  const activeCat = activeCatFeature && eda?.categorical_statistics?.[activeCatFeature];

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="eda" onSelectStage={onNavigate} />

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart2 className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dataset Insights Studio</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              EDA & Statistical Engine
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time univariate & multivariate statistical profiling, IQR outlier bounds, correlation matrices, and signal distributions.
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
                {d.name} ({d.row_count} records)
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedId && loadEDA(selectedId)}
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
            title="Recalculate EDA"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/90">
          <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">Computing Comprehensive Exploratory Data Analysis...</p>
          <p className="text-[11px] text-slate-400">Calculating quantiles, correlation matrix, histogram bins and outlier indices</p>
        </div>
      )}

      {eda && !loading && (
        <>
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Sample Records', value: eda.total_rows.toLocaleString(), sub: 'Observations' },
              { label: 'Feature Columns', value: eda.total_columns, sub: `${eda.numerical_features_count} Num / ${eda.categorical_features_count} Cat` },
              { label: 'Dataset Completeness', value: `${eda.completeness_percentage}%`, sub: 'Non-null density' },
              { label: 'Duplicate Records', value: eda.duplicate_rows, sub: eda.duplicate_rows === 0 ? 'Zero duplicates' : 'Redundant' },
              { label: 'Correlation Pairs', value: eda.top_correlations.length, sub: 'Evaluated' },
              { label: 'Target Classes', value: eda.target_distribution.length, sub: 'Class labels' },
            ].map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
                <div className="text-[11px] font-medium text-slate-500">{m.label}</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{m.value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Section 1: Interactive Numerical Feature Distribution & Outlier Studio */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  Numerical Feature Analysis & Empirical Distribution
                </h3>
                <p className="text-xs text-slate-500">Select feature to inspect histogram density, quartiles, and IQR outlier boundaries.</p>
              </div>

              {/* Feature Pill Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.keys(eda.numerical_statistics || {}).map((feat) => (
                  <button
                    key={feat}
                    onClick={() => setActiveNumFeature(feat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                      activeNumFeature === feat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {feat}
                  </button>
                ))}
              </div>
            </div>

            {activeStats && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Statistics Table Card */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Summary Metrics: {activeNumFeature}</span>
                    <span className="text-[10px] text-slate-400 font-mono">N={eda.total_rows}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ['Mean', activeStats.mean],
                      ['Median (Q2)', activeStats.median],
                      ['Std Deviation', activeStats.std],
                      ['IQR (Q3-Q1)', activeStats.iqr],
                      ['Min Value', activeStats.min],
                      ['Max Value', activeStats.max],
                      ['25th Percentile (Q1)', activeStats.q25],
                      ['75th Percentile (Q3)', activeStats.q75],
                      ['Skewness', activeStats.skewness],
                      ['Outlier Count', `${activeStats.outlier_count} (${activeStats.outlier_percentage}%)`],
                    ].map(([lbl, val]) => (
                      <div key={String(lbl)} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-500 font-medium">{lbl}</div>
                        <div className="text-slate-900 font-bold font-mono text-xs mt-0.5">{val}</div>
                      </div>
                    ))}
                  </div>

                  {activeBox && (
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-indigo-800">
                        <Info className="h-3.5 w-3.5" />
                        Tukey's IQR Outlier Rule:
                      </div>
                      <p>
                        Lower bound: <span className="font-mono font-bold">{activeBox.lower_bound}</span> | Upper bound: <span className="font-mono font-bold">{activeBox.upper_bound}</span>
                      </p>
                      <p className="text-[10px] text-indigo-700">
                        Observations outside this range are classified as statistical anomalies.
                      </p>
                    </div>
                  )}
                </div>

                {/* Histogram Visualizer */}
                <div className="lg:col-span-2 space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Binned Empirical Density Histogram</span>
                    <span className="text-[11px] text-slate-500">10 Bins (Equal Width)</span>
                  </div>

                  <div className="h-60 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeHist || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                          formatter={(v: any) => [`${v} records`, 'Frequency']}
                          labelFormatter={(label) => `Range: ${label}`}
                        />
                        <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Frequency" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Multivariate Correlation Heatmap */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  Pearson Correlation Matrix (Numerical Features)
                </h3>
                <p className="text-xs text-slate-500">Identifies collinearity and feature associations prior to dimensionality reduction.</p>
              </div>

              <span className="text-xs text-slate-400 font-mono">Range: [-1.00, +1.00]</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-left text-slate-500 font-mono text-[11px]">Feature</th>
                    {Object.keys(eda.correlation_matrix || {}).map((col) => (
                      <th key={col} className="py-2 px-2 text-slate-700 font-mono text-[11px]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(eda.correlation_matrix || {}).map(([rowFeat, rowVals]) => (
                    <tr key={rowFeat}>
                      <td className="py-2 px-3 text-left font-semibold font-mono text-slate-800 text-[11px]">{rowFeat}</td>
                      {Object.keys(eda.correlation_matrix).map((colFeat) => {
                        const val = rowVals[colFeat];
                        return (
                          <td key={colFeat} className="p-1">
                            <div className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-bold ${getHeatmapColor(val)}`}>
                              {val !== undefined ? val.toFixed(2) : '-'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Correlation Insights */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-800 mb-2">Dominant Bivariate Correlations:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {eda.top_correlations.slice(0, 4).map((c, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-700">{c.feature1} ↔ {c.feature2}</span>
                    <span className={`font-mono font-bold ${c.correlation > 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                      {c.correlation > 0 ? `+${c.correlation.toFixed(2)}` : c.correlation.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Pairwise Scatter & Target Class Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Target Distribution Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-indigo-600" />
                  Target Class Distribution (Supervised Ground Truth)
                </h3>
              </div>

              <div className="space-y-3">
                {eda.target_distribution.map((t) => (
                  <div key={t.class} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{t.class}</span>
                      <span className="text-slate-500 font-mono">{t.count} samples ({t.percentage}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          t.class === 'Excellent' ? 'bg-emerald-500' : t.class === 'Good' ? 'bg-cyan-500' : t.class === 'Moderate' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${t.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorical Feature Frequency */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  Categorical Feature Frequencies
                </h3>

                {Object.keys(eda.categorical_statistics || {}).length > 1 && (
                  <select
                    value={activeCatFeature}
                    onChange={(e) => setActiveCatFeature(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    {Object.keys(eda.categorical_statistics).map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                )}
              </div>

              {activeCat ? (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>Feature: <strong className="text-slate-800 font-mono">{activeCatFeature}</strong></span>
                    <span>Unique Categories: <strong className="text-slate-800 font-mono">{activeCat.unique_count}</strong></span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {activeCat.distribution.map((item) => (
                      <div key={item.category} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                        <span className="font-mono font-medium text-slate-800">{item.category}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-mono">{item.count}</span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">No categorical features detected.</div>
              )}
            </div>
          </div>

          {/* Bottom Next Step Link */}
          {onNavigate && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-950">Exploratory Analysis Complete</h4>
                <p className="text-[11px] text-indigo-700">Proceed to Data Quality Center to inspect and clean any missing values or duplicates.</p>
              </div>
              <button
                onClick={() => onNavigate('ml-quality')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                Go to Data Quality Center <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
