/**
 * ⚙️ SYSTEM INITIALIZATION MANAGER
 * Gestiona la inicialización ordenada de sistemas del juego
 * Patrón: Chain of Responsibility
 */

export class SystemInitializationManager {
    constructor(config = {}) {
        this.config = {
            enableValidation: true,
            enableMetrics: true,
            timeoutPerSystem: 5000,
            retryAttempts: 2,
            ...config
        };
        
        // Estado de inicialización
        this.systems = new Map();
        this.initializationChain = [];
        this.initializationOrder = [];
        this.currentStep = 0;
        
        // Métricas
        this.metrics = {
            totalSystems: 0,
            initializedSystems: 0,
            failedSystems: 0,
            totalTime: 0,
            systemTimes: new Map(),
            errors: []
        };
        
        // Referencias de sistemas
        this.gameEngine = null;
        this.renderer = null;
        this.selectionSystem = null;
        this.dragDropHandler = null;
        this.hudManager = null;
        
        this.init();
    }

    /**
     * Inicializa el gestor
     */
    init() {
        this.setupInitializationChain();
        console.log('⚙️ SystemInitializationManager inicializado');
    }

    /**
     * Configura la cadena de inicialización
     */
    setupInitializationChain() {
        this.initializationChain = [
            {
                name: 'GameEngine',
                handler: this.initializeGameEngine.bind(this),
                dependencies: [],
                timeout: this.config.timeoutPerSystem
            },
            {
                name: 'CanvasRenderer',
                handler: this.initializeRenderer.bind(this),
                dependencies: ['GameEngine'],
                timeout: this.config.timeoutPerSystem
            },
            {
                name: 'NavigationConnection',
                handler: this.connectNavigationSystem.bind(this),
                dependencies: ['GameEngine', 'CanvasRenderer'],
                timeout: this.config.timeoutPerSystem
            },
            {
                name: 'SelectionSystem',
                handler: this.initializeSelectionSystem.bind(this),
                dependencies: ['GameEngine', 'CanvasRenderer'],
                timeout: this.config.timeoutPerSystem
            },
            {
                name: 'DragDropHandler',
                handler: this.initializeDragDropHandler.bind(this),
                dependencies: ['GameEngine', 'SelectionSystem'],
                timeout: this.config.timeoutPerSystem
            },
            {
                name: 'HUDManager',
                handler: this.initializeHUDManager.bind(this),
                dependencies: ['GameEngine', 'SelectionSystem', 'DragDropHandler'],
                timeout: this.config.timeoutPerSystem
            }
        ];
    }

    /**
     * Ejecuta la inicialización completa de sistemas
     * @param {Object} modules - Módulos cargados
     * @returns {Promise<Object>} Sistemas inicializados
     */
    async initializeSystems(modules) {
        const startTime = performance.now();
        this.metrics.totalSystems = this.initializationChain.length;
        
        try {
            console.log('⚙️ Iniciando inicialización de sistemas...');
            
            for (let i = 0; i < this.initializationChain.length; i++) {
                const step = this.initializationChain[i];
                this.currentStep = i;
                
                await this.executeInitializationStep(step, modules);
            }
            
            this.metrics.totalTime = performance.now() - startTime;
            console.log(`⚙️ Todos los sistemas inicializados (${this.metrics.totalTime.toFixed(2)}ms)`);
            
            return this.getInitializedSystems();
            
        } catch (error) {
            this.metrics.errors.push({
                step: this.currentStep,
                system: this.initializationChain[this.currentStep]?.name,
                error: error.message,
                timestamp: Date.now()
            });
            
            console.error('⚙️ Error en inicialización de sistemas:', error);
            throw error;
        }
    }

    /**
     * Ejecuta un paso de inicialización
     * @param {Object} step - Paso de inicialización
     * @param {Object} modules - Módulos disponibles
     */
    async executeInitializationStep(step, modules) {
        const stepStartTime = performance.now();
        
        try {
            console.log(`⚙️ Inicializando ${step.name}...`);
            
            // Verificar dependencias
            if (this.config.enableValidation) {
                this.validateDependencies(step);
            }
            
            // Ejecutar inicialización con timeout
            await this.executeWithTimeout(step.handler, modules, step.timeout);
            
            // Registrar éxito
            const stepTime = performance.now() - stepStartTime;
            this.metrics.systemTimes.set(step.name, stepTime);
            this.metrics.initializedSystems++;
            this.initializationOrder.push(step.name);
            
            console.log(`⚙️ ${step.name} inicializado (${stepTime.toFixed(2)}ms)`);
            
        } catch (error) {
            this.metrics.failedSystems++;
            throw new Error(`Failed to initialize ${step.name}: ${error.message}`);
        }
    }

