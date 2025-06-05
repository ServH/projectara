/**
 * 🚀 STEERING VEHICLE - Vehículo con Comportamientos de Dirección
 * Implementación completa de steering behaviors según Craig Reynolds
 * Incluye: Seek, Obstacle Avoidance, Arrival, Wander
 */

import { Vector2D } from './Vector2D.js';

export class SteeringVehicle {
    constructor(position, target, config) {
        // Propiedades físicas
        this.position = position.copy();
        this.velocity = Vector2D.zero();
        this.acceleration = Vector2D.zero();
        this.target = target.copy();
        
        // Propiedades de steering
        this.maxSpeed = config.forces.maxSpeed;
        this.maxForce = config.forces.maxForce;
        this.radius = 8; // Radio del vehículo
        
        // Estado del vehículo
        this.hasArrived = false;
        this.isAvoiding = false;
        this.wanderAngle = Math.random() * Math.PI * 2;
        
        // 🔄 SISTEMA DE HISTÉRESIS (NUEVO)
        this.avoidanceState = {
            isActive: false,
            entryThreshold: 0.5,    // Umbral para ENTRAR en evasión
            exitThreshold: 0.3,     // Umbral para SALIR de evasión
            urgency: 0,
            framesSinceLastThreat: 0
        };
        
        // Historial para rastros
        this.trail = [];
        this.maxTrailLength = 30;
        
        // Fuerzas para debug visual
        this.debugForces = {
            seek: Vector2D.zero(),
            avoidance: Vector2D.zero(),
            resultant: Vector2D.zero()
        };
        
        // Sensores
        this.sensors = [];
        this.updateSensors(config);
        
        // Debug y logging
        this.debugFrameCounter = 0;
        this.lastLoggedThreat = null;
        
        console.log(`🚀 SteeringVehicle creado en ${position.toString()}`);
    }

    /**
     * 🔄 Actualizar vehículo
     */
    update(deltaTime, obstacles, config) {
        if (this.hasArrived) return;
        
        // Actualizar sensores
        this.updateSensors(config);
        
        // Calcular fuerzas de steering
        const steeringForce = this.calculateSteeringForce(obstacles, config);
        
        // Aplicar física
        this.acceleration = steeringForce.copy();
        this.velocity.add(Vector2D.multiply(this.acceleration, deltaTime));
        this.velocity.limit(this.maxSpeed);
        
        this.position.add(Vector2D.multiply(this.velocity, deltaTime));
        
        // Actualizar rastro
        this.updateTrail();
        
        // Verificar llegada
        this.checkArrival(config);
        
        // Aplicar suavizado a las fuerzas de debug
        const smoothing = config.forces.smoothing;
        this.debugForces.seek.lerp(this.lastSeekForce || Vector2D.zero(), smoothing);
        this.debugForces.avoidance.lerp(this.lastAvoidanceForce || Vector2D.zero(), smoothing);
        this.debugForces.resultant.lerp(steeringForce, smoothing);
    }

