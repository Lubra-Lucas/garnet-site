# Auditoria UX/UI e plano de melhorias — outubro/2026

Marco para voltar ao site anterior: branch `backup/site-antes-redesign-2026-10-28` (commit `7618b0d`).
Para restaurar, publique esse commit na branch de produção `claude/clever-heisenberg-pv96u6`.

Método: 5 auditorias paralelas (designer sênior, visitante iniciante e celular, cliente corporativo,
simulador e funil, técnica de performance/SEO/acessibilidade), com o site rodando localmente e Playwright
em 360, 390, 430, 768, 1024 e 1440 px, 4G simulado e navegação só por teclado. "Verificado" = medido
no navegador ou lido no código; "hipótese" = inferência.

## Pontos fortes a preservar

- Visual premium coerente: off-white, tinta e dourado; títulos Montserrat 300 com `<em>` Cormorant.
- História do estojo 3D no scroll comunica a especialidade em compactados sem parecer loja.
- Prova social imediata ("Já fabricamos para…") e vitrine com 100 fotos reais de produtos, filtro por marca.
- Fotos reais da fábrica; números confirmados (1992, 1.000 m², 50 mil un./mês, +150 marcas, BPF).
- Briefing curto com saídas honestas ("Ainda não sei", "A definir"), WhatsApp e e-mail, resposta em 1 dia útil.
- Simulador "Monte a sua make": diferencial real, 240 combinações sem erro, aviso de simulação ilustrativa.
- Zero erros de console e zero 404; sem rolagem horizontal; CLS ≈ 0; `prefers-reduced-motion` bem tratado.

## Problemas priorizados (Problema → Evidência → Impacto → Solução → Prioridade → Esforço)

### P0
| Problema | Evidência | Impacto | Solução | Esforço |
|---|---|---|---|---|
| Prévia do simulador some no celular/tablet | sticky só >1080 px; em 390 a prévia fica em top −979 px ao chegar em "Acabamento" (verificado) | o principal diferencial não funciona para a maior parte do tráfego | prévia sticky reduzida no topo | médio |
| 1ª tela do celular não diz o que a Garnet fabrica | `.chapter--hero .lead` oculto no mobile (verificado) | visitante do Instagram vê só "cosméticos" | lead curto no mobile | baixo |
| Imagens de conceito sem aviso | categorias usam imagens geradas por IA, sem nota visível (verificado) | risco de credibilidade; CLAUDE.md exige apresentar como exemplo | nota "Imagens ilustrativas de conceito" | baixo |

