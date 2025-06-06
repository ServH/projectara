/**
 * 🔄 FLEET UPDATE MANAGER
 * Gestor especializado para actualización y ciclo de vida de flotas
 * Responsabilidad única: Gestionar actualizaciones, renderizado y limpieza
 */

export class FleetUpdateManager {
    constructor(dataConverter, mappingManager) {
        this.dataConverter = dataConverter;
        this.mappingManager = mappingManager;
        
        // Configuración de actualización
        this.config = {
            enableAutoCleanup: true,
            cleanupInterval: 5000, // 5 segundos
            maxInactiveFrames: 300,
            enableDepartureCheck: true
        };
        
        // Timer para limpieza automática
        this.cleanupTimer = null;
        this.setupAutoCleanup();
        
        console.log('🔄 FleetUpdateManager inicializado');
    }

    /**
     * 🔄 Actualizar todas las flotas
     */
    updateAllFleets(deltaTime, obstacles, spatialHash) {
        const updateCount = { updated: 0, removed: 0 };
        
        this.mappingManager.forEachMapping((fleet, legacyId, legacyData) => {
            if (fleet.isActive && !fleet.hasArrived) {
                // Actualizar la flota
                fleet.update(deltaTime, obstacles, spatialHash);
                
                // Actualizar datos legacy
                const updatedLegacyData = this.dataConverter.convertFleetToLegacyData(fleet, legacyData);
                this.mappingManager.updateLegacyData(fleet, updatedLegacyData);
                
                updateCount.updated++;
            }
        });
        
        return updateCount;
    }

    /**
     * 🔄 Actualizar flotas con planetas destino específicos
     */
    updateAllFleetsWithTargets(deltaTime, planets, spatialHash) {
        const updateCount = { updated: 0, removed: 0 };
        const fleetsToRemove = [];
        
        const totalFleets = this.mappingManager.getMappingStats().totalFleets;
        
        // Log cada 60 frames (1 segundo a 60fps) para evitar spam
        if (Math.random() < 0.016) { // ~1/60 probabilidad
            console.log(`🔄 FleetUpdateManager actualizando ${totalFleets} flotas`);
        }
        
        this.mappingManager.forEachMapping((fleet, legacyId, legacyData) => {
            if (fleet.isActive && !fleet.hasArrived) {
                // Obtener el planeta destino de esta flota
                const targetPlanetId = legacyData ? legacyData.toPlanet : null;
                
                // Verificar si la flota se alejó del planeta origen
                if (this.config.enableDepartureCheck) {
                    this.dataConverter.checkFleetDeparture(fleet, legacyData, planets);
                }
                
                // Crear obstáculos excluyendo el planeta destino
                const obstacles = this.dataConverter.convertPlanetsToObstaclesForFleet(planets, targetPlanetId);
                
                // Actualizar spatial hash con obstáculos específicos
                if (spatialHash) {
                    spatialHash.clear();
                    obstacles.forEach(obstacle => {
                        spatialHash.insert(obstacle, obstacle.position);
                    });
                }
                
                // Actualizar la flota
                fleet.update(deltaTime, obstacles, spatialHash);
                
                // Actualizar datos legacy
                const updatedLegacyData = this.dataConverter.convertFleetToLegacyData(fleet, legacyData);
                this.mappingManager.updateLegacyData(fleet, updatedLegacyData);
                
                updateCount.updated++;
                
            } else if (fleet.hasArrived && fleet.isActive) {
                // Flota ha llegado pero aún está activa - marcar para eliminación
                console.log(`🗑️ Marcando flota ${legacyId} para eliminación (llegó al destino)`);
                fleetsToRemove.push(legacyId);
                
            } else if (!fleet.isActive) {
                // Flota inactiva - marcar para eliminación
                console.log(`🗑️ Marcando flota ${legacyId} para eliminación (inactiva)`);
                fleetsToRemove.push(legacyId);
            }
        });
        
        // Eliminar flotas marcadas
        fleetsToRemove.forEach(legacyId => {
            this.removeFleet(legacyId);
            updateCount.removed++;
        });
        
        return updateCount;
    }

    /**
     * 🎨 Renderizar todas las flotas
     */
    renderAllFleets(ctx, debugConfig) {
        let renderedCount = 0;
        
        this.mappingManager.forEachMapping((fleet, legacyId, legacyData) => {
            if (fleet.isActive) {
                fleet.render(ctx, debugConfig);
                renderedCount++;
            }
        });
        
        return renderedCount;
    }

    /**
     * 🗑️ Remover flota específica
     */
    removeFleet(legacyId) {
        const fleet = this.mappingManager.getFleetByLegacyId(legacyId);
        
        if (fleet) {
            // Destruir la flota
            fleet.destroy();
            
            // Remover mapeo
            this.mappingManager.removeFleetMapping(legacyId);
            
            console.log(`🗑️ Fleet legacy ${legacyId} removida`);
            return true;
        }
        
        return false;
    }

