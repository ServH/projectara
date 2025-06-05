/**
 * 🔧 DEBUG TOOLS MANAGER
 * Gestiona herramientas de debug y profiling
 * Patrón: Strategy Pattern
 */

export class DebugToolsManager {
    constructor(config = {}) {
        this.config = {
            enableProfiling: true,
            enableBenchmarks: true,
            enableDebugPanel: true,
            ...config
        };
        
        this.gameEngine = null;
        this.debugPanel = null;
        this.activeTools = new Set();
        
        console.log('🔧 DebugToolsManager inicializado');
    }

    initialize(gameEngine) {
        this.gameEngine = gameEngine;
        console.log('🔧 Debug tools inicializadas');
    }

    async toggleDebugPanel() {
        try {
            const { default: DebugPanel } = await import('../DebugPanel.js');
            
            if (!this.debugPanel) {
                this.debugPanel = new DebugPanel(this.gameEngine);
            }
            
            this.debugPanel.toggle();
        } catch (error) {
            console.error('🔧 Error con DebugPanel:', error);
        }
    }

    toggleProfiling() {
        const profiler = this.gameEngine?.performanceProfiler;
        if (!profiler) return;
        
        if (profiler.isRecording) {
            profiler.stopRecording();
            console.log('📊 Profiling detenido');
        } else {
            profiler.startRecording();
            console.log('📊 Profiling iniciado');
        }
    }

    resetProfiler() {
        this.gameEngine?.performanceProfiler?.reset();
        console.log('📊 Profiler reseteado');
    }

    generatePerformanceReport() {
        const report = this.gameEngine?.getPerformanceReport();
        if (report) {
            console.log('📊 Reporte generado:', report);
        }
        return report;
    }

    async runBenchmark(type = 'light') {
        try {
            const { default: BenchmarkSuite } = await import('../../debug/BenchmarkSuite.js');
            const benchmark = new BenchmarkSuite(this.gameEngine);
            
            const result = type === 'full' ? 
                await benchmark.runFullBenchmark() : 
                await benchmark.runScenario(type);
            
            benchmark.destroy();
            console.log(`🧪 Benchmark ${type} completado:`, result);
            return result;
        } catch (error) {
            console.error(`🧪 Error en benchmark:`, error);
        }
    }

    getActiveTools() {
        return Array.from(this.activeTools);
    }

    destroy() {
        this.activeTools.clear();
        this.gameEngine = null;
        this.debugPanel = null;
        console.log('🔧 DebugToolsManager destruido');
    }
}

export default DebugToolsManager; 