# Garnet Cosméticos — site institucional (protótipo)

Novo site da Garnet, feito do zero em HTML, CSS e JavaScript puros, sem React e sem Lovable.
Do site antigo foram aproveitados só os textos e as imagens. As técnicas de animação foram estudadas
nas referências descritas em [`docs/referencias.md`](docs/referencias.md).

> Publicado em **https://garnetcosmeticos.com.br** (GitHub Pages). O que ainda é ilustrativo
> está listado em [`docs/dados-simulados.md`](docs/dados-simulados.md).

## Como rodar no computador

Não há build. Basta servir a pasta:

```bash
npx serve .            # ou: python3 -m http.server 8080
```

Abra o endereço mostrado no terminal. Abrir o `index.html` direto no navegador (file://) não funciona
bem, porque o canvas precisa carregar os frames por HTTP.

## Estrutura

```
index.html              página única com todas as seções
assets/css/style.css    estilos (tokens no topo, depois uma seção por bloco do site)
assets/js/main.js       todas as interações, separadas por blocos comentados
assets/vendor/          GSAP 3.13, ScrollTrigger e Lenis 1.3 (cópias locais)
assets/seq/             150 frames WebP do estojo (sequência do scroll)
assets/img/cases/       fotos reais dos 12 cases
assets/img/site/        logo, favicon e fotos de produto
tools/render-sequence/  gerador dos frames do estojo (Three.js + Chromium)
docs/                   referências e lista de dados simulados
_headers                cache para o Cloudflare Pages
```

## Tecnologias e onde estão no código

| Efeito | Técnica | Bloco em `main.js` |
|---|---|---|
| Estojo que gira, abre, muda de cor e se desmonta | Sequência de frames num `<canvas>` controlada pelo scroll (técnica da MBOOM) | "sequência de frames" e "linha do tempo da história" |
| Scroll suave | Lenis | "scroll suave" |
| Animações no scroll, seções fixadas, scroll horizontal | GSAP + ScrollTrigger | vários |
| Poeira dourada flutuando | Partículas em canvas (como as "brasas" do Tibidle) | "poeira dourada" |
| Cards de vidro que inclinam com o mouse e brilham onde o cursor passa | `perspective` + `rotateX/Y` + variáveis CSS `--mx/--my` (tabela de highscore do Tibidle) | "tilt 3D" |
| Faixa de mídia que acelera com o scroll | Marquee ligado à velocidade do Lenis | "marquee" |
| Texto que acende palavra por palavra | ScrollTrigger com `scrub` | "manifesto" |
| Configurador do compacto | SVG gerado em JS, mensagem pronta para o WhatsApp | "configurador" |
| Briefing em 4 passos | Formulário guiado, envio pelo WhatsApp | "briefing guiado" |
| Cursor personalizado e botões magnéticos | GSAP `quickTo` | "cursor personalizado" |

Quem tem "reduzir movimento" ativado no sistema (`prefers-reduced-motion`) recebe uma versão sem
animações, com todo o conteúdo visível.

## Trocar o estojo pelo render definitivo

1. Renderize a animação final (Blender, Cinema 4D ou outro) em **frames quadrados com fundo transparente**.
2. Salve como `assets/seq/compact-000.webp` … `compact-NNN.webp`.
3. Ajuste `SEQ.frames` no topo de `assets/js/main.js` para o novo total.
4. Se o roteiro mudar, ajuste os tempos dos capítulos em "linha do tempo da história".

Para regerar o estojo do protótipo: `cd tools/render-sequence && npm install && npm run render`.

## Publicação (Cloudflare Pages)

O site é estático: no Cloudflare Pages, conecte este repositório com **build command vazio** e
**output directory `/`**. Cada push na branch de produção publica automaticamente. Cada branch
ganha um endereço de prévia. O domínio só deve ser apontado depois da aprovação do site.