### P1
| Problema | Evidência | Impacto | Solução | Esforço |
|---|---|---|---|---|
| Contraste do dourado em textos pequenos | eyebrows `#b48a52` sobre off-white = 2,86:1 (verificado) | hierarquia some; falha WCAG 1.4.3 | token de dourado para texto ≥ 4,5:1 | baixo |
| Textos de 9–11 px | legendas do simulador 9,2 px, rodapé 10 px etc. (verificado) | leitura difícil | piso de 12 px | baixo |
| Botões fixos cobrem conteúdo e o botão "Continuar" | `.wa` sobre "Continuar" e "Abrir conversa no WhatsApp" (verificado) | toque errado no ponto de conversão | esconder no simulador/briefing | baixo |
| Sem skip link, 340 paradas de Tab, 200 cards duplicados | cópias do laço da vitrine focáveis (verificado) | teclado e leitor de tela inviáveis | skip link, cópias `inert` | baixo/médio |
| Foco invisível nas seções escuras | anel padrão preto sobre fundo escuro (verificado) | WCAG 2.4.7 | `:focus-visible` global dourado | baixo |
| Menu mobile e lightbox sem gestão de foco | links do menu fechado focáveis; Esc não fecha; Tab escapa do lightbox (verificado) | navegação por teclado quebrada | `inert`, Esc, foco preso e devolvido | baixo |
| Chips sem estado acessível | 0 `aria-pressed` em 62 chips (verificado) | leitor de tela não sabe o que está escolhido | `aria-pressed` | baixo |
| Briefing: erros genéricos, "Revisar" sem revisão, marca obrigatória | validação permissiva; foco não vai ao campo; botão promete revisão inexistente (verificado) | leads inválidos e abandono no último passo | erro por campo, resumo antes de enviar, marca opcional | médio |
| Jargão dos modelos sem explicação | "Mão de Obra", "Produção Mista" sem apoio no briefing (verificado) | iniciante escolhe errado ou desiste | linha "Para quem…" e dicas | baixo |
| Menu fora da ordem da página e sem Fábrica/Dúvidas | Cases é a 2ª seção, mas o 6º link; FAQ sem âncora (verificado) | gestor não acha capacidade, prazo, mínimo | reordenar e incluir seções | baixo |
| 150 frames do estojo baixados de imediato | 2,55 MB, 87% do peso inicial; `load` aos 18,7 s em 4G (verificado) | consumo de dados e travadas no início | carga progressiva; metade dos frames no celular | médio |
| SEO sem os termos buscados | title/description sem "fábrica", "private label" (verificado) | pouca descoberta | title, description, OG e JSON-LD | baixo |
| Contadores mostram "+0 marcas", "1950" | animação parte do zero (verificado) | número errado na tela de um site B2B | contagem a partir de ~85% | baixo |

### P2/P3 (seleção)
- Título "Marcas famosas que nasceram aqui" promete estudos de caso que não existem → "Marcas que já fabricamos".
- Dica da vitrine "passe o mouse" no celular → versão para toque.
- Cada categoria sem caminho para iniciar projeto → link "Iniciar projeto" que pré-marca a categoria no briefing.
- "GARNET" gigante do rodapé cortado (scrollWidth 1525 > 1440).
- Ritmo vertical com telas quase vazias; eixos esquerdos diferentes entre seções.
- Simulador: relevo visível com desenho "Liso", "—" na mensagem com campo vazio, sem "Recomeçar".
- Vitrine e marquees sem botão de pausa (WCAG 2.2.2); cursor personalizado parado no canto em tablets.
- `lab/` publicado; `_headers` sem efeito no GitHub Pages (cache de 10 min nos frames) — depende do dono.

## Implementado nesta rodada
Ver a seção "Resultados" abaixo (preenchida após os testes).

## Propostas estruturais (aguardam aprovação)
1. Reordenar a página: hero → o que fabricamos → modelos → como funciona → prova (cases + números + fábrica) → simulador → FAQ → briefing. Hoje as categorias começam a 7,5 telas do topo no celular.
2. Unificar Números, Fábrica e Manifesto num bloco "Sobre a Garnet" com 4 números visíveis (sem cards que viram).
3. Encurtar a história do estojo no celular (300vh → ~200vh).
4. Comparativo dos modelos de produção (quem fornece fórmula, embalagem, quem coordena) — depende de confirmação da Garnet.

## Dependem de conteúdo ou decisão da Garnet
- Qualidade e ANVISA: AFE, quem notifica o produto, laudos — publicar só o confirmado.
- Pedido mínimo e amostra (faixas públicas? amostra paga?).
- Responsabilidades por modelo (propriedade da fórmula, quem compra insumo, regulatório).
- Estudos de caso reais e depoimentos autorizados por escrito.
- Fotos reais de perfumaria, skincare, corpo e lábios; fotos de laboratório e controle de qualidade.
- Política de privacidade (o site coleta nome, telefone e e-mail via WhatsApp/e-mail).
- Analytics com consentimento (eventos sugeridos: cliques em CTA, uso do simulador, passos do briefing, cliques no WhatsApp; nunca enviar dados pessoais).
- Branch de deploy (`pages.yml` publica de uma branch temporária) e remoção de `lab/` do site publicado.
