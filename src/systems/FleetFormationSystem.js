/**
 * 🌊 SISTEMA DE FORMACIÓN DE FLOTA ORGÁNICA
 * Convierte flotas únicas en formaciones de naves individuales
 * HITO 2: Implementación del movimiento orgánico validado
 */

import { Fleet } from '../entities/Fleet.js';
import { organicConfig } from '../config/OrganicMovementConfig.js';

export class FleetFormationSystem {
    constructor() {
        this.config = organicConfig.getConfig();
        
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
        
        // Si es una sola nave, no necesita formación
        if (ships <= 1) {
            return [new Fleet(fleetData)];
        }
        
        console.log(`🌊 Creando formación orgánica: ${ships} naves desde ${fleetData.fromPlanet} → ${fleetData.toPlanet}`);
        
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
            
            const individualFleet = new Fleet(individualFleetData);
            individualFleets.push(individualFleet);
        }
        
        console.log(`✅ Formación orgánica creada: ${individualFleets.length} naves individuales`);
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