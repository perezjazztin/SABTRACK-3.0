from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.modules.chatbot.schemas import (
    ChatQueryRequest,
    ChatQueryResponse,
    QuickPromptItem,
)
from app.modules.chatbot.service import query_ecobot, get_quick_prompts

router = APIRouter()

@router.post("/query", response_model=ChatQueryResponse)
def query_chatbot(
    payload: ChatQueryRequest,
    db: Session = Depends(get_db),
):
    """
    Query EcoBot for waste upcycling tutorials, RA 9003 policies,
    and Barangay Sabang collection schedules.
    Zero-cost with automatic offline/curated fallback.
    """
    return query_ecobot(payload, db)

@router.get("/prompts", response_model=List[QuickPromptItem])
def list_suggested_prompts():
    """Retrieve quick-action suggestion prompts for citizen exploration."""
    return get_quick_prompts()
