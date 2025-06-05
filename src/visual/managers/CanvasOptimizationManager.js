/**
 * ⚡ CANVAS OPTIMIZATION MANAGER
 * Gestor especializado para optimizaciones de rendimiento del renderizado
 * 
 * RESPONSABILIDADES:
 * - Viewport culling para objetos fuera de pantalla
 * - Level of Detail (LOD) para objetos distantes
 * - Cache matemático para cálculos repetitivos
 * - Batch rendering para elementos similares
 * 
 * PATRÓN: Facade Pattern
 * PRINCIPIOS: Single Responsibility, Performance
 */

export class CanvasOptimizationManager {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.config = {
            // Culling settings
            culling: {
                enabled: true,
                margin: 100,
                checkInterval: 100, // ms
                ...config.culling
            },
            
            // LOD settings
            lod: {
                enabled: true,
                maxVisibleFleets: 100,
                distanceThresholds: [200, 400, 800],
                simplificationLevels: [1, 0.7, 0.4, 0.2],
                ...config.lod
            },
            
            // Batching settings
            batching: {
                enabled: true,
                fleetBatchSize: 50,
                planetBatchSize: 20,
                maxBatchTime: 16, // ms (60 FPS)
                ...config.batching
            },
            
            // Cache settings
            cache: {
                enabled: true,
                mathCacheSize: 1000,
                angleCacheSize: 360,
                distanceCacheSize: 500,
                cleanupInterval: 5000, // ms
                ...config.cache
            }
        };
        
