/**
 * 🚁 FLEET REFACTORED - Sistema de Flotas Modular
 * Versión refactorizada con arquitectura limpia y responsabilidades separadas
 * Utiliza Strategy Pattern, Factory Pattern y gestores especializados
 * 
 * RESPONSABILIDAD ÚNICA: Coordinar el comportamiento de la flota como entidad
 */

import { Vector2D } from '../utils/Vector2D.js';
import { SteeringVehicle } from './SteeringVehicle.js';
import { GALCON_STEERING_CONFIG_PROBADA } from '../config/SteeringConfig.js';
import { FormationFactory } from './formations/FormationFactory.js';
import { BoidsManager } from './behaviors/BoidsManager.js';
import { FleetArrivalManager } from './behaviors/FleetArrivalManager.js';

export class Fleet {
    constructor(startPosition, targetPosition, config = GALCON_STEERING_CONFIG_PROBADA, fleetSize = 15, fleetData = {}) {
        // Identificación y configuración básica
        this.id = Fleet.generateId();
        this.startPosition = startPosition.copy();
        this.targetPosition = targetPosition.copy();
        this.config = config;
        this.fleetSize = fleetSize;

        // Datos del juego
        this.owner = fleetData.owner || 'player';
        this.fromPlanet = fleetData.fromPlanet || null;
        this.toPlanet = fleetData.toPlanet || null;
        this.targetPlanet = fleetData.toPlanet || null;
        this.color = fleetData.color || '#00ff88';

        // Estado de la flota
        this.isActive = true;
        this.hasArrived = false;
        this.vehicles = [];
        this.leader = null;

        // Propiedades calculadas
        this.averagePosition = startPosition.copy();
        this.averageVelocity = Vector2D.zero();

        // Gestores especializados
        this.formationStrategy = FormationFactory.createFormation(
            config.fleet.formation || 'spread',
            config.fleet.spacing
        );
        
        this.boidsManager = new BoidsManager({
            separationWeight: config.fleet.separationWeight,
            alignmentWeight: config.fleet.alignmentWeight,
            cohesionWeight: config.fleet.cohesionWeight
        });
        
        this.arrivalManager = new FleetArrivalManager();

        // Métricas
        this.frameCounter = 0;
        this.lastFormationUpdate = 0;
        this.debugInfo = this.initializeDebugInfo();

        // Inicializar flota
        this.createFleetVehicles();
        
        console.log(`🚁 Fleet ${this.id} creada: ${this.fleetSize} naves, formación ${this.formationStrategy.name}`);
    }

    /**
     * Inicializar información de debug
     * @returns {Object}
     */
    initializeDebugInfo() {
        return {
            totalVehicles: 0,
            arrivedVehicles: 0,
            avoidingVehicles: 0,
            averageSpeed: 0
        };
    }

    /**
     * Crear vehículos de la flota
     */
    createFleetVehicles() {
        this.vehicles = [];
        
        const formationPositions = this.calculateFormationPositions();
        const fleetDataForVehicles = this.prepareVehicleData();
        
        for (let i = 0; i < this.fleetSize; i++) {
            const vehicle = this.createVehicle(i, formationPositions[i], fleetDataForVehicles);
            this.vehicles.push(vehicle);
        }
        
        this.assignLeader();
        this.updateDebugInfo();
    }

    /**
     * Calcular posiciones de formación
     * @returns {Vector2D[]}
     */
    calculateFormationPositions() {
        const targetDirection = Vector2D.subtract(this.targetPosition, this.startPosition);
        return this.formationStrategy.calculatePositions(
            this.startPosition,
            this.fleetSize,
            targetDirection
        );
    }

    /**
     * Preparar datos para los vehículos
     * @returns {Object}
     */
    prepareVehicleData() {
        return {
            toPlanet: this.toPlanet,
            targetPlanet: this.targetPlanet,
            owner: this.owner,
            fromPlanet: this.fromPlanet,
            color: this.color
        };
    }

