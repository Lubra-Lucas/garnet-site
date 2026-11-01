"""Especificação única do comercial "Do pó à paleta" (lida pelo construtor e pelos scripts de verificação).

Convenções (valem para todo o projeto):
- Unidade: metro. Z para cima. A FRENTE do produto e das máquinas olha para -Y (lado da câmera).
- 30 fps. Quadro 1 = 0:00.
- Três cenários no mesmo arquivo, afastados entre si (nunca aparecem juntos no quadro):
    A "fabrica"  origem (0, 0, 0)     escala real
    B "micro"    origem (100, 0, 0)   escala ampliada ~1000x (1 m no cenário = ~1 mm real)
    C "estudio"  origem (-100, 0, 0)  escala real, fundo branco de catálogo
- Prefixos de nome:  PROV_ = geometria provisória (será substituída)
                     PROD_ = produto (estojo, godês, tampa)
                     PO_   = pó (fluxos, montes, grãos)
                     CAM_, LUZ_, SET_ = câmeras, luzes, cenário
- Medidas marcadas HIPOTESE vêm da foto + diâmetro do godê suposto em 36 mm (ver verificar/calibracao.json).
"""
import json, math, os

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)

FPS = 30
FRAME_FIM = 840            # 28 s

# ---------------- Produto (a partir da calibração da foto) ----------------
_cal = json.load(open(os.path.join(RAIZ, 'verificar', 'calibracao.json')))
MM = 0.001
GODE_DIAM = _cal['diametro_godê_hipotese'] * MM   # HIPOTESE (pedir medida real)
ESTOJO_W = _cal['W'] * MM                          # HIPOTESE derivada (~120,5 mm)
ESTOJO_D = _cal['D'] * MM                          # HIPOTESE derivada (~52,2 mm)
ESTOJO_H = _cal['H'] * MM                          # HIPOTESE derivada (~11,2 mm, base)
GODE_ESPACO = _cal['s'] * MM                       # distância entre centros dos godês
GODE_PY = _cal['py'] * MM                          # deslocamento dos godês em Y
TAMPA_INCLINACAO = _cal['a']                       # rad além da vertical (abertura ~118°)
TAMPA_ESP = 6 * MM                                 # HIPOTESE: espessura da tampa
GODE_PROF = 3.5 * MM                               # HIPOTESE: profundidade do godê
CANTO_RAIO = 3 * MM                                # HIPOTESE: arredondamento dos cantos

# Câmera final (pose da foto de catálogo)
CAM_FINAL = {
    'elev': _cal['e'], 'dist': _cal['d'] * MM,
    'alvo': (0.0, _cal['Ty'] * MM, _cal['Tz'] * MM),
    'lente_mm': _cal['f_mm_sensor36'], 'sensor_mm': 36.0,
}
# Saída 9:16. A foto (1024x1536) é encaixada pela largura (escala 1080/1024) com o topo em y=100,
# o que deixa a faixa inferior livre para a assinatura da Garnet.
RES = (1080, 1920)
FOTO_TOPO_NA_SAIDA = 100

# ---------------- Cores medidas na foto (sRGB mediana do centro de cada godê) ----------------
# São cores "como fotografadas"; o albedo final será ajustado comparando render x foto (marco M4).
COR = {
    'godê_esq':  '#AE745C',   # marrom fosco
    'godê_meio': '#E8857A',   # coral com brilho  <- COR HEROÍNA (recomendação)
    'godê_dir':  '#E8B8A7',   # champanhe/pêssego com brilho
    'estojo':    '#F2C2C2',   # rosa da base (área iluminada)
    'tampa':     '#F6E4EA',   # acrílico rosado translúcido com glitter
}
HEROI = 'godê_meio'

# ---------------- Cenários ----------------
ORIGEM = {'fabrica': (0.0, 0.0, 0.0), 'micro': (100.0, 0.0, 0.0), 'estudio': (-100.0, 0.0, 0.0)}

# Fábrica (PROVISÓRIO: volumes genéricos; não representam a máquina real da Garnet)
BANCADA_Z = 0.0
RECIPIENTE = {'pos': (-0.28, 0.02, 0.0), 'raio': 0.08, 'altura': 0.14}
TREMONHA = {'pos': (0.0, 0.03, 0.0), 'z_topo': 0.42, 'z_garganta': 0.30, 'raio_topo': 0.08, 'raio_garganta': 0.014}
BICO_Z = 0.105                     # ponta do bico dosador
MOLDE_TOPO_Z = 0.06                # borda do godê no molde = topo da mesa do molde
ESTACAO_X = {'dosagem': 0.0, 'lamina': 0.06, 'prensa': 0.12}

# ---------------- Linha do tempo (quadros) ----------------
T = {
    'c1_inicio': 1,     # recipiente + mão + concha
    'concha_entra': 15, 'concha_mergulha': 40, 'concha_sobe': 70,
    'concha_tremonha': 115, 'despejo_ini': 120, 'despejo_fim': 168,
    'corte1': 190,      # escuro da garganta da tremonha -> micro
    'corte2': 345,      # saída iluminada / nuvem -> dosagem
    'dosagem_ini': 352, 'dosagem_fim': 430,
    'rasagem_ini': 440, 'rasagem_fim': 500,
    'puncao_desce': 515, 'puncao_toca': 538, 'puncao_sobe': 552, 'puncao_topo': 578,
    'ejecao_ini': 585, 'ejecao_fim': 612,
    'corte3': 615,      # close extremo da superfície prensada -> estúdio (corte por correspondência)
    'gode_assenta': 690,
    'pose_final': 760,
    'assinatura': 785,
}
