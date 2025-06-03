/**
 * 🎯 GALCON GAME - SELECTION SYSTEM (CANVAS 2D ONLY)
 * Sistema de selección de planetas con controles estilo Galcon
 * Optimizado para Canvas 2D únicamente
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class SelectionSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.selectedPlanets = new Set();
        
        // 🎮 Canvas 2D únicamente
        this.overlaySystem = null;
        
        // Estado de drag selection
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCurrentX = 0;
        this.dragCurrentY = 0;
        
        // 🎛️ Configuración de controles Galcon
        this.config = {
            multiSelectKey: 'ctrlKey', // Ctrl para multi-selección
            selectAllKey: 'shiftKey',  // Shift para seleccionar todos
            doubleClickThreshold: 300  // ms para detectar doble clic
        };
        
        // 🎛️ Estado para doble clic
        this.lastClickTime = 0;
        this.lastClickedPlanet = null;
        
        this.initializeWhenReady();
        console.log('🎯 SelectionSystem inicializado para Canvas 2D');
    }

    /**
     * 🎮 Configurar sistema de overlay Canvas
     */
    setupOverlaySystem() {
        // Esperar a que el overlay esté disponible
        const checkOverlay = () => {
            if (window.canvasOverlay) {
                this.overlaySystem = window.canvasOverlay;
                console.log('🎮 SelectionSystem: Sistema de overlay Canvas conectado');
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
     * Inicializar cuando el canvas esté listo
     */
    initializeWhenReady() {
        const checkCanvas = () => {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                this.setupOverlaySystem();
                this.setupEventListeners();
                console.log('🎯 SelectionSystem configurado');
            } else {
                setTimeout(checkCanvas, 100);
            }
        };
        checkCanvas();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        const canvas = document.getElementById('gameCanvas');
        
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        canvas.addEventListener('contextmenu', this.onRightClick.bind(this));
        
        // Eventos de teclado
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        console.log('🎯 Event listeners configurados');
    }

    /**
     * Manejar clic derecho
     */
    onRightClick(event) {
        event.preventDefault();
        
        const coords = this.getMouseCoordinates(event);
        const x = coords.x;
        const y = coords.y;

        const targetPlanet = this.gameEngine.getPlanetAtPosition(x, y);
        
        if (targetPlanet && targetPlanet.owner !== 'player') {
            console.log(`🎛️ Clic derecho: enviando flotas a ${targetPlanet.id}`);
            this.gameEngine.sendFleetFromSelected(targetPlanet.id);
            this.showAttackFeedback(targetPlanet);
        }
    }

    /**
     * Manejar mouse down
     */
    onMouseDown(event) {
        if (event.button !== 0) return; // Solo botón izquierdo

        // Verificar si el DragDropHandler está manejando este evento
        if (event.defaultPrevented) return;

        const coords = this.getMouseCoordinates(event);
        const x = coords.x;
        const y = coords.y;

        console.log(`🖱️ Mouse down en: ${x}, ${y}`);

        const clickedPlanet = this.gameEngine.getPlanetAtPosition(x, y);
        
        if (clickedPlanet) {
            console.log(`🪐 Planeta clickeado: ${clickedPlanet.id} (${clickedPlanet.owner})`);
            this.handlePlanetClick(clickedPlanet, event);
        } else {
            // Iniciar selección por área
            this.startDragSelection(x, y, event);
        }
    }

    /**
     * 🎛️ MEJORADO: Manejar clic en planeta con controles Galcon
     */
    handlePlanetClick(planet, event) {
        const isMultiSelect = event[this.config.multiSelectKey];
        const isSelectAll = event[this.config.selectAllKey]; // 🎛️ NUEVO
        const currentTime = Date.now();
        
        console.log(`🎯 Manejando click en planeta ${planet.id}, multiSelect: ${isMultiSelect}, selectAll: ${isSelectAll}, owner: ${planet.owner}`);
        
        if (planet.owner === 'player') {
            // 🎛️ NUEVO: Shift + clic = seleccionar todos los planetas del jugador
            if (isSelectAll) {
                console.log('🎛️ Shift+clic: seleccionando todos los planetas del jugador');
                this.selectAllPlayerPlanets();
                return;
            }
            
            // 🎛️ NUEVO: Detectar doble clic
            const isDoubleClick = (currentTime - this.lastClickTime < this.doubleClickThreshold) && 
                                 (this.lastClickedPlanet === planet.id);
            
            if (isDoubleClick) {
                console.log('🎛️ Doble clic: seleccionando todos los planetas del jugador');
                this.selectAllPlayerPlanets();
            } else if (isMultiSelect) {
                console.log(`🎯 Toggle selección planeta ${planet.id}`);
                this.togglePlanetSelection(planet);
            } else {
                console.log(`🎯 Selección única planeta ${planet.id}`);
                this.selectSinglePlanet(planet);
            }
            
            // Actualizar estado para doble clic
            this.lastClickTime = currentTime;
            this.lastClickedPlanet = planet.id;
        } else {
            // Enviar flotas a planeta enemigo/neutral
            if (this.selectedPlanets.size > 0) {
                console.log(`🚀 Enviando flotas desde ${this.selectedPlanets.size} planetas a ${planet.id}`);
                this.gameEngine.sendFleetFromSelected(planet.id);
                
                // Mostrar feedback visual
                this.showAttackFeedback(planet);
            } else {
                console.log('⚠️ No hay planetas seleccionados para enviar flotas');
            }
        }
    }

    /**
     * 🎮 ADAPTADO: Mostrar feedback visual de ataque
     */
    showAttackFeedback(targetPlanet) {
        if (this.overlaySystem) {
            // Canvas: usar overlay system
            this.overlaySystem.addTargetHighlight(
                'attack-feedback',
                targetPlanet.x,
                targetPlanet.y,
                targetPlanet.radius + 5,
                {
                    color: '#ffaa00',
                    width: 3,
                    opacity: 0.8,
                    animation: 'pulse'
                }
            );
            
            // Remover después de un tiempo
            setTimeout(() => {
                this.overlaySystem.removeTargetHighlight('attack-feedback');
            }, 800);
        }
    }

    /**
     * Iniciar selección por drag
     */
    startDragSelection(x, y, event) {
        if (!event[this.config.multiSelectKey]) {
            this.clearSelection();
        }

        this.isDragging = true;
        this.dragStartX = x;
        this.dragStartY = y;
        this.dragCurrentX = x;
        this.dragCurrentY = y;

        console.log(`📦 Drag selection iniciado en: ${x}, ${y}`);

        eventBus.emit(GAME_EVENTS.SELECTION_START, {
            startX: x,
            startY: y
        });
    }

    /**
     * Manejar movimiento del mouse
     */
    onMouseMove(event) {
        // Si el evento fue manejado por otro sistema (como DragDropHandler), no hacer nada
        if (event.defaultPrevented) return;
        
        if (!this.isDragging) return;

        const coords = this.getMouseCoordinates(event);
        this.dragCurrentX = coords.x;
        this.dragCurrentY = coords.y;

        this.updateSelectionBox();
        this.updateDragSelection();
    }

    /**
     * Manejar mouse up
     */
    onMouseUp(event) {
        // Si el evento fue manejado por otro sistema (como DragDropHandler), no hacer nada
        if (event.defaultPrevented) return;
        
        if (!this.isDragging) return;

        this.finalizeDragSelection(event);
        this.hideSelectionBox();
        this.isDragging = false;

        console.log('📦 Finalizando drag selection');
    }

    /**
     * 🎮 ADAPTADO: Actualizar caja de selección visual
     */
    updateSelectionBox() {
        const minX = Math.min(this.dragStartX, this.dragCurrentX);
        const minY = Math.min(this.dragStartY, this.dragCurrentY);
        const width = Math.abs(this.dragCurrentX - this.dragStartX);
        const height = Math.abs(this.dragCurrentY - this.dragStartY);

        if (this.overlaySystem) {
            // Canvas: usar overlay system
            this.overlaySystem.addSelectionBox('drag-selection', minX, minY, width, height, {
                color: '#00ff88',
                borderWidth: 2,
                fillOpacity: 0.1,
                borderOpacity: 0.8
            });
        }
    }

    /**
     * 🎮 ADAPTADO: Ocultar caja de selección
     */
    hideSelectionBox() {
        if (this.overlaySystem) {
            // Canvas: remover del overlay system
            this.overlaySystem.removeSelectionBox('drag-selection');
        }
    }

    /**
     * Actualizar selección durante drag
     */
    updateDragSelection() {
        const rect = this.getSelectionRect();
        const planetsInRect = this.getPlanetsInRect(rect);
        
        // Preview de selección
        this.previewSelection(planetsInRect);
    }

    /**
     * Finalizar selección por drag
     */
    finalizeDragSelection(event) {
        const rect = this.getSelectionRect();
        const planetsInRect = this.getPlanetsInRect(rect);
        
        const isMultiSelect = event[this.config.multiSelectKey];
        
        if (isMultiSelect) {
            // Añadir a selección existente
            planetsInRect.forEach(planet => {
                if (planet.owner === 'player') {
                    this.addToSelection(planet);
                }
            });
        } else {
            // Reemplazar selección
            this.clearSelection();
            planetsInRect.forEach(planet => {
                if (planet.owner === 'player') {
                    this.addToSelection(planet);
                }
            });
        }

        eventBus.emit(GAME_EVENTS.SELECTION_END, {
            selectedCount: this.selectedPlanets.size,
            rect: rect
        });
    }

    /**
     * Obtener rectángulo de selección
     */
    getSelectionRect() {
        return {
            x: Math.min(this.dragStartX, this.dragCurrentX),
            y: Math.min(this.dragStartY, this.dragCurrentY),
            width: Math.abs(this.dragCurrentX - this.dragStartX),
            height: Math.abs(this.dragCurrentY - this.dragStartY)
        };
    }

    /**
     * Obtener planetas en rectángulo
     */
    getPlanetsInRect(rect) {
        const allPlanets = this.gameEngine.getAllPlanets();
        return allPlanets.filter(planet => this.isPlanetInRect(planet, rect));
    }

    /**
     * Verificar si planeta está en rectángulo
     */
    isPlanetInRect(planet, rect) {
        const planetCenterX = planet.x;
        const planetCenterY = planet.y;
        const planetRadius = planet.radius;

        // Verificar si el centro del planeta está dentro del rectángulo
        // O si el rectángulo intersecta con el círculo del planeta
        return (planetCenterX >= rect.x - planetRadius &&
                planetCenterX <= rect.x + rect.width + planetRadius &&
                planetCenterY >= rect.y - planetRadius &&
                planetCenterY <= rect.y + rect.height + planetRadius);
    }

    /**
     * Preview de selección (visual feedback)
     */
    previewSelection(planets) {
        // TODO: Implementar preview visual de planetas que serán seleccionados
    }

    /**
     * Seleccionar un solo planeta
     */
    selectSinglePlanet(planet) {
        this.clearSelection();
        this.addToSelection(planet);
    }

    /**
     * Toggle selección de planeta
     */
    togglePlanetSelection(planet) {
        if (this.selectedPlanets.has(planet.id)) {
            this.removeFromSelection(planet);
        } else {
            this.addToSelection(planet);
        }
    }

    /**
     * Añadir planeta a selección
     */
    addToSelection(planet) {
        if (planet.owner !== 'player') {
            console.log(`⚠️ No se puede seleccionar planeta ${planet.id}: no es del jugador`);
            return;
        }

        if (!this.selectedPlanets.has(planet.id)) {
            this.selectedPlanets.add(planet.id);
            
            // Marcar planeta como seleccionado
            planet.isSelected = true;
            
            eventBus.emit(GAME_EVENTS.PLANET_SELECTED, {
                planetId: planet.id,
                totalSelected: this.selectedPlanets.size
            });
            
            console.log(`✅ Planeta ${planet.id} añadido a selección (total: ${this.selectedPlanets.size})`);
        }
    }

    /**
     * Remover planeta de selección
     */
    removeFromSelection(planet) {
        if (this.selectedPlanets.has(planet.id)) {
            this.selectedPlanets.delete(planet.id);
            
            // Desmarcar planeta
            planet.isSelected = false;
            
            eventBus.emit(GAME_EVENTS.PLANET_DESELECTED, {
                planetId: planet.id,
                totalSelected: this.selectedPlanets.size
            });
            
            console.log(`❌ Planeta ${planet.id} removido de selección (total: ${this.selectedPlanets.size})`);
        }
    }

    /**
     * Limpiar selección
     */
    clearSelection() {
        const previousCount = this.selectedPlanets.size;
        
        // Desmarcar todos los planetas seleccionados
        this.selectedPlanets.forEach(planetId => {
            const planet = this.gameEngine.getPlanet(planetId);
            if (planet) {
                planet.isSelected = false;
            }
        });
        
        this.selectedPlanets.clear();
        
        if (previousCount > 0) {
            eventBus.emit(GAME_EVENTS.SELECTION_CLEARED, {
                previousCount: previousCount
            });
            
            console.log(`🧹 Selección limpiada (${previousCount} planetas deseleccionados)`);
        }
    }

    /**
     * Manejar teclas
     */
    onKeyDown(event) {
        switch (event.key) {
            case 'a':
            case 'A':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.selectAllPlayerPlanets();
                }
                break;
            case 'Escape':
                this.clearSelection();
                break;
        }
    }

    /**
     * 🎛️ NUEVO: Seleccionar todos los planetas del jugador
     */
    selectAllPlayerPlanets() {
        const allPlanets = this.gameEngine.getAllPlanets();
        const playerPlanets = allPlanets.filter(p => p.owner === 'player');
        
        this.clearSelection();
        playerPlanets.forEach(planet => {
            this.addToSelection(planet);
        });
        
        console.log(`🎯 Seleccionados todos los planetas del jugador: ${playerPlanets.length}`);
    }

    /**
     * Obtener número de planetas seleccionados
     */
    getSelectedCount() {
        return this.selectedPlanets.size;
    }

    /**
     * Event handlers
     */
    onPlanetSelected(data) {
        // Manejar selección de planeta
    }

    onPlanetDeselected(data) {
        // Manejar deselección de planeta
    }

    /**
     * Obtener planetas seleccionados
     */
    getSelectedPlanets() {
        const selectedPlanetsArray = [];
        this.selectedPlanets.forEach(planetId => {
            const planet = this.gameEngine.getPlanet(planetId);
            if (planet) {
                selectedPlanetsArray.push(planet);
            }
        });
        return selectedPlanetsArray;
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            selectedCount: this.selectedPlanets.size,
            selectedPlanets: Array.from(this.selectedPlanets),
            isDragging: this.isDragging,
            dragPosition: {
                startX: this.dragStartX,
                startY: this.dragStartY,
                currentX: this.dragCurrentX,
                currentY: this.dragCurrentY
            }
        };
    }

    /**
     * Destruir sistema
     */
    destroy() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mousemove', this.onMouseMove);
            canvas.removeEventListener('mouseup', this.onMouseUp);
            canvas.removeEventListener('contextmenu', this.onRightClick);
        }
        
        document.removeEventListener('keydown', this.onKeyDown);
        
        // Limpiar selección
        this.clearSelection();
        
        // Limpiar caja de selección
        if (this.overlaySystem) {
            this.overlaySystem.removeSelectionBox('drag-selection');
        }
        
        console.log('💥 SelectionSystem destruido');
    }
}

export default SelectionSystem; 