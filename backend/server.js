const express = require('express');
const http = require('http');
const { Server } = require('ws');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Reemplaza esto con tu API Key de Google Gemini
const GEMINI_API_KEY = 'TU_API_KEY_AQUI';

const server = http.createServer(app);
const wss = new Server({ server });

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

wss.on('connection', (ws) => {
    ws.on('message', async (data) => {
        try {
            const { message } = JSON.parse(data);
            if (!message) {
                ws.send(JSON.stringify({ error: 'Mensaje requerido' }));
                return;
            }

            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(message);
            const response = await result.response;
            const text = response.text();

            ws.send(JSON.stringify({ reply: text }));
        } catch (error) {
            ws.send(JSON.stringify({ error: 'Error al comunicarse con Gemini IA', details: error.message }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor WebSocket escuchando en http://localhost:${PORT}`);
});

