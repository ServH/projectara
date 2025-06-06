/**
 * 🛡️ PERFORMANCE BASELINE TEST
 * Test crítico de baseline de performance antes de refactorización
 * Establece métricas de referencia y detecta cuellos de botella
 */

export class PerformanceBaselineTest {
    constructor() {
        this.testName = 'PerformanceBaselineTest';
        this.results = {
            passed: false,
            errors: [],
            warnings: [],
            metrics: {},
            details: {},
            baseline: {}
        };
        this.gameEngine = null;
        this.performanceData = {
            frameTimings: [],
            updateTimings: [],
            renderTimings: [],
            memoryUsage: [],
            entityCounts: []
        };
    }

    /**
     * 🧪 Ejecutar test completo de performance baseline
     */
    async run(gameEngine) {
        console.log('🛡️ Iniciando PerformanceBaselineTest...');
        this.gameEngine = gameEngine;
        
        try {
            // 1. Establecer baseline inicial
            await this.establishInitialBaseline();
            
            // 2. Test de performance normal
            await this.testNormalPerformance();
            
            // 3. Test de performance bajo stress
            await this.testStressPerformance();
            
            // 4. Test de memory usage
            await this.testMemoryUsage();
            
            // 5. Test de cuellos de botella
            await this.identifyBottlenecks();
            
            // 6. Generar recomendaciones
            await this.generateRecommendations();
            
            // 7. Guardar baseline para futuras comparaciones
            await this.saveBaseline();
            
            this.results.passed = true;
            console.log('✅ PerformanceBaselineTest PASADO');
            
        } catch (error) {
            this.results.passed = false;
            this.results.errors.push(`Test fallido: ${error.message}`);
            console.error('❌ PerformanceBaselineTest FALLIDO:', error);
        }
        
        return this.results;
    }

    /**
     * 📊 Establecer baseline inicial
     */
    async establishInitialBaseline() {
        console.log('📊 Estableciendo baseline inicial...');
        
        // Obtener información del sistema
        const systemInfo = this.getSystemInfo();
        
        // Medir performance inicial (sin carga)
        const initialMetrics = await this.measureInitialMetrics();
        
        this.results.baseline.systemInfo = systemInfo;
        this.results.baseline.initialMetrics = initialMetrics;
        
        console.log(`✅ Baseline inicial establecido: ${initialMetrics.avgFrameTime.toFixed(2)}ms frame time`);
    }

