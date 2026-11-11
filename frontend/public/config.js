/**
 * Configuración dinámica del entorno en tiempo de ejecución.
 * Puedes editar este archivo directamente en la carpeta compilada 'dist/config.js'
 * SIN necesidad de volver a compilar el proyecto.
 */
window.__APP_CONFIG__ = {
  // Detectar automáticamente si se ejecuta en local o en servidor de producción
  API_URL: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? '/api'
    : 'https://apitriaje.semillaperu.org'
};
