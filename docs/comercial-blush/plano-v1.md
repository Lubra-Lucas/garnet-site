# Comercial "Do pó à paleta": plano da versão 1

Status: **planejamento para aprovação**. Nada foi implementado, instalado ou renderizado.
Data: 01/11/2026.

Neste documento, os itens marcados **[HIPÓTESE]** são suposições de trabalho que precisam ser confirmadas.
Os itens marcados **[CONFIRMAR COM A GARNET]** dependem do processo real da fábrica.

---

## 0. O que foi verificado antes de planejar

| Item | Resultado | Como foi verificado |
|---|---|---|
| Onde rodo | Contêiner na nuvem com 4 CPUs, 15 GB de RAM e **sem GPU**. **Não é o seu computador**: não consigo ver a sua máquina, por isso a configuração dela está entre as perguntas. | `nproc`, `free`, `nvidia-smi` (ausente) |
| Blender | **Não instalado** no contêiner | `command -v blender` |
| FFmpeg / ffprobe | Instalados (6.1.1) | `ffmpeg -version` |
| Node / npm | Node 22, npm 10 | `node --version` |
| Chromium + Playwright | Pré-instalados no contêiner | Ambiente |
| ImageMagick | 6.9 (comando `convert`) | `convert --version` |
| Three.js no repositório | Já usado em `tools/render-sequence` (three 0.180 + playwright-core) para renderizar quadro a quadro o estojo 3D do site. É um pipeline que já existe e funciona. | `tools/render-sequence/package.json` |
| Fotos reais da fábrica | `assets/img/fabrica/` (produção com máquinas, conferência, embalagem). Mostram bancadas de inox, jaleco branco, touca e **luvas nitrílicas azuis**. | Arquivos do repositório |
| Paleta de 3 cores já no site | `assets/img/cases/bocarosa-copacabana.webp`: arte de divulgação (praia, cartucho), **não é foto de catálogo neutra**. Ela não serve como enquadramento final. | Arquivo do repositório |

**Licenças verificadas**

| Ferramenta | Licença | Implicação |
|---|---|---|
| Blender | GPL. As imagens e os vídeos renderizados pertencem a quem os cria. | Uso comercial sem custo |
| Three.js | MIT (arquivo LICENSE do repositório oficial) | Uso comercial sem custo |
| FFmpeg | LGPL/GPL | Uso comercial para codificar vídeo sem custo |
| Playwright | Apache-2.0 | Uso comercial sem custo |
| **Remotion** | Licença própria (LICENSE.md do repositório oficial, 2026). É gratuita para indivíduos, empresas com **até 3 funcionários**, organizações sem fins lucrativos e avaliação. Acima disso, exige **Company License** paga. | A Garnet (1.000 m², +150 marcas) quase certamente precisaria da licença paga se fosse a usuária. Isso pesa contra o Remotion (ver seção 2). |
| HDRIs Poly Haven | CC0 | Iluminação de estúdio realista sem custo, sem depender de imagem gerada |
| Imagens do ChatGPT | Pelos termos da OpenAI, o resultado pertence a você. Isso **não** dá direito de uso a marcas de terceiros que apareçam nele. | Não usar logos gerados. Logo e embalagem vêm só da foto real. |

**Marca do cliente.** Se o produto for de uma marca cliente (ex.: Boca Rosa), um filme público que mostra a embalagem e o logo dela precisa de **autorização da marca**. A regra do projeto vale aqui: não publicar o que não foi confirmado.

---

## 1. Interpretação e direções criativas

### Interpretação

O filme é **uma tomada contínua** que começa na escala humana (a bancada), mergulha até a escala do grão, volta à escala humana dentro da prensa e termina na escala de catálogo. A emoção vem da **mudança de estado**: o pó solto, sem forma, que se espalha, vira uma superfície lisa, firme e definida dentro de um objeto de marca. O pó é o protagonista, a câmera é o seu acompanhante e o operador é só a mão que dá início ao movimento.

### Ajustes de processo que proponho (a ordem original não bate 100% com o processo real)

Este é o processo típico de pó compactado. **[CONFIRMAR COM A GARNET]**

1. Pesagem das matérias-primas.
2. Mistura da fase seca com os pigmentos e adição do ligante (fase oleosa).
3. Moagem e peneiração. O resultado é o **granel** de **um tom**.
4. Na prensa, o **godê** (a bandeja metálica) é colocado no molde.
5. O pó é dosado **com excesso**.
6. O excesso é **rasado** (nivelado) na altura do molde.
7. O punção desce e **compacta**.
8. O godê é ejetado e as bordas são limpas.
9. Cada godê é **colado** no estojo.

| Sua ordem | Problema | Ajuste proposto |
|---|---|---|
| 1. "Embalagem de matéria-prima" | Um pigmento cru não tem a cor do blush final. Mostrar pigmento vermelho puro e depois um pó rosado exigiria uma mistura em cena, e você pediu para não misturar cores. | A embalagem aberta é o **granel do tom herói, já pronto para prensar**. Na tela, a cor do pó é a mesma do início ao fim. |
| 3–5. "Alimentação da máquina" e "preparação do pó" | A mistura e a moagem acontecem **antes** da prensa, em outro equipamento. | A "máquina" é a **alimentação/dosagem da prensa**. O trecho interno é uma **interpretação conceitual** (peneira, desaglomeração, luz) e não mostra um equipamento real. Isso fica explícito no plano. |
| 7. "Compactação e remoção do excesso" | O excesso sai **antes** da compactação (rasagem) e depois há só uma limpeza leve. | Ordem visível: **dosar com excesso → rasar (a lâmina empurra o excesso para fora) → prensar → revelar a superfície lisa**. |
| 8. "Bandeja integrada ao estojo" | Em paletas com godês, cada cor é prensada no seu godê e depois colada no estojo. **[HIPÓTESE]** Algumas paletas são prensadas direto no estojo. | Se forem godês, o herói desce para a cavidade dele, ao lado dos outros dois já prensados. Se for prensagem direta, o estojo já está no molde desde a cena 5. **Isso muda a cena 5 e precisa ser confirmado.** |

