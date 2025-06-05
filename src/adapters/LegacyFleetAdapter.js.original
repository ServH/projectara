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
        const startPosition = new Vector2D(legacyFleetData.startX || legacyFleetData.x, legacyFleetData.startY || legacyFleetData.y);
        const targetPosition = new Vector2D(legacyFleetData.targetX, legacyFleetData.targetY);
        
        // 🔧 NUEVO: Pasar datos del juego para mecánicas
        const gameData = {
            owner: legacyFleetData.owner,
            fromPlanet: legacyFleetData.fromPlanet,
            toPlanet: legacyFleetData.toPlanet,
            color: legacyFleetData.color
        };
        
        // Crear Fleet con steering behaviors
        const newFleet = new Fleet(
            startPosition, 
            targetPosition, 
            GALCON_STEERING_CONFIG_PROBADA, 
            legacyFleetData.ships,
            gameData // 🔧 NUEVO: Pasar datos del juego
        );
        
        // Mapear propiedades legacy adicionales
        this.mapLegacyProperties(newFleet, legacyFleetData);
        
        // Guardar mapeo bidireccional
        this.fleetMap.set(legacyFleetData.id, newFleet);
        this.legacyFleetMap.set(newFleet, legacyFleetData);
        
        console.log(`🔄 Fleet legacy ${legacyFleetData.id} convertida a steering behaviors: ${legacyFleetData.ships} naves de ${legacyFleetData.owner}`);
        
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
     * 🔄 Actualizar todas las flotas con planetas destino específicos
     */
    updateAllFleetsWithTargets(deltaTime, planets, spatialHash) {
        const fleetsToRemove = [];
        
        this.fleetMap.forEach((fleet, legacyId) => {
            if (fleet.isActive && !fleet.hasArrived) {
                // Obtener el planeta destino de esta flota
                const legacyData = this.legacyFleetMap.get(fleet);
                const targetPlanetId = legacyData ? legacyData.toPlanet : null;
                
                // 🔧 NUEVO: Verificar si la flota se alejó del planeta origen
                this.checkFleetDeparture(fleet, legacyData, planets);
                
                // Crear obstáculos excluyendo el planeta destino
                const obstacles = this.convertPlanetsToObstaclesForFleet(planets, targetPlanetId);
                
                // Actualizar spatial hash con obstáculos específicos
                if (spatialHash) {
                    spatialHash.clear();
                    obstacles.forEach(obstacle => {
                        spatialHash.insert(obstacle, obstacle.position);
                    });
                }
                
                // Actualizar la flota
                fleet.update(deltaTime, obstacles, spatialHash);
            } else if (fleet.hasArrived && fleet.isActive) {
                // 🔧 NUEVO: Flota ha llegado pero aún está activa - marcar para eliminación
                console.log(`🗑️ Marcando flota ${legacyId} para eliminación (llegó al destino)`);
                fleetsToRemove.push(legacyId);
            } else if (!fleet.isActive) {
                // 🔧 NUEVO: Flota inactiva - marcar para eliminación
                console.log(`🗑️ Marcando flota ${legacyId} para eliminación (inactiva)`);
                fleetsToRemove.push(legacyId);
            }
        });
        
        // Eliminar flotas marcadas
        fleetsToRemove.forEach(legacyId => {
            this.removeFleet(legacyId);
        });
    }
    
    /**
     * 🔧 NUEVO: Verificar si una flota se alejó del planeta origen
     */
    checkFleetDeparture(fleet, legacyData, planets) {
        if (!legacyData || !legacyData.fromPlanet || fleet.hasDeparted) {
            return;
        }
        
        // Encontrar el planeta origen
        const originPlanet = planets.find(p => p.id === legacyData.fromPlanet);
        if (!originPlanet) {
            return;
        }
        
        // Calcular distancia al planeta origen
        const distanceFromOrigin = fleet.averagePosition.distance(new Vector2D(originPlanet.x, originPlanet.y));
        const departureDistance = originPlanet.radius * 3; // 3 veces el radio del planeta
        
        // Si la flota se alejó lo suficiente, notificar al planeta
        if (distanceFromOrigin > departureDistance) {
            fleet.hasDeparted = true;
            if (originPlanet.notifyFleetDeparted) {
                originPlanet.notifyFleetDeparted();
                console.log(`🚀 Flota ${legacyData.id} se alejó del planeta ${legacyData.fromPlanet} (distancia: ${distanceFromOrigin.toFixed(1)})`);
            }
        }
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
        // Verificar que gameEngine existe
        if (!this.gameEngine) {
            console.warn('⚠️ GameEngine no disponible para integración');
            return;
        }
        
        // Guardar referencia original del método onFleetLaunched si existe
        if (this.gameEngine.onFleetLaunched && typeof this.gameEngine.onFleetLaunched === 'function') {
            this.originalOnFleetLaunched = this.gameEngine.onFleetLaunched.bind(this.gameEngine);
            
            // Interceptar onFleetLaunched para usar steering behaviors
            this.gameEngine.onFleetLaunched = (data) => {
                // Crear Fleet nuevo en lugar del legacy
                const newFleet = this.createFromLegacyData(data);
                
                // Agregar a la colección de flotas del gameEngine
                this.gameEngine.fleets.set(data.id, newFleet);
                
                // Actualizar estadísticas
                this.gameEngine.stats.fleetsCount = this.gameEngine.fleets.size;
                
                console.log(`🔧 Fleet ${data.id} interceptada y convertida a steering behaviors`);
            };
        }
        
        // Interceptar el método update del gameEngine si es necesario
        if (this.gameEngine.update && typeof this.gameEngine.update === 'function') {
            this.originalUpdate = this.gameEngine.update.bind(this.gameEngine);
            
            // No interceptamos update por ahora para evitar conflictos
            // El NavigationSystem ya maneja la actualización
        }
        
        console.log('🔧 GameEngine integrado con steering behaviors (métodos interceptados)');
    }

    /**
     * 🔄 Restaurar gameEngine original
     */
    restoreGameEngine() {
        if (!this.gameEngine) return;
        
        // Restaurar método original si existe
        if (this.originalOnFleetLaunched) {
            this.gameEngine.onFleetLaunched = this.originalOnFleetLaunched;
            this.originalOnFleetLaunched = null;
        }
        
        if (this.originalUpdate) {
            this.gameEngine.update = this.originalUpdate;
            this.originalUpdate = null;
        }
        
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

    /**
     *  Convertir planetas a obstáculos para una flota específica (EXCLUYENDO SU DESTINO)
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
} 