    /**
     * 🧭 Calcular fuerza de steering principal (MEJORADO CON HISTÉRESIS)
     */
    calculateSteeringForce(obstacles, config) {
        let totalForce = Vector2D.zero();
        
        // 1. Fuerza de evasión de obstáculos (PRIORIDAD MÁXIMA)
        const avoidanceForce = this.calculateObstacleAvoidanceForce(obstacles, config);
        this.lastAvoidanceForce = avoidanceForce.copy();
        
        // 2. Fuerza de búsqueda (Seek)
        const seekForce = this.calculateSeekForce(config);
        this.lastSeekForce = seekForce.copy();
        
        // 3. Fuerza de vagabundeo (si está habilitado)
        const wanderForce = config.behavior.enableWander ? 
            this.calculateWanderForce(config) : Vector2D.zero();
        
        // 🔄 SISTEMA DE HISTÉRESIS MEJORADO
        const currentUrgency = this.avoidanceUrgency || 0;
        
        // Actualizar estado de evasión con histéresis
        if (!this.avoidanceState.isActive && currentUrgency > this.avoidanceState.entryThreshold) {
            // ENTRAR en modo evasión
            this.avoidanceState.isActive = true;
            this.avoidanceState.framesSinceLastThreat = 0;
        } else if (this.avoidanceState.isActive && currentUrgency < this.avoidanceState.exitThreshold) {
            // SALIR de modo evasión (con delay)
            this.avoidanceState.framesSinceLastThreat++;
            if (this.avoidanceState.framesSinceLastThreat > 10) { // 10 frames de gracia
                this.avoidanceState.isActive = false;
            }
        } else if (currentUrgency > 0) {
            this.avoidanceState.framesSinceLastThreat = 0;
        }
        
        this.avoidanceState.urgency = currentUrgency;
        
        // 🚨 SISTEMA DE PRIORIDADES BALANCEADO
        if (this.avoidanceState.isActive) {
            // MODO EVASIÓN: Fuerzas reducidas y seek protegido
            const reducedAvoidanceForce = Vector2D.multiply(avoidanceForce, 1.8); // 3x→1.8x
            totalForce.add(Vector2D.multiply(reducedAvoidanceForce, config.forces.avoidanceWeight));
            
            // Seek protegido: reducción máxima 50%, mínimo garantizado 20%
            const seekReduction = Math.min(0.5, currentUrgency * 0.6); // Máximo 50% reducción
            const seekMultiplier = Math.max(0.2, 1 - seekReduction); // Mínimo 20% garantizado
            totalForce.add(Vector2D.multiply(seekForce, config.forces.seekWeight * seekMultiplier));
            
            // Log solo cada 60 frames
            if (this.debugFrameCounter % 60 === 0) {
                console.log(`🔄 EVASIÓN SUAVE - Urgencia: ${currentUrgency.toFixed(2)}, Seek: ${(seekMultiplier * 100).toFixed(0)}%`);
            }
        } else {
            // MODO NORMAL: Combinar fuerzas normalmente
            totalForce.add(Vector2D.multiply(seekForce, config.forces.seekWeight));
            
            // Evasión limitada en modo normal
            const limitedAvoidanceForce = Vector2D.multiply(avoidanceForce, 1.2); // 2x→1.2x
            totalForce.add(Vector2D.multiply(limitedAvoidanceForce, Math.min(config.forces.avoidanceWeight, 2.5))); // Máximo 2.5x
        }
        
        // Agregar wander con peso fijo bajo
        totalForce.add(Vector2D.multiply(wanderForce, 0.3));
        
        // Limitar fuerza total (reducida)
        const maxAllowedForce = this.avoidanceState.isActive ? this.maxForce * 2.5 : this.maxForce; // 4x→2.5x
        totalForce.limit(maxAllowedForce);
        
        // Actualizar estado de evasión para debug
        this.isAvoiding = this.avoidanceState.isActive;
        
        return totalForce;
    }

    /**
     * 🎯 Calcular fuerza de búsqueda (Seek)
     */
    calculateSeekForce(config) {
        const desired = Vector2D.subtract(this.target, this.position);
        const distance = desired.magnitude();
        
        if (distance === 0) return Vector2D.zero();
        
        // Comportamiento de llegada (Arrival)
        if (config.behavior.enableArrival && distance < config.behavior.slowingDistance) {
            // Desacelerar gradualmente
            const speed = this.maxSpeed * (distance / config.behavior.slowingDistance);
            desired.setMagnitude(speed);
        } else {
            // Velocidad máxima hacia el objetivo
            desired.setMagnitude(this.maxSpeed);
        }
        
        // Calcular fuerza de steering
        const steer = Vector2D.subtract(desired, this.velocity);
        steer.limit(this.maxForce);
        
        return steer;
    }

