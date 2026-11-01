"""Constrói do zero a cena do animatic no Blender (5.2 LTS) e salva o .blend.

Uso:  blender -b --factory-startup -P cena/construir.py -- [saida.blend]
Tudo é gerado por código (determinístico, sementes fixas). Nenhum arquivo externo além de config.py
e verificar/calibracao.json. Objetos PROV_ são provisórios e serão substituídos no acabamento.
"""
import bpy, bmesh, math, os, sys
import numpy as np
from mathutils import Vector, Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config as C

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SAIDA = ARGS[0] if ARGS else os.path.join(C.RAIZ, 'saida', 'comercial-animatic.blend')
rng = np.random.default_rng(1992)

# ============================================================ utilidades
def limpar():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)

def colecao(nome):
    col = bpy.data.collections.new(nome)
    bpy.context.scene.collection.children.link(col)
    return col

def hex_lin(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

def material(nome, cor, rug=0.5, metal=0.0, trans=0.0, alfa=1.0, emis=0.0, brilho=0.0):
    m = bpy.data.materials.new(nome)
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hex_lin(cor) if isinstance(cor, str) else cor
    b.inputs['Roughness'].default_value = rug
    b.inputs['Metallic'].default_value = metal
    b.inputs['Transmission Weight'].default_value = trans
    b.inputs['Alpha'].default_value = alfa
    b.inputs['Sheen Weight'].default_value = brilho
    if emis:
        b.inputs['Emission Color'].default_value = hex_lin(cor) if isinstance(cor, str) else cor
        b.inputs['Emission Strength'].default_value = emis
    m.diffuse_color = hex_lin(cor) if isinstance(cor, str) else cor
    return m

def objeto(nome, bm, col, mat=None, suave=False):
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    if suave: me.shade_smooth()
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    if mat: me.materials.append(mat)
    return ob

def caixa(nome, tam, pos, col, mat=None, chanfro=0.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * tam[0], v.co.y * tam[1], v.co.z * tam[2]))
    ob = objeto(nome, bm, col, mat); ob.location = pos
    if chanfro:
        md = ob.modifiers.new('chanfro', 'BEVEL'); md.width = chanfro; md.segments = 3
        md.limit_method = 'ANGLE'
    return ob

def cilindro(nome, r1, r2, h, pos, col, mat=None, tampas=True, lados=48, suave=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=tampas, cap_tris=False, segments=lados, radius1=r1, radius2=r2, depth=h)
    ob = objeto(nome, bm, col, mat, suave); ob.location = pos
    return ob

def gode_metal(nome, pos, col):
    """Godê de alumínio: parede fina aberta em cima + fundo (o pó fica visível dentro)."""
    r = C.GODE_DIAM / 2 + 0.0003
    g = cilindro(nome, r, r, C.GODE_PROF, pos, col, M['aluminio'], tampas=False, lados=96)
    g.modifiers.new('parede', 'SOLIDIFY').thickness = 0.0003
    f = cilindro(nome + '_fundo', r, r, 0.0003, (0, 0, -C.GODE_PROF / 2 + 0.00015), col, M['aluminio'], lados=96)
    f.parent = g
    return g

def vazio(nome, pos, col):
    ob = bpy.data.objects.new(nome, None); ob.location = pos; col.objects.link(ob); return ob

def chave(ob, f, **props):
    for k, v in props.items():
        setattr(ob, k, v); ob.keyframe_insert(k, frame=f)

def visivel(ob, de, ate):
    """Objeto aparece no render só entre os quadros de..ate."""
    for f, h in ((1, de > 1), (de, False), (ate + 1, True)):
        ob.hide_render = h; ob.keyframe_insert('hide_render', frame=f)
        ob.hide_viewport = h; ob.keyframe_insert('hide_viewport', frame=f)

def interp_linear(ativo=True):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR' if ativo else 'BEZIER'

def modificador_gn(ob, grupo, **valores):
    """Aplica uma cópia do grupo com os valores gravados como padrão das entradas
    (no Blender 5.2 os valores do modificador não são atribuíveis por script de forma estável)."""
    g = grupo.copy(); g.name = f'{grupo.name}__{ob.name}'
    for it in g.interface.items_tree:
        if getattr(it, 'in_out', None) == 'INPUT' and it.name in valores:
            v = valores[it.name]
            it.default_value = tuple(float(x) for x in v) if isinstance(v, (Vector, tuple, list)) else v
    md = ob.modifiers.new(grupo.name, 'NODES'); md.node_group = g
    return md

def malha_pontos(nome, n, attrs, col):
    """Malha só de vértices com atributos por ponto (usada pelos geradores de pó)."""
    me = bpy.data.meshes.new(nome); me.vertices.add(n)
    for nm, arr in attrs.items():
        arr = np.asarray(arr, dtype=np.float32)
        if arr.ndim == 1:
            a = me.attributes.new(nm, 'FLOAT', 'POINT'); a.data.foreach_set('value', arr)
        else:
            a = me.attributes.new(nm, 'FLOAT_VECTOR', 'POINT'); a.data.foreach_set('vector', arr.ravel())
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    return ob

# ============================================================ grupos de Geometry Nodes
def _no(ng, tipo, x=0, **props):
    n = ng.nodes.new(tipo); n.location = (x, 0)
    for k, v in props.items(): setattr(n, k, v)
    return n

