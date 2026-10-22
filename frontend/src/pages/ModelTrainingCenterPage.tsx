import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  RefreshCw,
  Award,
  Sliders,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play
} from 'lucide-react';
import { mlApi } from '../services/api';
import { TrainingResult, DatasetSummary, DatasetInspection } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const ModelTrainingCenterPage: React.FC<Props> = ({ onNavigate }) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [inspection, setInspection] = useState<DatasetInspection | null>(null);

  // Training parameters
  const [algorithm, setAlgorithm] = useState('Random Forest');
  const [scalerType, setScalerType] = useState('StandardScaler');
  const [pcaEnabled, setPcaEnabled] = useState(false);
  const [pcaComponents, setPcaComponents] = useState(2);
  const [testSize, setTestSize] = useState(0.2);
  const [randomSeed, setRandomSeed] = useState(42);
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState(12);

  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<TrainingResult | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      mlApi.inspectDataset(selectedId).then(setInspection).catch(console.error);
    }
  }, [selectedId]);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    try {
      setTraining(true);
      setStatusMsg(null);

      const params: any = {
        dataset_id: selectedId,
        algorithm,
        scaler_type: scalerType,
        pca_enabled: pcaEnabled,
        pca_components: pcaComponents,
        test_size: testSize,
        random_seed: randomSeed,
        hyperparameters: {
          n_estimators: nEstimators,
          max_depth: maxDepth,
          C: 1.0,
          max_iter: 1000,
        },
      };

      const res = await mlApi.trainModel(params);
      setTrainResult(res);
      setStatusMsg({
        type: 'success',
        text: `Model pipeline trained successfully! Experiment ${res.experiment_id} saved to registry and activated for inference.`
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Model training failed.'
      });
    } finally {
      setTraining(false);
    }
  };

  const algorithms = [
    {
      id: 'Random Forest',
      name: 'Random Forest Classifier',
      desc: 'Ensemble of decision trees with bagging. Highly resilient to channel non-linearities and RF noise.',
      recommended: true,
    },
    {
      id: 'Decision Tree',
      name: 'Decision Tree Classifier',
      desc: 'Single hierarchical decision split tree. Highly interpretable rules for RF signal degradation.',
      recommended: false,
    },
    {
      id: 'Logistic Regression',
      name: 'Multinomial Logistic Regression',
      desc: 'Linear probability model using softmax function. Fast baseline, works best when normalized.',
      recommended: false,
    },
    {
      id: 'Gradient Boosting',
      name: 'Gradient Boosting Classifier',
      desc: 'Sequential residual boosting. High predictive accuracy for subtle fading variations.',
      recommended: false,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <DataLifecycleWorkflow currentStageId="model-training" onSelectStage={onNavigate} />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Cpu className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Model Training Center</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Scikit-Learn Pipeline Assembly
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Train, calibrate, and serialize complete end-to-end classification pipelines (Scaler + optional PCA + Classifier).
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

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Cpu className="h-4 w-4 text-rose-600" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Training Workspace */}
      <form onSubmit={handleTrain} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Algorithm & Hyperparameters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-600" />
              Algorithm Selection
            </h2>
          </div>

          <div className="space-y-2.5">
            {algorithms.map((a) => (
              <label
                key={a.id}
                className={`p-3 rounded-xl border block cursor-pointer transition-all ${
                  algorithm === a.id
                    ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500/30'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{a.name}</span>
                  {a.recommended && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{a.desc}</p>
                <input
                  type="radio"
                  name="algorithm"
                  checked={algorithm === a.id}
                  onChange={() => setAlgorithm(a.id)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>

          {/* Hyperparameters Card */}
          <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
            <div className="font-bold text-slate-800">Hyperparameters:</div>

            {algorithm.includes('Forest') || algorithm.includes('Boosting') ? (
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Number of Estimators (Trees):</span>
                  <span className="font-mono font-bold text-indigo-600">{nEstimators}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={nEstimators}
                  onChange={(e) => setNEstimators(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            ) : null}

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Maximum Tree Depth:</span>
                <span className="font-mono font-bold text-indigo-600">{maxDepth}</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="2"
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Middle Column: Preprocessing & Split Config */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              Pipeline Transformations
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Feature Normalization */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Feature Scaler</label>
              <select
                value={scalerType}
                onChange={(e) => setScalerType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="StandardScaler">StandardScaler (Zero mean, unit variance)</option>
                <option value="MinMaxScaler">MinMaxScaler (Normalized to [0, 1])</option>
                <option value="RobustScaler">RobustScaler (Median & IQR robust to outliers)</option>
                <option value="None">None (Raw inputs for tree splits)</option>
              </select>
            </div>

            {/* Optional PCA */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-800 block">Include PCA Transformation</span>
                  <span className="text-[11px] text-slate-500">Apply dimensionality reduction before classifier</span>
                </div>
                <input
                  type="checkbox"
                  checked={pcaEnabled}
                  onChange={(e) => setPcaEnabled(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
              </label>

              {pcaEnabled && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600">PCA Components:</span>
                  <select
                    value={pcaComponents}
                    onChange={(e) => setPcaComponents(Number(e.target.value))}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                  >
                    <option value={2}>2 Components</option>
                    <option value={3}>3 Components</option>
                    <option value={4}>4 Components</option>
                  </select>
                </div>
              )}
            </div>

            {/* Train/Test Split Ratio */}
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span className="font-semibold">Held-Out Test Partition Ratio:</span>
                <span className="font-mono font-bold text-indigo-600">{(testSize * 100).toFixed(0)}% Test / {((1 - testSize) * 100).toFixed(0)}% Train</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.4"
                step="0.05"
                value={testSize}
                onChange={(e) => setTestSize(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Stratified sampling applied across all target classes.</p>
            </div>

            {/* Reproducible Random Seed */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reproducibility Seed</label>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={training}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50 text-xs"
            >
              {training ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
              <span>{training ? 'Fitting Pipeline & Evaluating...' : 'Start Training & Evaluation'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Training Completion & Quick Results */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-600" />
              Live Training Execution Results
            </h2>
            {trainResult && (
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {(trainResult.accuracy * 100).toFixed(1)}% Acc
              </span>
            )}
          </div>

          {trainResult ? (
            <div className="space-y-4 text-xs">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <div className="text-[10px] text-emerald-800 font-semibold">Test Accuracy</div>
                  <div className="text-xl font-bold font-mono text-emerald-700">{(trainResult.accuracy * 100).toFixed(2)}%</div>
                </div>
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <div className="text-[10px] text-indigo-800 font-semibold">Weighted F1-Score</div>
                  <div className="text-xl font-bold font-mono text-indigo-700">{(trainResult.f1_score * 100).toFixed(2)}%</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold">Precision</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{(trainResult.precision * 100).toFixed(2)}%</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold">Recall</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{(trainResult.recall * 100).toFixed(2)}%</div>
                </div>
              </div>

              {/* Training Specs */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Experiment ID:</span>
                  <span className="font-mono font-bold text-slate-900">{trainResult.experiment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Algorithm:</span>
                  <span className="font-semibold text-slate-900">{trainResult.algorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scaler:</span>
                  <span className="font-semibold text-slate-900">{trainResult.scaler_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PCA Applied:</span>
                  <span className="font-semibold text-slate-900">{trainResult.pca_enabled ? `Yes (${trainResult.pca_components} Comp)` : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Training Latency:</span>
                  <span className="font-mono text-slate-900">{trainResult.training_time_ms} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Test Partition:</span>
                  <span className="font-mono text-slate-900">{trainResult.test_samples} held-out samples</span>
                </div>
              </div>

              {/* Top Feature Importances */}
              {Object.keys(trainResult.feature_importances || {}).length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-800 text-xs">Top Influential Features:</div>
                  <div className="space-y-1">
                    {Object.entries(trainResult.feature_importances).slice(0, 4).map(([f, imp]) => (
                      <div key={f} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50">
                        <span className="font-mono text-slate-700">{f}</span>
                        <span className="font-mono font-bold text-indigo-600">{(imp * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation button to Model Performance Lab */}
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('ml-performance')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center justify-center gap-1.5 text-xs transition-all"
                >
                  Inspect Confusion Matrix in Performance Lab <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <Cpu className="h-8 w-8 text-slate-300 mx-auto" />
              <p>Configure algorithm and click <strong>Start Training & Evaluation</strong>.</p>
              <p className="text-[11px] text-slate-400">Model will be evaluated strictly on held-out test data.</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
