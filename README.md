# Brick Game Race — clone

Recriação em navegador do jogo de corrida do clássico **Brick Game** (Big Jeff Games), com a estética LCD verde do portátil original. Projeto feito em HTML, CSS e JavaScript puro — sem dependências, build ou servidor.

## Jogar online

Publicado no GitHub Pages: **https://alvjeff.github.io/brickgame-race-clone/brick-race/**

O site é servido com origem `/(root)` da branch `main`, porque a caixa de seleção de pastas do Pages não listou a subpasta `brick-race`. O `index.html` continua nessa subpasta e é acessível pelo caminho `/brick-race/`; como o HTML usa caminhos relativos (`style.css`, `game.js`), os arquivos são resolvidos dentro da própria pasta. A URL da raiz não tem `index.html` e retorna 404 — use o endereço completo.

Testado no celular em retrato: controles por toque funcionam e o áudio é liberado ao tocar em **JOGAR**.

Para jogar localmente, abra `brick-race/index.html` no navegador.

## Como jogar

O áudio só é liberado após o primeiro clique ou toque, por política de autoplay dos navegadores.

| Ação | Teclado | Toque |
| --- | --- | --- |
| Iniciar partida | `Enter` ou `Espaço` | botão **JOGAR** |
| Mover para esquerda/direita | `←` / `→` | botões **◀** / **▶** |
| Pausar / retomar | `P` | botão **PAUSE** |
| Fechar confirmação de reinício | `Esc` | botão **NÃO** |

Desvie dos carros. Cada obstáculo que passa vale **10 pontos**. O recorde (`HI`) fica salvo no `localStorage` do navegador. Dentro do menu de pause, o botão de reiniciar abre uma confirmação antes de voltar à tela inicial.

## Modo de teste (desenvolvimento)

Para pular direto a uma categoria sem jogar desde o começo:

- na URL: `.../brick-race/?cat=1`, `?cat=2`, `?cat=3` ou `?cat=4`;
- no teclado: aperte `1`, `2`, `3` ou `4` na tela inicial.

O score usado para entrar na categoria não altera o `HI`, e o modo de teste é desligado ao voltar ao menu. As quatro categorias e a distribuição de velocidade estão em [`DEVLOG.md`](DEVLOG.md).

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
- **Obstáculos:** surgem nas colunas ativas da categoria (`1, 4` ou `1, 4, 7`), com distância mínima entre si. O spawn em dupla só acontece nas categorias de três faixas.
- **Categorias:** quatro faixas de dificuldade derivadas do score. Nas categorias 1 e 3, obstáculos **e jogador** usam os 6 blocos centrais (colunas 2 a 7, com spawn em 2 e 5); nas categorias 2 e 4, usam as colunas 1, 4 e 7. O controle lateral fica fino (1 coluna por toque) a partir da categoria 3.
- **Velocidade:** duas rampas. A segunda começa aos 450 pontos (categoria 3): a pista é limpa e velocidade **e** frequência de obstáculos reiniciam. A categoria 4 continua essa rampa, sem novo reset.
- **Áudio:** gerado na hora com a Web Audio API (ondas quadradas para melodia/bip, serra para motor/explosão). Não existem arquivos de som.

## Estado do projeto

O registro detalhado (histórico, decisões, gargalos conhecidos e próximos passos) está em [`DEVLOG.md`](DEVLOG.md). O resumo curto e sempre atualizado para quem retoma o trabalho fica no [`AGENTS.md`](AGENTS.md).
