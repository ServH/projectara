/**
 * 📊 BENCHMARK CONFIGURATION
 * Configuraciones para tests automatizados y comparación de optimizaciones
 */

export const BenchmarkConfig = {
    // 🎯 Escenarios de testing
    scenarios: {
        light: {
            name: "Light Load",
            fleetCount: 500,
            duration: 30000, // 30 segundos
            speedMultiplier: 1.0,
            pattern: 'random',
            description: "Escenario básico para validar optimizaciones"
        },
        
        medium: {
            name: "Medium Load", 
            fleetCount: 1000,
            duration: 45000,
            speedMultiplier: 1.2,
            pattern: 'clusters',
            description: "Carga media típica del juego"
        },
        
        heavy: {
            name: "Heavy Load",
            fleetCount: 2000,
            duration: 60000,
            speedMultiplier: 1.5,
            pattern: 'grid',
            description: "Carga pesada para stress testing"
        },
        
        extreme: {
            name: "Extreme Load",
            fleetCount: 3000,
            duration: 30000,
            speedMultiplier: 2.0,
            pattern: 'spiral',
            description: "Límite superior de rendimiento"
        },
        
        insane: {
            name: "Insane Load",
            fleetCount: 5000,
            duration: 15000,
            speedMultiplier: 2.5,
            pattern: 'lines',
            description: "Test de ruptura del sistema"
        }
    },

    // ⚡ Configuraciones de optimización
    optimizationSets: {
        baseline: {
            name: "Baseline (Sin optimizaciones)",
            techniques: {
                pooling: false,
                culling: false,
                lod: false,
                batching: false,
                spatial: false,
                adaptive: false,
                canvas: true,
                workers: false
            },
            settings: {
                cullingDistance: 0,
                lodThreshold: 0
            }
        },

        basic: {
            name: "Optimizaciones Básicas",
            techniques: {
                pooling: true,
                culling: true,
                lod: false,
                batching: false,
                spatial: false,
                adaptive: false,
                canvas: true,
                workers: false
            },
            settings: {
                cullingDistance: 200,
                lodThreshold: 300
            }
        },

        intermediate: {
            name: "Optimizaciones Intermedias",
            techniques: {
                pooling: true,
                culling: true,
                lod: true,
                batching: true,
                spatial: false,
                adaptive: false,
                canvas: true,
                workers: false
            },
            settings: {
                cullingDistance: 250,
                lodThreshold: 400
            }
        },

        advanced: {
            name: "Optimizaciones Avanzadas",
            techniques: {
                pooling: true,
                culling: true,
                lod: true,
                batching: true,
                spatial: true,
                adaptive: false,
                canvas: true,
                workers: false
            },
            settings: {
                cullingDistance: 300,
                lodThreshold: 500
            }
        },

        maximum: {
            name: "Máximas Optimizaciones",
            techniques: {
                pooling: true,
                culling: true,
                lod: true,
                batching: true,
                spatial: true,
                adaptive: true,
                canvas: true,
                workers: true
            },
            settings: {
                cullingDistance: 350,
                lodThreshold: 600
            }
        }
    },

    // 📈 Métricas a medir
    metrics: {
        fps: {
            name: "FPS",
            unit: "fps",
            target: 60,
            minimum: 30,
            weight: 0.4 // Importancia en score final
        },
        
        frameTime: {
            name: "Frame Time",
            unit: "ms",
            target: 16.67, // 60 FPS
            maximum: 33.33, // 30 FPS
            weight: 0.3
        },
        
        renderTime: {
            name: "Render Time",
            unit: "ms",
            target: 8,
            maximum: 20,
            weight: 0.15
        },
        
        updateTime: {
            name: "Update Time", 
            unit: "ms",
            target: 5,
            maximum: 15,
            weight: 0.15
        },
        
        memoryUsage: {
            name: "Memory Usage",
            unit: "MB",
            target: 50,
            maximum: 200,
            weight: 0.1
        },
        
        visibleObjects: {
            name: "Visible Objects",
            unit: "count",
            weight: 0.05
        }
    },

    // 🧪 Tests automatizados
    automatedTests: [
        {
            name: "Baseline Performance",
            scenario: "medium",
            optimization: "baseline",
            expectedFPS: { min: 20, target: 30 },
            description: "Rendimiento sin optimizaciones"
        },
        
        {
            name: "Basic Optimizations Impact",
            scenario: "medium", 
            optimization: "basic",
            expectedFPS: { min: 35, target: 45 },
            description: "Impacto de culling y pooling"
        },
        
        {
            name: "LOD System Effectiveness",
            scenario: "heavy",
            optimization: "intermediate",
            expectedFPS: { min: 25, target: 35 },
            description: "Efectividad del sistema LOD"
        },
        
        {
            name: "Spatial Grid Performance",
            scenario: "extreme",
            optimization: "advanced",
            expectedFPS: { min: 20, target: 30 },
            description: "Rendimiento con spatial grid"
        },
        
        {
            name: "Maximum Load Handling",
            scenario: "insane",
            optimization: "maximum",
            expectedFPS: { min: 15, target: 25 },
            description: "Manejo de carga máxima"
        }
    ],

    // 📊 Configuración de reportes
    reporting: {
        sampleInterval: 100, // ms entre muestras
        warmupTime: 5000,    // ms de calentamiento
        stabilizationTime: 3000, // ms para estabilizar métricas
        
        charts: {
            fps: {
                color: '#00ff88',
                warningThreshold: 30,
                criticalThreshold: 15
            },
            frameTime: {
                color: '#ffaa00',
                warningThreshold: 25,
                criticalThreshold: 50
            },
            memory: {
                color: '#0088ff',
                warningThreshold: 100,
                criticalThreshold: 150
            }
        },
        
        export: {
            formats: ['json', 'csv', 'html'],
            includeCharts: true,
            includeRawData: false
        }
    },

    // 🎛️ Configuraciones específicas por técnica
    techniqueSettings: {
        pooling: {
            maxPoolSize: 10000,
            preAllocate: 1000
        },
        
        culling: {
            marginSizes: [100, 200, 300, 400, 500],
            adaptiveMargin: true
        },
        
        lod: {
            thresholds: [
                [200, 400, 800],   // Agresivo
                [300, 600, 1000],  // Balanceado
                [400, 800, 1200]   // Conservador
            ],
            adaptiveThresholds: true
        },
        
        spatial: {
            cellSizes: [100, 150, 200, 250, 300],
            dynamicResize: true
        },
        
        adaptive: {
            targetFPS: [30, 45, 60],
            adjustmentRates: [0.02, 0.05, 0.1],
            qualityLevels: 5
        },
        
        workers: {
            workerCount: [1, 2, 4],
            taskSplitting: ['none', 'spatial', 'count'],
            batchSizes: [100, 250, 500, 1000]
        }
    }
};

