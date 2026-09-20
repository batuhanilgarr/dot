#!/usr/bin/env python3
"""Fail CI when public SEO contracts drift."""
from __future__ import annotations
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import collections, json, re, sys, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://zeynepbatuhan.com"
EXCLUDED = {"404.html", "coffee.html"}

class Document(HTMLParser):
    def __init__(self):
        super().__init__(); self.tags=[]; self.links=[]; self.jsonld=[]; self._json=False; self._buf=""
    def handle_starttag(self, tag, attrs):
        data=dict(attrs); self.tags.append((tag,data))
        if tag == "a" and data.get("href"): self.links.append(data["href"])
        if tag == "script" and data.get("type") == "application/ld+json": self._json=True; self._buf=""
    def handle_endtag(self, tag):
        if tag == "script" and self._json:
            self.jsonld.append(self._buf); self._json=False
    def handle_data(self, data):
        if self._json: self._buf += data

def canonical_path(path: Path) -> str:
    return "/" if path.name == "index.html" else f"/{path.name}"

def main() -> int:
    errors=[]
    pages=sorted(p for p in ROOT.glob("*.html") if p.name not in EXCLUDED)
    public_names={p.name for p in pages}
    parsed={}
    incoming=collections.Counter()
    for path in pages:
        doc=Document(); doc.feed(path.read_text(encoding="utf-8")); parsed[path.name]=doc
        metas={a.get("name") or a.get("property"): a.get("content","") for t,a in doc.tags if t=="meta"}
        link_tags=[a for t,a in doc.tags if t=="link"]
        canon=[a.get("href") for a in link_tags if a.get("rel")=="canonical"]
        expected=ORIGIN + canonical_path(path)
        if canon != [expected]: errors.append(f"{path.name}: canonical {canon!r}, expected {expected}")
        for key in ("description","og:title","og:description","og:url","og:image","twitter:card"):
            if not metas.get(key): errors.append(f"{path.name}: missing {key}")
        if len([1 for t,_ in doc.tags if t=="h1"]) != 1: errors.append(f"{path.name}: must contain exactly one h1")
        if not any(a.get("type")=="application/rss+xml" for a in link_tags): errors.append(f"{path.name}: missing RSS discovery link")
        for block in doc.jsonld:
            try: json.loads(block)
            except Exception as exc: errors.append(f"{path.name}: invalid JSON-LD: {exc}")
        for href in doc.links:
            u=urlparse(href)
            if u.netloc and u.netloc != "zeynepbatuhan.com": continue
            target=(u.path.rstrip("/").split("/")[-1] or "index.html")
            if target in public_names: incoming[target]+=1
            elif target.endswith(".html") and target not in EXCLUDED and not (ROOT/target).exists(): errors.append(f"{path.name}: broken internal link {href}")

    ns={"s":"http://www.sitemaps.org/schemas/sitemap/0.9"}
    try:
        feed=ET.parse(ROOT/"feed.xml")
        feed_urls={node.text for node in feed.findall("./channel/item/link")}
        if ORIGIN+"/rehberler.html" not in feed_urls: errors.append("feed: guides index missing")
    except Exception as exc: errors.append(f"feed: invalid XML: {exc}")

    sitemap=ET.parse(ROOT/"sitemap.xml")
    sitemap_entries=sitemap.findall(".//s:url",ns)
    urls=[n.find("s:loc",ns).text for n in sitemap_entries]
    for entry in sitemap_entries:
        loc=entry.find("s:loc",ns).text
        lastmods=entry.findall("s:lastmod",ns)
        if len(lastmods) != 1:
            errors.append(f"sitemap: {loc} must contain exactly one lastmod")
        elif not re.fullmatch(r"\d{4}-\d{2}-\d{2}", lastmods[0].text or ""):
            errors.append(f"sitemap: {loc} has invalid lastmod {lastmods[0].text!r}")
    expected_urls={ORIGIN+canonical_path(p) for p in pages}|{ORIGIN+"/photo/"}
    if set(urls) != expected_urls:
        for x in sorted(expected_urls-set(urls)): errors.append(f"sitemap: missing {x}")
        for x in sorted(set(urls)-expected_urls): errors.append(f"sitemap: unexpected {x}")
    if len(urls) != len(set(urls)): errors.append("sitemap: duplicate URLs")
    for page in pages:
        if page.name != "index.html" and incoming[page.name] < 2: errors.append(f"{page.name}: only {incoming[page.name]} internal incoming link(s)")
    if errors:
        print("SEO audit failed:")
        print("\n".join(f"- {e}" for e in errors)); return 1
    print(f"SEO audit passed: {len(pages)+1} public pages, {len(urls)} sitemap URLs, valid metadata/JSON-LD/internal links.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
