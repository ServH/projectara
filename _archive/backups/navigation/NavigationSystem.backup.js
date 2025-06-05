/**
 * 🧭 GALCON GAME - SISTEMA DE NAVEGACIÓN PRINCIPAL
 * Coordinador de detección de obstáculos, llegada realista y visualización
 * MILESTONE 2.3: Navegación inteligente completa
 * 🆕 INTEGRADO CON STEERING BEHAVIORS - Fase 3
 */

import { NAVIGATION_CONFIG, NavigationConfigManager } from './NavigationConfig.js';
import ObstacleDetector from './ObstacleDetector.js';
import ArrivalSystem from './ArrivalSystem.js';
import { SpatialHashSystem } from '../systems/SpatialHashSystem.js';
import { LegacyFleetAdapter } from '../adapters/LegacyFleetAdapter.js';
import { GALCON_STEERING_CONFIG_PROBADA } from '../config/SteeringConfig.js';

export class NavigationSystem {
    constructor(gameEngine, canvasRenderer) {
        this.gameEngine = gameEngine;
        this.canvasRenderer = canvasRenderer;
        
        // 🔧 ARREGLO: Inicializar configuración
        this.config = NAVIGATION_CONFIG;
        
        // Subsistemas legacy (mantener compatibilidad)
        this.obstacleDetector = new ObstacleDetector(gameEngine);
        this.arrivalSystem = new ArrivalSystem();
        
        // 🆕 NUEVOS SISTEMAS DE STEERING BEHAVIORS
        this.spatialHash = new SpatialHashSystem(50); // Celdas de 50px
        this.fleetAdapter = new LegacyFleetAdapter(gameEngine);
        this.legacyFleetAdapter = this.fleetAdapter; // Alias para compatibilidad
        this.steeringConfig = GALCON_STEERING_CONFIG_PROBADA;
        
        // 🔄 MODO HÍBRIDO: Permitir cambio entre sistemas
        this.useSteeringBehaviors = true; // Por defecto usar steering behaviors
        this.legacyMode = false;
        
        // Control de actualizaciones
        this.frameCounter = 0;
        this.updateInterval = NAVIGATION_CONFIG.obstacleDetection.updateInterval;
        
        // 🔧 NUEVO: Control de logs para evitar spam
        this.logCounter = 0;
        this.logInterval = 60; // Log cada 60 frames (1 segundo a 60fps)
        
        // Batch processing para optimización
        this.fleetBatches = [];
        this.currentBatchIndex = 0;
        
        // Cache de trayectorias para visualización
        this.trajectoryCache = new Map();
        
        // Estadísticas de rendimiento (expandidas)
        this.stats = {
            fleetsProcessed: 0,
            obstaclesDetected: 0,
            routesRecalculated: 0,
            averageProcessingTime: 0,
            activeNavigations: 0,
            // 🆕 Estadísticas de steering behaviors
            steeringFleets: 0,
            spatialHashQueries: 0,
            averageFleetSize: 0,
            formationsActive: {}
        };
        
        // 🔧 Integrar adaptador con gameEngine si steering behaviors está activo
        if (this.useSteeringBehaviors) {
            this.fleetAdapter.integrateWithGameEngine();
        }
        
        console.log(`🧭 NavigationSystem inicializado - ${this.useSteeringBehaviors ? 'Steering Behaviors' : 'Legacy'} activo`);
    }

