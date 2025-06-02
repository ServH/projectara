/**
 * ⚖️ PROJECT ARA - BALANCE CONFIGURATION
 * Configuración de balance optimizada para ritmo frenético estilo Galcon
 */

// 🪐 CONFIGURACIÓN DE PLANETAS
export const PLANET_CONFIG = {
    // Velocidades de producción (naves/segundo) - MÁS PAUSADAS
    production: {
        small: 1.8,     // 1.8 naves/segundo (era 2.5) - MÁS LENTO
        medium: 2.8,    // 2.8 naves/segundo (era 4.0) - MÁS LENTO
        large: 4.2,     // 4.2 naves/segundo (era 6.0) - MÁS LENTO
        huge: 5.5       // 5.5 naves/segundo (era 8.0) - MÁS LENTO
    },

    // Capacidades máximas
    capacity: {
        small: 60,      // 60 naves máximo
        medium: 120,    // 120 naves máximo
        large: 250,     // 250 naves máximo
        huge: 400       // 400 naves máximo
    },

    // Naves iniciales
    initialShips: {
        small: 15,      // 15 naves iniciales
        medium: 25,     // 25 naves iniciales
        large: 40,      // 40 naves iniciales
        huge: 60        // 60 naves iniciales
    },

    // Radios visuales
    radius: {
        small: 15,
        medium: 25,
        large: 35,
        huge: 45
    }
};

// 🚀 CONFIGURACIÓN DE FLOTAS
export const FLEET_CONFIG = {
    // Velocidades base (píxeles/segundo) - MÁS LENTAS
    speed: {
        base: 180,              // Velocidad base (era 250) - MÁS LENTO
        variation: 0.12,        // Variación por tamaño (era 0.15)
        minimum: 120            // Velocidad mínima (era 180) - MÁS LENTO
    },

    // Configuración de trails
    trail: {
        maxLength: 12,          // Longitud máxima del trail (era 15)
        updateInterval: 50,     // ms entre updates (era 40) - MÁS LENTO
        fadeTime: 2.0           // Tiempo de fade en segundos (era 1.5)
    },

    // Formación y agrupación
    formation: {
        maxSpread: 20,          // Dispersión máxima (era 25)
        minSpread: 5,           // Dispersión mínima
        cohesion: 0.8           // Factor de cohesión
    }
};

// 🤖 CONFIGURACIÓN DE IA - MUY CONSERVADORA
export const AI_CONFIG = {
    // Timing de decisiones - MUCHO MÁS PAUSADO
    timing: {
        decisionInterval: 3500,     // 3.5 segundos (era 2000ms) - MUCHO MÁS LENTO
        reactionTime: 1000,         // Tiempo de reacción más lento (era 600ms)
        planningDepth: 1            // Menos profundidad de planificación (era 2)
    },

    // Comportamiento - MUY CONSERVADOR
    behavior: {
        aggressiveness: 0.35,       // Muy poco agresiva (era 0.55) - MUY CONSERVADOR
        expansionPriority: 0.45,    // Prioridad expansión baja (era 0.65)
        riskTolerance: 0.25,        // Muy poca tolerancia al riesgo (era 0.4)
        adaptability: 0.3           // Muy poca adaptabilidad (era 0.5)
    },

    // Thresholds de acción - MUCHO MÁS ALTOS
    thresholds: {
        minShipsToAttack: 25,       // Muchas más naves para atacar (era 15) - MUY CONSERVADOR
        minShipsToDefend: 15,       // Más naves para defender (era 10)
        strengthRatioAttack: 2.5,   // Ratio mucho más alto para atacar (era 1.8) - EXTREMADAMENTE CONSERVADOR
        strengthRatioDefend: 1.2    // Ratio más alto para defender (era 0.9)
    },

    // Porcentajes de envío - MUY CONSERVADORES
    sendPercentages: {
        attack: 0.35,               // 35% para ataques (era 55%) - MUY CONSERVADOR
        expand: 0.30,               // 30% para expansión (era 45%)
        reinforce: 0.25,            // 25% para refuerzos (era 35%)
        defend: 0.20                // 20% para defensa (era 25%)
    }
};

