# Comercial "Do pó à paleta": plano (revisão 1.1)

Status: **primeira prévia 3D (animatic) em produção**. O conceito está aprovado.
Data: 01/11/2026.

Etiquetas usadas no texto:
- **[CONFIRMADO]**: decisão ou informação dada por você.
- **[HIPÓTESE]**: valor de trabalho, ajustável.
- **[CONCEITUAL]**: representação visual, não reprodução do processo ou equipamento da Garnet.
- **[PENDENTE]**: depende de uma informação.

Arquivos do projeto: `tools/comercial-blush/` (comece pelo `README.md` e pelo `ESPEC.md`).

---

## 1. Decisões confirmadas

| # | Decisão | Origem |
|---|---|---|
| 1 | Produto: paleta Boca Rosa Beauty de 3 cores, tampa de acrílico rosado com glitter e logo em relevo. A foto de catálogo enviada é a referência de embalagem, cores, proporções, acabamento e posição da tampa. | [CONFIRMADO] |
| 2 | A marca autoriza o uso público do produto no filme. | [CONFIRMADO] |
| 3 | O comercial é assinado pela **Garnet**, com assinatura separada do produto. A embalagem fica intacta. | [CONFIRMADO] |
| 4 | Direção criativa **"Escala"**: realismo de estúdio e mudanças de escala da câmera. | [CONFIRMADO] |
| 5 | Filme **inteiramente em 3D** (cenários, produto, máquina, partículas e câmera). Imagens só como referência ou textura. | [CONFIRMADO] |
| 6 | Ferramenta: **Blender** (render final no seu computador). Remotion fora. | [CONFIRMADO] |
| 7 | Sem filmagem real. Se a mão for necessária, é 3D, com enquadramento breve e parcial. | [CONFIRMADO] |
| 8 | Dosagem **automática**. | [CONFIRMADO] |
| 9 | O blush chega à montagem **já prensado numa forminha de metal** (godê), que funciona como bandeja do produto. | [CONFIRMADO] |
| 10 | O último quadro não precisa ser literalmente a foto. Prioridade: produto 3D convincente e enquadramento muito próximo. Projeção da foto só se um teste provar que funciona. | [CONFIRMADO] |

**Não confirmado** (e por isso tratado como [CONCEITUAL] no filme): como a prensa é alimentada; o interior da máquina; se a rasagem é feita por lâmina ou sapata; como o godê é fixado no estojo; o formato do recipiente do granel.

## 2. Análise da foto de catálogo

Feita por medição de pixels e calibração de câmera (`tools/comercial-blush/verificar/calibrar_camera.py`).

- **Câmera da foto:** elevação 51,2°, lente equivalente a 116 mm (sensor de 36 mm), distância de 413 mm. Erro médio dos 14 pontos de controle: **0,7 px**.
- **Proporções do estojo** (dependem da hipótese "godê com 36 mm visíveis"): base com 120,5 × 52,2 × 11,2 mm, centros dos godês a 37,4 mm e tampa aberta a ~118°. A geometria e o enquadramento não dependem da escala absoluta. Só a física do pó e o desfoque dependem dela.
- **Cores** (mediana do centro de cada godê, sRGB):

  | Godê | Cor | Acabamento |
  |---|---|---|
  | esquerdo | `#AE745C` marrom | fosco |
  | meio | `#E8857A` coral | brilho fino |
  | direito | `#E8B8A7` champanhe/pêssego | brilho fino |

- **Detalhes visíveis que entram no modelo:**
  - painel interno levemente rebaixado onde ficam os godês;
  - aro metálico fino em cada godê;
  - entalhe horizontal na face frontal;
  - dobradiças com 2 encaixes;
  - tampa translúcida rosada com glitter multicolorido;
  - logo **"BOCAROSA beauty"** em relevo na tampa.
- **[PENDENTE]** Os godês do meio e da direita mostram uma textura fina e ondulada. Pode ser relevo prensado ou só o reflexo do brilho. Até confirmar, ela será tratada como acabamento do material, sem relevo.

