/**
 * 🏃‍♂️ REFACTORING TEST RUNNER
 * Ejecutor de pruebas para validar refactorizaciones de forma automatizada
 * 
 * PROPÓSITO: Automatizar la validación de funcionalidad durante el proceso de refactorización
 */

import FunctionalityTestSuite from './FunctionalityTestSuite.js';

export class RefactoringTestRunner {
    constructor() {
        this.testSuite = null;
        this.gameEngine = null;
        this.validationHistory = [];
        this.isInitialized = false;
        
        console.log('🏃‍♂️ Refactoring Test Runner created');
    }

    /**
     * Inicializar el runner con el GameEngine
     */
    async initialize(gameEngine) {
        if (!gameEngine) {
            throw new Error('GameEngine is required for testing');
        }

        this.gameEngine = gameEngine;
        this.testSuite = new FunctionalityTestSuite(gameEngine);
        
        // Esperar a que el juego esté completamente inicializado
        await this.waitForGameInitialization();
        
        // Establecer baseline inicial
        const initialReport = await this.testSuite.runFullSuite();
        this.testSuite.setPerformanceBaseline();
        
        this.isInitialized = true;
        
        console.log('✅ Test Runner initialized with baseline');
        console.log('📊 Initial test results:', initialReport.summary);
        
        return initialReport;
    }

