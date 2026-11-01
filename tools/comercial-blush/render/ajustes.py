"""Ajustes de render aplicados na linha de comando (lidos de variáveis de ambiente).
PERC = percentual da resolução 1080x1920; AMOSTRAS = amostras do Cycles; DISPOSITIVO = CPU|GPU."""
import bpy, os
s = bpy.context.scene
s.render.resolution_percentage = int(float(os.environ.get('PERC', '100')))
s.cycles.samples = int(os.environ.get('AMOSTRAS', '16'))
s.cycles.use_adaptive_sampling = True
s.render.use_overwrite = os.environ.get('SOBRESCREVER', '0') == '1'
disp = os.environ.get('DISPOSITIVO', 'CPU').upper()
if disp == 'GPU':
    pref = bpy.context.preferences.addons['cycles'].preferences
    for tipo in ('OPTIX', 'CUDA', 'METAL', 'HIP', 'ONEAPI'):
        try:
            pref.compute_device_type = tipo; pref.refresh_devices()
            if any(d.type == tipo for d in pref.devices):
                for d in pref.devices: d.use = True
                s.cycles.device = 'GPU'; break
        except TypeError:
            continue
print(f'AJUSTES: {s.render.resolution_x}x{s.render.resolution_y} a {s.render.resolution_percentage}%, '
      f'{s.cycles.samples} amostras, dispositivo {s.cycles.device}', flush=True)
