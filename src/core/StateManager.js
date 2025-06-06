/**
 * 🗃️ STATE MANAGER
 * Gestor centralizado del estado del juego
 * 
 * RESPONSABILIDADES:
 * - Gestionar estado del juego de forma inmutable
 * - Proporcionar acceso controlado a entidades
 * - Manejar transiciones de estado
 * - Mantener historial de cambios para debugging
 */

import eventBus, { GAME_EVENTS } from './EventBus.js';

export class StateManager {
    constructor() {
        this.gameState = 'menu';
        this.isRunning = false;
        this.isPaused = false;
        
        // Entidades del juego
        this.planets = new Map();
        this.fleets = new Map();
        this.players = new Map();
        
        // Estadísticas del juego
        this.statistics = {
            gameTime: 0,
            frameCount: 0,
            planetsCount: 0,
            fleetsCount: 0,
            playersCount: 0
        };
        
        // Historial de cambios para debugging
        this.changeHistory = [];
        this.maxHistorySize = 100;
        
        // Cache de consultas frecuentes
        this.queryCache = new Map();
        this.cacheValidUntil = 0;
        this.cacheTimeout = 100; // ms
        
        console.log('🗃️ State Manager initialized');
    }

    /**
     * Cambiar estado del juego
     */
    setGameState(newState) {
        const validStates = ['menu', 'playing', 'paused', 'ended', 'loading'];
        
        if (!validStates.includes(newState)) {
            throw new Error(`Invalid game state: ${newState}`);
        }
        
        const oldState = this.gameState;
        this.gameState = newState;
        
        this.recordChange('gameState', oldState, newState);
        
        // Emitir evento de cambio de estado
        eventBus.emit(GAME_EVENTS.STATE_CHANGED, {
            oldState,
            newState,
            timestamp: Date.now()
        });
        
        console.log(`🗃️ Game state changed: ${oldState} → ${newState}`);
    }

    /**
     * Obtener estado actual del juego
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * Verificar si el juego está en un estado específico
     */
    isInState(state) {
        return this.gameState === state;
    }

    /**
     * Establecer estado de ejecución
     */
    setRunning(running) {
        if (this.isRunning !== running) {
            this.recordChange('isRunning', this.isRunning, running);
            this.isRunning = running;
            
            eventBus.emit(running ? GAME_EVENTS.GAME_START : GAME_EVENTS.GAME_STOP, {
                timestamp: Date.now()
            });
        }
    }

    /**
     * Establecer estado de pausa
     */
    setPaused(paused) {
        if (this.isPaused !== paused) {
            this.recordChange('isPaused', this.isPaused, paused);
            this.isPaused = paused;
            
            eventBus.emit(paused ? GAME_EVENTS.GAME_PAUSE : GAME_EVENTS.GAME_RESUME, {
                timestamp: Date.now()
            });
        }
    }

    /**
     * Agregar planeta al estado
     */
    addPlanet(planet) {
        if (!planet || !planet.id) {
            throw new Error('Invalid planet object');
        }
        
        this.planets.set(planet.id, planet);
        this.invalidateCache();
        this.updateStatistics();
        
        this.recordChange('planets', 'add', planet.id);
        
        eventBus.emit(GAME_EVENTS.PLANET_ADDED, {
            planetId: planet.id,
            planet: planet
        });
    }

    /**
     * Remover planeta del estado
     */
    removePlanet(planetId) {
        if (this.planets.has(planetId)) {
            const planet = this.planets.get(planetId);
            this.planets.delete(planetId);
            this.invalidateCache();
            this.updateStatistics();
            
            this.recordChange('planets', 'remove', planetId);
            
            eventBus.emit(GAME_EVENTS.PLANET_REMOVED, {
                planetId,
                planet
            });
            
            return planet;
        }
        return null;
    }

    /**
     * Obtener planeta por ID
     */
    getPlanet(planetId) {
        return this.planets.get(planetId) || null;
    }

