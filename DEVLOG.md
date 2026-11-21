# Devlog — memória de desenvolvimento

Este arquivo é o diário de bordo do projeto. O `README.md` explica **o jogo**; aqui ficam as decisões, os gargalos e, principalmente, **onde paramos**.

> **Regra de manutenção:** ao finalizar qualquer tarefa, acrescente uma entrada curta aqui e atualize o bloco `ESTADO ATUAL` do `AGENTS.md`. É isso que permite retomar o trabalho em uma nova sessão sem depender da conversa anterior — cada sessão começa do zero, mas o repositório não.

## Estado atual — 21/11/2026

- **Onde paramos:** 4 categorias implementadas em `brick-race/game.js` (ainda não commitadas), com seletor de teste por `?cat=1..4` e teclas `1`–`4`. Publicação anterior: `https://alvjeff.github.io/brickgame-race-clone/brick-race/`.
- **O que já funciona:** boot, menu, placar com recorde persistente, áudio, colisão, explosão, pause/restart e as 4 categorias (faixas, velocidade, controle fino e limites do jogador).
- **Modo de teste:** `?cat=1` a `?cat=4` na URL ou teclas 1–4 no menu pulam para a categoria. O score semeado não atualiza o `HI` e a seleção é limpa ao voltar ao menu.
- **O que ainda não existe:** build, dependências, testes automatizados e servidor próprio. Não há Node instalado neste ambiente, então a validação é feita no navegador.
- **Gargalos conhecidos (ainda não corrigidos):**
  1. A temporização usa contagem de frames (`frameCount % speed`) e assume ~60 Hz; em telas 120 Hz o jogo fica cerca de 2× mais rápido.
  2. A colisão usa uma caixa envolvente 3×4 cheia, embora `carShape` tenha células vazias — pode acontecer uma batida "invisível" quando os desenhos não se tocam.
  3. `playMenuMelody()` é chamada em `startGame()`, mas a transição de 1,2 s corta a melodia, que dura cerca de 3 s.
  4. A transição para a categoria 3 ainda limpa a pista de forma abrupta (`obstacles = []`).
- **Próximos passos sugeridos:** (1) validar as 4 categorias no navegador/Pages; (2) corrigir os gargalos 1 a 3; (3) cobrir as transições com testes; (4) opcional: URL sem `/brick-race/` via GitHub Actions.

## Insight do dia — 21/11/2026

Hoje tive a ideia de pedir ao agente para melhorar a nossa forma de documentar o projeto, justamente para que o registro sirva de memória — para mim e para outras pessoas que usarem o repositório. Dessa conversa nasceram as três camadas que existem hoje: `README.md` para quem quer conhecer o jogo, `DEVLOG.md` para quem precisa retomar o trabalho e `AGENTS.md` para o agente que abre uma nova sessão.

Também defini duas regras de convivência com o agente: alterações em arquivos devem ser descritas e confirmadas antes de executadas, e os commits são feitos por mim. Estão registradas em `AGENTS.md` para que a próxima sessão já comece sabendo disso.

## Publicação no GitHub Pages — 21/11/2026

O jogo está no ar em `https://alvjeff.github.io/brickgame-race-clone/brick-race/`.

**Conceito:** o GitHub Pages serve arquivos estáticos de uma branch. O seletor de pastas da aba Pages não listou a subpasta `brick-race`, então a origem ficou em `/(root)` da branch `main`. O `index.html` continua na subpasta e passou a ser acessível pelo caminho `/brick-race/`. Como ele referencia `style.css` e `game.js` por caminhos relativos, o navegador resolve os arquivos dentro dessa mesma pasta e nada quebra. A URL curta da raiz não tem `index.html` e retorna 404 — o endereço correto é o completo.

Validação: acessado com sucesso no celular em retrato. Os botões de toque (`touchstart` com `preventDefault`) e o áudio liberado ao tocar em **JOGAR** funcionaram. Em paisagem o console pode ficar cortado porque o `body` usa `height: 100vh`.

Alternativa guardada para o futuro: publicar via GitHub Actions com `path: ./brick-race`, o que permitiria uma URL sem o trecho `/brick-race/`.

## Linha do tempo

| Data | Commit | O que mudou |
| --- | --- | --- |
| 02/11 | `3087764` | Initial commit |
| 02/11 | `11b47e8` | Primeiro commit do jogo |
| 02/11 | `021a996` | Menu inicial e botão de iniciar após perder |
| 02/11 | `8414bd4` | Correção do espaçamento entre os carros |
| 02/11 | `0407894` | Novo placar de score |
| 02/11 | `c18d0b7` | Ajuste na colisão do carro |
| 02/11 | `3dc3eb7` | Som e tela de carregamento |
| 02/11 | `0045d37` | Melhoria no som da explosão |
| 06/11 | `334c4cf` | Inclusão do arquivo de agente de IA |
| 07/11 | `16c1251` | Botão de pause e mecânica dos níveis |
| 07/11 | `caea7ee` | Recorde persistente (HI) no placar |
| 07/11 | `f63f61d` | Melhoria da tela inicial |
| 07/11 | `53a7b45` | Pause e retorno à tela inicial |
| 21/11 | — | Documentação, publicação no GitHub Pages, 4 categorias e modo de teste |

