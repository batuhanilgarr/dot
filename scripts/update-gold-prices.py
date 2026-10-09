#!/usr/bin/env python3
"""Refresh the gold price table on dugune-ne-takilir.html from a public JSON feed.

Rewrites the marked price section and FAQ answer, then bumps dateModified,
the sitemap lastmod, the freshness config and feed.xml. Nothing is written
if the feed looks wrong. Use --dry-run to preview.
"""
from __future__ import annotations
import argparse, json, re, subprocess, sys, urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "dugune-ne-takilir.html"
SITEMAP = ROOT / "sitemap.xml"
MAINTENANCE = ROOT / "content-maintenance.json"
FEED_URL = "https://finans.truncgil.com/v4/today.json"
MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
ROWS = [("GRA", "Gram altın"), ("CEYREKALTIN", "Çeyrek altın"), ("YARIMALTIN", "Yarım altın"),
        ("TAMALTIN", "Tam altın"), ("CUMHURIYETALTINI", "Cumhuriyet altını")]
FAQ_QUESTION = "Bugün bir çeyrek altın kaç TL?"

def fetch() -> dict:
    req = urllib.request.Request(FEED_URL, headers={"User-Agent": "zeynepbatuhan-gold-updater/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def parse(data: dict) -> tuple[datetime, dict[str, tuple[float, float]]]:
    stamp = datetime.strptime(data["Update_Date"], "%Y-%m-%d %H:%M:%S")
    prices = {}
    for key, _ in ROWS:
        buy, sell = float(data[key]["Buying"]), float(data[key]["Selling"])
        if not (0 < buy <= sell * 1.05 and sell > 0):
            raise ValueError(f"{key}: geçersiz alış/satış {buy}/{sell}")
        prices[key] = (buy, sell)
    gram, quarter = prices["GRA"][1], prices["CEYREKALTIN"][1]
    if not 1.5 <= quarter / gram <= 1.75:
        raise ValueError(f"çeyrek/gram oranı beklenen aralık dışında: {quarter / gram:.2f}")
    if abs((datetime.now() - stamp).days) > 3:
        raise ValueError(f"veri çok eski: {stamp}")
    return stamp, prices

def tr(n: float) -> str:
    return f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def bin_tl(n: float) -> int:
    return round(n / 1000)

def date_tr(d: datetime) -> str:
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"

def build_section(stamp: datetime, p: dict) -> str:
    q, h, f, c = (p[k][1] for k in ("CEYREKALTIN", "YARIMALTIN", "TAMALTIN", "CUMHURIYETALTINI"))
    rows = "".join(f"<tr><td>{name}</td><td>{tr(p[k][0])}</td><td>{tr(p[k][1])}</td></tr>" for k, name in ROWS)
    when = f"{date_tr(stamp)} saat {stamp:%H.%M}"
    return (
        f'<h2>Güncel altın fiyatları ({date_tr(stamp)})</h2>'
        f'<p>Aşağıdaki fiyatlar {when} itibarıyla serbest piyasa verisidir. Altın fiyatı gün içinde değiştiği için tutarlar yaklaşık değerdir; kuyumcuya gitmeden önce o günün fiyatına bakın.</p>'
        f'<div class="seo-table-wrap"><table class="seo-table"><thead><tr><th>Altın türü</th><th>Alış (TL)</th><th>Satış (TL)</th></tr></thead><tbody>{rows}</tbody></table></div>'
        '<p><strong>Alış ve satış farkı:</strong> Altını kuyumcudan alırken “satış”, geri satarken “alış” fiyatı geçerlidir. Gerçek ürünlerde ayrıca işçilik ve kuyumcu farkı eklenebilir, bu yüzden hazır çeyrek ya da bilezik tabloda görünen fiyattan biraz farklı olabilir.</p>'
        '<h3>Bu fiyatlar bütçeye nasıl çevrilir?</h3>'
        f'<ul><li><strong>Sembolik katkı:</strong> Birkaç gram altın ya da 1 çeyrek altın. Bugünkü fiyatla yaklaşık {bin_tl(q)} bin TL.</li>'
        f'<li><strong>Orta katkı:</strong> Yarım altın ya da birkaç çeyrek. Yaklaşık {bin_tl(h)}-{bin_tl(q * 3)} bin TL aralığı.</li>'
        f'<li><strong>Yüksek katkı:</strong> Tam altın ya da Cumhuriyet altını. Yaklaşık {bin_tl(f)}-{bin_tl(c)} bin TL.</li></ul>'
        '<p>Bu eşleştirme bir öneri değil, tabloyu okumanıza yardım eden bir örnektir. Kaç altın takacağınız bütçenize, yakınlığınıza ve yöredeki adete bağlıdır. '
        f'Kaynak olarak <a href="{FEED_URL}" rel="nofollow noopener">Truncgil Finans</a> verisi kullanılmıştır; yatırım tavsiyesi değildir.</p>'
    )

def faq_answer(stamp: datetime, p: dict) -> str:
    buy, sell = p["CEYREKALTIN"]
    return (f"{date_tr(stamp)} saat {stamp:%H.%M} itibarıyla çeyrek altının serbest piyasa satış fiyatı yaklaşık {tr(sell).split(',')[0]} TL, "
            f"alış fiyatı yaklaşık {tr(buy).split(',')[0]} TL idi. Fiyat gün içinde değişir; kuyumcuda işçilik farkı da eklenebilir.")

def main() -> int:
    ap = argparse.ArgumentParser(); ap.add_argument("--dry-run", action="store_true"); args = ap.parse_args()
    try:
        stamp, prices = parse(fetch())
    except Exception as exc:
        print(f"Fiyat verisi alınamadı ya da şüpheli, dosyalara dokunulmadı: {exc}", file=sys.stderr); return 1
    today = stamp.strftime("%Y-%m-%d")
    html = PAGE.read_text(encoding="utf-8")
    section = build_section(stamp, prices); answer = faq_answer(stamp, prices)

    html, n = re.subn(r"(<!--gold-section-->).*?(<!--/gold-section-->)", lambda m: m.group(1) + section + m.group(2), html, flags=re.S)
    if n != 1: print("gold-section işaretçileri bulunamadı", file=sys.stderr); return 1
    html, n = re.subn(r"(<!--gold-faq-->).*?(<!--/gold-faq-->)",
                      lambda m: m.group(1) + f'<div class="seo-faq-item"><h3>{FAQ_QUESTION}</h3><p>{answer}</p></div>' + m.group(2), html, flags=re.S)
    if n != 1: print("gold-faq işaretçileri bulunamadı", file=sys.stderr); return 1
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    ld = json.loads(m.group(1))
    for node in ld["@graph"]:
        if node["@type"] == "BlogPosting": node["dateModified"] = today
        if node["@type"] == "FAQPage":
            for q in node["mainEntity"]:
                if q["name"] == FAQ_QUESTION: q["acceptedAnswer"]["text"] = answer
    html = html.replace(m.group(1), json.dumps(ld, ensure_ascii=False))

    if args.dry_run:
        print(f"[dry-run] {stamp}  gram={prices['GRA'][1]}  çeyrek={prices['CEYREKALTIN'][1]}"); return 0
    if html == PAGE.read_text(encoding="utf-8"): print("Değişiklik yok."); return 0
    PAGE.write_text(html, encoding="utf-8")

    sm = SITEMAP.read_text(encoding="utf-8")
    sm = re.sub(r"(<loc>https://zeynepbatuhan\.com/dugune-ne-takilir\.html</loc><lastmod>)[^<]*", rf"\g<1>{today}", sm)
    SITEMAP.write_text(sm, encoding="utf-8")
    cfg = json.loads(MAINTENANCE.read_text(encoding="utf-8"))
    for page in cfg["pages"]:
        if page["path"] == PAGE.name: page["lastReviewed"] = today
    MAINTENANCE.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    subprocess.run([sys.executable, str(ROOT / "scripts" / "generate-feed.py")], check=True)
    print(f"Güncellendi: {stamp} gram={prices['GRA'][1]} çeyrek={prices['CEYREKALTIN'][1]}")
    return 0

if __name__ == "__main__": raise SystemExit(main())
