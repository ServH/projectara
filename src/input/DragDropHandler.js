/**
 * 🎯 GALCON GAME - DRAG & DROP HANDLER (CANVAS 2D ONLY)
 * Sistema de drag & drop para envío de flotas estilo Galcon
 * Optimizado para Canvas 2D únicamente
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class DragDropHandler {
    constructor(gameEngine, selectionSystem) {
        this.gameEngine = gameEngine;
        this.selectionSystem = selectionSystem;
        
        // Estado del drag
        this.isDragging = false;
        this.dragStartPlanet = null;
        this.targetPlanet = null;
        this.currentX = 0;
        this.currentY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // 🎮 Canvas 2D únicamente
        this.overlaySystem = null;
        
        // Elementos visuales Canvas
        this.previewLines = []; // Array de líneas desde múltiples planetas
        this.targetHighlight = null;
        
        // Configuración
        this.config = {
            dragThreshold: 15,
            lineColor: '#ffaa00',
            lineWidth: 2,
            lineOpacity: 0.7,
            selectedLineColor: '#00ff88',
            selectedLineWidth: 3
        };
        
        this.setupEventListeners();
        console.log('🎯 DragDropHandler inicializado para Canvas 2D');
    }

    /**
     * 🎮 Configurar sistema de overlay Canvas
     */
    setupOverlaySystem() {
        // Esperar a que el overlay esté disponible
        const checkOverlay = () => {
            if (window.canvasOverlay) {
                this.overlaySystem = window.canvasOverlay;
                console.log('🎮 DragDropHandler: Sistema de overlay Canvas conectado');
                return true;
            }
            return false;
        };
        
        if (!checkOverlay()) {
            // Reintentar cada 100ms hasta que esté disponible
            const retryInterval = setInterval(() => {
                if (checkOverlay()) {
                    clearInterval(retryInterval);
                }
            }, 100);
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Esperar a que el canvas esté listo
        const setupListeners = () => {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                // Configurar sistema de overlay
                this.setupOverlaySystem();
                
                // Usar eventos con mayor prioridad para drag & drop
                canvas.addEventListener('mousedown', this.onMouseDown.bind(this), true);
                canvas.addEventListener('mousemove', this.onMouseMove.bind(this), true);
                canvas.addEventListener('mouseup', this.onMouseUp.bind(this), true);
                
                // Eventos del sistema de selección
                eventBus.on(GAME_EVENTS.SELECTION_START, this.onSelectionStart.bind(this));
                eventBus.on(GAME_EVENTS.SELECTION_END, this.onSelectionEnd.bind(this));
                
                console.log('🎯 DragDropHandler event listeners configurados');
            } else {
                setTimeout(setupListeners, 100);
            }
        };
        setupListeners();
    }

    /**
     * Manejar mouse down
     */
    onMouseDown(event) {
        console.log(`🖱️ CLICK DETECTADO en DragDropHandler`);
        
        if (event.button !== 0) return; // Solo botón izquierdo

        // Obtener coordenadas Canvas
        const coords = this.getMouseCoordinates(event);
        const x = coords.x;
        const y = coords.y;

        this.dragStartX = x;
        this.dragStartY = y;
        this.currentX = x;
        this.currentY = y;

        // Verificar planetas seleccionados
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerSelectedPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        console.log(`🖱️ Click en (${Math.round(x)}, ${Math.round(y)}) - Planetas player seleccionados: ${playerSelectedPlanets.length}`);
        
        // Verificar si hay planetas seleccionados del jugador
        const clickedPlanet = this.gameEngine.getPlanetAtPosition(x, y);
        
        if (clickedPlanet) {
            console.log(`🖱️ Planeta clickeado: ${clickedPlanet.id} (${clickedPlanet.owner})`);
        }
        
        // Solo iniciar drag si hay planetas seleccionados Y no estamos clickeando en un planeta del jugador
        if (playerSelectedPlanets.length > 0 && (!clickedPlanet || clickedPlanet.owner !== 'player')) {
            // Preparar para posible drag & drop
            this.prepareForDrag(x, y);
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
     * Obtener coordenadas del mouse para Canvas 2D
     */
    getMouseCoordinates(event) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        
        // Canvas 2D: coordenadas directas
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * Preparar para drag (no iniciar aún)
     */
    prepareForDrag(x, y) {
        this.dragStartX = x;
        this.dragStartY = y;
        // No iniciar drag aún, esperar movimiento
    }

    /**
     * Manejar movimiento del mouse
     */
    onMouseMove(event) {
        // Obtener coordenadas Canvas
        const coords = this.getMouseCoordinates(event);
        this.currentX = coords.x;
        this.currentY = coords.y;

        // Si no estamos dragging, verificar si debemos iniciar
        if (!this.isDragging) {
            const distance = Math.sqrt(
                Math.pow(this.currentX - this.dragStartX, 2) + 
                Math.pow(this.currentY - this.dragStartY, 2)
            );
            
            // Solo iniciar drag si hay planetas seleccionados y superamos el threshold
            const selectedPlanets = this.selectionSystem.getSelectedPlanets();
            const playerSelectedPlanets = selectedPlanets.filter(p => p.owner === 'player');
            
            if (distance > this.config.dragThreshold && playerSelectedPlanets.length > 0) {
                this.startDragFromSelection();
                event.stopPropagation(); // Prevenir que el SelectionSystem maneje este evento
            }
            return;
        }

        // Si ya estamos dragging, actualizar
        if (this.isDragging) {
            // Verificar planeta objetivo
            this.checkTargetPlanet();
            
            // Actualizar preview visual
            this.updateDragPreview();
            
            event.stopPropagation(); // Prevenir que otros sistemas manejen este evento
        }
    }

    /**
     * Iniciar drag desde planetas seleccionados
     */
    startDragFromSelection() {
        console.log(`🎯 INICIANDO DRAG desde planetas seleccionados`);
        
        this.isDragging = true;
        this.targetPlanet = null;
        
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        console.log(`🎯 Planetas para drag: ${playerPlanets.length}`);
        playerPlanets.forEach(p => {
            console.log(`  - ${p.id}: ${p.ships} naves`);
        });
        
        this.createPreviewElements();
        
        // Emitir evento
        eventBus.emit('dragdrop:start', {
            selectedPlanets: this.selectionSystem.getSelectedPlanets().length,
            x: this.currentX,
            y: this.currentY
        });
        
        console.log(`🎯 Drag iniciado desde ${this.selectionSystem.getSelectedPlanets().length} planetas`);
    }

    /**
     * Manejar mouse up - EJECUTAR AUTOMÁTICAMENTE SI HAY OBJETIVO
     */
    onMouseUp(event) {
        console.log(`🔍 MouseUp - isDragging: ${this.isDragging}, targetPlanet: ${this.targetPlanet?.id || 'none'}`);
        
        if (!this.isDragging) return;

        // Si hay un objetivo válido, ejecutar automáticamente
        if (this.targetPlanet) {
            console.log(`🎯 Ejecutando drag & drop automáticamente a ${this.targetPlanet.id}`);
            this.completeDragDrop();
            event.stopPropagation(); // Prevenir que otros sistemas manejen este evento
        } else {
            console.log('🎯 Drag cancelado - no hay objetivo válido');
        }
        
        // Resetear estado
        this.resetDragState();
    }

    /**
     * Crear elementos visuales para el preview (Canvas 2D únicamente)
     */
    createPreviewElements() {
        if (!this.overlaySystem) {
            console.warn('⚠️ Sistema de overlay no disponible');
            return;
        }
        
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        // Limpiar líneas existentes
        this.overlaySystem.clearDragLines();
        
        // Crear líneas desde todos los planetas seleccionados
        this.previewLines = [];
        playerPlanets.forEach((planet, index) => {
            const lineId = `drag-line-${planet.id}`;
            this.previewLines.push({ id: lineId, planetId: planet.id });
        });
        
        console.log(`🎮 Canvas: Creadas ${this.previewLines.length} líneas de preview`);
    }

    /**
     * Verificar planeta objetivo
     */
    checkTargetPlanet() {
        const targetPlanet = this.gameEngine.getPlanetAtPosition(this.currentX, this.currentY);
        
        if (targetPlanet && targetPlanet.owner !== 'player') {
            this.targetPlanet = targetPlanet;
        } else {
            this.targetPlanet = null;
        }
        
        // Actualizar highlight del objetivo
        this.updateTargetHighlight();
    }

    /**
     * Actualizar preview visual del drag (Canvas 2D únicamente)
     */
    updateDragPreview() {
        if (!this.overlaySystem) return;
        
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        // Determinar coordenadas de destino
        let targetX, targetY;
        
        if (this.targetPlanet && this.targetPlanet.x && this.targetPlanet.y) {
            targetX = this.targetPlanet.x;
            targetY = this.targetPlanet.y;
        } else {
            targetX = this.currentX;
            targetY = this.currentY;
        }
        
        // Actualizar líneas
        playerPlanets.forEach((planet, index) => {
            const lineId = `drag-line-${planet.id}`;
            
            // Configurar opciones de línea
            const options = {
                color: this.targetPlanet ? '#ff6666' : this.config.selectedLineColor,
                width: this.targetPlanet ? this.config.selectedLineWidth + 1 : this.config.selectedLineWidth,
                opacity: this.targetPlanet ? 0.9 : 0.7,
                dashArray: this.targetPlanet ? [12, 6] : [8, 4],
                animation: 'pulse'
            };
            
            this.overlaySystem.addDragLine(lineId, planet.x, planet.y, targetX, targetY, options);
        });
    }

    /**
     * Actualizar highlight del objetivo (Canvas 2D únicamente)
     */
    updateTargetHighlight() {
        if (!this.overlaySystem) return;
        
        if (this.targetPlanet) {
            const options = {
                color: '#ff6666',
                width: 4,
                opacity: 0.8,
                animation: 'pulse'
            };
            
            this.overlaySystem.addTargetHighlight(
                'target-highlight',
                this.targetPlanet.x,
                this.targetPlanet.y,
                this.targetPlanet.radius + 10,
                options
            );
        } else {
            this.overlaySystem.removeTargetHighlight('target-highlight');
        }
    }

    /**
     * Completar drag & drop
     */
    completeDragDrop() {
        if (!this.targetPlanet) {
            console.log('❌ No hay planeta objetivo válido');
            return;
        }

        console.log(`🎯 Completando drag & drop hacia ${this.targetPlanet.id}`);

        // Obtener porcentaje del selector
        let percentage = 0.8; // Default
        if (this.gameEngine.percentageSelector) {
            percentage = this.gameEngine.percentageSelector.getCurrentFactor();
        }

        // Enviar flotas desde planetas seleccionados
        this.gameEngine.sendFleetFromSelected(
            this.targetPlanet.id,
            percentage,
            this.currentX,
            this.currentY
        );

        // Mostrar efecto de lanzamiento
        this.showLaunchEffect();

        // Emitir evento
        eventBus.emit('dragdrop:complete', {
            targetPlanet: this.targetPlanet.id,
            selectedPlanets: this.selectionSystem.getSelectedPlanets().length,
            percentage: percentage
        });

        console.log(`✅ Drag & drop completado hacia ${this.targetPlanet.id} con ${percentage * 100}% de flotas`);
    }

    /**
     * Mostrar efecto de lanzamiento (Canvas 2D únicamente)
     */
    showLaunchEffect() {
        if (!this.overlaySystem) return;
        
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        // Crear efectos de lanzamiento desde cada planeta
        playerPlanets.forEach((planet, index) => {
            const effectId = `launch-effect-${planet.id}`;
            
            // Línea de lanzamiento con animación
            const options = {
                color: '#00ff88',
                width: 5,
                opacity: 1.0,
                animation: 'launch'
            };
            
            this.overlaySystem.addDragLine(
                effectId,
                planet.x,
                planet.y,
                this.targetPlanet.x,
                this.targetPlanet.y,
                options
            );
            
            // Remover efecto después de 1 segundo
            setTimeout(() => {
                this.overlaySystem.removeDragLine(effectId);
            }, 1000);
        });
    }

    /**
     * Resetear estado del drag (Canvas 2D únicamente)
     */
    resetDragState() {
        this.isDragging = false;
        this.dragStartPlanet = null;
        this.targetPlanet = null;
        
        // Limpiar elementos visuales
        if (this.overlaySystem) {
            this.overlaySystem.clearDragLines();
            this.overlaySystem.removeTargetHighlight('target-highlight');
        }
        
        this.previewLines = [];
        
        console.log('🎯 Estado de drag reseteado');
    }

    /**
     * Event handlers del sistema de selección
     */
    onSelectionStart(data) {
        // Si estamos en medio de un drag, cancelarlo
        if (this.isDragging) {
            this.resetDragState();
        }
    }

    onSelectionEnd(data) {
        // Preparar para posible drag & drop
    }

    /**
     * Verificar si estamos en modo drag
     */
    isDragActive() {
        return this.isDragging;
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            isDragging: this.isDragging,
            isCanvasMode: this.isCanvasMode,
            hasOverlaySystem: !!this.overlaySystem,
            targetPlanet: this.targetPlanet?.id || null,
            previewLines: this.previewLines.length,
            currentPosition: { x: this.currentX, y: this.currentY }
        };
    }

    /**
     * Destruir el handler
     */
    destroy() {
        this.resetDragState();
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mousemove', this.onMouseMove);
            canvas.removeEventListener('mouseup', this.onMouseUp);
        }
        
        console.log('💥 DragDropHandler destruido');
    }
}

export default DragDropHandler; 