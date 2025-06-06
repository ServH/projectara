/**
 * 🚀 STEERING VEHICLE - Vehículo con Comportamientos de Dirección
 * Implementación completa de steering behaviors según Craig Reynolds
 * Migrado exactamente del laboratorio - FUNCIONALIDAD PROBADA
 * Incluye: Seek, Obstacle Avoidance, Arrival, Sistema de Histéresis Anti-Bailoteo
 */

import { Vector2D } from '../utils/Vector2D.js';

export class SteeringVehicle {
    constructor(position, target, config, fleetData = null) {
        // Propiedades físicas
        this.position = position.copy();
        this.velocity = Vector2D.zero();
        this.acceleration = Vector2D.zero();
        this.target = target.copy();
        
        // 🔧 NUEVO: Información del planeta destino y flota
        this.fleetData = fleetData;
        this.targetPlanet = fleetData ? fleetData.targetPlanet : null;
        
        // 🔧 NUEVO: Sistema de espaciado dinámico
        this.spacingSystem = {
            desiredPosition: null,          // Posición orbital asignada
            orbitalAngle: Math.random() * Math.PI * 2,  // Ángulo orbital aleatorio
            orbitalRadius: 0,               // Radio orbital calculado
            hasOrbitalPosition: false,      // Si ya tiene posición asignada
            spacingRadius: 12,              // Radio personal de espaciado
            repulsionStrength: 150          // Fuerza de repulsión entre naves
        };
        
        // Propiedades de steering
        this.maxSpeed = config.forces.maxSpeed;
        this.maxForce = config.forces.maxForce;
        this.radius = 8; // Radio del vehículo
        
        // Estado del vehículo
        this.hasArrived = false;
        this.isAvoiding = false;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.frameCounter = 0;
        
        // 🔧 NUEVO: Detección de atascamiento
        this.stuckDetection = {
            lastPosition: position.copy(),
            stuckFrames: 0,
            stuckThreshold: 60, // 60 frames sin movimiento = atascado
            minMovement: 2, // Movimiento mínimo por frame
            escapeAttempts: 0,
            maxEscapeAttempts: 3
        };
        
        // 🔧 NUEVO: Sistema de histéresis para evasión (anti-bailoteo)
        this.avoidanceState = {
            isActive: false,
            urgency: 0,
            entryThreshold: 0.5,    // Umbral para ENTRAR en evasión
            exitThreshold: 0.3,     // Umbral para SALIR de evasión (histéresis)
            framesSinceLastThreat: 0
        };
        
        // Propiedades de debug
        this.debugFrameCounter = 0;
        this.lastAvoidanceForce = Vector2D.zero();
        this.lastSteeringForce = Vector2D.zero(); // 🆕 NUEVO: Para suavizado de steering
        this.sensors = [];
        
        // 🌟 OPTIMIZADO: Sistema de trail más eficiente
        this.trail = [];
        this.maxTrailLength = 8; // 🔧 REDUCIDO: Era 15, ahora 8 para menos memoria
        this.trailUpdateCounter = 0;
        this.trailUpdateInterval = 3; // 🔧 NUEVO: Solo actualizar trail cada 3 frames
        
        console.log(`🚁 SteeringVehicle creado en ${position.toString()} hacia ${target.toString()}`);
    }

    /**
     * 🔄 Actualizar vehículo
     */
    update(deltaTime, obstacles, config, otherVehicles = []) {
        if (this.hasArrived) return;
        
        // 🔧 NUEVO: Incrementar contador de frames
        this.frameCounter++;
        
        // 🔧 NUEVO: Detectar si la nave está atascada
        this.detectStuckState();
        
        // Actualizar sensores
        this.updateSensors(config);
        
        // Calcular fuerzas de steering (ahora incluye espaciado)
        const steeringForce = this.calculateSteeringForce(obstacles, config, otherVehicles);
        
        // 🔧 NUEVO: Aplicar fuerza de escape si está atascada
        if (this.stuckDetection.stuckFrames > this.stuckDetection.stuckThreshold) {
            const escapeForce = this.calculateEscapeForce(config);
            steeringForce.add(escapeForce);
        }
        
        // Aplicar fuerza como aceleración
        this.acceleration = steeringForce;
        
        // Actualizar velocidad
        this.velocity.add(Vector2D.multiply(this.acceleration, deltaTime));
        this.velocity.limit(this.maxSpeed);
        
        // Actualizar posición
        this.position.add(Vector2D.multiply(this.velocity, deltaTime));
        
        // Verificar llegada
        this.checkArrival(config);
        
        // Actualizar rastro
        this.updateTrail();
    }

