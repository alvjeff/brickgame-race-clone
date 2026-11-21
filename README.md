# Brick Game Race — clone

Recriação em navegador do jogo de corrida do clássico **Brick Game** (Big Jeff Games), com a estética LCD verde do portátil original. Projeto feito em HTML, CSS e JavaScript puro — sem dependências, build ou servidor.

## Como jogar

Abra `brick-race/index.html` no navegador. O áudio só é liberado após o primeiro clique, por política de autoplay dos navegadores.

| Ação | Teclado | Toque |
| --- | --- | --- |
| Iniciar partida | `Enter` ou `Espaço` | botão **JOGAR** |
| Mover para esquerda/direita | `←` / `→` | botões **◀** / **▶** |
| Pausar / retomar | `P` | botão **PAUSE** |
| Fechar confirmação de reinício | `Esc` | botão **NÃO** |

Desvie dos carros. Cada obstáculo que passa vale **10 pontos**. O recorde (`HI`) fica salvo no `localStorage` do navegador. Dentro do menu de pause, o botão de reiniciar abre uma confirmação antes de voltar à tela inicial.

## Estrutura do repositório

| Arquivo | Função |
| --- | --- |
| `brick-race/index.html` | Placar, canvas 200×400 e overlays de boot, menu, pause e confirmação |
| `brick-race/style.css` | Tema LCD, botões retro e overlays |
| `brick-race/game.js` | Máquina de estados, renderização, áudio Web Audio e entrada |
| `AGENTS.md` | Diretrizes para agentes de IA **e estado atual do projeto** (lido automaticamente) |
| `DEVLOG.md` | Memória de desenvolvimento: decisões, gargalos e onde paramos |

## Como funciona (resumo)

- **Grade lógica:** 10 colunas × 20 linhas de blocos de 20 px. O carro ocupa 3×4 blocos.
- **Estados:** `LOADING → START → PLAYING → CRASHED → GAMEOVER → START`. `PAUSED` é um estado lateral que congela o loop e é resolvido por `P` ou pelo botão.
- **Obstáculos:** surgem nas colunas 1, 4 e 7, com distância mínima entre si; a chance de surgirem em dupla cresce com o nível.
- **Níveis:** 1 a 9 controlam a frequência dos obstáculos. A partir do nível 8 o controle lateral fica fino (1 coluna por vez em vez de 3).
- **Velocidade:** duas rampas. A segunda começa ao entrar no nível 8, quando a pista é limpa e a contagem de pontos para a rampa reinicia (`speedPhaseStartScore`).
- **Áudio:** gerado na hora com a Web Audio API (ondas quadradas para melodia/bip, serra para motor/explosão). Não existem arquivos de som.

## Estado do projeto

O registro detalhado (histórico, decisões, gargalos conhecidos e próximos passos) está em [`DEVLOG.md`](DEVLOG.md). O resumo curto e sempre atualizado para quem retoma o trabalho fica no [`AGENTS.md`](AGENTS.md).
