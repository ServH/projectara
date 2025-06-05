/**
 * 📊 AI ANALYSIS MANAGER
 * Analiza el estado del juego y genera reportes de situación
 * Responsabilidad única: Análisis y evaluación del estado del juego
 */

export class AIAnalysisManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Cache de análisis
        this.analysisCache = new Map();
        this.cacheTimeout = 1000; // 1 segundo
        this.lastAnalysisTime = 0;
        
        // Historial de análisis
        this.analysisHistory = [];
        this.maxHistorySize = 50;
        
        console.log('📊 AIAnalysisManager inicializado');
    }

    /**
     * 🎯 Analizar estado completo del juego
     */
    analyzeGameState() {
        const now = Date.now();
        
        // Verificar cache
        if (now - this.lastAnalysisTime < this.cacheTimeout && this.analysisCache.has('gameState')) {
            return this.analysisCache.get('gameState');
        }
        
        const analysis = {
            timestamp: now,
            planets: this.analyzePlanets(),
            fleets: this.analyzeFleets(),
            threats: this.analyzeThreats(),
            opportunities: this.analyzeOpportunities(),
            strategic: this.analyzeStrategicSituation(),
            recommendations: []
        };
        
        // Generar recomendaciones basadas en el análisis
        analysis.recommendations = this.generateRecommendations(analysis);
        
        // Guardar en cache e historial
        this.analysisCache.set('gameState', analysis);
        this.lastAnalysisTime = now;
        this.addToHistory(analysis);
        
        return analysis;
    }

    /**
     * 🪐 Analizar planetas
     */
    analyzePlanets() {
        const allPlanets = Array.from(this.gameEngine.planets.values());
        const aiPlanets = allPlanets.filter(p => p.owner === 'ai');
        const playerPlanets = allPlanets.filter(p => p.owner === 'player');
        const neutralPlanets = allPlanets.filter(p => p.owner === 'neutral');
        
        return {
            total: allPlanets.length,
            ai: {
                count: aiPlanets.length,
                planets: aiPlanets,
                totalShips: this.calculateTotalShips(aiPlanets),
                averageShips: this.calculateAverageShips(aiPlanets),
                production: this.calculateTotalProduction(aiPlanets),
                strongholds: this.findStrongholds(aiPlanets),
                vulnerable: this.findVulnerablePlanets(aiPlanets)
            },
            player: {
                count: playerPlanets.length,
                planets: playerPlanets,
                totalShips: this.calculateTotalShips(playerPlanets),
                averageShips: this.calculateAverageShips(playerPlanets),
                production: this.calculateTotalProduction(playerPlanets),
                strongholds: this.findStrongholds(playerPlanets),
                vulnerable: this.findVulnerablePlanets(playerPlanets)
            },
            neutral: {
                count: neutralPlanets.length,
                planets: neutralPlanets,
                totalShips: this.calculateTotalShips(neutralPlanets),
                averageShips: this.calculateAverageShips(neutralPlanets),
                easyTargets: this.findEasyTargets(neutralPlanets),
                valuableTargets: this.findValuableTargets(neutralPlanets)
            },
            ratios: {
                planetRatio: aiPlanets.length / Math.max(1, playerPlanets.length),
                strengthRatio: this.calculateTotalShips(aiPlanets) / Math.max(1, this.calculateTotalShips(playerPlanets)),
                productionRatio: this.calculateTotalProduction(aiPlanets) / Math.max(1, this.calculateTotalProduction(playerPlanets))
            }
        };
    }

    /**
     * 🚁 Analizar flotas
     */
    analyzeFleets() {
        const allFleets = Array.from(this.gameEngine.fleets.values());
        const aiFleets = allFleets.filter(f => f.owner === 'ai');
        const playerFleets = allFleets.filter(f => f.owner === 'player');
        
        return {
            ai: {
                count: aiFleets.length,
                fleets: aiFleets,
                totalShips: aiFleets.reduce((sum, f) => sum + f.ships, 0),
                inTransit: aiFleets.filter(f => !f.hasArrived),
                attacking: aiFleets.filter(f => f.target && f.target.owner === 'player'),
                expanding: aiFleets.filter(f => f.target && f.target.owner === 'neutral'),
                reinforcing: aiFleets.filter(f => f.target && f.target.owner === 'ai')
            },
            player: {
                count: playerFleets.length,
                fleets: playerFleets,
                totalShips: playerFleets.reduce((sum, f) => sum + f.ships, 0),
                inTransit: playerFleets.filter(f => !f.hasArrived),
                threatening: playerFleets.filter(f => f.target && f.target.owner === 'ai')
            },
            ratios: {
                fleetRatio: aiFleets.length / Math.max(1, playerFleets.length),
                fleetStrengthRatio: aiFleets.reduce((sum, f) => sum + f.ships, 0) / 
                                  Math.max(1, playerFleets.reduce((sum, f) => sum + f.ships, 0))
            }
        };
    }

    /**
     * ⚠️ Analizar amenazas
     */
    analyzeThreats() {
        const threats = [];
        const aiPlanets = Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'ai');
        const playerFleets = Array.from(this.gameEngine.fleets.values()).filter(f => f.owner === 'player');
        
        // Amenazas de flotas enemigas
        playerFleets.forEach(fleet => {
            if (fleet.target && fleet.target.owner === 'ai') {
                const threat = {
                    type: 'fleet_attack',
                    source: fleet,
                    target: fleet.target,
                    severity: this.calculateThreatSeverity(fleet, fleet.target),
                    timeToArrival: this.calculateTimeToArrival(fleet),
                    canDefend: this.canDefendPlanet(fleet.target, fleet.ships)
                };
                threats.push(threat);
            }
        });
        
        // Amenazas de planetas enemigos cercanos
        const playerPlanets = Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'player');
        aiPlanets.forEach(aiPlanet => {
            const nearbyEnemies = this.findNearbyEnemyPlanets(aiPlanet, playerPlanets, 200);
            nearbyEnemies.forEach(enemy => {
                if (enemy.ships > aiPlanet.ships * 0.8) {
                    const threat = {
                        type: 'nearby_enemy',
                        source: enemy,
                        target: aiPlanet,
                        severity: this.calculateProximityThreat(enemy, aiPlanet),
                        distance: this.calculateDistance(enemy, aiPlanet),
                        canCounter: this.canCounterThreat(aiPlanet, enemy)
                    };
                    threats.push(threat);
                }
            });
        });
        
        // Calcular nivel de amenaza general
        const threatLevel = this.calculateOverallThreatLevel(threats);
        
        return {
            threats: threats.sort((a, b) => b.severity - a.severity),
            threatLevel: threatLevel,
            immediateThreats: threats.filter(t => t.severity > 0.7),
            managedThreats: threats.filter(t => t.severity <= 0.7 && t.severity > 0.3),
            minorThreats: threats.filter(t => t.severity <= 0.3)
        };
    }

    /**
     * 🎯 Analizar oportunidades
     */
    analyzeOpportunities() {
        const opportunities = [];
        const aiPlanets = Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'ai');
        const neutralPlanets = Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'neutral');
        const playerPlanets = Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'player');
        
        // Oportunidades de expansión (planetas neutrales)
        neutralPlanets.forEach(neutral => {
            const closestAI = this.findClosestPlanet(aiPlanets, neutral);
            if (closestAI && closestAI.ships > neutral.ships * 1.5) {
                const opportunity = {
                    type: 'expansion',
                    target: neutral,
                    attacker: closestAI,
                    value: this.calculateExpansionValue(neutral, closestAI),
                    difficulty: neutral.ships / closestAI.ships,
                    distance: this.calculateDistance(closestAI, neutral)
                };
                opportunities.push(opportunity);
            }
        });
        
        // Oportunidades de ataque (planetas enemigos débiles)
        playerPlanets.forEach(player => {
            const nearbyAI = this.findNearbyAIPlanets(player, aiPlanets, 300);
            const totalNearbyStrength = nearbyAI.reduce((sum, p) => sum + p.ships, 0);
            
            if (totalNearbyStrength > player.ships * this.config.strengthRatioAttack) {
                const opportunity = {
                    type: 'attack',
                    target: player,
                    attackers: nearbyAI.filter(p => p.ships > this.config.minShipsToAttack),
                    value: this.calculateAttackValue(player, nearbyAI),
                    successProbability: this.calculateSuccessProbability(totalNearbyStrength, player.ships),
                    strategicValue: this.calculateStrategicValue(player)
                };
                opportunities.push(opportunity);
            }
        });
        
        // Oportunidades de refuerzo
        const weakAIPlanets = aiPlanets.filter(p => p.ships < this.config.minShipsToDefend);
        weakAIPlanets.forEach(weak => {
            const reinforcers = this.findPotentialReinforcers(weak, aiPlanets);
            if (reinforcers.length > 0) {
                const opportunity = {
                    type: 'reinforce',
                    target: weak,
                    reinforcers: reinforcers,
                    urgency: this.calculateReinforcementUrgency(weak),
                    value: this.calculateReinforcementValue(weak)
                };
                opportunities.push(opportunity);
            }
        });
        
        return {
            opportunities: opportunities.sort((a, b) => b.value - a.value),
            expansionOpportunities: opportunities.filter(o => o.type === 'expansion'),
            attackOpportunities: opportunities.filter(o => o.type === 'attack'),
            reinforcementOpportunities: opportunities.filter(o => o.type === 'reinforce'),
            bestOpportunity: opportunities.length > 0 ? opportunities[0] : null
        };
    }

    /**
     * 🎖️ Analizar situación estratégica
     */
    analyzeStrategicSituation() {
        const planets = this.analyzePlanets();
        const fleets = this.analyzeFleets();
        const threats = this.analyzeThreats();
        
        const situation = {
            phase: this.determineGamePhase(planets),
            momentum: this.calculateMomentum(planets, fleets),
            position: this.evaluatePosition(planets, threats),
            urgency: this.calculateUrgency(threats),
            confidence: this.calculateConfidence(planets, fleets, threats)
        };
        
        return situation;
    }

    /**
     * 💡 Generar recomendaciones
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        const { planets, threats, opportunities, strategic } = analysis;
        
        // Recomendaciones basadas en amenazas
        if (threats.threatLevel > 0.7) {
            recommendations.push({
                type: 'defensive',
                priority: 'high',
                action: 'defend',
                reason: 'Alto nivel de amenaza detectado',
                targets: threats.immediateThreats.map(t => t.target)
            });
        }
        
        // Recomendaciones basadas en oportunidades
        if (opportunities.bestOpportunity && opportunities.bestOpportunity.value > 0.6) {
            recommendations.push({
                type: 'offensive',
                priority: opportunities.bestOpportunity.type === 'attack' ? 'high' : 'medium',
                action: opportunities.bestOpportunity.type,
                reason: `Excelente oportunidad de ${opportunities.bestOpportunity.type}`,
                target: opportunities.bestOpportunity.target
            });
        }
        
        // Recomendaciones basadas en situación estratégica
        if (strategic.momentum < -0.3) {
            recommendations.push({
                type: 'strategic',
                priority: 'medium',
                action: 'reinforce',
                reason: 'Momentum negativo, necesario consolidar',
                targets: planets.ai.vulnerable
            });
        }
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // ===== MÉTODOS AUXILIARES =====

    calculateTotalShips(planets) {
        return planets.reduce((total, planet) => total + planet.ships, 0);
    }

    calculateAverageShips(planets) {
        return planets.length > 0 ? this.calculateTotalShips(planets) / planets.length : 0;
    }

    calculateTotalProduction(planets) {
        return planets.reduce((total, planet) => total + (planet.production || 1), 0);
    }

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

    findStrongholds(planets) {
        return planets
            .filter(p => p.ships > this.config.minShipsToAttack * 2)
            .sort((a, b) => b.ships - a.ships);
    }

    findVulnerablePlanets(planets) {
        return planets
            .filter(p => p.ships < this.config.minShipsToDefend)
            .sort((a, b) => a.ships - b.ships);
    }

    findEasyTargets(neutralPlanets) {
        return neutralPlanets
            .filter(p => p.ships < this.config.minShipsToAttack)
            .sort((a, b) => a.ships - b.ships);
    }

    findValuableTargets(neutralPlanets) {
        return neutralPlanets
            .filter(p => (p.maxShips || 50) > 40)
            .sort((a, b) => (b.maxShips || 50) - (a.maxShips || 50));
    }

    calculateThreatSeverity(fleet, target) {
        const fleetStrength = fleet.ships;
        const planetDefense = target.ships;
        const ratio = fleetStrength / Math.max(1, planetDefense);
        
        return Math.min(1, ratio * 0.5 + 0.2);
    }

    calculateTimeToArrival(fleet) {
        if (!fleet.target) return Infinity;
        
        const distance = this.calculateDistance(fleet, fleet.target);
        const speed = fleet.speed || 100;
        
        return distance / speed;
    }

    canDefendPlanet(planet, attackingShips) {
        const nearbyAI = this.findNearbyAIPlanets(planet, 
            Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'ai'), 
            200
        );
        
        const reinforcements = nearbyAI.reduce((sum, p) => sum + Math.floor(p.ships * 0.5), 0);
        
        return planet.ships + reinforcements > attackingShips * 1.2;
    }

    findNearbyEnemyPlanets(planet, enemyPlanets, maxDistance) {
        return enemyPlanets.filter(enemy => 
            this.calculateDistance(planet, enemy) <= maxDistance
        );
    }

    findNearbyAIPlanets(planet, aiPlanets, maxDistance) {
        return aiPlanets.filter(ai => 
            this.calculateDistance(planet, ai) <= maxDistance
        );
    }

    calculateOverallThreatLevel(threats) {
        if (threats.length === 0) return 0;
        
        const avgSeverity = threats.reduce((sum, t) => sum + t.severity, 0) / threats.length;
        const threatCount = Math.min(1, threats.length / 5);
        
        return Math.min(1, avgSeverity * 0.7 + threatCount * 0.3);
    }

    determineGamePhase(planets) {
        const totalPlanets = planets.total;
        const neutralCount = planets.neutral.count;
        const neutralRatio = neutralCount / totalPlanets;
        
        if (neutralRatio > 0.6) return 'early';
        if (neutralRatio > 0.2) return 'mid';
        return 'late';
    }

    calculateMomentum(planets, fleets) {
        // Momentum basado en cambios recientes
        const strengthRatio = planets.ratios.strengthRatio;
        const fleetRatio = fleets.ratios.fleetRatio;
        
        return (strengthRatio - 1) * 0.6 + (fleetRatio - 1) * 0.4;
    }

    evaluatePosition(planets, threats) {
        const strengthRatio = planets.ratios.strengthRatio;
        const threatLevel = threats.threatLevel;
        
        if (strengthRatio > 1.5 && threatLevel < 0.3) return 'dominant';
        if (strengthRatio > 1.2 && threatLevel < 0.5) return 'advantageous';
        if (strengthRatio > 0.8 && threatLevel < 0.7) return 'balanced';
        if (strengthRatio > 0.5) return 'disadvantageous';
        return 'critical';
    }

    calculateUrgency(threats) {
        const immediateThreats = threats.immediateThreats.length;
        const threatLevel = threats.threatLevel;
        
        return Math.min(1, immediateThreats * 0.3 + threatLevel * 0.7);
    }

    calculateConfidence(planets, fleets, threats) {
        const strengthRatio = planets.ratios.strengthRatio;
        const threatLevel = threats.threatLevel;
        const momentum = this.calculateMomentum(planets, fleets);
        
        return Math.max(0, Math.min(1, 
            strengthRatio * 0.4 + 
            (1 - threatLevel) * 0.3 + 
            (momentum + 1) * 0.15 + 
            0.15
        ));
    }

    addToHistory(analysis) {
        this.analysisHistory.push({
            timestamp: analysis.timestamp,
            summary: {
                strengthRatio: analysis.planets.ratios.strengthRatio,
                threatLevel: analysis.threats.threatLevel,
                opportunities: analysis.opportunities.opportunities.length,
                phase: analysis.strategic.phase,
                position: analysis.strategic.position
            }
        });
        
        // Mantener tamaño del historial
        if (this.analysisHistory.length > this.maxHistorySize) {
            this.analysisHistory.shift();
        }
    }

    // ===== MÉTODOS AUXILIARES ADICIONALES =====

    calculateProximityThreat(enemy, aiPlanet) {
        const distance = this.calculateDistance(enemy, aiPlanet);
        const strengthRatio = enemy.ships / Math.max(1, aiPlanet.ships);
        const proximityFactor = Math.max(0, 1 - distance / 300);
        
        return Math.min(1, strengthRatio * 0.6 + proximityFactor * 0.4);
    }

    canCounterThreat(aiPlanet, enemy) {
        const nearbyAI = this.findNearbyAIPlanets(aiPlanet, 
            Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'ai'), 
            250
        );
        
        const totalNearbyStrength = nearbyAI.reduce((sum, p) => sum + p.ships, 0);
        return totalNearbyStrength > enemy.ships * 1.3;
    }

    calculateExpansionValue(neutral, attacker) {
        const distance = this.calculateDistance(attacker, neutral);
        const difficulty = neutral.ships / Math.max(1, attacker.ships);
        const value = (neutral.maxShips || 50) / 50;
        const proximityBonus = Math.max(0, 1 - distance / 200);
        
        return Math.max(0, Math.min(1, 
            value * 0.4 + 
            (1 - difficulty) * 0.3 + 
            proximityBonus * 0.3
        ));
    }

    calculateAttackValue(player, nearbyAI) {
        const strategicValue = this.calculateStrategicValue(player);
        const strengthAdvantage = nearbyAI.reduce((sum, p) => sum + p.ships, 0) / Math.max(1, player.ships);
        const proximityBonus = nearbyAI.length > 1 ? 0.2 : 0;
        
        return Math.max(0, Math.min(1,
            strategicValue * 0.4 +
            Math.min(1, strengthAdvantage / 2) * 0.4 +
            proximityBonus * 0.2
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

    calculateStrategicValue(planet) {
        const production = planet.production || 1;
        const maxShips = planet.maxShips || 50;
        const currentShips = planet.ships;
        
        // Valor basado en producción y capacidad
        const productionValue = production / 3;
        const capacityValue = maxShips / 100;
        const currentThreat = Math.min(1, currentShips / 30);
        
        return Math.max(0, Math.min(1,
            productionValue * 0.4 +
            capacityValue * 0.4 +
            currentThreat * 0.2
        ));
    }

    findPotentialReinforcers(weakPlanet, aiPlanets) {
        return aiPlanets
            .filter(p => p !== weakPlanet && p.ships > this.config.minShipsToAttack)
            .filter(p => this.calculateDistance(p, weakPlanet) < 300)
            .sort((a, b) => {
                const distA = this.calculateDistance(a, weakPlanet);
                const distB = this.calculateDistance(b, weakPlanet);
                return distA - distB;
            })
            .slice(0, 3);
    }

    calculateReinforcementUrgency(weakPlanet) {
        const nearbyEnemies = this.findNearbyEnemyPlanets(
            weakPlanet,
            Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'player'),
            200
        );
        
        const threatLevel = nearbyEnemies.reduce((max, enemy) => {
            const threat = enemy.ships / Math.max(1, weakPlanet.ships);
            return Math.max(max, threat);
        }, 0);
        
        return Math.min(1, threatLevel);
    }

    calculateReinforcementValue(weakPlanet) {
        const strategicValue = this.calculateStrategicValue(weakPlanet);
        const urgency = this.calculateReinforcementUrgency(weakPlanet);
        const production = (weakPlanet.production || 1) / 3;
        
        return Math.max(0, Math.min(1,
            strategicValue * 0.4 +
            urgency * 0.4 +
            production * 0.2
        ));
    }

    /**
     * 📈 Obtener estadísticas de análisis
     */
    getAnalysisStats() {
        return {
            cacheSize: this.analysisCache.size,
            historySize: this.analysisHistory.length,
            lastAnalysisTime: this.lastAnalysisTime,
            cacheTimeout: this.cacheTimeout
        };
    }

    /**
     * 🗑️ Destruir gestor
     */
    destroy() {
        this.analysisCache.clear();
        this.analysisHistory = [];
        console.log('📊 AIAnalysisManager destruido');
    }
} 