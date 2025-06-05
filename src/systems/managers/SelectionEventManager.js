/**
 * 🖱️ SELECTION EVENT MANAGER
 * Gestor especializado para eventos de mouse y teclado del sistema de selección
 * Responsabilidad única: Capturar y procesar eventos de entrada
 */

import { GAME_EVENTS } from '../../core/EventBus.js';

export class SelectionEventManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado de eventos
        this.isMouseDown = false;
        this.lastClickTime = 0;
        this.lastClickedPlanet = null;
        
        // Callbacks configurables
        this.callbacks = {
            onPlanetClick: null,
            onDragStart: null,
            onDragMove: null,
            onDragEnd: null,
            onRightClick: null,
            onKeyDown: null
        };
        
        console.log('🖱️ SelectionEventManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * 🎮 Configurar event listeners
     */
    setupEventListeners() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.warn('⚠️ Canvas no encontrado para SelectionEventManager');
            return false;
        }

        // Eventos de mouse
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        canvas.addEventListener('contextmenu', this.onRightClick.bind(this));
        
        // Eventos de teclado
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        console.log('🖱️ Event listeners configurados');
        return true;
    }

    /**
     * 🖱️ Obtener coordenadas del mouse para Canvas 2D
     */
    getMouseCoordinates(event) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * 🖱️ Manejar mouse down
     */
    onMouseDown(event) {
        if (event.button !== 0) return; // Solo botón izquierdo
        if (event.defaultPrevented) return; // Ya manejado por otro sistema

        const coords = this.getMouseCoordinates(event);
        const clickedPlanet = this.gameEngine.getPlanetAtPosition(coords.x, coords.y);
        
        this.isMouseDown = true;
        
        if (clickedPlanet) {
            this.handlePlanetClick(clickedPlanet, event, coords);
        } else {
            this.handleEmptyAreaClick(event, coords);
        }
    }

    /**
     * 🪐 Manejar clic en planeta
     */
    handlePlanetClick(planet, event, coords) {
        const isMultiSelect = event[this.config.multiSelectKey];
        const isSelectAll = event[this.config.selectAllKey];
        const currentTime = Date.now();
        
        // Detectar doble clic
        const isDoubleClick = (currentTime - this.lastClickTime < this.config.doubleClickThreshold) && 
                             (this.lastClickedPlanet === planet.id);
        
        console.log(`🖱️ Clic en planeta ${planet.id}: multi=${isMultiSelect}, selectAll=${isSelectAll}, double=${isDoubleClick}`);
        
        if (this.callbacks.onPlanetClick) {
            this.callbacks.onPlanetClick({
                planet,
                event,
                coords,
                isMultiSelect,
                isSelectAll,
                isDoubleClick
            });
        }
        
        // Actualizar estado para doble clic
        this.lastClickTime = currentTime;
        this.lastClickedPlanet = planet.id;
    }

    /**
     * 🌌 Manejar clic en área vacía
     */
    handleEmptyAreaClick(event, coords) {
        console.log(`🖱️ Clic en área vacía: ${coords.x}, ${coords.y}`);
        
        if (this.callbacks.onDragStart) {
            this.callbacks.onDragStart({
                event,
                coords,
                isMultiSelect: event[this.config.multiSelectKey]
            });
        }
    }

    /**
     * 🖱️ Manejar movimiento del mouse
     */
    onMouseMove(event) {
        if (event.defaultPrevented) return;
        if (!this.isMouseDown) return;

        const coords = this.getMouseCoordinates(event);
        
        if (this.callbacks.onDragMove) {
            this.callbacks.onDragMove({
                event,
                coords
            });
        }
    }

    /**
     * 🖱️ Manejar mouse up
     */
    onMouseUp(event) {
        if (event.defaultPrevented) return;
        if (!this.isMouseDown) return;

        const coords = this.getMouseCoordinates(event);
        this.isMouseDown = false;
        
        if (this.callbacks.onDragEnd) {
            this.callbacks.onDragEnd({
                event,
                coords
            });
        }
    }

    /**
     * 🖱️ Manejar clic derecho
     */
    onRightClick(event) {
        event.preventDefault();
        
        const coords = this.getMouseCoordinates(event);
        const targetPlanet = this.gameEngine.getPlanetAtPosition(coords.x, coords.y);
        
        console.log(`🖱️ Clic derecho en: ${coords.x}, ${coords.y}${targetPlanet ? ` (planeta ${targetPlanet.id})` : ''}`);
        
        if (this.callbacks.onRightClick) {
            this.callbacks.onRightClick({
                event,
                coords,
                targetPlanet
            });
        }
    }

    /**
     * ⌨️ Manejar teclas
     */
    onKeyDown(event) {
        console.log(`⌨️ Tecla presionada: ${event.key}, ctrl: ${event.ctrlKey}, shift: ${event.shiftKey}`);
        
        if (this.callbacks.onKeyDown) {
            this.callbacks.onKeyDown({
                event,
                key: event.key,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey
            });
        }
    }

    /**
     * 🔍 Verificar si un punto está en un planeta
     */
    isPlanetAtPosition(x, y) {
        return this.gameEngine.getPlanetAtPosition(x, y) !== null;
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Configuración de SelectionEventManager actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        return {
            isMouseDown: this.isMouseDown,
            lastClickTime: this.lastClickTime,
            lastClickedPlanet: this.lastClickedPlanet,
            hasCallbacks: Object.keys(this.callbacks).filter(key => this.callbacks[key] !== null),
            config: this.config
        };
    }

    /**
     * 🧹 Remover event listeners
     */
    removeEventListeners() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mousemove', this.onMouseMove);
            canvas.removeEventListener('mouseup', this.onMouseUp);
            canvas.removeEventListener('contextmenu', this.onRightClick);
        }
        
        document.removeEventListener('keydown', this.onKeyDown);
        
        console.log('🧹 Event listeners removidos');
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        this.removeEventListeners();
        
        // Limpiar referencias
        this.gameEngine = null;
        this.callbacks = {};
        this.config = null;
        
        console.log('💥 SelectionEventManager destruido');
    }
} 