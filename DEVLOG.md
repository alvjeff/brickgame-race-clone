# Devlog — memória de desenvolvimento

Este arquivo é o diário de bordo do projeto. O `README.md` explica **o jogo**; aqui ficam as decisões, os gargalos e, principalmente, **onde paramos**.

> **Regra de manutenção:** ao finalizar qualquer tarefa, acrescente uma entrada curta aqui e atualize o bloco `ESTADO ATUAL` do `AGENTS.md`. É isso que permite retomar o trabalho em uma nova sessão sem depender da conversa anterior — cada sessão começa do zero, mas o repositório não.

## Estado atual — 21/11/2026

- **Onde paramos:** documentação. O último código entregue foi o commit `53a7b45` (07/11), com pause em overlay HTML, confirmação de reinício e retorno à tela inicial.
- **O que já funciona:** boot com barra de carregamento, menu LCD, placar com recorde persistente, 9 níveis, áudio, colisão, explosão, pause e restart.
- **O que ainda não existe:** build, dependências, testes automatizados e servidor próprio. Não há Node instalado neste ambiente de desenvolvimento, então a validação de sintaxe/execução é feita no navegador.
- **Gargalos conhecidos (ainda não corrigidos):**
  1. A temporização usa contagem de frames (`frameCount % speed`) e assume ~60 Hz; em telas 120 Hz o jogo fica cerca de 2× mais rápido.
  2. A colisão usa uma caixa envolvente 3×4 cheia, embora `carShape` tenha células vazias — pode acontecer uma batida "invisível" quando os desenhos não se tocam.
  3. `playMenuMelody()` é chamada em `startGame()`, mas a transição de 1,2 s corta a melodia, que dura cerca de 3 s.
  4. Ao entrar no nível 8, `obstacles = []` limpa a pista de forma abrupta.
- **Próximos passos sugeridos:** (1) consolidar esta documentação; (2) corrigir os gargalos 1 a 3; (3) cobrir as transições de estado com testes.

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
| 21/11 | — | Documentação (README, Devlog e estado no AGENTS.md) |

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
