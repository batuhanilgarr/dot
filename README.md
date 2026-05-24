# Zeynep & Batuhan — Nikah Davetiyesi

Statik dijital düğün davetiyesi. Kına: 24 Ekim 2026 · Nikah: 25 Ekim 2026, Beykoz.

Canlı: <https://zeynepbatuhan.com>

## Proje Yapısı

```
.
├── index.html                       # Ana davetiye sayfası
├── 404.html                         # Özel hata sayfası
├── manifest.json                    # PWA manifest (ana ekrana ekle)
├── sw.js                            # Service Worker (offline cache + push)
├── kina.ics / nikah.ics             # Takvime ekle dosyaları
├── CNAME, robots.txt, sitemap.xml   # Hosting / SEO yapılandırması
├── push-worker-additions.js         # CF Worker push notification referans kodu
├── davetiyeye-ne-yazilir.html       # SEO sayfası
├── dijital-davetiye-fiyatlari.html  # SEO sayfası
├── nisan-davetiyesi-ornekleri.html  # SEO sayfası
├── gir/
│   ├── index.html                   # Özel çift köşesi (Bizim Köşemiz)
│   └── notify.html                  # Admin bildirim paneli
└── assets/
    ├── css/styles.css               # Tüm stiller
    ├── js/script.js                 # Tüm davranış
    ├── audio/music.mp3              # I Put A Spell On You — Annie Lennox
    ├── images/
    │   ├── nisan/                   # 49 nişan fotoğrafı (900px, ~90KB/adet)
    │   ├── hikaye.jpg / hikaye-600.jpg  # Hikayemiz fotoğrafı (srcset)
    │   ├── askilavinya.jpg          # Kına mekan görseli
    │   ├── beykozevlendirme.jpg     # Nikah mekan görseli
    │   ├── notif-heart.png          # Push bildirim ikonu
    │   └── og-invite.jpeg           # OG / sosyal medya görseli
    └── videos/                      # Intro video (sakura wax seal)
```

## Özellikler

### Davetiye Akışı
- **Intro** — Masaüstünde sakura mühür videosu; mobilde direkt içerik
- **Hikayemiz** — Her yenilemede 49 nişan fotoğrafından rastgele biri gösterilir
- **Geri Sayım** — Kına (24 Ekim) ve Nikah (25 Ekim) için ayrı sekmeli sayaç
- **Program** — Kına (12:00–17:00) ve Nikah (13:30 geliş, 14:00 tören) akışı
- **Lokasyon** — İki mekan kartı; araç mesafesi/süresi (OSRM), Yol Tarifi + Haritada Gör
- **Hava Durumu** — Open-Meteo API; 24 ve 25 Ekim için iki ayrı kart (16 gün sınırı içinde)
- **RSVP** — Cloudflare Workers sayaç; cihaz başına tekrar engeli (`localStorage`)
- **Takvime Ekle** — `kina.ics` ve `nikah.ics` indirme butonları
- **Paylaş** — Web Share API + WhatsApp fallback
- **SSS** — 3 grup accordion (Etkinlik, Ulaşım, Pratik) + Moovit toplu taşıma linkleri

### Teknik
- **Bloom Modu** — 25 Ekim 2026 14:00'dan itibaren sayfa çiçek bahçesine dönüşür. Önizleme: `?bloom=1`
- **PWA** — `manifest.json` ile mobilde ana ekrana eklenebilir
- **Service Worker** — Offline cache (v15); core asset'ler network-first; `/gir/` hiç cache'lenmez
- **Push Notifications** — Web Push API (VAPID); abonelik butonu sitede, bildirim `/gir/notify.html`'den
- **Lazy Media** — Video/audio `data-src` ile runtime'da yüklenir
- **Deferred Analytics** — GA ilk kullanıcı etkileşimine kadar yüklenmez
- **Müzik Tooltip** — Toggle'a hover/tap ile şarkı adı görünür

### Admin Araçları
| Sayfa | Açıklama |
|-------|----------|
| `/gir/` | Çift köşesi — özel notlar, düğün hazırlık |
| `/gir/notify.html` | Push bildirim gönderme paneli |

## Geliştirme

```bash
python3 -m http.server 8000
# http://localhost:8000
# http://localhost:8000/?bloom=1  ← bloom modu önizleme
```

## Cloudflare Worker

`https://zeynepbatuhan-rsvp-api.batuhannilgarr.workers.dev`

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/rsvp-count` | GET | Toplam katılım sayısı |
| `/rsvp` | POST | +1 katılım ekle |
| `/push-subscribe` | POST | Push aboneliği kaydet |
| `/push-notify` | POST | Tüm abonelere bildirim gönder (`X-Admin-Secret` header) |

Bildirim göndermek için:
```bash
curl -X POST https://zeynepbatuhan-rsvp-api.batuhannilgarr.workers.dev/push-notify \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: <PUSH_ADMIN_SECRET>" \
  -d '{"title":"Zeynep & Batuhan 💍","body":"Davetiyede yeni bir şey var!","url":"/"}'
```

## Deployment

`main` branch'e push → GitHub Pages otomatik yayınlar. Cache'i yenilemek için `sw.js` içindeki `CACHE_NAME` versiyonunu artır.
