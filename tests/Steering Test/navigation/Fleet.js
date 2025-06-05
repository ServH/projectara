/**
 * 🚁 FLEET - Gestión de Flotas con Comportamientos de Grupo
 * Implementa formaciones, liderazgo y comportamientos colectivos
 * Optimizado para manejar cientos de naves como una unidad táctica
 */

import { Vector2D } from './Vector2D.js';
import { SteeringVehicle } from './SteeringVehicle.js';

export class Fleet {
    constructor(startPosition, targetPosition, config, fleetSize = 5) {
        this.id = Fleet.generateId();
        this.startPosition = startPosition.copy();
        this.targetPosition = targetPosition.copy();
        this.config = config;
        
        // Propiedades de la flota
        this.vehicles = [];
        this.leader = null;
        this.formation = 'spread'; // 'spread', 'line', 'wedge', 'circle'
        this.fleetSize = fleetSize;
        
        // Estado de la flota
        this.isActive = true;
        this.hasArrived = false;
        this.averagePosition = startPosition.copy();
        this.averageVelocity = Vector2D.zero();
        
        // Parámetros de formación
        this.formationSpacing = 15;
        this.formationTightness = 0.3;
        this.leaderFollowDistance = 12;
        
        // Comportamientos de boids
        this.boidSettings = {
            separationRadius: 20,
            alignmentRadius: 30,
            cohesionRadius: 40,
            separationWeight: 1.5,
            alignmentWeight: 1.0,
            cohesionWeight: 0.8,
            leaderWeight: 2.0
        };
        
        // 🔍 CONFIGURACIÓN DE SENSORES PARA SEGUIDORES (NUEVO)
        this.followerSensorConfig = {
            length: 0.7,           // 70% de la longitud normal
            lateralCount: 1,       // 1 sensor lateral por lado
            lateralAngle: 30,      // Ángulo estándar
            avoidanceWeight: 1.2,  // +20% peso evasión
            followWeight: 0.8      // -20% peso seguimiento
        };
        
        // Crear naves de la flota
        this.createFleetVehicles();
        
        console.log(`🚁 Flota ${this.id} creada con ${this.vehicles.length} naves`);
    }

