import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

//===============================================================================
//CENA E RENDERER

const cena = new THREE.Scene()
const canvas = document.getElementById('meuCanvas')

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true

//===============================================================================
//CÂMARA
const camara = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
)
camara.position.set(1, 1, 1)

camara.fov = 35; // antes era 70
camara.updateProjectionMatrix();

//===============================================================================
//CONTROLOS
const controlos = new OrbitControls(camara, renderer.domElement)
controlos.enableDamping = true

//===============================================================================
//LUZES
const luzPonto = new THREE.PointLight(0xffffff, 2)
luzPonto.position.set(3, 4, 0)
luzPonto.castShadow = true
cena.add(luzPonto)

const luzDisco = new THREE.PointLight(0xffffff, 3.5)
luzDisco.position.set(0, 2, 0)
cena.add(luzDisco)

cena.background = new THREE.Color(0xaaaaaa)

luzPonto.castShadow = true
luzPonto.shadow.mapSize.width = 1024
luzPonto.shadow.mapSize.height = 1024
luzPonto.shadow.radius = 4

//===============================================================================
//PLANO PARA TER CHÃO
renderer.shadowMap.type = THREE.PCFSoftShadowMap // adiciona sombras suaves

const plano = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.3 })
);
plano.rotation.x = -Math.PI / 2; // deitar plano horizontal
plano.position.y = 0;            // altura do plano
plano.receiveShadow = true;
cena.add(plano);

//===============================================================================
//VARIÁVEIS
let alvo = null
let mixer = null
let disco = null
let braco = null
let tampa = null
const acoes = {}
const clock = new THREE.Clock()

//===============================================================================
//CARREGAR MODELO
const loader = new GLTFLoader()

loader.load('models/RecordPlayer.gltf', (gltf) => {
    cena.add(gltf.scene)

    mixer = new THREE.AnimationMixer(gltf.scene)

    gltf.animations.forEach((clip) => {
        acoes[clip.name] = mixer.clipAction(clip)
    })

    gltf.scene.traverse((obj) => {
        if (obj.isMesh) {
            obj.castShadow = true
            obj.receiveShadow = true

            if (obj.name === "Pickup") {
                braco = obj;
            }

            if (obj.name === "Base") {
                alvo = obj
            }

            if (obj.name === "DustCover") {
                tampa = obj
            }

            if (obj.name === "VinylDisk") {
                disco = obj
            }

        }
    })
})

//===============================================================================
//LOOP DE ANIMAÇÃO
function animar() {
    requestAnimationFrame(animar)

    const delta = clock.getDelta()
    if (mixer) mixer.update(delta)

    controlos.update()
    renderer.render(cena, camara)
}
animar()

