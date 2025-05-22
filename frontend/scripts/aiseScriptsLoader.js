// AISE Technology - Script Loader
// Este archivo carga las versiones ofuscadas de los scripts de la aplicación

// Cargar chatBot
import ChatBot from './dist/chatBot.js';

// Exportar componentes para uso global
window.AISEChat = ChatBot;

// Inicializar componentes cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar chatbot si existe el contenedor
    if (document.getElementById('chatbot-form')) {
        window.aiChatBot = new ChatBot();
    }
});
