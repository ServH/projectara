/**
 * 🧪 GALCON GAME - BENCHMARK SUITE
 * Suite de benchmarks para medir rendimiento en diferentes escenarios
 * MILESTONE 2.2: Optimizaciones de Rendimiento
 */

import PerformanceProfiler from './PerformanceProfiler.js';

export class BenchmarkSuite {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.profiler = new PerformanceProfiler();
        
        // Escenarios de test predefinidos
        this.scenarios = {
            light: {
                name: 'Escenario Ligero',
                planets: 10,
                fleets: 5,
                duration: 30000, // 30 segundos
                description: 'Juego básico con pocos objetos'
            },
            medium: {
                name: 'Escenario Medio',
                planets: 25,
                fleets: 15,
                duration: 30000,
                description: 'Juego normal con objetos moderados'
            },
            heavy: {
                name: 'Escenario Pesado',
                planets: 50,
                fleets: 30,
                duration: 30000,
                description: 'Juego intenso con muchos objetos'
            },
            stress: {
                name: 'Test de Estrés',
                planets: 100,
                fleets: 50,
                duration: 60000, // 1 minuto
                description: 'Test extremo para encontrar límites'
            }
        };
        
        // Estado del benchmark
        this.currentScenario = null;
        this.isRunning = false;
        this.results = new Map();
        
