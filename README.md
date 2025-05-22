# AISE Technology Website

![AISE Technology Logo](./frontend/assets/AISE%20LOGO.png)

## Descripción del Proyecto

Este repositorio contiene el sitio web oficial de AISE Technology, una empresa especializada en soluciones tecnológicas avanzadas. El proyecto incluye tanto el frontend como el backend, con un diseño moderno y un asistente de IA integrado para mejorar la experiencia del usuario.

## Estructura del Proyecto

```
AISE-Tech.github.io/
├── index.html                 # Punto de entrada principal
├── README.md                  # Este archivo
├── README-ASISTENTE-IA.md     # Documentación del asistente IA
├── .env                       # Variables de entorno (no incluido en el repositorio)
├── .env.example               # Plantilla de variables de entorno (sin claves reales)
├── .gitignore                 # Archivos y directorios ignorados por git
├── backend/                   # Servidor Node.js
│   ├── package.json           # Dependencias del backend
│   └── server.js              # Servidor Express y WebSocket
└── frontend/                  # Interfaz de usuario
    ├── index.html             # Página principal
    ├── assets/                # Recursos estáticos (imágenes, modelos 3D)
    ├── scripts/               # JavaScript del cliente
    │   ├── chatBot.js         # Módulo del asistente de IA
    │   ├── navigation.js      # Navegación del sitio
    │   └── robot-3d.js        # Visualización 3D
    └── styles/                # Hojas de estilo CSS
        ├── chat-ai.css        # Estilos del asistente de IA
        ├── robot-3d.css       # Estilos para visualización 3D
        └── styles.css         # Estilos generales
```

## Tecnologías Utilizadas

### Frontend
- HTML5, CSS3, JavaScript moderno (ES6+)
- Diseño responsivo con CSS Grid y Flexbox
- Visualización 3D con Three.js
- WebSockets para comunicación en tiempo real
- Reconocimiento de voz con la API Web Speech
- Ofuscación de código para protección contra ingeniería inversa

### Backend
- Node.js con Express
- WebSockets para comunicación en tiempo real
- Integración con Google Gemini AI para procesamiento de lenguaje natural
- Sistema de gestión de contexto para conversaciones persistentes
- Herramientas de construcción y ofuscación para protección del código

## Características Principales

### 1. Sitio Web Corporativo
- Diseño moderno y responsive
- Secciones informativas sobre servicios, equipo y proyectos
- Formulario de contacto

### 2. Asistente de IA Integrado
- Chatbot con inteligencia artificial usando Google Gemini
- Comunicación en tiempo real a través de WebSockets
- Reconocimiento de voz para interacción por voz
- Mantenimiento de contexto de conversación
- Personalización de la personalidad del asistente mediante roles

### 3. Visualización 3D
- Modelo 3D interactivo que representa la tecnología de la empresa
- Controles de cámara y animaciones

## Instalación y Uso

### Requisitos Previos
- Node.js (v16.x o superior)
- Cuenta de Google AI Studio para obtener una API key de Gemini

### Configuración
1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/AISE-Tech/AISE-Tech.github.io.git
   cd AISE-Tech.github.io
   ```

2. **Configurar variables de entorno**:
   ```bash
   # Copiar el archivo de ejemplo
   cp .env.example .env
   
   # Editar el archivo .env y agregar tus claves API
   # IMPORTANTE: Nunca subas tu archivo .env al repositorio
   ```

2. **Configurar variables de entorno**:
   - Crear un archivo `.env` en la raíz del proyecto basado en `.env.example`
   - Añadir tu API key de Google Gemini:
   ```
   GEMINI_API_KEY=tu_api_key_aquí
   ```

3. **Instalar dependencias del backend**:
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Ejecutar el servidor**:
   ```bash
   cd backend
   
   # Para desarrollo (sin ofuscación)
   npm run dev
   
   # Para producción (con ofuscación de código)
   npm run start:prod
   ```

5. **Acceder al sitio web**:
   - Abre un navegador y navega a `http://localhost:3000`

## Modos de Ejecución

El proyecto puede ejecutarse en dos modos:

### Modo Desarrollo
- Scripts sin ofuscar para facilitar la depuración
- Recarga automática del servidor con Nodemon
- Para ejecutar: `npm run dev` o `npm run start:dev`

### Modo Producción
- Scripts ofuscados para protección contra ingeniería inversa
- Optimizado para rendimiento y seguridad 
- Para ejecutar: `npm run start:prod`

Para construir sin iniciar el servidor:
```bash
# Construir para producción
npm run build:prod

# Construir para desarrollo
npm run build:dev
```

## Funcionalidades del Asistente IA

El proyecto incluye un avanzado asistente de IA con las siguientes capacidades:

- **Procesamiento de lenguaje natural**: El asistente comprende y responde consultas en lenguaje natural
- **Comunicación en tiempo real**: Respuestas instantáneas mediante WebSockets
- **Interfaz de voz**: Soporte para dictado por voz
- **Memoria y contexto**: El asistente mantiene el contexto completo de la conversación
- **Personalidad configurable**: El comportamiento del asistente se puede configurar mediante roles
- **Persistencia de sesiones**: Las conversaciones se guardan y pueden continuarse después

Para más detalles sobre el asistente IA, consulta [README-ASISTENTE-IA.md](./README-ASISTENTE-IA.md).

## Personalización

### Modificar la apariencia
Los estilos principales se encuentran en `frontend/styles/styles.css`. Las variables CSS al inicio del archivo permiten cambiar fácilmente los colores:

```css
:root {
    --primary: #cf3f2e;       /* Color principal */
    --primary-dark: #a32e20;  /* Versión oscura */
    --primary-light: #e76354; /* Versión clara */
    --secondary: #404040;     /* Color secundario */
    --accent: #f8c054;        /* Color de acento */
    /* ...más variables... */
}
```

### Configurar el asistente IA
Puedes modificar el comportamiento del asistente editando las variables en el archivo `.env`:

```
ASSISTANT_ROLE="Eres el asistente virtual de AISE Technology, una empresa especializada en soluciones tecnológicas..."
TEMPERATURE=0.7
MAX_OUTPUT_TOKENS=1024
```

### Personalizar la ofuscación de código
La configuración de ofuscación se encuentra en `backend/obfuscate.js`. Puedes ajustar los parámetros para cambiar el nivel de ofuscación:

```javascript
const obfuscationOptions = {
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.7,
    deadCodeInjection: true,
    // ...otras opciones
};
```

Para niveles más altos de protección, aumenta los valores de:
- `controlFlowFlatteningThreshold` (0.0-1.0)
- `deadCodeInjectionThreshold` (0.0-1.0)
- `stringArrayThreshold` (0.0-1.0)

## Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Realiza tus cambios
4. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
5. Haz push a la rama (`git push origin feature/AmazingFeature`)
6. Abre un Pull Request

## Contacto

AISE Technology - info@aisetech.com

Web: [https://aisetech.com](https://aisetech.com)

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

© AISE Technology, 2025. Todos los derechos reservados.