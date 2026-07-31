#!/usr/bin/env python3
"""
REBON Cloud language split:
  1) Move lesson JSONs → {fresher,building_basics}/tanglish/...
  2) Create empty English lesson stubs → .../english/...
  3) Convert workspace Tanglish (romanized + Tamil script) → pure English
     in *_workspace.json and fresher lesson workspace_tasks only.

Lesson teaching stays Tanglish (language field). Workspace becomes English.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

ROOT = Path(r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud")
NESTED = Path(
    r"d:\Rebon God\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud"
)

# ── Tanglish / Tamil → English phrase fixes (longest first) ──────────
PHRASE_MAP = [
    # Tamil script common Ren lines
    ("சரியா identify பண்ணீங்க", "You identified that correctly"),
    ("சரி!", "Correct!"),
    ("சரி.", "Correct."),
    ("இல்ல.", "Not quite."),
    ("இல்ல,", "Not quite —"),
    ("இல்ல —", "Not quite —"),
    ("இல்ல", "No"),
    ("சிந்தியுங்க", "Think again"),
    ("பண்ணீங்க", "you did"),
    ("பண்ணணும்", "must be done"),
    ("பண்றது", "doing"),
    ("பண்ண", "do"),
    ("தேவையே இல்ல", "is not needed at all"),
    ("தேவை இல்ல", "is not needed"),
    ("எப்போவுமே", "always"),
    ("மட்டும்", "only"),
    ("அப்புறம்", "then"),
    ("இது தான்", "This is"),
    ("இதுல", "in this"),
    ("இல்லாம", "without"),
    ("வேணும்", "is needed"),
    ("வேண்டும்", "is needed"),
    ("ஒரு process இல்ல", "is not a process"),
    ("யாரு", "who"),
    ("enna panninanu therila", "we cannot tell who did what"),
    ("yaaru enna panninanu therila", "we cannot tell who did what"),
    # Romanized Tanglish particles / phrases
    ("nu na ", "means "),
    (" nu ", " — "),
    ("-nu ", " — "),
    ("-ன்னு ", " — "),
    ("idhu ", "this "),
    ("Idhu ", "This "),
    ("adhu ", "that "),
    ("Adhu ", "That "),
    ("enna ", "what "),
    ("Enna ", "What "),
    ("eppo ", "when "),
    ("eppovume ", "always "),
    ("eppoavume ", "always "),
    ("mattum ", "only "),
    ("Mattum ", "Only "),
    ("thaan ", ""),
    ("thaaan ", ""),
    ("thaan.", "."),
    ("thaan,", ","),
    ("kooda ", "also "),
    ("illa ", "not "),
    ("illai ", "not "),
    ("illainaalum ", "even if not "),
    ("illaina ", "if not "),
    ("irukku ", "is there "),
    ("irukkum ", "will be "),
    ("irundha ", "if it was "),
    ("irundhalum ", "even if "),
    ("pannunga ", "do "),
    ("pannanum ", "must do "),
    ("panna ", "to do "),
    ("pannala ", "did not do "),
    ("pannitom ", "we did "),
    ("pannina ", "did "),
    ("panni ", "done "),
    ("vaanga ", "come "),
    ("porom ", "let's go "),
    ("sollu ", "say "),
    ("solli ", "saying "),
    ("solradhu ", "says "),
    ("solrudhu ", "says "),
    ("puriyanum ", "must understand "),
    ("puriya ", "understand "),
    ("precise-ah ", "precisely "),
    ("correct-ah ", "correctly "),
    ("wrong-ah ", "wrongly "),
    ("clear-ah ", "clearly "),
    ("full-ah ", "fully "),
    ("safe-ah ", "safely "),
    ("public-ah ", "public "),
    ("private-ah ", "private "),
    ("active-ah ", "actively "),
    ("literal-ah ", "literally "),
    ("-ah ", " "),
    ("-nu.", "."),
    ("naama ", "we "),
    ("namma ", "our "),
    ("ungalukku ", "for you "),
    ("unga ", "your "),
    ("neenga ", "you "),
    ("appo ", "then "),
    ("aana ", "but "),
    ("aanal ", "but "),
    ("aanaal ", "but "),
    ("apparam ", "after that "),
    ("munnaadi ", "before "),
    ("innum ", "still "),
    ("konjam ", "a bit "),
    ("romba ", "very "),
    ("seri ", "okay "),
    ("sari ", "correct "),
    ("vendiya ", "needed "),
    ("vendum ", "needed "),
    ("mudiyum ", "can "),
    ("mudiyaadhu ", "cannot "),
    ("kudukkum ", "gives "),
    ("check panna ", "to check "),
    ("fix panna ", "to fix "),
    ("delete panna ", "to delete "),
    ("add panna ", "to add "),
    ("use panna ", "to use "),
    ("panna mudiyum ", "can be done "),
    ("panna vendiya ", "need to "),
    ("First thing check panna vendiya reason", "The reason to check this first"),
    ("single-line rule fix panna mudiyum", "a single-line rule can fix it"),
    ("single-line rule thaan biggest exposure kudukkum", "a single-line rule creates the biggest exposure"),
    ("default placeholder illa, active rule thaan", "is not a default placeholder — it is an active rule"),
    ("literally entire internet", "literally the entire internet"),
    ("no exceptions, no default-safe assumption", "no exceptions, and no safe-by-default assumption"),
    ("read the rule literally", "read the rule literally"),
    ("wrong direction", "off track"),
    ("ore neraththil", "at the same time"),
    ("mudhalil", "first"),
]

# Strip remaining Tamil / related scripts
SCRIPT_RE = re.compile(
    r"[\u0B80-\u0BFF\u0400-\u04FF\u0900-\u097F]+"
)

TANGLISH_HINT = re.compile(
    r"(?:\b(?:nu|na|ah|unga|neenga|pannu|irukku|illa|illai|thaan|mattum|kooda|vaanga|"
    r"porom|sollu|aana|appo|seri|konjam|romba|innum|puriy|vendi|mudiy|"
    r"idhu|adhu|enna|eppo|naama|namma)\b)|[\u0B80-\u0BFF]",
    re.I,
)

WORKSPACE_TEXT_KEYS = {
    "explanation",
    "ren_correct",
    "ren_wrong",
    "ren_hint",
    "hint",
    "ava_feedback_correct",
    "ava_feedback_wrong",
    "feedback_correct",
    "feedback_wrong",
    "solution",
    "detailed_explanation",
    "coach_note",
    "arc_intro",
    "arc_outro",
}


def load_json(path: Path):
    raw = path.read_text(encoding="utf-8-sig")
    return json.loads(raw)


def dump_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def to_english(text: str) -> str:
    if not isinstance(text, str) or not text.strip():
        return text
    out = text
    # Apply phrase map longest-first (already ordered roughly)
    for src, dst in sorted(PHRASE_MAP, key=lambda x: len(x[0]), reverse=True):
        out = out.replace(src, dst)
    out = SCRIPT_RE.sub("", out)
    # Cleanup doubled spaces / odd punctuation from particle removal
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r" +([.,;:!?])", r"\1", out)
    out = re.sub(r"\s+\n", "\n", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    out = out.strip()
    # If still heavy Tanglish crumbs, soften common leftovers
    out = re.sub(r"\bna\b", "—", out, flags=re.I)
    out = re.sub(r"[ \t]{2,}", " ", out)
    return out.strip()


def convert_obj(obj, *, force_keys: set[str] | None = None, in_workspace_task=False):
    """Recursively convert Tanglish strings in workspace-oriented fields."""
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            key = str(k)
            if key in ("workspace_tasks", "tasks"):
                out[key] = [
                    convert_obj(item, force_keys=WORKSPACE_TEXT_KEYS, in_workspace_task=True)
                    if isinstance(item, (dict, list))
                    else item
                    for item in (v or [])
                ]
            elif in_workspace_task or (force_keys and key in force_keys):
                if isinstance(v, str) and TANGLISH_HINT.search(v):
                    out[key] = to_english(v)
                elif isinstance(v, (dict, list)):
                    out[key] = convert_obj(
                        v, force_keys=force_keys, in_workspace_task=in_workspace_task
                    )
                else:
                    out[key] = v
            elif isinstance(v, (dict, list)):
                out[key] = convert_obj(v, force_keys=force_keys, in_workspace_task=False)
            else:
                out[key] = v
        return out
    if isinstance(obj, list):
        return [
            convert_obj(x, force_keys=force_keys, in_workspace_task=in_workspace_task)
            for x in obj
        ]
    return obj


def english_stub(lesson_id: str) -> dict:
    return {
        "lesson_id": lesson_id,
        "language": "en",
        "status": "empty",
        "note": "Paste pure English lesson JSON from Nemotron here. Keep lesson_id unchanged.",
    }


def move_lessons_and_stubs(phase_dir: Path, session_glob: str) -> list[str]:
    """Move non-workspace lesson JSON into tanglish/; create english/ stubs."""
    moved = []
    for lesson_path in sorted(phase_dir.glob(session_glob)):
        if lesson_path.name.endswith("_workspace.json"):
            continue
        if "tanglish" in lesson_path.parts or "english" in lesson_path.parts:
            continue
        # e.g. building_basics/cs3/C3.1.json → building_basics/tanglish/cs3/C3.1.json
        rel = lesson_path.relative_to(phase_dir)  # cs3/C3.1.json
        tanglish_path = phase_dir / "tanglish" / rel
        english_path = phase_dir / "english" / rel
        if tanglish_path.exists() and not lesson_path.exists():
            # already moved
            pass
        elif lesson_path.exists():
            tanglish_path.parent.mkdir(parents=True, exist_ok=True)
            if tanglish_path.exists():
                lesson_path.unlink()
            else:
                shutil.move(str(lesson_path), str(tanglish_path))
            moved.append(str(rel))

        # Ensure language tag on tanglish lesson
        if tanglish_path.exists():
            data = load_json(tanglish_path)
            if isinstance(data, dict):
                data["language"] = "tanglish"
                dump_json(tanglish_path, data)
            lesson_id = (
                data.get("lesson_id")
                if isinstance(data, dict)
                else lesson_path.stem
            ) or lesson_path.stem
            if not english_path.exists():
                dump_json(english_path, english_stub(str(lesson_id)))
    return moved


def convert_workspaces(phase_dir: Path) -> int:
    n = 0
    for path in sorted(phase_dir.glob("**/cs*/*_workspace.json")):
        data = load_json(path)
        converted = convert_obj(data, force_keys=WORKSPACE_TEXT_KEYS, in_workspace_task=True)
        # Also top-level arc fields
        if isinstance(converted, dict):
            for k in ("arc_intro", "arc_outro", "explanation"):
                if isinstance(converted.get(k), str) and TANGLISH_HINT.search(converted[k]):
                    converted[k] = to_english(converted[k])
        dump_json(path, converted)
        n += 1
    return n


def convert_fresher_workspace_tasks(fresher_tanglish: Path) -> int:
    n = 0
    for path in sorted(fresher_tanglish.glob("**/*.json")):
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        if "workspace_tasks" not in data:
            continue
        data["workspace_tasks"] = convert_obj(
            data["workspace_tasks"],
            force_keys=WORKSPACE_TEXT_KEYS,
            in_workspace_task=True,
        )
        dump_json(path, data)
        n += 1
    return n


def process_tree(cloud_root: Path) -> None:
    if not cloud_root.exists():
        print("skip missing", cloud_root)
        return
    fresher = cloud_root / "fresher"
    bb = cloud_root / "building_basics"

    print("==", cloud_root)
    if fresher.exists():
        moved = move_lessons_and_stubs(fresher, "cs*/C*.json")
        # also transition assessment stays; don't move unless lesson-like
        print("fresher lessons -> tanglish:", len(moved))
        n = convert_fresher_workspace_tasks(fresher / "tanglish")
        print("fresher workspace_tasks -> english fields:", n)

    if bb.exists():
        moved = move_lessons_and_stubs(bb, "cs*/C*.json")
        print("building_basics lessons -> tanglish:", len(moved))
        n = convert_workspaces(bb)
        print("building_basics workspaces -> english:", n)


def main():
    process_tree(ROOT)
    if NESTED.exists() and NESTED != ROOT:
        process_tree(NESTED)
    print("done")


if __name__ == "__main__":
    main()
