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
        
        // 🔧 NUEVO: Sistema de cola de lanzamiento progresivo
        this.launchQueue = {
            pendingWaves: [],
            isLaunching: false,
            lastLaunchTime: 0,
            launchInterval: 300, // 🔧 AUMENTADO: 300ms entre oleadas (era 200ms)
            maxConcurrentFleets: 2, // 🔧 REDUCIDO: Máximo 2 flotas cerca del planeta (era 3)
            currentNearbyFleets: 0
        };
        
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

        // 🔧 NUEVO: Procesar cola de lanzamiento progresivo
        this.processLaunchQueue();

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
     * 🔧 NUEVO: Procesar cola de lanzamiento progresivo
     */
    processLaunchQueue() {
        const now = Date.now();
        
        // Solo procesar si hay oleadas pendientes y ha pasado suficiente tiempo
        if (this.launchQueue.pendingWaves.length === 0) {
            this.launchQueue.isLaunching = false;
            return;
        }
        
        // Verificar si es momento de lanzar la siguiente oleada
        const timeSinceLastLaunch = now - this.launchQueue.lastLaunchTime;
        if (timeSinceLastLaunch < this.launchQueue.launchInterval) {
            return;
        }
        
        // Verificar si hay espacio para más flotas cerca del planeta
        if (this.launchQueue.currentNearbyFleets >= this.launchQueue.maxConcurrentFleets) {
            // Esperar a que se libere espacio
            return;
        }
        
        // Lanzar la siguiente oleada
        const nextWave = this.launchQueue.pendingWaves.shift();
        if (nextWave) {
            this.launchWaveNow(nextWave);
            this.launchQueue.lastLaunchTime = now;
            this.launchQueue.currentNearbyFleets++;
            
            console.log(`🚀 Lanzamiento progresivo: Oleada ${nextWave.waveIndex + 1}/${nextWave.totalWaves}, ${this.launchQueue.pendingWaves.length} oleadas restantes`);
        }
        
        // Si no hay más oleadas, marcar como no lanzando
        if (this.launchQueue.pendingWaves.length === 0) {
            this.launchQueue.isLaunching = false;
        }
    }
    
    /**
     * 🔧 NUEVO: Lanzar oleada inmediatamente
     */
    launchWaveNow(waveData) {
        // Emitir evento de lanzamiento de oleada
        eventBus.emit(GAME_EVENTS.FLEET_LAUNCHED, waveData.fleetData);
        
        if (this.debugMode) {
            console.log(`🚀 Oleada ${waveData.waveIndex + 1}/${waveData.totalWaves}: ${waveData.fleetData.ships} naves desde ${this.id} a ${waveData.fleetData.toPlanet}`);
        }
        
        // Si es la última oleada, emitir evento de lanzamiento completo
        if (waveData.waveIndex === waveData.totalWaves - 1) {
            eventBus.emit(GAME_EVENTS.FLEET_SWARM_COMPLETE, {
                fromPlanet: this.id,
                toPlanet: waveData.fleetData.toPlanet,
                totalShips: waveData.totalShipsInSwarm,
                totalWaves: waveData.totalWaves,
                fleets: [waveData.fleetData] // Solo la flota actual por ahora
            });
        }
    }
    
    /**
     * 🔧 NUEVO: Notificar que una flota se alejó del planeta
     */
    notifyFleetDeparted() {
        if (this.launchQueue.currentNearbyFleets > 0) {
            this.launchQueue.currentNearbyFleets--;
        }
    }

    sendFleet(targetPlanet, percentage = 0.5, targetClickX = null, targetClickY = null) {
        if (this.owner === 'neutral' || this.ships <= 1) {
            return null;
        }

        const totalShipsToSend = Math.floor(this.ships * percentage);
        if (totalShipsToSend <= 0) {
            return null;
        }

        // Reducir naves del planeta inmediatamente
        this.ships -= totalShipsToSend;

        // 🌊 CALCULAR OLEADAS DE ENJAMBRE
        const maxWaveSize = 6; // 🔧 REDUCIDO: Máximo 6 naves por oleada (era 8)
        const waves = [];
        
        for (let i = 0; i < totalShipsToSend; i += maxWaveSize) {
            const waveSize = Math.min(maxWaveSize, totalShipsToSend - i);
            waves.push(waveSize);
        }

        console.log(`🌊 Preparando ${totalShipsToSend} naves en ${waves.length} oleadas para lanzamiento progresivo: [${waves.join(', ')}]`);

        // 🔧 NUEVO: Agregar oleadas a la cola en lugar de setTimeout
        waves.forEach((waveSize, waveIndex) => {
            const fleetData = this.createWaveFleetData(
                targetPlanet, 
                waveSize, 
                waveIndex, 
                waves.length,
                totalShipsToSend
            );
            
            this.launchQueue.pendingWaves.push({
                waveIndex: waveIndex,
                totalWaves: waves.length,
                totalShipsInSwarm: totalShipsToSend,
                fleetData: fleetData
            });
        });

        // Iniciar procesamiento de cola si no está activo
        if (!this.launchQueue.isLaunching) {
            this.launchQueue.isLaunching = true;
            // Lanzar la primera oleada inmediatamente
            if (this.launchQueue.pendingWaves.length > 0) {
                const firstWave = this.launchQueue.pendingWaves.shift();
                this.launchWaveNow(firstWave);
                this.launchQueue.lastLaunchTime = Date.now();
                this.launchQueue.currentNearbyFleets++;
            }
        }

        // Retornar datos del primer lanzamiento para compatibilidad
        const firstFleetData = this.createWaveFleetData(
            targetPlanet, 
            waves[0], 
            0, 
            waves.length,
            totalShipsToSend
        );

        if (this.debugMode) {
            console.log(`🚀 Enjambre en cola desde ${this.id} a ${targetPlanet.id}: ${totalShipsToSend} naves en ${waves.length} oleadas`);
        }
        
        return firstFleetData;
    }

    /**
     * 🌊 Crear datos de flota para una oleada específica
     */
    createWaveFleetData(targetPlanet, waveSize, waveIndex, totalWaves, totalShips) {
        // 🔧 NUEVO: Calcular dirección hacia el planeta destino
        const directionToTarget = {
            x: targetPlanet.x - this.x,
            y: targetPlanet.y - this.y
        };
        const distanceToTarget = Math.sqrt(directionToTarget.x * directionToTarget.x + directionToTarget.y * directionToTarget.y);
        
        // Normalizar dirección
        const normalizedDirection = {
            x: directionToTarget.x / distanceToTarget,
            y: directionToTarget.y / distanceToTarget
        };
        
        // 🔧 MEJORADO: Sistema de posiciones de salida más inteligente
        const baseAngle = Math.atan2(normalizedDirection.y, normalizedDirection.x);
        
        // 🔧 NUEVO: Reducir variación angular para evitar enganche
        const maxAngleVariation = Math.PI / 12; // Reducido a 15 grados (era 30)
        
        // 🔧 NUEVO: Distribución más sistemática para evitar superposición
        const angleStep = (maxAngleVariation * 2) / Math.max(1, totalWaves - 1);
        const waveAngleOffset = (waveIndex - (totalWaves - 1) / 2) * angleStep;
        
        // 🔧 NUEVO: Distancia de salida escalonada para evitar colisiones
        const baseDistance = this.radius + 15; // Más distancia del borde
        const distanceVariation = waveIndex * 8; // Cada oleada más lejos
        const launchDistance = baseDistance + distanceVariation;
        
        const finalAngle = baseAngle + waveAngleOffset;
        
        // Calcular posición final de lanzamiento
        const launchX = this.x + Math.cos(finalAngle) * launchDistance;
        const launchY = this.y + Math.sin(finalAngle) * launchDistance;

        console.log(`🚀 Oleada ${waveIndex + 1}/${totalWaves}: Salida desde distancia ${launchDistance.toFixed(1)}px, ángulo ${(finalAngle * 180 / Math.PI).toFixed(1)}° hacia ${targetPlanet.id}`);

        return {
            id: `fleet_${Date.now()}_${waveIndex}_${Math.random().toString(36).substr(2, 9)}`,
            ships: waveSize,
            owner: this.owner,
            fromPlanet: this.id,
            toPlanet: targetPlanet.id,
            targetPlanet: targetPlanet,
            
            // 🔧 MEJORADO: Posiciones escalonadas para evitar enganche
            startX: launchX,
            startY: launchY,
            x: launchX,
            y: launchY,
            targetX: targetPlanet.x,
            targetY: targetPlanet.y,
            
            // Metadatos de enjambre
            waveIndex: waveIndex,
            totalWaves: totalWaves,
            totalShipsInSwarm: totalShips,
            isSwarmFleet: true,
            
            // Configuración de steering behaviors
            useSteeringBehaviors: true,
            formation: this.selectFormationForWave(waveIndex, totalWaves),
            
            launchTime: Date.now()
        };
    }

    /**
     * 🎯 Seleccionar formación para oleada específica
     */
    selectFormationForWave(waveIndex, totalWaves) {
        // Formaciones balanceadas según configuración probada
        const formations = ['spread', 'line', 'wedge', 'circle'];
        const probabilities = [0.4, 0.2, 0.2, 0.2]; // spread más común
        
        // Para oleadas múltiples, variar formaciones
        if (totalWaves > 1) {
            // Primera oleada: spread (más común)
            if (waveIndex === 0) return 'spread';
            
            // Oleadas intermedias: alternar
            const formationIndex = waveIndex % formations.length;
            return formations[formationIndex];
        }
        
        // Oleada única: selección aleatoria ponderada
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < formations.length; i++) {
            cumulative += probabilities[i];
            if (random <= cumulative) {
                return formations[i];
            }
        }
        
        return 'spread'; // fallback
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