    /**
     * 🧮 Calcular fuerzas de steering combinadas
     */
    calculateSteeringForce(obstacles, config, otherVehicles = []) {
        // Aplicar suavizado dinámico basado en la situación
        const smoothing = this.calculateDynamicSmoothing(obstacles, config);
        const dynamicMaxForce = this.calculateDynamicMaxForce(obstacles, config);
        
        // 🔧 NUEVO: Calcular fuerzas de espaciado entre naves
        const spacingForce = this.calculateSpacingForces(otherVehicles);
        
        // 🔧 NUEVO: Calcular fuerza orbital cuando está cerca del destino
        const orbitalForce = this.calculateOrbitalForce(otherVehicles);
        
        // Usar navegación inteligente como fuerza principal
        const navigationForce = this.calculateIntelligentNavigation(obstacles, config);
        
        // Combinar todas las fuerzas
        let totalForce = Vector2D.zero();
        
        // 1. Fuerza de navegación (principal)
        totalForce.add(Vector2D.multiply(navigationForce, 1.0));
        
        // 2. Fuerza de espaciado entre naves (alta prioridad cuando están cerca)
        if (spacingForce.magnitude() > 0) {
            totalForce.add(Vector2D.multiply(spacingForce, 0.8));
        }
        
        // 3. Fuerza orbital (cuando está cerca del destino)
        if (orbitalForce.magnitude() > 0) {
            totalForce.add(Vector2D.multiply(orbitalForce, 0.6));
        }
        
        // 🆕 NUEVO: Aplicar suavizado específico para steering
        const steeringSmoothing = config.forces.steeringSmoothing || 0.8;
        totalForce.multiply(steeringSmoothing);
        
        // Aplicar límites dinámicos
        totalForce.limit(dynamicMaxForce);
        
        // 🆕 NUEVO: Aplicar amortiguación para reducir oscilaciones
        const dampening = config.forces.dampening || 0.85;
        if (this.lastSteeringForce) {
            // Interpolar entre la fuerza anterior y la nueva para suavizar
            totalForce = Vector2D.lerp(this.lastSteeringForce, totalForce, 1 - dampening);
        }
        
        // Guardar para la próxima iteración
        this.lastSteeringForce = totalForce.copy();
        
        // Aplicar suavizado final
        totalForce.multiply(smoothing);
        
        return totalForce;
    }
    
    /**
     * 🧭 Calcular fuerza de steering principal (NAVEGACIÓN INTELIGENTE)
     */
    calculateIntelligentNavigation(obstacles, config) {
        // 1. Verificar si hay una ruta directa libre
        const directPath = this.isDirectPathClear(this.position, this.target, obstacles);
        
        if (directPath.isClear) {
            // Ruta directa disponible - usar seek normal
            return this.calculateSeekForce(config);
        }
        
        // 2. Calcular waypoint inteligente para evitar obstáculos
        const waypoint = this.calculateSmartWaypoint(obstacles, config);
        
        if (waypoint) {
            // Navegar hacia el waypoint inteligente
            const waypointDirection = Vector2D.subtract(waypoint, this.position);
            if (waypointDirection.magnitude() > 0) {
                waypointDirection.normalize();
                const seekForce = Vector2D.multiply(waypointDirection, config.forces.maxForce * config.forces.seekWeight);
                
                // Suavizar la navegación
                return Vector2D.multiply(seekForce, config.forces.smoothing + 0.4);
            }
        }
        
        // 3. Fallback: usar sistema de evasión original
        const avoidanceForce = this.calculateObstacleAvoidanceForce(obstacles, config);
        
        // 4. Si no hay fuerza de evasión, usar seek básico para evitar que se quede parada
        if (avoidanceForce.magnitude() === 0) {
            const basicSeek = this.calculateSeekForce(config);
            // Reducir la fuerza para movimiento más cauteloso cerca de obstáculos
            return Vector2D.multiply(basicSeek, 0.3);
        }
        
        return avoidanceForce;
    }
    
