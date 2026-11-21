# Diretrizes do Projeto & Filosofia de Desenvolvimento

- **Perfil:** Desenvolvedor focado em entender a fundo tanto a base (Bottom-Up) quanto a prototipagem rápida (Top-Down).
- **Abordagem:** Não apenas gere o código. Sempre que implementar uma lógica complexa (como física 2D, raycasting ou loops de renderização), explique sucintamente o conceito por trás.
- **Estilo:** Código limpo, modular, performático e bem comentado.
- **Fluxo de trabalho:** antes de criar, editar ou reescrever arquivos, descreva a alteração pretendida e aguarde a confirmação do usuário. Não faça commits — o usuário prefere commitar por conta própria.

## Estado Atual (atualizado em 21/11/2026)

- **Onde paramos:** 4 categorias implementadas em `brick-race/game.js` (não commitadas), com seletor de teste. Publicação anterior: `https://alvjeff.github.io/brickgame-race-clone/brick-race/`.
- **Como testar:** `?cat=1` a `?cat=4` na URL ou teclas `1`–`4` no menu. O score semeado não mexe no `HI`; a seleção é limpa ao voltar ao menu.
- **Categorias:** 1 = `[2,5]`/passo 3; 2 = `[1,4,7]`/passo 3; 3 = `[2,5]`/passo 1 com reset em 450; 4 = `[1,4,7]`/passo 1 continuando a rampa. Nas categorias 1 e 3 obstáculos e jogador ocupam os 6 blocos centrais (2–7), com limites 2–5, e o spawn duplo é desligado (sem escape).
- **Funciona:** boot, menu, score com HI persistente, áudio, colisão, explosão, pause/restart.
- **Sem:** build, dependências, testes e Node neste ambiente (validação no navegador).
- **Gargalos em aberto:** (1) loop por frames, dependente de 60 Hz; (2) colisão AABB com caixa cheia, apesar dos buracos em `carShape`; (3) melodia de início cortada após 1,2 s; (4) limpeza abrupta da pista ao entrar na categoria 3.
- **Próximos passos:** (1) validar as 4 categorias no navegador/Pages; (2) corrigir os gargalos 1–3; (3) opcional: URL limpa via GitHub Actions.
- **Detalhes:** veja `DEVLOG.md` (decisões, histórico, gargalos, publicação e categorias) e `README.md` (visão geral, controles e modo de teste).

> Ao finalizar qualquer tarefa, atualize este bloco e o `DEVLOG.md`. É o que permite retomar o projeto em uma nova sessão sem depender da conversa anterior.