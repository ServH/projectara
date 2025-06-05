/**
 * 🌊 SPREAD FORMATION - Formación Dispersa
 * Organiza los vehículos en una grilla dispersa con variación orgánica
 * Ideal para ataques masivos y cobertura de área
 */

import { Vector2D } from '../../utils/Vector2D.js';
import { FormationStrategy } from './FormationStrategy.js';

export class SpreadFormation extends FormationStrategy {
    constructor(spacing = 30) {
        super(spacing);
        this.name = 'spread';
    }

    /**
     * Calcular posiciones en formación dispersa
     * @param {Vector2D} centerPosition 
     * @param {number} fleetSize 
     * @param {Vector2D} targetDirection 
     * @returns {Vector2D[]}
     */
    calculatePositions(centerPosition, fleetSize, targetDirection = null) {
        if (!this.validateParameters(centerPosition, fleetSize)) {
            return [centerPosition.copy()];
        }

        const positions = [];
        const gridSize = Math.ceil(Math.sqrt(fleetSize));
        
        for (let i = 0; i < fleetSize; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            // Centrar la grilla
            const offsetX = (col - (gridSize - 1) / 2) * this.spacing;
            const offsetY = (row - (gridSize - 1) / 2) * this.spacing;
            
            positions.push(new Vector2D(
                centerPosition.x + offsetX,
                centerPosition.y + offsetY
            ));
        }
        
        // Añadir variación orgánica
        return this.addRandomVariation(positions, 0.3);
    }

    /**
     * Obtener información específica de la formación dispersa
     * @returns {Object}
     */
    getInfo() {
        return {
            ...super.getInfo(),
            description: 'Formación dispersa en grilla con variación orgánica',
            advantages: ['Cobertura de área', 'Resistente a ataques concentrados'],
            bestFor: ['Ataques masivos', 'Exploración de área']
        };
    }
} 