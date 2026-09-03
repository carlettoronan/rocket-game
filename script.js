const board = document.getElementById('game-board');
const startScreen = document.getElementById('start-screen');
const btnStart = document.getElementById('btn-start');
const rocket = document.getElementById('rocket');
const obstaclesContainer = document.getElementById('obstacles-container');
const scoreValue = document.getElementById('score-value');
const score = document.getElementById('score');

const gameOverScreen = document.getElementById('game-over-screen');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMessage = document.getElementById('game-over-message');
const finalScore = document.getElementById('final-score');
const btnRestart = document.getElementById('btn-restart');

const musica = document.getElementById('musica');
const somFoguete = document.getElementById('som-foguete');


btnStart.addEventListener('click', iniciarJogo);
btnRestart.addEventListener('click', iniciarJogo);

// =============================
// ESTADO DO JOGO
// =============================
let jogoRodando = false;
let arrastando = false;
let posicaoX = board.offsetWidth / 2;
let obstaculos = [];

let pontuacao = 0;
let velocidadeQueda = 3;
let intervaloSpawn = 1000;

let spawnTimer = null;
let timers = [];
let animationId = null;

// Controle da fase espacial
let inicioEspaco = 0;
let estrelaAtiva = false;

// =============================
// CONTROLE DAS TECLAS
// =============================
const teclas = {};

