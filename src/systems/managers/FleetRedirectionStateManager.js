/**
 * 🎯 FLEET REDIRECTION STATE MANAGER
 * Gestor especializado para el estado de selección de flotas en redirección
 * Responsabilidad única: Gestionar qué flotas están seleccionadas para redirección
 */

import eventBus, { GAME_EVENTS } from '../../core/EventBus.js';

export class FleetRedirectionStateManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado de selección
        this.selectedFleets = new Set();
        this.selectionHistory = [];
        this.maxHistorySize = 10;
        
        // Estadísticas de selección
        this.stats = {
            totalSelections: 0,
            totalDeselections: 0,
            totalRedirections: 0,
            lastSelectionTime: 0,
            averageSelectionSize: 0
        };
        
        // Callbacks configurables
        this.callbacks = {
            onFleetSelected: null,
            onFleetDeselected: null,
            onSelectionCleared: null,
            onSelectionChanged: null
        };
        
        console.log('🎯 FleetRedirectionStateManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * ✅ Seleccionar una sola flota
     */
    selectSingleFleet(fleet) {
        if (!this.isValidFleet(fleet)) {
            console.warn(`⚠️ Flota inválida para selección: ${fleet?.id}`);
            return false;
        }

        const wasSelected = this.selectedFleets.has(fleet.id);
        
        // Limpiar selección anterior
        this.clearSelection(false);
        
        // Seleccionar nueva flota
        this.addFleetToSelection(fleet);
        
        console.log(`✅ Flota ${fleet.id} seleccionada individualmente`);
        return true;
    }

    /**
     * 🔄 Toggle selección de flota
     */
    toggleFleetSelection(fleet) {
        if (!this.isValidFleet(fleet)) {
            console.warn(`⚠️ Flota inválida para toggle: ${fleet?.id}`);
            return false;
        }

        if (this.selectedFleets.has(fleet.id)) {
            return this.removeFleetFromSelection(fleet);
        } else {
            return this.addFleetToSelection(fleet);
        }
    }

    /**
     * ➕ Añadir flota a la selección
     */
    addFleetToSelection(fleet) {
        if (!this.isValidFleet(fleet)) {
            return false;
        }

        if (this.selectedFleets.has(fleet.id)) {
            console.log(`🔄 Flota ${fleet.id} ya estaba seleccionada`);
            return true;
        }

        // Verificar límite máximo de selección
        if (this.selectedFleets.size >= this.config.maxSelectedFleets) {
            console.warn(`⚠️ Límite máximo de flotas seleccionadas alcanzado: ${this.config.maxSelectedFleets}`);
            return false;
        }

        this.selectedFleets.add(fleet.id);
        this.updateStats('selection');
        this.addToHistory('add', fleet.id);
        
        // Emitir eventos
        eventBus.emit(GAME_EVENTS.FLEET_SELECTED, {
            fleetId: fleet.id,
            fleet: fleet,
            selectedCount: this.selectedFleets.size,
            timestamp: Date.now()
        });

        if (this.callbacks.onFleetSelected) {
            this.callbacks.onFleetSelected({
                fleet,
                selectedCount: this.selectedFleets.size,
                isMultiSelection: this.selectedFleets.size > 1
            });
        }

        this.notifySelectionChanged();
        
        console.log(`➕ Flota ${fleet.id} añadida a selección. Total: ${this.selectedFleets.size}`);
        return true;
    }

    /**
     * ➖ Remover flota de la selección
     */
    removeFleetFromSelection(fleet) {
        if (!fleet || !this.selectedFleets.has(fleet.id)) {
            return false;
        }

        this.selectedFleets.delete(fleet.id);
        this.updateStats('deselection');
        this.addToHistory('remove', fleet.id);
        
        // Emitir eventos
        eventBus.emit(GAME_EVENTS.FLEET_DESELECTED, {
            fleetId: fleet.id,
            fleet: fleet,
            selectedCount: this.selectedFleets.size,
            timestamp: Date.now()
        });

        if (this.callbacks.onFleetDeselected) {
            this.callbacks.onFleetDeselected({
                fleet,
                selectedCount: this.selectedFleets.size,
                wasLastSelected: this.selectedFleets.size === 0
            });
        }

        this.notifySelectionChanged();
        
        console.log(`➖ Flota ${fleet.id} removida de selección. Total: ${this.selectedFleets.size}`);
        return true;
    }

    /**
     * 🧹 Limpiar selección de flotas
     */
    clearSelection(notify = true) {
        const previousCount = this.selectedFleets.size;
        
        if (previousCount === 0) {
            return false;
        }

        const clearedFleets = Array.from(this.selectedFleets);
        this.selectedFleets.clear();
        this.addToHistory('clear', clearedFleets);
        
        // Emitir eventos
        if (notify) {
            eventBus.emit(GAME_EVENTS.FLEET_SELECTION_CLEARED, {
                clearedFleets,
                clearedCount: previousCount,
                timestamp: Date.now()
            });

            if (this.callbacks.onSelectionCleared) {
                this.callbacks.onSelectionCleared({
                    clearedFleets,
                    clearedCount: previousCount
                });
            }

            this.notifySelectionChanged();
        }
        
        console.log(`🧹 Selección limpiada. ${previousCount} flotas deseleccionadas`);
        return true;
    }

    /**
     * 🔍 Seleccionar flotas en área
     */
    selectFleetsInArea(centerX, centerY, radius) {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        let selectedCount = 0;
        
        for (const fleet of this.gameEngine.fleets.values()) {
            if (fleet.owner === currentPlayer) {
                const dx = fleet.x - centerX;
                const dy = fleet.y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= radius) {
                    if (this.addFleetToSelection(fleet)) {
                        selectedCount++;
                    }
                }
            }
        }
        
        console.log(`🔍 ${selectedCount} flotas seleccionadas en área (${centerX}, ${centerY}, r=${radius})`);
        return selectedCount;
    }

    /**
     * 🎯 Seleccionar todas las flotas del jugador
     */
    selectAllPlayerFleets() {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        let selectedCount = 0;
        
        for (const fleet of this.gameEngine.fleets.values()) {
            if (fleet.owner === currentPlayer) {
                if (this.addFleetToSelection(fleet)) {
                    selectedCount++;
                }
            }
        }
        
        console.log(`🎯 ${selectedCount} flotas del jugador seleccionadas`);
        return selectedCount;
    }

    /**
     * ✅ Verificar si una flota es válida para selección
     */
    isValidFleet(fleet) {
        if (!fleet || !fleet.id) {
            return false;
        }

        // Verificar que la flota existe en el gameEngine
        const gameFleet = this.gameEngine.fleets.get(fleet.id);
        if (!gameFleet) {
            return false;
        }

        // Verificar que es del jugador actual
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        if (fleet.owner !== currentPlayer) {
            return false;
        }

        // Verificar que está en vuelo
        if (!fleet.isInFlight) {
            return false;
        }

        return true;
    }

    /**
     * 📊 Actualizar estadísticas
     */
    updateStats(action) {
        const now = Date.now();
        
        switch (action) {
            case 'selection':
                this.stats.totalSelections++;
                this.stats.lastSelectionTime = now;
                break;
            case 'deselection':
                this.stats.totalDeselections++;
                break;
            case 'redirection':
                this.stats.totalRedirections++;
                break;
        }
        
        // Calcular promedio de tamaño de selección
        if (this.stats.totalSelections > 0) {
            this.stats.averageSelectionSize = 
                (this.stats.averageSelectionSize * (this.stats.totalSelections - 1) + this.selectedFleets.size) / 
                this.stats.totalSelections;
        }
    }

    /**
     * 📝 Añadir acción al historial
     */
    addToHistory(action, data) {
        const historyEntry = {
            action,
            data,
            timestamp: Date.now(),
            selectionSize: this.selectedFleets.size
        };
        
        this.selectionHistory.push(historyEntry);
        
        // Mantener tamaño del historial
        if (this.selectionHistory.length > this.maxHistorySize) {
            this.selectionHistory.shift();
        }
    }

    /**
     * 🔔 Notificar cambio en selección
     */
    notifySelectionChanged() {
        if (this.callbacks.onSelectionChanged) {
            this.callbacks.onSelectionChanged({
                selectedFleets: Array.from(this.selectedFleets),
                selectedCount: this.selectedFleets.size,
                isEmpty: this.selectedFleets.size === 0,
                stats: { ...this.stats }
            });
        }
    }

    /**
     * 🔍 Obtener flotas seleccionadas
     */
    getSelectedFleets() {
        const fleets = [];
        for (const fleetId of this.selectedFleets) {
            const fleet = this.gameEngine.fleets.get(fleetId);
            if (fleet) {
                fleets.push(fleet);
            } else {
                // Flota ya no existe, remover de selección
                this.selectedFleets.delete(fleetId);
            }
        }
        return fleets;
    }

    /**
     * 🔍 Obtener IDs de flotas seleccionadas
     */
    getSelectedFleetIds() {
        return Array.from(this.selectedFleets);
    }

    /**
     * ❓ Verificar si una flota está seleccionada
     */
    isFleetSelected(fleetId) {
        return this.selectedFleets.has(fleetId);
    }

    /**
     * 📊 Obtener estadísticas de selección
     */
    getSelectionStats() {
        return {
            ...this.stats,
            currentSelectionSize: this.selectedFleets.size,
            hasSelection: this.selectedFleets.size > 0,
            isMultiSelection: this.selectedFleets.size > 1
        };
    }

    /**
     * 📝 Obtener historial de selección
     */
    getSelectionHistory() {
        return [...this.selectionHistory];
    }

    /**
     * 🧹 Limpiar flotas inexistentes de la selección
     */
    cleanupInvalidFleets() {
        let removedCount = 0;
        
        for (const fleetId of this.selectedFleets) {
            const fleet = this.gameEngine.fleets.get(fleetId);
            if (!fleet || !this.isValidFleet(fleet)) {
                this.selectedFleets.delete(fleetId);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`🧹 ${removedCount} flotas inválidas removidas de la selección`);
            this.notifySelectionChanged();
        }
        
        return removedCount;
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Configuración de FleetRedirectionStateManager actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        return {
            selectedFleets: Array.from(this.selectedFleets),
            selectedCount: this.selectedFleets.size,
            stats: { ...this.stats },
            historySize: this.selectionHistory.length,
            config: this.config,
            hasCallbacks: Object.keys(this.callbacks).filter(key => this.callbacks[key] !== null)
        };
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        // Limpiar selección
        this.clearSelection(false);
        
        // Limpiar referencias
        this.gameEngine = null;
        this.callbacks = {};
        this.config = null;
        this.selectionHistory = [];
        
        console.log('💥 FleetRedirectionStateManager destruido');
    }
} 