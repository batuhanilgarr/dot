from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/images/pinterest"
DESKTOP = Path.home() / "Desktop"
W, H = 1000, 1500
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

PINS = [
    ("istanbul-kina-alisverisi-pin", "assets/images/nisan/dsc09493.jpg", "İSTANBUL'DA\nKINA MALZEMELERİ", "Eminönü alışveriş rotası", "Liste + fiyat karşılaştırma ipuçları"),
    ("ankara-nisan-alisverisi-pin", "assets/images/nisan/dsc09243.jpg", "ANKARA'DA\nNİŞAN MALZEMELERİ", "Ulus ve Samanpazarı rotası", "Tepsi, hediyelik ve süsleme listesi"),
    ("dugun-hazirlik-listesi-pin", "assets/images/nisan/dsc09145.jpg", "DÜĞÜN HAZIRLIK\nLİSTESİ", "12 aydan son haftaya", "Adım adım ücretsiz kontrol listesi"),
    ("gelin-cantasi-listesi-pin", "assets/images/nisan/dsc09531.jpg", "GELİN ÇANTASINDA\nNE OLMALI?", "Unutulmaması gereken 30 parça", "Acil durum ve makyaj listesi"),
]

def cover(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGB")
    scale = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    left, top = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((left, top, left + W, top + H)).filter(ImageFilter.GaussianBlur(0.35))

def centered(draw, text, y, font, fill, spacing=12):
    box = draw.multiline_textbbox((0, 0), text, font=font, spacing=spacing, align="center", stroke_width=1)
    width = box[2] - box[0]
    draw.multiline_text(((W - width) / 2, y), text, font=font, fill=fill, spacing=spacing, align="center", stroke_width=1, stroke_fill=(35, 24, 28, 110))

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
    rgb.save(DESKTOP / f"{slug}.png", "PNG", optimize=True)
