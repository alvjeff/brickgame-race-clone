# Diretrizes do Projeto & Filosofia de Desenvolvimento

- **Perfil:** Desenvolvedor focado em entender a fundo tanto a base (Bottom-Up) quanto a prototipagem rápida (Top-Down).
- **Abordagem:** Não apenas gere o código. Sempre que implementar uma lógica complexa (como física 2D, raycasting ou loops de renderização), explique sucintamente o conceito por trás.
- **Estilo:** Código limpo, modular, performático e bem comentado.
- **Fluxo de trabalho:** antes de criar, editar ou reescrever arquivos, descreva a alteração pretendida e aguarde a confirmação do usuário. Não faça commits — o usuário prefere commitar por conta própria.

## Estado Atual (atualizado em 21/11/2026)

- **Onde paramos:** jogo publicado no GitHub Pages e documentação atualizada. Último código: commit `53a7b45` — pause em overlay HTML, confirmação de reinício e retorno à tela inicial.
- **Publicado em:** `https://alvjeff.github.io/brickgame-race-clone/brick-race/` (Pages com origem `/(root)` da `main`; testado no celular em retrato).
- **Funciona:** boot, menu, score com HI persistente, 9 níveis, áudio, colisão, pause/restart.
- **Sem:** build, dependências, testes e Node neste ambiente (validação no navegador).
- **Gargalos em aberto:** (1) loop por frames, dependente de 60 Hz; (2) colisão AABB com caixa cheia, apesar dos buracos em `carShape`; (3) melodia de início cortada após 1,2 s; (4) limpeza abrupta da pista ao entrar no nível 8.
- **Próximos passos:** (1) corrigir os gargalos 1–3; (2) testar as transições de estado; (3) opcional: URL limpa via GitHub Actions.
- **Detalhes:** veja `DEVLOG.md` (decisões, histórico, gargalos e publicação) e `README.md` (visão geral e controles).

> Ao finalizar qualquer tarefa, atualize este bloco e o `DEVLOG.md`. É o que permite retomar o projeto em uma nova sessão sem depender da conversa anterior.