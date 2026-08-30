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

    // Inicia Fase 1 
    board.className = 'fase-nuvens';
    requestAnimationFrame(gameLoop);

    // --- LINHA DO TEMPO DO JOGO ---

    // Fase 2: Atmosfera (Aos 5 segundos)
    setTimeout(() => {
        if (jogoRodando) board.className = 'fase-atmosfera';
    }, 5000);

    // Fase 3: Transição Cinemática (Aos 10 segundos)
    setTimeout(() => {
        board.className = 'fase-transicao';
        limparObstaculos();
        jogoRodando = false; // Pausa a geração de obstáculos e teclado
        rocket.classList.add('saindo-terra'); // Animação CSS
    }, 10000);

    // Fase 4: Espaço (Aos 15/20 segundos)
    setTimeout(() => {
        board.className = 'fase-espaco';
        rocket.classList.remove('saindo-terra');
        rocket.style.bottom = '30px';
        rocket.style.transform = 'translateX(-50%)';

        jogoRodando = true;
    }, 20000);

    // Fase 5: Pouso Lunar (Aos 35 segundos)
    setTimeout(() => {
        board.className = 'fase-lua';
        limparObstaculos();
        jogoRodando = false; // Fim do gameplay
        rocket.classList.add('pousando'); // Nave desce encolhendo

        // Aguarda a animação do CSS terminar (4s) para exibir a mensagem e reiniciar
        setTimeout(() => {
            alert("Missão Concluída! Pouso na Lua realizado com sucesso.");
            location.reload();
        }, 4000);
    }, 35000); // Lembre-se de mudar para 95000 na versão final do jogo

    // O gerador de obstáculos roda a cada 1 segundo de forma independente
    setInterval(() => {
        gerarObstaculo();
    }, 1000);
}

function gerarObstaculo() {
    if (!jogoRodando) return; // Se for fase de transição ou lua, não cria nada

    const obs = document.createElement('div');
    obs.classList.add('obstacle');

    let imagensPossiveis = [];

    // Carrega o array de imagens dependendo de qual classe o board possui no momento
    if (board.classList.contains('fase-nuvens')) {
        imagensPossiveis = [
            "images/passaro.gif",
            "images/drone.gif"
        ];
    } else if (board.classList.contains('fase-atmosfera')) {
        imagensPossiveis = [
            "images/balao.gif",
            "images/satelite.gif"
        ];
    } else if (board.classList.contains('fase-espaco')) {
        imagensPossiveis = [
            "images/asteroide1.png",
            "images/asteroide2.png"
        ];
    }

    if (imagensPossiveis.length === 0) return;

    // Sorteia uma das imagens do array escolhido
    const imagemSorteada = imagensPossiveis[Math.floor(Math.random() * imagensPossiveis.length)];
    obs.style.backgroundImage = `url('${imagemSorteada}')`;

    if (
        imagemSorteada.includes('balao') ||
        imagemSorteada.includes('satelite')
    ) {
        obs.style.width = '140px';
        obs.style.height = '140px';
    }

    // --- LÓGICA DE TRANSFORMAÇÃO DE IMAGENS CORRIGIDA ---
    if (imagemSorteada.includes('passaro')) {
        // Apenas pássaros rotacionados
        obs.style.transform = 'rotate(90deg)';
    } else if (imagemSorteada.includes('asteroide')) {
        // Asteroides maiores
        const escala = 1.5 + Math.random() * 1.5;
        // Tamanho variável
        obs.style.transform = `scale(${escala})`;
        // Velocidade de rotação aleatória
        const velocidade = 2 + Math.random() * 4;
        obs.style.animation = `girarAsteroide ${velocidade}s linear infinite`;
    } else {
        // Drone, balão e satélite normais (agora dentro do encadeamento correto do if/else)
        obs.style.transform = 'none';
    }

    // Posição horizontal aleatória no topo da tela
    const randomX = Math.random() * (board.offsetWidth - 40);
    obs.style.left = `${randomX}px`;
    obs.style.top = '-50px';

    obstaclesContainer.appendChild(obs);
    obstaculos.push(obs);
}

function limparObstaculos() {
    obstaculos.forEach(obs => obs.remove());
    obstaculos = [];
    obstaclesContainer.innerHTML = '';
}

function gameLoop() {
    if (!jogoRodando) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // 1. Atualiza Posição da Nave baseado no teclado
    if (teclas['ArrowLeft'] && posicaoX > 30) posicaoX -= 6;
    if (teclas['ArrowRight'] && posicaoX < board.offsetWidth - 30) posicaoX += 6;

    rocket.style.left = `${posicaoX}px`;

    // 2. Sistema de Colisão e Gravidade dos obstáculos
    const naveRetangulo = rocket.getBoundingClientRect();

    for (let i = obstaculos.length - 1; i >= 0; i--) {
        const obs = obstaculos[i];
        let obsTop = parseFloat(obs.style.top);

        // Velocidade de queda
        obsTop += 3;
        obs.style.top = `${obsTop}px`;

        const obsRetangulo = obs.getBoundingClientRect();

        // Checagem de Hitbox
        if (
            naveRetangulo.left < obsRetangulo.right &&
            naveRetangulo.right > obsRetangulo.left &&
            naveRetangulo.top < obsRetangulo.bottom &&
            naveRetangulo.bottom > obsRetangulo.top
        ) {
            jogoRodando = false;
            alert("Sua nave sofreu danos críticos! Fim de jogo.");
            location.reload();
        }

        // Se o obstáculo saiu da tela por baixo, limpa da memória
        if (obsTop > window.innerHeight) {
            obs.remove();
            obstaculos.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}