/**
 * 🌊 SISTEMA DE FORMACIÓN DE FLOTA ORGÁNICA
 * Convierte flotas únicas en formaciones de naves individuales
 * HITO 2: Implementación del movimiento orgánico validado
 */

import { Fleet } from '../entities/Fleet.js';
import { Vector2D } from '../utils/Vector2D.js';
import { GALCON_STEERING_CONFIG_PROBADA } from '../config/SteeringConfig.js';
import { organicConfig } from '../config/OrganicMovementConfig.js';

export class FleetFormationSystem {
    constructor(gameEngine = null) {
        this.config = organicConfig.getConfig();
        this.gameEngine = gameEngine; // 🔧 NUEVO: Referencia al gameEngine para obtener planetas
        
        console.log('🌊 FleetFormationSystem inicializado con configuración orgánica');
    }

    /**
     * Crear formación de flota orgánica desde datos de flota única
     * @param {Object} fleetData - Datos de la flota original
     * @returns {Array} Array de flotas individuales con formación orgánica
     */
    createOrganicFormation(fleetData) {
        const ships = fleetData.ships;
        const individualFleets = [];
        
        // 🔧 NUEVO: Obtener planeta destino del gameEngine
        let targetPlanet = null;
        if (this.gameEngine && fleetData.toPlanet) {
            targetPlanet = this.gameEngine.getPlanet(fleetData.toPlanet);
        }
        
        // Si es una sola nave, crear flota simple
        if (ships <= 1) {
            const startPos = new Vector2D(fleetData.x || fleetData.startX, fleetData.y || fleetData.startY);
            const targetPos = new Vector2D(fleetData.targetX, fleetData.targetY);
            
            // 🔧 NUEVO: Pasar datos del juego incluyendo planeta destino
            const gameData = {
                owner: fleetData.owner,
                fromPlanet: fleetData.fromPlanet,
                toPlanet: fleetData.toPlanet,
                targetPlanet: targetPlanet, // 🔧 NUEVO: Objeto planeta completo
                color: fleetData.color
            };
            
            const fleet = new Fleet(startPos, targetPos, GALCON_STEERING_CONFIG_PROBADA, 1, gameData);
            
            // Mapear propiedades legacy adicionales
            fleet.legacyId = fleetData.id;
            
            return [fleet];
        }
        
        console.log(`🌊 Creando formación orgánica: ${ships} naves desde ${fleetData.fromPlanet} → ${fleetData.toPlanet}${targetPlanet ? ` (radio: ${targetPlanet.radius})` : ''}`);
        
        // Obtener configuración de formación
        const formationConfig = this.config.formation;
        const individualConfig = this.config.individual;
        
        // Calcular radio de formación escalado según tamaño de flota
        let formationRadius = formationConfig.baseRadius;
        if (formationConfig.scaleWithFleetSize) {
            formationRadius = Math.min(
                formationConfig.baseRadius + Math.sqrt(ships) * 3,
                formationConfig.maxFormationRadius
            );
        }
        
        const baseTime = fleetData.launchTime || Date.now();
        
        // Crear naves individuales en formación circular
        for (let i = 0; i < ships; i++) {
            const individualFleetData = this.createIndividualShipData(
                fleetData, 
                i, 
                ships, 
                formationRadius, 
                baseTime
            );
            
            // Crear Fleet con constructor correcto
            const startPos = new Vector2D(individualFleetData.startX, individualFleetData.startY);
            const targetPos = new Vector2D(individualFleetData.targetX, individualFleetData.targetY);
            
            // 🔧 NUEVO: Pasar datos del juego incluyendo planeta destino
            const gameData = {
                owner: individualFleetData.owner,
                fromPlanet: individualFleetData.fromPlanet,
                toPlanet: individualFleetData.toPlanet,
                targetPlanet: targetPlanet, // 🔧 NUEVO: Objeto planeta completo
                color: individualFleetData.color
            };
            
            const individualFleet = new Fleet(startPos, targetPos, GALCON_STEERING_CONFIG_PROBADA, 1, gameData);
            
            // Mapear propiedades legacy adicionales
            individualFleet.legacyId = individualFleetData.id;
            individualFleet.formationIndex = individualFleetData.formationIndex;
            individualFleet.formationTotal = individualFleetData.formationTotal;
            individualFleet.originalFleetId = individualFleetData.originalFleetId;
            individualFleet.isFormationMember = individualFleetData.isFormationMember;
            
            individualFleets.push(individualFleet);
        }
        
        console.log(`✅ Formación orgánica creada: ${individualFleets.length} naves individuales${targetPlanet ? ` → planeta radio ${targetPlanet.radius}` : ''}`);
        return individualFleets;
    }

    /**
     * Crear datos para una nave individual en la formación
     */
    createIndividualShipData(originalFleetData, shipIndex, totalShips, formationRadius, baseTime) {
        // Calcular posición en formación circular
        const angle = (shipIndex / totalShips) * Math.PI * 2;
        const radiusVariation = (Math.random() - 0.5) * this.config.formation.radiusSpread;
        const actualRadius = formationRadius + radiusVariation;
        
        // Posición de salida alrededor del planeta origen
        const startX = originalFleetData.startX + Math.cos(angle) * actualRadius;
        const startY = originalFleetData.startY + Math.sin(angle) * actualRadius;
        
        // Variación temporal en el lanzamiento
        const timeVariation = Math.random() * this.config.formation.launchSpread;
        const launchTime = baseTime + timeVariation;
        
        // Crear datos únicos para esta nave
        const individualFleetData = {
            ...originalFleetData,
            id: `${originalFleetData.id}_ship_${shipIndex}`,
            ships: 1, // Cada "flota" individual tiene 1 nave
            startX: startX,
            startY: startY,
            launchTime: launchTime,
            
            // Metadatos de formación
            formationIndex: shipIndex,
            formationTotal: totalShips,
            originalFleetId: originalFleetData.id,
            isFormationMember: true
        };
        
        return individualFleetData;
    }

    /**
     * Verificar si una flota necesita formación orgánica
     */
    needsOrganicFormation(fleetData) {
        return fleetData.ships > 1;
    }

    /**
     * Obtener estadísticas de formación
     */
    getFormationStats(fleets) {
        const formationFleets = fleets.filter(f => f.isFormationMember);
        const originalFleets = new Set(formationFleets.map(f => f.originalFleetId));
        
        return {
            totalFleets: fleets.length,
            formationFleets: formationFleets.length,
            originalFormations: originalFleets.size,
            averageFormationSize: formationFleets.length / Math.max(originalFleets.size, 1)
        };
    }

    /**
     * Actualizar configuración del sistema
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 Configuración de formación actualizada');
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            config: this.config,
            formationRadius: this.config.formation.baseRadius,
            maxFormationRadius: this.config.formation.maxFormationRadius,
            launchSpread: this.config.formation.launchSpread,
            scaleWithFleetSize: this.config.formation.scaleWithFleetSize
        };
    }
}

export default FleetFormationSystem; 