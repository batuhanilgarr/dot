# Sayfa birleştirme listesi — 9 Ekim 2026

## Yöntem ve sınırlar
- 71 genel sayfanın metni TF-IDF ile karşılaştırıldı (ortak şablon ve ilgili rehber kartları çıkarıldı). Ayrıca başlık, H2 yapısı, arama niyeti ve iç bağlantı sayısına bakıldı.
- Düz metin benzerliği yüksek değil (en yüksek çift 0,42). Sorun kelime kopyası değil: **aynı niyete hizmet eden, aynı şablonla yazılmış çok sayıda ince sayfa**. Ortalama sayfa 400-900 kelime.
- Bu çıkarım Search Console'daki URL bazlı gösterim/tık verisi olmadan yapıldı. Yönlendirmeden önce her aday için Search Console'da son 3 ay gösterimini kontrol edin; gösterimi olan URL hayatta kalan URL olmalı.
- `davetiye-ornekleri` ve `davetiyeye-ne-yazilir` gibi iç içe `<article>` kullanan sayfaların kelime sayısı düşük çıkabilir; bunlar boş değil.

## Özet
71 sayfadan 13'ü başka sayfaya katılır, hedef yaklaşık 58 sayfa. Yeni sayfa eklemeyi bu iş bitene kadar durdurun.

## Birinci dalga: birleştir ve yönlendir

### A. Davetiye metinleri (6 sayfa → 4)
| Katılacak sayfa | Hayatta kalan | Neden |
|---|---|---|
| `davetiyeye-ne-yazilir.html` | `davetiye-ornekleri.html` | Aynı sorgu ("davetiyeye ne yazılır / örnekleri"), taranmış ama dizine alınmamış listede |
| `dugun-davetiyesi-sozleri-ve-mesaj-ornekleri.html` | `davetiye-ornekleri.html` | Aynı niyet, taranmış ama dizine alınmamış listede |
| `sunnet-davetiyesi-mesaj-ornekleri.html` | `davetiye-ornekleri.html` (kısa bölüm) | Kına davetiyesi sayfasıyla en yüksek benzerlik (0,42); sünnet sitenin düğün/nişan konu odağının dışında |

Korunur: `nisan-davetiyesi-ornekleri` (erken görünürlüğü olan sayfa), `kina-davetiyesi-mesaj-ornekleri`, `sadece-nikah-davetiyesi-metinleri`.

### B. Şehir malzeme sayfaları (6 sayfa → 3)
İstanbul, Ankara, İzmir için kına ve nişan sayfaları aynı H2 iskeletini kullanıyor (benzerlik 0,26-0,35).
| Katılacak sayfa | Hayatta kalan |
|---|---|
| `istanbul-kina-malzemeleri-nereden-alinir.html` | `istanbul-nisan-malzemeleri-nereden-alinir.html` |
| `ankara-kina-malzemeleri-nereden-alinir.html` | `ankara-nisan-malzemeleri-nereden-alinir.html` |
| `izmir-kina-malzemeleri-nereden-alinir.html` | `izmir-nisan-malzemeleri-nereden-alinir.html` |

- Hayatta kalan sayfa "Nişan ve Kına Malzemeleri" başlığıyla her iki bölümü içerir. Karar noktası: kına URL'lerini korumak da mümkün; tek ölçüt Search Console'da hangisinin gösterimi var.
- Şehir sayfalarındaki "Kına Gecesi Malzemeleri Tam Liste" bölümü kaldırılıp `kina-malzemeleri-listesi.html`'e bağlanır (liste tekrarı).

### C. İnce hub sayfaları (3 sayfa)
| Katılacak sayfa | Hedef | Neden |
|---|---|---|
| `nikah-ve-dugun-rehberleri.html` | `rehberler.html` | Benzerlik 0,56; aynı kart listesini tekrarlıyor |
| `sehre-gore-dugun-alisverisi.html` | `rehberler.html` | ~230 kelime, yalnızca şehir sayfalarına bağlanıyor |
| `dugun-misafir-iletisim-rehberi.html` | `dugun-katilim-teyidi-mesaji.html` | İnce hub (~380 kelime) |

