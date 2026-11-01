# -*- coding: utf-8 -*-
"""
Lista os dispositivos de render do Cycles disponíveis neste computador
e recomenda o melhor para o comercial 3D.

Como rodar (no Terminal / PowerShell):
    blender -b --factory-startup --python dispositivos_blender.py

Não altera nenhuma preferência salva do Blender (o --factory-startup
garante que nada seja gravado) e não coleta dados pessoais.
"""

import sys

import bpy

# Ordem de preferência: do mais rápido (em geral) para o mais lento.
ORDEM_RECOMENDADA = ["OPTIX", "CUDA", "METAL", "HIP", "ONEAPI", "CPU"]

DESCRICAO = {
    "OPTIX": "NVIDIA RTX (OptiX)",
    "CUDA": "NVIDIA (CUDA)",
    "METAL": "Apple (Metal)",
    "HIP": "AMD Radeon (HIP)",
    "ONEAPI": "Intel Arc (oneAPI)",
    "CPU": "Processador (CPU)",
}


def linha(texto=""):
    print(texto, flush=True)


def obter_preferencias_cycles():
    """Devolve as preferências do Cycles, ativando o add-on se preciso."""
    addons = bpy.context.preferences.addons
    if "cycles" not in addons:
        try:
            import addon_utils
            addon_utils.enable("cycles", default_set=True)
        except Exception as erro:  # noqa: BLE001
            linha("ERRO: não foi possível ativar o Cycles: %s" % erro)
            return None
    try:
        return bpy.context.preferences.addons["cycles"].preferences
    except KeyError:
        return None


def tipos_compilados(prefs):
    """Tipos de GPU que esta versão do Blender sabe usar (sem 'NONE')."""
    try:
        itens = prefs.bl_rna.properties["compute_device_type"].enum_items
        return [item.identifier for item in itens if item.identifier != "NONE"]
    except Exception:  # noqa: BLE001
        # Em algumas versões os itens são dinâmicos; testa um por um.
        return [t for t in ORDEM_RECOMENDADA if t != "CPU"]


def dispositivos_do_tipo(prefs, tipo):
    """Lista (nome, tipo) dos dispositivos de um tipo; vazia se não houver."""
    try:
        if hasattr(prefs, "get_devices_for_type"):
            lista = prefs.get_devices_for_type(tipo)
        else:
            # Versões antigas: get_devices() devolvia (cuda, opencl/outros).
            prefs.get_devices()
            lista = list(prefs.devices)
    except Exception:  # noqa: BLE001
        return []
    # get_devices_for_type inclui a CPU junto das GPUs; filtramos pelo tipo.
    return [(d.name, d.type) for d in lista if d.type == tipo]


def main():
    linha("=" * 60)
    linha("DISPOSITIVOS DE RENDER DO BLENDER (Cycles)")
    linha("=" * 60)
    linha("Versão do Blender: %s" % bpy.app.version_string)
    linha("Sistema (build): %s" % sys.platform)
    linha()

    prefs = obter_preferencias_cycles()
    if prefs is None:
        linha("Não foi possível ler as preferências do Cycles.")
        linha("Recomendação: usar CPU.")
        return

    # Atualiza a lista de dispositivos (não acontece sozinho na inicialização).
    try:
        if hasattr(prefs, "refresh_devices"):
            prefs.refresh_devices()
        elif hasattr(prefs, "get_devices"):
            prefs.get_devices()
    except Exception as erro:  # noqa: BLE001
        linha("Aviso: falha ao atualizar dispositivos: %s" % erro)

    compilados = tipos_compilados(prefs)
    encontrados = {}

    for tipo in ORDEM_RECOMENDADA:
        if tipo == "CPU":
            continue
        if tipo not in compilados:
            linha("%-7s -> indisponível (sem GPU/driver compatível)" % tipo)
            continue
        devs = dispositivos_do_tipo(prefs, tipo)
        encontrados[tipo] = devs
        if devs:
            linha("%-7s -> %d dispositivo(s):" % (tipo, len(devs)))
            for nome, _t in devs:
                linha("           - %s" % nome)
        else:
            linha("%-7s -> nenhum dispositivo encontrado" % tipo)

    # A CPU sempre existe; o nome vem de qualquer lista que a inclua.
    nome_cpu = None
    for tipo in compilados + ["CPU"]:
        try:
            for d in prefs.get_devices_for_type(tipo):
                if d.type == "CPU":
                    nome_cpu = d.name
                    break
        except Exception:  # noqa: BLE001
            pass
        if nome_cpu:
            break
    encontrados["CPU"] = [(nome_cpu or "Processador", "CPU")]
    linha("%-7s -> 1 dispositivo(s):" % "CPU")
    linha("           - %s" % (nome_cpu or "Processador"))

    melhor = next(t for t in ORDEM_RECOMENDADA if encontrados.get(t))

    linha()
    linha("-" * 60)
    linha(">>> RECOMENDADO: %s - %s" % (melhor, DESCRICAO[melhor]))
    for nome, _t in encontrados[melhor]:
        linha("    usando: %s" % nome)
    if melhor == "CPU":
        linha("    (Nenhuma GPU compatível foi encontrada. O render vai")
        linha("     funcionar, mas será mais lento.)")
    linha("-" * 60)
    linha("Copie todo este texto e envie de volta. Obrigado!")


main()