## Quatro categorias e modo de teste — 21/11/2026

A escada de 9 níveis foi substituída por 4 categorias. O score continua sendo o único eixo: a categoria é derivada dele (`getCategory()`), e o reset da velocidade continua sendo um único evento — agora na entrada da categoria 3.

| Categoria | Score | Faixas | Passo lateral | Velocidades |
| --- | --- | --- | --- | --- |
| 1 — introdução | 0–99 | `[2, 5]` | 3 colunas | 14 (0–39), 12 (40–99) |
| 2 — pressão | 100–449 | `[1, 4, 7]` | 3 colunas | 10 (100–199), 8 (200–319), 6 (320–449) |
| 3 — respiro | 450–649 | `[2, 5]` | 1 coluna *(reset aqui)* | 14 (450–489), 12 (490–549), 10 (550–649) |
| 4 — final | ≥ 650 | `[1, 4, 7]` | 1 coluna | 8 (650–769), 6 (770–899), 5 (900–1049), 4 (1050–1349), 3 (≥ 1350) |

`SPEED_RESET_SCORE = 450`. A partir daí, `getPhaseScore()` devolve `score - 450` e essa pontuação relativa alimenta **tanto** a velocidade quanto a frequência de obstáculos (`getFrequencyForScore()`). Antes, só a velocidade reiniciava; agora a categoria 3 é um respiro de verdade, com menos carros e mais lentos. A categoria 4 não tem um segundo reset: apenas continua a rampa.

Nas categorias 1 e 3 **tanto os obstáculos quanto o jogador** ficam nos 6 blocos centrais da grade: um carro cobre as colunas 2–4 e o outro, 5–7 (`TWO_LANE_COLS = [2, 5]`). Sobra uma coluna livre de cada lado (1 e 8), além das bordas 0 e 9. `getMinPlayerX()` e `getMaxPlayerX()` limitam o `playerX` a 2–5. Não existe faixa livre dentro da área de jogo: é o comportamento de duas faixas do nível 1 do Brick Game original, agora centralizado. Para não criar uma situação sem escape, o spawn duplo (`0.2 + category * 0.03`) foi desligado nessas categorias — ele só roda quando há três faixas. Ao trocar de categoria, o `playerX` é recolocado nos novos limites: quem vinha da coluna 1 ou 7 é trazido para 2 ou 5 ao entrar numa categoria de duas faixas.

**Modo de teste:** a URL `?cat=1` a `?cat=4` (ou as teclas `1`–`4` no menu) define `startCategory`. `applyTestCategory()` semeia o score inicial de `TEST_START_SCORES` e, para as categorias 3 e 4, marca a transição como já feita — sem isso, o `update()` dispararia um segundo reset e o teste não refletiria a rampa real. `clearTestMode()` roda ao reiniciar e ao voltar do game over, e o bloco que persiste o recorde tem a guarda `!testMode` para o score semeado não virar `HI`. O menu visual não mudou.

## Faixas, níveis e velocidade — comportamento anterior (até 21/11/2026)

Esta seção é histórica: descreve a mecânica de 9 níveis **antes** das 4 categorias. O conceito por trás da segunda rampa e os gargalos conhecidos estão em *Decisões e gargalos*.

### Faixas de carros

- A grade tem 10 colunas (0–9) e cada carro ocupa 3 colunas. Por isso as posições discretas usadas são `1, 4 e 7` (`obstacleCols`), com uma coluna vazia entre uma e outra.
- O jogador começa em `playerX = 4`. Até o nível 7, cada comando move 3 colunas — ele alterna exatamente entre 1, 4 e 7. A partir do nível 8 o passo cai para 1 coluna (controle fino), então o jogador pode ocupar qualquer coluna de 1 a 7, enquanto os obstáculos continuam surgindo só em 1, 4 ou 7.
- Cada leva sorteia **uma** faixa. Há `chanceDuplo = 0.2 + level * 0.03` (≈23% no nível 1 e ≈47% no nível 9) de sortear uma segunda faixa diferente da primeira. Mesmo assim, no máximo duas faixas ficam ocupadas por leva — sempre sobra uma livre.
- Antes de criar outra leva, o código exige que o último obstáculo já tenha descido para `row > 5`, para não empilhar carros na mesma região da pista.
- **Não existe nível 0.** A primeira faixa de pontuação (score 0–39) já é nível 1, com três faixas ativas desde o começo.

### Níveis e velocidade

| Score absoluto | Nível | `freqObstaculo` (frames entre levas) | `speed` (frames por linha descida) |
| --- | --- | --- | --- |
| 0–39 | 1 | 75 | 14 |
| 40–99 | 2 | 70 | 12 |
| 100–199 | 3 | 65 | 10 |
| 200–319 | 4 | 60 | 8 |
| 320–449 | 5 | 55 | 6 |
| 450–599 | 6 | 50 | 5 |
| 600–749 | 7 | 45 | 4 |
| 750–899 | 8 | 40 | reinicia em 14 (rampa relativa) |
| ≥ 900 | 9 | 35 | segue a rampa relativa |

