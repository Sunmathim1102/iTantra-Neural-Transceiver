import numpy as np
from scipy import special
from typing import Tuple, List, Dict, Any

class DigitalModulator:
    @staticmethod
    def text_to_bits(text: str) -> np.ndarray:
        """Converts string into binary bits array [0, 1]."""
        bytes_data = text.encode('utf-8')
        bits = []
        for byte in bytes_data:
            for i in range(7, -1, -1):
                bits.append((byte >> i) & 1)
        return np.array(bits, dtype=int)

    @staticmethod
    def bits_to_text(bits: np.ndarray) -> str:
        """Converts binary bits array back into string."""
        # Pad to multiple of 8 if needed
        rem = len(bits) % 8
        if rem != 0:
            bits = np.pad(bits, (0, 8 - rem))
        
        byte_list = []
        for i in range(0, len(bits), 8):
            byte_val = 0
            for j in range(8):
                byte_val = (byte_val << 1) | int(bits[i + j])
            byte_list.append(byte_val)
        
        try:
            return bytes(byte_list).decode('utf-8', errors='replace')
        except Exception:
            return ""

    @staticmethod
    def modulate_bpsk(bits: np.ndarray) -> np.ndarray:
        """BPSK Modulation: 0 -> -1.0, 1 -> +1.0."""
        symbols = np.where(bits == 1, 1.0, -1.0)
        return symbols.astype(np.complex64)

    @staticmethod
    def demodulate_bpsk(noisy_symbols: np.ndarray) -> np.ndarray:
        """BPSK Demodulation: Real(symbol) > 0 -> 1, else 0."""
        return np.where(noisy_symbols.real > 0, 1, 0)

    @staticmethod
    def modulate_qpsk(bits: np.ndarray) -> np.ndarray:
        """QPSK Modulation: 2 bits per symbol (Gray coded)."""
        if len(bits) % 2 != 0:
            bits = np.append(bits, 0)
        
        i_bits = bits[0::2]
        q_bits = bits[1::2]
        
        i_sym = np.where(i_bits == 1, 1.0 / np.sqrt(2), -1.0 / np.sqrt(2))
        q_sym = np.where(q_bits == 1, 1.0 / np.sqrt(2), -1.0 / np.sqrt(2))
        return (i_sym + 1j * q_sym).astype(np.complex64)

    @staticmethod
    def demodulate_qpsk(noisy_symbols: np.ndarray) -> np.ndarray:
        """QPSK Demodulation."""
        i_demod = np.where(noisy_symbols.real > 0, 1, 0)
        q_demod = np.where(noisy_symbols.imag > 0, 1, 0)
        
        bits = np.empty(len(noisy_symbols) * 2, dtype=int)
        bits[0::2] = i_demod
        bits[1::2] = q_demod
        return bits

    @staticmethod
    def apply_channel(symbols: np.ndarray, snr_db: float, channel_type: str = "AWGN") -> np.ndarray:
        """
        Simulates channel with AWGN or fading.
        SNR_dB = 10 * log10(Es / N0)
        """
        snr_linear = 10.0 ** (snr_db / 10.0)
        symbol_power = np.mean(np.abs(symbols)**2)
        n0 = symbol_power / snr_linear
        noise_std = np.sqrt(n0 / 2.0)
        
        # Complex Gaussian noise
        noise = (np.random.normal(0, noise_std, size=symbols.shape) + 
                 1j * np.random.normal(0, noise_std, size=symbols.shape))

        if channel_type == "Rayleigh":
            # Rayleigh fading multiplier
            h = (np.random.normal(0, 1/np.sqrt(2), size=symbols.shape) + 
                 1j * np.random.normal(0, 1/np.sqrt(2), size=symbols.shape))
            faded = h * symbols
            return faded + noise
        elif channel_type == "Rician":
            # Rician fading with K-factor = 4
            k = 4.0
            s = np.sqrt(k / (k + 1))
            sigma_r = np.sqrt(1 / (2 * (k + 1)))
            h = s + (np.random.normal(0, sigma_r, size=symbols.shape) + 
                     1j * np.random.normal(0, sigma_r, size=symbols.shape))
            return h * symbols + noise
        else:
            # Standard AWGN Channel
            return symbols + noise

    @staticmethod
    def theoretical_ber(snr_db: float, modulation: str = "BPSK") -> float:
        """Computes theoretical bit error rate for BPSK in AWGN: Q(sqrt(2*Eb/N0)) = 0.5 * erfc(sqrt(SNR))."""
        snr_lin = 10.0 ** (snr_db / 10.0)
        if modulation == "BPSK":
            return float(0.5 * special.erfc(np.sqrt(snr_lin)))
        else: # QPSK
            return float(0.5 * special.erfc(np.sqrt(snr_lin / 2.0)))
