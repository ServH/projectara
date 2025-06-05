/**
 * 🖱️ DRAG EVENT MANAGER
 * Gestor especializado para eventos de mouse del sistema de drag & drop
 * Responsabilidad única: Gestionar eventos de mouse y coordenadas
 */

import eventBus, { GAME_EVENTS } from '../../core/EventBus.js';

export class DragEventManager {
    constructor(gameEngine, selectionSystem, dragStateManager) {
        this.gameEngine = gameEngine;
        this.selectionSystem = selectionSystem;
        this.dragStateManager = dragStateManager;
        
        // Referencias a elementos DOM
        this.canvas = null;
        
        // Callbacks para eventos
        this.onDragStart = null;
        this.onDragUpdate = null;
        this.onDragEnd = null;
        
        this.setupEventListeners();
        console.log('🖱️ DragEventManager inicializado');
    }

    /**
     * 🖱️ Configurar event listeners
     */
    setupEventListeners() {
        const setupListeners = () => {
            this.canvas = document.getElementById('gameCanvas');
            if (this.canvas) {
                // Usar eventos con mayor prioridad para drag & drop
                this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), true);
                this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), true);
                this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), true);
                
                // Eventos del sistema de selección
                eventBus.on(GAME_EVENTS.SELECTION_START, this.onSelectionStart.bind(this));
                eventBus.on(GAME_EVENTS.SELECTION_END, this.onSelectionEnd.bind(this));
                
                console.log('🖱️ Event listeners configurados');
            } else {
                setTimeout(setupListeners, 100);
            }
        };
        setupListeners();
    }

    /**
     * 🖱️ Configurar callbacks
     */
    setCallbacks(onDragStart, onDragUpdate, onDragEnd) {
        this.onDragStart = onDragStart;
        this.onDragUpdate = onDragUpdate;
        this.onDragEnd = onDragEnd;
    }

    /**
     * 🖱️ Manejar mouse down
     */
    onMouseDown(event) {
        if (event.button !== 0) return; // Solo botón izquierdo

        const coords = this.getMouseCoordinates(event);
        const x = coords.x;
        const y = coords.y;

        // Actualizar estado
        this.dragStateManager.initializeDrag(x, y);

        // Verificar planetas seleccionados
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerSelectedPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        console.log(`🖱️ Click en (${Math.round(x)}, ${Math.round(y)}) - Planetas player: ${playerSelectedPlanets.length}`);
        
        // Verificar si hay planetas seleccionados del jugador
        const clickedPlanet = this.gameEngine.getPlanetAtPosition(x, y);
        
        if (clickedPlanet) {
            console.log(`🖱️ Planeta clickeado: ${clickedPlanet.id} (${clickedPlanet.owner})`);
        }
        
        // Solo preparar drag si hay planetas seleccionados Y no estamos clickeando en un planeta del jugador
        if (playerSelectedPlanets.length > 0 && (!clickedPlanet || clickedPlanet.owner !== 'player')) {
            console.log(`🎯 Preparando drag desde ${playerSelectedPlanets.length} planetas seleccionados`);
        } else {
            if (playerSelectedPlanets.length === 0) {
                console.log(`❌ No se puede hacer drag: no hay planetas del player seleccionados`);
            } else if (clickedPlanet && clickedPlanet.owner === 'player') {
                console.log(`❌ No se puede hacer drag: clickeando en planeta propio ${clickedPlanet.id}`);
            }
        }
    }

    /**
     * 🖱️ Manejar movimiento del mouse
     */
    onMouseMove(event) {
        const coords = this.getMouseCoordinates(event);
        this.dragStateManager.updatePosition(coords.x, coords.y);

        // Si no estamos dragging, verificar si debemos iniciar
        if (!this.dragStateManager.isActive()) {
            // Verificar si hay planetas seleccionados
            const selectedPlanets = this.selectionSystem.getSelectedPlanets();
            const playerSelectedPlanets = selectedPlanets.filter(p => p.owner === 'player');
            
            if (this.dragStateManager.shouldStartDrag() && playerSelectedPlanets.length > 0) {
                this.startDrag();
                event.stopPropagation();
            }
            return;
        }

        // Si ya estamos dragging, actualizar
        if (this.dragStateManager.isActive()) {
            this.updateDrag();
            event.stopPropagation();
        }
    }

    /**
     * 🖱️ Manejar mouse up
     */
    onMouseUp(event) {
        if (!this.dragStateManager.isActive()) return;

        console.log(`🔍 MouseUp - targetPlanet: ${this.dragStateManager.targetPlanet?.id || 'none'}`);
        
        // Ejecutar drag & drop si hay objetivo válido
        if (this.dragStateManager.hasValidTarget()) {
            console.log(`🎯 Ejecutando drag & drop automáticamente a ${this.dragStateManager.targetPlanet.id}`);
            this.completeDrag();
            event.stopPropagation();
        } else {
            console.log('🎯 Drag cancelado - no hay objetivo válido');
        }
        
        // Resetear estado
        this.endDrag();
    }

    /**
     * 🖱️ Obtener coordenadas del mouse para Canvas 2D
     */
    getMouseCoordinates(event) {
        if (!this.canvas) return { x: 0, y: 0 };
        
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * 🎯 Iniciar drag
     */
    startDrag() {
        this.dragStateManager.startDrag();
        
        // Verificar planeta objetivo
        this.checkTargetPlanet();
        
        // Callback para iniciar drag
        if (this.onDragStart) {
            this.onDragStart();
        }
        
        // Emitir evento
        eventBus.emit('dragdrop:start', {
            selectedPlanets: this.selectionSystem.getSelectedPlanets().length,
            x: this.dragStateManager.currentX,
            y: this.dragStateManager.currentY
        });
        
        console.log(`🎯 Drag iniciado desde ${this.selectionSystem.getSelectedPlanets().length} planetas`);
    }

    /**
     * 🎯 Actualizar drag
     */
    updateDrag() {
        // Verificar planeta objetivo
        this.checkTargetPlanet();
        
        // Callback para actualizar drag
        if (this.onDragUpdate) {
            this.onDragUpdate();
        }
    }

    /**
     * 🎯 Completar drag
     */
    completeDrag() {
        // Callback para completar drag
        if (this.onDragEnd) {
            this.onDragEnd();
        }
    }

    /**
     * 🎯 Finalizar drag
     */
    endDrag() {
        this.dragStateManager.resetDrag();
    }

    /**
     * 🎯 Verificar planeta objetivo
     */
    checkTargetPlanet() {
        const targetPlanet = this.gameEngine.getPlanetAtPosition(
            this.dragStateManager.currentX, 
            this.dragStateManager.currentY
        );
        
        if (targetPlanet && targetPlanet.owner !== 'player') {
            this.dragStateManager.setTargetPlanet(targetPlanet);
        } else {
            this.dragStateManager.setTargetPlanet(null);
        }
    }

    /**
     * 🖱️ Event handlers del sistema de selección
     */
    onSelectionStart(data) {
        // Si estamos en medio de un drag, cancelarlo
        if (this.dragStateManager.isActive()) {
            this.endDrag();
        }
    }

    onSelectionEnd(data) {
        // Preparar para posible drag & drop
    }

    /**
     * 🖱️ Destruir event listeners
     */
    destroy() {
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this.onMouseDown);
            this.canvas.removeEventListener('mousemove', this.onMouseMove);
            this.canvas.removeEventListener('mouseup', this.onMouseUp);
        }
        
        eventBus.off(GAME_EVENTS.SELECTION_START, this.onSelectionStart);
        eventBus.off(GAME_EVENTS.SELECTION_END, this.onSelectionEnd);
        
        console.log('💥 DragEventManager destruido');
    }

    /**
     * 🖱️ Obtener información de debug
     */
    getDebugInfo() {
        return {
            hasCanvas: !!this.canvas,
            hasCallbacks: {
                onDragStart: !!this.onDragStart,
                onDragUpdate: !!this.onDragUpdate,
                onDragEnd: !!this.onDragEnd
            },
            stateInfo: this.dragStateManager.getDebugInfo()
        };
    }
} 