        // Estado del viewport
        this.viewport = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            centerX: 0,
            centerY: 0,
            lastUpdate: 0
        };
        
        // Cache matemático
        this.mathCache = {
            sin: new Map(),
            cos: new Map(),
            angles: new Map(),
            distances: new Map(),
            sqrt: new Map(),
            cacheHits: 0,
            cacheMisses: 0,
            lastCleanup: Date.now()
        };
        
        // Estado de culling
        this.cullingState = {
            lastCheck: 0,
            visibleObjects: new Set(),
            culledObjects: new Set(),
            totalObjects: 0
        };
        
        // Estado de LOD
        this.lodState = {
            levels: new Map(),
            lastUpdate: 0,
            processedObjects: 0
        };
        
        // Métricas de optimización
        this.optimizationMetrics = {
            culledObjects: 0,
            lodReductions: 0,
            cacheHitRatio: 0,
            batchedDrawCalls: 0,
            frameTime: 0,
            lastMetricsUpdate: Date.now()
        };
        
        this.initializeOptimizations();
        
        console.log('⚡ CanvasOptimizationManager inicializado');
    }
    
    /**
     * 🔧 Inicializar optimizaciones
     */
    initializeOptimizations() {
        this.updateViewport();
        this.precomputeMathCache();
        
        console.log('🔧 Optimizaciones inicializadas');
    }
    
    /**
     * 📐 Actualizar viewport
     */
    updateViewport() {
        this.viewport.width = this.canvas.width;
        this.viewport.height = this.canvas.height;
        this.viewport.centerX = this.viewport.width / 2;
        this.viewport.centerY = this.viewport.height / 2;
        this.viewport.lastUpdate = Date.now();
    }
    
    /**
     * 🧮 Precomputar cache matemático
     */
    precomputeMathCache() {
        // Precomputar senos y cosenos para ángulos comunes
        for (let angle = 0; angle < 360; angle++) {
            const radians = (angle * Math.PI) / 180;
            this.mathCache.sin.set(angle, Math.sin(radians));
            this.mathCache.cos.set(angle, Math.cos(radians));
        }
        
        console.log('🧮 Cache matemático precomputado');
    }
    
    /**
     * 🎯 Optimizar datos de renderizado
     */
    optimizeRenderData(renderData) {
        const startTime = performance.now();
        
        if (!renderData) return null;
        
        const optimizedData = {
            planets: [],
            fleets: [],
            effects: renderData.effects || [],
            metadata: {
                originalPlanets: renderData.planets?.length || 0,
                originalFleets: renderData.fleets?.length || 0,
                culledPlanets: 0,
                culledFleets: 0,
                lodReductions: 0
            }
        };
        
        // Optimizar planetas
        if (renderData.planets && this.config.culling.enabled) {
            const { visible, culled } = this.cullPlanets(renderData.planets);
            optimizedData.planets = visible;
            optimizedData.metadata.culledPlanets = culled.length;
        } else {
            optimizedData.planets = renderData.planets || [];
        }
        
        // Optimizar flotas
        if (renderData.fleets) {
            let fleets = renderData.fleets;
            
            // Aplicar culling
            if (this.config.culling.enabled) {
                const { visible, culled } = this.cullFleets(fleets);
                fleets = visible;
                optimizedData.metadata.culledFleets = culled.length;
            }
            
            // Aplicar LOD
            if (this.config.lod.enabled) {
                const { optimized, reductions } = this.applyLOD(fleets);
                fleets = optimized;
                optimizedData.metadata.lodReductions = reductions;
            }
            
            optimizedData.fleets = fleets;
        }
        
        // Actualizar métricas
        this.optimizationMetrics.frameTime = performance.now() - startTime;
        this.optimizationMetrics.culledObjects = optimizedData.metadata.culledPlanets + optimizedData.metadata.culledFleets;
        this.optimizationMetrics.lodReductions = optimizedData.metadata.lodReductions;
        
        return optimizedData;
    }
    
    /**
     * ✂️ Aplicar culling a planetas
     */
    cullPlanets(planets) {
        const visible = [];
        const culled = [];
        const margin = this.config.culling.margin;
        
        for (const planet of planets) {
            if (this.isInViewport(planet.x, planet.y, planet.radius + margin)) {
                visible.push(planet);
            } else {
                culled.push(planet);
            }
        }
        
        return { visible, culled };
    }
    
    /**
     * ✂️ Aplicar culling a flotas
     */
    cullFleets(fleets) {
        const visible = [];
        const culled = [];
        const margin = this.config.culling.margin;
        
        for (const fleet of fleets) {
            if (this.isInViewport(fleet.x, fleet.y, fleet.size + margin)) {
                visible.push(fleet);
            } else {
                culled.push(fleet);
            }
        }
        
        return { visible, culled };
    }
    
    /**
     * 🔍 Verificar si un objeto está en el viewport
     */
    isInViewport(x, y, margin = 0) {
        return (
            x + margin >= this.viewport.x &&
            x - margin <= this.viewport.x + this.viewport.width &&
            y + margin >= this.viewport.y &&
            y - margin <= this.viewport.y + this.viewport.height
        );
    }
    
    /**
     * 📊 Aplicar Level of Detail (LOD)
     */
    applyLOD(fleets) {
        if (fleets.length <= this.config.lod.maxVisibleFleets) {
            return { optimized: fleets, reductions: 0 };
        }
        
        const optimized = [];
        let reductions = 0;
        
        // Calcular distancias desde el centro del viewport
        const fleetsWithDistance = fleets.map(fleet => ({
            ...fleet,
            distance: this.calculateDistanceOptimized(
                fleet.x, fleet.y,
                this.viewport.centerX, this.viewport.centerY
            )
        }));
        
        // Ordenar por distancia (más cercanos primero)
        fleetsWithDistance.sort((a, b) => a.distance - b.distance);
        
        // Aplicar LOD basado en distancia y límites
        for (let i = 0; i < fleetsWithDistance.length; i++) {
            const fleet = fleetsWithDistance[i];
            
            if (i < this.config.lod.maxVisibleFleets) {
                // Determinar nivel de LOD
                const lodLevel = this.determineLODLevel(fleet.distance);
                
                if (lodLevel > 0) {
                    // Aplicar simplificación
                    fleet.lodLevel = lodLevel;
                    fleet.simplification = this.config.lod.simplificationLevels[lodLevel];
                    reductions++;
                }
                
                optimized.push(fleet);
            } else {
                // Excede el límite, no renderizar
                reductions++;
            }
        }
        
        return { optimized, reductions };
    }
    
    /**
     * 📏 Determinar nivel de LOD basado en distancia
     */
    determineLODLevel(distance) {
        const thresholds = this.config.lod.distanceThresholds;
        
        for (let i = 0; i < thresholds.length; i++) {
            if (distance <= thresholds[i]) {
                return i;
            }
        }
        
        return thresholds.length; // Máximo nivel de simplificación
    }
    
    /**
     * 📐 Calcular ángulo optimizado con cache
     */
    calculateAngleOptimized(dx, dy) {
        // Crear clave de cache
        const key = `${Math.round(dx * 10)}_${Math.round(dy * 10)}`;
        
        // Verificar cache
        if (this.mathCache.angles.has(key)) {
            this.mathCache.cacheHits++;
            return this.mathCache.angles.get(key);
        }
        
        // Calcular y cachear
        const angle = Math.atan2(dy, dx);
        
        if (this.mathCache.angles.size < this.config.cache.angleCacheSize) {
            this.mathCache.angles.set(key, angle);
        }
        
        this.mathCache.cacheMisses++;
        return angle;
    }
    
    /**
     * 📏 Calcular distancia optimizada con cache
     */
    calculateDistanceOptimized(x1, y1, x2, y2) {
        // Crear clave de cache
        const key = `${Math.round(x1)}_${Math.round(y1)}_${Math.round(x2)}_${Math.round(y2)}`;
        
        // Verificar cache
        if (this.mathCache.distances.has(key)) {
            this.mathCache.cacheHits++;
            return this.mathCache.distances.get(key);
        }
        
        // Calcular y cachear
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.mathCache.distances.size < this.config.cache.distanceCacheSize) {
            this.mathCache.distances.set(key, distance);
        }
        
        this.mathCache.cacheMisses++;
        return distance;
    }
    
    /**
     * 🧮 Obtener seno optimizado
     */
    getSinOptimized(angle) {
        const degrees = Math.round((angle * 180) / Math.PI) % 360;
        const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;
        
        if (this.mathCache.sin.has(normalizedDegrees)) {
            this.mathCache.cacheHits++;
            return this.mathCache.sin.get(normalizedDegrees);
        }
        
        this.mathCache.cacheMisses++;
        return Math.sin(angle);
    }
    
    /**
     * 🧮 Obtener coseno optimizado
     */
    getCosOptimized(angle) {
        const degrees = Math.round((angle * 180) / Math.PI) % 360;
        const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;
        
        if (this.mathCache.cos.has(normalizedDegrees)) {
            this.mathCache.cacheHits++;
            return this.mathCache.cos.get(normalizedDegrees);
        }
        
        this.mathCache.cacheMisses++;
        return Math.cos(angle);
    }
    
    /**
     * 📦 Crear lotes de renderizado
     */
    createRenderBatches(objects, batchSize) {
        const batches = [];
        
        for (let i = 0; i < objects.length; i += batchSize) {
            batches.push(objects.slice(i, i + batchSize));
        }
        
        return batches;
    }
    
    /**
     * 🧹 Limpiar cache si es necesario
     */
    cleanupCacheIfNeeded() {
        const now = Date.now();
        
        if (now - this.mathCache.lastCleanup > this.config.cache.cleanupInterval) {
            this.cleanupCache();
            this.mathCache.lastCleanup = now;
        }
    }
    
    /**
     * 🧹 Limpiar cache matemático
     */
    cleanupCache() {
        // Limpiar cache de ángulos si está muy lleno
        if (this.mathCache.angles.size > this.config.cache.angleCacheSize) {
            this.mathCache.angles.clear();
        }
        
        // Limpiar cache de distancias si está muy lleno
        if (this.mathCache.distances.size > this.config.cache.distanceCacheSize) {
            this.mathCache.distances.clear();
        }
        
        // Actualizar ratio de cache hits
        const totalRequests = this.mathCache.cacheHits + this.mathCache.cacheMisses;
        if (totalRequests > 0) {
            this.optimizationMetrics.cacheHitRatio = this.mathCache.cacheHits / totalRequests;
        }
        
        console.log(`🧹 Cache limpiado - Hit ratio: ${(this.optimizationMetrics.cacheHitRatio * 100).toFixed(1)}%`);
    }
    
    /**
     * 📊 Obtener métricas de optimización
     */
    getOptimizationMetrics() {
        const totalRequests = this.mathCache.cacheHits + this.mathCache.cacheMisses;
        
        return {
            culling: {
                enabled: this.config.culling.enabled,
                culledObjects: this.optimizationMetrics.culledObjects,
                viewportSize: `${this.viewport.width}x${this.viewport.height}`
            },
            lod: {
                enabled: this.config.lod.enabled,
                reductions: this.optimizationMetrics.lodReductions,
                maxVisible: this.config.lod.maxVisibleFleets
            },
            cache: {
                enabled: this.config.cache.enabled,
                hitRatio: totalRequests > 0 ? this.mathCache.cacheHits / totalRequests : 0,
                totalRequests: totalRequests,
                sizes: {
                    angles: this.mathCache.angles.size,
                    distances: this.mathCache.distances.size,
                    sin: this.mathCache.sin.size,
                    cos: this.mathCache.cos.size
                }
            },
            performance: {
                frameTime: this.optimizationMetrics.frameTime,
                batchedDrawCalls: this.optimizationMetrics.batchedDrawCalls
            }
        };
    }
    
    /**
     * 🔧 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Regenerar cache si cambió la configuración
        if (newConfig.cache) {
            this.cleanupCache();
        }
        
        console.log('🔧 Configuración de optimización actualizada');
    }
    
    /**
     * 📈 Obtener estadísticas de rendimiento
     */
    getPerformanceStats() {
        return {
            frameTime: this.optimizationMetrics.frameTime,
            culledObjects: this.optimizationMetrics.culledObjects,
            lodReductions: this.optimizationMetrics.lodReductions,
            cacheHitRatio: this.optimizationMetrics.cacheHitRatio,
            memoryUsage: {
                mathCache: this.mathCache.angles.size + this.mathCache.distances.size,
                totalCacheSize: this.mathCache.sin.size + this.mathCache.cos.size + 
                               this.mathCache.angles.size + this.mathCache.distances.size
            }
        };
    }
    
    /**
     * 🧹 Destruir gestor
     */
    destroy() {
        this.mathCache.sin.clear();
        this.mathCache.cos.clear();
        this.mathCache.angles.clear();
        this.mathCache.distances.clear();
        this.cullingState.visibleObjects.clear();
        this.cullingState.culledObjects.clear();
        this.lodState.levels.clear();
        
        console.log('🧹 CanvasOptimizationManager destruido');
    }
} 