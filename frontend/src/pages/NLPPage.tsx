import React, { useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { nlpApi, speechApi } from '../services/api';
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

  const INTENT_COLORS: Record<string,string> = {
    'Emergency': '#f43f5e', 'Warning': '#f59e0b', 'Normal Communication': '#10b981',
    'Technical': '#6366f1', 'Navigation': '#06b6d4', 'Request': '#8b5cf6',
    'Status Update': '#3b82f6', 'Information': '#14b8a6'
  };

  const intentBarData = result
    ? Object.entries(result.all_intent_scores).map(([k,v]) => ({ name: k, value: parseFloat((v as number * 100).toFixed(1)), color: INTENT_COLORS[k] || '#6366f1' }))
    : [];

  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><FileText className="h-5 w-5 text-indigo-400"/>NLP Intent & Sentiment Analysis</h2>
        <p className="text-xs text-slate-400">TF-IDF + Logistic Regression Intent Classifier (93.3% Accuracy)</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
          <textarea rows={6} value={text} onChange={e=>setText(e.target.value)} placeholder="Enter communication transcript..." className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"/>
          <button onClick={analyze} disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin"/>Analyzing...</> : '🧠 Analyze NLP Intent'}
          </button>
        </div>
        {result && (
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Intent', val: result.intent, color: 'text-indigo-300' },
                { label: 'Confidence', val: `${(result.confidence*100).toFixed(1)}%`, color: 'text-cyan-300' },
                { label: 'Sentiment', val: result.sentiment, color: result.sentiment==='Positive'?'text-emerald-400':result.sentiment==='Negative'?'text-rose-400':'text-slate-300' },
                { label: 'Tokens', val: result.token_count, color: 'text-slate-200' },
              ].map((item,i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                  <div className={`text-sm font-bold ${item.color}`}>{item.val}</div>
                </div>
              ))}
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
              <h4 className="text-xs font-semibold text-white mb-3">Intent Classification Probability Distribution (%)</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intentBarData} layout="vertical" margin={{left:60, right:20}}>
                    <XAxis type="number" stroke="#475569" tick={{fontSize:10}} domain={[0,100]}/>
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{fontSize:10}}/>
                    <Tooltip contentStyle={{backgroundColor:'#0f172a',borderColor:'#334155',borderRadius:'8px',fontSize:'11px'}}/>
                    <Bar dataKey="value" radius={[0,4,4,0]} name="%">
                      {intentBarData.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card text-xs">
              <span className="text-slate-400 font-semibold">Detected Keywords: </span>
              <span className="text-cyan-300">{result.keywords?.join(' • ')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
