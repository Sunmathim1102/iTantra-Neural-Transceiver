import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Radio,
  Send,
  Sparkles,
  Volume2,
  Activity,
  RefreshCw,
  Play,
  Pause,
  Download,
  Sliders,
  Wifi,
  Languages,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { pipelineApi, demoApi } from '../services/api';
import { TransceiverPipelineResponse, DemoSample } from '../types';

interface LiveTransceiverPageProps {
  isDemoMode: boolean;
}

export const LiveTransceiverPage: React.FC<LiveTransceiverPageProps> = ({ isDemoMode }) => {
  // Input state
  const [inputText, setInputText] = useState<string>('आपातकालीन स्थिति! सेक्टर 4 में प्राथमिक रेडियो ट्रांससीवर चैनल में रुकावट आ रही है।');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [snr, setSnr] = useState<number>(18.0);
  const [channelType, setChannelType] = useState<string>('AWGN');
  const [modulation, setModulation] = useState<string>('BPSK');
  const [carrierFrequency, setCarrierFrequency] = useState<number>(2.4);

  // Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Pipeline Execution State
  const [loading, setLoading] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [pipelineResult, setPipelineResult] = useState<TransceiverPipelineResponse | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Demo samples
  const [demoSamples, setDemoSamples] = useState<DemoSample[]>([]);

  useEffect(() => {
    demoApi.getSamples().then((res) => {
      setDemoSamples(res.samples);
    }).catch(() => {});
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available. You can use typed input or Demo Mode.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleSelectDemoSample = (sample: DemoSample) => {
    setInputText(sample.text);
    setTargetLanguage(sample.suggested_target || 'en');
    setSnr(sample.default_snr || 15);
  };

  const runPipeline = async () => {
    if (!inputText && !audioBlob) {
      alert('Please enter text or record speech first.');
      return;
    }

    setLoading(true);
    setActiveStage(1);
    setPipelineResult(null);

    // Simulate animated step progression
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev < 7 ? prev + 1 : prev));
    }, 400);

    try {
      const result = await pipelineApi.runPipeline({
        audioBlob: audioBlob || undefined,
        textInput: inputText,
        targetLanguage,
        snrDb: snr,
        channelType,
        modulation,
        carrierFreqGhz: carrierFrequency,
      });

      clearInterval(interval);
      setActiveStage(8);
      setPipelineResult(result);
    } catch (err: any) {
      clearInterval(interval);
      alert(`Pipeline execution error: ${err?.message || 'Check connection to backend'}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayDecodedAudio = () => {
    if (!audioPlayerRef.current && pipelineResult?.tts_result?.audio_url) {
      audioPlayerRef.current = new Audio(pipelineResult.tts_result.audio_url);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (audioPlayerRef.current) {
      if (isPlayingAudio) {
        audioPlayerRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  // Prepare Waveform chart data
  const waveformChartData = pipelineResult?.radio_result
    ? pipelineResult.radio_result.waveform_original.slice(0, 50).map((orig, idx) => ({
        index: idx,
        original: orig,
        noisy: pipelineResult.radio_result.waveform_noisy[idx] || 0,
        demodulated: pipelineResult.radio_result.waveform_demodulated[idx] || 0,
      }))
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 card-hover">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Radio className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Live Transceiver Testbed
            </span>
            {isDemoMode && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Demo Presets Active
              </span>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Indian Multilingual Speech-to-Speech Neural Transceiver
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Real-time Voice Input → STT → Language Identification → NLP Intent → Indic Translation → Digital Modulation / AWGN Channel → Active ML Model Optimization → Indic TTS
          </p>
        </div>

        {/* Demo Dialect Presets Dropdown */}
        {isDemoMode && demoSamples.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-w-md">
            {demoSamples.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectDemoSample(s)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>{s.language}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Left Controls (4 cols), Right Results (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Input & Radio Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Audio / Text Input */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mic className="h-4 w-4 text-indigo-600" /> Voice & Text Ingestion
              </h2>
              {audioBlob && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Audio Attached
                </span>
              )}
            </div>

            {/* Voice Record Buttons */}
            <div>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Mic className="h-4 w-4" /> Record Live Speech
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-2 animate-pulse transition-all"
                >
                  <Square className="h-4 w-4" /> Stop Recording
                </button>
              )}
            </div>

            {audioUrl && (
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <audio src={audioUrl} controls className="w-full h-8" />
              </div>
            )}

            {/* Typed Text Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Indian Speech Payload / Transcript
              </label>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter Indian language communication or speak into microphone..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
              />
            </div>
          </div>

          {/* Card 2: Neural Transceiver & Channel Controls */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="h-4 w-4 text-indigo-600" /> Radio Channel Parameters
            </h2>

            {/* SNR Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Signal-to-Noise Ratio (SNR)</span>
                <span className="font-mono font-bold text-indigo-600">{snr} dB</span>
              </div>
              <input
                type="range"
                min="-5"
                max="35"
                step="0.5"
                value={snr}
                onChange={(e) => setSnr(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-5 dB (Severe Noise)</span>
                <span>15 dB (Nominal)</span>
                <span>35 dB (Clear)</span>
              </div>
            </div>

            {/* Channel Type & Modulation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Fading</label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="AWGN">AWGN (Standard)</option>
                  <option value="Rayleigh">Rayleigh Fading</option>
                  <option value="Rician">Rician Multi-Path</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modulation</label>
                <select
                  value={modulation}
                  onChange={(e) => setModulation(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="BPSK">BPSK (Robust)</option>
                  <option value="QPSK">QPSK (High Rate)</option>
                </select>
              </div>
            </div>

            {/* Target Translation Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Indian Voice Output</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="en">English (Pan-India)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                <option value="ml">Malayalam (മലയാളം)</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="mr">Marathi (मराठी)</option>
              </select>
            </div>

            {/* Execute Transceiver Pipeline Button */}
            <button
              onClick={runPipeline}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Processing Neural Pipeline...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Transmit Through Neural Transceiver
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Pipeline Visualization & Stage Drilldowns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stage Progression Breadcrumb Bar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>8-Stage Neural Transceiver Execution Flow</span>
              {pipelineResult && (
                <span className="text-emerald-700 font-mono text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Latency: {pipelineResult.total_pipeline_time_ms} ms
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {[
                { step: 1, label: 'Voice/Text', icon: '🎙' },
                { step: 2, label: 'STT Audio', icon: '🗣' },
                { step: 3, label: 'Lang Detect', icon: '🌐' },
                { step: 4, label: 'NLP Intent', icon: '🧠' },
                { step: 5, label: 'Translation', icon: '🔄' },
                { step: 6, label: 'Radio AWGN', icon: '📡' },
                { step: 7, label: 'ML Quality', icon: '🤖' },
                { step: 8, label: 'TTS Output', icon: '🔊' },
              ].map((s) => {
                const isPassed = activeStage >= s.step;
                const isCurrent = activeStage === s.step && loading;
                return (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-xl text-center border transition-all ${
                      isCurrent
                        ? 'bg-indigo-50 border-indigo-400 animate-pulse text-indigo-700 shadow-sm'
                        : isPassed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="text-base mb-1">{s.icon}</div>
                    <div className="text-[10px] font-semibold truncate">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Results Cards */}
          {pipelineResult ? (
            <div className="space-y-6">
              {/* Row 1: Language & NLP Intent Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Language Identification Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Language Identification</span>
                    <span className="text-indigo-600 font-mono font-bold">{(pipelineResult.detected_language_info.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 mb-1">
                    {pipelineResult.detected_language_info.language}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Script: <strong className="text-slate-800">{pipelineResult.detected_language_info.script}</strong></span>
                    <span>•</span>
                    <span>Code: <strong className="text-slate-800 uppercase">{pipelineResult.detected_language_info.language_code}</strong></span>
                  </div>
                </div>

                {/* Intent Classification Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>NLP Intent Class</span>
                    <span className="text-indigo-600 font-mono font-bold">{(pipelineResult.nlp_result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-lg font-bold text-indigo-600 mb-1">
                    {pipelineResult.nlp_result.intent}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Sentiment: <strong className={pipelineResult.nlp_result.sentiment === 'Positive' ? 'text-emerald-600' : pipelineResult.nlp_result.sentiment === 'Negative' ? 'text-rose-600' : 'text-slate-700'}>{pipelineResult.nlp_result.sentiment}</strong></span>
                  </div>
                </div>

                {/* ML Comm Quality Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm card-hover">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>ML Quality Optimizer</span>
                    <span className="text-emerald-600 font-mono font-bold">{(pipelineResult.ml_quality_result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className={`text-lg font-bold mb-1 ${
                    pipelineResult.ml_quality_result.predicted_quality === 'Excellent'
                      ? 'text-emerald-600'
                      : pipelineResult.ml_quality_result.predicted_quality === 'Good'
                      ? 'text-indigo-600'
                      : pipelineResult.ml_quality_result.predicted_quality === 'Moderate'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}>
                    {pipelineResult.ml_quality_result.predicted_quality} Link
                  </div>
                  <div className="text-[11px] text-slate-500 truncate" title={pipelineResult.ml_quality_result.recommendation}>
                    {pipelineResult.ml_quality_result.recommendation}
                  </div>
                </div>
              </div>

              {/* Row 2: Digital Signal Waveform Graphs */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-indigo-600" /> Radio Transceiver Waveforms (BPSK / AWGN Channel)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Carrier (Blue), AWGN Channel Noise (Amber), and Demodulated Decoded Signal (Emerald)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-500">BER: <strong className="text-rose-600">{pipelineResult.radio_result.ber}</strong></span>
                    <span className="text-slate-500">Loss: <strong className="text-amber-600">{pipelineResult.radio_result.packet_loss}%</strong></span>
                    <span className="text-slate-500">Latency: <strong className="text-indigo-600">{pipelineResult.radio_result.latency_ms} ms</strong></span>
                  </div>
                </div>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={waveformChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <XAxis dataKey="index" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[-2, 2]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                      />
                      <Line type="monotone" dataKey="original" stroke="#4f46e5" strokeWidth={2} dot={false} name="Original Carrier" />
                      <Line type="monotone" dataKey="noisy" stroke="#f59e0b" strokeWidth={1} dot={false} name="AWGN Channel Signal" />
                      <Line type="monotone" dataKey="demodulated" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Demodulated Signal" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 3: Decoded Output & Indian TTS Audio Player */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Decoded Speech & Indic Synthesis</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Target: {pipelineResult.translation_result?.target_language || targetLanguage}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Input Text */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="text-slate-500 font-semibold block mb-1">Transcribed Input Speech:</span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {pipelineResult.stt_result?.transcript || inputText}
                    </p>
                  </div>

                  {/* Translated & Synthesized Decoded Output */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
                    <span className="text-indigo-700 font-semibold block mb-1">Decoded & Synthesized Output:</span>
                    <p className="text-slate-900 leading-relaxed font-semibold">
                      {pipelineResult.translation_result?.translated_text || pipelineResult.stt_result?.transcript || inputText}
                    </p>
                  </div>
                </div>

                {/* Audio Playback Controls */}
                {pipelineResult.tts_result && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlayDecodedAudio}
                        className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
                      >
                        {isPlayingAudio ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </button>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Play Received Indic Speech Voice
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Format: MP3 • Duration: ~{pipelineResult.tts_result.audio_duration}s
                        </div>
                      </div>
                    </div>

                    <a
                      href={pipelineResult.tts_result.audio_url}
                      download={pipelineResult.tts_result.audio_filename}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Export Audio
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State Guide */
            <div className="p-12 rounded-2xl bg-white border border-slate-200/90 text-center space-y-4 shadow-sm">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Radio className="h-7 w-7 text-indigo-600" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Ready to Transmit Speech Over Neural Transceiver
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Record your voice in any Indian language, or pick a pre-configured dialect from Demo Presets, adjust channel noise parameters, and click <strong>Transmit</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
