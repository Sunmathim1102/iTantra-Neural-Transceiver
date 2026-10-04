import React, { useEffect, useState } from 'react';
import { History, Trash2, Eye, Search } from 'lucide-react';
import { sessionsApi } from '../services/api';
import { SessionSummary } from '../types';

interface HistoryPageProps {
  onViewSession: (id: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onViewSession }) => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await sessionsApi.listSessions({ page, limit: 10, search: search || undefined });
      setSessions(res.sessions);
      setTotal(res.total);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, [page, search]);

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    await sessionsApi.deleteSession(id);
    fetchSessions();
  };

  const QUALITY_COLOR: Record<string,string> = { Excellent: 'text-emerald-400', Good: 'text-cyan-400', Moderate: 'text-amber-400', Poor: 'text-rose-400' };
  const STATUS_COLOR: Record<string,string> = { SUCCESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', DEGRADED: 'bg-amber-500/10 text-amber-400 border-amber-500/20', FAILED: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><History className="h-5 w-5 text-indigo-400"/>Communication Session History</h2>
        <p className="text-xs text-slate-400">Complete log of all transceiver pipeline executions ({total} total)</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500"/>
          <input type="text" placeholder="Search sessions..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"/>
        </div>
      </div>
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-800">
              <tr className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">
                <th className="px-4 py-3 text-left">Session ID</th>
                <th className="px-4 py-3 text-left">Language</th>
                <th className="px-4 py-3 text-left">Transcript</th>
                <th className="px-4 py-3 text-left">Intent</th>
                <th className="px-4 py-3 text-left">SNR</th>
                <th className="px-4 py-3 text-left">BER</th>
                <th className="px-4 py-3 text-left">Quality</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8 text-slate-400">Loading sessions...</td></tr>
              ) : sessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-cyan-400 font-bold text-[11px]">{s.session_id}</td>
                  <td className="px-4 py-3 text-slate-200">{s.detected_language}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-[180px]"><p className="truncate">{s.transcript}</p></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px]">{s.intent}</span></td>
                  <td className="px-4 py-3 font-mono">{s.snr} dB</td>
                  <td className="px-4 py-3 font-mono text-rose-300">{s.ber}</td>
                  <td className={`px-4 py-3 font-bold ${QUALITY_COLOR[s.quality_prediction||''] || 'text-slate-300'}`}>{s.quality_prediction}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_COLOR[s.transmission_status||'SUCCESS']}`}>{s.transmission_status}</span></td>
                  <td className="px-4 py-3 text-slate-400 text-[10px]">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={()=>onViewSession(s.session_id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"><Eye className="h-3.5 w-3.5"/></button>
                      <button onClick={()=>deleteSession(s.session_id)} className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
          <span className="text-xs text-slate-400">Showing {sessions.length} of {total} records</span>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 disabled:opacity-40 transition-colors">Previous</button>
            <button disabled={page*10>=total} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SessionDetailPage: React.FC<{ sessionId: string; onBack: () => void }> = ({ sessionId, onBack }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionsApi.getSessionDetails(sessionId).then(setDetail).catch(console.error).finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="text-center py-12 text-slate-400">Loading session details...</div>;
  if (!detail) return <div className="text-center py-12 text-rose-400">Session not found</div>;

  const s = detail.session; const tx = detail.transmission; const ml = detail.ml_prediction; const au = detail.audio;
  return (
    <div className="space-y-5 pb-12">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors">← Back to History</button>
        <h2 className="text-sm font-bold text-white">Session: <span className="font-mono text-cyan-400">{s.session_id}</span></h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* STT & Language */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-white">📝 Speech & Language</h3>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 leading-relaxed">{s.transcript}</div>
          {s.translated_text && s.translated_text !== s.transcript && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800 text-cyan-200 leading-relaxed">{s.translated_text}</div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {[['Language', s.detected_language], ['Confidence', `${((s.language_confidence||0)*100).toFixed(1)}%`], ['STT Confidence', `${((s.stt_confidence||0)*100).toFixed(1)}%`], ['Audio Duration', `${s.audio_duration}s`]].map(([l,v])=>(
              <div key={l} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700"><div className="text-slate-500 text-[10px]">{l}</div><div className="text-white font-bold">{v}</div></div>
            ))}
          </div>
        </div>
        {/* NLP */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-white">🧠 NLP Analysis</h3>
          <div className="grid grid-cols-2 gap-2">
            {[['Intent', s.intent, 'text-indigo-300'], ['Confidence', `${((s.intent_confidence||0)*100).toFixed(0)}%`, 'text-cyan-300'], ['Sentiment', s.sentiment, s.sentiment==='Positive'?'text-emerald-400':s.sentiment==='Negative'?'text-rose-400':'text-slate-300'], ['Score', s.sentiment_score?.toFixed(2), 'text-slate-200']].map(([l,v,cls])=>(
              <div key={l} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700"><div className="text-slate-500 text-[10px]">{l}</div><div className={`font-bold ${cls}`}>{v}</div></div>
            ))}
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700"><div className="text-slate-500 text-[10px] mb-1">Keywords</div><div className="text-cyan-300">{s.keywords?.join(' • ')}</div></div>
        </div>
        {/* Radio Transmission */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-white">📡 Radio Transmission Record</h3>
          <div className="grid grid-cols-2 gap-2">
            {[['SNR', `${tx.snr} dB`, 'text-cyan-400'], ['BER', tx.ber, 'text-rose-400'], ['Latency', `${tx.latency_ms} ms`, 'text-amber-400'], ['Packet Loss', `${tx.packet_loss}%`, 'text-orange-400'], ['Signal Strength', `${tx.signal_strength} dBm`, 'text-violet-400'], ['Channel', tx.channel_type, 'text-slate-200'], ['Modulation', tx.modulation_scheme, 'text-slate-200'], ['Status', tx.transmission_status, tx.transmission_status==='SUCCESS'?'text-emerald-400':'text-rose-400']].map(([l,v,cls])=>(
              <div key={l} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700"><div className="text-slate-500 text-[10px]">{l}</div><div className={`font-mono font-bold ${cls}`}>{v}</div></div>
            ))}
          </div>
        </div>
        {/* ML Prediction */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-white">🤖 ML Quality Prediction</h3>
          <div className={`p-4 rounded-xl border text-center ${ml.prediction==='Excellent'?'bg-emerald-500/10 border-emerald-500/30':ml.prediction==='Good'?'bg-cyan-500/10 border-cyan-500/30':ml.prediction==='Moderate'?'bg-amber-500/10 border-amber-500/30':'bg-rose-500/10 border-rose-500/30'}`}>
            <div className="text-2xl font-extrabold text-white">{ml.prediction}</div>
            <div className="text-slate-400 mt-1">Confidence: {((ml.confidence||0)*100).toFixed(1)}%</div>
          </div>
          <div className="text-[10px] text-slate-400"><span className="font-semibold text-slate-300">Model:</span> {ml.model_name}</div>
          {au.output_audio_url && (
            <div className="mt-2">
              <div className="text-[10px] text-slate-400 mb-1 font-semibold">🔊 Decoded TTS Voice Output</div>
              <audio src={au.output_audio_url} controls className="w-full h-8"/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
