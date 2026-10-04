import React, { useState } from 'react';
import { ArrowRightLeft, Volume2, Copy, RefreshCw } from 'lucide-react';
import { translationApi, speechApi, nlpApi } from '../services/api';

const LANGS = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' }, { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' }, { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'bn', label: 'Bengali (বাংলা)' }, { code: 'mr', label: 'Marathi (मराठी)' },
];

export const TranslationPage: React.FC = () => {
  const [src, setSrc] = useState('auto');
  const [tgt, setTgt] = useState('hi');
  const [text, setText] = useState('Emergency! Primary radio transceiver channel in Sector 4 is experiencing interference.');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const translate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try { setResult(await translationApi.translate(text, src, tgt)); }
    catch (e: any) { alert('Translation failed: ' + e.message); }
    finally { setLoading(false); }
  };

  const playTTS = async (t: string, lang: string) => {
    try {
      const res = await speechApi.synthesizeText(t, lang);
      new Audio(res.audio_url).play();
    } catch {}
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <ArrowRightLeft className="h-5 w-5 text-indigo-400"/>Indian Language Bidirectional Translator
        </h2>
        <p className="text-xs text-slate-400">Powered by deep-translator with offline tactical lexicon fallback</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Source Language</label>
              <select value={src} onChange={e=>setSrc(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value="auto">Auto Detect</option>
                {LANGS.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <ArrowRightLeft className="h-4 w-4 text-slate-500 mt-5"/>
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Target Language</label>
              <select value={tgt} onChange={e=>setTgt(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                {LANGS.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <textarea rows={5} value={text} onChange={e=>setText(e.target.value)} placeholder="Enter source text..." className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"/>
          <button onClick={translate} disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin"/>Translating...</> : <><ArrowRightLeft className="h-4 w-4"/>Translate Now</>}
          </button>
        </div>
        {result && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Translation Result</h3>
              <span className="text-[10px] text-slate-400 font-mono">{result.translation_time_ms?.toFixed(0)} ms</span>
            </div>
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-sm text-cyan-200 font-medium leading-relaxed">
              {result.translated_text}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>navigator.clipboard.writeText(result.translated_text)} className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 flex items-center justify-center gap-2 transition-all">
                <Copy className="h-3.5 w-3.5"/>Copy
              </button>
              <button onClick={()=>playTTS(result.translated_text, tgt)} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all">
                <Volume2 className="h-3.5 w-3.5"/>Play TTS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const LanguageDetectionPage: React.FC = () => {
  const [text, setText] = useState('আপনার রেডিও চ্যানেলে সংকেত স্পষ্ট এবং যোগাযোগ প্রতিষ্ঠিত।');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const detect = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try { setResult(await nlpApi.detectLanguage(text)); }
    catch (e: any) { alert('Detection failed: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <span className="text-xl">🌐</span>Indic Language Identifier
        </h2>
        <p className="text-xs text-slate-400">Unicode script-range based Indian language and script detection</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
          <textarea rows={5} value={text} onChange={e=>setText(e.target.value)} placeholder="Enter Indian language text..." className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"/>
          <button onClick={detect} disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin"/>Identifying...</> : '🔍 Identify Indian Language'}
          </button>
          <div className="text-[11px] text-slate-500 text-center">Supported: EN, HI, TA, TE, KN, ML, BN, MR</div>
        </div>
        {result && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🌐</div>
              <div className="text-2xl font-extrabold text-white mb-1">{result.language}</div>
              <div className="text-sm text-slate-400 mb-3">Script: <strong className="text-cyan-300">{result.script}</strong></div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-bold">
                {((result.confidence||0) * 100).toFixed(1)}% Confidence
              </div>
            </div>
            <div className="text-[11px] text-slate-400 text-center font-mono">{result.processing_time_ms?.toFixed(2)} ms processing time</div>
          </div>
        )}
      </div>
    </div>
  );
};
