/**
 * 🧪 FUNCTIONALITY TEST SUITE - REFACTORING VALIDATION
 * Suite de pruebas para garantizar que la funcionalidad se preserve durante la refactorización
 * 
 * PROPÓSITO: Validar que todos los componentes críticos funcionen correctamente
 * antes y después de cada cambio de refactorización
 */

export class FunctionalityTestSuite {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.testResults = [];
        this.criticalFunctions = new Map();
        this.performanceBaseline = null;
        
        this.setupCriticalFunctions();
        console.log('🧪 Functionality Test Suite initialized');
    }

    /**
     * Configurar funciones críticas que deben preservarse
     */
    setupCriticalFunctions() {
        this.criticalFunctions.set('gameEngine_initialization', () => {
            return this.gameEngine && 
                   this.gameEngine.planets && 
                   this.gameEngine.fleets &&
                   this.gameEngine.players;
        });

        this.criticalFunctions.set('planet_creation', () => {
            const planets = this.gameEngine.getAllPlanets();
            return planets.length > 0 && 
                   planets.every(planet => 
                       planet.id && 
                       typeof planet.x === 'number' && 
                       typeof planet.y === 'number' &&
                       typeof planet.ships === 'number'
                   );
        });

        this.criticalFunctions.set('fleet_creation', () => {
            const testPlanet1 = this.gameEngine.getAllPlanets()[0];
            const testPlanet2 = this.gameEngine.getAllPlanets()[1];
            
            if (!testPlanet1 || !testPlanet2) return false;
            
            const initialFleetCount = this.gameEngine.getAllFleets().length;
            
            // Simular envío de flota
            try {
                this.gameEngine.sendFleetFromSelected(testPlanet2.id, 0.5);
                const newFleetCount = this.gameEngine.getAllFleets().length;
                return newFleetCount > initialFleetCount;
            } catch (error) {
                console.error('Fleet creation test failed:', error);
                return false;
            }
        });

        this.criticalFunctions.set('navigation_system', () => {
            return this.gameEngine.navigationSystem && 
                   typeof this.gameEngine.navigationSystem.update === 'function';
        });

        this.criticalFunctions.set('ai_system', () => {
            return this.gameEngine.aiSystem && 
                   typeof this.gameEngine.aiSystem.update === 'function';
        });

        this.criticalFunctions.set('event_system', () => {
            // Test event emission and listening
            let eventReceived = false;
            const testHandler = () => { eventReceived = true; };
            
            try {
                this.gameEngine.eventBus?.on('test_event', testHandler);
                this.gameEngine.eventBus?.emit('test_event');
                this.gameEngine.eventBus?.off('test_event', testHandler);
                return eventReceived;
            } catch (error) {
                return false;
            }
        });

        this.criticalFunctions.set('performance_metrics', () => {
            const stats = this.gameEngine.getDebugInfo();
            return stats && 
                   typeof stats.fps === 'number' &&
                   typeof stats.planetsCount === 'number' &&
                   typeof stats.fleetsCount === 'number';
        });
    }

    /**
     * Ejecutar suite completa de pruebas
     */
    async runFullSuite() {
        console.log('🧪 Running full functionality test suite...');
        this.testResults = [];
        
        const startTime = performance.now();
        
        // Ejecutar todas las pruebas críticas
        for (const [testName, testFunction] of this.criticalFunctions) {
            const result = await this.runSingleTest(testName, testFunction);
            this.testResults.push(result);
        }
        
        // Pruebas de rendimiento
        const performanceResult = await this.runPerformanceTest();
        this.testResults.push(performanceResult);
        
        const totalTime = performance.now() - startTime;
        
        const report = this.generateTestReport(totalTime);
        console.log('🧪 Test suite completed in', totalTime.toFixed(2), 'ms');
        
        return report;
    }

    /**
     * Ejecutar una prueba individual
     */
    async runSingleTest(testName, testFunction) {
        const startTime = performance.now();
        let passed = false;
        let error = null;
        
        try {
            passed = await testFunction();
        } catch (e) {
            error = e.message;
            passed = false;
        }
        
        const duration = performance.now() - startTime;
        
        const result = {
            name: testName,
            passed,
            duration,
            error,
            timestamp: new Date().toISOString()
        };
        
        console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}${error ? ` (${error})` : ''}`);
        
        return result;
    }

    /**
     * Prueba de rendimiento básica
     */
    async runPerformanceTest() {
        const startTime = performance.now();
        const iterations = 60; // Simular 1 segundo a 60 FPS
        const frameTimings = [];
        
        for (let i = 0; i < iterations; i++) {
            const frameStart = performance.now();
            
            // Simular un frame de juego
            if (this.gameEngine.update) {
                this.gameEngine.update(1/60);
            }
            
            const frameTime = performance.now() - frameStart;
            frameTimings.push(frameTime);
            
            // Pequeña pausa para simular frame rate
            await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        const averageFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
        const maxFrameTime = Math.max(...frameTimings);
        const estimatedFPS = 1000 / averageFrameTime;
        
        const passed = averageFrameTime < 16.67 && estimatedFPS > 45; // Target: 60 FPS, minimum: 45 FPS
        
        const result = {
            name: 'performance_test',
            passed,
            duration: performance.now() - startTime,
            metrics: {
                averageFrameTime: averageFrameTime.toFixed(2),
                maxFrameTime: maxFrameTime.toFixed(2),
                estimatedFPS: estimatedFPS.toFixed(1)
            },
            timestamp: new Date().toISOString()
        };
        
        console.log(`${passed ? '✅' : '❌'} Performance Test: ${passed ? 'PASSED' : 'FAILED'} (${estimatedFPS.toFixed(1)} FPS)`);
        
        return result;
    }

    /**
     * Establecer baseline de rendimiento
     */
    setPerformanceBaseline() {
        this.performanceBaseline = {
            timestamp: new Date().toISOString(),
            metrics: this.gameEngine.getDebugInfo(),
            testResults: [...this.testResults]
        };
        
        console.log('📊 Performance baseline established');
        return this.performanceBaseline;
    }

    /**
     * Comparar con baseline
     */
    compareWithBaseline() {
        if (!this.performanceBaseline) {
            console.warn('⚠️ No baseline established for comparison');
            return null;
        }
        
        const currentMetrics = this.gameEngine.getDebugInfo();
        const baselineMetrics = this.performanceBaseline.metrics;
        
        const comparison = {
            fps: {
                current: currentMetrics.fps,
                baseline: baselineMetrics.fps,
                change: currentMetrics.fps - baselineMetrics.fps
            },
            memory: {
                current: currentMetrics.memoryUsage,
                baseline: baselineMetrics.memoryUsage,
                change: currentMetrics.memoryUsage - baselineMetrics.memoryUsage
            },
            entities: {
                planets: {
                    current: currentMetrics.planetsCount,
                    baseline: baselineMetrics.planetsCount,
                    change: currentMetrics.planetsCount - baselineMetrics.planetsCount
                },
                fleets: {
                    current: currentMetrics.fleetsCount,
                    baseline: baselineMetrics.fleetsCount,
                    change: currentMetrics.fleetsCount - baselineMetrics.fleetsCount
                }
            }
        };
        
        console.log('📊 Baseline comparison:', comparison);
        return comparison;
    }

    /**
     * Generar reporte de pruebas
     */
    generateTestReport(totalTime) {
        const passedTests = this.testResults.filter(test => test.passed);
        const failedTests = this.testResults.filter(test => !test.passed);
        
        const report = {
            summary: {
                total: this.testResults.length,
                passed: passedTests.length,
                failed: failedTests.length,
                successRate: (passedTests.length / this.testResults.length * 100).toFixed(1),
                totalTime: totalTime.toFixed(2)
            },
            results: this.testResults,
            failedTests: failedTests.map(test => ({
                name: test.name,
                error: test.error
            })),
            timestamp: new Date().toISOString()
        };
        
        console.group('🧪 TEST SUITE REPORT');
        console.log(`📊 Success Rate: ${report.summary.successRate}% (${report.summary.passed}/${report.summary.total})`);
        console.log(`⏱️ Total Time: ${report.summary.totalTime}ms`);
        
        if (failedTests.length > 0) {
            console.group('❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`- ${test.name}: ${test.error || 'Unknown error'}`);
            });
            console.groupEnd();
        }
        
        console.groupEnd();
        
        return report;
    }

    /**
     * Validar que la refactorización no rompió nada
     */
    async validateRefactoring(componentName) {
        console.log(`🔍 Validating refactoring of ${componentName}...`);
        
        const report = await this.runFullSuite();
        const comparison = this.compareWithBaseline();
        
        const isValid = report.summary.successRate >= 95 && // 95% success rate minimum
                       (!comparison || comparison.fps.change >= -5); // Max 5 FPS loss
        
        if (isValid) {
            console.log(`✅ Refactoring of ${componentName} validated successfully`);
        } else {
            console.error(`❌ Refactoring of ${componentName} failed validation`);
            console.log('📊 Test Report:', report);
            if (comparison) console.log('📊 Performance Comparison:', comparison);
        }
        
        return {
            isValid,
            report,
            comparison,
            componentName,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Limpiar recursos de testing
     */
    cleanup() {
        this.testResults = [];
        this.performanceBaseline = null;
        console.log('🧹 Test suite cleaned up');
    }
}

export default FunctionalityTestSuite; 