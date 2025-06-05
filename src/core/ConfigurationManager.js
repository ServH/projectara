/**
 * ⚙️ CONFIGURATION MANAGER
 * Gestor centralizado de configuración del juego
 * 
 * RESPONSABILIDADES:
 * - Cargar y validar configuraciones
 * - Proporcionar configuración con fallbacks seguros
 * - Gestionar configuración dinámica
 * - Validar parámetros de configuración
 */

import { GAME_CONFIG } from '../config/GameConfig.js';
import { BALANCE_CONFIG } from '../config/BalanceConfig.js';

export class ConfigurationManager {
    constructor() {
        this.config = null;
        this.isInitialized = false;
        this.validationErrors = [];
        
        this.initialize();
    }

    /**
     * Inicializar configuración con validación
     */
    initialize() {
        try {
            this.config = this.buildConfiguration();
            this.validateConfiguration();
            this.isInitialized = true;
            
            console.log('⚙️ Configuration Manager initialized successfully');
        } catch (error) {
            console.error('❌ Configuration initialization failed:', error);
            this.config = this.getDefaultConfiguration();
            this.isInitialized = true;
        }
    }

    /**
     * Construir configuración combinando múltiples fuentes
     */
    buildConfiguration() {
        const defaultConfig = this.getDefaultConfiguration();
        
        // Combinar configuraciones externas si están disponibles
        const combinedConfig = {
            world: { ...defaultConfig.world },
            gameplay: { ...defaultConfig.gameplay },
            performance: { ...defaultConfig.performance },
            debug: { ...defaultConfig.debug }
        };

        // Aplicar configuración externa si existe
        if (typeof GAME_CONFIG !== 'undefined') {
            this.mergeConfiguration(combinedConfig, GAME_CONFIG);
        }

        if (typeof BALANCE_CONFIG !== 'undefined') {
            this.mergeConfiguration(combinedConfig, BALANCE_CONFIG);
        }

        // Aplicar configuración de entorno
        this.applyEnvironmentConfiguration(combinedConfig);

        return combinedConfig;
    }

    /**
     * Obtener configuración por defecto
     */
    getDefaultConfiguration() {
        return {
            world: {
                width: window.innerWidth,
                height: window.innerHeight,
                planetCount: 25,
                minPlanetDistance: 80,
                margin: 100
            },
            gameplay: {
                fleetSendPercentage: 0.6,
                gameSpeed: 1.0,
                planetGrowthRate: 0.5,
                maxPlanetShips: 100,
                autoSave: true,
                pauseOnFocusLoss: true
            },
            performance: {
                targetFPS: 60,
                maxFleets: 100,
                maxPlanets: 50,
                enableProfiling: true,
                enableCulling: true,
                enableSpatialGrid: true,
                cullDistance: 50,
                updateInterval: 16
            },
            debug: {
                enabled: false,
                showFPS: true,
                showStats: true,
                logEvents: false,
                showHitboxes: false,
                verboseLogging: false
            }
        };
    }

