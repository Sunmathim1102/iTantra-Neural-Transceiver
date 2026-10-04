import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib

def generate_synthetic_radio_dataset(n_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic radio communication dataset with clear mathematical
    correlation to physics-based channel conditions.
    """
    np.random.seed(random_seed)
    
    channel_types = ["AWGN", "Rayleigh", "Rician"]
    languages = ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"]
    
    # 1. Feature sampling
    channel_type = np.random.choice(channel_types, size=n_samples, p=[0.5, 0.3, 0.2])
    language = np.random.choice(languages, size=n_samples)
    
    # SNR distribution with realistic spread (-5 dB to 35 dB)
    snr = np.random.normal(16.0, 8.0, size=n_samples)
    snr = np.clip(snr, -5.0, 35.0)
    
    # BER derived from SNR + fading channel penalty
    ber_base = 0.5 * np.exp(-0.4 * np.maximum(0, snr))
    fading_penalty = np.where(channel_type == "Rayleigh", 0.03, np.where(channel_type == "Rician", 0.01, 0.0))
    ber = np.clip(ber_base + fading_penalty + np.random.normal(0, 0.005, size=n_samples), 0.0, 0.45)
    
    # Packet loss correlates with BER
    packet_loss = np.clip(ber * 140.0 + np.random.normal(0, 2.0, size=n_samples), 0.0, 100.0)
    
    # Signal strength dBm
    signal_strength = np.clip(-95.0 + 1.8 * snr + np.random.normal(0, 3.0, size=n_samples), -115.0, -35.0)
    
    # Message length and audio duration
    message_length = np.random.randint(10, 400, size=n_samples)
    audio_duration = np.clip(message_length * 0.04 + np.random.normal(0, 0.5, size=n_samples), 0.8, 18.0)
    
    # Latency: transmission + propagation + retransmissions from packet loss
    latency_ms = np.clip(15.0 + (message_length * 0.1) + (packet_loss * 2.5) + np.random.normal(0, 5.0, size=n_samples), 10.0, 350.0)

    # 2. Quality ground truth labeling based on composite signal criteria
    quality_scores = (
        (snr / 35.0) * 0.35 +
        (1.0 - (ber / 0.45)) * 0.30 +
        (1.0 - (packet_loss / 100.0)) * 0.20 +
        (1.0 - (latency_ms / 350.0)) * 0.15
    )
    
    quality = []
    for score in quality_scores:
        if score >= 0.75:
            quality.append("Excellent")
        elif score >= 0.55:
            quality.append("Good")
        elif score >= 0.35:
            quality.append("Moderate")
        else:
            quality.append("Poor")
            
    df = pd.DataFrame({
        "sample_id": [f"SIG-{i:05d}" for i in range(n_samples)],
        "snr": np.round(snr, 2),
        "ber": np.round(ber, 5),
        "latency_ms": np.round(latency_ms, 2),
        "packet_loss": np.round(packet_loss, 2),
        "signal_strength": np.round(signal_strength, 2),
        "message_length": message_length,
        "audio_duration": np.round(audio_duration, 2),
        "channel_type": channel_type,
        "language": language,
        "communication_quality": quality
    })
    
    return df

def train_comm_quality_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "backend", "models")
    datasets_dir = os.path.join(base_dir, "backend", "datasets")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(datasets_dir, exist_ok=True)

    print("Generating 5,000 synthetic communication records...")
    df = generate_synthetic_radio_dataset(n_samples=5000, random_seed=42)
    df.to_csv(os.path.join(datasets_dir, "comm_quality_dataset.csv"), index=False)
    print(f"Saved synthetic dataset to {os.path.join(datasets_dir, 'comm_quality_dataset.csv')}")

    # Feature and Target columns
    numerical_features = ["snr", "ber", "latency_ms", "packet_loss", "signal_strength", "message_length", "audio_duration"]
    categorical_features = ["channel_type", "language"]
    target_col = "communication_quality"

    X = df[numerical_features + categorical_features]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numerical_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ]
    )

    clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, class_weight="balanced")

    model_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", clf)
    ])

    print("Training Random Forest Communication Quality Classifier...")
    model_pipeline.fit(X_train, y_train)

    y_pred = model_pipeline.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
    
    classes_ordered = ["Excellent", "Good", "Moderate", "Poor"]
    cm = confusion_matrix(y_test, y_pred, labels=classes_ordered).tolist()
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # Feature importances
    ohe_cols = model_pipeline.named_steps["preprocessor"].named_transformers_["cat"].get_feature_names_out(categorical_features)
    all_feature_names = numerical_features + list(ohe_cols)
    raw_importances = model_pipeline.named_steps["classifier"].feature_importances_
    feature_importance_dict = {name: round(float(imp), 4) for name, imp in zip(all_feature_names, raw_importances)}
    # Sort by importance
    sorted_importances = dict(sorted(feature_importance_dict.items(), key=lambda item: item[1], reverse=True))

    # Save Pipeline
    joblib.dump(model_pipeline, os.path.join(models_dir, "comm_quality_model.joblib"))

    metrics = {
        "model_name": "Random Forest Communication Quality Classifier",
        "algorithm": "Random Forest (100 Estimators, Depth=12)",
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "numerical_features": numerical_features,
        "categorical_features": categorical_features,
        "classes": classes_ordered,
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "classification_report": report,
        "feature_importances": sorted_importances,
        "dataset_metadata": {
            "synthetic": True,
            "description": "Synthesized RF propagation & channel metrics modeled after AWGN, Rayleigh, and Rician channel physics.",
            "columns": list(df.columns)
        }
    }

    with open(os.path.join(models_dir, "comm_quality_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Model saved successfully! Accuracy: {acc*100:.2f}%, F1-Score: {f1*100:.2f}%")

if __name__ == "__main__":
    train_comm_quality_model()
