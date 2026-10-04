import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Play, RefreshCw, Volume2, Languages, Clock } from 'lucide-react';
import { speechApi, nlpApi } from '../services/api';

export const STTPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sttResult, setSttResult] = useState<any>(null);
  const [nlpResult, setNlpResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mr.start();
      setIsRecording(true);
    } catch { alert('Microphone access denied. Use typed text or upload a WAV file.'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const transcribe = async () => {
    if (!audioBlob && !inputText) { alert('Record audio or enter text'); return; }
    setLoading(true);
    try {
      if (audioBlob) {
        const res = await speechApi.transcribeAudio(audioBlob);
        setSttResult(res);
        const nlp = await nlpApi.analyzeIntent(res.transcript);
        setNlpResult(nlp);
      } else {
        const lang = await nlpApi.detectLanguage(inputText);
        const nlp = await nlpApi.analyzeIntent(inputText);
        setSttResult({ transcript: inputText, detected_language: lang.language, language_code: lang.language_code, language_confidence: lang.confidence, stt_confidence: 1.0, audio_duration: 0, processing_time_ms: lang.processing_time_ms });
        setNlpResult(nlp);
      }
    } catch (err: any) { alert('Transcription failed: ' + err.message); }
    finally { setLoading(false); }
  };

  const playTTS = async () => {
    if (!sttResult?.transcript) return;
    try {
      const res = await speechApi.synthesizeText(sttResult.transcript, sttResult.language_code || 'en');
      const audio = new Audio(res.audio_url);
      audio.play();
    } catch {}
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><Mic className="h-5 w-5 text-indigo-400"/>Speech-to-Text Engine</h2>
        <p className="text-xs text-slate-400">Record/upload Indian speech audio or type text for NLP analysis</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
          <div className="flex gap-3">
            {!isRecording ? (
              <button onClick={startRecording} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all">
                <Mic className="h-4 w-4"/>Record Speech
              </button>
            ) : (
              <button onClick={stopRecording} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
                <Square className="h-4 w-4"/>Stop Recording
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-2 transition-all">
              <Upload className="h-4 w-4"/>Upload WAV
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden"/>
          </div>
          {audioUrl && <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700"><audio src={audioUrl} controls className="w-full h-8"/></div>}
          <textarea rows={4} value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Or type Indian language text here..." className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"/>
          <button onClick={transcribe} disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin"/>Processing...</> : <><Mic className="h-4 w-4"/>Transcribe & Analyze</>}
          </button>
        </div>
        {sttResult && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
            <h3 className="text-sm font-semibold text-white">Transcription Result</h3>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
              <p className="text-slate-300 leading-relaxed font-medium">{sttResult.transcript}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Language', val: sttResult.detected_language, icon: <Languages className="h-3 w-3 text-cyan-400"/> },
                { label: 'STT Confidence', val: `${(sttResult.stt_confidence*100).toFixed(1)}%`, icon: null },
                { label: 'Lang Confidence', val: `${(sttResult.language_confidence*100).toFixed(1)}%`, icon: null },
                { label: 'Process Time', val: `${sttResult.processing_time_ms.toFixed(0)} ms`, icon: <Clock className="h-3 w-3 text-indigo-400"/> },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                  <div className="text-slate-400 mb-0.5 flex items-center gap-1">{item.icon}{item.label}</div>
                  <div className="text-white font-bold">{item.val}</div>
                </div>
              ))}
            </div>
            {nlpResult && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800 text-xs space-y-1">
                <div className="text-indigo-300 font-semibold mb-2">NLP Intent Analysis</div>
                <div className="flex justify-between"><span className="text-slate-400">Intent:</span><span className="text-white font-bold">{nlpResult.intent}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Sentiment:</span><span className={nlpResult.sentiment==='Positive'?'text-emerald-400':nlpResult.sentiment==='Negative'?'text-rose-400':'text-slate-300'}>{nlpResult.sentiment}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Keywords:</span><span className="text-cyan-300 text-right">{nlpResult.keywords?.join(', ')}</span></div>
              </div>
            )}
            <button onClick={playTTS} className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all">
              <Volume2 className="h-4 w-4"/>Play Indian Language TTS Output
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
