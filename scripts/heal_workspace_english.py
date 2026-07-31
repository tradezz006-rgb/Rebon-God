#!/usr/bin/env python3
"""Heal awkward workspace coach lines across Building Basics using intact English options."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOTS = [
    Path(r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud\building_basics"),
    Path(r"d:\Rebon God\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud\building_basics"),
]

AWKWARD = re.compile(
    r"(?:\bdo(?:ing|ne)?\b.*\bdo\b|\bwithout doing\b|\bNot quite\b.*\bNot quite\b|"
    r"\b(?:map-|valid-|first-|pattern-|exact-|priority-|structural-|permanent-|backup-)\b|"
    r"\b(?:kaatichu|appuram|nenac|vidhama|mukkiya|pann|irukk|illa|namba|andha|idhu|madhiri|"
    r"rendu|konjam|yosi|venum|soll|maath|paakr)\w*\b|"
    r"change the order, application break|removed the old rule without adding|"
    r"Symptom fix doing|teach-back task|individual fires)",
    re.I,
)


def strip_opt(s: str) -> str:
    return re.sub(r"^[A-D]\)\s*", "", str(s)).strip()


def awkward(s: str | None) -> bool:
    if not isinstance(s, str) or not s.strip():
        return True
    if AWKWARD.search(s):
        return True
    # too many clipped stubs
    if s.count("-.") >= 2:
        return True
    # ends mid-thought with lone dash stubs
    if re.search(r"\b\w{1,3}-\.\s*$", s):
        return True
    return False


def heal_task(task: dict) -> int:
    n = 0
    opts = task.get("options") or []
    ci = task.get("correct_index")
    correct = ""
    if isinstance(ci, int) and isinstance(opts, list) and 0 <= ci < len(opts):
        correct = strip_opt(opts[ci])

    if awkward(task.get("explanation")):
        if correct:
            task["explanation"] = correct
        elif task.get("diagnosis"):
            task["explanation"] = str(task["diagnosis"])
        elif task.get("fix"):
            task["explanation"] = str(task["fix"])
        elif task.get("what_to_find"):
            finds = task["what_to_find"]
            if isinstance(finds, list) and finds:
                task["explanation"] = "Key findings: " + "; ".join(str(x) for x in finds[:3])
            else:
                task["explanation"] = "Map every finding before you change configuration."
        elif task.get("correct_order") is not None:
            task["explanation"] = "Sequence matters — secure control first, then migrate, then retire the old path."
        elif task.get("expected_answer_contains"):
            bits = task["expected_answer_contains"]
            if isinstance(bits, list) and bits:
                task["explanation"] = str(bits[0])
        else:
            task["explanation"] = "Apply the lesson principle directly to this FoodQuick ticket."
        n += 1

    if "options" in task or "ren_correct" in task or "ren_wrong" in task:
        if awkward(task.get("ren_correct")):
            task["ren_correct"] = (
                f"Correct — {correct[:120]}" if correct else "Correct — that matches the lesson."
            )
            n += 1
        if awkward(task.get("ren_wrong")):
            task["ren_wrong"] = (
                "Not quite — re-read the question and match it to the principle from the lesson."
            )
            n += 1
    return n


def process(root: Path) -> None:
    if not root.exists():
        return
    total = 0
    for path in sorted(root.glob("cs*/*_workspace.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        c = 0
        for task in data.get("tasks") or []:
            c += heal_task(task)
        if c:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        total += c
        print(path.name, c)
    print("total healed", total)


def main():
    for r in ROOTS:
        print("==", r)
        process(r)


if __name__ == "__main__":
    main()
