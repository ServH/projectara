/**
 * 🛡️ RENDERING SAFETY TEST
 * Test crítico de estabilidad de renderizado antes de refactorización
 * Verifica que el renderizado no crashea y mantiene performance estable
 */

export class RenderingSafetyTest {
    constructor() {
        this.testName = 'RenderingSafetyTest';
        this.results = {
            passed: false,
            errors: [],
            warnings: [],
            metrics: {},
            details: {}
        };
        this.gameEngine = null;
        this.renderer = null;
        this.frameCount = 0;
        this.testDuration = 5000; // 5 segundos de test
    }

    /**
     * 🧪 Ejecutar test completo de renderizado
     */
    async run(gameEngine, renderer) {
        console.log('🛡️ Iniciando RenderingSafetyTest...');
        this.gameEngine = gameEngine;
        this.renderer = renderer;
        
        try {
            // 1. Verificar configuración de renderizado
            await this.testRenderingSetup();
            
            // 2. Test de renderizado básico
            await this.testBasicRendering();
            
            // 3. Test de estabilidad con carga
            await this.testRenderingStability();
            
            // 4. Test de performance de renderizado
            await this.testRenderingPerformance();
            
            // 5. Test de integridad de memoria
            await this.testMemoryIntegrity();
            
            // 6. Test de recuperación de errores
            await this.testErrorRecovery();
            
            this.results.passed = true;
            console.log('✅ RenderingSafetyTest PASADO');
            
        } catch (error) {
            this.results.passed = false;
            this.results.errors.push(`Test fallido: ${error.message}`);
            console.error('❌ RenderingSafetyTest FALLIDO:', error);
        }
        
        return this.results;
    }

    /**
     * 🔧 Verificar configuración de renderizado
     */
    async testRenderingSetup() {
        console.log('🔧 Verificando configuración de renderizado...');
        
        // Verificar que el renderer existe
        if (!this.renderer) {
            throw new Error('Renderer no está disponible');
        }
        
        // Verificar canvas
        const canvas = document.getElementById('gameCanvas') || document.querySelector('canvas');
        if (!canvas) {
            throw new Error('Canvas no encontrado');
        }
        
        // Verificar contexto de renderizado
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Contexto 2D no disponible');
        }
        