    /**
     * 🆔 Generar ID único para la flota
     */
    static generateId() {
        return 'fleet_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 🚀 Crear vehículos de la flota
     */
    createFleetVehicles() {
        for (let i = 0; i < this.fleetSize; i++) {
            // Posición inicial con variación
            const offset = this.getFormationOffset(i, this.fleetSize);
            const vehicleStart = Vector2D.add(this.startPosition, offset);
            
            // Crear vehículo
            const vehicle = new SteeringVehicle(
                vehicleStart,
                this.targetPosition.copy(),
                this.config
            );
            
            // Propiedades específicas de flota
            vehicle.fleetId = this.id;
            vehicle.fleetIndex = i;
            vehicle.isLeader = i === 0;
            vehicle.formationOffset = offset;
            
            this.vehicles.push(vehicle);
            
            // Asignar líder
            if (i === 0) {
                this.leader = vehicle;
            }
        }
    }

    /**
     * 📐 Calcular offset de formación para una nave
     */
    getFormationOffset(index, totalVehicles) {
        switch (this.formation) {
            case 'spread':
                return this.getSpreadFormation(index, totalVehicles);
            case 'line':
                return this.getLineFormation(index, totalVehicles);
            case 'wedge':
                return this.getWedgeFormation(index, totalVehicles);
            case 'circle':
                return this.getCircleFormation(index, totalVehicles);
            default:
                return this.getSpreadFormation(index, totalVehicles);
        }
    }

    /**
     * 📐 Formación dispersa (spread)
     */
    getSpreadFormation(index, total) {
        if (index === 0) return Vector2D.zero(); // Líder en el centro
        
        const angle = (index - 1) * (Math.PI * 2) / (total - 1);
        const radius = this.formationSpacing * (0.5 + Math.random() * 0.5);
        
        return new Vector2D(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        );
    }

    /**
     * 📐 Formación en línea
     */
    getLineFormation(index, total) {
        const spacing = this.formationSpacing;
        const centerIndex = (total - 1) / 2;
        const offset = (index - centerIndex) * spacing;
        
        return new Vector2D(offset, Math.random() * 10 - 5);
    }

    /**
     * 📐 Formación en cuña (wedge)
     */
    getWedgeFormation(index, total) {
        if (index === 0) return Vector2D.zero(); // Líder al frente
        
        const row = Math.floor((index - 1) / 2) + 1;
        const side = (index - 1) % 2 === 0 ? -1 : 1;
        const spacing = this.formationSpacing;
        
        return new Vector2D(
            side * row * spacing * 0.5,
            -row * spacing
        );
    }

    /**
     * 📐 Formación circular
     */
    getCircleFormation(index, total) {
        if (index === 0) return Vector2D.zero(); // Líder en el centro
        
        const angle = (index - 1) * (Math.PI * 2) / (total - 1);
        const radius = this.formationSpacing;
        
        return new Vector2D(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        );
    }

    /**
     * 🔄 Actualizar flota
     */
    update(deltaTime, obstacles, spatialHash) {
        if (!this.isActive || this.hasArrived) return;
        
        // Actualizar posición promedio
        this.updateAveragePosition();
        
        // Actualizar líder primero
        if (this.leader && !this.leader.hasArrived) {
            this.updateLeader(deltaTime, obstacles);
        }
        
        // Actualizar seguidores
        this.vehicles.forEach(vehicle => {
            if (!vehicle.isLeader && !vehicle.hasArrived) {
                this.updateFollower(vehicle, deltaTime, obstacles, spatialHash);
            }
        });
        
        // Verificar si la flota ha llegado
        this.checkFleetArrival();
        
        // Remover naves que han llegado
        this.vehicles = this.vehicles.filter(vehicle => !vehicle.hasArrived);
        
        // Verificar si la flota está vacía
        if (this.vehicles.length === 0) {
            this.hasArrived = true;
            this.isActive = false;
        }
    }

    /**
     * 🎯 Actualizar líder de la flota
     */
    updateLeader(deltaTime, obstacles) {
        // El líder usa steering behaviors estándar
        this.leader.update(deltaTime, obstacles, this.config);
    }

    /**
     * 👥 Actualizar seguidor de la flota
     */
    updateFollower(vehicle, deltaTime, obstacles, spatialHash) {
        if (!this.leader) return;
        
        // Obtener naves cercanas usando spatial hash
        const nearbyVehicles = spatialHash ? 
            spatialHash.getNearby(vehicle.position, this.boidSettings.cohesionRadius) : 
            this.vehicles;
        
        // Calcular fuerzas de boids
        const separationForce = this.calculateSeparation(vehicle, nearbyVehicles);
        const alignmentForce = this.calculateAlignment(vehicle, nearbyVehicles);
        const cohesionForce = this.calculateCohesion(vehicle, nearbyVehicles);
        const leaderFollowForce = this.calculateLeaderFollow(vehicle);
        
        // Fuerza de evasión de obstáculos (simplificada)
        const avoidanceForce = this.calculateSimpleAvoidance(vehicle, obstacles);
        
        // Combinar todas las fuerzas
        let totalForce = Vector2D.zero();
        
        totalForce.add(Vector2D.multiply(separationForce, this.boidSettings.separationWeight));
        totalForce.add(Vector2D.multiply(alignmentForce, this.boidSettings.alignmentWeight));
        totalForce.add(Vector2D.multiply(cohesionForce, this.boidSettings.cohesionWeight));
        
        // 🔧 Aplicar configuración de seguidor: -20% peso seguimiento
        const adjustedLeaderWeight = this.boidSettings.leaderWeight * this.followerSensorConfig.followWeight;
        totalForce.add(Vector2D.multiply(leaderFollowForce, adjustedLeaderWeight));
        
        // 🔧 Aplicar configuración de seguidor: +20% peso evasión
        const adjustedAvoidanceWeight = this.config.forces.avoidanceWeight * this.followerSensorConfig.avoidanceWeight;
        totalForce.add(Vector2D.multiply(avoidanceForce, adjustedAvoidanceWeight));
        
        // Limitar fuerza total
        totalForce.limit(vehicle.maxForce);
        
        // Aplicar física
        vehicle.acceleration = totalForce;
        vehicle.velocity.add(Vector2D.multiply(vehicle.acceleration, deltaTime));
        vehicle.velocity.limit(vehicle.maxSpeed);
        
        const oldPosition = vehicle.position.copy();
        vehicle.position.add(Vector2D.multiply(vehicle.velocity, deltaTime));
        
        // Actualizar rastro
        vehicle.updateTrail();
        
        // Verificar llegada
        vehicle.checkArrival(this.config);
        
        // Actualizar spatial hash si existe
        if (spatialHash) {
            spatialHash.update(vehicle, oldPosition);
        }
    }

    /**
     * 🔄 Calcular separación (evitar aglomeración)
     */
    calculateSeparation(vehicle, nearbyVehicles) {
        let separationForce = Vector2D.zero();
        let count = 0;
        
        nearbyVehicles.forEach(other => {
            if (other !== vehicle && other.fleetId === vehicle.fleetId) {
                const distance = vehicle.position.distance(other.position);
                
                if (distance < this.boidSettings.separationRadius && distance > 0) {
                    const diff = Vector2D.subtract(vehicle.position, other.position);
                    diff.normalize();
                    diff.divide(distance); // Peso inversamente proporcional a la distancia
                    separationForce.add(diff);
                    count++;
                }
            }
        });
        
        if (count > 0) {
            separationForce.divide(count);
            separationForce.normalize();
            separationForce.multiply(vehicle.maxSpeed);
            separationForce.subtract(vehicle.velocity);
            separationForce.limit(vehicle.maxForce);
        }
        
        return separationForce;
    }

    /**
     * 🧭 Calcular alineación (seguir dirección del grupo)
     */
    calculateAlignment(vehicle, nearbyVehicles) {
        let averageVelocity = Vector2D.zero();
        let count = 0;
        
        nearbyVehicles.forEach(other => {
            if (other !== vehicle && other.fleetId === vehicle.fleetId) {
                const distance = vehicle.position.distance(other.position);
                
                if (distance < this.boidSettings.alignmentRadius) {
                    averageVelocity.add(other.velocity);
                    count++;
                }
            }
        });
        
        if (count > 0) {
            averageVelocity.divide(count);
            averageVelocity.normalize();
            averageVelocity.multiply(vehicle.maxSpeed);
            
            const steer = Vector2D.subtract(averageVelocity, vehicle.velocity);
            steer.limit(vehicle.maxForce);
            return steer;
        }
        
        return Vector2D.zero();
    }

    /**
     * 🎯 Calcular cohesión (mantenerse cerca del grupo)
     */
    calculateCohesion(vehicle, nearbyVehicles) {
        let centerOfMass = Vector2D.zero();
        let count = 0;
        
        nearbyVehicles.forEach(other => {
            if (other !== vehicle && other.fleetId === vehicle.fleetId) {
                const distance = vehicle.position.distance(other.position);
                
                if (distance < this.boidSettings.cohesionRadius) {
                    centerOfMass.add(other.position);
                    count++;
                }
            }
        });
        
        if (count > 0) {
            centerOfMass.divide(count);
            return this.seek(vehicle, centerOfMass);
        }
        
        return Vector2D.zero();
    }

    /**
     * 👑 Calcular seguimiento del líder
     */
    calculateLeaderFollow(vehicle) {
        if (!this.leader || vehicle.isLeader) {
            return Vector2D.zero();
        }
        
        // Calcular posición objetivo detrás del líder
        const leaderVelocity = this.leader.velocity.copy();
        if (leaderVelocity.magnitude() > 0) {
            leaderVelocity.normalize();
            leaderVelocity.multiply(-this.leaderFollowDistance);
        }
        
        const targetPosition = Vector2D.add(this.leader.position, leaderVelocity);
        targetPosition.add(vehicle.formationOffset);
        
        return this.seek(vehicle, targetPosition);
    }

    /**
     * 🎯 Comportamiento de búsqueda simplificado
     */
    seek(vehicle, target) {
        const desired = Vector2D.subtract(target, vehicle.position);
        desired.normalize();
        desired.multiply(vehicle.maxSpeed);
        
        const steer = Vector2D.subtract(desired, vehicle.velocity);
        steer.limit(vehicle.maxForce);
        
        return steer;
    }

    /**
     * 🚧 Evasión con sensores básicos para seguidores (MEJORADO)
     */
    calculateSimpleAvoidance(vehicle, obstacles) {
        let avoidanceForce = Vector2D.zero();
        
        // 🔍 Crear sensores básicos para el seguidor
        const sensors = this.createFollowerSensors(vehicle);
        
        // Detectar amenazas usando sensores
        let closestThreat = null;
        let minDistance = Infinity;
        
        for (const obstacle of obstacles) {
            for (const sensor of sensors) {
                const intersection = this.getLineCircleIntersection(
                    sensor.start,
                    sensor.end,
                    obstacle.position,
                    obstacle.radius + vehicle.radius + 10
                );
                
                if (intersection) {
                    const distance = vehicle.position.distance(intersection);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestThreat = { obstacle, intersection, distance };
                    }
                }
            }
        }
        
        // 🚨 Calcular fuerza de evasión si hay amenaza
        if (closestThreat) {
            const threat = closestThreat;
            
            // Fuerza de repulsión (reducida para seguidores)
            const toObstacle = Vector2D.subtract(threat.obstacle.position, vehicle.position);
            const distanceToObstacle = toObstacle.magnitude();
            
            if (distanceToObstacle > 0) {
                const repulsionDirection = Vector2D.normalize(toObstacle).multiply(-1);
                const urgency = Math.max(0, 1 - (threat.distance / (this.config.sensors.length * this.followerSensorConfig.length)));
                
                // 🔧 Corrección menor del rumbo (no bailoteo)
                const repulsionForce = Vector2D.multiply(repulsionDirection, urgency * vehicle.maxForce * this.followerSensorConfig.avoidanceWeight);
                avoidanceForce.add(repulsionForce);
                
                // Fuerza lateral suave
                if (vehicle.velocity.magnitude() > 0.1) {
                    const velocityNorm = Vector2D.normalize(vehicle.velocity);
                    const leftDirection = velocityNorm.perpendicular();
                    const rightDirection = Vector2D.multiply(leftDirection, -1);
                    
                    // Elegir lado con más espacio
                    const leftClearance = this.calculateFollowerClearance(vehicle, leftDirection, obstacles);
                    const rightClearance = this.calculateFollowerClearance(vehicle, rightDirection, obstacles);
                    
                    const preferredDirection = leftClearance > rightClearance ? leftDirection : rightDirection;
                    const lateralForce = Vector2D.multiply(preferredDirection, urgency * vehicle.maxForce * 0.8);
                    avoidanceForce.add(lateralForce);
                }
            }
        }
        
        return avoidanceForce;
    }
    