### Como tratar as três cores sem misturar

- **Uma cor herói** faz a jornada inteira. **[HIPÓTESE]** É a cor central da paleta. Você define qual é.
- As outras duas aparecem **em fluxos paralelos e separados**:
  - (a) na viagem conceitual, como dois feixes em canais vizinhos, vistos de relance através de uma "parede" translúcida, que nunca se cruzam;
  - (b) na montagem, como dois godês **já prensados** esperando na posição exata que ocupam na foto de catálogo.
- O herói entra no estojo **pelo mesmo lado da tela** em que fica na foto final.

### Direção A, recomendada: "Escala"

Realismo de estúdio em macro do começo ao fim. A viagem pelo pó é **física**: grãos com volume, profundidade de campo curta e luz atravessando a poeira, sem cores fantasiosas. O único elemento "mágico" é a escala, porque a câmera encolhe até o tamanho do grão e volta. Paleta de cor: inox frio e neutro, o tom quente do pigmento como única cor saturada e branco de estúdio no final.
**Por que recomendo:** ela combina com uma fábrica real (credibilidade de B2B), facilita o encaixe na foto de catálogo (que é realista) e evita a aparência de videogame.

### Direção B: "Pigmento-luz"

O começo e o fim continuam realistas, mas a viagem interna vira uma abstração: os grãos brilham com luz própria, há trilhas de luz e as três cores ficam em ondas paralelas.
**Risco:** é mais fácil de cair no visual de "partícula de videogame" e cria um degrau de estilo entre o realismo e a abstração. Fica como alternativa caso a A pareça fria demais na animação de teste.

---

## 2. Comparação técnica

### Abordagens viáveis

| | **1. Blender (3D completo) + FFmpeg**, recomendada | **2. Three.js + Playwright + FFmpeg** (pipeline do repositório) | **3. Remotion + @remotion/three** | **4. 2,5D com imagens geradas** |
|---|---|---|---|---|
| Realismo do pó, da poeira e do inox | Alto (Cycles: volumes, profundidade de campo e desfoque de movimento reais) | Médio: renderização em tempo real, mais difícil fugir do visual de jogo | Igual ao Three.js | Alto em quadros parados, sem movimento real |
| Partículas | Geometry Nodes (milhões de instâncias), simulação simples e determinística | Instanced mesh/shaders, até ~100 mil com boa aparência | Igual | Não se aplica |
| Encaixe com a foto de catálogo | Bom: câmera calculada a partir da foto + projeção da foto no modelo | Possível, com mais trabalho manual | Igual | É só a foto colada |
| Roteirizável por mim (sem você operar nada) | Sim, por scripts Python (`bpy`) em modo `--background` | Sim | Sim | Não se aplica |
| Custo de renderização | Pesado: precisa de GPU para ficar em horas e não em dias | Leve | Leve | Leve |
| Licença | GPL, sem custo | MIT, sem custo | **Paga para empresas com mais de 3 funcionários** | Não se aplica |
| Já funciona aqui | Não: precisa instalar (download portátil, sem `sudo`) | **Sim** | Precisa instalar | Sim |

**Recomendação:** **Blender para o filme**, FFmpeg para a codificação e a trilha e **Three.js não entra** (não vale manter duas engines 3D). O **Remotion não é necessário**: ele resolve composição de vídeo em React, e aqui o trabalho pesado é 3D e partículas. A montagem final é linear e o FFmpeg dá conta. Isso também evita a licença paga.

**Onde renderizar** (depende da sua resposta):

- **Seu computador com GPU** (NVIDIA RTX, Apple Silicon M1 ou superior, ou AMD recente): é o ideal. Eu escrevo os scripts e você roda um comando. Estimativa grosseira em Cycles, 1080×1920: de 20 s a 90 s por quadro, ou seja, 4 h a 20 h para os 780 quadros. Em EEVEE (motor em tempo real do Blender), de minutos a 1 h.
- **Este contêiner (só CPU)**: serve para as **prévias em baixa resolução** (animatic, testes de câmera) via Blender portátil. O filme final em Cycles levaria de vários dias a semanas de CPU. Não recomendo.
- **Fallback sem GPU:** se você não tiver GPU, mudo o plano para **Three.js no contêiner** (pipeline já existente) e reduzo a ambição do realismo do pó. Aviso antes de seguir.

### O que é 3D, o que usa imagem e o que é difícil

| Elemento | Técnica | Dificuldade |
|---|---|---|
| Bancada, prensa, molde, lâmina, punção | Modelagem 3D simples (formas industriais básicas) baseada em fotos reais da Garnet | Média |
| Fundo da sala de produção | Imagem do ChatGPT **projetada na geometria simples das paredes e máquinas ao fundo**, sempre fora de foco. A câmera se move de verdade e a paralaxe sai da geometria, não de um zoom. | Baixa |
| Luz de estúdio | HDRI CC0 da Poly Haven + luzes de área | Baixa |
| Embalagem do granel | 3D. A abertura é **simplificada**: o saco já está aberto e a mão só dobra a borda para trás (shape keys). Cortar ou rasgar um saco exige simulação de tecido e interação com a mão. | **Alta, se for abertura literal** |
| Mão com luva | Modelo 3D de mão com rig, em material de luva nitrílica azul, que aparece só do punho para baixo e faz no máximo 2 gestos. Opção melhor: **você filma a própria mão de luva** num fundo escuro (ver "Opcional"). | **Alta** (mãos 3D realistas são a principal fonte de "vale da estranheza") |
| Fluxo de pó caindo | Partículas (Geometry Nodes) + volume de poeira leve | Média |
| Viagem do ponto de vista da partícula | Partículas e grãos 3D com profundidade de campo curta, peneira como malha 3D | Média |
| Monte se formando no godê | Superfície de altura animada (campo de altura) + partículas pousando | Média/alta |
| Rasagem | A lâmina corta o campo de altura no nível da borda e o excesso vira partículas que caem para fora | Alta (é o trecho mais difícil) |
| Prensagem | O campo de altura vira superfície plana, o material troca de "solto" para "prensado" e solta um sopro de poeira | Alta |
| Relevo prensado (se houver) | Mapa de deslocamento tirado **da foto real**. Sem foto, não há relevo. | Média |
| Godês e estojo | 3D fiel, com medidas reais e fotos de vários ângulos | Média |
| Encaixe na foto final | Calibração de câmera + projeção da foto no modelo 3D (seção 3.2) | Alta |
| Logo e textos do estojo | **Somente da foto real**, projetados. Nunca redesenhados nem gerados. | Não se aplica |