window.addEventListener('keydown', (e) => {
    teclas[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    teclas[e.key] = false;
});

rocket.addEventListener('pointerdown', (e) => {
    if (!jogoRodando) return;
    arrastando = true;
    rocket.setPointerCapture(e.pointerId);
    e.preventDefault();
});

rocket.addEventListener('pointermove', (e) => {
    if (!arrastando || !jogoRodando) return;
    const rect = board.getBoundingClientRect();
    let novaPosicaoX = e.clientX - rect.left;
    novaPosicaoX = Math.max(30, novaPosicaoX);
    novaPosicaoX = Math.min(board.offsetWidth - 30, novaPosicaoX);
    posicaoX = novaPosicaoX;
});

rocket.addEventListener('pointerup', (e) => {
    arrastando = false;
    rocket.releasePointerCapture(e.pointerId);
});

rocket.addEventListener('pointercancel', () => {
    arrastando = false;
});


// =============================
// INICIAR JOGO
// =============================
function iniciarJogo() {

    if (animationId) cancelAnimationFrame(animationId);

    somFoguete.pause();
    somFoguete.currentTime = 0;

    musica.pause();
    musica.currentTime = 0;
    tocarMusica();

    // Cancela qualquer partida anterior
    limparTimers();
    clearTimeout(spawnTimer);
    spawnTimer = null;

    // Limpa qualquer obstáculo
    limparObstaculos();

    // Reset do jogo
    jogoRodando = true;
    pontuacao = 0;
    velocidadeQueda = 3;
    intervaloSpawn = 1000;
    inicioEspaco = 0;
    estrelaAtiva = false;

    // Reset do foguete
    posicaoX = board.offsetWidth / 2;
    rocket.classList.remove('saindo-terra');
    rocket.classList.remove('pousando');
    rocket.style.display = 'block';
    rocket.style.left = `${posicaoX}px`;
    rocket.style.bottom = '30px';
    rocket.style.transform = 'translateX(-50%) scale(1)';

    // Reset das telas
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    score.style.display = 'block';
    scoreValue.textContent = '0';

    // Truque de recarregamento CSS
    board.className = '';
    void board.offsetWidth;

    // =============================
    // FASE 1 - NUVENS
    // =============================
    board.className = 'fase-nuvens';

    gameLoop();
    iniciarSpawn();

    // =============================
    // FASE 2 - ATMOSFERA
    // Aos 15 segundos: Crossfade das imagens sem interromper a subida!
    // =============================
    timers.push(setTimeout(() => {
        if (!jogoRodando) return;
        board.className = 'fase-atmosfera';
    }, 15000));

    // =============================
    // FASE 3 - TRANSIÇÃO
    // Aos 30 segundos
    // =============================
    timers.push(setTimeout(() => {
        if (!jogoRodando) return;
        clearTimeout(spawnTimer);
        spawnTimer = null;
        limparObstaculos();
        jogoRodando = false;
        pausarMusica();
        tocarFoguete();

        // Tirar a classe "subida-continua" para a transição
        board.className = 'fase-transicao';
        rocket.classList.add('saindo-terra');
    }, 30000));

    // =============================
    // FASE 4 - ESPAÇO
    // Aos 37 segundos
    // =============================
    timers.push(setTimeout(() => {
        if (gameOverScreen.style.display === 'block') return;

        tocarMusica();

        board.className = 'fase-espaco';

        rocket.classList.remove('saindo-terra');
        rocket.classList.remove('pousando');

        rocket.style.display = 'block';
        rocket.style.bottom = '30px';
        rocket.style.left = `${posicaoX}px`;
        rocket.style.transform = 'translateX(-50%) scale(1)';

        jogoRodando = true;
        inicioEspaco = Date.now();

        gameLoop();

        iniciarSpawn();

    }, 37000));
}

// =============================
// GERADOR DE OBSTÁCULOS
// =============================
function iniciarSpawn() {
    if (!jogoRodando) return;
    gerarObstaculo();
    spawnTimer = setTimeout(() => {
        iniciarSpawn();
    }, intervaloSpawn);
}

function gerarObstaculo() {
    if (!jogoRodando) return;

    const obs = document.createElement('div');
    obs.classList.add('obstacle');

    let imagensPossiveis = [];
    let imagemSorteada = '';

    if (board.classList.contains('fase-nuvens')) {
        imagensPossiveis = [
            "images/passaro.gif",
            "images/drone.gif"
        ];
        imagemSorteada = imagensPossiveis[Math.floor(Math.random() * imagensPossiveis.length)];
    } else if (board.classList.contains('fase-atmosfera')) {
        imagensPossiveis = [
            "images/balao.gif",
            "images/satelite.gif"
        ];
        imagemSorteada = imagensPossiveis[Math.floor(Math.random() * imagensPossiveis.length)];
    } else if (board.classList.contains('fase-espaco')) {
        const chance = chanceEstrela();
        if (!estrelaAtiva && Math.random() * 100 < chance) {
            imagemSorteada = "images/estrela.png";
            obs.classList.add('estrela');
            estrelaAtiva = true;
        } else {
            imagensPossiveis = [
                "images/asteroide1.png",
                "images/asteroide2.png"
            ];
            imagemSorteada = imagensPossiveis[Math.floor(Math.random() * imagensPossiveis.length)];
        }
    }

    if (!imagemSorteada) return;

    obs.style.backgroundImage = `url('${imagemSorteada}')`;

    if (imagemSorteada.includes('balao') || imagemSorteada.includes('satelite')) {
        obs.style.width = '140px';
        obs.style.height = '140px';
    } else if (imagemSorteada.includes('estrela')) {
        obs.style.width = '70px';
        obs.style.height = '70px';
    }

    if (imagemSorteada.includes('passaro')) {
        obs.style.transform = 'rotate(90deg)';
    } else if (imagemSorteada.includes('asteroide')) {
        const escala = 1.5 + Math.random() * 1.5;
        obs.style.setProperty('--escala', escala);
        const velocidadeRotacao = 2 + Math.random() * 4;
        obs.style.animation = `girarAsteroide ${velocidadeRotacao}s linear infinite`;
    } else if (imagemSorteada.includes('estrela')) {
        obs.style.animation = 'girarEstrela 3s linear infinite';
    }

    const larguraObs = parseInt(obs.style.width) || 40;
    const randomX = Math.random() * (board.offsetWidth - larguraObs);

    obs.style.left = `${Math.max(0, randomX)}px`;
    obs.style.top = '-100px';

    obstaclesContainer.appendChild(obs);
    obstaculos.push(obs);
}

// =============================
// GAME LOOP E COLISÃO
// =============================
function gameLoop() {
    if (!jogoRodando) return;

    pontuacao += 0.05;
    scoreValue.textContent = Math.floor(pontuacao);

    if (teclas['ArrowLeft'] && posicaoX > 30) {
        posicaoX -= 6;
    }
    if (teclas['ArrowRight'] && posicaoX < board.offsetWidth - 30) {
        posicaoX += 6;
    }

    rocket.style.left = `${posicaoX}px`;

    const naveRetangulo = rocket.getBoundingClientRect();

    for (let i = obstaculos.length - 1; i >= 0; i--) {
        const obs = obstaculos[i];
        let obsTop = parseFloat(obs.style.top);

        obsTop += velocidadeQueda;
        obs.style.top = `${obsTop}px`;

        const obsRetangulo = obterHitbox(obs);

        if (
            naveRetangulo.left < obsRetangulo.right &&
            naveRetangulo.right > obsRetangulo.left &&
            naveRetangulo.top < obsRetangulo.bottom &&
            naveRetangulo.bottom > obsRetangulo.top
        ) {
            if (obs.classList.contains('estrela')) {
                concluirMissao();
                return;
            }
            encerrarJogo(false);
            return;
        }

        if (obsTop > board.offsetHeight) {
            if (obs.classList.contains('estrela')) {
                estrelaAtiva = false;
                aumentarDificuldade();
            }
            obs.remove();
            obstaculos.splice(i, 1);
        }
    }

    animationId = requestAnimationFrame(gameLoop);
}

// =============================
// MATEMÁTICA E LÓGICA
// =============================
function chanceEstrela() {
    if (inicioEspaco === 0) return 0;
    const tempoEspaco = (Date.now() - inicioEspaco) / 1000;
    if (tempoEspaco < 10) return 0;
    const etapas = Math.floor((tempoEspaco - 10) / 5);
    return Math.min(4 + (etapas * 2), 12);
}

function limparObstaculos() {
    obstaculos.forEach(obs => obs.remove());
    obstaculos = [];
    obstaclesContainer.innerHTML = '';
}

function obterHitbox(obs) {
    const retangulo = obs.getBoundingClientRect();
    const tamanho = 40;
    return {
        left: retangulo.left + (retangulo.width - tamanho) / 2,
        right: retangulo.left + (retangulo.width + tamanho) / 2,
        top: retangulo.top + (retangulo.height - tamanho) / 2,
        bottom: retangulo.top + (retangulo.height + tamanho) / 2
    };
}

function aumentarDificuldade() {
    velocidadeQueda += 0.5;
    intervaloSpawn = Math.max(300, intervaloSpawn - 150);
}

// =============================
// FINALIZADORES
// =============================
function limparTimers() {
    timers.forEach(timer => clearTimeout(timer));
    timers = [];
}

function encerrarJogo(vitoria) {
    jogoRodando = false;
    limparTimers();
    clearTimeout(spawnTimer);
    spawnTimer = null;
    limparObstaculos();

    finalScore.textContent = Math.floor(pontuacao);

    if (vitoria) {
        gameOverTitle.textContent = "Missão Concluída!";
        gameOverMessage.textContent = "Você capturou a estrela e chegou à Lua!";
        board.className = 'fase-lua';
        rocket.classList.remove('saindo-terra');
        rocket.classList.add('pousando');
    } else {
        gameOverTitle.textContent = "Fim de jogo";
        gameOverMessage.textContent = "Sua nave sofreu danos críticos.";
        rocket.classList.remove('saindo-terra', 'pousando');
    }
    gameOverScreen.style.display = 'block';
}

function concluirMissao() {
    pausarMusica();
    tocarFoguete();
    encerrarJogo(true);
}

function pausarMusica() {
    musica.pause();
}

function tocarMusica() {
    musica.play().catch(() => { });
}

function tocarFoguete() {
    somFoguete.currentTime = 0;
    somFoguete.play().catch(() => { });
}