    /**
     * Ejecuta una función con timeout
     * @param {Function} handler - Función a ejecutar
     * @param {*} args - Argumentos
     * @param {number} timeout - Timeout en ms
     */
    async executeWithTimeout(handler, args, timeout) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Initialization timeout (${timeout}ms)`));
            }, timeout);
            
            Promise.resolve(handler(args))
                .then(result => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Valida dependencias de un paso
     * @param {Object} step - Paso a validar
     */
    validateDependencies(step) {
        for (const dependency of step.dependencies) {
            if (!this.systems.has(dependency)) {
                throw new Error(`Dependency ${dependency} not available for ${step.name}`);
            }
        }
    }

    /**
     * Inicializa el GameEngine
     * @param {Object} modules - Módulos cargados
     */
    async initializeGameEngine(modules) {
        const GameEngine = modules.GameEngine?.default || modules.GameEngine;
        if (!GameEngine) {
            throw new Error('GameEngine module not found');
        }
        
        this.gameEngine = new GameEngine();
        this.gameEngine.init();
        
        this.systems.set('GameEngine', this.gameEngine);
        console.log('⚙️ GameEngine inicializado y configurado');
    }

    /**
     * Inicializa el CanvasRenderer
     * @param {Object} modules - Módulos cargados
     */
    async initializeRenderer(modules) {
        // Corregir acceso al módulo CanvasRenderer
        const CanvasRendererModule = modules.CanvasRenderer;
        const CanvasRenderer = CanvasRendererModule?.CanvasRenderer || CanvasRendererModule?.default || CanvasRendererModule;
        
        if (!CanvasRenderer) {
            throw new Error('CanvasRenderer module not found');
        }
        
        if (typeof CanvasRenderer !== 'function') {
            throw new Error(`CanvasRenderer is not a constructor: ${typeof CanvasRenderer}`);
        }
        
        if (!this.gameEngine) {
            throw new Error('GameEngine required for CanvasRenderer');
        }
        
        this.renderer = new CanvasRenderer(this.gameEngine);
        this.renderer.start();
        
        this.systems.set('CanvasRenderer', this.renderer);
        console.log('⚙️ CanvasRenderer inicializado y iniciado');
    }

    /**
     * Conecta el NavigationSystem al renderer
     */
    async connectNavigationSystem() {
        if (!this.gameEngine || !this.renderer) {
            throw new Error('GameEngine and CanvasRenderer required for navigation connection');
        }
        
        this.gameEngine.connectNavigationRenderer(this.renderer);
        
        this.systems.set('NavigationConnection', true);
        console.log('⚙️ NavigationSystem conectado al renderer');
    }

    /**
     * Inicializa el SelectionSystem
     * @param {Object} modules - Módulos cargados
     */
    async initializeSelectionSystem(modules) {
        const SelectionSystem = modules.SelectionSystem?.default || modules.SelectionSystem;
        if (!SelectionSystem) {
            throw new Error('SelectionSystem module not found');
        }
        
        if (!this.gameEngine) {
            throw new Error('GameEngine required for SelectionSystem');
        }
        
        this.selectionSystem = new SelectionSystem(this.gameEngine);
        
        this.systems.set('SelectionSystem', this.selectionSystem);
        console.log('⚙️ SelectionSystem inicializado');
    }

    /**
     * Inicializa el DragDropHandler
     * @param {Object} modules - Módulos cargados
     */
    async initializeDragDropHandler(modules) {
        const DragDropHandler = modules.DragDropHandler?.default || modules.DragDropHandler;
        if (!DragDropHandler) {
            throw new Error('DragDropHandler module not found');
        }
        
        if (!this.gameEngine || !this.selectionSystem) {
            throw new Error('GameEngine and SelectionSystem required for DragDropHandler');
        }
        
        this.dragDropHandler = new DragDropHandler(this.gameEngine, this.selectionSystem);
        
        this.systems.set('DragDropHandler', this.dragDropHandler);
        console.log('⚙️ DragDropHandler inicializado');
    }

    /**
     * Inicializa el HUDManager
     * @param {Object} modules - Módulos cargados
     */
    async initializeHUDManager(modules) {
        const HUDManager = modules.HUDManager?.default || modules.HUDManager;
        if (!HUDManager) {
            throw new Error('HUDManager module not found');
        }
        
        if (!this.gameEngine || !this.selectionSystem || !this.dragDropHandler) {
            throw new Error('GameEngine, SelectionSystem and DragDropHandler required for HUDManager');
        }
        
        this.hudManager = new HUDManager(this.gameEngine, this.selectionSystem, this.dragDropHandler);
        this.hudManager.start();
        
        this.systems.set('HUDManager', this.hudManager);
        console.log('⚙️ HUDManager inicializado y iniciado');
    }

    /**
     * Obtiene todos los sistemas inicializados
     * @returns {Object} Sistemas inicializados
     */
    getInitializedSystems() {
        return {
            gameEngine: this.gameEngine,
            renderer: this.renderer,
            selectionSystem: this.selectionSystem,
            dragDropHandler: this.dragDropHandler,
            hudManager: this.hudManager
        };
    }

    /**
     * Obtiene un sistema específico
     * @param {string} systemName - Nombre del sistema
     * @returns {*} Sistema solicitado
     */
    getSystem(systemName) {
        return this.systems.get(systemName);
    }

    /**
     * Verifica si un sistema está inicializado
     * @param {string} systemName - Nombre del sistema
     * @returns {boolean} True si está inicializado
     */
    isSystemInitialized(systemName) {
        return this.systems.has(systemName);
    }

    /**
     * Obtiene el progreso de inicialización
     * @returns {Object} Progreso actual
     */
    getProgress() {
        return {
            currentStep: this.currentStep,
            totalSteps: this.initializationChain.length,
            percentage: (this.currentStep / this.initializationChain.length) * 100,
            currentSystem: this.initializationChain[this.currentStep]?.name || 'Completed'
        };
    }

    /**
     * Obtiene métricas de inicialización
     * @returns {Object} Métricas detalladas
     */
    getMetrics() {
        const successRate = this.metrics.totalSystems > 0 ? 
            (this.metrics.initializedSystems / this.metrics.totalSystems) * 100 : 0;
        
        return {
            ...this.metrics,
            successRate,
            averageTime: this.metrics.initializedSystems > 0 ? 
                this.metrics.totalTime / this.metrics.initializedSystems : 0,
            initializationOrder: [...this.initializationOrder]
        };
    }

    /**
     * Genera reporte de inicialización
     * @returns {Object} Reporte detallado
     */
    generateReport() {
        const metrics = this.getMetrics();
        
        return {
            summary: {
                totalSystems: metrics.totalSystems,
                initializedSystems: metrics.initializedSystems,
                failedSystems: metrics.failedSystems,
                successRate: `${metrics.successRate.toFixed(2)}%`,
                totalTime: `${metrics.totalTime.toFixed(2)}ms`
            },
            performance: {
                averageTime: `${metrics.averageTime.toFixed(2)}ms`,
                systemTimes: Object.fromEntries(this.metrics.systemTimes),
                initializationOrder: metrics.initializationOrder
            },
            systems: {
                initialized: Array.from(this.systems.keys()),
                available: Object.keys(this.getInitializedSystems())
            },
            errors: metrics.errors
        };
    }

    /**
     * Configura opciones del gestor
     * @param {Object} newConfig - Nueva configuración
     */
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Reconfigurar timeouts si es necesario
        if (newConfig.timeoutPerSystem) {
            this.initializationChain.forEach(step => {
                step.timeout = newConfig.timeoutPerSystem;
            });
        }
    }

    /**
     * Resetea el estado del gestor
     */
    reset() {
        this.systems.clear();
        this.initializationOrder = [];
        this.currentStep = 0;
        this.metrics = {
            totalSystems: 0,
            initializedSystems: 0,
            failedSystems: 0,
            totalTime: 0,
            systemTimes: new Map(),
            errors: []
        };
        
        // Limpiar referencias
        this.gameEngine = null;
        this.renderer = null;
        this.selectionSystem = null;
        this.dragDropHandler = null;
        this.hudManager = null;
        
        console.log('⚙️ SystemInitializationManager reseteado');
    }

    /**
     * Limpia recursos
     */
    destroy() {
        this.reset();
        console.log('⚙️ SystemInitializationManager destruido');
    }
}

export default SystemInitializationManager; 