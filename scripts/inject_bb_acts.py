"""
Inject CS2-style act_number / act_title / builds_layer into CS3–CS7 workspaces
so story mode + mission boards unlock for every Building Basics session.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOTS = [
    Path(r"d:\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud\building_basics"),
    Path(r"d:\Rebon God\Rebon God\commu-craft-coach-main\commu-craft-coach-main\src\data\cloud\building_basics"),
]

# (act_number, act_title, builds_layer)
ACTS: dict[str, tuple[int, str, str]] = {
    "C3.1": (1, "The Default VPC That Never Got Reviewed", "Network Foundation Layer"),
    "C3.2a": (2, "Public vs Private Subnets", "Subnet Placement Layer"),
    "C3.2b": (3, "Internet Paths — IGW and NAT", "Egress Path Layer"),
    "C3.3": (4, "Security Groups That Actually Scope", "Traffic Control Layer"),
    "C3.4": (5, "Where Security Groups Stop — NACLs", "Perimeter Filter Layer"),
    "C3.5": (6, "The Ghost Peering Route", "Cross-VPC Trust Layer"),
    "C3.6": (7, "DNS That Survives Rebuilds", "Name Resolution Layer"),
    "C4.1": (1, "Instance Types That Fit the Work", "Compute Shape Layer"),
    "C4.2a": (2, "Launch With Persistence in Mind", "Launch Discipline Layer"),
    "C4.2b": (3, "Day-to-Day Instance Operations", "Runtime Control Layer"),
    "C4.3": (4, "AMIs, Snapshots, Launch Templates", "Image Reuse Layer"),
    "C4.4": (5, "Load Balancing That Spreads Risk", "Traffic Entry Layer"),
    "C4.5": (6, "Auto Scaling That Survives Failure", "Elasticity Layer"),
    "C4.6": (7, "Pricing Models That Match Reality", "Compute Cost Layer"),
    "C5.1a": (1, "Buckets and Object Fundamentals", "Object Store Layer"),
    "C5.1b": (2, "Lifecycle Before the Bill Explodes", "Storage Lifecycle Layer"),
    "C5.2": (3, "S3 Security That Holds", "Object Security Layer"),
    "C5.3": (4, "EBS That Survives Termination", "Block Storage Layer"),
    "C5.4": (5, "Cost Hygiene Across Storage", "Storage Economics Layer"),
    "C6.1": (1, "Dashboards That Show the Whole Stack", "Visibility Layer"),
    "C6.2": (2, "Alarms That Page the Right People", "Alerting Layer"),
    "C6.3": (3, "CloudTrail as the Audit Trail", "Accountability Layer"),
    "C6.4": (4, "Config and Trusted Advisor Readiness", "Compliance Signal Layer"),
    "C7.1": (1, "Design FoodQuick Properly", "Architecture Blueprint Layer"),
    "C7.2": (2, "Build the Network for Real", "Network Build Layer"),
    "C7.3": (3, "Deploy the Application Layer", "App Deploy Layer"),
    "C7.4": (4, "Monitor, Document, Close FQ-218", "Proof & Portfolio Layer"),
}


def main() -> None:
    for root in ROOTS:
        for lid, (num, title, layer) in ACTS.items():
            session = f"cs{lid[1]}"
            path = root / session / f"{lid}_workspace.json"
            if not path.exists() or path.stat().st_size < 20:
                print("skip", path)
                continue
            data = json.loads(path.read_text(encoding="utf-8-sig"))
            data["act_number"] = num
            data["act_title"] = title
            data["builds_layer"] = layer
            # keep ticket/arc fields; ensure loader sees act
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=4) + "\n",
                encoding="utf-8",
            )
            print("acted", path.name, f"Act {num}")
    print("done")


if __name__ == "__main__":
    main()
