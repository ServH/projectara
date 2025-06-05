/**
 * 🔺 WEDGE FORMATION - Formación en Cuña
 * Organiza los vehículos en formación de cuña con el líder al frente
 * Ideal para penetración y ataques dirigidos
 */

import { Vector2D } from '../../utils/Vector2D.js';
import { FormationStrategy } from './FormationStrategy.js';

export class WedgeFormation extends FormationStrategy {
    constructor(spacing = 28) {
        super(spacing);
        this.name = 'wedge';
    }

    /**
     * Calcular posiciones en formación de cuña
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
        
        // Calcular direcciones
        let direction, perpendicular;
        if (targetDirection && targetDirection.magnitude() > 0) {
            direction = targetDirection.normalize();
            perpendicular = direction.perpendicular();
        } else {
            // Direcciones por defecto
            direction = new Vector2D(1, 0);
            perpendicular = new Vector2D(0, 1);
        }
        
        // Líder al frente
        positions.push(centerPosition.copy());
        
        // Resto en formación de cuña
        for (let i = 1; i < fleetSize; i++) {
            const row = Math.floor((i - 1) / 2) + 1;
            const side = (i - 1) % 2 === 0 ? -1 : 1;
            
            const backOffset = Vector2D.multiply(direction, -row * this.spacing * 0.8);
            const sideOffset = Vector2D.multiply(perpendicular, side * row * this.spacing * 0.6);
            
            const position = Vector2D.add(centerPosition, Vector2D.add(backOffset, sideOffset));
            positions.push(position);
        }
        
        return positions;
    }

    /**
     * Obtener información específica de la formación en cuña
     * @returns {Object}
     */
    getInfo() {
        return {
            ...super.getInfo(),
            description: 'Formación en cuña con líder al frente',
            advantages: ['Penetración efectiva', 'Liderazgo claro', 'Concentración de fuerza'],
            bestFor: ['Ataques dirigidos', 'Penetración de defensas', 'Asaltos tácticos']
        };
    }
} 