def grupo_fluxo():
    """Fluxo de pó caindo: cada ponto nasce no quadro 'emit' e percorre P0 -> P0+Dir em 'Queda' quadros
    (aceleração: s^2). Abertura do jato varia de R0 a R1. Renderizado como nuvem de pontos."""
    ng = bpy.data.node_groups.new('PO_fluxo', 'GeometryNodeTree')
    io = ng.interface
    io.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    for nm, t in (('P0', 'NodeSocketVector'), ('Dir', 'NodeSocketVector'), ('Queda', 'NodeSocketFloat'),
                  ('R0', 'NodeSocketFloat'), ('R1', 'NodeSocketFloat'), ('Material', 'NodeSocketMaterial')):
        io.new_socket(nm, in_out='INPUT', socket_type=t)
    io.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    L = ng.links.new
    gi = _no(ng, 'NodeGroupInput'); go = _no(ng, 'NodeGroupOutput', 1600)
    tempo = _no(ng, 'GeometryNodeInputSceneTime')
    emit = _no(ng, 'GeometryNodeInputNamedAttribute', data_type='FLOAT'); emit.inputs['Name'].default_value = 'emit'
    jit = _no(ng, 'GeometryNodeInputNamedAttribute', data_type='FLOAT_VECTOR'); jit.inputs['Name'].default_value = 'jit'
    rad = _no(ng, 'GeometryNodeInputNamedAttribute', data_type='FLOAT'); rad.inputs['Name'].default_value = 'rad'
    sub = _no(ng, 'ShaderNodeMath', operation='SUBTRACT'); L(tempo.outputs['Frame'], sub.inputs[0]); L(emit.outputs['Attribute'], sub.inputs[1])
    s = _no(ng, 'ShaderNodeMath', operation='DIVIDE'); L(sub.outputs[0], s.inputs[0]); L(gi.outputs['Queda'], s.inputs[1])
    s2 = _no(ng, 'ShaderNodeMath', operation='MULTIPLY'); L(s.outputs[0], s2.inputs[0]); L(s.outputs[0], s2.inputs[1])
    dpos = _no(ng, 'ShaderNodeVectorMath', operation='SCALE'); L(gi.outputs['Dir'], dpos.inputs[0]); L(s2.outputs[0], dpos.inputs['Scale'])
    base = _no(ng, 'ShaderNodeVectorMath', operation='ADD'); L(gi.outputs['P0'], base.inputs[0]); L(dpos.outputs[0], base.inputs[1])
    dr = _no(ng, 'ShaderNodeMath', operation='SUBTRACT'); L(gi.outputs['R1'], dr.inputs[0]); L(gi.outputs['R0'], dr.inputs[1])
    rr = _no(ng, 'ShaderNodeMath', operation='MULTIPLY_ADD'); L(s.outputs[0], rr.inputs[0]); L(dr.outputs[0], rr.inputs[1]); L(gi.outputs['R0'], rr.inputs[2])
    js = _no(ng, 'ShaderNodeVectorMath', operation='SCALE'); L(jit.outputs['Attribute'], js.inputs[0]); L(rr.outputs[0], js.inputs['Scale'])
    pos = _no(ng, 'ShaderNodeVectorMath', operation='ADD'); L(base.outputs[0], pos.inputs[0]); L(js.outputs[0], pos.inputs[1])
    sp = _no(ng, 'GeometryNodeSetPosition'); L(gi.outputs['Geometry'], sp.inputs['Geometry']); L(pos.outputs[0], sp.inputs['Position'])
    lt = _no(ng, 'ShaderNodeMath', operation='LESS_THAN'); L(s.outputs[0], lt.inputs[0]); lt.inputs[1].default_value = 0.0
    gt = _no(ng, 'ShaderNodeMath', operation='GREATER_THAN'); L(s.outputs[0], gt.inputs[0]); gt.inputs[1].default_value = 1.0
    fora = _no(ng, 'ShaderNodeMath', operation='ADD'); L(lt.outputs[0], fora.inputs[0]); L(gt.outputs[0], fora.inputs[1])
    dl = _no(ng, 'GeometryNodeDeleteGeometry', domain='POINT'); L(sp.outputs[0], dl.inputs['Geometry']); L(fora.outputs[0], dl.inputs['Selection'])
    mp = _no(ng, 'GeometryNodeMeshToPoints'); L(dl.outputs[0], mp.inputs['Mesh']); L(rad.outputs['Attribute'], mp.inputs['Radius'])
    sm = _no(ng, 'GeometryNodeSetMaterial'); L(mp.outputs[0], sm.inputs['Geometry']); L(gi.outputs['Material'], sm.inputs['Material'])
    L(sm.outputs[0], go.inputs[0])
    return ng

def grupo_graos():
    """Grãos irregulares instanciados (cenário micro). Caem 'Queda' m por quadro a partir de F0."""
    ng = bpy.data.node_groups.new('PO_graos', 'GeometryNodeTree')
    io = ng.interface
    io.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    for nm, t in (('Grao', 'NodeSocketObject'), ('Material', 'NodeSocketMaterial'),
                  ('Queda', 'NodeSocketFloat'), ('F0', 'NodeSocketFloat')):
        io.new_socket(nm, in_out='INPUT', socket_type=t)
    io.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    L = ng.links.new
    gi = _no(ng, 'NodeGroupInput'); go = _no(ng, 'NodeGroupOutput', 1400)
    oi = _no(ng, 'GeometryNodeObjectInfo'); L(gi.outputs['Grao'], oi.inputs['Object'])
    sm = _no(ng, 'GeometryNodeSetMaterial'); L(oi.outputs['Geometry'], sm.inputs['Geometry']); L(gi.outputs['Material'], sm.inputs['Material'])
    rot = _no(ng, 'GeometryNodeInputNamedAttribute', data_type='FLOAT_VECTOR'); rot.inputs['Name'].default_value = 'rot'
    sc = _no(ng, 'GeometryNodeInputNamedAttribute', data_type='FLOAT_VECTOR'); sc.inputs['Name'].default_value = 'sc'
    rad = _no(ng, 'GeometryNodeInputNamedAttribute', data_type='FLOAT'); rad.inputs['Name'].default_value = 'rad'
    esc = _no(ng, 'ShaderNodeVectorMath', operation='SCALE'); L(sc.outputs['Attribute'], esc.inputs[0]); L(rad.outputs['Attribute'], esc.inputs['Scale'])
    eu = _no(ng, 'FunctionNodeEulerToRotation'); L(rot.outputs['Attribute'], eu.inputs[0])
    iop = _no(ng, 'GeometryNodeInstanceOnPoints'); L(gi.outputs['Geometry'], iop.inputs['Points'])
    L(sm.outputs[0], iop.inputs['Instance']); L(eu.outputs[0], iop.inputs['Rotation']); L(esc.outputs[0], iop.inputs['Scale'])
    tempo = _no(ng, 'GeometryNodeInputSceneTime')
    d = _no(ng, 'ShaderNodeMath', operation='SUBTRACT'); L(tempo.outputs['Frame'], d.inputs[0]); L(gi.outputs['F0'], d.inputs[1])
    q = _no(ng, 'ShaderNodeMath', operation='MULTIPLY'); L(d.outputs[0], q.inputs[0]); L(gi.outputs['Queda'], q.inputs[1])
    neg = _no(ng, 'ShaderNodeMath', operation='MULTIPLY'); L(q.outputs[0], neg.inputs[0]); neg.inputs[1].default_value = -1.0
    cxyz = _no(ng, 'ShaderNodeCombineXYZ'); L(neg.outputs[0], cxyz.inputs['Z'])
    tr = _no(ng, 'GeometryNodeTranslateInstances'); L(iop.outputs[0], tr.inputs['Instances']); L(cxyz.outputs[0], tr.inputs['Translation'])
    L(tr.outputs[0], go.inputs[0])
    return ng

