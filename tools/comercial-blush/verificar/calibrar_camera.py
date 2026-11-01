"""Calibra a câmera da foto de catálogo a partir de pontos marcados à mão.

Modelo: estojo em mm, origem no centro da base (embaixo), -Y = frente (lado da câmera), Z para cima.
Hipótese de escala: o diâmetro visível de cada godê é 36 mm (precisa ser confirmado com a medida real).
Uso: python3 calibrar_camera.py  (só numpy)
"""
import numpy as np, json, math

IMG_W, IMG_H = 1024, 1536          # foto de catálogo enviada
DIAM = 36.0                         # HIPÓTESE: diâmetro visível do godê (mm)

# pontos medidos na foto (pixels) -> função que dá o ponto 3D a partir dos parâmetros
def pontos3d(p):
    W, D, H, s, py, a = p['W'], p['D'], p['H'], p['s'], p['py'], p['a']
    r = DIAM / 2
    tampa = lambda x: (x, D/2 + D*math.sin(a), H + D*math.cos(a))
    return [
        ((-W/2, -D/2, H), (18, 1048)),   # canto frontal-superior esquerdo
        (( W/2, -D/2, H), (1006, 1048)), # canto frontal-superior direito
        ((-W/2,  D/2, H), (55, 718)),    # canto traseiro-superior esquerdo
        (( W/2,  D/2, H), (968, 718)),   # canto traseiro-superior direito
        ((0, -D/2, 0),     (512, 1098)), # base da face frontal, centro
        ((-s, py, H),      (216.5, 888)),# centro godê esquerdo
        ((0, py, H),       (512.5, 888)),# centro godê do meio
        (( s, py, H),      (806.5, 888)),# centro godê direito
        ((-r, py, H),      (370, 888)),  # extremos do godê do meio
        (( r, py, H),      (655, 888)),
        ((0, py + r, H),   (512, 775)),
        ((0, py - r, H),   (512, 1002)),
        (tampa(-W/2),      (33, 335)),   # borda livre da tampa
        (tampa( W/2),      (990, 335)),
    ]

NOMES = ['W','D','H','s','py','a','e','d','f','Ty','Tz']
def unpack(v): return dict(zip(NOMES, v))

def projeta(P, p):
    e, d, f = p['e'], p['d'], p['f']
    T = np.array([0, p['Ty'], p['Tz']])
    C = T + d*np.array([0, -math.cos(e), math.sin(e)])
    fwd = (T - C)/np.linalg.norm(T - C)
    right = np.array([1.0, 0, 0])
    up = np.cross(right, fwd)
    out = []
    for X in P:
        v = np.array(X) - C
        z = v @ fwd
        out.append((IMG_W/2 + f*(v @ right)/z, IMG_H/2 - f*(v @ up)/z))
    return np.array(out)

def residuos(v):
    p = unpack(v)
    pts = pontos3d(p)
    P = [a for a, _ in pts]; obs = np.array([b for _, b in pts])
    return (projeta(P, p) - obs).ravel()

v = np.array([121, 52, 10, 37.5, 0, math.radians(20), math.radians(53), 400, 3100, 0, 15], float)
lam = 1e-3
for it in range(200):
    r = residuos(v); J = np.zeros((len(r), len(v)))
    for i in range(len(v)):
        h = 1e-6*max(1, abs(v[i])); dv = v.copy(); dv[i] += h
        J[:, i] = (residuos(dv) - r)/h
    A = J.T@J; g = J.T@r
    step = np.linalg.solve(A + lam*np.diag(np.diag(A)+1e-9), -g)
    if (residuos(v+step)**2).sum() < (r**2).sum(): v += step; lam *= 0.5
    else: lam *= 4
p = unpack(v); r = residuos(v).reshape(-1, 2)
fmm = p['f']/IMG_W*36
print(json.dumps({k: round(p[k], 3) for k in NOMES}, indent=1))
print(f"elevação {math.degrees(p['e']):.1f}°, tampa inclinada {math.degrees(p['a']):.1f}° além da vertical (abertura {90+math.degrees(p['a']):.1f}°)")
print(f"focal equivalente {fmm:.0f} mm (sensor 36 mm), distância {p['d']:.0f} mm")
print("erro por ponto (px):", np.round(np.hypot(r[:,0], r[:,1]), 1), "RMS", round(float(np.sqrt((r**2).mean())), 2))
json.dump({'unidade': 'mm', 'diametro_godê_hipotese': DIAM, **{k: p[k] for k in NOMES}, 'f_mm_sensor36': fmm},
          open(__file__.replace('calibrar_camera.py', 'calibracao.json'), 'w'), indent=1)