`freqObstaculo` é `max(32, 80 - level * 5)`: quanto menor, mais obstáculos aparecem. `speed` vem de `getSpeedForScore()` e indica a cada quantos frames os obstáculos descem uma linha — **quanto menor, mais rápido**.

Ao entrar no nível 8 (score ≥ 750), a pista é limpa, `speedPhaseStartScore` guarda o score atual e a velocidade volta a 14, como no início. A partir daí a tabela é aplicada a `score - speedPhaseStartScore`, então os marcos relativos +40, +100, +200, +320, +450, +600 e +900 vão reduzindo a velocidade novamente. O `frameCount += 30` nessa transição dá um respiro antes da próxima leva.

Cada obstáculo que passa vale 10 pontos. É esse o ponto de partida para a discussão sobre reduzir faixas no início: hoje são sempre três, inclusive no primeiro nível.

## Decisões e gargalos

### Grade e colisão

A tela é uma grade de 10×20 blocos de 20 px. Trabalhar com índices de coluna (em vez de coordenadas livres) simplifica a colisão: basta comparar intervalos. O carro e os obstáculos ocupam 3 colunas × 4 linhas.

**Conceito:** a colisão usada é do tipo *AABB* (axis-aligned bounding box) — cada objeto é tratado como um retângulo e verifica-se se os intervalos X e Y se sobrepõem:

```js
const overlapX = playerLeft <= obsRight && obsLeft <= playerRight;
const overlapY = Math.abs(playerRow - obs.row) < 4;
```

**Gargalo:** `carShape` tem buracos (a primeira e a quarta linhas não têm as 3 células preenchidas), mas a caixa envolvente considera o retângulo todo. O resultado é uma colisão que pode acontecer sem contato visual. Uma correção possível é testar célula por célula usando o próprio `carShape`, mantendo o AABB apenas como filtro rápido.

### Velocidade, níveis e a segunda rampa

A dificuldade tem dois eixos: a **frequência** com que obstáculos aparecem (`freqObstaculo`, que diminui com o nível) e a **velocidade** com que descem (`speed`, vinda de `getSpeedForScore()`).

**Conceito:** a tabela de velocidade recebe uma pontuação. Na primeira volta usa-se o score absoluto; ao alcançar o nível 8, `speedPhaseStartScore` guarda o score atual e a tabela passa a receber `score - speedPhaseStartScore`, reiniciando a rampa sem zerar o placar. É o mesmo desenho de "fase" usado em clones de Snake.

**Gargalo:** tudo é contado em frames (`frameCount % speed`). Como `requestAnimationFrame` acompanha a taxa de atualização do monitor, a dificuldade real depende do hardware. A correção é acumular `deltaTime` e converter a lógica para tempo decorrido.

### Áudio

Todos os efeitos são sintetizados com a Web Audio API: `OscillatorNode` + `GainNode`, sem arquivos externos. O motor é um oscilador contínuo cuja frequência acompanha a velocidade; no pause o ganho vai a zero, e no game over o oscilador é parado. O `AudioContext` é criado na primeira interação para respeitar a política de autoplay.

**Gargalo:** a melodia de início tem ~3 s, mas `startGame()` entra em `PLAYING` depois de 1,2 s e os callbacks da melodia verificam `gameState !== 'START'`. Ela é interrompida no meio — pode ser intencional (jingle curto) ou um ajuste de timing pendente.

### Pause e reinício (último trabalho)

O pause passou de um texto desenhado no canvas para um overlay HTML.

**Conceito:** manter a interface do console (overlay, botões reais, foco, `aria-label`) fora do canvas permite usar recursos nativos do DOM e evita redesenhar a tela a cada frame. A máquina de estados ganhou um estado lateral `PAUSED`: ao pausar, o loop para de agendar `requestAnimationFrame`; ao retomar, `update()` é chamado novamente. `isRestartConfirmOpen()` funciona como trinco — com a confirmação aberta, `P` e cliques de pause são ignorados até `SIM` ou `NÃO`.

Também foi tratada a duplicação de eventos `touchstart` + `click` nos botões: as ações de iniciar e reiniciar têm guardas explícitas (`startPending` e a própria confirmação aberta).

### Recorde

`loadHighScore()` e `saveHighScore()` usam `localStorage` dentro de `try/catch`, para que o jogo continue funcionando mesmo com armazenamento bloqueado. O recorde é atualizado ao vivo, assim que o score o ultrapassa, sem esperar o game over.

## Como retomar em uma nova sessão

1. Abra o projeto e leia o bloco `ESTADO ATUAL` do `AGENTS.md` — é carregado automaticamente pelo agente.
2. Leia a seção `Estado atual` deste arquivo para contexto e gargalos.
3. Ao concluir, atualize **os dois**. Se o próximo passo mudar, troque também a lista de próximos passos.
