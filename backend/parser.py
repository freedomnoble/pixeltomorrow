import re
import random
from content import INTENTS, ITEM_ALIASES, ABSURD_RESPONSES

PRIORITY = ["refuse", "help", "give", "use", "attack", "defend", "flee", "cast", "threaten", "talk", "inspect", "take", "wait"]


def normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9'? ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def detect_target(text: str, inventory: list[str]) -> str | None:
    best = None
    best_len = 0
    for item_id, aliases in ITEM_ALIASES.items():
        for alias in aliases:
            if re.search(rf"\b{re.escape(alias)}\b", text) and len(alias) > best_len:
                best, best_len = item_id, len(alias)
    if best == "lit_lantern" and "lit_lantern" not in inventory and "rusty_lantern" in inventory:
        return "rusty_lantern"
    if best == "waking_orb" and "waking_orb" not in inventory and "dim_orb" in inventory:
        return "dim_orb"
    return best


def parse(text: str, inventory: list[str] | None = None) -> dict:
    inventory = inventory or []
    norm = normalize(text)
    words = norm.split()
    if not norm:
        return {"intent": None, "target": None, "confidence": 0.0, "normalized": norm}

    matched: dict[str, int] = {}
    for intent, verbs in INTENTS.items():
        for verb in verbs:
            if " " in verb:
                if verb in norm:
                    matched[intent] = min(matched.get(intent, 99), 0)
            elif verb in words:
                matched[intent] = min(matched.get(intent, 99), words.index(verb))

    target = detect_target(norm, inventory)
    intent = None
    confidence = 0.0

    if matched:
        if "refuse" in matched and len(matched) > 1 and words[0] not in INTENTS["refuse"]:
            matched.pop("refuse")
        if "wait" in matched and ("give" in matched or "use" in matched) and "down" not in words:
            matched.pop("wait")
        intent = sorted(matched, key=lambda i: (matched[i], PRIORITY.index(i)))[0]
        confidence = 0.9
    elif target:
        intent = "use"
        confidence = 0.6
    elif norm.endswith("?") or words[0] in ("why", "where", "who"):
        intent = "help"
        confidence = 0.5

    gibberish = not any(len(w) > 2 and re.search(r"[aeiouy]", w) for w in words)
    absurd = len(words) > 40 or (not matched and not target and gibberish)
    if intent is None and not absurd:
        intent = "talk"
        confidence = 0.4
    return {
        "intent": intent,
        "target": target,
        "confidence": confidence,
        "normalized": norm,
        "absurd": absurd,
        "absurd_text": random.choice(ABSURD_RESPONSES) if absurd else None,
    }
