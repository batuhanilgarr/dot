# Misafir fotoğraf API'si (Cloudflare Worker + R2)

25 Ekim 2026 Pazar 14:00'ten sonra konum ekranı fotoğraf paylaşım alanına dönüşür
(`assets/js/photos.js`). Fotoğraflar bu Worker üzerinden R2'ye yazılır.

## Kurulum (bir kez, Cloudflare hesabınızla)

```bash
cd workers/photos
npx wrangler login
npx wrangler r2 bucket create zeynepbatuhan-photos
npx wrangler secret put ADMIN_SECRET      # kendi seçtiğiniz uzun bir parola
npx wrangler deploy
```

Deploy sonrası adres `https://zeynepbatuhan-photos-api.batuhannilgarr.workers.dev` olmalıdır
(`assets/js/photos.js` içindeki `DEFAULT_API`). Farklıysa orayı güncelleyip `photos.min.js`'i yeniden üretin.

## Davranış
- Yükleme `UPLOAD_OPENS_AT` (25 Ekim 14:00 TSİ) öncesi `403 not_open` döner; `UPLOAD_CLOSES_AT` sonrası kapanır. Tarihler `wrangler.toml`'da.
- Yalnızca JPEG kabul edilir (tarayıcı, yüklemeden önce her fotoğrafı 2560 px ve 480 px JPEG'e çevirir; EXIF/konum silinir).
- Tam boy ≤ 8 MB, küçük resim ≤ 400 KB. IP başına 10 dakikada en fazla 60 yükleme (en iyi çaba).
- `Origin` yalnızca `ALLOWED_ORIGINS` listesinden kabul edilir.

## Moderasyon
Yönetim paneli: `https://zeynepbatuhan.com/gir/fotograflar.html` (parola `ADMIN_SECRET`; arama motorlarına kapalıdır).
Listeler, tek tek ya da toplu siler. Parolayı değiştirmek için `npx wrangler secret put ADMIN_SECRET`.

Komut satırıyla silmek:

```bash
curl -X DELETE "https://<worker>/photo/<id>" -H "X-Admin-Secret: <ADMIN_SECRET>"
```

Yüklemeyi hemen kapatmak için `wrangler.toml` içinde `UPLOAD_CLOSES_AT`'i geçmiş bir tarihe çekip `npx wrangler deploy` çalıştırın.
Test için geçici açmak: `npx wrangler deploy --var UPLOAD_OPENS_AT:2026-10-01T00:00:00+03:00` (normal `deploy` tekrar kapatır).

## Yerel test
```bash
npx wrangler dev --local --var UPLOAD_OPENS_AT:2026-01-01T00:00:00+03:00 --var ADMIN_SECRET:test
# siteyi python3 -m http.server ile açıp  /?foto=1&photosApi=http://localhost:8787  adresine gidin
```