    /**
     * ⚡ Test de performance normal
     */
    async testNormalPerformance() {
        console.log('⚡ Probando performance normal...');
        
        const testDuration = 5000; // 5 segundos para tests más rápidos
        const startTime = Date.now();
        const metrics = {
            frameTimings: [],
            updateTimings: [],
            renderTimings: [],
            entityCounts: []
        };
        
        while (Date.now() - startTime < testDuration) {
            const frameStart = performance.now();
            
            // Medir tiempo de update
            const updateStart = performance.now();
            if (this.gameEngine.update) {
                this.gameEngine.update(16.67); // Simular 60 FPS
            }
            const updateTime = performance.now() - updateStart;
            
            // Medir tiempo de render
            const renderStart = performance.now();
            if (this.gameEngine.renderer && this.gameEngine.renderer.render) {
                this.gameEngine.renderer.render();
            }
            const renderTime = performance.now() - renderStart;
            
            const frameTime = performance.now() - frameStart;
            
            // Recopilar métricas
            metrics.frameTimings.push(frameTime);
            metrics.updateTimings.push(updateTime);
            metrics.renderTimings.push(renderTime);
            
            // Contar entidades
            const entityCount = this.countEntities();
            metrics.entityCounts.push(entityCount);
            
            // Esperar al siguiente frame
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        
        // Calcular estadísticas
        const normalStats = this.calculateStats(metrics);
        this.results.metrics.normalPerformance = normalStats;
        
        console.log(`✅ Performance normal medida: ${normalStats.avgFrameTime.toFixed(2)}ms promedio`);
    }

    /**
     * 🔥 Test de performance bajo stress
     */
    async testStressPerformance() {
        console.log('🔥 Probando performance bajo stress...');
        
        // Crear carga de stress
        this.createStressLoad();
        
        const testDuration = 3000; // 3 segundos para stress test
        const startTime = Date.now();
        const stressMetrics = {
            frameTimings: [],
            updateTimings: [],
            renderTimings: [],
            entityCounts: []
        };
        
        while (Date.now() - startTime < testDuration) {
            const frameStart = performance.now();
            
            // Medir bajo stress
            const updateStart = performance.now();
            if (this.gameEngine.update) {
                this.gameEngine.update(16.67);
            }
            const updateTime = performance.now() - updateStart;
            
            const renderStart = performance.now();
            if (this.gameEngine.renderer && this.gameEngine.renderer.render) {
                this.gameEngine.renderer.render();
            }
            const renderTime = performance.now() - renderStart;
            
            const frameTime = performance.now() - frameStart;
            
            stressMetrics.frameTimings.push(frameTime);
            stressMetrics.updateTimings.push(updateTime);
            stressMetrics.renderTimings.push(renderTime);
            stressMetrics.entityCounts.push(this.countEntities());
            
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        
        // Limpiar carga de stress
        this.cleanupStressLoad();
        
        const stressStats = this.calculateStats(stressMetrics);
        this.results.metrics.stressPerformance = stressStats;
        
        console.log(`✅ Performance bajo stress medida: ${stressStats.avgFrameTime.toFixed(2)}ms promedio`);
    }

    /**
     * 🧠 Test de uso de memoria
     */
    async testMemoryUsage() {
        console.log('🧠 Probando uso de memoria...');
        
        if (!performance.memory) {
            this.results.warnings.push('API de memoria no disponible');
            return;
        }
        
        const memoryMetrics = {
            initial: performance.memory.usedJSHeapSize,
            samples: [],
            peak: 0,
            growth: []
        };
        
        // Medir memoria durante 10 segundos
        const testDuration = 10000;
        const sampleInterval = 1000; // Cada segundo
        const startTime = Date.now();
        
        while (Date.now() - startTime < testDuration) {
            const currentMemory = performance.memory.usedJSHeapSize;
            memoryMetrics.samples.push({
                timestamp: Date.now() - startTime,
                memory: currentMemory
            });
            
            if (currentMemory > memoryMetrics.peak) {
                memoryMetrics.peak = currentMemory;
            }
            
            // Calcular crecimiento
            if (memoryMetrics.samples.length > 1) {
                const previous = memoryMetrics.samples[memoryMetrics.samples.length - 2];
                const growth = currentMemory - previous.memory;
                memoryMetrics.growth.push(growth);
            }
            
            await new Promise(resolve => setTimeout(resolve, sampleInterval));
        }
        
        // Calcular estadísticas de memoria
        const memoryStats = {
            initialMB: memoryMetrics.initial / (1024 * 1024),
            peakMB: memoryMetrics.peak / (1024 * 1024),
            finalMB: memoryMetrics.samples[memoryMetrics.samples.length - 1].memory / (1024 * 1024),
            avgGrowthPerSecond: memoryMetrics.growth.reduce((a, b) => a + b, 0) / memoryMetrics.growth.length,
            totalGrowthMB: (memoryMetrics.peak - memoryMetrics.initial) / (1024 * 1024)
        };
        
        this.results.metrics.memoryUsage = memoryStats;
        
        console.log(`✅ Memoria medida: ${memoryStats.initialMB.toFixed(1)}MB inicial, ${memoryStats.peakMB.toFixed(1)}MB pico`);
    }

    /**
     * 🔍 Identificar cuellos de botella
     */
    async identifyBottlenecks() {
        console.log('🔍 Identificando cuellos de botella...');
        
        const bottlenecks = [];
        const normal = this.results.metrics.normalPerformance;
        const stress = this.results.metrics.stressPerformance;
        
        // Analizar frame time
        if (normal.avgFrameTime > 16.67) {
            bottlenecks.push({
                type: 'frame_time',
                severity: normal.avgFrameTime > 33.33 ? 'high' : 'medium',
                description: `Frame time promedio alto: ${normal.avgFrameTime.toFixed(2)}ms (objetivo: 16.67ms)`,
                impact: 'FPS reducido'
            });
        }
        
        // Analizar update time
        if (normal.avgUpdateTime > 8) {
            bottlenecks.push({
                type: 'update_time',
                severity: normal.avgUpdateTime > 16 ? 'high' : 'medium',
                description: `Update time alto: ${normal.avgUpdateTime.toFixed(2)}ms`,
                impact: 'Lógica del juego lenta'
            });
        }
        
        // Analizar render time
        if (normal.avgRenderTime > 8) {
            bottlenecks.push({
                type: 'render_time',
                severity: normal.avgRenderTime > 16 ? 'high' : 'medium',
                description: `Render time alto: ${normal.avgRenderTime.toFixed(2)}ms`,
                impact: 'Renderizado lento'
            });
        }
        
        // Analizar degradación bajo stress
        if (stress && stress.avgFrameTime > normal.avgFrameTime * 2) {
            bottlenecks.push({
                type: 'stress_degradation',
                severity: 'high',
                description: `Performance se degrada significativamente bajo stress: ${stress.avgFrameTime.toFixed(2)}ms vs ${normal.avgFrameTime.toFixed(2)}ms`,
                impact: 'Escalabilidad limitada'
            });
        }
        
        // Analizar memoria
        const memory = this.results.metrics.memoryUsage;
        if (memory && memory.avgGrowthPerSecond > 1024 * 1024) { // 1MB/segundo
            bottlenecks.push({
                type: 'memory_leak',
                severity: 'high',
                description: `Posible memory leak: ${(memory.avgGrowthPerSecond / (1024 * 1024)).toFixed(2)}MB/s de crecimiento`,
                impact: 'Uso excesivo de memoria'
            });
        }
        
        this.results.details.bottlenecks = bottlenecks;
        
        console.log(`✅ Cuellos de botella identificados: ${bottlenecks.length} problemas encontrados`);
    }

    /**
     * 💡 Generar recomendaciones
     */
    async generateRecommendations() {
        console.log('💡 Generando recomendaciones...');
        
        const recommendations = [];
        const bottlenecks = this.results.details.bottlenecks || [];
        
        bottlenecks.forEach(bottleneck => {
            switch (bottleneck.type) {
                case 'frame_time':
                    recommendations.push({
                        priority: 'high',
                        category: 'performance',
                        title: 'Optimizar frame time',
                        description: 'Implementar object pooling y reducir allocations por frame',
                        estimatedImpact: '30-50% mejora en FPS'
                    });
                    break;
                    
                case 'update_time':
                    recommendations.push({
                        priority: 'medium',
                        category: 'logic',
                        title: 'Optimizar lógica de update',
                        description: 'Implementar spatial partitioning y reducir cálculos innecesarios',
                        estimatedImpact: '20-40% mejora en update time'
                    });
                    break;
                    
                case 'render_time':
                    recommendations.push({
                        priority: 'medium',
                        category: 'rendering',
                        title: 'Optimizar renderizado',
                        description: 'Implementar batch rendering y culling',
                        estimatedImpact: '25-45% mejora en render time'
                    });
                    break;
                    
                case 'memory_leak':
                    recommendations.push({
                        priority: 'critical',
                        category: 'memory',
                        title: 'Corregir memory leaks',
                        description: 'Implementar proper cleanup y object pooling',
                        estimatedImpact: 'Estabilidad a largo plazo'
                    });
                    break;
            }
        });
        
        // Recomendaciones generales
        recommendations.push({
            priority: 'medium',
            category: 'architecture',
            title: 'Implementar ECS',
            description: 'Migrar a Entity Component System para mejor performance',
            estimatedImpact: '2-5x mejora con muchas entidades'
        });
        
        this.results.details.recommendations = recommendations;
        
        console.log(`✅ Recomendaciones generadas: ${recommendations.length} sugerencias`);
    }

    /**
     * 💾 Guardar baseline para futuras comparaciones
     */
    async saveBaseline() {
        console.log('💾 Guardando baseline...');
        
        const baselineData = {
            timestamp: Date.now(),
            version: '1.0.0-pre-refactor',
            systemInfo: this.results.baseline.systemInfo,
            metrics: this.results.metrics,
            bottlenecks: this.results.details.bottlenecks,
            recommendations: this.results.details.recommendations
        };
        
        try {
            localStorage.setItem('galcon_performance_baseline', JSON.stringify(baselineData));
            console.log('✅ Baseline guardado en localStorage');
        } catch (error) {
            this.results.warnings.push(`No se pudo guardar baseline: ${error.message}`);
        }
        
        this.results.baseline.saved = true;
    }

    /**
     * 🔧 Obtener información del sistema
     */
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            memory: performance.memory ? {
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                usedJSHeapSize: performance.memory.usedJSHeapSize
            } : null,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            timestamp: Date.now()
        };
    }

