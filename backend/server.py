from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import re
import uuid
import logging
from pathlib import Path
from pydantic import BaseModel
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage

# MongoDB (kept for env compatibility; not used by booking storage which lives in LocalStorage per product spec)
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="FUN FARMHOUSE API")
api_router = APIRouter(prefix="/api")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

SYSTEM_PROMPT = """You are a booking extraction assistant for FUN FARMHOUSE.

Extract booking details from the customer's message.
Return ONLY valid JSON. Never return markdown. Never explain. No code fences.

Return an object with EXACTLY these keys:
{
  "customerName": "",
  "phone": "",
  "farmName": "",
  "bookingDate": "",
  "timeSlot": "",
  "slotTiming": "",
  "isDoubleSlot": false,
  "customStartTime": "",
  "customEndTime": "",
  "guests": "",
  "eventType": "",
  "totalAmount": "",
  "advancePaid": "",
  "remainingPayment": "",
  "notes": ""
}

Rules:
- Convert dates into YYYY-MM-DD format. If a year is not provided, assume the current or next upcoming year based on today's date.
- Allowed timeSlot values: "Morning", "Evening", "Night", "Custom".
    - Morning => slotTiming "10:00 AM - 4:00 PM"
    - Evening => slotTiming "5:00 PM - 11:00 PM"
    - Night   => slotTiming "1:00 AM - 6:00 AM"
- If the customer requested a custom time window, set timeSlot="Custom", isDoubleSlot=true, fill customStartTime and customEndTime in "HH:MM AM/PM" format, and put "customStartTime - customEndTime" in slotTiming.
- Otherwise isDoubleSlot=false and leave customStartTime, customEndTime blank.
- Calculate remainingPayment = totalAmount - advancePaid (numeric strings, no currency symbol).
- If any field cannot be determined confidently, leave it as an empty string. Never guess names, phones, farms or numbers.
- If the ENTIRE message contains no booking info at all, return null (the literal JSON null).
- Return ONLY the JSON object (or null). No other text."""


class ExtractBookingRequest(BaseModel):
    text: str


def _strip_to_json(raw: str) -> str:
    """Strip code fences / markdown, return the JSON substring."""
    s = raw.strip()
    # remove ```json ... ```
    s = re.sub(r"^```(?:json)?\s*", "", s)
    s = re.sub(r"\s*```$", "", s)
    return s.strip()


@api_router.get("/")
async def root():
    return {"service": "FUN FARMHOUSE API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy", "llm_configured": bool(EMERGENT_LLM_KEY)}


@api_router.post("/extract-booking")
async def extract_booking(payload: ExtractBookingRequest):
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text field is required")

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured on server")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    system_msg = SYSTEM_PROMPT + f"\n\nToday's date is {today}."

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"extract-{uuid.uuid4()}",
        system_message=system_msg,
    ).with_model("openai", "gpt-5.2")

    try:
        response = await chat.send_message(UserMessage(text=text))
    except Exception as e:
        logging.exception("LLM call failed")
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    raw = response if isinstance(response, str) else str(response)
    cleaned = _strip_to_json(raw)

    if cleaned.lower() == "null":
        return JSONResponse(content={"booking": None, "raw": raw})

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find the first {...} block
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            return JSONResponse(content={"booking": None, "raw": raw, "error": "Could not parse JSON"})
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError:
            return JSONResponse(content={"booking": None, "raw": raw, "error": "Invalid JSON from LLM"})

    return JSONResponse(content={"booking": parsed, "raw": raw})


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
