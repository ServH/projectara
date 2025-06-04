/**
 * 🔧 LEGACY FLEET ADAPTER - Adaptador de Compatibilidad
 * Adaptador para hacer compatible el nuevo Fleet.js con el gameEngine existente
 * Convierte entre el sistema antiguo y el nuevo sistema de steering behaviors
 */

import { Vector2D } from '../utils/Vector2D.js';
import { Fleet } from '../entities/Fleet.js';
import { GALCON_STEERING_CONFIG_PROBADA, selectRandomFormation } from '../config/SteeringConfig.js';

export class LegacyFleetAdapter {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.fleetMap = new Map(); // Mapeo de IDs legacy → Fleet nuevo
        this.legacyFleetMap = new Map(); // Mapeo Fleet nuevo → datos legacy
        
        console.log('🔧 LegacyFleetAdapter inicializado');
    }

    /**
     * 🔄 Crear Fleet nuevo desde datos legacy
     */
    createFromLegacyData(legacyFleetData) {
        // Convertir posiciones legacy a Vector2D
        const startPosition = new Vector2D(legacyFleetData.x, legacyFleetData.y);
        const targetPosition = new Vector2D(legacyFleetData.targetX, legacyFleetData.targetY);
        
        // Seleccionar formación aleatoria
        const formation = selectRandomFormation();
        
        // Crear configuración específica para esta flota
        const fleetConfig = {
            ...GALCON_STEERING_CONFIG_PROBADA,
            fleet: {
                ...GALCON_STEERING_CONFIG_PROBADA.fleet,
                formation: formation,
                size: legacyFleetData.ships
            }
        };
        
        // Crear nueva flota
        const newFleet = new Fleet(
            startPosition,
            targetPosition,
            fleetConfig,
            legacyFleetData.ships
        );
        
        // Mapear propiedades legacy
        this.mapLegacyProperties(newFleet, legacyFleetData);
        
        // Guardar mapeos
        this.fleetMap.set(legacyFleetData.id, newFleet);
        this.legacyFleetMap.set(newFleet, legacyFleetData);
        
        console.log(`🔄 Fleet legacy ${legacyFleetData.id} convertida a steering behaviors (${formation})`);
        
        return newFleet;
    }

    /**
     * 🗺️ Mapear propiedades legacy al nuevo Fleet
     */
    mapLegacyProperties(newFleet, legacyData) {
        // Propiedades básicas
        newFleet.legacyId = legacyData.id;
        newFleet.owner = legacyData.owner || 'player';
        newFleet.fromPlanet = legacyData.fromPlanet;
        newFleet.toPlanet = legacyData.toPlanet;
        newFleet.ships = legacyData.ships;
        
        // Propiedades de gameplay
        newFleet.speed = legacyData.speed || 1;
        newFleet.color = legacyData.color || '#00aaff';
        newFleet.selected = legacyData.selected || false;
        
        // Propiedades de estado
        newFleet.creationTime = legacyData.creationTime || Date.now();
        newFleet.distanceTraveled = legacyData.distanceTraveled || 0;
        
        // Configurar vehículos con propiedades legacy
        newFleet.vehicles.forEach((vehicle, index) => {
            vehicle.legacyId = `${legacyData.id}_ship_${index}`;
            vehicle.owner = newFleet.owner;
            vehicle.color = newFleet.color;
        });
    }

    /**
     * 🔄 Convertir Fleet nuevo a datos legacy
     */
    convertToLegacyData(fleet) {
        const legacyData = this.legacyFleetMap.get(fleet);
        
        if (!legacyData) {
            // Crear datos legacy si no existen
            return this.createLegacyDataFromFleet(fleet);
        }
        
        // Actualizar datos legacy con estado actual
        legacyData.x = fleet.averagePosition.x;
        legacyData.y = fleet.averagePosition.y;
        legacyData.targetX = fleet.targetPosition.x;
        legacyData.targetY = fleet.targetPosition.y;
        legacyData.ships = fleet.vehicles.filter(v => !v.hasArrived).length;
        legacyData.hasArrived = fleet.hasArrived;
        
        // Calcular velocidad promedio
        if (fleet.averageVelocity) {
            legacyData.velocityX = fleet.averageVelocity.x;
            legacyData.velocityY = fleet.averageVelocity.y;
            legacyData.speed = fleet.averageVelocity.magnitude();
        }
        
        return legacyData;
    }

    /**
     * 🆕 Crear datos legacy desde Fleet nuevo
     */
    createLegacyDataFromFleet(fleet) {
        const legacyData = {
            id: fleet.legacyId || fleet.id,
            x: fleet.averagePosition.x,
            y: fleet.averagePosition.y,
            targetX: fleet.targetPosition.x,
            targetY: fleet.targetPosition.y,
            ships: fleet.vehicles.length,
            owner: fleet.owner || 'player',
            color: fleet.color || '#00aaff',
            speed: fleet.averageVelocity ? fleet.averageVelocity.magnitude() : 0,
            velocityX: fleet.averageVelocity ? fleet.averageVelocity.x : 0,
            velocityY: fleet.averageVelocity ? fleet.averageVelocity.y : 0,
            hasArrived: fleet.hasArrived,
            selected: fleet.selected || false,
            creationTime: fleet.creationTime || Date.now(),
            fromPlanet: fleet.fromPlanet,
            toPlanet: fleet.toPlanet
        };
        
        this.legacyFleetMap.set(fleet, legacyData);
        return legacyData;
    }

    /**
     * 🔍 Obtener Fleet nuevo por ID legacy
     */
    getFleetByLegacyId(legacyId) {
        return this.fleetMap.get(legacyId);
    }

    /**
     * 📊 Obtener datos legacy por Fleet nuevo
     */
    getLegacyDataByFleet(fleet) {
        return this.legacyFleetMap.get(fleet);
    }

    /**
     * 🔄 Actualizar todas las flotas
     */
    updateAllFleets(deltaTime, obstacles, spatialHash) {
        this.fleetMap.forEach((fleet, legacyId) => {
            if (fleet.isActive && !fleet.hasArrived) {
                fleet.update(deltaTime, obstacles, spatialHash);
                
                // Actualizar datos legacy
                this.convertToLegacyData(fleet);
            }
        });
    }

    /**
     * 🎨 Renderizar todas las flotas
     */
    renderAllFleets(ctx, debugConfig) {
        this.fleetMap.forEach(fleet => {
            if (fleet.isActive) {
                fleet.render(ctx, debugConfig);
            }
        });
    }

    /**
     * 🗑️ Remover flota
     */
    removeFleet(legacyId) {
        const fleet = this.fleetMap.get(legacyId);
        
        if (fleet) {
            fleet.destroy();
            this.legacyFleetMap.delete(fleet);
            this.fleetMap.delete(legacyId);
            
            console.log(`🗑️ Fleet legacy ${legacyId} removida`);
        }
    }

    /**
     * 🧹 Limpiar flotas inactivas
     */
    cleanup() {
        const fleetsToRemove = [];
        
        this.fleetMap.forEach((fleet, legacyId) => {
            if (!fleet.isActive || (fleet.hasArrived && fleet.frameCounter > 300)) {
                fleetsToRemove.push(legacyId);
            }
        });
        
        fleetsToRemove.forEach(legacyId => {
            this.removeFleet(legacyId);
        });
        
        if (fleetsToRemove.length > 0) {
            console.log(`🧹 ${fleetsToRemove.length} flotas inactivas removidas`);
        }
    }

    /**
     * 📊 Obtener estadísticas del adaptador
     */
    getStats() {
        const activeFleets = Array.from(this.fleetMap.values()).filter(f => f.isActive);
        const arrivedFleets = Array.from(this.fleetMap.values()).filter(f => f.hasArrived);
        
        return {
            totalFleets: this.fleetMap.size,
            activeFleets: activeFleets.length,
            arrivedFleets: arrivedFleets.length,
            totalVehicles: activeFleets.reduce((sum, f) => sum + f.vehicles.length, 0),
            averageFleetSize: activeFleets.length > 0 ? 
                activeFleets.reduce((sum, f) => sum + f.vehicles.length, 0) / activeFleets.length : 0
        };
    }

    /**
     * 🔧 Integrar con gameEngine existente
     */
    integrateWithGameEngine() {
        const originalAddFleet = this.gameEngine.addFleet.bind(this.gameEngine);
        const originalUpdateFleets = this.gameEngine.updateFleets.bind(this.gameEngine);
        const originalRenderFleets = this.gameEngine.renderFleets.bind(this.gameEngine);
        
        // Interceptar addFleet
        this.gameEngine.addFleet = (fleetData) => {
            // Crear Fleet nuevo en lugar del legacy
            const newFleet = this.createFromLegacyData(fleetData);
            
            // Llamar al método original con datos convertidos
            const legacyData = this.convertToLegacyData(newFleet);
            return originalAddFleet(legacyData);
        };
        
        // Interceptar updateFleets
        this.gameEngine.updateFleets = (deltaTime) => {
            // Obtener obstáculos del gameEngine
            const obstacles = this.gameEngine.planets || [];
            const spatialHash = this.gameEngine.spatialHash;
            
            // Actualizar con steering behaviors
            this.updateAllFleets(deltaTime, obstacles, spatialHash);
            
            // Llamar al método original para compatibilidad
            return originalUpdateFleets(deltaTime);
        };
        
        // Interceptar renderFleets
        this.gameEngine.renderFleets = (ctx) => {
            const debugConfig = this.gameEngine.config?.debug || GALCON_STEERING_CONFIG_PROBADA.debug;
            
            // Renderizar con steering behaviors
            this.renderAllFleets(ctx, debugConfig);
            
            // No llamar al método original para evitar doble renderizado
        };
        
        console.log('🔧 GameEngine integrado con steering behaviors');
    }

    /**
     * 🔄 Restaurar gameEngine original
     */
    restoreGameEngine() {
        // Implementar rollback si es necesario
        console.log('🔄 GameEngine restaurado al estado original');
    }

    /**
     * 🎯 Actualizar objetivo de flota
     */
    updateFleetTarget(legacyId, newTarget) {
        const fleet = this.fleetMap.get(legacyId);
        
        if (fleet) {
            const targetVector = new Vector2D(newTarget.x, newTarget.y);
            fleet.updateTarget(targetVector);
            
            // Actualizar datos legacy
            this.convertToLegacyData(fleet);
        }
    }

    /**
     * 🔄 Cambiar formación de flota
     */
    changeFleetFormation(legacyId, newFormation) {
        const fleet = this.fleetMap.get(legacyId);
        
        if (fleet) {
            fleet.setFormation(newFormation);
            console.log(`🔄 Fleet ${legacyId} formación cambiada a ${newFormation}`);
        }
    }

    /**
     * 📊 Debug: Obtener información detallada
     */
    getDebugInfo() {
        const fleets = Array.from(this.fleetMap.values());
        
        return {
            adapter: this.getStats(),
            fleets: fleets.map(fleet => fleet.getStats()),
            formations: fleets.reduce((acc, fleet) => {
                acc[fleet.formation] = (acc[fleet.formation] || 0) + 1;
                return acc;
            }, {}),
            totalVehicles: fleets.reduce((sum, f) => sum + f.vehicles.length, 0),
            avoidingVehicles: fleets.reduce((sum, f) => sum + f.debugInfo.avoidingVehicles, 0)
        };
    }
} 