// AISE Technology - Script Loader
// Este archivo carga las versiones ofuscadas de los scripts de la aplicación

// Cargar chatBot (usando la versión original o la ofuscada según disponibilidad)
let ChatBot;
try {
    // Intentar cargar la versión ofuscada
    ChatBot = await import('./dist/chatBot.js').then(module => module.default);
    console.log('Cargando versión ofuscada del chatbot');
} catch (error) {
    // Si falla, carga la versión original
    console.log('Fallback a versión original del chatbot:', error);
    ChatBot = await import('./chatBot.js').then(module => module.default);
}

// Exportar componentes para uso global
window.AISEChat = ChatBot;

// Inicializar componentes cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComponents);
} else {
    initComponents();
}

function initComponents() {
    // Inicializar chatbot si existe el contenedor
    if (document.getElementById('chatbot-form') && !window.aiChatBot) {
        console.log('Inicializando chatbot desde aiseScriptsLoader');
        window.aiChatBot = new ChatBot();
    }
}
