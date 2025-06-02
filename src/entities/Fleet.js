/**
 * 🚀 GALCON GAME - FLEET ENTITY
 * Flotas con movimiento fluido y efectos visuales
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
        
        // Verificar que las posiciones sean válidas
        if (isNaN(this.startX) || isNaN(this.startY) || isNaN(this.targetX) || isNaN(this.targetY)) {
            console.error(`🚨 Fleet ${this.id}: Posiciones inválidas`, {
                startX: this.startX, startY: this.startY,
                targetX: this.targetX, targetY: this.targetY
            });
            // Usar posiciones por defecto
            this.startX = this.startY = this.targetX = this.targetY = 0;
        }
        
        this.x = this.startX;
        this.y = this.startY;
        
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
        
        console.log(`🚀 Flota ${this.id} creada: ${this.ships} naves de ${this.owner} (${this.startX},${this.startY}) → (${this.targetX},${this.targetY})`);
    }

    /**
     * Calcular velocidad basada en el número de naves
     */
    calculateSpeed() {
        // Flotas más rápidas para juego más dinámico
        const baseSpeed = 300; // píxeles por segundo (era 150)
        const speedPenalty = Math.log(this.ships) * 0.05; // Menor penalización
        return Math.max(baseSpeed * (1 - speedPenalty), baseSpeed * 0.7); // Mínimo más alto
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
     * Actualizar posición y estado de la flota
     */
    update(deltaTime) {
        if (!this.isMoving || this.hasArrived) {
            return;
        }

        const now = Date.now();
        
        // Calcular progreso basado en tiempo
        const elapsedTime = (now - this.launchTime) / 1000;
        this.progress = Math.min(elapsedTime / this.travelTime, 1);

        // Interpolación suave (easing)
        const easedProgress = this.easeInOutQuad(this.progress);

        // Actualizar posición
        this.x = this.startX + (this.targetX - this.startX) * easedProgress;
        this.y = this.startY + (this.targetY - this.startY) * easedProgress;

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
     * Obtener datos para renderizado
     */
    getRenderData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
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
            speed: this.speed
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
     * Obtener información de debug
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
            trailLength: this.trail.length
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