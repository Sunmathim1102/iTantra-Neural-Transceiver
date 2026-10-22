import React, { useEffect, useState } from 'react';
import {
  Radio,
  Activity,
  Wifi,
  Languages,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Database,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { analyticsApi, sessionsApi, mlApi } from '../services/api';
import { AnalyticsOverview, PaginatedSessions } from '../types';
import { DataLifecycleWorkflow } from '../components/DataLifecycleWorkflow';
import { NavTab } from '../components/Sidebar';

export interface DashboardPageProps {
  onSelectSession?: (sessionId: string) => void;
  onNavigate?: (tab: NavTab) => void;
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectSession, onNavigate }) => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentSessions, setRecentSessions] = useState<PaginatedSessions | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, sessions, wf] = await Promise.all([
          analyticsApi.getOverview(),
          sessionsApi.listSessions({ limit: 6 }),
          mlApi.getWorkflowStatus().catch(() => null)
        ]);
        setAnalytics(overview);
        setRecentSessions(sessions);
        setWorkflowStatus(wf);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
        <p className="text-xs font-semibold">Loading iTantra Intelligence Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Interactive Connected Data Science Lifecycle Banner */}
      <DataLifecycleWorkflow
        currentStageId="prediction"
        onSelectStage={onNavigate}
        activeModelInfo={workflowStatus?.active_model}
      />

      {/* Top Welcome Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Radio className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              iTantra Intelligence Dashboard
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Pipeline Online
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Unified telecommunication & machine learning telemetry: Multilingual speech recognition, physics-based RF channel access, and adaptive ML link quality monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('live-transceiver')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 flex items-center gap-2 transition-all"
            >
              <Radio className="h-4 w-4" />
              <span>Launch Live Transceiver</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Communication Sessions</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Radio className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{analytics.total_sessions}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {analytics.today_sessions} sessions today
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Acoustic STT Confidence</span>
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Cpu className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-cyan-700 font-mono">
            {(analytics.avg_stt_confidence * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            8 Indic Language Engines
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Average RF SNR</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Wifi className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {analytics.avg_snr_db} <span className="text-sm font-normal text-slate-500">dB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Nominal AWGN / Rayleigh Range
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Bit Error Rate (BER)</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {analytics.avg_ber}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg Latency: <strong className="text-slate-800">{analytics.avg_latency_ms} ms</strong>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Session Volume & Indic Language Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sessions & SNR Timeline (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transmission Sessions Timeline</h3>
              <p className="text-xs text-slate-500">Daily speech transmission throughput over 7-day period</p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Detailed Analytics <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.sessions_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sessGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#sessGradient)" name="Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Indic Language Breakdown (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Multilingual Distribution</h3>
            <p className="text-xs text-slate-500">Indic dialects processed across sessions</p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.language_distribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {analytics.language_distribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {analytics.language_distribution.slice(0, 6).map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="text-slate-900 font-mono font-bold ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: ML Quick Access Links & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ML Lifecycle Modules Hub (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-600" />
                Data Science & ML Lifecycle Modules
              </h3>
              <p className="text-xs text-slate-500">Direct navigation to active academic ML pipeline workspaces.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'ml-hub' as NavTab, title: 'Data Intelligence Hub', desc: 'Dataset catalogs, schema verification & uploads', icon: <Database className="h-4 w-4 text-indigo-600" /> },
              { id: 'ml-eda' as NavTab, title: 'Dataset Insights (EDA)', desc: 'Univariate & multivariate statistical analytics', icon: <Activity className="h-4 w-4 text-cyan-600" /> },
              { id: 'ml-scaling' as NavTab, title: 'Feature Normalization', desc: 'Leakage-free StandardScaler & RobustScaler', icon: <Layers className="h-4 w-4 text-emerald-600" /> },
              { id: 'ml-pca' as NavTab, title: 'Principal Component Explorer', desc: 'Scree plot, loadings matrix & 2D/3D projection', icon: <TrendingUp className="h-4 w-4 text-amber-600" /> },
              { id: 'ml-training' as NavTab, title: 'Model Training Center', desc: 'Train Random Forest, Decision Tree & LogReg', icon: <Cpu className="h-4 w-4 text-purple-600" /> },
              { id: 'ml-performance' as NavTab, title: 'Model Performance Lab', desc: 'Confusion matrices & held-out benchmarks', icon: <Award className="h-4 w-4 text-rose-600" /> },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onNavigate && onNavigate(m.id)}
                className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-400 bg-slate-50/50 hover:bg-white text-left transition-all card-hover group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200">{m.icon}</div>
                  <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{m.title}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Communication Sessions (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Transceiver Sessions</h3>
              <p className="text-xs text-slate-500">Live radio access transmissions and quality predictions</p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View Archive <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {recentSessions?.sessions.map((sess) => (
              <div
                key={sess.session_id}
                onClick={() => onSelectSession && onSelectSession(sess.session_id)}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-slate-300 cursor-pointer transition-all flex items-center justify-between text-xs"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-slate-900 text-[11px]">{sess.session_id}</span>
                    <span className="px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-bold">
                      {sess.detected_language}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SNR: {sess.snr}dB
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{sess.transcript || 'No transcript'}</p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sess.quality_prediction === 'Excellent'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : sess.quality_prediction === 'Good'
                        ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                        : sess.quality_prediction === 'Moderate'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {sess.quality_prediction || 'Good'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
