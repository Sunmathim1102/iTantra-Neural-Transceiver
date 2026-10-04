from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.connection import get_db
from app.models.db_models import User, SystemLog, CommunicationSession
from app.auth.dependencies import require_admin
from app.database.seed import seed_database

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/users")
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at,
            "session_count": len(u.sessions)
        } for u in users
    ]

@router.get("/logs")
def list_system_logs(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(50).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "details": l.details,
            "level": l.level,
            "timestamp": l.timestamp
        } for l in logs
    ]

@router.post("/reset-demo-data")
def reset_demo_data(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    seed_database()
    return {"status": "SUCCESS", "message": "Demo data refreshed successfully"}
