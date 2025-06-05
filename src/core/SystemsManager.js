/**
 * 🔧 SYSTEMS MANAGER
 * Gestor centralizado de sistemas del juego
 * 
 * RESPONSABILIDADES:
 * - Inicializar y gestionar todos los sistemas del juego
 * - Coordinar actualizaciones de sistemas
 * - Manejar dependencias entre sistemas
 * - Proporcionar acceso controlado a sistemas
 */

import { AISystem } from '../systems/AISystem.js';
import { PercentageSelector } from '../ui/PercentageSelector.js';
import { FleetRedirectionSystem } from '../systems/FleetRedirectionSystem.js';
import { PerformanceProfiler } from '../debug/PerformanceProfiler.js';
import { CullingSystem } from '../visual/CullingSystem.js';
import { FleetFormationSystem } from '../systems/FleetFormationSystem.js';
import { NavigationSystem } from '../navigation/NavigationSystem.js';

export class SystemsManager {
    constructor(gameEngine, configurationManager) {
        this.gameEngine = gameEngine;
        this.configurationManager = configurationManager;
        
        // Sistemas del juego
        this.systems = new Map();
        this.systemsOrder = [];
        
        // Estado de inicialización
        this.isInitialized = false;
        this.initializationErrors = [];
        
        // Métricas de rendimiento
        this.updateMetrics = new Map();
        
        console.log('🔧 Systems Manager created');
    }

    /**
     * Inicializar todos los sistemas
     */
    async initialize() {
        try {
            const config = this.configurationManager.getConfiguration();
            
            await this.initializeCoreGameSystems();
            await this.initializeOptimizationSystems(config);
            await this.initializeUISystem();
            
            this.isInitialized = true;
            console.log('✅ All systems initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Systems initialization failed:', error);
            this.initializationErrors.push(error);
            return false;
        }
    }

    /**
     * Inicializar sistemas principales del juego
     */
    async initializeCoreGameSystems() {
        // Sistema de IA
        await this.initializeSystem('aiSystem', () => {
            return new AISystem(this.gameEngine);
        }, 1);

        // Sistema de redirección de flotas
        await this.initializeSystem('fleetRedirectionSystem', () => {
            return new FleetRedirectionSystem(this.gameEngine);
        }, 2);

        // Sistema de formación de flotas
        await this.initializeSystem('fleetFormationSystem', () => {
            return new FleetFormationSystem(this.gameEngine);
        }, 3);

        // Sistema de navegación
        await this.initializeSystem('navigationSystem', () => {
            return new NavigationSystem(this.gameEngine, null);
        }, 4);
    }

    /**
     * Inicializar sistemas de optimización
     */
    async initializeOptimizationSystems(config) {
        // Sistema de profiling de rendimiento
        if (config.performance.enableProfiling) {
            await this.initializeSystem('performanceProfiler', () => {
                const profiler = new PerformanceProfiler();
                profiler.start();
                return profiler;
            }, 10);
        }

        // Sistema de culling
        if (config.performance.enableCulling) {
            await this.initializeSystem('cullingSystem', () => {
                return new CullingSystem(
                    config.world.width,
                    config.world.height
                );
            }, 11);
        }
    }

    /**
     * Inicializar sistemas de UI
     */
    async initializeUISystem() {
        // Selector de porcentaje
        await this.initializeSystem('percentageSelector', () => {
            return new PercentageSelector(this.gameEngine);
        }, 20);
    }

    /**
     * Inicializar un sistema individual
     */
    async initializeSystem(name, factory, priority = 0) {
        try {
            console.log(`🔧 Initializing system: ${name}`);
            
            const system = factory();
            
            this.systems.set(name, {
                instance: system,
                priority,
                isActive: true,
                lastUpdateTime: 0,
                updateCount: 0,
                averageUpdateTime: 0
            });

            // Mantener orden de sistemas por prioridad
            this.systemsOrder = Array.from(this.systems.keys())
                .sort((a, b) => this.systems.get(a).priority - this.systems.get(b).priority);

            console.log(`✅ System ${name} initialized successfully`);
            
        } catch (error) {
            console.error(`❌ Failed to initialize system ${name}:`, error);
            this.initializationErrors.push({ system: name, error });
            throw error;
        }
    }

    /**
     * Obtener sistema por nombre
     */
    getSystem(name) {
        const systemData = this.systems.get(name);
        return systemData ? systemData.instance : null;
    }

    /**
     * Verificar si un sistema existe y está activo
     */
    hasSystem(name) {
        const systemData = this.systems.get(name);
        return systemData && systemData.isActive;
    }

    /**
     * Activar/desactivar un sistema
     */
    setSystemActive(name, active) {
        const systemData = this.systems.get(name);
        if (systemData) {
            systemData.isActive = active;
            console.log(`🔧 System ${name} ${active ? 'activated' : 'deactivated'}`);
        }
    }

    /**
     * Actualizar todos los sistemas activos
     */
    updateSystems(deltaTime) {
        if (!this.isInitialized) return;

        for (const systemName of this.systemsOrder) {
            const systemData = this.systems.get(systemName);
            
            if (systemData && systemData.isActive) {
                this.updateSystem(systemName, systemData, deltaTime);
            }
        }
    }

    /**
     * Actualizar un sistema individual
     */
    updateSystem(name, systemData, deltaTime) {
        const startTime = performance.now();
        
        try {
            const system = systemData.instance;
            
            // Llamar al método update si existe
            if (typeof system.update === 'function') {
                system.update(deltaTime);
            }
            
            // Actualizar métricas
            const updateTime = performance.now() - startTime;
            this.updateSystemMetrics(name, systemData, updateTime);
            
        } catch (error) {
            console.error(`❌ Error updating system ${name}:`, error);
            
            // Desactivar sistema problemático temporalmente
            systemData.isActive = false;
            setTimeout(() => {
                systemData.isActive = true;
                console.log(`🔧 System ${name} reactivated after error`);
            }, 5000);
        }
    }

