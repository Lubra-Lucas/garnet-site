"""Ajusta o albedo das 3 cores e do estojo para o render da pose final bater com a foto.
Uso: python3 verificar/calibrar_cores.py render_q0840.png
Lê/grava cena/ajuste_cores.json (multiplicadores lineares RGB por material). Rodar 2-3 vezes (render -> calibrar)."""
import sys, json, os
import numpy as np
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__))
ARQ = os.path.join(AQUI, '..', 'cena', 'ajuste_cores.json')
FOTO = os.path.join(AQUI, '..', 'ref', 'catalogo-paleta.webp')
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
r = Image.open(sys.argv[1]).convert('RGB'); W, H = r.size; esc = W / 1024; topo = round(100 * W / 1080)
foto = Image.open(FOTO).convert('RGB').resize((W, round(1536 * esc)), Image.LANCZOS)
f = np.zeros((H, W, 3)); f[topo:topo + foto.size[1]] = np.asarray(foto)[:H - topo]
b = np.asarray(r).astype(float)
yy, xx = np.mgrid[0:H, 0:W]
def reg_elipse(cx, cy, a, bb): return ((xx - cx * esc) / (a * esc)) ** 2 + ((yy - (cy * esc + topo)) / (bb * esc)) ** 2 < 1
def reg_ret(x0, y0, x1, y1): return (xx >= x0 * esc) & (xx < x1 * esc) & (yy >= y0 * esc + topo) & (yy < y1 * esc + topo)
REG = {'godê_esq': reg_elipse(216.5, 888, 85, 68), 'godê_meio': reg_elipse(512.5, 888, 85, 68),
       'godê_dir': reg_elipse(806.5, 888, 85, 68), 'estojo': reg_ret(370, 1012, 650, 1036)}
aj = json.load(open(ARQ)) if os.path.exists(ARQ) else {}
for k, m in REG.items():
    fl, bl = lin(f[m] / 255).mean(0), lin(b[m] / 255).mean(0)
    fator = np.clip(fl / np.maximum(bl, 1e-4), 0.5, 2.0)
    novo = np.clip(np.array(aj.get(k, [1, 1, 1])) * fator, 0.05, 3.0)
    aj[k] = [round(float(x), 4) for x in novo]
    print(f'{k:10s} foto {np.round(f[m].mean(0)).astype(int)} render {np.round(b[m].mean(0)).astype(int)} -> mult {aj[k]}')
json.dump(aj, open(ARQ, 'w'), indent=1)
