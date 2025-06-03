/**
 * 🎨 GALCON GAME - VISUAL RENDERER
 * Sistema de renderizado SVG optimizado con object pooling
 * MILESTONE 2.2: Optimizaciones de Rendimiento + HITO 2.5 INTEGRADO
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
        
        // 🚀 HITO 2.5: OBJECT POOLING INTEGRADO - Reutilización de elementos SVG
        this.elementPools = {
            effects: [],
            trails: [],
            fleets: [],
            planets: [],
            maxPoolSize: 100
        };
        
        // 🧮 HITO 2.5: CACHE TRIGONOMÉTRICO INTEGRADO
        this.mathCache = {
            angles: new Map(),
            sin: new Map(),
            cos: new Map(),
            cacheSize: 0,
            maxCacheSize: 1000
        };
        
        // ⚡ HITO 2.5: BATCH PROCESSING INTEGRADO
        this.batchOperations = {
            domUpdates: [],
            transformUpdates: [],
            styleUpdates: [],
            maxBatchSize: 20
        };
        
        // 📊 MILESTONE 2.2: Configuración de optimización + HITO 2.5
        this.optimizationConfig = {
            maxEffects: 10,         // Máximo 10 efectos simultáneos
            maxTrails: 15,          // Máximo 15 trails simultáneos
            cullDistance: 50,       // Distancia para culling
            updateInterval: 2,      // Actualizar cada 2 frames (HITO 2.5)
            frameCounter: 0,
            enableBatching: true,   // Agrupar operaciones DOM
            batchSize: 10,          // Tamaño de lote para operaciones
            // 🎯 HITO 2.5: Frame skipping y LOD
            frameSkipping: {
                enabled: true,
                skipInterval: 2,
                frameCounter: 0
            },
            culling: {
                enabled: true,
                margin: 50
            }
        };
        
        // 📊 HITO 2.5: Métricas de optimización integradas
        this.optimizationMetrics = {
            poolHits: 0,
            poolMisses: 0,
            cacheHits: 0,
            cacheMisses: 0,
            batchedOperations: 0,
            skippedFrames: 0,
            culledElements: 0
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
        this.precomputeMathCache(); // 🧮 HITO 2.5: Precomputar cache
        this.setupEventListeners();
        
        console.log('🎨 Renderer inicializado con optimizaciones del Milestone 2.2 + Hito 2.5');
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
     * Loop principal de renderizado (OPTIMIZADO CON HITO 2.5)
     */
    render() {
        if (!this.isRunning) return;
        
        // 🎯 HITO 2.5: Frame skipping inteligente
        this.optimizationConfig.frameSkipping.frameCounter++;
        const shouldUpdate = this.optimizationConfig.frameSkipping.frameCounter % this.optimizationConfig.frameSkipping.skipInterval === 0;
        
        if (!shouldUpdate) {
            this.optimizationMetrics.skippedFrames++;
            requestAnimationFrame(() => this.render());
            return;
        }
        
        // 👁️ MILESTONE 2.2: Obtener datos optimizados con culling
        const renderData = this.gameEngine.getRenderData();
        
        // 📊 MILESTONE 2.2: Medir tiempo de renderizado si hay profiler
        if (this.gameEngine.performanceProfiler) {
            this.gameEngine.performanceProfiler.measureRenderTime(() => {
                this.renderPlanetsOptimized(renderData.planets);
                this.renderFleetsOptimized(renderData.fleets);
                this.cleanupEffects();
                // ⚡ HITO 2.5: Ejecutar batches pendientes
                this.executeAllBatches();
            });
        } else {
            this.renderPlanetsOptimized(renderData.planets);
            this.renderFleetsOptimized(renderData.fleets);
            this.cleanupEffects();
            // ⚡ HITO 2.5: Ejecutar batches pendientes
            this.executeAllBatches();
        }
        
        requestAnimationFrame(() => this.render());
    }

    /**
     * Renderizar planetas (OPTIMIZADO CON HITO 2.5)
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
                // 🏊 HITO 2.5: Devolver al pool en lugar de eliminar
                this.returnToPool('planets', element);
                this.planetElements.delete(planetId);
            }
        });
    }

    /**
     * Renderizar un planeta individual (OPTIMIZADO CON HITO 2.5)
     */
    renderPlanet(planetData) {
        let planetGroup = this.planetElements.get(planetData.id);
        
        if (!planetGroup) {
            planetGroup = this.createPlanetElement(planetData);
            this.planetElements.set(planetData.id, planetGroup);
            this.planetsGroup.appendChild(planetGroup);
        }
        
        this.updatePlanetElementOptimized(planetGroup, planetData);
    }

    /**
     * Crear elemento visual de planeta (OPTIMIZADO CON POOLING)
     */
    createPlanetElement(planet) {
        // 🏊 HITO 2.5: Usar object pooling
        const group = this.getPooledElement('planets', () => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'planet');
            
            // Círculo principal del planeta
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'planet-body');
            g.appendChild(circle);
            
            // 📊 OPTIMIZACIÓN: Solo crear glow si está habilitado
            if (this.config.planetGlow) {
                const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                glow.setAttribute('class', 'planet-glow');
                glow.setAttribute('fill', 'none');
                glow.style.display = 'none';
                g.appendChild(glow);
            }
            
            // Texto de naves
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'planet-ships planet-text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.style.fontSize = '12px';
            text.style.fontWeight = 'bold';
            text.style.fill = '#ffffff';
            text.style.pointerEvents = 'none';
            g.appendChild(text);
            
            return g;
        });
        
        group.setAttribute('id', `planet-${planet.id}`);
        group.style.display = 'block';
        
        return group;
    }

    /**
     * Actualizar elemento visual de planeta (OPTIMIZADO CON BATCHING)
     */
    updatePlanetElementOptimized(planetGroup, planet) {
        const circle = planetGroup.querySelector('.planet-body');
        const glow = planetGroup.querySelector('.planet-glow');
        const text = planetGroup.querySelector('.planet-ships');
        
        if (!circle || !text) return;
        
        // ⚡ HITO 2.5: Usar batch processing para operaciones DOM
        this.addToBatch('domUpdates', () => {
            // Actualizar posición y tamaño
            circle.setAttribute('cx', planet.x);
            circle.setAttribute('cy', planet.y);
            circle.setAttribute('r', planet.radius);
            
            // Aplicar colores
            circle.setAttribute('fill', planet.color);
            circle.setAttribute('stroke', planet.color);
            circle.setAttribute('stroke-width', '2');
            
            // Actualizar texto
            text.setAttribute('x', planet.x);
            text.setAttribute('y', planet.y);
            text.textContent = planet.ships || 0;
            
            // Actualizar clases
            planetGroup.setAttribute('class', `planet ${planet.owner}`);
            text.setAttribute('class', `planet-ships planet-text ${planet.owner}`);
        });
        
        // Solo actualizar glow si existe y está seleccionado
        if (glow && planet.isSelected) {
            this.addToBatch('styleUpdates', () => {
                glow.setAttribute('cx', planet.x);
                glow.setAttribute('cy', planet.y);
                glow.setAttribute('r', planet.radius + 8);
                glow.setAttribute('stroke', planet.color);
                glow.setAttribute('stroke-width', 3);
                glow.setAttribute('stroke-opacity', 0.6);
                glow.style.display = 'block';
                glow.style.animation = 'pulse 1.5s ease-in-out infinite';
            });
        } else if (glow) {
            this.addToBatch('styleUpdates', () => {
                glow.style.display = 'none';
            });
        }
    }

    /**
     * Renderizar flotas (OPTIMIZADO CON HITO 2.5)
     */
    renderFleetsOptimized(fleetsData) {
        // 👁️ HITO 2.5: Filtrar flotas visibles con viewport culling
        const visibleFleets = fleetsData.filter(fleet => {
            if (this.optimizationConfig.culling.enabled) {
                if (!this.isInViewport(fleet.x, fleet.y, this.optimizationConfig.culling.margin)) {
                    this.optimizationMetrics.culledElements++;
                    return false;
                }
            }
            return true;
        });
        
        // Crear un Set de IDs de flotas visibles para limpieza
        const visibleFleetIds = new Set(visibleFleets.map(f => f.id));
        
        visibleFleets.forEach(fleetData => {
            this.renderFleet(fleetData);
        });
        
        // Limpiar flotas que ya no están visibles
        this.fleetElements.forEach((element, fleetId) => {
            if (!visibleFleetIds.has(fleetId)) {
                // 🏊 HITO 2.5: Devolver al pool en lugar de eliminar
                this.returnToPool('fleets', element);
                this.fleetElements.delete(fleetId);
            }
        });
    }

    /**
     * Renderizar una flota individual (OPTIMIZADO CON HITO 2.5)
     */
    renderFleet(fleetData) {
        let fleetGroup = this.fleetElements.get(fleetData.id);
        
        if (!fleetGroup) {
            fleetGroup = this.createFleetElement(fleetData);
            this.fleetElements.set(fleetData.id, fleetGroup);
            this.fleetsGroup.appendChild(fleetGroup);
        }
        
        this.updateFleetElementOptimized(fleetGroup, fleetData);
    }

    /**
     * Crear elemento visual de flota (OPTIMIZADO CON POOLING)
     */
    createFleetElement(fleet) {
        // 🏊 HITO 2.5: Usar object pooling
        const group = this.getPooledElement('fleets', () => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'fleet');
            
            // 🎯 HITO 1A: Crear triángulo EXACTAMENTE como en test-hito1a.html
            const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            
            // 🎯 PUNTOS IDÉNTICOS al test-hito1a.html
            const size = 8; // Mismo tamaño que en el test
            const points = [
                [size, 0],           // Punta hacia la derecha
                [-size/2, -size/2],  // Esquina superior
                [-size/2, size/2]    // Esquina inferior
            ];
            
            const pointsStr = points.map(p => p.join(',')).join(' ');
            triangle.setAttribute('points', pointsStr);
            triangle.setAttribute('class', 'fleet-triangle');
            
            g.appendChild(triangle);
            return g;
        });
        
        group.setAttribute('id', `fleet-${fleet.id}`);
        group.style.display = 'block';
        
        return group;
    }

    /**
     * Actualizar elemento visual de flota (OPTIMIZADO CON HITO 2.5)
     */
    updateFleetElementOptimized(fleetGroup, fleet) {
        const triangle = fleetGroup.querySelector('.fleet-triangle');
        
        if (!triangle) return;
        
        // Verificar que las coordenadas sean válidas
        if (isNaN(fleet.x) || isNaN(fleet.y) || isNaN(fleet.targetX) || isNaN(fleet.targetY)) {
            fleetGroup.style.display = 'none';
            return;
        }
        
        // 🧮 HITO 2.5: Calcular ángulo con cache trigonométrico
        const dx = fleet.targetX - fleet.x;
        const dy = fleet.targetY - fleet.y;
        const angle = this.calculateAngleOptimized(dx, dy);
        
        // ⚡ HITO 2.5: Usar batch processing para operaciones DOM
        this.addToBatch('transformUpdates', () => {
            if (isNaN(angle)) {
                triangle.setAttribute('transform', `translate(${fleet.x}, ${fleet.y}) rotate(0)`);
            } else {
                triangle.setAttribute('transform', `translate(${fleet.x}, ${fleet.y}) rotate(${angle})`);
            }
        });
        
        // 🌊 HITO 2: Efectos visuales orgánicos con batching
        const baseColor = fleet.color;
        const organicOpacity = fleet.organicIntensity ? 
            (0.7 + 0.3 * fleet.organicIntensity) : 0.9;
        
        this.addToBatch('styleUpdates', () => {
            triangle.setAttribute('fill', baseColor);
            triangle.setAttribute('stroke', baseColor);
            triangle.setAttribute('stroke-width', '1');
            triangle.setAttribute('opacity', organicOpacity);
            
            // 🌊 HITO 2: Tamaño ligeramente variable para sensación de vida
            if (fleet.personalAmplitude) {
                const sizeVariation = 1 + (fleet.personalAmplitude * 0.3);
                triangle.style.transform = `scale(${sizeVariation})`;
            }
            
            // Actualizar clases CSS
            fleetGroup.setAttribute('class', `fleet ${fleet.owner}`);
            
            // Ocultar si ha llegado
            if (fleet.hasArrived) {
                fleetGroup.style.display = 'none';
            } else {
                fleetGroup.style.display = 'block';
            }
        });
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
            this.optimizationMetrics.poolHits++;
            return pool.pop();
        }
        
        this.optimizationMetrics.poolMisses++;
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
     * 📊 HITO 2.5: Obtener métricas de optimización
     */
    getOptimizationMetrics() {
        const poolEfficiency = this.optimizationMetrics.poolHits / 
            (this.optimizationMetrics.poolHits + this.optimizationMetrics.poolMisses) * 100;
        
        const cacheEfficiency = this.optimizationMetrics.cacheHits / 
            (this.optimizationMetrics.cacheHits + this.optimizationMetrics.cacheMisses) * 100;
        
        return {
            ...this.optimizationMetrics,
            poolEfficiency: poolEfficiency.toFixed(1) + '%',
            cacheEfficiency: cacheEfficiency.toFixed(1) + '%',
            activePools: {
                fleets: this.elementPools.fleets.length,
                planets: this.elementPools.planets.length,
                effects: this.elementPools.effects.length,
                trails: this.elementPools.trails.length
            },
            activeElements: {
                planets: this.planetElements.size,
                fleets: this.fleetElements.size,
                effects: this.effectElements.size
            }
        };
    }

    /**
     * 📊 MILESTONE 2.2: Obtener información de debug (ACTUALIZADO CON HITO 2.5)
     */
    getDebugInfo() {
        const optimizationMetrics = this.getOptimizationMetrics();
        
        return {
            isRunning: this.isRunning,
            elements: {
                planets: this.planetElements.size,
                fleets: this.fleetElements.size,
                effects: this.effectElements.size
            },
            pools: {
                effects: this.elementPools.effects.length,
                trails: this.elementPools.trails.length,
                fleets: this.elementPools.fleets.length,
                planets: this.elementPools.planets.length,
                maxTrails: this.optimizationConfig.maxTrails
            },
            config: this.config,
            optimizationMetrics: optimizationMetrics
        };
    }

    /**
     * 🧹 MILESTONE 2.2: Destruir renderer y limpiar recursos
     */
    destroy() {
        this.stop();
        
        // Limpiar elementos activos
        this.planetElements.clear();
        this.fleetElements.clear();
        this.effectElements.clear();
        
        // 🏊 HITO 2.5: Limpiar pools
        Object.keys(this.elementPools).forEach(poolType => {
            if (poolType !== 'maxPoolSize') {
                this.elementPools[poolType].forEach(element => {
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                });
                this.elementPools[poolType] = [];
            }
        });
        
        // 🧮 HITO 2.5: Limpiar caches
        this.mathCache.angles.clear();
        this.mathCache.sin.clear();
        this.mathCache.cos.clear();
        
        // Limpiar canvas
        if (this.canvas) {
            this.canvas.innerHTML = '';
        }
        
        console.log('🧹 Renderer destruido y recursos limpiados');
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

    // 🧮 HITO 2.5: Precomputar cache de matemáticas
    precomputeMathCache() {
        console.log('🧮 Precomputando cache de matemáticas...');
        
        // Precomputar ángulos comunes (cada 5 grados)
        for (let degrees = 0; degrees < 360; degrees += 5) {
            const radians = degrees * (Math.PI / 180);
            this.mathCache.sin.set(degrees, Math.sin(radians));
            this.mathCache.cos.set(degrees, Math.cos(radians));
        }
        
        console.log(`✅ Cache precomputado: ${this.mathCache.sin.size} valores`);
    }

    // 🧮 HITO 2.5: Calcular ángulo con cache
    calculateAngleOptimized(dx, dy) {
        // Crear clave única para el cálculo
        const key = `${Math.round(dx * 10)},${Math.round(dy * 10)}`;
        
        if (this.mathCache.angles.has(key)) {
            this.optimizationMetrics.cacheHits++;
            return this.mathCache.angles.get(key);
        }
        
        // Calcular y cachear
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Mantener tamaño del cache
        if (this.mathCache.cacheSize < this.mathCache.maxCacheSize) {
            this.mathCache.angles.set(key, angle);
            this.mathCache.cacheSize++;
        }
        
        this.optimizationMetrics.cacheMisses++;
        return angle;
    }

    // 🏊 HITO 2.5: Obtener elemento del pool o crear nuevo
    getPooledElement(type, createFunction) {
        const pool = this.elementPools[type];
        
        if (pool && pool.length > 0) {
            this.optimizationMetrics.poolHits++;
            return pool.pop();
        }
        
        this.optimizationMetrics.poolMisses++;
        return createFunction();
    }

    // 🏊 HITO 2.5: Devolver elemento al pool
    returnToPool(type, element) {
        const pool = this.elementPools[type];
        
        if (pool && pool.length < this.elementPools.maxPoolSize) {
            // Limpiar elemento
            element.style.display = 'none';
            element.removeAttribute('transform');
            
            pool.push(element);
        } else {
            // Pool lleno, eliminar elemento
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
    }

    // ⚡ HITO 2.5: Añadir operación al batch
    addToBatch(type, operation) {
        const batch = this.batchOperations[type];
        
        if (batch) {
            batch.push(operation);
            
            // Ejecutar batch si está lleno
            if (batch.length >= this.batchOperations.maxBatchSize) {
                this.executeBatch(type);
            }
        }
    }

    // ⚡ HITO 2.5: Ejecutar batch de operaciones
    executeBatch(type) {
        const batch = this.batchOperations[type];
        
        if (!batch || batch.length === 0) return;
        
        // Ejecutar todas las operaciones del batch
        batch.forEach(operation => {
            try {
                operation();
            } catch (error) {
                console.warn('⚠️ Error en operación batch:', error);
            }
        });
        
        this.optimizationMetrics.batchedOperations += batch.length;
        batch.length = 0; // Limpiar batch
    }

    // ⚡ HITO 2.5: Ejecutar todos los batches pendientes
    executeAllBatches() {
        Object.keys(this.batchOperations).forEach(type => {
            if (type !== 'maxBatchSize') {
                this.executeBatch(type);
            }
        });
    }

    // 👁️ HITO 2.5: Verificar si elemento está en viewport
    isInViewport(x, y, margin = 0) {
        const rect = this.canvas.getBoundingClientRect();
        return (
            x >= -margin &&
            y >= -margin &&
            x <= rect.width + margin &&
            y <= rect.height + margin
        );
    }
}

export default Renderer; 