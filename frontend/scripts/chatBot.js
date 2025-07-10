/**
 * AISE Technology Chatbot Module
 * Manages the chat interface functionality including message display, voice recognition,
 * and communication with the Gemini AI backend via WebSocket
 */
class ChatBot {    constructor() {
        // UI Elements
        this.form = document.getElementById('chatbot-form');
        this.input = document.getElementById('chatbot-input');
        this.messages = document.getElementById('chatbot-messages');
        this.voiceBtn = document.getElementById('chatbot-voice-btn');
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'typing-indicator hidden';
        this.statusIndicator.innerHTML = '<span></span><span></span><span></span>';
        this.messages.appendChild(this.statusIndicator);

        // Voice recognition properties
        this.recognition = null;
        this.recognizing = false;

        // WebSocket connection
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 8;
        this.reconnectDelay = 1500;
        this.preferredPorts = [9001, 9002, 9003, 9004, 9005, 9000, 3000, 8080];
        this.currentPortIndex = 0;
        
        // Conversation management
        this.clientId = null;
        this.conversationHistory = [];
        this.maxStoredMessages = 50; // Número máximo de mensajes para almacenar localmente

        // Initialize the chat interface
        this.init();
        
        // Cargar historial de chat del almacenamiento local si existe
        this.loadChatHistory();
    }