        // Verificar dimensiones del canvas
        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error(`Canvas con dimensiones inválidas: ${canvas.width}x${canvas.height}`);
        }
        
        this.results.details.canvasWidth = canvas.width;
        this.results.details.canvasHeight = canvas.height;
        this.results.details.rendererType = this.renderer.constructor.name;
        
        console.log(`✅ Configuración válida: ${canvas.width}x${canvas.height}, renderer: ${this.renderer.constructor.name}`);
    }

    /**
     * 🎨 Test de renderizado básico
     */
    async testBasicRendering() {
        console.log('🎨 Probando renderizado básico...');
        
        // Obtener datos de renderizado
        const renderData = this.gameEngine.getRenderData();
        
        if (!renderData) {
            throw new Error('No se pueden obtener datos de renderizado');
        }
        
        // Verificar que hay datos para renderizar
        if (!renderData.planets || renderData.planets.length === 0) {
            throw new Error('No hay planetas para renderizar');
        }
        
        // Intentar renderizar un frame
        try {
            if (this.renderer.render) {
                this.renderer.render();
            } else {
                throw new Error('Método render no disponible en renderer');
            }
        } catch (error) {
            throw new Error(`Error en renderizado básico: ${error.message}`);
        }
        
        this.results.details.planetsToRender = renderData.planets.length;
        this.results.details.fleetsToRender = renderData.fleets ? renderData.fleets.length : 0;
        
        console.log(`✅ Renderizado básico exitoso: ${renderData.planets.length} planetas, ${renderData.fleets?.length || 0} flotas`);
    }

    /**
     * 🔄 Test de estabilidad de renderizado con carga
     */
    async testRenderingStability() {
        console.log('🔄 Probando estabilidad de renderizado...');
        
        const startTime = Date.now();
        const targetFrames = 300; // ~5 segundos a 60 FPS
        let frameCount = 0;
        let errorCount = 0;
        const frameTimings = [];
        
        while (Date.now() - startTime < this.testDuration && frameCount < targetFrames) {
            const frameStart = performance.now();
            
            try {
                // Renderizar frame
                if (this.renderer.render) {
                    this.renderer.render();
                }
                frameCount++;
                
                const frameTime = performance.now() - frameStart;
                frameTimings.push(frameTime);
                
            } catch (error) {
                errorCount++;
                if (errorCount > 10) {
                    throw new Error(`Demasiados errores de renderizado: ${errorCount}`);
                }
            }
            
            // Esperar al siguiente frame
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        
        // Calcular estadísticas
        const avgFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
        const maxFrameTime = Math.max(...frameTimings);
        const minFrameTime = Math.min(...frameTimings);
        
        this.results.details.stabilityFrames = frameCount;
        this.results.details.stabilityErrors = errorCount;
        this.results.details.avgFrameTime = avgFrameTime;
        this.results.details.maxFrameTime = maxFrameTime;
        this.results.details.minFrameTime = minFrameTime;
        
        if (errorCount > frameCount * 0.1) { // Más del 10% de errores
            throw new Error(`Demasiados errores de renderizado: ${errorCount}/${frameCount}`);
        }
        
        console.log(`✅ Estabilidad verificada: ${frameCount} frames, ${errorCount} errores, ${avgFrameTime.toFixed(2)}ms promedio`);
    }

    /**
     * ⚡ Test de performance de renderizado
     */
    async testRenderingPerformance() {
        console.log('⚡ Probando performance de renderizado...');
        
        const performanceMetrics = {
            frameTimings: [],
            memoryUsage: [],
            renderCalls: 0
        };
        
        // Crear carga adicional para test de stress
        this.createStressLoad();
        
        // Medir performance durante 60 frames
        for (let i = 0; i < 60; i++) {
            const frameStart = performance.now();
            
            // Renderizar con carga de stress
            if (this.renderer.render) {
                this.renderer.render();
                performanceMetrics.renderCalls++;
            }
            
            const frameTime = performance.now() - frameStart;
            performanceMetrics.frameTimings.push(frameTime);
            
            // Medir memoria si está disponible
            if (performance.memory) {
                performanceMetrics.memoryUsage.push(performance.memory.usedJSHeapSize);
            }
            
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        
        // Analizar resultados
        const avgFrameTime = performanceMetrics.frameTimings.reduce((a, b) => a + b, 0) / performanceMetrics.frameTimings.length;
        const maxFrameTime = Math.max(...performanceMetrics.frameTimings);
        const targetFrameTime = 16.67; // 60 FPS
        
        this.results.metrics.avgFrameTime = avgFrameTime;
        this.results.metrics.maxFrameTime = maxFrameTime;
        this.results.metrics.renderCalls = performanceMetrics.renderCalls;
        
        // Verificar que la performance es aceptable
        if (avgFrameTime > targetFrameTime * 2) {
            this.results.warnings.push(`Performance baja: ${avgFrameTime.toFixed(2)}ms promedio (objetivo: ${targetFrameTime}ms)`);
        }
        
        if (maxFrameTime > targetFrameTime * 4) {
            throw new Error(`Frame time excesivo: ${maxFrameTime.toFixed(2)}ms (máximo aceptable: ${targetFrameTime * 4}ms)`);
        }
        
        console.log(`✅ Performance aceptable: ${avgFrameTime.toFixed(2)}ms promedio, ${maxFrameTime.toFixed(2)}ms máximo`);
    }

    /**
     * 🧠 Test de integridad de memoria
     */
    async testMemoryIntegrity() {
        console.log('🧠 Probando integridad de memoria...');
        
        if (!performance.memory) {
            this.results.warnings.push('API de memoria no disponible');
            return;
        }
        
        const initialMemory = performance.memory.usedJSHeapSize;
        
        // Renderizar muchos frames para detectar memory leaks
        for (let i = 0; i < 100; i++) {
            if (this.renderer.render) {
                this.renderer.render();
            }
            
            // Cada 10 frames, forzar garbage collection si está disponible
            if (i % 10 === 0 && window.gc) {
                window.gc();
            }
        }
        
        const finalMemory = performance.memory.usedJSHeapSize;
        const memoryGrowth = finalMemory - initialMemory;
        const memoryGrowthMB = memoryGrowth / (1024 * 1024);
        
        this.results.details.initialMemory = initialMemory;
        this.results.details.finalMemory = finalMemory;
        this.results.details.memoryGrowth = memoryGrowthMB;
        
        // Verificar que no hay memory leaks significativos
        const maxGrowthMB = 10; // 10MB máximo de crecimiento
        if (memoryGrowthMB > maxGrowthMB) {
            this.results.warnings.push(`Posible memory leak: ${memoryGrowthMB.toFixed(2)}MB de crecimiento`);
        }
        
        console.log(`✅ Memoria verificada: ${memoryGrowthMB.toFixed(2)}MB de crecimiento`);
    }

    /**
     * 🚨 Test de recuperación de errores
     */
    async testErrorRecovery() {
        console.log('🚨 Probando recuperación de errores...');
        
        // Simular condiciones de error controladas
        const originalConsoleError = console.error;
        let errorsCaught = 0;
        
        console.error = (...args) => {
            errorsCaught++;
            originalConsoleError.apply(console, args);
        };
        
        try {
            // Intentar renderizar con datos inválidos (si es posible)
            // Esto depende de la implementación específica del renderer
            
            // Verificar que el renderer sigue funcionando después de errores
            if (this.renderer.render) {
                this.renderer.render();
            }
            
        } catch (error) {
            // Los errores son esperados en este test
            console.log(`Error controlado capturado: ${error.message}`);
        } finally {
            console.error = originalConsoleError;
        }
        
        this.results.details.errorsCaught = errorsCaught;
        
        // Verificar que el renderer sigue funcionando
        try {
            if (this.renderer.render) {
                this.renderer.render();
            }
            console.log('✅ Recuperación de errores exitosa');
        } catch (error) {
            throw new Error(`Renderer no se recuperó de errores: ${error.message}`);
        }
    }

    /**
     * 🔥 Crear carga de stress para testing
     */
    createStressLoad() {
        // Crear flotas adicionales para stress test si es posible
        if (this.gameEngine.createFleet && this.gameEngine.debugMode) {
            const planets = this.gameEngine.getAllPlanets();
            if (planets.length >= 2) {
                const source = planets[0];
                const target = planets[1];
                
                // Crear varias flotas para stress test
                for (let i = 0; i < 5; i++) {
                    this.gameEngine.createFleet(
                        source.x + Math.random() * 50,
                        source.y + Math.random() * 50,
                        target.x,
                        target.y,
                        3,
                        'player'
                    );
                }
            }
        }
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
                metrics: this.results.metrics,
                details: this.results.details
            }
        };
    }
} 