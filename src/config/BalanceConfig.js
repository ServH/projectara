/**
 * ⚖️ PROJECT ARA - BALANCE CONFIGURATION
 * Configuración de balance optimizada para ritmo frenético estilo Galcon
 */

// 🪐 CONFIGURACIÓN DE PLANETAS
export const PLANET_CONFIG = {
    // Velocidades de producción (naves/segundo) - MÁS RÁPIDAS
    production: {
        small: 2.5,     // 2.5 naves/segundo (era 0.5)
        medium: 4.0,    // 4.0 naves/segundo (era 1.0)
        large: 6.0,     // 6.0 naves/segundo (era 1.5)
        huge: 8.0       // 8.0 naves/segundo (era 2.0)
    },

    // Capacidades máximas
    capacity: {
        small: 60,      // 60 naves máximo (era 50)
        medium: 120,    // 120 naves máximo (era 100)
        large: 250,     // 250 naves máximo (era 200)
        huge: 400       // 400 naves máximo (era 300)
    },

    // Naves iniciales
    initialShips: {
        small: 15,      // 15 naves iniciales (era 10)
        medium: 25,     // 25 naves iniciales (era 20)
        large: 40,      // 40 naves iniciales (era 35)
        huge: 60        // 60 naves iniciales (era 50)
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
    // Velocidades base (píxeles/segundo) - MÁS RÁPIDAS
    speed: {
        base: 250,              // Velocidad base (era 150)
        variation: 0.15,        // Variación por tamaño (era 0.1)
        minimum: 180            // Velocidad mínima
    },

    // Configuración de trails
    trail: {
        maxLength: 15,          // Longitud máxima del trail (era 8)
        updateInterval: 40,     // ms entre updates (era 50)
        fadeTime: 1.5           // Tiempo de fade en segundos
    },

    // Formación y agrupación
    formation: {
        maxSpread: 25,          // Dispersión máxima
        minSpread: 5,           // Dispersión mínima
        cohesion: 0.8           // Factor de cohesión
    }
};

// 🤖 CONFIGURACIÓN DE IA - BALANCEADA
export const AI_CONFIG = {
    // Timing de decisiones - MÁS PAUSADO
    timing: {
        decisionInterval: 2000,     // 2 segundos (era 1500ms) - MÁS LENTO
        reactionTime: 600,          // Tiempo de reacción más lento (era 400ms)
        planningDepth: 2            // Menos profundidad de planificación
    },

    // Comportamiento - MÁS CONSERVADOR
    behavior: {
        aggressiveness: 0.55,       // Menos agresiva (era 0.65) - MÁS CONSERVADOR
        expansionPriority: 0.65,    // Prioridad expansión moderada (era 0.75)
        riskTolerance: 0.4,         // Menos tolerancia al riesgo (era 0.5)
        adaptability: 0.5           // Menos adaptabilidad (era 0.6)
    },

    // Thresholds de acción - MÁS ALTOS
    thresholds: {
        minShipsToAttack: 15,       // Más naves para atacar (era 12) - MÁS CONSERVADOR
        minShipsToDefend: 10,       // Más naves para defender (era 8)
        strengthRatioAttack: 1.8,   // Ratio más alto para atacar (era 1.5) - MUCHO MÁS CONSERVADOR
        strengthRatioDefend: 0.9    // Ratio más alto para defender (era 0.8)
    },

    // Porcentajes de envío - MÁS CONSERVADORES
    sendPercentages: {
        attack: 0.55,               // 55% para ataques (era 65%) - MÁS CONSERVADOR
        expand: 0.45,               // 45% para expansión (era 55%)
        reinforce: 0.35,            // 35% para refuerzos (era 40%)
        defend: 0.25                // 25% para defensa (era 30%)
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

// 🎨 CONFIGURACIÓN VISUAL
export const VISUAL_CONFIG = {
    // Colores principales
    colors: {
        player: '#00ff88',          // Verde jugador
        ai: '#ff4444',              // Rojo IA
        neutral: '#888888',         // Gris neutral
        background: '#000011',      // Fondo oscuro
        selection: '#00ff88',       // Color selección
        preview: '#ffaa00'          // Color preview
    },

    // Efectos
    effects: {
        glowIntensity: 20,          // Intensidad glow
        pulseSpeed: 2,              // Velocidad pulso
        trailOpacity: 0.6,          // Opacidad trails
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