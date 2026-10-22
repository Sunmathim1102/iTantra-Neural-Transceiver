import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Mic,
  Languages,
  Volume2,
  History,
  Database,
  BarChart2,
  Scissors,
  Sliders,
  Layers,
  Cpu,
  Award,
  Sparkles,
  Activity,
  Zap,
  RadioTower,
  ShieldCheck,
  HeartPulse,
  BookOpen
} from 'lucide-react';
import { User } from '../types';

export type NavTab =
  | 'dashboard'
  | 'live-transceiver'
  | 'stt'
  | 'language-detection'
  | 'translation'
  | 'history'
  | 'ml-hub'
  | 'ml-eda'
  | 'ml-quality'
  | 'ml-features'
  | 'ml-scaling'
  | 'ml-pca'
  | 'ml-training'
  | 'ml-performance'
  | 'ml-explainability'
  | 'ml-registry'
  | 'ml-model'
  | 'radio-simulation'
  | 'nlp-analysis'
  | 'analytics'
  | 'system-monitoring'
  | 'viva-guide'
  | 'admin';

interface SidebarGroup {
  label: string;
  items: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    adminOnly?: boolean;
  }>;
}

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, user }) => {
  const groups: SidebarGroup[] = [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'iTantra Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { id: 'live-transceiver', label: 'Live Transceiver', icon: <Radio className="h-4 w-4" />, badge: 'Live' },
        { id: 'stt', label: 'Voice Transcription', icon: <Mic className="h-4 w-4" /> },
        { id: 'language-detection', label: 'Language Intelligence', icon: <Languages className="h-4 w-4" /> },
        { id: 'translation', label: 'Neural Voice Synthesis', icon: <Volume2 className="h-4 w-4" /> },
        { id: 'history', label: 'Communication Archive', icon: <History className="h-4 w-4" /> },
      ],
    },
    {
      label: 'MACHINE LEARNING',
      items: [
        { id: 'ml-hub', label: 'Data Intelligence Hub', icon: <Database className="h-4 w-4" /> },
        { id: 'ml-eda', label: 'Dataset Insights Studio', icon: <BarChart2 className="h-4 w-4" />, badge: 'EDA' },
        { id: 'ml-quality', label: 'Data Quality Center', icon: <Scissors className="h-4 w-4" /> },
        { id: 'ml-features', label: 'Feature Engineering Lab', icon: <Sliders className="h-4 w-4" /> },
        { id: 'ml-scaling', label: 'Feature Normalization', icon: <Sliders className="h-4 w-4" /> },
        { id: 'ml-pca', label: 'Principal Component Explorer', icon: <Layers className="h-4 w-4" />, badge: 'PCA' },
        { id: 'ml-training', label: 'Model Training Center', icon: <Cpu className="h-4 w-4" /> },
        { id: 'ml-performance', label: 'Model Performance Lab', icon: <Award className="h-4 w-4" /> },
        { id: 'ml-explainability', label: 'Model Explainability Center', icon: <Sparkles className="h-4 w-4" /> },
        { id: 'ml-registry', label: 'ML Experiment Registry', icon: <Activity className="h-4 w-4" /> },
        { id: 'ml-model', label: 'Intelligence Inference Center', icon: <Zap className="h-4 w-4" />, badge: 'Active' },
      ],
    },
    {
      label: 'RADIO & SIGNALS',
      items: [
        { id: 'radio-simulation', label: 'Neural Transmission Lab', icon: <RadioTower className="h-4 w-4" /> },
        { id: 'nlp-analysis', label: 'Signal Quality Monitor', icon: <Activity className="h-4 w-4" /> },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'admin', label: 'Admin Dashboard', icon: <ShieldCheck className="h-4 w-4" />, adminOnly: true },
        { id: 'system-monitoring', label: 'System Health', icon: <HeartPulse className="h-4 w-4" /> },
        { id: 'viva-guide', label: 'Viva Exam Guide', icon: <BookOpen className="h-4 w-4" />, badge: 'Q&A' },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/90 bg-white flex flex-col justify-between p-3 shrink-0 overflow-y-auto scrollbar-thin">
      <div className="space-y-4">
        {groups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || user?.role === 'ADMIN');
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
              {visibleItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 mt-4">
        <div className="flex items-center justify-between font-semibold text-slate-700 mb-0.5">
          <span>Supported Indic Dialects</span>
          <span className="text-emerald-600 font-bold">8</span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono">
          EN, HI, TA, TE, KN, ML, BN, MR
        </p>
      </div>
    </aside>
  );
};
