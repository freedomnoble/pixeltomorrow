"""Backend API tests for The Tomorrow Kingdom."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- /api/content ----------
class TestContent:
    def test_content_shape(self, session):
        r = session.get(f"{API}/content", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["start_scene"] == "misty_woods"
        assert len(d["scenes"]) == 11, f"scenes={len(d['scenes'])}"
        assert len(d["items"]) == 10, f"items={len(d['items'])}"
        assert "gargoyle" in d["encounters"] and "the_unmade" in d["encounters"]
        assert d["endings"], "endings missing"
        assert d["combinations"], "combinations missing"
        assert d["portraits"], "portraits missing"
        # ensure no _id leaked
        for coll in ("scenes", "items", "dialogues", "encounters", "endings"):
            for k, v in d[coll].items():
                assert "_id" not in v, f"_id leaked in {coll}/{k}"


# ---------- /api/encounter/act ----------
class TestEncounterGargoyle:
    def test_dodge_advances(self, session):
        r = session.post(f"{API}/encounter/act", json={
            "encounter_id": "gargoyle", "step": 0, "text": "dodge", "inventory": [], "flags": []})
        assert r.status_code == 200
        d = r.json()
        assert d["result"] == "advance"
        assert d["next_step"] == 1

    def test_punch_death(self, session):
        r = session.post(f"{API}/encounter/act", json={
            "encounter_id": "gargoyle", "step": 0, "text": "punch it", "inventory": [], "flags": []})
        d = r.json()
        assert d["result"] == "death", d

    def test_keyword_tomorrow_advance(self, session):
        r = session.post(f"{API}/encounter/act", json={
            "encounter_id": "gargoyle", "step": 1, "text": "I climb toward tomorrow",
            "inventory": [], "flags": []})
        d = r.json()
        # step 1 is last step so advancing becomes win
        assert d["result"] in ("win", "advance"), d

    def test_absurd_stays(self, session):
        r = session.post(f"{API}/encounter/act", json={
            "encounter_id": "gargoyle", "step": 0, "text": "asdf qwrt", "inventory": [], "flags": []})
        d = r.json()
        assert d["result"] == "stay"
        assert d["next_step"] == 0
        assert d["parsed"]["absurd"] is True

    def test_help_stays_with_hints(self, session):
        r = session.post(f"{API}/encounter/act", json={
            "encounter_id": "gargoyle", "step": 0, "text": "help", "inventory": [], "flags": []})
        d = r.json()
        assert d["result"] == "stay"
        assert "could try" in d["text"].lower()


class TestEncounterUnmade:
    def test_step1_no_wins(self, session):
        r = session.post(f"{API}/encounter/act", json={
            "encounter_id": "the_unmade", "step": 1, "text": "no", "inventory": [], "flags": []})
        d = r.json()
        assert d["result"] == "win", d
        assert "win_text" in d

    def test_step0_lantern_advances(self, session):
        r = session.post(f"{API}/encounter/act", json={
            "encounter_id": "the_unmade", "step": 0, "text": "raise lantern",
            "inventory": ["lit_lantern"], "flags": []})
        d = r.json()
        assert d["result"] == "advance", d
        assert d["next_step"] == 1


class TestEncounterErrors:
    def test_invalid_encounter_404(self, session):
        r = session.post(f"{API}/encounter/act", json={
            "encounter_id": "nope", "step": 0, "text": "hi", "inventory": [], "flags": []})
        assert r.status_code == 404


# ---------- /api/telemetry & /api/admin/stats ----------
class TestTelemetry:
    def test_telemetry_ok(self, session):
        r = session.post(f"{API}/telemetry", json={"event": "TEST_evt", "scene": "misty_woods", "data": {"x": 1}})
        assert r.status_code == 200
        assert r.json() == {"ok": True}

    def test_admin_stats(self, session):
        r = session.get(f"{API}/admin/stats")
        assert r.status_code == 200
        d = r.json()
        assert "deaths" in d and "endings" in d and "encounter_results" in d
        assert isinstance(d["encounter_results"], list)
