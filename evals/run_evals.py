"""
Eval harness for /api/generate.
Requires the Next.js dev server running at http://localhost:3000.
Usage: UV_PROJECT_ENVIRONMENT=marketing_agent uv run python run_evals.py
"""

import json
import sys
from pathlib import Path

import httpx

BASE_URL = "http://localhost:3000"
CASES_DIR = Path(__file__).parent / "cases"

PLAN_REQUIRED_KEYS = {"insight", "concept", "headlines", "channelPlan", "metrics", "risks"}
CONCEPT_REQUIRED_KEYS = {"name", "bigIdea"}


def validate_plan_shape(data: dict) -> list[str]:
    errors = []
    missing = PLAN_REQUIRED_KEYS - data.keys()
    if missing:
        errors.append(f"plan.data missing keys: {missing}")
        return errors
    if not isinstance(data.get("headlines"), list) or len(data["headlines"]) == 0:
        errors.append("plan.data.headlines must be a non-empty list")
    if not isinstance(data.get("channelPlan"), list) or len(data["channelPlan"]) == 0:
        errors.append("plan.data.channelPlan must be a non-empty list")
    else:
        for i, ch in enumerate(data["channelPlan"]):
            for key in ("channel", "angle", "format"):
                if key not in ch:
                    errors.append(f"channelPlan[{i}] missing key: {key}")
    if not isinstance(data.get("metrics"), list) or len(data["metrics"]) == 0:
        errors.append("plan.data.metrics must be a non-empty list")
    if not isinstance(data.get("risks"), list) or len(data["risks"]) == 0:
        errors.append("plan.data.risks must be a non-empty list")
    concept = data.get("concept", {})
    missing_concept = CONCEPT_REQUIRED_KEYS - concept.keys()
    if missing_concept:
        errors.append(f"plan.data.concept missing keys: {missing_concept}")
    return errors


def run_case(path: Path) -> tuple[str, bool, str]:
    case = json.loads(path.read_text())
    name = path.stem
    expect = case["expect"]

    try:
        res = httpx.post(
            f"{BASE_URL}/api/generate",
            json=case["brief"],
            timeout=30.0,
        )
    except httpx.ConnectError:
        return name, False, "Connection refused — is the dev server running at localhost:3000?"

    if res.status_code != expect["status"]:
        return name, False, f"Expected status {expect['status']}, got {res.status_code}. Body: {res.text[:200]}"

    if expect["mode"] is None:
        return name, True, f"status {res.status_code} (no mode expected)"

    try:
        body = res.json()
    except Exception:
        return name, False, f"Response is not valid JSON: {res.text[:200]}"

    mode = body.get("mode")
    if mode != expect["mode"]:
        return name, False, f"Expected mode={expect['mode']!r}, got mode={mode!r}"

    if mode == "plan":
        shape_errors = validate_plan_shape(body.get("data", {}))
        if shape_errors:
            return name, False, "Shape errors: " + "; ".join(shape_errors)

    if mode == "clarify":
        questions = body.get("questions")
        if not isinstance(questions, list) or len(questions) == 0:
            return name, False, "clarify.questions must be a non-empty list"

    return name, True, f"mode={mode}"


def main() -> None:
    cases = sorted(CASES_DIR.glob("*.json"))
    if not cases:
        print("No cases found in cases/")
        sys.exit(1)

    passed = 0
    failed = 0

    print(f"Running {len(cases)} eval case(s) against {BASE_URL}\n")

    for path in cases:
        name, ok, detail = run_case(path)
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}: {detail}")
        if ok:
            passed += 1
        else:
            failed += 1

    print(f"\n{passed}/{passed + failed} passed")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
