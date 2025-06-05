/**
 * 🖱️ FLEET REDIRECTION EVENT MANAGER
 * Gestor especializado para eventos de mouse y teclado del sistema de redirección
 * Responsabilidad única: Capturar y procesar eventos de entrada para redirección
 */

import { GAME_EVENTS } from '../../core/EventBus.js';

export class FleetRedirectionEventManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado de eventos
        this.isMouseDown = false;
        this.lastClickTime = 0;
        this.lastClickedFleet = null;
        
        // Callbacks configurables
        this.callbacks = {
            onFleetClick: null,
            onPlanetClick: null,
            onRightClick: null,
            onKeyDown: null,
            onEmptyAreaClick: null
        };
        
        console.log('🖱️ FleetRedirectionEventManager inicializado');
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
            console.warn('⚠️ Canvas no encontrado para FleetRedirectionEventManager');
            return false;
        }

        // Eventos de mouse
        canvas.addEventListener('click', this.onCanvasClick.bind(this));
        canvas.addEventListener('contextmenu', this.onRightClick.bind(this));
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Eventos de teclado
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        console.log('🖱️ Event listeners de redirección configurados');
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
     * 🖱️ Manejar clic en canvas
     */
    onCanvasClick(event) {
        // Solo procesar si no hay otros sistemas manejando el evento
        if (event.defaultPrevented) return;

        const coords = this.getMouseCoordinates(event);
        const clickedFleet = this.getFleetAtPosition(coords.x, coords.y);
        const clickedPlanet = this.gameEngine.getPlanetAtPosition(coords.x, coords.y);
        
        console.log(`🖱️ Clic en canvas: (${coords.x}, ${coords.y})`);
        
        if (clickedFleet && clickedFleet.owner === this.gameEngine.getCurrentPlayer()) {
            // Clic en flota del jugador
            event.preventDefault();
            this.handleFleetClick(clickedFleet, event, coords);
        } else if (clickedPlanet) {
            // Clic en planeta
            this.handlePlanetClick(clickedPlanet, event, coords);
        } else {
            // Clic en área vacía
            this.handleEmptyAreaClick(event, coords);
        }
    }

    /**
     * 🚁 Manejar clic en flota
     */
    handleFleetClick(fleet, event, coords) {
        const isMultiSelect = event[this.config.multiSelectKey];
        const currentTime = Date.now();
        
        // Detectar doble clic
        const isDoubleClick = (currentTime - this.lastClickTime < this.config.doubleClickThreshold) && 
                             (this.lastClickedFleet === fleet.id);
        
        console.log(`🚁 Clic en flota ${fleet.id}: multi=${isMultiSelect}, double=${isDoubleClick}`);
        
        if (this.callbacks.onFleetClick) {
            this.callbacks.onFleetClick({
                fleet,
                event,
                coords,
                isMultiSelect,
                isDoubleClick
            });
        }
        
        // Actualizar estado para doble clic
        this.lastClickTime = currentTime;
        this.lastClickedFleet = fleet.id;
    }

    /**
     * 🪐 Manejar clic en planeta
     */
    handlePlanetClick(planet, event, coords) {
        const isRedirectionTarget = planet.owner !== this.gameEngine.getCurrentPlayer();
        
        console.log(`🪐 Clic en planeta ${planet.id}: esObjetivo=${isRedirectionTarget}`);
        
        if (this.callbacks.onPlanetClick) {
            this.callbacks.onPlanetClick({
                planet,
                event,
                coords,
                isRedirectionTarget
            });
        }
    }

    /**
     * 🌌 Manejar clic en área vacía
     */
    handleEmptyAreaClick(event, coords) {
        console.log(`🌌 Clic en área vacía: (${coords.x}, ${coords.y})`);
        
        if (this.callbacks.onEmptyAreaClick) {
            this.callbacks.onEmptyAreaClick({
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
        const targetFleet = this.getFleetAtPosition(coords.x, coords.y);
        
        console.log(`🖱️ Clic derecho en: (${coords.x}, ${coords.y})`);
        
        if (this.callbacks.onRightClick) {
            this.callbacks.onRightClick({
                event,
                coords,
                targetPlanet,
                targetFleet
            });
        }
    }

    /**
     * 🖱️ Manejar mouse down
     */
    onMouseDown(event) {
        if (event.button !== 0) return; // Solo botón izquierdo
        this.isMouseDown = true;
    }

    /**
     * 🖱️ Manejar mouse up
     */
    onMouseUp(event) {
        if (event.button !== 0) return; // Solo botón izquierdo
        this.isMouseDown = false;
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
     * 🔍 Obtener flota en posición
     */
    getFleetAtPosition(x, y) {
        for (const fleet of this.gameEngine.fleets.values()) {
            if (this.isPointInFleet(x, y, fleet)) {
                return fleet;
            }
        }
        return null;
    }

    /**
     * 🔍 Verificar si un punto está dentro de una flota
     */
    isPointInFleet(x, y, fleet) {
        if (!fleet.x || !fleet.y || isNaN(fleet.x) || isNaN(fleet.y)) {
            return false;
        }
        
        const dx = x - fleet.x;
        const dy = y - fleet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= this.config.selectionRadius;
    }

    /**
     * 🔍 Verificar si hay flota en posición
     */
    hasFleetAtPosition(x, y) {
        return this.getFleetAtPosition(x, y) !== null;
    }

    /**
     * 📊 Obtener flotas del jugador en área
     */
    getPlayerFleetsInArea(centerX, centerY, radius) {
        const playerFleets = [];
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        
        for (const fleet of this.gameEngine.fleets.values()) {
            if (fleet.owner === currentPlayer) {
                const dx = fleet.x - centerX;
                const dy = fleet.y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= radius) {
                    playerFleets.push(fleet);
                }
            }
        }
        
        return playerFleets;
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Configuración de FleetRedirectionEventManager actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        return {
            isMouseDown: this.isMouseDown,
            lastClickTime: this.lastClickTime,
            lastClickedFleet: this.lastClickedFleet,
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
            canvas.removeEventListener('click', this.onCanvasClick);
            canvas.removeEventListener('contextmenu', this.onRightClick);
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mouseup', this.onMouseUp);
        }
        
        document.removeEventListener('keydown', this.onKeyDown);
        
        console.log('🧹 Event listeners de redirección removidos');
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
        
        console.log('💥 FleetRedirectionEventManager destruido');
    }
} 