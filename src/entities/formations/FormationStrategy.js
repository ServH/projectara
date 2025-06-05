/**
 * 📐 FORMATION STRATEGY - Estrategia Base para Formaciones de Flota
 * Implementa el patrón Strategy para diferentes tipos de formaciones
 * Arquitectura limpia y extensible para nuevas formaciones
 */

import { Vector2D } from '../../utils/Vector2D.js';

export class FormationStrategy {
    constructor(spacing = 30) {
        this.spacing = spacing;
        this.name = 'base';
    }

    /**
     * Calcular posiciones de formación
     * @param {Vector2D} centerPosition - Posición central de la formación
     * @param {number} fleetSize - Número de vehículos en la flota
     * @param {Vector2D} targetDirection - Dirección hacia el objetivo (opcional)
     * @returns {Vector2D[]} Array de posiciones para cada vehículo
     */
    calculatePositions(centerPosition, fleetSize, targetDirection = null) {
        throw new Error('FormationStrategy.calculatePositions() debe ser implementado por las subclases');
    }

    /**
     * Obtener información de la formación
     * @returns {Object} Información de la formación
     */
    getInfo() {
        return {
            name: this.name,
            spacing: this.spacing,
            description: 'Formación base'
        };
    }

    /**
     * Validar parámetros de entrada
     * @param {Vector2D} centerPosition 
     * @param {number} fleetSize 
     * @returns {boolean}
     */
    validateParameters(centerPosition, fleetSize) {
        if (!centerPosition || typeof centerPosition.x !== 'number' || typeof centerPosition.y !== 'number') {
            console.warn('FormationStrategy: centerPosition inválida');
            return false;
        }

        if (!Number.isInteger(fleetSize) || fleetSize <= 0) {
            console.warn('FormationStrategy: fleetSize debe ser un entero positivo');
            return false;
        }

        return true;
    }

    /**
     * Añadir variación aleatoria a las posiciones para aspecto orgánico
     * @param {Vector2D[]} positions 
     * @param {number} variationFactor - Factor de variación (0-1)
     * @returns {Vector2D[]}
     */
    addRandomVariation(positions, variationFactor = 0.3) {
        return positions.map(position => {
            const randomX = (Math.random() - 0.5) * this.spacing * variationFactor;
            const randomY = (Math.random() - 0.5) * this.spacing * variationFactor;
            
            return new Vector2D(
                position.x + randomX,
                position.y + randomY
            );
        });
    }
} 