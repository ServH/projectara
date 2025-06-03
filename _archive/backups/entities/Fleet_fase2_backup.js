/**
 * 🚀 GALCON GAME - FLEET ENTITY
 * Flotas con movimiento fluido y efectos visuales
 * HITO 2: Movimiento orgánico con formación de flota
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class Fleet {
    constructor(fleetData) {
        this.id = fleetData.id;
        this.ships = fleetData.ships;
        this.owner = fleetData.owner;
        this.fromPlanet = fleetData.fromPlanet;
        this.toPlanet = fleetData.toPlanet;
        
        // Validar posiciones para evitar NaN
        this.startX = Number(fleetData.startX) || 0;
        this.startY = Number(fleetData.startY) || 0;
        this.targetX = Number(fleetData.targetX) || 0;
        this.targetY = Number(fleetData.targetY) || 0;
        
        // 🔍 VALIDACIÓN ESTRICTA: Verificar que las posiciones sean válidas
        if (isNaN(this.startX) || isNaN(this.startY) || isNaN(this.targetX) || isNaN(this.targetY)) {
            console.error(`🚨 Fleet ${this.id}: Coordenadas NaN detectadas - CORRIGIENDO`, {
                startX: this.startX, startY: this.startY,
                targetX: this.targetX, targetY: this.targetY
            });
            
            // 🔧 CORRECCIÓN: Usar posiciones por defecto válidas
            this.startX = isNaN(this.startX) ? 100 : this.startX;
            this.startY = isNaN(this.startY) ? 100 : this.startY;
            this.targetX = isNaN(this.targetX) ? 200 : this.targetX;
            this.targetY = isNaN(this.targetY) ? 200 : this.targetY;
        }
        
        this.x = this.startX;
        this.y = this.startY;
        
        // 🌊 HITO 2: Configuración de movimiento orgánico
        this.organicConfig = {
            // Movimiento base
            accelPhase: 0.2,
            accelFactor: 2.0,
            decelFactor: 0.3,
            
            // Variación individual
            personalAmplitude: 0.15,
            personalFrequency: 0.002,
            speedVariation: 0.2
        };
        
        // 🌊 HITO 2: Características individuales únicas
        this.personalPhase = Math.random() * Math.PI * 2;
        this.personalFrequency = this.organicConfig.personalFrequency * (0.5 + Math.random());
        this.personalAmplitude = this.organicConfig.personalAmplitude * (0.5 + Math.random());
        
        // Movimiento
        this.speed = this.calculateSpeed();
        this.distance = this.calculateDistance();
        this.progress = 0; // 0 a 1
        this.isMoving = true;
        this.hasArrived = false;
        
        // Tiempo
        this.launchTime = fleetData.launchTime || Date.now();
        this.travelTime = this.distance > 0 ? this.distance / this.speed : 0;
        this.arrivalTime = this.launchTime + (this.travelTime * 1000);
        
        // Efectos visuales
        this.trail = [];
        this.maxTrailLength = 8;
        this.trailUpdateInterval = 50; // ms
        this.lastTrailUpdate = Date.now();
        
        // Animaciones
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.formationSpread = this.calculateFormationSpread();
        
        console.log(`🚀 Flota ${this.id} creada: ${this.ships} naves de ${this.owner} (${Math.round(this.startX)},${Math.round(this.startY)}) → (${Math.round(this.targetX)},${Math.round(this.targetY)})`);
    }

    /**
     * Calcular velocidad basada en el número de naves (HITO 2: Con variación orgánica)
     */
    calculateSpeed() {
        // 🎯 HITO 2: Velocidad base optimizada
        const baseSpeed = 120; // píxeles por segundo
        const speedPenalty = Math.log(this.ships) * 0.02; // Menor penalización
        const maxSpeed = Math.max(baseSpeed * (1 - speedPenalty), baseSpeed * 0.8);
        
        // 🌊 HITO 2: Añadir variación personal
        const personalVariation = (Math.random() - 0.5) * this.organicConfig.speedVariation;
        return maxSpeed * (1 + personalVariation);
    }

    /**
     * Calcular distancia al objetivo
     */
    calculateDistance() {
        const dx = this.targetX - this.startX;
        const dy = this.targetY - this.startY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calcular dispersión de formación
     */
    calculateFormationSpread() {
        // Flotas más grandes tienen más dispersión
        return Math.min(Math.sqrt(this.ships) * 2, 20);
    }

    /**
     * Actualizar posición y estado de la flota (HITO 2: Movimiento orgánico)
     */
    update(deltaTime) {
        if (!this.isMoving || this.hasArrived) {
            return;
        }

        const now = Date.now();
        
        // Calcular progreso basado en tiempo
        const elapsedTime = (now - this.launchTime) / 1000;
        this.progress = Math.min(elapsedTime / this.travelTime, 1);

        // 🌊 HITO 2: Calcular velocidad según fase del viaje
        let speedMultiplier = 1.0;
        
        if (this.progress < this.organicConfig.accelPhase) {
            // Fase de aceleración
            const accelProgress = this.progress / this.organicConfig.accelPhase;
            speedMultiplier = accelProgress * this.organicConfig.accelFactor;
        } else if (this.progress > (1 - this.organicConfig.accelPhase)) {
            // Fase de desaceleración
            const decelProgress = (1 - this.progress) / this.organicConfig.accelPhase;
            speedMultiplier = Math.max(decelProgress, this.organicConfig.decelFactor);
        } else {
            // Fase de velocidad constante
            speedMultiplier = this.organicConfig.accelFactor;
        }
        
        // 🌊 HITO 2: Añadir variación orgánica personal
        const personalVariation = Math.sin(now * this.personalFrequency + this.personalPhase) * this.personalAmplitude;
        speedMultiplier *= (1 + personalVariation);
        
        // Asegurar velocidad mínima
        const minSpeedRatio = 20 / 120; // minSpeed / maxSpeed
        speedMultiplier = Math.max(speedMultiplier, minSpeedRatio);

        // Interpolación suave (easing)
        const easedProgress = this.easeInOutQuad(this.progress);

        // 🌊 HITO 2: Añadir micro-desviaciones para movimiento más orgánico
        const microDeviation = {
            x: Math.sin(now * this.personalFrequency * 2 + this.personalPhase) * 1.5,
            y: Math.cos(now * this.personalFrequency * 1.7 + this.personalPhase) * 1.5
        };

        // Actualizar posición
        this.x = this.startX + (this.targetX - this.startX) * easedProgress + microDeviation.x;
        this.y = this.startY + (this.targetY - this.startY) * easedProgress + microDeviation.y;

        // Actualizar trail
        this.updateTrail(now);

        // Actualizar animaciones
        this.updateAnimations(deltaTime);

        // Verificar llegada
        if (this.progress >= 1) {
            this.arrive();
        }
    }

    /**
     * Función de easing para movimiento suave
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Actualizar trail de la flota
     */
    updateTrail(now) {
        if (now - this.lastTrailUpdate > this.trailUpdateInterval) {
            // Añadir nueva posición al trail
            this.trail.push({
                x: this.x,
                y: this.y,
                timestamp: now,
                alpha: 1.0
            });

            // Limitar longitud del trail
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }

            this.lastTrailUpdate = now;
        }

        // Actualizar alpha del trail
        this.trail.forEach((point, index) => {
            const age = (now - point.timestamp) / 1000;
            point.alpha = Math.max(0, 1 - (age / 2)); // Fade en 2 segundos
        });

        // Remover puntos muy viejos
        this.trail = this.trail.filter(point => point.alpha > 0);
    }

    /**
     * Actualizar animaciones visuales
     */
    updateAnimations(deltaTime) {
        this.pulsePhase += deltaTime * 4;
    }

    /**
     * Manejar llegada al destino
     */
    arrive() {
        if (this.hasArrived) return;

        this.hasArrived = true;
        this.isMoving = false;
        this.x = this.targetX;
        this.y = this.targetY;

        // Emitir evento de llegada con TODOS los datos necesarios para el combate
        eventBus.emit(GAME_EVENTS.FLEET_ARRIVED, {
            fleetId: this.id,
            ships: this.ships,           // ✅ Número de naves atacantes
            owner: this.owner,           // ✅ Propietario de las naves
            fromPlanet: this.fromPlanet, // ✅ Planeta de origen
            toPlanet: this.toPlanet,     // ✅ Planeta objetivo
            targetX: this.targetX,       // ✅ Coordenadas de llegada
            targetY: this.targetY
        });

        console.log(`🎯 Flota ${this.id} ha llegado a destino: ${this.ships} naves de ${this.owner} atacan ${this.toPlanet}`);
    }

    /**
     * Obtener color según el propietario
     */
    getColor() {
        const colors = {
            player: '#00ff88',
            ai: '#ff4444',
            neutral: '#888888'
        };
        return colors[this.owner] || colors.neutral;
    }

    /**
     * Obtener datos para renderizado (HITO 2: Con datos orgánicos)
     */
    getRenderData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            targetX: this.targetX,  // 🎯 HITO 1: Necesario para orientación
            targetY: this.targetY,  // 🎯 HITO 1: Necesario para orientación
            ships: this.ships,
            owner: this.owner,
            color: this.getColor(),
            progress: this.progress,
            isMoving: this.isMoving,
            hasArrived: this.hasArrived,
            trail: this.trail,
            pulsePhase: this.pulsePhase,
            formationSpread: this.formationSpread,
            direction: this.getDirection(),
            speed: this.speed,
            // 🌊 HITO 2: Datos orgánicos
            personalPhase: this.personalPhase,
            personalAmplitude: this.personalAmplitude,
            organicIntensity: Math.sin(Date.now() * this.personalFrequency + this.personalPhase) * 0.5 + 0.5
        };
    }

    /**
     * Obtener dirección de movimiento
     */
    getDirection() {
        const dx = this.targetX - this.startX;
        const dy = this.targetY - this.startY;
        return Math.atan2(dy, dx);
    }

    /**
     * Obtener tiempo estimado de llegada
     */
    getETA() {
        if (this.hasArrived) return 0;
        return Math.max(0, this.arrivalTime - Date.now());
    }

    /**
     * Obtener información de debug (HITO 2: Con info orgánica)
     */
    getDebugInfo() {
        return {
            id: this.id,
            ships: this.ships,
            owner: this.owner,
            position: { x: Math.round(this.x), y: Math.round(this.y) },
            progress: `${(this.progress * 100).toFixed(1)}%`,
            speed: `${this.speed.toFixed(1)} px/s`,
            eta: `${(this.getETA() / 1000).toFixed(1)}s`,
            isMoving: this.isMoving,
            hasArrived: this.hasArrived,
            trailLength: this.trail.length,
            // 🌊 HITO 2: Debug orgánico
            personalPhase: this.personalPhase.toFixed(2),
            personalFrequency: this.personalFrequency.toFixed(4),
            organicIntensity: (Math.sin(Date.now() * this.personalFrequency + this.personalPhase) * 0.5 + 0.5).toFixed(2)
        };
    }

    /**
     * Destruir la flota (para limpieza)
     */
    destroy() {
        this.trail = [];
        this.isMoving = false;
        
        eventBus.emit(GAME_EVENTS.FLEET_DESTROYED, {
            fleetId: this.id,
            owner: this.owner,
            ships: this.ships
        });

        console.log(`💥 Flota ${this.id} destruida`);
    }
}

export default Fleet; 