#!/usr/bin/env python3
"""
Rewrite mangled CS2 workspace explanation/ren_* fields into clean English.
Scenarios/options were already English; only coach feedback was mangled by
Tamil-script stripping.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOTS = [
    Path(r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud\building_basics\cs2"),
    Path(r"d:\Rebon God\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud\building_basics\cs2"),
]

# lesson_id -> task_id -> {explanation, ren_correct?, ren_wrong?}
FIXES: dict[str, dict[str, dict[str, str]]] = {
    "C2.1a": {
        "C2.1a-T1": {
            "explanation": "This is the root problem behind FQ-142. With a shared login, CloudTrail only ever shows 'dev-shared' — never which of the 10 people actually did the action. Accountability is gone.",
            "ren_correct": "Correct — accountability is the core issue here, not password strength.",
            "ren_wrong": "Not quite — password strength is not the point. The real issue: we cannot tell who did what.",
        },
        "C2.1a-T2": {
            "explanation": "The root account is the master key. Use it only for initial setup, enable MFA, then lock it away. Day-to-day work belongs on IAM users and roles.",
            "ren_correct": "Correct! Root locked away — non-negotiable for the rest of this investigation.",
            "ren_wrong": "Not quite. Daily root use is always a risk. Setup only, then lock it.",
        },
        "C2.1a-T3": {
            "explanation": "Seven problems on one map — that is the full FQ-142 scope. Map everything before you fix anything, or you will miss something.",
        },
        "C2.1a-T4": {
            "explanation": "Secure root first so you keep control. Only deactivate dev-shared after every person has a working individual login — otherwise you lock out the team.",
        },
        "C2.1a-T5": {
            "explanation": "Root access keys should not exist at all — used or unused. Delete them. Deactivating or rotating still leaves a standing risk.",
            "ren_correct": "Correct! Root access keys should not exist at all, period.",
            "ren_wrong": "Not quite — do not just deactivate or rotate. Root access keys are not needed; delete them.",
        },
        "C2.1a-T6": {
            "explanation": "A former contractor also used the shared login — that makes this urgent. You cannot filter CloudTrail by 'contractor', so use the project date window, and deactivate the shared account as soon as individual users are ready.",
        },
        "C2.1a-T7": {
            "explanation": "Document the unexplained CreateAccessKey event precisely (time, IP, event type) and keep the thread open. You cannot close it from this task alone.",
        },
        "C2.1a-T8": {
            "explanation": "The cleanup looks almost done, but dev-shared is still Active — including that mysterious key. Finish full deactivation before you call the piece closed.",
        },
        "C2.1a-T9": {
            "explanation": "Everyone gets an individual account in the right group. Contractors also get a documented end date and a calendar reminder — 'someone will remember' is not a process.",
            "ren_correct": "Correct — this is the long-term fix: process, not just cleanup.",
            "ren_wrong": "Not quite. 'Be careful next time' is not a process. Contractors need an end date plus a reminder.",
        },
        "C2.1a-T10": {
            "explanation": "Report what you fixed, what process is now in place, and clearly flag the unexplained post-project access key as still open.",
        },
    },
}


def apply_file(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    lesson = data.get("lesson_id") or path.name.replace("_workspace.json", "")
    fixes = FIXES.get(lesson)
    if not fixes:
        return 0
    n = 0
    for task in data.get("tasks") or []:
        tid = task.get("id") or task.get("task_id")
        if tid not in fixes:
            continue
        for k, v in fixes[tid].items():
            task[k] = v
            n += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return n


def main():
    # Expand FIXES for remaining CS2 lessons with generic-but-clean English
    # derived from each task's own question/correct option where needed.
    for root in ROOTS:
        if not root.exists():
            continue
        for path in sorted(root.glob("*_workspace.json")):
            lesson = path.name.replace("_workspace.json", "")
            data = json.loads(path.read_text(encoding="utf-8"))
            if lesson in FIXES:
                n = apply_file(path)
                print(path.name, "explicit fixes", n)
                continue
            # Auto-heal remaining CS2: rebuild ren/explanation from intact English fields
            changed = 0
            for task in data.get("tasks") or []:
                changed += heal_task(task)
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(path.name, "healed fields", changed)


def looks_mangled(s: str) -> bool:
    if not s or not s.strip():
        return True
    bad = (
        " without doing",
        " doing ",
        " Not quite. Not quite",
        "do do",
        "map-.",
        "Setup- use",
        "Think again — password",
        "human forget do",
        "use doing",
        "remove must be done",
        "keys is not needed",
        "Document do",
        "flag do",
        "priority-.",
        "Full deactivation do",
        "prevent do",
        "flag doing",
        "control do",
        "confirm do",
        "migrate do",
        "cover do",
        "forget do",
        "check do",
        "attach doing",
        "assume doing",
        "Trace doing",
        "investigate do",
        "valid-.",
        "first-.",
        "pattern-.",
        "exact-.",
        "structural-",
        "permanent-",
        "backup-.",
    )
    if any(b in s for b in bad):
        return True
    if s.count("Not quite") >= 2:
        return True
    # heavy dash stubs like "word- word-"
    if s.count("-.") >= 2 or s.count(" —.") >= 1:
        return True
    return False


def heal_task(task: dict) -> int:
    n = 0
    q = (task.get("question") or task.get("scenario") or "").strip()
    opts = task.get("options") or []
    ci = task.get("correct_index")
    correct = ""
    if isinstance(ci, int) and 0 <= ci < len(opts):
        correct = str(opts[ci]).replace("A) ", "").replace("B) ", "").replace("C) ", "").replace("D) ", "")

    expl = task.get("explanation")
    if isinstance(expl, str) and looks_mangled(expl):
        if correct:
            task["explanation"] = f"Correct answer: {correct}"
        elif task.get("what_to_find"):
            task["explanation"] = "Map every finding before you change anything — missing one leaves a hole in the investigation."
        elif task.get("correct_order") is not None:
            task["explanation"] = "Order matters: secure control first, then migrate access, then retire the old path."
        else:
            task["explanation"] = "Apply least privilege and keep a clear audit trail — that is the FoodQuick standard for FQ-142."
        n += 1

    for key, good, bad in (
        (
            "ren_correct",
            "Correct — that matches the least-privilege and accountability standard for this ticket.",
            "Not quite — revisit the core idea: who can do what, and can we prove it?",
        ),
        (
            "ren_wrong",
            "Not quite — revisit the core idea: who can do what, and can we prove it?",
            "Not quite — revisit the core idea: who can do what, and can we prove it?",
        ),
    ):
        val = task.get(key)
        # Only rewrite if key existed or explanation needed coach lines for MCQ
        if key in task or (task.get("options") and key.startswith("ren_")):
            if not isinstance(val, str) or looks_mangled(val) or not val.strip():
                task[key] = good if key == "ren_correct" else bad
                n += 1
    return n


if __name__ == "__main__":
    # Fill C2.1a T6-T10 from file content if missing in FIXES — already set above
    main()
