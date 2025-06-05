/**
 * 🪐 PLANET REFACTORED - Sistema de Planetas Modular
 * Versión refactorizada con arquitectura limpia y responsabilidades separadas
 * Utiliza Strategy Pattern, Factory Pattern y gestores especializados
 * 
 * RESPONSABILIDAD ÚNICA: Coordinar el comportamiento del planeta como entidad
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';
import { ProductionManager } from './planet/ProductionManager.js';
import { BattleManager } from './planet/BattleManager.js';
import { FleetLaunchManager } from './planet/FleetLaunchManager.js';
import { PlanetConfigFactory } from './planet/PlanetConfigFactory.js';

export class Planet {
    constructor(id, x, y, size = 'medium', owner = 'neutral', type = 'normal') {
        // Identificación y posición
        this.id = id;
        this.x = x;
        this.y = y;

        // Configuración usando Factory Pattern
        const config = PlanetConfigFactory.createPlanetConfig(size, type, owner);
        this.applyConfiguration(config);

        // Estado del planeta
        this.ships = this.initialShips;
        this.lastProduction = Date.now();
        this.isSelected = false;
        this.isHovered = false;

        // Gestores especializados (Dependency Injection)
        this.productionManager = new ProductionManager();
        this.battleManager = new BattleManager();
        this.fleetLaunchManager = new FleetLaunchManager();

        // Cache de animaciones
        this.animationCache = {
            pulsePhase: Math.random() * Math.PI * 2,
            glowIntensity: 0,
            lastAnimationUpdate: 0,
            animationInterval: 16 // 60 FPS
        };

        // Modo debug
        this.debugMode = false;

        console.log(`🪐 Planeta ${this.id} creado: ${this.size}, owner: ${this.owner}, ships: ${this.ships}, producción: ${this.productionRate.toFixed(1)}/s`);
    }

    /**
     * Aplicar configuración del factory
     * @param {Object} config 
     */
    applyConfiguration(config) {
        this.size = config.size;
        this.type = config.type;
        this.owner = config.owner;
        this.radius = config.radius;
        this.initialShips = config.initialShips;
        this.maxShips = config.maxShips;
        this.productionRate = config.productionRate;
        this.specialBonus = config.specialBonus;
        this.colliderRadius = config.colliderRadius;
        this.color = config.color;
    }

    /**
     * Actualizar planeta
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        // Procesar producción usando ProductionManager
        const productionResult = this.productionManager.processProduction(this, deltaTime);
        if (productionResult.shipsProduced > 0) {
            this.ships = productionResult.totalShips;
            this.lastProduction = productionResult.lastProduction;
        }

        // Procesar cola de lanzamiento usando FleetLaunchManager
        this.fleetLaunchManager.processLaunchQueue(this.id);

        // Actualizar animaciones
        this.updateAnimations(deltaTime);
    }

    /**
     * Actualizar animaciones
     * @param {number} deltaTime 
     */
    updateAnimations(deltaTime) {
        const now = Date.now();
        if (now - this.animationCache.lastAnimationUpdate >= this.animationCache.animationInterval) {
            this.animationCache.pulsePhase += deltaTime * 0.002;
            this.animationCache.glowIntensity = Math.sin(this.animationCache.pulsePhase) * 0.3 + 0.7;
            this.animationCache.lastAnimationUpdate = now;
        }
    }

    /**
     * Enviar flota a otro planeta
     * @param {Planet} targetPlanet 
     * @param {number} percentage 
     * @param {number} targetClickX 
     * @param {number} targetClickY 
     * @returns {Object|null}
     */
    sendFleet(targetPlanet, percentage = 0.5, targetClickX = null, targetClickY = null) {
        if (!targetPlanet || this.ships <= 0) {
            return null;
        }

        const fleetData = this.fleetLaunchManager.sendFleet(this, targetPlanet, percentage);
        
        if (fleetData && this.debugMode) {
            console.log(`🚀 Enjambre en cola desde ${this.id} a ${targetPlanet.id}: ${Math.floor(this.ships * percentage)} naves`);
        }
        
        return fleetData;
    }

    /**
     * Recibir ataque
     * @param {number} attackingShips 
     * @param {string} attackerOwner 
     * @returns {Object}
     */
    receiveAttack(attackingShips, attackerOwner) {
        if (this.debugMode) {
            console.log(`🛡️ Planeta ${this.id} recibe ataque: ${attackingShips} naves de ${attackerOwner} vs ${this.ships} naves de ${this.owner}`);
        }
        
        return this.battleManager.processAttack(this, attackingShips, attackerOwner);
    }

    /**
     * Simular ataque sin ejecutarlo
     * @param {number} attackingShips 
     * @param {string} attackerOwner 
     * @returns {Object}
     */
    simulateAttack(attackingShips, attackerOwner) {
        return this.battleManager.simulateAttack(this, attackingShips, attackerOwner);
    }

    /**
     * Seleccionar/deseleccionar planeta
     * @param {boolean} selected 
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
     * Verificar si un punto está dentro del planeta
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const colliderRadiusSquared = this.colliderRadius * this.colliderRadius;
        
        return (dx * dx + dy * dy) <= colliderRadiusSquared;
    }

    /**
     * Obtener radio del collider
     * @returns {number}
     */
    getColliderRadius() {
        return this.colliderRadius;
    }

    /**
     * Obtener color del planeta
     * @returns {string}
     */
    getColor() {
        return PlanetConfigFactory.getOwnerColor(this.owner);
    }

    /**
     * Obtener datos para renderizado
     * @returns {Object}
     */
    getRenderData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            radius: this.radius,
            colliderRadius: this.colliderRadius,
            ships: Math.floor(this.ships),
            maxShips: this.maxShips,
            owner: this.owner,
            size: this.size,
            type: this.type,
            isSelected: this.isSelected,
            isHovered: this.isHovered,
            color: this.getColor(),
            pulsePhase: this.animationCache.pulsePhase,
            glowIntensity: this.animationCache.glowIntensity,
            productionRate: this.productionRate
        };
    }

    /**
     * Obtener estadísticas del planeta
     * @returns {Object}
     */
    getStats() {
        return {
            // Información básica
            id: this.id,
            position: { x: this.x, y: this.y },
            size: this.size,
            type: this.type,
            owner: this.owner,
            
            // Estadísticas de producción
            production: this.productionManager.getProductionStats(this),
            
            // Estadísticas de combate
            battle: this.battleManager.getBattleStats(this.id),
            
            // Estado de lanzamiento
            launch: this.fleetLaunchManager.getLaunchQueueStatus(this.id),
            
            // Propiedades físicas
            radius: this.radius,
            colliderRadius: this.colliderRadius,
            specialBonus: this.specialBonus
        };
    }

    /**
     * Obtener información de debug
     * @returns {Object}
     */
    getDebugInfo() {
        if (!this.debugMode) {
            return { debugMode: false };
        }
        
        return {
            ...this.getStats(),
            debugMode: true,
            animationCache: {
                pulsePhase: this.animationCache.pulsePhase,
                glowIntensity: this.animationCache.glowIntensity,
                lastUpdate: this.animationCache.lastAnimationUpdate
            },
            managers: {
                productionManager: !!this.productionManager,
                battleManager: !!this.battleManager,
                fleetLaunchManager: !!this.fleetLaunchManager
            }
        };
    }

    /**
     * Activar modo debug
     */
    enableDebugMode() {
        this.debugMode = true;
        console.log(`🔧 Planet ${this.id}: Modo debug activado`);
    }

    /**
     * Desactivar modo debug
     */
    disableDebugMode() {
        this.debugMode = false;
        console.log(`🔧 Planet ${this.id}: Modo debug desactivado`);
    }

    /**
     * Forzar producción de naves (para testing)
     * @param {number} ships 
     */
    forceProduction(ships) {
        if (!this.debugMode) return;
        
        const result = this.productionManager.forceProduction(this, ships);
        this.ships = result.totalShips;
        
        console.log(`🔧 Planet ${this.id}: Producción forzada, ahora tiene ${this.ships} naves`);
    }

    /**
     * Cambiar propietario directamente (para testing)
     * @param {string} newOwner 
     */
    forceOwnerChange(newOwner) {
        if (!this.debugMode) return;
        
        const oldOwner = this.owner;
        this.owner = newOwner;
        this.color = PlanetConfigFactory.getOwnerColor(newOwner);
        
        console.log(`🔧 Planet ${this.id}: Propietario cambiado ${oldOwner} → ${newOwner}`);
    }

    /**
     * Notificar que una flota ha partido
     */
    notifyFleetDeparted() {
        this.fleetLaunchManager.notifyFleetDeparted(this.id);
    }

    /**
     * Obtener historial de batallas
     * @returns {Array}
     */
    getBattleHistory() {
        return this.battleManager.getBattleHistory(this.id);
    }

    /**
     * Limpiar historial y colas
     */
    cleanup() {
        this.battleManager.clearHistory();
        this.fleetLaunchManager.clearLaunchQueue(this.id);
        console.log(`🧹 Planet ${this.id}: Limpieza completada`);
    }
}

export default Planet; 