/**
 * ⭕ CIRCLE FORMATION - Formación Circular
 * Organiza los vehículos en un círculo alrededor del centro
 * Ideal para defensa y maniobras envolventes
 */

import { Vector2D } from '../../utils/Vector2D.js';
import { FormationStrategy } from './FormationStrategy.js';

export class CircleFormation extends FormationStrategy {
    constructor(spacing = 35) {
        super(spacing);
        this.name = 'circle';
    }

    /**
     * Calcular posiciones en formación circular
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
        
        // Para una sola nave, colocar en el centro
        if (fleetSize === 1) {
            positions.push(centerPosition.copy());
            return positions;
        }
        
        // Calcular radio basado en el espaciado y número de naves
        const circumference = fleetSize * this.spacing;
        const radius = circumference / (2 * Math.PI);
        
        // Ángulo inicial (opcional rotación hacia el objetivo)
        let startAngle = 0;
        if (targetDirection && targetDirection.magnitude() > 0) {
            startAngle = Math.atan2(targetDirection.y, targetDirection.x);
        }
        
        for (let i = 0; i < fleetSize; i++) {
            const angle = startAngle + (i / fleetSize) * 2 * Math.PI;
            const x = centerPosition.x + Math.cos(angle) * radius;
            const y = centerPosition.y + Math.sin(angle) * radius;
            
            positions.push(new Vector2D(x, y));
        }
        
        return positions;
    }

    /**
     * Obtener información específica de la formación circular
     * @returns {Object}
     */
    getInfo() {
        return {
            ...super.getInfo(),
            description: 'Formación circular alrededor del centro',
            advantages: ['Cobertura 360°', 'Flexibilidad de maniobra', 'Defensa equilibrada'],
            bestFor: ['Maniobras envolventes', 'Defensa perimetral', 'Exploración radial']
        };
    }

    /**
     * Calcular radio óptimo para el número de naves
     * @param {number} fleetSize 
     * @returns {number}
     */
    calculateOptimalRadius(fleetSize) {
        const circumference = fleetSize * this.spacing;
        return circumference / (2 * Math.PI);
    }
} 