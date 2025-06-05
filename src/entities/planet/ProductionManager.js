/**
 * 🏭 PRODUCTION MANAGER - Gestor de Producción de Planetas
 * Encapsula toda la lógica relacionada con la producción de naves
 * Responsabilidad única: Gestionar la producción automática de naves
 */

import eventBus, { GAME_EVENTS } from '../../core/EventBus.js';

export class ProductionManager {
    constructor() {
        this.productionRates = {
            small: 2.5,
            medium: 4.0,
            large: 6.0,
            huge: 8.0
        };
        
        this.capacities = {
            small: 60,
            medium: 120,
            large: 250,
            huge: 400
        };
        
        this.initialShips = {
            small: 15,
            medium: 25,
            large: 40,
            huge: 60
        };
    }

    /**
     * Calcular velocidad de producción para un planeta
     * @param {string} size - Tamaño del planeta
     * @param {number} specialBonus - Bonus especial (default: 1.0)
     * @returns {number} Velocidad de producción por segundo
     */
    calculateProductionRate(size, specialBonus = 1.0) {
        const baseRate = this.productionRates[size] || this.productionRates.medium;
        const finalRate = Number(baseRate) * Number(specialBonus);
        
        if (isNaN(finalRate) || finalRate <= 0) {
            console.warn(`⚠️ Producción inválida para tamaño ${size}, usando valor por defecto`);
            return 4.0;
        }
        
        return finalRate;
    }

    /**
     * Calcular capacidad máxima de naves
     * @param {string} size - Tamaño del planeta
     * @returns {number} Capacidad máxima
     */
    calculateMaxCapacity(size) {
        const capacity = this.capacities[size] || this.capacities.medium;
        return Number(capacity) || 120;
    }

    /**
     * Calcular naves iniciales
     * @param {string} size - Tamaño del planeta
     * @returns {number} Número de naves iniciales
     */
    calculateInitialShips(size) {
        const ships = this.initialShips[size] || this.initialShips.medium;
        return Number(ships) || 25;
    }

    /**
     * Procesar producción de un planeta
     * @param {Object} planet - Datos del planeta
     * @param {number} deltaTime - Tiempo transcurrido
     * @returns {Object} Resultado de la producción
     */
    processProduction(planet, deltaTime) {
        // Solo producir si el planeta tiene dueño y no está al máximo
        if (planet.owner === 'neutral' || planet.ships >= planet.maxShips) {
            return {
                shipsProduced: 0,
                totalShips: planet.ships,
                atCapacity: planet.ships >= planet.maxShips
            };
        }

        const now = Date.now();
        const timeSinceLastProduction = (now - planet.lastProduction) / 1000;
        
        // Calcular cuántas naves producir
        const shipsToAdd = timeSinceLastProduction * planet.productionRate;
        
        if (shipsToAdd >= 1) {
            const oldShips = planet.ships;
            const newShips = Math.floor(shipsToAdd);
            const finalShips = Math.min(planet.ships + newShips, planet.maxShips);
            
            // Actualizar tiempo, manteniendo fracción
            const fractionalTime = (shipsToAdd - newShips) / planet.productionRate;
            const newLastProduction = now - (fractionalTime * 1000);
            
            const result = {
                shipsProduced: finalShips - oldShips,
                totalShips: finalShips,
                lastProduction: newLastProduction,
                atCapacity: finalShips >= planet.maxShips
            };

            // Emitir evento si hay producción
            if (result.shipsProduced > 0) {
                this.emitProductionEvent(planet, result);
            }

            return result;
        }

        return {
            shipsProduced: 0,
            totalShips: planet.ships,
            atCapacity: false
        };
    }

    /**
     * Emitir evento de producción
     * @param {Object} planet 
     * @param {Object} productionResult 
     */
    emitProductionEvent(planet, productionResult) {
        eventBus.emit(GAME_EVENTS.PLANET_PRODUCTION, {
            planetId: planet.id,
            shipsAdded: productionResult.shipsProduced,
            totalShips: productionResult.totalShips,
            owner: planet.owner,
            productionRate: planet.productionRate
        });
    }

    /**
     * Forzar producción de naves (para testing)
     * @param {Object} planet 
     * @param {number} ships 
     * @returns {Object}
     */
    forceProduction(planet, ships) {
        const oldShips = planet.ships;
        const newShips = Math.min(planet.ships + ships, planet.maxShips);
        
        return {
            shipsProduced: newShips - oldShips,
            totalShips: newShips,
            forced: true
        };
    }

    /**
     * Calcular eficiencia de producción
     * @param {Object} planet 
     * @returns {number} Eficiencia (0-1)
     */
    calculateProductionEfficiency(planet) {
        if (planet.maxShips === 0) return 0;
        return planet.ships / planet.maxShips;
    }

    /**
     * Obtener estadísticas de producción
     * @param {Object} planet 
     * @returns {Object}
     */
    getProductionStats(planet) {
        return {
            currentShips: planet.ships,
            maxShips: planet.maxShips,
            productionRate: planet.productionRate,
            efficiency: this.calculateProductionEfficiency(planet),
            timeToFull: planet.productionRate > 0 ? 
                (planet.maxShips - planet.ships) / planet.productionRate : Infinity,
            isProducing: planet.owner !== 'neutral' && planet.ships < planet.maxShips
        };
    }

    /**
     * Actualizar configuración de producción
     * @param {Object} newRates 
     */
    updateProductionRates(newRates) {
        this.productionRates = { ...this.productionRates, ...newRates };
    }

    /**
     * Actualizar configuración de capacidades
     * @param {Object} newCapacities 
     */
    updateCapacities(newCapacities) {
        this.capacities = { ...this.capacities, ...newCapacities };
    }
} 