---

## 3. Proposta da versão 1

- **Formato:** vertical 9:16, 1080×1920, 30 fps, **cerca de 26 s** (780 quadros), sem locução. Os valores são ajustáveis.
- **Estrutura:** uma "tomada única" com 4 cortes invisíveis (escuro da garganta da tremonha, nuvem de poeira, punção e passagem atrás da borda do molde).
- **Divisão fiel × conceitual:**
  - **Fabricação fiel:** cenas 1, 2, 4, 5, 6 e 7 (bancada, transferência, dosagem, rasagem, prensagem e montagem). Tudo é modelado a partir de referências reais da Garnet. Sem referência, a cena fica simplificada em vez de inventada.
  - **Viagem conceitual:** cena 3 (dentro da alimentação). É uma interpretação visual que não representa o interior real de um equipamento. **[HIPÓTESE]** Se o filme for usado como material da fábrica, pode levar o aviso discreto "interpretação artística" no fim.

### 3.1 Como chegar à foto de catálogo sem corte (o desfecho)

1. **Foto de catálogo ideal:** fundo neutro de estúdio, produto inteiro, tampa na posição do filme e o arquivo original com **pelo menos 2000 px** no lado maior. As fotos da vitrine do site têm 720×900 e não são suficientes. Fundo branco facilita muito.
2. **Calibração de câmera:** a partir das linhas retas do estojo e das **medidas reais**, calculo a posição, a rotação e a distância focal da câmera que fez a foto. É feito no Blender, por script ou com o fSpy, ferramenta gratuita de código aberto (licença a verificar antes de usar).
3. **Modelo 3D fiel do estojo**, com medidas reais e fotos de outros ângulos para os lados que a foto não mostra.
4. **Projeção da foto no modelo:** nos últimos ~1,5 s, a câmera 3D chega exatamente à pose calculada. A textura do estojo e dos godês passa gradualmente do material 3D para a foto projetada. Na pose final, o quadro é **pixel a pixel a foto**, mas a chegada foi um movimento de câmera real sobre a mesma geometria.
5. **Luz e sombra:** a luz 3D é ajustada para que a sombra de contato e o reflexo na tampa coincidam com os da foto, comparando lado a lado e por diferença de imagem.
6. **Proporção:** se a foto for 4:5 ou 1:1, o 9:16 exige **estender o fundo**. Com fundo branco, isso é trivial. Com cenário, preciso gerar extensão (outpaint no ChatGPT, imagem 10) e marcar como ilustrativo.

**Limitações e alternativa.** Se a foto tiver reflexos complexos, uma lente muito grande-angular ou uma tampa em ângulo que não consigo medir, o encaixe pixel a pixel pode falhar na tampa. Nesse caso, a alternativa (que apresento antes de implementar) é **parar o movimento a ~90% da pose e fazer um "rack focus"** (o foco muda do pó para o produto) durante a dissolução para a foto. Fica quase invisível, mas não é perfeito. O teste do marco M4 decide entre as duas.

---

## 4. Roteiro técnico (cerca de 26 s)

Convenção de direção: **o material sempre cai de cima para baixo e avança da esquerda para a direita da tela.**

