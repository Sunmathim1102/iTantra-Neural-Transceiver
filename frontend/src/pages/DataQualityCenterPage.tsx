import React, { useState, useEffect } from 'react';
import {
  Scissors,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Save,
  Sliders,
  History,
  Info,
  ArrowRight
} from 'lucide-react';
import { mlApi } from '../services/api';
import { CleaningResult, DatasetSummary, DatasetInspection } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const DataQualityCenterPage: React.FC<Props> = ({ onNavigate }) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [inspection, setInspection] = useState<DatasetInspection | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [preview, setPreview] = useState<CleaningResult | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Configurable options
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [imputeNumeric, setImputeNumeric] = useState('median');
  const [imputeCategorical, setImputeCategorical] = useState('mode');
  const [outlierStrategy, setOutlierStrategy] = useState('clip');
  const [dropConstantFeatures, setDropConstantFeatures] = useState(true);

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
      loadInspection(selectedId);
      setPreview(null);
    }
  }, [selectedId]);

  const loadInspection = async (id: number) => {
    try {
      setLoading(true);
      const res = await mlApi.inspectDataset(id);
      setInspection(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedId) return;
    try {
      setExecuting(true);
      setStatusMsg(null);
      const res = await mlApi.cleanDataset(selectedId, {
        remove_duplicates: removeDuplicates,
        impute_numeric: imputeNumeric,
        impute_categorical: imputeCategorical,
        outlier_strategy: outlierStrategy,
        drop_constant_features: dropConstantFeatures,
        preview_only: true
      });
      setPreview(res);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || err.message || 'Cleaning preview failed' });
    } finally {
      setExecuting(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedId) return;
    try {
      setExecuting(true);
      setStatusMsg(null);
      const res = await mlApi.cleanDataset(selectedId, {
        remove_duplicates: removeDuplicates,
        impute_numeric: imputeNumeric,
        impute_categorical: imputeCategorical,
        outlier_strategy: outlierStrategy,
        drop_constant_features: dropConstantFeatures,
        preview_only: false
      });
      setPreview(res);
      setStatusMsg({
        type: 'success',
        text: `Data Quality transformation applied! Saved as version ${res.version_tag} without overwriting raw dataset.`
      });
      await loadInspection(selectedId);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || err.message || 'Cleaning execution failed' });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="data-cleaning" onSelectStage={onNavigate} />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Scissors className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Quality Center</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Non-Destructive Transformation
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Automated deduplication, robust missing value imputation, infinite filtering, and Tukey IQR outlier boundary clipping.
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
        </div>
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
            {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Configuration & Quality Scan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Configurable Cleaning Parameters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              Transformation Config
            </h2>
            <span className="text-[10px] text-slate-400">Preview Before Save</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Deduplication */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Remove Duplicate Rows</span>
                <span className="text-[11px] text-slate-500">Eliminate redundant observation rows</span>
              </div>
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </label>

            {/* Drop Constant Columns */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Drop Constant Features</span>
                <span className="text-[11px] text-slate-500">Remove zero-variance features</span>
              </div>
              <input
                type="checkbox"
                checked={dropConstantFeatures}
                onChange={(e) => setDropConstantFeatures(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </label>

            {/* Numerical Imputation */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Numerical Missing Imputation</label>
              <select
                value={imputeNumeric}
                onChange={(e) => setImputeNumeric(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="median">Median Imputation (Recommended for skewed RF metrics)</option>
                <option value="mean">Mean Imputation (Standard Gaussian assumption)</option>
                <option value="zero">Zero Fill (0.0)</option>
                <option value="none">Do Not Impute</option>
              </select>
            </div>

            {/* Categorical Imputation */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Categorical Missing Imputation</label>
              <select
                value={imputeCategorical}
                onChange={(e) => setImputeCategorical(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mode">Most Frequent Category (Mode)</option>
                <option value="missing">Explicit Category ('Missing')</option>
                <option value="none">Do Not Impute</option>
              </select>
            </div>

            {/* Outlier Strategy */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Outlier Treatment</label>
              <select
                value={outlierStrategy}
                onChange={(e) => setOutlierStrategy(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="clip">Tukey 1.5*IQR Boundary Clipping (Preserves sample size)</option>
                <option value="none">Retain Raw Values (No Clipping)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePreview}
                disabled={executing}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={executing}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>Apply & Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Quality Scan & Preview Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quality Health Audit Card */}
          {inspection && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Pre-Cleaning Quality Scan
                </h3>
                <span className="text-xs text-slate-500 font-mono">Dataset ID #{inspection.dataset_id}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500">Duplicate Rows</div>
                  <div className={`text-base font-bold font-mono ${inspection.duplicate_rows > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {inspection.duplicate_rows}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500">Missing Values</div>
                  <div className={`text-base font-bold font-mono ${inspection.missing_cells > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {inspection.missing_cells}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500">Completeness</div>
                  <div className="text-base font-bold font-mono text-emerald-600">
                    {inspection.completeness_percentage}%
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500">Saved Versions</div>
                  <div className="text-base font-bold font-mono text-indigo-600">
                    {inspection.versions.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cleaning Preview / Execution Output */}
          {preview ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${preview.is_preview ? 'text-amber-600' : 'text-emerald-600'}`} />
                  {preview.is_preview ? 'Transformation Preview (Staging)' : `Applied Transformation: ${preview.version_tag}`}
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${preview.is_preview ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {preview.is_preview ? 'Preview Mode' : 'Committed Version'}
                </span>
              </div>

              {/* Rows/Cols Comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500">Rows Before</span>
                  <div className="font-bold font-mono text-slate-800 text-base">{preview.original_rows}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500">Rows After</span>
                  <div className="font-bold font-mono text-emerald-600 text-base">{preview.cleaned_rows}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500">Columns Before</span>
                  <div className="font-bold font-mono text-slate-800 text-base">{preview.original_columns}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500">Columns After</span>
                  <div className="font-bold font-mono text-indigo-600 text-base">{preview.cleaned_columns}</div>
                </div>
              </div>

              {/* Operations List */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800">Operations Applied:</div>
                <ul className="space-y-1 text-xs">
                  {preview.operations_applied.map((op, i) => (
                    <li key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                      <span>{op}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cleaned Records Preview */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-800 mb-2">Transformed Dataset Sample:</div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                      <tr>
                        {Object.keys(preview.preview_samples[0] || {}).map((col) => (
                          <th key={col} className="py-2 px-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                      {preview.preview_samples.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          {Object.keys(preview.preview_samples[0] || {}).map((col) => (
                            <td key={col} className="py-1.5 px-3 whitespace-nowrap">
                              {row[col] !== null ? String(row[col]) : 'null'}
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
                    Data cleaned and verified. Ready for feature engineering and scaling.
                  </span>
                  <button
                    onClick={() => onNavigate('ml-scaling')}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    Proceed to Feature Scaling <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/90">
              Click <strong>Preview</strong> to inspect proposed transformations before committing changes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