    /**
     * 🚧 Calcular fuerza de evasión de obstáculos (CORREGIDO + DEBUG)
     */
    calculateObstacleAvoidanceForce(obstacles, config) {
        let avoidanceForce = Vector2D.zero();
        let closestThreat = null;
        let minDistance = Infinity;
        
        // 🔍 PASO 1: Usar sensores para detección confiable
        for (const obstacle of obstacles) {
            for (const sensor of this.sensors) {
                // Verificar intersección del sensor con el obstáculo
                const intersection = this.getLineCircleIntersection(
                    sensor.start,
                    sensor.end,
                    obstacle.position,
                    obstacle.radius + this.radius + 15 // Buffer de seguridad
                );
                
                if (intersection) {
                    const distanceToIntersection = this.position.distance(intersection);
                    
                    if (distanceToIntersection < minDistance) {
                        minDistance = distanceToIntersection;
                        closestThreat = {
                            obstacle: obstacle,
                            intersection: intersection,
                            distance: distanceToIntersection,
                            sensor: sensor
                        };
                    }
                }
            }
        }
        
        // 🚨 PASO 2: Calcular fuerza de evasión si hay amenaza
        if (closestThreat) {
            const threat = closestThreat;
            const obstacle = threat.obstacle;
            
            // DEBUG: Log detallado de la amenaza (solo cada 30 frames)
            this.debugFrameCounter++;
            const shouldLog = this.debugFrameCounter % 30 === 0 || !this.lastLoggedThreat;
            
            if (shouldLog) {
                console.log(`🚨 AMENAZA DETECTADA:`, {
                    distancia: threat.distance.toFixed(1),
                    obstaculoPos: `(${obstacle.position.x.toFixed(1)}, ${obstacle.position.y.toFixed(1)})`,
                    navePos: `(${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`,
                    velocidad: this.velocity.magnitude().toFixed(1)
                });
            }
            
            let steeringForce = Vector2D.zero();
            
            // A) Fuerza de repulsión directa desde el obstáculo
            const toObstacle = Vector2D.subtract(obstacle.position, this.position);
            const distanceToObstacle = toObstacle.magnitude();
            
            if (distanceToObstacle > 0) {
                const repulsionDirection = Vector2D.normalize(toObstacle).multiply(-1);
                const repulsionStrength = Math.max(0, 1 - (threat.distance / config.sensors.length));
                const repulsionForce = Vector2D.multiply(repulsionDirection, repulsionStrength * this.maxForce * 3);
                steeringForce.add(repulsionForce);
                
                if (shouldLog) {
                    console.log(`🔴 REPULSIÓN: Fuerza ${repulsionForce.magnitude().toFixed(1)}, Dirección ${repulsionDirection.toString()}`);
                }
            }
            
            // B) Fuerza lateral inteligente
            if (this.velocity.magnitude() > 0.1) {
                const velocityNorm = Vector2D.normalize(this.velocity);
                
                // Calcular direcciones laterales
                const leftDirection = velocityNorm.perpendicular();
                const rightDirection = Vector2D.multiply(leftDirection, -1);
                
                // Determinar cuál lado está más libre
                const leftClearance = this.calculateClearance(leftDirection, obstacles, config);
                const rightClearance = this.calculateClearance(rightDirection, obstacles, config);
                
                const preferredDirection = leftClearance > rightClearance ? leftDirection : rightDirection;
                const sideChoice = leftClearance > rightClearance ? "IZQUIERDA" : "DERECHA";
                
                // Fuerza lateral proporcional a la urgencia
                const urgency = Math.max(0, 1 - (threat.distance / config.sensors.length));
                const lateralForce = Vector2D.multiply(preferredDirection, urgency * this.maxForce * 2);
                steeringForce.add(lateralForce);
                
                if (shouldLog) {
                    console.log(`🔵 LATERAL: ${sideChoice}, Clearance L:${leftClearance.toFixed(1)} R:${rightClearance.toFixed(1)}, Fuerza: ${lateralForce.magnitude().toFixed(1)}`);
                }
            }
            
            // C) Fuerza de frenado si está muy cerca
            if (threat.distance < 30) {
                const brakingForce = Vector2D.multiply(this.velocity, -0.8);
                steeringForce.add(brakingForce);
                if (shouldLog) {
                    console.log(`🟡 FRENADO: Fuerza ${brakingForce.magnitude().toFixed(1)}`);
                }
            }
            
            // Limitar y aplicar fuerza
            steeringForce.limit(this.maxForce * 4); // Hasta 4x la fuerza máxima
            avoidanceForce = steeringForce;
            
            // Marcar estado de evasión
            this.isAvoiding = true;
            this.avoidanceUrgency = Math.max(0, 1 - (threat.distance / config.sensors.length));
            this.debugThreat = threat; // Para visualización
            this.lastLoggedThreat = threat;
            
            if (shouldLog) {
                console.log(`🚨 FUERZA TOTAL EVASIÓN: ${avoidanceForce.magnitude().toFixed(1)}, Urgencia: ${this.avoidanceUrgency.toFixed(2)}`);
                console.log(`---`);
            }
            
        } else {
            this.isAvoiding = false;
            this.avoidanceUrgency = 0;
            this.debugThreat = null;
            this.lastLoggedThreat = null;
        }
        
        return avoidanceForce;
    }
    