### Cor protagonista: recomendo o **coral (godê do meio)**

1. É o "blush" da paleta. O marrom e o champanhe têm cara de contorno e de iluminador.
2. Fica **no centro**: o herói desce no eixo da câmera e o enquadramento final fica simétrico.
3. É a cor mais saturada e se lê bem tanto no fluxo quanto no grão ampliado.
4. Tem brilho fino, que nos macros vira pontos de luz sutis, sem parecer glitter.

As outras duas aparecem em **canais separados** na viagem micro (marrom à esquerda e champanhe à direita, na mesma posição que ocupam na paleta) e **já prensadas** no estojo. Nunca se misturam.

## 3. Narrativa ajustada

| # | Etapa | Status | Como aparece |
|---|---|---|---|
| 1 | Recipiente aberto com o pó **já pronto para prensagem** | fiel na ideia, forma [PROVISÓRIA] | pote branco sobre bancada de inox |
| 2 | Mão de luva azul (só o punho) recolhe o pó com uma concha | [CONCEITUAL] no gesto | entra e sai do quadro em ~5 s, sem close da mão |
| 3 | Despejo na tremonha de alimentação, com a câmera seguindo o fluxo | [CONCEITUAL]: alimentação real não confirmada | |
| 4 | **Corte 1**: a câmera entra na garganta escura | corte invisível | |
| 5 | Viagem micro: grãos do coral, canais laterais das outras cores, peneira e saída iluminada | **[CONCEITUAL]**: não é o interior da máquina da Garnet | |
| 6 | **Corte 2**: clarão da saída e nuvem de pigmento | corte invisível | |
| 7 | Dosagem automática no godê de metal, com monte acima da borda | dosagem automática [CONFIRMADO]; mecanismo [CONCEITUAL] | |
| 8 | Rasagem: a mesa leva o godê sob uma lâmina fixa e o excesso cai numa bandeja coletora | [CONCEITUAL] | |
| 9 | Compactação: o punção desce e sobe, revelando a superfície acetinada | [CONCEITUAL] na forma da prensa | |
| 10 | Ejeção: o godê sobe já prensado | godê de metal prensado [CONFIRMADO] | |
| 11 | **Corte 3**: corte por correspondência na superfície prensada (mesma imagem, outro cenário) | corte invisível | |
| 12 | O godê desce na cavidade central do estojo, ao lado dos outros dois | fixação real [PENDENTE] (sem cola ou encaixe mostrados) | |
| 13 | Recuo até o enquadramento da foto e revelação da paleta aberta | fiel ao produto | |
| 14 | Assinatura da Garnet na faixa branca inferior, em 2D, sem tocar no produto | [CONFIRMADO] | |

## 4. Roteiro técnico (28 s, 30 fps, 1080×1920)

| Tempo | Quadros | Ação | Enquadramento / lente | Câmera | Luz | Som (pendente) | Transição |
|---|---|---|---|---|---|---|---|
| 0:00–2:10 | 1–65 | recipiente, entrada da concha | 3/4 alto, 40 mm | aproximação lenta | principal do alto à esquerda, sala branca ao fundo | ambiente de sala limpa | abertura direta |
| 2:10–5:30 | 66–165 | concha sobe, vai à tremonha e despeja | médio, 40 mm | sobe e acompanha, depois olha para baixo | idem, contraluz no fluxo | pó deslizando | — |
| 5:30–6:20 | 166–189 | entra na garganta | ponto de vista | mergulho | escurece | "whoosh" grave | **corte 1** |
| 6:20–11:15 | 190–344 | viagem micro | grande-angular 20 mm, foco curto | descida contínua e acelerada | luz vinda da saída | textura granular | **corte 2** |
| 11:15–14:20 | 345–439 | dosagem, monte | macro lateral, 116 mm | sai da nuvem e recua para a lateral | rasante | pó caindo | — |
| 14:20–16:20 | 440–500 | rasagem, excesso | macro lateral | travelling para a direita com a mesa | rasante | raspagem seca | — |
| 16:20–19:10 | 501–578 | prensagem | 3/4 de cima | sobe | rasante | batida seca | — |
| 19:10–20:15 | 579–614 | ejeção, close extremo | de cima | aproximação extrema | — | — | **corte 3** |
| 20:15–23:00 | 615–690 | godê desce no estojo | de cima → 3/4 | recua | estúdio | "clique" macio | — |
| 23:00–25:10 | 691–760 | revelação | pose da foto | recuo e arco até a pose calibrada | estúdio | nota final | — |
| 25:10–28:00 | 761–840 | pausa + assinatura (a partir de 26:05) | idem | parada | idem | silêncio | fim |

