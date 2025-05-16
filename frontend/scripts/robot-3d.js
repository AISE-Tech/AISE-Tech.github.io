const container = document.getElementById('robot-3d-container');
const MODEL_URL = container.dataset.modelUrl || '/frontend/assets/robot_model.glb';

let scene, camera, renderer, model;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181c24);

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2, 2, 4);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const loader = new THREE.GLTFLoader();
    loader.load(MODEL_URL, (gltf) => {
        model = gltf.scene;
        model.scale.set(1, 1, 1);
        scene.add(model);
        animate();
    }, undefined, (error) => {
        console.error('Error cargando el modelo 3D:', error);
    });

    let angle = 0;
    function animate() {
        requestAnimationFrame(animate);
        if (model) {
            angle += 0.005;
            model.rotation.y = angle;
        }
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("robot-3d-container");
    if (container) {
        init();
    } else {
        console.error("No se encontró el contenedor 3D.");
    }
});

document.addEventListener("DOMContentLoaded", function () {
    console.log("El DOM está listo, ejecutando el script.");
});
