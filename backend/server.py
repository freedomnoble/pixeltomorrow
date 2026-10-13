from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime, timezone

from content import SCENES, ITEMS, COMBINATIONS, DIALOGUES, ENCOUNTERS, ENDINGS, PORTRAITS, INTENTS
from parser import parse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="The Tomorrow Kingdom API")
api_router = APIRouter(prefix="/api")

CONTENT_VERSION = 1


class ParseRequest(BaseModel):
    text: str
    inventory: list[str] = []


class ActRequest(BaseModel):
    encounter_id: str
    step: int = 0
    text: str
    inventory: list[str] = []
    flags: list[str] = []


class TelemetryEvent(BaseModel):
    event: str
    scene: Optional[str] = None
    data: dict[str, Any] = Field(default_factory=dict)


async def seed_content():
    docs = {
        "scenes": [{"_id": k, **v} for k, v in SCENES.items()],
        "items": [{"_id": k, **v} for k, v in ITEMS.items()],
        "dialogues": [{"_id": k, **v} for k, v in DIALOGUES.items()],
        "encounters": [{"_id": k, **v} for k, v in ENCOUNTERS.items()],
        "endings": [{"_id": k, **v} for k, v in ENDINGS.items()],
    }
    for coll, items in docs.items():
        for doc in items:
            await db[coll].replace_one({"_id": doc["_id"]}, doc, upsert=True)
    await db.meta.replace_one({"_id": "content"}, {"_id": "content", "version": CONTENT_VERSION,
                                                   "combinations": COMBINATIONS, "portraits": PORTRAITS,
                                                   "intents": INTENTS,
                                                   "seeded_at": datetime.now(timezone.utc).isoformat()}, upsert=True)


def strip_id(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/")
async def root():
    return {"message": "The Tomorrow Kingdom is (barely) awake."}


@api_router.get("/content")
async def get_content():
    meta = await db.meta.find_one({"_id": "content"})
    if not meta:
        await seed_content()
        meta = await db.meta.find_one({"_id": "content"})
    out = {"version": meta["version"], "combinations": meta["combinations"], "portraits": meta["portraits"],
           "intents": list(meta["intents"].keys()), "start_scene": "misty_woods"}
    for coll in ("scenes", "items", "dialogues", "encounters", "endings"):
        out[coll] = {d["_id"]: strip_id(d) async for d in db[coll].find({})}
    return out


@api_router.post("/parse")
async def parse_text(req: ParseRequest):
    return parse(req.text, req.inventory)


def rule_matches(rule: dict, parsed: dict, text: str, inventory: list[str]) -> bool:
    if rule.get("intents") and parsed["intent"] not in rule["intents"]:
        return False
    if rule.get("keywords") and not any(k in text for k in rule["keywords"]):
        return False
    if rule.get("target") and parsed["target"] != rule["target"]:
        return False
    if rule.get("requires_items") and not all(i in inventory for i in rule["requires_items"]):
        return False
    return True


@api_router.post("/encounter/act")
async def encounter_act(req: ActRequest):
    enc = ENCOUNTERS.get(req.encounter_id)
    if not enc:
        raise HTTPException(404, "Unknown encounter")
    if req.step < 0 or req.step >= len(enc["steps"]):
        raise HTTPException(400, "Invalid step")
    step = enc["steps"][req.step]
    parsed = parse(req.text, req.inventory)
    text = parsed["normalized"]

    if parsed.get("absurd"):
        return {"parsed": parsed, "result": "stay", "text": f"{parsed['absurd_text']} {step['fallback']}",
                "next_step": req.step, "hints": step["hints"]}
    if parsed["intent"] == "help":
        return {"parsed": parsed, "result": "stay", "text": "You could try: " + ", ".join(step["hints"]) + ".",
                "next_step": req.step, "hints": step["hints"]}

    for rule in step["rules"]:
        if rule_matches(rule, parsed, text, req.inventory):
            result = rule["result"]
            next_step = req.step
            effects = rule.get("effects", {})
            response = {"parsed": parsed, "result": result, "text": rule["text"], "effects": effects, "hints": step["hints"]}
            if result == "advance":
                next_step = req.step + 1
                if next_step >= len(enc["steps"]):
                    result = "win"
            if result == "win":
                response["result"] = "win"
                response["win_text"] = enc["win_text"]
                response["win_effects"] = enc.get("win_effects", {})
            response["next_step"] = next_step
            await db.telemetry.insert_one({"event": "encounter_action", "encounter": req.encounter_id, "step": req.step,
                                           "intent": parsed["intent"], "result": result,
                                           "at": datetime.now(timezone.utc).isoformat()})
            return response

    return {"parsed": parsed, "result": "stay", "text": step["fallback"] + " (Try: " + ", ".join(step["hints"]) + ".)",
            "next_step": req.step, "hints": step["hints"]}


@api_router.post("/telemetry")
async def telemetry(ev: TelemetryEvent):
    await db.telemetry.insert_one({**ev.model_dump(), "at": datetime.now(timezone.utc).isoformat()})
    return {"ok": True}


@api_router.get("/admin/stats")
async def admin_stats():
    deaths = await db.telemetry.count_documents({"event": "death"})
    endings = await db.telemetry.count_documents({"event": "ending"})
    pipeline = [{"$match": {"event": "encounter_action"}},
                {"$group": {"_id": {"encounter": "$encounter", "result": "$result"}, "n": {"$sum": 1}}}]
    enc = [{"encounter": d["_id"]["encounter"], "result": d["_id"]["result"], "n": d["n"]}
           async for d in db.telemetry.aggregate(pipeline)]
    return {"deaths": deaths, "endings": endings, "encounter_results": enc}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await seed_content()
    logger.info("Content seeded")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
