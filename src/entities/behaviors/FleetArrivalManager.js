/**
 * 🎯 FLEET ARRIVAL MANAGER - Gestor de Llegadas de Flotas
 * Encapsula toda la lógica relacionada con la detección y procesamiento
 * de llegadas de flotas y vehículos individuales al destino
 */

import { Vector2D } from '../../utils/Vector2D.js';
import eventBus, { GAME_EVENTS } from '../../core/EventBus.js';

export class FleetArrivalManager {
    constructor() {
        this.arrivalThresholds = {
            default: 45,
            planetBased: 25 // Offset adicional al radio del planeta
        };
        this.cleanupDelay = {
            individual: 30, // frames
            complete: 60    // frames
        };
    }

    /**
     * Verificar si la flota ha llegado al destino
     * @param {Object} fleet - Instancia de la flota
     * @returns {boolean} True si la flota ha llegado
     */
    checkFleetArrival(fleet) {
        if (fleet.hasArrived) return true;

        const arrivedVehicles = fleet.vehicles.filter(v => v.hasArrived);
        const totalVehicles = fleet.vehicles.length;

        // Caso especial: nave individual
        if (totalVehicles === 1 && arrivedVehicles.length === 1) {
            return this.processFleetArrival(fleet, 'individual');
        }

        // Caso: todas las naves han llegado
        if (arrivedVehicles.length === totalVehicles && totalVehicles > 1) {
            return this.processFleetArrival(fleet, 'complete');
        }

        // Fallback: verificación por proximidad
        return this.checkProximityArrival(fleet);
    }

    /**
     * Verificar llegada por proximidad del centro de la flota
     * @param {Object} fleet 
     * @returns {boolean}
     */
    checkProximityArrival(fleet) {
        if (!fleet.averagePosition) return false;

        const distanceToTarget = fleet.averagePosition.distance(fleet.targetPosition);
        const threshold = this.calculateArrivalThreshold(fleet);

        if (distanceToTarget <= threshold) {
            console.log(`🎯 Flota ${fleet.id} llegó por proximidad (distancia: ${distanceToTarget.toFixed(1)}, umbral: ${threshold})`);
            return this.processFleetArrival(fleet, 'proximity');
        }

        return false;
    }

    /**
     * Calcular umbral de llegada basado en el planeta objetivo
     * @param {Object} fleet 
     * @returns {number}
     */
    calculateArrivalThreshold(fleet) {
        if (fleet.targetPlanet && fleet.targetPlanet.radius) {
            return fleet.targetPlanet.radius + this.arrivalThresholds.planetBased;
        }
        return this.arrivalThresholds.default;
    }

    /**
     * Procesar llegada de flota
     * @param {Object} fleet 
     * @param {string} arrivalType - 'individual', 'complete', 'proximity'
     * @returns {boolean}
     */
    processFleetArrival(fleet, arrivalType = 'complete') {
        if (fleet.arrivalProcessed) return true;

        fleet.hasArrived = true;
        fleet.arrivalProcessed = true;

        const arrivalData = this.createArrivalData(fleet, arrivalType);
        
        console.log(`🎯 ¡FLOTA LLEGÓ AL DESTINO! Tipo: ${arrivalType}`);
        console.log(`📊 Datos de llegada:`, {
            fleetId: arrivalData.fleetId,
            ships: arrivalData.ships,
            owner: arrivalData.owner,
            from: arrivalData.fromPlanet,
            to: arrivalData.toPlanet
        });

        // Emitir evento de llegada
        eventBus.emit(GAME_EVENTS.FLEET_ARRIVED, arrivalData);
        console.log(`✅ Evento FLEET_ARRIVED emitido para flota ${fleet.id}`);

        // Marcar flota como inactiva
        fleet.isActive = false;

        return true;
    }

    /**
     * Crear datos de llegada para el evento
     * @param {Object} fleet 
     * @param {string} arrivalType 
     * @returns {Object}
     */
    createArrivalData(fleet, arrivalType) {
        return {
            fleetId: fleet.id,
            legacyId: fleet.legacyId || fleet.id,
            ships: fleet.fleetSize,
            owner: fleet.owner,
            fromPlanet: fleet.fromPlanet,
            toPlanet: fleet.toPlanet,
            targetPlanet: fleet.targetPlanet,
            color: fleet.color,
            arrivalTime: Date.now(),
            arrivalType: arrivalType,
            // Datos de posición
            x: fleet.averagePosition?.x || fleet.targetPosition.x,
            y: fleet.averagePosition?.y || fleet.targetPosition.y,
            targetX: fleet.targetPosition.x,
            targetY: fleet.targetPosition.y
        };
    }