    /**
     * 🔍 Verificar si hay una ruta directa libre hacia el objetivo
     */
    isDirectPathClear(start, end, obstacles) {
        const direction = Vector2D.subtract(end, start);
        const distance = direction.magnitude();
        const normalizedDirection = direction.normalize();
        
        // Verificar puntos a lo largo de la ruta
        const checkPoints = Math.ceil(distance / 15); // Cada 15 píxeles
        
        for (let i = 1; i <= checkPoints; i++) {
            const checkDistance = (i / checkPoints) * distance;
            const checkPoint = Vector2D.add(start, Vector2D.multiply(normalizedDirection, checkDistance));
            
            // Verificar si este punto está demasiado cerca de algún obstáculo
            for (const obstacle of obstacles) {
                const obstaclePos = obstacle.position || obstacle;
                const obstacleRadius = obstacle.radius || 25;
                const safeDistance = obstacleRadius + 20; // Buffer de seguridad
                
                if (checkPoint.distance(obstaclePos) < safeDistance) {
                    return { 
                        isClear: false, 
                        blockedAt: checkPoint, 
                        obstacle: obstacle 
                    };
                }
            }
        }
        
        return { isClear: true };
    }
    
    /**
     * 🎯 Calcular waypoint inteligente para evitar obstáculos
     */
    calculateSmartWaypoint(obstacles, config) {
        const targetDirection = Vector2D.subtract(this.target, this.position).normalize();
        
        // Encontrar el obstáculo más problemático en nuestra ruta
        let closestThreat = null;
        let minThreatDistance = Infinity;
        
        for (const obstacle of obstacles) {
            const obstaclePos = obstacle.position || obstacle;
            const obstacleRadius = obstacle.radius || 25;
            
            // Calcular si este obstáculo está en nuestra ruta hacia el objetivo
            const toObstacle = Vector2D.subtract(obstaclePos, this.position);
            const projectionLength = Vector2D.dot(toObstacle, targetDirection);
            
            // Solo considerar obstáculos que están adelante en nuestra ruta
            if (projectionLength > 0) {
                const projection = Vector2D.multiply(targetDirection, projectionLength);
                const perpendicular = Vector2D.subtract(toObstacle, projection);
                const perpendicularDistance = perpendicular.magnitude();
                
                // Si el obstáculo está en nuestra ruta (dentro del "túnel" hacia el objetivo)
                if (perpendicularDistance < obstacleRadius + 30) {
                    const threatDistance = this.position.distance(obstaclePos);
                    if (threatDistance < minThreatDistance) {
                        minThreatDistance = threatDistance;
                        closestThreat = { obstacle, obstaclePos, obstacleRadius };
                    }
                }
            }
        }
        
        if (!closestThreat) return null;
        
        // Calcular waypoint para rodear el obstáculo más problemático
        return this.calculateBypassWaypoint(closestThreat, targetDirection);
    }
    
    /**
     * 🔄 Calcular waypoint para rodear un obstáculo
     */
    calculateBypassWaypoint(threat, targetDirection) {
        const { obstaclePos, obstacleRadius } = threat;
        
        // Calcular dirección perpendicular al objetivo
        const perpendicular = targetDirection.perpendicular();
        
        // Determinar qué lado del obstáculo es mejor para rodear
        const leftSide = Vector2D.add(obstaclePos, Vector2D.multiply(perpendicular, obstacleRadius + 40));
        const rightSide = Vector2D.add(obstaclePos, Vector2D.multiply(perpendicular, -(obstacleRadius + 40)));
        
        // Elegir el lado que nos acerca más al objetivo
        const leftDistance = leftSide.distance(this.target);
        const rightDistance = rightSide.distance(this.target);
        
        const chosenSide = leftDistance < rightDistance ? leftSide : rightSide;
        
        // Proyectar el waypoint un poco hacia adelante en dirección al objetivo
        const forwardOffset = Vector2D.multiply(targetDirection, 30);
        return Vector2D.add(chosenSide, forwardOffset);
    }

    /**
     * 🔧 NUEVO: Detectar si la nave está atascada
     */
    detectStuckState() {
        const currentPosition = this.position.copy();
        const movement = Vector2D.subtract(currentPosition, this.stuckDetection.lastPosition);
        const distanceMoved = movement.magnitude();
        
        if (distanceMoved < this.stuckDetection.minMovement) {
            this.stuckDetection.stuckFrames++;
            
            // Log cuando se detecta atascamiento
            if (this.stuckDetection.stuckFrames === this.stuckDetection.stuckThreshold) {
                console.warn(`🚫 NAVE ATASCADA detectada: ${this.stuckDetection.stuckFrames} frames sin movimiento significativo`);
            }
        } else {
            // Reset contador si se mueve
            if (this.stuckDetection.stuckFrames > 0) {
                this.stuckDetection.stuckFrames = 0;
                this.stuckDetection.escapeAttempts = 0;
            }
        }
        
        // Actualizar posición anterior
        this.stuckDetection.lastPosition = currentPosition;
    }
    