    /**
     * Combinar configuración de forma segura
     */
    mergeConfiguration(target, source) {
        Object.keys(source).forEach(key => {
            if (target.hasOwnProperty(key) && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                target[key] = { ...target[key], ...source[key] };
            } else if (target.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        });
    }

    /**
     * Aplicar configuración específica del entorno
     */
    applyEnvironmentConfiguration(config) {
        // Detectar modo de desarrollo
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';

        if (isDevelopment) {
            config.debug.enabled = true;
            config.debug.verboseLogging = true;
            config.performance.enableProfiling = true;
        }

        // Ajustar configuración según capacidades del dispositivo
        this.adjustForDeviceCapabilities(config);
    }

    /**
     * Ajustar configuración según las capacidades del dispositivo
     */
    adjustForDeviceCapabilities(config) {
        // Detectar dispositivos de baja potencia
        const isLowPowerDevice = navigator.hardwareConcurrency <= 2 || 
                                navigator.deviceMemory <= 2;

        if (isLowPowerDevice) {
            config.performance.maxFleets = Math.min(config.performance.maxFleets, 50);
            config.performance.maxPlanets = Math.min(config.performance.maxPlanets, 30);
            config.performance.enableCulling = true;
            config.world.planetCount = Math.min(config.world.planetCount, 20);
        }

        // Ajustar según tamaño de pantalla
        if (window.innerWidth < 768) {
            config.world.planetCount = Math.min(config.world.planetCount, 15);
            config.performance.maxFleets = Math.min(config.performance.maxFleets, 30);
        }
    }

    /**
     * Validar configuración
     */
    validateConfiguration() {
        this.validationErrors = [];

        this.validateWorldConfig();
        this.validateGameplayConfig();
        this.validatePerformanceConfig();

        if (this.validationErrors.length > 0) {
            console.warn('⚠️ Configuration validation warnings:', this.validationErrors);
        }
    }

    /**
     * Validar configuración del mundo
     */
    validateWorldConfig() {
        const world = this.config.world;

        if (world.planetCount < 5 || world.planetCount > 100) {
            this.validationErrors.push('Planet count should be between 5 and 100');
            world.planetCount = Math.max(5, Math.min(100, world.planetCount));
        }

        if (world.minPlanetDistance < 50 || world.minPlanetDistance > 200) {
            this.validationErrors.push('Min planet distance should be between 50 and 200');
            world.minPlanetDistance = Math.max(50, Math.min(200, world.minPlanetDistance));
        }

        if (world.width < 400 || world.height < 300) {
            this.validationErrors.push('World dimensions too small');
            world.width = Math.max(400, world.width);
            world.height = Math.max(300, world.height);
        }
    }

    /**
     * Validar configuración de gameplay
     */
    validateGameplayConfig() {
        const gameplay = this.config.gameplay;

        if (gameplay.fleetSendPercentage < 0.1 || gameplay.fleetSendPercentage > 1.0) {
            this.validationErrors.push('Fleet send percentage should be between 0.1 and 1.0');
            gameplay.fleetSendPercentage = Math.max(0.1, Math.min(1.0, gameplay.fleetSendPercentage));
        }

        if (gameplay.gameSpeed < 0.1 || gameplay.gameSpeed > 5.0) {
            this.validationErrors.push('Game speed should be between 0.1 and 5.0');
            gameplay.gameSpeed = Math.max(0.1, Math.min(5.0, gameplay.gameSpeed));
        }
    }

    /**
     * Validar configuración de rendimiento
     */
    validatePerformanceConfig() {
        const performance = this.config.performance;

        if (performance.targetFPS < 30 || performance.targetFPS > 120) {
            this.validationErrors.push('Target FPS should be between 30 and 120');
            performance.targetFPS = Math.max(30, Math.min(120, performance.targetFPS));
        }

        if (performance.maxFleets < 10 || performance.maxFleets > 500) {
            this.validationErrors.push('Max fleets should be between 10 and 500');
            performance.maxFleets = Math.max(10, Math.min(500, performance.maxFleets));
        }
    }

    /**
     * Obtener configuración completa
     */
    getConfiguration() {
        if (!this.isInitialized) {
            throw new Error('Configuration not initialized');
        }
        return { ...this.config };
    }

    /**
     * Obtener configuración de una sección específica
     */
    getSection(sectionName) {
        if (!this.isInitialized) {
            throw new Error('Configuration not initialized');
        }
        
        if (!this.config[sectionName]) {
            throw new Error(`Configuration section '${sectionName}' not found`);
        }
        
        return { ...this.config[sectionName] };
    }

    /**
     * Actualizar configuración dinámicamente
     */
    updateConfiguration(sectionName, updates) {
        if (!this.isInitialized) {
            throw new Error('Configuration not initialized');
        }

        if (!this.config[sectionName]) {
            throw new Error(`Configuration section '${sectionName}' not found`);
        }

        const oldConfig = { ...this.config[sectionName] };
        this.config[sectionName] = { ...this.config[sectionName], ...updates };

        // Re-validar después de la actualización
        this.validateConfiguration();

        console.log(`⚙️ Configuration section '${sectionName}' updated`);
        
        return {
            oldConfig,
            newConfig: { ...this.config[sectionName] },
            validationErrors: this.validationErrors
        };
    }

    /**
     * Obtener configuración optimizada para el rendimiento actual
     */
    getOptimizedConfiguration(currentFPS, memoryUsage) {
        const optimizedConfig = { ...this.config };

        // Ajustar configuración basada en rendimiento actual
        if (currentFPS < 45) {
            optimizedConfig.performance.maxFleets = Math.floor(optimizedConfig.performance.maxFleets * 0.8);
            optimizedConfig.performance.enableCulling = true;
            optimizedConfig.world.planetCount = Math.floor(optimizedConfig.world.planetCount * 0.9);
        }

        // Ajustar basado en uso de memoria
        if (memoryUsage > 100) { // MB
            optimizedConfig.performance.maxFleets = Math.floor(optimizedConfig.performance.maxFleets * 0.7);
            optimizedConfig.performance.enableSpatialGrid = true;
        }

        return optimizedConfig;
    }

    /**
     * Exportar configuración actual
     */
    exportConfiguration() {
        return {
            config: this.getConfiguration(),
            validationErrors: [...this.validationErrors],
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * Resetear a configuración por defecto
     */
    resetToDefaults() {
        this.config = this.getDefaultConfiguration();
        this.validateConfiguration();
        
        console.log('⚙️ Configuration reset to defaults');
        return this.getConfiguration();
    }

    /**
     * Verificar si la configuración es válida
     */
    isValid() {
        return this.isInitialized && this.validationErrors.length === 0;
    }

    /**
     * Obtener errores de validación
     */
    getValidationErrors() {
        return [...this.validationErrors];
    }
}

export default ConfigurationManager; 