import os
import sys
import pytest
import io
import pandas as pd
from fastapi.testclient import TestClient

# Ensure backend directory in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app

client = TestClient(app)

def get_radio_dataset_id():
    res = client.get("/api/ml/datasets")
    assert res.status_code == 200
    datasets = res.json()["datasets"]
    radio_ds = [d for d in datasets if d.get("target_column") == "communication_quality" or "Radio" in d.get("name", "")]
    return radio_ds[0]["id"] if radio_ds else datasets[0]["id"]

def test_ml_datasets_list():
    res = client.get("/api/ml/datasets")
    assert res.status_code == 200
    data = res.json()
    assert "datasets" in data
    assert len(data["datasets"]) >= 1
    ds = data["datasets"][0]
    assert "name" in ds
    assert "row_count" in ds

def test_dataset_inspection():
    ds_id = get_radio_dataset_id()
    res = client.get(f"/api/ml/datasets/{ds_id}/inspection")
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] > 0
    assert "numerical_features" in data
    assert "completeness_percentage" in data

def test_eda_calculations():
    ds_id = get_radio_dataset_id()
    res = client.post(f"/api/ml/datasets/{ds_id}/eda")
    assert res.status_code == 200
    eda = res.json()
    assert "numerical_statistics" in eda
    assert "histograms" in eda
    assert "box_plots" in eda
    assert "correlation_matrix" in eda
    assert "snr" in eda["numerical_statistics"]
    assert "mean" in eda["numerical_statistics"]["snr"]
    assert "median" in eda["numerical_statistics"]["snr"]
    assert "iqr" in eda["numerical_statistics"]["snr"]

def test_data_cleaning_preview():
    ds_id = get_radio_dataset_id()
    payload = {
        "remove_duplicates": True,
        "impute_numeric": "median",
        "impute_categorical": "mode",
        "outlier_strategy": "clip",
        "drop_constant_features": True,
        "preview_only": True
    }
    res = client.post(f"/api/ml/datasets/{ds_id}/clean", json=payload)
    assert res.status_code == 200
    clean_res = res.json()
    assert clean_res["is_preview"] is True
    assert "operations_applied" in clean_res
    assert clean_res["cleaned_rows"] > 0

def test_feature_scaling_leakage_prevention():
    ds_id = get_radio_dataset_id()
    payload = {
        "scaler_type": "StandardScaler",
        "features": ["snr", "ber", "latency_ms", "packet_loss"]
    }
    res = client.post(f"/api/ml/datasets/{ds_id}/scale-analysis", json=payload)
    assert res.status_code == 200
    scale_res = res.json()
    assert "comparisons" in scale_res
    assert "leakage_prevention" in scale_res
    # Verify train and test partitions exist
    assert scale_res["train_samples"] > 0
    assert scale_res["test_samples"] > 0

def test_pca_analysis_and_variance():
    ds_id = get_radio_dataset_id()
    payload = {
        "n_components": 3,
        "features": ["snr", "ber", "latency_ms", "packet_loss", "signal_strength"],
        "scale_first": True
    }
    res = client.post(f"/api/ml/datasets/{ds_id}/pca-analysis", json=payload)
    assert res.status_code == 200
    pca_res = res.json()
    assert pca_res["reduced_dimensions"] == 3
    assert len(pca_res["explained_variance_ratio"]) == 3
    assert len(pca_res["scree_plot"]) == 3
    assert "feature_loadings" in pca_res
    assert len(pca_res["projections_sample"]) > 0

def test_end_to_end_ml_lifecycle_integration():
    """
    End-to-End Integration Test:
    Upload CSV -> Inspect -> EDA -> Clean -> Scaling -> PCA -> Train -> Evaluate -> Predict -> Verify Persistence
    """
    # 1. Prepare sample dataset
    sample_df = pd.DataFrame({
        "sample_id": [f"ID-{i}" for i in range(120)],
        "snr": [10.0 + (i % 25) for i in range(120)],
        "ber": [0.001 * ((i % 10) + 1) for i in range(120)],
        "latency_ms": [20.0 + (i % 50) for i in range(120)],
        "packet_loss": [0.1 * (i % 10) for i in range(120)],
        "signal_strength": [-80.0 + (i % 40) for i in range(120)],
        "channel_type": ["AWGN" if i % 2 == 0 else "Rayleigh" for i in range(120)],
        "communication_quality": ["Good" if i % 3 == 0 else ("Excellent" if i % 3 == 1 else "Poor") for i in range(120)]
    })
    csv_bytes = sample_df.to_csv(index=False).encode("utf-8")

    # 2. Upload
    files = {"file": ("test_integration_radio.csv", io.BytesIO(csv_bytes), "text/csv")}
    upload_res = client.post("/api/ml/datasets/upload", files=files, data={"name": "Integration Radio Dataset"})
    assert upload_res.status_code == 200
    ds_id = upload_res.json()["dataset"]["id"]

    # 3. EDA
    eda_res = client.post(f"/api/ml/datasets/{ds_id}/eda")
    assert eda_res.status_code == 200
    assert eda_res.json()["total_rows"] == 120

    # 4. Clean
    clean_res = client.post(f"/api/ml/datasets/{ds_id}/clean", json={
        "remove_duplicates": True,
        "impute_numeric": "median",
        "impute_categorical": "mode",
        "outlier_strategy": "clip",
        "drop_constant_features": True,
        "preview_only": False
    })
    assert clean_res.status_code == 200
    assert clean_res.json()["is_preview"] is False

    # 5. Scale Analysis
    scale_res = client.post(f"/api/ml/datasets/{ds_id}/scale-analysis", json={
        "scaler_type": "StandardScaler",
        "features": ["snr", "ber", "latency_ms", "packet_loss", "signal_strength"]
    })
    assert scale_res.status_code == 200

    # 6. PCA Analysis
    pca_res = client.post(f"/api/ml/datasets/{ds_id}/pca-analysis", json={
        "n_components": 2,
        "scale_first": True
    })
    assert pca_res.status_code == 200
    assert pca_res.json()["reduced_dimensions"] == 2

    # 7. Model Training (with PCA enabled)
    train_payload = {
        "dataset_id": ds_id,
        "algorithm": "Decision Tree",
        "scaler_type": "StandardScaler",
        "pca_enabled": True,
        "pca_components": 2,
        "test_size": 0.25,
        "random_seed": 42
    }
    train_res = client.post("/api/ml/train", json=train_payload)
    assert train_res.status_code == 200
    t_data = train_res.json()
    assert "accuracy" in t_data
    assert "confusion_matrix" in t_data
    exp_id = t_data["experiment_id"]

    # 8. Registry check
    exp_list_res = client.get("/api/ml/experiments")
    assert exp_list_res.status_code == 200
    exps = exp_list_res.json()["experiments"]
    assert any(e["experiment_id"] == exp_id for e in exps)

    # 9. Live Inference with the trained model
    pred_res = client.post("/api/ml/predict-quality", json={
        "snr": 25.0,
        "ber": 0.0001,
        "latency_ms": 22.0,
        "packet_loss": 0.0,
        "signal_strength": -55.0,
        "channel_type": "AWGN",
        "language": "hi"
    })
    assert pred_res.status_code == 200
    assert pred_res.json()["predicted_quality"] in ["Excellent", "Good", "Moderate", "Poor"]

    # 10. Workflow status check
    status_res = client.get("/api/ml/lifecycle/workflow-status")
    assert status_res.status_code == 200
    assert status_res.json()["total_stages"] == 13
