# Diagnóstico do computador para o render do comercial 3D (Windows).
# Compatível com Windows PowerShell 5.1, sem módulos extras.
# Coleta apenas dados técnicos: Windows, CPU, RAM, GPU, espaço livre e Blender.
# NÃO coleta nome de usuário, nome do computador, IP, número de série etc.
# Uso: botão direito no arquivo > "Executar com PowerShell"
#   ou: powershell -ExecutionPolicy Bypass -File diagnostico-windows.ps1
# Resultado: diagnostico-pc.txt na Área de Trabalho (e mostrado na tela).
# Obs.: o arquivo é salvo em UTF-8 com BOM para os acentos aparecerem no PS 5.1.

$ErrorActionPreference = 'SilentlyContinue'

# Lê classes WMI/CIM (Get-CimInstance; se falhar, Get-WmiObject).
function Ler-Classe([string]$classe) {
    $r = Get-CimInstance -ClassName $classe -ErrorAction SilentlyContinue
    if (-not $r) { $r = Get-WmiObject -Class $classe -ErrorAction SilentlyContinue }
    return $r
}

# Troca o caminho da pasta do usuário por %USERPROFILE% para não expor o nome.
function Anonimizar([string]$texto) {
    if ($env:USERPROFILE -and $texto) {
        return $texto.Replace($env:USERPROFILE, '%USERPROFILE%')
    }
    return $texto
}

function Em-GB($bytes) {
    if (-not $bytes) { return '?' }
    return ('{0:N1} GB' -f ([double]$bytes / 1GB))
}

$linhas = New-Object System.Collections.Generic.List[string]
function Add([string]$t) { $linhas.Add($t) | Out-Null }

Add 'DIAGNÓSTICO DO COMPUTADOR - comercial 3D'
Add ('Data: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm'))

# ---------- Windows ----------
Add ''
Add '== Sistema =='
$os = Ler-Classe 'Win32_OperatingSystem' | Select-Object -First 1
if ($os) {
    Add ("{0} (versão {1}, build {2}, {3})" -f $os.Caption, $os.Version, $os.BuildNumber, $os.OSArchitecture)
} else {
    Add ('Windows ' + [Environment]::OSVersion.Version.ToString())
}
$displayVer = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion').DisplayVersion
if ($displayVer) { Add ("Atualização do Windows: $displayVer") }

# ---------- CPU ----------
Add ''
Add '== Processador (CPU) =='
foreach ($c in @(Ler-Classe 'Win32_Processor')) {
    Add ("Modelo: " + ([string]$c.Name).Trim())
    Add ("Núcleos físicos: " + $c.NumberOfCores)
    Add ("Threads (lógicos): " + $c.NumberOfLogicalProcessors)
}

# ---------- RAM ----------
Add ''
Add '== Memória RAM =='
$cs = Ler-Classe 'Win32_ComputerSystem' | Select-Object -First 1
if ($cs) { Add ("Total: " + (Em-GB $cs.TotalPhysicalMemory)) }

# ---------- GPU ----------
Add ''
Add '== Placa de vídeo (GPU) =='
# O Win32_VideoController limita a VRAM a 4 GB; o registro tem o valor real.
$vramRegistro = @{}
$chaveClasse = 'HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}'
foreach ($k in @(Get-ChildItem $chaveClasse -ErrorAction SilentlyContinue)) {
    $p = Get-ItemProperty $k.PSPath -ErrorAction SilentlyContinue
    if ($p -and $p.DriverDesc -and $p.'HardwareInformation.qwMemorySize') {
        $vramRegistro[[string]$p.DriverDesc] = [double]$p.'HardwareInformation.qwMemorySize'
    }
}
foreach ($g in @(Ler-Classe 'Win32_VideoController')) {
    $vram = $null
    if ($vramRegistro.ContainsKey([string]$g.Name)) { $vram = $vramRegistro[[string]$g.Name] }
    elseif ($g.AdapterRAM) { $vram = [double][uint32]$g.AdapterRAM }
    $txtVram = if ($vram) { '~' + (Em-GB $vram) } else { '?' }
    Add ("GPU: {0} | VRAM: {1} | driver {2}" -f $g.Name, $txtVram, $g.DriverVersion)
}

