/**
 * 🎮 GLOBAL CONTROLS MANAGER
 * Gestiona controles globales y shortcuts del juego
 * Patrón: Command Pattern
 */

export class GlobalControlsManager {
    constructor(config = {}) {
        this.config = {
            enableKeyboardShortcuts: true,
            enableDebugCommands: true,
            preventDefaults: true,
            ...config
        };
        
        this.commands = new Map();
        this.keyBindings = new Map();
        this.isActive = false;
        this.eventListeners = new Map();
        
        // Referencias de sistemas
        this.gameEngine = null;
        this.selectionSystem = null;
        this.debugPanel = null;
        
        this.init();
    }

    /**
     * Inicializa el gestor
     */
    init() {
        this.setupDefaultCommands();
        this.setupDefaultKeyBindings();
        console.log('🎮 GlobalControlsManager inicializado');
    }

    /**
     * Configura comandos por defecto
     */
    setupDefaultCommands() {
        this.registerCommand('toggleDebugPanel', () => this.toggleDebugPanel());
        this.registerCommand('generatePerformanceReport', () => this.generatePerformanceReport());
        this.registerCommand('toggleProfiling', () => this.toggleProfiling());
        this.registerCommand('resetProfiler', () => this.resetProfiler());
        this.registerCommand('resetGame', () => this.resetGame());
        this.registerCommand('runLightBenchmark', () => this.runLightBenchmark());
        this.registerCommand('runFullBenchmark', () => this.runFullBenchmark());
        this.registerCommand('clearSelection', () => this.clearSelection());
        this.registerCommand('selectAll', () => this.selectAll());
    }

    /**
     * Configura key bindings por defecto
     */
    setupDefaultKeyBindings() {
        this.bindKey('F1', 'toggleDebugPanel');
        this.bindKey('F2', 'generatePerformanceReport');
        this.bindKey('F3', 'toggleProfiling');
        this.bindKey('F4', 'resetProfiler');
        this.bindKey('F5', 'resetGame');
        this.bindKey('F6', 'runLightBenchmark');
        this.bindKey('F7', 'runFullBenchmark');
        this.bindKey('Escape', 'clearSelection');
        this.bindKey('Ctrl+A', 'selectAll');
        this.bindKey('Meta+A', 'selectAll');
    }

    /**
     * Activa los controles globales
     * @param {Object} systems - Sistemas del juego
     */
    activate(systems = {}) {
        if (this.isActive) return;
        
        this.gameEngine = systems.gameEngine;
        this.selectionSystem = systems.selectionSystem;
        
        this.setupEventListeners();
        this.isActive = true;
        console.log('🎮 Controles globales activados');
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        const keydownHandler = (event) => this.handleKeyDown(event);
        document.addEventListener('keydown', keydownHandler);
        this.eventListeners.set('keydown', keydownHandler);
    }

    /**
     * Maneja eventos de tecla presionada
     * @param {KeyboardEvent} event - Evento de teclado
     */
    handleKeyDown(event) {
        const keyCombo = this.createKeyCombo(event);
        const commandName = this.keyBindings.get(keyCombo);
        
        if (commandName) {
            if (this.config.preventDefaults) {
                event.preventDefault();
            }
            this.executeCommand(commandName);
        }
    }

    /**
     * Crea string de combinación de teclas
     * @param {KeyboardEvent} event - Evento de teclado
     * @returns {string} Combinación de teclas
     */
    createKeyCombo(event) {
        const parts = [];
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.metaKey) parts.push('Meta');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');
        parts.push(event.key);
        return parts.join('+');
    }

    /**
     * Registra un comando
     * @param {string} name - Nombre del comando
     * @param {Function} execute - Función que ejecuta el comando
     */
    registerCommand(name, execute) {
        this.commands.set(name, { execute });
    }

    /**
     * Vincula una tecla a un comando
     * @param {string} keyCombo - Combinación de teclas
     * @param {string} commandName - Nombre del comando
     */
    bindKey(keyCombo, commandName) {
        this.keyBindings.set(keyCombo, commandName);
    }

    /**
     * Ejecuta un comando
     * @param {string} commandName - Nombre del comando
     */
    async executeCommand(commandName) {
        const command = this.commands.get(commandName);
        if (!command) return;
        
        try {
            await command.execute();
        } catch (error) {
            console.error(`🎮 Error ejecutando comando ${commandName}:`, error);
        }
    }

    /**
     * Toggle debug panel
     */
    async toggleDebugPanel() {
        try {
            const { default: DebugPanel } = await import('../DebugPanel.js');
            if (!this.debugPanel) {
                this.debugPanel = new DebugPanel(this.gameEngine);
            }
            this.debugPanel.toggle();
        } catch (error) {
            console.error('🎮 Error cargando DebugPanel:', error);
        }
    }

    /**
     * Genera reporte de rendimiento
     */
    generatePerformanceReport() {
        const report = this.gameEngine?.getPerformanceReport();
        if (report) {
            console.log('📊 REPORTE DE RENDIMIENTO:', report);
        }
    }

    /**
     * Toggle profiling
     */
    toggleProfiling() {
        const profiler = this.gameEngine?.performanceProfiler;
        if (!profiler) return;
        
        if (profiler.isRecording) {
            profiler.stopRecording();
            console.log('📊 Grabación detenida');
        } else {
            profiler.startRecording();
            console.log('📊 Grabación iniciada');
        }
    }

    /**
     * Reset profiler
     */
    resetProfiler() {
        this.gameEngine?.performanceProfiler?.reset();
        console.log('📊 Profiler reseteado');
    }

    /**
     * Reset game
     */
    resetGame() {
        this.gameEngine?.reset();
        console.log('🎮 Juego reseteado');
    }

    /**
     * Run light benchmark
     */
    async runLightBenchmark() {
        try {
            const { default: BenchmarkSuite } = await import('../../debug/BenchmarkSuite.js');
            const benchmark = new BenchmarkSuite(this.gameEngine);
            const result = await benchmark.runScenario('light');
            console.log('🧪 Benchmark ligero completado:', result);
            benchmark.destroy();
        } catch (error) {
            console.error('❌ Error en benchmark:', error);
        }
    }

    /**
     * Run full benchmark
     */
    async runFullBenchmark() {
        try {
            const { default: BenchmarkSuite } = await import('../../debug/BenchmarkSuite.js');
            const benchmark = new BenchmarkSuite(this.gameEngine);
            const report = await benchmark.runFullBenchmark();
            console.log('🧪 Benchmark completo:', report);
            benchmark.destroy();
        } catch (error) {
            console.error('❌ Error en benchmark:', error);
        }
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectionSystem?.clearSelection();
    }

    /**
     * Select all
     */
    selectAll() {
        this.selectionSystem?.selectAll();
    }

    /**
     * Desactiva los controles globales
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.eventListeners.forEach((listener, event) => {
            document.removeEventListener(event, listener);
        });
        this.eventListeners.clear();
        this.isActive = false;
    }

    /**
     * Limpia recursos
     */
    destroy() {
        this.deactivate();
        this.commands.clear();
        this.keyBindings.clear();
        this.gameEngine = null;
        this.selectionSystem = null;
        this.debugPanel = null;
        console.log('🎮 GlobalControlsManager destruido');
    }
}

export default GlobalControlsManager; 