/**
 * Herramienta de ofuscación de código JavaScript para AISE Technology
 * 
 * Este script procesa los archivos JavaScript del frontend para ofuscarlos,
 * haciendo más difícil su análisis desde las herramientas de desarrollo.
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Configuración del entorno
const frontendDir = path.join(__dirname, '../frontend');
const scriptsDir = path.join(frontendDir, 'scripts');
const outputDir = path.join(frontendDir, 'scripts/dist');

// Asegurar que el directorio de salida existe
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Configuración de la ofuscación
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.7,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: 3000, // Debe ser un número positivo
    disableConsoleOutput: false, // Permite logs para depuración
    domainLock: [], // Aquí puedes agregar dominios específicos donde funcionará el código
    identifierNamesGenerator: 'hexadecimal',
    identifiersPrefix: 'aise_',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

/**
 * Ofusca un archivo JavaScript y guarda el resultado
 * @param {string} filePath - Ruta al archivo a ofuscar
 */
function obfuscateFile(filePath) {
    if (!filePath.endsWith('.js')) return;
    
    const fileName = path.basename(filePath);
    const outputPath = path.join(outputDir, fileName);
    
    console.log(`Ofuscando: ${fileName}...`);
    
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscationOptions).getObfuscatedCode();
        
        // Agregar comentario con información de protección y timestamp
        const currentDate = new Date().toISOString();
        const protectedCode = `/* 
 * AISE Technology - Código protegido
 * Generado: ${currentDate}
 * Este código está protegido contra ingeniería inversa.
 * Cualquier intento de desofuscación o uso no autorizado está prohibido.
 */
${obfuscatedCode}`;
        
        fs.writeFileSync(outputPath, protectedCode);
        console.log(`✅ Archivo ofuscado guardado en: ${outputPath}`);
    } catch (error) {
        console.error(`❌ Error al ofuscar ${fileName}:`, error);
    }
}

/**
 * Procesa todos los archivos en un directorio
 * @param {string} directoryPath - Ruta al directorio a procesar
 */
function processDirectory(directoryPath) {
    const files = fs.readdirSync(directoryPath);
    
    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile() && filePath.endsWith('.js')) {
            obfuscateFile(filePath);
        }
    }
}

// Función principal
function main() {
    console.log('🔒 Iniciando proceso de ofuscación de AISE Technology...');
    
    // Crear archivo de índice para importar los scripts ofuscados
    const indexContent = `// AISE Technology - Script Loader
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
`;
    
    fs.writeFileSync(path.join(scriptsDir, 'aiseScriptsLoader.js'), indexContent);
    console.log('✅ Archivo de carga de scripts creado');
    
    // Ofuscar todos los archivos JS en el directorio de scripts
    processDirectory(scriptsDir);
    
    console.log('✅ Proceso de ofuscación completado');
}

// Ejecutar el script
main();
