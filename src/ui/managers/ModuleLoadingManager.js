/**
 * 📦 MODULE LOADING MANAGER
 * Gestiona la carga dinámica de módulos con optimizaciones y cache
 * Patrón: Factory Pattern + Dependency Injection
 */

export class ModuleLoadingManager {
    constructor(config = {}) {
        this.config = {
            enableCache: true,
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 10000,
            preloadModules: [],
            ...config
        };
        
        // Cache de módulos cargados
        this.moduleCache = new Map();
        this.loadingPromises = new Map();
        this.loadOrder = [];
        this.dependencies = new Map();
        
        // Métricas de carga
        this.metrics = {
            totalModules: 0,
            loadedModules: 0,
            failedModules: 0,
            cacheHits: 0,
            loadTimes: new Map()
        };
        
        // Estado de carga
        this.isLoading = false;
        this.loadingQueue = [];
        
        this.init();
    }

    /**
     * Inicializa el gestor de módulos
     */
    init() {
        this.setupDependencyMap();
        console.log('📦 ModuleLoadingManager inicializado');
    }

    /**
     * Configura el mapa de dependencias de módulos
     */
    setupDependencyMap() {
        // Definir dependencias entre módulos
        this.dependencies.set('GameEngine', []);
        this.dependencies.set('AISystem', ['GameEngine']);
        this.dependencies.set('FleetRedirectionSystem', ['GameEngine']);
        this.dependencies.set('CanvasRenderer', ['GameEngine']);
        this.dependencies.set('SelectionSystem', ['GameEngine', 'CanvasRenderer']);
        this.dependencies.set('DragDropHandler', ['GameEngine', 'SelectionSystem']);
        this.dependencies.set('HUDManager', ['GameEngine', 'SelectionSystem', 'DragDropHandler']);
        this.dependencies.set('DebugPanel', ['GameEngine']);
        this.dependencies.set('BenchmarkSuite', ['GameEngine']);
    }

    /**
     * Carga un módulo con manejo de errores y cache
     * @param {string} modulePath - Ruta del módulo
     * @param {string} moduleName - Nombre del módulo para cache
     * @returns {Promise} Módulo cargado
     */
    async loadModule(modulePath, moduleName = null) {
        const cacheKey = moduleName || modulePath;
        
        // Verificar cache
        if (this.config.enableCache && this.moduleCache.has(cacheKey)) {
            this.metrics.cacheHits++;
            console.log(`📦 Módulo ${cacheKey} cargado desde cache`);
            return this.moduleCache.get(cacheKey);
        }
        
        // Verificar si ya se está cargando
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }
        
        // Crear promesa de carga
        const loadPromise = this.performModuleLoad(modulePath, cacheKey);
        this.loadingPromises.set(cacheKey, loadPromise);
        
