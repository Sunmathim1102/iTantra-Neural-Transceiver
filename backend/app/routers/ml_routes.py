import os
import json
import pandas as pd
from fastapi import APIRouter
from app.config.settings import settings
from app.ml.comm_quality_model import comm_quality_model
from app.schemas.api_schemas import MLQualityPredictRequest, MLQualityPredictResponse

router = APIRouter(prefix="/ml", tags=["Machine Learning Models & Evaluation"])

@router.post("/predict-quality", response_model=MLQualityPredictResponse)
def predict_quality_endpoint(req: MLQualityPredictRequest):
    return comm_quality_model.predict_quality(
        snr=req.snr,
        ber=req.ber,
        latency_ms=req.latency_ms,
        packet_loss=req.packet_loss,
        signal_strength=req.signal_strength,
        message_length=req.message_length,
        audio_duration=req.audio_duration,
        channel_type=req.channel_type,
        language=req.language
    )

@router.get("/models")
def get_model_information():
    intent_metrics_path = os.path.join(settings.MODELS_STORAGE_PATH, "intent_metrics.json")
    comm_metrics_path = os.path.join(settings.MODELS_STORAGE_PATH, "comm_quality_metrics.json")
    
    intent_data = {}
    if os.path.exists(intent_metrics_path):
        with open(intent_metrics_path, "r", encoding="utf-8") as f:
            intent_data = json.load(f)

    comm_data = {}
    if os.path.exists(comm_metrics_path):
        with open(comm_metrics_path, "r", encoding="utf-8") as f:
            comm_data = json.load(f)

    return {
        "intent_classification_model": intent_data,
        "communication_quality_model": comm_data
    }

@router.get("/dataset/preview")
def get_dataset_preview():
    csv_path = os.path.join(settings.DATASETS_STORAGE_PATH, "comm_quality_dataset.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        return {
            "total_rows": len(df),
            "columns": list(df.columns),
            "samples": df.head(15).to_dict(orient="records"),
            "summary_statistics": df.describe().to_dict()
        }
    return {"total_rows": 0, "samples": [], "summary_statistics": {}}
