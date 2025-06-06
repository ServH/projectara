/**
 * 🛡️ SAFETY TEST RUNNER
 * Runner principal para todos los tests de seguridad antes de refactorización
 * Coordina la ejecución de todos los tests y genera el reporte final
 */

export class SafetyTestRunner {
    constructor() {
        this.testResults = [];
        this.overallResult = {
            passed: false,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            warnings: 0,
            errors: 0,
            startTime: null,
            endTime: null,
            duration: 0
        };
        this.gameEngine = null;
        this.renderer = null;
    }

    /**
     * 🚀 Ejecutar todos los tests de seguridad
     */
    async runAllTests(gameEngine, renderer = null) {
        console.log('🛡️ INICIANDO SAFETY TEST SUITE');
        console.log('=====================================');
        
        this.gameEngine = gameEngine;
        this.renderer = renderer;
        this.overallResult.startTime = Date.now();
        
        try {
            // Importar y ejecutar todos los tests
            await this.runGameFlowSafetyTest();
            await this.runRenderingSafetyTest();
            await this.runEventSystemSafetyTest();
            await this.runPerformanceBaselineTest();
            await this.runStateContinuitySafetyTest();
            
            // Calcular resultados finales
            this.calculateOverallResults();
            
            // Generar reporte
            this.generateReport();
            
            // Determinar si es seguro proceder
            this.determineSafetyStatus();
            
        } catch (error) {
            console.error('❌ Error crítico en Safety Test Suite:', error);
            this.overallResult.passed = false;
            this.overallResult.criticalError = error.message;
        }
        
        this.overallResult.endTime = Date.now();
        this.overallResult.duration = this.overallResult.endTime - this.overallResult.startTime;
        
        return this.overallResult;
    }

    /**
     * 🎮 Ejecutar GameFlowSafetyTest
     */
    async runGameFlowSafetyTest() {
        console.log('\n🎮 Ejecutando GameFlowSafetyTest...');
        
        try {
            const { GameFlowSafetyTest } = await import('./safety/GameFlowSafetyTest.js');
            const test = new GameFlowSafetyTest();
            const result = await test.run(this.gameEngine);
            
            this.testResults.push({
                testName: 'GameFlowSafetyTest',
                result: result,
                critical: true // Test crítico
            });
            
            this.logTestResult('GameFlowSafetyTest', result);
            
        } catch (error) {
            console.error('❌ Error en GameFlowSafetyTest:', error);
            this.testResults.push({
                testName: 'GameFlowSafetyTest',
                result: { passed: false, errors: [error.message] },
                critical: true,
                error: error
            });
        }
    }

    /**
     * 🎨 Ejecutar RenderingSafetyTest
     */
    async runRenderingSafetyTest() {
        console.log('\n🎨 Ejecutando RenderingSafetyTest...');
        
        try {
            const { RenderingSafetyTest } = await import('./safety/RenderingSafetyTest.js');
            const test = new RenderingSafetyTest();
            const result = await test.run(this.gameEngine, this.renderer);
            
            this.testResults.push({
                testName: 'RenderingSafetyTest',
                result: result,
                critical: true
            });
            
            this.logTestResult('RenderingSafetyTest', result);
            
        } catch (error) {
            console.error('❌ Error en RenderingSafetyTest:', error);
            this.testResults.push({
                testName: 'RenderingSafetyTest',
                result: { passed: false, errors: [error.message] },
                critical: true,
                error: error
            });
        }
    }

    /**
     * 📡 Ejecutar EventSystemSafetyTest
     */
    async runEventSystemSafetyTest() {
        console.log('\n📡 Ejecutando EventSystemSafetyTest...');
        
        try {
            const { EventSystemSafetyTest } = await import('./safety/EventSystemSafetyTest.js');
            const test = new EventSystemSafetyTest();
            const result = await test.run(this.gameEngine);
            
            this.testResults.push({
                testName: 'EventSystemSafetyTest',
                result: result,
                critical: true
            });
            
            this.logTestResult('EventSystemSafetyTest', result);
            
        } catch (error) {
            console.error('❌ Error en EventSystemSafetyTest:', error);
            this.testResults.push({
                testName: 'EventSystemSafetyTest',
                result: { passed: false, errors: [error.message] },
                critical: true,
                error: error
            });
        }
    }

