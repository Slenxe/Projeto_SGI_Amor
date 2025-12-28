// tutorial.js

function startTutorial() {
    const intro = introJs();

    intro.setOptions({
        steps: [
            {
                intro: "🎉 Bem-vindo ao tutorial do Gira-Discos 3D!"
            },
            {
                element: document.querySelector('#meuCanvas'),
                intro: "👀 Visualize o seu gira-discos em diferentes perspetivas.",
            },
            {
                element: document.querySelector('.interface-handler'),
                intro: "⚙️ Aqui pode controlar animações e texturas.",
            },
            {
                element: document.querySelector('#btn-anim-1'),
                intro: "💿Rodar o disco. Também pode clicar na própria imagem.",
            },
            {
                element: document.querySelector('#btn-anim-2'),
                intro: "💿Parar de rodar o disco. Também pode clicar na própria imagem.",
            },
            {
                element: document.querySelector('#btn-anim-3'),
                intro: "📂 Abrir a tampa do gira-discos. Também pode clicar na própria imagem.",
            },
            {
                element: document.querySelector('#btn-anim-4'),
                intro: "🔒Fechar a tampa do gira-discos. Também pode clicar na própria imagem.",
            },
            {
                element: document.querySelector('#btn-anim-5'),
                intro: "✋ Posicionar o braço no gira-discos.",
            },
            {
                element: document.querySelector('#btn-anim-6'),
                intro: "✋ Remover o braço",
            },
            {
                element: document.querySelector('#material-menu-btn'),
                intro: "🎨Altere o material da base do gira-discos.",
            },
            {
                element: document.querySelector('#material-menu-tampa-btn'),
                intro: "🖌Altere o material da tampa do gira-discos.",
            },
            {
                element: document.querySelector('#fullscreen-btn'),
                intro: "🖥 Entre ou saia do modo de ecrã inteiro.",
            },
            {
                element: document.querySelector('#btn-close'),
                intro: "❌ Sair quando terminar.",
            },
            {
                element: document.querySelector('.menu-musica'),
                intro: "🎶 Aqui pode controlar a música.",
            },
            {
                element: document.querySelector('#btn-play'),
                intro: "▶Reproduza a música do disco.",
            },
            {
                element: document.querySelector('#btn-pause'),
                intro: "⏸Pause a música do disco.",
            },
            {
                element: document.querySelector('#btn-skip'),
                intro: "⏭ Próxima faixa.",
            },
            {
                element: document.querySelector('#btn-turn-off'),
                intro: "🔌 Desligue o gira-discos.",
            },
            {
                element: document.querySelector('#btn-volume-up'),
                intro: "🔊 Aumente o volume da música.",
            },
            {
                element: document.querySelector('#btn-volume-down'),
                intro: "🔉 Diminue o volume da música.",
            }
        ],
        showProgress: true,
        showBullets: true,
        nextLabel: 'Seguinte ➡',
        prevLabel: '⬅ Anterior',
        doneLabel: '✅ Terminar',
        tooltipClass: 'custom-tooltip',
        highlightClass: 'custom-highlight'
    });

    intro.start();
}

// Start the tutorial on page load
window.onload = function () {
    startTutorial();
};

// ======== FUNÇÃO PARA TORNAR ARRASTÁVEL ========
function tornarArrastavel(idDoModal) {
    const modal = document.getElementById(idDoModal);

    // Se o modal não existir (ex: erro no nome), sai da função
    if (!modal) return;

    const modalHeader = modal.querySelector('.modal-header');

    // Mudar o cursor para indicar que dá para mexer
    modalHeader.style.cursor = 'move';

    // 1. O evento de clicar e arrastar
    modalHeader.onmousedown = function (event) {

        // Importante: Ao começar a arrastar, mudamos para absolute
        // e removemos a margem para o rato controlar a posição livremente
        modal.style.position = 'absolute';
        modal.style.margin = '0';

        let shiftX = event.clientX - modal.getBoundingClientRect().left;
        let shiftY = event.clientY - modal.getBoundingClientRect().top;

        function moveAt(pageX, pageY) {
            modal.style.left = pageX - shiftX + 'px';
            modal.style.top = pageY - shiftY + 'px';
        }

        // Mover imediatamente para a posição do rato
        moveAt(event.pageX, event.pageY);

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        // Adiciona o evento de movimento
        document.addEventListener('mousemove', onMouseMove);

        // Quando largar o botão, remove os eventos
        document.onmouseup = function () {
            document.removeEventListener('mousemove', onMouseMove);
            modalHeader.onmouseup = null;
        };
    };

    modalHeader.ondragstart = function () {
        return false;
    };

    // 2. Resetar a posição quando o modal abre (para voltar ao centro)
    modal.addEventListener('show.bs.modal', function () {
        modal.style.left = '';
        modal.style.top = '';
        modal.style.position = '';
        modal.style.margin = '';
    });
}

// ======== APLICAR AOS DOIS MODAIS AQUI ========
tornarArrastavel('staticBackdrop'); // Menu Materiais
tornarArrastavel('tampaModal');     // Menu Texturas


// ======== Fechar ao clicar fora (Genérico para ambos) ========
window.onclick = function (event) {
    // Verifica se clicaste na parte escura (backdrop) de QUALQUER modal
    if (event.target.classList.contains('modal')) {
        const modalInstance = bootstrap.Modal.getInstance(event.target);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
};
