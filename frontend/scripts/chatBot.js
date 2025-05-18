/**
 * OptimusTech Chatbot Module
 * Manages the chat interface functionality including message display and voice recognition
 */
class ChatBot {
    constructor() {
        // UI Elements
        this.form = document.getElementById('chatbot-form');
        this.input = document.getElementById('chatbot-input');
        this.messages = document.getElementById('chatbot-messages');
        this.voiceBtn = document.getElementById('chatbot-voice-btn');

        // Voice recognition properties
        this.recognition = null;
        this.recognizing = false;

        // Initialize the chat interface
        this.init();
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
            this.input.value = '';
            // Placeholder bot response
            setTimeout(() => this.addBotMessage('Gracias por tu mensaje. Pronto me conectaré con una IA para responderte.'), 700);
        });

        // Initialize voice recognition if supported
        this.initVoiceRecognition();
    }

    /**
     * Add a user message to the chat
     * @param {string} text - The message text
     */
    addUserMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'message user';
        msg.setAttribute('role', 'status');
        msg.setAttribute('aria-live', 'polite');
        // Usar clase para el bubble
        msg.innerHTML = `<div class="message-bubble">${text}</div>`;
        this.messages.appendChild(msg);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    /**
     * Add a bot message to the chat
     * @param {string} text - The message text
     */
    addBotMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'message bot';
        msg.setAttribute('role', 'status');
        msg.setAttribute('aria-live', 'polite');
        // Usar clase para el bubble
        msg.innerHTML = `<div class="message-bubble">${text}</div>`;
        this.messages.appendChild(msg);
        this.messages.scrollTop = this.messages.scrollHeight;
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
                // Opcional: mostrar mensaje de error al usuario
                alert('Error en el reconocimiento de voz: ' + event.error);
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
     * Sugerencia: Mover los estilos en línea a clases CSS en styles.css para mantener el JS más limpio.
     * Sugerencia: Si el componente se destruye, remover los event listeners para evitar fugas de memoria.
     */
}

// Export the ChatBot class
export default ChatBot;