/**
 * 🤖 GALCON GAME - AI SYSTEM
 * Sistema de inteligencia artificial para el jugador AI
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';
import { AI_CONFIG } from '../config/BalanceConfig.js';

export class AISystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.lastDecisionTime = 0;
        
        // Usar nueva configuración más agresiva
        this.decisionInterval = AI_CONFIG.timing.decisionInterval; // 600ms (era 2000ms)
        this.isActive = true;
        
        // Configuración de comportamiento usando nueva config
        this.config = {
            aggressiveness: AI_CONFIG.behavior.aggressiveness,           // 0.85 (era 0.7)
            expansionPriority: AI_CONFIG.behavior.expansionPriority,     // 0.9 (era 0.8)
            riskTolerance: AI_CONFIG.behavior.riskTolerance,             // 0.7
            minShipsToAttack: AI_CONFIG.thresholds.minShipsToAttack,     // 8 (era 15)
            minShipsToDefend: AI_CONFIG.thresholds.minShipsToDefend,     // 5
            strengthRatioAttack: AI_CONFIG.thresholds.strengthRatioAttack, // 1.2
            strengthRatioDefend: AI_CONFIG.thresholds.strengthRatioDefend, // 0.6
            
            // Porcentajes de envío más agresivos
            attackPercentage: AI_CONFIG.sendPercentages.attack,         // 0.8 (era 0.6)
            expandPercentage: AI_CONFIG.sendPercentages.expand,         // 0.7
            reinforcePercentage: AI_CONFIG.sendPercentages.reinforce,   // 0.5
            defendPercentage: AI_CONFIG.sendPercentages.defend          // 0.4
        };
        
        this.setupEventListeners();
        console.log(`🤖 AISystem inicializado - Agresividad: ${this.config.aggressiveness}, Intervalo: ${this.decisionInterval}ms`);
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        eventBus.on(GAME_EVENTS.PLANET_CONQUERED, this.onPlanetConquered.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived.bind(this));
        eventBus.on(GAME_EVENTS.PLANET_PRODUCTION, this.onPlanetProduction.bind(this));
    }

    /**
     * Actualizar IA
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        const now = Date.now();
        if (now - this.lastDecisionTime > this.decisionInterval) {
            this.makeDecision();
            this.lastDecisionTime = now;
        }
    }

    /**
     * Tomar decisión principal (MEJORADO)
     */
    makeDecision() {
        const aiPlanets = this.getAIPlanets();
        const playerPlanets = this.getPlayerPlanets();
        const neutralPlanets = this.getNeutralPlanets();
        
        if (aiPlanets.length === 0) {
            console.log('🤖 IA sin planetas, no puede actuar');
            return;
        }

        // Evaluar situación con nueva lógica
        const situation = this.evaluateSituation(aiPlanets, playerPlanets, neutralPlanets);
        
        console.log(`🤖 IA evaluando situación: ${situation.type} (prioridad: ${situation.priority})`);
        
        // Tomar múltiples acciones si es muy agresiva
        if (this.config.aggressiveness > 0.8) {
            this.takeMultipleActions(aiPlanets, playerPlanets, neutralPlanets, situation);
        } else {
            this.takeSingleAction(aiPlanets, playerPlanets, neutralPlanets, situation);
        }
    }

    /**
     * Tomar múltiples acciones (NUEVO - para IA muy agresiva)
     */
    takeMultipleActions(aiPlanets, playerPlanets, neutralPlanets, primarySituation) {
        // Acción principal
        this.executeSituation(aiPlanets, playerPlanets, neutralPlanets, primarySituation);
        
        // Acciones secundarias si hay recursos
        const strongPlanets = aiPlanets.filter(p => p.ships > this.config.minShipsToAttack * 2);
        
        if (strongPlanets.length > 0) {
            // Expansión oportunista
            if (neutralPlanets.length > 0 && Math.random() < 0.6) {
                this.expandToNeutrals(strongPlanets, neutralPlanets, 0.4); // Menor porcentaje
            }
            
            // Ataques múltiples si somos fuertes
            if (playerPlanets.length > 0 && Math.random() < 0.4) {
                this.attackPlayer(strongPlanets, playerPlanets, 0.5); // Ataques secundarios
            }
        }
    }

    /**
     * Tomar acción única
     */
    takeSingleAction(aiPlanets, playerPlanets, neutralPlanets, situation) {
        this.executeSituation(aiPlanets, playerPlanets, neutralPlanets, situation);
    }

    /**
     * Ejecutar situación específica
     */
    executeSituation(aiPlanets, playerPlanets, neutralPlanets, situation) {
        switch (situation.type) {
            case 'expand':
                this.expandToNeutrals(aiPlanets, neutralPlanets, this.config.expandPercentage);
                break;
            case 'attack':
                this.attackPlayer(aiPlanets, playerPlanets, this.config.attackPercentage);
                break;
            case 'defend':
                this.defendPlanets(aiPlanets);
                break;
            case 'reinforce':
                this.reinforcePlanets(aiPlanets);
                break;
            case 'aggressive_expand':
                // Nueva estrategia: expansión muy agresiva
                this.aggressiveExpansion(aiPlanets, neutralPlanets);
                break;
        }
    }

    /**
     * Evaluar la situación actual (MEJORADO)
     */
    evaluateSituation(aiPlanets, playerPlanets, neutralPlanets) {
        const aiStrength = this.calculateTotalStrength(aiPlanets);
        const playerStrength = this.calculateTotalStrength(playerPlanets);
        const strengthRatio = aiStrength / (playerStrength + 1);
        
        console.log(`🤖 IA evaluando: AI=${aiStrength} vs Player=${playerStrength}, ratio=${strengthRatio.toFixed(2)}`);
        
        // Lógica más agresiva y persistente
        if (neutralPlanets.length > 0) {
            // Siempre priorizar expansión si hay neutrales
            if (strengthRatio > 0.6) {
                return { type: 'aggressive_expand', priority: 0.95 };
            } else {
                return { type: 'expand', priority: 0.9 };
            }
        }
        
        // Atacar con menor ventaja requerida
        if (strengthRatio > 1.0) {
            return { type: 'attack', priority: 0.85 };
        }
        
        // Si tenemos planetas con muchas naves, atacar de todas formas
        const strongPlanets = aiPlanets.filter(p => p.ships > this.config.minShipsToAttack * 2);
        if (strongPlanets.length > 0 && playerPlanets.length > 0) {
            return { type: 'attack', priority: 0.8 };
        }
        
        // Defender solo si estamos muy débiles
        if (strengthRatio < 0.3) {
            return { type: 'defend', priority: 0.7 };
        }
        
        // Por defecto, reforzar y preparar siguiente ataque
        return { type: 'reinforce', priority: 0.6 };
    }

    /**
     * Expansión agresiva (NUEVO)
     */
    aggressiveExpansion(aiPlanets, neutralPlanets) {
        if (neutralPlanets.length === 0) return;
        
        // Atacar múltiples neutrales simultáneamente
        const targets = neutralPlanets
            .sort((a, b) => a.ships - b.ships) // Más débiles primero
            .slice(0, Math.min(3, neutralPlanets.length)); // Hasta 3 objetivos
        
        targets.forEach(target => {
            const attackers = this.findBestAttackers(aiPlanets, target);
            attackers.forEach(attacker => {
                if (attacker.ships > this.config.minShipsToAttack) {
                    attacker.sendFleet(target, this.config.expandPercentage);
                    console.log(`🤖 IA expansión agresiva: ${attacker.id} → ${target.id}`);
                }
            });
        });
    }

    /**
     * Expandirse a planetas neutrales (MEJORADO)
     */
    expandToNeutrals(aiPlanets, neutralPlanets, percentage = null) {
        if (neutralPlanets.length === 0) return;
        
        const sendPercentage = percentage || this.config.expandPercentage;
        
        // Encontrar múltiples objetivos si somos agresivos
        const maxTargets = this.config.aggressiveness > 0.8 ? 2 : 1;
        const targets = this.findBestNeutralTargets(aiPlanets, neutralPlanets, maxTargets);
        
        targets.forEach(targetData => {
            const attackers = this.findBestAttackers(aiPlanets, targetData.target);
            attackers.forEach(attacker => {
                if (attacker.ships > this.config.minShipsToAttack) {
                    attacker.sendFleet(targetData.target, sendPercentage);
                    console.log(`🤖 IA expandiéndose: ${attacker.id} → ${targetData.target.id} (${Math.floor(sendPercentage*100)}%)`);
                }
            });
        });
    }

    /**
     * Atacar planetas del jugador (MEJORADO)
     */
    attackPlayer(aiPlanets, playerPlanets, percentage = null) {
        if (playerPlanets.length === 0) return;
        
        const sendPercentage = percentage || this.config.attackPercentage;
        
        // Encontrar múltiples objetivos si somos muy agresivos
        const maxTargets = this.config.aggressiveness > 0.8 ? 2 : 1;
        const targets = this.findBestPlayerTargets(aiPlanets, playerPlanets, maxTargets);
        
        targets.forEach(targetData => {
            const attackers = this.findBestAttackers(aiPlanets, targetData.target);
            attackers.forEach(attacker => {
                if (attacker.ships > this.config.minShipsToAttack) {
                    attacker.sendFleet(targetData.target, sendPercentage);
                    console.log(`🤖 IA atacando: ${attacker.id} → ${targetData.target.id} (${Math.floor(sendPercentage*100)}%)`);
                }
            });
        });
    }

    /**
     * Encontrar mejores objetivos neutrales (MEJORADO)
     */
    findBestNeutralTargets(aiPlanets, neutralPlanets, maxTargets = 1) {
        const targets = [];
        
        neutralPlanets.forEach(neutral => {
            const closestAI = this.findClosestPlanet(aiPlanets, neutral);
            if (!closestAI) return;
            
            const distance = this.calculateDistance(closestAI, neutral);
            const defensiveStrength = neutral.ships;
            
            // Puntuación mejorada
            const score = (neutral.maxShips / (defensiveStrength + 1)) / (distance / 100) * 
                         (1 + this.config.aggressiveness);
            
            targets.push({ target: neutral, attacker: closestAI, score });
        });
        
        return targets
            .sort((a, b) => b.score - a.score)
            .slice(0, maxTargets);
    }

    /**
     * Encontrar mejores objetivos del jugador (MEJORADO)
     */
    findBestPlayerTargets(aiPlanets, playerPlanets, maxTargets = 1) {
        const targets = [];
        
        playerPlanets.forEach(player => {
            const closestAI = this.findClosestPlanet(aiPlanets, player);
            if (!closestAI) return;
            
            const distance = this.calculateDistance(closestAI, player);
            const defensiveStrength = player.ships;
            const requiredStrength = defensiveStrength * this.config.strengthRatioAttack;
            
            // Solo atacar si tenemos suficiente fuerza
            if (closestAI.ships > requiredStrength) {
                const score = (player.maxShips / (defensiveStrength + 1)) / (distance / 100) * 
                             (1 + this.config.aggressiveness);
                
                targets.push({ target: player, attacker: closestAI, score });
            }
        });
        
        return targets
            .sort((a, b) => b.score - a.score)
            .slice(0, maxTargets);
    }

    /**
     * Event handler para producción de planetas (NUEVO)
     */
    onPlanetProduction(data) {
        if (data.owner === 'ai' && this.config.aggressiveness > 0.8) {
            // Si somos muy agresivos, considerar acción inmediata
            if (Math.random() < 0.3) { // 30% chance
                setTimeout(() => this.makeDecision(), 100);
            }
        }
    }

    // Métodos auxiliares existentes...
    getAIPlanets() {
        return Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'ai');
    }

    getPlayerPlanets() {
        return Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'player');
    }

    getNeutralPlanets() {
        return Array.from(this.gameEngine.planets.values()).filter(p => p.owner === 'neutral');
    }

    calculateTotalStrength(planets) {
        return planets.reduce((total, planet) => total + planet.ships, 0);
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

    findBestAttackers(aiPlanets, target) {
        return aiPlanets
            .filter(p => p.ships > this.config.minShipsToAttack)
            .sort((a, b) => {
                const distA = this.calculateDistance(a, target);
                const distB = this.calculateDistance(b, target);
                return distA - distB;
            })
            .slice(0, 2); // Máximo 2 atacantes por objetivo
    }

    defendPlanets(aiPlanets) {
        // Lógica de defensa básica
        console.log('🤖 IA en modo defensivo');
    }

    reinforcePlanets(aiPlanets) {
        // Lógica de refuerzo básica
        console.log('🤖 IA reforzando planetas');
    }

    onPlanetConquered(data) {
        if (data.newOwner === 'player') {
            console.log('🤖 IA: Planeta perdido, aumentando agresividad');
        }
    }

    onFleetArrived(data) {
        if (data.owner === 'ai') {
            console.log('🤖 IA: Flota llegó a destino');
        }
    }

    /**
     * Manejar pérdida de planeta (NUEVO - corrige error)
     */
    onPlanetLost(planetId) {
        console.log(`🤖 IA: Planeta ${planetId} perdido, aumentando agresividad`);
        
        // Aumentar agresividad temporalmente
        const oldAggressiveness = this.config.aggressiveness;
        this.config.aggressiveness = Math.min(1.0, this.config.aggressiveness + 0.1);
        
        // Reducir agresividad gradualmente
        setTimeout(() => {
            this.config.aggressiveness = oldAggressiveness;
        }, 30000); // 30 segundos
        
        // Tomar acción inmediata si es posible
        setTimeout(() => {
            this.makeDecision();
        }, 1000);
    }

    destroy() {
        this.isActive = false;
        console.log('🤖 AISystem destruido');
    }
}

export default AISystem; 