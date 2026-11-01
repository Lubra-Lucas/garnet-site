# Especificação única: comercial "Do pó à paleta"

Todos os agentes e etapas (direção, modelagem, animação, render e revisão) trabalham sobre **esta**
especificação. Os números ficam em `cena/config.py`, que é a fonte da verdade. Este arquivo explica
as convenções. Se um valor mudar, mude primeiro no `config.py`.

## 1. Convenções

| Item | Regra |
|---|---|
| Unidade | metro (1 mm = 0.001) |
| Eixos | Z para cima. A frente do produto e das máquinas olha para **-Y** (lado da câmera). |
| Ritmo | 30 fps, 840 quadros (28 s), saída 1080×1920 (9:16) |
| Direção do material | O pó sempre cai de cima para baixo. O avanço horizontal vai da esquerda para a direita da tela (+X). |
| Luz principal | Sempre do alto à esquerda (−X, −Y, +Z). Exceção: na viagem micro, a luz vem da frente (saída). |
| Conversão de cor | Khronos PBR Neutral (fidelidade de cor de produto) |

## 2. Cenários (no mesmo .blend, distantes entre si)

| Cenário | Origem | Escala | Conteúdo |
|---|---|---|---|
| A, fábrica | (0, 0, 0) | real | sala, bancada, recipiente, mão, concha, tremonha, mesa do molde, lâmina, prensa |
| B, micro | (100, 0, 0) | ~1000× (1 m ≈ 1 mm real) | canal do herói, dois canais laterais (cores esquerda e direita), peneira, saída iluminada |
| C, estúdio | (−100, 0, 0) | real | fundo branco, estojo, 3 godês, tampa e câmera final calibrada |

A passagem entre cenários acontece **somente** nos cortes invisíveis da seção 4. Câmeras diferentes
são trocadas por marcadores da linha do tempo.

## 3. Nomes dos objetos

| Prefixo | Significado |
|---|---|
| `PROV_` | geometria **provisória** (forma genérica; será substituída ou refinada) |
| `PROD_` | produto (estojo, godês, tampa). Medidas a partir da foto calibrada. |
| `PO_` | pó (fluxos, montes, grãos, nuvem) |
| `SET_` | cenário fixo |
| `CAM_` / `LUZ_` / `MAT_` | câmeras, luzes e materiais |

Os objetos-chave são estes:
- `PO_monte_heroi`: disco com chaves de forma `monte_1..3`, `rasado_0..5` e `prensado`.
- `PROV_mesa_molde_rig`: move-se da dosagem (x = 0) para a prensa (x = 0,12 m).
- `PROD_godê_heroi_A` e `PROD_godê_heroi_C`: o mesmo godê nos cenários A e C (corte por correspondência).

## 4. Linha do tempo (quadros)

| Quadros | Cenário / câmera | Ação | Tipo |
|---|---|---|---|
| 1–189 | A / `CAM_A1_bancada` (40 mm) | recipiente aberto, mão de luva com concha, despejo na tremonha, mergulho na garganta | fiel no gesto, formas provisórias |
| **190** | corte 1 | escuro da garganta da tremonha | corte invisível |
| 190–344 | B / `CAM_B_micro` (20 mm, profundidade de campo) | descida entre grãos do herói, canais laterais separados, peneira, saída iluminada | **conceitual** |
| **345** | corte 2 | clarão da saída para a nuvem de pigmento que se dissipa | corte invisível |
| 345–439 | A / `CAM_A2_prensa` (116 mm) | dosagem automática no godê, monte acima da borda | conceitual (mecanismo não confirmado) |
| 440–500 | A | a mesa leva o godê sob a lâmina fixa, rasagem e excesso caindo na bandeja coletora | conceitual |
| 515–578 | A | punção desce, compacta (538) e sobe; a superfície passa de fosca para acetinada | conceitual |
| 585–612 | A | ejeção do godê (+15 mm) e aproximação extrema da superfície prensada | conceitual |
| **615** | corte 3 | corte por correspondência: a mesma superfície prensada, no mesmo enquadramento | corte invisível |
| 615–690 | C / `CAM_C_estudio` (116 mm) | o godê herói desce na cavidade central, ao lado dos outros dois já prontos | conceitual (fixação real não confirmada) |
| 690–760 | C | recuo até a pose calibrada da foto | fiel ao produto |
| 760–840 | C | pausa no enquadramento final; assinatura da Garnet a partir de 785 (2D, fora do produto) | assinatura |

## 5. Produto (hipóteses ajustáveis)

Valores a partir de `verificar/calibracao.json`. A escala depende de **uma** hipótese: o godê tem
diâmetro visível de 36 mm.

| Medida | Valor | Situação |
|---|---|---|
| Diâmetro visível do godê | 36 mm | **HIPÓTESE**: pedir medida real |
| Estojo (L × P × A da base) | 120,5 × 52,2 × 11,2 mm | derivado da foto + hipótese |
| Distância entre centros dos godês | 37,4 mm | derivado |
| Abertura da tampa | ~118° | derivado (erro médio da calibração 0,7 px) |
| Espessura da tampa | 6 mm | HIPÓTESE |
| Profundidade do godê | 3,5 mm | HIPÓTESE |
| Câmera da foto | elevação 51,2°, distância 413 mm, lente equivalente 116 mm (sensor 36 mm) | calibrado |

## 6. Cores (medidas na foto, mediana do centro de cada godê, sRGB)

| Godê | Cor | Acabamento observado |
|---|---|---|
| Esquerdo | `#AE745C` marrom | fosco |
| **Meio (herói)** | `#E8857A` coral | com brilho fino |
| Direito | `#E8B8A7` champanhe/pêssego | com brilho fino |
| Estojo | `#F2C2C2` rosa (área iluminada) | acetinado |
| Tampa | `#F6E4EA` | acrílico rosado translúcido com glitter e logo em relevo |

O albedo de cada material é calibrado comparando o render da pose final com a foto
(`verificar/calibrar_cores.py`, que grava `cena/ajuste_cores.json`).

## 7. Verificação obrigatória antes de cada entrega

1. `verificar/comparar_final.py`: cores dos godês, IoU da silhueta e sobreposição com a foto.
2. `verificar/quadros.sh`: folha de contato dos quadros de contato (mão × concha, concha × pó, lâmina × godê, punção × pó, godê × estojo).
3. `ffprobe` do vídeo: resolução, fps e número de quadros.