$nvsmi = $null
$cmd = Get-Command 'nvidia-smi' -ErrorAction SilentlyContinue
if ($cmd) { $nvsmi = $cmd.Path }
if (-not $nvsmi) {
    foreach ($c in @("$env:SystemRoot\System32\nvidia-smi.exe",
                     "$env:ProgramFiles\NVIDIA Corporation\NVSMI\nvidia-smi.exe")) {
        if (Test-Path $c) { $nvsmi = $c; break }
    }
}
if ($nvsmi) {
    Add '-- nvidia-smi --'
    $saidaNv = & $nvsmi --query-gpu=name,memory.total,driver_version --format=csv 2>&1
    foreach ($l in @($saidaNv)) { Add ([string]$l) }
} else {
    Add 'nvidia-smi: não encontrado (normal se não houver placa NVIDIA).'
}

# ---------- Disco ----------
Add ''
Add '== Espaço em disco (disco do usuário) =='
$letra = $env:SystemDrive
if ($env:USERPROFILE) { $letra = $env:USERPROFILE.Substring(0, 2) }
$disco = Ler-Classe 'Win32_LogicalDisk' | Where-Object { $_.DeviceID -eq $letra } | Select-Object -First 1
if ($disco) {
    Add ("Disco {0} livre: {1} de {2}" -f $disco.DeviceID, (Em-GB $disco.FreeSpace), (Em-GB $disco.Size))
} else {
    Add 'Não foi possível ler o espaço em disco.'
}

# ---------- Blender ----------
Add ''
Add '== Blender =='
$candidatos = New-Object System.Collections.Generic.List[string]
# Instalador oficial (Program Files) e versão da Steam.
$pastasBlender = @("$env:ProgramFiles\Blender Foundation")
if (${env:ProgramFiles(x86)}) {
    $pastasBlender += "${env:ProgramFiles(x86)}\Blender Foundation"
    $pastasBlender += "${env:ProgramFiles(x86)}\Steam\steamapps\common\Blender"
}
foreach ($pasta in $pastasBlender) {
    if ($pasta -and (Test-Path $pasta)) {
        foreach ($exe in @(Get-ChildItem -Path $pasta -Filter 'blender.exe' -Recurse -Depth 2 -ErrorAction SilentlyContinue)) {
            $candidatos.Add($exe.FullName) | Out-Null
        }
    }
}
foreach ($c in @(Get-Command 'blender.exe' -All -ErrorAction SilentlyContinue)) {
    if ($c.Path) { $candidatos.Add($c.Path) | Out-Null }
}
$unicos = @($candidatos | Sort-Object -Unique)
if ($unicos.Count -eq 0) {
    Add 'Blender não encontrado.'
} else {
    foreach ($b in $unicos) {
        # Lê a versão do próprio arquivo (não precisa abrir o Blender).
        $info = (Get-Item $b).VersionInfo
        $ver = $info.ProductVersion
        if (-not $ver) { $ver = $info.FileVersion }
        if (-not $ver) { $ver = 'versão não identificada' }
        Add (Anonimizar ("Encontrado: {0} -> Blender {1}" -f $b, $ver))
    }
}

# ---------- Salvar e mostrar ----------
$desktop = [Environment]::GetFolderPath('Desktop')
if (-not $desktop) { $desktop = Join-Path $env:USERPROFILE 'Desktop' }
$arquivo = Join-Path $desktop 'diagnostico-pc.txt'
$linhas | Out-File -FilePath $arquivo -Encoding UTF8

Write-Host ''
foreach ($l in $linhas) { Write-Host $l }
Write-Host ''
Write-Host 'Arquivo salvo na Área de Trabalho: diagnostico-pc.txt' -ForegroundColor Green
Write-Host ''
Read-Host 'Pressione Enter para fechar'
