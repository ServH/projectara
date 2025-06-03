/**
 * 🌊 CONFIGURACIÓN DE MOVIMIENTO ORGÁNICO
 * Parámetros validados en el Hito 2 - Movimiento de Flota Orgánica
 * 
 * Estos valores han sido exhaustivamente testados y optimizados para:
 * - Rendimiento: 60 FPS con 300+ naves simultáneas
 * - Naturalidad: Movimiento orgánico y vivo
 * - Cohesión: Sensación de flota unificada
 * - Individualidad: Cada nave única pero coordinada
 */

export const ORGANIC_MOVEMENT_CONFIG = {
    // 🚀 MOVIMIENTO BASE
    movement: {
        // Fases de aceleración/desaceleración
        accelPhase: 0.2,        // 20% del viaje para acelerar/desacelerar
        accelFactor: 2.0,       // Multiplicador de velocidad en aceleración
        decelFactor: 0.3,       // Multiplicador mínimo en desaceleración
        
        // Velocidades (píxeles por segundo)
        maxSpeed: 120,          // Velocidad máxima base
        minSpeed: 20,           // Velocidad mínima garantizada
        
        // Easing y suavizado
        useEasing: true,        // Aplicar easing suave a la interpolación
        easingFunction: 'easeInOutQuad' // Tipo de easing
    },

    // 🌊 FORMACIÓN DE FLOTA
    formation: {
        // Disposición circular
        baseRadius: 30,         // Radio base de formación circular
        radiusSpread: 15,       // Variación aleatoria del radio (+/-)
        
        // Timing de lanzamiento
        launchSpread: 300,      // Variación en tiempo de lanzamiento (ms)
        maxLaunchDelay: 1000,   // Delay máximo entre naves (ms)
        
        // Escalado según tamaño de flota
        scaleWithFleetSize: true,
        maxFormationRadius: 80,  // Radio máximo para flotas grandes
        minFormationRadius: 10   // Radio mínimo para flotas pequeñas
    },

    // ✨ VARIACIÓN INDIVIDUAL
    individual: {
        // Características personales únicas
        personalAmplitude: 0.15,    // Amplitud base de variación personal
        personalFrequency: 0.002,   // Frecuencia base de oscilación personal
        
        // Rangos de variación
        amplitudeRange: [0.5, 1.5], // Multiplicador para amplitud personal
        frequencyRange: [0.5, 2.0], // Multiplicador para frecuencia personal
        speedVariation: 0.2,         // Variación de velocidad entre naves (+/-)
        
        // Micro-desviaciones para movimiento vivo
        microDeviationRange: 1.5,    // Rango de micro-desviaciones (px)
        microFrequencyMultiplier: 2.0, // Multiplicador de frecuencia para micro-desviaciones
    },

    // 🎨 EFECTOS VISUALES
    visual: {
        // Opacidad dinámica
        baseOpacity: 0.9,           // Opacidad base de las naves
        opacityVariation: 0.3,      // Variación de opacidad para efecto "vivo"
        opacityFrequency: 0.003,    // Frecuencia de variación de opacidad
        
        // Tamaño dinámico
        enableSizeVariation: true,   // Activar variación de tamaño
        sizeVariationAmount: 0.3,    // Cantidad de variación de tamaño
        sizeUpdateThreshold: 0.05,   // Umbral para actualizar tamaño (optimización)
        
        // Colores y efectos
        enableColorPulse: false,     // Pulso de color (desactivado por rendimiento)
        trailLength: 8,              // Longitud del trail de las naves
        trailFadeTime: 2000          // Tiempo de fade del trail (ms)
    },

    // ⚡ OPTIMIZACIÓN Y RENDIMIENTO
    performance: {
        // Límites de rendimiento
        maxSimultaneousFleets: 50,   // Máximo número de flotas simultáneas
        maxShipsPerFleet: 500,       // Máximo número de naves por flota
        
        // Optimizaciones
        updateFrequency: 60,         // FPS objetivo
        batchUpdateSize: 10,         // Naves a actualizar por batch
        enableLOD: true,             // Level of Detail para flotas lejanas
        lodDistance: 500,            // Distancia para aplicar LOD
        
        // Pooling de objetos
        enableObjectPooling: true,   // Reutilizar objetos para optimización
        poolInitialSize: 100,        // Tamaño inicial del pool
        poolGrowthFactor: 1.5        // Factor de crecimiento del pool
    },

    // 🔧 CONFIGURACIÓN AVANZADA
    advanced: {
        // Física
        enablePhysics: true,         // Activar simulación física básica
        gravityStrength: 0,          // Fuerza de gravedad (0 = desactivada)
        dampingFactor: 0.98,         // Factor de amortiguación
        
        // Debugging
        enableDebugMode: false,      // Modo debug (logs adicionales)
        showFormationGuides: false,  // Mostrar guías de formación
        showTrajectoryLines: false,  // Mostrar líneas de trayectoria
        
        // Compatibilidad
        fallbackToLinear: true,      // Fallback a movimiento lineal si hay problemas
        validateCoordinates: true,   // Validar coordenadas contra NaN
        errorRecoveryMode: 'safe'    // Modo de recuperación de errores
    }
};

