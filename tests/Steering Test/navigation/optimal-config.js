/**
 * 🎯 CONFIGURACIÓN ÓPTIMA PARA DETECCIÓN ANTICIPADA Y NAVEGACIÓN SUAVE
 * Parámetros ajustados para que las naves detecten planetas con anticipación
 * y ajusten su ruta gradualmente hasta volver a encauzar su destino
 * 
 * ✅ MEJORAS IMPLEMENTADAS:
 * 🔄 Histéresis: Umbral de entrada (0.5) vs salida (0.3)
 * ⬇️ Fuerzas Reducidas: Repulsión 3x→1.8x, Lateral 2x→1.2x, Total 4x→2.5x
 * 🎯 Seek Protegido: Reducción máxima 80%→50%, mínimo garantizado 20%
 * ⚖️ Peso Limitado: Evasión máxima 2.5x (antes ilimitada)
 * 🚁 Flotas Mejoradas: Líder menos alejado, sensores para seguidores
 */

export const OPTIMAL_STEERING_CONFIG = {
    // 🔍 SENSORES - Detección Anticipada
    sensors: {
        length: 140,        // ⬆️ +75% más largo para detección temprana
        width: 22,          // ⬆️ +47% más ancho para mejor cobertura
        lateralCount: 3,    // ⬆️ +50% más sensores laterales
        lateralAngle: 45    // ⬆️ +50% mayor ángulo de cobertura
    },
    
    // ⚡ FUERZAS - Navegación Suave con Histéresis
    forces: {
        maxForce: 120,      // ⬇️ -40% menos fuerza para cambios graduales
        maxSpeed: 100,      // ⬇️ -17% velocidad más controlada
        seekWeight: 1.0,    // Peso estándar para seek
        avoidanceWeight: 2.5, // ⬇️ Limitado a 2.5x (antes ilimitado)
        smoothing: 0.15     // ⬆️ +50% más suavizado visual
    },
    
    // 🎯 COMPORTAMIENTOS - Llegada Suave
    behavior: {
        enableArrival: true,
        enableWander: false,
        slowingDistance: 80,    // ⬆️ +60% distancia de desaceleración
        arrivalRadius: 15       // Radio de llegada estándar
    },
    
    // 🔄 HISTÉRESIS - Anti-Bailoteo (NUEVO)
    avoidance: {
        entryThreshold: 0.5,    // Umbral para ENTRAR en evasión
        exitThreshold: 0.3,     // Umbral para SALIR de evasión
        graceFrames: 10,        // Frames de gracia antes de salir
        maxForceMultiplier: 2.5, // Máximo multiplicador de fuerza
        seekProtection: 0.2     // Mínimo 20% de seek garantizado
    }
};

export const GALCON_OPTIMIZED_CONFIG = {
    // 🔍 SENSORES - Configuración para Galcon
    sensors: {
        length: 100,        // Detección media para juego rápido
        width: 18,          // Cobertura balanceada
        lateralCount: 2,    // Sensores laterales moderados
        lateralAngle: 35    // Ángulo balanceado
    },
    
    // ⚡ FUERZAS - Optimizado para Galcon
    forces: {
        maxForce: 150,      // Más responsivo para juego
        maxSpeed: 120,      // Velocidad de juego
        seekWeight: 1.2,    // Prioridad al objetivo
        avoidanceWeight: 2.0, // Evasión balanceada
        smoothing: 0.12     // Suavizado moderado
    },
    
    // 🎯 COMPORTAMIENTOS - Galcon Style
    behavior: {
        enableArrival: true,
        enableWander: false,
        slowingDistance: 60,    // Llegada más directa
        arrivalRadius: 12       // Radio de llegada ajustado
    },
    
    // 🔄 HISTÉRESIS - Galcon Optimized
    avoidance: {
        entryThreshold: 0.4,    // Entrada más sensible
        exitThreshold: 0.25,    // Salida más rápida
        graceFrames: 8,         // Menos frames de gracia
        maxForceMultiplier: 2.2, // Fuerza moderada
        seekProtection: 0.25    // 25% de seek garantizado
    }
};