`kina-gecesi-rehberleri` ve `nisan-rehberleri` kategori hub'ı olarak kalır; özgün giriş metniyle güçlendirilmeli.

### D. Nikah (2 sayfa)
| Katılacak sayfa | Hayatta kalan | Neden |
|---|---|---|
| `dini-nikah-belgesi.html` | `imam-nikahi-nasil-kiyilir.html` | İkisi de "resmî nikahla fark" anlatıyor (benzerlik 0,25); imam nikahı taranmış ama dizine alınmamış listede |

### E. Mesaj sayfaları (2 sayfa → katılım teyidi sayfasına)
| Katılacak sayfa | Hayatta kalan |
|---|---|
| `dugun-servis-bilgilendirme-mesaji.html` | `dugun-katilim-teyidi-mesaji.html` |
| `misafirlerden-dugun-fotografi-isteme-mesaji.html` | `dugun-katilim-teyidi-mesaji.html` |

Üçü de kısa "hazır mesaj" sayfaları ve aynı davetli iletişim niyetine hizmet ediyor.

### F. Kız isteme (1 sayfa)
| Katılacak sayfa | Hayatta kalan |
|---|---|
| `kiz-isteme-konusmasi-ve-mesaj-ornekleri.html` | `kiz-isteme-toreni-nasil-yapilir.html` |

Bu iki sayfayı 7 Ekim sonrası ben yazdım; tek güçlü sayfa olarak daha iyi.

## İkinci dalga: birleştirmeyin, farklılaştırın veya izleyin
- `dugun-butcesi-hesaplama` ve `dugun-butcesi-nasil-hazirlanir`: aracı ve rehberi farklı niyetler olarak koruyun, çapraz bağlayın.
- `evde-nisan-organizasyonu-nasil-yapilir`, `evde-nisan-menusu-ve-ikramliklari`, `soz-ve-nisan-ayni-gun-nasil-yapilir`: örtüşen bölümleri tek yere taşıyıp diğerlerinden bağlantı verin.
- `nikah-sahidi-kimler-olur` ve `imam-nikahi-nasil-kiyilir` içindeki "Kimler Şahit Olabilir?" bölümü: birini bağlantıyla kısaltın.
- `sonbahar-dugununde-ne-giyilir` ve `ekim-dugunu-yagmur-plani`: sezonluk, şimdilik kalsın.
- `zeynep-isminin-anlami` ve `batuhan-isminin-anlami`: konu dışı ve büyük sitelerle rekabet ediyor. `isim-icerikleri-stratejisi-2026-09-22.md` ile birlikte değerlendirin; gerekirse noindex.

## Uygulama notları
- GitHub Pages sunucu yönlendirmesi (301) desteklemiyor. Katılan sayfa şu yapıya çevrilir: `<link rel="canonical">` hedef URL'ye, `<meta http-equiv="refresh" content="0;url=HEDEF">` ve kısa bir "taşındı" bağlantısı. Google bunu yönlendirme olarak işler.
- Yönlendirme sayfaları `sitemap.xml`'den çıkarılmalı. `scripts/seo-audit.py` her HTML'in sitemap'te olmasını bekliyor; yönlendirme sayfalarını istisna listesine eklemek gerekir.
- İçerik hayatta kalan sayfaya **gerçekten taşınmalı** (özgün örnekler, SSS, tablolar). Sadece yönlendirmek içeriği kaybettirir.
- Tüm iç bağlantılar (`rehberler.html`, ilgili rehber kartları) hedef URL'lere güncellenmeli; `feed.xml` yeniden üretilmeli; `sw.js` `CACHE_NAME` artırılmalı.
- Yönlendirmeden sonra Search Console'da eski URL'lerde "Doğrulamayı başlat" kullanmayın; hedef sayfalar için dizine ekleme isteyin (günlük sınırı gözetin).
