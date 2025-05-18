/**
 * Script para visualizar un modelo 3D con Three.js
 * robot3d.js - Versión corregida
 */

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM cargado, iniciando visualizador 3D");
    
    // Verificar si el elemento contenedor existe
    const container = document.getElementById('robot-3d-container');
    if (!container) {
        console.error("No se encontró el contenedor #robot-3d-container");
        return;
    }
    
    // Verificar si THREE está disponible
    if (typeof THREE === 'undefined') {
        console.error("THREE.js no está cargado. Asegúrate de importar la biblioteca.");
        const errorMsg = document.createElement('div');
        errorMsg.style.position = 'absolute';
        errorMsg.style.top = '50%';
        errorMsg.style.left = '50%';
        errorMsg.style.transform = 'translate(-50%, -50%)';
        errorMsg.style.color = 'white';
        errorMsg.style.backgroundColor = 'rgba(255,0,0,0.5)';
        errorMsg.style.padding = '10px';
        errorMsg.style.borderRadius = '5px';
        errorMsg.textContent = 'Error: THREE.js no está disponible';
        container.appendChild(errorMsg);
        return;
    }
    
    // Verificar si GLTFLoader está disponible
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.error("GLTFLoader no está disponible");
        const errorMsg = document.createElement('div');
        errorMsg.style.position = 'absolute';
        errorMsg.style.top = '50%';
        errorMsg.style.left = '50%';
        errorMsg.style.transform = 'translate(-50%, -50%)';
        errorMsg.style.color = 'white';
        errorMsg.style.backgroundColor = 'rgba(255,0,0,0.5)';
        errorMsg.style.padding = '10px';
        errorMsg.style.borderRadius = '5px';
        errorMsg.textContent = 'Error: GLTFLoader no está disponible';
        container.appendChild(errorMsg);
        return;
    }
    
    // Obtener URL del modelo desde el atributo data
    const MODEL_URL = container.dataset.modelUrl;
    console.log("URL del modelo:", MODEL_URL);
    
    // Variables para Three.js
    let scene, camera, renderer, controls;
    
    // Inicializar escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181c24);
    
    // Configurar dimensiones
    const width = container.clientWidth;
    const height = container.clientHeight;
    console.log("Dimensiones del contenedor:", width, "x", height);
    
    // Configurar cámara
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);
    
    // Configurar renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Verificar si el canvas se creó correctamente
    const canvas = container.querySelector('canvas');
    if (!canvas) {
        console.error("No se pudo crear el canvas de WebGL");
        return;
    }
    console.log("Canvas WebGL creado correctamente");
    
    // Añadir controles OrbitControls si están disponibles
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.update();
    } else {
        console.warn("OrbitControls no está disponible");
    }
    
    // Añadir luces
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);
    
    // Añadir rejilla para referencia visual
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);
    
    // Añadir un cubo temporal como referencia visual
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00bcd4, wireframe: true });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);
    console.log("Cubo de referencia añadido a la escena");
    
    // Función de animación
    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.y += 0.01;
        if (controls) controls.update();
        renderer.render(scene, camera);
    }
    
    // Iniciar animación
    animate();
    
    // Cargar modelo 3D
    try {
        const loader = new THREE.GLTFLoader();
        console.log("Intentando cargar el modelo desde:", MODEL_URL);
        
        loader.load(
            MODEL_URL,
            function(gltf) {
                console.log("¡Modelo cargado exitosamente!");
                const model = gltf.scene;
                
                // Centrar y escalar el modelo
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                model.scale.set(scale, scale, scale);
                
                model.position.x = -center.x * scale;
                model.position.y = -center.y * scale;
                model.position.z = -center.z * scale;
                
                // Remover el cubo de referencia
                scene.remove(cube);
                
                // Añadir el modelo a la escena
                scene.add(model);
                console.log("Modelo añadido a la escena");
            },
            function(xhr) {
                const percent = xhr.loaded / xhr.total * 100;
                console.log("Progreso de carga:", percent.toFixed(2) + "%");
            },
            function(error) {
                console.error("Error cargando el modelo:", error);
                
                // Mostrar mensaje de error en el contenedor
                const errorMsg = document.createElement('div');
                errorMsg.style.position = 'absolute';
                errorMsg.style.top = '50%';
                errorMsg.style.left = '50%';
                errorMsg.style.transform = 'translate(-50%, -50%)';
                errorMsg.style.color = 'white';
                errorMsg.style.backgroundColor = 'rgba(255,0,0,0.5)';
                errorMsg.style.padding = '10px';
                errorMsg.style.borderRadius = '5px';
                errorMsg.textContent = 'Error cargando el modelo 3D: ' + error.message;
                container.appendChild(errorMsg);
                
                // El cubo permanecerá visible como referencia
            }
        );
    } catch (error) {
        console.error("Error al crear el loader:", error);
    }
    
    // Manejar redimensionamiento
    window.addEventListener('resize', function() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
});