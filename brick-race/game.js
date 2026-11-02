const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');

// Configuração da Grade de Blocos (10 colunas x 20 linhas)
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

// Estados do Jogo
let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
let playerTrack = 1; 
let score = 0;
let obstacles = [];
let frameCount = 0;
let speed = 10;

// Posições X das 3 pistas na grade
const tracks = [1, 4, 7];

// Formato do carrinho de blocos
const carShape = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
    [1, 0, 1]
];

// Função para iniciar o jogo ao clicar no botão
function startGame() {
    gameState = 'PLAYING';
    startScreen.style.display = 'none'; // Esconde a tela do menu
    resetGame();
    update();
}

// Reseta variáveis do jogo
function resetGame() {
    score = 0;
    playerTrack = 1;
    obstacles = [];
    frameCount = 0;
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

// Desenha o carrinho
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
    if (gameState !== 'PLAYING') return;

    frameCount++;

    // Gera novos obstáculos
    if (frameCount % (speed * 3) === 0) {
        const randomTrack = Math.floor(Math.random() * 3);
        obstacles.push({ track: randomTrack, row: -4 });
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
            gameState = 'GAMEOVER';
        }
    }

    // Renderiza a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    drawCar(playerCol, playerRow);
    for (let obs of obstacles) {
        drawCar(tracks[obs.track], obs.row);
    }

    ctx.fillStyle = '#1e2612';
    ctx.font = '12px Courier New';
    ctx.fillText(`SCORE: ${score}`, 10, 15);

    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = '#1e2612';
        ctx.font = '16px Courier New';
        ctx.fillText("GAME OVER", 50, 200);
        
        // Exibe o botão de menu novamente após 1.5s
        setTimeout(() => {
            startScreen.style.display = 'flex';
            document.getElementById('startButton').innerText = 'JOGAR NOVAMENTE';
        }, 1500);
    } else {
        requestAnimationFrame(update);
    }
}

// Renderiza a grade de fundo estática na tela inicial
drawGrid();