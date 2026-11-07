const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loadingScreen');
const startScreen = document.getElementById('startScreen');

// Configuração da Grade de Blocos (10 colunas x 20 linhas)
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

// Dificuldade
const INITIAL_SPEED = 14;          // 1 linha descida a cada N frames (menor = mais rápido)
const FINE_CONTROL_LEVEL = 8;      // nível em que o controle lateral fica fino
const NORMAL_LATERAL_STEP = 3;     // deslocamento lateral antes do nível 8
const FINE_LATERAL_STEP = 1;       // deslocamento lateral a partir do nível 8

// Recorde persistente (mesmo esquema do jogo do dinossauro do Chrome)
const HIGH_SCORE_KEY = 'brickRaceHighScore';

function loadHighScore() {
    try {
        const stored = parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10);
        return Number.isFinite(stored) && stored > 0 ? stored : 0;
    } catch (e) {
        return 0; // localStorage indisponível: joga sem recorde persistente
    }
}

function saveHighScore(value) {
    try {
        localStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch (e) {}
}

// Estados do Jogo
let gameState = 'LOADING'; 
let playerX = 4; 
let score = 0;
let highScore = loadHighScore();
let level = 1;
let obstacles = [];
let frameCount = 0;
let speed = INITIAL_SPEED; 
let crashAnimationTimer = 0;
let level8TransitionTriggered = false;
let speedPhaseStartScore = null;   // pontuação em que a 2ª rampa de velocidade começou
let startPending = false;          // evita iniciar duas partidas com clique/Enter repetido

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

// Fonte bitmap 5x7 usada apenas no logo da tela inicial.
// Cada string é uma linha; '1' acende a célula do LCD.
const TITLE_FONT = {
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111']
};

const TITLE_BLOCK = 5; // tamanho de cada "pixel" do logo no canvas

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
        drawTitleLogo();
        updateScoreDisplay();
        
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
            // Pitch acompanha a velocidade real (e não o nível), então volta
            // ao tom grave quando a 2ª rampa reinicia.
            let baseFreq = 55 + (INITIAL_SPEED - speed) * 8;
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
    // Só inicia a partir do menu e nunca duas vezes ao mesmo tempo.
    if (startPending || gameState !== 'START') return;
    startPending = true;

    playMenuMelody(); 
    setTimeout(() => {
        startPending = false;
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
    speed = INITIAL_SPEED; 
    playerX = 4; 
    obstacles = [];
    frameCount = 0;
    crashAnimationTimer = 0;
    level8TransitionTriggered = false;
    speedPhaseStartScore = null;
    updateScoreDisplay();
}

function updateScoreDisplay() {
    const scoreEl = document.getElementById('scoreDisplay');
    if (scoreEl) scoreEl.innerText = String(score).padStart(6, '0');

    const hiEl = document.getElementById('highScoreDisplay');
    if (hiEl) hiEl.innerText = String(highScore).padStart(6, '0');
}

// Tabela única de velocidade: usada na 1ª volta (score absoluto)
// e na 2ª volta (score relativo ao ponto de reset).
function getSpeedForScore(points) {
    if (points >= 900) return 3;
    if (points >= 600) return 4;
    if (points >= 450) return 5;
    if (points >= 320) return 6;
    if (points >= 200) return 8;
    if (points >= 100) return 10;
    if (points >= 40) return 12;
    return INITIAL_SPEED;
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

// Desenha o logo "BRICK RACE" em pixel art no canvas da tela inicial,
// usando a mesma linguagem de blocos do LCD (quadradinhos com 1px de respiro).
function drawTitleLogo() {
    const logoCanvas = document.getElementById('titleLogo');
    if (!logoCanvas) return;

    const g = logoCanvas.getContext('2d');
    if (!g) return;

    g.clearRect(0, 0, logoCanvas.width, logoCanvas.height);

    const cell = TITLE_BLOCK;
    const gap = cell;
    const glyphWidth = 5 * cell;

    function drawWord(word, top) {
        const wordWidth = word.length * glyphWidth + (word.length - 1) * gap;
        let x = Math.floor((logoCanvas.width - wordWidth) / 2);

        for (const letter of word) {
            const glyph = TITLE_FONT[letter];
            if (!glyph) {
                x += glyphWidth + gap;
                continue;
            }

            for (let row = 0; row < glyph.length; row++) {
                for (let col = 0; col < 5; col++) {
                    if (glyph[row][col] !== '1') continue;
                    g.fillStyle = '#1e2612';
                    g.fillRect(x + col * cell, top + row * cell, cell - 1, cell - 1);
                }
            }

            x += glyphWidth + gap;
        }
    }

    // Duas linhas, no mesmo esquema de grade do jogo.
    drawWord('BRICK', 6);
    drawWord('RACE', 6 + 7 * cell + cell);
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
// A partir do nível 8 o carro anda de 1 em 1 coluna (controle fino).
function getLateralStep() {
    return (level >= FINE_CONTROL_LEVEL) ? FINE_LATERAL_STEP : NORMAL_LATERAL_STEP;
}

function moverEsquerda() {
    if (gameState !== 'PLAYING') return;
    const minX = 1;
    playerX = Math.max(minX, playerX - getLateralStep());
}

function moverDireita() {
    if (gameState !== 'PLAYING') return;
    const maxX = 7;
    playerX = Math.min(maxX, playerX + getLateralStep());
}

// --- PAUSE / RETOMADA (compartilhado entre teclado e botão) ---
function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        if (motorGain && audioCtx) motorGain.gain.setValueAtTime(0, audioCtx.currentTime);
        drawPauseOverlay();
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        if (motorGain && audioCtx) motorGain.gain.setValueAtTime(0.025, audioCtx.currentTime);
        update();
    }
}

function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(30, 38, 18, 0.85)';
    ctx.fillRect(20, 150, 160, 60);

    ctx.strokeStyle = '#8b956d';
    ctx.strokeRect(22, 152, 156, 56);

    ctx.fillStyle = '#8b956d';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText("PAUSE", 72, 175);

    ctx.font = '9px Courier New';
    ctx.fillText("P OU PAUSE P/ VOLTAR", 32, 195);
}

// --- CONTROLE POR TECLADO ---
document.addEventListener('keydown', (e) => {
    // Enter/Espaço iniciam a partida no menu (como o START do SNES).
    if (gameState === 'START' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startGame();
        return;
    }

    if (e.key === 'p' || e.key === 'P') {
        togglePause();
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
    const btnPause = document.getElementById('btnPause');

    if (btnLeft) {
        btnLeft.addEventListener('click', moverEsquerda);
        btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); moverEsquerda(); });
    }

    if (btnRight) {
        btnRight.addEventListener('click', moverDireita);
        btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); moverDireita(); });
    }

    if (btnPause) {
        btnPause.addEventListener('click', togglePause);
        btnPause.addEventListener('touchstart', (e) => { e.preventDefault(); togglePause(); });
    }
});