        console.log('🧪 BenchmarkSuite inicializado');
    }

    /**
     * Ejecutar benchmark completo
     */
    async runFullBenchmark() {
        console.log('🧪 Iniciando benchmark completo...');
        
        const results = {};
        
        for (const [key, scenario] of Object.entries(this.scenarios)) {
            console.log(`🧪 Ejecutando ${scenario.name}...`);
            
            try {
                const result = await this.runScenario(key);
                results[key] = result;
                
                // Pausa entre escenarios
                await this.delay(2000);
                
            } catch (error) {
                console.error(`❌ Error en escenario ${scenario.name}:`, error);
                results[key] = { error: error.message };
            }
        }
        
        // Generar reporte comparativo
        const report = this.generateComparativeReport(results);
        
        console.log('🧪 Benchmark completo finalizado');
        return report;
    }

    /**
     * Ejecutar escenario específico
     */
    async runScenario(scenarioKey) {
        const scenario = this.scenarios[scenarioKey];
        if (!scenario) {
            throw new Error(`Escenario '${scenarioKey}' no encontrado`);
        }

        console.log(`🧪 Iniciando ${scenario.name} (${scenario.duration/1000}s)`);
        
        this.currentScenario = scenarioKey;
        this.isRunning = true;
        
        // Preparar escenario
        await this.setupScenario(scenario);
        
        // Iniciar profiling
        this.profiler.start();
        this.profiler.startRecording();
        
        // Ejecutar escenario
        const startTime = performance.now();
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const elapsed = performance.now() - startTime;
                
                if (elapsed >= scenario.duration || !this.isRunning) {
                    clearInterval(checkInterval);
                    
                    // Finalizar profiling
                    const recordingData = this.profiler.stopRecording();
                    const report = this.profiler.generateReport();
                    this.profiler.stop();
                    
                    // Limpiar escenario
                    this.cleanupScenario();
                    
                    const result = {
                        scenario: scenario,
                        report: report,
                        recordingData: recordingData,
                        duration: elapsed,
                        completed: true
                    };
                    
                    this.results.set(scenarioKey, result);
                    this.isRunning = false;
                    this.currentScenario = null;
                    
                    console.log(`✅ ${scenario.name} completado`);
                    resolve(result);
                }
            }, 1000); // Check cada segundo
        });
    }

    /**
     * Configurar escenario de test
     */
    async setupScenario(scenario) {
        // Reset del juego
        this.gameEngine.reset();
        
        // Configurar número de planetas
        // Nota: Esto requiere modificar GameEngine para permitir configuración
        if (this.gameEngine.setScenarioConfig) {
            this.gameEngine.setScenarioConfig({
                planetCount: scenario.planets,
                initialFleets: scenario.fleets
            });
        }
        
        // Generar actividad artificial para simular flotas
        this.generateArtificialActivity(scenario);
        
        // Esperar a que se estabilice
        await this.delay(1000);
    }

    /**
     * Generar actividad artificial para el benchmark
     */
    generateArtificialActivity(scenario) {
        // Crear flotas artificiales para simular carga
        const targetFleetCount = scenario.fleets;
        let currentFleets = this.gameEngine.fleets.size;
        
        const activityInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(activityInterval);
                return;
            }
            
            // Mantener número objetivo de flotas
            currentFleets = this.gameEngine.fleets.size;
            
            if (currentFleets < targetFleetCount) {
                // Crear más flotas enviando desde planetas aleatorios
                this.triggerRandomFleetLaunches(targetFleetCount - currentFleets);
            }
            
        }, 2000); // Cada 2 segundos
    }

    /**
     * Lanzar flotas aleatorias para mantener actividad
     */
    triggerRandomFleetLaunches(count) {
        const playerPlanets = Array.from(this.gameEngine.planets.values())
            .filter(p => p.owner === 'player' && p.ships > 10);
        
        const targetPlanets = Array.from(this.gameEngine.planets.values())
            .filter(p => p.owner !== 'player');
        
        if (playerPlanets.length === 0 || targetPlanets.length === 0) return;
        
        for (let i = 0; i < Math.min(count, 5); i++) {
            const fromPlanet = playerPlanets[Math.floor(Math.random() * playerPlanets.length)];
            const toPlanet = targetPlanets[Math.floor(Math.random() * targetPlanets.length)];
            
            if (fromPlanet && toPlanet) {
                // Simular envío de flota
                const ships = Math.floor(fromPlanet.ships * 0.5);
                if (ships > 0) {
                    this.gameEngine.launchFleet(fromPlanet.id, toPlanet.id, ships);
                }
            }
        }
    }

    /**
     * Limpiar escenario
     */
    cleanupScenario() {
        // Reset profiler
        this.profiler.reset();
        
        // Limpiar intervalos si los hay
        // (Los intervalos se limpian automáticamente cuando isRunning = false)
    }

    /**
     * Generar reporte comparativo
     */
    generateComparativeReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalScenarios: Object.keys(results).length,
                successful: 0,
                failed: 0
            },
            scenarios: results,
            comparison: {},
            recommendations: []
        };
        
        // Analizar resultados
        const validResults = Object.entries(results).filter(([key, result]) => !result.error);
        report.summary.successful = validResults.length;
        report.summary.failed = Object.keys(results).length - validResults.length;
        
        if (validResults.length > 0) {
            // Comparar FPS entre escenarios
            report.comparison.fps = {};
            report.comparison.memory = {};
            report.comparison.objects = {};
            
            validResults.forEach(([key, result]) => {
                const perf = result.report.performance;
                const mem = result.report.memory;
                const obj = result.report.objects;
                
                report.comparison.fps[key] = {
                    average: perf.fps.average,
                    min: perf.fps.min,
                    scenario: this.scenarios[key].name
                };
                
                report.comparison.memory[key] = {
                    used: mem.used,
                    usagePercent: mem.usagePercent,
                    scenario: this.scenarios[key].name
                };
                
                report.comparison.objects[key] = {
                    total: obj.total,
                    svgElements: obj.svgElements,
                    scenario: this.scenarios[key].name
                };
            });
            
            // Generar recomendaciones
            report.recommendations = this.generateRecommendations(validResults);
        }
        
        return report;
    }

    /**
     * Generar recomendaciones basadas en resultados
     */
    generateRecommendations(results) {
        const recommendations = [];
        
        // Analizar degradación de FPS
        const fpsData = results.map(([key, result]) => ({
            key,
            fps: result.report.performance.fps.average,
            objects: result.report.objects.total
        })).sort((a, b) => a.objects - b.objects);
        
        if (fpsData.length >= 2) {
            const fpsDropPerObject = (fpsData[0].fps - fpsData[fpsData.length - 1].fps) / 
                                   (fpsData[fpsData.length - 1].objects - fpsData[0].objects);
            
            if (fpsDropPerObject > 0.5) {
                recommendations.push({
                    priority: 'high',
                    issue: 'Degradación significativa de FPS con más objetos',
                    solution: 'Implementar object pooling y culling urgente',
                    impact: `${fpsDropPerObject.toFixed(2)} FPS perdidos por objeto`
                });
            }
        }
        
        // Analizar uso de memoria
        const memoryData = results.map(([key, result]) => result.report.memory.used);
        const maxMemory = Math.max(...memoryData);
        
        if (maxMemory > 100) {
            recommendations.push({
                priority: 'medium',
                issue: `Uso de memoria alto: ${maxMemory}MB`,
                solution: 'Implementar garbage collection automático',
                impact: 'Posible degradación en dispositivos con poca memoria'
            });
        }
        
        // Analizar elementos SVG
        const svgData = results.map(([key, result]) => result.report.objects.svgElements);
        const maxSVG = Math.max(...svgData);
        
        if (maxSVG > 200) {
            recommendations.push({
                priority: 'high',
                issue: `Muchos elementos SVG: ${maxSVG}`,
                solution: 'Implementar SVG pooling y culling',
                impact: 'Impacto directo en rendimiento de renderizado'
            });
        }
        
        return recommendations;
    }

    /**
     * Detener benchmark actual
     */
    stop() {
        this.isRunning = false;
        this.profiler.stop();
        console.log('🧪 Benchmark detenido');
    }

    /**
     * Obtener resultados guardados
     */
    getResults() {
        return this.results;
    }

    /**
     * Exportar resultados a JSON
     */
    exportResults() {
        const data = {
            timestamp: new Date().toISOString(),
            scenarios: this.scenarios,
            results: Object.fromEntries(this.results)
        };
        
        return JSON.stringify(data, null, 2);
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Destruir benchmark suite
     */
    destroy() {
        this.stop();
        this.profiler.destroy();
        this.results.clear();
        console.log('💥 BenchmarkSuite destruido');
    }
}

export default BenchmarkSuite; 