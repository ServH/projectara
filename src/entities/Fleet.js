/**
 * 🚁 FLEET - Sistema de Flotas con Steering Behaviors
 * Implementación completa de flotas con formaciones dinámicas y comportamientos de boids
 * Migrado exactamente del laboratorio - SENSACIÓN VIVA PROBADA
 * Incluye: 4 formaciones, liderazgo jerárquico, spatial hashing, histéresis anti-bailoteo
 */

import { Vector2D } from '../utils/Vector2D.js';
import { SteeringVehicle } from './SteeringVehicle.js';
import { GALCON_STEERING_CONFIG_PROBADA } from '../config/SteeringConfig.js';
import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class Fleet {
    constructor(startPosition, targetPosition, config = GALCON_STEERING_CONFIG_PROBADA, fleetSize = 15, fleetData = {}) {
        // Propiedades básicas
        this.id = Fleet.generateId();
        this.startPosition = startPosition.copy();
        this.targetPosition = targetPosition.copy();
        this.config = config;
        
        // 🔧 CORREGIDO: Usar exactamente el número de naves enviadas, sin limitación artificial
        this.fleetSize = fleetSize; // Respetar el número exacto de naves del planeta
        
        // 🔧 NUEVO: Propiedades para mecánicas del juego
        this.owner = fleetData.owner || 'player';
        this.fromPlanet = fleetData.fromPlanet || null;
        this.toPlanet = fleetData.toPlanet || null;
        this.color = fleetData.color || '#00ff88';
        
        // Propiedades de formación
        this.formation = config.fleet.formation || 'spread';
        this.spacing = config.fleet.spacing;
        this.vehicles = [];
        this.leader = null;
        
        // Estado de la flota
        this.isActive = true;
        this.hasArrived = false;
        this.averagePosition = startPosition.copy();
        this.averageVelocity = Vector2D.zero();
        
        // Configuración de boids
        this.enableBoids = config.fleet.enableBoids;
        this.separationWeight = config.fleet.separationWeight;
        this.alignmentWeight = config.fleet.alignmentWeight;
        this.cohesionWeight = config.fleet.cohesionWeight;
        
        // Métricas y debug
        this.frameCounter = 0;
        this.lastFormationUpdate = 0;
        this.debugInfo = {
            totalVehicles: 0,
            arrivedVehicles: 0,
            avoidingVehicles: 0,
            averageSpeed: 0
        };
        
        // Crear vehículos de la flota
        this.createFleetVehicles();
        
        console.log(`🚁 Fleet ${this.id} creada: ${this.fleetSize} naves, formación ${this.formation}`);
    }

    /**
     * 🏗️ Crear vehículos de la flota
     */
    createFleetVehicles() {
        this.vehicles = [];
        
        // Crear posiciones de formación inicial
        const formationPositions = this.calculateFormationPositions(this.startPosition, this.formation);
        
        // 🔧 NUEVO: Preparar datos de flota para los vehículos
        const fleetDataForVehicles = {
            toPlanet: this.toPlanet,
            targetPlanet: this.toPlanet, // Asegurar que targetPlanet esté disponible
            owner: this.owner,
            fromPlanet: this.fromPlanet,
            color: this.color
        };
        
        for (let i = 0; i < this.fleetSize; i++) {
            const vehiclePosition = formationPositions[i] || this.startPosition.copy();
            const vehicle = new SteeringVehicle(vehiclePosition, this.targetPosition, this.config, fleetDataForVehicles);
            
            // Configurar propiedades específicas de flota
            vehicle.fleetId = this.id;
            vehicle.isLeader = i === 0;
            vehicle.fleetIndex = i;
            
            // Configurar sensores para seguidores (menos sensores para mejor rendimiento)
            if (!vehicle.isLeader) {
                vehicle.sensorConfig = {
                    ...this.config.sensors,
                    length: this.config.sensors.length * 0.7, // 70% longitud
                    lateralCount: Math.min(1, this.config.sensors.lateralCount) // Máximo 1 lateral
                };
            }
            
            this.vehicles.push(vehicle);
        }
        
        // Establecer líder
        if (this.vehicles.length > 0) {
            this.leader = this.vehicles[0];
            this.leader.isLeader = true;
        }
        
        this.updateDebugInfo();
    }

    /**
     * 📐 Calcular posiciones de formación
     */
    calculateFormationPositions(centerPosition, formation) {
        const positions = [];
        const spacing = this.spacing;
        
        switch (formation) {
            case 'spread':
                return this.calculateSpreadFormation(centerPosition, spacing);
            
            case 'line':
                return this.calculateLineFormation(centerPosition, spacing);
            
            case 'wedge':
                return this.calculateWedgeFormation(centerPosition, spacing);
            
            case 'circle':
                return this.calculateCircleFormation(centerPosition, spacing);
            
            default:
                return this.calculateSpreadFormation(centerPosition, spacing);
        }
    }

    /**
     * 🌊 Formación dispersa (spread)
     */
    calculateSpreadFormation(center, spacing) {
        const positions = [];
        const gridSize = Math.ceil(Math.sqrt(this.fleetSize));
        
        for (let i = 0; i < this.fleetSize; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            // Centrar la grilla
            const offsetX = (col - (gridSize - 1) / 2) * spacing;
            const offsetY = (row - (gridSize - 1) / 2) * spacing;
            
            // Añadir variación aleatoria para aspecto más orgánico
            const randomX = (Math.random() - 0.5) * spacing * 0.3;
            const randomY = (Math.random() - 0.5) * spacing * 0.3;
            
            positions.push(new Vector2D(
                center.x + offsetX + randomX,
                center.y + offsetY + randomY
            ));
        }
        
        return positions;
    }

    /**
     * 📏 Formación en línea
     */
    calculateLineFormation(center, spacing) {
        const positions = [];
        const direction = Vector2D.subtract(this.targetPosition, center).normalize();
        const perpendicular = direction.perpendicular();
        
        for (let i = 0; i < this.fleetSize; i++) {
            const offset = (i - (this.fleetSize - 1) / 2) * spacing;
            const position = Vector2D.add(center, Vector2D.multiply(perpendicular, offset));
            positions.push(position);
        }
        
        return positions;
    }

    /**
     * 🔺 Formación en cuña (wedge)
     */
    calculateWedgeFormation(center, spacing) {
        const positions = [];
        const direction = Vector2D.subtract(this.targetPosition, center).normalize();
        const perpendicular = direction.perpendicular();
        
        // Líder al frente
        positions.push(center.copy());
        
        // Resto en formación de cuña
        for (let i = 1; i < this.fleetSize; i++) {
            const row = Math.floor((i - 1) / 2) + 1;
            const side = (i - 1) % 2 === 0 ? -1 : 1;
            
            const backOffset = Vector2D.multiply(direction, -row * spacing * 0.8);
            const sideOffset = Vector2D.multiply(perpendicular, side * row * spacing * 0.6);
            
            const position = Vector2D.add(center, backOffset).add(sideOffset);
            positions.push(position);
        }
        
        return positions;
    }

    /**
     * ⭕ Formación circular
     */
    calculateCircleFormation(center, spacing) {
        const positions = [];
        const radius = spacing * this.fleetSize / (2 * Math.PI);
        
        for (let i = 0; i < this.fleetSize; i++) {
            const angle = (i / this.fleetSize) * Math.PI * 2;
            const position = new Vector2D(
                center.x + Math.cos(angle) * radius,
                center.y + Math.sin(angle) * radius
            );
            positions.push(position);
        }
        
        return positions;
    }

    /**
     * 🔄 Actualizar flota
     */
    update(deltaTime, obstacles, spatialHash) {
        if (!this.isActive || this.hasArrived) return;
        
        this.frameCounter++;
        
        // Actualizar cada vehículo
        this.vehicles.forEach((vehicle, index) => {
            if (!vehicle.hasArrived) {
                // Calcular fuerzas de boids si están habilitadas
                let boidsForces = Vector2D.zero();
                if (this.enableBoids) {
                    boidsForces = this.calculateBoidsForces(vehicle, index);
                }
                
                // Actualizar vehículo con boids
                this.updateVehicleWithBoids(vehicle, deltaTime, obstacles, boidsForces);
            }
        });
        
        // 🔧 NUEVO: Limpiar naves que han llegado individualmente
        this.cleanupArrivedVehicles();
        
        // Actualizar propiedades promedio
        this.updateAverageProperties();
        
        // Verificar llegada de la flota
        this.checkFleetArrival();
        
        // Actualizar información de debug
        this.updateDebugInfo();
    }

    /**
     * 🔄 Actualizar vehículo con comportamientos de boids
     */
    updateVehicleWithBoids(vehicle, deltaTime, obstacles, boidsForces) {
        // Obtener obstáculos cercanos usando spatial hash si está disponible
        const nearbyObstacles = obstacles;
        
        // 🔧 NUEVO: Obtener otras naves de la flota para espaciado dinámico
        const otherVehicles = this.vehicles.filter(v => v !== vehicle && !v.hasArrived);
        
        // Actualizar vehículo con información de otras naves
        vehicle.update(deltaTime, nearbyObstacles, this.config, otherVehicles);
        
        // Aplicar fuerzas de boids si están disponibles
        if (boidsForces && boidsForces.magnitude() > 0) {
            // Aplicar fuerzas de boids como aceleración adicional
            const boidsAcceleration = Vector2D.multiply(boidsForces, deltaTime);
            vehicle.velocity.add(boidsAcceleration);
            
            // Limitar velocidad después de aplicar boids
            vehicle.velocity.limit(vehicle.maxSpeed);
        }
    }

    /**
     * 🐦 Calcular fuerzas de boids (separación, alineación, cohesión)
     */
    calculateBoidsForces(vehicle, vehicleIndex) {
        let separation = Vector2D.zero();
        let alignment = Vector2D.zero();
        let cohesion = Vector2D.zero();
        let neighborCount = 0;
        
        const perceptionRadius = this.spacing * 2; // Radio de percepción
        
        // Analizar vecinos
        this.vehicles.forEach((neighbor, index) => {
            if (index === vehicleIndex || neighbor.hasArrived) return;
            
            const distance = vehicle.position.distance(neighbor.position);
            
            if (distance < perceptionRadius && distance > 0) {
                // 1. SEPARACIÓN: Evitar colisiones
                if (distance < this.spacing) {
                    const diff = Vector2D.subtract(vehicle.position, neighbor.position);
                    diff.normalize();
                    diff.divide(distance); // Peso inversamente proporcional a la distancia
                    separation.add(diff);
                }
                
                // 2. ALINEACIÓN: Alinear velocidades
                alignment.add(neighbor.velocity);
                
                // 3. COHESIÓN: Moverse hacia el centro del grupo
                cohesion.add(neighbor.position);
                
                neighborCount++;
            }
        });
        
        // Procesar fuerzas si hay vecinos
        if (neighborCount > 0) {
            // Separación
            if (separation.magnitude() > 0) {
                separation.normalize();
                separation.multiply(vehicle.maxSpeed);
                separation.subtract(vehicle.velocity);
                separation.limit(vehicle.maxForce);
                separation.multiply(this.separationWeight);
            }
            
            // Alineación
            alignment.divide(neighborCount);
            alignment.normalize();
            alignment.multiply(vehicle.maxSpeed);
            alignment.subtract(vehicle.velocity);
            alignment.limit(vehicle.maxForce);
            alignment.multiply(this.alignmentWeight);
            
            // Cohesión
            cohesion.divide(neighborCount);
            cohesion.subtract(vehicle.position);
            cohesion.normalize();
            cohesion.multiply(vehicle.maxSpeed);
            cohesion.subtract(vehicle.velocity);
            cohesion.limit(vehicle.maxForce);
            cohesion.multiply(this.cohesionWeight);
        }
        
        // Combinar fuerzas
        const totalBoidsForce = Vector2D.zero();
        totalBoidsForce.add(separation);
        totalBoidsForce.add(alignment);
        totalBoidsForce.add(cohesion);
        
        return totalBoidsForce;
    }

    /**
     * 📊 Actualizar propiedades promedio
     */
    updateAverageProperties() {
        if (this.vehicles.length === 0) return;
        
        let totalPosition = Vector2D.zero();
        let totalVelocity = Vector2D.zero();
        let activeVehicles = 0;
        
        this.vehicles.forEach(vehicle => {
            if (!vehicle.hasArrived) {
                totalPosition.add(vehicle.position);
                totalVelocity.add(vehicle.velocity);
                activeVehicles++;
            }
        });
        
        if (activeVehicles > 0) {
            this.averagePosition = Vector2D.divide(totalPosition, activeVehicles);
            this.averageVelocity = Vector2D.divide(totalVelocity, activeVehicles);
        }
    }

    /**
     * 🎯 Verificar si la flota ha llegado al destino
     */
    checkFleetArrival() {
        if (this.hasArrived) return;
        
        // Contar vehículos que han llegado
        const arrivedVehicles = this.vehicles.filter(v => v.hasArrived);
        const totalVehicles = this.vehicles.length;
        
        // 🔧 NUEVO: Para flotas de 1 nave, verificar inmediatamente
        if (totalVehicles === 1 && arrivedVehicles.length === 1) {
            this.hasArrived = true;
            console.log(`🎯 ¡NAVE INDIVIDUAL LLEGÓ! ${this.id}`);
            this.processFleetArrival();
            return;
        }
        
        // Para flotas múltiples, verificar si todas han llegado
        if (arrivedVehicles.length === totalVehicles && totalVehicles > 1) {
            this.hasArrived = true;
            console.log(`🎯 ¡FLOTA COMPLETA LLEGÓ! ${this.id} - ${totalVehicles} vehículos`);
            this.processFleetArrival();
            return;
        }
        
        // 🔧 NUEVO: Logging de progreso solo para flotas múltiples
        if (arrivedVehicles.length > 0 && totalVehicles > 1) {
            console.log(`🎯 Progreso de llegada: ${arrivedVehicles.length}/${totalVehicles} vehículos llegaron`);
        }
        
        // 🔧 NUEVO: Fallback por proximidad para cualquier flota
        if (!this.hasArrived && this.averagePosition) {
            const distanceToTarget = this.averagePosition.distance(this.targetPosition);
            const arrivalThreshold = this.targetPlanet ? (this.targetPlanet.radius + 25) : 45;
            
            if (distanceToTarget <= arrivalThreshold) {
                console.log(`🎯 Flota ${this.id} llegó por proximidad (distancia: ${distanceToTarget.toFixed(1)}, umbral: ${arrivalThreshold})`);
                this.hasArrived = true;
                this.processFleetArrival();
            }
        }
    }

    /**
     * 🎯 Procesar llegada de flota al destino
     */
    processFleetArrival() {
        if (!this.hasArrived || this.arrivalProcessed) return;
        
        // Marcar como procesado para evitar múltiples eventos
        this.arrivalProcessed = true;
        
        // 🔧 NUEVO: Datos completos para el evento de llegada
        const arrivalData = {
            fleetId: this.id,
            legacyId: this.legacyId || this.id,
            ships: this.fleetSize,
            owner: this.owner,
            fromPlanet: this.fromPlanet,
            toPlanet: this.toPlanet,
            targetPlanet: this.targetPlanet,
            color: this.color,
            arrivalTime: Date.now(),
            // Datos adicionales para compatibilidad
            x: this.averagePosition.x,
            y: this.averagePosition.y,
            targetX: this.targetPosition.x,
            targetY: this.targetPosition.y
        };
        
        console.log(`🎯 ¡FLOTA LLEGÓ AL DESTINO! Emitiendo FLEET_ARRIVED`);
        console.log(`📊 Datos de llegada:`, {
            fleetId: arrivalData.fleetId,
            ships: arrivalData.ships,
            owner: arrivalData.owner,
            from: arrivalData.fromPlanet,
            to: arrivalData.toPlanet
        });
        
        // 🔧 CRÍTICO: Emitir evento FLEET_ARRIVED para que GameEngine procese la conquista
        eventBus.emit(GAME_EVENTS.FLEET_ARRIVED, arrivalData);
        
        console.log(`✅ Evento FLEET_ARRIVED emitido para flota ${this.id}`);
        
        // Marcar flota como inactiva para cleanup
        this.isActive = false;
    }

    /**
     * 📊 Actualizar información de debug
     */
    updateDebugInfo() {
        this.debugInfo.totalVehicles = this.vehicles.length;
        this.debugInfo.arrivedVehicles = this.vehicles.filter(v => v.hasArrived).length;
        this.debugInfo.avoidingVehicles = this.vehicles.filter(v => v.isAvoiding).length;
        
        const activeVehicles = this.vehicles.filter(v => !v.hasArrived);
        if (activeVehicles.length > 0) {
            const totalSpeed = activeVehicles.reduce((sum, v) => sum + v.velocity.magnitude(), 0);
            this.debugInfo.averageSpeed = totalSpeed / activeVehicles.length;
        } else {
            this.debugInfo.averageSpeed = 0;
        }
    }

    /**
     * 🔄 Cambiar formación dinámicamente
     */
    setFormation(newFormation) {
        if (this.formation === newFormation) return;
        
        this.formation = newFormation;
        console.log(`🔄 Fleet ${this.id} cambiando a formación: ${newFormation}`);
        
        // Recalcular posiciones objetivo para la nueva formación
        const newPositions = this.calculateFormationPositions(this.averagePosition, newFormation);
        
        // Asignar nuevas posiciones objetivo a los vehículos
        this.vehicles.forEach((vehicle, index) => {
            if (!vehicle.hasArrived && newPositions[index]) {
                // Interpolar suavemente hacia la nueva posición
                const targetOffset = Vector2D.subtract(newPositions[index], this.averagePosition);
                const newTarget = Vector2D.add(vehicle.target, targetOffset);
                vehicle.target = newTarget;
            }
        });
        
        this.lastFormationUpdate = this.frameCounter;
    }

    /**
     * 🎨 Renderizar flota (SIN DEBUG)
     */
    render(ctx, debugConfig) {
        if (!this.isActive) return;
        
        // Solo renderizar cada vehículo
        this.vehicles.forEach(vehicle => {
            vehicle.render(ctx, debugConfig);
        });
    }

    /**
     * 🆔 Generar ID único para la flota
     */
    static generateId() {
        return `fleet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 🧹 Limpiar flota
     */
    destroy() {
        this.isActive = false;
        this.vehicles.forEach(vehicle => {
            // Limpiar referencias si es necesario
            vehicle.fleetId = null;
        });
        this.vehicles = [];
        this.leader = null;
        
        console.log(`🧹 Fleet ${this.id} destruida`);
    }

    /**
     * 📊 Obtener estadísticas de la flota
     */
    getStats() {
        return {
            id: this.id,
            formation: this.formation,
            size: this.fleetSize,
            isActive: this.isActive,
            hasArrived: this.hasArrived,
            averagePosition: this.averagePosition.toObject(),
            averageSpeed: this.debugInfo.averageSpeed,
            arrivedVehicles: this.debugInfo.arrivedVehicles,
            avoidingVehicles: this.debugInfo.avoidingVehicles,
            frameCounter: this.frameCounter
        };
    }

    /**
     * 🎯 Actualizar objetivo de la flota
     */
    updateTarget(newTarget) {
        this.targetPosition = newTarget.copy();
        
        // Actualizar objetivo de todos los vehículos
        this.vehicles.forEach(vehicle => {
            if (!vehicle.hasArrived) {
                vehicle.target = newTarget.copy();
            }
        });
        
        console.log(`🎯 Fleet ${this.id} objetivo actualizado a ${newTarget.toString()}`);
    }

    /**
     * ⚡ Optimizar flota para rendimiento
     */
    optimize() {
        // Remover vehículos que han llegado hace mucho tiempo
        const currentTime = this.frameCounter;
        this.vehicles = this.vehicles.filter(vehicle => {
            if (vehicle.hasArrived && (currentTime - vehicle.arrivalFrame) > 300) {
                return false; // Remover después de 300 frames
            }
            return true;
        });
        
        // Actualizar líder si es necesario
        if (this.leader && this.leader.hasArrived) {
            const activeVehicles = this.vehicles.filter(v => !v.hasArrived);
            if (activeVehicles.length > 0) {
                this.leader = activeVehicles[0];
                this.leader.isLeader = true;
            }
        }
    }

    /**
     * 🎨 Obtener datos para renderizado (compatibilidad con CanvasRenderer)
     */
    getRenderData() {
        // Si la flota no está activa o ha llegado, no renderizar
        if (!this.isActive || this.hasArrived) {
            return null;
        }

        // Renderizar cada vehículo individual como una "flota" separada
        const renderData = [];
        
        this.vehicles.forEach(vehicle => {
            if (!vehicle.hasArrived) {
                renderData.push({
                    id: `${this.id}_${vehicle.id || 'vehicle'}`,
                    x: vehicle.position.x,
                    y: vehicle.position.y,
                    targetX: vehicle.target.x,
                    targetY: vehicle.target.y,
                    ships: 1, // Cada vehículo representa 1 nave
                    owner: this.owner,
                    color: this.color,
                    hasArrived: vehicle.hasArrived,
                    // Datos adicionales para efectos visuales
                    organicIntensity: vehicle.isAvoiding ? vehicle.avoidanceUrgency : 0,
                    trail: vehicle.trail || [],
                    formation: this.formation,
                    isLeader: vehicle.isLeader || false
                });
            }
        });

        return renderData;
    }

    /**
     * 🔧 NUEVO: Limpiar naves que han llegado individualmente
     */
    cleanupArrivedVehicles() {
        const arrivedVehicles = this.vehicles.filter(v => v.hasArrived);
        
        if (arrivedVehicles.length === 0) return;
        
        // Para cada nave que ha llegado, verificar si debe ser eliminada
        arrivedVehicles.forEach(vehicle => {
            // Solo eliminar si ha estado llegada por un tiempo (para evitar eliminación prematura)
            const framesArrived = this.frameCounter - (vehicle.arrivalFrame || this.frameCounter);
            
            if (framesArrived > 30) { // 30 frames = ~0.5 segundos
                // Emitir evento de llegada individual si es necesario
                if (!vehicle.arrivalProcessed) {
                    this.processIndividualVehicleArrival(vehicle);
                    vehicle.arrivalProcessed = true;
                }
            }
        });
        
        // Eliminar naves que han llegado y han sido procesadas
        const vehiclesToRemove = this.vehicles.filter(v => 
            v.hasArrived && 
            v.arrivalProcessed && 
            (this.frameCounter - (v.arrivalFrame || this.frameCounter)) > 60 // 1 segundo
        );
        
        if (vehiclesToRemove.length > 0) {
            // Remover vehículos de la lista
            this.vehicles = this.vehicles.filter(v => !vehiclesToRemove.includes(v));
            
            console.log(`🗑️ Fleet ${this.id}: ${vehiclesToRemove.length} naves eliminadas al llegar (${this.vehicles.length} restantes)`);
            
            // Si no quedan vehículos, marcar flota como completamente eliminada
            if (this.vehicles.length === 0) {
                this.hasArrived = true;
                this.isActive = false;
                console.log(`✅ Fleet ${this.id} completamente eliminada - todas las naves llegaron`);
            }
        }
    }
    
    /**
     * 🔧 NUEVO: Procesar llegada de nave individual
     */
    processIndividualVehicleArrival(vehicle) {
        // Para naves individuales, contribuir inmediatamente al ataque/refuerzo
        const arrivalData = {
            fleetId: this.id,
            vehicleId: vehicle.legacyId || `${this.id}_vehicle`,
            ships: 1, // Una nave individual
            owner: this.owner,
            fromPlanet: this.fromPlanet,
            toPlanet: this.toPlanet,
            targetPlanet: this.targetPlanet,
            color: this.color,
            arrivalTime: Date.now(),
            isIndividualArrival: true,
            x: vehicle.position.x,
            y: vehicle.position.y,
            targetX: this.targetPosition.x,
            targetY: this.targetPosition.y
        };
        
        console.log(`🎯 Vehículo individual llegó: ${vehicle.legacyId || 'unknown'}`);
        
        // Emitir evento de llegada individual
        eventBus.emit(GAME_EVENTS.FLEET_ARRIVED, arrivalData);
    }
} 