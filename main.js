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
camara.position.set(1.5, 1.5, 1.5)

camara.fov = 35;
camara.updateProjectionMatrix();

//===============================================================================
//CONTROLOS
const controlos = new OrbitControls(camara, renderer.domElement)
controlos.enableDamping = true
controlos.target.set(0, 0, 0);

//===============================================================================
//LUZES
const luzPonto = new THREE.PointLight(0xffffff, 2)
luzPonto.position.set(3, 4, 0)
luzPonto.castShadow = true
cena.add(luzPonto)

const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.5)
cena.add(luzAmbiente)

const luzDisco = new THREE.PointLight(0xffffff, 3.5)
luzDisco.position.set(0, 2, 0)
cena.add(luzDisco)

cena.background = new THREE.Color(0xaaaaaa)

//===============================================================================
//VARIÁVEIS GLOBAIS
let alvo = null
let mixer = null
let disco = null
let tampa = null
const acoes = {}
const clock = new THREE.Clock()

// Estado inicial do sistema
const estado = {
    tampaAberta: true,      // O modelo começa aberto
    discoRodando: false,
    bracoPosicionado: false,
    musicaAImitar: false
};

//===============================================================================
//CARREGAR MODELO
const loader = new GLTFLoader()

loader.load('./models/RecordPlayer.gltf',
    (gltf) => {
        console.log("Modelo carregado com sucesso!");
        cena.add(gltf.scene)

        mixer = new THREE.AnimationMixer(gltf.scene)

        gltf.animations.forEach((clip) => {
            acoes[clip.name] = mixer.clipAction(clip)
        })

        gltf.scene.traverse((obj) => {
            if (obj.isMesh) {
                obj.castShadow = true
                obj.receiveShadow = true

                if (obj.name === "Base") { alvo = obj }
                if (obj.name === "DustCover") { tampa = obj }
                if (obj.name === "VinylDisk") { disco = obj }
            }
        })

        // Atualiza os botões assim que o modelo carrega
        atualizarBotoes();
    },
    undefined,
    (error) => {
        console.error('Ocorreu um erro ao carregar o modelo:', error);
        alert('Erro: Não consegui encontrar o ficheiro "models/RecordPlayer.gltf". Verifica a pasta!');
    }
)

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
//RESIZE E UTILITÁRIOS
window.addEventListener('resize', () => {
    camara.aspect = window.innerWidth / window.innerHeight
    camara.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

document.getElementById("fullscreen-btn").onclick = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
    } else {
        document.exitFullscreen()
    }
}

document.getElementById("btn-close").onclick = () => {
    window.location.href = "gira_discos.html"
}

//===============================================================================
//TEXTURAS
const textureLoader = new THREE.TextureLoader()

const textures = {
    wood: textureLoader.load("files/savana_linha_dual_syncro_guararapes.jpg"),
    metal: textureLoader.load("files/stylish-panoramic-background-silver-steel-metal-texture-vector.jpg"),
    plastic: textureLoader.load("files/7008854-textura-de-fundo-abstrato-verde-aspero-plastico-foto.jpg")
}

const textures_tampa = {
    rosa: textureLoader.load("files/rosa.jpg"),
    azul: textureLoader.load("files/azul.jpg"),
    catanho: textureLoader.load("files/castanho.avif")
}

function aplicarTextura(mesh, textura) {
    if (!mesh) return
    textura.colorSpace = THREE.SRGBColorSpace
    textura.flipY = false
    textura.wrapS = THREE.RepeatWrapping
    textura.wrapT = THREE.RepeatWrapping
    mesh.material = new THREE.MeshStandardMaterial({
        map: textura,
        metalness: 0.3,
        roughness: 0.7,
        side: THREE.DoubleSide
    })
}

function textureFinal(textura1, textura2){
    aplicarTextura(alvo, textura1),
        aplicarTextura(tampa, textura2)
}

document.getElementById("btn-wood").onclick = () => textureFinal(textures.wood, textures_tampa.catanho)
document.getElementById("btn-metal").onclick = () => textureFinal(textures.metal, textures_tampa.azul)
document.getElementById("btn-cortica").onclick = () => textureFinal(textures.plastic, textures_tampa.rosa)