    /**
     * ⚡ Ejecutar PerformanceBaselineTest
     */
    async runPerformanceBaselineTest() {
        console.log('\n⚡ Ejecutando PerformanceBaselineTest...');
        
        try {
            const { PerformanceBaselineTest } = await import('./safety/PerformanceBaselineTest.js');
            const test = new PerformanceBaselineTest();
            const result = await test.run(this.gameEngine);
            
            this.testResults.push({
                testName: 'PerformanceBaselineTest',
                result: result,
                critical: false // Importante pero no crítico
            });
            
            this.logTestResult('PerformanceBaselineTest', result);
            
        } catch (error) {
            console.error('❌ Error en PerformanceBaselineTest:', error);
            this.testResults.push({
                testName: 'PerformanceBaselineTest',
                result: { passed: false, errors: [error.message] },
                critical: false,
                error: error
            });
        }
    }

    /**
     * 🔄 Ejecutar StateContinuitySafetyTest
     */
    async runStateContinuitySafetyTest() {
        console.log('\n🔄 Ejecutando StateContinuitySafetyTest...');
        
        try {
            const { StateContinuitySafetyTest } = await import('./safety/StateContinuitySafetyTest.js');
            const test = new StateContinuitySafetyTest();
            const result = await test.run(this.gameEngine);
            
            this.testResults.push({
                testName: 'StateContinuitySafetyTest',
                result: result,
                critical: true
            });
            
            this.logTestResult('StateContinuitySafetyTest', result);
            
        } catch (error) {
            console.error('❌ Error en StateContinuitySafetyTest:', error);
            this.testResults.push({
                testName: 'StateContinuitySafetyTest',
                result: { passed: false, errors: [error.message] },
                critical: true,
                error: error
            });
        }
    }

    /**
     * 📊 Calcular resultados generales
     */
    calculateOverallResults() {
        this.overallResult.totalTests = this.testResults.length;
        this.overallResult.passedTests = this.testResults.filter(t => t.result.passed).length;
        this.overallResult.failedTests = this.overallResult.totalTests - this.overallResult.passedTests;
        
        // Contar warnings y errores
        this.testResults.forEach(testResult => {
            const result = testResult.result;
            if (result.warnings) {
                this.overallResult.warnings += result.warnings.length;
            }
            if (result.errors) {
                this.overallResult.errors += result.errors.length;
            }
        });
        
        // Determinar si todos los tests críticos pasaron
        const criticalTests = this.testResults.filter(t => t.critical);
        const passedCriticalTests = criticalTests.filter(t => t.result.passed);
        
        this.overallResult.criticalTestsPassed = passedCriticalTests.length;
        this.overallResult.criticalTestsTotal = criticalTests.length;
        this.overallResult.allCriticalTestsPassed = passedCriticalTests.length === criticalTests.length;
    }

