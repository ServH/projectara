/**
 * 🚁 FLEET - Sistema de Flotas con Steering Behaviors
 * Implementación completa de flotas con formaciones dinámicas y comportamientos de boids
 * Migrado exactamente del laboratorio - SENSACIÓN VIVA PROBADA
 * Incluye: 4 formaciones, liderazgo jerárquico, spatial hashing, histéresis anti-bailoteo
 */

import { Vector2D } from '../utils/Vector2D.js';
import { SteeringVehicle } from './SteeringVehicle.js';
import { GALCON_STEERING_CONFIG_PROBADA } from '../config/SteeringConfig.js';

export class Fleet {
    constructor(startPosition, targetPosition, config = GALCON_STEERING_CONFIG_PROBADA, fleetSize = 15) {
        // Propiedades básicas
        this.id = Fleet.generateId();
        this.startPosition = startPosition.copy();
        this.targetPosition = targetPosition.copy();
        this.config = config;
        this.fleetSize = Math.min(fleetSize, config.galcon.maxFleetSize);
        
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
        
        for (let i = 0; i < this.fleetSize; i++) {
            const vehiclePosition = formationPositions[i] || this.startPosition.copy();
            const vehicle = new SteeringVehicle(vehiclePosition, this.targetPosition, this.config);
            
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
        
        // Actualizar posición promedio y velocidad
        this.updateAverageProperties();
        
        // Actualizar cada vehículo
        this.vehicles.forEach((vehicle, index) => {
            if (vehicle.hasArrived) return;
            
            // Obtener obstáculos cercanos usando spatial hash
            const nearbyObstacles = spatialHash ? 
                spatialHash.getNearby(vehicle.position, this.config.sensors.length * 2) : 
                obstacles;
            
            // Calcular fuerzas de boids si están habilitadas
            let boidsForces = Vector2D.zero();
            if (this.enableBoids && this.vehicles.length > 1) {
                boidsForces = this.calculateBoidsForces(vehicle, index);
            }
            
            // Actualizar vehículo con fuerzas adicionales
            this.updateVehicleWithBoids(vehicle, deltaTime, nearbyObstacles, boidsForces);
        });
        
        // Verificar si la flota ha llegado
        this.checkFleetArrival();
        
        // Actualizar información de debug
        if (this.frameCounter % 30 === 0) {
            this.updateDebugInfo();
        }
    }

    /**
     * 🔄 Actualizar vehículo con comportamientos de boids
     */
    updateVehicleWithBoids(vehicle, deltaTime, obstacles, boidsForces) {
        // Actualizar steering normal
        vehicle.update(deltaTime, obstacles, this.config);
        
        // Aplicar fuerzas de boids si están habilitadas
        if (this.enableBoids && boidsForces.magnitude() > 0.1) {
            // Limitar la influencia de boids para mantener steering principal
            const maxBoidsInfluence = vehicle.maxForce * 0.3; // Máximo 30% de influencia
            boidsForces.limit(maxBoidsInfluence);
            
            // Aplicar fuerzas de boids suavemente
            vehicle.velocity.add(Vector2D.multiply(boidsForces, deltaTime * 0.5));
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
     * 🎯 Verificar llegada de la flota
     */
    checkFleetArrival() {
        const arrivedCount = this.vehicles.filter(v => v.hasArrived).length;
        const arrivalThreshold = Math.ceil(this.vehicles.length * 0.8); // 80% debe llegar
        
        if (arrivedCount >= arrivalThreshold) {
            this.hasArrived = true;
            console.log(`🎯 Fleet ${this.id} ha llegado: ${arrivedCount}/${this.vehicles.length} naves`);
        }
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
     * 🎨 Renderizar flota
     */
    render(ctx, debugConfig) {
        if (!this.isActive) return;
        
        // Renderizar conexiones de flota si está habilitado
        if (debugConfig.showFleetConnections) {
            this.renderFleetConnections(ctx);
        }
        
        // Renderizar centro de flota si está habilitado
        if (debugConfig.showFleetCenter) {
            this.renderFleetCenter(ctx);
        }
        
        // Renderizar cada vehículo
        this.vehicles.forEach(vehicle => {
            vehicle.render(ctx, debugConfig);
        });
        
        // Renderizar información de debug
        if (debugConfig.showFleetConnections) {
            this.renderDebugInfo(ctx);
        }
    }

    /**
     * 🎨 Renderizar conexiones entre vehículos
     */
    renderFleetConnections(ctx) {
        if (this.vehicles.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        const perceptionRadius = this.spacing * 2;
        
        for (let i = 0; i < this.vehicles.length; i++) {
            for (let j = i + 1; j < this.vehicles.length; j++) {
                const v1 = this.vehicles[i];
                const v2 = this.vehicles[j];
                
                if (v1.hasArrived || v2.hasArrived) continue;
                
                const distance = v1.position.distance(v2.position);
                
                if (distance < perceptionRadius) {
                    ctx.beginPath();
                    ctx.moveTo(v1.position.x, v1.position.y);
                    ctx.lineTo(v2.position.x, v2.position.y);
                    ctx.stroke();
                }
            }
        }
        
        ctx.restore();
    }

    /**
     * 🎨 Renderizar centro de flota
     */
    renderFleetCenter(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffaa00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        
        // Círculo del centro
        ctx.beginPath();
        ctx.arc(this.averagePosition.x, this.averagePosition.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Flecha de velocidad promedio
        if (this.averageVelocity.magnitude() > 0.1) {
            const velocityScale = 0.5;
            const scaledVelocity = Vector2D.multiply(this.averageVelocity, velocityScale);
            const end = Vector2D.add(this.averagePosition, scaledVelocity);
            
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.averagePosition.x, this.averagePosition.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    /**
     * 🎨 Renderizar información de debug
     */
    renderDebugInfo(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.globalAlpha = 0.8;
        
        const debugText = [
            `Fleet ${this.id} - ${this.formation}`,
            `Naves: ${this.debugInfo.totalVehicles}`,
            `Llegadas: ${this.debugInfo.arrivedVehicles}`,
            `Evadiendo: ${this.debugInfo.avoidingVehicles}`,
            `Vel. Prom: ${this.debugInfo.averageSpeed.toFixed(1)}`
        ];
        
        const textX = this.averagePosition.x + 15;
        let textY = this.averagePosition.y - 40;
        
        debugText.forEach(text => {
            ctx.fillText(text, textX, textY);
            textY += 15;
        });
        
        ctx.restore();
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
} 