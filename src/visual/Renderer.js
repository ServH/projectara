/**
 * 🎨 GALCON GAME - VISUAL RENDERER
 * Sistema de renderizado SVG optimizado con object pooling
 * MILESTONE 2.2: Optimizaciones de Rendimiento
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
        
        // 🏊 MILESTONE 2.2: Referencia al SVGPool del GameEngine
        this.svgPool = null;
        
        // 📊 NUEVO: Pools de elementos para reutilización
        this.elementPools = {
            effects: [],
            trails: [],
            maxPoolSize: 20
        };
        
        // 📊 MILESTONE 2.2: Configuración de optimización
        this.optimizationConfig = {
            maxEffects: 10,         // Máximo 10 efectos simultáneos
            maxTrails: 15,          // Máximo 15 trails simultáneos
            cullDistance: 50,       // Distancia para culling
            updateInterval: 2,      // Actualizar cada 2 frames
            frameCounter: 0,
            enableBatching: true,   // Agrupar operaciones DOM
            batchSize: 10          // Tamaño de lote para operaciones
        };
        
        // Configuración visual
        this.config = {
            showTrails: true,
            showEffects: true,
            showDebugInfo: false,
            planetGlow: false,      // 📊 Desactivar glow por defecto para rendimiento
            fleetTrails: true,
            enableLOD: true         // 👁️ Level of Detail
        };
        
        this.setupCanvas();
        this.setupEventListeners();
        
        console.log('🎨 Renderer inicializado con optimizaciones del Milestone 2.2');
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
        
        // 🏊 MILESTONE 2.2: Conectar con SVGPool del GameEngine
        if (this.gameEngine.svgPool) {
            this.svgPool = this.gameEngine.svgPool;
            console.log('🏊 Renderer conectado con SVGPool');
        }
        
        this.render();
        console.log('🎬 Renderer iniciado con optimizaciones');
    }

    /**
     * Detener renderizado
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Renderer detenido');
    }

    /**
     * Loop principal de renderizado (OPTIMIZADO)
     */
    render() {
        if (!this.isRunning) return;
        
        // 📊 MILESTONE 2.2: Frame skipping para optimización
        this.optimizationConfig.frameCounter++;
        const shouldUpdate = this.optimizationConfig.frameCounter % this.optimizationConfig.updateInterval === 0;
        
        // 👁️ MILESTONE 2.2: Obtener datos optimizados con culling
        const renderData = this.gameEngine.getRenderData();
        
        // 📊 MILESTONE 2.2: Medir tiempo de renderizado si hay profiler
        if (this.gameEngine.performanceProfiler) {
            this.gameEngine.performanceProfiler.measureRenderTime(() => {
                this.renderPlanetsOptimized(renderData.planets);
                if (shouldUpdate) {
                    this.renderFleetsOptimized(renderData.fleets);
                    this.cleanupEffects();
                }
            });
        } else {
            this.renderPlanetsOptimized(renderData.planets);
            if (shouldUpdate) {
                this.renderFleetsOptimized(renderData.fleets);
                this.cleanupEffects();
            }
        }
        
        requestAnimationFrame(() => this.render());
    }

    /**
     * Renderizar planetas
     */
    renderPlanetsOptimized(planetsData) {
        // Crear un Set de IDs de planetas visibles para limpieza
        const visiblePlanetIds = new Set(planetsData.map(p => p.id));
        
        planetsData.forEach(planetData => {
            this.renderPlanet(planetData);
        });
        
        // Limpiar planetas que ya no están visibles
        this.planetElements.forEach((element, planetId) => {
            if (!visiblePlanetIds.has(planetId)) {
                // 🔧 CORREGIDO: Usar método de limpieza inteligente
                this.cleanupGroup(element);
                this.planetElements.delete(planetId);
            }
        });
    }

    /**
     * Renderizar un planeta individual
     */
    renderPlanet(planetData) {
        let planetGroup = this.planetElements.get(planetData.id);
        
        if (!planetGroup) {
            planetGroup = this.createPlanetElement(planetData);
            this.planetElements.set(planetData.id, planetGroup);
            this.planetsGroup.appendChild(planetGroup);
        }
        
        this.updatePlanetElement(planetGroup, planetData);
    }

    /**
     * Crear elemento visual de planeta (OPTIMIZADO)
     */
    createPlanetElement(planet) {
        // 🔧 TEMPORAL: Crear elementos directamente sin pool para debug
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', `planet-${planet.id}`);
        group.setAttribute('class', `planet ${planet.owner}`);
        
        // Círculo principal del planeta
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'planet-body');
        group.appendChild(circle);
        
        // 📊 OPTIMIZACIÓN: Solo crear glow si está habilitado
        if (this.config.planetGlow) {
            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            glow.setAttribute('class', 'planet-glow');
            glow.setAttribute('fill', 'none');
            glow.style.display = 'none';
            group.appendChild(glow);
        }
        
        // 🔧 CORREGIDO: Siempre crear texto para debug
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', `planet-ships planet-text ${planet.owner}`);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.style.fontSize = '12px';
        text.style.fontWeight = 'bold';
        text.style.fill = '#ffffff';
        text.style.pointerEvents = 'none';
        group.appendChild(text);
        
        return group;
    }

    /**
     * Actualizar elemento visual de planeta
     */
    updatePlanetElement(planetGroup, planet) {
        const circle = planetGroup.querySelector('.planet-body');
        const glow = planetGroup.querySelector('.planet-glow');  // Puede ser null si glow está desactivado
        const text = planetGroup.querySelector('.planet-ships');
        
        // 🔧 DEBUG: Verificar que los elementos existen
        if (!circle) {
            console.warn(`⚠️ No se encontró círculo para planeta ${planet.id}`);
            return;
        }
        if (!text) {
            console.warn(`⚠️ No se encontró texto para planeta ${planet.id}`);
            return;
        }
        
        // 🔧 AÑADIDO: Actualizar clases CSS del grupo
        planetGroup.setAttribute('class', `planet ${planet.owner}`);
        
        // Actualizar posición y tamaño
        circle.setAttribute('cx', planet.x);
        circle.setAttribute('cy', planet.y);
        circle.setAttribute('r', planet.radius);
        
        // Aplicar colores directamente al atributo fill
        circle.setAttribute('fill', planet.color);
        circle.setAttribute('stroke', planet.color);
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('class', `planet-body ${planet.owner}`);
        
        // Solo actualizar glow si existe
        if (glow && planet.isSelected) {
            glow.setAttribute('cx', planet.x);
            glow.setAttribute('cy', planet.y);
            glow.setAttribute('r', planet.radius + 8);
            glow.setAttribute('stroke', planet.color);
            glow.setAttribute('stroke-width', 3);
            glow.setAttribute('stroke-opacity', 0.6);
            glow.style.display = 'block';
            glow.style.animation = 'pulse 1.5s ease-in-out infinite';
        } else if (glow) {
            glow.style.display = 'none';
        }
        
        // 🔧 CORREGIDO: Solo actualizar texto si existe
        if (text) {
            // 🔧 AÑADIDO: Actualizar clases CSS del texto
            text.setAttribute('class', `planet-ships planet-text ${planet.owner}`);
            text.setAttribute('x', planet.x);
            text.setAttribute('y', planet.y);
            text.textContent = Math.floor(planet.ships);
            
            // 🔧 CORREGIDO: Aplicar color directamente
            text.setAttribute('fill', '#ffffff');
            text.setAttribute('stroke', 'none');
            text.style.textShadow = `0 0 3px ${planet.color}`;
        }
    }

    /**
     * Renderizar flotas
     */
    renderFleetsOptimized(fleetsData) {
        // Crear un Set de IDs de flotas visibles para limpieza
        const visibleFleetIds = new Set(fleetsData.map(f => f.id));
        
        fleetsData.forEach(fleetData => {
            this.renderFleet(fleetData);
        });
        
        // Limpiar flotas que ya no están visibles
        this.fleetElements.forEach((element, fleetId) => {
            if (!visibleFleetIds.has(fleetId)) {
                // 🔧 CORREGIDO: Usar método de limpieza inteligente
                this.cleanupGroup(element);
                this.fleetElements.delete(fleetId);
            }
        });
    }

    /**
     * Renderizar una flota individual
     */
    renderFleet(fleetData) {
        let fleetGroup = this.fleetElements.get(fleetData.id);
        
        if (!fleetGroup) {
            fleetGroup = this.createFleetElement(fleetData);
            this.fleetElements.set(fleetData.id, fleetGroup);
            this.fleetsGroup.appendChild(fleetGroup);
        }
        
        this.updateFleetElement(fleetGroup, fleetData);
    }

    /**
     * Crear elemento visual de flota (HITO 1A: EXACTAMENTE COMO EN TEST-HITO1A)
     */
    createFleetElement(fleet) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', `fleet-${fleet.id}`);
        group.setAttribute('class', `fleet ${fleet.owner}`);
        
        // 🎯 HITO 1A: Crear triángulo EXACTAMENTE como en test-hito1a.html
        const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        
        // 🎯 PUNTOS IDÉNTICOS al test-hito1a.html
        // const points = [ [size, 0], [-size/2, -size/2], [-size/2, size/2] ];
        const size = 8; // Mismo tamaño que en el test
        const points = [
            [size, 0],           // Punta hacia la derecha
            [-size/2, -size/2],  // Esquina superior
            [-size/2, size/2]    // Esquina inferior
        ];
        
        const pointsStr = points.map(p => p.join(',')).join(' ');
        triangle.setAttribute('points', pointsStr);
        triangle.setAttribute('fill', fleet.color);
        triangle.setAttribute('stroke', fleet.color);
        triangle.setAttribute('stroke-width', '1');
        triangle.setAttribute('class', 'fleet-triangle');
        
        group.appendChild(triangle);
        
        return group;
    }

    /**
     * Actualizar elemento visual de flota (HITO 1A: ORIENTACIÓN PERFECTA COMO EN TEST)
     */
    updateFleetElement(fleetGroup, fleet) {
        const triangle = fleetGroup.querySelector('.fleet-triangle');
        
        if (!triangle) {
            return;
        }
        
        // Verificar que las coordenadas sean válidas
        if (isNaN(fleet.x) || isNaN(fleet.y) || isNaN(fleet.targetX) || isNaN(fleet.targetY)) {
            fleetGroup.style.display = 'none';
            return;
        }
        
        // Calcular ángulo EXACTAMENTE como en test-hito1a.html
        const dx = fleet.targetX - fleet.x;
        const dy = fleet.targetY - fleet.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Verificar que el ángulo sea válido
        if (isNaN(angle)) {
            triangle.setAttribute('transform', `translate(${fleet.x}, ${fleet.y}) rotate(0)`);
        } else {
            triangle.setAttribute('transform', `translate(${fleet.x}, ${fleet.y}) rotate(${angle})`);
        }
        
        // Aplicar colores
        triangle.setAttribute('fill', fleet.color);
        triangle.setAttribute('stroke', fleet.color);
        triangle.setAttribute('stroke-width', '1');
        triangle.style.display = 'block';
        
        // Actualizar clases CSS
        fleetGroup.setAttribute('class', `fleet ${fleet.owner}`);
        
        // Ocultar si ha llegado
        if (fleet.hasArrived) {
            fleetGroup.style.display = 'none';
        } else {
            fleetGroup.style.display = 'block';
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
        effect.setAttribute('stroke', planet.getColor ? planet.getColor() : planet.color || '#ffffff');
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
        effect.setAttribute('stroke', planet.getColor ? planet.getColor() : planet.color || '#ffffff');
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
     * 📊 NUEVO: Obtener elemento del pool o crear uno nuevo
     */
    getPooledElement(type, createFunction) {
        const pool = this.elementPools[type];
        
        if (pool && pool.length > 0) {
            return pool.pop();
        }
        
        return createFunction();
    }

    /**
     * 📊 NUEVO: Devolver elemento al pool (CORREGIDO)
     */
    returnToPool(type, element) {
        if (!element) return;
        
        const pool = this.elementPools[type];
        
        if (pool && pool.length < this.elementPools.maxPoolSize) {
            // Limpiar elemento antes de devolverlo al pool
            element.style.display = 'none';
            element.removeAttribute('class');
            pool.push(element);
        } else {
            // Si el pool está lleno, eliminar elemento de forma segura
            try {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                } else if (element.remove) {
                    element.remove();
                }
            } catch (error) {
                console.warn('⚠️ Error al eliminar elemento del DOM:', error);
            }
        }
    }

    /**
     * Limpiar efectos (OPTIMIZADO con límites estrictos)
     */
    cleanupEffects() {
        const now = Date.now();
        const effectsToRemove = [];
        
        // 📊 OPTIMIZACIÓN: Limitar número de efectos simultáneos
        if (this.effectElements.size > this.optimizationConfig.maxEffects) {
            // Eliminar efectos más antiguos
            const sortedEffects = Array.from(this.effectElements).sort((a, b) => 
                (a.dataset.createdAt || 0) - (b.dataset.createdAt || 0)
            );
            
            const excessCount = this.effectElements.size - this.optimizationConfig.maxEffects;
            for (let i = 0; i < excessCount; i++) {
                effectsToRemove.push(sortedEffects[i]);
            }
        }
        
        // Limpiar efectos expirados
        this.effectElements.forEach(effect => {
            const createdAt = parseInt(effect.dataset.createdAt) || now;
            const duration = parseInt(effect.dataset.duration) || 1000;
            
            if (now - createdAt > duration) {
                effectsToRemove.push(effect);
            }
        });
        
        // Remover efectos
        effectsToRemove.forEach(effect => {
            this.effectElements.delete(effect);
            this.returnToPool('effects', effect);
        });
    }

    /**
     * 📊 NUEVO: Crear efecto optimizado con pooling
     */
    createOptimizedEffect(type, data, duration = 1000) {
        // Verificar límite de efectos
        if (this.effectElements.size >= this.optimizationConfig.maxEffects) {
            return; // No crear más efectos si se alcanzó el límite
        }
        
        const effect = this.getPooledElement('effects', () => {
            return document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        });
        
        // Configurar efecto
        effect.setAttribute('cx', data.x || 0);
        effect.setAttribute('cy', data.y || 0);
        effect.setAttribute('r', data.radius || 10);
        effect.setAttribute('fill', 'none');
        effect.setAttribute('stroke', data.color || '#ffffff');
        effect.setAttribute('stroke-width', '2');
        effect.style.display = 'block';
        effect.dataset.createdAt = Date.now().toString();
        effect.dataset.duration = duration.toString();
        
        // Añadir animación simple
        effect.style.animation = `${type} ${duration}ms ease-out forwards`;
        
        this.effectsGroup.appendChild(effect);
        this.effectElements.add(effect);
        
        return effect;
    }

    /**
     * Obtener información de debug (MEJORADO con métricas de optimización)
     */
    getDebugInfo() {
        return {
            isRunning: this.isRunning,
            elementCounts: {
                planets: this.planetElements.size,
                fleets: this.fleetElements.size,
                effects: this.effectElements.size,
                total: this.planetElements.size + this.fleetElements.size + this.effectElements.size
            },
            pools: {
                effects: this.elementPools.effects.length,
                trails: this.elementPools.trails.length
            },
            optimization: {
                frameCounter: this.optimizationConfig.frameCounter,
                maxEffects: this.optimizationConfig.maxEffects,
                maxTrails: this.optimizationConfig.maxTrails
            },
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

    /**
     * 👁️ MILESTONE 2.2: Aplicar Level of Detail a planeta
     */
    applyLODToPlanet(planetGroup, lodLevel) {
        switch (lodLevel) {
            case 'high':
                // Máxima calidad - todos los detalles
                planetGroup.style.opacity = '1.0';
                break;
            case 'medium':
                // Calidad media - sin efectos complejos
                planetGroup.style.opacity = '0.9';
                break;
            case 'low':
                // Calidad baja - solo forma básica
                planetGroup.style.opacity = '0.7';
                const details = planetGroup.querySelectorAll('.planet-glow, .planet-border');
                details.forEach(detail => detail.style.display = 'none');
                break;
            default:
                // Muy bajo - mínimo detalle
                planetGroup.style.opacity = '0.5';
                break;
        }
    }

    /**
     * 👁️ MILESTONE 2.2: Aplicar Level of Detail a flota
     */
    applyLODToFleet(fleetGroup, lodLevel) {
        switch (lodLevel) {
            case 'high':
                // Máxima calidad - todos los detalles
                fleetGroup.style.opacity = '1.0';
                break;
            case 'medium':
                // Calidad media - sin trails complejos
                fleetGroup.style.opacity = '0.9';
                break;
            case 'low':
                // Calidad baja - solo forma básica
                fleetGroup.style.opacity = '0.7';
                break;
            default:
                // Muy bajo - punto simple
                fleetGroup.style.opacity = '0.5';
                break;
        }
    }

    /**
     * 🔧 NUEVO: Limpiar grupo devolviendo elementos individuales al pool
     */
    cleanupGroup(group) {
        if (!group) return;
        
        // 🔧 TEMPORAL: Desactivar pooling agresivo para debug
        // Simplemente remover el elemento por ahora
        group.remove();
        
        /* CÓDIGO ORIGINAL COMENTADO PARA DEBUG:
        // Si hay SVGPool disponible, devolver elementos individuales
        if (this.svgPool) {
            const children = Array.from(group.children);
            children.forEach(child => {
                // Solo devolver elementos simples al pool
                if (child.tagName && ['circle', 'polygon', 'text', 'line'].includes(child.tagName.toLowerCase())) {
                    this.svgPool.returnToPool(child);
                }
            });
            
            // Devolver el grupo también
            this.svgPool.returnToPool(group);
        } else {
            // Si no hay pool, simplemente remover
            group.remove();
        }
        */
    }
}

export default Renderer; 