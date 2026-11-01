#!/usr/bin/env bash
# Animatic: constrói a cena e renderiza todos os quadros em baixa resolução (prévia de câmera e ritmo).
# Uso: render/animatic.sh [percentual=33.333] [amostras=8] [inicio=1] [fim=840]
# Variável BLENDER aponta para o executável (padrão: blender no PATH).
set -euo pipefail
cd "$(dirname "$0")/.."
B="${BLENDER:-blender}"
export PERC="${1:-33}" AMOSTRAS="${2:-8}"; I="${3:-1}"; F="${4:-840}"
"$B" -b --factory-startup -P cena/construir.py
mkdir -p saida/animatic
"$B" -b saida/comercial-animatic.blend -o //animatic/q_#### -F PNG \
  -P render/ajustes.py \
  -s "$I" -e "$F" -a