| Tempo | Ação | Enquadramento | Câmera | Luz | Som | Transição | Técnica | Material necessário |
|---|---|---|---|---|---|---|---|---|
| 0:00–0:03 | Saco de granel (tom herói) já aberto sobre a bancada de inox. A mão de luva azul entra pela direita (só o punho) e dobra a borda do saco. Uma pequena nuvem de pó sobe. | Macro, 3/4 por cima, saco ocupando 60% do quadro | Dolly-in lento, levemente descendente | Softbox superior esquerda, neutra (~5000 K), fundo da sala fora de foco | Ambiente de sala limpa (ar-condicionado baixo), farfalhar de plástico | Abertura em preto, 6 quadros | 3D + mão 3D (ou filmada) + fundo projetado | Foto real da embalagem de granel; imagens 01 e 03 |
| 0:03–0:06 | A mão pega uma espátula/concha de inox, recolhe o pó e despeja na tremonha da prensa. A câmera segue o fluxo descendo. | Médio-macro, a concha no terço superior | Inclinação para baixo acompanhando o fluxo, sem parar | A mesma. Contraluz realçando a poeira. | Pó deslizando, tilintar leve do inox | Não se aplica | 3D + partículas | Foto real da tremonha/alimentação (ou imagem 04) |
| 0:06–0:07 | O fluxo entra na garganta escura da tremonha e a câmera entra junto. | O fluxo no centro, bordas escuras | Avanço contínuo e acelerando | Cai para o escuro | Sussurro grave, "whoosh" abafado | **Corte invisível 1**: escuro da garganta | 3D | Não se aplica |
| 0:07–0:12 | **Viagem conceitual:** a câmera no tamanho do grão desce entre grãos do tom herói. Uma peneira (malha) passa como grade de luz e os aglomerados se soltam. Através de paredes translúcidas, dois fluxos vizinhos das outras duas cores descem em paralelo e **nunca se misturam**. Ao fundo cresce uma abertura iluminada. | Ponto de vista do grão, grãos em primeiro plano desfocados | Avanço contínuo, leve rolagem (≤10°) | Luz vem da abertura à frente, bordas quentes | Textura granular, tom suave ascendente | Não se aplica | 3D, partículas, profundidade de campo | Imagem 07 (alvo de look); cores das 3 bandejas medidas na foto |
| 0:12–0:15 | A câmera sai pela abertura (bico dosador) em meio a uma nuvem e volta à escala real. O pó cai no godê dentro do molde e forma um **monte acima da borda**. É a imagem-chave. | Macro lateral baixo, godê no terço inferior | Recuo e descida suave enquanto a nuvem se dissipa | Softbox lateral rasante que mostra o relevo do monte | Pó caindo (areia fina), sopro | **Corte invisível 2**: nuvem de pigmento | 3D, partículas + campo de altura | Foto real do molde/godê na prensa |
| 0:15–0:17 | A lâmina (ou régua) passa da esquerda para a direita, **rasando** o pó na altura da borda. O excesso cai para fora numa bandeja coletora. | Macro, perfil no nível da borda | Travelling lateral acompanhando a lâmina | A mesma, rasante | Raspagem seca | Não se aplica | Campo de altura + partículas de excesso | Referência real da rasagem (foto ou vídeo) |
| 0:17–0:20 | O punção desce e compacta, com um pequeno sopro de poeira lateral. O punção sobe e revela uma superfície **lisa e acetinada** (com relevo, se a foto mostrar). | Plongée quase de cima | A câmera sobe acompanhando o punção, encontra a superfície e para por meio segundo | Luz rasante que deixa clara a diferença solto × prensado | Batida grave e seca, alívio de ar | **Corte invisível 3**: punção cobre a câmera por 4 quadros | 3D, troca de material | Referência da prensa e do punção; foto do relevo |
| 0:20–0:23 | O godê é ejetado e a câmera o acompanha. Ele **passa atrás da borda do molde** e já aparece descendo na cavidade do estojo, ao lado dos outros dois godês já prensados. **Assenta sem atravessar nada.** | Médio-macro 3/4 | Arco suave de 30° em direção à pose final | Transição para luz de estúdio de catálogo | "Clique" macio de encaixe | **Corte invisível 4**: borda do molde | 3D com colisão verificada | Fotos do estojo por vários ângulos, medidas dos godês e cavidades |
| 0:23–0:26 | Recuo e arco até a **pose exata da foto de catálogo**. A textura faz a transição para a foto projetada e o fundo vai para o fundo da foto. Pausa de 1,5 s no quadro final. | Enquadramento idêntico ao da foto | Recuo com desaceleração longa (ease-out) | A luz da foto | Nota final da trilha, silêncio | Dissolve de projeção (seção 3.1) | 3D + projeção da foto | Foto de catálogo em alta resolução |
| (opcional) 0:26–0:28 | Assinatura: logo/texto. **Só com aprovação de qual marca assina.** | Não se aplica | Fixa | Não se aplica | Não se aplica | Não se aplica | FFmpeg/2D | Logo em vetor |

---

## 5. Mapa de continuidade

| Elemento | Regra |
|---|---|
| **Direção do material** | Sempre de cima para baixo. O movimento horizontal vai sempre da esquerda para a direita. A lâmina rasa da esquerda para a direita. |
| **Câmera** | Desce na 1ª metade (0–15 s), percorre a lateral na rasagem e sobe/recua na 2ª metade. Nunca para de verdade, exceto na pausa de 0,5 s após a prensagem e na pausa final. |
| **Escala das partículas** | Cenas 1–2: escala real (grão invisível, só nuvem e fluxo). Cena 3: grão com ~1/40 da largura do quadro (ampliação de ~1000×), grãos de tamanhos variados e nada de esferas perfeitas. Cena 4 em diante: escala real de novo. A passagem de escala acontece **sempre dentro de escuro ou nuvem**, nunca às claras. |
| **Cores** | O tom herói tem o mesmo valor de cor (medido na foto de catálogo e convertido para o espaço de cor linear) **em todas as cenas**. O pó solto parece um pouco mais claro e mais fosco que o prensado (é o comportamento físico). As outras duas cores só aparecem em canais separados (cena 3) e já prensadas (cena 7). Nunca há mistura. |
| **Bancada** | Inox escovado, borda arredondada, sem marcas. A sala ao fundo é sempre branca e fora de foco, coerente com `producao-maquinas.webp`. |
| **Máquina** | Uma única prensa coerente: tremonha → bico dosador → molde com godê → lâmina → punção. Mesmo inox e mesma escala em todas as cenas. Formas industriais sóbrias, sem LEDs ou luzes decorativas. A forma exata vem das referências da Garnet. |
| **Mão** | Mão direita, luva nitrílica **azul** (como nas fotos da fábrica) e punho do jaleco branco. Aparece só nas cenas 1–2, entra pela direita, nunca mostra rosto ou corpo e não reaparece depois. |
| **Godês** | O herói vai na posição exata que ocupa na foto. Os outros dois já estão prensados no estojo desde a primeira vez em que aparecem. Mesmo formato, borda e acabamento da foto real. |
| **Produto final** | Forma, tampa, logo e textos **só da foto e das medidas reais**. A posição final é a pose calculada da foto. |
| **Luz** | Luz principal sempre do alto à esquerda. A cena 3 é a exceção, com luz vinda da frente. O branco de estúdio do catálogo cresce nos últimos 6 s. |
| **Colisão** | Nada atravessa nada: mão × saco, concha × pó, lâmina × godê, godê × estojo. Isso é verificado quadro a quadro nos trechos de contato (seção 10). |

