/**
 * Script de construcción para AISE Technology
 * 
 * Este script prepara la aplicación para producción:
 * 1. Ofusca los archivos JavaScript
 * 2. Minimiza CSS (si se añade en el futuro)
 * 3. Genera versiones ofuscadas de la API
 * 
 * Uso: node build.js [--no-obfuscate] [--env=production|development]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { argv } = process;

// Analizar argumentos
const args = argv.slice(2);
const skipObfuscation = args.includes('--no-obfuscate');
const envArg = args.find(arg => arg.startsWith('--env='));
const env = envArg ? envArg.split('=')[1] : 'production';

// Configuración
const rootDir = path.join(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const distDir = path.join(frontendDir, 'scripts/dist');

// Función para crear directorios si no existen
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
}

// Función para actualizar el archivo .env
function updateEnvFile() {
  const envPath = path.join(rootDir, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Actualizar o agregar NODE_ENV
    if (envContent.includes('NODE_ENV=')) {
      envContent = envContent.replace(/NODE_ENV=\w+/, `NODE_ENV=${env}`);
    } else {
      envContent += `\nNODE_ENV=${env}\n`;
    }
  } else {
    envContent = `NODE_ENV=${env}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Archivo .env actualizado: NODE_ENV=${env}`);
}

// Función para modificar index.html para cargar scripts ofuscados
function updateIndexHtml() {
  const indexPath = path.join(frontendDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ No se encuentra el archivo index.html');
    return;
  }
  
  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Buscar scripts existentes
  const scriptRegex = /<script.*?src="\/frontend\/scripts\/([^"]+)".*?><\/script>/g;
  const scriptMatches = [...htmlContent.matchAll(scriptRegex)];
  
  if (env === 'production') {
    // Reemplazar con el cargador de scripts ofuscados
    if (!htmlContent.includes('aiseScriptsLoader.js')) {
      // Buscar donde están los scripts actuales y agregar el cargador
      const lastScriptMatch = scriptMatches[scriptMatches.length - 1];
      if (lastScriptMatch) {
        const insertPosition = lastScriptMatch.index + lastScriptMatch[0].length;
        const loaderScript = '\n    <!-- Cargador de scripts ofuscados -->\n    <script type="module" src="/frontend/scripts/aiseScriptsLoader.js"></script>';
        
        htmlContent = 
          htmlContent.slice(0, insertPosition) + 
          loaderScript + 
          htmlContent.slice(insertPosition);
          
        console.log('✅ Cargador de scripts ofuscados añadido a index.html');
      }
    }
  } else {
    // Remover el cargador de scripts ofuscados en modo desarrollo
    htmlContent = htmlContent.replace(/\n\s*<!-- Cargador de scripts ofuscados -->\n\s*<script.*?aiseScriptsLoader\.js.*?><\/script>/s, '');
    console.log('✅ Cargador de scripts ofuscados removido de index.html');
  }
  
  fs.writeFileSync(indexPath, htmlContent);
}

// Función principal
async function build() {
  console.log(`🔨 Iniciando construcción en modo: ${env}`);
  
  // Actualizar .env
  updateEnvFile();
  
  // Crear directorios necesarios
  ensureDirectoryExists(distDir);
  
  // Ofuscar código si es necesario
  if (!skipObfuscation && env === 'production') {
    console.log('🔒 Ofuscando código JavaScript...');
    try {
      execSync('node obfuscate.js', { stdio: 'inherit' });
      console.log('✅ Código ofuscado correctamente');
    } catch (error) {
      console.error('❌ Error durante la ofuscación:', error.message);
      process.exit(1);
    }
  } else if (env === 'development') {
    console.log('⏩ Saltando ofuscación en modo desarrollo');
  } else {
    console.log('⏩ Ofuscación omitida por argumento --no-obfuscate');
  }
  
  // Actualizar index.html para cargar scripts apropiados
  updateIndexHtml();
  
  console.log(`✨ Construcción completada para entorno: ${env}`);
  console.log(`👉 Ejecuta 'npm start' para iniciar el servidor en modo ${env}`);
}

// Ejecutar build
build().catch(err => {
  console.error('❌ Error durante la construcción:', err);
  process.exit(1);
});