    /**
     * 🔄 Actualizar sistema de navegación (HÍBRIDO)
     */
    update() {
        if (!this.gameEngine) return;
        
        this.frameCounter++;
        
        if (this.useSteeringBehaviors) {
            this.updateWithSteeringBehaviors();
        } else {
            this.updateLegacyNavigation();
        }
        
        // Actualizar spatial hash cada frame
        if (this.useSteeringBehaviors) {
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
    updateWithSteeringBehaviors() {
        const startTime = performance.now();
        
        // Obtener planetas y flotas
        const planets = this.gameEngine.getAllPlanets();
        
        // Actualizar todas las flotas a través del adaptador
        const deltaTime = 1/60; // Asumir 60 FPS
        this.fleetAdapter.updateAllFleetsWithTargets(deltaTime, planets, this.spatialHash);
        
        // Limpiar flotas inactivas
        if (this.frameCounter % 60 === 0) {
            this.fleetAdapter.cleanup();
        }
        
        // Actualizar estadísticas
        this.updateSteeringStats();
        
        // 🔧 REDUCIR SPAM: Solo log cada N frames
        this.logCounter++;
        if (this.config.debug.enabled && this.logCounter >= this.logInterval) {
            const adapterStats = this.fleetAdapter.getStats();
            console.log(`🧭 Steering Navigation: ${adapterStats.activeFleets} flotas, ${adapterStats.totalVehicles} naves`);
            this.logCounter = 0;
        }
        
        const processingTime = performance.now() - startTime;
        this.updateStats(processingTime);
    }

    /**
     * 🔄 Actualizar navegación legacy (compatibilidad)
     */
    updateLegacyNavigation() {
        const fleets = this.gameEngine.getAllFleets();
        const planets = this.gameEngine.getAllPlanets();
        
        // 🔧 REDUCIR SPAM: Solo log cada N frames
        this.logCounter++;
        if (this.config.debug.enabled && this.logCounter >= this.logInterval) {
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
        this.updateVisualization(fleets);
    }

    /**
     * 🔄 Convertir planetas a obstáculos para una flota específica (EXCLUYENDO SU DESTINO)
     */
    convertPlanetsToObstaclesForFleet(planets, targetPlanetId) {
        return planets
            .filter(planet => planet.id !== targetPlanetId) // 🔧 EXCLUIR planeta destino
            .map(planet => ({
                position: { x: planet.x, y: planet.y },
                radius: planet.radius + 10, // Buffer de seguridad
                id: planet.id,
                type: 'planet'
            }));
    }

    /**
     * 🔄 Actualizar spatial hash con obstáculos
     */
    updateSpatialHashWithObstacles(obstacles) {
        // Limpiar hash anterior
        this.spatialHash.clear();
        
        // Insertar obstáculos
        obstacles.forEach(obstacle => {
            this.spatialHash.insert(
                obstacle,
                { x: obstacle.position.x, y: obstacle.position.y },
                obstacle.radius
            );
        });
    }

    /**
     * 📊 Actualizar estadísticas de steering behaviors
     */
    updateSteeringStats() {
        if (!this.useSteeringBehaviors) return;
        
        const adapterStats = this.fleetAdapter.getStats();
        const debugInfo = this.fleetAdapter.getDebugInfo();
        
        this.stats.steeringFleets = adapterStats.activeFleets;
        this.stats.spatialHashQueries = this.spatialHash.stats.queriesPerFrame;
        this.stats.averageFleetSize = adapterStats.averageFleetSize;
        this.stats.formationsActive = debugInfo.formations;
        
        // Resetear contador de queries del spatial hash
        this.spatialHash.stats.queriesPerFrame = 0;
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
     * 🎨 Renderizar navegación (SIN DEBUG)
     */
    render(ctx) {
        // Solo renderizar las flotas básicas sin debug
        if (this.useSteeringBehaviors) {
            this.fleetAdapter.renderAllFleets(ctx, { 
                showDebug: false,
                showSensors: false,
                showForces: false,
                showTrails: false,
                showFleetConnections: false,
                showFleetCenter: false,
                showSpatialGrid: false
            });
        }
    }

    /**
     * 🔄 Cambiar entre modos de navegación
     */
    toggleNavigationMode() {
        this.useSteeringBehaviors = !this.useSteeringBehaviors;
        this.legacyMode = !this.useSteeringBehaviors;
        
        if (this.useSteeringBehaviors) {
            this.fleetAdapter.integrateWithGameEngine();
            console.log('🔄 Cambiado a Steering Behaviors');
        } else {
            this.fleetAdapter.restoreGameEngine();
            console.log('🔄 Cambiado a navegación Legacy');
        }
    }

    /**
     * 🎯 Configurar modo de navegación
     */
    setNavigationMode(useSteeringBehaviors) {
        if (this.useSteeringBehaviors === useSteeringBehaviors) return;
        
        this.toggleNavigationMode();
    }

    /**
     * 🔧 Obtener configuración actual
     */
    getCurrentConfig() {
        return this.useSteeringBehaviors ? this.steeringConfig : this.config;
    }

    /**
     * 📊 Obtener estadísticas expandidas
     */
    getExpandedStats() {
        const baseStats = this.getStats();
        
        if (this.useSteeringBehaviors) {
            const adapterStats = this.fleetAdapter.getStats();
            const spatialStats = this.spatialHash.getStats();
            
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
     * 🚀 Procesar navegación de flotas por lotes
     */
    processBatchNavigation() {
        const allFleets = this.gameEngine.getAllFleets();
        const activeFleets = allFleets.filter(fleet => fleet.isMoving && !fleet.hasArrived);
        
        if (activeFleets.length === 0) {
            this.stats.activeNavigations = 0;
            return;
        }

        // Dividir en lotes si es necesario
        if (this.fleetBatches.length === 0 || this.frameCounter % 60 === 0) {
            this.createFleetBatches(activeFleets);
        }

        // Procesar lote actual
        const batchSize = NAVIGATION_CONFIG.performance.batchSize;
        const currentBatch = this.fleetBatches[this.currentBatchIndex] || [];
        
        for (let i = 0; i < Math.min(batchSize, currentBatch.length); i++) {
            const fleet = currentBatch[i];
            if (fleet && fleet.isMoving) {
                this.processFleetNavigation(fleet);
            }
        }

        // Avanzar al siguiente lote
        this.currentBatchIndex = (this.currentBatchIndex + 1) % Math.max(1, this.fleetBatches.length);
        this.stats.activeNavigations = activeFleets.length;
    }

    /**
     * 🚀 Procesar navegación de una nave individual
     */
    processFleetNavigation(fleet) {
        if (!fleet.target || !fleet.isMoving) return;

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
            return;
        }

        // 3. Detectar obstáculos en la ruta
        const obstacles = this.obstacleDetector.detectObstaclesInRoute(fleet, arrivalPoint);
        
        // 4. Recalcular ruta si hay obstáculos
        if (obstacles.length > 0) {
            this.handleObstacleAvoidance(fleet, obstacles, arrivalPoint);
            this.stats.obstaclesDetected++;
            this.stats.routesRecalculated++;
        }

        // 5. Actualizar trayectoria para visualización
        if (NAVIGATION_CONFIG.visualization.showTrajectories) {
            this.updateFleetTrajectory(fleet, arrivalPoint, obstacles);
        }

        this.stats.fleetsProcessed++;
        
        // Debug timing
        if (NAVIGATION_CONFIG.debug.showCalculationTime) {
            const calcTime = performance.now() - startTime;
            if (calcTime > 2) { // Solo mostrar si toma más de 2ms
                console.log(`🧭 Navegación nave ${fleet.id}: ${calcTime.toFixed(2)}ms`);
            }
        }
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
        
        // Limpiar trayectoria de visualización
        this.trajectoryCache.delete(fleet.id);
        
        console.log(`🎯 Nave ${fleet.id} llegó a ${fleet.target.id}`);
    }

    /**
     * 🎨 Actualizar trayectoria de una nave para visualización
     */
    updateFleetTrajectory(fleet, target, obstacles) {
        const trajectory = {
            fleet: fleet,
            start: { x: fleet.x, y: fleet.y },
            end: { x: target.x, y: target.y },
            obstacles: obstacles,
            timestamp: Date.now(),
            color: fleet.color || NAVIGATION_CONFIG.visualization.trajectoryColor
        };
        
        this.trajectoryCache.set(fleet.id, trajectory);
    }

    /**
     * 🎨 Actualizar visualización de trayectorias
     */
    updateVisualization(fleets) {
        if (!this.canvasRenderer || !this.config.visualization.showTrajectories) {
            return;
        }
        
        // 🔧 USAR SISTEMA DE OVERLAY EXISTENTE
        if (!this.canvasRenderer.addDragLine) {
            console.log('⚠️ Sistema de overlay no disponible');
            return;
        }
        
        // Limpiar trayectorias anteriores
        this.clearVisualization();
        
        // Dibujar trayectorias de flotas activas
        const activeFleets = fleets.filter(fleet => fleet.isMoving && !fleet.hasArrived);
        
        if (activeFleets.length > 0) {
            console.log(`🎨 Dibujando ${activeFleets.length} trayectorias blancas usando overlay system`);
        }
        
        activeFleets.forEach(fleet => {
            this.drawFleetTrajectory(fleet);
        });
    }

    /**
     * 🎨 Dibujar trayectoria de una flota
     */
    drawFleetTrajectory(fleet) {
        if (!this.canvasRenderer || !this.canvasRenderer.addDragLine) {
            console.log('❌ No hay sistema de overlay disponible');
            return;
        }
        
        // 🔧 USAR addDragLine del CanvasRenderer
        const trajectoryId = `trajectory_${fleet.id}`;
        
        this.canvasRenderer.addDragLine(
            trajectoryId,
            fleet.x,
            fleet.y,
            fleet.targetX,
            fleet.targetY,
            {
                color: this.config.visualization.trajectoryColor,
                width: this.config.visualization.trajectoryWidth,
                opacity: this.config.visualization.trajectoryOpacity,
                dashArray: [5, 5], // Línea punteada
                animation: null
            }
        );
        
        // 🔧 TEMPORAL: Log para verificar que se dibuja
        console.log(`🎨 Trayectoria BLANCA añadida para flota ${fleet.id}: (${fleet.x.toFixed(1)}, ${fleet.y.toFixed(1)}) → (${fleet.targetX.toFixed(1)}, ${fleet.targetY.toFixed(1)})`);
    }

    /**
     * 🧹 Limpiar visualización
     */
    clearVisualization() {
        if (this.canvasRenderer && this.canvasRenderer.clearDragLines) {
            // Solo limpiar trayectorias, no todas las líneas de drag
            // Por ahora limpiaremos todas, pero esto se puede optimizar
            const trajectoryIds = [];
            
            // Recopilar IDs de trayectorias
            if (this.canvasRenderer.overlayElements && this.canvasRenderer.overlayElements.dragLines) {
                this.canvasRenderer.overlayElements.dragLines.forEach(line => {
                    if (line.id.startsWith('trajectory_')) {
                        trajectoryIds.push(line.id);
                    }
                });
                
                // Remover solo las trayectorias
                trajectoryIds.forEach(id => {
                    this.canvasRenderer.removeDragLine(id);
                });
            }
        }
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
        this.obstacleDetector.cleanupCache();
        
        // Limpiar trayectorias antiguas
        const now = Date.now();
        const maxAge = NAVIGATION_CONFIG.visualization.fadeOutTime;
        
        for (const [fleetId, trajectory] of this.trajectoryCache.entries()) {
            if (now - trajectory.timestamp > maxAge) {
                this.trajectoryCache.delete(fleetId);
            }
        }
    }

    /**
     * 📊 Actualizar estadísticas de rendimiento
     */
    updateStats(processingTime) {
        // Promedio móvil del tiempo de procesamiento
        this.stats.averageProcessingTime = 
            (this.stats.averageProcessingTime * 0.9) + (processingTime * 0.1);
    }

    /**
     * 🎛️ Configuración dinámica
     */
    setUpdateInterval(frames) {
        this.updateInterval = Math.max(1, frames);
        NavigationConfigManager.updateInterval(frames);
    }

    setVisualization(enabled) {
        NavigationConfigManager.setVisualization(enabled);
        if (!enabled) {
            this.trajectoryCache.clear();
        }
    }

    setDebugMode(enabled) {
        NavigationConfigManager.setDebugMode(enabled);
    }

    /**
     * 📊 Obtener estadísticas completas
     */
    getStats() {
        return {
            navigation: this.stats,
            obstacles: this.obstacleDetector.getStats(),
            arrivals: this.arrivalSystem.getStats(),
            trajectories: this.trajectoryCache.size
        };
    }

    /**
     * 🧹 Cleanup completo
     */
    destroy() {
        this.obstacleDetector.destroy();
        this.arrivalSystem.destroy();
        this.trajectoryCache.clear();
        this.fleetBatches = [];
        console.log('🧭 NavigationSystem destruido');
    }

    /**
     * 🚀 Procesar una flota individual
     */
    processFleet(fleet, planets) {
        // 🔧 REDUCIR SPAM: Solo log ocasionalmente
        if (this.config.debug.enabled && Math.random() < 0.01) { // 1% de probabilidad
            console.log(`🧭 Procesando flota ${fleet.id}: (${fleet.x.toFixed(1)}, ${fleet.y.toFixed(1)}) → (${fleet.targetX.toFixed(1)}, ${fleet.targetY.toFixed(1)})`);
        }
        
        // Crear un objeto target para el ObstacleDetector
        const target = {
            x: fleet.targetX,
            y: fleet.targetY
        };
        
        // Detectar obstáculos en la trayectoria
        const obstacles = this.obstacleDetector.detectObstaclesInRoute(fleet, target);
        
        if (obstacles.length > 0 && this.config.debug.logObstacles) {
            console.log(`🚧 Obstáculos detectados para flota ${fleet.id}:`, obstacles.length);
        }
        
        // Por ahora, solo registrar la flota para visualización
        fleet.navigationData = {
            obstacles: obstacles,
            hasNavigation: true,
            lastUpdate: Date.now()
        };
    }
}

export default NavigationSystem; 