/**
 * 🎛️ PRESETS DE CONFIGURACIÓN
 * Configuraciones predefinidas para diferentes escenarios
 */
export const ORGANIC_PRESETS = {
    // 🏃‍♂️ RENDIMIENTO MÁXIMO - Para dispositivos lentos
    performance: {
        ...ORGANIC_MOVEMENT_CONFIG,
        individual: {
            ...ORGANIC_MOVEMENT_CONFIG.individual,
            personalAmplitude: 0.05,
            microDeviationRange: 0.5
        },
        visual: {
            ...ORGANIC_MOVEMENT_CONFIG.visual,
            enableSizeVariation: false,
            trailLength: 3
        }
    },

    // 🎨 CALIDAD MÁXIMA - Para dispositivos potentes
    quality: {
        ...ORGANIC_MOVEMENT_CONFIG,
        individual: {
            ...ORGANIC_MOVEMENT_CONFIG.individual,
            personalAmplitude: 0.25,
            microDeviationRange: 3.0
        },
        visual: {
            ...ORGANIC_MOVEMENT_CONFIG.visual,
            opacityVariation: 0.5,
            trailLength: 15,
            enableColorPulse: true
        }
    },

    // ⚖️ EQUILIBRADO - Configuración por defecto
    balanced: ORGANIC_MOVEMENT_CONFIG,

    // 🎯 PRECISIÓN - Para gameplay competitivo
    precision: {
        ...ORGANIC_MOVEMENT_CONFIG,
        individual: {
            ...ORGANIC_MOVEMENT_CONFIG.individual,
            personalAmplitude: 0.05,
            speedVariation: 0.1,
            microDeviationRange: 0.5
        },
        movement: {
            ...ORGANIC_MOVEMENT_CONFIG.movement,
            accelFactor: 1.5,
            decelFactor: 0.5
        }
    }
};

/**
 * 🔧 UTILIDADES DE CONFIGURACIÓN
 */
export class OrganicConfigManager {
    constructor(preset = 'balanced') {
        this.config = { ...ORGANIC_PRESETS[preset] };
        this.activePreset = preset;
    }

    /**
     * Cambiar preset de configuración
     */
    setPreset(presetName) {
        if (ORGANIC_PRESETS[presetName]) {
            this.config = { ...ORGANIC_PRESETS[presetName] };
            this.activePreset = presetName;
            console.log(`🎛️ Preset orgánico cambiado a: ${presetName}`);
            return true;
        }
        console.warn(`⚠️ Preset no encontrado: ${presetName}`);
        return false;
    }

    /**
     * Obtener configuración actual
     */
    getConfig() {
        return this.config;
    }

    /**
     * Actualizar parámetro específico
     */
    updateParameter(section, key, value) {
        if (this.config[section] && this.config[section][key] !== undefined) {
            this.config[section][key] = value;
            console.log(`🔧 Parámetro actualizado: ${section}.${key} = ${value}`);
            return true;
        }
        console.warn(`⚠️ Parámetro no encontrado: ${section}.${key}`);
        return false;
    }

    /**
     * Validar configuración
     */
    validateConfig() {
        const errors = [];
        
        // Validar rangos de velocidad
        if (this.config.movement.minSpeed >= this.config.movement.maxSpeed) {
            errors.push('minSpeed debe ser menor que maxSpeed');
        }
        
        // Validar fases de aceleración
        if (this.config.movement.accelPhase < 0 || this.config.movement.accelPhase > 0.5) {
            errors.push('accelPhase debe estar entre 0 y 0.5');
        }
        
        // Validar rangos de formación
        if (this.config.formation.minFormationRadius >= this.config.formation.maxFormationRadius) {
            errors.push('minFormationRadius debe ser menor que maxFormationRadius');
        }
        
        if (errors.length > 0) {
            console.error('🚨 Errores de configuración:', errors);
            return false;
        }
        
        console.log('✅ Configuración validada correctamente');
        return true;
    }

    /**
     * Exportar configuración actual
     */
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }

    /**
     * Importar configuración desde JSON
     */
    importConfig(jsonConfig) {
        try {
            const newConfig = JSON.parse(jsonConfig);
            this.config = { ...this.config, ...newConfig };
            this.activePreset = 'custom';
            console.log('📥 Configuración importada correctamente');
            return this.validateConfig();
        } catch (error) {
            console.error('🚨 Error al importar configuración:', error);
            return false;
        }
    }
}

// Instancia global del manager de configuración
export const organicConfig = new OrganicConfigManager('balanced');

export default ORGANIC_MOVEMENT_CONFIG; 