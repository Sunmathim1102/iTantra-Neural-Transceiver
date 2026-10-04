import pytest
from fastapi.testclient import TestClient
import os
import sys

# Ensure backend directory in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "iTantra" in data["project"]

def test_language_detection():
    # Hindi
    res_hi = client.post("/api/nlp/detect-language", json={"text": "आपातकालीन स्थिति में सहायता भेजें"})
    assert res_hi.status_code == 200
    assert res_hi.json()["language_code"] == "hi"

    # Tamil
    res_ta = client.post("/api/nlp/detect-language", json={"text": "அனைத்து அமைப்புகளும் சீராக இயங்குகின்றன"})
    assert res_ta.status_code == 200
    assert res_ta.json()["language_code"] == "ta"

def test_nlp_intent_classification():
    res = client.post("/api/nlp/analyze", json={"text": "Mayday mayday, we have engine failure and need immediate rescue"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] in ["Emergency", "Warning"]
    assert "sentiment" in data

def test_radio_simulation():
    payload = {
        "message": "iTantra Test Payload",
        "snr": 18.0,
        "carrier_frequency": 2.4,
        "sampling_rate": 44100.0,
        "bit_rate": 128.0,
        "channel_type": "AWGN",
        "modulation": "BPSK"
    }
    res = client.post("/api/radio/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "ber" in data
    assert "waveform_original" in data
    assert len(data["waveform_original"]) > 0

def test_ml_quality_prediction():
    payload = {
        "snr": 22.0,
        "ber": 0.0001,
        "latency_ms": 25.0,
        "packet_loss": 0.0,
        "signal_strength": -60.0,
        "message_length": 45,
        "audio_duration": 3.0,
        "channel_type": "AWGN",
        "language": "hi"
    }
    res = client.post("/api/ml/predict-quality", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_quality"] in ["Excellent", "Good", "Moderate", "Poor"]
    assert "class_probabilities" in data

def test_analytics_overview():
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_sessions"] > 0
    assert len(data["language_distribution"]) > 0

def test_demo_samples():
    res = client.get("/api/demo/samples")
    assert res.status_code == 200
    assert len(res.json()["samples"]) >= 8