---

## 6. O que preciso de você

### Indispensável

1. **Foto de catálogo** em alta resolução (original, ≥2000 px), de preferência em fundo neutro, já aprovada pela marca.
2. **Qual produto e qual marca assina o filme**, e se há **autorização da marca** do produto para uso público.
3. **Fotos do produto físico** por vários ângulos (celular basta, com luz difusa): frente, topo aberto, topo fechado, lateral, fundo, dobradiça em detalhe e um godê fora do estojo, se possível.
4. **Medidas**: estojo (largura × profundidade × altura fechado), diâmetro/formato e profundidade dos godês e espessura da tampa. Paquímetro ou régua.
5. **Configuração do seu computador**: sistema operacional, GPU (modelo), RAM e se você aceita instalar o Blender (gratuito).
6. **Referências reais do processo na Garnet** (foto ou vídeo curto de celular, sem pessoas identificáveis ou com autorização): embalagem do granel, alimentação/dosagem da prensa, rasagem, punção e colagem dos godês.
7. **Qual das três cores é a heroína.**

### Opcional, mas melhora muito

- **Vídeo da sua mão com luva azul** num fundo preto, fazendo os 2 gestos das cenas 1–2, em câmera fixa no tripé, 4K/60 se possível. Substitui a mão 3D, que é o maior risco de artificialidade.
- Foto da paleta com um **cartão cinza ou branco** ao lado (para calibrar as cores).
- Amostra macro (celular em modo macro) do pó solto e da superfície prensada do produto real.
- Trilha musical já licenciada ou indicação de estilo.
- Logo em vetor (SVG/PDF) para a assinatura.

---

## 7. Pacote de prompts para o ChatGPT

**Regras gerais**

- **O ChatGPT não gera o produto.** A referência mestra de produto é a **foto de catálogo real** e as fotos de ângulos. Imagens geradas com o estojo inventariam detalhes. Por isso nenhuma imagem abaixo pede o estojo, o logo ou o texto da marca.
- Todas as imagens geradas que forem usadas no filme são **cenário fora de foco ou textura**. Serão registradas em `docs/dados-simulados.md` como ilustrativas.
- Os campos entre colchetes, como `[TOM HERÓI]`, eu preencho depois de receber a foto. Não gere essas imagens antes disso.

### 01: `amb-01-mestre-sala.png` (referência mestra de ambiente)

- **Finalidade:** fundo da sala nas cenas 1–2 e 4–7, projetado em geometria simples e sempre fora de foco. Também define a cor e a luz do ambiente.
- **Anexar:** `assets/img/fabrica/producao-maquinas.webp` e `assets/img/fabrica/conferencia.webp`.
- **Prompt:**
  > Fotografia realista de uma sala de produção de cosméticos limpa, no mesmo estilo das fotos anexadas: paredes e teto brancos, piso epóxi cinza-claro, luminárias lineares no teto, bancadas e estruturas de máquinas em aço inox escovado. SEM PESSOAS, sem logotipos, sem textos legíveis, sem placas. Câmera na altura de uma bancada (cerca de 1 m do chão), olhando ao longo da sala, lente 35 mm, profundidade de campo média. Luz difusa e neutra (cerca de 5000 K), sem cores fortes. Em primeiro plano, à esquerda, a borda de uma bancada de inox vazia. Ao fundo, máquinas industriais sóbrias, sem luzes coloridas e sem telas brilhantes. Aparência de fotografia de catálogo industrial, sem ar futurista, sem brilho exagerado e sem visual de renderização de videogame.
- **Proporção:** 9:16, vertical.
- **Manter idêntico** nas próximas gerações: paleta branco/inox/cinza, luz neutra e ausência de pessoas e textos.
- **Critérios para pedir correção:** pessoas, rostos ou mãos; letras ou logos legíveis; luzes azuis ou roxas; máquinas com formas fantasiosas; teto ou piso tortos; aparência de 3D plástico.
- **Uso:** **cenário usado no filme** (fundo desfocado). Ilustrativo.

### 02: `amb-02-bancada-topo.png`

- **Finalidade:** referência de material e textura do tampo de inox (marcas sutis de escovado, reflexo).
- **Anexar:** `amb-01-mestre-sala.png` aprovada.
- **Prompt:**
  > Fotografia macro, vista de cima e perfeitamente frontal, de um tampo de bancada em aço inox escovado limpo, iluminação difusa e uniforme de estúdio, sem sombras de objetos, sem reflexos de janelas, sem manchas fortes, apenas o fio do escovado horizontal e microarranhões muito sutis. Sem objetos, sem texto. Mesma tonalidade neutra da imagem anexada.
- **Proporção:** 1:1.
- **Manter idêntico:** direção do escovado (horizontal), tom neutro.
- **Critérios:** sem reflexos de objetos; brilho uniforme de borda a borda (para servir de textura repetível); sem perspectiva.
- **Uso:** **textura** (detalhe de rugosidade). O inox principal é material 3D.

### 03: `ref-03-embalagem-granel.png` (só se a Garnet não mandar foto real)

- **Finalidade:** referência de modelagem do saco/recipiente de granel.
- **Anexar:** `amb-01-mestre-sala.png` e qualquer foto real de embalagem de matéria-prima que você tiver.
- **Prompt:**
  > Fotografia de produto realista: saco plástico de polietileno transparente-leitoso, grosso, aberto no topo com a borda dobrada para fora, apoiado em pé sobre uma bancada de aço inox escovado, contendo pó cosmético fino e opaco na cor [TOM HERÓI, descrição + HEX]. Etiqueta branca simples colada na frente, com apenas linhas cinza ilegíveis (sem palavras legíveis, sem marcas, sem selos de certificação). Iluminação de estúdio suave vinda do alto à esquerda, fundo da sala branca fora de foco como na imagem anexada. Lente 85 mm, ângulo 3/4 levemente de cima. Realista, sem brilho exagerado.