        try {
            const module = await loadPromise;
            this.loadingPromises.delete(cacheKey);
            return module;
        } catch (error) {
            this.loadingPromises.delete(cacheKey);
            throw error;
        }
    }

    /**
     * Realiza la carga efectiva del módulo
     * @param {string} modulePath - Ruta del módulo
     * @param {string} cacheKey - Clave para cache
     * @returns {Promise} Módulo cargado
     */
    async performModuleLoad(modulePath, cacheKey) {
        const startTime = performance.now();
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                console.log(`📦 Cargando ${cacheKey} (intento ${attempt}/${this.config.retryAttempts})`);
                
                // Cargar módulo con timeout
                const module = await this.loadWithTimeout(modulePath);
                
                // Guardar en cache
                if (this.config.enableCache) {
                    this.moduleCache.set(cacheKey, module);
                }
                
                // Actualizar métricas
                const loadTime = performance.now() - startTime;
                this.metrics.loadTimes.set(cacheKey, loadTime);
                this.metrics.loadedModules++;
                this.loadOrder.push(cacheKey);
                
                console.log(`📦 ${cacheKey} cargado exitosamente (${loadTime.toFixed(2)}ms)`);
                return module;
                
            } catch (error) {
                lastError = error;
                console.warn(`📦 Error cargando ${cacheKey} (intento ${attempt}): ${error.message}`);
                
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelay * attempt);
                }
            }
        }
        
        // Todos los intentos fallaron
        this.metrics.failedModules++;
        throw new Error(`Failed to load module ${cacheKey} after ${this.config.retryAttempts} attempts: ${lastError.message}`);
    }

    /**
     * Carga un módulo con timeout
     * @param {string} modulePath - Ruta del módulo
     * @returns {Promise} Módulo cargado
     */
    async loadWithTimeout(modulePath) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Module load timeout: ${modulePath}`));
            }, this.config.timeout);
            
            import(modulePath)
                .then(module => {
                    clearTimeout(timeout);
                    resolve(module);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }

    /**
     * Carga múltiples módulos en paralelo
     * @param {Array} moduleSpecs - Array de {path, name}
     * @returns {Promise<Array>} Módulos cargados
     */
    async loadModules(moduleSpecs) {
        this.isLoading = true;
        this.metrics.totalModules += moduleSpecs.length;
        
        try {
            const loadPromises = moduleSpecs.map(spec => 
                this.loadModule(spec.path, spec.name)
            );
            
            const modules = await Promise.all(loadPromises);
            console.log(`📦 ${moduleSpecs.length} módulos cargados en paralelo`);
            return modules;
            
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Carga módulos respetando dependencias
     * @param {Array} moduleSpecs - Array de {path, name, dependencies}
     * @returns {Promise<Map>} Mapa de módulos cargados
     */
    async loadModulesWithDependencies(moduleSpecs) {
        const loadedModules = new Map();
        const loadingOrder = this.resolveDependencyOrder(moduleSpecs);
        
        for (const moduleName of loadingOrder) {
            const spec = moduleSpecs.find(s => s.name === moduleName);
            if (spec) {
                const module = await this.loadModule(spec.path, spec.name);
                loadedModules.set(spec.name, module);
                console.log(`📦 ${spec.name} cargado respetando dependencias`);
            }
        }
        
        return loadedModules;
    }

    /**
     * Resuelve el orden de carga basado en dependencias
     * @param {Array} moduleSpecs - Especificaciones de módulos
     * @returns {Array} Orden de carga
     */
    resolveDependencyOrder(moduleSpecs) {
        const visited = new Set();
        const visiting = new Set();
        const order = [];
        
        const visit = (moduleName) => {
            if (visited.has(moduleName)) return;
            if (visiting.has(moduleName)) {
                throw new Error(`Circular dependency detected: ${moduleName}`);
            }
            
            visiting.add(moduleName);
            
            const dependencies = this.dependencies.get(moduleName) || [];
            for (const dep of dependencies) {
                visit(dep);
            }
            
            visiting.delete(moduleName);
            visited.add(moduleName);
            order.push(moduleName);
        };
        
        for (const spec of moduleSpecs) {
            visit(spec.name);
        }
        
        return order;
    }

    /**
     * Precarga módulos especificados en configuración
     * @returns {Promise} Promesa de precarga
     */
    async preloadModules() {
        if (this.config.preloadModules.length === 0) return;
        
        console.log(`📦 Precargando ${this.config.preloadModules.length} módulos`);
        
        const preloadPromises = this.config.preloadModules.map(spec =>
            this.loadModule(spec.path, spec.name).catch(error => {
                console.warn(`📦 Error precargando ${spec.name}:`, error);
                return null;
            })
        );
        
        await Promise.all(preloadPromises);
        console.log('📦 Precarga completada');
    }

    /**
     * Crea una instancia de un módulo cargado
     * @param {string} moduleName - Nombre del módulo
     * @param {...any} args - Argumentos para el constructor
     * @returns {*} Instancia del módulo
     */
    createInstance(moduleName, ...args) {
        const module = this.moduleCache.get(moduleName);
        if (!module) {
            throw new Error(`Module ${moduleName} not loaded`);
        }
        
        const ModuleClass = module.default || module;
        if (typeof ModuleClass !== 'function') {
            throw new Error(`Module ${moduleName} is not a constructor`);
        }
        
        return new ModuleClass(...args);
    }

    /**
     * Obtiene un módulo del cache
     * @param {string} moduleName - Nombre del módulo
     * @returns {*} Módulo cacheado
     */
    getModule(moduleName) {
        return this.moduleCache.get(moduleName);
    }

    /**
     * Verifica si un módulo está cargado
     * @param {string} moduleName - Nombre del módulo
     * @returns {boolean} True si está cargado
     */
    isModuleLoaded(moduleName) {
        return this.moduleCache.has(moduleName);
    }

    /**
     * Limpia el cache de módulos
     * @param {string} moduleName - Nombre específico o null para limpiar todo
     */
    clearCache(moduleName = null) {
        if (moduleName) {
            this.moduleCache.delete(moduleName);
            console.log(`📦 Cache limpiado para ${moduleName}`);
        } else {
            this.moduleCache.clear();
            console.log('📦 Cache de módulos completamente limpiado');
        }
    }

    /**
     * Obtiene métricas de carga
     * @returns {Object} Métricas detalladas
     */
    getMetrics() {
        const totalLoadTime = Array.from(this.metrics.loadTimes.values())
            .reduce((sum, time) => sum + time, 0);
        
        return {
            ...this.metrics,
            averageLoadTime: this.metrics.loadedModules > 0 ? 
                totalLoadTime / this.metrics.loadedModules : 0,
            cacheHitRate: this.metrics.totalModules > 0 ? 
                (this.metrics.cacheHits / this.metrics.totalModules) * 100 : 0,
            successRate: this.metrics.totalModules > 0 ? 
                (this.metrics.loadedModules / this.metrics.totalModules) * 100 : 0,
            loadOrder: [...this.loadOrder]
        };
    }

    /**
     * Genera reporte de carga de módulos
     * @returns {Object} Reporte detallado
     */
    generateReport() {
        const metrics = this.getMetrics();
        
        return {
            summary: {
                totalModules: metrics.totalModules,
                loadedModules: metrics.loadedModules,
                failedModules: metrics.failedModules,
                cacheHits: metrics.cacheHits,
                successRate: `${metrics.successRate.toFixed(2)}%`,
                cacheHitRate: `${metrics.cacheHitRate.toFixed(2)}%`
            },
            performance: {
                averageLoadTime: `${metrics.averageLoadTime.toFixed(2)}ms`,
                loadOrder: metrics.loadOrder,
                individualTimes: Object.fromEntries(this.metrics.loadTimes)
            },
            cache: {
                size: this.moduleCache.size,
                modules: Array.from(this.moduleCache.keys())
            }
        };
    }

    /**
     * Delay helper
     * @param {number} ms - Milisegundos
     * @returns {Promise} Promesa de delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Configura opciones del gestor
     * @param {Object} newConfig - Nueva configuración
     */
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (newConfig.preloadModules) {
            this.preloadModules();
        }
    }

    /**
     * Resetea el estado del gestor
     */
    reset() {
        this.moduleCache.clear();
        this.loadingPromises.clear();
        this.loadOrder = [];
        this.metrics = {
            totalModules: 0,
            loadedModules: 0,
            failedModules: 0,
            cacheHits: 0,
            loadTimes: new Map()
        };
        this.isLoading = false;
        this.loadingQueue = [];
        
        console.log('📦 ModuleLoadingManager reseteado');
    }

    /**
     * Limpia recursos
     */
    destroy() {
        this.reset();
        console.log('📦 ModuleLoadingManager destruido');
    }
}

export default ModuleLoadingManager; 