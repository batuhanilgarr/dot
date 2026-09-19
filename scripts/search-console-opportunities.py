#!/usr/bin/env python3
"""Search Console CSV dışa aktarımından hızlı SEO fırsat raporu üretir."""
import csv
import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("Kullanım: python3 scripts/search-console-opportunities.py search-console.csv")

path = Path(sys.argv[1])
rows = []
with path.open(encoding="utf-8-sig", newline="") as stream:
    for row in csv.DictReader(stream):
        normalized = {key.strip().lower(): value for key, value in row.items()}
        query = normalized.get("top queries") or normalized.get("query") or normalized.get("sorgular") or ""
        impressions = float((normalized.get("impressions") or normalized.get("gösterimler") or "0").replace(".", "").replace(",", "."))
        clicks = float((normalized.get("clicks") or normalized.get("tıklamalar") or "0").replace(".", "").replace(",", "."))
        position = float((normalized.get("position") or normalized.get("konum") or "99").replace(",", "."))
        ctr = clicks / impressions if impressions else 0
        if query and impressions >= 20 and position <= 20:
            rows.append((impressions * max(0.01, 0.08 - ctr), query, int(impressions), int(clicks), ctr, position))

rows.sort(reverse=True)
print("# Search Console içerik fırsatları\n")
print("| Sorgu | Gösterim | Tıklama | TO | Konum | Öneri |")
print("|---|---:|---:|---:|---:|---|")
for _, query, impressions, clicks, ctr, position in rows[:30]:
    action = "Başlık/meta test et" if position <= 10 else "İçeriği ve iç linkleri güçlendir"
    print(f"| {query} | {impressions} | {clicks} | %{ctr*100:.1f} | {position:.1f} | {action} |")
