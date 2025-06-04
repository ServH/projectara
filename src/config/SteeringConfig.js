/**
 * 🎛️ CONFIGURACIÓN DE STEERING BEHAVIORS
 * Configuración exacta probada en el laboratorio
 * Basada en steering-behaviors-config (1).json - FUNCIONALIDAD PROBADA
 */

export const GALCON_STEERING_CONFIG_PROBADA = {
    // ✅ SENSORES - Configuración exacta del JSON probado
    sensors: {
        length: 20,        // ✅ PROBADO: Funciona perfectamente
        width: 2,          // ✅ PROBADO: Detección precisa
        lateralCount: 0,   // ✅ PROBADO: Sensores mínimos eficientes
        lateralAngle: 10   // ✅ PROBADO: Ángulo óptimo
    },
    
    // ⚡ FUERZAS - Configuración exacta del JSON probado
    forces: {
        maxForce: 200,     // ✅ PROBADO: Responsivo para gameplay
        maxSpeed: 60,     // ✅ PROBADO: Velocidad perfecta
        seekWeight: 1,     // ✅ PROBADO: Prioridad al objetivo
        avoidanceWeight: 3, // ✅ PROBADO: Evasión balanceada
        smoothing: 0.5     // ✅ PROBADO: Suavizado visual
    },
    
    // 🎯 COMPORTAMIENTOS - Configuración exacta del JSON probado
    behavior: {
        arrivalRadius: 15,     // ✅ PROBADO: Radio de llegada
        slowingDistance: 60,   // ✅ PROBADO: Desaceleración suave
        enableArrival: true,   // ✅ PROBADO: Llegada inteligente
        enableWander: false    // ✅ PROBADO: Sin vagabundeo
    },
    
    // 🚁 FLOTAS - Configuración exacta del JSON probado
    fleet: {
        size: 15,              // ✅ PROBADO: Tamaño óptimo
        spacing: 30,           // ✅ PROBADO: Espaciado perfecto
        enableBoids: true,     // ✅ PROBADO: Comportamientos de grupo
        separationWeight: 1.5, // ✅ PROBADO: Separación balanceada
        alignmentWeight: 1,    // ✅ PROBADO: Alineación suave
        cohesionWeight: 0.8    // ✅ PROBADO: Cohesión natural
    },
    
    // 🎨 DEBUG - Sin visualización para el juego final
    debug: {
        showSensors: false,        // ❌ DESACTIVADO: Sin debug visual
        showForces: false,         // ❌ DESACTIVADO: Sin debug visual
        showVelocity: false,       // ❌ DESACTIVADO: Sin debug visual
        showTrails: false,         // ❌ DESACTIVADO: Sin debug visual
        showObstacleZones: false,  // ❌ DESACTIVADO: Sin debug visual
        showSpatialGrid: false,    // ❌ DESACTIVADO: Sin debug visual
        showFleetConnections: false, // ❌ DESACTIVADO: Sin debug visual
        showFleetCenter: false     // ❌ DESACTIVADO: Sin debug visual
    },
    
    // 🆕 CONFIGURACIÓN ESPECÍFICA DE GALCON
    galcon: {
        planetMinDistance: 50,    // Distancia mínima entre planetas
        arrivalSpread: 18,        // Dispersión en llegada
        launchDelay: 200,         // ms entre oleadas
        maxFleetSize: 15,         // Máximo naves por flota
        maxWaveSize: 8,           // Máximo naves por oleada (efecto enjambre)
        
        // Probabilidades de formación
        formationProbability: {
            spread: 0.4,  // 40% - Más común
            line: 0.2,    // 20%
            wedge: 0.2,   // 20%
            circle: 0.2   // 20%
        },
        
        // Configuración de lanzamiento gradual
        launch: {
            positionVariation: 15,  // Variación en posición de salida
            delayVariation: 50,     // Variación en delay entre oleadas
            minDistance: 10         // Distancia mínima del borde del planeta
        }
    }
};

// 🔧 CONFIGURACIÓN PARA DIFERENTES MODOS DE JUEGO
export const STEERING_CONFIGS = {
    // Configuración estándar (la probada)
    standard: GALCON_STEERING_CONFIG_PROBADA,
    
    // Configuración para juego rápido
    fast: {
        ...GALCON_STEERING_CONFIG_PROBADA,
        forces: {
            ...GALCON_STEERING_CONFIG_PROBADA.forces,
            maxSpeed: 150,     // Más velocidad
            maxForce: 250      // Más responsivo
        },
        galcon: {
            ...GALCON_STEERING_CONFIG_PROBADA.galcon,
            launchDelay: 150   // Oleadas más rápidas
        }
    },
    
    // Configuración para muchas naves
    massive: {
        ...GALCON_STEERING_CONFIG_PROBADA,
        sensors: {
            ...GALCON_STEERING_CONFIG_PROBADA.sensors,
            length: 25,        // Sensores más cortos
            lateralCount: 0    // Sin sensores laterales
        },
        galcon: {
            ...GALCON_STEERING_CONFIG_PROBADA.galcon,
            maxFleetSize: 20,  // Flotas más grandes
            maxWaveSize: 10    // Oleadas más grandes
        }
    }
};

