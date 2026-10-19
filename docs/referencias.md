# Referências estudadas

Análise feita a partir do HTML e dos scripts públicos de cada site (outubro/2026).

## MBOOM — mboom.com.br (referência de interação)

- Loja **Shopify** com um trecho de código feito à mão na home.
- **Técnica principal: sequência de imagens no scroll.** Um `<canvas id="canvas">` fixo desenha
  **772 frames** pré-renderizados do mascote 3D "Mboomie". O frame mostrado depende do scroll:
  - Cada seção tem um frame-alvo (`SECTION_STOPS`: `hero → 1`, `mag_soft → 250`, `pop_stick → 340` … `vibe → 772`).
  - Posição e escala por trecho, separadas para desktop e celular (`DESKTOP_KEYS`, `MOBILE_KEYS`).
  - Loop parado nos frames 1–168 a 30 fps até o visitante rolar.
  - Carrega só 36 frames por vez (`WINDOW = 36`), em 6 larguras (640 a 2560 px).
- **ScrollMagic** fixa (pin) os blocos de compra de cada produto.
- **Como usamos na Garnet:** estojo de pó compacto com 150 frames que gira, abre, troca de cor e se
  desmonta em camadas, com a posição trocando de lado conforme o texto. Usamos GSAP ScrollTrigger
  no lugar do ScrollMagic, que está descontinuado.

## Tibidle — tibidle.com (referência de atmosfera)

- **Next.js (React)** em português e inglês, sem bibliotecas pesadas de animação.
- Canvas de **"brasas"**: até 70 partículas quentes subindo com ondulação senoidal. É desligado com
  `prefers-reduced-motion`.
- **Cards de vidro com tilt** (`[data-tilt]`, classe `.glass`): no `pointermove`, aplica
  `perspective(900px) rotateY/rotateX` de até 3,2° (7° nos cards em destaque) e grava a posição do
  mouse em `--mx/--my`. Um `radial-gradient` em `::before` usa essas variáveis para o brilho seguir o
  cursor. Esse é o efeito da tabela de highscore.
- Fundo em camadas (imagem + gradiente), animações em CSS puro (`fadeUp`, `glowPulse`, `shine`) e
  conteúdo vivo (ranking que atualiza a cada 35 s, patch notes, eventos).
- **Como usamos na Garnet:** poeira dourada no lugar das brasas, cards de vidro com tilt (números,
  modelos, cases, depoimentos e a tabela "Linha de produção · agora"), brilho dourado nos títulos.

## Concorrentes

| | Lew Cosméticos (lewcosmeticos.com.br) | Frosini Cosméticos (frosinicosmeticos.com.br) |
|---|---|---|
| Tecnologia | WordPress + Elementor | WordPress + tema próprio (Bootstrap, jQuery, Owl Carousel, Contact Form 7) |
| Animações | Entradas padrão do Elementor (fade-in) | AOS (fade no scroll) e carrossel |
| Argumentos | Desde 2004, fábrica de 120 → 1.050 m², até 400 mil unidades/mês, P&D, BPF, ANVISA, vegano, pequenas quantidades, consultoria, marketing olfativo | +20 anos, ANVISA, vegano, sustentabilidade, processo em etapas |
| Foco | Perfumaria e skincare | Cabelos, rosto, corpo, higiene e pet |
| Conversão | WhatsApp, formulário e "Agende uma reunião" | Formulário e WhatsApp |

**Vantagens da Garnet:**
- é a mais antiga (1992);
- é especialista em compactados, nicho que os dois não ocupam;
- tem cases com marcas conhecidas e aparições na mídia.

**O que faltava no site antigo:** números da fábrica e credenciais (ANVISA/BPF), que os dois
concorrentes mostram logo no topo. O protótipo já tem esse bloco, com dados simulados até a Garnet
informar os reais.

**Diferenciais do novo site que nenhum dos concorrentes tem:**
- a história contada pelo estojo 3D no scroll;
- o configurador de produto;
- o briefing guiado;
- a linha de produção "ao vivo".
