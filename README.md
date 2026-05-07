# Zeynep & Batuhan — Nişan Davetiyesi

Statik tek sayfa nişan davetiyesi sitesi. 10 Mayıs 2026, Pazar 13:00, Gloria Event.

Canlı: <https://zeynepbatuhan.com>

## Proje Yapısı

```
.
├── index.html                       # Ana davetiye sayfası
├── sw.js                            # Service Worker (offline cache)
├── CNAME, robots.txt, sitemap.xml   # Hosting / SEO yapılandırması
├── davetiyeye-ne-yazilir.html       # SEO sayfası
├── dijital-davetiye-fiyatlari.html  # SEO sayfası
├── nisan-davetiyesi-ornekleri.html  # SEO sayfası
└── assets/
    ├── css/styles.css               # Tüm stiller
    ├── js/script.js                 # Tüm davranış (sayaç, bloom, RSVP, vs.)
    ├── audio/music.mp3              # Arka plan müziği
    ├── images/                      # background, davetiye, gloria-event, sakura-branch,
    │                                #   og-invite, favicon.ico, favicon.png, apple-touch-icon
    └── videos/                      # Intro video
```

## Bloom Modu (Çiçek Bahçesi)

Sayaç **10 Mayıs 2026 Pazar 13:00** (Europe/Istanbul) anına ulaştığında:

- `body` üzerine `bloom-mode` sınıfı eklenir.
- Dört köşede çiçek demetleri açar, üst/alt kenarlarda çiçek vinleri belirir.
- Tek seferlik dev "bloom burst" — 100+ çiçek emoji ekrana saçılır.
- Sürekli çiçek yağmuru başlar (sayfa açık olduğu sürece).
- İsim başlığı parlamaya başlar, bölümler pastel pembe tona kayar.
- Ortada büyük bir kutlama balonu açılır.

**Önizleme:** URL'ye `?bloom=1` ekleyerek modu önceden test edebilirsiniz, ör: <https://zeynepbatuhan.com/?bloom=1>

`prefers-reduced-motion` aktifse animasyonlar otomatik sönümlenir.

## Geliştirme

Yerelde önizlemek için (Python 3 yeter):

```bash
python3 -m http.server 8000
```

ardından <http://localhost:8000>.

## RSVP API

`assets/js/script.js` içindeki `RSVP_API_URL` Cloudflare Workers üzerinde çalışan ufak bir sayaç servisidir. Misafir sayısı `localStorage` ile cihaz bazında kilitlenir (mükerrer gönderim engeli).
