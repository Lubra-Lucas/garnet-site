"""Compara um quadro renderizado da pose final com a foto de catálogo.
Uso: python3 verificar/comparar_final.py render.png [saida_prefixo]
Gera: <prefixo>_sobreposicao.png (50/50), <prefixo>_diferenca.png e imprime cores médias dos godês e erro de silhueta."""
import sys, json, os
import numpy as np
from PIL import Image, ImageChops
AQUI = os.path.dirname(os.path.abspath(__file__))
FOTO = os.path.join(AQUI, '..', 'ref', 'catalogo-paleta.webp')
r = Image.open(sys.argv[1]).convert('RGB'); pref = sys.argv[2] if len(sys.argv) > 2 else sys.argv[1][:-4]
W, H = r.size; esc = W / 1024; topo = round(100 * W / 1080)
foto = Image.open(FOTO).convert('RGB').resize((W, round(1536 * esc)), Image.LANCZOS)
fundo = Image.new('RGB', (W, H), (255, 255, 255)); fundo.paste(foto, (0, topo))
Image.blend(fundo, r, 0.5).save(pref + '_sobreposicao.png')
ImageChops.difference(fundo, r).save(pref + '_diferenca.png')
a, b = np.asarray(fundo).astype(float), np.asarray(r).astype(float)
def media(img, cx, cy):
    yy, xx = np.mgrid[0:H, 0:W]
    m = ((xx - cx * esc) / (85 * esc)) ** 2 + ((yy - (cy * esc + topo)) / (68 * esc)) ** 2 < 1
    return img[m].mean(0)
for nome, cx in (('esq', 216.5), ('meio', 512.5), ('dir', 806.5)):
    print(f'godê {nome}: foto {media(a, cx, 888).astype(int)}  render {media(b, cx, 888).astype(int)}')
ma = a.min(2) < 235; mb = b.min(2) < 235
iou = (ma & mb).sum() / max(1, (ma | mb).sum())
print(f'silhueta (não-branco) IoU = {iou:.3f}')
print('estojo (insert):', 'foto', a[round(760*esc)+topo, round(300*esc)].astype(int), 'render', b[round(760*esc)+topo, round(300*esc)].astype(int))
