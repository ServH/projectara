/**
 * 🚧 GALCON GAME - DETECTOR DE OBSTÁCULOS
 * Sistema de detección línea-círculo para navegación inteligente
 * MILESTONE 2.3: Detección básica con reformulación de itinerario
 */

import { NAVIGATION_CONFIG } from './NavigationConfig.js';

export class ObstacleDetector {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.config = NAVIGATION_CONFIG.obstacleDetection;
        
        // Cache para optimización
        this.obstacleCache = new Map();
        this.lastCacheUpdate = 0;
        
        // Estadísticas de rendimiento
        this.stats = {
            detectionsPerFrame: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalCalculations: 0
        };
        
        console.log('🚧 ObstacleDetector inicializado');
    }

    /**
     * 🎯 Detectar obstáculos en la ruta de una nave
     * @param {Object} fleet - Nave a analizar
     * @param {Object} target - Destino objetivo
     * @returns {Array} Lista de planetas que interfieren
     */
    detectObstaclesInRoute(fleet, target) {
        if (!this.config.enabled) return [];

        const startTime = performance.now();
        
        // Crear clave única para cache
        const cacheKey = `${fleet.id}-${target.x}-${target.y}`;
        
        // Verificar cache
        if (this.shouldUseCache(cacheKey)) {
            this.stats.cacheHits++;
            return this.obstacleCache.get(cacheKey).obstacles;
        }

        // Calcular obstáculos
        const obstacles = this.calculateObstacles(fleet, target);
        
        // Guardar en cache
        this.obstacleCache.set(cacheKey, {
            obstacles: obstacles,
            timestamp: Date.now()
        });
        
        this.stats.cacheMisses++;
        this.stats.totalCalculations++;
        
        if (NAVIGATION_CONFIG.debug.showCalculationTime) {
            const calcTime = performance.now() - startTime;
            console.log(`🚧 Detección obstáculos: ${calcTime.toFixed(2)}ms`);
        }

        return obstacles;
    }

    /**
     * 🧮 Calcular obstáculos reales en la ruta
     */
    calculateObstacles(fleet, target) {
        const obstacles = [];
        const planets = this.gameEngine.getAllPlanets();
        
        // Línea de ruta: desde nave hasta destino
        const routeLine = {
            start: { x: fleet.x, y: fleet.y },
            end: { x: target.x, y: target.y }
        };

        for (const planet of planets) {
            // Filtrar planetas irrelevantes
            if (!this.isPlanetRelevant(planet, routeLine)) {
                continue;
            }

            // Detectar intersección línea-círculo
            if (this.lineIntersectsCircle(routeLine, planet)) {
                obstacles.push({
                    planet: planet,
                    distance: this.distanceToLine(routeLine, planet),
                    avoidancePoint: this.calculateAvoidancePoint(routeLine, planet)
                });

                if (NAVIGATION_CONFIG.debug.logObstacles) {
                    console.log(`🚧 Obstáculo detectado: Planeta ${planet.id} en ruta`);
                }
            }
        }

        // Ordenar por distancia (más cercanos primero)
        obstacles.sort((a, b) => a.distance - b.distance);
        
        return obstacles;
    }

    /**
     * 🔍 Verificar si un planeta es relevante para la detección
     */
    isPlanetRelevant(planet, routeLine) {
        // Filtrar planetas muy pequeños
        if (planet.radius < this.config.minPlanetSize) {
            return false;
        }

        // Filtrar planetas muy lejanos de la ruta
        const distanceToRoute = this.distanceToLine(routeLine, planet);
        if (distanceToRoute > this.config.detectionRadius + planet.radius) {
            return false;
        }

        return true;
    }

    /**
     * 📐 Detectar intersección entre línea y círculo
     * Algoritmo básico pero efectivo
     */
    lineIntersectsCircle(line, planet) {
        const distanceToCenter = this.distanceToLine(line, planet);
        const effectiveRadius = planet.radius + this.config.avoidanceDistance;
        
        return distanceToCenter <= effectiveRadius;
    }

    /**
     * 📏 Calcular distancia de un punto a una línea
     */
    distanceToLine(line, point) {
        const A = line.end.x - line.start.x;
        const B = line.end.y - line.start.y;
        const C = point.x - line.start.x;
        const D = point.y - line.start.y;

        const dot = A * C + B * D;
        const lenSq = A * A + B * B;
        
        if (lenSq === 0) {
            // Línea de longitud cero
            return Math.sqrt(C * C + D * D);
        }

        const param = dot / lenSq;
        let xx, yy;

        if (param < 0) {
            xx = line.start.x;
            yy = line.start.y;
        } else if (param > 1) {
            xx = line.end.x;
            yy = line.end.y;
        } else {
            xx = line.start.x + param * A;
            yy = line.start.y + param * B;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 🎯 Calcular punto de evitación para un obstáculo
     */
    calculateAvoidancePoint(line, planet) {
        // Vector de dirección de la línea
        const dx = line.end.x - line.start.x;
        const dy = line.end.y - line.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return null;

        // Vector unitario perpendicular
        const perpX = -dy / length;
        const perpY = dx / length;

        // Distancia de evitación
        const avoidDistance = planet.radius + this.config.avoidanceDistance + this.config.routeBuffer;

        // Calcular dos puntos posibles (izquierda y derecha)
        const point1 = {
            x: planet.x + perpX * avoidDistance,
            y: planet.y + perpY * avoidDistance
        };
        
        const point2 = {
            x: planet.x - perpX * avoidDistance,
            y: planet.y - perpY * avoidDistance
        };

        // Elegir el punto más cercano al destino
        const dist1 = Math.sqrt(Math.pow(point1.x - line.end.x, 2) + Math.pow(point1.y - line.end.y, 2));
        const dist2 = Math.sqrt(Math.pow(point2.x - line.end.x, 2) + Math.pow(point2.y - line.end.y, 2));

        return dist1 < dist2 ? point1 : point2;
    }

    /**
     * 💾 Verificar si usar cache
     */
    shouldUseCache(cacheKey) {
        if (!this.obstacleCache.has(cacheKey)) return false;
        
        const cached = this.obstacleCache.get(cacheKey);
        const age = Date.now() - cached.timestamp;
        
        return age < NAVIGATION_CONFIG.performance.cacheTimeout;
    }

    /**
     * 🧹 Limpiar cache antiguo
     */
    cleanupCache() {
        const now = Date.now();
        const timeout = NAVIGATION_CONFIG.performance.cacheTimeout;
        
        for (const [key, value] of this.obstacleCache.entries()) {
            if (now - value.timestamp > timeout) {
                this.obstacleCache.delete(key);
            }
        }
    }

    /**
     * 📊 Obtener estadísticas de rendimiento
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.obstacleCache.size,
            hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100
        };
    }

    /**
     * 🔄 Resetear estadísticas
     */
    resetStats() {
        this.stats = {
            detectionsPerFrame: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalCalculations: 0
        };
    }

    /**
     * 🧹 Cleanup al destruir
     */
    destroy() {
        this.obstacleCache.clear();
        console.log('🚧 ObstacleDetector destruido');
    }
}

export default ObstacleDetector; 