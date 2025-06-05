/**
 * 🔄 FLEET REDIRECTION SYSTEM - REFACTORIZADO
 * Sistema modular de redirección de flotas con arquitectura SOLID
 * Coordinador principal que integra gestores especializados
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';
import { FleetRedirectionEventManager } from './managers/FleetRedirectionEventManager.js';
import { FleetRedirectionStateManager } from './managers/FleetRedirectionStateManager.js';
import { FleetRedirectionLogicManager } from './managers/FleetRedirectionLogicManager.js';
import { FleetRedirectionVisualizationManager } from './managers/FleetRedirectionVisualizationManager.js';
import { FleetRedirectionIntegrationManager } from './managers/FleetRedirectionIntegrationManager.js';

export class FleetRedirectionSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Configuración unificada del sistema
        this.config = this.createDefaultConfig();
        
        // Gestores especializados (Dependency Injection)
        this.eventManager = null;
        this.stateManager = null;
        this.logicManager = null;
        this.visualizationManager = null;
        this.integrationManager = null;
        
        // Estado del sistema
        this.isInitialized = false;
        this.isActive = true;
        
        console.log('🔄 FleetRedirectionSystem (Refactorizado) inicializado');
    }

    /**
     * ⚙️ Crear configuración por defecto
     */
    createDefaultConfig() {
        return {
            // Configuración de eventos
            selectionRadius: 15,
            multiSelectKey: 'ctrlKey',
            doubleClickThreshold: 300,
            
            // Configuración visual
            redirectionColor: '#ffaa00',
            selectedFleetColor: '#ff6666',
            redirectionLineWidth: 2,
            animationDuration: 300,
            
            // Configuración de lógica
            defaultFleetSpeed: 100,
            maxBatchSize: 10,
            maxSelectedFleets: 50,
            
            // Configuración de integración
            enableAutoRedirection: false,
            enableOrphanedFleetDetection: true,
            
            // Debug
            enableDebugMode: false,
            logLevel: 'info'
        };
    }

    /**
     * 🚀 Inicializar el sistema
     */
    init() {
        if (this.isInitialized) {
            console.warn('⚠️ FleetRedirectionSystem ya está inicializado');
            return false;
        }

        try {
            // Crear gestores especializados
            this.createManagers();
            
            // Configurar callbacks entre gestores
            this.setupManagerCallbacks();
            
            // Inicializar gestores
            this.initializeManagers();
            
            this.isInitialized = true;
            console.log('🚀 FleetRedirectionSystem inicializado exitosamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando FleetRedirectionSystem:', error);
            return false;
        }
    }

    /**
     * 🏗️ Crear gestores especializados
     */
    createManagers() {
        // Event Manager - Manejo de eventos de mouse y teclado
        this.eventManager = new FleetRedirectionEventManager(this.gameEngine, this.config);
        
        // State Manager - Estado de selección de flotas
        this.stateManager = new FleetRedirectionStateManager(this.gameEngine, this.config);
        
        // Logic Manager - Lógica de redirección
        this.logicManager = new FleetRedirectionLogicManager(this.gameEngine, this.config);
        
        // Visualization Manager - Elementos visuales
        this.visualizationManager = new FleetRedirectionVisualizationManager(this.gameEngine, this.config);
        
        // Integration Manager - Integración con gameEngine
        this.integrationManager = new FleetRedirectionIntegrationManager(this.gameEngine, this.config);
        
        console.log('🏗️ Gestores especializados creados');
    }

    /**
     * 🔗 Configurar callbacks entre gestores
     */
    setupManagerCallbacks() {
        // Event Manager callbacks
        this.eventManager.setCallbacks({
            onFleetClick: this.handleFleetClick.bind(this),
            onPlanetClick: this.handlePlanetClick.bind(this),
            onRightClick: this.handleRightClick.bind(this),
            onKeyDown: this.handleKeyDown.bind(this),
            onEmptyAreaClick: this.handleEmptyAreaClick.bind(this)
        });

        // State Manager callbacks
        this.stateManager.setCallbacks({
            onFleetSelected: this.handleFleetSelected.bind(this),
            onFleetDeselected: this.handleFleetDeselected.bind(this),
            onSelectionCleared: this.handleSelectionCleared.bind(this),
            onSelectionChanged: this.handleSelectionChanged.bind(this)
        });

        // Logic Manager callbacks
        this.logicManager.setCallbacks({
            onRedirectionCompleted: this.handleRedirectionCompleted.bind(this),
            onRedirectionFailed: this.handleRedirectionFailed.bind(this),
            onBatchRedirectionCompleted: this.handleBatchRedirectionCompleted.bind(this)
        });

        // Integration Manager callbacks
        this.integrationManager.setCallbacks({
            onFleetLaunched: this.handleFleetLaunched.bind(this),
            onFleetArrived: this.handleFleetArrived.bind(this),
            onGameStateChanged: this.handleGameStateChanged.bind(this)
        });

        console.log('🔗 Callbacks entre gestores configurados');
    }

    /**
     * 🎮 Inicializar gestores
     */
    initializeManagers() {
        // Configurar event listeners
        this.eventManager.setupEventListeners();
        
        // Crear elementos visuales
        this.visualizationManager.createVisualElements();
        
        // Configurar integración con gameEngine
        this.integrationManager.setupGameEngineIntegration();
        
        console.log('🎮 Gestores inicializados');
    }

    /**
     * 🚁 Manejar clic en flota
     */
    handleFleetClick({ fleet, isMultiSelect, isDoubleClick }) {
        if (!this.isActive) return;

        if (isDoubleClick) {
            // Doble clic: seleccionar todas las flotas del mismo tipo
            this.selectAllSimilarFleets(fleet);
        } else if (isMultiSelect) {
            // Multi-selección: toggle flota
            this.stateManager.toggleFleetSelection(fleet);
        } else {
            // Selección simple
            this.stateManager.selectSingleFleet(fleet);
        }
    }

    /**
     * 🪐 Manejar clic en planeta
     */
    handlePlanetClick({ planet, isRedirectionTarget }) {
        if (!this.isActive || !isRedirectionTarget) return;

        const selectedFleets = this.stateManager.getSelectedFleetIds();
        if (selectedFleets.length > 0) {
            this.redirectSelectedFleets(planet);
        }
    }

    /**
     * 🖱️ Manejar clic derecho
     */
    handleRightClick({ targetPlanet }) {
        if (!this.isActive) return;

        const selectedFleets = this.stateManager.getSelectedFleetIds();
        if (selectedFleets.length > 0 && targetPlanet && 
            this.integrationManager.isPlanetValidTarget(targetPlanet)) {
            this.redirectSelectedFleets(targetPlanet);
        }
    }

    /**
     * ⌨️ Manejar teclas
     */
    handleKeyDown({ key, ctrlKey }) {
        if (!this.isActive) return;

        switch (key) {
            case 'Escape':
                this.stateManager.clearSelection();
                break;
            case 'a':
            case 'A':
                if (ctrlKey) {
                    this.stateManager.selectAllPlayerFleets();
                }
                break;
        }
    }

    /**
     * 🌌 Manejar clic en área vacía
     */
    handleEmptyAreaClick() {
        if (!this.isActive) return;
        this.stateManager.clearSelection();
    }

    /**
     * ✅ Manejar flota seleccionada
     */
    handleFleetSelected({ fleet }) {
        this.visualizationManager.createFleetSelectionIndicator(fleet);
    }

    /**
     * ❌ Manejar flota deseleccionada
     */
    handleFleetDeselected({ fleet }) {
        this.visualizationManager.removeFleetSelectionIndicator(fleet.id);
    }

    /**
     * 🧹 Manejar selección limpiada
     */
    handleSelectionCleared() {
        this.visualizationManager.clearAllIndicators();
    }

    /**
     * 🔄 Manejar cambio de selección
     */
    handleSelectionChanged({ selectedCount }) {
        // Emitir evento para otros sistemas
        eventBus.emit('fleet_redirection:selection_changed', {
            selectedCount,
            timestamp: Date.now()
        });
    }

    /**
     * ✅ Manejar redirección completada
     */
    handleRedirectionCompleted({ fleet, newTarget }) {
        console.log(`✅ Redirección completada: ${fleet.id} → ${newTarget.id}`);
    }

    /**
     * ❌ Manejar redirección fallida
     */
    handleRedirectionFailed({ fleet, error }) {
        console.error(`❌ Redirección fallida para ${fleet.id}: ${error}`);
    }

    /**
     * 🎯 Manejar redirección en lote completada
     */
    handleBatchRedirectionCompleted({ targetPlanet, results }) {
        // Mostrar feedback visual
        this.visualizationManager.showRedirectionFeedback(targetPlanet, results.redirectedCount);
        
        // Limpiar selección después de redirección exitosa
        if (results.redirectedCount > 0) {
            this.stateManager.clearSelection();
        }
    }

    /**
     * 🚁 Manejar lanzamiento de flota
     */
    handleFleetLaunched(data) {
        // Lógica adicional si es necesaria
    }

    /**
     * 🎯 Manejar llegada de flota
     */
    handleFleetArrived(data) {
        // Remover de selección si estaba seleccionada
        if (this.stateManager.isFleetSelected(data.fleetId)) {
            const fleet = this.gameEngine.fleets.get(data.fleetId);
            if (fleet) {
                this.stateManager.removeFleetFromSelection(fleet);
            }
        }
    }

    /**
     * 🎮 Manejar cambio de estado del juego
     */
    handleGameStateChanged({ newState }) {
        if (newState === 'paused') {
            this.isActive = false;
        } else if (newState === 'playing') {
            this.isActive = true;
        }
    }

    /**
     * 🎯 Redirigir flotas seleccionadas
     */
    redirectSelectedFleets(targetPlanet) {
        const selectedFleetIds = this.stateManager.getSelectedFleetIds();
        
        if (selectedFleetIds.length === 0) {
            console.warn('⚠️ No hay flotas seleccionadas para redirigir');
            return false;
        }

        return this.logicManager.redirectFleets(selectedFleetIds, targetPlanet);
    }

    /**
     * 🔍 Seleccionar todas las flotas similares
     */
    selectAllSimilarFleets(referenceFleet) {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        let selectedCount = 0;
        
        for (const fleet of this.gameEngine.fleets.values()) {
            if (fleet.owner === currentPlayer && 
                fleet.isInFlight && 
                fleet.ships === referenceFleet.ships) {
                if (this.stateManager.addFleetToSelection(fleet)) {
                    selectedCount++;
                }
            }
        }
        
        console.log(`🔍 ${selectedCount} flotas similares seleccionadas`);
        return selectedCount;
    }

    /**
     * 🔄 Actualizar sistema (llamado desde el game loop)
     */
    update() {
        if (!this.isInitialized || !this.isActive) return;

        // Actualizar indicadores visuales
        this.visualizationManager.updateSelectionIndicators();
        
        // Limpiar flotas inválidas de la selección
        this.stateManager.cleanupInvalidFleets();
        
        // Procesar cola de redirecciones
        this.logicManager.processRedirectionQueue();
        
        // Limpiar redirecciones completadas
        this.logicManager.cleanupCompletedRedirections();
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Propagar configuración a gestores
        this.eventManager?.updateConfig(this.config);
        this.stateManager?.updateConfig(this.config);
        this.logicManager?.updateConfig(this.config);
        this.integrationManager?.updateConfig(this.config);
        
        console.log('🔄 Configuración del sistema actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        if (!this.isInitialized) {
            return { error: 'Sistema no inicializado' };
        }

        return {
            system: {
                isInitialized: this.isInitialized,
                isActive: this.isActive,
                config: this.config
            },
            eventManager: this.eventManager.getDebugInfo(),
            stateManager: this.stateManager.getDebugInfo(),
            logicManager: this.logicManager.getDebugInfo(),
            visualizationManager: this.visualizationManager.getDebugInfo(),
            integrationManager: this.integrationManager.getDebugInfo()
        };
    }

    /**
     * 💥 Destruir el sistema
     */
    destroy() {
        // Destruir gestores en orden inverso
        this.integrationManager?.destroy();
        this.visualizationManager?.destroy();
        this.logicManager?.destroy();
        this.stateManager?.destroy();
        this.eventManager?.destroy();
        
        // Limpiar referencias
        this.gameEngine = null;
        this.config = null;
        this.isInitialized = false;
        this.isActive = false;
        
        console.log('💥 FleetRedirectionSystem destruido');
    }

    // ==========================================
    // API PÚBLICA DE COMPATIBILIDAD
    // ==========================================

    /**
     * 🔍 Obtener flota en posición (API de compatibilidad)
     */
    getFleetAtPosition(x, y) {
        return this.eventManager?.getFleetAtPosition(x, y) || null;
    }

    /**
     * ✅ Verificar si punto está en flota (API de compatibilidad)
     */
    isPointInFleet(x, y, fleet) {
        return this.eventManager?.isPointInFleet(x, y, fleet) || false;
    }

    /**
     * 🔄 Actualizar indicadores de selección (API de compatibilidad)
     */
    updateSelectionIndicators() {
        this.visualizationManager?.updateSelectionIndicators();
    }

    /**
     * 🧹 Limpiar selección de flotas (API de compatibilidad)
     */
    clearFleetSelection() {
        this.stateManager?.clearSelection();
    }
} 