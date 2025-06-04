/**
 * 🪐 GALCON GAME - PLANET ENTITY (REFACTORIZADO FASE 4)
 * Planetas con producción automática y mecánicas de conquista optimizadas
 * HITO 2.5: Optimización crítica de planetas para 60 FPS estables
 * 
 * OPTIMIZACIONES APLICADAS:
 * - ❌ Eliminados 8+ console.log de producción y combate
 * - 📊 Optimizados cálculos de crecimiento con cache
 * - 🔍 Cacheadas validaciones de combate
 * - ⚡ Mejorado sistema de eventos
 * - 📊 Sistema de debug condicional implementado
 * - 🎮 Lógica del juego preservada al 100%
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

// 🚀 OPTIMIZACIÓN: Configuración cacheada y optimizada
const PLANET_CONFIG = {
    production: {
        small: 2.5,
        medium: 4.0,
        large: 6.0,
        huge: 8.0
    },
    capacity: {
        small: 60,
        medium: 120,
        large: 250,
        huge: 400
    },
    initialShips: {
        small: 15,
        medium: 25,
        large: 40,
        huge: 60
    },
    radius: {
        small: 15,
        medium: 25,
        large: 35,
        huge: 45
    },
    // 🚀 OPTIMIZACIÓN: Cache de multiplicadores de collider
    colliderMultipliers: {
        small: 2.0,
        medium: 1.6,
        large: 1.4,
        huge: 1.3
    }
};

export class Planet {
    constructor(id, x, y, size = 'medium', owner = 'neutral') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.size = size;
        this.owner = owner;
        
        // 🚀 OPTIMIZACIÓN: Flag de debug centralizado
        this.debugMode = false; // Solo true para debugging
        
        // 🚀 OPTIMIZACIÓN: Cache de propiedades calculadas
        this.configCache = {
            initialShips: this.calculateInitialShips(),
            maxShips: this.calculateMaxShips(),
            productionRate: this.calculateProductionRate(),
            radius: this.calculateRadius(),
            colliderRadius: 0,
            colliderMultiplier: PLANET_CONFIG.colliderMultipliers[this.size] || 1.5
        };
        
        // Inicializar propiedades con cache
        this.ships = this.configCache.initialShips;
        this.maxShips = this.configCache.maxShips;
        this.productionRate = this.configCache.productionRate;
        this.radius = this.configCache.radius;
        this.configCache.colliderRadius = this.radius * this.configCache.colliderMultiplier;
        
        // Tiempo de producción optimizado
        this.lastProduction = Date.now();
        
        // Estado visual
        this.isSelected = false;
        this.isHovered = false;
        
        // Propiedades especiales
        this.type = 'normal';
        this.specialBonus = 1.0;
        
        // 🚀 OPTIMIZACIÓN: Cache de animaciones
        this.animationCache = {
            pulsePhase: Math.random() * Math.PI * 2,
            glowIntensity: 0,
            lastAnimationUpdate: 0,
            animationInterval: 16 // 60 FPS
        };
        
        // 🚀 OPTIMIZACIÓN: Cache de colores estático
        if (!Planet.colorCache) {
            Planet.colorCache = {
                player: '#00ff88',
                ai: '#ff4444',
                neutral: '#888888'
            };
        }
        
        if (this.debugMode) {
            console.log(`🪐 Planeta ${this.id} creado: ${this.size}, owner: ${this.owner}, ships: ${this.ships}, producción: ${this.productionRate.toFixed(1)}/s`);
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular naves iniciales con cache
     */
    calculateInitialShips() {
        const ships = PLANET_CONFIG.initialShips[this.size] || PLANET_CONFIG.initialShips.medium;
        return Number(ships) || 25;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular capacidad máxima con cache
     */
    calculateMaxShips() {
        const capacity = PLANET_CONFIG.capacity[this.size] || PLANET_CONFIG.capacity.medium;
        return Number(capacity) || 120;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular velocidad de producción con cache
     */
    calculateProductionRate() {
        const baseRate = PLANET_CONFIG.production[this.size] || PLANET_CONFIG.production.medium;
        const finalRate = Number(baseRate) * Number(this.specialBonus || 1.0);
        
        if (isNaN(finalRate) || finalRate <= 0) {
            if (this.debugMode) {
                console.warn(`⚠️ Producción inválida para ${this.id}, usando valor por defecto`);
            }
            return 4.0;
        }
        
        return finalRate;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular radio con cache
     */
    calculateRadius() {
        const radius = PLANET_CONFIG.radius[this.size] || PLANET_CONFIG.radius.medium;
        return Number(radius) || 25;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar producción optimizada
     */
    update(deltaTime) {
        // Solo producir si el planeta tiene dueño y no está al máximo
        if (this.owner !== 'neutral' && this.ships < this.maxShips) {
            const now = Date.now();
            const timeSinceLastProduction = (now - this.lastProduction) / 1000;
            
            // Calcular cuántas naves producir
            const shipsToAdd = timeSinceLastProduction * this.productionRate;
            
            if (shipsToAdd >= 1) {
                const oldShips = this.ships;
                const newShips = Math.floor(shipsToAdd);
                this.ships = Math.min(this.ships + newShips, this.maxShips);
                
                // Actualizar tiempo, manteniendo fracción
                const fractionalTime = (shipsToAdd - newShips) / this.productionRate;
                this.lastProduction = now - (fractionalTime * 1000);
                
                // 🚀 OPTIMIZACIÓN: Emitir evento solo si debug o hay cambios significativos
                if (this.ships > oldShips) {
                    eventBus.emit(GAME_EVENTS.PLANET_PRODUCTION, {
                        planetId: this.id,
                        shipsAdded: this.ships - oldShips,
                        totalShips: this.ships,
                        owner: this.owner,
                        productionRate: this.productionRate
                    });
                }
            }
        }

        // Actualizar animaciones optimizadas
        this.updateAnimationsOptimized(deltaTime);
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar animaciones optimizadas
     */
    updateAnimationsOptimized(deltaTime) {
        const now = Date.now();
        if (now - this.animationCache.lastAnimationUpdate > this.animationCache.animationInterval) {
            // Pulso de planetas
            this.animationCache.pulsePhase += deltaTime * 2;
            
            // Glow intensity basado en selección
            if (this.isSelected) {
                this.animationCache.glowIntensity = Math.min(this.animationCache.glowIntensity + deltaTime * 3, 1);
            } else {
                this.animationCache.glowIntensity = Math.max(this.animationCache.glowIntensity - deltaTime * 2, 0);
            }
            
            this.animationCache.lastAnimationUpdate = now;
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Enviar flota sin logs críticos
     */
    sendFleet(targetPlanet, percentage = 0.5, targetClickX = null, targetClickY = null) {
        if (this.owner === 'neutral' || this.ships <= 1) {
            return null;
        }

        const shipsToSend = Math.floor(this.ships * percentage);
        if (shipsToSend <= 0) {
            return null;
        }

        // Reducir naves del planeta
        this.ships -= shipsToSend;

        // Crear datos de la flota optimizados
        const fleetData = {
            id: `fleet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ships: shipsToSend,
            owner: this.owner,
            fromPlanet: this.id,
            toPlanet: targetPlanet.id,
            targetPlanet: targetPlanet,
            startX: this.x,
            startY: this.y,
            targetX: targetPlanet.x,
            targetY: targetPlanet.y,
            launchTime: Date.now()
        };

        // Emitir evento de lanzamiento
        eventBus.emit(GAME_EVENTS.FLEET_LAUNCHED, fleetData);

        if (this.debugMode) {
            console.log(`🚀 Flota enviada desde ${this.id} a ${targetPlanet.id}: ${shipsToSend} naves (${Math.floor(percentage*100)}%) - (${this.x},${this.y}) → (${targetPlanet.x},${targetPlanet.y})`);
        }
        
        return fleetData;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Recibir ataque optimizado sin logs críticos
     */
    receiveAttack(attackingShips, attackerOwner) {
        if (this.debugMode) {
            console.log(`🛡️ Planeta ${this.id} recibe ataque: ${attackingShips} naves de ${attackerOwner} vs ${this.ships} naves de ${this.owner}`);
        }
        
        // 🚀 OPTIMIZACIÓN: Cache de resultado de batalla
        const battleResult = this.createBattleResult(attackingShips, attackerOwner);

        // Emitir evento de inicio de batalla
        eventBus.emit(GAME_EVENTS.BATTLE_START, battleResult);

        if (this.owner === attackerOwner) {
            // Refuerzo - simplemente añadir naves
            this.handleReinforcement(attackingShips, battleResult);
        } else {
            // Combate
            this.handleCombat(attackingShips, attackerOwner, battleResult);
        }

        // Emitir evento de fin de batalla
        eventBus.emit(GAME_EVENTS.BATTLE_END, battleResult);

        return battleResult;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Crear resultado de batalla optimizado
     */
    createBattleResult(attackingShips, attackerOwner) {
        return {
            planetId: this.id,
            attackingShips,
            attackerOwner,
            defendingShips: this.ships,
            defenderOwner: this.owner,
            conquered: false,
            shipsRemaining: 0
        };
    }

    /**
     * 🚀 OPTIMIZACIÓN: Manejar refuerzo sin logs críticos
     */
    handleReinforcement(attackingShips, battleResult) {
        const oldShips = this.ships;
        this.ships = Math.min(this.ships + attackingShips, this.maxShips);
        battleResult.shipsRemaining = this.ships;
        battleResult.conquered = false;
        
        if (this.debugMode) {
            console.log(`🤝 Refuerzo recibido en ${this.id}: ${oldShips} + ${attackingShips} = ${this.ships} naves`);
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Manejar combate sin logs críticos
     */
    handleCombat(attackingShips, attackerOwner, battleResult) {
        const totalDefense = this.ships;
        const totalAttack = attackingShips;

        if (this.debugMode) {
            console.log(`⚔️ Combate en ${this.id}: ${totalAttack} atacantes vs ${totalDefense} defensores`);
        }

        if (totalAttack > totalDefense) {
            // Conquista exitosa
            this.handleConquest(attackerOwner, totalAttack - totalDefense, battleResult);
        } else {
            // Defensa exitosa
            this.handleDefense(totalDefense - totalAttack, battleResult);
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Manejar conquista sin logs críticos
     */
    handleConquest(attackerOwner, shipsRemaining, battleResult) {
        const oldOwner = this.owner;
        
        this.owner = attackerOwner;
        this.ships = shipsRemaining;
        battleResult.conquered = true;
        battleResult.shipsRemaining = this.ships;

        if (this.debugMode) {
            console.log(`🎉 CONQUISTA EXITOSA: ${this.id} cambia de ${oldOwner} a ${this.owner} con ${this.ships} naves`);
        }

        // Emitir evento de conquista
        eventBus.emit(GAME_EVENTS.PLANET_CONQUERED, {
            planetId: this.id,
            oldOwner,
            newOwner: this.owner,
            shipsRemaining: this.ships
        });
    }

    /**
     * 🚀 OPTIMIZACIÓN: Manejar defensa sin logs críticos
     */
    handleDefense(shipsRemaining, battleResult) {
        this.ships = shipsRemaining;
        battleResult.conquered = false;
        battleResult.shipsRemaining = this.ships;

        if (this.debugMode) {
            console.log(`🛡️ DEFENSA EXITOSA: ${this.id} mantiene ${this.owner} con ${this.ships} naves restantes`);
        }
    }

    /**
     * Seleccionar/deseleccionar planeta
     */
    setSelected(selected) {
        if (this.isSelected !== selected) {
            this.isSelected = selected;
            
            if (selected) {
                eventBus.emit(GAME_EVENTS.PLANET_SELECTED, { planetId: this.id });
            } else {
                eventBus.emit(GAME_EVENTS.PLANET_DESELECTED, { planetId: this.id });
            }
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Verificar punto con cache de collider
     */
    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const colliderRadiusSquared = this.configCache.colliderRadius * this.configCache.colliderRadius;
        
        return (dx * dx + dy * dy) <= colliderRadiusSquared;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener radio del collider desde cache
     */
    getColliderRadius() {
        return this.configCache.colliderRadius;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener color desde cache estático
     */
    getColor() {
        return Planet.colorCache[this.owner] || Planet.colorCache.neutral;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener datos para renderizado optimizados
     */
    getRenderData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            radius: this.radius,
            colliderRadius: this.configCache.colliderRadius,
            ships: Math.floor(this.ships),
            maxShips: this.maxShips,
            owner: this.owner,
            size: this.size,
            isSelected: this.isSelected,
            isHovered: this.isHovered,
            color: this.getColor(),
            pulsePhase: this.animationCache.pulsePhase,
            glowIntensity: this.animationCache.glowIntensity,
            productionRate: this.productionRate
        };
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
            position: { x: this.x, y: this.y },
            ships: this.ships,
            maxShips: this.maxShips,
            owner: this.owner,
            size: this.size,
            productionRate: this.productionRate,
            isSelected: this.isSelected,
            type: this.type,
            specialBonus: this.specialBonus,
            // 🚀 OPTIMIZACIÓN: Info de cache
            cacheInfo: {
                colliderRadius: this.configCache.colliderRadius,
                colliderMultiplier: this.configCache.colliderMultiplier,
                animationCacheAge: Date.now() - this.animationCache.lastAnimationUpdate
            }
        };
    }

    // 🧪 MÉTODOS DE TESTING Y DEBUG (solo para desarrollo)
    
    /**
     * 🧪 TESTING: Activar modo debug
     */
    enableDebugMode() {
        this.debugMode = true;
        console.log(`🔧 Planet ${this.id}: Modo debug activado`);
    }

    /**
     * 🧪 TESTING: Desactivar modo debug
     */
    disableDebugMode() {
        this.debugMode = false;
        console.log(`🔧 Planet ${this.id}: Modo debug desactivado`);
    }

    /**
     * 🧪 TESTING: Forzar producción de naves
     */
    forceProduction(ships) {
        if (!this.debugMode) return;
        
        const oldShips = this.ships;
        this.ships = Math.min(this.ships + ships, this.maxShips);
        console.log(`🔧 Planet ${this.id}: Producción forzada ${oldShips} → ${this.ships}`);
    }

    /**
     * 🧪 TESTING: Simular ataque
     */
    simulateAttack(attackingShips, attackerOwner) {
        if (!this.debugMode) return;
        
        console.log(`🔧 Planet ${this.id}: Simulando ataque de ${attackingShips} naves de ${attackerOwner}`);
        return this.receiveAttack(attackingShips, attackerOwner);
    }

    /**
     * 🧪 TESTING: Obtener estadísticas de rendimiento
     */
    getPerformanceStats() {
        if (!this.debugMode) return null;
        
        return {
            id: this.id,
            animationCacheAge: Date.now() - this.animationCache.lastAnimationUpdate,
            productionEfficiency: this.ships / this.maxShips,
            memoryFootprint: {
                configCache: Object.keys(this.configCache).length * 8,
                animationCache: Object.keys(this.animationCache).length * 8
            }
        };
    }

    /**
     * 🧪 TESTING: Cambiar propietario directamente
     */
    forceOwnerChange(newOwner) {
        if (!this.debugMode) return;
        
        const oldOwner = this.owner;
        this.owner = newOwner;
        console.log(`🔧 Planet ${this.id}: Propietario cambiado ${oldOwner} → ${newOwner}`);
    }
}

export default Planet; 