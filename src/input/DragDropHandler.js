import eventBus from '../core/EventBus.js';
/**
 * 🎯 DRAG & DROP HANDLER - REFACTORIZADO FASE 6
 * Sistema de drag & drop modular con gestores especializados
 * Aplicando principios SOLID y patrones de diseño
 */

import { DragStateManager } from './managers/DragStateManager.js';
import { DragEventManager } from './managers/DragEventManager.js';
import { DragVisualizationManager } from './managers/DragVisualizationManager.js';
import { DragExecutionManager } from './managers/DragExecutionManager.js';

export class DragDropHandler {
    constructor(gameEngine, selectionSystem, config = {}) {
        this.gameEngine = gameEngine;
        this.selectionSystem = selectionSystem;
        
        // Configuración unificada
        this.config = {
            dragThreshold: 15,
            lineColor: '#ffaa00',
            lineWidth: 2,
            lineOpacity: 0.7,
            selectedLineColor: '#00ff88',
            selectedLineWidth: 3,
            defaultPercentage: 0.8,
            enableEvents: true,
            enableLogging: true,
            ...config
        };
        
        // Inicializar gestores especializados con Dependency Injection
        this.initializeManagers();
        
        // Configurar callbacks entre gestores
        this.setupManagerCallbacks();
        
        console.log('🎯 DragDropHandler refactorizado inicializado');
    }

    /**
     * 🏗️ Inicializar gestores especializados
     */
    initializeManagers() {
        // 1. Gestor de estado (sin dependencias)
        this.stateManager = new DragStateManager({
            dragThreshold: this.config.dragThreshold
        });
        
        // 2. Gestor de visualización (depende de state)
        this.visualizationManager = new DragVisualizationManager(
            this.selectionSystem,
            this.stateManager,
            {
                lineColor: this.config.lineColor,
                lineWidth: this.config.lineWidth,
                lineOpacity: this.config.lineOpacity,
                selectedLineColor: this.config.selectedLineColor,
                selectedLineWidth: this.config.selectedLineWidth
            }
        );
        
        // 3. Gestor de ejecución (depende de state)
        this.executionManager = new DragExecutionManager(
            this.gameEngine,
            this.selectionSystem,
            this.stateManager
        );
        
        // 4. Gestor de eventos (depende de state, coordina con otros)
        this.eventManager = new DragEventManager(
            this.gameEngine,
            this.selectionSystem,
            this.stateManager
        );
    }

    /**
     * 🔗 Configurar callbacks entre gestores
     */
    setupManagerCallbacks() {
        // Configurar callbacks del gestor de eventos
        this.eventManager.setCallbacks(
            this.onDragStart.bind(this),    // Callback para iniciar drag
            this.onDragUpdate.bind(this),   // Callback para actualizar drag
            this.onDragEnd.bind(this)       // Callback para finalizar drag
        );
    }

    /**
     * 🎯 Callback: Iniciar drag
     */
    onDragStart() {
        // Crear elementos visuales
        this.visualizationManager.createPreviewElements();
        
        console.log('🎯 Drag iniciado - elementos visuales creados');
    }

    /**
     * 🎯 Callback: Actualizar drag
     */
    onDragUpdate() {
        // Actualizar preview visual
        this.visualizationManager.updateDragPreview();
    }

    /**
     * 🎯 Callback: Finalizar drag
     */
    onDragEnd() {
        // Ejecutar drag & drop
        const success = this.executionManager.completeDragDrop();
        
        if (success) {
            // Mostrar efecto de lanzamiento
            this.visualizationManager.showLaunchEffect();
        }
        
        // Limpiar visualización
        this.visualizationManager.resetVisualization();
        
        console.log(`🎯 Drag finalizado - ${success ? 'exitoso' : 'fallido'}`);
    }

    /**
     * 🎯 Verificar si está en modo drag
     */
    isDragActive() {
        return this.stateManager.isActive();
    }

    /**
     * 🎯 Obtener estado actual del drag
     */
    getDragState() {
        return this.stateManager.getState();
    }

    /**
     * 🎯 Obtener estadísticas de la operación
     */
    getOperationStats() {
        return this.executionManager.getOperationStats();
    }

    /**
     * 🎯 Simular drag & drop (para testing)
     */
    simulateDragDrop(targetPlanetId, percentage = null) {
        return this.executionManager.simulateDragDrop(targetPlanetId, percentage);
    }

    /**
     * 🎯 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Propagar configuración a gestores
        if (newConfig.dragThreshold !== undefined) {
            this.stateManager.config.dragThreshold = newConfig.dragThreshold;
        }
        
        // Actualizar configuración visual
        const visualConfig = {};
        ['lineColor', 'lineWidth', 'lineOpacity', 'selectedLineColor', 'selectedLineWidth'].forEach(key => {
            if (newConfig[key] !== undefined) {
                visualConfig[key] = newConfig[key];
            }
        });
        if (Object.keys(visualConfig).length > 0) {
            this.visualizationManager.updateConfig(visualConfig);
        }
        
        // Actualizar configuración de ejecución
        const execConfig = {};
        ['defaultPercentage', 'enableEvents', 'enableLogging'].forEach(key => {
            if (newConfig[key] !== undefined) {
                execConfig[key] = newConfig[key];
            }
        });
        if (Object.keys(execConfig).length > 0) {
            this.executionManager.updateConfig(execConfig);
        }
        
        console.log('🎯 Configuración actualizada');
    }

    /**
     * 🎯 Obtener información de debug completa
     */
    getDebugInfo() {
        return {
            config: this.config,
            managers: {
                state: this.stateManager.getDebugInfo(),
                events: this.eventManager.getDebugInfo(),
                visualization: this.visualizationManager.getDebugInfo(),
                execution: this.executionManager.getDebugInfo()
            },
            isDragActive: this.isDragActive(),
            operationStats: this.getOperationStats()
        };
    }

    /**
     * 🎯 Validar estado de todos los gestores
     */
    validateManagers() {
        const validation = {
            stateManager: !!this.stateManager,
            eventManager: !!this.eventManager,
            visualizationManager: !!this.visualizationManager,
            executionManager: !!this.executionManager,
            overlaySystem: this.visualizationManager.isOverlayAvailable(),
            gameEngine: !!this.gameEngine,
            selectionSystem: !!this.selectionSystem
        };
        
        const allValid = Object.values(validation).every(v => v === true);
        
        if (!allValid) {
            console.warn('⚠️ Algunos gestores no están disponibles:', validation);
        }
        
        return { isValid: allValid, details: validation };
    }

    /**
     * 🎯 Destruir el handler y todos sus gestores
     */
    destroy() {
        // Destruir gestores en orden inverso
        if (this.eventManager) {
            this.eventManager.destroy();
            this.eventManager = null;
        }
        
        if (this.executionManager) {
            this.executionManager.destroy();
            this.executionManager = null;
        }
        
        if (this.visualizationManager) {
            this.visualizationManager.destroy();
            this.visualizationManager = null;
        }
        
        if (this.stateManager) {
            this.stateManager = null;
        }
        
        // Limpiar referencias
        this.gameEngine = null;
        this.selectionSystem = null;
        
        console.log('💥 DragDropHandler refactorizado destruido');
    }

    setupEventListeners() {
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }
    }

    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Emitir evento de mouse down
        eventBus.emit('MOUSE_DOWN', { x, y, event });
    }

    handleMouseUp(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Emitir evento de mouse up
        eventBus.emit('MOUSE_UP', { x, y, event });
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Emitir evento de mouse move
        eventBus.emit('MOUSE_MOVE', { x, y, event });
    }

}