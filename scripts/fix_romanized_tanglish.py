"""
Clean mixed Tamil/Cyrillic characters out of romanized Tanglish
in Building Basics workspace JSON (CS3 all + C4.1 + C4.2a).
"""
from __future__ import annotations

import glob
import json
import os
import re
import shutil

ROOTS = [
    r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud\building_basics",
    r"d:\Rebon God\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud\building_basics",
]

PHRASES = [
    ("ஒரே நேரத்தில்", "ore neraththil"),
    ("ஒரே", "ore"),
    ("நேரத்தில்", "neraththil"),
    ("மட்டும்", "mattum"),
    ("முதலில்", "mudhalil"),
    ("கூட", "kooda"),
    ("ஓட", "oda"),
    ("ஒரு", "oru"),
    ("ஆடு", "oda"),
    ("தான்", "thaan"),
    ("போரோம்", "porom"),
    ("வாங்க", "vaanga"),
    ("லேயும்", "leyum"),
    ("லும்", "lum"),
    ("க்கு", "kku"),
    ("கு", "ku"),
    ("ஆ", "aa"),
    ("ம்", "m"),
]

CHAR_MAP = [
    ("ும்", "um"),
    ("ாmal", "aamal"),
    ("ாthu", "aathu"),
    ("ாth", "aath"),
    ("ாtthu", "aatthu"),
    ("ா", "aa"),
    ("ே", "e"),
    ("ீ", "ii"),
    ("ி", "i"),
    ("ொ", "o"),
    ("ோ", "o"),
    ("ௌ", "au"),
    ("ை", "ai"),
    ("ூ", "oo"),
    ("ு", "u"),
    ("்", ""),
    ("ல", "la"),
    ("ஐ", "ai"),
    ("உ", "u"),
    ("அ", "a"),
    ("இ", "i"),
    ("எ", "e"),
    ("ஏ", "e"),
    ("ஓ", "o"),
    ("ஔ", "au"),
    ("க", "ka"),
    ("ங", "nga"),
    ("ச", "cha"),
    ("ஞ", "nja"),
    ("ட", "da"),
    ("ண", "na"),
    ("த", "tha"),
    ("ந", "na"),
    ("ப", "pa"),
    ("ம", "ma"),
    ("ய", "ya"),
    ("ர", "ra"),
    ("வ", "va"),
    ("ழ", "zha"),
    ("ள", "la"),
    ("ற", "ra"),
    ("ன", "na"),
    ("ஜ", "ja"),
    ("ஷ", "sha"),
    ("ஸ", "sa"),
    ("ஹ", "ha"),
    ("ु", "u"),
    ("्", ""),
]

CYR = {
    "\u0430": "a",
    "\u0410": "A",
    "\u0435": "e",
    "\u0415": "E",
    "\u043e": "o",
    "\u041e": "O",
    "\u0440": "p",
    "\u0441": "c",
    "\u0445": "x",
    "\u0456": "i",
    "\u043c": "m",
    "\u041c": "M",
    "\u043d": "n",
    "\u041d": "N",
    "\u0442": "t",
    "\u0422": "T",
    "\u043a": "k",
    "\u041a": "K",
    "\u0432": "v",
    "\u0443": "u",
    "\u044c": "",
    "\u044a": "",
    "\u0451": "e",
}

