# Diagnóstico do computador para o comercial 3D

Estes arquivos verificam se o seu computador consegue renderizar o comercial e qual
é a melhor configuração. Eles **só leem** informações técnicas (sistema, processador,
memória, placa de vídeo, espaço em disco e Blender). **Não** coletam nome de usuário,
nome do computador, IP, número de série nem arquivos pessoais, e não instalam nada.

Coloque a pasta `sistema` inteira na sua pasta **Downloads** antes de começar
(os comandos abaixo usam esse local).

## 1. Instale o Blender 5.2 LTS

1. Abra <https://www.blender.org/download/lts/> e baixe a versão **5.2 LTS** do seu sistema.
2. Windows: execute o instalador e clique em "Next" até terminar.
   macOS: abra o `.dmg` e arraste o Blender para a pasta **Aplicativos**.
   Linux: extraia o arquivo `.tar.xz` na sua pasta pessoal.

## 2. Rode o diagnóstico do computador

### Windows

1. Abra a pasta `sistema`.
2. Clique com o **botão direito** em `diagnostico-windows.ps1` e escolha **"Executar com PowerShell"**.
3. Se o Windows perguntar algo, confirme. No fim, aperte **Enter** para fechar.

Se a janela abrir e fechar sem fazer nada, abra o menu Iniciar, digite **PowerShell**,
abra o programa e cole este comando:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\sistema\diagnostico-windows.ps1"
```

O resultado fica no arquivo **`diagnostico-pc.txt` na Área de Trabalho**.

### macOS ou Linux

1. Abra o **Terminal** (no Mac: Cmd + Espaço, digite "Terminal").
2. Cole este comando e aperte Enter:

```bash
bash ~/Downloads/sistema/diagnostico-mac-linux.sh
```

O resultado fica no arquivo **`diagnostico-pc.txt` na sua pasta pessoal** (no Mac, abra o
Finder e use Cmd + Shift + H).

## 3. Rode o teste de placa de vídeo do Blender

Este teste abre o Blender "invisível", lista as placas que ele consegue usar e mostra a
**recomendada**. Pode levar até um minuto.

### Windows (no PowerShell)

Troque `5.2` se a pasta instalada tiver outro nome:

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python "$env:USERPROFILE\Downloads\sistema\dispositivos_blender.py"
```

### macOS (no Terminal)

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python ~/Downloads/sistema/dispositivos_blender.py
```

### Linux (no Terminal)

Troque o nome da pasta pelo da que você extraiu:

```bash
~/blender-5.2-linux-x64/blender -b --factory-startup --python ~/Downloads/sistema/dispositivos_blender.py
```

O texto aparece na própria janela, terminando com a linha **">>> RECOMENDADO: ..."**.

## 4. O que me enviar

1. O **conteúdo inteiro** do arquivo `diagnostico-pc.txt` (abra, selecione tudo com
   Ctrl + A ou Cmd + A, copie e cole na mensagem).
2. O texto que apareceu no passo 3, do título "DISPOSITIVOS DE RENDER" até a linha
   "Copie todo este texto...". Pode copiar da janela ou mandar uma captura de tela.

Se algum passo der erro, envie uma foto ou captura de tela da mensagem de erro.