    /**
     * 📋 Generar reporte detallado
     */
    generateReport() {
        console.log('\n📋 GENERANDO REPORTE DE SAFETY TESTS');
        console.log('=====================================');
        
        // Resumen general
        console.log(`\n📊 RESUMEN GENERAL:`);
        console.log(`   Tests ejecutados: ${this.overallResult.totalTests}`);
        console.log(`   Tests pasados: ${this.overallResult.passedTests}`);
        console.log(`   Tests fallidos: ${this.overallResult.failedTests}`);
        console.log(`   Warnings: ${this.overallResult.warnings}`);
        console.log(`   Errores: ${this.overallResult.errors}`);
        console.log(`   Duración: ${(this.overallResult.duration / 1000).toFixed(1)}s`);
        
        // Detalles por test
        console.log(`\n📝 DETALLES POR TEST:`);
        this.testResults.forEach(testResult => {
            const status = testResult.result.passed ? '✅' : '❌';
            const critical = testResult.critical ? '🔴' : '🟡';
            
            console.log(`\n${status} ${critical} ${testResult.testName}`);
            
            if (testResult.result.errors && testResult.result.errors.length > 0) {
                console.log(`   Errores: ${testResult.result.errors.length}`);
                testResult.result.errors.forEach(error => {
                    console.log(`     - ${error}`);
                });
            }
            
            if (testResult.result.warnings && testResult.result.warnings.length > 0) {
                console.log(`   Warnings: ${testResult.result.warnings.length}`);
                testResult.result.warnings.forEach(warning => {
                    console.log(`     - ${warning}`);
                });
            }
            
            if (testResult.result.summary) {
                const summary = testResult.result.summary;
                console.log(`   Detalles: ${JSON.stringify(summary, null, 2)}`);
            }
        });
        
        // Guardar reporte en localStorage
        this.saveReport();
    }

    /**
     * 🚦 Determinar estado de seguridad
     */
    determineSafetyStatus() {
        console.log('\n🚦 DETERMINANDO ESTADO DE SEGURIDAD');
        console.log('=====================================');
        
        // Verificar tests críticos
        if (!this.overallResult.allCriticalTestsPassed) {
            console.log('❌ TESTS CRÍTICOS FALLARON');
            console.log('⛔ NO ES SEGURO PROCEDER CON LA REFACTORIZACIÓN');
            console.log('\n🔧 ACCIONES REQUERIDAS:');
            
            const failedCriticalTests = this.testResults.filter(t => t.critical && !t.result.passed);
            failedCriticalTests.forEach(test => {
                console.log(`   - Corregir problemas en ${test.testName}`);
                if (test.result.errors) {
                    test.result.errors.forEach(error => {
                        console.log(`     * ${error}`);
                    });
                }
            });
            
            this.overallResult.passed = false;
            this.overallResult.safeToRefactor = false;
            this.overallResult.recommendation = 'NO_REFACTOR';
            
        } else if (this.overallResult.warnings > 10) {
            console.log('⚠️ MUCHOS WARNINGS DETECTADOS');
            console.log('🟡 PROCEDER CON PRECAUCIÓN');
            console.log('\n💡 RECOMENDACIONES:');
            console.log('   - Revisar warnings antes de refactorizar');
            console.log('   - Considerar correcciones menores');
            console.log('   - Monitorear de cerca durante refactorización');
            
            this.overallResult.passed = true;
            this.overallResult.safeToRefactor = true;
            this.overallResult.recommendation = 'PROCEED_WITH_CAUTION';
            
        } else {
            console.log('✅ TODOS LOS TESTS CRÍTICOS PASARON');
            console.log('🟢 ES SEGURO PROCEDER CON LA REFACTORIZACIÓN');
            console.log('\n🚀 PRÓXIMOS PASOS:');
            console.log('   1. Crear branch para refactorización');
            console.log('   2. Implementar Fase 1: Sistemas de Supervivencia');
            console.log('   3. Ejecutar tests de regresión');
            console.log('   4. Continuar con fases siguientes');
            
            this.overallResult.passed = true;
            this.overallResult.safeToRefactor = true;
            this.overallResult.recommendation = 'PROCEED';
        }
        
        console.log('\n=====================================');
        console.log(`🏁 RESULTADO FINAL: ${this.overallResult.recommendation}`);
        console.log('=====================================');
    }

