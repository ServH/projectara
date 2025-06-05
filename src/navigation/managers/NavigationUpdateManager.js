/**
 * 🔄 NAVIGATION UPDATE MANAGER
 * Gestiona las actualizaciones de navegación en ambos modos (Steering y Legacy)
 * Parte de la refactorización FASE 4 del NavigationSystem
 */

import { NAVIGATION_CONFIG } from '../NavigationConfig.js';

export class NavigationUpdateManager {
    constructor(gameEngine, fleetAdapter, spatialHash, obstacleDetector, arrivalSystem) {
        this.gameEngine = gameEngine;
        this.fleetAdapter = fleetAdapter;
        this.spatialHash = spatialHash;
        this.obstacleDetector = obstacleDetector;
        this.arrivalSystem = arrivalSystem;
        
        // Control de actualizaciones
        this.frameCounter = 0;
        this.updateInterval = NAVIGATION_CONFIG.obstacleDetection.updateInterval;
        
        // Control de logs para evitar spam
        this.logCounter = 0;
        this.logInterval = 60; // Log cada 60 frames (1 segundo a 60fps)
        
        // Batch processing para optimización
        this.fleetBatches = [];
        this.currentBatchIndex = 0;
        
        console.log('🔄 NavigationUpdateManager inicializado');
    }

    /**
     * 🔄 Actualizar navegación principal
     */
    update(navigationMode, statsManager, visualizationManager) {
        if (!this.gameEngine) return;
        
        this.frameCounter++;
        
        if (navigationMode.isSteeringMode()) {
            this.updateWithSteeringBehaviors(statsManager);
        } else {
            this.updateLegacyNavigation(statsManager, visualizationManager);
        }
        
        // Actualizar spatial hash cada frame en modo steering
        if (navigationMode.isSteeringMode()) {
            this.updateSpatialHash();
        }
        
        // Limpiar caches periódicamente
        if (this.frameCounter % 300 === 0) {
            this.cleanupCaches();
        }
    }

    /**
     * 🆕 Actualizar con steering behaviors
     */
    updateWithSteeringBehaviors(statsManager) {
        const startTime = performance.now();
        
        // Obtener planetas
        const planets = this.gameEngine.getAllPlanets();
        
        // Actualizar todas las flotas a través del adaptador
        const deltaTime = 1/60; // Asumir 60 FPS
        this.fleetAdapter.updateAllFleetsWithTargets(deltaTime, planets, this.spatialHash);
        
        // Limpiar flotas inactivas
        if (this.frameCounter % 60 === 0) {
            this.fleetAdapter.cleanup();
        }
        
        // Actualizar estadísticas
        statsManager.updateSteeringStats(this.fleetAdapter, this.spatialHash);
        
        // Log controlado para evitar spam
        this.logCounter++;
        if (NAVIGATION_CONFIG.debug.enabled && this.logCounter >= this.logInterval) {
            const adapterStats = this.fleetAdapter.getStats();
            console.log(`🧭 Steering Navigation: ${adapterStats.activeFleets} flotas, ${adapterStats.totalVehicles} naves`);
            this.logCounter = 0;
        }
        
        const processingTime = performance.now() - startTime;
        statsManager.updatePerformanceStats(processingTime);
    }

    /**
     * 🔄 Actualizar navegación legacy (compatibilidad)
     */
    updateLegacyNavigation(statsManager, visualizationManager) {
        const fleets = this.gameEngine.getAllFleets();
        const planets = this.gameEngine.getAllPlanets();
        
        // Log controlado para evitar spam
        this.logCounter++;
        if (NAVIGATION_CONFIG.debug.enabled && this.logCounter >= this.logInterval) {
            console.log(`🧭 Legacy Navigation procesando ${fleets.length} flotas y ${planets.length} planetas`);
            this.logCounter = 0;
        }
        
        // Procesar cada flota activa
        fleets.forEach(fleet => {
            if (fleet.isMoving && !fleet.hasArrived) {
                this.processFleet(fleet, planets);
            }
        });
        
        // Actualizar visualización
        if (visualizationManager) {
            visualizationManager.updateVisualization(fleets);
        }
        
        // Actualizar estadísticas básicas
        statsManager.updateBasicStats({
            activeNavigations: fleets.filter(f => f.isMoving && !f.hasArrived).length
        });
    }

