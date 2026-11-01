#!/usr/bin/env bash
# Renderiza quadros avulsos em baixa resolução para checagem rápida e monta uma folha de contato.
# Uso: verificar/quadros.sh "1,140,300" [percentual=25] [amostras=8]
set -euo pipefail
cd "$(dirname "$0")/.."
B="${BLENDER:-blender}"
Q="$1"; export PERC="${2:-25}" AMOSTRAS="${3:-8}" SOBRESCREVER=1
rm -rf saida/rapido && mkdir -p saida/rapido
"$B" -b saida/comercial-animatic.blend -o //rapido/q_#### -F PNG \
  -P render/ajustes.py \
  -f "$Q" 2>&1 | grep -E "Error|Time:" | sed 's/.*| //' || true
montage saida/rapido/q_*.png -tile x1 -geometry +3+3 -background '#222' saida/folha_rapida.png
echo "folha: saida/folha_rapida.png"
