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

const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.5)
cena.add(luzAmbiente)

const luzDisco = new THREE.PointLight(0xffffff, 3.5)
luzDisco.position.set(0, 2, 0) 
cena.add(luzDisco)

cena.background = new THREE.Color(0xaaaaaa)

//===============================================================================
//VARIÁVEIS
let alvo = null
let mixer = null
let disco = null
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
document.getElementById("fullscreen-btn").onclick = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
    } else {
        document.exitFullscreen()
    }
}

//===============================================================================
//FECHAR PÁGINA
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

//===============================================================================
//BOTÕES DE MATERIAL
document.getElementById("btn-wood").onclick = () => textureFinal(textures.wood, textures_tampa.catanho)
document.getElementById("btn-metal").onclick = () => textureFinal(textures.metal, textures_tampa.azul)
document.getElementById("btn-cortica").onclick = () => textureFinal(textures.plastic, textures_tampa.rosa)

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
    tampaFechada: false 
};

function colocarBraco() {
    if (estado.bracoColocado) return;

    tocarAnimacaoReversa("PickupAction");
    estado.bracoColocado = true;
}

function tocarAnimacao(nome) {
    if (!mixer || !acoes[nome]) return

    const acao = acoes[nome]
    acao.enabled = true;
    acao.paused = false;
    acao.timeScale = 1;  
    acao.play()
}

function pararAnimacao(nome){
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

        mixer.addEventListener("finished", onFinished);
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
    const acao = acoes[nome];
    if (!acao) return;

    const inicio = performance.now();
    const velocidadeInicial = acao.timeScale;

    function animar(t) {
        const progresso = Math.min((t - inicio) / duracao, 1);

        acao.timeScale = velocidadeInicial * (1 - progresso);

        if (progresso < 1) {
            requestAnimationFrame(animar);
        } else {
            acao.timeScale = 0;
            acao.paused = true; 
        }
    }

    requestAnimationFrame(animar);
}

function verificacaoTampa() {
    // 0 = fechada, 1 = aberta
    return estado.tampaFechada ? 0 : 1;
}



//BOTÕES DE ANIMAÇÃO
//Rodar disco
document.getElementById("btn-anim-1").onclick = () => tocarAnimacao("RodarDisco")

//Fechar tampa
document.getElementById("btn-anim-2").onclick = () => {
    if (verificacaoTampa() === 1) { // só fecha se estiver aberta
        tocarAnimacaoAteAoFim("FecharTampaGiraDiscos"); // animação de fechar
        estado.tampaFechada = true; // atualiza o estado
    } else {
        console.log("A tampa já está fechada!");
    }
}

//Posicionar braco
document.getElementById("btn-anim-3").onclick = () => tocarAnimacaoAteAoFim("PickupAction")

//Abrir tampa
document.getElementById("btn-anim-4").onclick = () =>  {
    if (verificacaoTampa() === 0) { // só abre se estiver fechada
        tocarAnimacaoReversa("FecharTampaGiraDiscos"); // animação de abrir
        estado.tampaFechada = false; // atualiza o estado
    } else {
        console.log("A tampa já está aberta!");
    }
}

//Retirar Braco
document.getElementById("btn-anim-5").onclick = () => tocarAnimacaoReversa("PickupAction")

//Parar disco
document.getElementById("btn-anim-6").onclick = () => pararAnimacao("RodarDisco")

document.getElementById("btn-anim-7").onclick = () => prepararMusica()

document.getElementById("btn-anim-8").onclick = () => removerPreparacaoMusica()

document.getElementById("btn-anim-9").onclick = () => skipMusica()

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
    tocarAnimacao("RodarDisco")
    colocarBraco()
    tocarAnimacaoAteAoFim("PickupAction").then(() => {
        musicas[indice].play();
    });
    tocarAnimacaoReversa("FecharTampaGiraDiscos") //apenas caso a tampa esteja fechada
    ligarLED()
}

function removerPreparacaoMusica(){
    tocarAnimacaoReversa("PickupAction")
    desacelerarDisco("RodarDisco", 1500);
    pararMusicaAtual()
    desligarLED()
    tocarAnimacaoAteAoFim("FecharTampaGiraDiscos")
}

function skipMusica(){
    pararMusicaAtual();    
    indice = (indice + 1) % musicas.length; 
    musicas[indice].play();
    proximaCor()
}

function fadeOutMusicaAtual(duracao) { // duração em ms
    const musica = musicas[indice];
    if (!musica || musica.paused) return;

    const passo = 50; // ms por atualização
    const decremento = musica.volume / (duracao / passo);

    const fadeInterval = setInterval(() => {
        if (musica.volume > decremento) {
            musica.volume -= decremento;
        } else {
            musica.volume = 0;
            musica.pause();
            musica.volume = 1; // aumenta o volume para a proxima reproducao
            clearInterval(fadeInterval);
        }
    }, passo);
}

//CONTADOR DE TEMPO DA MUSICA
function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min.toString().padStart(2,'0')}:${seg.toString().padStart(2,'0')}`;
}

function atualizarContador() {
    const musicaAtual = musicas[indice];
    if (!musicaAtual) return;

    const tempoAtual = formatarTempo(musicaAtual.currentTime);
    const duracao = formatarTempo(musicaAtual.duration || 0);

    document.getElementById("contadorMusica").innerText = `${tempoAtual} / ${duracao}`;
}

setInterval(atualizarContador, 500);

//===============================================================================
// LEDs
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