    /**
     * Obtener todos los planetas
     */
    getAllPlanets() {
        const cacheKey = 'allPlanets';
        
        if (this.isCacheValid() && this.queryCache.has(cacheKey)) {
            return this.queryCache.get(cacheKey);
        }
        
        const planets = Array.from(this.planets.values());
        this.setCache(cacheKey, planets);
        
        return planets;
    }

    /**
     * Obtener planetas por propietario
     */
    getPlanetsByOwner(owner) {
        const cacheKey = `planetsByOwner_${owner}`;
        
        if (this.isCacheValid() && this.queryCache.has(cacheKey)) {
            return this.queryCache.get(cacheKey);
        }
        
        const planets = Array.from(this.planets.values()).filter(planet => planet.owner === owner);
        this.setCache(cacheKey, planets);
        
        return planets;
    }

    /**
     * Agregar flota al estado
     */
    addFleet(fleet) {
        if (!fleet || !fleet.id) {
            throw new Error('Invalid fleet object');
        }
        
        console.log(`🗃️ StateManager agregando flota ${fleet.id} (${fleet.fleetSize || fleet.vehicles?.length || 'unknown'} naves)`);
        
        this.fleets.set(fleet.id, fleet);
        this.invalidateCache();
        this.updateStatistics();
        
        this.recordChange('fleets', 'add', fleet.id);
        
        console.log(`🗃️ Emitiendo FLEET_ADDED para flota ${fleet.id}`);
        eventBus.emit(GAME_EVENTS.FLEET_ADDED, {
            fleetId: fleet.id,
            fleet: fleet
        });
        
        console.log(`🗃️ Total flotas en StateManager: ${this.fleets.size}`);
    }

    /**
     * Remover flota del estado
     */
    removeFleet(fleetId) {
        if (this.fleets.has(fleetId)) {
            const fleet = this.fleets.get(fleetId);
            this.fleets.delete(fleetId);
            this.invalidateCache();
            this.updateStatistics();
            
            this.recordChange('fleets', 'remove', fleetId);
            
            eventBus.emit(GAME_EVENTS.FLEET_REMOVED, {
                fleetId,
                fleet
            });
            
            return fleet;
        }
        return null;
    }

    /**
     * Obtener flota por ID
     */
    getFleet(fleetId) {
        return this.fleets.get(fleetId) || null;
    }

    /**
     * Obtener todas las flotas
     */
    getAllFleets() {
        const cacheKey = 'allFleets';
        
        if (this.isCacheValid() && this.queryCache.has(cacheKey)) {
            return this.queryCache.get(cacheKey);
        }
        
        const fleets = Array.from(this.fleets.values());
        this.setCache(cacheKey, fleets);
        
        return fleets;
    }

    /**
     * Obtener flotas activas (no han llegado)
     */
    getActiveFleets() {
        const cacheKey = 'activeFleets';
        
        if (this.isCacheValid() && this.queryCache.has(cacheKey)) {
            return this.queryCache.get(cacheKey);
        }
        
        const activeFleets = Array.from(this.fleets.values()).filter(fleet => 
            fleet.isActive && !fleet.hasArrived
        );
        this.setCache(cacheKey, activeFleets);
        
        return activeFleets;
    }

    /**
     * Agregar jugador al estado
     */
    addPlayer(player) {
        if (!player || !player.id) {
            throw new Error('Invalid player object');
        }
        
        this.players.set(player.id, player);
        this.updateStatistics();
        
        this.recordChange('players', 'add', player.id);
        
        eventBus.emit(GAME_EVENTS.PLAYER_ADDED, {
            playerId: player.id,
            player: player
        });
    }

    /**
     * Obtener jugador por ID
     */
    getPlayer(playerId) {
        return this.players.get(playerId) || null;
    }

    /**
     * Obtener todos los jugadores
     */
    getAllPlayers() {
        return Array.from(this.players.values());
    }

