const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');

// Configuração da Grade de Blocos (10 colunas x 20 linhas)
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

// Estados do Jogo
let gameState = 'START'; // 'START', 'PLAYING', 'CRASHED', 'GAMEOVER'
let playerTrack = 1; 
let score = 0;
let obstacles = [];
let frameCount = 0;
let speed = 12;
let crashAnimationTimer = 0; // Temporizador para o efeito da explosão

// Posições X das 3 pistas na grade
const tracks = [1, 4, 7];

// Formato do carrinho de blocos (3x4)
const carShape = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
    [1, 0, 1]
];

// Função para iniciar o jogo ao clicar no botão
function startGame() {
    gameState = 'PLAYING';
    startScreen.style.display = 'none';
    resetGame();
    update();
}

// Reseta variáveis do jogo
function resetGame() {
    score = 0;
    playerTrack = 1;
    obstacles = [];
    frameCount = 0;
    crashAnimationTimer = 0;
    document.getElementById('scoreDisplay').innerText = '000000';
}

// Desenha um único bloco estilo LCD
function drawBlock(col, row, active = true) {
    const x = col * BLOCK_SIZE;
    const y = row * BLOCK_SIZE;

    if (active) {
        ctx.fillStyle = '#1e2612';
        ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        ctx.fillStyle = '#8b956d';
        ctx.fillRect(x + 4, y + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
        ctx.fillStyle = '#1e2612';
        ctx.fillRect(x + 6, y + 6, BLOCK_SIZE - 12, BLOCK_SIZE - 12);
    } else {
        ctx.strokeStyle = 'rgba(30, 38, 18, 0.08)';
        ctx.strokeRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    }
}

// Desenha a grade
function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawBlock(c, r, false);
        }
    }
    
    for (let r = 0; r < ROWS; r++) {
        if ((r + frameCount) % 4 < 2) {
            drawBlock(0, r, true);
            drawBlock(9, r, true);
        }
    }
}

// Desenha o carrinho normal
function drawCar(colStart, rowStart) {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
            if (carShape[r][c] === 1) {
                const targetRow = rowStart + r;
                if (targetRow >= 0 && targetRow < ROWS) {
                    drawBlock(colStart + c, targetRow, true);
                }
            }
        }
    }
}

// Desenha o efeito de explosão (carrinho estilhaçado em blocos aleatórios)
function drawExplosion(colStart, rowStart) {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
            // Desenha blocos espalhados simulando destroços
            if ((r + c + crashAnimationTimer) % 2 === 0) {
                const targetRow = rowStart + r;
                const targetCol = colStart + c + (Math.random() > 0.5 ? 1 : -1); // Efeito tremido
                if (targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
                    drawBlock(targetCol, targetRow, true);
                }
            }
        }
    }
}

// Controles do Teclado
document.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;

    if (e.key === 'ArrowLeft' && playerTrack > 0) {
        playerTrack--;
    } else if (e.key === 'ArrowRight' && playerTrack < 2) {
        playerTrack++;
    }
});

// Loop Principal do Jogo
function update() {
    if (gameState === 'GAMEOVER') return;

    frameCount++;

    if (gameState === 'PLAYING') {
        // Gera novos obstáculos
        if (frameCount % 85 === 0) {
            const randomTrack = Math.floor(Math.random() * 3);
            const ultimoObstaculo = obstacles[obstacles.length - 1];
            
            if (!ultimoObstaculo || ultimoObstaculo.row > 6) {
                obstacles.push({ track: randomTrack, row: -4 });
                
                if (Math.random() < 0.3) {
                    let segundaPista;
                    do {
                        segundaPista = Math.floor(Math.random() * 3);
                    } while (segundaPista === randomTrack);
                    
                    obstacles.push({ track: segundaPista, row: -4 });
                }
            }
        }

        // Move obstáculos
        if (frameCount % speed === 0) {
            for (let i = 0; i < obstacles.length; i++) {
                obstacles[i].row++;
            }

            if (obstacles.length > 0 && obstacles[0].row >= ROWS) {
                obstacles.shift();
                score += 10;
            }
        }

        // Checa colisões
        const playerCol = tracks[playerTrack];
        const playerRow = 16;

        for (let obs of obstacles) {
            const obsCol = tracks[obs.track];
            if (Math.abs(playerCol - obsCol) < 3 && Math.abs(playerRow - obs.row) < 4) {
                gameState = 'CRASHED';
                crashAnimationTimer = 0;
            }
        }
    }

    // Renderiza a tela base
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    const playerCol = tracks[playerTrack];
    const playerRow = 16;

    // Desenha obstáculos na cena
    for (let obs of obstacles) {
        drawCar(tracks[obs.track], obs.row);
    }

    // Se bateu, roda a animação curta de explosão antes de congelar
    if (gameState === 'CRASHED') {
        crashAnimationTimer++;
        drawExplosion(playerCol, playerRow);

        // Após alguns instantes de explosão, congela na tela de Game Over
        if (crashAnimationTimer > 25) {
            gameState = 'GAMEOVER';
        }
    } else {
        drawCar(playerCol, playerRow);
    }

    // Atualiza o placar
    document.getElementById('scoreDisplay').innerText = String(score).padStart(6, '0');

    if (gameState === 'GAMEOVER') {
        // Desenha a mensagem de Game Over diretamente congelada sobre a última cena
        ctx.fillStyle = '#1e2612';
        ctx.fillRect(20, 150, 160, 60); // Fundo escuro para destacar o texto
        
        ctx.strokeStyle = '#8b956d';
        ctx.strokeRect(22, 152, 156, 56);

        ctx.fillStyle = '#8b956d';
        ctx.font = 'bold 14px Courier New';
        ctx.fillText("GAME OVER", 52, 175);
        
        ctx.font = '10px Courier New';
        ctx.fillText("CLIQUE EM JOGAR", 45, 195);

        // Mostra o botão de reiniciar na moldura
        setTimeout(() => {
            startScreen.style.display = 'flex';
            document.getElementById('startButton').innerText = 'JOGAR NOVAMENTE';
        }, 1000);
    } else {
        requestAnimationFrame(update);
    }
}

// Renderiza a grade inicial estática
drawGrid();