def criar_fluxo(nome, col, n, f0, f1, p0, p1, queda, r0, r1, grao, mat, raio_mm=None):
    """Fluxo entre os quadros f0..f1 de p0 a p1 (metros, coordenadas do mundo)."""
    u = rng.random(n)
    ang = rng.random(n) * 2 * math.pi; rr = np.sqrt(rng.random(n))
    jit = np.stack([np.cos(ang) * rr, np.sin(ang) * rr, (rng.random(n) - 0.5) * 0.6], 1)
    rad = grao * (0.5 + rng.random(n))
    ob = malha_pontos(nome, n, {'emit': f0 + u * (f1 - f0), 'jit': jit, 'rad': rad}, col)
    p0 = Vector(p0); d = Vector(p1) - p0
    modificador_gn(ob, GN_FLUXO, P0=p0, Dir=d, Queda=float(queda), R0=r0, R1=r1, Material=mat)
    return ob

# ============================================================ cena
limpar()
cena = bpy.context.scene
cena.render.fps = C.FPS; cena.frame_start = 1; cena.frame_end = C.FRAME_FIM
mundo = bpy.data.worlds.new('MUNDO'); cena.world = mundo
mundo.node_tree.nodes['Background'].inputs['Color'].default_value = (0.0, 0.0, 0.0, 1)

GN_FLUXO = grupo_fluxo(); GN_GRAOS = grupo_graos()
CA, CB, CC = colecao('SET_A_fabrica'), colecao('SET_B_micro'), colecao('SET_C_estudio')
CCAM = colecao('CAMERAS')

# ---------- materiais
M = {
    'inox': material('MAT_inox', '#B9BDC1', rug=0.32, metal=1.0),
    'inox_escuro': material('MAT_inox_escuro', '#3A3D40', rug=0.45, metal=1.0),
    'parede': material('MAT_PROV_parede', '#B9BAB8', rug=0.9),
    'piso': material('MAT_PROV_piso', '#B8BAB8', rug=0.6),
    'pead': material('MAT_PROV_recipiente', '#EDEDEA', rug=0.55),
    'luva': material('MAT_PROV_luva_nitrilica', '#3F6FD8', rug=0.45, brilho=0.3),
    'jaleco': material('MAT_PROV_jaleco', '#F4F4F2', rug=0.9),
    'cinza': material('MAT_PROV_volume_maquina', '#8C8F92', rug=0.5, metal=0.6),
    'aluminio': material('MAT_godê_aluminio', '#C9C6C0', rug=0.3, metal=1.0),
    'estojo': material('MAT_estojo_rosa', C.COR['estojo'], rug=0.35),
    'tampa': material('MAT_tampa_acrilico', C.COR['tampa'], rug=0.08, trans=0.92),
    'fundo': material('MAT_fundo_estudio', '#FFFFFF', emis=1.0),
    'piso_estudio': material('MAT_piso_estudio', '#FFFFFF', rug=0.8),
    'saida_luz': material('MAT_saida_luz', '#FFF4EC', emis=40.0),
    'parede_micro': material('MAT_parede_translucida', '#F3E6E2', rug=0.35, trans=0.85),
    'peneira': material('MAT_peneira', '#D9D4CF', rug=0.25, metal=1.0),
}
# multiplicadores de albedo calibrados contra a foto (verificar/calibrar_cores.py)
_AJ = os.path.join(C.AQUI, 'ajuste_cores.json')
AJUSTE = __import__('json').load(open(_AJ)) if os.path.exists(_AJ) else {}
def cor_aj(k):
    c = hex_lin(C.COR[k]); m = AJUSTE.get(k, [1, 1, 1])
    return tuple(min(1.0, c[i] * m[i]) for i in range(3)) + (1.0,)
for k in ('godê_esq', 'godê_meio', 'godê_dir'):
    M['po_' + k] = material('MAT_po_' + k, cor_aj(k), rug=0.85, brilho=0.4)
M['estojo'] = material('MAT_estojo_rosa', cor_aj('estojo'), rug=0.35)
POH = M['po_' + C.HEROI]
# fundo do estúdio: branco puro para a câmera, mas fraco em reflexos (não "lava" o produto)
_nt = M['fundo'].node_tree; _b = _nt.nodes['Principled BSDF']
_lp = _nt.nodes.new('ShaderNodeLightPath'); _mx = _nt.nodes.new('ShaderNodeMapRange')
_nt.links.new(_lp.outputs['Is Camera Ray'], _mx.inputs['Value'])
_mx.inputs['To Min'].default_value = 0.35; _mx.inputs['To Max'].default_value = 1.6
_nt.links.new(_mx.outputs[0], _b.inputs['Emission Strength'])
_b.inputs['Base Color'].default_value = (0, 0, 0, 1)

# pó do herói com troca solto -> prensado (valor 'prensado' animado no material)
M['po_heroi_monte'] = material('MAT_po_heroi_monte', cor_aj(C.HEROI), rug=0.9, brilho=0.5)
_nt = M['po_heroi_monte'].node_tree
_val = _nt.nodes.new('ShaderNodeValue'); _val.name = 'prensado'; _val.outputs[0].default_value = 0.0
_mr = _nt.nodes.new('ShaderNodeMapRange')
_nt.links.new(_val.outputs[0], _mr.inputs['Value']); _mr.inputs['To Min'].default_value = 0.92; _mr.inputs['To Max'].default_value = 0.55
_nt.links.new(_mr.outputs[0], _nt.nodes['Principled BSDF'].inputs['Roughness'])

# ============================================================ CENÁRIO A — fábrica (escala real)
# sala provisória (caixa com normais para dentro)
sala = caixa('PROV_sala', (6, 6, 3), (0, 0, 0.6), CA, M['parede'])
sala.data.flip_normals()
caixa('PROV_piso', (6, 6, 0.02), (0, 0, -0.91), CA, M['piso'])
for i, x in enumerate((-1.2, 0.0, 1.2)):
    caixa(f'LUZ_teto_{i}', (0.15, 2.4, 0.02), (x, 0.3, 2.08), CA, material(f'MAT_teto_{i}', '#FFFFFF', emis=2.0))