function update() {
    if (gameState === 'GAMEOVER' || gameState === 'PAUSED') return;

    frameCount++;

    if (gameState === 'PLAYING') {
        // Nível define a frequência/agressividade dos obstáculos.
        if (score >= 900) {
            level = 9;
        } else if (score >= 750) {
            level = 8;
        } else if (score >= 600) {
            level = 7;
        } else if (score >= 450) {
            level = 6;
        } else if (score >= 320) {
            level = 5;
        } else if (score >= 200) {
            level = 4;
        } else if (score >= 100) {
            level = 3;
        } else if (score >= 40) {
            level = 2;
        } else {
            level = 1;
        }

        // Entrada no nível de controle fino: limpa a pista e inicia a 2ª rampa
        // de velocidade do zero, sem perder o passo lateral detalhado.
        if (level >= FINE_CONTROL_LEVEL && !level8TransitionTriggered) {
            level8TransitionTriggered = true;
            speedPhaseStartScore = score;
            obstacles = [];
            frameCount += 30;
        }

        // 1ª volta: score absoluto. 2ª volta: score relativo ao reset.
        if (speedPhaseStartScore !== null) {
            speed = getSpeedForScore(score - speedPhaseStartScore);
        } else {
            speed = getSpeedForScore(score);
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
    }

    // Recorde ao vivo: assim que a pontuação supera o HI, ele já é atualizado
    // (e persistido) sem esperar o game over.
    if (score > highScore) {
        highScore = score;
        saveHighScore(highScore);
    }
    updateScoreDisplay();

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
            gameState = 'START';
            if (startScreen) startScreen.style.display = 'flex';
            const startBtn = document.getElementById('startButton');
            if (startBtn) startBtn.innerText = 'JOGAR NOVAMENTE';
        }, 1000);
    } else {
        requestAnimationFrame(update);
    }
}