// 🎛️ FUNCIONES DE CONFIGURACIÓN

/**
 * 🔧 Obtener configuración por modo
 */
export function getSteeringConfig(mode = 'standard') {
    return STEERING_CONFIGS[mode] || STEERING_CONFIGS.standard;
}

/**
 * 🎲 Seleccionar formación aleatoria
 */
export function selectRandomFormation(config = GALCON_STEERING_CONFIG_PROBADA) {
    const formations = ['spread', 'line', 'wedge', 'circle'];
    const probabilities = [
        config.galcon.formationProbability.spread,
        config.galcon.formationProbability.line,
        config.galcon.formationProbability.wedge,
        config.galcon.formationProbability.circle
    ];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < formations.length; i++) {
        cumulative += probabilities[i];
        if (random <= cumulative) {
            return formations[i];
        }
    }
    
    return 'spread'; // fallback
}

/**
 * 🌊 Calcular oleadas de lanzamiento
 */
export function calculateLaunchWaves(totalShips, config = GALCON_STEERING_CONFIG_PROBADA) {
    const maxWaveSize = config.galcon.maxWaveSize;
    const waves = [];
    
    for (let i = 0; i < totalShips; i += maxWaveSize) {
        const waveSize = Math.min(maxWaveSize, totalShips - i);
        waves.push(waveSize);
    }
    
    return waves;
}

/**
 * 🎯 Validar configuración
 */
export function validateSteeringConfig(config) {
    const errors = [];
    
    // Validar sensores
    if (!config.sensors) {
        errors.push('Falta configuración de sensores');
    } else {
        if (config.sensors.length <= 0) errors.push('Longitud de sensor debe ser > 0');
        if (config.sensors.width <= 0) errors.push('Ancho de sensor debe ser > 0');
        if (config.sensors.lateralCount < 0) errors.push('Cantidad de sensores laterales debe ser >= 0');
    }
    
    // Validar fuerzas
    if (!config.forces) {
        errors.push('Falta configuración de fuerzas');
    } else {
        if (config.forces.maxForce <= 0) errors.push('Fuerza máxima debe ser > 0');
        if (config.forces.maxSpeed <= 0) errors.push('Velocidad máxima debe ser > 0');
    }
    
    // Validar flota
    if (!config.fleet) {
        errors.push('Falta configuración de flota');
    } else {
        if (config.fleet.size <= 0) errors.push('Tamaño de flota debe ser > 0');
        if (config.fleet.spacing <= 0) errors.push('Espaciado de flota debe ser > 0');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 🔄 Crear configuración personalizada
 */
export function createCustomConfig(overrides = {}) {
    return {
        ...GALCON_STEERING_CONFIG_PROBADA,
        ...overrides,
        sensors: {
            ...GALCON_STEERING_CONFIG_PROBADA.sensors,
            ...(overrides.sensors || {})
        },
        forces: {
            ...GALCON_STEERING_CONFIG_PROBADA.forces,
            ...(overrides.forces || {})
        },
        behavior: {
            ...GALCON_STEERING_CONFIG_PROBADA.behavior,
            ...(overrides.behavior || {})
        },
        fleet: {
            ...GALCON_STEERING_CONFIG_PROBADA.fleet,
            ...(overrides.fleet || {})
        },
        debug: {
            ...GALCON_STEERING_CONFIG_PROBADA.debug,
            ...(overrides.debug || {})
        },
        galcon: {
            ...GALCON_STEERING_CONFIG_PROBADA.galcon,
            ...(overrides.galcon || {})
        }
    };
}

// 📊 CONFIGURACIONES PREDEFINIDAS PARA TESTING
export const TEST_CONFIGS = {
    // Configuración mínima para testing
    minimal: createCustomConfig({
        sensors: { length: 20, width: 3, lateralCount: 0, lateralAngle: 0 },
        forces: { maxForce: 100, maxSpeed: 80 },
        fleet: { size: 5, spacing: 20 }
    }),
    
    // Configuración máxima para testing
    maximal: createCustomConfig({
        sensors: { length: 50, width: 10, lateralCount: 3, lateralAngle: 30 },
        forces: { maxForce: 300, maxSpeed: 200 },
        fleet: { size: 25, spacing: 40 }
    })
};

console.log('🎛️ SteeringConfig cargado - Configuración probada del laboratorio disponible'); 