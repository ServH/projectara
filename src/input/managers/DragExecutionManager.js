/**
 * ⚡ DRAG EXECUTION MANAGER
 * Gestor especializado para la ejecución de acciones del sistema de drag & drop
 * Responsabilidad única: Ejecutar acciones de envío de flotas y eventos
 */

import eventBus from '../../core/EventBus.js';

export class DragExecutionManager {
    constructor(gameEngine, selectionSystem, dragStateManager) {
        this.gameEngine = gameEngine;
        this.selectionSystem = selectionSystem;
        this.dragStateManager = dragStateManager;
        
        // Configuración de ejecución
        this.config = {
            defaultPercentage: 0.8,
            enableEvents: true,
            enableLogging: true
        };
        
        console.log('⚡ DragExecutionManager inicializado');
    }

    /**
     * ⚡ Completar drag & drop
     */
    completeDragDrop() {
        if (!this.dragStateManager.hasValidTarget()) {
            console.log('❌ No hay planeta objetivo válido');
            return false;
        }

        const targetPlanet = this.dragStateManager.targetPlanet;
        console.log(`🎯 Completando drag & drop hacia ${targetPlanet.id}`);

        // Obtener porcentaje del selector
        const percentage = this.getFleetPercentage();

        // Enviar flotas desde planetas seleccionados
        const success = this.sendFleetsFromSelected(targetPlanet, percentage);

        if (success) {
            // Emitir evento de completado
            this.emitDragCompleteEvent(targetPlanet, percentage);
            
            if (this.config.enableLogging) {
                console.log(`✅ Drag & drop completado hacia ${targetPlanet.id} con ${percentage * 100}% de flotas`);
            }
        }

        return success;
    }

    /**
     * ⚡ Obtener porcentaje de flotas a enviar
     */
    getFleetPercentage() {
        // Intentar obtener del selector de porcentaje del gameEngine
        if (this.gameEngine.percentageSelector) {
            return this.gameEngine.percentageSelector.getCurrentFactor();
        }
        
        // Fallback al porcentaje por defecto
        return this.config.defaultPercentage;
    }

    /**
     * ⚡ Enviar flotas desde planetas seleccionados
     */
    sendFleetsFromSelected(targetPlanet, percentage) {
        try {
            // Obtener coordenadas actuales del mouse para el gameEngine
            const currentPos = this.dragStateManager.getState().currentPosition;
            
            // Usar el método del gameEngine para enviar flotas
            this.gameEngine.sendFleetFromSelected(
                targetPlanet.id,
                percentage,
                currentPos.x,
                currentPos.y
            );
            
            return true;
        } catch (error) {
            console.error('❌ Error al enviar flotas:', error);
            return false;
        }
    }

    /**
     * ⚡ Emitir evento de drag completado
     */
    emitDragCompleteEvent(targetPlanet, percentage) {
        if (!this.config.enableEvents) return;
        
        const eventData = {
            targetPlanet: targetPlanet.id,
            selectedPlanets: this.selectionSystem.getSelectedPlanets().length,
            percentage: percentage,
            timestamp: Date.now()
        };
        
        eventBus.emit('dragdrop:complete', eventData);
        
        if (this.config.enableLogging) {
            console.log('📡 Evento dragdrop:complete emitido:', eventData);
        }
    }

    /**
     * ⚡ Validar condiciones para drag & drop
     */
    validateDragConditions() {
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        if (playerPlanets.length === 0) {
            console.log('❌ No hay planetas del jugador seleccionados');
            return false;
        }
        
        if (!this.dragStateManager.hasValidTarget()) {
            console.log('❌ No hay planeta objetivo válido');
            return false;
        }
        
        const targetPlanet = this.dragStateManager.targetPlanet;
        if (targetPlanet.owner === 'player') {
            console.log('❌ No se puede atacar planeta propio');
            return false;
        }
        
        return true;
    }

    /**
     * ⚡ Obtener estadísticas de la operación
     */
    getOperationStats() {
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        const percentage = this.getFleetPercentage();
        
        // Calcular total de naves que se enviarían
        const totalShips = playerPlanets.reduce((total, planet) => {
            return total + Math.floor(planet.ships * percentage);
        }, 0);
        
        return {
            selectedPlanets: playerPlanets.length,
            totalShips: totalShips,
            percentage: percentage,
            targetPlanet: this.dragStateManager.targetPlanet?.id || null,
            canExecute: this.validateDragConditions()
        };
    }

    /**
     * ⚡ Simular drag & drop (para testing)
     */
    simulateDragDrop(targetPlanetId, percentage = null) {
        // Buscar planeta objetivo
        const targetPlanet = this.gameEngine.planets.find(p => p.id === targetPlanetId);
        if (!targetPlanet) {
            console.log(`❌ Planeta objetivo ${targetPlanetId} no encontrado`);
            return false;
        }
        
        // Establecer objetivo en el state manager
        this.dragStateManager.setTargetPlanet(targetPlanet);
        
        // Usar porcentaje específico o el configurado
        const usePercentage = percentage !== null ? percentage : this.getFleetPercentage();
        
        // Ejecutar drag & drop
        return this.completeDragDrop();
    }

    /**
     * ⚡ Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚡ Configuración de ejecución actualizada');
    }

    /**
     * ⚡ Obtener información de debug
     */
    getDebugInfo() {
        return {
            config: this.config,
            hasGameEngine: !!this.gameEngine,
            hasSelectionSystem: !!this.selectionSystem,
            hasDragStateManager: !!this.dragStateManager,
            operationStats: this.getOperationStats(),
            validationResult: this.validateDragConditions()
        };
    }

    /**
     * ⚡ Destruir el manager
     */
    destroy() {
        // Limpiar referencias
        this.gameEngine = null;
        this.selectionSystem = null;
        this.dragStateManager = null;
        
        console.log('💥 DragExecutionManager destruido');
    }
} 