// 🚁 CONFIGURACIÓN DE FLOTAS MEJORADA
export const FLEET_CONFIG = {
    // 👑 LÍDER
    leader: {
        followDistance: 12,     // 🔧 REDUCIDO: 20→12 (menos alejado)
        usesFullSteering: true  // Líder usa steering completo
    },
    
    // 👥 SEGUIDORES
    followers: {
        sensorLength: 0.7,      // 70% longitud de sensores
        lateralCount: 1,        // 1 sensor lateral por lado
        lateralAngle: 30,       // Ángulo estándar
        avoidanceWeight: 1.2,   // +20% peso evasión
        followWeight: 0.8,      // -20% peso seguimiento
        correctionStrength: 0.8 // Correcciones menores del rumbo
    },
    
    // 📐 FORMACIONES
    formations: {
        spacing: 15,            // Espaciado entre naves
        tightness: 0.3,         // Rigidez de formación
        circleRadius: 15,       // Radio para formación circular
        wedgeSpacing: 12        // Espaciado para formación en cuña
    }
};

/**
 * 🔧 Aplicar configuración optimizada al laboratorio
 */
export function applyOptimalConfig(lab) {
    if (!lab || !lab.config) {
        console.error('❌ Laboratorio no válido para aplicar configuración');
        return;
    }
    
    // Aplicar configuración
    Object.assign(lab.config, OPTIMAL_STEERING_CONFIG);
    
    // Actualizar controles UI
    updateUIControls(OPTIMAL_STEERING_CONFIG);
    
    console.log('✅ Configuración óptima aplicada');
}

/**
 * 🔧 Aplicar configuración de Galcon al laboratorio
 */
export function applyGalconConfig(lab) {
    if (!lab || !lab.config) {
        console.error('❌ Laboratorio no válido para aplicar configuración');
        return;
    }
    
    // Aplicar configuración
    Object.assign(lab.config, GALCON_OPTIMIZED_CONFIG);
    
    // Actualizar controles UI
    updateUIControls(GALCON_OPTIMIZED_CONFIG);
    
    console.log('✅ Configuración Galcon aplicada');
}

/**
 * 🎛️ Actualizar controles de la UI
 */
function updateUIControls(config) {
    // Sensores
    updateSlider('sensorLength', config.sensors.length);
    updateSlider('sensorWidth', config.sensors.width);
    updateSlider('lateralSensors', config.sensors.lateralCount);
    updateSlider('lateralAngle', config.sensors.lateralAngle);
    
    // Fuerzas
    updateSlider('maxForce', config.forces.maxForce);
    updateSlider('maxSpeed', config.forces.maxSpeed);
    updateSlider('seekWeight', config.forces.seekWeight);
    updateSlider('avoidanceWeight', config.forces.avoidanceWeight);
    updateSlider('smoothing', config.forces.smoothing);
    
    // Comportamientos
    updateSlider('slowingDistance', config.behavior.slowingDistance);
    updateSlider('arrivalRadius', config.behavior.arrivalRadius);
    
    console.log('🎛️ Controles UI actualizados');
}

/**
 * 🎛️ Actualizar slider individual
 */
function updateSlider(id, value) {
    const slider = document.getElementById(id);
    const display = document.getElementById(id + 'Value');
    
    if (slider) {
        slider.value = value;
        if (display) {
            display.textContent = value;
        }
    }
}

// 📊 PARÁMETROS CORE PARA REFERENCIA
export const CORE_PARAMETERS = {
    // 🔍 DETECCIÓN ANTICIPADA
    sensorLength: {
        current: 80,
        optimal: 140,
        effect: "Detección 75% más temprana"
    },
    
    // ⚡ NAVEGACIÓN SUAVE  
    maxForce: {
        current: 200,
        optimal: 120,
        effect: "Cambios 40% más graduales"
    },
    
    // 🔄 ANTI-BAILOTEO
    hysteresis: {
        entry: 0.5,
        exit: 0.3,
        effect: "Elimina oscilaciones de estado"
    },
    
    // 🎯 SEEK PROTEGIDO
    seekProtection: {
        current: "80% reducción máxima",
        optimal: "50% reducción máxima, 20% mínimo",
        effect: "Mantiene rumbo al objetivo"
    },
    
    // 🚁 FLOTAS
    leaderDistance: {
        current: 20,
        optimal: 12,
        effect: "Líder menos alejado"
    }
};

// 🎯 RESUMEN DE MEJORAS IMPLEMENTADAS
export const IMPROVEMENTS_SUMMARY = {
    "🔄 Histéresis": "Elimina bailoteo con umbrales 0.5/0.3",
    "⬇️ Fuerzas Reducidas": "Repulsión 3x→1.8x, Total 4x→2.5x", 
    "🎯 Seek Protegido": "Mínimo 20% garantizado, máximo 50% reducción",
    "🚁 Líder Ajustado": "Distancia 20→12px (40% menos alejado)",
    "👥 Sensores Seguidores": "70% longitud, 1 lateral/lado, +20% evasión",
    "🔧 Correcciones Menores": "Mantiene cohesión de flota"
}; 