    /**
     * 🔍 Calcular claridad en una dirección (nuevo método auxiliar)
     */
    calculateClearance(direction, obstacles, config) {
        const testDistance = config.sensors.length;
        const testPosition = Vector2D.add(this.position, Vector2D.multiply(direction, testDistance));
        
        let minClearance = testDistance;
        
        for (const obstacle of obstacles) {
            const distanceToObstacle = testPosition.distance(obstacle.position);
            const requiredClearance = obstacle.radius + this.radius + 20; // Buffer extra
            
            if (distanceToObstacle < requiredClearance) {
                minClearance = Math.min(minClearance, distanceToObstacle - obstacle.radius);
            }
        }
        
        return Math.max(0, minClearance);
    }

    /**
     * 🎲 Calcular fuerza de vagabundeo (Wander)
     */
    calculateWanderForce(config) {
        const wanderRadius = 25;
        const wanderDistance = 50;
        const wanderJitter = 0.1;
        
        // Actualizar ángulo de vagabundeo
        this.wanderAngle += (Math.random() - 0.5) * wanderJitter;
        
        // Calcular punto de vagabundeo
        const circleCenter = Vector2D.normalize(this.velocity).multiply(wanderDistance);
        const displacement = Vector2D.fromAngle(this.wanderAngle, wanderRadius);
        
        const wanderTarget = Vector2D.add(this.position, circleCenter).add(displacement);
        
        // Calcular fuerza hacia el punto de vagabundeo
        const desired = Vector2D.subtract(wanderTarget, this.position);
        desired.setMagnitude(this.maxSpeed);
        
        const steer = Vector2D.subtract(desired, this.velocity);
        steer.limit(this.maxForce * 0.3); // Fuerza más débil para wander
        
        return steer;
    }

    /**
     * 🔍 Actualizar sensores de detección
     */
    updateSensors(config) {
        this.sensors = [];
        
        if (this.velocity.magnitude() === 0) {
            // Si no hay velocidad, usar dirección hacia el objetivo
            const direction = Vector2D.subtract(this.target, this.position).normalize();
            this.addSensorsInDirection(direction, config);
        } else {
            // Usar dirección de la velocidad
            const direction = Vector2D.normalize(this.velocity);
            this.addSensorsInDirection(direction, config);
        }
    }

    /**
     * 🔍 Agregar sensores en una dirección específica
     */
    addSensorsInDirection(direction, config) {
        const sensorLength = config.sensors.length;
        const lateralAngle = (config.sensors.lateralAngle * Math.PI) / 180; // Convertir a radianes
        
        // Sensor principal (hacia adelante)
        const mainSensor = {
            start: this.position.copy(),
            end: Vector2D.add(this.position, Vector2D.multiply(direction, sensorLength)),
            width: config.sensors.width
        };
        this.sensors.push(mainSensor);
        
        // Sensores laterales
        for (let i = 1; i <= config.sensors.lateralCount; i++) {
            // Sensor izquierdo
            const leftDirection = Vector2D.rotate(direction, -lateralAngle * i);
            const leftSensor = {
                start: this.position.copy(),
                end: Vector2D.add(this.position, Vector2D.multiply(leftDirection, sensorLength * 0.8)),
                width: config.sensors.width * 0.8
            };
            this.sensors.push(leftSensor);
            
            // Sensor derecho
            const rightDirection = Vector2D.rotate(direction, lateralAngle * i);
            const rightSensor = {
                start: this.position.copy(),
                end: Vector2D.add(this.position, Vector2D.multiply(rightDirection, sensorLength * 0.8)),
                width: config.sensors.width * 0.8
            };
            this.sensors.push(rightSensor);
        }
    }

