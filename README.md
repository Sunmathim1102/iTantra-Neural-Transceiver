# iTantra — Indian Multilingual TTS & STT Aided Neural Transceiver Radio Access

[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-cyan)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **College Semester ML Project** | Full-stack AI-powered Indian Multilingual Neural Transceiver Platform

## 🚀 Live Demo
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs

## 🔑 Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@itantra.in | admin123 |
| User  | demo@itantra.in  | demo123  |

## 🧠 ML Components
| Model | Algorithm | Accuracy |
|-------|-----------|----------|
| Intent Classification | TF-IDF + Logistic Regression | 93.3% |
| Communication Quality | Random Forest (100 trees) | 98.4% |
| Language Detection | Unicode Script Analysis | 99%+ |
| STT Engine | SpeechRecognition (8 Indian dialects) | — |
| TTS Engine | gTTS Neural Speech Synthesizer | — |

## 📡 Radio Simulation
- BPSK / QPSK Modulation
- AWGN / Rayleigh / Rician channel models
- Real BER/SNR physics (erfc formula)
- IQ Constellation Diagram
- RF Waveform visualization

## 🌐 Supported Indian Languages
`Hindi` `Tamil` `Telugu` `Kannada` `Malayalam` `Bengali` `Marathi` `English`

## 🏗️ Architecture
```
React/Vite (TypeScript) ──► FastAPI Backend
                                ├── STT/TTS Engine (SpeechRecognition + gTTS)
                                ├── NLP Pipeline (TF-IDF + LogReg)
                                ├── Translation (deep-translator + lexicon)
                                ├── Radio Simulator (BPSK/QPSK + AWGN)
                                ├── ML Quality Classifier (Random Forest)
                                └── SQLite Database (SQLAlchemy ORM)
```

## ⚡ Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Init
```bash
cd backend
python -c "
from app.database.connection import engine, Base
from app.models.db_models import *
Base.metadata.create_all(bind=engine)
print('DB ready')
"
```

## 📁 Project Structure
```
ML_project/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── routers/             # All API routes
│   │   ├── speech/              # STT + TTS engines
│   │   ├── nlp/                 # Language detection + intent + translation
│   │   ├── radio/               # Modulation + channel simulation
│   │   ├── ml/                  # Random Forest quality classifier
│   │   ├── analytics/           # Stats aggregation
│   │   ├── auth/                # JWT authentication
│   │   └── models/              # SQLAlchemy ORM models
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/               # All UI pages
│       ├── components/          # Navbar, Sidebar, AuthModal
│       └── services/api.ts      # Axios API layer
└── tests/
    └── test_backend.py          # Unit & integration tests
```

## 🧪 Run Tests
```bash
cd backend
python -m pytest tests/ -v
```

## 📖 Viva Guide
All technical Q&A available in the **Viva Guide** page of the app (17 questions covering ML, Signal Processing, NLP, Database).

## 📜 License
MIT © 2026 iTantra Project Team