    /**
     * Esperar a que el juego esté completamente inicializado
     */
    async waitForGameInitialization() {
        const maxWaitTime = 5000; // 5 segundos máximo
        const checkInterval = 100; // Verificar cada 100ms
        let waitTime = 0;

        while (waitTime < maxWaitTime) {
            const planets = this.gameEngine.getAllPlanets();
            const isReady = planets && planets.length > 0 && 
                           this.gameEngine.aiSystem && 
                           this.gameEngine.navigationSystem;

            if (isReady) {
                console.log('🎮 Game engine fully initialized for testing');
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waitTime += checkInterval;
        }

        throw new Error('Game engine failed to initialize within timeout');
    }

    /**
     * Validar refactorización de un componente específico
     */
    async validateComponentRefactoring(componentName, refactoringFunction) {
        if (!this.isInitialized) {
            throw new Error('Test runner not initialized. Call initialize() first.');
        }

        console.log(`🔧 Starting refactoring validation for: ${componentName}`);
        
        // Ejecutar pruebas pre-refactorización
        console.log('📋 Running pre-refactoring tests...');
        const preRefactoringReport = await this.testSuite.runFullSuite();
        
        if (preRefactoringReport.summary.successRate < 95) {
            console.error('❌ Pre-refactoring tests failed. Cannot proceed with refactoring.');
            return {
                success: false,
                reason: 'Pre-refactoring tests failed',
                preReport: preRefactoringReport
            };
        }

        // Ejecutar la refactorización
        console.log(`🔨 Executing refactoring for ${componentName}...`);
        let refactoringError = null;
        
        try {
            await refactoringFunction();
        } catch (error) {
            refactoringError = error;
            console.error('❌ Refactoring function failed:', error);
        }

        // Ejecutar pruebas post-refactorización
        console.log('📋 Running post-refactoring tests...');
        const postRefactoringReport = await this.testSuite.runFullSuite();
        const comparison = this.testSuite.compareWithBaseline();

        // Evaluar resultados
        const validation = this.evaluateRefactoringResults(
            componentName,
            preRefactoringReport,
            postRefactoringReport,
            comparison,
            refactoringError
        );

        // Guardar en historial
        this.validationHistory.push(validation);

        // Mostrar resultados
        this.displayValidationResults(validation);

        return validation;
    }

    /**
     * Evaluar los resultados de la refactorización
     */
    evaluateRefactoringResults(componentName, preReport, postReport, comparison, refactoringError) {
        const validation = {
            componentName,
            timestamp: new Date().toISOString(),
            success: false,
            preReport,
            postReport,
            comparison,
            refactoringError,
            issues: [],
            recommendations: []
        };

        // Verificar si hubo error en la refactorización
        if (refactoringError) {
            validation.issues.push(`Refactoring function failed: ${refactoringError.message}`);
            return validation;
        }

        // Verificar tasa de éxito de pruebas
        if (postReport.summary.successRate < 95) {
            validation.issues.push(`Post-refactoring test success rate too low: ${postReport.summary.successRate}%`);
        }

        // Verificar degradación de rendimiento
        if (comparison && comparison.fps.change < -5) {
            validation.issues.push(`Significant FPS degradation: ${comparison.fps.change.toFixed(1)} FPS`);
        }

        // Verificar aumento excesivo de memoria
        if (comparison && comparison.memory.change > 10) {
            validation.issues.push(`Memory usage increased significantly: +${comparison.memory.change.toFixed(1)}MB`);
        }

        // Comparar tiempos de ejecución
        const timeIncrease = postReport.summary.totalTime - preReport.summary.totalTime;
        if (timeIncrease > 50) { // Más de 50ms de aumento
            validation.issues.push(`Test execution time increased: +${timeIncrease.toFixed(1)}ms`);
        }

        // Determinar éxito general
        validation.success = validation.issues.length === 0;

        // Generar recomendaciones
        if (!validation.success) {
            validation.recommendations.push('Review refactoring changes for performance impact');
            validation.recommendations.push('Check for introduced bugs or regressions');
            validation.recommendations.push('Consider reverting changes if issues persist');
        } else {
            validation.recommendations.push('Refactoring successful - consider updating baseline');
            validation.recommendations.push('Document changes for future reference');
        }

        return validation;
    }

    /**
     * Mostrar resultados de validación
     */
    displayValidationResults(validation) {
        console.group(`🔍 VALIDATION RESULTS: ${validation.componentName}`);
        
        if (validation.success) {
            console.log('✅ Refactoring PASSED validation');
        } else {
            console.log('❌ Refactoring FAILED validation');
        }

        console.log(`📊 Pre-refactoring success rate: ${validation.preReport.summary.successRate}%`);
        console.log(`📊 Post-refactoring success rate: ${validation.postReport.summary.successRate}%`);

        if (validation.comparison) {
            console.log(`⚡ FPS change: ${validation.comparison.fps.change > 0 ? '+' : ''}${validation.comparison.fps.change.toFixed(1)}`);
            console.log(`💾 Memory change: ${validation.comparison.memory.change > 0 ? '+' : ''}${validation.comparison.memory.change.toFixed(1)}MB`);
        }

        if (validation.issues.length > 0) {
            console.group('⚠️ Issues Found:');
            validation.issues.forEach(issue => console.log(`- ${issue}`));
            console.groupEnd();
        }

        if (validation.recommendations.length > 0) {
            console.group('💡 Recommendations:');
            validation.recommendations.forEach(rec => console.log(`- ${rec}`));
            console.groupEnd();
        }

        console.groupEnd();
    }

    /**
     * Ejecutar validación rápida (solo pruebas críticas)
     */
    async quickValidation(componentName) {
        if (!this.isInitialized) {
            throw new Error('Test runner not initialized');
        }

        console.log(`⚡ Quick validation for: ${componentName}`);
        
        // Ejecutar solo pruebas críticas
        const criticalTests = [
            'gameEngine_initialization',
            'planet_creation',
            'fleet_creation',
            'navigation_system'
        ];

        const results = [];
        for (const testName of criticalTests) {
            const testFunction = this.testSuite.criticalFunctions.get(testName);
            if (testFunction) {
                const result = await this.testSuite.runSingleTest(testName, testFunction);
                results.push(result);
            }
        }

        const passedTests = results.filter(test => test.passed);
        const successRate = (passedTests.length / results.length * 100).toFixed(1);

        console.log(`⚡ Quick validation result: ${successRate}% (${passedTests.length}/${results.length})`);

        return {
            componentName,
            successRate: parseFloat(successRate),
            passed: successRate >= 95,
            results,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generar reporte de historial de validaciones
     */
    generateValidationHistoryReport() {
        const report = {
            totalValidations: this.validationHistory.length,
            successfulValidations: this.validationHistory.filter(v => v.success).length,
            failedValidations: this.validationHistory.filter(v => !v.success).length,
            componentsRefactored: [...new Set(this.validationHistory.map(v => v.componentName))],
            averageSuccessRate: 0,
            history: this.validationHistory,
            timestamp: new Date().toISOString()
        };

        if (this.validationHistory.length > 0) {
            const totalSuccessRate = this.validationHistory.reduce((sum, v) => 
                sum + v.postReport.summary.successRate, 0);
            report.averageSuccessRate = (totalSuccessRate / this.validationHistory.length).toFixed(1);
        }

        console.group('📊 VALIDATION HISTORY REPORT');
        console.log(`Total validations: ${report.totalValidations}`);
        console.log(`Successful: ${report.successfulValidations}`);
        console.log(`Failed: ${report.failedValidations}`);
        console.log(`Average success rate: ${report.averageSuccessRate}%`);
        console.log(`Components refactored: ${report.componentsRefactored.join(', ')}`);
        console.groupEnd();

        return report;
    }

    /**
     * Limpiar recursos del runner
     */
    cleanup() {
        if (this.testSuite) {
            this.testSuite.cleanup();
        }
        
        this.validationHistory = [];
        this.isInitialized = false;
        
        console.log('🧹 Test runner cleaned up');
    }
}

export default RefactoringTestRunner; 