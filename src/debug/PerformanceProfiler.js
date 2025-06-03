/**
 * 📊 PERFORMANCE PROFILER - HITO 2.5 OPTIMIZACIÓN
 * Sistema de medición de rendimiento para identificar bottlenecks
 * y establecer métricas baseline del sistema orgánico
 */

export class PerformanceProfiler {
    constructor() {
        this.isEnabled = true;
        this.measurements = new Map();
        this.frameMetrics = {
            fps: 0,
            frameTime: 0,
            renderTime: 0,
            updateTime: 0,
            lastFrameTime: performance.now()
        };
        
        // Métricas de memoria
        this.memoryMetrics = {
            heapUsed: 0,
            heapTotal: 0,
            heapLimit: 0,
            lastMeasurement: 0
        };
        
        // Métricas del juego
        this.gameMetrics = {
            activeFleets: 0,
            activePlanets: 0,
            totalShips: 0,
            domElements: 0,
            svgOperations: 0
        };
        
        // Historial para análisis de tendencias
        this.history = {
            fps: [],
            renderTime: [],
            updateTime: [],
            memoryUsage: [],
            maxHistorySize: 100
        };
        
        // Alertas de rendimiento
        this.alerts = {
            lowFPS: 45,
            highRenderTime: 20,
            highMemoryGrowth: 50,
            enabled: true
        };
        
        // Contadores de operaciones
        this.operationCounters = {
            mathOperations: 0,
            domUpdates: 0,
            svgCreations: 0,
            svgUpdates: 0,
            fleetUpdates: 0,
            planetUpdates: 0
        };
        
        this.startTime = performance.now();
        this.setupMemoryMonitoring();
        
        console.log('📊 PerformanceProfiler inicializado - Hito 2.5');
    }