    /**
     * 🔧 NUEVO: Calcular fuerza de escape cuando está atascada
     */
    calculateEscapeForce(config) {
        this.stuckDetection.escapeAttempts++;
        
        // Fuerza aleatoria para escapar
        const randomDirection = Vector2D.fromAngle(Math.random() * Math.PI * 2, 1);
        const escapeForce = Vector2D.multiply(randomDirection, config.forces.maxForce * 1.5);
        
        console.log(`🚀 ESCAPE ATTEMPT ${this.stuckDetection.escapeAttempts}: Aplicando fuerza aleatoria ${escapeForce.magnitude().toFixed(1)}`);
        
        return escapeForce;
    }

    /**
     * 🌍 NUEVO: Calcular posición orbital alrededor del planeta destino
     */
    calculateOrbitalPosition(otherVehicles = []) {
        if (!this.targetPlanet || this.hasArrived) return;
        
        // Si ya tiene posición orbital asignada, mantenerla
        if (this.spacingSystem.hasOrbitalPosition && this.spacingSystem.desiredPosition) {
            return this.spacingSystem.desiredPosition;
        }
        
        // Calcular radio orbital basado en el planeta y número de naves
        const planetRadius = this.targetPlanet.radius || 30;
        const baseOrbitalRadius = planetRadius + 25; // Buffer mínimo del planeta
        const vehicleCount = otherVehicles.length + 1; // +1 para incluir esta nave
        
        // Ajustar radio orbital según número de naves para evitar superposición
        const circumference = 2 * Math.PI * baseOrbitalRadius;
        const spacingNeeded = this.spacingSystem.spacingRadius * 2; // Diámetro de cada nave
        const maxVehiclesInRadius = Math.floor(circumference / spacingNeeded);
        
        // Si hay demasiadas naves para un radio, crear capas orbitales
        const orbitalLayer = Math.floor((vehicleCount - 1) / maxVehiclesInRadius);
        const finalOrbitalRadius = baseOrbitalRadius + (orbitalLayer * spacingNeeded * 1.5);
        
        // Calcular ángulo orbital para esta nave
        const vehicleIndexInLayer = (vehicleCount - 1) % maxVehiclesInRadius;
        const angleStep = (2 * Math.PI) / Math.min(vehicleCount, maxVehiclesInRadius);
        const orbitalAngle = vehicleIndexInLayer * angleStep + this.spacingSystem.orbitalAngle * 0.1; // Pequeña variación
        
        // Calcular posición orbital final
        const planetCenter = new Vector2D(this.targetPlanet.x, this.targetPlanet.y);
        const orbitalPosition = new Vector2D(
            planetCenter.x + Math.cos(orbitalAngle) * finalOrbitalRadius,
            planetCenter.y + Math.sin(orbitalAngle) * finalOrbitalRadius
        );
        
        // Guardar información orbital
        this.spacingSystem.orbitalRadius = finalOrbitalRadius;
        this.spacingSystem.orbitalAngle = orbitalAngle;
        this.spacingSystem.desiredPosition = orbitalPosition;
        this.spacingSystem.hasOrbitalPosition = true;
        
        console.log(`🌍 Posición orbital calculada: radio ${finalOrbitalRadius.toFixed(1)}, ángulo ${(orbitalAngle * 180 / Math.PI).toFixed(1)}°, capa ${orbitalLayer}`);
        
        return orbitalPosition;
    }
    