## 5. Mapa de continuidade

As regras completas estão em `tools/comercial-blush/ESPEC.md`. Em resumo:
- O material desce sempre de cima para baixo e avança da esquerda para a direita.
- A luz principal fica no alto à esquerda.
- O coral mantém o mesmo valor de cor em todos os cenários.
- As trocas de escala ocorrem só dentro de escuro, nuvem ou close extremo.
- A mão aparece só nos primeiros ~5 s.
- O mesmo godê (`PROD_godê_heroi_A` / `_C`) liga a fábrica ao estúdio.

**Escala do pó:**
- Nos planos abertos, o pó é nuvem de pontos com grão abaixo do pixel, então se lê como pó.
- No micro, os grãos são irregulares, com 2,5–12 mm no cenário ampliado (equivalente a ~3–12 µm), com desfoque e queda lenta.
- Os grãos nunca ficam maiores que ~1/20 do quadro, para não virarem "pedras".

## 6. Chegada à foto final: resultado do primeiro teste

1. O estojo foi reconstruído em 3D com as proporções calibradas e a câmera colocada na pose calculada.
2. A sobreposição com a foto deu **IoU de 0,90**, que é a sobreposição entre a silhueta do render e a da foto, de 0 a 1.
3. As cores dos godês ficaram com diferença de 1 a 7 níveis (em 255) por canal, depois de 4 iterações de calibração automática (`verificar/calibrar_cores.py`).
4. **Conclusão:** o encerramento 3D com câmera calibrada é viável. A projeção da foto **não** é necessária por enquanto.

Itens a fazer no acabamento (M4):
- glitter e logo em relevo da tampa;
- painel interno rebaixado;
- aro e reflexo dos godês;
- textura de brilho do coral e do champanhe;
- sombra de contato no piso branco.

O logo da tampa será extraído da própria foto (retificado com a câmera calibrada) ou de um vetor da marca, se você conseguir.

## 7. Ferramentas e execução

**Testado no contêiner:**
- Blender **5.2.3 LTS** (versão estável de longo prazo atual), baixado de download.blender.org com checksum SHA-256 conferido.
- Cycles na CPU funciona.
- EEVEE funciona via tela virtual, mas é lento sem GPU.
- FFmpeg 6.1 para montar o vídeo.

**Ainda não testado no seu computador:** tudo. Os scripts de `tools/comercial-blush/sistema/` identificam sistema, CPU, RAM, GPU e o melhor dispositivo de render do Blender. O `.sh` e o `.py` rodaram no contêiner. O `.ps1` (Windows) **não pôde ser executado aqui**.

### Opções de render final

| Cenário | Proposta | Impacto |
|---|---|---|
| GPU NVIDIA/AMD/Apple recente | Cycles na GPU, 1080×1920, 64–128 amostras + remoção de ruído | horas; qualidade máxima |
| Só CPU (desktop 6–8 núcleos) | Cycles, 1080×1920, 32–64 amostras + remoção de ruído, **render por etapas** (blocos de quadros, retomável) | provavelmente dezenas de horas, em noites; ruído controlado pelo denoiser |
| Só CPU, prazo curto | 720×1280 renderizado e ampliado para 1080×1920, ou simplificar o trecho micro (menos grãos, sem volume) | perda leve de nitidez |
| Notebook fraco | EEVEE (tempo real do Blender) | rápido, porém com menos realismo no pó e no acrílico |

