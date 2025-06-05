/**
 * 🎯 FLEET REDIRECTION LOGIC MANAGER
 * Gestor especializado para la lógica de redirección de flotas
 * Responsabilidad única: Ejecutar la redirección de flotas y cálculos de trayectoria
 */

import eventBus, { GAME_EVENTS } from '../../core/EventBus.js';

export class FleetRedirectionLogicManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado de redirección
        this.redirectionQueue = [];
        this.activeRedirections = new Map();
        
        // Estadísticas de redirección
        this.stats = {
            totalRedirections: 0,
            successfulRedirections: 0,
            failedRedirections: 0,
            averageRedirectionTime: 0,
            lastRedirectionTime: 0
        };
        
        // Callbacks configurables
        this.callbacks = {
            onRedirectionStarted: null,
            onRedirectionCompleted: null,
            onRedirectionFailed: null,
            onBatchRedirectionCompleted: null
        };
        
        console.log('🎯 FleetRedirectionLogicManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * 🎯 Redirigir flotas seleccionadas a un objetivo
     */
    redirectFleets(fleetIds, targetPlanet) {
        if (!Array.isArray(fleetIds) || fleetIds.length === 0) {
            console.warn('⚠️ No hay flotas para redirigir');
            return { success: false, redirectedCount: 0, errors: ['No fleets provided'] };
        }

        if (!this.isValidTarget(targetPlanet)) {
            console.warn(`⚠️ Objetivo inválido para redirección: ${targetPlanet?.id}`);
            return { success: false, redirectedCount: 0, errors: ['Invalid target planet'] };
        }

        console.log(`🎯 Iniciando redirección de ${fleetIds.length} flotas a ${targetPlanet.id}`);
        
        const results = {
            success: true,
            redirectedCount: 0,
            failedCount: 0,
            errors: [],
            redirectedFleets: [],
            failedFleets: []
        };

        // Procesar cada flota
        for (const fleetId of fleetIds) {
            const fleet = this.gameEngine.fleets.get(fleetId);
            if (!fleet) {
                results.errors.push(`Fleet ${fleetId} not found`);
                results.failedFleets.push(fleetId);
                results.failedCount++;
                continue;
            }

            const redirectResult = this.redirectSingleFleet(fleet, targetPlanet);
            if (redirectResult.success) {
                results.redirectedCount++;
                results.redirectedFleets.push(fleet.id);
            } else {
                results.failedCount++;
                results.failedFleets.push(fleet.id);
                results.errors.push(...redirectResult.errors);
            }
        }

        // Actualizar estadísticas
        this.updateStats(results);
        
        // Emitir evento de batch redirection
        eventBus.emit(GAME_EVENTS.FLEET_BATCH_REDIRECTED, {
            targetPlanet: targetPlanet.id,
            results,
            timestamp: Date.now()
        });

        if (this.callbacks.onBatchRedirectionCompleted) {
            this.callbacks.onBatchRedirectionCompleted({
                targetPlanet,
                results
            });
        }

        console.log(`🎯 Redirección completada: ${results.redirectedCount} exitosas, ${results.failedCount} fallidas`);
        return results;
    }

    /**
     * 🚁 Redirigir una flota individual
     */
    redirectSingleFleet(fleet, targetPlanet) {
        const startTime = Date.now();
        
        try {
            // Validaciones
            if (!this.isValidFleetForRedirection(fleet)) {
                return {
                    success: false,
                    errors: [`Fleet ${fleet.id} is not valid for redirection`]
                };
            }

            if (!this.isValidTarget(targetPlanet)) {
                return {
                    success: false,
                    errors: [`Target planet ${targetPlanet?.id} is not valid`]
                };
            }

            // Guardar estado anterior
            const oldTarget = fleet.toPlanet;
            const oldProgress = fleet.traveledDistance;
            
            // Calcular nueva trayectoria
            const trajectory = this.calculateTrajectory(fleet, targetPlanet);
            if (!trajectory.success) {
                return {
                    success: false,
                    errors: trajectory.errors
                };
            }

            // Aplicar redirección
            this.applyRedirection(fleet, targetPlanet, trajectory);
            
            // Registrar redirección activa
            this.activeRedirections.set(fleet.id, {
                fleetId: fleet.id,
                oldTarget,
                newTarget: targetPlanet.id,
                startTime,
                oldProgress,
                trajectory
            });

            // Emitir eventos
            eventBus.emit(GAME_EVENTS.FLEET_REDIRECTED, {
                fleetId: fleet.id,
                fleet: fleet,
                oldTarget,
                newTarget: targetPlanet.id,
                trajectory,
                timestamp: Date.now()
            });

            if (this.callbacks.onRedirectionCompleted) {
                this.callbacks.onRedirectionCompleted({
                    fleet,
                    oldTarget,
                    newTarget: targetPlanet,
                    trajectory,
                    duration: Date.now() - startTime
                });
            }

            console.log(`🚁 Flota ${fleet.id} redirigida: ${oldTarget} → ${targetPlanet.id}`);
            return { success: true };

        } catch (error) {
            console.error(`❌ Error redirigiendo flota ${fleet.id}:`, error);
            
            if (this.callbacks.onRedirectionFailed) {
                this.callbacks.onRedirectionFailed({
                    fleet,
                    targetPlanet,
                    error: error.message,
                    duration: Date.now() - startTime
                });
            }

            return {
                success: false,
                errors: [error.message]
            };
        }
    }

    /**
     * 📐 Calcular trayectoria de redirección
     */
    calculateTrajectory(fleet, targetPlanet) {
        try {
            // Calcular distancia y dirección
            const dx = targetPlanet.x - fleet.x;
            const dy = targetPlanet.y - fleet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) {
                return {
                    success: false,
                    errors: ['Fleet is already at target position']
                };
            }

            // Calcular dirección normalizada
            const directionX = dx / distance;
            const directionY = dy / distance;

            // Calcular tiempo estimado de llegada
            const speed = fleet.speed || this.config.defaultFleetSpeed;
            const estimatedTime = distance / speed;

            // Calcular ángulo de trayectoria
            const angle = Math.atan2(dy, dx);

            return {
                success: true,
                distance,
                directionX,
                directionY,
                angle,
                estimatedTime,
                speed
            };

        } catch (error) {
            return {
                success: false,
                errors: [`Trajectory calculation failed: ${error.message}`]
            };
        }
    }

    /**
     * ✅ Aplicar redirección a la flota
     */
    applyRedirection(fleet, targetPlanet, trajectory) {
        // Actualizar destino
        fleet.toPlanet = targetPlanet.id;
        fleet.targetX = targetPlanet.x;
        fleet.targetY = targetPlanet.y;
        
        // Actualizar dirección y distancia
        fleet.directionX = trajectory.directionX;
        fleet.directionY = trajectory.directionY;
        fleet.totalDistance = trajectory.distance;
        
        // Resetear progreso de viaje
        fleet.traveledDistance = 0;
        fleet.progress = 0;
        
        // Actualizar tiempo estimado
        fleet.estimatedArrivalTime = Date.now() + (trajectory.estimatedTime * 1000);
        
        // Marcar como redirigida
        fleet.isRedirected = true;
        fleet.redirectionTime = Date.now();
        
        console.log(`✅ Redirección aplicada a flota ${fleet.id}`);
    }

    /**
     * 🔍 Verificar si una flota es válida para redirección
     */
    isValidFleetForRedirection(fleet) {
        if (!fleet || !fleet.id) {
            return false;
        }

        // Verificar que la flota existe
        const gameFleet = this.gameEngine.fleets.get(fleet.id);
        if (!gameFleet) {
            return false;
        }

        // Verificar que es del jugador actual
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        if (fleet.owner !== currentPlayer) {
            return false;
        }

        // Verificar que está en vuelo
        if (!fleet.isInFlight) {
            return false;
        }

        // Verificar que no está llegando ya
        if (fleet.progress >= 0.95) {
            return false;
        }

        return true;
    }

    /**
     * 🎯 Verificar si un planeta es un objetivo válido
     */
    isValidTarget(planet) {
        if (!planet || !planet.id) {
            return false;
        }

        // Verificar que el planeta existe
        const gamePlanet = this.gameEngine.planets.get(planet.id);
        if (!gamePlanet) {
            return false;
        }

        // Verificar que no es del jugador actual (no puede redirigir a sus propios planetas)
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        if (planet.owner === currentPlayer) {
            return false;
        }

        return true;
    }

    /**
     * 🔄 Procesar redirecciones en cola
     */
    processRedirectionQueue() {
        if (this.redirectionQueue.length === 0) {
            return;
        }

        const batch = this.redirectionQueue.splice(0, this.config.maxBatchSize || 10);
        
        for (const redirection of batch) {
            this.redirectSingleFleet(redirection.fleet, redirection.target);
        }
    }

    /**
     * ➕ Añadir redirección a la cola
     */
    queueRedirection(fleet, targetPlanet) {
        this.redirectionQueue.push({
            fleet,
            target: targetPlanet,
            timestamp: Date.now()
        });
        
        console.log(`➕ Redirección añadida a cola: ${fleet.id} → ${targetPlanet.id}`);
    }

    /**
     * 🧹 Limpiar redirecciones completadas
     */
    cleanupCompletedRedirections() {
        let cleanedCount = 0;
        
        for (const [fleetId, redirection] of this.activeRedirections) {
            const fleet = this.gameEngine.fleets.get(fleetId);
            
            // Si la flota ya no existe o llegó a destino
            if (!fleet || !fleet.isInFlight || fleet.progress >= 1.0) {
                this.activeRedirections.delete(fleetId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 ${cleanedCount} redirecciones completadas limpiadas`);
        }
        
        return cleanedCount;
    }

    /**
     * 📊 Actualizar estadísticas
     */
    updateStats(results) {
        this.stats.totalRedirections += results.redirectedCount + results.failedCount;
        this.stats.successfulRedirections += results.redirectedCount;
        this.stats.failedRedirections += results.failedCount;
        this.stats.lastRedirectionTime = Date.now();
        
        // Calcular tiempo promedio (simplificado)
        if (this.stats.successfulRedirections > 0) {
            this.stats.averageRedirectionTime = 
                (this.stats.averageRedirectionTime * (this.stats.successfulRedirections - results.redirectedCount) + 
                 results.redirectedCount * 50) / this.stats.successfulRedirections; // 50ms promedio estimado
        }
    }

    /**
     * 📊 Obtener estadísticas de redirección
     */
    getRedirectionStats() {
        return {
            ...this.stats,
            activeRedirections: this.activeRedirections.size,
            queuedRedirections: this.redirectionQueue.length,
            successRate: this.stats.totalRedirections > 0 ? 
                (this.stats.successfulRedirections / this.stats.totalRedirections) * 100 : 0
        };
    }

    /**
     * 🔍 Obtener redirecciones activas
     */
    getActiveRedirections() {
        return Array.from(this.activeRedirections.values());
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Configuración de FleetRedirectionLogicManager actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        return {
            stats: { ...this.stats },
            activeRedirections: this.activeRedirections.size,
            queuedRedirections: this.redirectionQueue.length,
            config: this.config,
            hasCallbacks: Object.keys(this.callbacks).filter(key => this.callbacks[key] !== null)
        };
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        // Limpiar cola y redirecciones activas
        this.redirectionQueue = [];
        this.activeRedirections.clear();
        
        // Limpiar referencias
        this.gameEngine = null;
        this.callbacks = {};
        this.config = null;
        
        console.log('💥 FleetRedirectionLogicManager destruido');
    }
} 