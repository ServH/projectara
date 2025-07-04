/**
 * 🪐 GALCON GAME - PLANET ENTITY
 * Planetas con producción automática y mecánicas de conquista
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

// Configuración por defecto si no se puede importar la externa
const DEFAULT_PLANET_CONFIG = {
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
    }
};

// Usar configuración por defecto directamente
let PLANET_CONFIG = DEFAULT_PLANET_CONFIG;

export class Planet {
    constructor(id, x, y, size = 'medium', owner = 'neutral') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.size = size;
        this.owner = owner;
        
        // Propiedades de juego usando configuración robusta
        this.ships = this.getInitialShips();
        this.maxShips = this.getMaxShips();
        this.productionRate = this.getProductionRate();
        this.lastProduction = Date.now();
        
        // Estado visual
        this.isSelected = false;
        this.isHovered = false;
        this.radius = this.getRadius();
        
        // Propiedades especiales
        this.type = 'normal'; // normal, factory, shield, warp
        this.specialBonus = 1.0;
        
        // Animaciones
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.glowIntensity = 0;
        
        console.log(`🪐 Planeta ${this.id} creado: ${this.size}, owner: ${this.owner}, ships: ${this.ships}, producción: ${this.productionRate.toFixed(1)}/s`);
    }

    /**
     * Obtener naves iniciales según el tamaño
     */
    getInitialShips() {
        const ships = PLANET_CONFIG.initialShips[this.size] || PLANET_CONFIG.initialShips.medium || 25;
        return Number(ships) || 25;
    }

    /**
     * Obtener capacidad máxima según el tamaño
     */
    getMaxShips() {
        const capacity = PLANET_CONFIG.capacity[this.size] || PLANET_CONFIG.capacity.medium || 120;
        return Number(capacity) || 120;
    }

    /**
     * Obtener velocidad de producción según el tamaño
     */
    getProductionRate() {
        const baseRate = PLANET_CONFIG.production[this.size] || PLANET_CONFIG.production.medium || 4.0;
        const finalRate = Number(baseRate) * Number(this.specialBonus || 1.0);
        
        // Validar que no sea NaN
        if (isNaN(finalRate) || finalRate <= 0) {
            console.warn(`⚠️ Producción inválida para ${this.id}, usando valor por defecto`);
            return 4.0; // Valor por defecto
        }
        
        return finalRate;
    }

    /**
     * Obtener radio visual según el tamaño
     */
    getRadius() {
        const radius = PLANET_CONFIG.radius[this.size] || PLANET_CONFIG.radius.medium || 25;
        return Number(radius) || 25;
    }

    /**
     * Actualizar producción de naves (OPTIMIZADO)
     */
    update(deltaTime) {
        // Solo producir si el planeta tiene dueño y no está al máximo
        if (this.owner !== 'neutral' && this.ships < this.maxShips) {
            const now = Date.now();
            const timeSinceLastProduction = (now - this.lastProduction) / 1000;
            
            // Calcular cuántas naves producir (más preciso)
            const shipsToAdd = timeSinceLastProduction * this.productionRate;
            
            if (shipsToAdd >= 1) {
                const oldShips = this.ships;
                const newShips = Math.floor(shipsToAdd);
                this.ships = Math.min(this.ships + newShips, this.maxShips);
                
                // Actualizar tiempo, manteniendo fracción
                const fractionalTime = (shipsToAdd - newShips) / this.productionRate;
                this.lastProduction = now - (fractionalTime * 1000);
                
                // Emitir evento de producción
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

        // Actualizar animaciones
        this.updateAnimations(deltaTime);
    }

    /**
     * Actualizar animaciones visuales
     */
    updateAnimations(deltaTime) {
        // Pulso de planetas
        this.pulsePhase += deltaTime * 2;
        
        // Glow intensity basado en selección
        if (this.isSelected) {
            this.glowIntensity = Math.min(this.glowIntensity + deltaTime * 3, 1);
        } else {
            this.glowIntensity = Math.max(this.glowIntensity - deltaTime * 2, 0);
        }
    }

    /**
     * Enviar flota a otro planeta (SIMPLIFICADO COMO EN TEST-HITO1A)
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

        // 🎯 SIMPLIFICADO: Usar coordenadas directas como en test-hito1a
        // Posición de salida: centro del planeta origen
        const startX = this.x;
        const startY = this.y;
        
        // Posición de destino: centro del planeta destino
        const targetX = targetPlanet.x;
        const targetY = targetPlanet.y;

        // Crear datos de la flota (EXACTAMENTE como en test-hito1a)
        const fleetData = {
            id: `fleet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ships: shipsToSend,
            owner: this.owner,
            fromPlanet: this.id,
            toPlanet: targetPlanet.id,
            startX: startX,
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            launchTime: Date.now()
        };

        // Emitir evento de lanzamiento
        eventBus.emit(GAME_EVENTS.FLEET_LAUNCHED, fleetData);

        console.log(`🚀 Flota enviada desde ${this.id} a ${targetPlanet.id}: ${shipsToSend} naves (${Math.floor(percentage*100)}%) - (${startX},${startY}) → (${targetX},${targetY})`);
        return fleetData;
    }

    /**
     * Recibir ataque de una flota
     */
    receiveAttack(attackingShips, attackerOwner) {
        console.log(`🛡️ Planeta ${this.id} recibe ataque: ${attackingShips} naves de ${attackerOwner} vs ${this.ships} naves de ${this.owner}`);
        
        const battleResult = {
            planetId: this.id,
            attackingShips,
            attackerOwner,
            defendingShips: this.ships,
            defenderOwner: this.owner,
            conquered: false,
            shipsRemaining: 0
        };

        // Emitir evento de inicio de batalla
        eventBus.emit(GAME_EVENTS.BATTLE_START, battleResult);

        if (this.owner === attackerOwner) {
            // Refuerzo - simplemente añadir naves
            const oldShips = this.ships;
            this.ships = Math.min(this.ships + attackingShips, this.maxShips);
            battleResult.shipsRemaining = this.ships;
            battleResult.conquered = false;
            
            console.log(`🤝 Refuerzo recibido en ${this.id}: ${oldShips} + ${attackingShips} = ${this.ships} naves`);
        } else {
            // Combate
            const totalDefense = this.ships;
            const totalAttack = attackingShips;

            console.log(`⚔️ Combate en ${this.id}: ${totalAttack} atacantes vs ${totalDefense} defensores`);

            if (totalAttack > totalDefense) {
                // Conquista exitosa
                const oldOwner = this.owner;
                const shipsRemaining = totalAttack - totalDefense;
                
                this.owner = attackerOwner;
                this.ships = shipsRemaining;
                battleResult.conquered = true;
                battleResult.shipsRemaining = this.ships;

                console.log(`🎉 CONQUISTA EXITOSA: ${this.id} cambia de ${oldOwner} a ${this.owner} con ${this.ships} naves`);

                // Emitir evento de conquista
                eventBus.emit(GAME_EVENTS.PLANET_CONQUERED, {
                    planetId: this.id,
                    oldOwner,
                    newOwner: this.owner,
                    shipsRemaining: this.ships
                });
            } else {
                // Defensa exitosa
                const shipsRemaining = totalDefense - totalAttack;
                this.ships = shipsRemaining;
                battleResult.conquered = false;
                battleResult.shipsRemaining = this.ships;

                console.log(`🛡️ DEFENSA EXITOSA: ${this.id} mantiene ${this.owner} con ${this.ships} naves restantes`);
            }
        }

        // Emitir evento de fin de batalla
        eventBus.emit(GAME_EVENTS.BATTLE_END, battleResult);

        return battleResult;
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
     * Verificar si un punto está dentro del planeta (MEJORADO)
     * Usa un collider mucho más grande para mejor UX, especialmente en planetas pequeños
     */
    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        
        // Collider expandido: 2x para planetas pequeños, 1.5x para otros
        let colliderMultiplier;
        switch (this.size) {
            case 'small':
                colliderMultiplier = 2.0;  // Doble área para planetas pequeños
                break;
            case 'medium':
                colliderMultiplier = 1.6;  // 60% más área
                break;
            case 'large':
                colliderMultiplier = 1.4;  // 40% más área
                break;
            case 'huge':
                colliderMultiplier = 1.3;  // 30% más área
                break;
            default:
                colliderMultiplier = 1.5;
        }
        
        const colliderRadius = this.radius * colliderMultiplier;
        
        return (dx * dx + dy * dy) <= (colliderRadius * colliderRadius);
    }

    /**
     * Obtener radio del collider (para debug y otros usos)
     */
    getColliderRadius() {
        let colliderMultiplier;
        switch (this.size) {
            case 'small':
                colliderMultiplier = 2.0;
                break;
            case 'medium':
                colliderMultiplier = 1.6;
                break;
            case 'large':
                colliderMultiplier = 1.4;
                break;
            case 'huge':
                colliderMultiplier = 1.3;
                break;
            default:
                colliderMultiplier = 1.5;
        }
        return this.radius * colliderMultiplier;
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
     * Obtener datos para renderizado (MEJORADO con info de collider)
     */
    getRenderData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            radius: this.radius,
            colliderRadius: this.getColliderRadius(),
            ships: Math.floor(this.ships),
            maxShips: this.maxShips,
            owner: this.owner,
            size: this.size,
            isSelected: this.isSelected,
            isHovered: this.isHovered,
            color: this.getColor(),
            pulsePhase: this.pulsePhase,
            glowIntensity: this.glowIntensity,
            productionRate: this.productionRate
        };
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
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
            specialBonus: this.specialBonus
        };
    }
}

export default Planet; 