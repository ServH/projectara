/**
 * 🔄 GALCON GAME - FLEET REDIRECTION SYSTEM
 * Sistema de redirección de flotas en vuelo estilo Galcon auténtico
 * MILESTONE 2.1: Controles Galcon auténticos
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class FleetRedirectionSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.selectedFleets = new Set();
        
        // Configuración
        this.config = {
            selectionRadius: 15, // Radio para seleccionar flotas
            redirectionColor: '#ffaa00',
            selectedFleetColor: '#ff6666',
            redirectionLineWidth: 2,
            animationDuration: 300
        };
        
        // Estado visual
        this.redirectionLines = new Map();
        this.fleetSelectionIndicators = new Map();
        
        this.init();
        console.log('🔄 FleetRedirectionSystem inicializado');
    }

    /**
     * Inicializar el sistema
     */
    init() {
        this.setupEventListeners();
        this.createVisualElements();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.warn('⚠️ Canvas no encontrado para FleetRedirectionSystem');
            return;
        }

        // Eventos de mouse para selección de flotas
        canvas.addEventListener('click', this.onCanvasClick.bind(this));
        canvas.addEventListener('contextmenu', this.onRightClick.bind(this));
        
        // Eventos del juego
        eventBus.on(GAME_EVENTS.FLEET_LAUNCHED, this.onFleetLaunched.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived.bind(this));
        
        // Teclas para deseleccionar
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        console.log('🔄 Event listeners configurados');
    }

    /**
     * Crear elementos visuales base
     */
    createVisualElements() {
        const svg = document.getElementById('gameCanvas');
        if (!svg) return;

        // Crear grupo para líneas de redirección
        this.redirectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.redirectionGroup.setAttribute('class', 'fleet-redirection-lines');
        this.redirectionGroup.style.pointerEvents = 'none';
        svg.appendChild(this.redirectionGroup);

        // Crear grupo para indicadores de selección de flotas
        this.selectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.selectionGroup.setAttribute('class', 'fleet-selection-indicators');
        this.selectionGroup.style.pointerEvents = 'none';
        svg.appendChild(this.selectionGroup);

        console.log('🔄 Elementos visuales creados');
    }

    /**
     * Manejar clic en canvas
     */
    onCanvasClick(event) {
        // Solo procesar si no hay otros sistemas manejando el evento
        if (event.defaultPrevented) return;

        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Buscar flota en la posición del clic
        const clickedFleet = this.getFleetAtPosition(x, y);
        
        if (clickedFleet && clickedFleet.owner === 'player') {
            event.preventDefault(); // Prevenir otros handlers
            this.handleFleetClick(clickedFleet, event);
        } else {
            // Si hay flotas seleccionadas y se hace clic en un planeta
            const targetPlanet = this.gameEngine.getPlanetAtPosition(x, y);
            if (this.selectedFleets.size > 0 && targetPlanet && targetPlanet.owner !== 'player') {
                event.preventDefault();
                this.redirectSelectedFleets(targetPlanet);
            }
        }
    }

    /**
     * Manejar clic derecho para redirección rápida
     */
    onRightClick(event) {
        if (this.selectedFleets.size === 0) return;

        event.preventDefault();
        
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const targetPlanet = this.gameEngine.getPlanetAtPosition(x, y);
        if (targetPlanet && targetPlanet.owner !== 'player') {
            this.redirectSelectedFleets(targetPlanet);
        }
    }

    /**
     * Manejar clic en flota
     */
    handleFleetClick(fleet, event) {
        const isMultiSelect = event.ctrlKey || event.metaKey;
        
        console.log(`🔄 Flota clickeada: ${fleet.id}, multiSelect: ${isMultiSelect}`);
        
        if (isMultiSelect) {
            this.toggleFleetSelection(fleet);
        } else {
            this.selectSingleFleet(fleet);
        }
    }

    /**
     * Seleccionar una sola flota
     */
    selectSingleFleet(fleet) {
        this.clearFleetSelection();
        this.addFleetToSelection(fleet);
        console.log(`🔄 Flota ${fleet.id} seleccionada`);
    }

    /**
     * Toggle selección de flota
     */
    toggleFleetSelection(fleet) {
        if (this.selectedFleets.has(fleet.id)) {
            this.removeFleetFromSelection(fleet);
        } else {
            this.addFleetToSelection(fleet);
        }
    }

    /**
     * Añadir flota a la selección
     */
    addFleetToSelection(fleet) {
        this.selectedFleets.add(fleet.id);
        this.createFleetSelectionIndicator(fleet);
        
        eventBus.emit('fleet:selected', {
            fleetId: fleet.id,
            selectedCount: this.selectedFleets.size
        });
        
        console.log(`🔄 Flota ${fleet.id} añadida a selección. Total: ${this.selectedFleets.size}`);
    }

    /**
     * Remover flota de la selección
     */
    removeFleetFromSelection(fleet) {
        this.selectedFleets.delete(fleet.id);
        this.removeFleetSelectionIndicator(fleet.id);
        
        eventBus.emit('fleet:deselected', {
            fleetId: fleet.id,
            selectedCount: this.selectedFleets.size
        });
        
        console.log(`🔄 Flota ${fleet.id} removida de selección. Total: ${this.selectedFleets.size}`);
    }

    /**
     * Limpiar selección de flotas
     */
    clearFleetSelection() {
        const previousCount = this.selectedFleets.size;
        
        this.selectedFleets.forEach(fleetId => {
            this.removeFleetSelectionIndicator(fleetId);
        });
        
        this.selectedFleets.clear();
        
        if (previousCount > 0) {
            eventBus.emit('fleet:selection_cleared', {
                clearedCount: previousCount
            });
            
            console.log(`🔄 Selección de flotas limpiada. ${previousCount} flotas deseleccionadas`);
        }
    }

    /**
     * Redirigir flotas seleccionadas
     */
    redirectSelectedFleets(targetPlanet) {
        if (this.selectedFleets.size === 0) {
            console.warn('⚠️ No hay flotas seleccionadas para redirigir');
            return;
        }

        console.log(`🔄 Redirigiendo ${this.selectedFleets.size} flotas a ${targetPlanet.id}`);
        
        let redirectedCount = 0;
        this.selectedFleets.forEach(fleetId => {
            const fleet = this.gameEngine.fleets.get(fleetId);
            if (fleet && fleet.owner === 'player') {
                this.redirectFleet(fleet, targetPlanet);
                redirectedCount++;
            }
        });

        // Mostrar feedback visual
        this.showRedirectionFeedback(targetPlanet, redirectedCount);
        
        // Limpiar selección después de redirigir
        this.clearFleetSelection();
        
        console.log(`🔄 ${redirectedCount} flotas redirigidas a ${targetPlanet.id}`);
    }

    /**
     * Redirigir una flota específica
     */
    redirectFleet(fleet, targetPlanet) {
        const oldTarget = fleet.toPlanet;
        
        // Actualizar destino de la flota
        fleet.toPlanet = targetPlanet.id;
        fleet.targetX = targetPlanet.x;
        fleet.targetY = targetPlanet.y;
        
        // Recalcular dirección y distancia
        const dx = fleet.targetX - fleet.x;
        const dy = fleet.targetY - fleet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        fleet.directionX = dx / distance;
        fleet.directionY = dy / distance;
        fleet.totalDistance = distance;
        fleet.traveledDistance = 0; // Resetear progreso
        
        // Emitir evento de redirección
        eventBus.emit('fleet:redirected', {
            fleetId: fleet.id,
            oldTarget: oldTarget,
            newTarget: targetPlanet.id,
            fleet: fleet
        });
        
        console.log(`🔄 Flota ${fleet.id} redirigida: ${oldTarget} → ${targetPlanet.id}`);
    }

    /**
     * Obtener flota en posición
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
     * Verificar si un punto está dentro de una flota
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
     * Crear indicador visual de selección de flota
     */
    createFleetSelectionIndicator(fleet) {
        if (!this.selectionGroup) return;

        const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        indicator.setAttribute('cx', fleet.x);
        indicator.setAttribute('cy', fleet.y);
        indicator.setAttribute('r', this.config.selectionRadius);
        indicator.setAttribute('fill', 'none');
        indicator.setAttribute('stroke', this.config.selectedFleetColor);
        indicator.setAttribute('stroke-width', 2);
        indicator.setAttribute('stroke-dasharray', '3,3');
        indicator.style.pointerEvents = 'none';
        indicator.style.animation = 'fleetSelection 1s ease-in-out infinite';

        this.selectionGroup.appendChild(indicator);
        this.fleetSelectionIndicators.set(fleet.id, indicator);
    }

    /**
     * Remover indicador de selección de flota
     */
    removeFleetSelectionIndicator(fleetId) {
        const indicator = this.fleetSelectionIndicators.get(fleetId);
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
            this.fleetSelectionIndicators.delete(fleetId);
        }
    }

    /**
     * Mostrar feedback visual de redirección
     */
    showRedirectionFeedback(targetPlanet, fleetCount) {
        const svg = document.getElementById('gameCanvas');
        if (!svg) return;

        // Crear efecto de pulso en el objetivo
        const effect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        effect.setAttribute('cx', targetPlanet.x);
        effect.setAttribute('cy', targetPlanet.y);
        effect.setAttribute('r', targetPlanet.radius + 10);
        effect.setAttribute('fill', 'none');
        effect.setAttribute('stroke', this.config.redirectionColor);
        effect.setAttribute('stroke-width', 3);
        effect.setAttribute('stroke-opacity', 0.8);
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'redirectionFeedback 1s ease-out forwards';

        svg.appendChild(effect);

        // Remover después de la animación
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);

        console.log(`🔄 Feedback visual mostrado para ${fleetCount} flotas redirigidas`);
    }

    /**
     * Actualizar indicadores de selección (llamado desde el renderer)
     */
    updateSelectionIndicators() {
        this.fleetSelectionIndicators.forEach((indicator, fleetId) => {
            const fleet = this.gameEngine.fleets.get(fleetId);
            if (fleet) {
                indicator.setAttribute('cx', fleet.x);
                indicator.setAttribute('cy', fleet.y);
            } else {
                // Flota ya no existe, remover indicador
                this.removeFleetSelectionIndicator(fleetId);
                this.selectedFleets.delete(fleetId);
            }
        });
    }

    /**
     * Manejar teclas
     */
    onKeyDown(event) {
        switch (event.key) {
            case 'Escape':
                if (this.selectedFleets.size > 0) {
                    event.preventDefault();
                    this.clearFleetSelection();
                }
                break;
        }
    }

    /**
     * Event handlers del juego
     */
    onFleetLaunched(data) {
        // Flota nueva lanzada, no necesita acción especial
    }

    onFleetArrived(data) {
        // Flota llegó a destino, remover de selección si estaba seleccionada
        if (this.selectedFleets.has(data.fleetId)) {
            this.selectedFleets.delete(data.fleetId);
            this.removeFleetSelectionIndicator(data.fleetId);
        }
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            selectedFleets: Array.from(this.selectedFleets),
            selectedCount: this.selectedFleets.size,
            config: this.config
        };
    }

    /**
     * Destruir el sistema
     */
    destroy() {
        // Limpiar selección
        this.clearFleetSelection();
        
        // Remover elementos visuales
        if (this.redirectionGroup && this.redirectionGroup.parentNode) {
            this.redirectionGroup.parentNode.removeChild(this.redirectionGroup);
        }
        
        if (this.selectionGroup && this.selectionGroup.parentNode) {
            this.selectionGroup.parentNode.removeChild(this.selectionGroup);
        }
        
        // Remover event listeners
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.removeEventListener('click', this.onCanvasClick);
            canvas.removeEventListener('contextmenu', this.onRightClick);
        }
        
        document.removeEventListener('keydown', this.onKeyDown);
        
        console.log('💥 FleetRedirectionSystem destruido');
    }
}

export default FleetRedirectionSystem; 