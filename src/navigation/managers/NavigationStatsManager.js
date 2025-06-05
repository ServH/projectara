/**
 * 📊 NAVIGATION STATS MANAGER
 * Gestiona estadísticas y métricas del sistema de navegación
 * Parte de la refactorización FASE 4 del NavigationSystem
 */

export class NavigationStatsManager {
    constructor() {
        // Estadísticas básicas
        this.stats = {
            fleetsProcessed: 0,
            obstaclesDetected: 0,
            routesRecalculated: 0,
            averageProcessingTime: 0,
            activeNavigations: 0,
            // Estadísticas de steering behaviors
            steeringFleets: 0,
            spatialHashQueries: 0,
            averageFleetSize: 0,
            formationsActive: {}
        };
        
        // Métricas de rendimiento
        this.performanceMetrics = {
            totalFrames: 0,
            totalProcessingTime: 0,
            peakProcessingTime: 0,
            averageFrameTime: 0
        };
        
        console.log('📊 NavigationStatsManager inicializado');
    }

    /**
     * 📊 Actualizar estadísticas básicas
     */
    updateBasicStats(data) {
        if (data.fleetsProcessed !== undefined) {
            this.stats.fleetsProcessed += data.fleetsProcessed;
        }
        if (data.obstaclesDetected !== undefined) {
            this.stats.obstaclesDetected += data.obstaclesDetected;
        }
        if (data.routesRecalculated !== undefined) {
            this.stats.routesRecalculated += data.routesRecalculated;
        }
        if (data.activeNavigations !== undefined) {
            this.stats.activeNavigations = data.activeNavigations;
        }
    }

    /**
     * 📊 Actualizar estadísticas de steering behaviors
     */
    updateSteeringStats(fleetAdapter, spatialHash) {
        if (!fleetAdapter) return;
        
        const adapterStats = fleetAdapter.getStats();
        const debugInfo = fleetAdapter.getDebugInfo();
        
        this.stats.steeringFleets = adapterStats.activeFleets;
        this.stats.averageFleetSize = adapterStats.averageFleetSize;
        this.stats.formationsActive = debugInfo.formations;
        
        if (spatialHash && spatialHash.stats) {
            this.stats.spatialHashQueries = spatialHash.stats.queriesPerFrame;
            // Resetear contador de queries del spatial hash
            spatialHash.stats.queriesPerFrame = 0;
        }
    }

    /**
     * ⏱️ Actualizar métricas de rendimiento
     */
    updatePerformanceStats(processingTime) {
        this.performanceMetrics.totalFrames++;
        this.performanceMetrics.totalProcessingTime += processingTime;
        
        // Actualizar pico de tiempo de procesamiento
        if (processingTime > this.performanceMetrics.peakProcessingTime) {
            this.performanceMetrics.peakProcessingTime = processingTime;
        }
        
        // Promedio móvil del tiempo de procesamiento
        this.stats.averageProcessingTime = 
            (this.stats.averageProcessingTime * 0.9) + (processingTime * 0.1);
        
        // Calcular tiempo promedio de frame
        this.performanceMetrics.averageFrameTime = 
            this.performanceMetrics.totalProcessingTime / this.performanceMetrics.totalFrames;
    }

    /**
     * 📊 Obtener estadísticas básicas
     */
    getBasicStats() {
        return { ...this.stats };
    }

    /**
     * 📊 Obtener estadísticas expandidas con información de modo
     */
    getExpandedStats(mode, fleetAdapter, spatialHash, obstacleDetector, arrivalSystem, trajectoryCache) {
        const baseStats = {
            navigation: this.stats,
            performance: this.performanceMetrics,
            obstacles: obstacleDetector ? obstacleDetector.getStats() : {},
            arrivals: arrivalSystem ? arrivalSystem.getStats() : {},
            trajectories: trajectoryCache ? trajectoryCache.size : 0
        };
        
        if (mode === 'steering' && fleetAdapter && spatialHash) {
            const adapterStats = fleetAdapter.getStats();
            const spatialStats = spatialHash.getStats();
            
            return {
                ...baseStats,
                mode: 'steering',
                steering: {
                    fleets: adapterStats.activeFleets,
                    vehicles: adapterStats.totalVehicles,
                    averageFleetSize: adapterStats.averageFleetSize,
                    formations: this.stats.formationsActive
                },
                spatial: {
                    cells: spatialStats.totalCells,
                    objects: spatialStats.totalObjects,
                    queriesPerFrame: spatialStats.queriesPerFrame,
                    memoryKB: spatialStats.memoryUsage.totalKB
                }
            };
        } else {
            return {
                ...baseStats,
                mode: 'legacy'
            };
        }
    }

    /**
     * 🔄 Resetear estadísticas
     */
    resetStats() {
        this.stats = {
            fleetsProcessed: 0,
            obstaclesDetected: 0,
            routesRecalculated: 0,
            averageProcessingTime: 0,
            activeNavigations: 0,
            steeringFleets: 0,
            spatialHashQueries: 0,
            averageFleetSize: 0,
            formationsActive: {}
        };
        
        this.performanceMetrics = {
            totalFrames: 0,
            totalProcessingTime: 0,
            peakProcessingTime: 0,
            averageFrameTime: 0
        };
        
        console.log('📊 Estadísticas de navegación reseteadas');
    }

    /**
     * 📈 Obtener resumen de rendimiento
     */
    getPerformanceSummary() {
        return {
            totalFrames: this.performanceMetrics.totalFrames,
            averageFrameTime: this.performanceMetrics.averageFrameTime.toFixed(2) + 'ms',
            peakProcessingTime: this.performanceMetrics.peakProcessingTime.toFixed(2) + 'ms',
            currentAverageTime: this.stats.averageProcessingTime.toFixed(2) + 'ms',
            fleetsPerSecond: this.stats.fleetsProcessed > 0 ? 
                (this.stats.fleetsProcessed / (this.performanceMetrics.totalFrames / 60)).toFixed(1) : '0'
        };
    }
} 