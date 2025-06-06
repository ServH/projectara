/**
 * 🔧 LEGACY FLEET ADAPTER - REFACTORIZADO
 * Adaptador modular para compatibilidad entre Fleet.js nuevo y gameEngine legacy
 * Arquitectura basada en gestores especializados con responsabilidades únicas
 * 
 * ARQUITECTURA MODULAR:
 * - FleetDataConverter: Conversión de datos legacy ↔ nuevo
 * - FleetMappingManager: Gestión de mapeos bidireccionales
 * - FleetUpdateManager: Actualización y ciclo de vida
 * - FleetLifecycleManager: Integración con gameEngine
 */

import { FleetDataConverter } from './managers/FleetDataConverter.js';
import { FleetMappingManager } from './managers/FleetMappingManager.js';
import { FleetUpdateManager } from './managers/FleetUpdateManager.js';
import { FleetLifecycleManager } from './managers/FleetLifecycleManager.js';

export class LegacyFleetAdapter {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Inicializar gestores especializados
        this.dataConverter = new FleetDataConverter();
        this.mappingManager = new FleetMappingManager();
        this.updateManager = new FleetUpdateManager(this.dataConverter, this.mappingManager);
        this.lifecycleManager = new FleetLifecycleManager(gameEngine, this.dataConverter, this.mappingManager);
        
        // Configurar callbacks entre gestores
        this.setupManagerCallbacks();
        