FIXES = [
    ("edhavудு", "edhavudhu"),
    ("edhavudhு", "edhavudhu"),
    ("edhுவும்", "edhuvum"),
    ("edhு", "edhu"),
    ("adhு", "adhu"),
    ("adhை", "adhai"),
    ("adhே", "adhe"),
    ("Idhு", "Idhu"),
    ("idhு", "idhu"),
    ("idhை", "idhai"),
    ("pannும்", "pannum"),
    ("pannாmal", "pannaamal"),
    ("pannாthu", "pannaathu"),
    ("pannாthு", "pannaathu"),
    ("pannама", "pannama"),
    ("pannити", "panniti"),
    ("pannித", "pannitha"),
    ("pannிட", "pannida"),
    ("kudukkும்", "kudukkum"),
    ("irukkும்", "irukkum"),
    ("irukkanum்", "irukkanum"),
    ("podanum்", "podanum"),
    ("pannalam்", "pannalam"),
    ("vendam்", "vendam"),
    ("pannanum்", "pannanum"),
    ("pannalum்", "pannalum"),
    ("mattum்", "mattum"),
    ("podum்", "podum"),
    ("venum்", "venum"),
    ("therியanum்", "theriyanum"),
    ("mudியாtthு", "mudiyaathu"),
    ("mudியும்", "mudiyum"),
    ("kண்டுபிடிக்காtthu", "kandupidikkaathu"),
    ("kaatுthு", "kaatuthu"),
    ("ninaikkardhு", "ninaikkardhu"),
    ("kudுthu", "kuduthu"),
    ("thேrndhu", "therndhu"),
    ("podுthu", "poduthu"),
    ("adhுku", "adhuku"),
    ("panniyachu்", "panniyachu"),
    ("pannradhு", "pannradhu"),
    ("pannுrathு", "pannurathu"),
    ("pannுthு", "pannuthu"),
    ("pannுthu", "pannuthu"),
    ("Mூnu", "Moonu"),
    ("mூnu", "moonu"),
    ("Ovvoruthukும்", "Ovvoruthukkum"),
    ("rendு", "rendu"),
    ("kூட", "kooda"),
    ("paakkapபோரோம்", "paakkaporom"),
    ("next-ல", "next-la"),
    ("app-ல", "app-la"),
    ("SG-ல", "SG-la"),
    ("zone-ல", "zone-la"),
    ("zone-ஓட", "zone-oda"),
    ("engineering-ல", "engineering-la"),
    ("registrar-ல", "registrar-la"),
    ("apex-ல", "apex-la"),
    ("name-ல", "name-la"),
    ("connection-ல", "connection-la"),
    ("subnet-ல", "subnet-la"),
    ("T1-ல", "T1-la"),
    ("T6-ல", "T6-la"),
    ("side-ல", "side-la"),
    ("side-லும்", "side-lum"),
    ("table-ல", "table-la"),
    ("jobs-ல", "jobs-la"),
    ("wizard-ல", "wizard-la"),
    ("time-லேயே", "time-leye"),
    ("VPCs-லேயும்", "VPCs-leyum"),
    ("TGW-கு", "TGW-ku"),
    ("A-க்கு", "A-kku"),
    ("C-ஐ", "C-ai"),
    ("app-ஐ", "app-ai"),
    ("PROCESS-ஐ", "PROCESS-ai"),
    ("ticket-ஐ", "ticket-ai"),
    ("WHY-ஐ", "WHY-ai"),
    ("Peering-ஐ", "Peering-ai"),
    ("internet-ஐ", "internet-ai"),
    ("B mூலமா", "B moolama"),
    ("ignore pannிது", "ignore panniduchu"),
    ("delete pannிதொ", "delete panniduchu"),
    ("miss aagிடும்", "miss aagidum"),
    ("jump pannிடாதே", "jump pannidaathe"),
    ("fix pannிடனum்", "fix pannidanum"),
    ("plan pannிதிya", "plan pannitiya"),
    ("munnadியே", "munnadiye"),
    ("munnadிyE", "munnadiye"),
    ("current state mattум்", "current state mattum"),
    ("paakradhु", "paakradhu"),
    ("yosikkardhु", "yosikkardhu"),
    ("explain pannанум்", "explain pannanum"),
    ("cleanup pannомо", "cleanup pannomo"),
    ("enna pannомо", "enna pannomo"),
    ("incomplete-ஆ", "incomplete-aa"),
    ("proof-ஆ", "proof-aa"),
    ("update pannама", "update pannama"),
    ("velai pannathு", "velai pannathu"),
    ("velai pannум்", "velai pannum"),
    ("velai pannும்", "velai pannum"),
    ("therியாthு", "theriyaathu"),
    ("irundhalும்", "irundhalum"),
    ("mattும்", "mattum"),
    ("late aagிடும்", "late aagidum"),
    ("fit aagாthு", "fit aagaathu"),
    ("aganum்", "aganum"),
    ("thேvaipadும்", "thevaipadum"),
    ("cover pannுthு", "cover pannuthu"),
    ("decisions-ஐ-um", "decisions-ai-um"),
    ("survive aganum்", "survive aganum"),
    ("adhு ", "adhu "),
    ("Idhு ", "Idhu "),
    ("idhு ", "idhu "),
]

