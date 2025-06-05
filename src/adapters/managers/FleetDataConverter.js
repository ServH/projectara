/**
 * 🔄 FLEET DATA CONVERTER
 * Gestor especializado para conversión de datos entre sistema legacy y nuevo
 * Responsabilidad única: Convertir datos de flotas entre formatos
 */

import { Vector2D } from '../../utils/Vector2D.js';
import { Fleet } from '../../entities/Fleet.js';
import { GALCON_STEERING_CONFIG_PROBADA } from '../../config/SteeringConfig.js';

export class FleetDataConverter {
    constructor() {
        console.log('🔄 FleetDataConverter inicializado');
    }

    /**
     * 🔄 Crear Fleet nuevo desde datos legacy
     */
    createFleetFromLegacyData(legacyFleetData) {
        const startPosition = new Vector2D(
            legacyFleetData.startX || legacyFleetData.x, 
            legacyFleetData.startY || legacyFleetData.y
        );
        const targetPosition = new Vector2D(legacyFleetData.targetX, legacyFleetData.targetY);
        
        // Preparar datos del juego para mecánicas
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
            gameData
        );
        
        // Mapear propiedades legacy adicionales
        this.mapLegacyPropertiesToFleet(newFleet, legacyFleetData);
        
        console.log(`🔄 Fleet legacy ${legacyFleetData.id} convertida: ${legacyFleetData.ships} naves de ${legacyFleetData.owner}`);
        
        return newFleet;
    }

    /**
     * 🗺️ Mapear propiedades legacy al nuevo Fleet
     */
    mapLegacyPropertiesToFleet(newFleet, legacyData) {
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
    convertFleetToLegacyData(fleet, existingLegacyData = null) {
        let legacyData;
        
        if (existingLegacyData) {
            // Actualizar datos legacy existentes
            legacyData = existingLegacyData;
        } else {
            // Crear nuevos datos legacy
            legacyData = this.createLegacyDataFromFleet(fleet);
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
        return {
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
    }

    /**
     * 🔄 Actualizar objetivo de flota
     */
    updateFleetTarget(fleet, newTarget) {
        const targetVector = new Vector2D(newTarget.x, newTarget.y);
        fleet.updateTarget(targetVector);
        console.log(`🎯 Objetivo de flota ${fleet.legacyId} actualizado`);
    }

    /**
     * 🔄 Cambiar formación de flota
     */
    changeFleetFormation(fleet, newFormation) {
        fleet.setFormation(newFormation);
        console.log(`🔄 Formación de flota ${fleet.legacyId} cambiada a ${newFormation}`);
    }

    /**
     * 🌍 Convertir planetas a obstáculos para una flota específica
     */
    convertPlanetsToObstaclesForFleet(planets, targetPlanetId) {
        return planets
            .filter(planet => planet.id !== targetPlanetId) // Excluir planeta destino
            .map(planet => ({
                position: { x: planet.x, y: planet.y },
                radius: planet.radius + 10, // Buffer de seguridad
                id: planet.id,
                type: 'planet'
            }));
    }

    /**
     * 🔍 Verificar si una flota se alejó del planeta origen
     */
    checkFleetDeparture(fleet, legacyData, planets) {
        if (!legacyData || !legacyData.fromPlanet || fleet.hasDeparted) {
            return false;
        }
        
        // Encontrar el planeta origen
        const originPlanet = planets.find(p => p.id === legacyData.fromPlanet);
        if (!originPlanet) {
            return false;
        }
        
        // Calcular distancia al planeta origen
        const distanceFromOrigin = fleet.averagePosition.distance(
            new Vector2D(originPlanet.x, originPlanet.y)
        );
        const departureDistance = originPlanet.radius * 3; // 3 veces el radio del planeta
        
        // Si la flota se alejó lo suficiente, marcar como partida
        if (distanceFromOrigin > departureDistance) {
            fleet.hasDeparted = true;
            
            // Notificar al planeta si tiene el método
            if (originPlanet.notifyFleetDeparted) {
                originPlanet.notifyFleetDeparted();
            }
            
            console.log(`🚀 Flota ${legacyData.id} se alejó del planeta ${legacyData.fromPlanet} (distancia: ${distanceFromOrigin.toFixed(1)})`);
            return true;
        }
        
        return false;
    }

    /**
     * 🔄 Validar datos legacy
     */
    validateLegacyData(legacyData) {
        const required = ['id', 'ships', 'targetX', 'targetY'];
        const missing = required.filter(field => legacyData[field] === undefined);
        
        if (missing.length > 0) {
            console.warn(`⚠️ Datos legacy incompletos, faltan: ${missing.join(', ')}`);
            return false;
        }
        
        return true;
    }

    /**
     * 🔄 Obtener información de debug
     */
    getDebugInfo() {
        return {
            converterActive: true,
            supportedFormats: ['legacy', 'steering'],
            conversionMethods: [
                'createFleetFromLegacyData',
                'convertFleetToLegacyData',
                'updateFleetTarget',
                'changeFleetFormation'
            ]
        };
    }
} 