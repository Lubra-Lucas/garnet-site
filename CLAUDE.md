# Regras do projeto (para IA e pessoas)

- Site estático: `index.html` + `assets/css/style.css` + `assets/js/main.js`. Sem framework e sem build.
  Não introduza React, bundlers ou dependências novas sem pedido explícito.
- Idioma do conteúdo: português do Brasil. Os comentários do código também ficam em português.
- Visual: fundo off-white `--bg`, texto `--ink`, dourado `--gold`/`--gold-2`. Títulos em Montserrat 300.
  As palavras em destaque usam `<em>` (Cormorant itálico com brilho dourado). Use os tokens do `:root`
  e não crie cores soltas.
- Toda animação nova precisa: (1) respeitar `reduced` / `prefers-reduced-motion`; (2) usar
  GSAP/ScrollTrigger já carregados; (3) não animar `transform` de elementos que já são controlados por
  variáveis CSS (ex.: `.story__canvas`, que usa `--cx/--cy/--cs`).
- Cards com efeito de vidro + tilt: adicione as classes `glass` (ou `glass glass--dark`) e o atributo
  `data-tilt` (opcional: `data-tilt-max`).
- Dados ainda não confirmados pela Garnet levam a classe `sim` e a etiqueta `<em class="simtag">`.
  Ao substituir por um dado real, remova os dois e atualize `docs/dados-simulados.md`.
- Contato: todos os formulários terminam no WhatsApp `5511981531188`. Não há backend.
- Imagens: WebP, no máximo ~1400px no lado maior, em `assets/img/`.
- Não mexa no domínio nem no ambiente de produção sem autorização do dono do projeto.