    /**
     * 📐 Calcular intersección línea-círculo
     */
    getLineCircleIntersection(lineStart, lineEnd, circleCenter, circleRadius) {
        const d = Vector2D.subtract(lineEnd, lineStart);
        const f = Vector2D.subtract(lineStart, circleCenter);
        
        const a = d.dot(d);
        const b = 2 * f.dot(d);
        const c = f.dot(f) - circleRadius * circleRadius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return null; // No hay intersección
        }
        
        const discriminantSqrt = Math.sqrt(discriminant);
        const t1 = (-b - discriminantSqrt) / (2 * a);
        const t2 = (-b + discriminantSqrt) / (2 * a);
        
        // Verificar si la intersección está dentro del segmento de línea
        if (t1 >= 0 && t1 <= 1) {
            return Vector2D.add(lineStart, Vector2D.multiply(d, t1));
        }
        
        if (t2 >= 0 && t2 <= 1) {
            return Vector2D.add(lineStart, Vector2D.multiply(d, t2));
        }
        
        return null;
    }

    /**
     * 📍 Actualizar rastro
     */
    updateTrail() {
        this.trail.push(this.position.copy());
        
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    /**
     * 🎯 Verificar llegada al objetivo
     */
    checkArrival(config) {
        const distance = this.position.distance(this.target);
        
        if (distance <= config.behavior.arrivalRadius) {
            this.hasArrived = true;
            this.velocity = Vector2D.zero();
            console.log(`🎯 Vehículo llegó al objetivo`);
        }
    }

    /**
     * 🎨 Renderizar vehículo
     */
    render(ctx, debugConfig) {
        ctx.save();
        
        // Renderizar rastro
        if (debugConfig.showTrails && this.trail.length > 1) {
            this.renderTrail(ctx);
        }
        
        // Renderizar sensores
        if (debugConfig.showSensors) {
            this.renderSensors(ctx);
        }
        
        // Renderizar debug de amenazas
        if (debugConfig.showSensors && this.debugThreat) {
            this.renderThreatDebug(ctx);
        }
        
        // Renderizar fuerzas
        if (debugConfig.showForces) {
            this.renderForces(ctx);
        }
        
        // Renderizar velocidad
        if (debugConfig.showVelocity) {
            this.renderVelocity(ctx);
        }
        
        // Renderizar vehículo
        this.renderBody(ctx);
        
        // Renderizar objetivo
        this.renderTarget(ctx);
        
        ctx.restore();
    }

    /**
     * 🎨 Renderizar cuerpo del vehículo
     */
    renderBody(ctx) {
        ctx.save();
        
        // Trasladar al centro del vehículo
        ctx.translate(this.position.x, this.position.y);
        
        // Rotar según la velocidad
        if (this.velocity.magnitude() > 0.1) {
            ctx.rotate(this.velocity.angle());
        }
        
        // Color según estado
        const color = this.hasArrived ? '#00ff88' : 
                     this.isAvoiding ? '#ff4444' : '#00aaff';
        
        // Dibujar triángulo (nave)
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius * 0.6, -this.radius * 0.6);
        ctx.lineTo(-this.radius * 0.3, 0);
        ctx.lineTo(-this.radius * 0.6, this.radius * 0.6);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * 🎨 Renderizar rastro
     */
    renderTrail(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 🎨 Renderizar sensores
     */
    renderSensors(ctx) {
        ctx.save();
        ctx.strokeStyle = '#ff88ff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        
        this.sensors.forEach(sensor => {
            ctx.beginPath();
            ctx.moveTo(sensor.start.x, sensor.start.y);
            ctx.lineTo(sensor.end.x, sensor.end.y);
            ctx.stroke();
            
            // Punto final del sensor
            ctx.fillStyle = '#ff88ff';
            ctx.beginPath();
            ctx.arc(sensor.end.x, sensor.end.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }

    /**
     * 🎨 Renderizar fuerzas
     */
    renderForces(ctx) {
        const scale = 0.5; // Escala para visualización
        
        // Fuerza de búsqueda (azul)
        this.renderForceVector(ctx, this.debugForces.seek, '#00aaff', scale);
        
        // Fuerza de evasión (rojo)
        this.renderForceVector(ctx, this.debugForces.avoidance, '#ff4444', scale);
        
        // Fuerza resultante (verde)
        this.renderForceVector(ctx, this.debugForces.resultant, '#00ff88', scale);
    }

    /**
     * 🎨 Renderizar vector de fuerza
     */
    renderForceVector(ctx, force, color, scale) {
        if (force.magnitude() < 0.1) return;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        
        const scaledForce = Vector2D.multiply(force, scale);
        const end = Vector2D.add(this.position, scaledForce);
        
        // Línea del vector
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        // Punta de flecha
        const arrowSize = 5;
        const angle = scaledForce.angle();
        
        ctx.save();
        ctx.translate(end.x, end.y);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize, -arrowSize / 2);
        ctx.lineTo(-arrowSize, arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        ctx.restore();
    }

    /**
     * 🎨 Renderizar velocidad
     */
    renderVelocity(ctx) {
        if (this.velocity.magnitude() < 0.1) return;
        
        ctx.save();
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        
        const velocityScale = 0.3;
        const scaledVelocity = Vector2D.multiply(this.velocity, velocityScale);
        const end = Vector2D.add(this.position, scaledVelocity);
        
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * 🎨 Renderizar objetivo
     */
    renderTarget(ctx) {
        ctx.save();
        ctx.strokeStyle = this.hasArrived ? '#00ff88' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        
        // Cruz del objetivo
        const size = 8;
        ctx.beginPath();
        ctx.moveTo(this.target.x - size, this.target.y);
        ctx.lineTo(this.target.x + size, this.target.y);
        ctx.moveTo(this.target.x, this.target.y - size);
        ctx.lineTo(this.target.x, this.target.y + size);
        ctx.stroke();
        
        // Círculo del objetivo
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * 🚨 Renderizar debug de amenazas (NUEVO)
     */
    renderThreatDebug(ctx) {
        if (!this.debugThreat) return;
        
        const threat = this.debugThreat;
        
        ctx.save();
        
        // 1. Línea hacia el punto de intersección (ROJO)
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(threat.intersection.x, threat.intersection.y);
        ctx.stroke();
        
        // 2. Punto de intersección (ROJO BRILLANTE)
        ctx.fillStyle = '#ff0000';
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(threat.intersection.x, threat.intersection.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 3. Línea del sensor que detectó (MAGENTA BRILLANTE)
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 1.0;
        
        ctx.beginPath();
        ctx.moveTo(threat.sensor.start.x, threat.sensor.start.y);
        ctx.lineTo(threat.sensor.end.x, threat.sensor.end.y);
        ctx.stroke();
        
        // 4. Información de debug como texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.globalAlpha = 1.0;
        
        const debugText = [
            `AMENAZA DETECTADA`,
            `Distancia: ${threat.distance.toFixed(1)}px`,
            `Urgencia: ${this.avoidanceUrgency.toFixed(2)}`,
            `Evadiendo: ${this.isAvoiding ? 'SÍ' : 'NO'}`
        ];
        
        debugText.forEach((text, index) => {
            ctx.fillText(text, this.position.x + 15, this.position.y - 30 + (index * 15));
        });
        
        // 5. Círculo de zona de peligro alrededor del obstáculo
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([5, 5]);
        
        const dangerRadius = threat.obstacle.radius + this.radius + 15;
        ctx.beginPath();
        ctx.arc(threat.obstacle.position.x, threat.obstacle.position.y, dangerRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
} 