    /**
     * Actualizar métricas de rendimiento del sistema
     */
    updateSystemMetrics(name, systemData, updateTime) {
        systemData.lastUpdateTime = updateTime;
        systemData.updateCount++;
        
        // Calcular tiempo promedio de actualización
        const currentAverage = systemData.averageUpdateTime;
        systemData.averageUpdateTime = (currentAverage * (systemData.updateCount - 1) + updateTime) / systemData.updateCount;
        
        // Mantener métricas globales
        if (!this.updateMetrics.has(name)) {
            this.updateMetrics.set(name, []);
        }
        
        const metrics = this.updateMetrics.get(name);
        metrics.push(updateTime);
        
        // Mantener solo las últimas 100 mediciones
        if (metrics.length > 100) {
            metrics.shift();
        }
    }

    /**
     * Conectar renderer de navegación
     */
    connectNavigationRenderer(canvasRenderer) {
        const navigationSystem = this.getSystem('navigationSystem');
        if (navigationSystem && typeof navigationSystem.connectRenderer === 'function') {
            navigationSystem.connectRenderer(canvasRenderer);
            console.log('🔧 Navigation renderer connected');
        }
    }

    /**
     * Obtener estadísticas de rendimiento de sistemas
     */
    getSystemsPerformanceStats() {
        const stats = {};
        
        for (const [name, systemData] of this.systems) {
            stats[name] = {
                isActive: systemData.isActive,
                priority: systemData.priority,
                updateCount: systemData.updateCount,
                lastUpdateTime: systemData.lastUpdateTime,
                averageUpdateTime: systemData.averageUpdateTime,
                recentMetrics: this.updateMetrics.get(name) || []
            };
        }
        
        return stats;
    }

    /**
     * Obtener información de debug de sistemas
     */
    getSystemsDebugInfo() {
        const debugInfo = {
            totalSystems: this.systems.size,
            activeSystems: Array.from(this.systems.values()).filter(s => s.isActive).length,
            systemsOrder: this.systemsOrder,
            initializationErrors: this.initializationErrors,
            isInitialized: this.isInitialized
        };

        // Agregar información específica de cada sistema
        debugInfo.systems = {};
        for (const [name, systemData] of this.systems) {
            debugInfo.systems[name] = {
                isActive: systemData.isActive,
                priority: systemData.priority,
                hasUpdateMethod: typeof systemData.instance.update === 'function',
                updateCount: systemData.updateCount
            };

            // Obtener debug info del sistema si está disponible
            if (typeof systemData.instance.getDebugInfo === 'function') {
                debugInfo.systems[name].systemDebugInfo = systemData.instance.getDebugInfo();
            }
        }

        return debugInfo;
    }

    /**
     * Reinicializar un sistema específico
     */
    async reinitializeSystem(name) {
        if (!this.systems.has(name)) {
            throw new Error(`System ${name} not found`);
        }

        const systemData = this.systems.get(name);
        
        // Destruir sistema actual si tiene método destroy
        if (typeof systemData.instance.destroy === 'function') {
            systemData.instance.destroy();
        }

        // Remover del mapa
        this.systems.delete(name);
        
        // Reinicializar según el tipo de sistema
        try {
            await this.reinitializeSystemByType(name, systemData.priority);
            console.log(`🔧 System ${name} reinitialized successfully`);
        } catch (error) {
            console.error(`❌ Failed to reinitialize system ${name}:`, error);
            throw error;
        }
    }

    /**
     * Reinicializar sistema según su tipo
     */
    async reinitializeSystemByType(name, priority) {
        const config = this.configurationManager.getConfiguration();

        switch (name) {
            case 'aiSystem':
                await this.initializeSystem(name, () => new AISystem(this.gameEngine), priority);
                break;
            case 'navigationSystem':
                await this.initializeSystem(name, () => new NavigationSystem(this.gameEngine, null), priority);
                break;
            case 'performanceProfiler':
                await this.initializeSystem(name, () => {
                    const profiler = new PerformanceProfiler();
                    profiler.start();
                    return profiler;
                }, priority);
                break;
            // Agregar más casos según sea necesario
            default:
                throw new Error(`Unknown system type: ${name}`);
        }
    }

    /**
     * Destruir todos los sistemas
     */
    destroy() {
        console.log('🔧 Destroying all systems...');
        
        for (const [name, systemData] of this.systems) {
            try {
                if (typeof systemData.instance.destroy === 'function') {
                    systemData.instance.destroy();
                }
                console.log(`🔧 System ${name} destroyed`);
            } catch (error) {
                console.error(`❌ Error destroying system ${name}:`, error);
            }
        }
        
        this.systems.clear();
        this.systemsOrder = [];
        this.updateMetrics.clear();
        this.isInitialized = false;
        
        console.log('🔧 All systems destroyed');
    }

    /**
     * Verificar salud de los sistemas
     */
    checkSystemsHealth() {
        const healthReport = {
            healthy: [],
            unhealthy: [],
            inactive: [],
            totalSystems: this.systems.size
        };

        for (const [name, systemData] of this.systems) {
            if (!systemData.isActive) {
                healthReport.inactive.push(name);
            } else if (systemData.averageUpdateTime > 16) { // Más de 16ms promedio
                healthReport.unhealthy.push({
                    name,
                    averageUpdateTime: systemData.averageUpdateTime,
                    reason: 'High update time'
                });
            } else {
                healthReport.healthy.push(name);
            }
        }

        return healthReport;
    }
}

export default SystemsManager; 