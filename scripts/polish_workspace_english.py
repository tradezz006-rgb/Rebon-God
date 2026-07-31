#!/usr/bin/env python3
"""Aggressive polish pass: remaining Tanglish tokens + mangled English cleanup."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOTS = [
    Path(r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud"),
    Path(r"d:\Rebon God\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud"),
]

# Longest first
FIXES = [
    # Mangled constructions from earlier pass
    ("for doing munnadi", "first"),
    ("after doing must be", "must be done after"),
    ("remove for doing", "remove first"),
    ("verify after doing", "verify after applying"),
    ("Only illa,", "Not only that —"),
    ("Only illa", "Not only that"),
    ("Correct-u!", "Correct!"),
    ("Semma —", "Nice —"),
    ("Semma ", "Nice "),
    ("app break aagum", "the app will break"),
    ("break aagum", "will break"),
    ("rendu-kum", "both need"),
    ("pechanaumaaa", "reachability"),
    ("poganum", "must go"),
    ("decide panrthat", "deciding"),
    ("important irukka", "whether it is important"),
    ("mukkiya-ma", "mainly"),
    ("mukkiyam", "is important"),
    ("two vidhama", "two kinds"),
    ("concept-ae exist did not do", "the concept did not even exist"),
    ("nadakkatha breach nadanththat like overclaim must not", "do not overclaim a breach that did not happen"),
    ("real risk enna-m", "what the real risk is"),
    ("minimum 2 AZs venum", "needs a minimum of 2 AZs"),
    ("ippo Multi-AZ ON did not do-nnu kooda", "even if Multi-AZ is not ON right now"),
    ("pathi illa", "is not about"),
    ("pathi.", "about."),
    ("to do mudiyadha", "could not be done"),
    ("without doing pona", "and you went ahead without"),
    ("idhu-like conflict varum", "conflicts like this will appear"),
    ("nenac", "thought"),
    ("fix-e without irundhthat mari", "worse than having no fix"),
    ("remove without doing new rule add did", "removed the old rule without adding the new one"),
    ("what exact maathinom", "exactly what we changed"),
    ("clearly solanum", "must be stated clearly"),
    ("respect pan", "respect"),
    ("delete panrthat madhiri", "like deleting"),
    ("evlo AZ is there", "no matter how many AZs exist"),
    ("depend does", "depends"),
    ("guarantee illa", "is not guaranteed"),
    ("mauzhauchaaa down aana", "goes fully down"),
    ("EVERYTHIN", "EVERYTHING"),
    ("cost gimmick illa", "not a cost gimmick"),
    ("miss did you do", "you missed"),
    ("edhuvum maathanum vendam", "nothing needs to be changed"),
    ("continue work does", "keeps working"),
    ("oda power idhu", "power is this"),
    ("automatic nadakkum", "happens automatically"),
    ("pannomaate", "must not"),
    ("for failover mattum", "only for failover"),
    ("um 'comfortably survives' um", "and 'comfortably survives' are"),
    ("down aana,", "goes down,"),
    ("Edhuvum explicit open without doing poana", "If you do not explicitly open anything"),
    ("veliyila irundhu edhuvum for this reach to do cannot", "nothing from outside can reach into it"),
    ("VPC boundary itself a default-deny wall", "the VPC boundary itself is a default-deny wall"),
    ("problem paakrfor that foundation", "problem — keep that foundation in mind"),
    ("also idhe rule follow must do", "must also follow this same rule"),
    ("but we paakkalet's go that", "but we will look at that next"),
    ("match aana,", "may match,"),
    ("small for footprint", "small footprint"),
    # Remaining particles / words
    ("edhuvum ", "anything "),
    ("Edhuvum ", "Anything "),
    ("veliyila ", "from outside "),
    ("poana,", "went,"),
    ("poana ", "went "),
    ("idhe ", "this "),
    ("paakra ", "looking at "),
    ("paakum ", "will see "),
    ("paatha ", "we saw "),
    ("paakkal", "let us look"),
    ("venum", "is needed"),
    ("vendam", "is not needed"),
    ("varum", "will come"),
    ("nadakkum", "happens"),
    ("nadakka", "to happen"),
    ("maathinom", "we changed"),
    ("maathanum", "must change"),
    ("maathi ", "change "),
    ("solanum", "must say"),
    ("pannomaate", "must not do"),
    ("panrthat", "doing"),
    ("pannu ", "do "),
    ("irukka ", "is "),
    ("irukk ", "is "),
    ("illa ", "not "),
    ("illai ", "not "),
    ("illama ", "without "),
    ("illana ", "or "),
    ("mattum ", "only "),
    ("mattum.", "only."),
    ("aana ", "but "),
    ("aana,", "but,"),
    ("munnadi ", "earlier "),
    ("madhiri ", "like "),
    ("madhiri)", "like)"),
    ("rendume ", "both "),
    ("rendu ", "two "),
    ("kooda ", "also "),
    ("kooda.", "also."),
    ("idhukku ", "for this "),
    ("idhu ", "this "),
    ("Idhu ", "This "),
    ("adha ", "that "),
    ("oru ", "a "),
    ("enna ", "what "),
    ("thaan ", ""),
    ("thaan.", "."),
    ("ellame ", "all "),
    ("puthu ", "new "),
    ("konjam ", "a bit "),
    ("ipo ", "now "),
    ("yaaru ", "who "),
    ("vandha ", "if it comes "),
    ("aagum", "will happen"),
    ("Semma", "Nice"),
    ("Correct-u", "Correct"),
    ("mukkiya", "important"),
    ("vidhama", "kinds"),
    ("pathi ", "about "),
    ("nenacha", "thought"),
    ("nenachu", "thought"),
    ("vishayam", "topic"),
    ("evlo ", "how much "),
]

SUFFIX = [
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-ku\b", re.I), r"for \1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-oda\b", re.I), r"\1's"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-la\b", re.I), r"in \1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-aa\b", re.I), r"\1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-um\b", re.I), r"\1 also"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-eh\b", re.I), r"\1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-ae\b", re.I), r"\1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-nu\b", re.I), r"\1"),
]

SCRIPT_RE = re.compile(r"[\u0B80-\u0BFF\u0400-\u04FF\u0900-\u097F]+")

# Broad residual detector for reporting / deciding to polish
HINT = re.compile(
    r"(?:"
    r"\b(?:pann|irukk|illa|kudu|soll|puri|ninach|aayi|nadan|madhir|namba|andha|"
    r"ithu|idhu|adhu|adha|yaaru|rendu|ellam|puthu|thevai|yosi|vacha|sonn|edha|"
    r"edhuvum|veliyila|poana|munnadi|apparam|konjam|romba|unga|neenga|vaanga|"
    r"mudiy|vendi|venum|vendam|seri|thaan|mattum|kooda|oru|ipo|enna|eppo|aana|"
    r"appo|ovvoru|idhukku|adhukku|vandha|paatha|paakr|paakkal|ivlo|evlo|"
    r"mukkiya|vidhama|pathi|maath|solan|nenac|vishayam|semma|aagum|panrthat|"
    r"pannomaate|nadakk)\w*\b"
    r"|[\u0B80-\u0BFF]"
    r"|(?:\w+)-(?:ku|oda|la|aa|ae|eh|nu)\b"
    r")",
    re.I,
)

KEYS = {
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


def polish(text: str) -> str:
    if not isinstance(text, str) or not text.strip():
        return text
    out = text
    for src, dst in sorted(FIXES, key=lambda x: len(x[0]), reverse=True):
        out = out.replace(src, dst)
    for cre, repl in SUFFIX:
        out = cre.sub(repl, out)
    out = SCRIPT_RE.sub("", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r" +([.,;:!?])", r"\1", out)
    out = re.sub(r"\s+\n", "\n", out)
    out = re.sub(r" ?— ?", " — ", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    return out.strip()


def walk(obj, in_ws: bool = False):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in ("tasks", "workspace_tasks"):
                out[k] = walk(v, True)
            elif in_ws or k in KEYS:
                if isinstance(v, str) and HINT.search(v):
                    out[k] = polish(v)
                elif isinstance(v, (dict, list)):
                    out[k] = walk(v, True)
                else:
                    out[k] = v
            elif isinstance(v, (dict, list)):
                out[k] = walk(v, False)
            else:
                out[k] = v
        return out
    if isinstance(obj, list):
        return [walk(x, in_ws) for x in obj]
    return obj


def count_hits(obj, in_ws: bool = False) -> int:
    n = 0
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("tasks", "workspace_tasks"):
                n += count_hits(v, True)
            elif in_ws or k in KEYS:
                if isinstance(v, str) and HINT.search(v):
                    n += 1
                else:
                    n += count_hits(v, in_ws)
            else:
                n += count_hits(v, False)
    elif isinstance(obj, list):
        for x in obj:
            n += count_hits(x, in_ws)
    return n


def process(root: Path) -> None:
    if not root.exists():
        return
    print("==", root)
    before = after = files = 0
    paths = list((root / "building_basics").glob("cs*/*_workspace.json"))
    paths += list((root / "fresher" / "tanglish").rglob("*.json"))
    for path in sorted(paths):
        data = json.loads(path.read_text(encoding="utf-8"))
        # fresher: only polish workspace_tasks
        if "fresher" in path.parts and "tanglish" in path.parts:
            if not isinstance(data, dict) or "workspace_tasks" not in data:
                continue
            before += count_hits({"workspace_tasks": data["workspace_tasks"]}, True)
            data["workspace_tasks"] = walk(data["workspace_tasks"], True)
            after += count_hits({"workspace_tasks": data["workspace_tasks"]}, True)
        else:
            before += count_hits(data, True)
            data = walk(data, True)
            after += count_hits(data, True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        files += 1
    print(f"files={files} residual hits {before} -> {after}")


def main():
    for r in ROOTS:
        process(r)


if __name__ == "__main__":
    main()
