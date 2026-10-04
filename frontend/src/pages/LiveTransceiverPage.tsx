import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Radio,
  Send,
  Sparkles,
  Volume2,
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Play,
  Pause,
  Download,
  Sliders,
  Wifi
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis
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
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleSelectDemoSample = (sample: DemoSample) => {
    setInputText(sample.text);
    setTargetLanguage(sample.suggested_target);
    setSnr(sample.default_snr);
    setChannelType(sample.channel_type);
    setModulation(sample.modulation);
  };

  const runPipeline = async () => {
    setLoading(true);
    setActiveStage(1);

    try {
      const formData = new FormData();
      if (inputText) formData.append('text', inputText);
      formData.append('target_language', targetLanguage);
      formData.append('snr', snr.toString());
      formData.append('channel_type', channelType);
      formData.append('modulation', modulation);
      formData.append('carrier_frequency', carrierFrequency.toString());
      formData.append('is_demo', isDemoMode ? 'true' : 'false');

      if (audioBlob) {
        formData.append('audio', audioBlob, 'mic_input.wav');
      }

      // Step progression simulation for realistic visual presentation
      const interval = setInterval(() => {
        setActiveStage((prev) => (prev < 8 ? prev + 1 : prev));
      }, 250);

      const res = await pipelineApi.executePipeline(formData);
      clearInterval(interval);
      setActiveStage(8);
      setPipelineResult(res);
    } catch (err: any) {
      alert('Pipeline execution error: ' + (err.response?.data?.detail || err.message));
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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 glass-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wide flex items-center gap-1.5">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE TRANSCEIVER TESTBED
            </span>
            {isDemoMode && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                DEMO PRESETS ACTIVE
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">
            Indian Multilingual Speech-to-Speech Neural Transceiver Pipeline
          </h2>
          <p className="text-xs text-slate-400">
            Real-time Voice Input → STT → Language Identification → NLP Intent → Indic Translation → Digital Modulation / AWGN Channel → ML Quality Optimizer → Indic TTS
          </p>
        </div>

        {/* Demo Dialect Presets Dropdown */}
        {isDemoMode && demoSamples.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-w-md">
            {demoSamples.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectDemoSample(s)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500 text-[11px] font-medium text-slate-200 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <span>{s.language}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Left Controls, Center Pipeline Flow, Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Input & Radio Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Audio / Text Input */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Mic className="h-4 w-4 text-indigo-400" /> Voice & Text Ingestion
              </h3>
              {audioBlob && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Audio Attached
                </span>
              )}
            </div>

            {/* Voice Record Buttons */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
                >
                  <Mic className="h-4 w-4 animate-bounce" /> Record Live Speech
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center justify-center gap-2 animate-pulse transition-all"
                >
                  <Square className="h-4 w-4" /> Stop Recording
                </button>
              )}
            </div>

            {audioUrl && (
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <audio src={audioUrl} controls className="w-full h-8" />
              </div>
            )}

            {/* Typed Text Input */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Indian Speech Payload / Transcript
              </label>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter Indian language communication or speak into microphone..."
                className="w-full p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Card 2: Neural Transceiver & Channel Controls */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" /> Radio Channel Parameters
            </h3>

            {/* SNR Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Signal-to-Noise Ratio (SNR)</span>
                <span className="font-mono font-bold text-cyan-400">{snr} dB</span>
              </div>
              <input
                type="range"
                min="-5"
                max="35"
                step="0.5"
                value={snr}
                onChange={(e) => setSnr(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>-5 dB (Severe Noise)</span>
                <span>15 dB (Nominal)</span>
                <span>35 dB (Clear)</span>
              </div>
            </div>

            {/* Channel Type & Modulation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Channel Fading</label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="AWGN">AWGN (Standard)</option>
                  <option value="Rayleigh">Rayleigh Fading</option>
                  <option value="Rician">Rician Multi-Path</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Modulation</label>
                <select
                  value={modulation}
                  onChange={(e) => setModulation(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="BPSK">BPSK (Robust)</option>
                  <option value="QPSK">QPSK (High Rate)</option>
                </select>
              </div>
            </div>

            {/* Target Translation Language */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Indian Voice Output</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
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

        {/* CENTER & RIGHT COLUMN: Pipeline Visualization & Stage Drilldowns (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Stage Progression Breadcrumb Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>8-Stage Neural Transceiver Execution Flow</span>
              {pipelineResult && (
                <span className="text-emerald-400 font-mono text-[10px]">
                  Total Pipeline Latency: {pipelineResult.total_pipeline_time_ms} ms
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
                    className={`p-2 rounded-xl text-center border transition-all ${
                      isCurrent
                        ? 'bg-indigo-600/30 border-indigo-400 animate-pulse text-white'
                        : isPassed
                        ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
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
            <div className="space-y-5">
              {/* Row 1: Language & NLP Intent Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Language Identification Card */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Language Identification</span>
                    <span className="text-cyan-400 font-mono">{(pipelineResult.detected_language_info.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-lg font-bold text-white mb-1">
                    {pipelineResult.detected_language_info.language}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Script: <strong className="text-slate-200">{pipelineResult.detected_language_info.script}</strong></span>
                    <span>•</span>
                    <span>Code: <strong className="text-slate-200 uppercase">{pipelineResult.detected_language_info.language_code}</strong></span>
                  </div>
                </div>

                {/* Intent Classification Card */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>NLP Intent Class</span>
                    <span className="text-indigo-400 font-mono">{(pipelineResult.nlp_result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-lg font-bold text-indigo-300 mb-1">
                    {pipelineResult.nlp_result.intent}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Sentiment: <strong className={pipelineResult.nlp_result.sentiment === 'Positive' ? 'text-emerald-400' : pipelineResult.nlp_result.sentiment === 'Negative' ? 'text-rose-400' : 'text-slate-300'}>{pipelineResult.nlp_result.sentiment}</strong></span>
                  </div>
                </div>

                {/* ML Comm Quality Card */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>ML Quality Optimizer</span>
                    <span className="text-emerald-400 font-mono">{(pipelineResult.ml_quality_result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className={`text-lg font-bold mb-1 ${
                    pipelineResult.ml_quality_result.predicted_quality === 'Excellent'
                      ? 'text-emerald-400'
                      : pipelineResult.ml_quality_result.predicted_quality === 'Good'
                      ? 'text-cyan-400'
                      : pipelineResult.ml_quality_result.predicted_quality === 'Moderate'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {pipelineResult.ml_quality_result.predicted_quality} Link
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {pipelineResult.ml_quality_result.recommendation}
                  </div>
                </div>
              </div>

              {/* Row 2: Digital Signal Waveform Graphs */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400" /> Radio Transceiver Waveforms (BPSK / AWGN Channel)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Comparing Modulated Carrier (Blue), AWGN Channel Noise (Amber), and Demodulated Decoded Signal (Emerald)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">BER: <strong className="text-rose-400">{pipelineResult.radio_result.ber}</strong></span>
                    <span className="text-slate-400">Loss: <strong className="text-amber-400">{pipelineResult.radio_result.packet_loss}%</strong></span>
                    <span className="text-slate-400">Latency: <strong className="text-cyan-400">{pipelineResult.radio_result.latency_ms} ms</strong></span>
                  </div>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={waveformChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <XAxis dataKey="index" stroke="#475569" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10 }} domain={[-2, 2]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Line type="monotone" dataKey="original" stroke="#6366f1" strokeWidth={2} dot={false} name="Original Carrier" />
                      <Line type="monotone" dataKey="noisy" stroke="#f59e0b" strokeWidth={1} dot={false} name="AWGN Channel Signal" />
                      <Line type="monotone" dataKey="demodulated" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Demodulated Signal" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 3: Decoded Output & Indian TTS Audio Player */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-indigo-950/50 border border-indigo-500/30 glass-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">Decoded Speech & Indic Synthesis</h4>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                    Target: {pipelineResult.translation_result?.target_language || targetLanguage}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Input Text */}
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                    <span className="text-slate-400 font-semibold block mb-1">Transcribed Input Speech:</span>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {pipelineResult.stt_result?.transcript || inputText}
                    </p>
                  </div>

                  {/* Translated & Synthesized Decoded Output */}
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-indigo-500/40 text-xs">
                    <span className="text-indigo-300 font-semibold block mb-1">Decoded & Synthesized Output:</span>
                    <p className="text-cyan-200 leading-relaxed font-semibold">
                      {pipelineResult.translation_result?.translated_text || pipelineResult.stt_result?.transcript || inputText}
                    </p>
                  </div>
                </div>

                {/* Audio Playback Controls */}
                {pipelineResult.tts_result && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/90 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlayDecodedAudio}
                        className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all"
                      >
                        {isPlayingAudio ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </button>
                      <div>
                        <div className="text-xs font-semibold text-white">
                          Play Received Indic Speech Voice
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Format: MP3 • Duration: ~{pipelineResult.tts_result.audio_duration}s
                        </div>
                      </div>
                    </div>

                    <a
                      href={pipelineResult.tts_result.audio_url}
                      download={pipelineResult.tts_result.audio_filename}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Export Audio
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State Guide */
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Radio className="h-8 w-8 text-indigo-400 animate-pulse" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-white mb-1">
                  Ready to Transmit Speech Over Neural Transceiver
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
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
