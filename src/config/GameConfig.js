/**
 * 🎮 PROJECT ARA - GAME CONFIGURATION
 * Configuración principal del juego optimizada para ritmo frenético
 */

export const GAME_CONFIG = {
    // Configuración del mundo
    world: {
        width: window.innerWidth,
        height: window.innerHeight,
        planetCount: 25,
        minPlanetDistance: 80,
        margin: 100
    },

    // Configuración de gameplay
    gameplay: {
        fleetSendPercentage: 0.6,     // 60% de naves por defecto
        gameSpeed: 1.0,               // Multiplicador de velocidad
        autoSave: true,               // Guardado automático
        pauseOnFocusLoss: true        // Pausar al perder foco
    },

    // Configuración de rendimiento
    performance: {
        targetFPS: 60,                // FPS objetivo
        maxFleets: 150,               // Máximo flotas simultáneas
        maxParticles: 500,            // Máximo partículas
        cullDistance: 50,             // Distancia para culling
        updateInterval: 16            // ms entre updates (60 FPS)
    },

    // Configuración de debug
    debug: {
        enabled: false,               // Debug mode por defecto
        showFPS: true,                // Mostrar FPS
        showStats: true,              // Mostrar estadísticas
        logEvents: false,             // Log de eventos
        showHitboxes: false           // Mostrar hitboxes
    }
};

export default GAME_CONFIG; 