// ⚔️ CONFIGURACIÓN DE COMBATE
export const COMBAT_CONFIG = {
    // Mecánicas de combate
    mechanics: {
        instantResolution: true,    // Resolución instantánea
        defenseBonus: 1.1,         // Bonus defensivo (10%)
        attackBonus: 1.0,          // Bonus ofensivo
        minimumSurvivors: 1        // Mínimo supervivientes
    },

    // Efectos visuales
    effects: {
        explosionDuration: 500,     // Duración explosión (ms)
        conquestDuration: 800,      // Duración conquista (ms)
        flashIntensity: 0.8,        // Intensidad flash
        shakeIntensity: 5           // Intensidad shake
    }
};

// 🎮 CONFIGURACIÓN DE INPUT
export const INPUT_CONFIG = {
    // Selección
    selection: {
        dragThreshold: 8,           // Umbral para drag (era 5)
        multiSelectKey: 'ctrlKey',  // Tecla multiselección
        selectAllKey: 'a',          // Tecla seleccionar todo
        doubleClickTime: 300        // Tiempo doble click
    },

    // Drag & Drop
    dragDrop: {
        enabled: true,              // Habilitar drag & drop
        threshold: 10,              // Umbral para iniciar
        lineWidth: 3,               // Grosor línea preview
        lineOpacity: 0.7,           // Opacidad línea
        snapDistance: 30            // Distancia snap a planeta
    },

    // Feedback
    feedback: {
        hoverDelay: 100,            // Delay hover (ms)
        clickFeedback: true,        // Feedback de click
        soundEnabled: false,        // Sonido habilitado
        hapticEnabled: false        // Haptic feedback
    }
};

// 🎨 CONFIGURACIÓN VISUAL (MILESTONE 2.2 - COLORES MEJORADOS)
export const VISUAL_CONFIG = {
    // Colores principales - MEJORADOS para mejor visibilidad
    colors: {
        player: '#00ffaa',          // 🎯 MEJORADO: Verde más brillante (era #00ff88)
        ai: '#ff3366',              // 🎯 MEJORADO: Rojo más vibrante (era #ff4444)
        neutral: '#aaaaaa',         // 🎯 MEJORADO: Gris más claro (era #888888)
        background: '#000011',      // Fondo oscuro
        selection: '#00ffaa',       // 🎯 MEJORADO: Verde brillante para selección
        preview: '#ffaa00'          // Color preview
    },

    // Efectos - MEJORADOS para flotas más visibles
    effects: {
        glowIntensity: 25,          // 🎯 AUMENTADO: Más glow (era 20)
        pulseSpeed: 2,              // Velocidad pulso
        trailOpacity: 0.7,          // 🎯 AUMENTADO: Trails más visibles (era 0.6)
        particleCount: 50,          // Partículas por efecto
        animationSpeed: 1.2         // Velocidad animaciones
    },

    // UI
    ui: {
        hudOpacity: 0.9,            // Opacidad HUD
        fontSize: 12,               // Tamaño fuente
        borderRadius: 4,            // Radio bordes
        shadowBlur: 10              // Blur sombras
    }
};

// 📊 MÉTRICAS DE RENDIMIENTO
export const PERFORMANCE_METRICS = {
    targets: {
        fps: 60,                    // FPS objetivo
        frameTime: 16.67,           // Tiempo por frame (ms)
        updateTime: 5,              // Tiempo update máximo (ms)
        renderTime: 10,             // Tiempo render máximo (ms)
        memoryUsage: 100            // Uso memoria máximo (MB)
    },

    monitoring: {
        enabled: true,              // Monitoreo habilitado
        interval: 1000,             // Intervalo medición (ms)
        historySize: 60,            // Tamaño historial
        alertThreshold: 0.8         // Umbral alerta (80%)
    }
};

// Exportar configuración completa
export const BALANCE_CONFIG = {
    planet: PLANET_CONFIG,
    fleet: FLEET_CONFIG,
    ai: AI_CONFIG,
    combat: COMBAT_CONFIG,
    input: INPUT_CONFIG,
    visual: VISUAL_CONFIG,
    performance: PERFORMANCE_METRICS
};

export default BALANCE_CONFIG; 