/**
 * 🐦 GALCON GAME - FLEET PHYSICS SYSTEM
 * Sistema de física para flotas con comportamiento de grupo (Boids)
 * MILESTONE 2.2: Preparación para Naves Individuales
 */

export class FleetPhysics {
    constructor() {
        // Configuración de comportamiento de boids
        this.config = {
            // Fuerzas de comportamiento
            separation: {
                radius: 25,      // Radio de separación
                strength: 1.5    // Fuerza de separación
            },
            alignment: {
                radius: 40,      // Radio de alineación
                strength: 1.0    // Fuerza de alineación
            },
            cohesion: {
                radius: 50,      // Radio de cohesión
                strength: 0.8    // Fuerza de cohesión
            },
            
            // Límites de velocidad
            maxSpeed: 200,       // Velocidad máxima (px/s)
            maxForce: 100,       // Fuerza máxima
            
            // Configuración de flota
            shipSpacing: 15,     // Espaciado mínimo entre naves
            formationTightness: 0.7,  // Qué tan apretada es la formación
            
            // Optimización
            updateRadius: 100,   // Solo calcular física dentro de este radio
            maxNeighbors: 10     // Máximo vecinos a considerar
        };
        
        // Cache para optimización
        this.neighborCache = new Map();
        this.lastCacheUpdate = 0;
        this.cacheUpdateInterval = 100; // ms
        
        console.log('🐦 FleetPhysics inicializado con comportamiento de boids');
    }

    /**
     * Actualizar física de todas las flotas
     */
    updateFleetPhysics(fleets, deltaTime) {
        const now = Date.now();
        
        // Actualizar cache de vecinos si es necesario
        if (now - this.lastCacheUpdate > this.cacheUpdateInterval) {
            this.updateNeighborCache(fleets);
            this.lastCacheUpdate = now;
        }
        
        // Aplicar física a cada flota
        fleets.forEach(fleet => {
            if (fleet.hasArrived || fleet.ships <= 0) return;
            
            this.updateFleetBehavior(fleet, fleets, deltaTime);
        });
    }

    /**
     * Actualizar comportamiento de una flota individual
     */
    updateFleetBehavior(fleet, allFleets, deltaTime) {
        // Obtener vecinos cercanos
        const neighbors = this.getNeighbors(fleet, allFleets);
        
        if (neighbors.length === 0) {
            // Sin vecinos, mantener curso directo
            this.updateDirectMovement(fleet, deltaTime);
            return;
        }
        
        // Calcular fuerzas de boids
        const separation = this.calculateSeparation(fleet, neighbors);
        const alignment = this.calculateAlignment(fleet, neighbors);
        const cohesion = this.calculateCohesion(fleet, neighbors);
        const seek = this.calculateSeek(fleet);
        
        // Combinar fuerzas
        const totalForce = this.combineForcesWeighted(
            { force: separation, weight: this.config.separation.strength },
            { force: alignment, weight: this.config.alignment.strength },
            { force: cohesion, weight: this.config.cohesion.strength },
            { force: seek, weight: 2.0 } // Seek tiene prioridad
        );
        
        // Aplicar fuerza a la velocidad
        this.applyForce(fleet, totalForce, deltaTime);
        
        // Actualizar posición
        this.updatePosition(fleet, deltaTime);
    }

    /**
     * Movimiento directo sin vecinos
     */
    updateDirectMovement(fleet, deltaTime) {
        const seek = this.calculateSeek(fleet);
        this.applyForce(fleet, seek, deltaTime);
        this.updatePosition(fleet, deltaTime);
    }

    /**
     * Calcular fuerza de separación (evitar colisiones)
     */
    calculateSeparation(fleet, neighbors) {
        const separationForce = { x: 0, y: 0 };
        let count = 0;
        
        neighbors.forEach(neighbor => {
            const distance = this.getDistance(fleet, neighbor);
            
            if (distance < this.config.separation.radius && distance > 0) {
                // Vector de separación
                const diff = {
                    x: fleet.x - neighbor.x,
                    y: fleet.y - neighbor.y
                };
                
                // Normalizar y escalar por distancia inversa
                const magnitude = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
                if (magnitude > 0) {
                    diff.x /= magnitude;
                    diff.y /= magnitude;
                    
                    // Más fuerza cuando están más cerca
                    const strength = this.config.separation.radius / distance;
                    diff.x *= strength;
                    diff.y *= strength;
                    
                    separationForce.x += diff.x;
                    separationForce.y += diff.y;
                    count++;
                }
            }
        });
        
        if (count > 0) {
            separationForce.x /= count;
            separationForce.y /= count;
            
            // Normalizar y escalar
            return this.normalizeAndScale(separationForce, this.config.maxForce);
        }
        
        return { x: 0, y: 0 };
    }

    /**
     * Calcular fuerza de alineación (seguir dirección del grupo)
     */
    calculateAlignment(fleet, neighbors) {
        const avgVelocity = { x: 0, y: 0 };
        let count = 0;
        
        neighbors.forEach(neighbor => {
            const distance = this.getDistance(fleet, neighbor);
            
            if (distance < this.config.alignment.radius) {
                avgVelocity.x += neighbor.velocity?.x || 0;
                avgVelocity.y += neighbor.velocity?.y || 0;
                count++;
            }
        });
        
        if (count > 0) {
            avgVelocity.x /= count;
            avgVelocity.y /= count;
            
            return this.normalizeAndScale(avgVelocity, this.config.maxForce);
        }
        
        return { x: 0, y: 0 };
    }

