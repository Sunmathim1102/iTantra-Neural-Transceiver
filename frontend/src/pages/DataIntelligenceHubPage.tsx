import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Table,
  RefreshCw,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { mlApi } from '../services/api';
import { DatasetSummary, DatasetInspection } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const DataIntelligenceHubPage: React.FC<Props> = ({ onNavigate }) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [inspection, setInspection] = useState<DatasetInspection | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const res = await mlApi.listDatasets();
      setDatasets(res.datasets);
      if (res.datasets.length > 0 && !selectedId) {
        setSelectedId(res.datasets[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to load datasets' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadInspection(selectedId);
    }
  }, [selectedId]);

  const loadInspection = async (id: number) => {
    try {
      setLoading(true);
      const res = await mlApi.inspectDataset(id);
      setInspection(res);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to inspect dataset' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setStatusMsg({ type: 'error', text: 'Please select a CSV file to upload.' });
      return;
    }

    if (!selectedFile.name.endsWith('.csv')) {
      setStatusMsg({ type: 'error', text: 'Invalid file format. Only standard .csv files are supported.' });
      return;
    }

    try {
      setUploading(true);
      setStatusMsg(null);
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (uploadName) formData.append('name', uploadName);
      if (uploadDesc) formData.append('description', uploadDesc);

      const res = await mlApi.uploadDataset(formData);
      setStatusMsg({ type: 'success', text: `Dataset '${res.dataset.name}' uploaded and cataloged successfully!` });
      setSelectedFile(null);
      setUploadName('');
      setUploadDesc('');
      await loadDatasets();
      setSelectedId(res.dataset.id);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workflow Diagram Banner */}
      <DataLifecycleWorkflow currentStageId="raw-dataset" onSelectStage={onNavigate} />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Database className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Intelligence Hub</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {datasets.length} Catalogs
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Enterprise dataset repository, schema verification, data type inference, target definition, and version control.
          </p>
        </div>

        {/* Dataset Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Active Dataset:</label>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.row_count} rows, {d.is_synthetic ? 'Synthetic' : 'Uploaded'})
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedId && loadInspection(selectedId)}
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
            title="Refresh Inspection"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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

      {/* Upload & Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload New Dataset */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Upload className="h-4 w-4 text-indigo-600" />
              Ingest New Dataset
            </h2>
            <span className="text-[10px] text-slate-600">CSV Max 50MB</span>
          </div>

          <form onSubmit={handleUpload} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-600 font-medium block mb-1">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-1"
              />
            </div>

            <div>
              <label className="text-slate-600 font-medium block mb-1">Catalog Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Field Trial Radio Access Data"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-600 font-medium block mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Dataset provenance, experimental conditions, or dialect breakdown"
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50"
            >
              {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>{uploading ? 'Validating & Cataloging...' : 'Upload & Validate'}</span>
            </button>
          </form>

          {/* Quick Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Strict Integrity Policy:
            </div>
            <p>Raw uploaded files are never overwritten. Cleaning and transformation operations create versioned artifacts.</p>
          </div>
        </div>

        {/* Right 2 Columns: Inspection Summary */}
        <div className="lg:col-span-2 space-y-6">
          {inspection ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Records', value: inspection.total_rows.toLocaleString(), sub: `${(inspection.file_size_bytes / 1024).toFixed(1)} KB` },
                  { label: 'Total Features', value: inspection.total_columns, sub: `${inspection.numerical_features.length} Num, ${inspection.categorical_features.length} Cat` },
                  { label: 'Completeness', value: `${inspection.completeness_percentage}%`, sub: `${inspection.missing_cells} Missing cells` },
                  { label: 'Duplicate Rows', value: inspection.duplicate_rows, sub: inspection.duplicate_rows > 0 ? 'Deduplication needed' : 'Clean' },
                ].map((card, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-600">{card.label}</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">{card.value}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Warnings Banner if any */}
              {inspection.warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Dataset Validation Warnings:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {inspection.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Column Schema Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Table className="h-4 w-4 text-indigo-600" />
                      Inferred Column Types & Quality Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-600">Feature classification for downstream scaling, PCA and training.</p>
                  </div>

                  <a
                    href={`/api/ml/datasets/${inspection.dataset_id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download CSV</span>
                  </a>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Feature Name</th>
                        <th className="py-3 px-4">Inferred Type</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Missing</th>
                        <th className="py-3 px-4">Unique</th>
                        <th className="py-3 px-4">Sample Values</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {inspection.columns.map((c) => (
                        <tr key={c.name} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-4 font-semibold text-slate-900 font-mono text-[11px]">{c.name}</td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{c.data_type}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                c.feature_type.includes('target')
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : c.feature_type === 'numerical'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : c.feature_type === 'categorical'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {c.feature_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            {c.missing_count > 0 ? (
                              <span className="text-rose-600 font-semibold">{c.missing_count} ({c.missing_percentage}%)</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono">{c.unique_count}</td>
                          <td className="py-2.5 px-4 text-slate-500 truncate max-w-[180px] font-mono text-[11px]">
                            {c.sample_values.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Head Records Preview */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    First Records Preview (Top 10)
                  </h3>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('ml-eda')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      Proceed to Insights Studio (EDA) <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] text-slate-500 uppercase">
                      <tr>
                        {inspection.columns.map((c) => (
                          <th key={c.name} className="py-2 px-3 whitespace-nowrap">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                      {inspection.head_records.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          {inspection.columns.map((c) => (
                            <td key={c.name} className="py-2 px-3 whitespace-nowrap">
                              {row[c.name] !== null && row[c.name] !== undefined ? String(row[c.name]) : <span className="text-slate-300">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/90">
              Select or upload a dataset to view its intelligence schema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
