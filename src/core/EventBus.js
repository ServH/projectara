/**
 * 🚀 GALCON GAME - EVENT BUS SYSTEM
 * Sistema de eventos global para comunicación entre módulos
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.debugMode = false;
    }

    /**
     * Suscribirse a un evento
     */
    on(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        this.events.get(eventName).push({ callback, context });

        if (this.debugMode) {
            console.log(`📡 EventBus: Suscrito a '${eventName}'`);
        }
    }

    /**
     * Suscribirse a un evento una sola vez
     */
    once(eventName, callback, context = null) {
        if (!this.onceEvents.has(eventName)) {
            this.onceEvents.set(eventName, []);
        }
        
        this.onceEvents.get(eventName).push({ callback, context });
    }

    /**
     * Desuscribirse de un evento
     */
    off(eventName, callback) {
        if (this.events.has(eventName)) {
            const listeners = this.events.get(eventName);
            const index = listeners.findIndex(listener => listener.callback === callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emitir un evento
     */
    emit(eventName, data = null) {
        if (this.debugMode) {
            console.log(`📡 EventBus: Emitiendo '${eventName}'`, data);
        }

        // Ejecutar listeners normales
        if (this.events.has(eventName)) {
            const listeners = this.events.get(eventName);
            listeners.forEach(listener => {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data);
                    } else {
                        listener.callback(data);
                    }
                } catch (error) {
                    console.error(`❌ Error en listener de '${eventName}':`, error);
                }
            });
        }

        // Ejecutar listeners de una vez y removerlos
        if (this.onceEvents.has(eventName)) {
            const listeners = this.onceEvents.get(eventName);
            listeners.forEach(listener => {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data);
                    } else {
                        listener.callback(data);
                    }
                } catch (error) {
                    console.error(`❌ Error en listener ONCE de '${eventName}':`, error);
                }
            });
            this.onceEvents.delete(eventName);
        }
    }

    /**
     * Limpiar todos los eventos
     */
    clear() {
        this.events.clear();
        this.onceEvents.clear();
    }

    /**
     * Activar/desactivar modo debug
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`📡 EventBus: Debug mode ${enabled ? 'activado' : 'desactivado'}`);
    }
}

// Eventos predefinidos del juego
export const GAME_EVENTS = {
    // Core Game Events
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_END: 'game:end',
    GAME_RESET: 'game:reset',
    GAME_STOP: 'game:stop',

    // State Management Events
    STATE_CHANGED: 'state:changed',
    PLANET_ADDED: 'state:planet:added',
    PLANET_REMOVED: 'state:planet:removed',
    FLEET_ADDED: 'state:fleet:added',
    FLEET_REMOVED: 'state:fleet:removed',
    PLAYER_ADDED: 'state:player:added',

    // Planet Events
    PLANET_SELECTED: 'planet:selected',
    PLANET_DESELECTED: 'planet:deselected',
    PLANET_CONQUERED: 'planet:conquered',
    PLANET_PRODUCTION: 'planet:production',

    // Fleet Events
    FLEET_LAUNCHED: 'fleet:launched',
    FLEET_ARRIVED: 'fleet:arrived',
    FLEET_DESTROYED: 'fleet:destroyed',
    
    // Fleet Swarm Events - Fase 3
    FLEET_SWARM_COMPLETE: 'fleet:swarm:complete',
    FLEET_WAVE_LAUNCHED: 'fleet:wave:launched',
    FLEET_FORMATION_CHANGED: 'fleet:formation:changed',
    FLEET_STEERING_ACTIVATED: 'fleet:steering:activated',

    // Battle Events
    BATTLE_START: 'battle:start',
    BATTLE_END: 'battle:end',

    // Selection Events
    SELECTION_START: 'selection:start',
    SELECTION_UPDATE: 'selection:update',
    SELECTION_END: 'selection:end',
    SELECTION_CLEAR: 'selection:clear',

    // AI Events
    AI_DECISION: 'ai:decision',
    AI_ATTACK: 'ai:attack',

    // Visual Events
    EFFECT_EXPLOSION: 'effect:explosion',
    EFFECT_TRAIL: 'effect:trail',
    EFFECT_CONQUEST: 'effect:conquest',
    
    // Visual Effects for Steering - Fase 3
    EFFECT_SWARM_LAUNCH: 'effect:swarm:launch',
    EFFECT_FORMATION_CHANGE: 'effect:formation:change',
    EFFECT_OBSTACLE_AVOIDANCE: 'effect:obstacle:avoidance'
};

// Crear instancia global
const eventBus = new EventBus();

export default eventBus; 