    /**
     * Calcular fuerza de cohesión (mantenerse cerca del grupo)
     */
    calculateCohesion(fleet, neighbors) {
        const centerOfMass = { x: 0, y: 0 };
        let count = 0;
        
        neighbors.forEach(neighbor => {
            const distance = this.getDistance(fleet, neighbor);
            
            if (distance < this.config.cohesion.radius) {
                centerOfMass.x += neighbor.x;
                centerOfMass.y += neighbor.y;
                count++;
            }
        });
        
        if (count > 0) {
            centerOfMass.x /= count;
            centerOfMass.y /= count;
            
            // Buscar hacia el centro de masa
            return this.seek(fleet, centerOfMass);
        }
        
        return { x: 0, y: 0 };
    }

    /**
     * Calcular fuerza de búsqueda hacia el objetivo
     */
    calculateSeek(fleet) {
        return this.seek(fleet, { x: fleet.targetX, y: fleet.targetY });
    }

    /**
     * Buscar hacia un punto específico
     */
    seek(fleet, target) {
        const desired = {
            x: target.x - fleet.x,
            y: target.y - fleet.y
        };
        
        // Normalizar y escalar a velocidad máxima
        const desiredNormalized = this.normalizeAndScale(desired, this.config.maxSpeed);
        
        // Steering = desired - velocity
        const steering = {
            x: desiredNormalized.x - (fleet.velocity?.x || 0),
            y: desiredNormalized.y - (fleet.velocity?.y || 0)
        };
        
        return this.limitMagnitude(steering, this.config.maxForce);
    }

    /**
     * Combinar múltiples fuerzas con pesos
     */
    combineForcesWeighted(...weightedForces) {
        const combined = { x: 0, y: 0 };
        
        weightedForces.forEach(({ force, weight }) => {
            combined.x += force.x * weight;
            combined.y += force.y * weight;
        });
        
        return this.limitMagnitude(combined, this.config.maxForce);
    }

    /**
     * Aplicar fuerza a la velocidad de la flota
     */
    applyForce(fleet, force, deltaTime) {
        // Inicializar velocidad si no existe
        if (!fleet.velocity) {
            fleet.velocity = { x: 0, y: 0 };
        }
        
        // Aplicar fuerza (F = ma, asumiendo masa = 1)
        fleet.velocity.x += force.x * deltaTime;
        fleet.velocity.y += force.y * deltaTime;
        
        // Limitar velocidad máxima
        fleet.velocity = this.limitMagnitude(fleet.velocity, this.config.maxSpeed);
    }

    /**
     * Actualizar posición basada en velocidad
     */
    updatePosition(fleet, deltaTime) {
        if (!fleet.velocity) return;
        
        fleet.x += fleet.velocity.x * deltaTime;
        fleet.y += fleet.velocity.y * deltaTime;
        
        // Actualizar trail si existe
        if (fleet.trail) {
            fleet.trail.push({ x: fleet.x, y: fleet.y, timestamp: Date.now() });
            
            // Limitar longitud del trail
            const maxTrailLength = 10;
            if (fleet.trail.length > maxTrailLength) {
                fleet.trail.shift();
            }
        }
    }

    /**
     * Obtener vecinos cercanos (optimizado con cache)
     */
    getNeighbors(fleet, allFleets) {
        const cacheKey = fleet.id;
        
        if (this.neighborCache.has(cacheKey)) {
            return this.neighborCache.get(cacheKey);
        }
        
        const neighbors = [];
        const maxDistance = Math.max(
            this.config.separation.radius,
            this.config.alignment.radius,
            this.config.cohesion.radius
        );
        
        allFleets.forEach(otherFleet => {
            if (otherFleet.id === fleet.id || otherFleet.hasArrived) return;
            
            const distance = this.getDistance(fleet, otherFleet);
            if (distance < maxDistance) {
                neighbors.push(otherFleet);
            }
        });
        
        // Limitar número de vecinos para rendimiento
        neighbors.sort((a, b) => this.getDistance(fleet, a) - this.getDistance(fleet, b));
        const limitedNeighbors = neighbors.slice(0, this.config.maxNeighbors);
        
        this.neighborCache.set(cacheKey, limitedNeighbors);
        return limitedNeighbors;
    }

    /**
     * Actualizar cache de vecinos
     */
    updateNeighborCache(fleets) {
        this.neighborCache.clear();
        // El cache se reconstruirá bajo demanda
    }

    /**
     * Utilidades matemáticas
     */
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    normalizeAndScale(vector, scale) {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude === 0) return { x: 0, y: 0 };
        
        return {
            x: (vector.x / magnitude) * scale,
            y: (vector.y / magnitude) * scale
        };
    }

    limitMagnitude(vector, maxMagnitude) {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude > maxMagnitude) {
            return {
                x: (vector.x / magnitude) * maxMagnitude,
                y: (vector.y / magnitude) * maxMagnitude
            };
        }
        return vector;
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            config: this.config,
            cacheSize: this.neighborCache.size,
            lastCacheUpdate: this.lastCacheUpdate
        };
    }

    /**
     * Destruir sistema de física
     */
    destroy() {
        this.neighborCache.clear();
        console.log('💥 FleetPhysics destruido');
    }
}

export default FleetPhysics; 