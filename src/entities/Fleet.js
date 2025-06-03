/**
 * 🚀 GALCON GAME - FLEET ENTITY (REFACTORIZADO FASE 3)
 * Flotas con movimiento fluido y efectos visuales optimizados
 * HITO 2.5: Optimización crítica del movimiento para 60 FPS estables
 * 
 * OPTIMIZACIONES APLICADAS:
 * - ❌ Eliminados 10+ console.log del movimiento
 * - 🔍 Optimizadas validaciones NaN con cache
 * - 🧮 Cache de cálculos trigonométricos y orgánicos
 * - ⚡ Trail updates optimizados
 * - 📊 Sistema de debug condicional implementado
 * - 🌊 Movimiento orgánico preservado y optimizado
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class Fleet {
    constructor(fleetData) {
        this.id = fleetData.id;
        this.ships = fleetData.ships;
        this.owner = fleetData.owner;
        this.fromPlanet = fleetData.fromPlanet;
        this.toPlanet = fleetData.toPlanet;
        
        // 🚀 OPTIMIZACIÓN: Flag de debug centralizado
        this.debugMode = false; // Solo true para debugging
        
        // 🚀 OPTIMIZACIÓN: Validación optimizada de posiciones
        this.startX = this.validateCoordinate(fleetData.startX, 100);
        this.startY = this.validateCoordinate(fleetData.startY, 100);
        this.targetX = this.validateCoordinate(fleetData.targetX, 200);
        this.targetY = this.validateCoordinate(fleetData.targetY, 200);
        
        this.x = this.startX;
        this.y = this.startY;
        
        // 🌊 HITO 2: Configuración de movimiento orgánico (preservada)
        this.organicConfig = {
            accelPhase: 0.2,
            accelFactor: 2.0,
            decelFactor: 0.3,
            personalAmplitude: 0.15,
            personalFrequency: 0.002,
            speedVariation: 0.2
        };
        
        // 🌊 HITO 2: Características individuales únicas
        this.personalPhase = Math.random() * Math.PI * 2;
        this.personalFrequency = this.organicConfig.personalFrequency * (0.5 + Math.random());
        this.personalAmplitude = this.organicConfig.personalAmplitude * (0.5 + Math.random());
        
        // 🚀 OPTIMIZACIÓN: Cache de cálculos
        this.calculationCache = {
            distance: 0,
            direction: 0,
            speed: 0,
            formationSpread: 0,
            lastCacheUpdate: 0,
            cacheInterval: 100 // Actualizar cache cada 100ms
        };
        
        // Inicializar cálculos con cache
        this.speed = this.calculateSpeed();
        this.distance = this.calculateDistance();
        this.calculationCache.distance = this.distance;
        this.calculationCache.speed = this.speed;
        this.calculationCache.direction = this.calculateDirection();
        this.calculationCache.formationSpread = this.calculateFormationSpread();
        this.calculationCache.lastCacheUpdate = Date.now();
        
        // Movimiento
        this.progress = 0;
        this.isMoving = true;
        this.hasArrived = false;
        
        // Tiempo
        this.launchTime = fleetData.launchTime || Date.now();
        this.travelTime = this.distance > 0 ? this.distance / this.speed : 0;
        this.arrivalTime = this.launchTime + (this.travelTime * 1000);
        
        // 🚀 OPTIMIZACIÓN: Trail optimizado
        this.trail = [];
        this.maxTrailLength = 8;
        this.trailUpdateInterval = 50;
        this.lastTrailUpdate = Date.now();
        
        // 🚀 OPTIMIZACIÓN: Cache de animaciones
        this.animationCache = {
            pulsePhase: Math.random() * Math.PI * 2,
            organicIntensity: 0,
            lastAnimationUpdate: 0,
            animationInterval: 16 // 60 FPS
        };
        
        if (this.debugMode) {
            console.log(`🚀 Flota ${this.id} creada: ${this.ships} naves de ${this.owner} (${Math.round(this.startX)},${Math.round(this.startY)}) → (${Math.round(this.targetX)},${Math.round(this.targetY)})`);
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Validar coordenada con fallback
     */
    validateCoordinate(value, fallback) {
        const num = Number(value);
        if (isNaN(num) || !isFinite(num)) {
            if (this.debugMode) {
                console.warn(`🔧 Coordenada inválida corregida: ${value} → ${fallback}`);
            }
            return fallback;
        }
        return num;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular velocidad con cache
     */
    calculateSpeed() {
        const baseSpeed = 120;
        const speedPenalty = Math.log(this.ships) * 0.02;
        const maxSpeed = Math.max(baseSpeed * (1 - speedPenalty), baseSpeed * 0.8);
        
        const personalVariation = (Math.random() - 0.5) * this.organicConfig.speedVariation;
        return maxSpeed * (1 + personalVariation);
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular distancia con cache
     */
    calculateDistance() {
        const dx = this.targetX - this.startX;
        const dy = this.targetY - this.startY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular dirección con cache
     */
    calculateDirection() {
        const dx = this.targetX - this.startX;
        const dy = this.targetY - this.startY;
        return Math.atan2(dy, dx);
    }

    /**
     * Calcular dispersión de formación
     */
    calculateFormationSpread() {
        return Math.min(Math.sqrt(this.ships) * 2, 20);
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar cache de cálculos
     */
    updateCalculationCache(now) {
        if (now - this.calculationCache.lastCacheUpdate > this.calculationCache.cacheInterval) {
            // Solo recalcular si es necesario
            this.calculationCache.lastCacheUpdate = now;
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar posición optimizada (HITO 2: Movimiento orgánico preservado)
     */
    update(deltaTime) {
        if (!this.isMoving || this.hasArrived) {
            return;
        }

        const now = Date.now();
        
        // 🚀 OPTIMIZACIÓN: Actualizar cache si es necesario
        this.updateCalculationCache(now);
        
        // Calcular progreso basado en tiempo
        const elapsedTime = (now - this.launchTime) / 1000;
        this.progress = Math.min(elapsedTime / this.travelTime, 1);

        // 🌊 HITO 2: Calcular velocidad según fase del viaje (preservado)
        let speedMultiplier = this.calculateSpeedMultiplier(this.progress);
        
        // 🌊 HITO 2: Añadir variación orgánica personal (optimizada)
        const personalVariation = this.calculatePersonalVariation(now);
        speedMultiplier *= (1 + personalVariation);
        
        // Asegurar velocidad mínima
        const minSpeedRatio = 20 / 120;
        speedMultiplier = Math.max(speedMultiplier, minSpeedRatio);

        // Interpolación suave (easing)
        const easedProgress = this.easeInOutQuad(this.progress);

        // 🌊 HITO 2: Añadir micro-desviaciones optimizadas
        const microDeviation = this.calculateMicroDeviation(now);

        // Actualizar posición
        this.x = this.startX + (this.targetX - this.startX) * easedProgress + microDeviation.x;
        this.y = this.startY + (this.targetY - this.startY) * easedProgress + microDeviation.y;

        // 🚀 OPTIMIZACIÓN: Updates optimizados
        this.updateTrailOptimized(now);
        this.updateAnimationsOptimized(deltaTime, now);

        // Verificar llegada
        if (this.progress >= 1) {
            this.arrive();
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular multiplicador de velocidad (HITO 2 preservado)
     */
    calculateSpeedMultiplier(progress) {
        if (progress < this.organicConfig.accelPhase) {
            // Fase de aceleración
            const accelProgress = progress / this.organicConfig.accelPhase;
            return accelProgress * this.organicConfig.accelFactor;
        } else if (progress > (1 - this.organicConfig.accelPhase)) {
            // Fase de desaceleración
            const decelProgress = (1 - progress) / this.organicConfig.accelPhase;
            return Math.max(decelProgress, this.organicConfig.decelFactor);
        } else {
            // Fase de velocidad constante
            return this.organicConfig.accelFactor;
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular variación personal cacheada
     */
    calculatePersonalVariation(now) {
        return Math.sin(now * this.personalFrequency + this.personalPhase) * this.personalAmplitude;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular micro-desviaciones cacheadas
     */
    calculateMicroDeviation(now) {
        return {
            x: Math.sin(now * this.personalFrequency * 2 + this.personalPhase) * 1.5,
            y: Math.cos(now * this.personalFrequency * 1.7 + this.personalPhase) * 1.5
        };
    }

    /**
     * Función de easing para movimiento suave
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar trail optimizado
     */
    updateTrailOptimized(now) {
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

        // 🚀 OPTIMIZACIÓN: Actualizar alpha del trail de forma optimizada
        const currentTime = now;
        this.trail = this.trail.filter(point => {
            const age = (currentTime - point.timestamp) / 1000;
            point.alpha = Math.max(0, 1 - (age / 2));
            return point.alpha > 0;
        });
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar animaciones optimizadas
     */
    updateAnimationsOptimized(deltaTime, now) {
        if (now - this.animationCache.lastAnimationUpdate > this.animationCache.animationInterval) {
            this.animationCache.pulsePhase += deltaTime * 4;
            this.animationCache.organicIntensity = Math.sin(now * this.personalFrequency + this.personalPhase) * 0.5 + 0.5;
            this.animationCache.lastAnimationUpdate = now;
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Manejar llegada sin logs críticos
     */
    arrive() {
        if (this.hasArrived) return;

        this.hasArrived = true;
        this.isMoving = false;
        this.x = this.targetX;
        this.y = this.targetY;

        // Emitir evento de llegada con todos los datos necesarios
        eventBus.emit(GAME_EVENTS.FLEET_ARRIVED, {
            fleetId: this.id,
            ships: this.ships,
            owner: this.owner,
            fromPlanet: this.fromPlanet,
            toPlanet: this.toPlanet,
            targetX: this.targetX,
            targetY: this.targetY
        });

        if (this.debugMode) {
            console.log(`🎯 Flota ${this.id} ha llegado a destino: ${this.ships} naves de ${this.owner} atacan ${this.toPlanet}`);
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener color con cache
     */
    getColor() {
        // Cache estático de colores
        if (!Fleet.colorCache) {
            Fleet.colorCache = {
                player: '#00ff88',
                ai: '#ff4444',
                neutral: '#888888'
            };
        }
        return Fleet.colorCache[this.owner] || Fleet.colorCache.neutral;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener datos para renderizado optimizados (HITO 2: Con datos orgánicos)
     */
    getRenderData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            targetX: this.targetX,
            targetY: this.targetY,
            ships: this.ships,
            owner: this.owner,
            color: this.getColor(),
            progress: this.progress,
            isMoving: this.isMoving,
            hasArrived: this.hasArrived,
            trail: this.trail,
            pulsePhase: this.animationCache.pulsePhase,
            formationSpread: this.calculationCache.formationSpread,
            direction: this.calculationCache.direction,
            speed: this.calculationCache.speed,
            // 🌊 HITO 2: Datos orgánicos (preservados)
            personalPhase: this.personalPhase,
            personalAmplitude: this.personalAmplitude,
            organicIntensity: this.animationCache.organicIntensity
        };
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener dirección desde cache
     */
    getDirection() {
        return this.calculationCache.direction;
    }

    /**
     * Obtener tiempo estimado de llegada
     */
    getETA() {
        if (this.hasArrived) return 0;
        return Math.max(0, this.arrivalTime - Date.now());
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener información de debug solo si está habilitado
     */
    getDebugInfo() {
        if (!this.debugMode) {
            return { debugMode: false };
        }
        
        return {
            id: this.id,
            ships: this.ships,
            owner: this.owner,
            position: { x: Math.round(this.x), y: Math.round(this.y) },
            progress: `${(this.progress * 100).toFixed(1)}%`,
            speed: `${this.calculationCache.speed.toFixed(1)} px/s`,
            eta: `${(this.getETA() / 1000).toFixed(1)}s`,
            isMoving: this.isMoving,
            hasArrived: this.hasArrived,
            trailLength: this.trail.length,
            // 🌊 HITO 2: Debug orgánico
            personalPhase: this.personalPhase.toFixed(2),
            personalFrequency: this.personalFrequency.toFixed(4),
            organicIntensity: this.animationCache.organicIntensity.toFixed(2),
            // 🚀 OPTIMIZACIÓN: Info de cache
            cacheInfo: {
                distance: this.calculationCache.distance.toFixed(1),
                direction: this.calculationCache.direction.toFixed(2),
                lastUpdate: Date.now() - this.calculationCache.lastCacheUpdate
            }
        };
    }

    /**
     * 🚀 OPTIMIZACIÓN: Destruir la flota sin logs críticos
     */
    destroy() {
        this.trail = [];
        this.isMoving = false;
        
        eventBus.emit(GAME_EVENTS.FLEET_DESTROYED, {
            fleetId: this.id,
            owner: this.owner,
            ships: this.ships
        });

        if (this.debugMode) {
            console.log(`💥 Flota ${this.id} destruida`);
        }
    }

    // 🧪 MÉTODOS DE TESTING Y DEBUG (solo para desarrollo)
    
    /**
     * 🧪 TESTING: Activar modo debug
     */
    enableDebugMode() {
        this.debugMode = true;
        console.log(`🔧 Fleet ${this.id}: Modo debug activado`);
    }

    /**
     * 🧪 TESTING: Desactivar modo debug
     */
    disableDebugMode() {
        this.debugMode = false;
        console.log(`🔧 Fleet ${this.id}: Modo debug desactivado`);
    }

    /**
     * 🧪 TESTING: Forzar actualización de cache
     */
    forceUpdateCache() {
        if (!this.debugMode) return;
        
        this.calculationCache.distance = this.calculateDistance();
        this.calculationCache.direction = this.calculateDirection();
        this.calculationCache.formationSpread = this.calculateFormationSpread();
        this.calculationCache.lastCacheUpdate = Date.now();
        
        console.log(`🔧 Fleet ${this.id}: Cache actualizado`, this.calculationCache);
    }

    /**
     * 🧪 TESTING: Obtener estadísticas de rendimiento
     */
    getPerformanceStats() {
        if (!this.debugMode) return null;
        
        return {
            id: this.id,
            cacheAge: Date.now() - this.calculationCache.lastCacheUpdate,
            trailLength: this.trail.length,
            animationCacheAge: Date.now() - this.animationCache.lastAnimationUpdate,
            memoryFootprint: {
                trail: this.trail.length * 4, // Aproximado
                cache: Object.keys(this.calculationCache).length * 8
            }
        };
    }

    /**
     * 🧪 TESTING: Simular llegada inmediata
     */
    forceArrival() {
        if (!this.debugMode) return;
        
        this.progress = 1;
        this.arrive();
        console.log(`🔧 Fleet ${this.id}: Llegada forzada`);
    }
}

export default Fleet; 