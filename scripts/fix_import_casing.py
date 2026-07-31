#!/usr/bin/env python3
"""Rename source files so on-disk casing matches import paths (Linux/Vercel)."""
from __future__ import annotations

import re
import subprocess
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main")
SRC = ROOT / "src"

IMP_RE = re.compile(r"""from\s+['"](@/[^'"]+|\.\.?/[^'"]+)['"]""")


def git_mv(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    # two-step for Windows case-only renames
    if src.resolve() == dest.resolve() or str(src).lower() == str(dest).lower():
        tmp = src.with_name(src.name + ".__tmp__")
        subprocess.check_call(["git", "mv", str(src), str(tmp)], cwd=ROOT)
        subprocess.check_call(["git", "mv", str(tmp), str(dest)], cwd=ROOT)
    else:
        subprocess.check_call(["git", "mv", str(src), str(dest)], cwd=ROOT)


def main() -> None:
    # actual files keyed by lower relative-to-src path (with ext)
    files: dict[str, Path] = {}
    for p in list(SRC.rglob("*.ts")) + list(SRC.rglob("*.tsx")):
        rel = p.relative_to(SRC).as_posix()
        files[rel.lower()] = p

    # vote: for each actual file, which import casing is requested most?
    votes: dict[str, Counter[str]] = defaultdict(Counter)

    for p in list(SRC.rglob("*.ts")) + list(SRC.rglob("*.tsx")):
        text = p.read_text(encoding="utf-8", errors="ignore")
        for m in IMP_RE.finditer(text):
            raw = m.group(1)
            if raw.startswith("@/"):
                want = raw[2:]
                base = SRC / want
            else:
                base = (p.parent / raw).resolve()
                try:
                    want = base.relative_to(SRC.resolve()).as_posix()
                except ValueError:
                    continue

            for ext in (".ts", ".tsx", ""):
                cand = want if want.endswith((".ts", ".tsx")) else want + ext
                key = cand.lower()
                if key in files:
                    # desired relative path with correct casing from import
                    desired = cand if cand.endswith((".ts", ".tsx")) else cand + files[key].suffix
                    # if import had no ext, keep actual ext but imported path casing
                    if not want.endswith((".ts", ".tsx")):
                        desired = want + files[key].suffix
                    votes[key][desired] += 1
                    break

    renames: list[tuple[Path, Path]] = []
    for key, counter in votes.items():
        actual = files[key]
        desired_rel, _ = counter.most_common(1)[0]
        desired = SRC / desired_rel
        if actual.as_posix().replace("\\", "/") != desired.as_posix().replace("\\", "/"):
            # only casing / path segment casing
            if actual.resolve() != desired.resolve() and str(actual).lower() != str(desired).lower():
                # different file — skip unsafe moves
                continue
            if actual.name != desired.name or actual.parent != desired.parent:
                renames.append((actual, desired))

    # de-dupe
    seen = set()
    unique = []
    for a, d in renames:
        t = (str(a).lower(), str(d))
        if t in seen:
            continue
        seen.add(t)
        unique.append((a, d))

    print(f"renames planned: {len(unique)}")
    for a, d in unique:
        print(f"  {a.relative_to(ROOT)} -> {d.relative_to(ROOT)}")
        git_mv(a, d)

    print("done")


if __name__ == "__main__":
    main()