// Modal Events
const modal = document.getElementById("staticBackdrop")
modal.addEventListener('show.bs.modal', () => { canvas.style.pointerEvents = 'none' })
modal.addEventListener('hidden.bs.modal', () => { canvas.style.pointerEvents = 'auto' })

//===============================================================================
// LOGICA DE CORES
const cor = ["#ff0000", "#ff00ff", "#ffffff"];
let indiceCor = 0;

function proximaCor() {
    if (!disco) return;
    if (Array.isArray(disco.material)) {
        disco.material.forEach(mat => {
            mat.color.set(cor[indiceCor]);
            mat.needsUpdate = true;
        });
    } else {
        disco.material.color.set(cor[indiceCor]);
        disco.material.needsUpdate = true;
    }
    indiceCor = (indiceCor + 1) % cor.length;
}

//===============================================================================
// SISTEMA DE ANIMAÇÃO E LÓGICA (CORE)

function tocarAnimacao(nome, timeScale = 1, loop = THREE.LoopOnce) {
    if (!mixer || !acoes[nome]) return;
    const acao = acoes[nome];
    acao.enabled = true;
    acao.paused = false;
    acao.timeScale = timeScale;
    acao.setLoop(loop);
    acao.clampWhenFinished = true;

    if (timeScale === -1 && acao.time === 0) {
        acao.time = acao.getClip().duration;
    }
    acao.play();
}

function pararAnimacao(nome){
    if (!mixer || !acoes[nome]) return;
    acoes[nome].stop();
}

function tocarAnimacaoPromessa(nome, timeScale = 1) {
    return new Promise((resolve) => {
        if (!mixer || !acoes[nome]) {
            resolve();
            return;
        }

        const acao = acoes[nome];
        acao.enabled = true;
        acao.paused = false;
        acao.timeScale = timeScale;
        acao.setLoop(THREE.LoopOnce);
        acao.clampWhenFinished = true;

        if (timeScale === -1 && acao.time === 0) {
            acao.time = acao.getClip().duration;
        } else if (timeScale === 1 && acao.time === acao.getClip().duration) {
            acao.time = 0;
        }

        acao.play();

        const onFinished = (e) => {
            if (e.action === acao) {
                mixer.removeEventListener("finished", onFinished);
                resolve();
            }
        };
        mixer.addEventListener("finished", onFinished);
    });
}

// -- Ações Lógicas --

function acaoRodarDisco() {
    // 1. Verificar tampa
    if (!estado.tampaAberta) {
        console.log("Ação bloqueada: Tampa fechada.");
        return;
    }
    // 2. NOVA VERIFICAÇÃO: Braço tem de estar posicionado
    if (!estado.bracoPosicionado) {
        alert("O braço tem de estar posicionado para rodares o disco!");
        return;
    }

    tocarAnimacao("RodarDisco", 1, THREE.LoopRepeat);
    estado.discoRodando = true;
    atualizarBotoes();
}

function acaoPararDisco() {
    pararAnimacao("RodarDisco");
    estado.discoRodando = false;
    atualizarBotoes();
}

async function acaoFecharTampa() {
    if (estado.bracoPosicionado) {
        await acaoRetirarBraco();
    }
    if (estado.discoRodando) {
        acaoPararDisco();
    }
    pararMusicaAtual();
    tocarAnimacao("FecharTampaGiraDiscos", 1); // Fechar
    estado.tampaAberta = false;
    atualizarBotoes();
}

function acaoAbrirTampa() {
    tocarAnimacao("FecharTampaGiraDiscos", -1); // Abrir
    estado.tampaAberta = true;
    atualizarBotoes();
}

async function acaoColocarBraco() {
    if (!estado.tampaAberta) return;
    await tocarAnimacaoPromessa("PickupAction", 1);
    estado.bracoPosicionado = true;
    atualizarBotoes();
}

async function acaoRetirarBraco() {
    await tocarAnimacaoPromessa("PickupAction", -1);
    estado.bracoPosicionado = false;
    atualizarBotoes();
}

