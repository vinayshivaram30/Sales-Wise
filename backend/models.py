from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID


class CallCreate(BaseModel):
    name: str  # Short label (e.g. "Acme Discovery")
    contact_name: Optional[str] = Field(default=None)
    company_name: Optional[str] = Field(default=None)
    goal: Optional[str] = Field(default="Discovery")
    product_ctx: Optional[str] = None
    company_ctx: Optional[str] = None
    past_context: Optional[str] = None


class CallUpdate(BaseModel):
    contact_name: Optional[str] = None
    company_name: Optional[str] = None
    goal: Optional[str] = None
    product_ctx: Optional[str] = None
    company_ctx: Optional[str] = None
    past_context: Optional[str] = None
    # Customer/Company Context
    company: Optional[str] = None
    contact: Optional[str] = None
    sales_team_size: Optional[str] = None
    current_stack: Optional[str] = None
    known_pain: Optional[str] = None
    deal_stage: Optional[str] = None
    deal_size_est: Optional[str] = None
    decision_timeline: Optional[str] = None
    economic_buyer: Optional[str] = None
    champion_likelihood: Optional[str] = None
    # Product Context
    product_name: Optional[str] = None
    category: Optional[str] = None
    core_value_proposition: Optional[str] = None
    pricing: Optional[str] = None
    key_differentiators: Optional[str] = None
    known_objections: Optional[str] = None
    product_tags: Optional[List[str]] = None
    # Objectives/Goals
    primary_goal: Optional[str] = None
    secondary_goal: Optional[str] = None
    demo_focus: Optional[str] = None
    objection_to_preempt: Optional[str] = None
    exit_criteria: Optional[str] = None
    # Past
    open_objections_from_history: Optional[str] = None
    past_conversations: Optional[List[dict]] = None


class CallPlanResponse(BaseModel):
    call_id: UUID
    questions: List[dict]
    meddic_gaps: dict
    watch_for: Optional[str] = None


class SuggestionPayload(BaseModel):
    question: str
    meddic_field: str
    why: str
    confidence: float


class MEDDICState(BaseModel):
    metrics: Optional[str] = None
    econ_buyer: Optional[str] = None
    decision_criteria: Optional[str] = None
    decision_process: Optional[str] = None
    pain: Optional[str] = None
    champion: Optional[str] = None


class SummaryResponse(BaseModel):
    summary_text: str
    meddic_state: MEDDICState
    objections: List[dict]
    next_steps: List[dict]
    deal_stage: str
    deal_score: int
    coaching: List[dict]


class SuggestionAction(BaseModel):
    status: str  # 'used' | 'skipped'
