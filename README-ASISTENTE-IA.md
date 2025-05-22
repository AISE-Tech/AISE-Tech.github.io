# Asistente IA AISE Technology

Este proyecto implementa un asistente de IA usando Google Gemini AI con comunicación en tiempo real entre el frontend y el backend a través de WebSockets.

## Estructura del Proyecto

- **🟢 Frontend**: Interfaz de usuario basada en HTML, CSS y JavaScript
  - Scripts de navegación, chatbot y visualización 3D
  - Módulo de chat con soporte para voz y comunicación WebSocket
  - Almacenamiento local de conversaciones para persistencia entre sesiones
  
- **🟠 Backend**: Servidor Node.js con Express y WebSockets
  - Integración con la API de Google Gemini
  - Comunicación en tiempo real con el frontend
  - Gestión de contexto de conversación con memoria persistente
  - Sistema de roles y personalización del asistente

## Requisitos

- Node.js 16.x o superior
- Una API key de Google Gemini

## Instalación

1. **Configurar variables de entorno**:
   - Renombra o copia el archivo `.env` y configura tus claves:
   ```
   GEMINI_API_KEY=tu_api_key_aquí
   ```

2. **Instalar dependencias del backend**:
   ```bash
   cd backend
   npm install
   ```

3. **Ejecutar el servidor**:
   ```bash
   npm run dev  # Modo desarrollo con recarga automática
   # o
   npm start    # Modo producción
   ```

4. **Acceder a la aplicación**:
   - Abre un navegador y accede a `http://localhost:3000`

## Funcionalidades del Asistente IA

- **Procesamiento de lenguaje natural**: Responde a preguntas y consultas del usuario
- **Comunicación en tiempo real**: WebSockets para respuestas instantáneas
- **Interfaz de voz**: Reconocimiento de voz para interactuar con la IA
- **Indicador de estado**: Muestra cuando la IA está "pensando"
- **Formato de mensajes**: Soporte básico para código, enlaces y formato de texto
- **Memoria y contexto**: El asistente mantiene el contexto de toda la conversación
- **Personalidad configurable**: Sistema de roles para definir la personalidad del asistente
- **Persistencia de conversaciones**: Las conversaciones se guardan localmente y se recuperan al volver

## Personalización del Asistente

### Configuración del Rol

Puedes personalizar el comportamiento del asistente modificando la variable `ASSISTANT_ROLE` en el archivo `.env`:

```
ASSISTANT_ROLE="Eres el asistente virtual de AISE Technology, especializado en..."
```

Esta configuración define la personalidad, el tono y el enfoque del asistente al responder preguntas.

### Parámetros del Modelo

Modifica los parámetros en el archivo `.env`:
- `TEMPERATURE`: Controla la creatividad (0.0-1.0)
- `TOP_K`, `TOP_P`: Controlan la diversidad de respuestas
- `MAX_OUTPUT_TOKENS`: Limita la longitud de las respuestas

## Gestión de Contexto

El sistema implementa dos niveles de almacenamiento de contexto:

1. **Servidor (backend)**:
   - Mantiene sesiones de chat persistentes para cada cliente
   - Conserva el historial de mensajes para mantener coherencia en las respuestas
   - Maneja la reconexión y recuperación de contexto

2. **Cliente (frontend)**:
   - Guarda localmente las conversaciones en localStorage
   - Recupera automáticamente el historial al recargar la página
   - Permite continuar conversaciones pasadas

## Solución de problemas

- **Error de conexión WebSocket**:
  - Verifica que el servidor esté en ejecución
  - Comprueba la configuración del firewall
  
- **Error de la API de Gemini**:
  - Verifica que la API key sea válida
  - Comprueba la cuota de uso de la API

- **Pérdida de contexto en conversaciones largas**:
  - El sistema implementa recuperación automática de contexto
  - En caso de errores, intenta reconectar y reconstruir el historial
  - Para conversaciones muy largas, puede ser necesario reducir el historial

## Mantenimiento

- El sistema implementa reconexión automática en caso de fallo
- Las sesiones inactivas se limpian después de 30 minutos para liberar recursos
- Los archivos de registro se pueden encontrar en la carpeta `logs` (crear si no existe)

---

Desarrollado por AISE Technology, 2025.