- **Proporção:** 4:5.
- **Manter idêntico:** a cor do pó (será corrigida por medição de qualquer forma), o lado da dobra e a etiqueta sem texto.
- **Critérios:** sem texto legível ou selo; pó opaco e fosco (não cintilante, a não ser que o produto real seja); saco com volume plausível.
- **Uso:** **referência de modelagem** (não entra no filme).

### 04: `ref-04-estacao-prensa.png` (só se a Garnet não mandar foto real)

- **Finalidade:** referência de modelagem da tremonha, do bico, do molde, da lâmina e do punção.
- **Anexar:** `producao-maquinas.webp` e `amb-01-mestre-sala.png`.
- **Prompt:**
  > Fotografia industrial realista, em detalhe, de uma estação de prensagem de pó cosmético compacto: pequena tremonha cônica de aço inox no alto, abaixo um bico dosador, uma base com um molde circular contendo uma bandeja metálica rasa (godê) de alumínio, ao lado uma régua niveladora de inox, acima um punção cilíndrico de inox de uma prensa. Estrutura sóbria, parafusos e juntas realistas, sem luzes decorativas, sem telas, sem logotipos, sem texto. Sala branca fora de foco ao fundo, luz neutra difusa do alto à esquerda. Lente 50 mm, ângulo 3/4 frontal, altura da bancada.
- **Proporção:** 4:5.
- **Manter idêntico:** inox escovado, ausência de luzes e telas.
- **Critérios:** a peça precisa ser **mecanicamente compreensível** (dá para ver o que desce onde); sem peças flutuando; sem visual de ficção científica. Se ficar fantasiosa, descartamos e a cena é modelada de forma mais simples.
- **Uso:** **referência de modelagem** apenas. **Aviso:** é uma interpretação, não a máquina real da Garnet. A foto real tem prioridade.

### 05: `tex-05-po-solto-macro.png`

- **Finalidade:** textura e microdetalhe do pó solto (monte, fluxo).
- **Anexar:** foto de catálogo (só para a cor).
- **Prompt:**
  > Fotografia macro extrema, vista de cima e perfeitamente frontal, de pó cosmético solto e fino na cor [TOM HERÓI, descrição + HEX], espalhado de forma uniforme e preenchendo todo o quadro, com pequenos aglomerados e textura granular fina, aparência fosca e aveludada. Iluminação plana e difusa, sem sombras direcionais, sem objetos, sem bordas, sem texto. Cor fiel à referência anexada.
- **Proporção:** 1:1.
- **Manter idêntico:** cor e iluminação plana.
- **Critérios:** sem sombra direcional (senão não serve de textura); sem brilho metálico se o produto for matte; sem objetos ou bordas visíveis.
- **Uso:** **textura** (a cor será recalibrada para o valor medido).

### 06: `tex-06-po-prensado-macro.png`

- **Finalidade:** textura da superfície prensada (cenas 6–8).
- **Anexar:** foto de catálogo e foto macro real do produto (se houver).
- **Prompt:**
  > Fotografia macro extrema, vista de cima e perfeitamente frontal, da superfície de um blush compacto prensado na cor [TOM HERÓI, descrição + HEX], preenchendo todo o quadro: superfície lisa e firme, acetinada, com microporosidade fina e nenhum risco, sem relevo, sem desenho, sem marca d'água, sem bordas da bandeja. Iluminação plana e difusa. Cor fiel à referência anexada.
- **Proporção:** 1:1.
- **Manter idêntico:** cor igual à da imagem 05 após a correção.
- **Critérios:** **sem relevo inventado**, sem bordas, sem marcas de dedo.
- **Uso:** **textura**. O relevo, se existir, vem da foto real.

### 07: `con-07-viagem-particula.png` (alvo de look da cena 3)

- **Finalidade:** aprovar a atmosfera da viagem conceitual antes de construir em 3D.
- **Anexar:** `tex-05-po-solto-macro.png` aprovada.
- **Prompt:**
  > Imagem cinematográfica realista em escala microscópica: ponto de vista de uma pequena partícula descendo dentro de um fluxo de pó cosmético na cor [TOM HERÓI]. Grãos irregulares e foscos em primeiro plano, muito desfocados, grãos nítidos no plano médio, e ao fundo uma grade fina de peneira metálica atravessada por luz suave. À esquerda e à direita, através de paredes translúcidas foscas, dois fluxos paralelos e separados de pó nas cores [COR 2] e [COR 3], que não se misturam. Ao fundo, no centro, uma abertura iluminada. Profundidade de campo curtíssima, poeira em suspensão iluminada por contraluz quente, sem brilho neon, sem faíscas, sem aparência de videogame.
- **Proporção:** 9:16.
- **Manter idêntico:** cores separadas, luz vinda da abertura.
- **Critérios:** as três cores **não podem se misturar**; nada de neon, raio laser ou estrelas; grãos sem forma de esfera perfeita.
- **Uso:** **storyboard/alvo de look** (não entra no filme).

### 08: `sb-08-chave-dosagem.png` (alvo de look da imagem principal)

- **Finalidade:** aprovar a imagem-chave "pó caindo no godê" antes do teste mais difícil (M3).
- **Anexar:** `amb-01-mestre-sala.png`, `tex-05-po-solto-macro.png` e a foto real do godê/molde, ou `ref-04-estacao-prensa.png`.
- **Prompt:**
  > Fotografia macro cinematográfica, vista lateral baixa: um fino fluxo de pó cosmético na cor [TOM HERÓI] cai de um bico dosador de inox dentro de uma bandeja metálica rasa (godê) encaixada num molde de inox, formando um pequeno monte que já ultrapassa a borda. Leve nuvem de poeira iluminada por luz rasante vinda da esquerda. Fundo da sala branca de produção muito desfocado, como na imagem anexada. Lente macro 100 mm, profundidade de campo curta. Realista, sem brilho exagerado.
