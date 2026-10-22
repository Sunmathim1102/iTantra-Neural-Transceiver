import React, { useState } from 'react';
import { Activity, RefreshCw, Sliders, RadioTower, Wifi, ArrowRight } from 'lucide-react';
import { radioApi, mlApi } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ScatterChart, Scatter, ZAxis } from 'recharts';

export const RadioSimulationPage: React.FC = () => {
  const [snr, setSnr] = useState(18.0);
  const [channel, setChannel] = useState('AWGN');
  const [modulation, setModulation] = useState('BPSK');
  const [message, setMessage] = useState('iTantra Sector 4 Transceiver Relay Active');
  const [result, setResult] = useState<any>(null);
  const [mlResult, setMlResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const r = await radioApi.simulate({ message, snr, channel_type: channel, modulation });
      setResult(r);
      const ml = await mlApi.predictQuality({
        snr: r.snr,
        ber: r.ber,
        latency_ms: r.latency_ms,
        packet_loss: r.packet_loss,
        signal_strength: r.signal_strength_dbm,
        message_length: message.length,
      });
      setMlResult(ml);
    } catch (e: any) {
      alert('Simulation error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const wfData =
    result?.waveform_original?.slice(0, 50).map((v: number, i: number) => ({
      i,
      orig: v,
      noisy: result.waveform_noisy[i] || 0,
      demod: result.waveform_demodulated[i] || 0,
    })) || [];

  const constellData =
    result?.constellation_points?.slice(0, 80).map((p: any) => ({ x: p.i, y: p.q })) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 card-hover">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <RadioTower className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              RF Physical Layer Simulation
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Neural Radio Access Transceiver Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Physics-based radio simulation modeling BPSK/QPSK modulation, AWGN, Rayleigh & Rician channel fading, bit error rates, and machine-learning driven link quality optimization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5 card-hover">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="h-4 w-4 text-indigo-600" /> Transmission Parameters
            </h2>

            {/* SNR Control */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Signal-to-Noise Ratio (SNR)</span>
                <span className="font-mono font-bold text-indigo-600">{snr} dB</span>
              </div>
              <input
                type="range"
                min={-5}
                max={35}
                step={0.5}
                value={snr}
                onChange={(e) => setSnr(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-5 dB (Noisy)</span>
                <span>15 dB (Standard)</span>
                <span>35 dB (Clean)</span>
              </div>
            </div>

            {/* Channel Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Channel Fading Model
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="AWGN">AWGN (Additive White Gaussian Noise)</option>
                <option value="Rayleigh">Rayleigh Fading (Non-Line-of-Sight)</option>
                <option value="Rician">Rician Multi-Path (Line-of-Sight Dominant)</option>
              </select>
            </div>

            {/* Modulation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Digital Modulation Scheme
              </label>
              <select
                value={modulation}
                onChange={(e) => setModulation(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="BPSK">BPSK (1 bit/symbol • High Noise Immunity)</option>
                <option value="QPSK">QPSK (2 bits/symbol • High Throughput)</option>
              </select>
            </div>

            {/* Message Payload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transmitted Payload Text
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={simulate}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Simulating Channel Physics...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4" /> Run Transmission Simulation
                </>
              )}
            </button>

            {/* Metrics List */}
            {result && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {[
                  ['BER (Measured)', result.ber, 'text-rose-600'],
                  ['Theoretical BER', result.theoretical_ber, 'text-amber-600'],
                  ['Latency', `${result.latency_ms.toFixed(1)} ms`, 'text-indigo-600'],
                  ['Packet Loss', `${result.packet_loss}%`, 'text-orange-600'],
                  ['Signal Strength', `${result.signal_strength_dbm} dBm`, 'text-slate-800'],
                  ['Status', result.transmission_status, result.transmission_status === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'],
                ].map(([lbl, val, cls]) => (
                  <div key={lbl as string} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="text-slate-600 font-medium">{lbl}</span>
                    <span className={`font-mono font-bold ${cls}`}>{val}</span>
                  </div>
                ))}

                {mlResult && (
                  <div
                    className={`p-3 rounded-xl border text-center font-bold text-xs mt-3 ${
                      mlResult.predicted_quality === 'Excellent'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : mlResult.predicted_quality === 'Good'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                        : mlResult.predicted_quality === 'Moderate'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    ML Quality Prediction: {mlResult.predicted_quality} ({(mlResult.confidence * 100).toFixed(0)}%)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Waveforms & Constellation Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {wfData.length > 0 ? (
            <>
              {/* Waveform Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      RF Carrier & Channel Waveform Analysis
                    </h3>
                    <p className="text-xs text-slate-500">
                      Transmitted Carrier (Indigo), AWGN Channel Noise (Amber), Demodulated Signal (Emerald)
                    </p>
                  </div>
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wfData} margin={{ left: -20, right: 10 }}>
                      <XAxis dataKey="i" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[-2, 2]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '11px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        }}
                      />
                      <Line type="monotone" dataKey="orig" stroke="#4f46e5" strokeWidth={2} dot={false} name="TX Modulated" />
                      <Line type="monotone" dataKey="noisy" stroke="#f59e0b" strokeWidth={1} dot={false} name="AWGN Channel" />
                      <Line type="monotone" dataKey="demod" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={false} name="RX Decoded" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex gap-4 text-xs text-slate-600 justify-center font-medium pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-indigo-600 rounded-full" />TX Carrier</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-amber-500 rounded-full" />AWGN Noise</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />Decoded RX</span>
                </div>
              </div>

              {/* Constellation Diagram Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 card-hover">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    IQ Constellation Diagram ({modulation})
                  </h3>
                  <p className="text-xs text-slate-500">
                    In-phase (I) and Quadrature (Q) symbol scattering under channel noise
                  </p>
                </div>

                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ left: -20, right: 10 }}>
                      <XAxis type="number" dataKey="x" name="I" stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[-2, 2]} />
                      <YAxis type="number" dataKey="y" name="Q" stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[-2, 2]} />
                      <ZAxis range={[20, 20]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '11px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        }}
                        formatter={(v: any) => v.toFixed(3)}
                      />
                      <Scatter data={constellData} fill="#4f46e5" fillOpacity={0.65} name="Symbols" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/90 text-center text-slate-500 flex flex-col items-center gap-3 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Activity className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Awaiting RF Simulation</h3>
              <p className="text-xs max-w-sm leading-relaxed">
                Configure channel parameters and click <strong>Run Transmission Simulation</strong> to visualize signal waveforms and IQ constellation scatter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