    /**
     * 🔄 Actualizar spatial hash
     */
    updateSpatialHash() {
        if (this.frameCounter % 10 === 0) { // Optimizar cada 10 frames
            this.spatialHash.optimize();
        }
    }

    /**
     * 🚀 Procesar navegación de flotas por lotes
     */
    processBatchNavigation(statsManager) {
        const allFleets = this.gameEngine.getAllFleets();
        const activeFleets = allFleets.filter(fleet => fleet.isMoving && !fleet.hasArrived);
        
        if (activeFleets.length === 0) {
            statsManager.updateBasicStats({ activeNavigations: 0 });
            return;
        }

        // Dividir en lotes si es necesario
        if (this.fleetBatches.length === 0 || this.frameCounter % 60 === 0) {
            this.createFleetBatches(activeFleets);
        }

        // Procesar lote actual
        const batchSize = NAVIGATION_CONFIG.performance.batchSize;
        const currentBatch = this.fleetBatches[this.currentBatchIndex] || [];
        
        let fleetsProcessed = 0;
        let obstaclesDetected = 0;
        let routesRecalculated = 0;
        
        for (let i = 0; i < Math.min(batchSize, currentBatch.length); i++) {
            const fleet = currentBatch[i];
            if (fleet && fleet.isMoving) {
                const result = this.processFleetNavigation(fleet);
                fleetsProcessed++;
                if (result.obstaclesFound) obstaclesDetected++;
                if (result.routeRecalculated) routesRecalculated++;
            }
        }

        // Avanzar al siguiente lote
        this.currentBatchIndex = (this.currentBatchIndex + 1) % Math.max(1, this.fleetBatches.length);
        
        // Actualizar estadísticas
        statsManager.updateBasicStats({
            activeNavigations: activeFleets.length,
            fleetsProcessed,
            obstaclesDetected,
            routesRecalculated
        });
    }

    /**
     * 🚀 Procesar navegación de una nave individual
     */
    processFleetNavigation(fleet) {
        if (!fleet.target || !fleet.isMoving) {
            return { obstaclesFound: false, routeRecalculated: false };
        }

        const startTime = performance.now();
        
        // 1. Obtener punto de llegada personalizado
        const arrivalPoint = this.arrivalSystem.getArrivalPoint(
            fleet, 
            fleet.target,
            fleet.fleetIndex || 0,
            fleet.totalFleets || 1
        );

        // 2. Verificar si ha llegado
        if (this.arrivalSystem.hasArrivedAtPoint(fleet, arrivalPoint)) {
            this.handleFleetArrival(fleet, arrivalPoint);
            return { obstaclesFound: false, routeRecalculated: false };
        }

        // 3. Detectar obstáculos en la ruta
        const obstacles = this.obstacleDetector.detectObstaclesInRoute(fleet, arrivalPoint);
        
        let routeRecalculated = false;
        
        // 4. Recalcular ruta si hay obstáculos
        if (obstacles.length > 0) {
            this.handleObstacleAvoidance(fleet, obstacles, arrivalPoint);
            routeRecalculated = true;
        }

        // Debug timing
        if (NAVIGATION_CONFIG.debug.showCalculationTime) {
            const calcTime = performance.now() - startTime;
            if (calcTime > 2) { // Solo mostrar si toma más de 2ms
                console.log(`🧭 Navegación nave ${fleet.id}: ${calcTime.toFixed(2)}ms`);
            }
        }
        
        return { 
            obstaclesFound: obstacles.length > 0, 
            routeRecalculated 
        };
    }

