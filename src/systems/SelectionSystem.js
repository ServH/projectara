/**
 * 🎯 SELECTION SYSTEM REFACTORIZADO
 * Sistema de selección modular con gestores especializados
 * Responsabilidad única: Coordinar la selección de planetas
 * 
 * ARQUITECTURA MODULAR:
 * - SelectionEventManager: Eventos de mouse y teclado
 * - SelectionStateManager: Estado de selección
 * - SelectionDragManager: Selección por arrastre
 * - SelectionVisualizationManager: Renderizado visual
 * - SelectionOverlayManager: Overlay y UI
 */

import { GAME_EVENTS } from '../core/EventBus.js';
import { SelectionEventManager } from './managers/SelectionEventManager.js';
import { SelectionStateManager } from './managers/SelectionStateManager.js';
import { SelectionDragManager } from './managers/SelectionDragManager.js';
import { SelectionVisualizationManager } from './managers/SelectionVisualizationManager.js';
import { SelectionOverlayManager } from './managers/SelectionOverlayManager.js';

export class SelectionSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // 🎛️ Configuración unificada
        this.config = this.createDefaultConfig();
        
        // 🎯 Gestores especializados
        this.eventManager = null;
        this.stateManager = null;
        this.dragManager = null;
        this.visualizationManager = null;
        this.overlayManager = null;
        
        // 🔄 Estado del sistema
        this.isInitialized = false;
        this.lastUpdateTime = 0;
        
        console.log('🎯 SelectionSystem refactorizado inicializado');
        this.initializeWhenReady();
    }

    /**
     * ⚙️ Crear configuración por defecto
     */
    createDefaultConfig() {
        return {
            // Configuración de eventos
            multiSelectKey: 'ctrlKey',
            selectAllKey: 'shiftKey',
            doubleClickThreshold: 300,
            
            // Configuración de drag
            minDragDistance: 5,
            defaultPlanetRadius: 20,
            
            // Configuración visual
            selectionColor: '#00ff00',
            selectionAlpha: 0.8,
            selectionLineWidth: 2,
            selectionRingOffset: 5,
            pulseMagnitude: 3,
            pulseSpeed: 0.003,
            
            // Configuración de glow
            showSelectionGlow: true,
            glowColor: '#00ff00',
            glowAlpha: 0.3,
            glowOffset: 10,
            glowPulseMagnitude: 5,
            
            // Configuración de esquinas
            showSelectionCorners: false,
            cornerSize: 8,
            cornerOffset: 25,
            cornerColor: '#ffffff',
            cornerLineWidth: 2,
            
            // Configuración de información
            showPlanetInfo: true,
            showDetailedInfo: true,
            infoOffset: 30,
            infoFont: '12px Arial',
            infoTextColor: '#ffffff',
            infoLineHeight: 16,
            minRadiusForDetails: 30,
            
            // Configuración de estadísticas
            showSelectionStats: true,
            statsPosition: { x: 10, y: 10 },
            statsWidth: 200,
            statsHeight: 80,
            statsBackgroundColor: 'rgba(0, 0, 0, 0.7)',
            statsTextColor: '#ffffff',
            statsFont: '14px Arial',
            statsLineHeight: 18,
            statsPadding: 10,
            
            // Configuración de overlay
            gameContainerId: 'gameContainer',
            overlayZIndex: 1000,
            
            // Configuración de drag overlay
            normalSelectColor: '#00ff00',
            normalSelectFillColor: 'rgba(0, 255, 0, 0.1)',
            multiSelectColor: '#ffff00',
            multiSelectFillColor: 'rgba(255, 255, 0, 0.1)',
            dragLineWidth: 2,
            dragAlpha: 0.8,
            
            // Configuración de overlay de drag
            normalSelectBorderColor: '#00ff00',
            normalSelectBackgroundColor: 'rgba(0, 255, 0, 0.1)',
            multiSelectBorderColor: '#ffff00',
            multiSelectBackgroundColor: 'rgba(255, 255, 0, 0.1)',
            dragBorderWidth: 2,
            dragBorderStyle: 'solid',
            useDragAnimation: false,
            dragAnimationDuration: 100,
            useDragShadow: true,
            dragShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            
            // Configuración de información overlay
            infoBackgroundColor: 'rgba(0, 0, 0, 0.8)',
            infoBorderColor: '#333333',
            infoPadding: 8,
            infoBorderRadius: 4,
            infoFontFamily: 'Arial, sans-serif',
            infoFontSize: 12,
            infoZIndex: 1001,
            useInfoShadow: true,
            infoShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            
            // Configuración de indicadores
            indicatorSize: 20,
            indicatorBorderWidth: 2,
            indicatorColor: '#00ff00',
            useIndicatorAnimation: true,
            indicatorAnimationDuration: 1000,
            
            // Configuración de historial
            maxHistorySize: 100
        };
    }

    /**
     * 🎬 Inicializar cuando esté listo
     */
    initializeWhenReady() {
        const checkCanvas = () => {
            const canvas = document.getElementById('gameCanvas');
            if (canvas && this.gameEngine) {
                this.initializeManagers();
                this.setupCallbacks();
                this.isInitialized = true;
                console.log('🎯 SelectionSystem completamente inicializado');
            } else {
                setTimeout(checkCanvas, 100);
            }
        };
        checkCanvas();
    }

    /**
     * 🏗️ Inicializar gestores especializados
     */
    initializeManagers() {
        // Crear gestores con dependency injection
        this.eventManager = new SelectionEventManager(this.gameEngine, this.config);
        this.stateManager = new SelectionStateManager(this.gameEngine, this.config);
        this.dragManager = new SelectionDragManager(this.gameEngine, this.config);
        this.visualizationManager = new SelectionVisualizationManager(this.gameEngine, this.config);
        this.overlayManager = new SelectionOverlayManager(this.gameEngine, this.config);
        
        // Configurar event listeners
        this.eventManager.setupEventListeners();
        this.overlayManager.initializeOverlay();
        this.overlayManager.addDynamicStyles();
        
        console.log('🏗️ Gestores especializados inicializados');
    }

    /**
     * 🔗 Configurar callbacks entre gestores
     */
    setupCallbacks() {
        // Callbacks del EventManager
        this.eventManager.setCallbacks({
            onPlanetClick: this.handlePlanetClick.bind(this),
            onDragStart: this.handleDragStart.bind(this),
            onDragMove: this.handleDragMove.bind(this),
            onDragEnd: this.handleDragEnd.bind(this),
            onRightClick: this.handleRightClick.bind(this),
            onKeyDown: this.handleKeyDown.bind(this)
        });

        // Callbacks del StateManager
        this.stateManager.setCallbacks({
            onSelectionChanged: this.handleSelectionChanged.bind(this),
            onPlanetSelected: this.handlePlanetSelected.bind(this),
            onPlanetDeselected: this.handlePlanetDeselected.bind(this),
            onSelectionCleared: this.handleSelectionCleared.bind(this)
        });

        // Callbacks del DragManager
        this.dragManager.setCallbacks({
            onDragStart: this.handleDragVisualizationStart.bind(this),
            onDragUpdate: this.handleDragVisualizationUpdate.bind(this),
            onDragEnd: this.handleDragVisualizationEnd.bind(this),
            onPlanetsSelected: this.handleDragPlanetsSelected.bind(this)
        });

        // Callbacks del VisualizationManager
        this.visualizationManager.setCallbacks({
            onRenderComplete: this.handleRenderComplete.bind(this),
            onAnimationUpdate: this.handleAnimationUpdate.bind(this)
        });

        // Callbacks del OverlayManager
        this.overlayManager.setCallbacks({
            onOverlayCreated: this.handleOverlayCreated.bind(this),
            onOverlayUpdated: this.handleOverlayUpdated.bind(this),
            onOverlayDestroyed: this.handleOverlayDestroyed.bind(this)
        });

        console.log('🔗 Callbacks configurados entre gestores');
    }

    /**
     * 🪐 Manejar clic en planeta
     */
    handlePlanetClick({ planet, event, coords, isMultiSelect, isSelectAll, isDoubleClick }) {
        console.log(`🪐 Clic en planeta ${planet.id}: multi=${isMultiSelect}, selectAll=${isSelectAll}, double=${isDoubleClick}`);
        
        if (planet.owner === this.gameEngine.getCurrentPlayer()) {
            // Planeta del jugador
            if (isSelectAll || isDoubleClick) {
                this.stateManager.selectAllPlanetsOfType(planet);
            } else if (isMultiSelect) {
                this.stateManager.selectPlanet(planet.id, { isMultiSelect: true });
            } else {
                this.stateManager.selectPlanet(planet.id, { clearPrevious: true });
            }
        } else {
            // Planeta enemigo/neutral - enviar flotas
            if (this.stateManager.getSelectedPlanets().length > 0) {
                this.gameEngine.sendFleetFromSelected(planet.id);
                this.showAttackFeedback(planet);
            }
        }
    }

    /**
     * 🎬 Manejar inicio de drag
     */
    handleDragStart({ event, coords, isMultiSelect }) {
        console.log(`🎬 Iniciando drag selection en (${coords.x}, ${coords.y})`);
        this.dragManager.startDrag(coords.x, coords.y, { isMultiSelect });
    }

    /**
     * 🔄 Manejar movimiento de drag
     */
    handleDragMove({ event, coords }) {
        this.dragManager.updateDrag(coords.x, coords.y);
    }

    /**
     * 🏁 Manejar fin de drag
     */
    handleDragEnd({ event, coords }) {
        const selectedPlanets = this.dragManager.endDrag(coords.x, coords.y);
        console.log(`🏁 Drag finalizado: ${selectedPlanets.length} planetas seleccionados`);
    }

    /**
     * 🖱️ Manejar clic derecho
     */
    handleRightClick({ event, coords, targetPlanet }) {
        if (targetPlanet && targetPlanet.owner !== this.gameEngine.getCurrentPlayer()) {
            console.log(`🖱️ Clic derecho: enviando flotas a ${targetPlanet.id}`);
            this.gameEngine.sendFleetFromSelected(targetPlanet.id);
            this.showAttackFeedback(targetPlanet);
        }
    }

    /**
     * ⌨️ Manejar teclas
     */
    handleKeyDown({ event, key, ctrlKey, shiftKey }) {
        switch (key.toLowerCase()) {
            case 'a':
                if (ctrlKey) {
                    event.preventDefault();
                    this.selectAllPlayerPlanets();
                }
                break;
            case 'escape':
                this.clearSelection();
                break;
        }
    }

    /**
     * 🔄 Manejar cambio de selección
     */
    handleSelectionChanged({ selectedPlanets, stats, lastSelected }) {
        // Actualizar visualización
        this.visualizationManager.updateSelectedPlanets(selectedPlanets);
        
        // Actualizar overlay si está habilitado
        if (this.config.showSelectionStats && stats.count > 0) {
            this.overlayManager.createSelectionInfoOverlay(stats, this.config.statsPosition);
        } else {
            this.overlayManager.removeSelectionInfoOverlay();
        }
        
        // Emitir evento global
        this.gameEngine.eventBus?.emit(GAME_EVENTS.SELECTION_CHANGED, {
            selectedPlanets,
            stats
        });
        
        console.log(`🔄 Selección actualizada: ${stats.count} planetas`);
    }

    /**
     * ✅ Manejar planeta seleccionado
     */
    handlePlanetSelected({ planet, planetId }) {
        console.log(`✅ Planeta ${planetId} seleccionado`);
    }

    /**
     * ❌ Manejar planeta deseleccionado
     */
    handlePlanetDeselected({ planet, planetId }) {
        console.log(`❌ Planeta ${planetId} deseleccionado`);
    }

    /**
     * 🧹 Manejar limpieza de selección
     */
    handleSelectionCleared({ previousCount }) {
        console.log(`🧹 Selección limpiada (${previousCount} planetas)`);
    }

    /**
     * 🎨 Manejar inicio de visualización de drag
     */
    handleDragVisualizationStart({ startX, startY, isMultiSelect }) {
        this.overlayManager.createDragOverlay({
            startX, startY,
            currentX: startX,
            currentY: startY,
            isMultiSelect
        });
    }

    /**
     * 🔄 Manejar actualización de visualización de drag
     */
    handleDragVisualizationUpdate({ currentX, currentY, area }) {
        const dragState = this.dragManager.getDragState();
        this.overlayManager.updateDragOverlay({
            startX: dragState.startX,
            startY: dragState.startY,
            currentX,
            currentY,
            isMultiSelect: dragState.isMultiSelect
        });
    }

    /**
     * 🏁 Manejar fin de visualización de drag
     */
    handleDragVisualizationEnd({ endX, endY, area, selectedPlanets, cancelled }) {
        this.overlayManager.removeDragOverlay();
        
        if (!cancelled && selectedPlanets && selectedPlanets.length > 0) {
            // Actualizar selección con planetas encontrados
            const dragState = this.dragManager.getDragState();
            selectedPlanets.forEach(planet => {
                this.stateManager.selectPlanet(planet.id, { 
                    isMultiSelect: dragState.isMultiSelect,
                    addToHistory: false 
                });
            });
        }
    }

    /**
     * 🎯 Manejar planetas seleccionados por drag
     */
    handleDragPlanetsSelected({ planets, area, isMultiSelect }) {
        console.log(`🎯 ${planets.length} planetas seleccionados por drag`);
    }

    /**
     * 🎨 Manejar renderizado completo
     */
    handleRenderComplete({ renderedCount, renderTime }) {
        // Opcional: métricas de rendimiento
    }

    /**
     * 🎬 Manejar actualización de animación
     */
    handleAnimationUpdate({ animationTime, deltaTime }) {
        // Opcional: sincronización de animaciones
    }

    /**
     * 🖼️ Manejar overlay creado
     */
    handleOverlayCreated({ overlayElement }) {
        console.log('🖼️ Overlay de selección creado');
    }

    /**
     * 🔄 Manejar overlay actualizado
     */
    handleOverlayUpdated({ type, dragData, element }) {
        // Opcional: tracking de cambios de overlay
    }

    /**
     * 💥 Manejar overlay destruido
     */
    handleOverlayDestroyed() {
        console.log('💥 Overlay de selección destruido');
    }

    /**
     * 🚀 Mostrar feedback de ataque
     */
    showAttackFeedback(targetPlanet) {
        // Implementar feedback visual de ataque
        console.log(`🚀 Feedback de ataque a planeta ${targetPlanet.id}`);
        
        // Opcional: crear efecto visual temporal
        if (this.overlayManager) {
            // Crear indicador temporal de ataque
            // Implementación específica según necesidades
        }
    }

    /**
     * 🌟 Seleccionar todos los planetas del jugador
     */
    selectAllPlayerPlanets() {
        const playerPlanets = this.gameEngine.getPlayerPlanets(this.gameEngine.getCurrentPlayer());
        if (playerPlanets.length > 0) {
            this.stateManager.selectAllPlanetsOfType(playerPlanets[0]);
        }
    }

    /**
     * 🧹 Limpiar selección
     */
    clearSelection() {
        this.stateManager.clearSelection();
    }

    /**
     * 🔄 Actualizar sistema (llamado desde game loop)
     */
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        this.lastUpdateTime += deltaTime;
        
        // Actualizar animaciones
        this.visualizationManager.updateAnimations(deltaTime);
    }

    /**
     * 🎨 Renderizar (llamado desde render loop)
     */
    render(ctx, camera) {
        if (!this.isInitialized) return;
        
        // Renderizar visualización de selección
        this.visualizationManager.render(ctx, camera);
        
        // Renderizar drag selection si está activo
        const dragRenderData = this.dragManager.getRenderData();
        if (dragRenderData) {
            this.renderDragSelection(ctx, dragRenderData);
        }
    }

    /**
     * 🔲 Renderizar selección por drag
     */
    renderDragSelection(ctx, renderData) {
        const { area, style } = renderData;
        
        ctx.save();
        ctx.strokeStyle = style.strokeColor;
        ctx.fillStyle = style.fillColor;
        ctx.lineWidth = style.lineWidth;
        ctx.globalAlpha = style.alpha;
        
        ctx.fillRect(area.minX, area.minY, area.width, area.height);
        ctx.strokeRect(area.minX, area.minY, area.width, area.height);
        
        ctx.restore();
    }

    // ==================== API PÚBLICA ====================

    /**
     * 📋 Obtener planetas seleccionados
     */
    getSelectedPlanets() {
        return this.stateManager ? this.stateManager.getSelectedPlanets() : [];
    }

    /**
     * 📊 Obtener objetos de planetas seleccionados
     */
    getSelectedPlanetObjects() {
        return this.stateManager ? this.stateManager.getSelectedPlanetObjects() : [];
    }

    /**
     * 📈 Obtener estadísticas de selección
     */
    getSelectionStats() {
        return this.stateManager ? this.stateManager.getSelectionStats() : null;
    }

    /**
     * 🔍 Verificar si un planeta está seleccionado
     */
    isPlanetSelected(planetId) {
        return this.stateManager ? this.stateManager.isPlanetSelected(planetId) : false;
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        if (!this.isInitialized) {
            return { initialized: false };
        }
        
        return {
            initialized: this.isInitialized,
            lastUpdateTime: this.lastUpdateTime,
            eventManager: this.eventManager.getDebugInfo(),
            stateManager: this.stateManager.getDebugInfo(),
            dragManager: this.dragManager.getDebugInfo(),
            visualizationManager: this.visualizationManager.getDebugInfo(),
            overlayManager: this.overlayManager.getDebugInfo(),
            config: this.config
        };
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Propagar configuración a gestores
        if (this.eventManager) this.eventManager.updateConfig(this.config);
        if (this.stateManager) this.stateManager.updateConfig(this.config);
        if (this.dragManager) this.dragManager.updateConfig(this.config);
        if (this.visualizationManager) this.visualizationManager.updateConfig(this.config);
        if (this.overlayManager) this.overlayManager.updateConfig(this.config);
        
        console.log('🔄 Configuración de SelectionSystem actualizada');
    }

    /**
     * 💥 Destruir el sistema
     */
    destroy() {
        // Destruir gestores en orden inverso
        if (this.overlayManager) {
            this.overlayManager.destroy();
            this.overlayManager = null;
        }
        
        if (this.visualizationManager) {
            this.visualizationManager.destroy();
            this.visualizationManager = null;
        }
        
        if (this.dragManager) {
            this.dragManager.destroy();
            this.dragManager = null;
        }
        
        if (this.stateManager) {
            this.stateManager.destroy();
            this.stateManager = null;
        }
        
        if (this.eventManager) {
            this.eventManager.destroy();
            this.eventManager = null;
        }
        
        // Limpiar referencias
        this.gameEngine = null;
        this.config = null;
        this.isInitialized = false;
        
        console.log('💥 SelectionSystem destruido');
    }
} 