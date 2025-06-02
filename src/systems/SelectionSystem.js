/**
 * 🎯 GALCON GAME - SELECTION SYSTEM
 * Sistema de selección múltiple con drag selection estilo Galcon
 * MILESTONE 2.1: Controles Galcon auténticos añadidos
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class SelectionSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.selectedPlanets = new Set();
        
        // Estado de selección por drag
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCurrentX = 0;
        this.dragCurrentY = 0;
        
        // 🎛️ NUEVOS CONTROLES GALCON
        this.lastClickTime = 0;
        this.doubleClickThreshold = 300; // ms para doble clic
        this.lastClickedPlanet = null;
        
        // Configuración
        this.config = {
            multiSelectKey: 'ctrlKey',
            selectAllKey: 'shiftKey', // 🎛️ NUEVO: Shift para seleccionar todos
            dragThreshold: 5,
            selectionBoxColor: '#00ff88',
            selectionBoxOpacity: 0.2,
            selectionBorderColor: '#00ff88',
            selectionBorderWidth: 2
        };
        
        // Elementos visuales
        this.selectionBox = null;
        
        // Esperar a que el canvas esté listo
        this.initializeWhenReady();
        
        console.log('🎯 SelectionSystem inicializado con controles Galcon');
    }

    /**
     * Inicializar cuando el canvas esté listo
     */
    initializeWhenReady() {
        const checkCanvas = () => {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                this.createSelectionBox();
                this.setupEventListeners();
                console.log('🎯 SelectionSystem configurado con canvas');
            } else {
                setTimeout(checkCanvas, 100);
            }
        };
        checkCanvas();
    }

    /**
     * Crear elemento visual para la caja de selección
     */
    createSelectionBox() {
        const svg = document.getElementById('gameCanvas');
        if (!svg) {
            console.warn('⚠️ Canvas no encontrado para crear selection box');
            return;
        }

        this.selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.selectionBox.setAttribute('class', 'selection-box');
        this.selectionBox.setAttribute('fill', this.config.selectionBoxColor);
        this.selectionBox.setAttribute('fill-opacity', this.config.selectionBoxOpacity);
        this.selectionBox.setAttribute('stroke', this.config.selectionBorderColor);
        this.selectionBox.setAttribute('stroke-width', this.config.selectionBorderWidth);
        this.selectionBox.setAttribute('stroke-dasharray', '5,5');
        this.selectionBox.style.display = 'none';
        this.selectionBox.style.pointerEvents = 'none';
        
        svg.appendChild(this.selectionBox);
        console.log('📦 Caja de selección creada');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.warn('⚠️ Canvas no encontrado para event listeners');
            return;
        }

        // Usar el SVG canvas directamente
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // 🎛️ NUEVO: Clic derecho para envío rápido
        canvas.addEventListener('contextmenu', this.onRightClick.bind(this));
        
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        eventBus.on(GAME_EVENTS.PLANET_SELECTED, this.onPlanetSelected.bind(this));
        eventBus.on(GAME_EVENTS.PLANET_DESELECTED, this.onPlanetDeselected.bind(this));
        
        // 🎛️ NUEVO: Escuchar eventos de porcentaje
        eventBus.on('selection:getCount', this.getSelectedCount.bind(this));
        
        console.log('🎮 Event listeners configurados con controles Galcon');
    }

    /**
     * 🎛️ NUEVO: Manejar clic derecho (envío rápido)
     */
    onRightClick(event) {
        event.preventDefault(); // Prevenir menú contextual
        
        if (this.selectedPlanets.size === 0) return;
        
        // Obtener posición del clic
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
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

        // Obtener posición relativa al SVG
        const svg = document.getElementById('gameCanvas');
        const rect = svg.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        console.log(`🖱️ Mouse down en: ${x}, ${y}`);

        const clickedPlanet = this.gameEngine.getPlanetAtPosition(x, y);
        
        if (clickedPlanet) {
            console.log(`🪐 Planeta clickeado: ${clickedPlanet.id} (${clickedPlanet.owner})`);
            this.handlePlanetClick(clickedPlanet, event);
        } else {
            console.log('🎯 Iniciando drag selection');
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
     * Mostrar feedback visual de ataque
     */
    showAttackFeedback(targetPlanet) {
        const svg = document.getElementById('gameCanvas');
        if (!svg) return;
        
        // Crear efecto de pulso en el objetivo
        const effect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        effect.setAttribute('cx', targetPlanet.x);
        effect.setAttribute('cy', targetPlanet.y);
        effect.setAttribute('r', targetPlanet.radius + 5);
        effect.setAttribute('fill', 'none');
        effect.setAttribute('stroke', '#ffaa00');
        effect.setAttribute('stroke-width', 3);
        effect.setAttribute('stroke-opacity', 0.8);
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'attackFeedback 0.8s ease-out forwards';
        
        svg.appendChild(effect);
        
        // Remover después de la animación
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 800);
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

        // Obtener posición actual
        const svg = document.getElementById('gameCanvas');
        const rect = svg.getBoundingClientRect();
        this.dragCurrentX = event.clientX - rect.left;
        this.dragCurrentY = event.clientY - rect.top;

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
     * Actualizar caja de selección visual
     */
    updateSelectionBox() {
        if (!this.selectionBox) return;

        const minX = Math.min(this.dragStartX, this.dragCurrentX);
        const minY = Math.min(this.dragStartY, this.dragCurrentY);
        const width = Math.abs(this.dragCurrentX - this.dragStartX);
        const height = Math.abs(this.dragCurrentY - this.dragStartY);

        this.selectionBox.setAttribute('x', minX);
        this.selectionBox.setAttribute('y', minY);
        this.selectionBox.setAttribute('width', width);
        this.selectionBox.setAttribute('height', height);
        this.selectionBox.style.display = 'block';
    }

    /**
     * Ocultar caja de selección
     */
    hideSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.style.display = 'none';
        }
    }

    /**
     * Actualizar selección durante el drag
     */
    updateDragSelection() {
        const selectionRect = this.getSelectionRect();
        const planetsInSelection = this.getPlanetsInRect(selectionRect);
        
        this.previewSelection(planetsInSelection);
    }

    /**
     * Finalizar selección por drag
     */
    finalizeDragSelection(event) {
        const selectionRect = this.getSelectionRect();
        const planetsInSelection = this.getPlanetsInRect(selectionRect);
        
        const isMultiSelect = event[this.config.multiSelectKey];
        
        if (planetsInSelection.length > 0) {
            if (isMultiSelect) {
                planetsInSelection.forEach(planet => {
                    if (planet.owner === 'player') {
                        this.addToSelection(planet);
                    }
                });
            } else {
                this.clearSelection();
                planetsInSelection.forEach(planet => {
                    if (planet.owner === 'player') {
                        this.addToSelection(planet);
                    }
                });
            }
        }
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
     * Obtener planetas dentro del rectángulo
     */
    getPlanetsInRect(rect) {
        const planetsInRect = [];
        
        this.gameEngine.planets.forEach(planet => {
            if (this.isPlanetInRect(planet, rect)) {
                planetsInRect.push(planet);
            }
        });
        
        return planetsInRect;
    }

    /**
     * Verificar si un planeta está dentro del rectángulo
     */
    isPlanetInRect(planet, rect) {
        const planetCenterX = planet.x;
        const planetCenterY = planet.y;
        
        return (
            planetCenterX >= rect.x &&
            planetCenterX <= rect.x + rect.width &&
            planetCenterY >= rect.y &&
            planetCenterY <= rect.y + rect.height
        );
    }

    /**
     * Preview de selección
     */
    previewSelection(planets) {
        eventBus.emit('selection:preview', {
            planets: planets.map(p => p.id)
        });
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
     * Añadir planeta a la selección
     */
    addToSelection(planet) {
        if (planet.owner !== 'player') {
            console.log(`⚠️ Intentando seleccionar planeta ${planet.id} que no es del jugador (owner: ${planet.owner})`);
            return;
        }
        
        this.selectedPlanets.add(planet.id);
        planet.setSelected(true);
        
        // 🎛️ NUEVO: Emitir evento de cambio de selección
        eventBus.emit('selection:changed', {
            selectedCount: this.selectedPlanets.size,
            action: 'add',
            planetId: planet.id
        });
        
        console.log(`🎯 Planeta ${planet.id} seleccionado. Total seleccionados: ${this.selectedPlanets.size}`);
    }

    /**
     * Remover planeta de la selección
     */
    removeFromSelection(planet) {
        this.selectedPlanets.delete(planet.id);
        planet.setSelected(false);
        
        // 🎛️ NUEVO: Emitir evento de cambio de selección
        eventBus.emit('selection:changed', {
            selectedCount: this.selectedPlanets.size,
            action: 'remove',
            planetId: planet.id
        });
        
        console.log(`🎯 Planeta ${planet.id} deseleccionado. Total seleccionados: ${this.selectedPlanets.size}`);
    }

    /**
     * Limpiar toda la selección
     */
    clearSelection() {
        const previousCount = this.selectedPlanets.size;
        
        this.selectedPlanets.forEach(planetId => {
            const planet = this.gameEngine.getPlanet(planetId);
            if (planet) {
                planet.setSelected(false);
            }
        });
        
        this.selectedPlanets.clear();
        
        // 🎛️ NUEVO: Emitir evento de cambio de selección
        eventBus.emit('selection:changed', {
            selectedCount: 0,
            action: 'clear',
            previousCount
        });
        
        eventBus.emit(GAME_EVENTS.SELECTION_CLEAR, {
            clearedCount: previousCount
        });
        
        console.log(`🎯 Selección limpiada. ${previousCount} planetas deseleccionados`);
    }

    /**
     * Manejar teclas
     */
    onKeyDown(event) {
        switch (event.key) {
            case 'Escape':
                this.clearSelection();
                break;
            case 'a':
            case 'A':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.selectAllPlayerPlanets();
                }
                break;
        }
    }

    /**
     * Seleccionar todos los planetas del jugador
     */
    selectAllPlayerPlanets() {
        console.log('🎯 Iniciando selección de todos los planetas del jugador...');
        
        this.clearSelection();
        
        let playerPlanetsCount = 0;
        this.gameEngine.planets.forEach(planet => {
            if (planet.owner === 'player') {
                playerPlanetsCount++;
                console.log(`🪐 Encontrado planeta del jugador: ${planet.id} en (${planet.x}, ${planet.y})`);
                this.addToSelection(planet);
            }
        });
        
        console.log(`🎯 Seleccionados todos los planetas del jugador: ${this.selectedPlanets.size}/${playerPlanetsCount} planetas`);
    }

    /**
     * 🎛️ NUEVO: Obtener número de planetas seleccionados
     */
    getSelectedCount() {
        return this.selectedPlanets.size;
    }

    /**
     * Event handlers
     */
    onPlanetSelected(data) {
        // Manejar evento de selección si es necesario
    }

    onPlanetDeselected(data) {
        // Manejar evento de deselección si es necesario
    }

    /**
     * Obtener planetas seleccionados
     */
    getSelectedPlanets() {
        const selected = [];
        this.selectedPlanets.forEach(planetId => {
            const planet = this.gameEngine.getPlanet(planetId);
            if (planet) {
                selected.push(planet);
            }
        });
        return selected;
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            selectedCount: this.selectedPlanets.size,
            selectedPlanets: Array.from(this.selectedPlanets),
            isDragging: this.isDragging,
            dragStart: { x: this.dragStartX, y: this.dragStartY },
            dragCurrent: { x: this.dragCurrentX, y: this.dragCurrentY },
            lastClickTime: this.lastClickTime,
            lastClickedPlanet: this.lastClickedPlanet
        };
    }

    /**
     * Destruir el sistema
     */
    destroy() {
        this.clearSelection();
        
        if (this.selectionBox) {
            this.selectionBox.remove();
        }
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mousemove', this.onMouseMove);
            canvas.removeEventListener('mouseup', this.onMouseUp);
            canvas.removeEventListener('contextmenu', this.onRightClick);
        }
        
        document.removeEventListener('keydown', this.onKeyDown);
        
        console.log('💥 SelectionSystem destruido');
    }
}

export default SelectionSystem; 