import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getUsers(), adminApi.getLogs()])
      .then(([u, l]) => { setUsers(u); setLogs(l); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const resetDemo = async () => {
    if (!confirm('Reset demo seed data?')) return;
    await adminApi.resetDemoData();
    alert('Demo data refreshed successfully!');
  };

  if (loading) return <div className="text-center py-12 text-slate-400">Loading admin data...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/90 border border-rose-500/30 glass-card">
        <div><h2 className="text-lg font-bold text-white mb-1">🛡️ Admin Command Center</h2><p className="text-xs text-slate-400">Restricted to ADMIN role only</p></div>
        <button onClick={resetDemo} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all">Reset Demo Data</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Total Users', users.length, 'text-cyan-400'], ['Total Sessions', users.reduce((a:number,u:any)=>a+(u.session_count||0),0), 'text-emerald-400'], ['Admin Users', users.filter((u:any)=>u.role==='ADMIN').length, 'text-rose-400'], ['System Logs', logs.length, 'text-indigo-400']].map(([l,v,c]) => (
          <div key={l as string} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card text-center">
            <div className="text-xs text-slate-400 mb-1">{l}</div>
            <div className={`text-2xl font-bold ${c}`}>{v}</div>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h3 className="text-sm font-semibold text-white mb-4">Registered Users</h3>
        <table className="w-full text-xs"><thead><tr className="text-slate-400 border-b border-slate-800 font-semibold">
          <th className="pb-2 text-left">Name</th><th className="pb-2 text-left">Email</th><th className="pb-2 text-left">Role</th><th className="pb-2 text-left">Sessions</th><th className="pb-2 text-left">Joined</th>
        </tr></thead><tbody className="divide-y divide-slate-800/60">
          {users.map((u:any) => (
            <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="py-2.5 text-white font-semibold">{u.name}</td>
              <td className="py-2.5 text-slate-400 font-mono">{u.email}</td>
              <td className="py-2.5"><span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${u.role==='ADMIN'?'bg-rose-950 text-rose-300 border-rose-800':'bg-slate-800 text-slate-300 border-slate-700'}`}>{u.role}</span></td>
              <td className="py-2.5 text-slate-300">{u.session_count}</td>
              <td className="py-2.5 text-slate-400 text-[10px]">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h3 className="text-sm font-semibold text-white mb-4">Recent System Audit Logs</h3>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {logs.map((log:any) => {
            const levelCls = log.level==='ERROR' ? 'bg-rose-950 text-rose-300' : log.level==='WARNING' ? 'bg-amber-950 text-amber-300' : 'bg-slate-900 text-slate-400';
            return (
              <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${levelCls}`}>{log.level}</span>
                <div className="flex-1 min-w-0"><div className="text-white font-semibold">{log.action}</div><div className="text-slate-400 truncate">{log.details}</div></div>
                <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const VivaGuidePage: React.FC = () => {
  const qnas = [
    { q: "What is the project iTantra?", a: "iTantra is an Indian Multilingual Neural Transceiver platform combining Speech-to-Text, Language Detection, NLP Intent Classification, Indian Translation, Radio/Wireless Channel simulation, ML-based Communication Quality prediction, and Text-to-Speech — all in a unified pipeline." },
    { q: "What is STT (Speech-to-Text)?", a: "STT converts spoken audio into text. We use the SpeechRecognition library with Google's engine, supporting 8 Indian language dialects (en-IN, hi-IN, ta-IN, te-IN, kn-IN, ml-IN, bn-IN, mr-IN)." },
    { q: "What is TTS (Text-to-Speech)?", a: "TTS synthesizes natural human speech from text. We use gTTS (Google Text-to-Speech) which natively supports all 8 Indian languages for realistic audio output." },
    { q: "How does language detection work?", a: "We use Unicode script range analysis — Devanagari (Hindi/Marathi), Tamil, Telugu, Kannada, Malayalam, Bengali scripts each have exclusive Unicode blocks. We count character frequency per block, then lexically disambiguate Hindi vs Marathi using vocabulary markers." },
    { q: "What ML algorithm is used for intent classification?", a: "TF-IDF vectorization (bigrams, 2500 features, sublinear TF scaling) combined with Multinomial Logistic Regression (L2 regularized, balanced class weights). Achieves 93.3% test accuracy across 8 intent categories." },
    { q: "What is TF-IDF?", a: "Term Frequency-Inverse Document Frequency weights words by how often they appear in a document vs how rare they are across all documents. Frequent but discriminative words get high weights, making it effective for classification." },
    { q: "What is the Random Forest model used for?", a: "A 100-tree Random Forest predicts communication quality (Excellent/Good/Moderate/Poor) from 9 features: SNR, BER, latency, packet loss, signal strength, message length, audio duration, channel type, and language. Trained on 5,000 synthetic samples, 98.4% accuracy." },
    { q: "What is SNR?", a: "Signal-to-Noise Ratio in dB = 10·log₁₀(Signal Power / Noise Power). Higher SNR means cleaner signal. Below 8 dB is poor quality; above 20 dB is excellent in our AWGN channel model." },
    { q: "What is BER?", a: "Bit Error Rate is the fraction of bits incorrectly received. For BPSK in AWGN: BER = 0.5 × erfc(√SNR_linear). BER < 0.001 indicates excellent transmission; > 0.05 means critical degradation." },
    { q: "What is AWGN?", a: "Additive White Gaussian Noise — the standard channel noise model where thermal noise is added as complex Gaussian samples. It's the baseline channel model for digital communication theory." },
    { q: "What is BPSK/QPSK?", a: "BPSK (Binary Phase Shift Keying): 1 bit/symbol — robust but slower. QPSK: 2 bits/symbol — twice the throughput but more susceptible to noise. Both are implemented with real numpy arrays and scipy erfc for theoretical BER." },
    { q: "What is the confusion matrix?", a: "A square matrix showing predicted vs actual class counts. Diagonal = correct predictions. Off-diagonal = misclassifications. Used to compute precision, recall, and F1-score per class." },
    { q: "What is F1-Score?", a: "F1 = 2 × (Precision × Recall) / (Precision + Recall). It balances false positives and false negatives. Important for imbalanced datasets like our intent classes (Emergency is rarer than Normal Communication)." },
    { q: "What database is used and why?", a: "SQLite (development) via SQLAlchemy ORM for zero-configuration local use. PostgreSQL-ready with a single DATABASE_URL change. Tables: Users, CommunicationSessions, TransmissionRecords, MLPredictions, AudioRecords, SystemLogs — with foreign keys and indexes." },
    { q: "How is authentication implemented?", a: "bcrypt password hashing, JWT tokens (HS256 algorithm, 24h expiry) via python-jose. Tokens are validated on every protected API endpoint via FastAPI dependency injection. Role-based: USER and ADMIN." },
    { q: "What are the project limitations?", a: "1) Offline STT falls back to demo text. 2) TTS requires internet for gTTS. 3) Translation accuracy depends on Google Translate API availability. 4) Communication quality model is trained on synthetic data. 5) Real RF hardware integration is not included." },
    { q: "What are future enhancements?", a: "1) Whisper-based offline STT. 2) IndicTrans2 for offline Indian language translation. 3) Real SDR (Software Defined Radio) hardware integration. 4) Federated learning for personalized language models. 5) WebRTC for true real-time voice streaming." },
  ];

  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white mb-1">📖 Viva / Project Review Exam Guide</h2>
        <p className="text-xs text-slate-400">{qnas.length} technical Q&A covering ML, Signal Processing, NLP, and Database concepts</p>
      </div>
      <div className="space-y-3">
        {qnas.map((qa, i) => (
          <div key={i} className="rounded-2xl bg-slate-900/90 border border-slate-800 glass-card overflow-hidden">
            <button className="w-full flex items-center justify-between px-5 py-4 text-left text-xs font-semibold text-white hover:bg-slate-800/60 transition-colors" onClick={()=>setOpen(open===i?null:i)}>
              <span className="flex items-center gap-2"><span className="text-indigo-400 font-mono">Q{i+1}.</span>{qa.q}</span>
              <span className="text-slate-400 ml-2">{open===i?'▲':'▼'}</span>
            </button>
            {open===i && (
              <div className="px-5 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
                <span className="text-emerald-400 font-semibold">A: </span>{qa.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