O tempo real será medido no seu computador com o comando da seção 3 do `README.md` antes de decidir.

## 8. Agentes e skills

| Função | Execução nesta etapa |
|---|---|
| Direção e continuidade | Eu, com a especificação única em `ESPEC.md` + `config.py` |
| Modelagem e materiais | Eu (`cena/construir.py`) |
| Animação, partículas e câmera | Eu (mesmo script, Geometry Nodes e chaves de forma) |
| Renderização e revisão | Eu (scripts em `verificar/`); revisão independente por subagente sem as minhas conclusões, prevista para o M3 |
| Diagnóstico do computador | **Subagente real** (tarefa independente): criou `sistema/` e testou o `.sh` e o `.py` |

**Skills:** nenhuma skill nova foi instalada.
- Remotion está fora do projeto.
- Não há skill oficial de Blender: o Blender é controlado por scripts Python no modo `-b`.
- Uso das skills disponíveis na sessão: `code-review` antes do M3.

## 9. Imagens do ChatGPT

**Nenhuma é necessária nesta etapa.** Cenários, máquina, pó e produto são procedurais ou 3D, e a referência do produto é a sua foto. O pacote de prompts da versão anterior está suspenso.

Se no acabamento faltar referência visual da produção, vou entregar o prompt com finalidade e anexos. O provável candidato é a superfície prensada do coral em macro, só se a foto não bastar.

## 10. Marcos

| Marco | Entrega | Status |
|---|---|---|
| M0 | Plano | aprovado |
| M1 | Foto analisada, câmera e cores calibradas, especificação única | **feito** |
| M2 | **Animatic 3D** (360×640, provisório e legendado) + quadros-chave | **em entrega** |
| M3 | Trecho crítico detalhado: pó caindo no godê, rasagem, compactação e revelação (look final, ~8 s) | após aprovação do M2 |
| M4 | Produto final: tampa com glitter e logo, detalhes, sombra; teste de encaixe em resolução cheia | depois do M3 |
| M5 | Materiais finais da fábrica, mão refinada, viagem micro final, som | depois do M4 |
| M6 | Render final no seu computador + montagem + revisão | depois do M5 |

## 11. Critérios de aprovação (inalterados, com métricas)

1. **Continuidade:** nenhum corte perceptível, seguindo as regras do `ESPEC.md`.
2. **Três cores corretas:** diferença ≤ 3 ΔE2000 em relação à foto na pose final (agora: 1 a 7 níveis RGB). As cores nunca se misturam.
3. **Fidelidade da embalagem:** IoU de silhueta ≥ 0,95 no acabamento (agora 0,90, com tampa e detalhes ainda provisórios).
4. **Marca legível:** logo da tampa nítido na pausa final e assinatura da Garnet separada do produto.
5. **Sem interpenetração:** verificada em folhas de contato nos trechos de contato.
6. **Processo compreensível sem som.**
7. **Estética:** sem brilho plástico, sem "pedras" no pó e sem máquina fantasiosa apresentada como real.
8. **Técnico:** 1080×1920, 30 fps, 840 quadros, conferido por `ffprobe`.
9. **Conformidade:** autorização da marca [CONFIRMADO]; conteúdo conceitual identificado.

## 12. O que ainda preciso de você

**Indispensável**
1. **Uma medida real:** a largura do estojo **ou** o diâmetro de um godê (régua serve). Ela fixa a escala de todo o modelo.
2. **Diagnóstico do computador:** siga `tools/comercial-blush/sistema/LEIA-ME.md` e me envie o resultado.
3. **Avaliação do animatic:** ritmo, ordem, cortes e enquadramento final.

**Opcional**
- Foto da produção, mesmo pouco nítida. Vou usar o que der para os volumes da prensa e indicar o que continuar incerto.
- A textura ondulada no coral e no champanhe é relevo ou só brilho?
- Logo da Garnet em vetor (SVG/PDF). O animatic usa o PNG do site como provisório.
- Logo da Boca Rosa em vetor para o relevo da tampa. Sem ele, extraio da foto.
