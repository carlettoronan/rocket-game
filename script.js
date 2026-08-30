const board = document.getElementById('game-board');
const startScreen = document.getElementById('start-screen');
const btnStart = document.getElementById('btn-start');
const rocket = document.getElementById('rocket');
const obstaclesContainer = document.getElementById('obstacles-container');

let jogoRodando = false;
let posicaoX = board.offsetWidth / 2; 
let obstaculos = [];

// Rastreamento das teclas (Esquerda e Direita)
const teclas = {};
window.addEventListener('keydown', (e) => teclas[e.key] = true);
window.addEventListener('keyup', (e) => teclas[e.key] = false);

btnStart.addEventListener('click', iniciarJogo);

function iniciarJogo() {
    startScreen.style.display = 'none';
    rocket.style.display = 'block';
    jogoRodando = true;
    
    // Inicia Fase 1 (Transição do CSS)
    board.className = 'fase-nuvens';
    
    // Inicia o Game Loop (movimento contínuo 60 frames por segundo)
    requestAnimationFrame(gameLoop);
    
    // Configura os temporizadores para troca de fases (em milissegundos)
    setTimeout(() => board.className = 'fase-atmosfera', 30000); // 30s
    setTimeout(() => board.className = 'fase-transicao', 60000); // 60s
    setTimeout(() => board.className = 'fase-espaco', 65000);    // 65s
    setTimeout(() => {
        jogoRodando = false;
        board.className = 'fase-lua';
        rocket.style.bottom = '150px'; // Simula o pouso
        alert("Pouso concluído com sucesso!");
    }, 95000); // 95s

    // Cria um novo obstáculo a cada 1 segundo
    setInterval(gerarObstaculo, 1000);
}

function gerarObstaculo() {
    if (!jogoRodando) return;
    
    // Durante transição e pouso, não gera obstáculos
    if (board.className === 'fase-transicao' || board.className === 'fase-lua') return;

    const obs = document.createElement('div');
    obs.classList.add('obstacle');
    
    // Posição horizontal aleatória
    const randomX = Math.random() * (board.offsetWidth - 40);
    obs.style.left = `${randomX}px`;
    obs.style.top = '-50px'; // Nasce fora da tela (em cima)
    
    obstaclesContainer.appendChild(obs);
    obstaculos.push(obs);
}

function gameLoop() {
    if (!jogoRodando) return;

    // 1. Atualiza Posição da Nave
    // Verifica limites laterais para não sair da tela
    if (teclas['ArrowLeft'] && posicaoX > 30) posicaoX -= 6;
    if (teclas['ArrowRight'] && posicaoX < board.offsetWidth - 30) posicaoX += 6;
    
    // Atualiza o CSS (o -30 compensa a metade da largura da nave)
    rocket.style.left = `${posicaoX}px`;
    rocket.style.transform = 'translateX(-50%)';

    // 2. Atualiza Posição dos Obstáculos e Checa Colisão
    const naveRetangulo = rocket.getBoundingClientRect();

    for (let i = obstaculos.length - 1; i >= 0; i--) {
        const obs = obstaculos[i];
        let obsTop = parseFloat(obs.style.top);
        
        // Velocidade de queda
        obsTop += 7; 
        obs.style.top = `${obsTop}px`;

        const obsRetangulo = obs.getBoundingClientRect();

        // Checagem de interseção (Hitbox)
        if (
            naveRetangulo.left < obsRetangulo.right &&
            naveRetangulo.right > obsRetangulo.left &&
            naveRetangulo.top < obsRetangulo.bottom &&
            naveRetangulo.bottom > obsRetangulo.top
        ) {
            jogoRodando = false;
            alert("Sua nave sofreu danos críticos! Fim de jogo.");
            location.reload(); // Reinicia a página
        }

        // Se saiu da tela por baixo, limpa a memória (Garbage Collection visual)
        if (obsTop > window.innerHeight) {
            obs.remove();
            obstaculos.splice(i, 1);
        }
    }

    // Chama o próximo frame
    requestAnimationFrame(gameLoop);
}