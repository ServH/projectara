/**
 * 🎯 SELECTION STATE MANAGER
 * Gestor especializado para el estado de selección de planetas
 * Responsabilidad única: Gestionar qué planetas están seleccionados
 */

import { GAME_EVENTS } from '../../core/EventBus.js';

export class SelectionStateManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado de selección
        this.selectedPlanets = new Set();
        this.lastSelectedPlanet = null;
        this.selectionHistory = [];
        
        // Callbacks configurables
        this.callbacks = {
            onSelectionChanged: null,
            onPlanetSelected: null,
            onPlanetDeselected: null,
            onSelectionCleared: null
        };
        
        console.log('🎯 SelectionStateManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * 🪐 Seleccionar un planeta
     */
    selectPlanet(planetId, options = {}) {
        const { 
            isMultiSelect = false, 
            isSelectAll = false,
            clearPrevious = false,
            addToHistory = true 
        } = options;

        console.log(`🎯 Seleccionando planeta ${planetId}: multi=${isMultiSelect}, selectAll=${isSelectAll}`);

        // Limpiar selección previa si no es multi-select
        if (!isMultiSelect || clearPrevious) {
            this.clearSelection(false); // false = no emitir evento aún
        }

        // Verificar que el planeta existe
        const planet = this.gameEngine.getPlanetById(planetId);
        if (!planet) {
            console.warn(`⚠️ Planeta ${planetId} no encontrado`);
            return false;
        }

        // Verificar que el planeta pertenece al jugador
        if (!this.canSelectPlanet(planet)) {
            console.warn(`⚠️ No se puede seleccionar planeta ${planetId} (no pertenece al jugador)`);
            return false;
        }

        // Manejar selección especial "select all"
        if (isSelectAll) {
            return this.selectAllPlanetsOfType(planet);
        }

        // Agregar a selección
        const wasSelected = this.selectedPlanets.has(planetId);
        
        if (isMultiSelect && wasSelected) {
            // Deseleccionar si ya estaba seleccionado en modo multi
            this.deselectPlanet(planetId, { addToHistory });
        } else {
            // Seleccionar planeta
            this.selectedPlanets.add(planetId);
            this.lastSelectedPlanet = planetId;
            
            if (addToHistory) {
                this.addToHistory('select', planetId);
            }
            
            // Emitir eventos
            if (this.callbacks.onPlanetSelected) {
                this.callbacks.onPlanetSelected({ planet, planetId });
            }
            
            this.emitSelectionChanged();
            
            console.log(`✅ Planeta ${planetId} seleccionado (total: ${this.selectedPlanets.size})`);
        }

        return true;
    }

    /**
     * 🚫 Deseleccionar un planeta
     */
    deselectPlanet(planetId, options = {}) {
        const { addToHistory = true } = options;

        if (!this.selectedPlanets.has(planetId)) {
            return false;
        }

        this.selectedPlanets.delete(planetId);
        
        if (this.lastSelectedPlanet === planetId) {
            this.lastSelectedPlanet = this.selectedPlanets.size > 0 ? 
                Array.from(this.selectedPlanets)[this.selectedPlanets.size - 1] : null;
        }

        if (addToHistory) {
            this.addToHistory('deselect', planetId);
        }

        // Emitir eventos
        const planet = this.gameEngine.getPlanetById(planetId);
        if (this.callbacks.onPlanetDeselected) {
            this.callbacks.onPlanetDeselected({ planet, planetId });
        }

        this.emitSelectionChanged();
        
        console.log(`❌ Planeta ${planetId} deseleccionado (total: ${this.selectedPlanets.size})`);
        return true;
    }

    /**
     * 🌟 Seleccionar todos los planetas del mismo tipo
     */
    selectAllPlanetsOfType(referencePlanet) {
        const playerPlanets = this.gameEngine.getPlayerPlanets(referencePlanet.owner);
        let selectedCount = 0;

        playerPlanets.forEach(planet => {
            if (this.canSelectPlanet(planet)) {
                this.selectedPlanets.add(planet.id);
                selectedCount++;
            }
        });

        if (selectedCount > 0) {
            this.lastSelectedPlanet = referencePlanet.id;
            this.addToHistory('selectAll', referencePlanet.id);
            this.emitSelectionChanged();
        }

        console.log(`🌟 Seleccionados ${selectedCount} planetas del jugador ${referencePlanet.owner}`);
        return selectedCount;
    }

    /**
     * 🧹 Limpiar toda la selección
     */
    clearSelection(emitEvent = true) {
        if (this.selectedPlanets.size === 0) {
            return false;
        }

        const previousCount = this.selectedPlanets.size;
        this.selectedPlanets.clear();
        this.lastSelectedPlanet = null;
        
        this.addToHistory('clear', null);

        if (emitEvent) {
            if (this.callbacks.onSelectionCleared) {
                this.callbacks.onSelectionCleared({ previousCount });
            }
            this.emitSelectionChanged();
        }

        console.log(`🧹 Selección limpiada (${previousCount} planetas)`);
        return true;
    }

    /**
     * 🔄 Seleccionar planetas en un área rectangular
     */
    selectPlanetsInArea(startX, startY, endX, endY, options = {}) {
        const { isMultiSelect = false } = options;
        
        if (!isMultiSelect) {
            this.clearSelection(false);
        }

        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);

        let selectedCount = 0;
        const planets = this.gameEngine.getAllPlanets();

        planets.forEach(planet => {
            if (planet.x >= minX && planet.x <= maxX && 
                planet.y >= minY && planet.y <= maxY &&
                this.canSelectPlanet(planet)) {
                
                this.selectedPlanets.add(planet.id);
                selectedCount++;
            }
        });

        if (selectedCount > 0) {
            this.addToHistory('areaSelect', { minX, minY, maxX, maxY });
            this.emitSelectionChanged();
        }

        console.log(`🔄 Seleccionados ${selectedCount} planetas en área`);
        return selectedCount;
    }

    /**
     * ✅ Verificar si un planeta puede ser seleccionado
     */
    canSelectPlanet(planet) {
        if (!planet) return false;
        
        // Solo se pueden seleccionar planetas del jugador actual
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        return planet.owner === currentPlayer;
    }

    /**
     * 🔍 Verificar si un planeta está seleccionado
     */
    isPlanetSelected(planetId) {
        return this.selectedPlanets.has(planetId);
    }

    /**
     * 📋 Obtener lista de planetas seleccionados
     */
    getSelectedPlanets() {
        return Array.from(this.selectedPlanets);
    }

    /**
     * 📊 Obtener objetos de planetas seleccionados
     */
    getSelectedPlanetObjects() {
        return this.getSelectedPlanets()
            .map(id => this.gameEngine.getPlanetById(id))
            .filter(planet => planet !== null);
    }

    /**
     * 🎯 Obtener último planeta seleccionado
     */
    getLastSelectedPlanet() {
        return this.lastSelectedPlanet;
    }

    /**
     * 📈 Obtener estadísticas de selección
     */
    getSelectionStats() {
        const selectedPlanets = this.getSelectedPlanetObjects();
        
        return {
            count: selectedPlanets.length,
            totalShips: selectedPlanets.reduce((sum, planet) => sum + planet.ships, 0),
            totalProduction: selectedPlanets.reduce((sum, planet) => sum + planet.production, 0),
            averageShips: selectedPlanets.length > 0 ? 
                selectedPlanets.reduce((sum, planet) => sum + planet.ships, 0) / selectedPlanets.length : 0,
            planetIds: this.getSelectedPlanets()
        };
    }

    /**
     * 📝 Agregar acción al historial
     */
    addToHistory(action, data) {
        this.selectionHistory.push({
            action,
            data,
            timestamp: Date.now(),
            selectedCount: this.selectedPlanets.size
        });

        // Limitar historial
        if (this.selectionHistory.length > this.config.maxHistorySize) {
            this.selectionHistory.shift();
        }
    }

    /**
     * 📢 Emitir evento de cambio de selección
     */
    emitSelectionChanged() {
        const stats = this.getSelectionStats();
        
        if (this.callbacks.onSelectionChanged) {
            this.callbacks.onSelectionChanged({
                selectedPlanets: this.getSelectedPlanets(),
                stats,
                lastSelected: this.lastSelectedPlanet
            });
        }

        // Emitir evento global
        this.gameEngine.eventBus?.emit(GAME_EVENTS.SELECTION_CHANGED, {
            selectedPlanets: this.getSelectedPlanets(),
            stats
        });
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Configuración de SelectionStateManager actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        return {
            selectedCount: this.selectedPlanets.size,
            selectedPlanets: Array.from(this.selectedPlanets),
            lastSelected: this.lastSelectedPlanet,
            historySize: this.selectionHistory.length,
            stats: this.getSelectionStats(),
            config: this.config
        };
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        this.clearSelection(false);
        
        // Limpiar referencias
        this.gameEngine = null;
        this.callbacks = {};
        this.config = null;
        this.selectionHistory = [];
        
        console.log('💥 SelectionStateManager destruido');
    }
} 