    /**
     * 🔍 Crear sensores básicos para seguidores
     */
    createFollowerSensors(vehicle) {
        const sensors = [];
        const sensorLength = this.config.sensors.length * this.followerSensorConfig.length;
        
        // Dirección basada en velocidad o hacia el líder
        let direction;
        if (vehicle.velocity.magnitude() > 0.1) {
            direction = Vector2D.normalize(vehicle.velocity);
        } else if (this.leader) {
            direction = Vector2D.subtract(this.leader.position, vehicle.position).normalize();
        } else {
            return sensors; // Sin dirección válida
        }
        
        // Sensor principal (hacia adelante)
        sensors.push({
            start: vehicle.position.copy(),
            end: Vector2D.add(vehicle.position, Vector2D.multiply(direction, sensorLength))
        });
        
        // Sensores laterales (1 por lado)
        const lateralAngle = (this.followerSensorConfig.lateralAngle * Math.PI) / 180;
        
        // Sensor izquierdo
        const leftDirection = Vector2D.rotate(direction, -lateralAngle);
        sensors.push({
            start: vehicle.position.copy(),
            end: Vector2D.add(vehicle.position, Vector2D.multiply(leftDirection, sensorLength * 0.8))
        });
        
        // Sensor derecho
        const rightDirection = Vector2D.rotate(direction, lateralAngle);
        sensors.push({
            start: vehicle.position.copy(),
            end: Vector2D.add(vehicle.position, Vector2D.multiply(rightDirection, sensorLength * 0.8))
        });
        
        return sensors;
    }
    