caixa('SET_bancada', (1.2, 0.7, 0.04), (0, 0, -0.02), CA, M['inox'], chanfro=0.004)
caixa('SET_bancada_pe', (1.1, 0.6, 0.86), (0, 0, -0.47), CA, M['inox_escuro'])

# recipiente com o granel do tom herói (forma provisória: pote cilíndrico aberto)
rp = C.RECIPIENTE
pote = cilindro('PROV_recipiente', rp['raio'], rp['raio'], rp['altura'],
                (rp['pos'][0], rp['pos'][1], rp['altura'] / 2), CA, M['pead'], tampas=False)
pote.modifiers.new('espessura', 'SOLIDIFY').thickness = 0.004
cilindro('PROV_recipiente_fundo', rp['raio'], rp['raio'], 0.004, (rp['pos'][0], rp['pos'][1], 0.002), CA, M['pead'])
bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=64, radius=rp['raio'] - 0.004)
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=6, use_grid_fill=True)
for v in bm.verts:
    r = v.co.length / rp['raio']; v.co.z = 0.004 * math.cos(v.co.x * 90) * math.sin(v.co.y * 70) + 0.006 * (1 - r * r)
po_pote = objeto('PO_granel_recipiente', bm, CA, POH, suave=True)
po_pote.location = (rp['pos'][0], rp['pos'][1], 0.11)

# mão de luva + concha (PROVISÓRIO: mão sem dedos articulados; só punho e mão parcial)
rig = vazio('PROV_mao_rig', (0.10, -0.02, 0.40), CA)
concha = cilindro('PROV_concha', 0.026, 0.026, 0.022, (0, 0, 0), CA, M['inox'], lados=32)
concha.parent = rig
cabo = caixa('PROV_concha_cabo', (0.12, 0.012, 0.006), (0.085, 0, 0.004), CA, M['inox'], chanfro=0.002); cabo.parent = rig
po_concha = cilindro('PO_concha', 0.024, 0.016, 0.014, (0, 0, 0.016), CA, POH); po_concha.parent = rig
palma = caixa('PROV_mao_palma', (0.07, 0.085, 0.03), (0.165, 0, 0.012), CA, M['luva'], chanfro=0.012); palma.parent = rig
for i in range(4):
    dedo = cilindro(f'PROV_mao_dedo_{i}', 0.009, 0.008, 0.05, (0.13, -0.03 + i * 0.02, -0.006), CA, M['luva'], lados=16)
    dedo.rotation_euler = (0, math.radians(80), 0); dedo.parent = rig
manga = cilindro('PROV_mao_punho_jaleco', 0.032, 0.035, 0.12, (0.25, 0, 0.02), CA, M['jaleco'], lados=24)
manga.rotation_euler = (0, math.radians(80), 0); manga.parent = rig

R0x, R0y = rp['pos'][0], rp['pos'][1]
t = C.T
chave(rig, 1, location=(0.12, -0.02, 0.42), rotation_euler=(0, 0, 0))
chave(rig, t['concha_entra'], location=(-0.14, 0.0, 0.30))
chave(rig, t['concha_mergulha'], location=(R0x, R0y, 0.118), rotation_euler=(math.radians(-12), 0, 0))
chave(rig, t['concha_sobe'], location=(R0x + 0.02, R0y, 0.24), rotation_euler=(0, 0, 0))
chave(rig, t['concha_tremonha'], location=(-0.035, 0.03, 0.465))
chave(rig, t['despejo_ini'], rotation_euler=(0, 0, 0))
chave(rig, t['despejo_ini'] + 18, rotation_euler=(math.radians(-75), 0, 0))
chave(rig, t['despejo_fim'], location=(-0.035, 0.03, 0.465), rotation_euler=(math.radians(-80), 0, 0))
chave(rig, t['despejo_fim'] + 20, location=(0.05, -0.05, 0.62), rotation_euler=(math.radians(-20), 0, 0))
visivel(po_concha, t['concha_mergulha'] - 2, t['despejo_ini'] + 30)
chave(po_concha, t['despejo_ini'] + 8, scale=(1, 1, 1)); chave(po_concha, t['despejo_ini'] + 30, scale=(0.3, 0.3, 0.1))

# tremonha + alimentador + bico (PROVISÓRIO: volumes genéricos, não é a máquina da Garnet)
tm = C.TREMONHA; hx, hy = tm['pos'][0], tm['pos'][1]
cone = cilindro('PROV_tremonha', tm['raio_garganta'], tm['raio_topo'], tm['z_topo'] - tm['z_garganta'],
                (hx, hy, (tm['z_topo'] + tm['z_garganta']) / 2), CA, M['inox'], tampas=False, lados=64)
cone.modifiers.new('espessura', 'SOLIDIFY').thickness = 0.002
tubo = cilindro('PROV_alimentador', tm['raio_garganta'], tm['raio_garganta'], tm['z_garganta'] - 0.14,
                (hx, hy, (tm['z_garganta'] + 0.14) / 2), CA, M['inox_escuro'], tampas=False)
tubo.modifiers.new('espessura', 'SOLIDIFY').thickness = 0.002
# curva do alimentador até o bico sobre a estação de dosagem
bico = cilindro('PROV_bico_dosador', 0.012, 0.006, 0.035, (0.0, 0.0, C.BICO_Z + 0.0175), CA, M['inox'], tampas=False)
caixa('PROV_alimentador_curva', (0.02, 0.035, 0.02), (0.0, 0.015, 0.145), CA, M['inox_escuro'], chanfro=0.006)
caixa('PROV_suporte_tremonha', (0.02, 0.02, 0.46), (-0.11, 0.12, 0.23), CA, M['cinza'])
caixa('PROV_braco_tremonha', (0.12, 0.02, 0.02), (-0.05, 0.12, 0.33), CA, M['cinza'])