    /**
     * Crear un vehículo individual
     * @param {number} index 
     * @param {Vector2D} position 
     * @param {Object} fleetData 
     * @returns {SteeringVehicle}
     */
    createVehicle(index, position, fleetData) {
        const vehiclePosition = position || this.startPosition.copy();
        const vehicle = new SteeringVehicle(vehiclePosition, this.targetPosition, this.config, fleetData);
        
        // Configurar propiedades de flota
        vehicle.fleetId = this.id;
        vehicle.isLeader = index === 0;
        vehicle.fleetIndex = index;
        
        // Optimizar sensores para seguidores
        if (!vehicle.isLeader) {
            this.optimizeVehicleSensors(vehicle);
        }
        
        return vehicle;
    }

    /**
     * Optimizar sensores de vehículos seguidores
     * @param {SteeringVehicle} vehicle 
     */
    optimizeVehicleSensors(vehicle) {
        vehicle.sensorConfig = {
            ...this.config.sensors,
            length: this.config.sensors.length * 0.7,
            lateralCount: Math.min(1, this.config.sensors.lateralCount)
        };
    }

    /**
     * Asignar líder de la flota
     */
    assignLeader() {
        if (this.vehicles.length > 0) {
            this.leader = this.vehicles[0];
            this.leader.isLeader = true;
        }
    }

    /**
     * Actualizar flota
     * @param {number} deltaTime 
     * @param {Array} obstacles 
     * @param {Object} spatialHash 
     */
    update(deltaTime, obstacles, spatialHash) {
        if (!this.isActive || this.hasArrived) return;

        this.frameCounter++;
        
        // Actualizar cada vehículo
        this.updateVehicles(deltaTime, obstacles);
        
        // Actualizar propiedades promedio
        this.updateAverageProperties();
        
        // Verificar llegada
        this.arrivalManager.checkFleetArrival(this);
        
        // Limpiar vehículos llegados
        this.arrivalManager.cleanupArrivedVehicles(this);
        
        // Actualizar métricas
        this.updateDebugInfo();
    }

    /**
     * Actualizar todos los vehículos
     * @param {number} deltaTime 
     * @param {Array} obstacles 
     */
    updateVehicles(deltaTime, obstacles) {
        this.vehicles.forEach((vehicle, index) => {
            if (!vehicle.hasArrived) {
                this.updateVehicleWithBoids(vehicle, index, deltaTime, obstacles);
            }
        });
    }

    /**
     * Actualizar vehículo con comportamientos de boids
     * @param {SteeringVehicle} vehicle 
     * @param {number} vehicleIndex 
     * @param {number} deltaTime 
     * @param {Array} obstacles 
     */
    updateVehicleWithBoids(vehicle, vehicleIndex, deltaTime, obstacles) {
        // Actualizar vehículo normalmente
        vehicle.update(deltaTime, obstacles);
        
        // Aplicar boids si está habilitado
        if (this.shouldApplyBoids(vehicle)) {
            const boidsForce = this.boidsManager.calculateBoidsForces(
                vehicle,
                this.vehicles,
                this.formationStrategy.spacing
            );
            
            // Aplicar fuerza de boids
            vehicle.velocity.add(Vector2D.multiply(boidsForce, deltaTime));
            vehicle.velocity.limit(vehicle.maxSpeed);
        }
    }

    /**
     * Verificar si se deben aplicar boids a un vehículo
     * @param {SteeringVehicle} vehicle 
     * @returns {boolean}
     */
    shouldApplyBoids(vehicle) {
        return this.boidsManager.shouldApplyBoids(vehicle, this.config.fleet);
    }

    /**
     * Actualizar propiedades promedio de la flota
     */
    updateAverageProperties() {
        const activeVehicles = this.vehicles.filter(v => !v.hasArrived);
        
        if (activeVehicles.length === 0) return;
        
        let totalPosition = Vector2D.zero();
        let totalVelocity = Vector2D.zero();
        
        activeVehicles.forEach(vehicle => {
            totalPosition.add(vehicle.position);
            totalVelocity.add(vehicle.velocity);
        });
        
        this.averagePosition = Vector2D.divide(totalPosition, activeVehicles.length);
        this.averageVelocity = Vector2D.divide(totalVelocity, activeVehicles.length);
    }

    /**
     * Cambiar formación de la flota
     * @param {string} newFormationType 
     */
    setFormation(newFormationType) {
        if (!FormationFactory.isValidFormation(newFormationType)) {
            console.warn(`Fleet: Formación '${newFormationType}' no válida`);
            return;
        }

        // Crear nueva estrategia de formación
        this.formationStrategy = FormationFactory.createFormation(
            newFormationType,
            this.formationStrategy.spacing
        );

        // Recalcular posiciones
        this.updateFormationPositions();
        
        console.log(`🔄 Fleet ${this.id} cambió a formación ${newFormationType}`);
    }

