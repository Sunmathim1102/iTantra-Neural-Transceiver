import React from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Sparkles,
  Sliders,
  Scissors,
  Layers,
  Cpu,
  Award,
  Zap,
  Activity,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface StageConfig {
  id: string;
  name: string;
  category: string;
  tabTarget?: NavTab;
  icon: React.ReactNode;
  description: string;
}

const STAGES: StageConfig[] = [
  { id: 'raw-dataset', name: 'Raw Dataset', category: 'Ingestion', tabTarget: 'ml-hub', icon: <Database className="h-4 w-4" />, description: 'CSV data ingestion & file integrity checks' },
  { id: 'data-validation', name: 'Data Validation', category: 'Schema', tabTarget: 'ml-hub', icon: <CheckCircle2 className="h-4 w-4" />, description: 'Dimension, column types, & schema checks' },
  { id: 'data-quality-assessment', name: 'Quality Assessment', category: 'Quality', tabTarget: 'ml-quality', icon: <AlertCircle className="h-4 w-4" />, description: 'Missing, duplicate & infinite detection' },
  { id: 'eda', name: 'Dataset Insights (EDA)', category: 'Exploration', tabTarget: 'ml-eda', icon: <BarChart2 className="h-4 w-4" />, description: 'Numerical statistics, histograms & heatmaps' },
  { id: 'data-cleaning', name: 'Data Quality Center', category: 'Cleaning', tabTarget: 'ml-quality', icon: <Scissors className="h-4 w-4" />, description: 'Versioned imputation & outlier clipping' },
  { id: 'feature-engineering', name: 'Feature Engineering Lab', category: 'Features', tabTarget: 'ml-features', icon: <Sliders className="h-4 w-4" />, description: 'RF channel metrics & interaction terms' },
  { id: 'train-test-split', name: 'Train / Test Split', category: 'Partition', tabTarget: 'ml-scaling', icon: <Scissors className="h-4 w-4" />, description: 'Strict 80/20 split preventing data leakage' },
  { id: 'feature-scaling', name: 'Feature Normalization', category: 'Scaling', tabTarget: 'ml-scaling', icon: <Sliders className="h-4 w-4" />, description: 'StandardScaler / MinMaxScaler on Train only' },
  { id: 'pca', name: 'Principal Component Explorer', category: 'Reduction', tabTarget: 'ml-pca', icon: <Layers className="h-4 w-4" />, description: 'Scikit-learn PCA, scree & 2D/3D projections' },
  { id: 'model-training', name: 'Model Training Center', category: 'Training', tabTarget: 'ml-training', icon: <Cpu className="h-4 w-4" />, description: 'Random Forest, Decision Tree, Logistic Reg' },
  { id: 'model-evaluation', name: 'Model Performance Lab', category: 'Evaluation', tabTarget: 'ml-performance', icon: <Award className="h-4 w-4" />, description: 'Held-out test metrics, confusion matrix & F1' },
  { id: 'prediction', name: 'Intelligence Inference', category: 'Inference', tabTarget: 'ml-model', icon: <Zap className="h-4 w-4" />, description: 'Real-time transceiver link quality prediction' },
  { id: 'model-monitoring', name: 'ML Experiment Registry', category: 'Registry', tabTarget: 'ml-registry', icon: <Activity className="h-4 w-4" />, description: 'Model versioning & 1-click active deployment' },
];

interface DataLifecycleWorkflowProps {
  currentStageId?: string;
  onSelectStage?: (tab: NavTab) => void;
  activeModelInfo?: {
    algorithm: string;
    accuracy: number;
    f1_score: number;
    experiment_id: string;
  };
}

export const DataLifecycleWorkflow: React.FC<DataLifecycleWorkflowProps> = ({
  currentStageId,
  onSelectStage,
  activeModelInfo,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Connected End-to-End Machine Learning Lifecycle
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Validated Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive, inspectable workflow linking raw dataset ingestion, exploratory analysis, PCA, model training, and transceiver quality inference.
          </p>
        </div>

        {activeModelInfo && (
          <div className="flex items-center gap-3 px-3.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500">Active Pipeline:</span>
            <span className="font-semibold text-slate-800">{activeModelInfo.algorithm}</span>
            <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {(activeModelInfo.accuracy * 100).toFixed(1)}% Acc
            </span>
          </div>
        )}
      </div>

      {/* Horizontal scrolling stage map */}
      <div className="mt-5 overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center min-w-[1100px] gap-2">
          {STAGES.map((stage, idx) => {
            const isSelected = currentStageId === stage.id;
            const isLast = idx === STAGES.length - 1;

            return (
              <React.Fragment key={stage.id}>
                <button
                  type="button"
                  onClick={() => stage.tabTarget && onSelectStage && onSelectStage(stage.tabTarget)}
                  className={`flex-1 min-w-[130px] text-left p-3 rounded-xl border transition-all card-hover group ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
                      : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-600">
                      Step {idx + 1}
                    </span>
                    <span className={`p-1 rounded-md ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:text-indigo-600 group-hover:bg-indigo-50'}`}>
                      {stage.icon}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {stage.name}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {stage.description}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Ready
                    </span>
                    <span className="text-[10px] text-indigo-600 opacity-0 group-hover:opacity-100 font-semibold transition-opacity">
                      Open →
                    </span>
                  </div>
                </button>

                {!isLast && (
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 shrink-0 mx-0.5" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