# trilho + mesa do molde (move da dosagem para a prensa) + godê herói com o pó
caixa('PROV_trilho', (0.30, 0.10, 0.03), (0.06, 0, 0.015), CA, M['cinza'], chanfro=0.002)
caixa('PROV_bandeja_coletora', (0.05, 0.14, 0.008), (C.ESTACAO_X['lamina'], 0, 0.004), CA, M['inox_escuro'])
mesa = vazio('PROV_mesa_molde_rig', (C.ESTACAO_X['dosagem'], 0, C.MOLDE_TOPO_Z), CA)
R = C.GODE_DIAM / 2
placa = caixa('PROV_mesa_molde', (0.07, 0.07, 0.03), (0, 0, -0.015), CA, M['inox'], chanfro=0.0015)
furo = cilindro('PROV_furo_molde', R + 0.0008, R + 0.0008, 0.02, (0, 0, -0.005), CA, lados=64)
furo.hide_render = True; furo.hide_viewport = True; furo.parent = mesa
bo = placa.modifiers.new('furo', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = furo; bo.solver = 'EXACT'
placa.parent = mesa
ejetor = vazio('PROV_ejetor', (0, 0, 0), CA); ejetor.parent = mesa
gode = gode_metal('PROD_godê_heroi_A', (0, 0, -C.GODE_PROF / 2), CA)
gode.parent = ejetor
# disco de pó com chaves de forma: vazio -> monte -> rasado (varredura) -> prensado
NR, NS = 28, 72
bm = bmesh.new(); vs = []
centro = bm.verts.new((0, 0, 0)); aneis = []
for i in range(1, NR + 1):
    rr = 1.25 * R * i / NR; anel = []
    for j in range(NS):
        a = 2 * math.pi * j / NS; anel.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), 0)))
    aneis.append(anel)
for j in range(NS):
    bm.faces.new((centro, aneis[0][j], aneis[0][(j + 1) % NS]))
for i in range(NR - 1):
    for j in range(NS):
        bm.faces.new((aneis[i][j], aneis[i + 1][j], aneis[i + 1][(j + 1) % NS], aneis[i][(j + 1) % NS]))
disco = objeto('PO_monte_heroi', bm, CA, M['po_heroi_monte'], suave=True); disco.parent = ejetor
co = np.array([v.co[:] for v in disco.data.vertices]); xr, yr = co[:, 0], co[:, 1]; rr = np.hypot(xr, yr)
FUNDO, OCULTO = -C.GODE_PROF + 0.0004, -0.002
ruido = 0.00035 * np.sin(xr * 2300 + 1.3) * np.cos(yr * 1900) + 0.0002 * np.sin(xr * 5100 + yr * 4300)
def monte(alt, alc):
    z = alt * np.clip(1 - (rr / alc) ** 2, 0, None) ** 0.8 + ruido * (alt > 0.001)
    dentro = rr <= R
    return np.where(dentro, FUNDO + z, np.where(z + FUNDO > 0.0002, z + FUNDO, OCULTO))
base = np.where(rr <= R, FUNDO, OCULTO)
disco.shape_key_add(name='Basis')
disco.data.shape_keys.key_blocks['Basis'].data.foreach_set('co', np.stack([xr, yr, base], 1).ravel().astype(np.float32))
formas = {}
for nome, alt, alc in (('monte_1', 0.0025, 0.55 * R), ('monte_2', 0.0055, 0.9 * R), ('monte_3', 0.0085, 1.2 * R)):
    formas[nome] = monte(alt, alc)
zm = formas['monte_3']
xs_lamina = np.linspace(1.15 * R, -1.15 * R, 6)     # a mesa anda para +X: a lâmina varre o godê de +X para -X
for k, xb in enumerate(xs_lamina):
    z = np.where(xr >= xb, np.where(rr <= R, np.minimum(zm, -0.0001), OCULTO), zm)
    formas[f'rasado_{k}'] = z
formas['prensado'] = np.where(rr <= R, -0.0006, OCULTO)
for nome, z in formas.items():
    kb = disco.shape_key_add(name=nome, from_mix=False)
    kb.data.foreach_set('co', np.stack([xr, yr, z], 1).ravel().astype(np.float32))

# fluxo da dosagem (bico -> godê)
criar_fluxo('PO_fluxo_dosagem', CA, 26000, t['dosagem_ini'], t['dosagem_fim'],
            (0, 0, C.BICO_Z), (0, 0, C.MOLDE_TOPO_Z + 0.003), 7, 0.0022, 0.0045, 0.00018, POH)
# fluxo do despejo (concha -> tremonha)
criar_fluxo('PO_fluxo_despejo', CA, 30000, t['despejo_ini'] + 10, t['despejo_fim'],
            (-0.035, 0.012, 0.455), (-0.025, 0.02, tm['z_garganta']), 9, 0.004, 0.012, 0.0003, POH)
