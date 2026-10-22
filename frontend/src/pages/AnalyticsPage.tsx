import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Activity } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#4f46e5','#06b6d4','#10b981','#f59e0b','#8b5cf6','#ec4899','#3b82f6','#14b8a6'];
const TOOLTIP_STYLE = { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { analyticsApi.getOverview().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading || !data) return <div className="text-center py-12 text-slate-400 text-sm">Loading analytics...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><BarChart2 className="h-4 w-4" /></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Analytics Dashboard</span>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Signal Intelligence & Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Live-aggregated communication session statistics from database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions Timeline */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3 card-hover">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Session Volume (7 Days)</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.sessions_timeline} margin={{ left: -20, right: 10 }}>
              <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} /><YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={2} fill="url(#areaGrad)" name="Sessions" />
            </AreaChart>
          </ResponsiveContainer></div>
        </div>

        {/* Language Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3 card-hover">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Indian Dialect Distribution</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.language_distribution} cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={3} dataKey="value">
                {data.language_distribution.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#475569' }} />
            </PieChart>
          </ResponsiveContainer></div>
        </div>

        {/* Intent Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3 card-hover">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">NLP Intent Classification</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.intent_distribution} layout="vertical" margin={{ left: 70, right: 10 }}>
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer></div>
        </div>

        {/* Quality Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3 card-hover">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">ML Communication Quality Distribution</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.quality_distribution} margin={{ left: -20, right: 10 }}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer></div>
        </div>
      </div>

      {/* Channel Metrics Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Radio Channel Performance Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-spacious">
            <thead><tr><th>Channel Model</th><th>Avg SNR (dB)</th><th>Avg BER</th><th>Packet Loss</th><th>Sessions</th></tr></thead>
            <tbody>
              {data.channel_metrics?.map((c: any) => (
                <tr key={c.channel}>
                  <td className="font-semibold">{c.channel}</td>
                  <td className="font-mono text-indigo-600">{c.avg_snr}</td>
                  <td className="font-mono text-rose-600">{c.avg_ber}</td>
                  <td className="font-mono text-amber-600">{c.packet_loss}%</td>
                  <td className="font-medium">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const SystemMonitoringPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { analyticsApi.getHealth().then(setHealth).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading || !health) return <div className="text-center py-12 text-slate-400 text-sm">Loading system health...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><Activity className="h-4 w-4" /></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">System Health</span>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">System Health Monitor</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time status of all neural transceiver subsystems.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: 'Platform Status', val: health.status, ok: health.status === 'OPERATIONAL' },
          { label: 'Database', val: health.database_status, ok: health.database_status === 'CONNECTED' },
          { label: 'ML Models Loaded', val: health.ml_models_loaded ? 'YES' : 'NO', ok: health.ml_models_loaded },
        ].map(item => (
          <div key={item.label} className={`p-6 rounded-2xl border text-center card-hover ${item.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="text-3xl mb-2">{item.ok ? '✅' : '❌'}</div>
            <div className={`font-extrabold text-lg ${item.ok ? 'text-emerald-800' : 'text-rose-800'}`}>{item.val}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { label: 'STT Engine', val: health.stt_engine },
          { label: 'TTS Engine', val: health.tts_engine },
          { label: 'Intent Model', val: health.nlp_intent_model },
          { label: 'Quality Model', val: health.comm_quality_model },
          { label: 'Uptime', val: `${Math.round(health.uptime_seconds)} seconds` },
          { label: 'System Time', val: new Date(health.system_time).toLocaleString('en-IN') },
        ].map(item => (
          <div key={item.label} className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs card-hover">
            <span className="text-slate-500 font-semibold">{item.label}</span>
            <span className="text-slate-900 text-right max-w-[60%] truncate font-bold">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