    /**
     * 💾 Guardar reporte en localStorage
     */
    saveReport() {
        try {
            const reportData = {
                timestamp: Date.now(),
                version: '1.0.0-pre-refactor',
                overallResult: this.overallResult,
                testResults: this.testResults.map(t => ({
                    testName: t.testName,
                    passed: t.result.passed,
                    critical: t.critical,
                    errors: t.result.errors || [],
                    warnings: t.result.warnings || [],
                    summary: t.result.summary || {}
                }))
            };
            
            localStorage.setItem('galcon_safety_test_report', JSON.stringify(reportData));
            console.log('💾 Reporte guardado en localStorage');
            
        } catch (error) {
            console.warn('⚠️ No se pudo guardar el reporte:', error.message);
        }
    }

    /**
     * 📝 Log resultado de test individual
     */
    logTestResult(testName, result) {
        const status = result.passed ? '✅ PASADO' : '❌ FALLIDO';
        console.log(`   ${status}: ${testName}`);
        
        if (result.errors && result.errors.length > 0) {
            console.log(`   Errores: ${result.errors.length}`);
        }
        
        if (result.warnings && result.warnings.length > 0) {
            console.log(`   Warnings: ${result.warnings.length}`);
        }
        
        if (result.summary) {
            console.log(`   Detalles: ${JSON.stringify(result.summary, null, 2)}`);
        }
    }

    /**
     * 📊 Obtener resultados completos
     */
    getResults() {
        return {
            overallResult: this.overallResult,
            testResults: this.testResults,
            recommendation: this.overallResult.recommendation,
            safeToRefactor: this.overallResult.safeToRefactor
        };
    }

    /**
     * 🔄 Ejecutar test específico
     */
    async runSpecificTest(testName, ...args) {
        console.log(`🧪 Ejecutando test específico: ${testName}`);
        
        try {
            switch (testName) {
                case 'GameFlowSafetyTest':
                    await this.runGameFlowSafetyTest();
                    break;
                case 'RenderingSafetyTest':
                    await this.runRenderingSafetyTest();
                    break;
                case 'EventSystemSafetyTest':
                    await this.runEventSystemSafetyTest();
                    break;
                case 'PerformanceBaselineTest':
                    await this.runPerformanceBaselineTest();
                    break;
                case 'StateContinuitySafetyTest':
                    await this.runStateContinuitySafetyTest();
                    break;
                default:
                    throw new Error(`Test desconocido: ${testName}`);
            }
            
            return this.testResults[this.testResults.length - 1];
            
        } catch (error) {
            console.error(`❌ Error ejecutando ${testName}:`, error);
            throw error;
        }
    }

    /**
     * 📈 Obtener métricas de performance
     */
    getPerformanceMetrics() {
        const performanceTest = this.testResults.find(t => t.testName === 'PerformanceBaselineTest');
        
        if (performanceTest && performanceTest.result.metrics) {
            return performanceTest.result.metrics;
        }
        
        return null;
    }

    /**
     * 🔍 Obtener recomendaciones
     */
    getRecommendations() {
        const recommendations = [];
        
        this.testResults.forEach(testResult => {
            if (testResult.result.details && testResult.result.details.recommendations) {
                recommendations.push(...testResult.result.details.recommendations);
            }
        });
        
        return recommendations;
    }
}

// Función de utilidad para ejecutar tests desde HTML
window.runSafetyTests = async function(gameEngine, renderer) {
    const runner = new SafetyTestRunner();
    const results = await runner.runAllTests(gameEngine, renderer);
    
    // Mostrar resultados en la interfaz
    const resultsDiv = document.getElementById('test-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <h3>Resultados de Safety Tests</h3>
            <p><strong>Estado:</strong> ${results.recommendation}</p>
            <p><strong>Tests pasados:</strong> ${results.passedTests}/${results.totalTests}</p>
            <p><strong>Warnings:</strong> ${results.warnings}</p>
            <p><strong>Errores:</strong> ${results.errors}</p>
            <p><strong>Duración:</strong> ${(results.duration / 1000).toFixed(1)}s</p>
            <p><strong>Seguro refactorizar:</strong> ${results.safeToRefactor ? 'SÍ' : 'NO'}</p>
        `;
    }
    
    return results;
};

export { SafetyTestRunner }; 