    /**
     * 📏 Medir métricas iniciales
     */
    async measureInitialMetrics() {
        const samples = [];
        
        // Tomar 30 muestras (más rápido para tests)
        for (let i = 0; i < 30; i++) {
            const start = performance.now();
            
            // Simular frame mínimo
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const frameTime = performance.now() - start;
            samples.push(frameTime);
        }
        
        return {
            avgFrameTime: samples.reduce((a, b) => a + b, 0) / samples.length,
            minFrameTime: Math.min(...samples),
            maxFrameTime: Math.max(...samples),
            samples: samples.length
        };
    }

    /**
     * 📊 Calcular estadísticas de performance
     */
    calculateStats(metrics) {
        const stats = {};
        
        // Frame time stats
        if (metrics.frameTimings.length > 0) {
            stats.avgFrameTime = metrics.frameTimings.reduce((a, b) => a + b, 0) / metrics.frameTimings.length;
            stats.minFrameTime = Math.min(...metrics.frameTimings);
            stats.maxFrameTime = Math.max(...metrics.frameTimings);
            stats.frameTimeStdDev = this.calculateStandardDeviation(metrics.frameTimings);
        }
        
        // Update time stats
        if (metrics.updateTimings.length > 0) {
            stats.avgUpdateTime = metrics.updateTimings.reduce((a, b) => a + b, 0) / metrics.updateTimings.length;
            stats.maxUpdateTime = Math.max(...metrics.updateTimings);
        }
        
        // Render time stats
        if (metrics.renderTimings.length > 0) {
            stats.avgRenderTime = metrics.renderTimings.reduce((a, b) => a + b, 0) / metrics.renderTimings.length;
            stats.maxRenderTime = Math.max(...metrics.renderTimings);
        }
        
        // Entity count stats
        if (metrics.entityCounts.length > 0) {
            stats.avgEntityCount = metrics.entityCounts.reduce((a, b) => a + b, 0) / metrics.entityCounts.length;
            stats.maxEntityCount = Math.max(...metrics.entityCounts);
        }
        
        stats.sampleCount = metrics.frameTimings.length;
        
        return stats;
    }