    /**
     * 🧹 Limpiar flotas inactivas
     */
    cleanup() {
        const removedCount = this.mappingManager.cleanupInactiveFleets();
        
        if (removedCount > 0) {
            console.log(`🧹 ${removedCount} flotas inactivas removidas`);
        }
        
        return removedCount;
    }

    /**
     * 🧹 Configurar limpieza automática
     */
    setupAutoCleanup() {
        if (this.config.enableAutoCleanup) {
            this.cleanupTimer = setInterval(() => {
                this.cleanup();
            }, this.config.cleanupInterval);
            
            console.log(`🧹 Limpieza automática configurada cada ${this.config.cleanupInterval}ms`);
        }
    }

    /**
     * 🧹 Detener limpieza automática
     */
    stopAutoCleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            console.log('🧹 Limpieza automática detenida');
        }
    }

    /**
     * 🔄 Actualizar objetivo de flota
     */
    updateFleetTarget(legacyId, newTarget) {
        const fleet = this.mappingManager.getFleetByLegacyId(legacyId);
        
        if (fleet) {
            this.dataConverter.updateFleetTarget(fleet, newTarget);
            
            // Actualizar datos legacy
            const legacyData = this.mappingManager.getLegacyDataByFleet(fleet);
            const updatedLegacyData = this.dataConverter.convertFleetToLegacyData(fleet, legacyData);
            this.mappingManager.updateLegacyData(fleet, updatedLegacyData);
            
            return true;
        }
        
        return false;
    }

    /**
     * 🔄 Cambiar formación de flota
     */
    changeFleetFormation(legacyId, newFormation) {
        const fleet = this.mappingManager.getFleetByLegacyId(legacyId);
        
        if (fleet) {
            this.dataConverter.changeFleetFormation(fleet, newFormation);
            return true;
        }
        
        return false;
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        
        // Reconfigurar limpieza automática si cambió
        if (oldConfig.enableAutoCleanup !== this.config.enableAutoCleanup ||
            oldConfig.cleanupInterval !== this.config.cleanupInterval) {
            
            this.stopAutoCleanup();
            this.setupAutoCleanup();
        }
        
        console.log('🔄 Configuración de FleetUpdateManager actualizada');
    }

    /**
     * ⏸️ Pausar actualizaciones
     */
    pauseUpdates() {
        this.stopAutoCleanup();
        console.log('⏸️ Actualizaciones pausadas');
    }

    /**
     * ▶️ Reanudar actualizaciones
     */
    resumeUpdates() {
        this.setupAutoCleanup();
        console.log('▶️ Actualizaciones reanudadas');
    }

    /**
     * 📊 Obtener estadísticas de actualización
     */
    getUpdateStats() {
        const mappingStats = this.mappingManager.getMappingStats();
        
        return {
            ...mappingStats,
            config: this.config,
            autoCleanupActive: !!this.cleanupTimer,
            lastCleanupTime: this.lastCleanupTime || null
        };
    }

    /**
     * 🔍 Validar estado de todas las flotas
     */
    validateAllFleets() {
        const issues = [];
        let validCount = 0;
        
        this.mappingManager.forEachMapping((fleet, legacyId, legacyData) => {
            // Validar fleet
            if (!fleet.vehicles || fleet.vehicles.length === 0) {
                issues.push(`Fleet ${legacyId}: Sin vehículos`);
            }
            
            if (!fleet.averagePosition) {
                issues.push(`Fleet ${legacyId}: Sin posición promedio`);
            }
            
            if (!fleet.targetPosition) {
                issues.push(`Fleet ${legacyId}: Sin posición objetivo`);
            }
            
            // Validar datos legacy
            if (!this.dataConverter.validateLegacyData(legacyData)) {
                issues.push(`Fleet ${legacyId}: Datos legacy inválidos`);
            }
            
            if (issues.length === 0) {
                validCount++;
            }
        });
        
        return {
            isValid: issues.length === 0,
            validFleets: validCount,
            totalFleets: this.mappingManager.getMappingStats().totalFleets,
            issues
        };
    }

    /**
     * 🔄 Obtener información de debug
     */
    getDebugInfo() {
        return {
            updateStats: this.getUpdateStats(),
            validation: this.validateAllFleets(),
            config: this.config,
            hasDataConverter: !!this.dataConverter,
            hasMappingManager: !!this.mappingManager
        };
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        // Detener limpieza automática
        this.stopAutoCleanup();
        
        // Limpiar referencias
        this.dataConverter = null;
        this.mappingManager = null;
        
        console.log('💥 FleetUpdateManager destruido');
    }
} 