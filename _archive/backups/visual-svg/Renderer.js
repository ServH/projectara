/**
 * 🎨 GALCON GAME - RENDERER (REFACTORIZADO FASE 2)
 * Sistema de renderizado optimizado para máximo rendimiento
 * HITO 2.5: Optimización crítica del renderizado para 60 FPS estables
 * 
 * OPTIMIZACIONES APLICADAS:
 * - ❌ Eliminados 15+ console.log del loop de renderizado
 * - ⚡ Optimizadas operaciones DOM con batch mejorado
 * - 🧮 Cache trigonométrico expandido y optimizado
 * - 🎯 Viewport culling mejorado
 * - 📊 Sistema de debug condicional implementado
 * - 🏊 Object pooling optimizado
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class Renderer {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.canvas = null;
        this.isRunning = false;
        
        // 🚀 OPTIMIZACIÓN: Flag de debug centralizado
        this.debugMode = false; // Solo true para debugging
        
        // Grupos de renderizado optimizados
        this.renderGroups = {
            background: null,
            trails: null,
            planets: null,
            fleets: null,
            effects: null
        };
        
        // 🚀 OPTIMIZACIÓN: Object pooling mejorado
        this.elementPools = {
            fleets: [],
            planets: [],
            effects: [],
            maxPoolSize: 100
        };
        
        // 🚀 OPTIMIZACIÓN: Cache de elementos activos optimizado
        this.activeElements = {
            fleets: new Map(),
            planets: new Map(),
            effects: new Map()
        };
        
        // 🚀 OPTIMIZACIÓN: Cache matemático expandido
        this.mathCache = {
            sin: new Map(),
            cos: new Map(),
            angles: new Map(),
            distances: new Map(), // Nuevo cache para distancias
            cacheSize: 0,
            maxCacheSize: 1000
        };
        
        // 🚀 OPTIMIZACIÓN: Batch operations mejorado
        this.batchOperations = {
            domUpdates: [],
            transformUpdates: [],
            styleUpdates: [],
            maxBatchSize: 25 // Aumentado para mejor eficiencia
        };
        
        // 🚀 OPTIMIZACIÓN: Configuración de optimización mejorada
        this.optimizationConfig = {
            frameSkipping: {
                enabled: true,
                skipInterval: 2,
                frameCounter: 0
            },
            lod: {
                enabled: true,
                maxVisibleFleets: 50
            },
            culling: {
                enabled: true,
                margin: 50
            },
            pooling: {
                enabled: true,
                aggressiveCleanup: true
            }
        };
        
        // 🚀 OPTIMIZACIÓN: Métricas optimizadas (solo actualizar si debug)
        this.optimizationMetrics = {
            poolHits: 0,
            poolMisses: 0,
            cacheHits: 0,
            cacheMisses: 0,
            batchedOperations: 0,
            skippedFrames: 0,
            culledElements: 0
        };
        
        // 🚀 OPTIMIZACIÓN: Cache de viewport
        this.viewportCache = {
            width: 0,
            height: 0,
            center: { x: 0, y: 0 },
            lastUpdate: 0
        };
        
        this.setupCanvas();
        this.precomputeMathCache();
        this.setupEventListeners();
        
        if (this.debugMode) {
            console.log('🎨 Renderer refactorizado inicializado con optimizaciones Fase 2');
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Configurar canvas sin logs
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            if (this.debugMode) {
            console.error('❌ Canvas no encontrado');
            }
            return;
        }
        
        // Configurar SVG optimizado
        this.canvas.style.background = 'radial-gradient(ellipse at center, #000033 0%, #000011 70%, #000000 100%)';
        this.canvas.style.cursor = 'crosshair';
        
        // Crear grupos optimizados
        this.renderGroups = {
            background: this.createRenderGroup('background-effects'),
            trails: this.createRenderGroup('fleet-trails'),
            planets: this.createRenderGroup('planets'),
            fleets: this.createRenderGroup('fleets'),
            effects: this.createRenderGroup('effects')
        };
        
        // 🚀 OPTIMIZACIÓN: Cache inicial de viewport
        this.updateViewportCache();
        
        if (this.debugMode) {
            console.log('🖼️ Canvas optimizado configurado');
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar cache de viewport
     */
    updateViewportCache() {
        const rect = this.canvas.getBoundingClientRect();
        this.viewportCache.width = rect.width;
        this.viewportCache.height = rect.height;
        this.viewportCache.center.x = rect.width / 2;
        this.viewportCache.center.y = rect.height / 2;
        this.viewportCache.lastUpdate = performance.now();
    }

    /**
     * Crear grupo de renderizado
     */
    createRenderGroup(id) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', id);
        this.canvas.appendChild(group);
        return group;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Precomputar cache matemático expandido
     */
    precomputeMathCache() {
        if (this.debugMode) {
            console.log('🧮 Precomputando cache de matemáticas...');
        }
        
        // Precomputar ángulos comunes (cada 2 grados para mayor precisión)
        for (let degrees = 0; degrees < 360; degrees += 2) {
            const radians = degrees * (Math.PI / 180);
            this.mathCache.sin.set(degrees, Math.sin(radians));
            this.mathCache.cos.set(degrees, Math.cos(radians));
        }
        
        if (this.debugMode) {
            console.log(`✅ Cache precomputado: ${this.mathCache.sin.size} valores`);
        }
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
     * 🚀 OPTIMIZACIÓN: Calcular ángulo con cache mejorado
     */
    calculateAngleOptimized(dx, dy) {
        // Crear clave única optimizada
        const key = `${Math.round(dx * 5)},${Math.round(dy * 5)}`;
        
        if (this.mathCache.angles.has(key)) {
            if (this.debugMode) this.optimizationMetrics.cacheHits++;
            return this.mathCache.angles.get(key);
        }
        
        // Calcular y cachear
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Mantener tamaño del cache
        if (this.mathCache.cacheSize < this.mathCache.maxCacheSize) {
            this.mathCache.angles.set(key, angle);
            this.mathCache.cacheSize++;
        }
        
        if (this.debugMode) this.optimizationMetrics.cacheMisses++;
        return angle;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular distancia con cache
     */
    calculateDistanceOptimized(x1, y1, x2, y2) {
        const key = `${Math.round(x1)},${Math.round(y1)},${Math.round(x2)},${Math.round(y2)}`;
        
        if (this.mathCache.distances.has(key)) {
            if (this.debugMode) this.optimizationMetrics.cacheHits++;
            return this.mathCache.distances.get(key);
        }
        
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        if (this.mathCache.cacheSize < this.mathCache.maxCacheSize) {
            this.mathCache.distances.set(key, distance);
            this.mathCache.cacheSize++;
        }
        
        if (this.debugMode) this.optimizationMetrics.cacheMisses++;
        return distance;
    }

    /**
     * Obtener elemento del pool o crear nuevo
     */
    getPooledElement(type, createFunction) {
        const pool = this.elementPools[type];
        
        if (pool && pool.length > 0) {
            if (this.debugMode) this.optimizationMetrics.poolHits++;
            return pool.pop();
        }
        
        if (this.debugMode) this.optimizationMetrics.poolMisses++;
        return createFunction();
    }

    /**
     * 🚀 OPTIMIZACIÓN: Devolver elemento al pool mejorado
     */
    returnToPool(type, element) {
        const pool = this.elementPools[type];
        
        if (pool && pool.length < this.elementPools.maxPoolSize) {
            // Limpiar elemento de forma optimizada
            element.style.display = 'none';
            element.removeAttribute('transform');
            element.removeAttribute('opacity');
            
            pool.push(element);
        } else {
            // Pool lleno, eliminar elemento
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Añadir operación al batch mejorado
     */
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

    /**
     * 🚀 OPTIMIZACIÓN: Ejecutar batch sin logs
     */
    executeBatch(type) {
        const batch = this.batchOperations[type];
        
        if (!batch || batch.length === 0) return;
        
        // Ejecutar todas las operaciones del batch
        batch.forEach(operation => {
            try {
                operation();
            } catch (error) {
                if (this.debugMode) {
                    console.warn('⚠️ Error en operación batch:', error);
                }
            }
        });
        
        if (this.debugMode) {
            this.optimizationMetrics.batchedOperations += batch.length;
        }
        batch.length = 0; // Limpiar batch
    }

    /**
     * Ejecutar todos los batches pendientes
     */
    executeAllBatches() {
        Object.keys(this.batchOperations).forEach(type => {
            if (type !== 'maxBatchSize') {
                this.executeBatch(type);
            }
        });
    }

    /**
     * 🚀 OPTIMIZACIÓN: Verificar viewport con cache
     */
    isInViewport(x, y, margin = 0) {
        // Actualizar cache si es necesario (cada 100ms)
        const now = performance.now();
        if (now - this.viewportCache.lastUpdate > 100) {
            this.updateViewportCache();
        }
        
        return (
            x >= -margin &&
            y >= -margin &&
            x <= this.viewportCache.width + margin &&
            y <= this.viewportCache.height + margin
        );
    }

    /**
     * 🚀 OPTIMIZACIÓN: Iniciar renderizado sin logs
     */
    start() {
        this.isRunning = true;
        this.render();
        
        if (this.debugMode) {
            console.log('🎬 Renderer optimizado iniciado');
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Detener renderizado sin logs
     */
    stop() {
        this.isRunning = false;
        
        if (this.debugMode) {
            console.log('⏹️ Renderer detenido');
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Loop principal optimizado sin logs
     */
    render() {
        if (!this.isRunning) return;
        
        const config = this.optimizationConfig;
        
        // Frame skipping optimizado
        if (config.frameSkipping.enabled) {
            config.frameSkipping.frameCounter++;
            
            if (config.frameSkipping.frameCounter % config.frameSkipping.skipInterval !== 0) {
                if (this.debugMode) this.optimizationMetrics.skippedFrames++;
                requestAnimationFrame(() => this.render());
                return;
            }
        }
        
        // Obtener datos de renderizado
        const renderData = this.gameEngine.getRenderData();
        
        // Renderizar con LOD
        this.renderWithLOD(renderData);
        
        // Ejecutar batches pendientes
        this.executeAllBatches();
        
        // Limpiar elementos no utilizados
        this.cleanupUnusedElements(renderData);
        
        requestAnimationFrame(() => this.render());
    }

    /**
     * 🚀 OPTIMIZACIÓN: Renderizar con LOD optimizado
     */
    renderWithLOD(renderData) {
        // Filtrar y ordenar flotas por distancia con cache
        let visibleFleets = renderData.fleets || [];
        
        if (this.optimizationConfig.lod.enabled && visibleFleets.length > this.optimizationConfig.lod.maxVisibleFleets) {
            const center = this.viewportCache.center;
            
            visibleFleets = visibleFleets
                .map(fleet => ({
                    ...fleet,
                    distance: this.calculateDistanceOptimized(fleet.x, fleet.y, center.x, center.y)
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, this.optimizationConfig.lod.maxVisibleFleets);
        }
        
        // Renderizar flotas visibles
        visibleFleets.forEach(fleet => {
            this.renderFleetOptimized(fleet);
        });
        
        // Renderizar planetas (siempre visibles)
        if (renderData.planets) {
            renderData.planets.forEach(planet => {
                this.renderPlanetOptimized(planet);
            });
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Renderizar flota optimizada
     */
    renderFleetOptimized(fleetData) {
        // Culling optimizado - verificar si está en viewport
        if (this.optimizationConfig.culling.enabled) {
            if (!this.isInViewport(fleetData.x, fleetData.y, this.optimizationConfig.culling.margin)) {
                if (this.debugMode) this.optimizationMetrics.culledElements++;
                return;
            }
        }
        
        let fleetElement = this.activeElements.fleets.get(fleetData.id);
        
        if (!fleetElement) {
            fleetElement = this.createFleetElementOptimized(fleetData);
            this.activeElements.fleets.set(fleetData.id, fleetElement);
        }
        
        this.updateFleetElementOptimized(fleetElement, fleetData);
    }

    /**
     * Crear elemento de flota optimizado
     */
    createFleetElementOptimized(fleetData) {
        const element = this.getPooledElement('fleets', () => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', 'fleet');
            
            const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            triangle.setAttribute('points', '-4,-2 4,0 -4,2');
            triangle.setAttribute('class', 'fleet-triangle');
            
            group.appendChild(triangle);
            return group;
        });
        
        element.setAttribute('id', `fleet-${fleetData.id}`);
        element.style.display = 'block';
        this.renderGroups.fleets.appendChild(element);
        
        return element;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar elemento de flota optimizado
     */
    updateFleetElementOptimized(fleetElement, fleetData) {
        const triangle = fleetElement.querySelector('.fleet-triangle');
        if (!triangle) return;
        
        // Calcular ángulo con cache optimizado
        const dx = fleetData.targetX - fleetData.x;
        const dy = fleetData.targetY - fleetData.y;
        const angle = this.calculateAngleOptimized(dx, dy);
        
        // Añadir actualización al batch optimizado
        this.addToBatch('transformUpdates', () => {
            triangle.setAttribute('transform', `translate(${fleetData.x}, ${fleetData.y}) rotate(${angle})`);
        });
        
        this.addToBatch('styleUpdates', () => {
            triangle.setAttribute('fill', fleetData.color);
            triangle.setAttribute('stroke', fleetData.color);
            
            if (fleetData.organicIntensity !== undefined) {
                const opacity = 0.7 + 0.3 * fleetData.organicIntensity;
                triangle.setAttribute('opacity', opacity);
            }
        });
    }

    /**
     * Renderizar planeta optimizado
     */
    renderPlanetOptimized(planetData) {
        let planetElement = this.activeElements.planets.get(planetData.id);
        
        if (!planetElement) {
            planetElement = this.createPlanetElementOptimized(planetData);
            this.activeElements.planets.set(planetData.id, planetElement);
        }
        
        this.updatePlanetElementOptimized(planetElement, planetData);
    }

    /**
     * Crear elemento de planeta optimizado
     */
    createPlanetElementOptimized(planetData) {
        const element = this.getPooledElement('planets', () => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', 'planet');
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'planet-body');
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'planet-text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            
            group.appendChild(circle);
            group.appendChild(text);
            return group;
        });
        
        element.setAttribute('id', `planet-${planetData.id}`);
        element.style.display = 'block';
        this.renderGroups.planets.appendChild(element);
        
        return element;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar elemento de planeta optimizado
     */
    updatePlanetElementOptimized(planetElement, planetData) {
        const circle = planetElement.querySelector('.planet-body');
        const text = planetElement.querySelector('.planet-text');
        
        if (!circle || !text) return;
        
        this.addToBatch('domUpdates', () => {
            circle.setAttribute('cx', planetData.x);
            circle.setAttribute('cy', planetData.y);
            circle.setAttribute('r', planetData.radius);
            circle.setAttribute('fill', planetData.color);
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '1');
            
            text.setAttribute('x', planetData.x);
            text.setAttribute('y', planetData.y);
            text.textContent = planetData.ships || 0;
            text.setAttribute('fill', '#fff');
        });
    }

    /**
     * 🚀 OPTIMIZACIÓN: Limpiar elementos no utilizados optimizado
     */
    cleanupUnusedElements(renderData) {
        // Crear sets de IDs activos
        const activeFleetIds = new Set((renderData.fleets || []).map(f => f.id));
        const activePlanetIds = new Set((renderData.planets || []).map(p => p.id));
        
        // Limpiar flotas no utilizadas
        this.activeElements.fleets.forEach((element, id) => {
            if (!activeFleetIds.has(id)) {
                this.returnToPool('fleets', element);
                this.activeElements.fleets.delete(id);
            }
        });
        
        // Limpiar planetas no utilizados
        this.activeElements.planets.forEach((element, id) => {
            if (!activePlanetIds.has(id)) {
                this.returnToPool('planets', element);
                this.activeElements.planets.delete(id);
            }
        });
    }

    /**
     * 🚀 OPTIMIZACIÓN: Event handlers sin logs críticos
     */
    onFleetLaunched(data) {
        if (this.debugMode) {
            console.log(`🚀 Flota lanzada: ${data.ships} naves`);
        }
        // Crear efecto de lanzamiento si es necesario
    }

    onFleetArrived(data) {
        if (this.debugMode) {
            console.log(`🎯 Flota llegó al destino`);
        }
        // Crear efecto de llegada si es necesario
    }

    onPlanetConquered(data) {
        if (this.debugMode) {
            console.log(`⚔️ Planeta conquistado: ${data.planetId}`);
        }
        // Crear efecto de conquista si es necesario
    }

    onBattleStart(data) {
        if (this.debugMode) {
            console.log(`⚔️ Batalla iniciada`);
        }
        // Crear efecto de batalla si es necesario
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener métricas solo si debug
     */
    getOptimizationMetrics() {
        if (!this.debugMode) {
            return { debugMode: false };
        }
        
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
                effects: this.elementPools.effects.length
            },
            viewportCache: this.viewportCache
        };
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            isRunning: this.isRunning,
            debugMode: this.debugMode,
            activeElements: {
                fleets: this.activeElements.fleets.size,
                planets: this.activeElements.planets.size,
                effects: this.activeElements.effects.size
            },
            optimization: this.getOptimizationMetrics(),
            config: this.optimizationConfig
        };
    }

    /**
     * 🚀 OPTIMIZACIÓN: Destruir el renderer sin logs
     */
    destroy() {
        this.stop();
        
        // Limpiar todos los pools
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
        
        // Limpiar elementos activos
        this.activeElements.fleets.clear();
        this.activeElements.planets.clear();
        this.activeElements.effects.clear();
        
        if (this.debugMode) {
            console.log('💥 Renderer destruido');
        }
    }

    // 🧪 MÉTODOS DE TESTING Y DEBUG (solo para desarrollo)
    
    /**
     * 🧪 TESTING: Activar modo debug
     */
    enableDebugMode() {
        this.debugMode = true;
        console.log('🔧 Renderer: Modo debug activado');
    }

    /**
     * 🧪 TESTING: Desactivar modo debug
     */
    disableDebugMode() {
        this.debugMode = false;
        console.log('🔧 Renderer: Modo debug desactivado');
    }

    /**
     * 🧪 TESTING: Forzar actualización de viewport cache
     */
    forceViewportUpdate() {
        if (!this.debugMode) return;
        this.updateViewportCache();
        console.log('🔧 Viewport cache actualizado:', this.viewportCache);
    }

    /**
     * 🧪 TESTING: Obtener estadísticas detalladas
     */
    getDetailedStats() {
        if (!this.debugMode) return null;
        
        return {
            mathCache: {
                angles: this.mathCache.angles.size,
                distances: this.mathCache.distances.size,
                sin: this.mathCache.sin.size,
                cos: this.mathCache.cos.size,
                totalSize: this.mathCache.cacheSize
            },
            pools: {
                fleets: this.elementPools.fleets.length,
                planets: this.elementPools.planets.length,
                effects: this.elementPools.effects.length
            },
            batches: {
                domUpdates: this.batchOperations.domUpdates.length,
                transformUpdates: this.batchOperations.transformUpdates.length,
                styleUpdates: this.batchOperations.styleUpdates.length
            },
            metrics: this.optimizationMetrics
        };
    }
}

export default Renderer; 