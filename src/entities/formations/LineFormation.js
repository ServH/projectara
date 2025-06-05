/**
 * 📏 LINE FORMATION - Formación en Línea
 * Organiza los vehículos en una línea perpendicular a la dirección del objetivo
 * Ideal para ataques frontales coordinados
 */

import { Vector2D } from '../../utils/Vector2D.js';
import { FormationStrategy } from './FormationStrategy.js';

export class LineFormation extends FormationStrategy {
    constructor(spacing = 25) {
        super(spacing);
        this.name = 'line';
    }

    /**
     * Calcular posiciones en formación de línea
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
        
        // Calcular dirección perpendicular
        let perpendicular;
        if (targetDirection && targetDirection.magnitude() > 0) {
            perpendicular = targetDirection.normalize().perpendicular();
        } else {
            // Dirección por defecto si no se proporciona targetDirection
            perpendicular = new Vector2D(0, 1);
        }
        
        for (let i = 0; i < fleetSize; i++) {
            const offset = (i - (fleetSize - 1) / 2) * this.spacing;
            const position = Vector2D.add(
                centerPosition, 
                Vector2D.multiply(perpendicular, offset)
            );
            positions.push(position);
        }
        
        return positions;
    }

    /**
     * Obtener información específica de la formación en línea
     * @returns {Object}
     */
    getInfo() {
        return {
            ...super.getInfo(),
            description: 'Formación en línea perpendicular al objetivo',
            advantages: ['Ataque frontal coordinado', 'Máxima concentración de fuego'],
            bestFor: ['Ataques directos', 'Asaltos coordinados']
        };
    }
} 