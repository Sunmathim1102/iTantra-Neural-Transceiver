import React, { useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { nlpApi } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const NLPPage: React.FC = () => {
  const [text, setText] = useState('Emergency! We have critical radio transceiver failure in sector 4. All units standby.');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try { setResult(await nlpApi.analyzeIntent(text)); }
    catch (e: any) { alert('NLP analysis failed: ' + e.message); }
    finally { setLoading(false); }
  };

  const INTENT_COLORS: Record<string, string> = {
    'Emergency': '#f43f5e', 'Warning': '#f59e0b', 'Normal Communication': '#10b981',
    'Technical': '#6366f1', 'Navigation': '#06b6d4', 'Request': '#8b5cf6',
    'Status Update': '#3b82f6', 'Information': '#14b8a6'
  };

  const intentBarData = result
    ? Object.entries(result.all_intent_scores).map(([k, v]) => ({
        name: k, value: parseFloat((v as number * 100).toFixed(1)), color: INTENT_COLORS[k] || '#6366f1'
      }))
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-violet-50 text-violet-600"><FileText className="h-4 w-4" /></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">Signal Quality Monitor</span>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">NLP Intent & Sentiment Analysis</h1>
        <p className="text-xs text-slate-500 mt-1">TF-IDF + Logistic Regression Intent Classifier (93.3% Accuracy) — real-time communication intent classification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Communication Transcript</h2>
          <textarea rows={6} value={text} onChange={e => setText(e.target.value)} placeholder="Enter radio communication transcript..." className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none" />
          <button onClick={analyze} disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin" />Analyzing...</> : '🧠 Analyze NLP Intent'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Intent', val: result.intent, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
                { label: 'Confidence', val: `${(result.confidence * 100).toFixed(1)}%`, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                { label: 'Sentiment', val: result.sentiment, color: result.sentiment === 'Positive' ? 'text-emerald-700' : result.sentiment === 'Negative' ? 'text-rose-700' : 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
                { label: 'Tokens', val: result.token_count, color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-2xl border text-center ${item.bg}`}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">{item.label}</div>
                  <div className={`text-sm font-extrabold ${item.color}`}>{item.val}</div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">Intent Classification Probability Distribution (%)</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intentBarData} layout="vertical" margin={{ left: 70, right: 20 }}>
                    <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} name="%">
                      {intentBarData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs">
              <span className="text-slate-600 font-semibold">Detected Keywords: </span>
              <span className="text-indigo-700 font-medium">{result.keywords?.join(' • ')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