    /**
     * Procesar llegada de vehículo individual
     * @param {Object} vehicle 
     * @param {Object} fleet 
     */
    processIndividualVehicleArrival(vehicle, fleet) {
        if (vehicle.arrivalProcessed) return;

        vehicle.arrivalProcessed = true;

        const arrivalData = {
            fleetId: fleet.id,
            vehicleId: vehicle.legacyId || `${fleet.id}_vehicle`,
            ships: 1,
            owner: fleet.owner,
            fromPlanet: fleet.fromPlanet,
            toPlanet: fleet.toPlanet,
            targetPlanet: fleet.targetPlanet,
            color: fleet.color,
            arrivalTime: Date.now(),
            isIndividualArrival: true,
            x: vehicle.position.x,
            y: vehicle.position.y,
            targetX: fleet.targetPosition.x,
            targetY: fleet.targetPosition.y
        };

        console.log(`🎯 Vehículo individual llegó: ${vehicle.legacyId || 'unknown'}`);
        eventBus.emit(GAME_EVENTS.FLEET_ARRIVED, arrivalData);
    }

    /**
     * Limpiar vehículos que han llegado
     * @param {Object} fleet 
     * @returns {number} Número de vehículos eliminados
     */
    cleanupArrivedVehicles(fleet) {
        const arrivedVehicles = fleet.vehicles.filter(v => v.hasArrived);
        
        if (arrivedVehicles.length === 0) return 0;

        let removedCount = 0;

        // Procesar vehículos que han llegado
        arrivedVehicles.forEach(vehicle => {
            const framesArrived = fleet.frameCounter - (vehicle.arrivalFrame || fleet.frameCounter);
            
            // Procesar llegada individual si es necesario
            if (framesArrived > this.cleanupDelay.individual && !vehicle.arrivalProcessed) {
                this.processIndividualVehicleArrival(vehicle, fleet);
            }
        });

        // Eliminar vehículos que han estado llegados por suficiente tiempo
        const vehiclesToRemove = fleet.vehicles.filter(v => 
            v.hasArrived && 
            v.arrivalProcessed && 
            (fleet.frameCounter - (v.arrivalFrame || fleet.frameCounter)) > this.cleanupDelay.complete
        );

        if (vehiclesToRemove.length > 0) {
            fleet.vehicles = fleet.vehicles.filter(v => !vehiclesToRemove.includes(v));
            removedCount = vehiclesToRemove.length;

            console.log(`🗑️ Fleet ${fleet.id}: ${removedCount} naves eliminadas al llegar (${fleet.vehicles.length} restantes)`);

            // Si no quedan vehículos, marcar flota como completamente eliminada
            if (fleet.vehicles.length === 0) {
                fleet.hasArrived = true;
                fleet.isActive = false;
                console.log(`✅ Fleet ${fleet.id} completamente eliminada - todas las naves llegaron`);
            }
        }

        return removedCount;
    }

    /**
     * Actualizar umbrales de llegada
     * @param {Object} newThresholds 
     */
    updateThresholds(newThresholds) {
        this.arrivalThresholds = { ...this.arrivalThresholds, ...newThresholds };
    }

    /**
     * Actualizar delays de limpieza
     * @param {Object} newDelays 
     */
    updateCleanupDelays(newDelays) {
        this.cleanupDelay = { ...this.cleanupDelay, ...newDelays };
    }

    /**
     * Obtener estadísticas de llegadas
     * @param {Object} fleet 
     * @returns {Object}
     */
    getArrivalStats(fleet) {
        const arrivedVehicles = fleet.vehicles.filter(v => v.hasArrived);
        const totalVehicles = fleet.vehicles.length;
        
        return {
            arrivedCount: arrivedVehicles.length,
            totalCount: totalVehicles,
            arrivalPercentage: totalVehicles > 0 ? (arrivedVehicles.length / totalVehicles) * 100 : 0,
            hasArrived: fleet.hasArrived,
            isActive: fleet.isActive
        };
    }
} 