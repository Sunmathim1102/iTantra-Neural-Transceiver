import time
import numpy as np
from typing import Dict, Any, List
from app.radio.modulation import DigitalModulator

class TransceiverSimulator:
    @classmethod
    def simulate_transmission(
        cls,
        message: str = "iTantra Transceiver Active",
        snr: float = 15.0,
        carrier_frequency: float = 2.4,  # GHz
        sampling_rate: float = 44100.0,  # Hz
        bit_rate: float = 128.0,  # kbps
        channel_type: str = "AWGN",
        modulation: str = "BPSK"
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        if not message:
            message = "Transceiver Channel Test"

        # 1. Source Encoding: Text to Bits
        tx_bits = DigitalModulator.text_to_bits(message)
        total_bits = len(tx_bits)

        # 2. Modulation
        if modulation == "QPSK":
            tx_symbols = DigitalModulator.modulate_qpsk(tx_bits)
        else:
            tx_symbols = DigitalModulator.modulate_bpsk(tx_bits)

        # 3. Channel Simulation with Noise
        rx_symbols = DigitalModulator.apply_channel(tx_symbols, snr, channel_type)

        # 4. Demodulation
        if modulation == "QPSK":
            rx_bits = DigitalModulator.demodulate_qpsk(rx_symbols)[:total_bits]
        else:
            rx_bits = DigitalModulator.demodulate_bpsk(rx_symbols)[:total_bits]

        # 5. Bit Error Rate (BER) Calculation
        error_bits = int(np.sum(tx_bits != rx_bits))
        ber = float(error_bits / max(1, total_bits))
        theo_ber = DigitalModulator.theoretical_ber(snr, modulation)

        # 6. Packet Loss & Signal Metrics
        # Packet is considered lost if BER > 0.05
        packet_loss = min(100.0, round(ber * 150.0, 2)) if ber > 0.0 else 0.0
        
        # Signal Strength (dBm) calculation: Base -50 dBm with SNR attenuation
        signal_strength_dbm = round(-90.0 + (snr * 1.5), 1)
        signal_strength_dbm = min(-30.0, max(-115.0, signal_strength_dbm))

        # Latency calculation based on bit rate and propagation delay
        transmission_delay_ms = (total_bits / (bit_rate * 1000.0)) * 1000.0
        channel_propagation_delay_ms = 12.0 + np.random.uniform(2.0, 8.0)
        total_latency_ms = round(transmission_delay_ms + channel_propagation_delay_ms + (ber * 50.0), 2)

        # Channel condition & Status
        if ber < 0.001 and snr >= 15.0:
            channel_condition = "Excellent"
            transmission_status = "SUCCESS"
        elif ber < 0.02 and snr >= 8.0:
            channel_condition = "Good"
            transmission_status = "SUCCESS"
        elif ber < 0.08:
            channel_condition = "Degraded"
            transmission_status = "DEGRADED"
        else:
            channel_condition = "Critical"
            transmission_status = "FAILED"

        # 7. Generate Waveform Visualizations for UI
        # Sample carrier wave for the first 8 bits
        sample_count = min(64, total_bits)
        t = np.linspace(0, 4 * np.pi, 100)
        
        # Original modulated carrier
        carrier = np.sin(t * 3)
        mod_envelope = np.repeat(tx_bits[:sample_count] * 2 - 1, int(np.ceil(100 / max(1, sample_count))))[:100]
        waveform_orig = [round(float(x), 3) for x in (carrier * mod_envelope)]

        # Noisy signal waveform
        noise_level = 1.0 / (10.0 ** (snr / 20.0))
        noise_wave = np.random.normal(0, noise_level, 100)
        waveform_noisy = [round(float(x), 3) for x in (carrier * mod_envelope + noise_wave)]

        # Demodulated recovered signal
        demod_envelope = np.repeat(rx_bits[:sample_count] * 2 - 1, int(np.ceil(100 / max(1, sample_count))))[:100]
        waveform_demod = [round(float(x), 3) for x in (carrier * demod_envelope)]

        # Constellation Points (I vs Q) for plotting
        constellation = []
        for sym in rx_symbols[:min(100, len(rx_symbols))]:
            constellation.append({
                "i": round(float(sym.real), 3),
                "q": round(float(sym.imag), 3)
            })

        elapsed_ms = (time.time() - start_time) * 1000.0

        return {
            "snr": round(snr, 2),
            "ber": round(ber, 5),
            "theoretical_ber": round(theo_ber, 5),
            "latency_ms": total_latency_ms,
            "packet_loss": packet_loss,
            "signal_strength_dbm": signal_strength_dbm,
            "channel_condition": channel_condition,
            "transmission_status": transmission_status,
            "bit_count": total_bits,
            "error_bits": error_bits,
            "waveform_original": waveform_orig,
            "waveform_noisy": waveform_noisy,
            "waveform_demodulated": waveform_demod,
            "constellation_points": constellation,
            "processing_time_ms": round(elapsed_ms, 2)
        }
