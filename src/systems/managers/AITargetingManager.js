/**
 * 🎯 AI TARGETING MANAGER
 * Selección de objetivos y optimización de rutas de ataque
 * Responsabilidad única: Encontrar y priorizar objetivos óptimos
 */

export class AITargetingManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Cache de targeting
        this.targetCache = new Map();
        this.cacheTimeout = 2000; // 2 segundos
        this.lastTargetingTime = 0;
        
        // Historial de targeting
        this.targetingHistory = [];
        this.maxHistorySize = 30;
        
        // Métricas de targeting
        this.targetingMetrics = {
            totalTargetingOperations: 0,
            successfulTargets: 0,
            failedTargets: 0,
            averageTargetingTime: 0
        };
        
        console.log('🎯 AITargetingManager inicializado');
    }

    /**
     * 🎯 Encontrar mejores objetivos neutrales
     */
    findBestNeutralTargets(aiPlanets, neutralPlanets, maxTargets = 1) {
        const startTime = performance.now();
        
        // Verificar cache
        const cacheKey = `neutral_${maxTargets}_${neutralPlanets.length}`;
        if (this.isTargetCacheValid(cacheKey)) {
            return this.targetCache.get(cacheKey);
        }
        
        const targets = [];
        
        neutralPlanets.forEach(neutral => {
            const targetData = this.evaluateNeutralTarget(neutral, aiPlanets);
            if (targetData.viability > 0.3) {
                targets.push(targetData);
            }
        });
        
        // Ordenar por valor total y tomar los mejores
        const bestTargets = targets
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, maxTargets);
        
        // Guardar en cache
        this.targetCache.set(cacheKey, bestTargets);
        this.lastTargetingTime = Date.now();
        
        // Actualizar métricas
        this.updateTargetingMetrics(performance.now() - startTime);
        
        return bestTargets;
    }

    /**
     * ⚔️ Encontrar mejores objetivos del jugador
     */
    findBestPlayerTargets(aiPlanets, playerPlanets, maxTargets = 1) {
        const startTime = performance.now();
        
        // Verificar cache
        const cacheKey = `player_${maxTargets}_${playerPlanets.length}`;
        if (this.isTargetCacheValid(cacheKey)) {
            return this.targetCache.get(cacheKey);
        }
        
        const targets = [];
        
        playerPlanets.forEach(player => {
            const targetData = this.evaluatePlayerTarget(player, aiPlanets);
            if (targetData.viability > 0.4) {
                targets.push(targetData);
            }
        });
        
        // Ordenar por valor total y tomar los mejores
        const bestTargets = targets
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, maxTargets);
        
        // Guardar en cache
        this.targetCache.set(cacheKey, bestTargets);
        this.lastTargetingTime = Date.now();
        
        // Actualizar métricas
        this.updateTargetingMetrics(performance.now() - startTime);
        
        return bestTargets;
    }

    /**
     * 🚁 Encontrar mejores atacantes para un objetivo
     */
    findBestAttackers(aiPlanets, target, maxAttackers = 2) {
        const attackers = [];
        
        // Filtrar planetas con suficientes naves
        const viablePlanets = aiPlanets.filter(planet => 
            planet.ships > this.config.minShipsToAttack
        );
        
        // Evaluar cada planeta como atacante
        viablePlanets.forEach(planet => {
            const attackerData = this.evaluateAttacker(planet, target);
            if (attackerData.effectiveness > 0.3) {
                attackers.push(attackerData);
            }
        });
        
        // Optimizar combinación de atacantes
        return this.optimizeAttackerCombination(attackers, target, maxAttackers);
    }

    /**
     * 🎯 Evaluar objetivo neutral
     */
    evaluateNeutralTarget(neutral, aiPlanets) {
        const closestAI = this.findClosestPlanet(aiPlanets, neutral);
        
        if (!closestAI) {
            return { target: neutral, viability: 0, totalValue: 0 };
        }
        
        const distance = this.calculateDistance(closestAI, neutral);
        const difficulty = neutral.ships / Math.max(1, closestAI.ships);
        const strategicValue = this.calculateStrategicValue(neutral);
        const proximityBonus = this.calculateProximityBonus(neutral, aiPlanets);
        const riskFactor = this.calculateRiskFactor(neutral, aiPlanets);
        
        // Calcular viabilidad
        const viability = this.calculateViability(difficulty, distance, closestAI.ships);
        
        // Calcular valor total
        const totalValue = this.calculateTotalValue(
            strategicValue, proximityBonus, viability, riskFactor
        );
        
        return {
            target: neutral,
            attacker: closestAI,
            distance: distance,
            difficulty: difficulty,
            strategicValue: strategicValue,
            proximityBonus: proximityBonus,
            riskFactor: riskFactor,
            viability: viability,
            totalValue: totalValue,
            recommendedForce: Math.ceil(neutral.ships * 1.5),
            estimatedTime: distance / (closestAI.speed || 100)
        };
    }

    /**
     * ⚔️ Evaluar objetivo del jugador
     */
    evaluatePlayerTarget(player, aiPlanets) {
        const nearbyAI = this.findNearbyAIPlanets(player, aiPlanets, 300);
        
        if (nearbyAI.length === 0) {
            return { target: player, viability: 0, totalValue: 0 };
        }
        
        const totalNearbyStrength = nearbyAI.reduce((sum, p) => sum + p.ships, 0);
        const strengthRatio = totalNearbyStrength / Math.max(1, player.ships);
        const strategicValue = this.calculateStrategicValue(player);
        const threatLevel = this.calculateThreatLevel(player, aiPlanets);
        const coordinationBonus = this.calculateCoordinationBonus(nearbyAI);
        
        // Calcular viabilidad
        const viability = this.calculateAttackViability(strengthRatio, nearbyAI.length);
        
        // Calcular valor total
        const totalValue = this.calculateAttackValue(
            strategicValue, threatLevel, coordinationBonus, viability
        );
        
        return {
            target: player,
            attackers: nearbyAI.slice(0, this.config.maxAttackers),
            totalStrength: totalNearbyStrength,
            strengthRatio: strengthRatio,
            strategicValue: strategicValue,
            threatLevel: threatLevel,
            coordinationBonus: coordinationBonus,
            viability: viability,
            totalValue: totalValue,
            successProbability: this.calculateSuccessProbability(totalNearbyStrength, player.ships),
            estimatedLosses: this.estimateLosses(totalNearbyStrength, player.ships)
        };
    }

    /**
     * 🚁 Evaluar atacante individual
     */
    evaluateAttacker(attacker, target) {
        const distance = this.calculateDistance(attacker, target);
        const strength = attacker.ships;
        const efficiency = strength / Math.max(1, distance / 100);
        const availability = this.calculateAvailability(attacker);
        const positioning = this.calculatePositioning(attacker, target);
        
        const effectiveness = this.calculateAttackerEffectiveness(
            efficiency, availability, positioning
        );
        
        return {
            planet: attacker,
            distance: distance,
            strength: strength,
            efficiency: efficiency,
            availability: availability,
            positioning: positioning,
            effectiveness: effectiveness,
            recommendedContribution: this.calculateRecommendedContribution(attacker, target)
        };
    }

    /**
     * 🎯 Optimizar combinación de atacantes
     */
    optimizeAttackerCombination(attackers, target, maxAttackers) {
        if (attackers.length <= maxAttackers) {
            return attackers.sort((a, b) => b.effectiveness - a.effectiveness);
        }
        
        // Algoritmo greedy para seleccionar la mejor combinación
        const selected = [];
        const available = [...attackers].sort((a, b) => b.effectiveness - a.effectiveness);
        
        let totalStrength = 0;
        const requiredStrength = target.ships * this.config.strengthRatioAttack;
        
        for (let i = 0; i < maxAttackers && i < available.length; i++) {
            const attacker = available[i];
            selected.push(attacker);
            totalStrength += attacker.strength;
            
            // Si ya tenemos suficiente fuerza, podemos parar
            if (totalStrength >= requiredStrength) {
                break;
            }
        }
        
        return selected;
    }

    /**
     * 🗺️ Optimizar rutas de ataque
     */
    optimizeAttackRoutes(attackPlans) {
        const optimizedPlans = [];
        
        attackPlans.forEach(plan => {
            const optimizedPlan = {
                ...plan,
                routes: this.calculateOptimalRoutes(plan.attackers, plan.target),
                timing: this.calculateOptimalTiming(plan.attackers, plan.target),
                coordination: this.calculateCoordinationStrategy(plan.attackers)
            };
            
            optimizedPlans.push(optimizedPlan);
        });
        
        return optimizedPlans;
    }

    /**
     * 📊 Calcular rutas óptimas
     */
    calculateOptimalRoutes(attackers, target) {
        return attackers.map(attacker => {
            const directRoute = {
                type: 'direct',
                distance: this.calculateDistance(attacker.planet, target),
                time: this.calculateTravelTime(attacker.planet, target),
                risk: this.calculateRouteRisk(attacker.planet, target)
            };
            
            // Por ahora solo rutas directas, pero se puede expandir
            return {
                attacker: attacker.planet,
                target: target,
                recommendedRoute: directRoute,
                alternatives: []
            };
        });
    }

    /**
     * ⏰ Calcular timing óptimo
     */
    calculateOptimalTiming(attackers, target) {
        const travelTimes = attackers.map(attacker => 
            this.calculateTravelTime(attacker.planet, target)
        );
        
        const maxTime = Math.max(...travelTimes);
        const minTime = Math.min(...travelTimes);
        
        return {
            simultaneousArrival: maxTime,
            staggeredAttack: {
                firstWave: minTime,
                lastWave: maxTime,
                interval: (maxTime - minTime) / Math.max(1, attackers.length - 1)
            },
            recommendedStrategy: maxTime - minTime < 5000 ? 'simultaneous' : 'staggered'
        };
    }

    /**
     * 🤝 Calcular estrategia de coordinación
     */
    calculateCoordinationStrategy(attackers) {
        const totalStrength = attackers.reduce((sum, a) => sum + a.strength, 0);
        const averageDistance = attackers.reduce((sum, a) => sum + a.distance, 0) / attackers.length;
        
        return {
            type: attackers.length > 1 ? 'coordinated' : 'single',
            totalStrength: totalStrength,
            averageDistance: averageDistance,
            leaderPlanet: attackers.reduce((leader, current) => 
                current.effectiveness > leader.effectiveness ? current : leader
            ).planet,
            supportPlanets: attackers.filter(a => a !== attackers[0]).map(a => a.planet)
        };
    }

    // ===== MÉTODOS AUXILIARES =====

    calculateDistance(planet1, planet2) {
        const dx = planet1.x - planet2.x;
        const dy = planet1.y - planet2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findClosestPlanet(planets, target) {
        if (planets.length === 0) return null;
        
        return planets.reduce((closest, planet) => {
            const distance = this.calculateDistance(planet, target);
            const closestDistance = this.calculateDistance(closest, target);
            return distance < closestDistance ? planet : closest;
        });
    }

    findNearbyAIPlanets(target, aiPlanets, maxDistance) {
        return aiPlanets.filter(ai => 
            this.calculateDistance(target, ai) <= maxDistance
        );
    }

    calculateStrategicValue(planet) {
        const production = planet.production || 1;
        const maxShips = planet.maxShips || 50;
        const currentShips = planet.ships;
        
        const productionValue = production / 3;
        const capacityValue = maxShips / 100;
        const currentThreat = Math.min(1, currentShips / 30);
        
        return Math.max(0, Math.min(1,
            productionValue * 0.4 +
            capacityValue * 0.4 +
            currentThreat * 0.2
        ));
    }

    calculateProximityBonus(target, aiPlanets) {
        const nearbyAI = this.findNearbyAIPlanets(target, aiPlanets, 200);
        return Math.min(0.3, nearbyAI.length * 0.1);
    }

    calculateRiskFactor(target, aiPlanets) {
        const playerPlanets = this.gameEngine.getAllPlanets()
            .filter(p => p.owner === 'player');
        
        const nearbyEnemies = playerPlanets.filter(enemy => 
            this.calculateDistance(target, enemy) <= 150
        );
        
        return Math.min(1, nearbyEnemies.length * 0.2);
    }

    calculateViability(difficulty, distance, attackerStrength) {
        const difficultyFactor = Math.max(0, 1 - difficulty);
        const distanceFactor = Math.max(0, 1 - distance / 300);
        const strengthFactor = Math.min(1, attackerStrength / this.config.minShipsToAttack);
        
        return (difficultyFactor * 0.4 + distanceFactor * 0.3 + strengthFactor * 0.3);
    }

    calculateTotalValue(strategicValue, proximityBonus, viability, riskFactor) {
        return Math.max(0, Math.min(1,
            strategicValue * 0.3 +
            proximityBonus * 0.2 +
            viability * 0.4 +
            (1 - riskFactor) * 0.1
        ));
    }

    calculateThreatLevel(target, aiPlanets) {
        const nearbyAI = this.findNearbyAIPlanets(target, aiPlanets, 200);
        const totalNearbyStrength = nearbyAI.reduce((sum, p) => sum + p.ships, 0);
        
        return Math.min(1, target.ships / Math.max(1, totalNearbyStrength));
    }

    calculateCoordinationBonus(attackers) {
        if (attackers.length <= 1) return 0;
        
        const avgDistance = attackers.reduce((sum, a) => sum + a.distance, 0) / attackers.length;
        const coordination = Math.max(0, 1 - avgDistance / 200);
        
        return Math.min(0.2, attackers.length * 0.05 * coordination);
    }

    calculateAttackViability(strengthRatio, attackerCount) {
        const strengthFactor = Math.min(1, strengthRatio / this.config.strengthRatioAttack);
        const numberFactor = Math.min(1, attackerCount / 2);
        
        return strengthFactor * 0.7 + numberFactor * 0.3;
    }

    calculateAttackValue(strategicValue, threatLevel, coordinationBonus, viability) {
        return Math.max(0, Math.min(1,
            strategicValue * 0.3 +
            (1 - threatLevel) * 0.2 +
            coordinationBonus * 0.2 +
            viability * 0.3
        ));
    }

    calculateSuccessProbability(attackerStrength, defenderStrength) {
        const ratio = attackerStrength / Math.max(1, defenderStrength);
        
        if (ratio >= 2) return 0.9;
        if (ratio >= 1.5) return 0.75;
        if (ratio >= 1.2) return 0.6;
        if (ratio >= 1) return 0.45;
        return 0.2;
    }

    estimateLosses(attackerStrength, defenderStrength) {
        const ratio = attackerStrength / Math.max(1, defenderStrength);
        
        if (ratio >= 2) return Math.floor(defenderStrength * 0.3);
        if (ratio >= 1.5) return Math.floor(defenderStrength * 0.5);
        if (ratio >= 1.2) return Math.floor(defenderStrength * 0.7);
        if (ratio >= 1) return Math.floor(defenderStrength * 0.9);
        return Math.floor(attackerStrength * 0.8);
    }

    calculateAvailability(attacker) {
        // Verificar si el planeta está siendo atacado o tiene flotas en camino
        const incomingFleets = this.gameEngine.getAllFleets()
            .filter(f => f.target === attacker && f.owner !== 'ai');
        
        const availability = incomingFleets.length > 0 ? 0.5 : 1.0;
        return availability;
    }

    calculatePositioning(attacker, target) {
        const distance = this.calculateDistance(attacker, target);
        const optimalDistance = 150; // Distancia óptima
        
        return Math.max(0, 1 - Math.abs(distance - optimalDistance) / optimalDistance);
    }

    calculateAttackerEffectiveness(efficiency, availability, positioning) {
        return efficiency * 0.5 + availability * 0.3 + positioning * 0.2;
    }

    calculateRecommendedContribution(attacker, target) {
        const maxContribution = Math.floor(attacker.ships * this.config.attackPercentage);
        const requiredForTarget = Math.ceil(target.ships * this.config.strengthRatioAttack);
        
        return Math.min(maxContribution, requiredForTarget);
    }

    calculateTravelTime(from, to) {
        const distance = this.calculateDistance(from, to);
        const speed = from.speed || 100;
        return distance / speed;
    }

    calculateRouteRisk(from, to) {
        // Calcular riesgo basado en planetas enemigos en la ruta
        const playerPlanets = this.gameEngine.getAllPlanets()
            .filter(p => p.owner === 'player');
        
        let risk = 0;
        playerPlanets.forEach(enemy => {
            const distanceToRoute = this.calculateDistanceToLine(from, to, enemy);
            if (distanceToRoute < 100) {
                risk += 0.1;
            }
        });
        
        return Math.min(1, risk);
    }

    calculateDistanceToLine(start, end, point) {
        const A = point.x - start.x;
        const B = point.y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return this.calculateDistance(point, start);
        
        const param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = start.x;
            yy = start.y;
        } else if (param > 1) {
            xx = end.x;
            yy = end.y;
        } else {
            xx = start.x + param * C;
            yy = start.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isTargetCacheValid(cacheKey) {
        const now = Date.now();
        return this.targetCache.has(cacheKey) && 
               (now - this.lastTargetingTime) < this.cacheTimeout;
    }

    updateTargetingMetrics(operationTime) {
        this.targetingMetrics.totalTargetingOperations++;
        
        const totalTime = this.targetingMetrics.averageTargetingTime * 
                         (this.targetingMetrics.totalTargetingOperations - 1) + operationTime;
        
        this.targetingMetrics.averageTargetingTime = 
            totalTime / this.targetingMetrics.totalTargetingOperations;
    }

    /**
     * 📈 Obtener estadísticas de targeting
     */
    getTargetingStats() {
        return {
            ...this.targetingMetrics,
            cacheSize: this.targetCache.size,
            historySize: this.targetingHistory.length,
            cacheHitRate: this.targetingMetrics.totalTargetingOperations > 0 ? 
                         this.targetCache.size / this.targetingMetrics.totalTargetingOperations : 0
        };
    }

    /**
     * 🗑️ Destruir gestor
     */
    destroy() {
        this.targetCache.clear();
        this.targetingHistory = [];
        console.log('🎯 AITargetingManager destruido');
    }
} 