    /**
     * 🚧 Manejar evitación de obstáculos
     */
    handleObstacleAvoidance(fleet, obstacles, finalTarget) {
        if (obstacles.length === 0) return;

        // Tomar el obstáculo más cercano
        const primaryObstacle = obstacles[0];
        const avoidancePoint = primaryObstacle.avoidancePoint;
        
        if (!avoidancePoint) return;

        // Calcular nueva dirección hacia el punto de evitación
        const dx = avoidancePoint.x - fleet.x;
        const dy = avoidancePoint.y - fleet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Aplicar suavizado para evitar cambios bruscos
            const smoothing = NAVIGATION_CONFIG.navigation.smoothingFactor;
            const newVelX = (dx / distance) * fleet.speed;
            const newVelY = (dy / distance) * fleet.speed;
            
            // Interpolar suavemente hacia la nueva dirección
            fleet.vx = fleet.vx * (1 - smoothing) + newVelX * smoothing;
            fleet.vy = fleet.vy * (1 - smoothing) + newVelY * smoothing;
            
            // Marcar que está evitando obstáculo
            fleet.isAvoidingObstacle = true;
            fleet.avoidanceTarget = avoidancePoint;
            
            if (NAVIGATION_CONFIG.debug.logObstacles) {
                console.log(`🚧 Nave ${fleet.id} evitando planeta ${primaryObstacle.planet.id}`);
            }
        }
    }

    /**
     * 🎯 Manejar llegada de nave
     */
    handleFleetArrival(fleet, arrivalPoint) {
        fleet.hasArrived = true;
        fleet.isMoving = false;
        fleet.isAvoidingObstacle = false;
        
        // Limpiar punto de llegada del cache
        this.arrivalSystem.clearArrivalPoint(fleet.id, fleet.target.id);
        
        console.log(`🎯 Nave ${fleet.id} llegó a ${fleet.target.id}`);
    }

    /**
     * 🚀 Procesar una flota individual (legacy)
     */
    processFleet(fleet, planets) {
        // Log controlado para evitar spam
        if (NAVIGATION_CONFIG.debug.enabled && Math.random() < 0.01) { // 1% de probabilidad
            console.log(`🧭 Procesando flota ${fleet.id}: (${fleet.x.toFixed(1)}, ${fleet.y.toFixed(1)}) → (${fleet.targetX.toFixed(1)}, ${fleet.targetY.toFixed(1)})`);
        }
        
        // Crear un objeto target para el ObstacleDetector
        const target = {
            x: fleet.targetX,
            y: fleet.targetY
        };
        
        // Detectar obstáculos en la trayectoria
        const obstacles = this.obstacleDetector.detectObstaclesInRoute(fleet, target);
        
        if (obstacles.length > 0 && NAVIGATION_CONFIG.debug.logObstacles) {
            console.log(`🚧 Obstáculos detectados para flota ${fleet.id}:`, obstacles.length);
        }
        
        // Registrar la flota para visualización
        fleet.navigationData = {
            obstacles: obstacles,
            hasNavigation: true,
            lastUpdate: Date.now()
        };
    }

    /**
     * 📦 Crear lotes de flotas para procesamiento optimizado
     */
    createFleetBatches(fleets) {
        const batchSize = NAVIGATION_CONFIG.performance.batchSize;
        this.fleetBatches = [];
        
        for (let i = 0; i < fleets.length; i += batchSize) {
            this.fleetBatches.push(fleets.slice(i, i + batchSize));
        }
        
        this.currentBatchIndex = 0;
    }

    /**
     * 🧹 Limpiar caches antiguos
     */
    cleanupCaches() {
        // Limpiar cache de obstáculos
        if (this.obstacleDetector) {
            this.obstacleDetector.cleanupCache();
        }
    }

    /**
     * 🎛️ Configurar intervalo de actualización
     */
    setUpdateInterval(frames) {
        this.updateInterval = Math.max(1, frames);
        console.log(`🔄 Intervalo de actualización cambiado a ${frames} frames`);
    }
} 