from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class SourceCitation(BaseModel):
    title: str
    url: str
    snippet: Optional[str] = None

class UpcyclingStep(BaseModel):
    step_number: int
    title: str
    instruction: str

class UpcyclingProject(BaseModel):
    id: str
    title: str
    category: str
    materials_needed: List[str]
    difficulty: str
    estimated_time: str
    steps: List[UpcyclingStep]
    benefits: str
    source_url: Optional[str] = None

class ChatQueryRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Citizen inquiry or upcycling question")
    area_id: Optional[int] = Field(None, description="Optional Purok ID for personalized schedule lookup")
    history: Optional[List[Dict[str, str]]] = Field(default=[], description="Previous conversation turns")

class ChatQueryResponse(BaseModel):
    reply: str
    is_from_cache: bool = False
    is_fallback: bool = False
    model_used: str = "gemini-1.5-flash"
    citations: List[SourceCitation] = []
    featured_project: Optional[UpcyclingProject] = None
    suggested_prompts: List[str] = []

class QuickPromptItem(BaseModel):
    id: str
    category: str
    prompt: str
    icon: str
