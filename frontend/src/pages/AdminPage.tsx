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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-rose-200 shadow-sm card-hover">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs">🛡️ ADMIN</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Restricted Access</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Admin Command Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">System administration, telemetry logs, and role management</p>
        </div>
        <button
          onClick={resetDemo}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
        >
          Reset Demo Data
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Total Users', users.length, 'text-cyan-600', 'bg-cyan-50 border-cyan-100'],
          ['Total Sessions', users.reduce((a: number, u: any) => a + (u.session_count || 0), 0), 'text-emerald-600', 'bg-emerald-50 border-emerald-100'],
          ['Admin Users', users.filter((u: any) => u.role === 'ADMIN').length, 'text-rose-600', 'bg-rose-50 border-rose-100'],
          ['System Logs', logs.length, 'text-indigo-600', 'bg-indigo-50 border-indigo-100']
        ].map(([l, v, c, bg]) => (
          <div key={l as string} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center card-hover">
            <div className="text-xs font-medium text-slate-500 mb-1.5">{l}</div>
            <div className={`text-2xl font-extrabold ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Registered Users</h3>
        <div className="overflow-x-auto">
          <table className="table-spacious w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200 font-semibold bg-slate-50/50">
                <th className="py-3 px-3 text-left">Name</th>
                <th className="py-3 px-3 text-left">Email</th>
                <th className="py-3 px-3 text-left">Role</th>
                <th className="py-3 px-3 text-left">Sessions</th>
                <th className="py-3 px-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-slate-900 font-semibold">{u.name}</td>
                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{u.session_count}</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Recent System Audit Logs</h3>
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {logs.map((log: any) => {
            const levelCls = log.level === 'ERROR'
              ? 'bg-rose-100 text-rose-700 border border-rose-200'
              : log.level === 'WARNING'
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200';
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs hover:bg-slate-50 transition-colors">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${levelCls}`}>{log.level}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 font-semibold">{log.action}</div>
                  <div className="text-slate-500 truncate mt-0.5">{log.details}</div>
                </div>
                <span className="text-slate-400 text-[10px] shrink-0 font-mono">{log.timestamp}</span>
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
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">📖 ACADEMIC VIVA</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Technical Q&A Guide</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Viva & Project Review Exam Guide</h2>
        <p className="text-xs text-slate-500 mt-1">{qnas.length} comprehensive technical questions covering ML, Signal Processing, NLP, and Database Architecture</p>
      </div>
      <div className="space-y-3">
        {qnas.map((qa, i) => (
          <div key={i} className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden card-hover">
            <button
              className="w-full flex items-center justify-between px-6 py-4 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50/80 transition-colors cursor-pointer"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-mono font-bold text-[11px]">Q{i + 1}</span>
                <span className="text-slate-900 font-medium">{qa.q}</span>
              </span>
              <span className="text-slate-400 font-mono ml-3 text-xs">{open === i ? '▲' : '▼'}</span>
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/40">
                <div className="flex gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">Answer:</span>
                  <span>{qa.a}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
