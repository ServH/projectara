/**
 * 🧠 AI DECISION MANAGER
 * Toma decisiones estratégicas basadas en análisis del juego
 * Responsabilidad única: Lógica de toma de decisiones de alto nivel
 */

export class AIDecisionManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado de decisiones
        this.lastDecisionTime = 0;
        this.decisionHistory = [];
        this.maxHistorySize = 30;
        
        // Métricas de decisiones
        this.decisionMetrics = {
            totalDecisions: 0,
            decisionsByType: {
                expand: 0,
                attack: 0,
                defend: 0,
                reinforce: 0,
                aggressive_expand: 0
            },
            averageDecisionTime: 0,
            lastDecisionQuality: 0
        };
        
        // Callbacks para comunicación con otros gestores
        this.callbacks = {};
        
        console.log('🧠 AIDecisionManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * 🎯 Tomar decisión principal
     */
    makeDecision(analysis) {
        const startTime = performance.now();
        
        console.log('🧠 Analizando situación para tomar decisión...');
        
        // Evaluar situación actual
        const situation = this.evaluateSituation(analysis);
        
        // Generar opciones de decisión
        const options = this.generateDecisionOptions(analysis, situation);
        
        // Seleccionar mejor decisión
        const decision = this.selectBestDecision(options, situation);
        
        // Registrar decisión
        this.recordDecision(decision, analysis, performance.now() - startTime);
        
        console.log(`🧠 Decisión tomada: ${decision.type} (prioridad: ${decision.priority})`);
        
        return decision;
    }

    /**
     * 📊 Evaluar situación actual
     */
    evaluateSituation(analysis) {
        const { planets, threats, opportunities, strategic } = analysis;
        
        const situation = {
            // Métricas básicas
            strengthRatio: planets.ratios.strengthRatio,
            planetRatio: planets.ratios.planetRatio,
            threatLevel: threats.threatLevel,
            
            // Evaluación estratégica
            phase: strategic.phase,
            position: strategic.position,
            momentum: strategic.momentum,
            urgency: strategic.urgency,
            confidence: strategic.confidence,
            
            // Oportunidades disponibles
            hasExpansionOpportunities: opportunities.expansionOpportunities.length > 0,
            hasAttackOpportunities: opportunities.attackOpportunities.length > 0,
            hasReinforcementNeeds: opportunities.reinforcementOpportunities.length > 0,
            
            // Contexto temporal
            gamePhase: this.determineGamePhase(planets),
            timeToAct: this.calculateTimeToAct(threats),
            
            // Evaluación de recursos
            resourceAvailability: this.evaluateResourceAvailability(planets.ai),
            strategicAdvantage: this.calculateStrategicAdvantage(analysis)
        };
        
        return situation;
    }

    /**
     * 💡 Generar opciones de decisión
     */
    generateDecisionOptions(analysis, situation) {
        const options = [];
        
        // Opción: Expansión
        if (situation.hasExpansionOpportunities) {
            const expansionOption = this.createExpansionOption(analysis, situation);
            if (expansionOption.viability > 0.3) {
                options.push(expansionOption);
            }
        }
        
        // Opción: Ataque
        if (situation.hasAttackOpportunities) {
            const attackOption = this.createAttackOption(analysis, situation);
            if (attackOption.viability > 0.4) {
                options.push(attackOption);
            }
        }
        
        // Opción: Defensa
        if (situation.threatLevel > 0.5) {
            const defenseOption = this.createDefenseOption(analysis, situation);
            if (defenseOption.viability > 0.3) {
                options.push(defenseOption);
            }
        }
        
        // Opción: Refuerzo
        if (situation.hasReinforcementNeeds) {
            const reinforceOption = this.createReinforcementOption(analysis, situation);
            if (reinforceOption.viability > 0.2) {
                options.push(reinforceOption);
            }
        }
        
        // Opción: Expansión agresiva
        if (this.shouldConsiderAggressiveExpansion(situation)) {
            const aggressiveOption = this.createAggressiveExpansionOption(analysis, situation);
            if (aggressiveOption.viability > 0.4) {
                options.push(aggressiveOption);
            }
        }
        
        return options;
    }

    /**
     * 🎯 Seleccionar mejor decisión
     */
    selectBestDecision(options, situation) {
        if (options.length === 0) {
            return this.createDefaultDecision(situation);
        }
        
        // Aplicar modificadores de personalidad
        const modifiedOptions = this.applyPersonalityModifiers(options, situation);
        
        // Ordenar por valor total
        const sortedOptions = modifiedOptions.sort((a, b) => b.totalValue - a.totalValue);
        
        // Seleccionar la mejor opción
        const bestOption = sortedOptions[0];
        
        // Verificar si debemos tomar múltiples acciones
        if (this.shouldTakeMultipleActions(situation, sortedOptions)) {
            return this.createMultiActionDecision(sortedOptions, situation);
        }
        
        return this.createDecisionFromOption(bestOption, situation);
    }

    /**
     * 🌍 Crear opción de expansión
     */
    createExpansionOption(analysis, situation) {
        const { opportunities } = analysis;
        const expansionOpps = opportunities.expansionOpportunities;
        
        const baseValue = this.calculateExpansionValue(expansionOpps, situation);
        const urgency = situation.gamePhase === 'early' ? 0.8 : 0.4;
        const viability = this.calculateExpansionViability(expansionOpps, situation);
        
        return {
            type: 'expand',
            baseValue: baseValue,
            urgency: urgency,
            viability: viability,
            totalValue: baseValue * 0.4 + urgency * 0.3 + viability * 0.3,
            targets: expansionOpps.slice(0, this.config.maxTargets),
            reasoning: 'Oportunidades de expansión disponibles'
        };
    }

    /**
     * ⚔️ Crear opción de ataque
     */
    createAttackOption(analysis, situation) {
        const { opportunities } = analysis;
        const attackOpps = opportunities.attackOpportunities;
        
        const baseValue = this.calculateAttackValue(attackOpps, situation);
        const urgency = situation.position === 'advantageous' ? 0.7 : 0.5;
        const viability = this.calculateAttackViability(attackOpps, situation);
        
        return {
            type: 'attack',
            baseValue: baseValue,
            urgency: urgency,
            viability: viability,
            totalValue: baseValue * 0.5 + urgency * 0.2 + viability * 0.3,
            targets: attackOpps.slice(0, this.config.maxTargets),
            reasoning: 'Objetivos enemigos vulnerables detectados'
        };
    }

    /**
     * 🛡️ Crear opción de defensa
     */
    createDefenseOption(analysis, situation) {
        const { threats } = analysis;
        
        const baseValue = this.calculateDefenseValue(threats, situation);
        const urgency = Math.min(1, situation.threatLevel + 0.2);
        const viability = this.calculateDefenseViability(threats, situation);
        
        return {
            type: 'defend',
            baseValue: baseValue,
            urgency: urgency,
            viability: viability,
            totalValue: baseValue * 0.3 + urgency * 0.5 + viability * 0.2,
            threats: threats.immediateThreats,
            reasoning: 'Amenazas inmediatas requieren defensa'
        };
    }

    /**
     * 🔧 Crear opción de refuerzo
     */
    createReinforcementOption(analysis, situation) {
        const { opportunities } = analysis;
        const reinforceOpps = opportunities.reinforcementOpportunities;
        
        const baseValue = this.calculateReinforcementValue(reinforceOpps, situation);
        const urgency = situation.position === 'critical' ? 0.8 : 0.3;
        const viability = this.calculateReinforcementViability(reinforceOpps, situation);
        
        return {
            type: 'reinforce',
            baseValue: baseValue,
            urgency: urgency,
            viability: viability,
            totalValue: baseValue * 0.3 + urgency * 0.4 + viability * 0.3,
            targets: reinforceOpps,
            reasoning: 'Planetas débiles necesitan refuerzo'
        };
    }

    /**
     * 🚀 Crear opción de expansión agresiva
     */
    createAggressiveExpansionOption(analysis, situation) {
        const { opportunities } = analysis;
        const expansionOpps = opportunities.expansionOpportunities;
        
        const baseValue = this.calculateExpansionValue(expansionOpps, situation) * 1.3;
        const urgency = situation.momentum > 0.2 ? 0.9 : 0.6;
        const viability = this.calculateExpansionViability(expansionOpps, situation) * 0.8;
        
        return {
            type: 'aggressive_expand',
            baseValue: baseValue,
            urgency: urgency,
            viability: viability,
            totalValue: baseValue * 0.5 + urgency * 0.3 + viability * 0.2,
            targets: expansionOpps.slice(0, this.config.maxTargets * 2),
            reasoning: 'Momentum positivo permite expansión agresiva'
        };
    }

    /**
     * 🎭 Aplicar modificadores de personalidad
     */
    applyPersonalityModifiers(options, situation) {
        return options.map(option => {
            const modifiedOption = { ...option };
            
            // Modificadores basados en configuración
            switch (option.type) {
                case 'expand':
                case 'aggressive_expand':
                    modifiedOption.totalValue *= (1 + this.config.expansionPriority * 0.3);
                    break;
                case 'attack':
                    modifiedOption.totalValue *= (1 + this.config.aggressiveness * 0.4);
                    break;
                case 'defend':
                    modifiedOption.totalValue *= (1 + (1 - this.config.riskTolerance) * 0.3);
                    break;
                case 'reinforce':
                    modifiedOption.totalValue *= (1 + this.config.patience * 0.2);
                    break;
            }
            
            // Modificadores situacionales
            if (situation.position === 'critical') {
                if (option.type === 'defend' || option.type === 'reinforce') {
                    modifiedOption.totalValue *= 1.5;
                }
            }
            
            if (situation.position === 'dominant') {
                if (option.type === 'attack' || option.type === 'aggressive_expand') {
                    modifiedOption.totalValue *= 1.3;
                }
            }
            
            return modifiedOption;
        });
    }

    /**
     * 🎯 Crear decisión desde opción
     */
    createDecisionFromOption(option, situation) {
        return {
            type: option.type,
            priority: this.calculatePriority(option, situation),
            confidence: this.calculateConfidence(option, situation),
            targets: option.targets || [],
            threats: option.threats || [],
            parameters: {
                baseValue: option.baseValue,
                urgency: option.urgency,
                viability: option.viability,
                totalValue: option.totalValue,
                reasoning: option.reasoning
            },
            timestamp: Date.now(),
            situationSnapshot: {
                strengthRatio: situation.strengthRatio,
                threatLevel: situation.threatLevel,
                position: situation.position,
                phase: situation.phase
            }
        };
    }

    /**
     * 🔄 Verificar si tomar múltiples acciones
     */
    shouldTakeMultipleActions(situation, options) {
        return this.config.aggressiveness > this.config.multiActionThreshold &&
               situation.resourceAvailability > 0.7 &&
               options.length > 1 &&
               situation.position !== 'critical';
    }

    /**
     * 🎯 Crear decisión de múltiples acciones
     */
    createMultiActionDecision(options, situation) {
        const primaryAction = options[0];
        const secondaryActions = options.slice(1, 3); // Máximo 2 acciones secundarias
        
        return {
            type: primaryAction.type,
            priority: 'high',
            confidence: this.calculateConfidence(primaryAction, situation) * 0.8,
            targets: primaryAction.targets || [],
            threats: primaryAction.threats || [],
            secondaryActions: secondaryActions.map(action => ({
                type: action.type,
                targets: action.targets?.slice(0, 1) || [],
                priority: 'medium'
            })),
            parameters: {
                ...primaryAction,
                isMultiAction: true,
                reasoning: `Acción múltiple: ${primaryAction.type} + ${secondaryActions.map(a => a.type).join(', ')}`
            },
            timestamp: Date.now(),
            situationSnapshot: {
                strengthRatio: situation.strengthRatio,
                threatLevel: situation.threatLevel,
                position: situation.position,
                phase: situation.phase
            }
        };
    }

    /**
     * 🎯 Crear decisión por defecto
     */
    createDefaultDecision(situation) {
        // Si no hay opciones viables, reforzar o esperar
        return {
            type: 'reinforce',
            priority: 'low',
            confidence: 0.3,
            targets: [],
            threats: [],
            parameters: {
                reasoning: 'No hay opciones viables, consolidando posición',
                isDefault: true
            },
            timestamp: Date.now(),
            situationSnapshot: {
                strengthRatio: situation.strengthRatio,
                threatLevel: situation.threatLevel,
                position: situation.position,
                phase: situation.phase
            }
        };
    }

    // ===== MÉTODOS AUXILIARES =====

    determineGamePhase(planets) {
        const neutralRatio = planets.neutral.count / planets.total;
        
        if (neutralRatio > 0.6) return 'early';
        if (neutralRatio > 0.2) return 'mid';
        return 'late';
    }

    calculateTimeToAct(threats) {
        if (threats.immediateThreats.length > 0) return 0; // Actuar inmediatamente
        if (threats.managedThreats.length > 0) return 0.3;
        return 1.0; // Tiempo disponible
    }

    evaluateResourceAvailability(aiData) {
        const totalShips = aiData.totalShips;
        const strongholds = aiData.strongholds.length;
        const averageShips = aiData.averageShips;
        
        const shipsFactor = Math.min(1, totalShips / 100);
        const strongholdsFactor = Math.min(1, strongholds / 3);
        const averageFactor = Math.min(1, averageShips / 20);
        
        return (shipsFactor + strongholdsFactor + averageFactor) / 3;
    }

    calculateStrategicAdvantage(analysis) {
        const { planets, threats, opportunities } = analysis;
        
        const strengthAdvantage = Math.max(0, planets.ratios.strengthRatio - 1);
        const territoryAdvantage = Math.max(0, planets.ratios.planetRatio - 1);
        const opportunityAdvantage = opportunities.opportunities.length / 10;
        const threatDisadvantage = threats.threatLevel;
        
        return Math.max(0, Math.min(1,
            strengthAdvantage * 0.3 +
            territoryAdvantage * 0.3 +
            opportunityAdvantage * 0.2 -
            threatDisadvantage * 0.2
        ));
    }

    shouldConsiderAggressiveExpansion(situation) {
        return situation.hasExpansionOpportunities &&
               situation.resourceAvailability > 0.6 &&
               situation.threatLevel < 0.4 &&
               this.config.aggressiveness > 0.7;
    }

    calculateExpansionValue(opportunities, situation) {
        if (opportunities.length === 0) return 0;
        
        const avgValue = opportunities.reduce((sum, opp) => sum + opp.value, 0) / opportunities.length;
        const phaseBonus = situation.gamePhase === 'early' ? 0.3 : 0;
        
        return Math.min(1, avgValue + phaseBonus);
    }

    calculateExpansionViability(opportunities, situation) {
        if (opportunities.length === 0) return 0;
        
        const avgViability = opportunities.reduce((sum, opp) => sum + opp.viability, 0) / opportunities.length;
        const resourceFactor = situation.resourceAvailability;
        
        return avgViability * resourceFactor;
    }

    calculateAttackValue(opportunities, situation) {
        if (opportunities.length === 0) return 0;
        
        const avgValue = opportunities.reduce((sum, opp) => sum + opp.value, 0) / opportunities.length;
        const momentumBonus = Math.max(0, situation.momentum * 0.2);
        
        return Math.min(1, avgValue + momentumBonus);
    }

    calculateAttackViability(opportunities, situation) {
        if (opportunities.length === 0) return 0;
        
        const avgViability = opportunities.reduce((sum, opp) => sum + opp.viability, 0) / opportunities.length;
        const confidenceFactor = situation.confidence;
        
        return avgViability * confidenceFactor;
    }

    calculateDefenseValue(threats, situation) {
        const threatValue = threats.threatLevel;
        const urgencyBonus = situation.urgency * 0.3;
        
        return Math.min(1, threatValue + urgencyBonus);
    }

    calculateDefenseViability(threats, situation) {
        const resourceFactor = situation.resourceAvailability;
        const positionFactor = situation.position === 'critical' ? 0.5 : 1.0;
        
        return resourceFactor * positionFactor;
    }

    calculateReinforcementValue(opportunities, situation) {
        if (opportunities.length === 0) return 0;
        
        const avgValue = opportunities.reduce((sum, opp) => sum + opp.value, 0) / opportunities.length;
        const stabilityBonus = situation.position === 'critical' ? 0.4 : 0.1;
        
        return Math.min(1, avgValue + stabilityBonus);
    }

    calculateReinforcementViability(opportunities, situation) {
        if (opportunities.length === 0) return 0;
        
        const resourceFactor = situation.resourceAvailability;
        const urgencyFactor = 1 - situation.urgency * 0.3;
        
        return resourceFactor * urgencyFactor;
    }

    calculatePriority(option, situation) {
        if (option.totalValue > 0.8) return 'high';
        if (option.totalValue > 0.5) return 'medium';
        return 'low';
    }

    calculateConfidence(option, situation) {
        const baseConfidence = option.viability;
        const situationConfidence = situation.confidence;
        
        return (baseConfidence + situationConfidence) / 2;
    }

    recordDecision(decision, analysis, decisionTime) {
        // Actualizar métricas
        this.decisionMetrics.totalDecisions++;
        this.decisionMetrics.decisionsByType[decision.type]++;
        
        const totalTime = this.decisionMetrics.averageDecisionTime * 
                         (this.decisionMetrics.totalDecisions - 1) + decisionTime;
        this.decisionMetrics.averageDecisionTime = 
            totalTime / this.decisionMetrics.totalDecisions;
        
        this.decisionMetrics.lastDecisionQuality = decision.confidence;
        
        // Agregar al historial
        this.decisionHistory.push({
            decision: decision,
            analysis: {
                strengthRatio: analysis.planets.ratios.strengthRatio,
                threatLevel: analysis.threats.threatLevel,
                opportunities: analysis.opportunities.opportunities.length
            },
            decisionTime: decisionTime,
            timestamp: Date.now()
        });
        
        // Mantener tamaño del historial
        if (this.decisionHistory.length > this.maxHistorySize) {
            this.decisionHistory.shift();
        }
        
        this.lastDecisionTime = Date.now();
    }

    /**
     * 📈 Obtener estadísticas de decisiones
     */
    getDecisionStats() {
        return {
            ...this.decisionMetrics,
            historySize: this.decisionHistory.length,
            lastDecisionTime: this.lastDecisionTime
        };
    }

    /**
     * 📋 Obtener historial de decisiones
     */
    getDecisionHistory(limit = 10) {
        return this.decisionHistory
            .slice(-limit)
            .reverse();
    }

    /**
     * 🗑️ Destruir gestor
     */
    destroy() {
        this.decisionHistory = [];
        this.callbacks = {};
        console.log('🧠 AIDecisionManager destruido');
    }
} 