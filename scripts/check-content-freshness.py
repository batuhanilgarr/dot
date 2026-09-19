#!/usr/bin/env python3
import json
from datetime import date, datetime
from pathlib import Path

root = Path(__file__).resolve().parents[1]
config = json.loads((root / "content-maintenance.json").read_text())
today = date.today()
default_interval = int(config.get("reviewIntervalDays", 120))
stale = []

for page in config["pages"]:
    path = root / page["path"]
    if not path.exists():
        stale.append(f"Eksik dosya: {page['path']}")
        continue
    reviewed = datetime.strptime(page["lastReviewed"], "%Y-%m-%d").date()
    interval = int(page.get("reviewIntervalDays", default_interval))
    age = (today - reviewed).days
    if age > interval:
        stale.append(f"{page['path']}: son kontrol {age} gün önce ({reviewed})")

if stale:
    print("Güncellik kontrolü gereken içerikler:")
    print("\n".join(f"- {item}" for item in stale))
    raise SystemExit(1)

print(f"{len(config['pages'])} zaman duyarlı içerik güncel.")