    /**
     * 🚀 NUEVO: Calcular fuerzas de espaciado entre naves
     */
    calculateSpacingForces(otherVehicles = []) {
        let totalSpacingForce = Vector2D.zero();
        
        if (!otherVehicles || otherVehicles.length === 0) return totalSpacingForce;
        
        // Calcular repulsión con otras naves cercanas
        otherVehicles.forEach(otherVehicle => {
            if (otherVehicle === this || otherVehicle.hasArrived) return;
            
            const distance = this.position.distance(otherVehicle.position);
            const minDistance = this.spacingSystem.spacingRadius + otherVehicle.spacingSystem.spacingRadius;
            
            // Solo aplicar repulsión si están demasiado cerca
            if (distance < minDistance && distance > 0) {
                // Calcular fuerza de repulsión
                const repulsionDirection = Vector2D.subtract(this.position, otherVehicle.position).normalize();
                const repulsionStrength = (minDistance - distance) / minDistance; // 0-1
                const repulsionForce = Vector2D.multiply(
                    repulsionDirection, 
                    repulsionStrength * this.spacingSystem.repulsionStrength
                );
                
                totalSpacingForce.add(repulsionForce);
            }
        });
        
        return totalSpacingForce;
    }
    
    /**
     * 🎯 NUEVO: Calcular fuerza hacia posición orbital (cuando está cerca del destino)
     */
    calculateOrbitalForce(otherVehicles = []) {
        if (!this.targetPlanet || this.hasArrived) return Vector2D.zero();
        
        const planetCenter = new Vector2D(this.targetPlanet.x, this.targetPlanet.y);
        const distanceToPlanet = this.position.distance(planetCenter);
        const planetRadius = this.targetPlanet.radius || 30;
        
        // Solo aplicar fuerzas orbitales cuando está cerca del planeta
        const orbitalActivationDistance = planetRadius + 80;
        if (distanceToPlanet > orbitalActivationDistance) {
            return Vector2D.zero();
        }
        
        // Calcular posición orbital deseada
        const orbitalPosition = this.calculateOrbitalPosition(otherVehicles);
        if (!orbitalPosition) return Vector2D.zero();
        
        // Calcular fuerza hacia la posición orbital
        const toOrbitalPosition = Vector2D.subtract(orbitalPosition, this.position);
        const distanceToOrbital = toOrbitalPosition.magnitude();
        
        if (distanceToOrbital < 5) {
            // Ya está en posición orbital, aplicar fuerza mínima de mantenimiento
            return Vector2D.multiply(toOrbitalPosition.normalize(), this.maxForce * 0.1);
        }
        
        // Fuerza proporcional a la distancia a la posición orbital
        const orbitalForce = toOrbitalPosition.normalize();
        const forceStrength = Math.min(distanceToOrbital / 20, 1) * this.maxForce * 0.8;
        
        return Vector2D.multiply(orbitalForce, forceStrength);
    }

    /**
     * 🔧 Calcular suavizado dinámico según la situación
     */
    calculateDynamicSmoothing(obstacles, config) {
        const baseSmoothing = config.forces.smoothing;
        
        // Más suavizado cuando hay muchos obstáculos (evitar nerviosismo)
        if (obstacles.length > 2) {
            return Math.min(baseSmoothing + 0.3, 0.9);
        }
        
        // Menos suavizado en espacio abierto (más responsivo)
        if (obstacles.length === 0) {
            return Math.max(baseSmoothing - 0.2, 0.1);
        }
        
        return baseSmoothing;
    }
    