    /**
     * 🔍 Calcular claridad para seguidores
     */
    calculateFollowerClearance(vehicle, direction, obstacles) {
        const testDistance = this.config.sensors.length * this.followerSensorConfig.length;
        const testPosition = Vector2D.add(vehicle.position, Vector2D.multiply(direction, testDistance));
        
        let minClearance = testDistance;
        
        for (const obstacle of obstacles) {
            const distanceToObstacle = testPosition.distance(obstacle.position);
            const requiredClearance = obstacle.radius + vehicle.radius + 15;
            
            if (distanceToObstacle < requiredClearance) {
                minClearance = Math.min(minClearance, distanceToObstacle - obstacle.radius);
            }
        }
        
        return Math.max(0, minClearance);
    }
    
    /**
     * 📐 Intersección línea-círculo para sensores
     */
    getLineCircleIntersection(lineStart, lineEnd, circleCenter, circleRadius) {
        const d = Vector2D.subtract(lineEnd, lineStart);
        const f = Vector2D.subtract(lineStart, circleCenter);
        
        const a = d.dot(d);
        const b = 2 * f.dot(d);
        const c = f.dot(f) - circleRadius * circleRadius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return null;
        }
        
        const discriminantSqrt = Math.sqrt(discriminant);
        const t1 = (-b - discriminantSqrt) / (2 * a);
        const t2 = (-b + discriminantSqrt) / (2 * a);
        
