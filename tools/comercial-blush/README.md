# Comercial "Do pó à paleta": projeto 3D (Blender 5.2 LTS)

O filme inteiro é gerado por código: `cena/construir.py` monta a cena no Blender a partir de
`cena/config.py`. Não há arquivos binários a baixar; o `.blend` é criado na hora em `saida/`.

```
tools/comercial-blush/
  ESPEC.md                 especificação única (escala, eixos, nomes, linha do tempo, cores)
  cena/config.py           números da especificação (fonte da verdade)
  cena/construir.py        constrói a cena e salva saida/comercial-animatic.blend
  cena/ajuste_cores.json   calibração de cor contra a foto (gerado por verificar/calibrar_cores.py)
  ref/catalogo-paleta.webp foto de catálogo (referência do produto e do enquadramento final)
  render/animatic.sh       constrói e renderiza o animatic (Linux/macOS)
  render/ajustes.py        resolução/amostras/CPU-GPU por variáveis de ambiente
  render/montar_video.sh   monta o MP4 (legendado e limpo) com a assinatura da Garnet
  verificar/               calibração de câmera, comparação com a foto, folha de contato
  sistema/                 diagnóstico do seu computador (leia sistema/LEIA-ME.md)
  saida/                   tudo o que é gerado (não vai para o git)
```

## 1. Antes de tudo: diagnóstico do computador

Siga `sistema/LEIA-ME.md` e me envie o resultado. Com ele eu defino as configurações de render.

## 2. Rodar no seu computador

Pré-requisitos: **Blender 5.2 LTS** (<https://www.blender.org/download/lts/>) e a pasta
`tools/comercial-blush` copiada para o computador. O FFmpeg só é necessário para montar o MP4
(<https://ffmpeg.org/download.html>).

### macOS / Linux (Terminal, dentro da pasta `comercial-blush`)

Aponte a variável para o seu Blender. No macOS:

```bash
export BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
```

Construa a cena e renderize o animatic (33% da resolução, 8 amostras):

```bash
render/animatic.sh 33 8
```

Monte o vídeo:

```bash
render/montar_video.sh
```

### Windows (PowerShell, dentro da pasta `comercial-blush`)

Não testado no Windows: os comandos abaixo seguem a documentação do Blender e serão conferidos com o seu diagnóstico.

```powershell
$B = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
```

```powershell
& $B -b --factory-startup -P cena\construir.py
```

```powershell
$env:PERC="33"; $env:AMOSTRAS="8"; & $B -b saida\comercial-animatic.blend -o //animatic/q_#### -F PNG -P render\ajustes.py -a
```

### Render por etapas (em qualquer sistema)

O render **não sobrescreve** quadros já prontos. Você pode parar (Ctrl+C) e continuar depois com o
mesmo comando, ou dividir em blocos de quadros (`-s` início, `-e` fim):

```bash
render/animatic.sh 33 8 1 300
```

```bash
render/animatic.sh 33 8 301 840
```

Na GPU, defina `DISPOSITIVO=GPU` antes do comando (OptiX, CUDA, Metal, HIP ou oneAPI, nessa ordem de preferência).

## 3. Medir o tempo antes do render final

Renderiza 3 quadros representativos (micro, dosagem e produto) e mostra o tempo de cada um:

```bash
PERC=100 AMOSTRAS=64 SOBRESCREVER=1 "$BLENDER" -b saida/comercial-animatic.blend -o //medicao/q_#### -F PNG -P render/ajustes.py -f 300,420,840
```

Tempo total ≈ média por quadro × 840.

## 4. Tempos medidos no contêiner (CPU, 4 vCPUs, sem GPU)

| Configuração | Tempo/quadro | 840 quadros |
|---|---|---|
| Animatic 360×640, 8 amostras | ~6,6–7,5 s | ~1 h 45 min |
| Prévia 540×960, 16 amostras | ~13–32 s (micro é o mais pesado) | ~4–5 h |
| Final 1080×1920, 64+ amostras, materiais finais | **não medido**: estimativa de dezenas de minutos por quadro só em CPU | inviável neste contêiner |

O render final será planejado depois do seu diagnóstico. As opções sem GPU estão no plano
(`docs/comercial-blush/plano-v1.md`, seção 7).