//===============================================================================
//RESIZE
window.addEventListener('resize', () => {
    camara.aspect = window.innerWidth / window.innerHeight
    camara.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

//===============================================================================
//FULLSCREEN
function fullscreen(){
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
    } else {
        document.exitFullscreen()
    }
}

document.getElementById("fullscreen-btn").onclick = () => fullscreen()

//===============================================================================
//FECHAR PÁGINA

function close(){
    window.location.href = "gira_discos.html"
}

document.getElementById("btn-close").onclick = () => close()

//===============================================================================
//TEXTURAS
const textureLoader = new THREE.TextureLoader()

const textures = {
    wood: textureLoader.load("files/texturas_base/texturaBase2.jpg"),
    metal: textureLoader.load("files/texturas_base/texturaBase3.jpg"),
    plastic: textureLoader.load("files/texturas_base/texturaBase1.jpg")
}

const textures_tampa = {
    rosa: textureLoader.load("files/texturas_tampa/textura4.jpg"),
    azul: textureLoader.load("files/texturas_tampa/textura5.jpg"),
    castanho: textureLoader.load("files/texturas_tampa/textura6.avif"),
    colorido1: textureLoader.load("files/texturas_tampa/textura1.jpg"),
    colorido2: textureLoader.load("files/texturas_tampa/textura2.jpg"),
    branco: textureLoader.load("files/texturas_tampa/textura3.avif"),
}

function aplicarTextura(mesh, textura) {
    if (!mesh) return

    playSoundEffectBotao()
    textura.colorSpace = THREE.SRGBColorSpace
    textura.flipY = false
    textura.wrapS = THREE.RepeatWrapping
    textura.wrapT = THREE.RepeatWrapping

    mesh.material = new THREE.MeshStandardMaterial({
        map: textura,
        metalness: 0.5,
        roughness: 0.7,
        side: THREE.DoubleSide
    })
}

function aplicarTexturaTampa(tampaMesh, textura) {
    if (!tampaMesh) return

    playSoundEffectBotao()

    textura.colorSpace = THREE.SRGBColorSpace
    textura.flipY = false
    textura.wrapS = THREE.RepeatWrapping
    textura.wrapT = THREE.RepeatWrapping

    tampaMesh.material = new THREE.MeshStandardMaterial({
        map: textura,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1
    });
}

function textureFinal(textura1, textura2) {
    aplicarTextura(alvo, textura1),
    aplicarTextura(tampa, textura2)
}

//===============================================================================
//BOTÕES DE MATERIAL
//TEXTURA DA BASE
document.getElementById("btn-wood").onclick = () => aplicarTextura(alvo, textures.wood)
document.getElementById("btn-metal").onclick = () => aplicarTextura(alvo, textures.metal)
document.getElementById("btn-cortica").onclick = () => aplicarTextura(alvo, textures.plastic)

//TEXTURA DA TAMPA
document.getElementById("btn-colorido1").onclick = () => aplicarTexturaTampa(tampa, textures_tampa.colorido1)
document.getElementById("btn-colorido2").onclick = () => aplicarTexturaTampa(tampa, textures_tampa.colorido2)
document.getElementById("btn-branco").onclick = () => aplicarTexturaTampa(tampa, textures_tampa.branco)
document.getElementById("btn-rosa").onclick = () => aplicarTexturaTampa(tampa, textures_tampa.rosa)
document.getElementById("btn-azul").onclick = () => aplicarTexturaTampa(tampa, textures_tampa.azul)
document.getElementById("btn-castanho").onclick = () => aplicarTexturaTampa(tampa, textures_tampa.castanho)

//===============================================================================
//CLICAR NA TAMPA E ABRIR OU FECHAR
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

function onMouseClick(event) {

    if (event.target !== canvas) return; // para que a tampa nn feche com o toque do rato

    if (estado.interacaoBloqueada) return //para que nao seja permitido mexer enquanto esta a tocar

    // Converter posição do rato para coordenadas normalizadas
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    // Criar o raio a partir da câmara
    raycaster.setFromCamera(mouse, camara)

    if (tampa) {
        const interTampa = raycaster.intersectObject(tampa, true)
        if (interTampa.length > 0) {
            if (estado.tampaFechada) {
                abrirTampa()
            } else {
                fecharTampa()
            }
        }
    }

    if (disco) {
        const interDisco = raycaster.intersectObject(disco, true)
        if (interDisco.length > 0) {
            if (estado.discoARodar) {
                pararDiscoSuavemente()
            } else {
                rodarDisco()
            }
        }
    }
}

//===============================================================================
//MUDAR O TIPO DE PONTEIRO DO RATO
window.addEventListener('mousemove', (event) => {


    if (estado.interacaoBloqueada) {//enquanto a musica esta a tocar
        document.body.style.cursor = 'not-allowed'
        return
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camara)

    let interativo = false

    //mudar o tipo de ponteiro na tampa e no disco
    if (tampa && raycaster.intersectObject(tampa, true).length > 0) {
        interativo = true
    }

    if (disco && raycaster.intersectObject(disco, true).length > 0) {
        interativo = true
    }

    document.body.style.cursor =
        interativo ? 'pointer' : 'default'
})
window.addEventListener('click', onMouseClick)


//===============================================================================
//TECLAS DE ATALHO
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case "1": // numero 1
            rodarDisco()
            break;
        case "2": // numero 2
            pararRodarDisco()
            break;
        case "3": // numero 3
            abrirTampa()
            break;
        case "4": // numero 4
            fecharTampa()
            break;
        case "5": // numero 5
            colocarBraco()
            break;
        case "6": // numero 6
            retirarBraco()
            break;
        case "n":
            skipMusica()
            break;
        case "p":
            prepararMusica()
            break;
        case "s":
            removerPreparacaoMusica()
            break;
        case "Enter":
            desligarGiraDiscos()
            break;
        case "f": // espaço
            fullscreen()
            break;
        case "q": //letra q
            close()
            break;
         case "ArrowUp":
            aumentarVolume(0.05); // aumenta 5%
            break;
        case "ArrowDown":
            diminuirVolume(0.05); // diminui 5%
            break;
    }
});

