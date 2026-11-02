const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loadingScreen');
const startScreen = document.getElementById('startScreen');

// Configuração da Grade de Blocos (10 colunas x 20 linhas)
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

// Estados do Jogo
let gameState = 'LOADING'; // 'LOADING', 'START', 'PLAYING', 'CRASHED', 'GAMEOVER'
let playerTrack = 1; 
let score = 0;
let obstacles = [];
let frameCount = 0;
let speed = 12;
let crashAnimationTimer = 0;

const tracks = [1, 4, 7];

const carShape = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
    [1, 0, 1]
];

// --- SIMULAÇÃO DE BOOT DA BIG JEFF GAMES (COM BARRA PROGRESSIVA) ---
window.addEventListener('load', () => {
    drawGrid(); // Desenha o fundo estático
    
    let progress = 0;
    const bar = document.getElementById('loadingBar');
    
    const loadingInterval = setInterval(() => {
        progress += 2;
        if (bar) bar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                startScreen.style.display = 'flex';
                gameState = 'START';
            }, 300);
        }
    }, 35);
});

// --- MELODIA DE INTRODUÇÃO / MENU (Toca garantido com o primeiro clique do usuário) ---
function playMenuMelody() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const melody = [
            { freq: 330, dur: 150 }, { freq: 330, dur: 150 }, { freq: 330, dur: 300 },
            { freq: 330, dur: 150 }, { freq: 330, dur: 150 }, { freq: 330, dur: 300 },
            { freq: 330, dur: 150 }, { freq: 392, dur: 150 }, { freq: 261.63, dur: 150 }, { freq: 293.66, dur: 150 }, { freq: 330, dur: 600 }
        ];

        let delay = 0;
        melody.forEach((note) => {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'square';
                osc.frequency.value = note.freq;

                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (note.dur / 1000));

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + (note.dur / 1000));
            }, delay);
            delay += note.dur + 50;
        });
    } catch (e) {
        console.log("Erro no áudio.");
    }
}

// --- SOM DE BIP DE LARGADA ---
function playStartSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        let delay = 0;

        notes.forEach((freq) => {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'square';
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + 0.15);
            }, delay);
            delay += 120;
        });
    } catch (e) {}
}

// Função para iniciar o jogo ao clicar no botão
function startGame() {
    playMenuMelody(); // Toca a musiquinha assim que clica no menu!
    
    // Pequeno atraso para dar tempo da melodia soar antes de arrancar na pista
    setTimeout(() => {
        playStartSound();
        gameState = 'PLAYING';
        startScreen.style.display = 'none';
        resetGame();
        update();
    }, 1200);
}

function resetGame() {
    score = 0;
    playerTrack = 1;
    obstacles = [];
    frameCount = 0;
    crashAnimationTimer = 0;
    document.getElementById('scoreDisplay').innerText = '000000';
}

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

function drawExplosion(colStart, rowStart) {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
            if ((r + c + crashAnimationTimer) % 2 === 0) {
                const targetRow = rowStart + r;
                const targetCol = colStart + c + (Math.random() > 0.5 ? 1 : -1);
                if (targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
                    drawBlock(targetCol, targetRow, true);
                }
            }
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;

    if (e.key === 'ArrowLeft' && playerTrack > 0) {
        playerTrack--;
    } else if (e.key === 'ArrowRight' && playerTrack < 2) {
        playerTrack++;
    }
});

function update() {
    if (gameState === 'GAMEOVER') return;

    frameCount++;

    if (gameState === 'PLAYING') {
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

        if (frameCount % speed === 0) {
            for (let i = 0; i < obstacles.length; i++) {
                obstacles[i].row++;
            }

            if (obstacles.length > 0 && obstacles[0].row >= ROWS) {
                obstacles.shift();
                score += 10;
            }
        }

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    const playerCol = tracks[playerTrack];
    const playerRow = 16;

    for (let obs of obstacles) {
        drawCar(tracks[obs.track], obs.row);
    }

    if (gameState === 'CRASHED') {
        crashAnimationTimer++;
        drawExplosion(playerCol, playerRow);

        if (crashAnimationTimer > 25) {
            gameState = 'GAMEOVER';
        }
    } else if (gameState === 'PLAYING') {
        drawCar(playerCol, playerRow);
    }

    document.getElementById('scoreDisplay').innerText = String(score).padStart(6, '0');

    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = '#1e2612';
        ctx.fillRect(20, 150, 160, 60);
        
        ctx.strokeStyle = '#8b956d';
        ctx.strokeRect(22, 152, 156, 56);

        ctx.fillStyle = '#8b956d';
        ctx.font = 'bold 14px Courier New';
        ctx.fillText("GAME OVER", 52, 175);
        
        ctx.font = '10px Courier New';
        ctx.fillText("CLIQUE EM JOGAR", 45, 195);

        setTimeout(() => {
            startScreen.style.display = 'flex';
            document.getElementById('startButton').innerText = 'JOGAR NOVAMENTE';
        }, 1000);
    } else {
        requestAnimationFrame(update);
    }
}