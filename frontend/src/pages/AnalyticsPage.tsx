import React, { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#8b5cf6','#ec4899','#3b82f6','#14b8a6'];

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { analyticsApi.getOverview().then(setData).catch(console.error).finally(()=>setLoading(false)); }, []);

  if (loading || !data) return <div className="text-center py-12 text-slate-400">Loading analytics...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><BarChart2 className="h-5 w-5 text-indigo-400"/>Analytics & Signal Intelligence Dashboard</h2>
        <p className="text-xs text-slate-400">Live-aggregated communication session statistics from database</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions Timeline */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
          <h3 className="text-sm font-semibold text-white mb-4">Session Volume (7 Days)</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.sessions_timeline} margin={{left:-20, right:10}}>
              <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="date" stroke="#475569" tick={{fontSize:10}}/><YAxis stroke="#475569" tick={{fontSize:10}}/>
              <Tooltip contentStyle={{backgroundColor:'#0f172a',borderColor:'#334155',borderRadius:'8px',fontSize:'11px'}}/>
              <Area type="monotone" dataKey="sessions" stroke="#6366f1" fill="url(#areaGrad)" name="Sessions"/>
            </AreaChart>
          </ResponsiveContainer></div>
        </div>
        {/* Language Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
          <h3 className="text-sm font-semibold text-white mb-4">Indian Dialect Distribution</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.language_distribution} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">
                {data.language_distribution.map((_:any, i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{backgroundColor:'#0f172a',borderColor:'#334155',borderRadius:'8px',fontSize:'11px'}}/>
              <Legend wrapperStyle={{fontSize:'10px'}}/>
            </PieChart>
          </ResponsiveContainer></div>
        </div>
        {/* Intent Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
          <h3 className="text-sm font-semibold text-white mb-4">NLP Intent Classification</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.intent_distribution} layout="vertical" margin={{left:60, right:10}}>
              <XAxis type="number" stroke="#475569" tick={{fontSize:10}}/><YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{fontSize:10}}/>
              <Tooltip contentStyle={{backgroundColor:'#0f172a',borderColor:'#334155',borderRadius:'8px',fontSize:'11px'}}/>
              <Bar dataKey="value" fill="#06b6d4" radius={[0,4,4,0]} name="Sessions"/>
            </BarChart>
          </ResponsiveContainer></div>
        </div>
        {/* Quality Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
          <h3 className="text-sm font-semibold text-white mb-4">ML Communication Quality Distribution</h3>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.quality_distribution} margin={{left:-20, right:10}}>
              <XAxis dataKey="name" stroke="#475569" tick={{fontSize:10}}/><YAxis stroke="#475569" tick={{fontSize:10}}/>
              <Tooltip contentStyle={{backgroundColor:'#0f172a',borderColor:'#334155',borderRadius:'8px',fontSize:'11px'}}/>
              <Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} name="Sessions"/>
            </BarChart>
          </ResponsiveContainer></div>
        </div>
      </div>
      {/* Channel Metrics Table */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h3 className="text-sm font-semibold text-white mb-4">Radio Channel Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wide">
              <th className="pb-2 text-left">Channel Model</th><th className="pb-2 text-left">Avg SNR (dB)</th>
              <th className="pb-2 text-left">Avg BER</th><th className="pb-2 text-left">Packet Loss</th><th className="pb-2 text-left">Sessions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.channel_metrics?.map((c:any) => (
                <tr key={c.channel} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 font-semibold text-slate-200">{c.channel}</td>
                  <td className="py-2.5 font-mono text-cyan-400">{c.avg_snr}</td>
                  <td className="py-2.5 font-mono text-rose-400">{c.avg_ber}</td>
                  <td className="py-2.5 font-mono text-amber-400">{c.packet_loss}%</td>
                  <td className="py-2.5 text-slate-300">{c.count}</td>
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

  useEffect(() => { analyticsApi.getHealth().then(setHealth).catch(console.error).finally(()=>setLoading(false)); }, []);

  if (loading || !health) return <div className="text-center py-12 text-slate-400">Loading system health...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white mb-1">🩺 System Health Monitor</h2>
        <p className="text-xs text-slate-400">Real-time status of all neural transceiver subsystems</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border text-center glass-card ${health.status==='OPERATIONAL'?'bg-emerald-500/5 border-emerald-500/30':'bg-rose-500/5 border-rose-500/30'}`}>
          <div className="text-3xl mb-2">{health.status==='OPERATIONAL'?'✅':'❌'}</div>
          <div className="font-bold text-white">{health.status}</div>
          <div className="text-xs text-slate-400 mt-1">Platform Status</div>
        </div>
        {[
          { label: 'Database', val: health.database_status, ok: health.database_status==='CONNECTED' },
          { label: 'ML Models Loaded', val: health.ml_models_loaded ? 'YES' : 'NO', ok: health.ml_models_loaded },
        ].map(item => (
          <div key={item.label} className={`p-5 rounded-2xl border text-center glass-card ${item.ok?'bg-emerald-500/5 border-emerald-500/30':'bg-rose-500/5 border-rose-500/30'}`}>
            <div className="text-3xl mb-2">{item.ok?'✅':'❌'}</div>
            <div className="font-bold text-white">{item.val}</div>
            <div className="text-xs text-slate-400 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { label: 'STT Engine', val: health.stt_engine },
          { label: 'TTS Engine', val: health.tts_engine },
          { label: 'Intent Model', val: health.nlp_intent_model },
          { label: 'Quality Model', val: health.comm_quality_model },
          { label: 'Uptime', val: `${Math.round(health.uptime_seconds)} seconds` },
          { label: 'System Time', val: new Date(health.system_time).toLocaleString('en-IN') },
        ].map(item => (
          <div key={item.label} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">{item.label}</span>
            <span className="text-slate-100 text-right max-w-[60%] truncate font-medium">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
