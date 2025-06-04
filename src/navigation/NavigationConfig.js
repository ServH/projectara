/**
 * 🧭 GALCON GAME - CONFIGURACIÓN DE NAVEGACIÓN INTELIGENTE
 * Sistema de navegación con evitación de obstáculos y llegada realista
 * MILESTONE 2.3: Navegación inteligente con radio de entrada variable
 */

export const NAVIGATION_CONFIG = {
    // 🎯 Detección de obstáculos
    obstacleDetection: {
        enabled: true,                  // Siempre activa
        updateInterval: 30,             // Frames entre actualizaciones (configurable)
        detectionRadius: 50,            // Radio de detección alrededor de planetas
        avoidanceDistance: 80,          // Distancia mínima para evitar planetas
        minPlanetSize: 20,             // Tamaño mínimo de planeta para considerar obstáculo
        routeBuffer: 15                // Buffer adicional alrededor de planetas
    },

    // 🎯 Radio de entrada variable (NUEVO - Mayor realismo)
    arrivalSystem: {
        enabled: true,                  // Activar sistema de llegada realista
        baseRadius: {
            min: 10,                    // Radio mínimo desde el borde
            max: 25,                    // Radio máximo desde el borde
            randomFactor: 0.8           // Factor de aleatoriedad (0-1) - MÁS variación
        },
        spreadAngle: Math.PI * 0.6,    // Ángulo de dispersión MÁS AMPLIO para flotas grandes
        individualVariation: true      // Cada nave tiene su propio punto de llegada
    },

    // 🎨 Visualización de trayectorias
    visualization: {
        showTrajectories: true,         // Mostrar líneas de trayectoria
        trajectoryOpacity: 0.8,         // Más opaco para mejor visibilidad
        trajectoryColor: '#ffffff',     // Color BLANCO para máxima visibilidad
        trajectoryWidth: 2,             // Más grueso para mejor visibilidad
        updateFrequency: 5,             // Actualizar visualización cada N frames
        fadeOutTime: 2000              // Tiempo de desvanecimiento (ms)
    },

    // ⚡ Optimización de rendimiento
    performance: {
        maxCalculationsPerFrame: 10,    // Limitar cálculos por frame
        enableBatching: true,           // Procesar naves en lotes
        batchSize: 5,                   // Naves por lote
        cacheTimeout: 3000,             // Cache de rutas (ms)
        enableSpatialOptimization: true, // Usar spatial grid para optimizar
        cullingDistance: 1000           // No calcular para naves muy lejanas
    },

    // 🔧 Parámetros de navegación
    navigation: {
        recalculateOnObstacle: true,    // Recalcular ruta al detectar obstáculo
        smoothingFactor: 0.1,           // Suavizado de cambios de dirección
        anticipationDistance: 100,      // Distancia de anticipación para cambios
        maxDeviationAngle: Math.PI / 3, // Máximo ángulo de desviación
        returnToRouteDistance: 50       // Distancia para volver a ruta original
    },

    // 🐛 Debug y testing
    debug: {
        enabled: true,                  // Activar logs de debug
        visualizeDetection: true,       // Mostrar áreas de detección
        logObstacles: true,             // Log cuando se detecten obstáculos
        showCalculationTime: true,      // Mostrar tiempo de cálculos
        highlightActiveFleets: true     // Resaltar flotas con navegación activa
    }
};

/**
 * 🎛️ Funciones de configuración dinámica
 */
export class NavigationConfigManager {
    static updateInterval(frames) {
        NAVIGATION_CONFIG.obstacleDetection.updateInterval = Math.max(1, frames);
        console.log(`🧭 Intervalo de actualización: ${frames} frames`);
    }

    static setVisualization(enabled) {
        NAVIGATION_CONFIG.visualization.showTrajectories = enabled;
        console.log(`🎨 Visualización de trayectorias: ${enabled ? 'ON' : 'OFF'}`);
    }

    static setDebugMode(enabled) {
        NAVIGATION_CONFIG.debug.enabled = enabled;
        NAVIGATION_CONFIG.debug.visualizeDetection = enabled;
        NAVIGATION_CONFIG.debug.logObstacles = enabled;
        console.log(`🐛 Modo debug navegación: ${enabled ? 'ON' : 'OFF'}`);
    }

    static getPerformanceConfig() {
        return {
            maxCalcsPerFrame: NAVIGATION_CONFIG.performance.maxCalculationsPerFrame,
            batchSize: NAVIGATION_CONFIG.performance.batchSize,
            updateInterval: NAVIGATION_CONFIG.obstacleDetection.updateInterval
        };
    }

    static getArrivalConfig() {
        return {
            minRadius: NAVIGATION_CONFIG.arrivalSystem.baseRadius.min,
            maxRadius: NAVIGATION_CONFIG.arrivalSystem.baseRadius.max,
            randomFactor: NAVIGATION_CONFIG.arrivalSystem.baseRadius.randomFactor,
            spreadAngle: NAVIGATION_CONFIG.arrivalSystem.spreadAngle
        };
    }
}

export default NAVIGATION_CONFIG; 