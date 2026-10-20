# Fluxo de imagens da vitrine

Fotos originais: branch `fotos` do repositório (pastas por marca).
`git fetch origin fotos && git worktree add ../fotos origin/fotos` deixa as fotos em `../fotos`.

## 1. Gerar variações com IA (Gemini)
Requer `GEMINI_API_KEY` nas variáveis do ambiente (vale para sessões abertas depois de configurar).

    python3 tools/vitrine/gerar_ia.py --listar-modelos
    python3 tools/vitrine/gerar_ia.py --ref "../fotos/BOCA ROSA/arquivo.png" --nome bocarosa-omg --variacao angulo --qtd 2

As imagens ficam em `revisao/` (ignorada pelo git) para aprovação. Regras:
- só variações de produtos **reais** (ângulo, aberto, com caixa, detalhe); nunca inventar produto;
- comparar com a foto original: logo, textos, formato e tons das sombras precisam ser idênticos.

## 2. Colocar uma foto aprovada na vitrine

    python3 tools/vitrine/padronizar.py --foto revisao/arquivo.png --slug bocarosa-omg-ia1 --marca bocarosa --nome "#OMG!"

Gera o quadro padronizado (recorte + fundo de estúdio), a foto em tela cheia e acrescenta a linha em
`assets/js/vitrine-data.js` (no fim; se quiser, reposicione a linha para não ficar ao lado de outra
foto do mesmo produto).
