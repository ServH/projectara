/**
 * 🧭 GALCON GAME - SISTEMA DE NAVEGACIÓN PRINCIPAL
 * Coordinador de detección de obstáculos, llegada realista y visualización
 * MILESTONE 2.3: Navegación inteligente completa
 */

import { NAVIGATION_CONFIG, NavigationConfigManager } from './NavigationConfig.js';
import ObstacleDetector from './ObstacleDetector.js';
import ArrivalSystem from './ArrivalSystem.js';

export class NavigationSystem {
    constructor(gameEngine, canvasRenderer) {
        this.gameEngine = gameEngine;
        this.canvasRenderer = canvasRenderer;
        
        // 🔧 ARREGLO: Inicializar configuración
        this.config = NAVIGATION_CONFIG;
        
        // Subsistemas
        this.obstacleDetector = new ObstacleDetector(gameEngine);
        this.arrivalSystem = new ArrivalSystem();
        
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
        
        // Estadísticas de rendimiento
        this.stats = {
            fleetsProcessed: 0,
            obstaclesDetected: 0,
            routesRecalculated: 0,
            averageProcessingTime: 0,
            activeNavigations: 0
        };
        
        console.log('🧭 NavigationSystem inicializado - Navegación inteligente activa');
    }

    /**
     * 🔄 Actualizar sistema de navegación
     */
    update() {
        if (!this.gameEngine) return;
        
        const fleets = this.gameEngine.getAllFleets();
        const planets = this.gameEngine.getAllPlanets();
        
        // 🔧 REDUCIR SPAM: Solo log cada N frames
        this.logCounter++;
        if (this.config.debug.enabled && this.logCounter >= this.logInterval) {
            console.log(`🧭 NavigationSystem procesando ${fleets.length} flotas y ${planets.length} planetas`);
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