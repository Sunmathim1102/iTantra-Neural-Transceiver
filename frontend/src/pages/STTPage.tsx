import React, { useState, useRef } from 'react';
import { Mic, Square, Upload, RefreshCw, Volume2, Languages, Clock } from 'lucide-react';
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
    if (file) { setAudioBlob(file); setAudioUrl(URL.createObjectURL(file)); }
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
      new Audio(res.audio_url).play();
    } catch {}
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600"><Mic className="h-4 w-4" /></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Speech Intelligence</span>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Voice Transcription Engine</h1>
        <p className="text-xs text-slate-500 mt-1">Record or upload Indian speech audio, or type text for full STT + NLP analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Audio / Text Input</h2>
          <div className="flex gap-3">
            {!isRecording ? (
              <button onClick={startRecording} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Mic className="h-4 w-4" /> Record Speech
              </button>
            ) : (
              <button onClick={stopRecording} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-2 animate-pulse cursor-pointer">
                <Square className="h-4 w-4" /> Stop Recording
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer">
              <Upload className="h-4 w-4" /> Upload WAV
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </div>
          {audioUrl && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <audio src={audioUrl} controls className="w-full h-8" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Or Type Indian Language Text</label>
            <textarea
              rows={4}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type in Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, or English..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
            />
          </div>
          <button onClick={transcribe} disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin" />Processing...</> : <><Mic className="h-4 w-4" />Transcribe & Analyze</>}
          </button>
        </div>

        {/* Results Panel */}
        {sttResult ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Transcription Result</h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-sm text-slate-900 leading-relaxed font-medium">{sttResult.transcript}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Language', val: sttResult.detected_language, icon: <Languages className="h-3 w-3 text-indigo-500" /> },
                { label: 'STT Confidence', val: `${(sttResult.stt_confidence * 100).toFixed(1)}%` },
                { label: 'Lang Confidence', val: `${(sttResult.language_confidence * 100).toFixed(1)}%` },
                { label: 'Process Time', val: `${sttResult.processing_time_ms.toFixed(0)} ms`, icon: <Clock className="h-3 w-3 text-slate-400" /> },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-slate-500 mb-1 flex items-center gap-1 font-medium">{item.icon}{item.label}</div>
                  <div className="text-slate-900 font-bold">{item.val}</div>
                </div>
              ))}
            </div>
            {nlpResult && (
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-2">
                <div className="text-indigo-700 font-bold mb-2">NLP Intent Analysis</div>
                <div className="flex justify-between"><span className="text-slate-600">Intent:</span><span className="text-slate-900 font-bold">{nlpResult.intent}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Sentiment:</span><span className={nlpResult.sentiment === 'Positive' ? 'text-emerald-600 font-bold' : nlpResult.sentiment === 'Negative' ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>{nlpResult.sentiment}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-600 shrink-0">Keywords:</span><span className="text-indigo-700 text-right">{nlpResult.keywords?.join(', ')}</span></div>
              </div>
            )}
            <button onClick={playTTS} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer">
              <Volume2 className="h-4 w-4" /> Play Indian Language TTS Output
            </button>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
              <Mic className="h-7 w-7 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Ready for Transcription</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Record speech or enter text, then click <strong>Transcribe & Analyze</strong> to see results.</p>
          </div>
        )}
      </div>
    </div>
  );
};
