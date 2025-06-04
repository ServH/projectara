/**
 * 🎯 GALCON GAME - SISTEMA DE LLEGADA REALISTA
 * Radio de entrada variable para flotas más naturales
 * MILESTONE 2.3: Cada nave tiene su propio punto de llegada
 */

import { NAVIGATION_CONFIG } from './NavigationConfig.js';

export class ArrivalSystem {
    constructor() {
        this.config = NAVIGATION_CONFIG.arrivalSystem;
        
        // Cache de puntos de llegada por nave
        this.arrivalPoints = new Map();
        
        // Estadísticas
        this.stats = {
            generatedPoints: 0,
            cacheHits: 0,
            activeArrivals: 0
        };
        
        console.log('🎯 ArrivalSystem inicializado - Radio de entrada variable');
    }

    /**
     * 🎯 Obtener punto de llegada personalizado para una nave
     * @param {Object} fleet - Nave que va a llegar
     * @param {Object} target - Planeta destino
     * @param {Number} fleetIndex - Índice de la nave en la flota (para dispersión)
     * @param {Number} totalFleets - Total de naves en la misión (para cálculo de dispersión)
     * @returns {Object} Punto de llegada personalizado {x, y, radius}
     */
    getArrivalPoint(fleet, target, fleetIndex = 0, totalFleets = 1) {
        if (!this.config.enabled) {
            // Sistema desactivado - usar centro del planeta
            return {
                x: target.x,
                y: target.y,
                radius: target.radius
            };
        }

        // Crear clave única para cache
        const cacheKey = `${fleet.id}-${target.id}`;
        
        // Verificar cache
        if (this.arrivalPoints.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.arrivalPoints.get(cacheKey);
        }

        // Generar nuevo punto de llegada
        const arrivalPoint = this.generateArrivalPoint(fleet, target, fleetIndex, totalFleets);
        
        // Guardar en cache
        this.arrivalPoints.set(cacheKey, arrivalPoint);
        this.stats.generatedPoints++;
        
        return arrivalPoint;
    }

    /**
     * 🎲 Generar punto de llegada aleatorio pero inteligente
     */
    generateArrivalPoint(fleet, target, fleetIndex, totalFleets) {
        const baseRadius = this.calculateBaseRadius(target);
        const spreadAngle = this.calculateSpreadAngle(totalFleets);
        
        // Calcular ángulo base para esta nave
        let angle;
        if (totalFleets > 1) {
            // Distribuir naves en arco
            const angleStep = spreadAngle / Math.max(1, totalFleets - 1);
            const startAngle = -spreadAngle / 2;
            angle = startAngle + (fleetIndex * angleStep);
            
            // Añadir variación aleatoria individual
            const randomVariation = (Math.random() - 0.5) * 0.3; // ±0.15 radianes
            angle += randomVariation;
        } else {
            // Nave solitaria - ángulo completamente aleatorio
            angle = Math.random() * Math.PI * 2;
        }

        // Calcular radio de llegada con variación
        const radiusVariation = this.config.baseRadius.randomFactor;
        const minRadius = baseRadius * (1 - radiusVariation);
        const maxRadius = baseRadius * (1 + radiusVariation);
        const arrivalRadius = minRadius + Math.random() * (maxRadius - minRadius);

        // Calcular posición final
        const arrivalPoint = {
            x: target.x + Math.cos(angle) * arrivalRadius,
            y: target.y + Math.sin(angle) * arrivalRadius,
            radius: Math.min(15, target.radius * 0.3), // Radio de tolerancia para llegada
            angle: angle,
            originalTarget: target,
            isCustomArrival: true
        };

        // Debug info
        if (NAVIGATION_CONFIG.debug.enabled) {
            console.log(`🎯 Punto de llegada generado para nave ${fleet.id}:`, {
                target: target.id,
                angle: (angle * 180 / Math.PI).toFixed(1) + '°',
                radius: arrivalRadius.toFixed(1),
                position: `(${arrivalPoint.x.toFixed(1)}, ${arrivalPoint.y.toFixed(1)})`
            });
        }

        return arrivalPoint;
    }

    /**
     * 📏 Calcular radio base según el tamaño del planeta
     */
    calculateBaseRadius(target) {
        const planetRadius = target.radius;
        
        // 🎯 CAMBIO CRÍTICO: Las naves llegan al BORDE del planeta, no al centro
        // Radio base = radio del planeta + distancia de llegada
        const arrivalDistance = 15; // Distancia desde el borde del planeta
        const baseRadius = planetRadius + arrivalDistance;
        
        return baseRadius;
    }

    /**
     * 📐 Calcular ángulo de dispersión según número de naves
     */
    calculateSpreadAngle(totalFleets) {
        if (totalFleets <= 1) return 0;
        
        // Más naves = mayor dispersión, pero con límite
        const maxSpread = this.config.spreadAngle;
        const fleetFactor = Math.min(1, totalFleets / 10); // Normalizar a 10 naves máximo
        
        return maxSpread * fleetFactor;
    }

    /**
     * ✅ Verificar si una nave ha llegado a su punto de destino
     * @param {Object} fleet - Nave a verificar
     * @param {Object} arrivalPoint - Punto de llegada personalizado
     * @returns {Boolean} True si ha llegado
     */
    hasArrivedAtPoint(fleet, arrivalPoint) {
        const dx = fleet.x - arrivalPoint.x;
        const dy = fleet.y - arrivalPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= arrivalPoint.radius;
    }

    /**
     * 🎯 Obtener punto de llegada más cercano al planeta (para combate)
     * Usado cuando la nave necesita estar muy cerca del planeta
     */
    getCombatArrivalPoint(fleet, target) {
        const angle = Math.random() * Math.PI * 2;
        const combatRadius = target.radius + 10; // Muy cerca para combate
        
        return {
            x: target.x + Math.cos(angle) * combatRadius,
            y: target.y + Math.sin(angle) * combatRadius,
            radius: 8, // Radio de tolerancia pequeño
            angle: angle,
            originalTarget: target,
            isCombatArrival: true
        };
    }

    /**
     * 🧹 Limpiar punto de llegada de una nave
     * Llamar cuando la nave llega o cambia de destino
     */
    clearArrivalPoint(fleetId, targetId) {
        const cacheKey = `${fleetId}-${targetId}`;
        if (this.arrivalPoints.has(cacheKey)) {
            this.arrivalPoints.delete(cacheKey);
            return true;
        }
        return false;
    }

    /**
     * 🧹 Limpiar todos los puntos de llegada de una nave
     */
    clearFleetArrivalPoints(fleetId) {
        let cleared = 0;
        for (const [key, value] of this.arrivalPoints.entries()) {
            if (key.startsWith(`${fleetId}-`)) {
                this.arrivalPoints.delete(key);
                cleared++;
            }
        }
        return cleared;
    }

    /**
     * 📊 Obtener estadísticas del sistema
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.arrivalPoints.size,
            hitRate: this.stats.cacheHits / Math.max(1, this.stats.generatedPoints) * 100
        };
    }

    /**
     * 🔄 Resetear estadísticas
     */
    resetStats() {
        this.stats = {
            generatedPoints: 0,
            cacheHits: 0,
            activeArrivals: 0
        };
    }

    /**
     * 🧹 Cleanup completo
     */
    destroy() {
        this.arrivalPoints.clear();
        console.log('🎯 ArrivalSystem destruido');
    }
}

export default ArrivalSystem; 