    /**
     * 📈 Calcular desviación estándar
     */
    calculateStandardDeviation(values) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        return Math.sqrt(avgSquareDiff);
    }

    /**
     * 🔥 Crear carga de stress para testing
     */
    createStressLoad() {
        // Crear flotas adicionales si es posible
        if (this.gameEngine.createFleet && this.gameEngine.debugMode) {
            const planets = this.gameEngine.getAllPlanets();
            if (planets.length >= 2) {
                // Crear muchas flotas para stress test
                for (let i = 0; i < 10; i++) {
                    const source = planets[Math.floor(Math.random() * planets.length)];
                    const target = planets[Math.floor(Math.random() * planets.length)];
                    
                    if (source !== target) {
                        this.gameEngine.createFleet(
                            source.x + Math.random() * 100 - 50,
                            source.y + Math.random() * 100 - 50,
                            target.x,
                            target.y,
                            Math.floor(Math.random() * 5) + 1,
                            Math.random() > 0.5 ? 'player' : 'ai'
                        );
                    }
                }
            }
        }
    }

    /**
     * 🧹 Limpiar carga de stress
     */
    cleanupStressLoad() {
        // Remover flotas de stress si es posible
        if (this.gameEngine.getAllFleets) {
            const fleets = this.gameEngine.getAllFleets();
            // En un entorno real, marcaríamos las flotas de stress para removal
        }
    }

    /**
     * 🔢 Contar entidades en el juego
     */
    countEntities() {
        let count = 0;
        
        if (this.gameEngine.getAllPlanets) {
            count += this.gameEngine.getAllPlanets().length;
        }
        
        if (this.gameEngine.getAllFleets) {
            count += this.gameEngine.getAllFleets().length;
        }
        
        return count;
    }

    /**
     * 📊 Obtener resultados del test
     */
    getResults() {
        return {
            ...this.results,
            summary: {
                testName: this.testName,
                passed: this.results.passed,
                errorCount: this.results.errors.length,
                warningCount: this.results.warnings.length,
                baselineEstablished: !!this.results.baseline.saved,
                bottlenecksFound: this.results.details.bottlenecks?.length || 0,
                recommendationsGenerated: this.results.details.recommendations?.length || 0,
                metrics: this.results.metrics
            }
        };
    }
} 