    /**
     * Actualizar posiciones de formación
     */
    updateFormationPositions() {
        const targetDirection = Vector2D.subtract(this.targetPosition, this.averagePosition);
        const newPositions = this.formationStrategy.calculatePositions(
            this.averagePosition,
            this.vehicles.length,
            targetDirection
        );
        
        // Asignar nuevas posiciones objetivo
        this.vehicles.forEach((vehicle, index) => {
            if (!vehicle.hasArrived && newPositions[index]) {
                const targetOffset = Vector2D.subtract(newPositions[index], this.averagePosition);
                vehicle.target = Vector2D.add(vehicle.target, targetOffset);
            }
        });
        
        this.lastFormationUpdate = this.frameCounter;
    }

    /**
     * Actualizar objetivo de la flota
     * @param {Vector2D} newTarget 
     */
    updateTarget(newTarget) {
        this.targetPosition = newTarget.copy();
        
        this.vehicles.forEach(vehicle => {
            if (!vehicle.hasArrived) {
                vehicle.target = newTarget.copy();
            }
        });
        
        console.log(`🎯 Fleet ${this.id} objetivo actualizado`);
    }

    /**
     * Renderizar flota
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} debugConfig 
     */
    render(ctx, debugConfig) {
        if (!this.isActive) return;
        
        this.vehicles.forEach(vehicle => {
            vehicle.render(ctx, debugConfig);
        });
    }

    /**
     * Actualizar información de debug
     */
    updateDebugInfo() {
        this.debugInfo.totalVehicles = this.vehicles.length;
        this.debugInfo.arrivedVehicles = this.vehicles.filter(v => v.hasArrived).length;
        this.debugInfo.avoidingVehicles = this.vehicles.filter(v => v.isAvoiding).length;
        
        const activeVehicles = this.vehicles.filter(v => !v.hasArrived);
        if (activeVehicles.length > 0) {
            const totalSpeed = activeVehicles.reduce((sum, v) => sum + v.velocity.magnitude(), 0);
            this.debugInfo.averageSpeed = totalSpeed / activeVehicles.length;
        }
    }

    /**
     * Obtener estadísticas de la flota
     * @returns {Object}
     */
    getStats() {
        return {
            id: this.id,
            formation: this.formationStrategy.name,
            size: this.fleetSize,
            isActive: this.isActive,
            hasArrived: this.hasArrived,
            averagePosition: this.averagePosition.toObject(),
            averageSpeed: this.debugInfo.averageSpeed,
            arrivedVehicles: this.debugInfo.arrivedVehicles,
            avoidingVehicles: this.debugInfo.avoidingVehicles,
            frameCounter: this.frameCounter,
            arrivalStats: this.arrivalManager.getArrivalStats(this)
        };
    }

    /**
     * Obtener datos para renderizado
     * @returns {Array|null}
     */
    getRenderData() {
        if (!this.isActive || this.hasArrived) return null;

        return this.vehicles
            .filter(vehicle => !vehicle.hasArrived)
            .map(vehicle => ({
                id: `${this.id}_${vehicle.id || 'vehicle'}`,
                x: vehicle.position.x,
                y: vehicle.position.y,
                targetX: vehicle.target.x,
                targetY: vehicle.target.y,
                ships: 1,
                owner: this.owner,
                color: this.color,
                hasArrived: vehicle.hasArrived,
                organicIntensity: vehicle.isAvoiding ? vehicle.avoidanceUrgency : 0,
                trail: vehicle.trail || [],
                formation: this.formationStrategy.name,
                isLeader: vehicle.isLeader || false
            }));
    }

    /**
     * Destruir flota
     */
    destroy() {
        this.isActive = false;
        this.vehicles.forEach(vehicle => {
            vehicle.fleetId = null;
        });
        this.vehicles = [];
        this.leader = null;
        
        console.log(`🧹 Fleet ${this.id} destruida`);
    }

    /**
     * Generar ID único
     * @returns {string}
     */
    static generateId() {
        return `fleet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
} 