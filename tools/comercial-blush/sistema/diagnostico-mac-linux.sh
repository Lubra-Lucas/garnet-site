#!/usr/bin/env bash
# Diagnóstico do computador para o render do comercial 3D (macOS e Linux).
# Coleta apenas dados técnicos: sistema, CPU, RAM, GPU, espaço em disco e Blender.
# NÃO coleta nome de usuário, nome do computador, IP, número de série etc.
# Uso: bash diagnostico-mac-linux.sh
# Resultado: ~/diagnostico-pc.txt (e também mostrado na tela).
# Compatível com o bash 3.2 do macOS (sem arrays associativos).

SAIDA="$HOME/diagnostico-pc.txt"
SO="$(uname -s 2>/dev/null)"

existe() { command -v "$1" >/dev/null 2>&1; }

# Troca o caminho da pasta pessoal por "~" para não expor o nome de usuário.
anonimizar() { sed "s|$HOME|~|g"; }

secao() { echo; echo "== $1 =="; }

coletar() {
  echo "DIAGNÓSTICO DO COMPUTADOR - comercial 3D"
  echo "Data: $(date '+%Y-%m-%d %H:%M')"

  # ---------- Sistema ----------
  secao "Sistema"
  if [ "$SO" = "Darwin" ]; then
    echo "macOS $(sw_vers -productVersion 2>/dev/null) (build $(sw_vers -buildVersion 2>/dev/null))"
  else
    if [ -r /etc/os-release ]; then
      # Subshell para não misturar as variáveis do os-release com as do script.
      echo "Linux: $( . /etc/os-release; echo "${PRETTY_NAME:-desconhecido}" )"
    else
      echo "Linux (distribuição desconhecida)"
    fi
    echo "Kernel: $(uname -r 2>/dev/null)"
  fi
  echo "Arquitetura: $(uname -m 2>/dev/null)"

  # ---------- CPU ----------
  secao "Processador (CPU)"
  if [ "$SO" = "Darwin" ]; then
    echo "Modelo: $(sysctl -n machdep.cpu.brand_string 2>/dev/null)"
    echo "Núcleos físicos: $(sysctl -n hw.physicalcpu 2>/dev/null)"
    echo "Threads (lógicos): $(sysctl -n hw.logicalcpu 2>/dev/null)"
  else
    modelo="$(grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2- | sed 's/^ *//')"
    [ -z "$modelo" ] && existe lscpu && modelo="$(lscpu 2>/dev/null | grep -m1 'Model name' | cut -d: -f2- | sed 's/^ *//')"
    threads="$(grep -c '^processor' /proc/cpuinfo 2>/dev/null)"
    # Núcleos físicos = pares únicos (physical id, core id).
    nucleos="$(awk -F: '/^physical id/{p=$2} /^core id/{print p":"$2}' /proc/cpuinfo 2>/dev/null | sort -u | wc -l | tr -d ' ')"
    [ "$nucleos" = "0" ] && nucleos="(não informado)"
    echo "Modelo: ${modelo:-desconhecido}"
    echo "Núcleos físicos: $nucleos"
    echo "Threads (lógicos): ${threads:-desconhecido}"
  fi

  # ---------- RAM ----------
  secao "Memória RAM"
  if [ "$SO" = "Darwin" ]; then
    bytes="$(sysctl -n hw.memsize 2>/dev/null)"
    [ -n "$bytes" ] && echo "Total: $(awk -v b="$bytes" 'BEGIN{printf "%.1f GB", b/1073741824}')"
  else
    kb="$(awk '/^MemTotal/{print $2}' /proc/meminfo 2>/dev/null)"
    [ -n "$kb" ] && echo "Total: $(awk -v k="$kb" 'BEGIN{printf "%.1f GB", k/1048576}')"
    existe free && free -h 2>/dev/null
  fi

  # ---------- GPU ----------
  secao "Placa de vídeo (GPU)"
  if [ "$SO" = "Darwin" ]; then
    # Só linhas técnicas (evita números de série de monitores).
    system_profiler SPDisplaysDataType 2>/dev/null \
      | grep -E 'Chipset Model|Type:|Bus:|VRAM|Total Number of Cores|Vendor|Metal' \
      | sed 's/^ *//'
    echo "(Em Macs com chip Apple, a GPU usa a mesma RAM do sistema.)"
  else
    if existe lspci; then
      lspci 2>/dev/null | grep -Ei 'vga|3d controller|display' | cut -d' ' -f2- \
        || echo "Nenhuma GPU listada pelo lspci."
    else
      echo "lspci não está instalado."
    fi
  fi
  if existe nvidia-smi; then
    echo "-- nvidia-smi --"
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv 2>&1
  else
    echo "nvidia-smi: não encontrado (normal se não houver placa NVIDIA)."
  fi

  # ---------- Disco ----------
  secao "Espaço em disco (pasta pessoal)"
  df -Ph "$HOME" 2>/dev/null | awk 'NR==1{print "Tamanho  Usado  Livre"} NR>1{print $2"  "$3"  "$4}'

  # ---------- Blender ----------
  secao "Blender"
  achados=""
  for b in /Applications/Blender.app/Contents/MacOS/Blender \
           "$HOME"/Applications/Blender.app/Contents/MacOS/Blender \
           /opt/blender*/blender \
           "$(command -v blender 2>/dev/null)"; do
    if [ -n "$b" ] && [ -x "$b" ]; then
      case " $achados " in *" $b "*) continue ;; esac
      achados="$achados $b"
      versao="$("$b" --factory-startup --version 2>/dev/null | grep -m1 '^Blender')"
      echo "Encontrado: $b -> ${versao:-versão não identificada}" | anonimizar
    fi
  done
  [ -z "$achados" ] && echo "Blender não encontrado."
}

coletar 2>&1 | tee "$SAIDA"
echo
echo "Arquivo salvo em: ~/diagnostico-pc.txt"
