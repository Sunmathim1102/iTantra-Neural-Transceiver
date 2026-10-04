import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config.settings import settings
from app.database.connection import engine, Base
from app.database.seed import seed_database
from app.routers import (
    auth_routes,
    speech_routes,
    nlp_routes,
    translation_routes,
    radio_routes,
    ml_routes,
    session_routes,
    analytics_routes,
    admin_routes,
    demo_routes
)

# Initialize database tables
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# iTantra — Indian Multilingual TTS & STT Aided Neural Transceiver Radio Access
## Academic & Research Platform

iTantra bridges next-generation speech intelligence and digital wireless communications across Indian languages:
- **Speech-to-Text (STT)** with noise reduction, audio envelope normalization & multi-dialect Indian acoustic mapping
- **Language Identification (LID)** supporting Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, and English
- **NLP & Intent Classification** using TF-IDF + Multinomial Logistic Regression (Emergency, Warning, Navigation, Technical, etc.)
- **Indian Language Translation** engine with dialect handling
- **Neural Transceiver & Radio Access Simulation** with BPSK/QPSK modulation, AWGN/Rayleigh fading, SNR, BER calculation, and waveform synthesis
- **Communication Quality ML Optimizer** using Random Forest to predict link quality (Excellent, Good, Moderate, Poor)
- **Text-to-Speech (TTS)** neural synthesis in native Indic languages
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router, prefix=settings.API_V1_STR)
app.include_router(speech_routes.router, prefix=settings.API_V1_STR)
app.include_router(nlp_routes.router, prefix=settings.API_V1_STR)
app.include_router(translation_routes.router, prefix=settings.API_V1_STR)
app.include_router(radio_routes.router, prefix=settings.API_V1_STR)
app.include_router(ml_routes.router, prefix=settings.API_V1_STR)
app.include_router(session_routes.router, prefix=settings.API_V1_STR)
app.include_router(analytics_routes.router, prefix=settings.API_V1_STR)
app.include_router(admin_routes.router, prefix=settings.API_V1_STR)
app.include_router(demo_routes.router, prefix=settings.API_V1_STR)

# Serve Audio Files
@app.get("/api/audio/file/{filename}")
def serve_audio_file(filename: str):
    for subfolder in ["outputs", "inputs", "samples"]:
        full_path = os.path.join(settings.AUDIO_STORAGE_PATH, subfolder, filename)
        if os.path.exists(full_path):
            media_type = "audio/mpeg" if filename.endswith(".mp3") else "audio/wav"
            return FileResponse(full_path, media_type=media_type)
    
    raise HTTPException(status_code=404, detail="Audio file not found")

@app.get("/")
def root_endpoint():
    return {
        "project": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "status": "ONLINE",
        "docs": "/docs",
        "api_version": "v1.0"
    }
