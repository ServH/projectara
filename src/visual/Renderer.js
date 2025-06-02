/**
 * 🎨 GALCON GAME - VISUAL RENDERER
 * Sistema de renderizado SVG para el juego
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class Renderer {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.canvas = null;
        this.isRunning = false;
        
        // Elementos renderizados
        this.planetElements = new Map();
        this.fleetElements = new Map();
        this.effectElements = new Set();
        
        // Configuración visual
        this.config = {
            showTrails: true,
            showEffects: true,
            showDebugInfo: false,
            planetGlow: true,
            fleetTrails: true
        };
        
        this.setupCanvas();
        this.setupEventListeners();
        
        console.log('🎨 Renderer inicializado');
    }

    /**
     * Configurar canvas SVG
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas no encontrado');
            return;
        }
        
        // Configurar SVG
        this.canvas.style.background = 'radial-gradient(ellipse at center, #000033 0%, #000011 70%, #000000 100%)';
        this.canvas.style.cursor = 'crosshair';
        
        // Crear grupos para organizar elementos
        this.createRenderGroups();
        
        console.log('🖼️ Canvas configurado');
    }

    /**
     * Crear grupos de renderizado
     */
    createRenderGroups() {
        // Grupo para efectos de fondo
        this.backgroundGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.backgroundGroup.setAttribute('id', 'background-effects');
        this.canvas.appendChild(this.backgroundGroup);
        
        // Grupo para trails de flotas
        this.trailsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.trailsGroup.setAttribute('id', 'fleet-trails');
        this.canvas.appendChild(this.trailsGroup);
        
        // Grupo para planetas
        this.planetsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.planetsGroup.setAttribute('id', 'planets');
        this.canvas.appendChild(this.planetsGroup);
        
        // Grupo para flotas
        this.fleetsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.fleetsGroup.setAttribute('id', 'fleets');
        this.canvas.appendChild(this.fleetsGroup);
        
        // Grupo para efectos frontales
        this.effectsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.effectsGroup.setAttribute('id', 'effects');
        this.canvas.appendChild(this.effectsGroup);
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        eventBus.on(GAME_EVENTS.FLEET_LAUNCHED, this.onFleetLaunched.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived.bind(this));
        eventBus.on(GAME_EVENTS.PLANET_CONQUERED, this.onPlanetConquered.bind(this));
        eventBus.on(GAME_EVENTS.BATTLE_START, this.onBattleStart.bind(this));
    }

    /**
     * Iniciar renderizado
     */
    start() {
        this.isRunning = true;
        this.render();
        console.log('🎬 Renderer iniciado');
    }

    /**
     * Detener renderizado
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Renderer detenido');
    }

    /**
     * Loop principal de renderizado
     */
    render() {
        if (!this.isRunning) return;
        
        this.renderPlanets();
        this.renderFleets();
        this.cleanupEffects();
        
        requestAnimationFrame(() => this.render());
    }

    /**
     * Renderizar planetas
     */
    renderPlanets() {
        this.gameEngine.planets.forEach(planet => {
            this.renderPlanet(planet);
        });
        
        // Limpiar planetas que ya no existen
        this.planetElements.forEach((element, planetId) => {
            if (!this.gameEngine.planets.has(planetId)) {
                element.remove();
                this.planetElements.delete(planetId);
            }
        });
    }

    /**
     * Renderizar un planeta individual
     */
    renderPlanet(planet) {
        let planetGroup = this.planetElements.get(planet.id);
        
        if (!planetGroup) {
            planetGroup = this.createPlanetElement(planet);
            this.planetElements.set(planet.id, planetGroup);
            this.planetsGroup.appendChild(planetGroup);
        }
        
        this.updatePlanetElement(planetGroup, planet);
    }

    /**
     * Crear elemento visual de planeta
     */
    createPlanetElement(planet) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', `planet-${planet.id}`);
        
        // Círculo principal del planeta
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'planet-body');
        group.appendChild(circle);
        
        // Glow effect
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('class', 'planet-glow');
        glow.setAttribute('fill', 'none');
        glow.style.display = 'none';
        group.appendChild(glow);
        
        // Texto con número de naves
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'planet-text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.style.fontSize = '14px';
        text.style.fontWeight = 'bold';
        text.style.fill = '#ffffff';
        text.style.textShadow = '0 0 3px rgba(0,0,0,0.8)';
        text.style.pointerEvents = 'none';
        group.appendChild(text);
        
        return group;
    }

    /**
     * Actualizar elemento visual de planeta
     */
    updatePlanetElement(planetGroup, planet) {
        const circle = planetGroup.querySelector('.planet-body');
        const glow = planetGroup.querySelector('.planet-glow');
        const text = planetGroup.querySelector('.planet-text');
        
        // Actualizar posición y tamaño
        circle.setAttribute('cx', planet.x);
        circle.setAttribute('cy', planet.y);
        circle.setAttribute('r', planet.radius);
        circle.setAttribute('fill', planet.getColor());
        
        // Actualizar glow si está seleccionado
        if (planet.isSelected) {
            glow.setAttribute('cx', planet.x);
            glow.setAttribute('cy', planet.y);
            glow.setAttribute('r', planet.radius + 8);
            glow.setAttribute('stroke', planet.getColor());
            glow.setAttribute('stroke-width', 3);
            glow.setAttribute('stroke-opacity', 0.6);
            glow.style.display = 'block';
            glow.style.animation = 'pulse 1.5s ease-in-out infinite';
        } else {
            glow.style.display = 'none';
        }
        
        // Actualizar texto
        text.setAttribute('x', planet.x);
        text.setAttribute('y', planet.y);
        text.textContent = Math.floor(planet.ships);
        
        // Cambiar color del texto según el propietario
        if (planet.owner === 'player') {
            text.style.fill = '#ffffff';
        } else if (planet.owner === 'ai') {
            text.style.fill = '#ffffff';
        } else {
            text.style.fill = '#cccccc';
        }
    }

    /**
     * Renderizar flotas
     */
    renderFleets() {
        this.gameEngine.fleets.forEach(fleet => {
            this.renderFleet(fleet);
        });
        
        // Limpiar flotas que ya no existen
        this.fleetElements.forEach((element, fleetId) => {
            if (!this.gameEngine.fleets.has(fleetId)) {
                element.remove();
                this.fleetElements.delete(fleetId);
            }
        });
    }

    /**
     * Renderizar una flota individual
     */
    renderFleet(fleet) {
        let fleetGroup = this.fleetElements.get(fleet.id);
        
        if (!fleetGroup) {
            fleetGroup = this.createFleetElement(fleet);
            this.fleetElements.set(fleet.id, fleetGroup);
            this.fleetsGroup.appendChild(fleetGroup);
        }
        
        this.updateFleetElement(fleetGroup, fleet);
    }

    /**
     * Crear elemento visual de flota
     */
    createFleetElement(fleet) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', `fleet-${fleet.id}`);
        
        // Trail de la flota
        const trail = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        trail.setAttribute('class', 'fleet-trail');
        trail.setAttribute('fill', 'none');
        trail.setAttribute('stroke', fleet.getColor());
        trail.setAttribute('stroke-width', 2);
        trail.setAttribute('stroke-opacity', 0.4);
        trail.style.pointerEvents = 'none';
        this.trailsGroup.appendChild(trail);
        
        // Círculo principal de la flota
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'fleet-body');
        circle.setAttribute('r', Math.min(Math.sqrt(fleet.ships) + 3, 12));
        circle.setAttribute('fill', fleet.getColor());
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', 1);
        circle.setAttribute('stroke-opacity', 0.8);
        group.appendChild(circle);
        
        // Texto con número de naves
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'fleet-text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.style.fontSize = '10px';
        text.style.fontWeight = 'bold';
        text.style.fill = '#ffffff';
        text.style.textShadow = '0 0 2px rgba(0,0,0,0.8)';
        text.style.pointerEvents = 'none';
        group.appendChild(text);
        
        return group;
    }

    /**
     * Actualizar elemento visual de flota
     */
    updateFleetElement(fleetGroup, fleet) {
        const circle = fleetGroup.querySelector('.fleet-body');
        const text = fleetGroup.querySelector('.fleet-text');
        const trail = this.trailsGroup.querySelector(`#fleet-${fleet.id} .fleet-trail`) || 
                     this.trailsGroup.querySelector(`.fleet-trail[data-fleet="${fleet.id}"]`);
        
        // Actualizar posición
        circle.setAttribute('cx', fleet.x);
        circle.setAttribute('cy', fleet.y);
        
        // Actualizar texto
        text.setAttribute('x', fleet.x);
        text.setAttribute('y', fleet.y);
        text.textContent = fleet.ships;
        
        // Actualizar trail
        if (trail && fleet.trail && fleet.trail.length > 0) {
            const points = fleet.trail.map(point => `${point.x},${point.y}`).join(' ');
            trail.setAttribute('points', points);
            trail.setAttribute('data-fleet', fleet.id);
        }
        
        // Ocultar si ha llegado
        if (fleet.hasArrived) {
            fleetGroup.style.display = 'none';
        }
    }

    /**
     * Event handlers para efectos visuales
     */
    onFleetLaunched(data) {
        console.log('🚀 Flota lanzada:', data);
        this.createLaunchEffect(data);
    }

    onFleetArrived(data) {
        console.log('🎯 Flota llegó:', data);
        this.createArrivalEffect(data);
    }

    onPlanetConquered(data) {
        console.log('⚔️ Planeta conquistado:', data);
        this.createConquestEffect(data);
    }

    onBattleStart(data) {
        console.log('⚔️ Batalla iniciada:', data);
        this.createBattleEffect(data);
    }

    /**
     * Crear efecto de lanzamiento
     */
    createLaunchEffect(data) {
        const planet = this.gameEngine.getPlanet(data.fromPlanet);
        if (!planet) return;
        
        const effect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        effect.setAttribute('cx', planet.x);
        effect.setAttribute('cy', planet.y);
        effect.setAttribute('r', planet.radius);
        effect.setAttribute('fill', 'none');
        effect.setAttribute('stroke', planet.getColor());
        effect.setAttribute('stroke-width', 3);
        effect.setAttribute('stroke-opacity', 0.8);
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'launchConfirmation 0.6s ease-out forwards';
        
        this.effectsGroup.appendChild(effect);
        this.effectElements.add(effect);
        
        // Remover después de la animación
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
                this.effectElements.delete(effect);
            }
        }, 600);
    }

    /**
     * Crear efecto de llegada
     */
    createArrivalEffect(data) {
        const planet = this.gameEngine.getPlanet(data.toPlanet);
        if (!planet) return;
        
        const effect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        effect.setAttribute('cx', planet.x);
        effect.setAttribute('cy', planet.y);
        effect.setAttribute('r', planet.radius + 5);
        effect.setAttribute('fill', 'none');
        effect.setAttribute('stroke', '#ffaa00');
        effect.setAttribute('stroke-width', 4);
        effect.setAttribute('stroke-opacity', 0.9);
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'attackFeedback 0.8s ease-out forwards';
        
        this.effectsGroup.appendChild(effect);
        this.effectElements.add(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
                this.effectElements.delete(effect);
            }
        }, 800);
    }

    /**
     * Crear efecto de conquista
     */
    createConquestEffect(data) {
        const planet = this.gameEngine.getPlanet(data.planetId);
        if (!planet) return;
        
        const effect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        effect.setAttribute('cx', planet.x);
        effect.setAttribute('cy', planet.y);
        effect.setAttribute('r', planet.radius);
        effect.setAttribute('fill', 'none');
        effect.setAttribute('stroke', planet.getColor());
        effect.setAttribute('stroke-width', 2);
        effect.setAttribute('stroke-opacity', 1);
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'conquestEffect 1s ease-out forwards';
        
        this.effectsGroup.appendChild(effect);
        this.effectElements.add(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
                this.effectElements.delete(effect);
            }
        }, 1000);
    }

    /**
     * Crear efecto de batalla
     */
    createBattleEffect(data) {
        const planet = this.gameEngine.getPlanet(data.planetId);
        if (!planet) return;
        
        // Efecto de flash
        const flash = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        flash.setAttribute('cx', planet.x);
        flash.setAttribute('cy', planet.y);
        flash.setAttribute('r', planet.radius + 15);
        flash.setAttribute('fill', '#ffffff');
        flash.setAttribute('fill-opacity', 0.6);
        flash.style.pointerEvents = 'none';
        
        this.effectsGroup.appendChild(flash);
        this.effectElements.add(flash);
        
        // Fade out rápido
        setTimeout(() => {
            flash.style.transition = 'fill-opacity 0.3s ease-out';
            flash.setAttribute('fill-opacity', 0);
            
            setTimeout(() => {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                    this.effectElements.delete(flash);
                }
            }, 300);
        }, 50);
    }

    /**
     * Limpiar efectos antiguos
     */
    cleanupEffects() {
        // Los efectos se limpian automáticamente con setTimeout
        // Esta función está aquí para futuras optimizaciones
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            isRunning: this.isRunning,
            planetsRendered: this.planetElements.size,
            fleetsRendered: this.fleetElements.size,
            activeEffects: this.effectElements.size,
            config: this.config
        };
    }

    /**
     * Destruir el renderer
     */
    destroy() {
        this.stop();
        
        // Limpiar elementos
        this.planetElements.clear();
        this.fleetElements.clear();
        this.effectElements.clear();
        
        // Limpiar canvas
        if (this.canvas) {
            this.canvas.innerHTML = '';
        }
        
        console.log('💥 Renderer destruido');
    }
}

export default Renderer; 