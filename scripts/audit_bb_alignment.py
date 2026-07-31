"""
Audit Building Basics CS3–CS7: lesson ↔ workspace alignment + strength signals.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(
    r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud\building_basics"
)

PLAN = [
    "C3.1", "C3.2a", "C3.2b", "C3.3", "C3.4", "C3.5", "C3.6",
    "C4.1", "C4.2a", "C4.2b", "C4.3", "C4.4", "C4.5", "C4.6",
    "C5.1a", "C5.1b", "C5.2", "C5.3", "C5.4",
    "C6.1", "C6.2", "C6.3", "C6.4",
    "C7.1", "C7.2", "C7.3", "C7.4",
]

SESSION = {
    "C3": "cs3", "C4": "cs4", "C5": "cs5", "C6": "cs6", "C7": "cs7",
}


def folder_for(lid: str) -> str:
    return SESSION[lid.split(".")[0]]


def load(path: Path):
    if not path.exists() or path.stat().st_size < 20:
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as e:
        return {"__error__": str(e)}


def keywords(text: str) -> set[str]:
    text = (text or "").lower()
    # AWS / cloud tokens worth matching
    toks = re.findall(
        r"\b(?:vpc|subnet|nacl|cidr|igw|nat|route\s*53|alb|nlb|ec2|ami|"
        r"asg|auto\s*scaling|ebs|efs|s3|glacier|iam|mfa|scp|rds|dynamodb|"
        r"cloudwatch|cloudtrail|config|trusted\s*advisor|security\s*group|"
        r"peering|transit\s*gateway|bastion|session\s*manager|spot|"
        r"on-demand|reserved|savings\s*plans|lifecycle|versioning|"
        r"encryption|kms|dashboard|alarm|budget|tag|cost\s*explorer|"
        r"load\s*balancer|target\s*group|health\s*check|failover|"
        r"weighted|alias|cname|ephemeral|stateful|stateless|"
        r"multi-az|snapshot|backup|portfolio|architecture)\b",
        text,
    )
    return {t.replace(" ", "") for t in toks}


def lesson_blob(lesson: dict) -> str:
    parts = [
        str(lesson.get("lesson_title", "")),
        " ".join(lesson.get("student_will_learn") or []),
    ]
    for b in lesson.get("blocks") or []:
        parts.append(str(b.get("block_title", "")))
        parts.append(str(b.get("ava_speaks", "")))
        parts.append(str(b.get("block_type", "")))
    return "\n".join(parts)


def workspace_blob(ws: dict) -> str:
    parts = [
        str(ws.get("arc_intro", "")),
        str(ws.get("arc_outro", "")),
        str(ws.get("ticket", "")),
    ]
    for t in ws.get("tasks") or []:
        for k in (
            "scenario",
            "question",
            "explanation",
            "diagnosis",
            "fix",
            "solution",
            "what_to_find",
            "broken_config",
        ):
            v = t.get(k)
            if isinstance(v, list):
                parts.append(" ".join(map(str, v)))
            else:
                parts.append(str(v or ""))
    return "\n".join(parts)


def main():
    rows = []
    for lid in PLAN:
        folder = folder_for(lid)
        lp = ROOT / folder / f"{lid}.json"
        wp = ROOT / folder / f"{lid}_workspace.json"
        lesson = load(lp)
        ws = load(wp)

        status = {
            "id": lid,
            "lesson_ok": bool(lesson) and "__error__" not in (lesson or {}),
            "workspace_ok": bool(ws) and "__error__" not in (ws or {}),
            "lesson_bytes": lp.stat().st_size if lp.exists() else 0,
            "workspace_bytes": wp.stat().st_size if wp.exists() else 0,
            "tasks": 0,
            "learn_topics": [],
            "overlap": 0.0,
            "missing_in_ws": [],
            "issues": [],
        }

        if not status["lesson_ok"]:
            status["issues"].append("MISSING_OR_EMPTY_LESSON")
        if not status["workspace_ok"]:
            status["issues"].append("MISSING_OR_EMPTY_WORKSPACE")

        if status["lesson_ok"] and status["workspace_ok"]:
            status["tasks"] = len(ws.get("tasks") or [])
            if status["tasks"] < 8:
                status["issues"].append(f"LOW_TASK_COUNT:{status['tasks']}")
            if not ws.get("arc_intro"):
                status["issues"].append("NO_ARC_INTRO")
            # source_lesson consistency
            bad_src = [
                t.get("id")
                for t in (ws.get("tasks") or [])
                if t.get("source_lesson") and t.get("source_lesson") != lid
            ]
            if bad_src:
                status["issues"].append(f"SOURCE_MISMATCH:{len(bad_src)}")

            lk = keywords(lesson_blob(lesson))
            wk = keywords(workspace_blob(ws))
            status["learn_topics"] = sorted(lk)[:12]
            if lk:
                overlap = len(lk & wk) / len(lk)
                status["overlap"] = round(overlap, 2)
                missing = sorted(lk - wk)
                status["missing_in_ws"] = missing[:8]
                if overlap < 0.35:
                    status["issues"].append(f"LOW_TOPIC_OVERLAP:{overlap:.2f}")

            # strength: real-world signals
            blob = (lesson_blob(lesson) + "\n" + workspace_blob(ws)).lower()
            if "foodquick" not in blob and "fq-" not in blob:
                status["issues"].append("NO_FOODQUICK_STORY")
            real_signals = sum(
                1
                for s in (
                    "incident",
                    "ticket",
                    "cost",
                    "production",
                    "outage",
                    "security",
                    "audit",
                    "customer",
                )
                if s in blob
            )
            if real_signals < 2:
                status["issues"].append("WEAK_REALWORLD_SIGNALS")

        rows.append(status)

    print("ID       LSN   WS    TASKS  OVERLAP  ISSUES")
    for r in rows:
        print(
            f"{r['id']:<8} {r['lesson_bytes']:>5} {r['workspace_bytes']:>5}  "
            f"{r['tasks']:>3}   {r['overlap']:>5}   {', '.join(r['issues']) or 'ok'}"
        )
        if r["missing_in_ws"]:
            print(f"         missing_in_ws: {r['missing_in_ws']}")

    bad = [r for r in rows if r["issues"]]
    print(f"\nTOTAL {len(rows)} | WITH_ISSUES {len(bad)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
