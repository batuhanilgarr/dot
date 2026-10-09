"""Pinterest pin images for the October 2026 guides (JPG for upload, WebP for the repo)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/images/pinterest"
W, H = 1000, 1500
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

PINS = [
    ("kiz-isteme-toreni-pin", "assets/images/nisan/dsc09105.jpg", "KIZ İSTEME\nNASIL YAPILIR?", "Kimler gider, ne götürülür?", "Tuzlu kahve ve konuşma sırası"),
    ("kiz-isteme-konusmasi-pin", "assets/images/nisan/dsc09130.jpg", "KIZ İSTEME\nKONUŞMASI", "Hazır konuşma ve cevap metinleri", "Davet ve teşekkür mesajları"),
    ("ceyiz-listesi-pin", "assets/images/nisan/dsc09177.jpg", "ÇEYİZ LİSTESİ\nODA ODA", "Önce neler alınır?", "Mutfak, yatak odası, banyo, salon"),
    ("dugune-ne-takilir-pin", "assets/images/nisan/dsc09227.jpg", "DÜĞÜNE\nNE TAKILIR?", "Güncel altın fiyat tablosu", "Miktar belirleme ve nezaket kuralları"),
    ("davetiye-ornekleri-pin", "assets/images/nisan/dsc09321.jpg", "DAVETİYEYE\nNE YAZILIR?", "Düğün, nişan, kına, sünnet", "Hazır sözler, mesajlar ve şiirler"),
    ("kina-gecesi-sarkilari-pin", "assets/images/nisan/dsc09396.jpg", "KINA GECESİ\nŞARKILARI", "Giriş, kına yakma, eğlence", "Çalma listesi ve sıralama önerisi"),
    ("kina-hediyelikleri-pin", "assets/images/nisan/dsc09414.jpg", "KINA\nHEDİYELİKLERİ", "Fikirler, bütçe ve sipariş", "Adet hesabı ve etiket önerileri"),
    ("kina-davetiyesi-mesaj-pin", "assets/images/nisan/dsc09453.jpg", "KINA DAVETİYESİ\nMESAJLARI", "Hazır kına gecesi metinleri", "Aile ve arkadaş grubu için örnekler"),
    ("evde-nisan-menusu-pin-2", "assets/images/nisan/dsc09286.jpg", "EVDE NİŞAN\nMENÜSÜ", "20, 30 ve 50 kişilik plan", "İkramlık listesi ve miktarlar"),
    ("istanbul-nisan-alisverisi-pin", "assets/images/nisan/dsc09365.jpg", "İSTANBUL'DA\nNİŞAN MALZEMELERİ", "Eminönü, Tahtakale, Şark Han", "Ürün ürün alışveriş rotası"),
    ("ankara-kina-alisverisi-pin", "assets/images/nisan/dsc09367.jpg", "ANKARA'DA\nKINA MALZEMELERİ", "Ulus, Suluhan, Çankaya", "Satın alma mı, kiralama mı?"),
    ("izmir-kina-alisverisi-pin", "assets/images/nisan/dsc09392.jpg", "İZMİR'DE\nKINA MALZEMELERİ", "Kemeraltı alışveriş planı", "Bindallı, kına seti ve hediyelik"),
    ("nikah-belgeleri-pin", "assets/images/nisan/dsc09403.jpg", "NİKAH İÇİN\nGEREKLİ BELGELER", "2026 başvuru kontrol listesi", "Kimlik, fotoğraf, sağlık raporu"),
    ("evlilik-saglik-raporu-pin", "assets/images/nisan/dsc09404.jpg", "EVLİLİK SAĞLIK\nRAPORU", "Nereden alınır? 2026 rehberi", "Aile hekimi, testler ve süre"),
    ("nikah-toreni-pin", "assets/images/nisan/dsc09410.jpg", "NİKAH TÖRENİ\nNASIL YAPILIR?", "Adım adım akış ve süre", "Şahit, cüzdan, tören günü listesi"),
    ("nikah-sahidi-pin", "assets/images/nisan/dsc09421.jpg", "NİKAH ŞAHİDİ\nKİMLER OLUR?", "Şartlar, görevler, seçim", "Yedek şahit planı"),
    ("nikah-takisi-pin", "assets/images/nisan/dsc09427.jpg", "NİKAHTA TAKI\nTÖRENİ", "Düzen, kayıt ve güvenlik", "Takı görevlisi ve kayıt tablosu"),
    ("evlendikten-sonra-pin", "assets/images/nisan/dsc09138.jpg", "EVLENDİKTEN\nSONRA İŞLEMLER", "Soyadı, kimlik, banka, adres", "Resmî işlemler kontrol listesi"),
]

def cover(path):
    im = Image.open(path).convert("RGB")
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.Resampling.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((l, t, l + W, t + H)).filter(ImageFilter.GaussianBlur(0.35))

def centered(draw, text, y, font, fill, spacing=12):
    box = draw.multiline_textbbox((0, 0), text, font=font, spacing=spacing, align="center", stroke_width=1)
    draw.multiline_text(((W - (box[2] - box[0])) / 2, y), text, font=font, fill=fill, spacing=spacing,
                        align="center", stroke_width=1, stroke_fill=(35, 24, 28, 110))

OUT.mkdir(parents=True, exist_ok=True)
for slug, src, title, subtitle, detail in PINS:
    im = cover(ROOT / src)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, W, H), fill=(35, 18, 25, 92))
    od.rounded_rectangle((70, 500, 930, 1260), radius=35, fill=(255, 249, 245, 228), outline=(218, 166, 177, 255), width=4)
    im = Image.alpha_composite(im.convert("RGBA"), overlay)
    d = ImageDraw.Draw(im)
    centered(d, title, 585, ImageFont.truetype(FONT_BOLD, 76), (73, 43, 55, 255), 18)
    centered(d, subtitle, 865, ImageFont.truetype(FONT_BOLD, 38), (172, 84, 112, 255))
    centered(d, detail, 960, ImageFont.truetype(FONT_REG, 32), (83, 64, 71, 255))
    centered(d, "ZEYNEPBATUHAN.COM", 1150, ImageFont.truetype(FONT_BOLD, 28), (151, 111, 65, 255))
    rgb = im.convert("RGB")
    rgb.save(OUT / f"{slug}.webp", "WEBP", quality=88, method=6)
    rgb.save(OUT / f"{slug}.jpg", "JPEG", quality=90, optimize=True)
    print("wrote", slug)
