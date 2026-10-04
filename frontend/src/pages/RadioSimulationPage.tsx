import React, { useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
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
      const ml = await mlApi.predictQuality({ snr: r.snr, ber: r.ber, latency_ms: r.latency_ms, packet_loss: r.packet_loss, signal_strength: r.signal_strength_dbm, message_length: message.length });
      setMlResult(ml);
    } catch (e: any) { alert('Simulation error: ' + e.message); }
    finally { setLoading(false); }
  };

  const wfData = result?.waveform_original?.slice(0,50).map((v:number,i:number) => ({
    i, orig: v, noisy: result.waveform_noisy[i]||0, demod: result.waveform_demodulated[i]||0
  })) || [];

  const constellData = result?.constellation_points?.slice(0,80).map((p:any) => ({ x: p.i, y: p.q })) || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><Activity className="h-5 w-5 text-cyan-400"/>Neural Radio Access Transceiver Simulator</h2>
        <p className="text-xs text-slate-400">BPSK/QPSK modulation • AWGN/Rayleigh/Rician channels • BER & SNR physics</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card space-y-5">
          <h3 className="text-sm font-semibold text-white">⚙️ Transmission Parameters</h3>
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">SNR</span><span className="font-mono text-cyan-400 font-bold">{snr} dB</span></div>
            <input type="range" min={-5} max={35} step={0.5} value={snr} onChange={e=>setSnr(parseFloat(e.target.value))} className="w-full accent-cyan-400"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Channel Model</label>
            <select value={channel} onChange={e=>setChannel(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="AWGN">AWGN (Standard)</option>
              <option value="Rayleigh">Rayleigh Fading</option>
              <option value="Rician">Rician Multi-Path</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Modulation</label>
            <select value={modulation} onChange={e=>setModulation(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="BPSK">BPSK (Robust, 1 bit/symbol)</option>
              <option value="QPSK">QPSK (Fast, 2 bits/symbol)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Message Payload</label>
            <input type="text" value={message} onChange={e=>setMessage(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"/>
          </div>
          <button onClick={simulate} disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-600/20 transition-all">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin"/>Simulating...</> : '📡 Run Transmission Simulation'}
          </button>
          {result && (
            <div className="space-y-2 text-xs">
              {[
                ['BER (Measured)', result.ber, 'text-rose-400'],
                ['Theoretical BER', result.theoretical_ber, 'text-amber-400'],
                ['Latency', `${result.latency_ms.toFixed(1)} ms`, 'text-cyan-400'],
                ['Packet Loss', `${result.packet_loss}%`, 'text-orange-400'],
                ['Signal Strength', `${result.signal_strength_dbm} dBm`, 'text-violet-400'],
                ['Status', result.transmission_status, result.transmission_status==='SUCCESS'?'text-emerald-400':'text-rose-400'],
              ].map(([lbl,val,cls]) => (
                <div key={lbl as string} className="flex justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400">{lbl}</span>
                  <span className={`font-mono font-bold ${cls}`}>{val}</span>
                </div>
              ))}
              {mlResult && (
                <div className={`p-3 rounded-lg border text-center font-bold ${mlResult.predicted_quality==='Excellent'?'bg-emerald-500/10 border-emerald-500/30 text-emerald-400':mlResult.predicted_quality==='Good'?'bg-cyan-500/10 border-cyan-500/30 text-cyan-400':mlResult.predicted_quality==='Moderate'?'bg-amber-500/10 border-amber-500/30 text-amber-400':'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                  ML Quality: {mlResult.predicted_quality} ({(mlResult.confidence*100).toFixed(0)}%)
                </div>
              )}
            </div>
          )}
        </div>
        {/* Waveforms */}
        <div className="lg:col-span-2 space-y-4">
          {wfData.length > 0 ? (
            <>
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
                <h4 className="text-xs font-semibold text-white mb-3">RF Waveform Comparison (Modulated • AWGN Channel • Demodulated)</h4>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wfData} margin={{left:-20, right:10}}>
                      <XAxis dataKey="i" stroke="#475569" tick={{fontSize:10}}/>
                      <YAxis stroke="#475569" tick={{fontSize:10}} domain={[-2,2]}/>
                      <Tooltip contentStyle={{backgroundColor:'#0f172a',borderColor:'#334155',borderRadius:'8px',fontSize:'10px'}}/>
                      <Line type="monotone" dataKey="orig" stroke="#6366f1" strokeWidth={2} dot={false} name="TX Modulated"/>
                      <Line type="monotone" dataKey="noisy" stroke="#f59e0b" strokeWidth={1} dot={false} name="AWGN Channel"/>
                      <Line type="monotone" dataKey="demod" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={false} name="RX Decoded"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 text-[10px] text-slate-400 mt-2 justify-center">
                  <span className="flex items-center gap-1"><span className="h-2 w-4 bg-indigo-500 rounded"/>TX Carrier</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-4 bg-amber-500 rounded"/>AWGN Noise</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-4 bg-emerald-500 rounded"/>Decoded RX</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-card">
                <h4 className="text-xs font-semibold text-white mb-3">IQ Constellation Diagram</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{left:-20, right:10}}>
                      <XAxis type="number" dataKey="x" name="I" stroke="#475569" tick={{fontSize:10}} domain={[-2,2]}/>
                      <YAxis type="number" dataKey="y" name="Q" stroke="#475569" tick={{fontSize:10}} domain={[-2,2]}/>
                      <ZAxis range={[15,15]}/>
                      <Tooltip contentStyle={{backgroundColor:'#0f172a',borderColor:'#334155',borderRadius:'8px',fontSize:'10px'}} formatter={(v:any)=>v.toFixed(3)}/>
                      <Scatter data={constellData} fill="#06b6d4" fillOpacity={0.6} name="Symbols"/>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 flex flex-col items-center gap-3">
              <Activity className="h-10 w-10 text-slate-700"/>
              <p className="text-xs">Configure channel parameters and click <strong>Run Transmission</strong> to visualize RF waveforms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