// 🔧 Utilidades para benchmarking
export class BenchmarkRunner {
    constructor() {
        this.results = [];
        this.currentTest = null;
        this.isRunning = false;
    }

    async runSingleTest(scenario, optimization, duration = 30000) {
        console.log(`🧪 Running test: ${scenario} with ${optimization}`);
        
        const testConfig = {
            scenario: BenchmarkConfig.scenarios[scenario],
            optimization: BenchmarkConfig.optimizationSets[optimization],
            startTime: performance.now(),
            duration: duration
        };

        const metrics = await this.collectMetrics(testConfig);
        const score = this.calculateScore(metrics);
        
        const result = {
            id: `${scenario}_${optimization}_${Date.now()}`,
            scenario: scenario,
            optimization: optimization,
            metrics: metrics,
            score: score,
            timestamp: new Date().toISOString(),
            duration: duration
        };

        this.results.push(result);
        return result;
    }

    async runComparisonTest(scenario, optimizations) {
        const results = [];
        
        for (const optimization of optimizations) {
            const result = await this.runSingleTest(scenario, optimization);
            results.push(result);
            
            // Pausa entre tests para estabilizar
            await this.wait(2000);
        }

        return this.generateComparison(results);
    }

    async runFullSuite() {
        console.log('🚀 Running full benchmark suite...');
        
        const suiteResults = [];
        
        for (const test of BenchmarkConfig.automatedTests) {
            const result = await this.runSingleTest(
                test.scenario, 
                test.optimization,
                BenchmarkConfig.scenarios[test.scenario].duration
            );
            
            result.testName = test.name;
            result.expected = test.expectedFPS;
            result.passed = this.evaluateTest(result, test);
            
            suiteResults.push(result);
            
            console.log(`✅ ${test.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
            
            await this.wait(3000);
        }

        return this.generateSuiteReport(suiteResults);
    }

    calculateScore(metrics) {
        let totalScore = 0;
        let totalWeight = 0;

        Object.entries(BenchmarkConfig.metrics).forEach(([key, config]) => {
            if (metrics[key] !== undefined) {
                const value = metrics[key].average || metrics[key];
                let score = 0;

                if (config.target) {
                    // Métrica donde más alto es mejor (FPS)
                    score = Math.min(100, (value / config.target) * 100);
                } else if (config.maximum) {
                    // Métrica donde más bajo es mejor (tiempo, memoria)
                    score = Math.max(0, 100 - ((value / config.maximum) * 100));
                }

                totalScore += score * config.weight;
                totalWeight += config.weight;
            }
        });

        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    }

    evaluateTest(result, testConfig) {
        const fps = result.metrics.fps.average;
        return fps >= testConfig.expectedFPS.min;
    }

    generateComparison(results) {
        const comparison = {
            timestamp: new Date().toISOString(),
            scenario: results[0]?.scenario,
            results: results,
            winner: null,
            improvements: {}
        };

        // Encontrar el mejor resultado
        let bestScore = -1;
        results.forEach(result => {
            if (result.score > bestScore) {
                bestScore = result.score;
                comparison.winner = result.optimization;
            }
        });

        // Calcular mejoras relativas
        const baseline = results.find(r => r.optimization === 'baseline');
        if (baseline) {
            results.forEach(result => {
                if (result.optimization !== 'baseline') {
                    comparison.improvements[result.optimization] = {
                        fpsImprovement: ((result.metrics.fps.average - baseline.metrics.fps.average) / baseline.metrics.fps.average * 100).toFixed(1),
                        scoreImprovement: result.score - baseline.score
                    };
                }
            });
        }

        return comparison;
    }

    generateSuiteReport(results) {
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        
        return {
            timestamp: new Date().toISOString(),
            summary: {
                total: total,
                passed: passed,
                failed: total - passed,
                successRate: ((passed / total) * 100).toFixed(1)
            },
            results: results,
            recommendations: this.generateRecommendations(results)
        };
    }

    generateRecommendations(results) {
        const recommendations = [];
        
        // Analizar patrones en los resultados
        const avgScores = {};
        results.forEach(result => {
            if (!avgScores[result.optimization]) {
                avgScores[result.optimization] = [];
            }
            avgScores[result.optimization].push(result.score);
        });

        // Recomendar mejores configuraciones
        Object.entries(avgScores).forEach(([optimization, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            if (avg > 70) {
                recommendations.push(`✅ ${optimization} muestra buen rendimiento (${avg.toFixed(1)} puntos)`);
            } else if (avg < 40) {
                recommendations.push(`⚠️ ${optimization} necesita mejoras (${avg.toFixed(1)} puntos)`);
            }
        });

        return recommendations;
    }

    async collectMetrics(testConfig) {
        // Esta función sería implementada por el laboratorio
        // Aquí solo definimos la estructura esperada
        return {
            fps: { average: 0, min: 0, max: 0, samples: [] },
            frameTime: { average: 0, min: 0, max: 0, samples: [] },
            renderTime: { average: 0, min: 0, max: 0, samples: [] },
            updateTime: { average: 0, min: 0, max: 0, samples: [] },
            memoryUsage: { average: 0, min: 0, max: 0, samples: [] },
            visibleObjects: { average: 0, min: 0, max: 0, samples: [] }
        };
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    exportResults(format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(this.results, null, 2);
            
            case 'csv':
                return this.resultsToCSV();
            
            case 'html':
                return this.resultsToHTML();
            
            default:
                return this.results;
        }
    }

    resultsToCSV() {
        if (this.results.length === 0) return '';
        
        const headers = ['Scenario', 'Optimization', 'Score', 'FPS', 'Frame Time', 'Render Time', 'Memory'];
        const rows = this.results.map(result => [
            result.scenario,
            result.optimization,
            result.score,
            result.metrics.fps.average.toFixed(2),
            result.metrics.frameTime.average.toFixed(2),
            result.metrics.renderTime.average.toFixed(2),
            result.metrics.memoryUsage.average.toFixed(2)
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    resultsToHTML() {
        // Generar reporte HTML básico
        let html = `
        <html>
        <head><title>Benchmark Results</title></head>
        <body>
        <h1>🧪 Fleet Optimization Benchmark Results</h1>
        <table border="1">
        <tr><th>Scenario</th><th>Optimization</th><th>Score</th><th>FPS</th><th>Status</th></tr>
        `;

        this.results.forEach(result => {
            const status = result.score > 70 ? '✅ Good' : result.score > 40 ? '⚠️ Fair' : '❌ Poor';
            html += `
            <tr>
                <td>${result.scenario}</td>
                <td>${result.optimization}</td>
                <td>${result.score}</td>
                <td>${result.metrics.fps.average.toFixed(1)}</td>
                <td>${status}</td>
            </tr>`;
        });

        html += '</table></body></html>';
        return html;
    }
}

export default BenchmarkConfig; 