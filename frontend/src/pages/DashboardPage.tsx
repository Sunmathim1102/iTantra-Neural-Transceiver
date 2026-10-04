import React, { useEffect, useState } from 'react';
import {
  Radio,
  Activity,
  Wifi,
  Languages,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  BarChart2,
  ArrowUpRight
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
  Tooltip,
  Legend
} from 'recharts';
import { analyticsApi, sessionsApi } from '../services/api';
import { AnalyticsOverview, PaginatedSessions } from '../types';

interface DashboardPageProps {
  onSelectSession?: (sessionId: string) => void;
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectSession }) => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentSessions, setRecentSessions] = useState<PaginatedSessions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, sessions] = await Promise.all([
          analyticsApi.getOverview(),
          sessionsApi.listSessions({ limit: 6 })
        ]);
        setAnalytics(overview);
        setRecentSessions(sessions);
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
      <div className="p-12 text-center text-slate-400">
        <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-400" />
        Loading Transceiver Analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Health Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 glass-card">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Transceiver Network Command Center
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry, acoustic STT performance, and digital radio channel analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Neural Engine Online</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sessions</span>
            <Radio className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{analytics.total_sessions}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {analytics.today_sessions} processed today
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg STT Confidence</span>
            <Cpu className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">
            {(analytics.avg_stt_confidence * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            8 Indic Language Models
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average SNR</span>
            <Wifi className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {analytics.avg_snr_db} <span className="text-sm font-normal text-slate-400">dB</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Nominal Channel Range
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Channel BER</span>
            <Activity className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300 font-mono">
            {analytics.avg_ber}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg Latency: {analytics.avg_latency_ms} ms
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Session Volume & Indic Language Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sessions & SNR Timeline (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Transmission Sessions Timeline</h3>
              <p className="text-[11px] text-slate-400">Daily speech transmission throughput over 7 days</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.sessions_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="sessions" stroke="#6366f1" fillOpacity={1} fill="url(#colorSessions)" name="Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Indic Language Breakdown (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Indian Language Distribution</h3>
            <p className="text-[11px] text-slate-400">Share of transmitted dialects</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.language_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {analytics.language_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Intent Classification & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* NLP Intent Distribution (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">NLP Communication Intent Classes</h3>
            <p className="text-[11px] text-slate-400">Multinomial classification of transcripts</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.intent_distribution} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transmissions Table (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Transceiver Sessions</h3>
              <p className="text-[11px] text-slate-400">Live database session records</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-2">Session ID</th>
                  <th className="pb-2">Language</th>
                  <th className="pb-2">Intent</th>
                  <th className="pb-2">SNR</th>
                  <th className="pb-2">Quality</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentSessions?.sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-mono text-cyan-400 font-semibold">{s.session_id}</td>
                    <td className="py-2.5 text-slate-200">{s.detected_language}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px]">
                        {s.intent}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-300">{s.snr} dB</td>
                    <td className="py-2.5 font-semibold text-emerald-400">{s.quality_prediction}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {s.transmission_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
