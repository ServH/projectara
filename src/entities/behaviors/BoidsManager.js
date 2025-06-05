/**
 * 🐦 BOIDS MANAGER - Gestor de Comportamientos de Boids
 * Implementa los tres comportamientos fundamentales de boids:
 * - Separación: Evitar colisiones con vecinos
 * - Alineación: Alinear velocidad con vecinos
 * - Cohesión: Moverse hacia el centro del grupo
 */

import { Vector2D } from '../../utils/Vector2D.js';

export class BoidsManager {
    constructor(config = {}) {
        this.separationWeight = config.separationWeight || 1.5;
        this.alignmentWeight = config.alignmentWeight || 1.0;
        this.cohesionWeight = config.cohesionWeight || 1.0;
        this.perceptionRadiusMultiplier = config.perceptionRadiusMultiplier || 2.0;
        this.separationRadiusMultiplier = config.separationRadiusMultiplier || 1.0;
    }

    /**
     * Calcular fuerzas de boids para un vehículo específico
     * @param {Object} vehicle - Vehículo actual
     * @param {Object[]} neighbors - Array de vehículos vecinos
     * @param {number} spacing - Espaciado base de la flota
     * @returns {Vector2D} Fuerza total de boids
     */
    calculateBoidsForces(vehicle, neighbors, spacing) {
        if (!vehicle || !neighbors || neighbors.length === 0) {
            return Vector2D.zero();
        }

        const perceptionRadius = spacing * this.perceptionRadiusMultiplier;
        const separationRadius = spacing * this.separationRadiusMultiplier;

        const separation = this.calculateSeparation(vehicle, neighbors, separationRadius);
        const alignment = this.calculateAlignment(vehicle, neighbors, perceptionRadius);
        const cohesion = this.calculateCohesion(vehicle, neighbors, perceptionRadius);

        // Combinar fuerzas con sus respectivos pesos
        const totalForce = Vector2D.zero();
        totalForce.add(Vector2D.multiply(separation, this.separationWeight));
        totalForce.add(Vector2D.multiply(alignment, this.alignmentWeight));
        totalForce.add(Vector2D.multiply(cohesion, this.cohesionWeight));

        return totalForce;
    }

    /**
     * Calcular fuerza de separación
     * @param {Object} vehicle 
     * @param {Object[]} neighbors 
     * @param {number} separationRadius 
     * @returns {Vector2D}
     */
    calculateSeparation(vehicle, neighbors, separationRadius) {
        const steer = Vector2D.zero();
        let count = 0;

        for (const neighbor of neighbors) {
            if (neighbor === vehicle || neighbor.hasArrived) continue;

            const distance = vehicle.position.distance(neighbor.position);
            
            if (distance > 0 && distance < separationRadius) {
                // Vector que apunta lejos del vecino
                const diff = Vector2D.subtract(vehicle.position, neighbor.position);
                diff.normalize();
                
                // Peso inversamente proporcional a la distancia
                diff.divide(distance);
                steer.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steer.divide(count);
            steer.normalize();
            steer.multiply(vehicle.maxSpeed || 2);
            steer.subtract(vehicle.velocity);
            steer.limit(vehicle.maxForce || 0.1);
        }

        return steer;
    }

    /**
     * Calcular fuerza de alineación
     * @param {Object} vehicle 
     * @param {Object[]} neighbors 
     * @param {number} perceptionRadius 
     * @returns {Vector2D}
     */
    calculateAlignment(vehicle, neighbors, perceptionRadius) {
        const steer = Vector2D.zero();
        let count = 0;

        for (const neighbor of neighbors) {
            if (neighbor === vehicle || neighbor.hasArrived) continue;

            const distance = vehicle.position.distance(neighbor.position);
            
            if (distance > 0 && distance < perceptionRadius) {
                steer.add(neighbor.velocity);
                count++;
            }
        }

        if (count > 0) {
            steer.divide(count);
            steer.normalize();
            steer.multiply(vehicle.maxSpeed || 2);
            steer.subtract(vehicle.velocity);
            steer.limit(vehicle.maxForce || 0.1);
        }

        return steer;
    }

    /**
     * Calcular fuerza de cohesión
     * @param {Object} vehicle 
     * @param {Object[]} neighbors 
     * @param {number} perceptionRadius 
     * @returns {Vector2D}
     */
    calculateCohesion(vehicle, neighbors, perceptionRadius) {
        const steer = Vector2D.zero();
        let count = 0;

        for (const neighbor of neighbors) {
            if (neighbor === vehicle || neighbor.hasArrived) continue;

            const distance = vehicle.position.distance(neighbor.position);
            
            if (distance > 0 && distance < perceptionRadius) {
                steer.add(neighbor.position);
                count++;
            }
        }

        if (count > 0) {
            steer.divide(count);
            
            // Buscar hacia el centro del grupo
            steer.subtract(vehicle.position);
            steer.normalize();
            steer.multiply(vehicle.maxSpeed || 2);
            steer.subtract(vehicle.velocity);
            steer.limit(vehicle.maxForce || 0.1);
        }

        return steer;
    }

    /**
     * Actualizar configuración de boids
     * @param {Object} newConfig 
     */
    updateConfig(newConfig) {
        this.separationWeight = newConfig.separationWeight ?? this.separationWeight;
        this.alignmentWeight = newConfig.alignmentWeight ?? this.alignmentWeight;
        this.cohesionWeight = newConfig.cohesionWeight ?? this.cohesionWeight;
        this.perceptionRadiusMultiplier = newConfig.perceptionRadiusMultiplier ?? this.perceptionRadiusMultiplier;
        this.separationRadiusMultiplier = newConfig.separationRadiusMultiplier ?? this.separationRadiusMultiplier;
    }

    /**
     * Obtener configuración actual
     * @returns {Object}
     */
    getConfig() {
        return {
            separationWeight: this.separationWeight,
            alignmentWeight: this.alignmentWeight,
            cohesionWeight: this.cohesionWeight,
            perceptionRadiusMultiplier: this.perceptionRadiusMultiplier,
            separationRadiusMultiplier: this.separationRadiusMultiplier
        };
    }

    /**
     * Verificar si los boids están habilitados para un vehículo
     * @param {Object} vehicle 
     * @param {Object} fleetConfig 
     * @returns {boolean}
     */
    shouldApplyBoids(vehicle, fleetConfig) {
        return fleetConfig.enableBoids && 
               !vehicle.hasArrived && 
               !vehicle.isLeader; // Los líderes pueden tener comportamiento diferente
    }
} 