- **Proporção:** 9:16.
- **Manter idêntico:** godê com o formato da referência real, a cor e a direção da luz.
- **Critérios:** o monte precisa **ultrapassar a borda** (para a rasagem fazer sentido); godê com formato correto; poeira sutil, não fumaça.
- **Uso:** **storyboard/alvo de look**.

### 09: `sb-09-chave-prensado.png`

- **Finalidade:** aprovar o contraste visual entre pó solto e prensado (cena 6).
- **Anexar:** `sb-08-chave-dosagem.png` e `tex-06-po-prensado-macro.png` aprovadas, mais a foto do godê real.
- **Prompt:**
  > Mesma cena, mesma luz e mesma câmera da imagem anexada, vista quase de cima: o punção de inox acabou de subir e revela, dentro do godê, a superfície do blush compactado na cor [TOM HERÓI], perfeitamente plana e acetinada, nivelada com a borda. Restam alguns grãos soltos na borda do molde e um sopro de poeira se dissipando. Sem relevo, sem logo, sem texto.
- **Proporção:** 9:16.
- **Manter idêntico:** a câmera, a luz e a cor da imagem 08.
- **Critérios:** superfície **sem relevo inventado**; diferença clara entre o fosco do solto e o acetinado do prensado.
- **Uso:** **storyboard/alvo de look**.

### 10: `ext-10-fundo-catalogo.png` (só se a foto de catálogo não for 9:16 e não tiver fundo liso)

- **Finalidade:** estender o fundo da foto para 9:16.
- **Anexar:** a foto de catálogo.
- **Prompt:**
  > Estenda esta fotografia para a proporção 9:16 vertical, acrescentando área acima e abaixo. NÃO altere o produto, a embalagem, o logotipo, os textos, as cores, a iluminação nem a posição de nada que já existe na imagem. Apenas continue o fundo e a superfície de apoio de forma natural e contínua.
- **Proporção:** 9:16.
- **Manter idêntico:** **todo o quadro original**. Vou conferir por diferença de pixels.
- **Critérios:** se o produto mudou em qualquer detalhe, descartamos. Só aproveito a área nova e a original é recolocada por cima.
- **Uso:** **imagem usada no filme** (apenas a área estendida). Ilustrativa.

---

## 8. Ordem de geração das imagens

1. **Antes de gerar qualquer coisa:** você me envia a foto de catálogo e as fotos de ângulos. Eu meço as 3 cores e preencho `[TOM HERÓI]`, `[COR 2]` e `[COR 3]` nos prompts.
2. **01** (mestra de ambiente). Aprovação.
3. **05** (pó solto). Aprovação da cor e da textura.
4. **06** (pó prensado), usando a 05 como referência de cor.
5. **02** (inox), usando a 01.
6. **03** e **04**, só se faltarem as fotos reais, usando a 01.
7. **08**, depois **09** (imagens-chave), usando 01 + 05 + 06.
8. **07** (viagem), usando 05.
9. **10**, só se necessário.

Total: 6 a 10 imagens.

---

## 9. Plano de implementação

| Marco | Entrega | O que você aprova | Esforço estimado |
|---|---|---|---|
| **M0** | Este plano | Direção, roteiro e ferramentas | Feito |
| **M1** | Materiais recebidos, cores medidas, prompts preenchidos, imagens 01, 05, 06, 08 e 09 aprovadas | Ambiente e look | 1 sessão minha + seu tempo no ChatGPT |
| **M2: animatic** | MP4 em 540×960 com blocos cinza (bancada, prensa, estojo como caixas), **câmera e ritmo finais**, som temporário. Renderizado no contêiner (EEVEE/Workbench, CPU). | Movimento de câmera, tempo de cada cena e cortes invisíveis | 1–2 sessões |
| **M3: teste do trecho mais difícil** | Cenas 4–6 (dosagem → rasagem → prensagem) com look final, ~6 s em resolução cheia | Credibilidade do pó, compreensão da compactação e colisões | 2–3 sessões + render |
| **M4: teste do encaixe** | Cenas 7–8 com o estojo modelado e a transição para a foto. Inclui a comparação por diferença de imagem. | Fidelidade do produto e decisão entre encaixe pixel a pixel ou alternativa | 2 sessões + render |
| **M5: montagem v1** | Filme completo em qualidade de prévia, incluindo a mão e a viagem | Continuidade geral | 2–3 sessões |
| **M6: final** | Render final, trilha/SFX, codificação H.264 e um quadro de capa | Entrega | 1 sessão + render (4–20 h em GPU) |

**Onde fica o trabalho:** os scripts vão para `tools/comercial-blush/` (regra do projeto: sem dependências novas no site). Renders e vídeos **não** entram no repositório do site, porque são pesados. A pasta de entrega fica a combinar.

**Limitações conhecidas**

- A mão 3D realista é o ponto mais frágil. Se ficar artificial no M5, a saída é reduzir a mão a um corte do punho em desfoque ou usar o vídeo filmado.
- A física do pó é **encenada** (campo de altura + partículas) e não é uma simulação granular real. Visualmente funciona em macro, mas não tem rigor de engenharia.
- O encaixe pixel a pixel depende da qualidade da foto (seção 3.1).
- Sem GPU, o render final em Blender não é viável. Nesse caso, uso o fallback em Three.js, com qualidade de pó menor.

---

## 10. Critérios de aprovação

