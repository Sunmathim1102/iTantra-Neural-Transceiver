import React, { useEffect, useState } from 'react';
import { History, Trash2, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { sessionsApi } from '../services/api';
import { SessionSummary } from '../types';

interface HistoryPageProps { onViewSession: (id: string) => void; }

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
      setSessions(res.sessions); setTotal(res.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, [page, search]);

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    await sessionsApi.deleteSession(id); fetchSessions();
  };

  const QUALITY_COLOR: Record<string, string> = { Excellent: 'text-emerald-600', Good: 'text-indigo-600', Moderate: 'text-amber-600', Poor: 'text-rose-600' };
  const STATUS_STYLE: Record<string, string> = {
    SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DEGRADED: 'bg-amber-50 text-amber-700 border-amber-200',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 card-hover">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600"><History className="h-4 w-4" /></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Communication Archive</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Session History</h1>
          <p className="text-xs text-slate-500 mt-1">Complete log of all transceiver pipeline executions — {total} total records</p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input type="text" placeholder="Search sessions..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 w-64" />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-spacious">
            <thead>
              <tr>
                <th>Session ID</th><th>Language</th><th>Transcript</th><th>Intent</th>
                <th>SNR</th><th>BER</th><th>Quality</th><th>Status</th><th>Date</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400">Loading sessions...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400">No sessions found</td></tr>
              ) : sessions.map(s => (
                <tr key={s.id}>
                  <td className="font-mono text-indigo-600 font-bold text-[11px]">{s.session_id}</td>
                  <td className="font-medium">{s.detected_language}</td>
                  <td className="max-w-[160px]"><p className="truncate text-slate-600">{s.transcript}</p></td>
                  <td><span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-semibold">{s.intent}</span></td>
                  <td className="font-mono">{s.snr} dB</td>
                  <td className="font-mono text-rose-600">{s.ber}</td>
                  <td className={`font-bold ${QUALITY_COLOR[s.quality_prediction || ''] || 'text-slate-600'}`}>{s.quality_prediction}</td>
                  <td><span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_STYLE[s.transmission_status || 'SUCCESS']}`}>{s.transmission_status}</span></td>
                  <td className="text-slate-500 text-[10px]">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onViewSession(s.session_id)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteSession(s.session_id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">Showing {sessions.length} of {total} records</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 disabled:opacity-40 transition-colors cursor-pointer">
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 disabled:opacity-40 transition-colors cursor-pointer">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
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

  if (loading) return <div className="text-center py-12 text-slate-400 text-sm">Loading session details...</div>;
  if (!detail) return <div className="text-center py-12 text-rose-600 text-sm font-semibold">Session not found</div>;

  const s = detail.session; const tx = detail.transmission; const ml = detail.ml_prediction; const au = detail.audio;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to History
        </button>
        <h2 className="text-sm font-bold text-slate-900">Session: <span className="font-mono text-indigo-600">{s.session_id}</span></h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speech & Language */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 text-xs card-hover">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">📝 Speech & Language</h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed">{s.transcript}</div>
          {s.translated_text && s.translated_text !== s.transcript && (
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-slate-900 leading-relaxed">{s.translated_text}</div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {[['Language', s.detected_language], ['Confidence', `${((s.language_confidence || 0) * 100).toFixed(1)}%`], ['STT Confidence', `${((s.stt_confidence || 0) * 100).toFixed(1)}%`], ['Audio Duration', `${s.audio_duration}s`]].map(([l, v]) => (
              <div key={l} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px] font-semibold mb-0.5">{l}</div>
                <div className="text-slate-900 font-bold">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* NLP */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 text-xs card-hover">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">🧠 NLP Analysis</h3>
          <div className="grid grid-cols-2 gap-2">
            {[['Intent', s.intent, 'text-indigo-700'], ['Confidence', `${((s.intent_confidence || 0) * 100).toFixed(0)}%`, 'text-emerald-700'], ['Sentiment', s.sentiment, s.sentiment === 'Positive' ? 'text-emerald-700' : s.sentiment === 'Negative' ? 'text-rose-700' : 'text-slate-700'], ['Score', s.sentiment_score?.toFixed(2), 'text-slate-900']].map(([l, v, cls]) => (
              <div key={l} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px] font-semibold mb-0.5">{l}</div>
                <div className={`font-bold ${cls}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[10px] font-semibold mb-1">Keywords</div>
            <div className="text-indigo-700 font-medium">{s.keywords?.join(' • ')}</div>
          </div>
        </div>

        {/* Radio Transmission */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-xs card-hover">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">📡 Radio Transmission Record</h3>
          <div className="grid grid-cols-2 gap-2">
            {[['SNR', `${tx.snr} dB`, 'text-indigo-600'], ['BER', tx.ber, 'text-rose-600'], ['Latency', `${tx.latency_ms} ms`, 'text-amber-600'], ['Packet Loss', `${tx.packet_loss}%`, 'text-orange-600'], ['Signal Strength', `${tx.signal_strength} dBm`, 'text-slate-900'], ['Channel', tx.channel_type, 'text-slate-900'], ['Modulation', tx.modulation_scheme, 'text-slate-900'], ['Status', tx.transmission_status, tx.transmission_status === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700']].map(([l, v, cls]) => (
              <div key={l} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px] font-semibold mb-0.5">{l}</div>
                <div className={`font-mono font-bold ${cls}`}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ML Prediction */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 text-xs card-hover">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">🤖 ML Quality Prediction</h3>
          <div className={`p-5 rounded-xl border text-center ${ml.prediction === 'Excellent' ? 'bg-emerald-50 border-emerald-200' : ml.prediction === 'Good' ? 'bg-indigo-50 border-indigo-200' : ml.prediction === 'Moderate' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="text-2xl font-extrabold text-slate-900">{ml.prediction}</div>
            <div className="text-slate-500 mt-1">Confidence: {((ml.confidence || 0) * 100).toFixed(1)}%</div>
          </div>
          <div className="text-[10px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200"><span className="font-semibold text-slate-700">Model:</span> {ml.model_name}</div>
          {au.output_audio_url && (
            <div>
              <div className="text-[10px] text-slate-600 mb-1.5 font-semibold">🔊 Decoded TTS Voice Output</div>
              <audio src={au.output_audio_url} controls className="w-full h-8" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
