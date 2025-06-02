/**
 * 📊 GALCON GAME - PERFORMANCE PROFILER
 * Sistema de profiling para medir y analizar rendimiento
 * MILESTONE 2.2: Optimizaciones de Rendimiento
 */

export class PerformanceProfiler {
    constructor() {
        // Métricas de rendimiento
        this.metrics = {
            fps: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                samples: [],
                maxSamples: 60 // 1 segundo a 60fps
            },
            frameTime: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                samples: []
            },
            renderTime: {
                current: 0,
                average: 0,
                total: 0,
                calls: 0
            },
            updateTime: {
                current: 0,
                average: 0,
                total: 0,
                calls: 0
            },
            memory: {
                used: 0,
                total: 0,
                jsHeapSizeUsed: 0,
                jsHeapSizeTotal: 0
            },
            objects: {
                planets: 0,
                fleets: 0,
                svgElements: 0,
                eventListeners: 0
            }
        };
        
        // Timers para medición
        this.timers = new Map();
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.startTime = performance.now();
        
        // Estado del profiler
        this.isEnabled = false;
        this.isRecording = false;
        this.recordingData = [];
        
        // Referencias para cleanup
        this.intervalId = null;
        
        console.log('📊 PerformanceProfiler inicializado');
    }

    /**
     * Iniciar profiling
     */
    start() {
        this.isEnabled = true;
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;
        
        // Actualizar métricas cada 100ms
        this.intervalId = setInterval(() => {
            this.updateMemoryMetrics();
            this.updateObjectCounts();
        }, 100);
        
        console.log('📊 Profiling iniciado');
    }

    /**
     * Detener profiling
     */
    stop() {
        this.isEnabled = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('📊 Profiling detenido');
    }

    /**
     * Medir tiempo de frame (llamar al inicio de cada frame)
     */
    startFrame() {
        if (!this.isEnabled) return;
        
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        
        // Actualizar métricas de frame
        this.updateFrameMetrics(frameTime);
        
        this.lastFrameTime = now;
        this.frameCount++;
        
        // Iniciar timer para frame completo
        this.startTimer('frame');
    }

    /**
     * Finalizar medición de frame
     */
    endFrame() {
        if (!this.isEnabled) return;
        
        this.endTimer('frame');
    }

    /**
     * Iniciar timer personalizado
     */
    startTimer(name) {
        if (!this.isEnabled) return;
        
        this.timers.set(name, {
            start: performance.now(),
            end: null
        });
    }

    /**
     * Finalizar timer y registrar tiempo
     */
    endTimer(name) {
        if (!this.isEnabled) return;
        
        const timer = this.timers.get(name);
        if (!timer) {
            console.warn(`⚠️ Timer '${name}' no encontrado`);
            return 0;
        }
        
        timer.end = performance.now();
        const duration = timer.end - timer.start;
        
        // Actualizar métricas específicas
        this.updateTimerMetrics(name, duration);
        
        this.timers.delete(name);
        return duration;
    }

    /**
     * Medir tiempo de renderizado
     */
    measureRenderTime(renderFunction) {
        if (!this.isEnabled) {
            return renderFunction();
        }
        
        this.startTimer('render');
        const result = renderFunction();
        const duration = this.endTimer('render');
        
        // Actualizar métricas de render
        this.metrics.renderTime.current = duration;
        this.metrics.renderTime.total += duration;
        this.metrics.renderTime.calls++;
        this.metrics.renderTime.average = this.metrics.renderTime.total / this.metrics.renderTime.calls;
        
        return result;
    }

    /**
     * Medir tiempo de actualización
     */
    measureUpdateTime(updateFunction) {
        if (!this.isEnabled) {
            return updateFunction();
        }
        
        this.startTimer('update');
        const result = updateFunction();
        const duration = this.endTimer('update');
        
        // Actualizar métricas de update
        this.metrics.updateTime.current = duration;
        this.metrics.updateTime.total += duration;
        this.metrics.updateTime.calls++;
        this.metrics.updateTime.average = this.metrics.updateTime.total / this.metrics.updateTime.calls;
        
        return result;
    }

    /**
     * Actualizar métricas de frame
     */
    updateFrameMetrics(frameTime) {
        const fps = 1000 / frameTime;
        
        // FPS
        this.metrics.fps.current = fps;
        this.metrics.fps.samples.push(fps);
        
        if (this.metrics.fps.samples.length > this.metrics.fps.maxSamples) {
            this.metrics.fps.samples.shift();
        }
        
        this.metrics.fps.average = this.metrics.fps.samples.reduce((a, b) => a + b, 0) / this.metrics.fps.samples.length;
        this.metrics.fps.min = Math.min(this.metrics.fps.min, fps);
        this.metrics.fps.max = Math.max(this.metrics.fps.max, fps);
        
        // Frame Time
        this.metrics.frameTime.current = frameTime;
        this.metrics.frameTime.samples.push(frameTime);
        
        if (this.metrics.frameTime.samples.length > this.metrics.fps.maxSamples) {
            this.metrics.frameTime.samples.shift();
        }
        
        this.metrics.frameTime.average = this.metrics.frameTime.samples.reduce((a, b) => a + b, 0) / this.metrics.frameTime.samples.length;
        this.metrics.frameTime.min = Math.min(this.metrics.frameTime.min, frameTime);
        this.metrics.frameTime.max = Math.max(this.metrics.frameTime.max, frameTime);
    }

    /**
     * Actualizar métricas de timers específicos
     */
    updateTimerMetrics(name, duration) {
        // Registrar en recording si está activo
        if (this.isRecording) {
            this.recordingData.push({
                timestamp: performance.now(),
                timer: name,
                duration: duration,
                fps: this.metrics.fps.current
            });
        }
    }

    /**
     * Actualizar métricas de memoria
     */
    updateMemoryMetrics() {
        if (performance.memory) {
            this.metrics.memory.jsHeapSizeUsed = performance.memory.usedJSHeapSize;
            this.metrics.memory.jsHeapSizeTotal = performance.memory.totalJSHeapSize;
            this.metrics.memory.used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100; // MB
            this.metrics.memory.total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100; // MB
        }
    }

    /**
     * Actualizar conteo de objetos
     */
    updateObjectCounts() {
        // Contar elementos SVG
        const svg = document.getElementById('gameCanvas');
        if (svg) {
            this.metrics.objects.svgElements = svg.querySelectorAll('*').length;
        }
        
        // Estos se actualizarán desde GameEngine
        // this.metrics.objects.planets = gameEngine.planets.size;
        // this.metrics.objects.fleets = gameEngine.fleets.size;
    }

    /**
     * Actualizar conteos desde GameEngine
     */
    updateGameObjectCounts(planets, fleets) {
        this.metrics.objects.planets = planets;
        this.metrics.objects.fleets = fleets;
    }

    /**
     * Iniciar grabación detallada
     */
    startRecording() {
        this.isRecording = true;
        this.recordingData = [];
        console.log('📊 Grabación de profiling iniciada');
    }

    /**
     * Detener grabación
     */
    stopRecording() {
        this.isRecording = false;
        console.log(`📊 Grabación detenida. ${this.recordingData.length} muestras registradas`);
        return this.recordingData;
    }

    /**
     * Generar reporte de rendimiento
     */
    generateReport() {
        const uptime = (performance.now() - this.startTime) / 1000;
        
        const report = {
            timestamp: new Date().toISOString(),
            uptime: Math.round(uptime * 100) / 100,
            frameCount: this.frameCount,
            
            performance: {
                fps: {
                    current: Math.round(this.metrics.fps.current * 100) / 100,
                    average: Math.round(this.metrics.fps.average * 100) / 100,
                    min: Math.round(this.metrics.fps.min * 100) / 100,
                    max: Math.round(this.metrics.fps.max * 100) / 100
                },
                frameTime: {
                    current: Math.round(this.metrics.frameTime.current * 100) / 100,
                    average: Math.round(this.metrics.frameTime.average * 100) / 100,
                    min: Math.round(this.metrics.frameTime.min * 100) / 100,
                    max: Math.round(this.metrics.frameTime.max * 100) / 100
                },
                renderTime: {
                    current: Math.round(this.metrics.renderTime.current * 100) / 100,
                    average: Math.round(this.metrics.renderTime.average * 100) / 100,
                    totalCalls: this.metrics.renderTime.calls
                },
                updateTime: {
                    current: Math.round(this.metrics.updateTime.current * 100) / 100,
                    average: Math.round(this.metrics.updateTime.average * 100) / 100,
                    totalCalls: this.metrics.updateTime.calls
                }
            },
            
            memory: {
                used: this.metrics.memory.used,
                total: this.metrics.memory.total,
                usagePercent: Math.round((this.metrics.memory.used / this.metrics.memory.total) * 100)
            },
            
            objects: {
                planets: this.metrics.objects.planets,
                fleets: this.metrics.objects.fleets,
                svgElements: this.metrics.objects.svgElements,
                total: this.metrics.objects.planets + this.metrics.objects.fleets
            },
            
            analysis: this.analyzePerformance()
        };
        
        return report;
    }

    /**
     * Analizar rendimiento y generar recomendaciones
     */
    analyzePerformance() {
        const analysis = {
            status: 'good',
            issues: [],
            recommendations: []
        };
        
        // Analizar FPS
        if (this.metrics.fps.average < 30) {
            analysis.status = 'critical';
            analysis.issues.push('FPS muy bajo (< 30)');
            analysis.recommendations.push('Implementar object pooling urgente');
            analysis.recommendations.push('Activar culling de objetos fuera de pantalla');
        } else if (this.metrics.fps.average < 50) {
            analysis.status = 'warning';
            analysis.issues.push('FPS subóptimo (< 50)');
            analysis.recommendations.push('Optimizar renderer SVG');
        }
        
        // Analizar tiempo de frame
        if (this.metrics.frameTime.average > 16.67) {
            analysis.issues.push('Tiempo de frame alto (> 16.67ms)');
            analysis.recommendations.push('Optimizar loop principal del juego');
        }
        
        // Analizar memoria
        if (this.metrics.memory.used > 100) {
            analysis.issues.push('Uso de memoria alto (> 100MB)');
            analysis.recommendations.push('Implementar garbage collection automático');
        }
        
        // Analizar objetos SVG
        if (this.metrics.objects.svgElements > 200) {
            analysis.issues.push('Muchos elementos SVG (> 200)');
            analysis.recommendations.push('Implementar object pooling para SVG');
        }
        
        return analysis;
    }

    /**
     * Obtener métricas actuales
     */
    getMetrics() {
        return this.metrics;
    }

    /**
     * Reset de métricas
     */
    reset() {
        this.metrics.fps.samples = [];
        this.metrics.frameTime.samples = [];
        this.metrics.fps.min = Infinity;
        this.metrics.frameTime.min = Infinity;
        this.metrics.fps.max = 0;
        this.metrics.frameTime.max = 0;
        this.metrics.renderTime.total = 0;
        this.metrics.renderTime.calls = 0;
        this.metrics.updateTime.total = 0;
        this.metrics.updateTime.calls = 0;
        this.frameCount = 0;
        this.startTime = performance.now();
        
        console.log('📊 Métricas de profiling reseteadas');
    }

    /**
     * Destruir profiler
     */
    destroy() {
        this.stop();
        this.timers.clear();
        console.log('💥 PerformanceProfiler destruido');
    }
}

export default PerformanceProfiler; 