//===============================================================================
//MODAL
const modal = document.getElementById("staticBackdrop")

modal.addEventListener('show.bs.modal', () => {
    canvas.style.pointerEvents = 'none'
})
modal.addEventListener('hidden.bs.modal', () => {
    canvas.style.pointerEvents = 'auto'
})

//===============================================================================
//ALTERAR COR DISCO
const cor = [
    "#ff0000", "#ff00ff", "#ffffff"
];

let indiceCor = 0; //Cor atual

function proximaCor() {
    if (!disco) return;

    // Se for um array de materiais, aplicar a todos
    if (Array.isArray(disco.material)) {
        disco.material.forEach(mat => {
            mat.color.set(cor[indiceCor]);
            mat.needsUpdate = true; // força atualização
        });
    } else {
        disco.material.color.set(cor[indiceCor]);
        disco.material.needsUpdate = true; // força atualização
    }

    // Avança para a próxima cor
    indiceCor = (indiceCor + 1) % cor.length;
}

//===============================================================================
//ANIMAÇÕES
const estado = {
    discoARodar: false,
    bracoColocado: false,
    tampaFechada: false,
    interacaoBloqueada: false
};

function tocarAnimacao(nome) {
    if (!mixer || !acoes[nome]) return

    const acao = acoes[nome]
    acao.enabled = true;
    acao.paused = false;
    acao.timeScale = 1;
    acao.play()
}

function pararAnimacao(nome) {
    if (!mixer || !acoes[nome]) return

    const acao = acoes[nome]

    acoes[nome].stop()
}

function tocarAnimacaoAteAoFim(nome) {
    return new Promise((resolve) => {
        if (!mixer || !acoes[nome]) {
            resolve();
            return;
        }

        const acao = acoes[nome];

        acao.enabled = true;
        acao.paused = false;
        acao.timeScale = 1;
        acao.setLoop(THREE.LoopOnce);
        acao.clampWhenFinished = true;

        if (acao.time >= acao.getClip().duration) {
            acao.reset();
        }

        acao.play();

        //quando a animação acaba
        const onFinished = (e) => {
            if (e.action === acao) {
                mixer.removeEventListener("finished", onFinished);
                resolve();
            }
        };

        mixer.addEventListener("finished", onFinished)
    });
}

function tocarAnimacaoReversa(nome) {
    if (!mixer || !acoes[nome]) return

    const acao = acoes[nome]
    const duracao = acao.getClip().duration

    acao.stop()
    acao.enabled = true
    acao.setLoop(THREE.LoopOnce)
    acao.clampWhenFinished = true

    acao.timeScale = -1          //  reverse
    acao.time = duracao          //  começa no fim
    acao.play()
}

function desacelerarDisco(nome, duracao) {
    const acao = acoes[nome]
    if (!acao) return

    const inicio = performance.now()
    const velocidadeInicial = acao.timeScale

    function animar(t) {
        const progresso = Math.min((t - inicio) / duracao, 1)

        acao.timeScale = velocidadeInicial * (1 - progresso)

        if (progresso < 1) {
            requestAnimationFrame(animar)
        } else {
            acao.timeScale = 0
            acao.paused = true
        }
    }

    requestAnimationFrame(animar)
}

function pararDiscoSuavemente() {
    if (estado.discoARodar) {
        desacelerarDisco("RodarDisco", 1500)
        estado.discoARodar = false
    }
}
//===============================================================================
//EFEITO SONORO
const soundEffect = document.getElementById("soundEffect")
const soundEffectBotao = document.getElementById("soundEffectBotao")

function playSoundEffectTampa(){
    soundEffect.currentTime = 0.9;
    soundEffect.playbackRate = 0.5;
    soundEffect.play();
}

function playSoundEffectBotao(){
    soundEffectBotao.volume = 0.7
    soundEffectBotao.currentTime = 0
    soundEffectBotao.play();
}

//===============================================================================
//VERIFICACOES PARA AS ANIMACOES

function verificacaoTampa() {
    // 0 = fechada, 1 = aberta
    return estado.tampaFechada ? 0 : 1
}

