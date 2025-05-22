require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { Server } = require('ws');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuración de Express
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de archivos estáticos
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Crear servidor HTTP y WebSocket
const server = http.createServer(app);
const wss = new Server({ server, path: process.env.WS_PATH || '/ws' });

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Estado de las conexiones y conversaciones
const clients = new Set();
const conversations = new Map(); // Mapa para guardar el historial de conversaciones por cliente

// Rol del asistente desde variables de entorno
const ASSISTANT_ROLE = process.env.ASSISTANT_ROLE || 
  "Eres el asistente virtual de AISE Technology, una empresa de tecnología. Eres profesional y amable.";

// Configuración del modelo de IA
const getGeminiConfig = () => ({
  temperature: parseFloat(process.env.TEMPERATURE || 0.7),
  topK: parseInt(process.env.TOP_K || 40),
  topP: parseFloat(process.env.TOP_P || 0.95),
  maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || 1024),
  responseMimeType: 'text/plain',
});

/**
 * Inicializa un chat con el modelo de Gemini
 * @returns {object} Objeto de chat de Gemini
 */
async function initChatModel() {
  const model = genAI.getGenerativeModel({
    model: process.env.MODEL_NAME || 'gemini-pro',
    generationConfig: getGeminiConfig()
  });
  
  // Crear una sesión de chat
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: "Hola, ¿puedes presentarte?"
      },
      {
        role: "model",
        parts: `Hola, soy el asistente virtual de AISE Technology. Estoy aquí para responder tus preguntas sobre nuestros servicios y soluciones tecnológicas. ¿En qué puedo ayudarte hoy?`
      }
    ],
    generationConfig: getGeminiConfig()
  });
  
  // Configurar el rol del asistente
  if (ASSISTANT_ROLE) {
    try {
      await chat.sendMessage({
        role: "user",
        parts: [{text: ASSISTANT_ROLE}]
      });
      
      // Recibir y descartar la respuesta (solo para establecer el rol)
      await chat.sendMessage({
        role: "user", 
        parts: [{text: "Entendido. A partir de ahora responderás según ese rol."}]
      });
    } catch (error) {
      console.error("Error al establecer el rol del asistente:", error);
    }
  }
  
  return chat;
}

