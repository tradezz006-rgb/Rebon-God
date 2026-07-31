#!/usr/bin/env python3
"""
Convert workspace Tanglish (romanized + Tamil script) to pure English.
Re-runs over *_workspace.json and fresher tanglish workspace_tasks fields.
Does NOT rewrite lesson teaching content (only workspace-oriented keys).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOTS = [
    Path(r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud"),
    Path(r"d:\Rebon God\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud"),
]

# Longest-first phrase / word replacements
PHRASES = [
    # Multi-word first
    ("yaaru enna panninanu therila", "we cannot tell who did what"),
    ("enna panninanu therila", "we cannot tell who did what"),
    ("purinjikama edhaiyaum touch pannaadha", "do not touch anything without understanding it"),
    ("investigation oda first rule", "the first rule of investigation"),
    ("First thing check panna vendiya reason", "The reason to check this first"),
    ("single-line rule fix panna mudiyum", "a single-line rule can fix it"),
    ("single-line rule thaan biggest exposure kudukkum", "a single-line rule creates the biggest exposure"),
    ("default placeholder illa, active rule thaan", "is not a default placeholder — it is an active rule"),
    ("no exceptions, no default-safe assumption", "no exceptions, and no safe-by-default assumption"),
    ("read the rule literally", "read the rule literally"),
    ("wrong direction", "off track"),
    ("get started fast", "get started fast"),
    ("auto-created", "auto-created"),
    ("production-ku fit design pannthat", "that design was never meant for production"),
    ("yaaru-um andha decision eduthu irukkala", "nobody deliberately chose that"),
    ("that accident aayidichu", "it happened by accident"),
    ("This exactly FoodQuick-ku nadanthadhu", "This is exactly what happened at FoodQuick"),
    ("default VPC-oda convenience settings", "the default VPC convenience settings"),
    ("oru real production database-ku permanent home aayiduchu", "became a permanent home for a real production database"),
    ("Rendu vidhamana problem", "There are two kinds of problems"),
    ("ithu inniku narrow pannanum", "this must be narrowed today"),
    ("This fix pannrthat illa, ipo", "Fixing this is not the job right now"),
    ("adha correctly NOTICE pannrthat job", "the job is to correctly NOTICE it"),
    ("ellame puthu private IP kudukkum", "all of them get new private IPs"),
    ("Individual /32 rule vachaa", "If you use an individual /32 rule"),
    ("andha rule useless aayidum", "that rule becomes useless"),
    ("silent app break aagalam", "the app can break silently"),
    ("Ithukaaga namba", "That is why we"),
    ("that instances change aanaalum stable irukkum", "so it stays stable even when instances change"),
    ("ASG-oda IPs stable not — miss panniteenga", "You missed that ASG IPs are not stable"),
    ("next scale event-la that wrongly aayidum", "on the next scale event that rule becomes wrong"),
    ("/28 madhiri ultra-small size", "An ultra-small size like /28"),
    ("address space over aagidum", "address space will run out"),
    ("future growth-ku room illama poidum", "you end up with no room for future growth"),
    ("unnecessary over-provision", "unnecessary over-provisioning"),
    ("address planning complexity only add pannum", "only adds address-planning complexity"),
    ("real benefit illa", "with no real benefit"),
    ("namba wish did madhiri anytime freely resize to do mudiyathu", "you cannot freely resize it anytime the way you might wish"),
    ("associate cheyya kudiyathu overlapping secondary ranges add pannanum", "you would have to add non-overlapping secondary ranges"),
    ("that also messy", "and that is messy too"),
    ("mudhal future teams/environments varaikkum comfortable room kudukkum", "gives comfortable room from day one through future teams and environments"),
    ("without over-engineering", "without over-engineering"),
    ("'guess the exact number today' illa", "is not 'guess the exact number today'"),
    ("'leave comfortable room for years of growth'", "'leave comfortable room for years of growth'"),
    ("This real, common confusion", "This is a real, common confusion"),
    ("VPC oru 'global' resource — ninachikittu", "people think a VPC is a 'global' resource"),
    ("region maathi to use try pannuvanga", "and try to use it after changing region"),
    ("Aana VPC per-region", "But a VPC is per-region"),
    ("Route 53, IAM madhiri global illa", "unlike Route 53 or IAM, it is not global"),
    ("Every region-ku separate VPC design pannanum", "You must design a separate VPC for every region"),
    ("that idhu-oda real teaching moment", "and that is the real teaching moment here"),
    ("partial fix full fix — confuse pannaadhu", "do not confuse a partial fix with a full fix"),
    ("Inniku namba oru real, meaningful improvement pannirukkom", "Today we made one real, meaningful improvement"),
    ("but namba still solve pannadha rendu periya vishayam irukku", "but two big things we still have not solved remain"),
    ("adha clearly admit pannrthat honest engineering", "clearly admitting that is honest engineering"),
    ("growth room illama poidum", "you end up with no growth room"),
    ("exactly T7-la paatha mistake", "exactly the mistake we saw in T7"),
    ("already default VPC use pannis there", "the default VPC already uses"),
    ("puthu custom VPC-ku same range reuse pannina", "if the new custom VPC reuses the same range"),
    ("future-la rendu VPCs connect pannanum", "and later you need to connect the two VPCs"),
    ("vandha (peering/Transit Gateway), CIDR overlap irukkum", "CIDR overlap will block peering/Transit Gateway"),
    ("that blocker aayidum", "and that becomes a blocker"),
    ("oru option-eh not", "is not an option at all"),
    ("CIDR planning namba responsibility", "CIDR planning is our responsibility"),
    ("future connectivity options also already namba CIDR decision-la yosichitiya", "you already thought about future connectivity in the CIDR decision"),
    ("that real architecture thinking", "that is real architecture thinking"),
    ("CIDR choice a bit yosi", "Think a bit more about the CIDR choice"),
    ("namba already default VPC-oda range use pannirukkom", "we are already using the default VPC range"),
    ("adha reuse did future-la problem varum", "reusing it will cause problems later"),
    ("Small size-um growth block pannum", "A small size also blocks growth"),
    ("This absolute 'never' illa", "This is not an absolute 'never'"),
    ("but blind 'sure, no problem' um illa", "but it is also not a blind 'sure, no problem'"),
    ("solradhaale, security thinking off pannikkakoodathu", "just saying that does not mean you can turn security thinking off"),
    ("exactly andha assumption", "exactly that assumption"),
    ("ivlo naala loose SG-aa vachu vachudhu", "kept a loose SG for so many days"),
    ("Isolation-oda concept", "The isolation concept"),
    ("namba paatha DB-ku only illa", "is not only for the DB we saw"),
    ("edhavthat resource-ku-um apply pannanum", "it must apply to any resource"),
    ("oru resource-ku same careless default kudukka koodadhu", "you must not give the same careless default to any resource"),
    ("adhuve namba innaikku paatha real mistake", "that is exactly the real mistake we saw today"),
    ("Rendu extreme-um wrong", "Both extremes are wrong"),
    ("quick test-ku doesn't matter", "for a quick test it doesn't matter"),
    ("Balanced judgment thevai", "Balanced judgment is needed"),
    ("Correct report — specific irukkanum", "A correct report must be specific"),
    ("what fix pannomo, what still fix pannala", "what we fixed, and what we still have not fixed"),
    ("clearly sollanum", "must be stated clearly"),
    ("Priya explicit edhaiyum touch pannaadha — sonna", "Priya explicitly said not to touch anything"),
    ("adha respect pannrthat professional judgment-oda part", "respecting that is part of professional judgment"),
    ("investigation lead-oda instruction override pannama", "without overriding the investigation lead's instruction"),
    ("findings only report pannradhu", "only report the findings"),
    ("This report overclaim pannudhu", "This report overclaims"),
    ("illana authority illama oru decision", "or it makes a decision without authority"),
    ("mystery route delete panradhu", "deleting the mystery route"),
    ("eduthukittu irukku", "it has taken"),
    ("Rendu-um wrong", "Both are wrong"),
    ("Konjam off track", "A bit off track"),
    ("exactly what solrudhu", "exactly what it says"),
    ("precisely puriyanum", "must be understood precisely"),
    ("RDS-ku public IP illainaalum", "Even if RDS has no public IP"),
    ("subnet public if it was (that we still check pannala)", "and even if the subnet is public (which we still have not checked)"),
    ("this real exposure", "this is still a real exposure"),
    ("AWS oru 'get started fast' convenience kudukrthat", "AWS gives a 'get started fast' convenience"),
    ("Default VPC vera oru vazhi-la custom VPC-oda vera-eh not", "A default VPC is not just another flavor of a custom VPC"),
    ("ninachikitiya", "you thought"),
    ("Real difference enna-nnu", "The real difference is"),
    ("that production-ku design pannadhu, convenience-ku only", "one is designed for production; the other is convenience only"),
    # Common verbs / particles
    ("pannikkakoodathu", "must not"),
    ("pannaakoodathu", "must not"),
    ("panna koodathu", "must not"),
    ("koodathu", "must not"),
    ("koodadhu", "must not"),
    ("pannitanunga", "you all did"),
    ("panniteenga", "you did"),
    ("pannirukkom", "we have done"),
    ("pannirukom", "we have done"),
    ("pannirundha", "if we had done"),
    ("pannirukku", "has been done"),
    ("panniyachu", "is already done"),
    ("pannikittu", "while doing"),
    ("pannitu", "after doing"),
    ("pannitiya", "did you do"),
    ("pannomo", "we did"),
    ("pannathu", "what was done"),
    ("pannadha", "not done"),
    ("pannadhu", "did not do"),
    ("pannala", "did not do"),
    ("pannaadha", "do not"),
    ("pannaadhu", "do not do"),
    ("pannaathu", "do not do"),
    ("pannaamal", "without doing"),
    ("pannaamala", "without doing"),
    ("pannama", "without doing"),
    ("pannalum", "even if done"),
    ("pannalam", "we can do"),
    ("pannanum", "must do"),
    ("pannuvom", "we will do"),
    ("pannuvanga", "they will do"),
    ("pannradhukku", "for doing"),
    ("pannradhuku", "for doing"),
    ("pannradhala", "because of doing"),
    ("pannradhum", "doing also"),
    ("pannradhu", "doing"),
    ("pannrthat", "doing"),
    ("pannurathu", "doing"),
    ("pannuthu", "does"),
    ("pannudhu", "does"),
    ("pannum", "does"),
    ("pannina", "did"),
    ("pannu ", "do "),
    ("panna ", "to do "),
    ("kudukkardhu", "giving"),
    ("kudukkanum", "must give"),
    ("kudukkum", "gives"),
    ("kudukka ", "to give "),
    ("kudukrthat", "giving"),
    ("solradhukku", "for saying"),
    ("solradhum", "saying also"),
    ("solradhu", "says"),
    ("solrudhu", "says"),
    ("sollanum", "must say"),
    ("solli ", "saying "),
    ("sollu ", "say "),
    ("sonna,", "said,"),
    ("sonna ", "said "),
    ("puriyudhu", "is clear"),
    ("puriyanum", "must understand"),
    ("puriya ", "understand "),
    ("irundhadhu", "was there"),
    ("irundhalum", "even if"),
    ("irundha ", "if there was "),
    ("irukkanum", "must be"),
    ("irukkalam", "can be"),
    ("irukkura", "that is there"),
    ("irukkara", "that is there"),
    ("irukka ", "to be "),
    ("irukkum", "will be"),
    ("irukku", "is there"),
    ("irukkala", "is not there"),
    ("illainaalum", "even if not"),
    ("illaina", "if not"),
    ("illana ", "or "),
    ("illama ", "without "),
    ("illa ", "not "),
    ("illai ", "not "),
    ("mudiyathu", "cannot"),
    ("mudiyum", "can"),
    ("aayidichu", "happened"),
    ("aayiduchu", "became"),
    ("aayidum", "will become"),
    ("aagalam", "can happen"),
    ("aagidum", "will happen"),
    ("nadanthadhu", "happened"),
    ("ninachikittu", "thinking"),
    ("ninachikitiya", "you thought"),
    ("yosichitiya", "you thought"),
    ("yosi ", "think "),
    ("yosi.", "think."),
    ("munnadiye", "already earlier"),
    ("munnadi ", "earlier "),
    ("munnaadi ", "before "),
    ("apparam ", "after that "),
    ("ovvorukkum", "for each one"),
    ("ovvoru ", "each "),
    ("edhavthat", "any"),
    ("edhavudhu", "anything"),
    ("edhaiyaum", "anything"),
    ("edhaiyum", "anything"),
    ("eduthukittu", "taking"),
    ("eduthu ", "taken "),
    ("adhukkulla", "inside that"),
    ("adhukku ", "for that "),
    ("idhukku ", "for this "),
    ("andha ", "that "),
    ("Andha ", "That "),
    ("ithu ", "this "),
    ("Ithu ", "This "),
    ("idhu ", "this "),
    ("Idhu ", "This "),
    ("adhu ", "that "),
    ("Adhu ", "That "),
    ("adha ", "that "),
    ("enna-nnu", "what"),
    ("enna ", "what "),
    ("Enna ", "What "),
    ("eppoavume ", "always "),
    ("eppovume ", "always "),
    ("eppo ", "when "),
    ("yaaru-um", "nobody"),
    ("yaaru ", "who "),
    ("namba ", "we "),
    ("Namba ", "We "),
    ("naama ", "we "),
    ("namma ", "our "),
    ("ungalukku ", "for you "),
    ("unga ", "your "),
    ("neenga ", "you "),
    ("vaanga ", "come "),
    ("porom ", "let's go "),
    ("konjam ", "a bit "),
    ("Konjam ", "A bit "),
    ("romba ", "very "),
    ("mattum ", "only "),
    ("Mattum ", "Only "),
    ("kooda ", "also "),
    ("thevai", "needed"),
    ("vendiya ", "needed "),
    ("vendum ", "needed "),
    ("madhiri ", "like "),
    ("ellame ", "all "),
    ("puthu ", "new "),
    ("rendu-um", "both"),
    ("rendume", "both"),
    ("Rendu ", "Two "),
    ("rendu ", "two "),
    ("oru ", "a "),
    ("Oru ", "A "),
    ("vera ", "different "),
    ("Vera ", "Different "),
    ("vazhi-la", "way"),
    ("ipo,", "now,"),
    ("ipo ", "now "),
    ("innum ", "still "),
    ("innaikku ", "today "),
    ("Inniku ", "Today "),
    ("inniku ", "today "),
    ("aanaalum", "even then"),
    ("aanal ", "but "),
    ("aanaal ", "but "),
    ("aana ", "but "),
    ("Aana ", "But "),
    ("appo ", "then "),
    ("seri ", "okay "),
    ("sari ", "correct "),
    ("thaan ", ""),
    ("thaaan ", ""),
    ("thaan.", "."),
    ("thaan,", ","),
    ("nu na ", "means "),
    ("-nu ", " — "),
    (" nu ", " — "),
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
    ("loose SG-aa", "loose SG"),
    ("-ah ", " "),
    ("vandha ", "if it comes "),
    ("paatha ", "we saw "),
    ("vachaa,", "kept,"),
    ("vachaa ", "kept "),
    ("vachu vachudhu", "kept"),
    ("ivlo naala", "for so many days"),
    ("periya vishayam", "big issues"),
    ("vidhamana", "kinds of"),
    # Tamil script leftovers
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
    ("யாரு", "who"),
]

SCRIPT_RE = re.compile(r"[\u0B80-\u0BFF\u0400-\u04FF\u0900-\u097F]+")

# English noun + Tamil case ending
SUFFIX_RULES = [
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-ku\b", re.I), r"for \1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-oda\b", re.I), r"\1's"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-la\b", re.I), r"in \1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-aa\b", re.I), r"\1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-um\b", re.I), r"\1 also"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-eh\b", re.I), r"\1"),
    (re.compile(r"\b([A-Za-z0-9][\w./-]*)-nu\b", re.I), r"\1"),
]

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
    "title",
    "subtitle",
    "description",
    "prompt",
    "question",
    "scenario",
    "context",
    "brief",
    "summary",
}

# Residual Tanglish detector (avoid English false positives like "average", "coverage")
RESIDUAL = re.compile(
    r"(?:"
    r"\b(?:pann(?:anum|rthat|um|itu|radhu|udhu|uthu|ama|itiya|irukom|irukkom|athu|ala|"
    r"aadha|aakoodathu|alum|athu|aathu|adhu|uvom|ina|u)?|"
    r"irukk(?:u|um|anum|a|ura|ara|alam)?|illa(?:na|ma|i|inaalum)?|"
    r"kudukk(?:um|anum|ardhu|a)?|solr(?:adhu|udhu)|sollanum|"
    r"puriy(?:anum|udhu)|ninachi|yosi(?:chitiya)?|aayi(?:dum|dichu|duchu)|"
    r"nadanthadhu|madhiri|namba|andha|ithu|idhu|adhu|adha|yaaru|rendu(?:me)?|"
    r"ellame|puthu|thevai|vachaa|sonna|edhav|munnadi|apparam|konjam|romba|"
    r"unga|neenga|vaanga|mudiy(?:um|athu)|vendi(?:ya|um)?|seri|thaan|mattum|"
    r"kooda|koodathu|koodadhu|oru|ipo|enna|eppo|aana|appo|ovvoru|idhukku|"
    r"adhukku|vandha|paatha|ivlo)\b"
    r"|[\u0B80-\u0BFF]"
    r"|(?:\w+)-(?:ku|oda|la)\b"
    r")",
    re.I,
)


def to_english(text: str) -> str:
    if not isinstance(text, str) or not text.strip():
        return text
    out = text
    for src, dst in sorted(PHRASES, key=lambda x: len(x[0]), reverse=True):
        out = out.replace(src, dst)
    for cre, repl in SUFFIX_RULES:
        out = cre.sub(repl, out)
    out = SCRIPT_RE.sub("", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r" +([.,;:!?])", r"\1", out)
    out = re.sub(r"\s+\n", "\n", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    out = re.sub(r" ?— ?", " — ", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    return out.strip()


def convert_value(v):
    if isinstance(v, str):
        return to_english(v) if RESIDUAL.search(v) or SCRIPT_RE.search(v) else v
    if isinstance(v, dict):
        return convert_obj(v)
    if isinstance(v, list):
        return [convert_value(x) for x in v]
    return v


def convert_obj(obj, in_ws: bool = False):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in ("tasks", "workspace_tasks"):
                out[k] = convert_obj(v, in_ws=True) if not isinstance(v, list) else [
                    convert_obj(i, in_ws=True) if isinstance(i, dict) else convert_value(i)
                    for i in v
                ]
            elif in_ws or k in WORKSPACE_TEXT_KEYS:
                if isinstance(v, str):
                    out[k] = to_english(v) if RESIDUAL.search(v) or SCRIPT_RE.search(v) else v
                elif isinstance(v, (dict, list)):
                    out[k] = convert_obj(v, in_ws=True)
                else:
                    out[k] = v
            elif isinstance(v, (dict, list)):
                out[k] = convert_obj(v, in_ws=False)
            else:
                out[k] = v
        return out
    if isinstance(obj, list):
        return [convert_obj(x, in_ws=in_ws) for x in obj]
    return obj


def dump(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def count_residual(obj, in_ws: bool = False) -> int:
    n = 0
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("tasks", "workspace_tasks"):
                n += count_residual(v, True)
            elif in_ws or k in WORKSPACE_TEXT_KEYS:
                if isinstance(v, str) and RESIDUAL.search(v):
                    n += 1
                else:
                    n += count_residual(v, in_ws)
            else:
                n += count_residual(v, False)
    elif isinstance(obj, list):
        for x in obj:
            n += count_residual(x, in_ws)
    return n


def process_root(root: Path) -> None:
    if not root.exists():
        print("skip", root)
        return
    print("==", root)
    changed = 0
    residual_before = 0
    residual_after = 0

    ws_paths = list((root / "building_basics").glob("cs*/*_workspace.json"))
    for path in sorted(ws_paths):
        data = json.loads(path.read_text(encoding="utf-8"))
        residual_before += count_residual(data, True)
        converted = convert_obj(data, in_ws=True)
        # top-level arc fields
        if isinstance(converted, dict):
            for k in WORKSPACE_TEXT_KEYS:
                if isinstance(converted.get(k), str) and RESIDUAL.search(converted[k]):
                    converted[k] = to_english(converted[k])
        residual_after += count_residual(converted, True)
        dump(path, converted)
        changed += 1

    # Fresher: convert only workspace_tasks inside tanglish lessons
    for path in sorted((root / "fresher" / "tanglish").rglob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or "workspace_tasks" not in data:
            continue
        residual_before += count_residual({"workspace_tasks": data["workspace_tasks"]}, True)
        data["workspace_tasks"] = convert_obj(data["workspace_tasks"], in_ws=True)
        residual_after += count_residual({"workspace_tasks": data["workspace_tasks"]}, True)
        dump(path, data)
        changed += 1

    print(f"files written: {changed}")
    print(f"residual string hits: {residual_before} -> {residual_after}")


def main():
    for root in ROOTS:
        process_root(root)
    print("done")


if __name__ == "__main__":
    main()
