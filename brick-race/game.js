const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loadingScreen');
const startScreen = document.getElementById('startScreen');

// Configuração da Grade de Blocos (10 colunas x 20 linhas)
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

// Estados do Jogo
let gameState = 'LOADING'; 
let playerX = 4; 
let score = 0;
let level = 1;
let obstacles = [];
let frameCount = 0;
let speed = 14; 
let crashAnimationTimer = 0;
let level8TransitionTriggered = false;

let audioCtx = null;
let motorOscillator = null;
let motorGain = null;

const obstacleCols = [1, 4, 7];

const carShape = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
    [1, 0, 1]
];

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// --- SIMULAÇÃO DE BOOT DA BIG JEFF GAMES ---
window.addEventListener('load', () => {
    try {
        drawGrid();
        
        let progress = 0;
        const bar = document.getElementById('loadingBar');
        
        const loadingInterval = setInterval(() => {
            progress += 5;
            if (bar) bar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    if (loadingScreen) loadingScreen.style.display = 'none';
                    if (startScreen) startScreen.style.display = 'flex';
                    gameState = 'START';
                }, 200);
            }
        }, 25);
    } catch (e) {}
});

// --- MELODIA DO MENU ---
function playMenuMelody() {
    try {
        const ctxAudio = getAudioContext();
        const melody = [
            { freq: 330, dur: 150 }, { freq: 330, dur: 150 }, { freq: 330, dur: 300 },
            { freq: 330, dur: 150 }, { freq: 330, dur: 150 }, { freq: 330, dur: 300 },
            { freq: 330, dur: 150 }, { freq: 392, dur: 150 }, { freq: 261.63, dur: 150 }, { freq: 293.66, dur: 150 }, { freq: 330, dur: 600 }
        ];

        let delay = 0;
        melody.forEach((note) => {
            setTimeout(() => {
                if (gameState !== 'START') return;
                const osc = ctxAudio.createOscillator();
                const gain = ctxAudio.createGain();
                osc.type = 'square';
                osc.frequency.value = note.freq;
                gain.gain.setValueAtTime(0.08, ctxAudio.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + (note.dur / 1000));
                osc.connect(gain);
                gain.connect(ctxAudio.destination);
                osc.start();
                osc.stop(ctxAudio.currentTime + (note.dur / 1000));
            }, delay);
            delay += note.dur + 50;
        });
    } catch (e) {}
}

// --- MOTOR CONTÍNUO ---
function startMotorSound() {
    try {
        const ctxAudio = getAudioContext();
        if (motorOscillator) stopMotorSound();

        motorOscillator = ctxAudio.createOscillator();
        motorGain = ctxAudio.createGain();

        motorOscillator.type = 'sawtooth';
        motorOscillator.frequency.setValueAtTime(55, ctxAudio.currentTime);
        motorGain.gain.setValueAtTime(0.025, ctxAudio.currentTime);

        motorOscillator.connect(motorGain);
        motorGain.connect(ctxAudio.destination);
        motorOscillator.start();
    } catch (e) {}
}

function updateMotorPitch() {
    if (motorOscillator && audioCtx && audioCtx.state === 'running') {
        try {
            let baseFreq = 55 + (level * 8);
            motorOscillator.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
        } catch (e) {}
    }
}

function stopMotorSound() {
    try {
        if (motorOscillator) {
            motorOscillator.stop();
            motorOscillator.disconnect();
            motorOscillator = null;
        }
    } catch (e) {}
}

// --- BIP DE ULTRAPASSAGEM ---
function playPassSound() {
    try {
        const ctxAudio = getAudioContext();
        const osc = ctxAudio.createOscillator();
        const gain = ctxAudio.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctxAudio.currentTime);
        gain.gain.setValueAtTime(0.03, ctxAudio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctxAudio.destination);
        osc.start();
        osc.stop(ctxAudio.currentTime + 0.05);
    } catch (e) {}
}

// --- EXPLOSÃO ---
function playExplosionSound() {
    stopMotorSound(); 
    try {
        const ctxAudio = getAudioContext();
        const osc = ctxAudio.createOscillator();
        const gain = ctxAudio.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctxAudio.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctxAudio.currentTime + 0.25);

        gain.gain.setValueAtTime(0.1, ctxAudio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(ctxAudio.destination);

        osc.start();
        osc.stop(ctxAudio.currentTime + 0.25);
    } catch (e) {}
}

function startGame() {
    playMenuMelody(); 
    setTimeout(() => {
        gameState = 'PLAYING';
        if (startScreen) startScreen.style.display = 'none';
        resetGame();
        startMotorSound();
        update();
    }, 1200);
}