d0, d1 = t['dosagem_ini'] + 6, t['dosagem_fim']
# posição da mesa (linear): dosagem -> prensa entre rasagem_ini e rasagem_fim
interp_linear(True)
chave(mesa, t['rasagem_ini'], location=(C.ESTACAO_X['dosagem'], 0, C.MOLDE_TOPO_Z))
chave(mesa, t['rasagem_fim'], location=(C.ESTACAO_X['prensa'], 0, C.MOLDE_TOPO_Z))
interp_linear(False)
vel = (C.ESTACAO_X['prensa'] - C.ESTACAO_X['dosagem']) / (t['rasagem_fim'] - t['rasagem_ini'])
def quadro_mesa(xg): return t['rasagem_ini'] + (xg - C.ESTACAO_X['dosagem']) / vel
seq = [('monte_1', d0), ('monte_1', d0 + 1), ('monte_2', (d0 + d1) // 2), ('monte_3', d1)]
for k, xb in enumerate(xs_lamina):
    seq.append((f'rasado_{k}', round(quadro_mesa(C.ESTACAO_X['lamina'] - xb))))
seq += [(f'rasado_{len(xs_lamina) - 1}', t['puncao_toca'] - 4), ('prensado', t['puncao_toca'])]
kbs = disco.data.shape_keys.key_blocks
for nome in formas: kbs[nome].value = 0.0; kbs[nome].keyframe_insert('value', frame=1)
for nome, f in seq:
    for outro in formas:
        kbs[outro].value = 1.0 if outro == nome else 0.0; kbs[outro].keyframe_insert('value', frame=f)
_val.outputs[0].default_value = 0.0; _val.outputs[0].keyframe_insert('default_value', frame=t['puncao_toca'] - 1)
_val.outputs[0].default_value = 1.0; _val.outputs[0].keyframe_insert('default_value', frame=t['puncao_toca'])

# lâmina niveladora e excesso caindo dos dois lados
xl = C.ESTACAO_X['lamina']
caixa('PROV_lamina', (0.003, 0.09, 0.025), (xl, 0, C.MOLDE_TOPO_Z + 0.0125 + 0.0001), CA, M['inox'], chanfro=0.0005)
caixa('PROV_lamina_suporte', (0.012, 0.012, 0.06), (xl, 0.05, C.MOLDE_TOPO_Z + 0.04), CA, M['cinza'])
fx0, fx1 = round(quadro_mesa(xl - 1.15 * R)), round(quadro_mesa(xl + 1.15 * R))
for lado in (-1, 1):
    criar_fluxo(f'PO_excesso_{"frente" if lado < 0 else "fundo"}', CA, 6000, fx0, fx1,
                (xl - 0.004, lado * 0.036, C.MOLDE_TOPO_Z + 0.002), (xl - 0.006, lado * 0.04, 0.009), 10, 0.003, 0.005, 0.00018, POH)

# prensa: cabeçote, colunas e punção
xp = C.ESTACAO_X['prensa']
for dx in (-0.055, 0.055):
    cilindro(f'PROV_coluna_{"e" if dx < 0 else "d"}', 0.008, 0.008, 0.32, (xp + dx, 0.03, 0.19), CA, M['inox'])
caixa('PROV_cabecote', (0.13, 0.08, 0.05), (xp, 0.02, 0.33), CA, M['cinza'], chanfro=0.004)
puncao_rig = vazio('PROV_puncao_rig', (xp, 0, 0.16), CA)
haste = cilindro('PROV_puncao_haste', 0.01, 0.01, 0.16, (0, 0, 0.08), CA, M['inox']); haste.parent = puncao_rig
pun = cilindro('PROV_puncao', R - 0.0002, R - 0.0002, 0.02, (0, 0, 0.01), CA, M['inox'], lados=64); pun.parent = puncao_rig
zt = C.MOLDE_TOPO_Z - 0.0006
chave(puncao_rig, 1, location=(xp, 0, 0.16))
chave(puncao_rig, t['puncao_desce'], location=(xp, 0, 0.16))
chave(puncao_rig, t['puncao_toca'], location=(xp, 0, zt))
chave(puncao_rig, t['puncao_sobe'], location=(xp, 0, zt))
chave(puncao_rig, t['puncao_topo'], location=(xp, 0, 0.16))
chave(puncao_rig, t['ejecao_ini'] + 5, location=(xp, 0, 0.24))
# ejeção do godê (sobe 15 mm)
chave(ejetor, t['ejecao_ini'], location=(0, 0, 0)); chave(ejetor, t['ejecao_fim'], location=(0, 0, 0.015))

# nuvem de pigmento na saída (corte 2): volume que se dissipa
nuvem = caixa('PO_nuvem_corte2', (0.07, 0.07, 0.05), (0, -0.015, 0.09), CA)
mv = bpy.data.materials.new('MAT_nuvem');
try: mv.use_nodes = True
except Exception: pass
nt = mv.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
vol = nt.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Color'].default_value = hex_lin('#F6C9C2')
nt.links.new(vol.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
nuvem.data.materials.append(mv)
vol.inputs['Density'].default_value = 900.0; vol.inputs['Density'].keyframe_insert('default_value', frame=t['corte2'])
vol.inputs['Density'].default_value = 0.0; vol.inputs['Density'].keyframe_insert('default_value', frame=t['corte2'] + 26)
visivel(nuvem, t['corte2'], t['corte2'] + 27)

# luzes da fábrica (luz principal sempre do alto à esquerda)
def luz_area(nome, pos, alvo, potencia, tam, col, cor=(1, 1, 1)):
    ld = bpy.data.lights.new(nome, 'AREA'); ld.energy = potencia; ld.size = tam; ld.color = cor
    ob = bpy.data.objects.new(nome, ld); ob.location = pos; col.objects.link(ob)
    d = Vector(alvo) - Vector(pos); ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return ob
luz_area('LUZ_A_chave', (-0.55, -0.45, 0.85), (0.0, 0, 0.15), 70, 0.7, CA, (1.0, 0.97, 0.93))
luz_area('LUZ_A_preenchimento', (0.7, -0.6, 0.4), (0.05, 0, 0.1), 12, 1.0, CA)
luz_area('LUZ_A_contra', (0.1, 0.6, 0.5), (0.05, 0, 0.1), 30, 0.4, CA)
luz_area('LUZ_A_macro_rasante', (-0.25, -0.12, 0.09), (0.06, 0, 0.065), 1.5, 0.08, CA, (1.0, 0.96, 0.9))

# ============================================================ CENÁRIO B — micro (ampliação ~1000x)
OB = Vector(C.ORIGEM['micro'])
def grao_base(nome, semente):
    g = np.random.default_rng(semente)
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    for v in bm.verts: v.co *= 0.75 + 0.5 * g.random()
    ob = objeto(nome, bm, CB, suave=False); ob.location = OB + Vector((0, 0, 50))
    ob.hide_render = True; ob.hide_viewport = True
    return ob
GRAO = grao_base('PO_grao_base', 7)

def nuvem_graos(nome, cx, raio, n, mat, corredor=0.0):
    g = np.random.default_rng(abs(hash(nome)) % 10000)
    ang = g.random(n) * 2 * math.pi; r = raio * np.sqrt(g.random(n))
    if corredor: r = np.where(r < corredor, corredor + g.random(n) * 0.2, r)
    z = g.uniform(-50, 10, n)
    pos = np.stack([cx + r * np.cos(ang), r * np.sin(ang), z], 1)
    rad = np.exp(g.uniform(math.log(0.0025), math.log(0.012), n))
    ob = malha_pontos(nome, n, {'rot': g.random((n, 3)) * 6.283, 'sc': 0.7 + 0.6 * g.random((n, 3)), 'rad': rad}, CB)
    ob.data.vertices.foreach_set('co', pos.ravel().astype(np.float32)); ob.location = OB
    modificador_gn(ob, GN_GRAOS, Grao=GRAO, Material=mat, Queda=0.06, F0=float(t['corte1']))
    return ob
nuvem_graos('PO_graos_heroi', 0.0, 1.45, 260000, POH, corredor=0.10)
nuvem_graos('PO_graos_esq', -2.7, 0.9, 80000, M['po_godê_esq'])
nuvem_graos('PO_graos_dir', 2.7, 0.9, 80000, M['po_godê_dir'])
for nm, cx, r in (('SET_B_canal_heroi', 0.0, 1.6), ('SET_B_canal_esq', -2.7, 1.0), ('SET_B_canal_dir', 2.7, 1.0)):
    tb = cilindro(nm, r, r, 62, OB + Vector((cx, 0, -21)), CB, M['parede_micro'], tampas=False, lados=96)
# peneira (malha) atravessada pela câmera
bm = bmesh.new()
for k in range(-6, 6):
    off = (k + 0.5) * 0.25
    if abs(off) >= 1.58: continue
    meia = math.sqrt(1.6 ** 2 - off ** 2)
    for eixo in (0, 1):
        tam = (meia * 2, 0.016, 0.016) if eixo == 0 else (0.016, meia * 2, 0.016)
        res = bmesh.ops.create_cube(bm, size=1.0)
        for v in res['verts']:
            v.co = Vector((v.co.x * tam[0] + (0 if eixo == 0 else off), v.co.y * tam[1] + (off if eixo == 0 else 0), v.co.z * tam[2]))
pen = objeto('SET_B_peneira', bm, CB, M['peneira']); pen.location = OB + Vector((0, 0, -20))
sd = cilindro('SET_B_saida_luz', 1.6, 1.6, 0.05, OB + Vector((0, 0, -48)), CB, M['saida_luz'])
luz_area('LUZ_B_saida', OB + Vector((0, 0, -44)), OB + Vector((0, 0, 0)), 9000, 3.0, CB, (1.0, 0.93, 0.86))
lz = bpy.data.lights.new('LUZ_B_camera', 'POINT'); lz.energy = 60; lz.shadow_soft_size = 0.3; lz.color = (1.0, 0.95, 0.92)
LUZ_B_CAM = bpy.data.objects.new('LUZ_B_camera', lz); CB.objects.link(LUZ_B_CAM)
luz_area('LUZ_B_peneira', OB + Vector((0, -1.2, -19.5)), OB + Vector((0, 0, -20)), 300, 1.0, CB, (1.0, 0.9, 0.8))

# ============================================================ CENÁRIO C — estúdio (produto)
OC = Vector(C.ORIGEM['estudio'])
W, D, H = C.ESTOJO_W, C.ESTOJO_D, C.ESTOJO_H
piso_c = caixa('SET_C_piso', (3, 3, 0.002), OC + Vector((0, 0, -0.001)), CC, M['fundo'])
for _o in (piso_c,):
    _o.visible_diffuse = _o.visible_volume_scatter = False
_f = caixa('SET_C_fundo', (3, 0.01, 3), OC + Vector((0, 1.2, 1.0)), CC, M['fundo'])
_f.visible_diffuse = _f.visible_volume_scatter = False   # aparece em reflexos e através da tampa, mas não ilumina
base = caixa('PROD_estojo_base', (W, D, H), OC + Vector((0, 0, H / 2)), CC, M['estojo'])
bv = base.modifiers.new('cantos', 'BEVEL'); bv.width = 0.0012; bv.segments = 4; bv.limit_method = 'ANGLE'
cortes = []
rec = caixa('PROV_corte_rebaixo', (W - 0.005, D - 0.0045, 0.002), OC + Vector((0, 0.00075, H + 0.0005)), CC)
cortes.append(rec)
for i, sx in enumerate((-1, 0, 1)):
    cortes.append(cilindro(f'PROV_corte_poco_{i}', R + 0.0005, R + 0.0005, C.GODE_PROF + 0.002,
                           OC + Vector((sx * C.GODE_ESPACO, C.GODE_PY, H - (C.GODE_PROF + 0.002) / 2 + 0.0001)), CC, lados=96))
cortes.append(caixa('PROV_corte_entalhe', (0.0257, 0.003, 0.005), OC + Vector((0, -D / 2, H * 0.5)), CC))
for c in cortes:
    c.hide_render = True; c.hide_viewport = True
    b = base.modifiers.new(c.name, 'BOOLEAN'); b.operation = 'DIFFERENCE'; b.object = c; b.solver = 'EXACT'
base.data.shade_smooth()

def gode_pronto(nome, x, mat, z_topo):
    pai = vazio(nome, OC + Vector((x, C.GODE_PY, z_topo)), CC)
    g = gode_metal(nome + '_metal', (0, 0, -C.GODE_PROF / 2), CC)
    p = cilindro(nome + '_po', R, R, C.GODE_PROF - 0.001, (0, 0, -0.0006 - (C.GODE_PROF - 0.001) / 2), CC, mat, lados=96)
    g.parent = pai; p.parent = pai
    return pai
Z_GODE = H - 0.0005
gode_pronto('PROD_godê_esq', -C.GODE_ESPACO, M['po_godê_esq'], Z_GODE)
gode_pronto('PROD_godê_dir', C.GODE_ESPACO, M['po_godê_dir'], Z_GODE)
heroiC = gode_pronto('PROD_godê_heroi_C', 0.0, M['po_' + C.HEROI], Z_GODE)
Z_HEROI_ALTO = H + 0.045
chave(heroiC, 1, location=OC + Vector((0, C.GODE_PY, Z_HEROI_ALTO)))
chave(heroiC, t['corte3'], location=OC + Vector((0, C.GODE_PY, Z_HEROI_ALTO)))
chave(heroiC, t['gode_assenta'] - 12, location=OC + Vector((0, C.GODE_PY, Z_GODE + 0.004)))
chave(heroiC, t['gode_assenta'], location=OC + Vector((0, C.GODE_PY, Z_GODE)))

# tampa: articula na borda traseira superior
dob = vazio('PROD_tampa_dobradica', OC + Vector((0, D / 2, H)), CC)
tampa = caixa('PROD_tampa', (W, D, C.TAMPA_ESP), (0, -D / 2, C.TAMPA_ESP / 2), CC, M['tampa'])
tb = tampa.modifiers.new('cantos', 'BEVEL'); tb.width = 0.0012; tb.segments = 3; tb.limit_method = 'ANGLE'
tampa.parent = dob
dob.rotation_euler = (-(math.pi / 2 + C.TAMPA_INCLINACAO), 0, 0)

luz_area('LUZ_C_chave', OC + Vector((-0.25, -0.35, 0.45)), OC + Vector((0, 0, 0.01)), 7, 0.6, CC)
luz_area('LUZ_C_preenchimento', OC + Vector((0.35, -0.3, 0.25)), OC + Vector((0, 0, 0.01)), 3, 0.8, CC)
luz_area('LUZ_C_topo', OC + Vector((0, 0.05, 0.6)), OC + Vector((0, 0, 0)), 5, 0.8, CC)

# ============================================================ câmeras
def camera(nome, lente):
    cd = bpy.data.cameras.new(nome); cd.lens = lente; cd.sensor_width = 36; cd.sensor_fit = 'HORIZONTAL'
    cd.clip_start = 0.002; cd.clip_end = 100
    cam = bpy.data.objects.new(nome, cd); CCAM.objects.link(cam)
    alvo = vazio(nome + '_alvo', (0, 0, 0), CCAM)
    ct = cam.constraints.new('TRACK_TO'); ct.target = alvo; ct.track_axis = 'TRACK_NEGATIVE_Z'; ct.up_axis = 'UP_Y'
    return cam, alvo
def cam_chave(par, f, pos, alvo):
    cam, a = par
    cam.location = pos; cam.keyframe_insert('location', frame=f)
    a.location = alvo; a.keyframe_insert('location', frame=f)

A1 = camera('CAM_A1_bancada', 40)
cam_chave(A1, 1, (-0.17, -0.44, 0.29), (-0.28, 0.02, 0.11))
cam_chave(A1, 60, (-0.25, -0.27, 0.25), (-0.28, 0.02, 0.125))
cam_chave(A1, 92, (-0.21, -0.31, 0.36), (-0.17, 0.02, 0.29))
cam_chave(A1, 125, (-0.09, -0.28, 0.54), (-0.03, 0.03, 0.42))
cam_chave(A1, 152, (-0.005, -0.12, 0.64), (0.0, 0.03, 0.40))
cam_chave(A1, 176, (0.0, 0.022, 0.48), (0.0, 0.031, 0.30))
cam_chave(A1, t['corte1'], (0.0, 0.03, 0.325), (0.0, 0.0302, 0.20))

B = camera('CAM_B_micro', 20)
LUZ_B_CAM.parent = B[0]; LUZ_B_CAM.location = (0.3, 0.4, 0.2)
B[0].data.dof.use_dof = True; B[0].data.dof.focus_distance = 0.9; B[0].data.dof.aperture_fstop = 0.6
cam_chave(B, t['corte1'], OB + Vector((0, 0, 3)), OB + Vector((0, 0.05, -5)))
cam_chave(B, 250, OB + Vector((0.05, 0, -11)), OB + Vector((0.0, 0.05, -20)))
cam_chave(B, 295, OB + Vector((0.0, 0, -24)), OB + Vector((0.0, 0.05, -32)))
cam_chave(B, t['corte2'], OB + Vector((0, 0, -46.5)), OB + Vector((0, 0.05, -52)))

A2 = camera('CAM_A2_prensa', C.CAM_FINAL['lente_mm'])
zp = C.MOLDE_TOPO_Z
REL = Vector((0, -0.081 * math.cos(math.radians(70)), 0.081 * math.sin(math.radians(70))))
cam_chave(A2, t['corte2'], (0.0, -0.05, 0.16), (0.0, 0.0, zp + 0.004))
cam_chave(A2, 382, (0.0, -0.21, 0.10), (0.0, 0.0, zp + 0.018))
cam_chave(A2, 432, (0.012, -0.20, 0.094), (0.004, 0.0, zp + 0.012))
cam_chave(A2, t['rasagem_ini'] + 8, (0.016, -0.21, 0.092), (0.012, 0.0, zp + 0.008))
cam_chave(A2, 470, (xl, -0.21, 0.10), (xl, 0.0, zp + 0.004))
cam_chave(A2, t['rasagem_fim'], (xp, -0.24, 0.13), (xp, 0.0, zp + 0.01))
cam_chave(A2, t['puncao_toca'], (xp - 0.01, -0.25, 0.20), (xp, 0.0, zp + 0.02))
cam_chave(A2, t['puncao_topo'], (xp, -0.18, 0.22), (xp, 0.0, zp + 0.004))
topo_ej = Vector((xp, 0, zp + 0.015))
cam_chave(A2, t['ejecao_fim'], topo_ej + REL, topo_ej)
cam_chave(A2, t['corte3'], topo_ej + REL * 0.97, topo_ej)

Cc = camera('CAM_C_estudio', C.CAM_FINAL['lente_mm'])
topo_c = OC + Vector((0, C.GODE_PY, Z_HEROI_ALTO))
cam_chave(Cc, t['corte3'], topo_c + REL * 0.97, topo_c)
cam_chave(Cc, t['gode_assenta'], OC + Vector((0.0, -0.17, 0.20)), OC + Vector((0, C.GODE_PY, H)))
e, dist = C.CAM_FINAL['elev'], C.CAM_FINAL['dist']
alvo_f = OC + Vector(C.CAM_FINAL['alvo'])
pos_f = alvo_f + dist * Vector((0, -math.cos(e), math.sin(e)))
cam_chave(Cc, t['pose_final'], pos_f, alvo_f)
cam_chave(Cc, C.FRAME_FIM, pos_f, alvo_f)
# deslocamento de lente: põe o centro óptico da foto na mesma posição relativa da saída 9:16
escala = C.RES[0] / 1024
centro_foto_saida = C.FOTO_TOPO_NA_SAIDA + 768 * escala
Cc[0].data.shift_y = (centro_foto_saida - C.RES[1] / 2) / C.RES[1]
cena.camera = A1[0]
for nome, f, par in (('c1', 1, A1), ('corte1', t['corte1'], B), ('corte2', t['corte2'], A2), ('corte3', t['corte3'], Cc)):
    mk = cena.timeline_markers.new(nome, frame=f); mk.camera = par[0]

# ============================================================ render (prévia)
r = cena.render
r.engine = 'CYCLES'; cena.cycles.device = 'CPU'
cena.cycles.samples = 16; cena.cycles.use_denoising = True
cena.cycles.max_bounces = 4; cena.cycles.transparent_max_bounces = 8; cena.cycles.transmission_bounces = 4
r.resolution_x, r.resolution_y = C.RES; r.resolution_percentage = 50
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGB'
cena.view_settings.view_transform = 'Khronos PBR Neutral'
r.filepath = os.path.join(C.RAIZ, 'saida', 'animatic', 'q_')
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=SAIDA)
print('CENA_SALVA', SAIDA)