    /**
     * ⚡ Calcular fuerza máxima dinámica según la situación
     */
    calculateDynamicMaxForce(obstacles, config) {
        const baseMaxForce = config.forces.maxForce;
        
        // Reducir fuerza máxima cuando hay muchos obstáculos (movimiento más suave)
        if (obstacles.length > 2) {
            return baseMaxForce * 0.7;
        }
        
        // Fuerza normal en otras situaciones
        return baseMaxForce;
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
     * 🚧 Calcular fuerza de evasión de obstáculos con histéresis
     */
    calculateObstacleAvoidanceForce(obstacles, config) {
        if (!obstacles || obstacles.length === 0) {
            this.avoidanceState.isActive = false;
            this.avoidanceState.urgency = 0;
            this.avoidanceState.framesSinceLastThreat++;
            return Vector2D.zero();
        }

        let totalAvoidanceForce = Vector2D.zero();
        let maxUrgency = 0;
        let threatDetected = false;

        // Evaluar cada obstáculo
        for (const obstacle of obstacles) {
            const obstaclePos = obstacle.position || obstacle;
            const distance = this.position.distance(obstaclePos);
            const obstacleRadius = obstacle.radius || 25;
            
            // ✅ ORIGINAL: Radio de detección completo para anticipación
            const detectionRadius = config.sensors.length + obstacleRadius;
            
            // Solo procesar obstáculos cercanos
            if (distance > detectionRadius) continue;

            // Calcular urgencia basada en distancia y velocidad
            const normalizedDistance = distance / detectionRadius;
            const velocityFactor = this.velocity.magnitude() / config.forces.maxSpeed;
            const urgency = Math.max(0, (1 - normalizedDistance) + velocityFactor * 0.3);

            // ✅ ORIGINAL: Umbral de activación original
            if (urgency > this.avoidanceState.entryThreshold) {
                threatDetected = true;
                maxUrgency = Math.max(maxUrgency, urgency);

                // Calcular dirección de repulsión
                const repulsionDirection = Vector2D.subtract(this.position, obstaclePos).normalize();
                
                // ✅ ORIGINAL: Fuerza de repulsión original
                const repulsionMagnitude = urgency * config.forces.avoidanceWeight * config.forces.maxForce;
                const repulsionForce = Vector2D.multiply(repulsionDirection, repulsionMagnitude);

                // Calcular fuerzas laterales con clearance
                const leftDirection = Vector2D.rotate(this.velocity.normalize(), -Math.PI / 2);
                const rightDirection = Vector2D.rotate(this.velocity.normalize(), Math.PI / 2);
                
                const leftClearance = this.calculateClearance(leftDirection, obstacles, config);
                const rightClearance = this.calculateClearance(rightDirection, obstacles, config);

                // Seleccionar dirección lateral
                let lateralForce = Vector2D.zero();
                if (leftClearance > rightClearance) {
                    lateralForce = Vector2D.multiply(leftDirection, repulsionMagnitude * 0.6);
                } else {
                    lateralForce = Vector2D.multiply(rightDirection, repulsionMagnitude * 0.6);
                }

                // Fuerza de frenado proporcional a la velocidad
                const brakingForce = this.velocity.magnitude() * urgency * 0.8;

                // Combinar fuerzas
                const combinedForce = Vector2D.add(
                    Vector2D.add(repulsionForce, lateralForce),
                    Vector2D.multiply(this.velocity.normalize(), -brakingForce)
                );

                totalAvoidanceForce.add(combinedForce);

                // Debug original - cada 30 frames
                if (this.debugFrameCounter % 30 === 0) {
                    console.log(`🚨 AMENAZA DETECTADA: {distancia: '${distance.toFixed(1)}', obstaculoPos: '(${obstaclePos.x.toFixed(1)}, ${obstaclePos.y.toFixed(1)})', navePos: '(${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})', velocidad: '${this.velocity.magnitude().toFixed(1)}'}`);
                    console.log(`🔴 REPULSIÓN: Fuerza ${repulsionMagnitude.toFixed(1)}, Dirección ${repulsionDirection.toString()}`);
                    console.log(`🔵 LATERAL: ${leftClearance > rightClearance ? 'IZQUIERDA' : 'DERECHA'}, Clearance L:${leftClearance.toFixed(1)} R:${rightClearance.toFixed(1)}, Fuerza: ${lateralForce.magnitude().toFixed(1)}`);
                    console.log(`🟡 FRENADO: Fuerza ${brakingForce.toFixed(1)}`);
                    console.log(`🚨 FUERZA TOTAL EVASIÓN: ${totalAvoidanceForce.magnitude().toFixed(1)}, Urgencia: ${urgency.toFixed(2)}`);
                    console.log('---');
                }
            }
        }

        // Actualizar estado de histéresis
        if (threatDetected) {
            this.avoidanceState.isActive = true;
            this.avoidanceState.urgency = maxUrgency;
            this.avoidanceState.framesSinceLastThreat = 0;
        } else {
            this.avoidanceState.framesSinceLastThreat++;
            
            // ✅ ORIGINAL: Salir de evasión después de frames de gracia originales
            if (this.avoidanceState.framesSinceLastThreat > 10) {
                this.avoidanceState.isActive = false;
                this.avoidanceState.urgency = 0;
            }
        }

        this.debugFrameCounter++;
        this.lastAvoidanceForce = totalAvoidanceForce.copy();
        
        return totalAvoidanceForce;
    }
    
    /**
     * 🔍 Calcular clearance (espacio libre) en una dirección
     */
    calculateClearance(direction, obstacles, config) {
        const clearanceDistance = config.sensors.length;
        const sensorStart = this.position.copy();
        const sensorEnd = Vector2D.add(sensorStart, Vector2D.multiply(direction, clearanceDistance));
        
        let minClearance = clearanceDistance;
        
        for (const obstacle of obstacles) {
            const intersection = this.getLineCircleIntersection(
                sensorStart, 
                sensorEnd, 
                obstacle, 
                obstacle.radius + 10 // Buffer de seguridad
            );
            
            if (intersection) {
                const distanceToIntersection = sensorStart.distance(intersection);
                minClearance = Math.min(minClearance, distanceToIntersection);
            }
        }
        
        // 🔧 NUEVO: Clearance mínimo garantizado para evitar bloqueos
        const minimumClearance = 5; // 5 píxeles mínimo
        return Math.max(minClearance, minimumClearance);
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
     * 📍 Actualizar rastro (OPTIMIZADO)
     */
    updateTrail() {
        // 🔧 OPTIMIZACIÓN: Solo actualizar trail cada N frames
        this.trailUpdateCounter++;
        if (this.trailUpdateCounter < this.trailUpdateInterval) {
            return;
        }
        this.trailUpdateCounter = 0;
        
        // 🔧 OPTIMIZACIÓN: Solo agregar al trail si la nave se está moviendo significativamente
        const velocity = this.velocity.magnitude();
        if (velocity < 5) { // Solo si se mueve a más de 5 px/s
            return;
        }
        
        // 🔧 OPTIMIZACIÓN: Solo agregar si la nueva posición está suficientemente lejos de la última
        if (this.trail.length > 0) {
            const lastTrailPoint = this.trail[this.trail.length - 1];
            const distance = this.position.distance(lastTrailPoint);
            if (distance < 8) { // Solo agregar si se movió más de 8 píxeles
                return;
            }
        }
        
        // Agregar nueva posición al trail
        this.trail.push(this.position.copy());
        
        // Mantener longitud máxima
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    /**
     * 🎯 Verificar llegada al objetivo (DINÁMICO SEGÚN PLANETA)
     */
    checkArrival(config) {
        const distance = this.position.distance(this.target);
        
        // 🔧 NUEVO: Radio de llegada dinámico basado en el planeta destino
        let arrivalRadius = config.behavior.arrivalRadius; // Default: 25px
        
        // Si tenemos información del planeta destino, usar su radio + buffer
        if (this.targetPlanet && this.targetPlanet.radius) {
            // Llegar al borde del planeta + pequeño buffer
            arrivalRadius = this.targetPlanet.radius + 15; // Radio del planeta + 15px buffer
        } else if (this.fleetData && this.fleetData.toPlanet) {
            // Fallback: estimar radio basado en el tipo de planeta
            // Esto es una estimación si no tenemos acceso directo al planeta
            arrivalRadius = 40; // Radio conservador para planetas medianos/grandes
        }
        
        if (distance <= arrivalRadius) {
            this.hasArrived = true;
            this.velocity = Vector2D.zero();
            this.arrivalFrame = this.frameCounter || 0; // Para cleanup posterior
            
            // 🔧 OPTIMIZACIÓN: Limpiar memoria al llegar
            this.cleanupMemory();
            
            console.log(`🎯 Vehículo llegó al objetivo (distancia: ${distance.toFixed(1)}, radio: ${arrivalRadius.toFixed(1)})`);
        }
    }
    
    /**
     * 🧹 NUEVO: Limpiar memoria para optimización
     */
    cleanupMemory() {
        // Limpiar trail para liberar memoria
        this.trail = [];
        
        // Limpiar sensores
        this.sensors = [];
        
        // Limpiar fuerzas anteriores
        this.lastSteeringForce = Vector2D.zero();
        this.lastAvoidanceForce = Vector2D.zero();
        
        // Resetear contadores
        this.trailUpdateCounter = 0;
        this.debugFrameCounter = 0;
        
        console.log(`🧹 Memoria limpiada para vehículo que llegó`);
    }

    /**
     * 🎨 Renderizar vehículo (CON EFECTOS VISUALES)
     */
    render(ctx, debugConfig) {
        ctx.save();
        
        // 🌟 NUEVO: Renderizar trail si existe y está habilitado
        if (this.trail && this.trail.length > 1) {
            this.renderTrail(ctx);
        }
        
        // 🌟 NUEVO: Efecto de glow para las naves
        this.renderGlowEffect(ctx);
        
        // Renderizar el cuerpo del vehículo
        this.renderBody(ctx);
        
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
        
        // 🎨 NUEVO: Color según propietario (player vs AI)
        let color = '#00aaff'; // Color por defecto
        
        if (this.fleetData && this.fleetData.owner) {
            switch (this.fleetData.owner) {
                case 'player':
                    color = '#00ff88'; // Verde para player
                    break;
                case 'ai':
                case 'enemy':
                    color = '#ff4444'; // Rojo para AI
                    break;
                default:
                    color = '#ffaa00'; // Naranja para neutral
            }
        }
        
        // Modificar color según estado (mantener diferenciación visual)
        if (this.hasArrived) {
            // Hacer el color más brillante cuando llega
            color = this.brightenColor(color, 0.3);
        } else if (this.isAvoiding) {
            // Hacer el color más intenso cuando evita obstáculos
            color = this.intensifyColor(color, 0.2);
        }
        
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
     * 🎨 Hacer un color más brillante
     */
    brightenColor(color, factor) {
        // Convertir hex a RGB, aumentar brillo y volver a hex
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.floor(255 * factor));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.floor(255 * factor));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.floor(255 * factor));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * 🎨 Intensificar un color
     */
    intensifyColor(color, factor) {
        // Hacer el color más saturado
        const hex = color.replace('#', '');
        const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 + factor)));
        const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 + factor)));
        const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 + factor)));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * 🌟 OPTIMIZADO: Renderizar trail de la nave
     */
    renderTrail(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.save();
        
        // Color del trail según propietario
        let trailColor = '#00aaff';
        if (this.fleetData && this.fleetData.owner) {
            switch (this.fleetData.owner) {
                case 'player':
                    trailColor = '#00ff88';
                    break;
                case 'ai':
                case 'enemy':
                    trailColor = '#ff4444';
                    break;
                default:
                    trailColor = '#ffaa00';
            }
        }
        
        // 🔧 OPTIMIZACIÓN: Configurar estilo una sola vez
        ctx.strokeStyle = trailColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 🔧 OPTIMIZACIÓN: Dibujar trail como una sola línea continua con gradiente de opacidad
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        
        // Dibujar línea continua
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        
        // 🔧 OPTIMIZACIÓN: Aplicar opacidad global en lugar de por segmento
        const baseOpacity = 0.4; // Reducido para mejor rendimiento
        ctx.globalAlpha = baseOpacity;
        ctx.stroke();
        
        // 🔧 OPTIMIZACIÓN: Efecto de desvanecimiento solo en los últimos puntos
        if (this.trail.length > 3) {
            ctx.globalAlpha = baseOpacity * 0.6;
            ctx.beginPath();
            ctx.moveTo(this.trail[this.trail.length - 3].x, this.trail[this.trail.length - 3].y);
            ctx.lineTo(this.trail[this.trail.length - 2].x, this.trail[this.trail.length - 2].y);
            ctx.lineTo(this.trail[this.trail.length - 1].x, this.trail[this.trail.length - 1].y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 🌟 OPTIMIZADO: Renderizar efecto de glow
     */
    renderGlowEffect(ctx) {
        // 🔧 OPTIMIZACIÓN: Solo aplicar glow si la nave se está moviendo rápido
        const velocity = this.velocity.magnitude();
        if (velocity < 10) return; // Solo si se mueve rápido
        
        // 🔧 OPTIMIZACIÓN: Reducir frecuencia del glow
        if (this.frameCounter % 2 !== 0) return; // Solo cada 2 frames
        
        ctx.save();
        
        // Color del glow según propietario
        let glowColor = '#00aaff';
        if (this.fleetData && this.fleetData.owner) {
            switch (this.fleetData.owner) {
                case 'player':
                    glowColor = '#00ff88';
                    break;
                case 'ai':
                case 'enemy':
                    glowColor = '#ff4444';
                    break;
                default:
                    glowColor = '#ffaa00';
            }
        }
        
        // 🔧 OPTIMIZACIÓN: Glow más sutil y eficiente
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6; // Reducido de 8 a 6
        ctx.globalAlpha = 0.2; // Reducido de 0.3 a 0.2
        
        // Trasladar al centro del vehículo
        ctx.translate(this.position.x, this.position.y);
        
        // Rotar según la velocidad
        if (velocity > 0.1) {
            ctx.rotate(this.velocity.angle());
        }
        
        // 🔧 OPTIMIZACIÓN: Forma más simple para el glow
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.2, 0, Math.PI * 2); // Círculo simple en lugar de triángulo
        ctx.fill();
        
        ctx.restore();
    }
} 