// Manejador de conexiones WebSocket
wss.on('connection', async (ws, req) => {
  // Generar un ID único para el cliente
  const clientId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  ws.clientId = clientId;
  
  // Registrar cliente nuevo
  clients.add(ws);
  console.log(`Cliente ${clientId} conectado. Total: ${clients.size}`);
  
  // Inicializar el chat con Gemini para este cliente
  try {
    const chat = await initChatModel();
    conversations.set(clientId, { chat, history: [] });
    
    // Enviar mensaje de bienvenida
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Conectado al asistente de IA de AISE Technology',
      clientId: clientId
    }));
  } catch (error) {
    console.error(`Error al inicializar chat para cliente ${clientId}:`, error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Error al inicializar el asistente de IA',
      details: error.message
    }));
  }

  // Manejar mensajes del cliente
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      // Validar el mensaje
      if (!message.text) {
        ws.send(JSON.stringify({ 
          type: 'error',
          error: 'Formato de mensaje inválido. Se requiere propiedad "text"'
        }));
        return;
      }

      // Enviar estado de "escribiendo" al cliente
      ws.send(JSON.stringify({ 
        type: 'status', 
        status: 'thinking' 
      }));
      
      // Obtener la conversación del cliente o crear una nueva si no existe
      if (!conversations.has(clientId)) {
        const chat = await initChatModel();
        conversations.set(clientId, { chat, history: [] });
      }
      
      const conversation = conversations.get(clientId);
      
      // Guardar mensaje del usuario en el historial
      conversation.history.push({
        role: 'user',
        text: message.text,
        timestamp: Date.now()
      });

      // Generar respuesta con Gemini AI usando el contexto de la conversación
      try {
        // Enviar el mensaje al chat de Gemini
        const result = await conversation.chat.sendMessage(message.text);
        const response = await result.response;
        const text = response.text();
        
        // Guardar respuesta del asistente en el historial
        conversation.history.push({
          role: 'assistant',
          text: text,
          timestamp: Date.now()
        });
        
        // Enviar respuesta al cliente
        ws.send(JSON.stringify({ 
          type: 'reply',
          message: text,
          conversationId: clientId,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error("Error en la generación de respuesta:", error);
        
        // Si hay un error con el chat, intentar reinicializarlo
        try {
          const newChat = await initChatModel();
          conversations.set(clientId, { 
            chat: newChat, 
            history: conversation.history 
          });
          
          // Reconstruir la conversación enviando los últimos mensajes (máximo 5 para evitar límites)
          const lastMessages = conversation.history.slice(-10);
          for (const msg of lastMessages) {
            if (msg.role === 'user') {
              await newChat.sendMessage(msg.text);
            }
          }
          
          // Volver a intentar con el mensaje actual
          const result = await newChat.sendMessage(message.text);
          const response = await result.response;
          const text = response.text();
          
          // Guardar respuesta en el historial
          conversation.history.push({
            role: 'assistant',
            text: text,
            timestamp: Date.now()
          });
          
          // Enviar respuesta al cliente
          ws.send(JSON.stringify({ 
            type: 'reply',
            message: text,
            conversationId: clientId,
            timestamp: Date.now()
          }));
          
        } catch (retryError) {
          ws.send(JSON.stringify({ 
            type: 'error',
            error: 'Error al generar respuesta. Se perdió parte del contexto.',
            details: retryError.message
          }));
        }
      }
    } catch (error) {
      console.error('Error en el procesamiento del mensaje:', error);
      ws.send(JSON.stringify({ 
        type: 'error',
        error: 'Error al procesar tu mensaje con la IA',
        details: error.message
      }));
    }
  });

  // Manejar desconexión del cliente
  ws.on('close', () => {
    // Eliminar cliente, pero mantener la conversación por un tiempo
    clients.delete(ws);
    
    // Establecer un temporizador para eliminar la conversación después de cierto tiempo
    setTimeout(() => {
      if (conversations.has(clientId)) {
        conversations.delete(clientId);
        console.log(`Conversación ${clientId} eliminada por inactividad`);
      }
    }, 30 * 60 * 1000); // 30 minutos
    
    console.log(`Cliente ${clientId} desconectado. Quedan: ${clients.size}`);
  });
});

// Ruta para verificar el estado del servidor
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clientsConnected: clients.size,
    activeConversations: conversations.size,
    environment: NODE_ENV,
    geminiApiStatus: !!process.env.GEMINI_API_KEY ? 'configured' : 'missing'
  });
});

// Middleware para ofuscación de código - Intercepta solicitudes de scripts
app.get('/scripts/:filename', (req, res, next) => {
  const filename = req.params.filename;
  if (!filename.endsWith('.js')) {
    return next();
  }
  
  // En producción, servir archivos ofuscados si existen
  if (isProd) {
    const ofuscatedPath = path.join(frontendPath, 'scripts/dist', filename);
    const originalPath = path.join(frontendPath, 'scripts', filename);
    
    // Verificar si existe la versión ofuscada
    fs.access(ofuscatedPath, fs.constants.F_OK, (err) => {
      if (!err) {
        // Servir la versión ofuscada
        res.setHeader('Content-Type', 'application/javascript');
        fs.createReadStream(ofuscatedPath).pipe(res);
      } else {
        // Si no existe versión ofuscada, continuar con el siguiente middleware
        next();
      }
    });
  } else {
    // En desarrollo, usar el flujo normal
    next();
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`WebSocket disponible en ws://localhost:${PORT}${process.env.WS_PATH || '/ws'}`);
  console.log(`Modo: ${NODE_ENV}`);
});

// Ruta para verificar el estado del servidor
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clientsConnected: clients.size,
    geminiApiStatus: !!process.env.GEMINI_API_KEY ? 'configured' : 'missing'
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`WebSocket disponible en ws://localhost:${PORT}${process.env.WS_PATH || '/ws'}`);
});

