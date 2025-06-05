/**
 * ⚔️ AI STRATEGY MANAGER
 * Ejecuta estrategias de combate, expansión y defensa
 * Responsabilidad única: Implementación de estrategias tácticas
 */

export class AIStrategyManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado de estrategias
        this.activeStrategies = new Map();
        this.strategyHistory = [];
        this.maxHistorySize = 50;
        
        // Métricas de estrategias
        this.strategyMetrics = {
            totalStrategies: 0,
            successfulStrategies: 0,
            failedStrategies: 0,
            expansionAttempts: 0,
            attackAttempts: 0,
            defenseAttempts: 0,
            reinforcementAttempts: 0
        };
        
        // Callbacks para comunicación con otros gestores
        this.callbacks = {};
        
        console.log('⚔️ AIStrategyManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * 🎯 Ejecutar estrategia basada en decisión
     */
    executeStrategy(decision) {
        const strategyId = this.generateStrategyId();
        
        console.log(`⚔️ Ejecutando estrategia: ${decision.type} (ID: ${strategyId})`);
        
        const strategy = {
            id: strategyId,
            type: decision.type,
            priority: decision.priority,
            timestamp: Date.now(),
            status: 'executing',
            targets: decision.targets || [],
            parameters: decision.parameters || {}
        };
        
        this.activeStrategies.set(strategyId, strategy);
        this.strategyMetrics.totalStrategies++;
        
        let result = false;
        
        try {
            switch (decision.type) {
                case 'expand':
                    result = this.executeExpansionStrategy(decision, strategyId);
                    break;
                case 'attack':
                    result = this.executeAttackStrategy(decision, strategyId);
                    break;
                case 'defend':
                    result = this.executeDefenseStrategy(decision, strategyId);
                    break;
                case 'reinforce':
                    result = this.executeReinforcementStrategy(decision, strategyId);
                    break;
                case 'aggressive_expand':
                    result = this.executeAggressiveExpansionStrategy(decision, strategyId);
                    break;
                default:
                    console.warn(`⚔️ Estrategia desconocida: ${decision.type}`);
                    result = false;
            }
            
            // Actualizar estado de la estrategia
            strategy.status = result ? 'completed' : 'failed';
            strategy.completedAt = Date.now();
            
            // Actualizar métricas
            if (result) {
                this.strategyMetrics.successfulStrategies++;
            } else {
                this.strategyMetrics.failedStrategies++;
            }
            
            // Mover a historial
            this.moveToHistory(strategy);
            
        } catch (error) {
            console.error(`⚔️ Error ejecutando estrategia ${decision.type}:`, error);
            strategy.status = 'error';
            strategy.error = error.message;
            this.strategyMetrics.failedStrategies++;
            this.moveToHistory(strategy);
        }
        
        return result;
    }

    /**
     * 🌍 Ejecutar estrategia de expansión
     */
    executeExpansionStrategy(decision, strategyId) {
        const aiPlanets = this.getAIPlanets();
        const neutralPlanets = this.getNeutralPlanets();
        
        if (neutralPlanets.length === 0) {
            console.log('⚔️ No hay planetas neutrales para expandir');
            return false;
        }
        
        this.strategyMetrics.expansionAttempts++;
        
        const targets = this.callbacks.findBestNeutralTargets?.(
            aiPlanets, 
            neutralPlanets, 
            this.config.maxTargets
        ) || [];
        
        if (targets.length === 0) {
            console.log('⚔️ No se encontraron objetivos viables para expansión');
            return false;
        }
        
        let successCount = 0;
        
        targets.forEach(targetData => {
            const success = this.expandToTarget(targetData, strategyId);
            if (success) successCount++;
        });
        
        console.log(`⚔️ Expansión completada: ${successCount}/${targets.length} objetivos`);
        return successCount > 0;
    }

    /**
     * ⚔️ Ejecutar estrategia de ataque
     */
    executeAttackStrategy(decision, strategyId) {
        const aiPlanets = this.getAIPlanets();
        const playerPlanets = this.getPlayerPlanets();
        
        if (playerPlanets.length === 0) {
            console.log('⚔️ No hay planetas enemigos para atacar');
            return false;
        }
        
        this.strategyMetrics.attackAttempts++;
        
        const targets = this.callbacks.findBestPlayerTargets?.(
            aiPlanets, 
            playerPlanets, 
            this.config.maxTargets
        ) || [];
        
        if (targets.length === 0) {
            console.log('⚔️ No se encontraron objetivos viables para ataque');
            return false;
        }
        
        let successCount = 0;
        
        targets.forEach(targetData => {
            const success = this.attackTarget(targetData, strategyId);
            if (success) successCount++;
        });
        
        console.log(`⚔️ Ataque completado: ${successCount}/${targets.length} objetivos`);
        return successCount > 0;
    }

    /**
     * 🛡️ Ejecutar estrategia de defensa
     */
    executeDefenseStrategy(decision, strategyId) {
        const aiPlanets = this.getAIPlanets();
        const threats = decision.threats || [];
        
        if (threats.length === 0) {
            console.log('⚔️ No hay amenazas inmediatas para defender');
            return false;
        }
        
        this.strategyMetrics.defenseAttempts++;
        
        let successCount = 0;
        
        threats.forEach(threat => {
            const success = this.defendAgainstThreat(threat, aiPlanets, strategyId);
            if (success) successCount++;
        });
        
        console.log(`⚔️ Defensa completada: ${successCount}/${threats.length} amenazas`);
        return successCount > 0;
    }

    /**
     * 🔧 Ejecutar estrategia de refuerzo
     */
    executeReinforcementStrategy(decision, strategyId) {
        const aiPlanets = this.getAIPlanets();
        const weakPlanets = aiPlanets.filter(p => p.ships < this.config.minShipsToDefend);
        
        if (weakPlanets.length === 0) {
            console.log('⚔️ No hay planetas que necesiten refuerzo');
            return false;
        }
        
        this.strategyMetrics.reinforcementAttempts++;
        
        let successCount = 0;
        
        weakPlanets.forEach(weakPlanet => {
            const success = this.reinforcePlanet(weakPlanet, aiPlanets, strategyId);
            if (success) successCount++;
        });
        
        console.log(`⚔️ Refuerzo completado: ${successCount}/${weakPlanets.length} planetas`);
        return successCount > 0;
    }

    /**
     * 🚀 Ejecutar estrategia de expansión agresiva
     */
    executeAggressiveExpansionStrategy(decision, strategyId) {
        const aiPlanets = this.getAIPlanets();
        const neutralPlanets = this.getNeutralPlanets();
        
        if (neutralPlanets.length === 0) {
            console.log('⚔️ No hay planetas neutrales para expansión agresiva');
            return false;
        }
        
        this.strategyMetrics.expansionAttempts++;
        
        // Expansión agresiva: más objetivos, mayor porcentaje de envío
        const maxTargets = Math.min(neutralPlanets.length, this.config.maxTargets * 2);
        const targets = this.callbacks.findBestNeutralTargets?.(
            aiPlanets, 
            neutralPlanets, 
            maxTargets
        ) || [];
        
        if (targets.length === 0) {
            console.log('⚔️ No se encontraron objetivos para expansión agresiva');
            return false;
        }
        
        let successCount = 0;
        
        targets.forEach(targetData => {
            // Usar porcentaje más alto para expansión agresiva
            const success = this.expandToTarget(targetData, strategyId, 0.9);
            if (success) successCount++;
        });
        
        console.log(`⚔️ Expansión agresiva completada: ${successCount}/${targets.length} objetivos`);
        return successCount > 0;
    }

    /**
     * 🎯 Expandir a objetivo específico
     */
    expandToTarget(targetData, strategyId, forcePercentage = null) {
        const { target, attacker } = targetData;
        const sendPercentage = forcePercentage || this.config.expandPercentage;
        
        if (!attacker || attacker.ships <= this.config.minShipsToAttack) {
            console.log(`⚔️ Atacante ${attacker?.id} no tiene suficientes naves`);
            return false;
        }
        
        try {
            const shipsToSend = Math.floor(attacker.ships * sendPercentage);
            
            if (shipsToSend < target.ships * 1.2) {
                console.log(`⚔️ Fuerza insuficiente para conquistar ${target.id}`);
                return false;
            }
            
            // Ejecutar envío de flota
            const success = attacker.sendFleet(target, sendPercentage);
            
            if (success) {
                console.log(`⚔️ Expansión: ${attacker.id} → ${target.id} (${shipsToSend} naves)`);
                
                // Notificar éxito
                this.callbacks.onExpansionExecuted?.({
                    strategyId,
                    attacker: attacker.id,
                    target: target.id,
                    shipsToSend,
                    percentage: sendPercentage
                });
            }
            
            return success;
            
        } catch (error) {
            console.error(`⚔️ Error expandiendo a ${target.id}:`, error);
            return false;
        }
    }

    /**
     * ⚔️ Atacar objetivo específico
     */
    attackTarget(targetData, strategyId) {
        const { target, attackers } = targetData;
        
        if (!attackers || attackers.length === 0) {
            console.log(`⚔️ No hay atacantes disponibles para ${target.id}`);
            return false;
        }
        
        let totalShipsSent = 0;
        let successfulAttackers = 0;
        
        attackers.forEach(attackerData => {
            const attacker = attackerData.planet || attackerData;
            
            if (attacker.ships > this.config.minShipsToAttack) {
                try {
                    const shipsToSend = Math.floor(attacker.ships * this.config.attackPercentage);
                    const success = attacker.sendFleet(target, this.config.attackPercentage);
                    
                    if (success) {
                        totalShipsSent += shipsToSend;
                        successfulAttackers++;
                        console.log(`⚔️ Ataque: ${attacker.id} → ${target.id} (${shipsToSend} naves)`);
                    }
                } catch (error) {
                    console.error(`⚔️ Error atacando desde ${attacker.id}:`, error);
                }
            }
        });
        
        if (successfulAttackers > 0) {
            // Notificar éxito
            this.callbacks.onAttackExecuted?.({
                strategyId,
                target: target.id,
                attackers: successfulAttackers,
                totalShips: totalShipsSent
            });
        }
        
        return successfulAttackers > 0;
    }

    /**
     * 🛡️ Defender contra amenaza
     */
    defendAgainstThreat(threat, aiPlanets, strategyId) {
        const { target, source } = threat;
        
        if (!target || target.owner !== 'ai') {
            return false;
        }
        
        // Encontrar planetas cercanos que puedan ayudar
        const reinforcers = aiPlanets.filter(planet => {
            const distance = this.calculateDistance(planet, target);
            return planet !== target && 
                   planet.ships > this.config.minShipsToDefend && 
                   distance < 250;
        });
        
        if (reinforcers.length === 0) {
            console.log(`⚔️ No hay refuerzos disponibles para defender ${target.id}`);
            return false;
        }
        
        let totalReinforcements = 0;
        let successfulReinforcements = 0;
        
        reinforcers.forEach(reinforcer => {
            try {
                const shipsToSend = Math.floor(reinforcer.ships * this.config.defendPercentage);
                const success = reinforcer.sendFleet(target, this.config.defendPercentage);
                
                if (success) {
                    totalReinforcements += shipsToSend;
                    successfulReinforcements++;
                    console.log(`⚔️ Defensa: ${reinforcer.id} → ${target.id} (${shipsToSend} naves)`);
                }
            } catch (error) {
                console.error(`⚔️ Error enviando refuerzos desde ${reinforcer.id}:`, error);
            }
        });
        
        if (successfulReinforcements > 0) {
            // Notificar éxito
            this.callbacks.onDefenseExecuted?.({
                strategyId,
                target: target.id,
                threat: source.id,
                reinforcements: successfulReinforcements,
                totalShips: totalReinforcements
            });
        }
        
        return successfulReinforcements > 0;
    }

    /**
     * 🔧 Reforzar planeta débil
     */
    reinforcePlanet(weakPlanet, aiPlanets, strategyId) {
        const reinforcers = aiPlanets.filter(planet => {
            const distance = this.calculateDistance(planet, weakPlanet);
            return planet !== weakPlanet && 
                   planet.ships > this.config.minShipsToAttack && 
                   distance < 300;
        });
        
        if (reinforcers.length === 0) {
            console.log(`⚔️ No hay refuerzos disponibles para ${weakPlanet.id}`);
            return false;
        }
        
        // Seleccionar el mejor refuerzo (más cercano con más naves)
        const bestReinforcer = reinforcers.reduce((best, current) => {
            const bestDistance = this.calculateDistance(best, weakPlanet);
            const currentDistance = this.calculateDistance(current, weakPlanet);
            const bestScore = best.ships / bestDistance;
            const currentScore = current.ships / currentDistance;
            
            return currentScore > bestScore ? current : best;
        });
        
        try {
            const shipsToSend = Math.floor(bestReinforcer.ships * this.config.reinforcePercentage);
            const success = bestReinforcer.sendFleet(weakPlanet, this.config.reinforcePercentage);
            
            if (success) {
                console.log(`⚔️ Refuerzo: ${bestReinforcer.id} → ${weakPlanet.id} (${shipsToSend} naves)`);
                
                // Notificar éxito
                this.callbacks.onReinforcementExecuted?.({
                    strategyId,
                    reinforcer: bestReinforcer.id,
                    target: weakPlanet.id,
                    shipsToSend
                });
            }
            
            return success;
            
        } catch (error) {
            console.error(`⚔️ Error reforzando ${weakPlanet.id}:`, error);
            return false;
        }
    }

    // ===== MÉTODOS AUXILIARES =====

    getAIPlanets() {
        return Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'ai');
    }

    getPlayerPlanets() {
        return Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'player');
    }

    getNeutralPlanets() {
        return Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'neutral');
    }

    calculateDistance(planet1, planet2) {
        const dx = planet1.x - planet2.x;
        const dy = planet1.y - planet2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    generateStrategyId() {
        return `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    moveToHistory(strategy) {
        this.activeStrategies.delete(strategy.id);
        this.strategyHistory.push(strategy);
        
        // Mantener tamaño del historial
        if (this.strategyHistory.length > this.maxHistorySize) {
            this.strategyHistory.shift();
        }
    }

    /**
     * 📊 Obtener estrategias activas
     */
    getActiveStrategies() {
        return Array.from(this.activeStrategies.values());
    }

    /**
     * 📈 Obtener estadísticas de estrategias
     */
    getStrategyStats() {
        const successRate = this.strategyMetrics.totalStrategies > 0 ? 
            this.strategyMetrics.successfulStrategies / this.strategyMetrics.totalStrategies : 0;
        
        return {
            ...this.strategyMetrics,
            successRate: successRate,
            activeStrategies: this.activeStrategies.size,
            historySize: this.strategyHistory.length
        };
    }

    /**
     * 📋 Obtener historial de estrategias
     */
    getStrategyHistory(limit = 10) {
        return this.strategyHistory
            .slice(-limit)
            .reverse();
    }

    /**
     * 🗑️ Destruir gestor
     */
    destroy() {
        this.activeStrategies.clear();
        this.strategyHistory = [];
        this.callbacks = {};
        console.log('⚔️ AIStrategyManager destruido');
    }
} 