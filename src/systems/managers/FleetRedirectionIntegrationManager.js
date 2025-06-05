/**
 * 🔗 FLEET REDIRECTION INTEGRATION MANAGER
 * Gestor especializado para la integración con gameEngine y otros sistemas
 * Responsabilidad única: Coordinar la redirección con el resto del juego
 */

import eventBus, { GAME_EVENTS } from '../../core/EventBus.js';

export class FleetRedirectionIntegrationManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado de integración
        this.eventListeners = new Map();
        this.systemConnections = new Map();
        
        // Callbacks configurables
        this.callbacks = {
            onFleetLaunched: null,
            onFleetArrived: null,
            onGameStateChanged: null,
            onSystemConnected: null
        };
        
        console.log('🔗 FleetRedirectionIntegrationManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * 🎮 Configurar integración con gameEngine
     */
    setupGameEngineIntegration() {
        // Escuchar eventos del juego
        this.addEventListener(GAME_EVENTS.FLEET_LAUNCHED, this.onFleetLaunched.bind(this));
        this.addEventListener(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived.bind(this));
        this.addEventListener(GAME_EVENTS.GAME_STATE_CHANGED, this.onGameStateChanged.bind(this));
        this.addEventListener(GAME_EVENTS.PLANET_CAPTURED, this.onPlanetCaptured.bind(this));
        
        console.log('🎮 Integración con gameEngine configurada');
        return true;
    }

    /**
     * 📡 Añadir event listener
     */
    addEventListener(event, handler) {
        eventBus.on(event, handler);
        this.eventListeners.set(event, handler);
    }

    /**
     * 🚁 Manejar lanzamiento de flota
     */
    onFleetLaunched(data) {
        console.log(`🚁 Flota lanzada: ${data.fleetId} desde ${data.fromPlanet} hacia ${data.toPlanet}`);
        
        if (this.callbacks.onFleetLaunched) {
            this.callbacks.onFleetLaunched(data);
        }
        
        // Verificar si la flota puede ser redirigida
        const fleet = this.gameEngine.fleets.get(data.fleetId);
        if (fleet && fleet.owner === this.gameEngine.getCurrentPlayer()) {
            // Marcar como disponible para redirección
            fleet.canBeRedirected = true;
            fleet.launchTime = Date.now();
        }
    }

    /**
     * 🎯 Manejar llegada de flota
     */
    onFleetArrived(data) {
        console.log(`🎯 Flota llegó: ${data.fleetId} a ${data.toPlanet}`);
        
        if (this.callbacks.onFleetArrived) {
            this.callbacks.onFleetArrived(data);
        }
        
        // La flota ya no puede ser redirigida
        const fleet = this.gameEngine.fleets.get(data.fleetId);
        if (fleet) {
            fleet.canBeRedirected = false;
        }
    }

    /**
     * 🎮 Manejar cambio de estado del juego
     */
    onGameStateChanged(data) {
        console.log(`🎮 Estado del juego cambió: ${data.oldState} → ${data.newState}`);
        
        if (this.callbacks.onGameStateChanged) {
            this.callbacks.onGameStateChanged(data);
        }
        
        // Si el juego se pausó, pausar redirecciones
        if (data.newState === 'paused') {
            this.pauseRedirections();
        } else if (data.newState === 'playing' && data.oldState === 'paused') {
            this.resumeRedirections();
        }
    }

    /**
     * 🪐 Manejar captura de planeta
     */
    onPlanetCaptured(data) {
        console.log(`🪐 Planeta capturado: ${data.planetId} por ${data.newOwner}`);
        
        // Si un planeta cambió de dueño, verificar flotas en vuelo hacia él
        this.handlePlanetOwnershipChange(data.planetId, data.newOwner, data.oldOwner);
    }

    /**
     * 🔄 Manejar cambio de propietario de planeta
     */
    handlePlanetOwnershipChange(planetId, newOwner, oldOwner) {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        
        // Si el jugador perdió un planeta, las flotas dirigidas hacia él podrían necesitar redirección
        if (oldOwner === currentPlayer && newOwner !== currentPlayer) {
            this.suggestRedirectionForOrphanedFleets(planetId);
        }
    }

    /**
     * 💡 Sugerir redirección para flotas huérfanas
     */
    suggestRedirectionForOrphanedFleets(lostPlanetId) {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        const orphanedFleets = [];
        
        // Encontrar flotas del jugador dirigidas al planeta perdido
        for (const fleet of this.gameEngine.fleets.values()) {
            if (fleet.owner === currentPlayer && 
                fleet.toPlanet === lostPlanetId && 
                fleet.isInFlight) {
                orphanedFleets.push(fleet);
            }
        }
        
        if (orphanedFleets.length > 0) {
            console.log(`💡 ${orphanedFleets.length} flotas huérfanas detectadas para planeta ${lostPlanetId}`);
            
            // Emitir evento para sugerir redirección
            eventBus.emit('fleet:orphaned_fleets_detected', {
                lostPlanetId,
                orphanedFleets: orphanedFleets.map(f => f.id),
                count: orphanedFleets.length
            });
        }
    }

    /**
     * ⏸️ Pausar redirecciones
     */
    pauseRedirections() {
        // Marcar todas las flotas como no redirigibles temporalmente
        for (const fleet of this.gameEngine.fleets.values()) {
            if (fleet.canBeRedirected) {
                fleet.redirectionPaused = true;
            }
        }
        
        console.log('⏸️ Redirecciones pausadas');
    }

    /**
     * ▶️ Reanudar redirecciones
     */
    resumeRedirections() {
        // Restaurar capacidad de redirección
        for (const fleet of this.gameEngine.fleets.values()) {
            if (fleet.redirectionPaused) {
                fleet.redirectionPaused = false;
            }
        }
        
        console.log('▶️ Redirecciones reanudadas');
    }

    /**
     * 🔍 Obtener flotas redirigibles del jugador
     */
    getRedirectableFleets() {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        const redirectableFleets = [];
        
        for (const fleet of this.gameEngine.fleets.values()) {
            if (this.isFleetRedirectable(fleet, currentPlayer)) {
                redirectableFleets.push(fleet);
            }
        }
        
        return redirectableFleets;
    }

    /**
     * ✅ Verificar si una flota es redirigible
     */
    isFleetRedirectable(fleet, currentPlayer = null) {
        if (!fleet || !fleet.id) {
            return false;
        }
        
        const player = currentPlayer || this.gameEngine.getCurrentPlayer();
        
        // Verificar propietario
        if (fleet.owner !== player) {
            return false;
        }
        
        // Verificar que está en vuelo
        if (!fleet.isInFlight) {
            return false;
        }
        
        // Verificar que no está pausada
        if (fleet.redirectionPaused) {
            return false;
        }
        
        // Verificar que no está muy cerca del destino
        if (fleet.progress >= 0.9) {
            return false;
        }
        
        // Verificar que puede ser redirigida
        if (fleet.canBeRedirected === false) {
            return false;
        }
        
        return true;
    }

    /**
     * 🎯 Obtener planetas válidos como objetivos
     */
    getValidTargetPlanets() {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        const validTargets = [];
        
        for (const planet of this.gameEngine.planets.values()) {
            if (this.isPlanetValidTarget(planet, currentPlayer)) {
                validTargets.push(planet);
            }
        }
        
        return validTargets;
    }

    /**
     * ✅ Verificar si un planeta es un objetivo válido
     */
    isPlanetValidTarget(planet, currentPlayer = null) {
        if (!planet || !planet.id) {
            return false;
        }
        
        const player = currentPlayer || this.gameEngine.getCurrentPlayer();
        
        // No puede redirigir a sus propios planetas
        if (planet.owner === player) {
            return false;
        }
        
        // Verificar que el planeta existe en el juego
        const gamePlanet = this.gameEngine.planets.get(planet.id);
        if (!gamePlanet) {
            return false;
        }
        
        return true;
    }

    /**
     * 📊 Obtener estadísticas de integración
     */
    getIntegrationStats() {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        const redirectableFleets = this.getRedirectableFleets();
        const validTargets = this.getValidTargetPlanets();
        
        return {
            redirectableFleets: redirectableFleets.length,
            validTargets: validTargets.length,
            totalFleets: this.gameEngine.fleets.size,
            totalPlanets: this.gameEngine.planets.size,
            currentPlayer,
            eventListeners: this.eventListeners.size,
            systemConnections: this.systemConnections.size
        };
    }

    /**
     * 🔗 Conectar con otro sistema
     */
    connectToSystem(systemName, system) {
        this.systemConnections.set(systemName, system);
        
        if (this.callbacks.onSystemConnected) {
            this.callbacks.onSystemConnected({ systemName, system });
        }
        
        console.log(`🔗 Conectado al sistema: ${systemName}`);
    }

    /**
     * 🔌 Desconectar de un sistema
     */
    disconnectFromSystem(systemName) {
        const system = this.systemConnections.get(systemName);
        if (system) {
            this.systemConnections.delete(systemName);
            console.log(`🔌 Desconectado del sistema: ${systemName}`);
            return true;
        }
        return false;
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Configuración de FleetRedirectionIntegrationManager actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        return {
            eventListeners: Array.from(this.eventListeners.keys()),
            systemConnections: Array.from(this.systemConnections.keys()),
            stats: this.getIntegrationStats(),
            config: this.config,
            hasCallbacks: Object.keys(this.callbacks).filter(key => this.callbacks[key] !== null)
        };
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        // Remover event listeners
        for (const [event, handler] of this.eventListeners) {
            eventBus.off(event, handler);
        }
        
        // Limpiar conexiones
        this.eventListeners.clear();
        this.systemConnections.clear();
        
        // Limpiar referencias
        this.gameEngine = null;
        this.callbacks = {};
        this.config = null;
        
        console.log('💥 FleetRedirectionIntegrationManager destruido');
    }
} 