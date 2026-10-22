import React, { useState } from 'react';
import { ArrowRightLeft, Volume2, Copy, RefreshCw, Globe, Languages } from 'lucide-react';
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
    try { new Audio((await speechApi.synthesizeText(t, lang)).audio_url).play(); } catch {}
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><ArrowRightLeft className="h-4 w-4" /></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Neural Voice Synthesis</span>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Indian Language Bidirectional Translator</h1>
        <p className="text-xs text-slate-500 mt-1">Powered by deep-translator with offline tactical lexicon fallback. Supports 8 Indic dialects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Translation Input</h2>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Source Language</label>
              <select value={src} onChange={e => setSrc(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500">
                <option value="auto">Auto Detect</option>
                {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <ArrowRightLeft className="h-4 w-4 text-slate-400 mb-2 shrink-0" />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Language</label>
              <select value={tgt} onChange={e => setTgt(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500">
                {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Source Text</label>
            <textarea rows={5} value={text} onChange={e => setText(e.target.value)} placeholder="Enter source text in any Indian language..." className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none" />
          </div>
          <button onClick={translate} disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin" />Translating...</> : <><ArrowRightLeft className="h-4 w-4" />Translate Now</>}
          </button>
        </div>

        {/* Result Panel */}
        {result ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Translation Result</h2>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">{result.translation_time_ms?.toFixed(0)} ms</span>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 min-h-[6rem]">
              <p className="text-sm text-slate-900 font-medium leading-relaxed">{result.translated_text}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(result.translated_text)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button onClick={() => playTTS(result.translated_text, tgt)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Volume2 className="h-3.5 w-3.5" /> Play TTS
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Globe className="h-7 w-7 text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Ready to Translate</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Select source and target languages, enter text, and click <strong>Translate Now</strong>.</p>
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
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><Languages className="h-4 w-4" /></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Language Intelligence</span>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Indic Language Identifier</h1>
        <p className="text-xs text-slate-500 mt-1">Unicode script-range based Indian language and script detection. Supports EN, HI, TA, TE, KN, ML, BN, MR.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Input Text</h2>
          <textarea rows={5} value={text} onChange={e => setText(e.target.value)} placeholder="Enter Indian language text to identify..." className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none" />
          <button onClick={detect} disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin" />Identifying...</> : '🔍 Identify Indian Language'}
          </button>
          <div className="text-[11px] text-slate-500 text-center bg-slate-50 py-2 rounded-xl border border-slate-200">Supported: EN, HI, TA, TE, KN, ML, BN, MR</div>
        </div>

        {result ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Detection Result</h2>
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🌐</div>
              <div className="text-3xl font-extrabold text-slate-900 mb-1">{result.language}</div>
              <div className="text-sm text-slate-500 mb-4">Script: <strong className="text-indigo-600">{result.script}</strong></div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold">
                {((result.confidence || 0) * 100).toFixed(1)}% Confidence
              </div>
            </div>
            <div className="text-xs text-slate-500 text-center font-mono bg-slate-50 py-2 rounded-xl border border-slate-200">
              Processing time: {result.processing_time_ms?.toFixed(2)} ms
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Languages className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Ready to Detect</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Enter Indian language text and click <strong>Identify</strong> to detect the language and script.</p>
          </div>
        )}
      </div>
    </div>
  );
};