    /**
     * Configurar monitoreo de memoria
     */
    setupMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
            this.updateMemoryMetrics();
            }, 1000); // Cada segundo
        }
    }

    /**
     * Actualizar métricas de memoria
     */
    updateMemoryMetrics() {
        if (performance.memory) {
            this.memoryMetrics.heapUsed = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
            this.memoryMetrics.heapTotal = performance.memory.totalJSHeapSize / 1024 / 1024; // MB
            this.memoryMetrics.heapLimit = performance.memory.jsHeapSizeLimit / 1024 / 1024; // MB
            this.memoryMetrics.lastMeasurement = performance.now();
            
            // Añadir al historial
            this.addToHistory('memoryUsage', this.memoryMetrics.heapUsed);
            
            // Verificar alertas de memoria
            this.checkMemoryAlerts();
        }
    }

    /**
     * Medir tiempo de frame completo
     */
    measureFrame() {
        const now = performance.now();
        const frameTime = now - this.frameMetrics.lastFrameTime;
        
        this.frameMetrics.frameTime = frameTime;
        this.frameMetrics.fps = 1000 / frameTime;
        this.frameMetrics.lastFrameTime = now;
        
        // Añadir al historial
        this.addToHistory('fps', this.frameMetrics.fps);
        
        // Verificar alertas de FPS
        this.checkFPSAlerts();
    }

    /**
     * Medir tiempo de renderizado
     */
    measureRenderTime(renderFunction) {
        const startTime = performance.now();
        
        renderFunction();
        
        const endTime = performance.now();
        this.frameMetrics.renderTime = endTime - startTime;
        
        // Añadir al historial
        this.addToHistory('renderTime', this.frameMetrics.renderTime);
        
        // Verificar alertas de renderizado
        this.checkRenderAlerts();
    }

    /**
     * Medir tiempo de actualización de lógica
     */
    measureUpdateTime(updateFunction) {
        const startTime = performance.now();
        
        updateFunction();
        
        const endTime = performance.now();
        this.frameMetrics.updateTime = endTime - startTime;
        
        // Añadir al historial
        this.addToHistory('updateTime', this.frameMetrics.updateTime);
    }

    /**
     * Medir operación específica
     */
    measureOperation(name, operation) {
        if (!this.isEnabled) {
            return operation();
        }
        
        const startTime = performance.now();
        const result = operation();
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        
        if (!this.measurements.has(name)) {
            this.measurements.set(name, {
                count: 0,
                totalTime: 0,
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0,
                lastTime: 0
            });
        }
        
        const measurement = this.measurements.get(name);
        measurement.count++;
        measurement.totalTime += duration;
        measurement.averageTime = measurement.totalTime / measurement.count;
        measurement.minTime = Math.min(measurement.minTime, duration);
        measurement.maxTime = Math.max(measurement.maxTime, duration);
        measurement.lastTime = duration;
        
        return result;
    }

    /**
     * Incrementar contador de operación
     */
    incrementCounter(counterName) {
        if (this.operationCounters.hasOwnProperty(counterName)) {
            this.operationCounters[counterName]++;
        }
    }

    /**
     * Actualizar métricas del juego
     */
    updateGameMetrics(gameEngine) {
        this.gameMetrics.activeFleets = gameEngine.fleets ? gameEngine.fleets.size : 0;
        this.gameMetrics.activePlanets = gameEngine.planets ? gameEngine.planets.size : 0;
        
        // Calcular total de naves
        let totalShips = 0;
        if (gameEngine.fleets) {
            gameEngine.fleets.forEach(fleet => {
                totalShips += fleet.ships || 1;
            });
        }
        this.gameMetrics.totalShips = totalShips;
        
        // Contar elementos DOM
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            this.gameMetrics.domElements = gameCanvas.querySelectorAll('*').length;
        }
    }

    /**
     * Añadir valor al historial
     */
    addToHistory(metric, value) {
        if (!this.history[metric]) {
            this.history[metric] = [];
        }
        
        this.history[metric].push({
            value: value,
            timestamp: performance.now()
        });
        
        // Mantener tamaño máximo del historial
        if (this.history[metric].length > this.history.maxHistorySize) {
            this.history[metric].shift();
        }
    }

    /**
     * Verificar alertas de FPS
     */
    checkFPSAlerts() {
        if (!this.alerts.enabled) return;
        
        if (this.frameMetrics.fps < this.alerts.lowFPS) {
            console.warn(`⚠️ FPS bajo detectado: ${this.frameMetrics.fps.toFixed(1)} FPS`);
        }
    }

    /**
     * Verificar alertas de renderizado
     */
    checkRenderAlerts() {
        if (!this.alerts.enabled) return;
        
        if (this.frameMetrics.renderTime > this.alerts.highRenderTime) {
            console.warn(`⚠️ Tiempo de renderizado alto: ${this.frameMetrics.renderTime.toFixed(2)}ms`);
        }
    }

    /**
     * Verificar alertas de memoria
     */
    checkMemoryAlerts() {
        if (!this.alerts.enabled || this.history.memoryUsage.length < 10) return;
        
        const recent = this.history.memoryUsage.slice(-10);
        const growth = recent[recent.length - 1].value - recent[0].value;
        
        if (growth > this.alerts.highMemoryGrowth) {
            console.warn(`⚠️ Crecimiento de memoria alto: +${growth.toFixed(1)}MB en los últimos 10 segundos`);
        }
    }

    /**
     * Obtener reporte completo de rendimiento
     */
    getPerformanceReport() {
        const uptime = (performance.now() - this.startTime) / 1000;
        
        return {
            uptime: uptime,
            frameMetrics: { ...this.frameMetrics },
            memoryMetrics: { ...this.memoryMetrics },
            gameMetrics: { ...this.gameMetrics },
            operationCounters: { ...this.operationCounters },
            measurements: this.getMeasurementsSummary(),
            averages: this.calculateAverages(),
            bottlenecks: this.identifyBottlenecks()
        };
    }

    /**
     * Obtener resumen de mediciones
     */
    getMeasurementsSummary() {
        const summary = {};
        
        this.measurements.forEach((measurement, name) => {
            summary[name] = {
                count: measurement.count,
                averageTime: parseFloat(measurement.averageTime.toFixed(3)),
                minTime: parseFloat(measurement.minTime.toFixed(3)),
                maxTime: parseFloat(measurement.maxTime.toFixed(3)),
                totalTime: parseFloat(measurement.totalTime.toFixed(3))
            };
        });
        
        return summary;
    }

    /**
     * Calcular promedios del historial
     */
    calculateAverages() {
        const averages = {};
        
        Object.keys(this.history).forEach(metric => {
            if (metric === 'maxHistorySize') return;
            
            const values = this.history[metric];
            if (values.length > 0) {
                const sum = values.reduce((acc, item) => acc + item.value, 0);
                averages[metric] = parseFloat((sum / values.length).toFixed(2));
            }
        });
        
        return averages;
    }

    /**
     * Identificar bottlenecks principales
     */
    identifyBottlenecks() {
        const bottlenecks = [];
        
        // Analizar FPS
        if (this.frameMetrics.fps < 50) {
            bottlenecks.push({
                type: 'FPS',
                severity: 'HIGH',
                description: `FPS bajo: ${this.frameMetrics.fps.toFixed(1)}`,
                recommendation: 'Reducir complejidad visual o optimizar renderizado'
            });
        }
        
        // Analizar tiempo de renderizado
        if (this.frameMetrics.renderTime > 15) {
            bottlenecks.push({
                type: 'RENDER',
                severity: 'MEDIUM',
                description: `Tiempo de renderizado alto: ${this.frameMetrics.renderTime.toFixed(2)}ms`,
                recommendation: 'Optimizar operaciones DOM o implementar LOD'
            });
        }
        
        // Analizar operaciones costosas
        this.measurements.forEach((measurement, name) => {
            if (measurement.averageTime > 5) {
                bottlenecks.push({
                    type: 'OPERATION',
                    severity: 'MEDIUM',
                    description: `Operación lenta: ${name} (${measurement.averageTime.toFixed(2)}ms promedio)`,
                    recommendation: 'Optimizar algoritmo o implementar cache'
                });
        }
        });
        
        // Analizar memoria
        if (this.memoryMetrics.heapUsed > 100) {
            bottlenecks.push({
                type: 'MEMORY',
                severity: 'LOW',
                description: `Uso de memoria alto: ${this.memoryMetrics.heapUsed.toFixed(1)}MB`,
                recommendation: 'Implementar object pooling o limpiar referencias'
            });
        }
        
        return bottlenecks;
        }
        
    /**
     * Generar reporte de optimización
     */
    generateOptimizationReport() {
        const report = this.getPerformanceReport();
        
        console.group('📊 REPORTE DE OPTIMIZACIÓN - HITO 2.5');
        console.log('⏱️ Tiempo de ejecución:', `${report.uptime.toFixed(1)}s`);
        console.log('🖼️ FPS promedio:', report.averages.fps?.toFixed(1) || 'N/A');
        console.log('🎨 Tiempo de renderizado promedio:', `${report.averages.renderTime?.toFixed(2) || 'N/A'}ms`);
        console.log('💾 Uso de memoria:', `${report.memoryMetrics.heapUsed.toFixed(1)}MB`);
        console.log('🚀 Flotas activas:', report.gameMetrics.activeFleets);
        console.log('🌍 Planetas activos:', report.gameMetrics.activePlanets);
        console.log('⚡ Total de naves:', report.gameMetrics.totalShips);
        console.log('🏗️ Elementos DOM:', report.gameMetrics.domElements);
        
        if (report.bottlenecks.length > 0) {
            console.group('⚠️ BOTTLENECKS IDENTIFICADOS:');
            report.bottlenecks.forEach(bottleneck => {
                console.warn(`${bottleneck.type}: ${bottleneck.description}`);
                console.log(`💡 Recomendación: ${bottleneck.recommendation}`);
            });
            console.groupEnd();
        } else {
            console.log('✅ No se detectaron bottlenecks significativos');
        }
        
        console.groupEnd();
        
        return report;
    }

    /**
     * Resetear métricas
     */
    reset() {
        this.measurements.clear();
        this.history.fps = [];
        this.history.renderTime = [];
        this.history.updateTime = [];
        this.history.memoryUsage = [];
        
        Object.keys(this.operationCounters).forEach(key => {
            this.operationCounters[key] = 0;
        });
        
        this.startTime = performance.now();
        
        console.log('📊 Métricas de rendimiento reseteadas');
    }

    /**
     * Habilitar/deshabilitar profiling
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`📊 Profiling ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }

    /**
     * Iniciar el profiler
     */
    start() {
        this.isEnabled = true;
        this.startTime = performance.now();
        console.log('📊 PerformanceProfiler iniciado');
    }

    /**
     * Detener el profiler
     */
    stop() {
        this.isEnabled = false;
        console.log('📊 PerformanceProfiler detenido');
    }

    /**
     * Iniciar medición de frame
     */
    startFrame() {
        this.frameStartTime = performance.now();
    }

    /**
     * Finalizar medición de frame
     */
    endFrame() {
        if (this.frameStartTime) {
            const now = performance.now();
            const frameTime = now - this.frameStartTime;
            
            this.frameMetrics.frameTime = frameTime;
            this.frameMetrics.fps = 1000 / frameTime;
            this.frameMetrics.lastFrameTime = now;
            
            // Añadir al historial
            this.addToHistory('fps', this.frameMetrics.fps);
            
            // Verificar alertas de FPS
            this.checkFPSAlerts();
        }
    }

    /**
     * Actualizar conteos de objetos del juego
     */
    updateGameObjectCounts(planetCount, fleetCount) {
        this.gameMetrics.activePlanets = planetCount;
        this.gameMetrics.activeFleets = fleetCount;
    }

    /**
     * Destruir el profiler y limpiar recursos
     */
    destroy() {
        this.stop();
        this.reset();
        console.log('💥 PerformanceProfiler destruido');
    }
}

export default PerformanceProfiler; 