function abrirTampa() {

    if (verificacaoTampa() === 0) { // se estiver fechada
        tocarAnimacaoReversa("FecharTampaGiraDiscos")
        estado.tampaFechada = false
        playSoundEffectTampa()
    } else {
        console.log("A tampa já está aberta!")
    }
}

function fecharTampa() {
    if (verificacaoTampa() === 1) { // se estiver aberta
        tocarAnimacaoAteAoFim("FecharTampaGiraDiscos")
        estado.tampaFechada = true
        playSoundEffectTampa()
    } else {
        console.log("A tampa já está fechada!")
    }
}

function verificacaoDisco() {
    // 0 = roda, 1 = nao rodar
    return estado.discoARodar ? 0 : 1
}

function rodarDisco() {
    if (verificacaoDisco() === 1) {  // se nao estiver a rodar
        tocarAnimacao("RodarDisco")
        estado.discoARodar = true
    } else {
        console.log("O disco já está a rodar!")
    }
}


function pararRodarDisco() {
    if (verificacaoDisco() === 0) { // se já estiver a rodar
        pararDiscoSuavemente()
        estado.discoARodar = false
    } else {
        console.log("O disco já não está a rodar!")
    }
}

function colocarBraco() {
    if (!estado.bracoColocado) {
        tocarAnimacaoAteAoFim("PickupAction");
        estado.bracoColocado = true;
    } else {
        console.log("O braço já está colocado");
    }
}

function retirarBraco() {
    if (estado.bracoColocado) {
        tocarAnimacaoReversa("PickupAction");
        estado.bracoColocado = false;
    } else {
        console.log("O braço já não está colocado");
    }
}

//===============================================================================
//BOTÕES DE ANIMAÇÃO
//Rodar disco
document.getElementById("btn-anim-1").onclick = () => rodarDisco()
//Parar disco
document.getElementById("btn-anim-2").onclick = () => pararRodarDisco()
//Abrir tampa
document.getElementById("btn-anim-3").onclick = () => abrirTampa()
//Fechar tampa
document.getElementById("btn-anim-4").onclick = () => fecharTampa()
//Posicionar braco
document.getElementById("btn-anim-5").onclick = () => colocarBraco()
//Retirar Braco
document.getElementById("btn-anim-6").onclick = () => retirarBraco()

//meter musica
document.getElementById("btn-play").onclick = () => prepararMusica()
//pausar musica
document.getElementById("btn-pause").onclick = () => removerPreparacaoMusica()
//dar skip
document.getElementById("btn-skip").onclick = () => skipMusica()
//desligar gira-discos
document.getElementById("btn-turn-off").onclick = () => desligarGiraDiscos()

//volume
document.getElementById("btn-volume-up").onclick = () => aumentarVolume(0.05)
document.getElementById("btn-volume-down").onclick = () => diminuirVolume(0.05)

//===============================================================================
//BLOQUEIO DE BOTOES
const btnSkip = document.getElementById("btn-skip")
btnSkip.disabled = true

const btnStop = document.getElementById("btn-pause")
btnStop.disabled = true

const btnRetirarBraco = document.getElementById("btn-anim-6")
btnRetirarBraco.disabled = false

const btnPararDisco = document.getElementById("btn-anim-2")
btnPararDisco.disabled = false

const btnFecharTampa = document.getElementById("btn-anim-4")
btnFecharTampa.disabled = false

//===============================================================================
//AUMENTAR O VOLUME
function aumentarVolume(aAumentar) {
    const musicaAtual = musicas[indice];
    if (!musicaAtual) return;

    musicaAtual.volume = Math.min(musicaAtual.volume + aAumentar, 1); // máximo 1
}

//===============================================================================
//DIMINUIR O VOLUME
function diminuirVolume(aDiminuir) {
    const musicaAtual = musicas[indice];
    if (!musicaAtual) return;

    musicaAtual.volume = Math.max(musicaAtual.volume - aDiminuir, 0); // mínimo 0
}

//===============================================================================
//CONTADOR DE TEMPO DA MUSICA
function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
}

//===============================================================================
// BARRA DE PROGRESSO

function atualizarBarraProgresso() {
    const musicaAtual = musicas[indice];
    if (!musicaAtual) return;

    const duracao = musicaAtual.duration || 1;
    const progresso = musicaAtual.currentTime / duracao;

    const barra = document.getElementById("progresso");
    const indicador = document.getElementById("indicador");

    barra.style.width = `${progresso * 100}%`;
    indicador.style.left = `${progresso * 100}%`;

    document.getElementById("tempo-inicio").innerText = formatarTempo(musicaAtual.currentTime);
    document.getElementById("tempo-fim").innerText = formatarTempo(duracao);
}

