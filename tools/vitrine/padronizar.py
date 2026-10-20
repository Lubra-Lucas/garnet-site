"""Leva uma foto aprovada para a vitrine: recorte, quadro padronizado, foto original e linha no vitrine-data.js.

Uso (a partir da raiz do repositório):
  python3 tools/vitrine/padronizar.py --foto revisao/x.png --slug bocarosa-omg-ia1 --marca bocarosa --nome "#OMG!"

Marcas: bocarosa, karen, alice, maxweber, ale, estrela, johnjohn, fran, garnet.
Requer: pip install "rembg[cpu]" pillow   (o modelo birefnet-general é baixado na primeira vez, ~1 GB;
roda bem com uma imagem por processo, sem outras IAs ao mesmo tempo, por causa da memória).
"""
import argparse, colorsys, json, re
from PIL import Image, ImageDraw, ImageFilter

W, H = 720, 900  # quadro da vitrine (4:5)


def recortar(foto):
    from rembg import new_session, remove
    return remove(Image.open(foto).convert("RGB"), session=new_session("birefnet-general"))


def halo(p):
    sm = p.copy(); sm.thumbnail((48, 48))
    px = [c[:3] for c in sm.getdata() if c[3] > 200] or [(200, 180, 160)]
    r, g, b = (sum(c[i] for c in px) / len(px) / 255 for i in range(3))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    r, g, b = colorsys.hls_to_rgb(h, 0.78, min(0.55, s * 0.9 + 0.1))
    return int(r * 255), int(g * 255), int(b * 255)


def quadro(p):
    """Fundo de estúdio nos tons do site, produto centralizado, sombra e halo na cor do produto."""
    p = p.crop(p.getbbox())
    bg = Image.new("RGB", (W, H), (247, 244, 239))
    g = Image.new("L", (W, H), 0); ImageDraw.Draw(g).ellipse((-140, -100, W + 140, H * 0.9), fill=255)
    bg.paste(Image.new("RGB", (W, H), (253, 251, 247)), (0, 0), g.filter(ImageFilter.GaussianBlur(110)))
    fl = Image.new("L", (W, H), 0); ImageDraw.Draw(fl).rectangle((0, int(H * 0.76), W, H), fill=70)
    bg.paste(Image.new("RGB", (W, H), (232, 225, 214)), (0, 0), fl.filter(ImageFilter.GaussianBlur(40)))
    hl = Image.new("L", (W, H), 0); ImageDraw.Draw(hl).ellipse((W * 0.14, H * 0.18, W * 0.86, H * 0.74), fill=70)
    bg.paste(Image.new("RGB", (W, H), halo(p)), (0, 0), hl.filter(ImageFilter.GaussianBlur(80)))
    s = min(W * 0.76 / p.width, H * 0.62 / p.height)
    p = p.resize((max(1, int(p.width * s)), max(1, int(p.height * s))), Image.LANCZOS)
    x = (W - p.width) // 2; base = int(H * 0.81); y = base - p.height + 6
    sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).ellipse((x + p.width * 0.08, base - 14, x + p.width * 0.92, base + 10), fill=165)
    bg.paste(Image.new("RGB", (W, H), (90, 70, 50)), (0, 0), sh.filter(ImageFilter.GaussianBlur(12)))
    bg.paste(p, (x, y), p)
    return bg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--foto", required=True); ap.add_argument("--slug", required=True)
    ap.add_argument("--marca", required=True); ap.add_argument("--nome", required=True)
    a = ap.parse_args()
    if not re.fullmatch(r"[a-z0-9-]+", a.slug):
        ap.error("slug só com letras minúsculas, números e hífen")
    quadro(recortar(a.foto)).save(f"assets/img/vitrine/{a.slug}.webp", quality=82, method=6)
    full = Image.open(a.foto).convert("RGB"); full.thumbnail((1200, 1200), Image.LANCZOS)
    full.save(f"assets/img/vitrine/full/{a.slug}.webp", quality=80, method=6)
    dados = "assets/js/vitrine-data.js"; js = open(dados).read()
    linha = f'    {{ slug: "{a.slug}", brand: "{a.marca}", name: {json.dumps(a.nome, ensure_ascii=False)} }}'
    js = js.replace("\n  ],\n};", f",\n{linha}\n  ],\n}};", 1)
    open(dados, "w").write(js)
    print("pronto:", a.slug)


if __name__ == "__main__":
    main()