        if (t1 >= 0 && t1 <= 1) {
            return Vector2D.add(lineStart, Vector2D.multiply(d, t1));
        }
        
        if (t2 >= 0 && t2 <= 1) {
            return Vector2D.add(lineStart, Vector2D.multiply(d, t2));
        }
        
        return null;
    }

    /**
     * 📊 Actualizar posición promedio de la flota
     */
    updateAveragePosition() {
        if (this.vehicles.length === 0) return;
        
        let totalPosition = Vector2D.zero();
        let totalVelocity = Vector2D.zero();
        
        this.vehicles.forEach(vehicle => {
            totalPosition.add(vehicle.position);
            totalVelocity.add(vehicle.velocity);
        });
        
        this.averagePosition = totalPosition.divide(this.vehicles.length);
        this.averageVelocity = totalVelocity.divide(this.vehicles.length);
    }

    /**
     * 🎯 Verificar si la flota ha llegado
     */
    checkFleetArrival() {
        if (this.vehicles.length === 0) {
            this.hasArrived = true;
            return;
        }
        
        // La flota ha llegado si el 80% de las naves han llegado
        const arrivedCount = this.vehicles.filter(v => v.hasArrived).length;
        const arrivalThreshold = Math.ceil(this.vehicles.length * 0.8);
        
        if (arrivedCount >= arrivalThreshold) {
            this.hasArrived = true;
            console.log(`🎯 Flota ${this.id} ha llegado al destino`);
        }
    }

    /**
     * 🔧 Cambiar formación de la flota
     */
    setFormation(newFormation) {
        this.formation = newFormation;
        
        // Recalcular offsets de formación
        this.vehicles.forEach((vehicle, index) => {
            vehicle.formationOffset = this.getFormationOffset(index, this.vehicles.length);
        });
        
        console.log(`🔧 Flota ${this.id} cambió a formación: ${newFormation}`);
    }

    /**
     * 🎯 Cambiar objetivo de la flota
     */
    setTarget(newTarget) {
        this.targetPosition = newTarget.copy();
        
        this.vehicles.forEach(vehicle => {
            vehicle.target = newTarget.copy();
            vehicle.hasArrived = false;
        });
        
        this.hasArrived = false;
        this.isActive = true;
        
        console.log(`🎯 Flota ${this.id} nuevo objetivo: ${newTarget.toString()}`);
    }

    /**
     * 🎨 Renderizar flota
     */
    render(ctx, debugConfig) {
        // Renderizar conexiones de formación si está habilitado
        if (debugConfig.showFleetConnections && this.vehicles.length > 1) {
            this.renderFormationConnections(ctx);
        }
        
        // Renderizar todas las naves
        this.vehicles.forEach(vehicle => {
            vehicle.render(ctx, debugConfig);
        });
        
        // Renderizar centro de masa si está habilitado
        if (debugConfig.showFleetCenter) {
            this.renderFleetCenter(ctx);
        }
    }

    /**
     * 🎨 Renderizar conexiones de formación
     */
    renderFormationConnections(ctx) {
        if (!this.leader) return;
        
        ctx.save();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([3, 3]);
        
        this.vehicles.forEach(vehicle => {
            if (!vehicle.isLeader) {
                ctx.beginPath();
                ctx.moveTo(this.leader.position.x, this.leader.position.y);
                ctx.lineTo(vehicle.position.x, vehicle.position.y);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }

    /**
     * 🎨 Renderizar centro de masa de la flota
     */
    renderFleetCenter(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffaa00';
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        ctx.arc(this.averagePosition.x, this.averagePosition.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Etiqueta de la flota
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            `F${this.id.slice(-3)}`,
            this.averagePosition.x,
            this.averagePosition.y - 10
        );
        
        ctx.restore();
    }

    /**
     * 📊 Obtener estadísticas de la flota
     */
    getStats() {
        return {
            id: this.id,
            size: this.vehicles.length,
            formation: this.formation,
            isActive: this.isActive,
            hasArrived: this.hasArrived,
            averageSpeed: this.averageVelocity.magnitude().toFixed(1),
            averagePosition: this.averagePosition.toObject()
        };
    }

    /**
     * 💥 Destruir flota
     */
    destroy() {
        this.vehicles.forEach(vehicle => {
            // Cleanup individual de vehículos si es necesario
        });
        
        this.vehicles = [];
        this.leader = null;
        this.isActive = false;
        
        console.log(`💥 Flota ${this.id} destruida`);
    }
} 