// Atualiza a cada 100ms
setInterval(atualizarBarraProgresso, 100);

// avançar pela barra
const barraContainer = document.querySelector(".barra-container");
barraContainer.addEventListener("click", (event) => {
    const musicaAtual = musicas[indice];
    if (!musicaAtual) return;

    const rect = barraContainer.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickProgresso = clickX / rect.width;

    musicaAtual.currentTime = musicaAtual.duration * clickProgresso;
    atualizarBarraProgresso();
});

//===============================================================================
//MUSICA
const musicas = [
    document.getElementById("musica1"),
    document.getElementById("musica2"),
    document.getElementById("musica3")
];

let indice = 0; // Música atual

function pararMusicaAtual() {
    //musicas[indice].pause();
    fadeOutMusicaAtual(300)
}

function prepararMusica() {
    estado.interacaoBloqueada = true
    proximaCor()
    ligarLED()
    abrirTampa()
    rodarDisco()

    if (!estado.bracoColocado) {
        tocarAnimacaoAteAoFim("PickupAction").then(() => {
            musicas[indice].play()
        });
        estado.bracoColocado = true;
    } else {
        console.log("O braço já está colocado");
        musicas[indice].play()
    }

    btnSkip.disabled = false
    btnStop.disabled = false

    btnFecharTampa.disabled = true
    btnPararDisco.disabled = true
    btnRetirarBraco.disabled = true

}

function removerPreparacaoMusica() {
    estado.interacaoBloqueada = false
    pararMusicaAtual()
    retirarBraco()
    if (verificacaoDisco() === 0) {
        desacelerarDisco("RodarDisco", 1500)
        estado.discoARodar = false
    } else {
        console.log("O disco já não está a rodar!")
    }
    btnSkip.disabled = true
    btnStop.disabled = true

    btnFecharTampa.disabled = false
    btnPararDisco.disabled = false
    btnRetirarBraco.disabled = false
}

function desligarGiraDiscos() {
    estado.interacaoBloqueada = false
    pararMusicaAtual()

    retirarBraco()

    if (verificacaoDisco() === 0) {
        desacelerarDisco("RodarDisco", 1500)
        estado.discoARodar = false
    } else {
        console.log("O disco já não está a rodar!")
    }

    desligarLED()
    fecharTampa()

    btnSkip.disabled = true
    btnStop.disabled = true

    btnFecharTampa.disabled = false
    btnPararDisco.disabled = false
    btnRetirarBraco.disabled = false
}

function skipMusica() {
    pararMusicaAtual()
    proximaCor()
    indice = (indice + 1) % musicas.length
    musicas[indice].play()
}

function fadeOutMusicaAtual(duracao) { // duração em ms
    const musica = musicas[indice];
    if (!musica || musica.paused) return;

    const passo = 50 // ms por atualização
    const decremento = musica.volume / (duracao / passo);

    const fadeInterval = setInterval(() => {
        if (musica.volume > decremento) {
            musica.volume -= decremento
        } else {
            musica.volume = 0;
            musica.pause();
            musica.volume = 1; // aumenta o volume para a proxima reproducao
            clearInterval(fadeInterval);
        }
    }, passo);
}

//===============================================================================
// LEDs de ligado/desligado
const materialLEDVerde = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,   //emitir o brilho
    emissiveIntensity: 1,
    metalness: 0.5,
    roughness: 0.5
});

const materialLEDVermelho = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    metalness: 0.5,
    roughness: 0.5
});

const geometriaLED = new THREE.SphereGeometry(0.005, 16, 16);

const ledVerde = new THREE.Mesh(geometriaLED, materialLEDVerde);
const ledVermelho = new THREE.Mesh(geometriaLED, materialLEDVermelho);

ledVerde.position.set(0.105, 0.065, -0.15);
cena.add(ledVerde);

ledVermelho.position.set(0.105, 0.065, -0.15);
cena.add(ledVermelho);

ledVermelho.visible = true;
ledVerde.visible = false;

function ligarLED() {
    ledVerde.visible = true;
    ledVermelho.visible = false;
}

function desligarLED() {
    ledVerde.visible = false;
    ledVermelho.visible = true;
}