function resetGame() {
    score = 0;
    level = 1;
    speed = 14; 
    playerX = 4; 
    obstacles = [];
    frameCount = 0;
    crashAnimationTimer = 0;
    level8TransitionTriggered = false;
    const scoreEl = document.getElementById('scoreDisplay');
    if (scoreEl) scoreEl.innerText = '000000';
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
    if (!ctx) return;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawBlock(c, r, false);
        }
    }
    
    let faixaVelocidade = Math.max(1, Math.floor(speed / 2));
    for (let r = 0; r < ROWS; r++) {
        if ((r + Math.floor(frameCount / faixaVelocidade)) % 4 < 2) {
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
                const targetCol = colStart + c;
                if (targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
                    drawBlock(targetCol, targetRow, true);
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

// --- FUNÇÃO DE MOVIMENTO LATERAL COMPARTILHADA ---
function moverEsquerda() {
    if (gameState !== 'PLAYING') return;
    const minX = 1;
    let passo = (level >= 8) ? 2 : 3;
    playerX = Math.max(minX, playerX - passo);
}

function moverDireita() {
    if (gameState !== 'PLAYING') return;
    const maxX = 7;
    let passo = (level >= 8) ? 2 : 3;
    playerX = Math.min(maxX, playerX + passo);
}

// --- CONTROLE POR TECLADO ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            if (motorGain && audioCtx) motorGain.gain.setValueAtTime(0, audioCtx.currentTime);
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            if (motorGain && audioCtx) motorGain.gain.setValueAtTime(0.025, audioCtx.currentTime);
            update();
        }
        return;
    }

    if (e.key === 'ArrowLeft') {
        moverEsquerda();
    } else if (e.key === 'ArrowRight') {
        moverDireita();
    }
});

// --- VÍNCULO DOS BOTÕES DA TELA ---
window.addEventListener('DOMContentLoaded', () => {
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');

    if (btnLeft) {
        btnLeft.addEventListener('click', moverEsquerda);
        btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); moverEsquerda(); });
    }

    if (btnRight) {
        btnRight.addEventListener('click', moverDireita);
        btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); moverDireita(); });
    }
});

function update() {
    if (gameState === 'GAMEOVER' || gameState === 'PAUSED') return;

    frameCount++;

    if (gameState === 'PLAYING') {
        let previousLevel = level;

        if (score >= 900) {
            level = 9;
            speed = 3;  
        } else if (score >= 750) {
            level = 8;
            speed = 4;  
        } else if (score >= 600) {
            level = 7;
            speed = 4;  
        } else if (score >= 450) {
            level = 6;
            speed = 5;  
        } else if (score >= 320) {
            level = 5;
            speed = 6;
        } else if (score >= 200) {
            level = 4;
            speed = 8;
        } else if (score >= 100) {
            level = 3;
            speed = 10;
        } else if (score >= 40) {
            level = 2;
            speed = 12;
        } else {
            level = 1;
            speed = 14; 
        }

        if (level === 8 && previousLevel < 8 && !level8TransitionTriggered) {
            level8TransitionTriggered = true;
            obstacles = [];
            frameCount += 30;
        }

        updateMotorPitch();

        let freqObstaculo = Math.max(32, 80 - (level * 5));
        if (frameCount % freqObstaculo === 0) {
            const randomTrackIndex = Math.floor(Math.random() * 3);
            const chosenCol = obstacleCols[randomTrackIndex];
            const ultimoObstaculo = obstacles[obstacles.length - 1];
            
            let distanciaMinima = 5; 
            
            if (!ultimoObstaculo || ultimoObstaculo.row > distanciaMinima) {
                obstacles.push({ col: chosenCol, row: -4 });
                
                let chanceDuplo = 0.2 + (level * 0.03);
                if (Math.random() < chanceDuplo) {
                    let segundaPistaIndex;
                    do {
                        segundaPistaIndex = Math.floor(Math.random() * 3);
                    } while (segundaPistaIndex === randomTrackIndex);
                    
                    obstacles.push({ col: obstacleCols[segundaPistaIndex], row: -4 });
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
                playPassSound();
            }
        }

        const playerRow = 16;

        for (let obs of obstacles) {
            const playerLeft = playerX;
            const playerRight = playerX + 2;
            const obsLeft = obs.col;
            const obsRight = obs.col + 2;

            const overlapX = playerLeft <= obsRight && obsLeft <= playerRight;
            const overlapY = Math.abs(playerRow - obs.row) < 4;

            if (overlapX && overlapY) {
                gameState = 'CRASHED';
                crashAnimationTimer = 0;
                playExplosionSound();
            }
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    const playerRow = 16;

    for (let obs of obstacles) {
        drawCar(obs.col, obs.row);
    }

    if (gameState === 'CRASHED') {
        crashAnimationTimer++;
        drawExplosion(playerX, playerRow);

        if (crashAnimationTimer > 25) {
            gameState = 'GAMEOVER';
        }
    } else if (gameState === 'PLAYING') {
        drawCar(playerX, playerRow);
    } else if (gameState === 'PAUSED') {
        ctx.fillStyle = 'rgba(30, 38, 18, 0.85)';
        ctx.fillRect(20, 150, 160, 60);
        
        ctx.strokeStyle = '#8b956d';
        ctx.strokeRect(22, 152, 156, 56);

        ctx.fillStyle = '#8b956d';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText("PAUSE", 72, 175);
        
        ctx.font = '9px Courier New';
        ctx.fillText("APERTE P PARA VOLTAR", 32, 195);
    }

    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) scoreDisplay.innerText = String(score).padStart(6, '0');

    if (gameState === 'GAMEOVER') {
        stopMotorSound();

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
            if (startScreen) startScreen.style.display = 'flex';
            const startBtn = document.getElementById('startButton');
            if (startBtn) startBtn.innerText = 'JOGAR NOVAMENTE';
        }, 1000);
    } else {
        requestAnimationFrame(update);
    }
}