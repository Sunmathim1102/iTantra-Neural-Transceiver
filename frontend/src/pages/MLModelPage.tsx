import React, { useState } from 'react';
import { Cpu, RefreshCw } from 'lucide-react';
import { mlApi } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const getQualityStyle = (q: string) => {
  if (q==='Excellent') return { box: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' };
  if (q==='Good') return { box: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-400' };
  if (q==='Moderate') return { box: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' };
  return { box: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400' };
};

export const MLModelPage: React.FC = () => {
  const [modelsInfo, setModelsInfo] = useState<any>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [predInput, setPredInput] = useState({ snr: 22.0, ber: 0.0001, latency_ms: 28.0, packet_loss: 0.0, signal_strength: -58.0, message_length: 50, audio_duration: 3.5, channel_type: 'AWGN', language: 'hi' });
  const [predResult, setPredResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadModels = () => {
    setModelsLoading(true);
    mlApi.getModelsInfo().then(setModelsInfo).catch(console.error).finally(() => setModelsLoading(false));
  };

  React.useEffect(() => { loadModels(); }, []);

  const predict = async () => {
    setLoading(true);
    try { setPredResult(await mlApi.predictQuality(predInput)); }
    catch (e: any) { alert('Prediction failed: ' + e.message); }
    finally { setLoading(false); }
  };

  const intentM = modelsInfo?.intent_classification_model;
  const commM = modelsInfo?.communication_quality_model;
  const featureData = commM ? Object.entries(commM.feature_importances || {}).slice(0,8).map(([k,v]) => ({ name: k.replace(/_/g,' '), value: parseFloat(((v as number)*100).toFixed(2)) })) : [];

  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><Cpu className="h-5 w-5 text-indigo-400"/>ML Model Evaluation & Live Inference</h2>
        <p className="text-xs text-slate-400">Trained Random Forest (98.4% Acc) + TF-IDF Logistic Regression (93.3% Acc)</p>
      </div>
      {modelsLoading && <div className="text-center py-8 text-slate-400">Loading model metrics...</div>}
      {modelsInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
            <h3 className="text-sm font-bold text-white">1. NLP Intent Classification Model</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Algorithm', intentM?.algorithm?.split('(')[0]?.trim()],
                ['Training Samples', intentM?.train_samples],
                ['Test Samples', intentM?.test_samples],
                ['Accuracy', `${((intentM?.accuracy||0)*100).toFixed(1)}%`],
                ['Precision', `${((intentM?.precision||0)*100).toFixed(1)}%`],
                ['Recall', `${((intentM?.recall||0)*100).toFixed(1)}%`],
                ['F1-Score', `${((intentM?.f1_score||0)*100).toFixed(1)}%`],
                ['Classes', intentM?.classes?.length],
              ].map(([lbl,val]) => (
                <div key={String(lbl)} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-500 text-[10px]">{lbl}</div>
                  <div className="text-white font-bold text-xs">{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
            <h3 className="text-sm font-bold text-white">2. Communication Quality Classifier (Random Forest)</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Algorithm', 'Random Forest (100 Trees)'],
                ['Training Samples', commM?.train_samples],
                ['Test Samples', commM?.test_samples],
                ['Accuracy', `${((commM?.accuracy||0)*100).toFixed(1)}%`],
                ['Precision', `${((commM?.precision||0)*100).toFixed(1)}%`],
                ['Recall', `${((commM?.recall||0)*100).toFixed(1)}%`],
                ['F1-Score', `${((commM?.f1_score||0)*100).toFixed(1)}%`],
                ['Dataset', 'Synthetic (5,000 samples)'],
              ].map(([lbl,val]) => (
                <div key={String(lbl)} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-500 text-[10px]">{lbl}</div>
                  <div className="text-white font-bold text-xs">{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {featureData.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
          <h3 className="text-sm font-semibold text-white mb-4">Random Forest Feature Importance</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData} layout="vertical" margin={{left:80, right:20}}>
                <XAxis type="number" stroke="#475569" tick={{fontSize:10}} domain={[0,'auto']}/>
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{fontSize:10}}/>
                <Tooltip contentStyle={{backgroundColor:'#0f172a',borderColor:'#334155',borderRadius:'8px',fontSize:'11px'}} formatter={(v: any)=>`${v}%`}/>
                <Bar dataKey="value" fill="#6366f1" radius={[0,4,4,0]} name="Importance %"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
        <h3 className="text-sm font-semibold text-white">⚡ Live ML Prediction (Enter Real Parameters)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            { key:'snr', label:'SNR (dB)', step:0.5 }, { key:'ber', label:'BER', step:0.0001 },
            { key:'latency_ms', label:'Latency (ms)', step:1 }, { key:'packet_loss', label:'Packet Loss (%)', step:0.1 },
            { key:'signal_strength', label:'Signal (dBm)', step:1 }, { key:'message_length', label:'Msg Length', step:1 },
          ].map(f => (
            <div key={f.key}>
              <label className="text-slate-400 block mb-1">{f.label}</label>
              <input type="number" step={f.step} value={(predInput as any)[f.key]} onChange={e=>setPredInput({...predInput, [f.key]: parseFloat(e.target.value)})} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"/>
            </div>
          ))}
        </div>
        <button onClick={predict} disabled={loading} className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all">
          {loading ? <><RefreshCw className="h-4 w-4 animate-spin"/>Predicting...</> : '⚡ Predict Communication Quality'}
        </button>
        {predResult && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(() => {
              const s = getQualityStyle(predResult.predicted_quality);
              return (
                <div className={`col-span-2 p-4 rounded-xl border text-center ${s.box}`}>
                  <div className="text-xs text-slate-400 mb-1">ML Prediction</div>
                  <div className={`text-2xl font-extrabold ${s.text}`}>{predResult.predicted_quality}</div>
                  <div className="text-xs text-slate-400 mt-1">Confidence: {(predResult.confidence*100).toFixed(1)}%</div>
                </div>
              );
            })()}
            {Object.entries(predResult.class_probabilities || {}).map(([cls,prob]) => (
              <div key={cls} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-center text-xs">
                <div className="text-slate-400 mb-1">{cls}</div>
                <div className="font-bold text-white">{((prob as number)*100).toFixed(1)}%</div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500 transition-all" style={{width:`${(prob as number)*100}%`}}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
