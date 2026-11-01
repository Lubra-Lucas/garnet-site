#!/usr/bin/env bash
# Monta o vídeo do animatic a partir dos quadros PNG, com a assinatura da Garnet (sobreposição 2D separada do produto).
# Gera duas versões: legendada (identifica elementos provisórios e cortes) e limpa.
# Uso: render/montar_video.sh [pasta_quadros=saida/animatic] [largura=720]
set -euo pipefail
cd "$(dirname "$0")/.."
Q="${1:-saida/animatic}"; LW="${2:-720}"; LH=$((LW * 16 / 9))
LOGO="${LOGO:-../../assets/img/site/garnet-logo.png}"   # provisório: PNG do site (pedir vetor)
FONTE="${FONTE:-/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf}"
FPS=30; ASS=785                                          # quadro em que a assinatura começa (config.T['assinatura'])
T0=$(python3 -c "print(($ASS-1)/$FPS)")
LOGO_W=$((LW * 40 / 100)); LOGO_Y=$((LH * 1450 / 1920))
BASE="[0:v]scale=${LW}:${LH}:flags=lanczos,format=rgba[v];[1:v]scale=${LOGO_W}:-1,format=rgba,fade=t=in:st=${T0}:d=0.7:alpha=1[l];[v][l]overlay=x=(W-w)/2:y=${LOGO_Y}-h/2:shortest=1[a]"
txt() { echo "drawtext=fontfile=${FONTE}:textfile=render/legendas/$1:fontcolor=white:fontsize=$((LW/34)):box=1:boxcolor=black@0.55:boxborderw=6:x=(w-tw)/2:y=$2:enable='$3'"; }
LEG="[a]$(txt topo.txt 12 'gte(n,0)'),drawtext=fontfile=${FONTE}:text='%{eif\:n+1\:d}  %{pts\:hms}':fontcolor=white:fontsize=$((LW/34)):box=1:boxcolor=black@0.55:x=12:y=h-th-12"
LEG="${LEG},$(txt s1.txt h-th-50 'between(n,0,188)'),$(txt s2.txt h-th-50 'between(n,189,343)'),$(txt s3.txt h-th-50 'between(n,344,613)'),$(txt s4.txt h-th-50 'between(n,614,758)'),$(txt s5.txt h-th-50 'gte(n,759)')"
for c in 190 345 615; do LEG="${LEG},$(txt corte.txt h/2 "between(n,$((c-5)),$((c+3)))")"; done
mkdir -p saida/video
ffmpeg -y -loglevel error -framerate $FPS -i "$Q/q_%04d.png" -loop 1 -framerate $FPS -i "$LOGO" \
  -filter_complex "${BASE};${LEG}[o]" -map "[o]" -frames:v 840 -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart saida/video/animatic-v1-legendado.mp4
ffmpeg -y -loglevel error -framerate $FPS -i "$Q/q_%04d.png" -loop 1 -framerate $FPS -i "$LOGO" \
  -filter_complex "${BASE}" -map "[a]" -frames:v 840 -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart saida/video/animatic-v1-limpo.mp4
for f in saida/video/*.mp4; do ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames -of csv=p=0 "$f" | sed "s|^|$f: |"; done
