/**
 * 🚀 OPTIMIZED RENDERER - HITO 2.5 OPTIMIZACIÓN
 * Renderer optimizado basado en los bottlenecks identificados en el baseline
 * 
 * OPTIMIZACIONES IMPLEMENTADAS:
 * - Object Pooling para elementos SVG
 * - Cache de cálculos trigonométricos
 * - Batch processing de operaciones DOM
 * - Frame skipping inteligente
 * - Level of Detail (LOD)
 */

export class OptimizedRenderer {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.canvas = null;
        this.isRunning = false;
        
        // 🏊 OBJECT POOLING - Reutilización de elementos SVG
        this.elementPools = {
            fleets: [],
            planets: [],
            effects: [],
            maxPoolSize: 100
        };
        
        // 📊 CACHE DE CÁLCULOS TRIGONOMÉTRICOS
        this.mathCache = {
            angles: new Map(),
            sin: new Map(),
            cos: new Map(),
            cacheSize: 0,
            maxCacheSize: 1000
        };
        
        // ⚡ BATCH PROCESSING
        this.batchOperations = {
            domUpdates: [],
            transformUpdates: [],
            styleUpdates: [],
            maxBatchSize: 20
        };
        
        // 🎯 FRAME SKIPPING Y LOD
        this.optimizationConfig = {
            frameSkipping: {
                enabled: true,
                skipInterval: 2,        // Actualizar cada 2 frames
                frameCounter: 0
            },
            lod: {
                enabled: true,
                nearDistance: 100,      // Distancia para LOD alto
                farDistance: 300,       // Distancia para LOD bajo
                maxVisibleFleets: 50    // Máximo de flotas visibles
            },
            culling: {
                enabled: true,
                margin: 50              // Margen fuera de pantalla
            }
        };
        
        // Elementos renderizados
        this.activeElements = {
            planets: new Map(),
            fleets: new Map(),
            effects: new Set()
        };
        
        // Grupos de renderizado
        this.renderGroups = {};
        
        // Métricas de optimización
        this.optimizationMetrics = {
            poolHits: 0,
            poolMisses: 0,
            cacheHits: 0,
            cacheMisses: 0,
            batchedOperations: 0,
            skippedFrames: 0,
            culledElements: 0
        };
        
        this.setupCanvas();
        this.precomputeMathCache();
        
        console.log('🚀 OptimizedRenderer inicializado con optimizaciones del Hito 2.5');
    }

    /**
     * Configurar canvas y grupos de renderizado
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas no encontrado');
            return;
        }
        
        // Crear grupos optimizados
        this.renderGroups = {
            background: this.createRenderGroup('background-effects'),
            trails: this.createRenderGroup('fleet-trails'),
            planets: this.createRenderGroup('planets'),
            fleets: this.createRenderGroup('fleets'),
            effects: this.createRenderGroup('effects')
        };
        
        console.log('🖼️ Canvas optimizado configurado');
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
     * Precomputar cache de matemáticas
     */
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

    /**
     * Calcular ángulo con cache
     */
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

    /**
     * Obtener elemento del pool o crear nuevo
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
     * Devolver elemento al pool
     */
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

    /**
     * Añadir operación al batch
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
     * Ejecutar batch de operaciones
     */
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
     * Verificar si elemento está en viewport
     */
    isInViewport(x, y, margin = 0) {
        const rect = this.canvas.getBoundingClientRect();
        return (
            x >= -margin &&
            y >= -margin &&
            x <= rect.width + margin &&
            y <= rect.height + margin
        );
    }

    /**
     * Calcular nivel de LOD basado en distancia
     */
    calculateLOD(element, viewportCenter) {
        const dx = element.x - viewportCenter.x;
        const dy = element.y - viewportCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.optimizationConfig.lod.nearDistance) {
            return 'high';
        } else if (distance < this.optimizationConfig.lod.farDistance) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Renderizar flota optimizada
     */
    renderFleetOptimized(fleetData) {
        // Culling - verificar si está en viewport
        if (this.optimizationConfig.culling.enabled) {
            if (!this.isInViewport(fleetData.x, fleetData.y, this.optimizationConfig.culling.margin)) {
                this.optimizationMetrics.culledElements++;
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
     * Actualizar elemento de flota optimizado
     */
    updateFleetElementOptimized(fleetElement, fleetData) {
        const triangle = fleetElement.querySelector('.fleet-triangle');
        if (!triangle) return;
        
        // Calcular ángulo con cache
        const dx = fleetData.targetX - fleetData.x;
        const dy = fleetData.targetY - fleetData.y;
        const angle = this.calculateAngleOptimized(dx, dy);
        
        // Añadir actualización al batch
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
     * Loop principal optimizado
     */
    renderLoop() {
        if (!this.isRunning) return;
        
        const config = this.optimizationConfig;
        
        // Frame skipping
        if (config.frameSkipping.enabled) {
            config.frameSkipping.frameCounter++;
            
            if (config.frameSkipping.frameCounter % config.frameSkipping.skipInterval !== 0) {
                this.optimizationMetrics.skippedFrames++;
                requestAnimationFrame(() => this.renderLoop());
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
        
        requestAnimationFrame(() => this.renderLoop());
    }

    /**
     * Renderizar con Level of Detail
     */
    renderWithLOD(renderData) {
        const viewportCenter = { x: 400, y: 300 }; // Centro del viewport
        
        // Filtrar y ordenar flotas por distancia
        let visibleFleets = renderData.fleets || [];
        
        if (this.optimizationConfig.lod.enabled) {
            visibleFleets = visibleFleets
                .map(fleet => ({
                    ...fleet,
                    distance: Math.sqrt(
                        Math.pow(fleet.x - viewportCenter.x, 2) + 
                        Math.pow(fleet.y - viewportCenter.y, 2)
                    )
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
     * Actualizar elemento de planeta optimizado
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
     * Limpiar elementos no utilizados
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
     * Iniciar renderizado optimizado
     */
    start() {
        this.isRunning = true;
        this.renderLoop();
        console.log('🚀 Renderer optimizado iniciado');
    }

    /**
     * Detener renderizado
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Renderer optimizado detenido');
    }

    /**
     * Obtener métricas de optimización
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
                effects: this.elementPools.effects.length
            }
        };
    }

    /**
     * Configurar optimizaciones dinámicamente
     */
    configureOptimizations(config) {
        Object.assign(this.optimizationConfig, config);
        console.log('⚙️ Configuración de optimización actualizada:', config);
    }

    /**
     * Método de compatibilidad con el renderer original
     */
    render() {
        // Este método se llama desde el gameLoop principal
        // El renderer optimizado maneja su propio loop interno
        if (!this.isRunning) {
            this.start();
        }
        
        // Para compatibilidad, también renderizar una vez aquí
        if (this.isRunning) {
            const renderData = this.gameEngine.getRenderData();
            this.renderWithLOD(renderData);
            this.executeAllBatches();
        }
    }

    /**
     * Método de compatibilidad para limpiar recursos
     */
    cleanup() {
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
        
        console.log('🧹 OptimizedRenderer limpiado');
    }

    /**
     * Método de compatibilidad para obtener estadísticas
     */
    getStats() {
        const metrics = this.getOptimizationMetrics();
        return {
            activeElements: {
                fleets: this.activeElements.fleets.size,
                planets: this.activeElements.planets.size,
                effects: this.activeElements.effects.size
            },
            optimization: metrics,
            pools: metrics.activePools
        };
    }
} 