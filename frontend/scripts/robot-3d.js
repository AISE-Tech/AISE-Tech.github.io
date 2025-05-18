/**
 * Script optimizado para visualizar un modelo 3D sin cuadrícula
 * con sistema de caché para cargar el modelo una sola vez
 */

renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });

// Variables globales para gestionar el caché
let cachedModel = null;
let cachedModelUrl = null;
let sceneInstance = null;
let cameraInstance = null;
let rendererInstance = null;
let controlsInstance = null;
let animationFrameId = null;
let containerInstance = null;

// Función para inicializar el visualizador 3D
function initializeViewer(containerId) {
    console.log("Inicializando visualizador 3D");
    
    // Limpiar animación previa si existe
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Verificar si el elemento contenedor existe
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`No se encontró el contenedor #${containerId}`);
        return;
    }
    
    containerInstance = container;
    
    // Verificar si THREE está disponible
    if (typeof THREE === 'undefined') {
        console.error("THREE.js no está cargado. Asegúrate de importar la biblioteca.");
        return;
    }
    
    // Obtener URL del modelo desde el atributo data
    const MODEL_URL = container.dataset.modelUrl;
    console.log("URL del modelo:", MODEL_URL);
    
    // Verificar si ya tenemos el renderer creado
    if (!rendererInstance) {
        // Configurar dimensiones
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Inicializar escena si no existe
        if (!sceneInstance) {
            sceneInstance = new THREE.Scene();
            sceneInstance.background = new THREE.Color(0xffffff);
            
            // Añadir luces a la escena
            sceneInstance.add(new THREE.AmbientLight(0xffffff, 0.7));
            const dirLight = new THREE.DirectionalLight(0xffffff, 1);
            dirLight.position.set(5, 10, 7.5);
            sceneInstance.add(dirLight);
        }
        
        // Configurar cámara si no existe
        if (!cameraInstance) {
            cameraInstance = new THREE.PerspectiveCamera(25, width / height, 0.1, 1000);
            cameraInstance.position.set(0, 0, 5);
        }
        
        // Configurar renderer
        rendererInstance = new THREE.WebGLRenderer({ antialias: true });
        rendererInstance.setSize(width, height);
        rendererInstance.setPixelRatio(window.devicePixelRatio);
        container.appendChild(rendererInstance.domElement);
        
        // Añadir controles OrbitControls si están disponibles
        if (typeof THREE.OrbitControls !== 'undefined') {
            controlsInstance = new THREE.OrbitControls(cameraInstance, rendererInstance.domElement);
            controlsInstance.target.set(0, 0, 0);
            controlsInstance.enableDamping = true;
            controlsInstance.dampingFactor = 0.05;
            controlsInstance.update();
        }
        
        // Manejar redimensionamiento
        window.addEventListener('resize', handleResize);
    } else {
        // Si el renderer ya existe, simplemente lo añadimos al nuevo contenedor
        container.appendChild(rendererInstance.domElement);
    }
    
    // Verificar si necesitamos cargar el modelo o usar el cache
    if (!cachedModel || cachedModelUrl !== MODEL_URL) {
        loadModel(MODEL_URL);
    } else {
        console.log("Usando modelo en caché");
        // Si el modelo ya está en caché pero no en la escena, lo añadimos
        if (!sceneInstance.getObjectById(cachedModel.id)) {
            sceneInstance.add(cachedModel);
        }
        startAnimation();
    }
}

// Función para cargar el modelo 3D
function loadModel(modelUrl) {
    try {
        const loader = new THREE.GLTFLoader();
        console.log("Intentando cargar el modelo desde:", modelUrl);
        
        loader.load(
            modelUrl,
            function(gltf) {
                console.log("¡Modelo cargado exitosamente!");
                
                // Guardar en caché
                cachedModel = gltf.scene;
                cachedModelUrl = modelUrl;
                
                // Centrar y escalar el modelo
                const box = new THREE.Box3().setFromObject(cachedModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                cachedModel.scale.set(scale, scale, scale);
                
                cachedModel.position.x = -center.x * scale;
                cachedModel.position.y = -center.y * scale;
                cachedModel.position.z = -center.z * scale;
                
                // Añadir el modelo a la escena
                sceneInstance.add(cachedModel);
                console.log("Modelo añadido a la escena");
                
                startAnimation();
            },
            function(xhr) {
                const percent = xhr.loaded / xhr.total * 100;
                console.log("Progreso de carga:", percent.toFixed(2) + "%");
            },
            function(error) {
                console.error("Error cargando el modelo:", error);
                
                // Mostrar mensaje de error en el contenedor
                if (containerInstance) {
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
                    containerInstance.appendChild(errorMsg);
                }
            }
        );
    } catch (error) {
        console.error("Error al crear el loader:", error);
    }
}

// Función de animación
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    if (controlsInstance) {
        controlsInstance.update();
    }
    
    if (rendererInstance && sceneInstance && cameraInstance) {
        rendererInstance.render(sceneInstance, cameraInstance);
    }
}

// Iniciar animación
function startAnimation() {
    if (!animationFrameId) {
        animate();
    }
}

// Función para manejar el redimensionamiento de la ventana
function handleResize() {
    if (containerInstance && cameraInstance && rendererInstance) {
        const width = containerInstance.clientWidth;
        const height = containerInstance.clientHeight;
        
        cameraInstance.aspect = width / height;
        cameraInstance.updateProjectionMatrix();
        rendererInstance.setSize(width, height);
    }
}

// Función para liberar recursos cuando ya no se necesitan
function disposeViewer() {
    // Detener el ciclo de animación
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Quitar el event listener de resize
    window.removeEventListener('resize', handleResize);
    
    // Eliminar renderer del DOM si existe
    if (rendererInstance && rendererInstance.domElement.parentNode) {
        rendererInstance.domElement.parentNode.removeChild(rendererInstance.domElement);
    }
    
    // Nota: No limpiamos cachedModel porque queremos mantenerlo en caché
}

// Inicializar el visualizador cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM cargado, iniciando visualizador 3D");
    // Inicializar automáticamente si existe el contenedor
    const container = document.getElementById('robot-3d-container');
    if (container) {
        initializeViewer('robot-3d-container');
    }
});

// Exportar funciones para uso externo
window.Robot3DViewer = {
    initialize: initializeViewer,
    dispose: disposeViewer
};

document.addEventListener("scroll", function() {
    const container = document.getElementById('robot-3d-container');
    const bounding = container.getBoundingClientRect();

    if (bounding.top > window.innerHeight || bounding.bottom < 0) {
        console.log("Sección fuera de vista, liberando recursos...");
        renderer.dispose();
    }
});

document.addEventListener("visibilitychange", function() {
    if (document.hidden && renderer) {
        console.log("Liberando recursos WebGL...");
        renderer.dispose();
    }
});