async function acaoPlayMusica() {
    if (!estado.tampaAberta) {
        alert("Abre a tampa primeiro!");
        return;
    }

    // NOVA ORDEM AUTOMÁTICA
    // Como agora só podemos rodar se o braço estiver em baixo,
    // temos de colocar o braço PRIMEIRO.

    if (!estado.bracoPosicionado) {
        await acaoColocarBraco();
    }

    // Agora que o braço está posto, já podemos rodar
    if (!estado.discoRodando) {
        acaoRodarDisco();
    }

    musicas[indice].play();
    estado.musicaAImitar = true;
    ligarLED();
    atualizarBotoes();
}

async function acaoPausaMusica() {
    pararMusicaAtual();
    desligarLED();
    estado.musicaAImitar = false;

    if (estado.bracoPosicionado) await acaoRetirarBraco();
    if (estado.discoRodando) acaoPararDisco();

    atualizarBotoes();
}

//===============================================================================
// EVENT LISTENERS DOS BOTÕES (ORDEM 1 a 6)

// 1 - Abrir Tampa
const btnAbrir = document.getElementById("btn-anim-1");
// 2 - Fechar Tampa
const btnFechar = document.getElementById("btn-anim-2");
// 3 - Posicionar Braço
const btnColocar = document.getElementById("btn-anim-3");
// 4 - Retirar Braço
const btnRetirar = document.getElementById("btn-anim-4");
// 5 - Rodar Disco
const btnRodar = document.getElementById("btn-anim-5");
// 6 - Parar Disco
const btnParar = document.getElementById("btn-anim-6");

const btnPlay = document.getElementById("btn-anim-7");
const btnPause = document.getElementById("btn-anim-8");
const btnNext = document.getElementById("btn-anim-9");

// Mapeamento correto das funções
btnAbrir.onclick = acaoAbrirTampa;
btnFechar.onclick = acaoFecharTampa;
btnColocar.onclick = acaoColocarBraco;
btnRetirar.onclick = acaoRetirarBraco;
btnRodar.onclick = acaoRodarDisco;
btnParar.onclick = acaoPararDisco;

btnPlay.onclick = acaoPlayMusica;
btnPause.onclick = acaoPausaMusica;
btnNext.onclick = skipMusica;

function atualizarBotoes() {
    // Tampa
    btnAbrir.disabled = estado.tampaAberta;
    btnFechar.disabled = !estado.tampaAberta;

    // Braço
    btnColocar.disabled = estado.bracoPosicionado || !estado.tampaAberta;
    btnRetirar.disabled = !estado.bracoPosicionado;

    // Disco
    // NOVA REGRA VISUAL: O botão fica bloqueado se o braço NÃO estiver posicionado
    btnRodar.disabled = estado.discoRodando || !estado.tampaAberta || !estado.bracoPosicionado;

    btnParar.disabled = !estado.discoRodando;

    // Música
    btnPlay.disabled = estado.musicaAImitar;
    btnPause.disabled = !estado.musicaAImitar;
}

// Chamamos isto no fim para garantir que o estado inicial é aplicado
atualizarBotoes();

//===============================================================================
// MUSICA & LEDS
const musicas = [
    document.getElementById("musica1"),
    document.getElementById("musica2"),
    document.getElementById("musica3")
];

let indice = 0;

function pararMusicaAtual() {
    musicas[indice].pause();
    musicas[indice].currentTime = 0;
}

function skipMusica(){
    pararMusicaAtual();
    indice = (indice + 1) % musicas.length;
    if (estado.musicaAImitar) {
        musicas[indice].play();
    }
    proximaCor();
}

// Contador
function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60).toString().padStart(2, '0');
    const seg = Math.floor(segundos % 60).toString().padStart(2, '0');
    return min + ":" + seg;
}

function atualizarContador() {
    const musicaAtual = musicas[indice];
    if (!musicaAtual) return;
    const tempoAtual = formatarTempo(musicaAtual.currentTime);
    const duracao = formatarTempo(musicaAtual.duration || 0);
    document.getElementById("contadorMusica").innerText = tempoAtual + " / " + duracao;
}
setInterval(atualizarContador, 500);

// LEDS
const materialLEDVerde = new THREE.MeshStandardMaterial({
    color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1, metalness: 0.5, roughness: 0.5
});
const materialLEDVermelho = new THREE.MeshStandardMaterial({
    color: 0xff0000, metalness: 0.5, roughness: 0.5
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