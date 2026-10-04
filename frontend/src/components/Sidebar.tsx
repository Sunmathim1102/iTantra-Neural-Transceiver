import React from 'react';
import {
  Radio,
  LayoutDashboard,
  Mic,
  Languages,
  ArrowRightLeft,
  FileText,
  Activity,
  Cpu,
  History,
  BarChart3,
  HeartPulse,
  BookOpen,
  ShieldAlert
} from 'lucide-react';
import { User } from '../types';

export type NavTab =
  | 'live-transceiver'
  | 'dashboard'
  | 'stt'
  | 'language-detection'
  | 'translation'
  | 'nlp-analysis'
  | 'radio-simulation'
  | 'ml-model'
  | 'history'
  | 'analytics'
  | 'system-monitoring'
  | 'viva-guide'
  | 'admin';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, user }) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string; adminOnly?: boolean }> = [
    { id: 'live-transceiver', label: 'Live Transceiver', icon: <Radio className="h-4 w-4" />, badge: 'Showcase' },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'stt', label: 'Speech-to-Text', icon: <Mic className="h-4 w-4" /> },
    { id: 'language-detection', label: 'Language Detection', icon: <Languages className="h-4 w-4" /> },
    { id: 'translation', label: 'Translation (Indic)', icon: <ArrowRightLeft className="h-4 w-4" /> },
    { id: 'nlp-analysis', label: 'NLP & Intent Analysis', icon: <FileText className="h-4 w-4" /> },
    { id: 'radio-simulation', label: 'Radio Simulation', icon: <Activity className="h-4 w-4" /> },
    { id: 'ml-model', label: 'ML Quality Predictor', icon: <Cpu className="h-4 w-4" />, badge: '98.4% Acc' },
    { id: 'history', label: 'Session History', icon: <History className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics & Insights', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'system-monitoring', label: 'System Health', icon: <HeartPulse className="h-4 w-4" /> },
    { id: 'viva-guide', label: 'Viva Exam Guide', icon: <BookOpen className="h-4 w-4" />, badge: 'Q&A' },
    { id: 'admin', label: 'Admin Dashboard', icon: <ShieldAlert className="h-4 w-4" />, adminOnly: true },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'ADMIN') return null;

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-500 text-white shadow-lg shadow-indigo-600/20 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-cyan-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400">
        <div className="flex items-center justify-between font-semibold text-slate-300 mb-1">
          <span>Supported Indic Dialects</span>
          <span className="text-emerald-400">8</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          EN, HI, TA, TE, KN, ML, BN, MR
        </p>
      </div>
    </aside>
  );
};
