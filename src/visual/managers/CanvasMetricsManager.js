/**
 * 📊 CANVAS METRICS MANAGER
 * Gestor especializado para métricas de rendimiento y debug del renderizado
 * 
 * RESPONSABILIDADES:
 * - Tracking de métricas de rendimiento
 * - Información de debug y diagnóstico
 * - Estadísticas de renderizado
 * - Monitoreo de FPS y tiempos
 * 
 * PATRÓN: Observer Pattern
 * PRINCIPIOS: Single Responsibility, Observer
 */

export class CanvasMetricsManager {
    constructor(config = {}) {
        this.config = {
            // Metrics settings
            metrics: {
                enabled: true,
                trackFPS: true,
                trackDrawCalls: true,
                trackMemory: true,
                historySize: 100,
                updateInterval: 1000, // ms
                ...config.metrics
            },
            
            // Debug settings
            debug: {
                enabled: false,
                showFPS: true,
                showDrawCalls: true,
                showMemory: true,
                showOptimizations: true,
                position: { x: 10, y: 10 },
                ...config.debug
            },
            
            // Performance thresholds
            thresholds: {
                targetFPS: 60,
                warningFPS: 45,
                criticalFPS: 30,
                maxDrawCalls: 1000,
                maxMemoryMB: 100,
                ...config.thresholds
            }
        };
        
        // Métricas de rendimiento
        this.performanceMetrics = {
            fps: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                history: [],
                lastUpdate: Date.now()
            },
            frameTime: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                history: []
            },
            renderTime: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                history: []
            },
            drawCalls: {
                current: 0,
                total: 0,
                average: 0,
                history: []
            },
            memory: {
                used: 0,
                peak: 0,
                history: []
            }
        };
        
        // Estado de tracking
        this.trackingState = {
            frameCount: 0,
            lastFrameTime: performance.now(),
            renderStartTime: 0,
            isTracking: false,
            observers: new Set()
        };
        
        // Estadísticas de renderizado
        this.renderStats = {
            planetsRendered: 0,
            fleetsRendered: 0,
            effectsRendered: 0,
            overlaysRendered: 0,
            culledObjects: 0,
            lodReductions: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.initializeMetrics();
        
        console.log('📊 CanvasMetricsManager inicializado');
    }
    
    /**
     * 🔧 Inicializar métricas
     */
    initializeMetrics() {
        if (this.config.metrics.enabled) {
            this.startTracking();
        }
        
        console.log('🔧 Métricas inicializadas');
    }
    
    /**
     * ▶️ Iniciar tracking de métricas
     */
    startTracking() {
        this.trackingState.isTracking = true;
        this.trackingState.lastFrameTime = performance.now();
        
        // Configurar intervalo de actualización
        this.metricsInterval = setInterval(() => {
            this.updateAverages();
            this.notifyObservers();
        }, this.config.metrics.updateInterval);
        
        console.log('▶️ Tracking de métricas iniciado');
    }
    
    /**
     * ⏹️ Detener tracking de métricas
     */
    stopTracking() {
        this.trackingState.isTracking = false;
        
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
        
        console.log('⏹️ Tracking de métricas detenido');
    }
    
    /**
     * 🎬 Marcar inicio de frame
     */
    startFrame() {
        if (!this.config.metrics.enabled) return;
        
        const now = performance.now();
        
        // Calcular FPS
        if (this.trackingState.frameCount > 0) {
            const deltaTime = now - this.trackingState.lastFrameTime;
            this.performanceMetrics.fps.current = 1000 / deltaTime;
            this.performanceMetrics.frameTime.current = deltaTime;
        }
        
        this.trackingState.lastFrameTime = now;
        this.trackingState.frameCount++;
        
        // Resetear contadores de frame
        this.renderStats.planetsRendered = 0;
        this.renderStats.fleetsRendered = 0;
        this.renderStats.effectsRendered = 0;
        this.renderStats.overlaysRendered = 0;
        this.performanceMetrics.drawCalls.current = 0;
    }
    
    /**
     * 🎬 Marcar inicio de renderizado
     */
    startRender() {
        if (!this.config.metrics.enabled) return;
        
        this.trackingState.renderStartTime = performance.now();
    }
    
    /**
     * 🏁 Marcar fin de renderizado
     */
    endRender() {
        if (!this.config.metrics.enabled) return;
        
        const renderTime = performance.now() - this.trackingState.renderStartTime;
        this.performanceMetrics.renderTime.current = renderTime;
        
        // Actualizar historial
        this.updateHistory('renderTime', renderTime);
    }
    
    /**
     * 🏁 Marcar fin de frame
     */
    endFrame() {
        if (!this.config.metrics.enabled) return;
        
        // Actualizar historial de métricas
        this.updateHistory('fps', this.performanceMetrics.fps.current);
        this.updateHistory('frameTime', this.performanceMetrics.frameTime.current);
        this.updateHistory('drawCalls', this.performanceMetrics.drawCalls.current);
        
        // Actualizar totales
        this.performanceMetrics.drawCalls.total += this.performanceMetrics.drawCalls.current;
        
        // Actualizar memoria si está disponible
        if (performance.memory) {
            const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            this.performanceMetrics.memory.used = memoryMB;
            this.performanceMetrics.memory.peak = Math.max(this.performanceMetrics.memory.peak, memoryMB);
            this.updateHistory('memory', memoryMB);
        }
    }
    
    /**
     * 📈 Actualizar historial de métricas
     */
    updateHistory(metric, value) {
        const metricData = this.performanceMetrics[metric];
        if (!metricData) return;
        
        // Añadir al historial
        metricData.history.push(value);
        
        // Limitar tamaño del historial
        if (metricData.history.length > this.config.metrics.historySize) {
            metricData.history.shift();
        }
        
        // Actualizar min/max
        metricData.min = Math.min(metricData.min, value);
        metricData.max = Math.max(metricData.max, value);
    }
    
    /**
     * 📊 Actualizar promedios
     */
    updateAverages() {
        for (const [metricName, metricData] of Object.entries(this.performanceMetrics)) {
            if (metricData.history && metricData.history.length > 0) {
                const sum = metricData.history.reduce((a, b) => a + b, 0);
                metricData.average = sum / metricData.history.length;
            }
        }
    }
    
    /**
     * 📊 Incrementar contador de draw calls
     */
    incrementDrawCalls(count = 1) {
        this.performanceMetrics.drawCalls.current += count;
    }
    
    /**
     * 📊 Actualizar estadísticas de renderizado
     */
    updateRenderStats(stats) {
        if (stats.planetsRendered !== undefined) {
            this.renderStats.planetsRendered = stats.planetsRendered;
        }
        if (stats.fleetsRendered !== undefined) {
            this.renderStats.fleetsRendered = stats.fleetsRendered;
        }
        if (stats.effectsRendered !== undefined) {
            this.renderStats.effectsRendered = stats.effectsRendered;
        }
        if (stats.overlaysRendered !== undefined) {
            this.renderStats.overlaysRendered = stats.overlaysRendered;
        }
        if (stats.culledObjects !== undefined) {
            this.renderStats.culledObjects = stats.culledObjects;
        }
        if (stats.lodReductions !== undefined) {
            this.renderStats.lodReductions = stats.lodReductions;
        }
        if (stats.cacheHits !== undefined) {
            this.renderStats.cacheHits = stats.cacheHits;
        }
        if (stats.cacheMisses !== undefined) {
            this.renderStats.cacheMisses = stats.cacheMisses;
        }
    }
    
    /**
     * 📊 Obtener métricas completas
     */
    getMetrics() {
        return {
            performance: {
                fps: {
                    current: this.performanceMetrics.fps.current,
                    average: this.performanceMetrics.fps.average,
                    min: this.performanceMetrics.fps.min,
                    max: this.performanceMetrics.fps.max
                },
                frameTime: {
                    current: this.performanceMetrics.frameTime.current,
                    average: this.performanceMetrics.frameTime.average
                },
                renderTime: {
                    current: this.performanceMetrics.renderTime.current,
                    average: this.performanceMetrics.renderTime.average
                },
                drawCalls: {
                    current: this.performanceMetrics.drawCalls.current,
                    total: this.performanceMetrics.drawCalls.total,
                    average: this.performanceMetrics.drawCalls.average
                },
                memory: {
                    used: this.performanceMetrics.memory.used,
                    peak: this.performanceMetrics.memory.peak
                }
            },
            rendering: { ...this.renderStats },
            tracking: {
                frameCount: this.trackingState.frameCount,
                isTracking: this.trackingState.isTracking
            }
        };
    }
    
    /**
     * 🐛 Obtener información de debug
     */
    getDebugInfo() {
        const metrics = this.getMetrics();
        
        return {
            fps: `${metrics.performance.fps.current.toFixed(1)} FPS (avg: ${metrics.performance.fps.average.toFixed(1)})`,
            frameTime: `${metrics.performance.frameTime.current.toFixed(2)}ms`,
            renderTime: `${metrics.performance.renderTime.current.toFixed(2)}ms`,
            drawCalls: `${metrics.performance.drawCalls.current} calls`,
            memory: `${metrics.performance.memory.used.toFixed(1)}MB`,
            objects: `P:${metrics.rendering.planetsRendered} F:${metrics.rendering.fleetsRendered} E:${metrics.rendering.effectsRendered}`,
            optimizations: `Culled:${metrics.rendering.culledObjects} LOD:${metrics.rendering.lodReductions}`,
            cache: `Hits:${metrics.rendering.cacheHits} Misses:${metrics.rendering.cacheMisses}`
        };
    }
    
    /**
     * 📊 Obtener resumen de rendimiento
     */
    getPerformanceSummary() {
        const metrics = this.getMetrics();
        
        return {
            status: this.getPerformanceStatus(),
            fps: metrics.performance.fps.average,
            frameTime: metrics.performance.frameTime.average,
            renderTime: metrics.performance.renderTime.average,
            efficiency: this.calculateEfficiency()
        };
    }
    
    /**
     * 🎯 Obtener estado de rendimiento
     */
    getPerformanceStatus() {
        const avgFPS = this.performanceMetrics.fps.average;
        
        if (avgFPS >= this.config.thresholds.targetFPS) {
            return 'excellent';
        } else if (avgFPS >= this.config.thresholds.warningFPS) {
            return 'good';
        } else if (avgFPS >= this.config.thresholds.criticalFPS) {
            return 'warning';
        } else {
            return 'critical';
        }
    }
    
    /**
     * ⚡ Calcular eficiencia de renderizado
     */
    calculateEfficiency() {
        const renderTime = this.performanceMetrics.renderTime.average;
        const frameTime = this.performanceMetrics.frameTime.average;
        
        if (frameTime === 0) return 0;
        
        return Math.max(0, Math.min(100, (1 - renderTime / frameTime) * 100));
    }
    
    /**
     * 👀 Añadir observador
     */
    addObserver(observer) {
        this.trackingState.observers.add(observer);
    }
    
    /**
     * 👀 Remover observador
     */
    removeObserver(observer) {
        this.trackingState.observers.delete(observer);
    }
    
    /**
     * 📢 Notificar observadores
     */
    notifyObservers(event = 'update', data = null) {
        for (const observer of this.trackingState.observers) {
            if (typeof observer === 'function') {
                observer(event, data || this.getMetrics());
            } else if (observer.onMetricsUpdate) {
                observer.onMetricsUpdate(event, data || this.getMetrics());
            }
        }
    }
    
    /**
     * 🔄 Resetear métricas
     */
    resetMetrics() {
        // Resetear métricas de rendimiento
        for (const metricData of Object.values(this.performanceMetrics)) {
            if (metricData.history) {
                metricData.history = [];
                metricData.min = Infinity;
                metricData.max = 0;
                metricData.average = 0;
                metricData.current = 0;
            }
        }
        
        // Resetear estadísticas de renderizado
        Object.keys(this.renderStats).forEach(key => {
            this.renderStats[key] = 0;
        });
        
        // Resetear estado de tracking
        this.trackingState.frameCount = 0;
        this.performanceMetrics.drawCalls.total = 0;
        
        console.log('🔄 Métricas reseteadas');
    }
    
    /**
     * 🧹 Destruir gestor
     */
    destroy() {
        this.stopTracking();
        this.trackingState.observers.clear();
        this.resetMetrics();
        
        console.log('🧹 CanvasMetricsManager destruido');
    }
} 