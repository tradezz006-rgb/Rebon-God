#!/usr/bin/env python3
"""Final scrub: word-boundary Tanglish token wipe + light grammar tidy."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOTS = [
    Path(r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud"),
    Path(r"d:\Rebon God\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud"),
]

# Whole-word / phrase replacements (applied longest-first as plain replace for multi-word,
# then regex word-boundary for singles)
PHRASES = [
    ("thirumba think", "think again"),
    ("a bit thirumba", "again a bit"),
    ("guess pannamust not", "must not guess"),
    ("change panna,", "change,"),
    ("order change panna", "change the order"),
    ("appuram old rule", "then the old rule"),
    ("future growth block pannidum", "blocks future growth"),
    ("Sweet spot thedanum", "Find the sweet spot"),
    ("Adhuve default state", "That is the default state"),
    ("adhuve ", "that itself "),
    ("aanaaalum", "even then"),
    ("pathila ", "instead of "),
    ("yosichuteenga", "you thought"),
    ("yosichitu", "thinking"),
    ("paakrthat", "looking at"),
    ("irukkardhala", "because it is there"),
    ("irukkardhu", "being there"),
    ("pannirukkanu", "must have done"),
    ("pannradhukku", "in order to do"),
    ("pannaathe", "do not do"),
    ("pannudha", "doing"),
    ("pannitten", "I did"),
    ("pannichu", "having done"),
    ("pannidum", "will do"),
    ("pannura", "doing"),
    ("pannif ", "if done "),
    ("pannamust", "must"),
    ("munnadiye", "already earlier"),
    ("mukkiyama", "importantly"),
    ("idhuku ", "for this "),
    ("idhukku ", "for this "),
    ("adhukakae", "for that reason"),
    ("rendume ", "both "),
    ("ellame ", "everything "),
    ("illama ", "without "),
    ("illana ", "or else "),
    ("illai ", "not "),
    ("illa ", "not "),
    ("mattum ", "only "),
    ("mattum.", "only."),
    ("munnadi ", "first "),
    ("madhiri ", "like "),
    ("kooda ", "also "),
    ("rendu ", "two "),
    ("thaan ", ""),
    ("thaan.", "."),
    ("oru ", "a "),
    ("panni ", "done "),
    ("panna ", "to do "),
    ("pannu ", "do "),
    ("irukka ", "is "),
]

WORD_MAP = {
    "illa": "not",
    "illai": "not",
    "illama": "without",
    "illana": "or",
    "mattum": "only",
    "munnadi": "first",
    "munnadiye": "already",
    "madhiri": "like",
    "rendu": "two",
    "rendume": "both",
    "kooda": "also",
    "oru": "a",
    "idhu": "this",
    "adhu": "that",
    "adha": "that",
    "andha": "that",
    "ithu": "this",
    "enna": "what",
    "eppo": "when",
    "aana": "but",
    "appo": "then",
    "ipo": "now",
    "konjam": "a bit",
    "romba": "very",
    "namba": "we",
    "yaaru": "who",
    "puthu": "new",
    "ellame": "everything",
    "thevai": "needed",
    "venum": "needed",
    "vendam": "not needed",
    "thaan": "",
    "semma": "great",
    "thirumba": "again",
    "appuram": "then",
    "thedanum": "must find",
    "adhuve": "that itself",
    "pathila": "instead",
    "mukkiyama": "importantly",
    "idhuku": "for this",
    "idhukku": "for this",
    "yosichitu": "thinking",
    "yosichuteenga": "you thought",
    "paakrthat": "looking",
    "pannu": "do",
    "panna": "do",
    "panni": "done",
    "pannura": "doing",
    "pannidum": "will do",
    "pannichu": "done",
    "pannitten": "did",
    "pannudha": "doing",
    "pannaathe": "do not",
    "pannamust": "must",
    "irukka": "is",
    "irukkardhu": "exists",
    "irukkardhala": "because it exists",
    "aagum": "will happen",
    "varum": "will come",
    "nadakkum": "happens",
    "solanum": "must state",
    "maathinom": "we changed",
    "vishayam": "topic",
    "evlo": "how much",
    "edhuvum": "anything",
    "veliyila": "outside",
    "poana": "went",
    "panrthat": "doing",
    "pannradhukku": "to do",
    "pannirukkanu": "must have done",
    "adhukakae": "for that",
    "aanaaalum": "even then",
}

SUFFIX = [
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-ku\b", re.I), r"for \1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-oda\b", re.I), r"\1's"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-la\b", re.I), r"in \1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-aa\b", re.I), r"\1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-ae\b", re.I), r"\1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-eh\b", re.I), r"\1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-nu\b", re.I), r"\1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-um\b", re.I), r"\1 also"),
]

SCRIPT_RE = re.compile(r"[\u0B80-\u0BFF\u0400-\u04FF\u0900-\u097F]+")

HINT = re.compile(
    r"(?:"
    + r"|".join(rf"\b{re.escape(w)}\b" for w in sorted(WORD_MAP, key=len, reverse=True))
    + r"|[\u0B80-\u0BFF]"
    + r"|(?:\w+)-(?:ku|oda|la|aa|ae|eh|nu)\b"
    + r"|\b(?:pann|irukk|yosi|paakr|maath|solr|puriy|nadak|nenac|vidham|mukkiy)\w*\b"
    + r")",
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


def scrub(text: str) -> str:
    out = text
    for src, dst in sorted(PHRASES, key=lambda x: len(x[0]), reverse=True):
        out = out.replace(src, dst)
    for cre, repl in SUFFIX:
        out = cre.sub(repl, out)
    # word map
    def repl_word(m: re.Match) -> str:
        w = m.group(0)
        mapped = WORD_MAP.get(w.lower())
        if mapped is None:
            return w
        if not mapped:
            return ""
        if w[0].isupper():
            return mapped[:1].upper() + mapped[1:]
        return mapped

    pattern = re.compile(
        r"\b(" + "|".join(re.escape(w) for w in sorted(WORD_MAP, key=len, reverse=True)) + r")\b",
        re.I,
    )
    out = pattern.sub(repl_word, out)
    # leftover verb stems starting with pann/irukk/yosi etc.
    out = re.sub(r"\bpann\w*\b", "do", out, flags=re.I)
    out = re.sub(r"\birukk\w*\b", "is", out, flags=re.I)
    out = re.sub(r"\byosi\w*\b", "think", out, flags=re.I)
    out = re.sub(r"\bpaakr\w*\b", "looking", out, flags=re.I)
    out = re.sub(r"\bmaath\w*\b", "change", out, flags=re.I)
    out = re.sub(r"\bsol(?:r|anum|li|lu)\w*\b", "say", out, flags=re.I)
    out = re.sub(r"\bpuriy\w*\b", "understand", out, flags=re.I)
    out = re.sub(r"\bnadak\w*\b", "happen", out, flags=re.I)
    out = SCRIPT_RE.sub("", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r" +([.,;:!?])", r"\1", out)
    out = re.sub(r"\s+—\s+", " — ", out)
    out = re.sub(r"\bdo do\b", "do", out, flags=re.I)
    out = re.sub(r"\bis is\b", "is", out, flags=re.I)
    out = re.sub(r"\bnot not\b", "not", out, flags=re.I)
    return out.strip()


def walk(obj, in_ws: bool = False):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in ("tasks", "workspace_tasks"):
                out[k] = walk(v, True)
            elif in_ws or k in KEYS:
                if isinstance(v, str) and HINT.search(v):
                    out[k] = scrub(v)
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
    before = after = 0
    paths = list((root / "building_basics").glob("cs*/*_workspace.json"))
    for path in sorted((root / "fresher" / "tanglish").rglob("*.json")):
        paths.append(path)
    for path in sorted(set(paths)):
        data = json.loads(path.read_text(encoding="utf-8"))
        if "fresher" in path.parts and "tanglish" in path.parts:
            if not isinstance(data, dict) or "workspace_tasks" not in data:
                continue
            wrap = {"workspace_tasks": data["workspace_tasks"]}
            before += count_hits(wrap, True)
            data["workspace_tasks"] = walk(data["workspace_tasks"], True)
            after += count_hits({"workspace_tasks": data["workspace_tasks"]}, True)
        else:
            before += count_hits(data, True)
            data = walk(data, True)
            after += count_hits(data, True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"residual string hits: {before} -> {after}")


def main():
    for r in ROOTS:
        process(r)
    # sample
    p = ROOTS[0] / "building_basics" / "cs3" / "C3.1_workspace.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    print("SAMPLE T1 expl:", d["tasks"][0]["explanation"][:220])
    print("SAMPLE T2 expl:", d["tasks"][1]["explanation"][:220])


if __name__ == "__main__":
    main()