        console.log('🔧 LegacyFleetAdapter refactorizado inicializado con arquitectura modular');
    }

    /**
     * 🔗 Configurar callbacks entre gestores
     */
    setupManagerCallbacks() {
        // Los gestores ya están configurados con dependency injection
        // No necesitamos callbacks adicionales por ahora
        console.log('🔗 Callbacks entre gestores configurados');
    }

    /**
     * 🔄 Crear Fleet nuevo desde datos legacy
     */
    createFromLegacyData(legacyFleetData) {
        try {
            // Validar datos usando el converter
            if (!this.dataConverter.validateLegacyData(legacyFleetData)) {
                throw new Error('Datos legacy inválidos');
            }
            
            // Crear Fleet usando el converter
            const newFleet = this.dataConverter.createFleetFromLegacyData(legacyFleetData);
            
            // Registrar mapeo usando el mapping manager
            this.mappingManager.registerFleetMapping(legacyFleetData.id, newFleet, legacyFleetData);
            
            return newFleet;
            
        } catch (error) {
            console.error('❌ Error al crear Fleet desde datos legacy:', error);
            return null;
        }
    }

    /**
     * 🔄 Convertir Fleet nuevo a datos legacy
     */
    convertToLegacyData(fleet) {
        const existingLegacyData = this.mappingManager.getLegacyDataByFleet(fleet);
        return this.dataConverter.convertFleetToLegacyData(fleet, existingLegacyData);
    }

    /**
     * 🔍 Obtener Fleet nuevo por ID legacy
     */
    getFleetByLegacyId(legacyId) {
        return this.mappingManager.getFleetByLegacyId(legacyId);
    }

    /**
     * 📊 Obtener datos legacy por Fleet nuevo
     */
    getLegacyDataByFleet(fleet) {
        return this.mappingManager.getLegacyDataByFleet(fleet);
    }

    /**
     * 🔄 Actualizar todas las flotas
     */
    updateAllFleets(deltaTime, obstacles, spatialHash) {
        return this.updateManager.updateAllFleets(deltaTime, obstacles, spatialHash);
    }

    /**
     * 🔄 Actualizar todas las flotas con planetas destino específicos
     */
    updateAllFleetsWithTargets(deltaTime, planets, spatialHash) {
        return this.updateManager.updateAllFleetsWithTargets(deltaTime, planets, spatialHash);
    }

    /**
     * 🎨 Renderizar todas las flotas
     */
    renderAllFleets(ctx, debugConfig) {
        return this.updateManager.renderAllFleets(ctx, debugConfig);
    }

    /**
     * 🗑️ Remover flota
     */
    removeFleet(legacyId) {
        return this.updateManager.removeFleet(legacyId);
    }

    /**
     * ➕ Agregar flota nueva al adaptador
     */
    addFleet(fleet) {
        try {
            console.log(`🔧 LegacyFleetAdapter.addFleet() llamado para flota ${fleet.id}`);
            console.log(`🔧 Flota details:`, {
                id: fleet.id,
                vehicles: fleet.vehicles?.length || 0,
                isActive: fleet.isActive,
                hasArrived: fleet.hasArrived,
                owner: fleet.owner
            });
            
            // Registrar la flota en el mapping manager
            this.mappingManager.registerFleetMapping(fleet.id, fleet, null);
            
            console.log(`🔧 Flota ${fleet.id} agregada al LegacyFleetAdapter exitosamente`);
            return true;
        } catch (error) {
            console.error(`❌ Error agregando flota ${fleet.id} al adaptador:`, error);
            return false;
        }
    }

    /**
     * 🧹 Limpiar flotas inactivas
     */
    cleanup() {
        return this.updateManager.cleanup();
    }

    /**
     * 📊 Obtener estadísticas del adaptador
     */
    getStats() {
        return this.lifecycleManager.getAdapterStats();
    }

    /**
     * 🔧 Integrar con gameEngine existente
     */
    integrateWithGameEngine() {
        return this.lifecycleManager.integrateWithGameEngine();
    }

    /**
     * 🔄 Restaurar gameEngine original
     */
    restoreGameEngine() {
        return this.lifecycleManager.restoreGameEngine();
    }

    /**
     * 🎯 Actualizar objetivo de flota
     */
    updateFleetTarget(legacyId, newTarget) {
        return this.updateManager.updateFleetTarget(legacyId, newTarget);
    }

    /**
     * 🔄 Cambiar formación de flota
     */
    changeFleetFormation(legacyId, newFormation) {
        return this.updateManager.changeFleetFormation(legacyId, newFormation);
    }

    /**
     * 📊 Debug: Obtener información detallada
     */
    getDebugInfo() {
        return this.lifecycleManager.getDetailedDebugInfo();
    }

    /**
     * 🌍 Convertir planetas a obstáculos para una flota específica
     */
    convertPlanetsToObstaclesForFleet(planets, targetPlanetId) {
        return this.dataConverter.convertPlanetsToObstaclesForFleet(planets, targetPlanetId);
    }

    // ========================================
    // MÉTODOS DE GESTIÓN AVANZADA
    // ========================================

    /**
     * 🔍 Buscar flotas por criterio
     */
    findFleetsByCriteria(criteria) {
        return this.mappingManager.findFleetsByCriteria(criteria);
    }

    /**
     * 🔍 Obtener flotas activas
     */
    getActiveFleets() {
        return this.mappingManager.getActiveFleets();
    }

    /**
     * 🔍 Obtener flotas que han llegado
     */
    getArrivedFleets() {
        return this.mappingManager.getArrivedFleets();
    }

    /**
     * 🔍 Obtener flotas por propietario
     */
    getFleetsByOwner(owner) {
        return this.mappingManager.getFleetsByOwner(owner);
    }

    /**
     * 🔍 Obtener flotas desde planeta específico
     */
    getFleetsFromPlanet(planetId) {
        return this.mappingManager.getFleetsFromPlanet(planetId);
    }

    /**
     * 🔍 Obtener flotas hacia planeta específico
     */
    getFleetsToPlanet(planetId) {
        return this.mappingManager.getFleetsToPlanet(planetId);
    }

    /**
     * 🔄 Configurar gestores
     */
    configureManagers(config) {
        if (config.updateManager) {
            this.updateManager.updateConfig(config.updateManager);
        }
        
        console.log('🔄 Configuración de gestores actualizada');
    }

    /**
     * ⏸️ Pausar operaciones
     */
    pause() {
        this.updateManager.pauseUpdates();
        console.log('⏸️ LegacyFleetAdapter pausado');
    }

    /**
     * ▶️ Reanudar operaciones
     */
    resume() {
        this.updateManager.resumeUpdates();
        console.log('▶️ LegacyFleetAdapter reanudado');
    }

    /**
     * 🔍 Verificar estado de salud
     */
    checkHealth() {
        const health = {
            dataConverter: !!this.dataConverter,
            mappingManager: !!this.mappingManager,
            updateManager: !!this.updateManager,
            lifecycleManager: !!this.lifecycleManager,
            integration: this.lifecycleManager.checkIntegrationHealth()
        };
        
        health.isHealthy = health.dataConverter && health.mappingManager && 
                          health.updateManager && health.lifecycleManager && 
                          health.integration.isHealthy;
        
        return health;
    }

    /**
     * 🔄 Reinicializar adaptador
     */
    reinitialize() {
        console.log('🔄 Reinicializando LegacyFleetAdapter...');
        
        try {
            // Reinicializar integración
            this.lifecycleManager.reinitializeIntegration();
            
            // Limpiar mapeos
            this.mappingManager.clearAllMappings();
            
            console.log('✅ LegacyFleetAdapter reinicializado exitosamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error al reinicializar LegacyFleetAdapter:', error);
            return false;
        }
    }

    /**
     * 📊 Obtener métricas de rendimiento
     */
    getPerformanceMetrics() {
        const stats = this.getStats();
        const debugInfo = this.getDebugInfo();
        
        return {
            fleets: {
                total: stats.totalFleets,
                active: stats.activeFleets,
                arrived: stats.arrivedFleets,
                averageSize: stats.averageFleetSize
            },
            vehicles: {
                total: stats.totalVehicles,
                avoiding: debugInfo.behaviors.avoidingVehicles,
                seeking: debugInfo.behaviors.seekingVehicles
            },
            integration: {
                uptime: stats.integration.uptime,
                fleetsCreated: stats.integration.fleetsCreated,
                fleetsIntercepted: stats.integration.fleetsIntercepted,
                methodsIntercepted: stats.integration.methodsIntercepted
            },
            health: this.checkHealth()
        };
    }

    /**
     * 💥 Destruir el adaptador
     */
    destroy() {
        console.log('💥 Destruyendo LegacyFleetAdapter...');
        
        // Restaurar gameEngine
        this.restoreGameEngine();
        
        // Destruir gestores
        if (this.updateManager) {
            this.updateManager.destroy();
        }
        
        if (this.lifecycleManager) {
            this.lifecycleManager.destroy();
        }
        
        // Limpiar mapeos
        if (this.mappingManager) {
            this.mappingManager.clearAllMappings();
        }
        
        // Limpiar referencias
        this.dataConverter = null;
        this.mappingManager = null;
        this.updateManager = null;
        this.lifecycleManager = null;
        this.gameEngine = null;
        
        console.log('💥 LegacyFleetAdapter destruido completamente');
    }
} 