    /**
     * Actualizar estadísticas del juego
     */
    updateStatistics() {
        this.statistics.planetsCount = this.planets.size;
        this.statistics.fleetsCount = this.fleets.size;
        this.statistics.playersCount = this.players.size;
    }

    /**
     * Incrementar tiempo de juego
     */
    incrementGameTime(deltaTime) {
        this.statistics.gameTime += deltaTime;
        this.statistics.frameCount++;
    }

    /**
     * Obtener estadísticas del juego
     */
    getStatistics() {
        return { ...this.statistics };
    }

    /**
     * Limpiar entidades inactivas
     */
    cleanup() {
        let removedCount = 0;
        
        // Limpiar flotas que han llegado
        for (const [fleetId, fleet] of this.fleets) {
            if (!fleet.isActive || fleet.hasArrived) {
                this.removeFleet(fleetId);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`🧹 Cleaned up ${removedCount} inactive fleets`);
        }
        
        return removedCount;
    }

    /**
     * Resetear estado del juego
     */
    reset() {
        this.gameState = 'menu';
        this.isRunning = false;
        this.isPaused = false;
        
        this.planets.clear();
        this.fleets.clear();
        this.players.clear();
        
        this.statistics = {
            gameTime: 0,
            frameCount: 0,
            planetsCount: 0,
            fleetsCount: 0,
            playersCount: 0
        };
        
        this.invalidateCache();
        this.changeHistory = [];
        
        eventBus.emit(GAME_EVENTS.GAME_RESET, {
            timestamp: Date.now()
        });
        
        console.log('🗃️ Game state reset');
    }

    /**
     * Registrar cambio en el historial
     */
    recordChange(type, oldValue, newValue) {
        const change = {
            type,
            oldValue,
            newValue,
            timestamp: Date.now(),
            frameCount: this.statistics.frameCount
        };
        
        this.changeHistory.push(change);
        
        // Mantener tamaño del historial
        if (this.changeHistory.length > this.maxHistorySize) {
            this.changeHistory.shift();
        }
    }

    /**
     * Obtener historial de cambios
     */
    getChangeHistory() {
        return [...this.changeHistory];
    }

    /**
     * Invalidar cache de consultas
     */
    invalidateCache() {
        this.queryCache.clear();
        this.cacheValidUntil = 0;
    }

    /**
     * Verificar si el cache es válido
     */
    isCacheValid() {
        return Date.now() < this.cacheValidUntil;
    }

    /**
     * Establecer valor en cache
     */
    setCache(key, value) {
        this.queryCache.set(key, value);
        this.cacheValidUntil = Date.now() + this.cacheTimeout;
    }

    /**
     * Obtener snapshot completo del estado
     */
    getSnapshot() {
        return {
            gameState: this.gameState,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            planets: Array.from(this.planets.entries()),
            fleets: Array.from(this.fleets.entries()),
            players: Array.from(this.players.entries()),
            statistics: { ...this.statistics },
            timestamp: Date.now()
        };
    }

    /**
     * Restaurar desde snapshot
     */
    restoreFromSnapshot(snapshot) {
        this.gameState = snapshot.gameState;
        this.isRunning = snapshot.isRunning;
        this.isPaused = snapshot.isPaused;
        
        this.planets = new Map(snapshot.planets);
        this.fleets = new Map(snapshot.fleets);
        this.players = new Map(snapshot.players);
        
        this.statistics = { ...snapshot.statistics };
        
        this.invalidateCache();
        
        console.log('🗃️ State restored from snapshot');
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            gameState: this.gameState,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            entitiesCount: {
                planets: this.planets.size,
                fleets: this.fleets.size,
                players: this.players.size
            },
            statistics: this.getStatistics(),
            cacheInfo: {
                size: this.queryCache.size,
                isValid: this.isCacheValid(),
                validUntil: this.cacheValidUntil
            },
            historySize: this.changeHistory.length
        };
    }
}

export default StateManager; 