1. **Continuidade:** o espectador nunca percebe corte. Direção do material, luz principal e escala seguem o mapa da seção 5 em todos os quadros.
2. **Três cores corretas:** cada cor fica a ΔE ≤ 3 (CIEDE2000) da cor medida na foto de catálogo, comparando quadros do render com a foto sob a mesma luz. As cores nunca se misturam em quadro nenhum.
3. **Fidelidade da embalagem:** formato, proporções, tampa, dobradiça, godês e posição das cores idênticos à foto real. No quadro final, a diferença para a foto fica abaixo de um limite visível (comparação automática por SSIM + inspeção ampliada).
4. **Legibilidade da marca:** o logo e os textos aparecem **apenas** da foto real, nítidos e sem deformação na pausa final de ≥1,5 s.
5. **Sem interpenetração:** nenhum objeto atravessa outro. É verificado em folhas de contato quadro a quadro nos trechos de contato (mão × saco, concha × pó, lâmina × godê, punção × pó, godê × estojo).
6. **Processo compreensível:** alguém de fora da fábrica, sem som, consegue dizer "encheu, nivelou, prensou e montou". Faço o teste mostrando o M3 sem explicação.
7. **Estética:** sem brilho plástico, sem neon e sem máquinas fantasiosas nas cenas fiéis. A viagem é claramente conceitual.
8. **Técnico:** 1080×1920, 30 fps constantes, sem quadros pretos acidentais, sem banding visível no fundo branco, áudio sem clipping (pico ≤ −1 dBTP). Verificação com `ffprobe` e folha de contato.
9. **Conformidade:** as imagens ilustrativas são registradas em `docs/dados-simulados.md`, há autorização da marca do produto e nenhum número ou selo foi inventado.

---

## 11. Agentes e responsabilidades

O ambiente oferece **subagentes reais** (ferramenta Agent). Mesmo assim, a maior parte do trabalho é sequencial e depende de arquivos compartilhados, então paralelizar sem necessidade gera retrabalho. Proposta enxuta:

| Função | Quem executa | Recebe | Entrega |
|---|---|---|---|
| Direção criativa e narrativa | Eu (agente principal) | Seu briefing, respostas e foto | Roteiro, direção escolhida |
| Direção de fotografia e continuidade | Eu, como etapa | Roteiro, fotos reais, foto de catálogo | Mapa de continuidade, câmeras, luz, calibração da câmera |
| Prompts e materiais visuais | Eu, como etapa | Cores medidas, fotos | Prompts preenchidos; triagem das imagens que você gerar |
| Animação, partículas e implementação | Eu, com subagente opcional para tarefas isoladas (ex.: script de folha de contato), em worktree separada | Animatic aprovado | Scripts Blender e renders |
| **Revisão de fidelidade e qualidade** | **Subagente real, independente** | **Apenas** a foto de catálogo, as fotos reais, os critérios da seção 10 e os quadros renderizados (sem as minhas conclusões, para não ficar enviesado) | Lista de divergências com o número do quadro |

**Quem consolida:** eu consolido as decisões técnicas e você aprova em cada marco (M1–M6). Nenhum marco avança sem a sua aprovação.

---

## 12. Skills

| Skill | Situação | Origem verificável | Função | Dependências | Vai usar? |
|---|---|---|---|---|---|
| `remotion-best-practices` | **Existe**, mas não está instalada | Repositório oficial `remotion-dev/remotion`, pasta `.agents/skills/remotion-best-practices` (confirmado por busca de código no GitHub). Agregadores também citam um repositório `remotion-dev/skills`, que **não consegui abrir** daqui (acesso bloqueado nesta sessão). | Boas práticas de código Remotion | Remotion + licença | **Não**, porque o Remotion não entra na solução recomendada |
| `code-review` | Disponível nesta sessão | Embutida no Claude Code | Revisar os scripts antes de cada marco | Nenhuma | Sim, no M3 e no M5 |
| `run` | Disponível nesta sessão | Embutida no Claude Code | Executar e verificar | Nenhuma | Opcional |
| Planejamento por etapas | Ferramentas nativas (tarefas e subagentes), não é skill | Não se aplica | Acompanhar os marcos | Nenhuma | Sim |
| Skill de Blender | **Nenhuma oficial verificada.** Existem servidores MCP de terceiros para Blender, mas não verifiquei a segurança deles e não são necessários: o Blender roda por script Python em modo `--background`. | Não se aplica | Não se aplica | Não se aplica | **Não** |

**Instruções personalizadas que sugiro criar** (não são skills existentes, são arquivos do projeto):

1. `tools/comercial-blush/BIBLIA.md`: mapa de continuidade, cores medidas, medidas do estojo e convenções de direção. Todo script e toda revisão leem este arquivo primeiro.
2. `tools/comercial-blush/verificar.sh`: rotina de verificação com FFmpeg/ImageMagick. Gera a folha de contato a cada N quadros, mede ΔE das cores em pontos fixos, calcula o SSIM do quadro final contra a foto e confere resolução, fps e áudio com `ffprobe`.
3. Se o fluxo se repetir em outros comerciais, isso pode virar uma skill do projeto. **Não agora.**

Nada será instalado antes da sua aprovação.

---

## 13. Perguntas (só as necessárias)

1. **Produto e marca:** qual paleta exatamente? A marca autoriza o uso público no filme? Quem assina o filme no fim: Garnet, a marca do produto ou ninguém?
2. **Foto de catálogo:** você consegue o arquivo original (≥2000 px) com fundo neutro? Em que posição está a tampa?
3. **Seu computador:** sistema operacional, modelo da GPU e RAM. Posso planejar o render final nele com o Blender (gratuito)?
4. **Processo real** **[CONFIRMAR COM A GARNET]**:
   - (a) a prensagem é godê por godê e depois a colagem no estojo, ou direto no estojo?
   - (b) a dosagem é automática ou manual (espátula)?
   - (c) em que forma o granel chega à prensa (saco, balde, tambor)?
   - (d) é possível mandar fotos ou vídeos curtos dessas etapas?
5. **Cor herói:** qual das três?
6. **Mão:** você topa filmar a sua mão de luva (opcional) ou seguimos com a mão 3D?

Aguardo a sua aprovação (ou ajustes) antes de qualquer implementação.
