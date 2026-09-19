#!/usr/bin/env python3
from datetime import datetime, timezone, timedelta
from email.utils import format_datetime
from html import escape, unescape
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
EXCLUDED={'404.html','coffee.html'}
items=[]
for p in sorted(ROOT.glob('*.html')):
    if p.name in EXCLUDED: continue
    s=p.read_text(encoding='utf-8')
    title=unescape(re.search(r'<title>(.*?)</title>',s,re.S).group(1).strip())
    desc=unescape(re.search(r'<meta name="description" content="([^"]*)"',s).group(1))
    url=re.search(r'<link rel="canonical" href="([^"]+)"',s).group(1)
    dates=re.findall(r'"dateModified"\s*:\s*"([^"]+)"',s)
    day=dates[0] if dates else '2026-09-20'
    dt=datetime.fromisoformat(day).replace(hour=9,tzinfo=timezone(timedelta(hours=3)))
    items.append((dt,title,desc,url))
items.sort(reverse=True)
now=max(x[0] for x in items)
lines=['<?xml version="1.0" encoding="UTF-8"?>','<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">','<channel>',
'<title>Zeynep &amp; Batuhan Rehberleri</title>','<link>https://zeynepbatuhan.com/rehberler.html</link>',
'<description>Nişan, kına, nikah, düğün ve davetiye hazırlık rehberleri.</description>','<language>tr-TR</language>',
f'<lastBuildDate>{format_datetime(now)}</lastBuildDate>','<atom:link href="https://zeynepbatuhan.com/feed.xml" rel="self" type="application/rss+xml"/>']
for dt,title,desc,url in items[:30]:
    lines += ['<item>',f'<title>{escape(title)}</title>',f'<link>{escape(url)}</link>',f'<guid isPermaLink="true">{escape(url)}</guid>',f'<description>{escape(desc)}</description>',f'<pubDate>{format_datetime(dt)}</pubDate>','</item>']
lines += ['</channel>','</rss>']
(ROOT/'feed.xml').write_text('\n'.join(lines)+'\n',encoding='utf-8')