    /**
     * Initialize the chatbot
     */
    init() {
        // Set up form submission event
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = this.input.value.trim();
            if (!text) return;
            
            this.addUserMessage(text);
            this.sendMessageToAI(text);
            this.input.value = '';
        });

        // Initialize voice recognition if supported
        this.initVoiceRecognition();
        
        // Initialize WebSocket connection
        this.connectToWebSocket();
    }
    
    /**
     * Guardar historial de chat en almacenamiento local
     */
    saveChatHistory() {
        try {
            // Solo guardar los últimos N mensajes para evitar exceder el límite de localStorage
            const historyToSave = this.conversationHistory.slice(-this.maxStoredMessages);
            localStorage.setItem('aiseChat_history', JSON.stringify(historyToSave));
            localStorage.setItem('aiseChat_clientId', this.clientId || '');
        } catch (error) {
            console.error('Error al guardar historial de chat:', error);
        }
    }
    
    /**
     * Cargar historial de chat desde almacenamiento local
     */
    loadChatHistory() {
        try {
            const savedClientId = localStorage.getItem('aiseChat_clientId');
            const savedHistory = localStorage.getItem('aiseChat_history');
            
            if (savedClientId) {
                this.clientId = savedClientId;
            }
            
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                this.conversationHistory = parsedHistory;
                
                // Mostrar mensajes anteriores en la interfaz
                this.messages.innerHTML = ''; // Limpiar mensajes actuales
                this.messages.appendChild(this.statusIndicator); // Volver a añadir el indicador
                
                parsedHistory.forEach(msg => {
                    if (msg.role === 'user') {
                        this.addUserMessage(msg.text, false);
                    } else if (msg.role === 'assistant') {
                        this.addBotMessage(msg.text, false);
                    } else if (msg.role === 'system') {
                        this.showSystemMessage(msg.text, false);
                    }
                });
                
                // Mostrar mensaje de continuación
                if (parsedHistory.length > 0) {
                    this.showSystemMessage('Conversación recuperada. Puedes continuar donde lo dejaste.', true);
                }
            } else {
                // Si no hay historial, añadir mensaje de bienvenida inicial
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'message bot';
                welcomeMsg.setAttribute('role', 'status');
                welcomeMsg.setAttribute('aria-live', 'polite');
                welcomeMsg.innerHTML = `<div class="message-bubble">
                    ¡Hola! Soy el asistente de IA de AISE Technology 🤖<br>
                    ¿En qué puedo ayudarte hoy?
                </div>`;
                this.messages.appendChild(welcomeMsg);
                
                // Añadir al historial
                this.conversationHistory.push({
                    role: 'assistant',
                    text: '¡Hola! Soy el asistente de IA de AISE Technology 🤖\n¿En qué puedo ayudarte hoy?',
                    timestamp: Date.now()
                });
                this.saveChatHistory();
            }
        } catch (error) {
            console.error('Error al cargar historial de chat:', error);
        }
    }

    /**
     * Connect to the WebSocket server
     */    connectToWebSocket() {
        // Determine the WebSocket URL based on the current page location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let currentPort = '';
        
        if (window.location.hostname === '' || window.location.hostname === 'localhost') {
            // Si estamos en desarrollo local, usamos uno de los puertos preferidos
            const urlPort = new URLSearchParams(window.location.search).get('port');
            
            if (urlPort) {
                // Si se especificó un puerto en la URL, usamos ese
                currentPort = urlPort;
            } else {
                // Rotamos por los puertos preferidos
                currentPort = this.preferredPorts[this.currentPortIndex];
            }
            
            console.log(`Modo desarrollo: conectando a puerto ${currentPort} (intento #${this.currentPortIndex + 1})`);
        } else {
            // En producción, usamos el mismo puerto que el sitio web o uno de los puertos estándar
            currentPort = window.location.port || this.preferredPorts[this.currentPortIndex];
        }
        
        const host = window.location.hostname === '' ? `localhost:${currentPort}` : 
                    (window.location.port ? window.location.host : `${window.location.hostname}:${currentPort}`);
                    
        const wsUrl = `${protocol}//${host}/ws`;
        console.log('Intentando conectar al WebSocket en:', wsUrl);
        
        // Crear la nueva conexión WebSocket
        this.socket = new WebSocket(wsUrl);
        
        // WebSocket event handlers
        this.socket.onopen = this.handleSocketOpen.bind(this);
        this.socket.onmessage = this.handleSocketMessage.bind(this);
        this.socket.onclose = this.handleSocketClose.bind(this);
        this.socket.onerror = this.handleSocketError.bind(this);
    }
    
    /**
     * Handle WebSocket connection open
     */    handleSocketOpen() {
        console.log('Conexión WebSocket establecida correctamente');
        console.log('URL de conexión:', this.socket.url);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Opcional: notificar al usuario que está conectado al asistente
        if (this.conversationHistory.length === 0) {
            this.showSystemMessage('Conectado al asistente de IA de AISE Technology');
        }
    }
    
    /**
     * Handle WebSocket message received
     */
    handleSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            // Manejar diferentes tipos de mensajes
            switch (data.type) {
                case 'connection':
                    // Guardar el ID de cliente asignado por el servidor
                    if (data.clientId && !this.clientId) {
                        this.clientId = data.clientId;
                        this.saveChatHistory();
                    }
                    break;
                    
                case 'reply':
                    // Ocultar indicador de "escribiendo"
                    this.hideTypingIndicator();
                    // Mostrar respuesta de la IA
                    this.addBotMessage(data.message);
                    break;
                    
                case 'status':
                    if (data.status === 'thinking') {
                        this.showTypingIndicator();
                    } else {
                        this.hideTypingIndicator();
                    }
                    break;
                    
                case 'error':
                    this.hideTypingIndicator();
                    this.showErrorMessage(data.error);
                    
                    // Almacenar errores importantes en el historial
                    if (data.error.includes('contexto')) {
                        this.conversationHistory.push({
                            role: 'system',
                            text: `Error: ${data.error}`,
                            timestamp: Date.now()
                        });
                        this.saveChatHistory();
                    }
                    break;
                
                default:
                    console.warn('Mensaje de tipo desconocido:', data);
            }
        } catch (error) {
            console.error('Error al procesar mensaje del servidor:', error);
        }
    }
      /**
     * Handle WebSocket connection close
     */
    handleSocketClose(event) {
        this.isConnected = false;
        console.log(`Conexión WebSocket cerrada: ${event.code} ${event.reason}`);
        
        // Intentar reconectar
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            // Rotar al siguiente puerto si estamos en local y hay un error de conexión
            if (window.location.hostname === '' || window.location.hostname === 'localhost') {
                this.currentPortIndex = (this.currentPortIndex + 1) % this.preferredPorts.length;
            }
            
            const delay = this.reconnectDelay;
            console.log(`Intentando reconectar en ${delay/1000} segundos (puerto: ${this.preferredPorts[this.currentPortIndex]})...`);
            
            setTimeout(() => {
                this.connectToWebSocket();
            }, delay);
        } else {
            this.showSystemMessage('No se pudo conectar al servidor después de varios intentos. Por favor, asegúrate de que el servidor esté funcionando y recarga la página.');
        }
    }
    
    /**
     * Handle WebSocket error
     */
    handleSocketError(error) {
        console.error('Error en la conexión WebSocket:', error);
        
        // Log connection details for debugging
        console.error('Detalles de conexión WebSocket:');
        console.error('- URL: ' + this.socket.url);
        console.error('- Estado actual: ' + this.socket.readyState);
        console.error('- Intentos de reconexión: ' + this.reconnectAttempts);
        console.error('- Puerto actual: ' + this.preferredPorts[this.currentPortIndex]);
        
        // Solo mostramos un mensaje de error al usuario después de varios intentos
        if (this.reconnectAttempts > 2) {
            this.showErrorMessage('Error de conexión al servidor. Intentando reconectar...');
        }
        
        // Intentar reconectar automáticamente después de un tiempo, rotando puertos
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            // Rotar al siguiente puerto en la lista
            if (window.location.hostname === '' || window.location.hostname === 'localhost') {
                this.currentPortIndex = (this.currentPortIndex + 1) % this.preferredPorts.length;
            }
            
            const delay = Math.min(1000 + (500 * this.reconnectAttempts), 5000);
            
            setTimeout(() => {
                console.log(`Intento de reconexión ${this.reconnectAttempts + 1} de ${this.maxReconnectAttempts} - Puerto: ${this.preferredPorts[this.currentPortIndex]}`);
                this.connectToWebSocket();
            }, delay);
        }
    }
    
    /**
     * Send a message to the AI backend via WebSocket
     */
    sendMessageToAI(text) {
        if (!this.isConnected) {
            this.showErrorMessage('No hay conexión con el servidor. Reconectando...');
            this.connectToWebSocket();
            return;
        }
        
        // Mostrar indicador de "pensando"
        this.showTypingIndicator();
        
        // Enviar mensaje al servidor
        this.socket.send(JSON.stringify({
            text: text,
            clientId: this.clientId,
            timestamp: Date.now()
        }));
    }

    /**
     * Show typing indicator in chat
     */
    showTypingIndicator() {
        this.statusIndicator.classList.remove('hidden');
        this.messages.scrollTop = this.messages.scrollHeight;
    }
    
    /**
     * Hide typing indicator in chat
     */
    hideTypingIndicator() {
        this.statusIndicator.classList.add('hidden');
    }

    /**
     * Add a user message to the chat
     * @param {string} text - The message text
     * @param {boolean} saveToHistory - Whether to save to history (default: true)
     */
    addUserMessage(text, saveToHistory = true) {
        const msg = document.createElement('div');
        msg.className = 'message user';
        msg.setAttribute('role', 'status');
        msg.setAttribute('aria-live', 'polite');
        // Usar clase para el bubble
        msg.innerHTML = `<div class="message-bubble">${this.formatMessage(text)}</div>`;
        this.messages.appendChild(msg);
        this.messages.scrollTop = this.messages.scrollHeight;
        
        // Guardar en el historial
        if (saveToHistory) {
            this.conversationHistory.push({
                role: 'user',
                text: text,
                timestamp: Date.now()
            });
            this.saveChatHistory();
        }
    }

    /**
     * Add a bot message to the chat
     * @param {string} text - The message text
     * @param {boolean} saveToHistory - Whether to save to history (default: true)
     */
    addBotMessage(text, saveToHistory = true) {
        const msg = document.createElement('div');
        msg.className = 'message bot';
        msg.setAttribute('role', 'status');
        msg.setAttribute('aria-live', 'polite');
        // Usar clase para el bubble
        msg.innerHTML = `<div class="message-bubble">${this.formatMessage(text)}</div>`;
        this.messages.appendChild(msg);
        this.messages.scrollTop = this.messages.scrollHeight;
        
        // Guardar en el historial
        if (saveToHistory) {
            this.conversationHistory.push({
                role: 'assistant',
                text: text,
                timestamp: Date.now()
            });
            this.saveChatHistory();
        }
    }
    
    /**
     * Show a system message in the chat
     * @param {string} text - The message text
     * @param {boolean} saveToHistory - Whether to save to history (default: true)
     */
    showSystemMessage(text, saveToHistory = true) {
        const msg = document.createElement('div');
        msg.className = 'message system';
        msg.setAttribute('role', 'status');
        msg.setAttribute('aria-live', 'polite');
        msg.innerHTML = `<div class="message-bubble system">${text}</div>`;
        this.messages.appendChild(msg);
        this.messages.scrollTop = this.messages.scrollHeight;
        
        // Guardar en el historial
        if (saveToHistory) {
            this.conversationHistory.push({
                role: 'system',
                text: text,
                timestamp: Date.now()
            });
            this.saveChatHistory();
        }
    }
    
    /**
     * Show an error message in the chat
     * @param {string} text - The message text
     */
    showErrorMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'message error';
        msg.setAttribute('role', 'status');
        msg.setAttribute('aria-live', 'assertive');
        msg.innerHTML = `<div class="message-bubble error">${text}</div>`;
        this.messages.appendChild(msg);
        this.messages.scrollTop = this.messages.scrollHeight;
    }
    
    /**
     * Format message text with markdown-like support
     * @param {string} text - The message text
     * @returns {string} - Formatted HTML
     */
    formatMessage(text) {
        // Convertir saltos de línea a <br>
        text = text.replace(/\n/g, '<br>');
        
        // Resaltar código en línea
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Resaltar enlaces
        text = text.replace(
            /\b(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        return text;
    }

    /**
     * Initialize voice recognition functionality
     */
    initVoiceRecognition() {
        // Soporte para SpeechRecognition estándar y webkit
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'es-ES';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            // Set up recognition events
            this.recognition.onstart = () => {
                this.recognizing = true;
                this.voiceBtn.style.background = 'var(--primary-light, #e6f0fa)';
                this.voiceBtn.style.color = 'var(--primary, #0057b8)';
            };

            this.recognition.onend = () => {
                this.recognizing = false;
                this.voiceBtn.style.background = 'var(--primary, #0057b8)';
                this.voiceBtn.style.color = '#fff';
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.input.value = transcript;
                this.input.focus();
            };

            this.recognition.onerror = (event) => {
                this.recognizing = false;
                this.voiceBtn.style.background = 'var(--primary, #0057b8)';
                this.voiceBtn.style.color = '#fff';
                console.error('Error en el reconocimiento de voz:', event.error);
            };

            // Set up voice button event
            this.voiceBtn.addEventListener('click', () => {
                if (this.recognizing) {
                    this.recognition.stop();
                } else {
                    this.recognition.start();
                }
            });
        } else {
            this.voiceBtn.disabled = true;
            this.voiceBtn.title = "Tu navegador no soporta reconocimiento de voz";
        }
    }
    
    /**
     * Limpiar historial de chat
     */
    clearChatHistory() {
        // Limpiar mensajes de la interfaz
        this.messages.innerHTML = '';
        this.messages.appendChild(this.statusIndicator);
        
        // Limpiar historial en memoria y almacenamiento
        this.conversationHistory = [];
        localStorage.removeItem('aiseChat_history');
        
        // Mensaje de reinicio
        this.showSystemMessage('El historial de chat ha sido borrado.');
        
        // Mensaje de bienvenida
        this.addBotMessage('¡Hola! Soy el asistente de IA de AISE Technology 🤖\n¿En qué puedo ayudarte hoy?');
    }
    
    /**
     * Cleanup before destroying the component
     */
    destroy() {
        // Limpiar event listeners
        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit);
        }
        
        if (this.voiceBtn && this.recognition) {
            this.voiceBtn.removeEventListener('click', this.handleVoiceClick);
        }
        
        // Cerrar conexión WebSocket
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Export the ChatBot class
export default ChatBot;