TEXT_KEYS = {
    "explanation",
    "ren_correct",
    "ren_wrong",
    "ava_feedback_correct",
    "ava_feedback_wrong",
    "diagnosis",
    "fix",
    "solution",
    "what_happened",
    "the_real_problem",
    "lesson",
    "scenario",
    "question",
    "broken_config",
    "correct_fix",
    "error_shown",
}

INDIC_CYR = re.compile(r"[\u0900-\u0D7F\u0400-\u04FF]")


def fix_text(s: str) -> str:
    out = s
    for a, b in FIXES:
        out = out.replace(a, b)
    for a, b in PHRASES:
        out = out.replace(a, b)
    for a, b in CHAR_MAP:
        out = out.replace(a, b)
    for a, b in CYR.items():
        out = out.replace(a, b)
    out = re.sub(r" {2,}", " ", out)
    keep = set("—–…‘’“”₹°")
    cleaned: list[str] = []
    for ch in out:
        o = ord(ch)
        if ch in keep or o < 128:
            cleaned.append(ch)
        elif 0x0900 <= o <= 0x0D7F:
            continue
        elif 0x0400 <= o <= 0x04FF:
            continue
        else:
            cleaned.append(ch)
    return "".join(cleaned)


def walk(obj):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in TEXT_KEYS or (isinstance(v, str) and INDIC_CYR.search(v)):
                out[k] = fix_text(v) if isinstance(v, str) else walk(v)
            else:
                out[k] = walk(v)
        return out
    if isinstance(obj, list):
        return [walk(x) for x in obj]
    if isinstance(obj, str) and INDIC_CYR.search(obj):
        return fix_text(obj)
    return obj


def collect_targets() -> list[str]:
    patterns: list[str] = []
    for root in ROOTS:
        for session in ("cs3", "cs4", "cs5", "cs6", "cs7"):
            patterns += glob.glob(os.path.join(root, session, "*_workspace.json"))
    seen: set[str] = set()
    uniq: list[str] = []
    for t in patterns:
        rp = os.path.normcase(os.path.abspath(t))
        if rp in seen:
            continue
        seen.add(rp)
        if not os.path.exists(t) or os.path.getsize(t) < 20:
            print("skip empty", t)
            continue
        uniq.append(t)
    return uniq


def main() -> None:
    targets = collect_targets()
    print("TARGET COUNT", len(targets))
    for fp in targets:
        with open(fp, encoding="utf-8") as f:
            raw = f.read()
        try:
            data = json.loads(raw)
        except Exception as e:
            print("SKIP bad json", fp, e)
            continue
        before = len(re.findall(r"[\u0900-\u0D7F\u0400-\u04FF]+", raw))
        fixed = walk(data)
        new = json.dumps(fixed, ensure_ascii=False, indent=4)
        if not new.endswith("\n"):
            new += "\n"
        after = len(re.findall(r"[\u0900-\u0D7F\u0400-\u04FF]+", new))
        with open(fp, "w", encoding="utf-8", newline="\n") as f:
            f.write(new)
        print(
            f"fixed {os.path.basename(fp)} leftover {before}->{after} "
            f"size {os.path.getsize(fp)}"
        )

    # Keep nested + primary in sync for cleaned workspaces
    primary = ROOTS[0]
    nested = ROOTS[1]
    for session in ("cs3", "cs4", "cs5", "cs6", "cs7"):
        for fp in glob.glob(os.path.join(primary, session, "*_workspace.json")):
            dest = os.path.join(nested, session, os.path.basename(fp))
            if os.path.getsize(fp) > 20:
                shutil.copy2(fp, dest)
    print("done")


if __name__ == "__main__":
    main()
