from pydantic import BaseModel
from fastapi import APIRouter, Depends
from database import verify_supabase_jwt
router = APIRouter()
SUPPORTED_INTENTS = {
    "volatile suppliers": "supplier-stability",
    "inbound anomalies": "inbound-intelligence",
    "yard congestion": "yard-intelligence",
    "bottlenecks": "bottleneck-analysis",
    "order risk": "order-risk",
    "drift": "drift-monitor",
    "error correlation": "error-correlation",
}
class CopilotMessage(BaseModel):
    message: str
@router.post("/chat")
def copilot_chat(payload: CopilotMessage, _: dict = Depends(verify_supabase_jwt)) -> dict:
    lowered = payload.message.lower()
    for key, intent in SUPPORTED_INTENTS.items():
        if key in lowered:
            return {"intent": intent, "answer": f"Mapped to '{intent}'. Query the corresponding AI endpoint for structured output."}
    return {"intent": "unsupported", "answer": "I can answer inbound, supplier, yard, bottleneck, order risk, drift, and error correlation questions."}
