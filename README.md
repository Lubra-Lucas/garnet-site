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
assets/img/modelos/     fotos de fundo da abertura (trocam suavemente)
assets/img/vitrine/     quadros padronizados da vitrine (720×900) e full/ com as fotos originais
assets/js/vitrine-data.js  lista de produtos da vitrine (marca e nome)
assets/img/site/        logo, favicon e fotos de produto
tools/render-sequence/  gerador dos frames do antigo estojo 3D (fora do site desde nov/2026)
docs/                   referências e lista de dados simulados
_headers                cache para o Cloudflare Pages
```

## Tecnologias e onde estão no código

| Efeito | Técnica | Bloco em `main.js` |
|---|---|---|
| Abertura com fotos de modelos correndo | Duas colunas de cartões em laço contínuo (GSAP) ao lado do texto; no celular, uma faixa acima do texto | "abertura: capítulos" e "abertura: fotos" |
| Scroll suave | Lenis | "scroll suave" |
| Animações no scroll, seções fixadas, scroll horizontal | GSAP + ScrollTrigger | vários |
| Poeira dourada flutuando | Partículas em canvas (como as "brasas" do Tibidle) | "poeira dourada" |
| Cards de vidro que inclinam com o mouse e brilham onde o cursor passa | `perspective` + `rotateX/Y` + variáveis CSS `--mx/--my` (tabela de highscore do Tibidle) | "tilt 3D" |
| Faixa de mídia que acelera com o scroll | Marquee ligado à velocidade do Lenis | "marquee" |
| Vitrine infinita de produtos | Duas fileiras em laço contínuo, filtro por marca, foto original em tela cheia | "cases: vitrine infinita" |
| Configurador do compacto | SVG gerado em JS, mensagem pronta para o WhatsApp | "configurador" |
| Briefing em 5 passos com pré-qualificação | Formulário guiado, classificação A/B/C, envio pelo WhatsApp | "briefing guiado" |
| Botões magnéticos | GSAP `quickTo` | "botões magnéticos" |

Quem tem "reduzir movimento" ativado no sistema (`prefers-reduced-motion`) recebe uma versão sem
animações, com todo o conteúdo visível.

## Fotos da abertura

As fotos da abertura ficam em `assets/img/modelos/` (WebP, até 1400 px) e aparecem em duas colunas
(`.story__col`) dentro de `.story__photos` no `index.html`. Cada coluna repete a mesma lista duas vezes,
para o laço contínuo não ter emenda: ao trocar ou acrescentar uma foto, mude as duas cópias.
`--fx` define o ponto do rosto na horizontal para o recorte do cartão.

## Publicação (Cloudflare Pages)

O site é estático: no Cloudflare Pages, conecte este repositório com **build command vazio** e
**output directory `/`**. Cada push na branch de produção publica automaticamente. Cada branch
ganha um endereço de prévia. O domínio só deve ser apontado depois da aprovação do site.

## Incluir produtos na vitrine

As fotos originais ficam na branch `fotos` do repositório, em pastas por marca. Para cada produto novo:

1. Recorte o produto (rembg com o modelo `birefnet-general`) e monte o quadro padronizado
   720×900 (fundo de estúdio off-white, sombra e halo na cor do produto). Salve como
   `assets/img/vitrine/<nome>.webp`.
2. Salve a foto original reduzida (até 1200 px) em `assets/img/vitrine/full/<nome>.webp`.
3. Acrescente uma linha em `assets/js/vitrine-data.js` com `slug`, `brand` e `name`.
