# Trafik eylem planı — 9 Ekim 2026

Durum: Siteye yeni sayfa eklemek durduruldu. Odak: mevcut sayfaların dizine girmesi, dış sinyal ve ölçüm.

## Yapılanlar (repoda)
- Davetiye metinleri tek sütun sayfada birleştirildi (`davetiye-ornekleri.html`); nikah-düğün ve şehir hub'ları `rehberler.html` içine alındı; misafir iletişim planı `dugun-katilim-teyidi-mesaji.html` içine alındı.
- Eski 6 URL yönlendirme sayfası oldu (canonical + meta refresh + JS; UTM parametreleri korunuyor). Sitemap'ten çıkarıldı, iç bağlantılar güncellendi.
- Yetim kalan yeni sayfalara (çeyiz, düğüne ne takılır, evlendikten sonra işlemler) bağlamsal iç bağlantılar eklendi; SEO denetimi geçiyor.
- `sw.js` önbelleği v55'e yükseltildi.
- Beş yeni Pinterest pin görseli üretildi (`assets/images/pinterest/*.jpg`).
- Altın fiyatı tablosu hafta içi her gün otomatik güncelleniyor (`dugune-ne-takilir.html`).

## Yalnızca sizin yapabileceğiniz adımlar

### 1. Search Console (ilk 3 gün)
1. Sitemap'i yeniden gönderin (`https://zeynepbatuhan.com/sitemap.xml`); 67 URL görünmeli.
2. URL denetimi → "Dizine eklenmesini iste" yalnızca bu 8 sayfa için (günlük sınırı aşmayın):
   - `/davetiye-ornekleri.html`
   - `/nisan-davetiyesi-ornekleri.html`
   - `/dugune-ne-takilir.html`
   - `/kiz-isteme-toreni-nasil-yapilir.html`
   - `/ceyiz-listesi-nasil-hazirlanir.html`
   - `/rehberler.html`
   - `/nikah-icin-gerekli-belgeler-2026.html`
   - `/dugun-hazirlik-listesi.html`
3. Eski URL'ler için yeniden tarama isteği göndermeyin; Google yönlendirmeyi kendisi bulur. "Doğrulamayı başlat" tekrar tekrar kullanmayın.
4. 14 gün sonra "Sayfa dizine alma" raporunu karşılaştırın; "Keşfedildi - şu anda dizine eklenmemiş" sayısının düşmesi beklenir.

### 2. Pinterest (bu hafta, günde 1 pin)
Tüm bağlantılara `?utm_source=pinterest&utm_medium=social&utm_campaign=organik_pinterest&utm_content=<içerik>` ekleyin. Yapay zekâ ile üretilmiş görsel etiketini yayın ekranında işaretleyin.

| Pin görseli | Pano | Başlık | Hedef | utm_content |
| --- | --- | --- | --- | --- |
| `kiz-isteme-toreni-pin.jpg` | Nişan Organizasyonu Fikirleri | Kız İsteme Töreni Nasıl Yapılır? Kimler Gider, Ne Götürülür | `/kiz-isteme-toreni-nasil-yapilir.html` | `kiz_isteme_toreni` |
| `kiz-isteme-konusmasi-pin.jpg` | Nişan Organizasyonu Fikirleri | Kız İsteme Konuşması: Hazır Metinler ve Cevap Örnekleri | `/kiz-isteme-konusmasi-ve-mesaj-ornekleri.html` | `kiz_isteme_konusmasi` |
| `ceyiz-listesi-pin.jpg` | Düğün Bütçesi ve Planlama | Çeyiz Listesi: Oda Oda Eksiksiz Kontrol Listesi | `/ceyiz-listesi-nasil-hazirlanir.html` | `ceyiz_listesi` |
| `dugune-ne-takilir-pin.jpg` | Düğün Bütçesi ve Planlama | Düğüne Ne Takılır? Güncel Altın Fiyatları ve Nezaket Kuralları | `/dugune-ne-takilir.html` | `dugune_ne_takilir` |
| `davetiye-ornekleri-pin.jpg` | Davetiye Sözleri ve Örnekleri | Davetiyeye Ne Yazılır? Düğün, Nişan, Kına ve Sünnet İçin Hazır Metinler | `/davetiye-ornekleri.html` | `davetiye_ornekleri` |

Pin açıklaması şablonu: sayfanın meta açıklamasını kullanın + 3-4 doğal anahtar kelime (örn. "kız isteme, nişan hazırlığı, düğün planlama"). Hashtag yığını yazmayın.

### 3. Dış bağlantı (haftada 2-3 kişiye)
`backlink-outreach-plan-2026-09.md` içindeki kurallar geçerli (toplu e-posta, satın alma, dizin kaydı yok). Birleştirmeden sonra sunulacak kaynaklar:

| Kaynak | URL | Kimlere |
| --- | --- | --- |
| Ücretsiz planlama araçları | `/ucretsiz-dugun-planlama-araclari.html` | Düğün planlama blogları, organizatörler |
| Bütçe hesaplayıcı | `/dugun-butcesi-hesaplama.html` | Mekân, fotoğrafçı, organizasyon blogları |
| Davetiye metin kütüphanesi | `/davetiye-ornekleri.html` | Davetiye tasarımcıları, matbaalar |
| Şehir rotaları | `/rehberler.html#sehre-gore` | Yerel şehir yayınları |
| Düğüne ne takılır (güncel fiyat) | `/dugune-ne-takilir.html` | Kuyumcu blogları, finans/yaşam yayınları |

Potansiyel alıcıları (gerçek, tek tek doğrulanmış blog ve işletmeler) sizin belirlemeniz gerekir; bu araştırmada güvenilir bir Türkçe alıcı listesi çıkarılamadı ve uydurma liste hazırlanmadı. Her e-postada alıcının yayınladığı belirli bir yazıya ve eksik soruya atıf yapın.

### 4. Ölçüm (haftalık)
`seo/weekly-performance.csv` dosyasına her pazartesi: GSC tıklama/gösterim, dizindeki sayfa sayısı, Pinterest yönlendirme oturumu (GA4: kaynak = pinterest), kazanılan bağlantı sayısı.

## Beklentiler
- Yeni alan adında (DR 0) ilk dizinleme çoğu zaman haftalar sürer. Bu adımlar süreyi kısaltır, garanti etmez.
- Sıralama kazanmak için dış bağlantı ve zaman en belirleyici etkenlerdir; yeni sayfa sayısı değil.
- Öncelik sırası: dizine alma → Pinterest ve dış bağlantı → 4-6 hafta sonra performansa göre ikinci birleştirme dalgası ve yeni içerik.
