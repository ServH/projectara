/**
 * 🤖 AI SYSTEM - REFACTORIZADO
 * Sistema de IA modular con arquitectura SOLID
 * Coordinador principal que integra gestores especializados
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';
import { AIConfigurationManager } from './managers/AIConfigurationManager.js';
import { AIAnalysisManager } from './managers/AIAnalysisManager.js';
import { AIDecisionManager } from './managers/AIDecisionManager.js';
import { AITargetingManager } from './managers/AITargetingManager.js';
import { AIStrategyManager } from './managers/AIStrategyManager.js';

export class AISystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Gestores especializados (Dependency Injection)
        this.configurationManager = null;
        this.analysisManager = null;
        this.decisionManager = null;
        this.targetingManager = null;
        this.strategyManager = null;
        
        // Estado del sistema
        this.isInitialized = false;
        this.isActive = true;
        this.lastDecisionTime = 0;
        
        // Métricas del sistema
        this.systemMetrics = {
            totalUpdates: 0,
            totalDecisions: 0,
            averageUpdateTime: 0,
            lastPerformanceCheck: 0
        };
        
        console.log('🤖 AISystem (Refactorizado) inicializado');
        this.init();
    }

    /**
     * 🚀 Inicializar el sistema
     */
    init() {
        try {
            // Crear gestores especializados
            this.createManagers();
            
            // Configurar callbacks entre gestores
            this.setupManagerCallbacks();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('🚀 AISystem inicializado exitosamente');
            
        } catch (error) {
            console.error('❌ Error inicializando AISystem:', error);
            this.isActive = false;
        }
    }

    /**
     * 🏗️ Crear gestores especializados
     */
    createManagers() {
        // Configuration Manager - Configuración y personalidad
        this.configurationManager = new AIConfigurationManager(this.gameEngine);
        
        // Analysis Manager - Análisis del estado del juego
        this.analysisManager = new AIAnalysisManager(
            this.gameEngine, 
            this.configurationManager.getConfig()
        );
        
        // Decision Manager - Toma de decisiones estratégicas
        this.decisionManager = new AIDecisionManager(
            this.gameEngine, 
            this.configurationManager.getConfig()
        );
        
        // Targeting Manager - Selección de objetivos
        this.targetingManager = new AITargetingManager(
            this.gameEngine, 
            this.configurationManager.getConfig()
        );
        
        // Strategy Manager - Ejecución de estrategias
        this.strategyManager = new AIStrategyManager(
            this.gameEngine, 
            this.configurationManager.getConfig()
        );
        
        console.log('🏗️ Gestores especializados creados');
    }

    /**
     * 🔗 Configurar callbacks entre gestores
     */
    setupManagerCallbacks() {
        // Decision Manager callbacks
        this.decisionManager.setCallbacks({
            findBestNeutralTargets: this.targetingManager.findBestNeutralTargets.bind(this.targetingManager),
            findBestPlayerTargets: this.targetingManager.findBestPlayerTargets.bind(this.targetingManager),
            findBestAttackers: this.targetingManager.findBestAttackers.bind(this.targetingManager)
        });

        // Strategy Manager callbacks
        this.strategyManager.setCallbacks({
            findBestNeutralTargets: this.targetingManager.findBestNeutralTargets.bind(this.targetingManager),
            findBestPlayerTargets: this.targetingManager.findBestPlayerTargets.bind(this.targetingManager),
            findBestAttackers: this.targetingManager.findBestAttackers.bind(this.targetingManager),
            onExpansionExecuted: this.handleExpansionExecuted.bind(this),
            onAttackExecuted: this.handleAttackExecuted.bind(this),
            onDefenseExecuted: this.handleDefenseExecuted.bind(this),
            onReinforcementExecuted: this.handleReinforcementExecuted.bind(this)
        });

        console.log('🔗 Callbacks entre gestores configurados');
    }

    /**
     * 📡 Configurar event listeners
     */
    setupEventListeners() {
        eventBus.on(GAME_EVENTS.PLANET_CONQUERED, this.onPlanetConquered.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived.bind(this));
        eventBus.on(GAME_EVENTS.PLANET_PRODUCTION, this.onPlanetProduction.bind(this));
        
        console.log('📡 Event listeners configurados');
    }

    /**
     * 🔄 Actualizar IA
     */
    update(deltaTime) {
        if (!this.isActive || !this.isInitialized) return;
        
        const startTime = performance.now();
        
        try {
            // Verificar si es momento de tomar una decisión
            if (this.shouldMakeDecision()) {
                this.executeDecisionCycle();
            }
            
            // Actualizar métricas del sistema
            this.updateSystemMetrics(performance.now() - startTime);
            
        } catch (error) {
            console.error('❌ Error en update de AISystem:', error);
        }
    }

    /**
     * 🎯 Verificar si debe tomar decisión
     */
    shouldMakeDecision() {
        const now = Date.now();
        const config = this.configurationManager.getConfig();
        
        return (now - this.lastDecisionTime) > config.decisionInterval;
    }

    /**
     * 🧠 Ejecutar ciclo de decisión
     */
    executeDecisionCycle() {
        console.log('🧠 Iniciando ciclo de decisión de IA');
        
        try {
            // 1. Analizar estado del juego
            const analysis = this.analysisManager.analyzeGameState();
            
            // 2. Adaptar configuración si es necesario
            this.adaptConfiguration(analysis);
            
            // 3. Tomar decisión estratégica
            const decision = this.decisionManager.makeDecision(analysis);
            
            // 4. Ejecutar estrategia
            const success = this.strategyManager.executeStrategy(decision);
            
            // 5. Registrar resultado
            this.recordDecisionResult(decision, success, analysis);
            
            this.lastDecisionTime = Date.now();
            this.systemMetrics.totalDecisions++;
            
            console.log(`🧠 Ciclo de decisión completado: ${decision.type} (éxito: ${success})`);
            
        } catch (error) {
            console.error('❌ Error en ciclo de decisión:', error);
        }
    }

    /**
     * 🎛️ Adaptar configuración basada en análisis
     */
    adaptConfiguration(analysis) {
        const situationAnalysis = {
            strengthRatio: analysis.planets.ratios.strengthRatio,
            planetRatio: analysis.planets.ratios.planetRatio,
            threatLevel: analysis.threats.threatLevel
        };
        
        const adapted = this.configurationManager.adaptToSituation(situationAnalysis);
        
        if (adapted) {
            // Actualizar configuración en otros gestores
            const newConfig = this.configurationManager.getConfig();
            this.updateManagerConfigurations(newConfig);
        }
    }

    /**
     * 🔧 Actualizar configuraciones de gestores
     */
    updateManagerConfigurations(newConfig) {
        // Actualizar configuración en gestores que la necesiten
        this.analysisManager.config = newConfig;
        this.decisionManager.config = newConfig;
        this.targetingManager.config = newConfig;
        this.strategyManager.config = newConfig;
    }

    /**
     * 📊 Registrar resultado de decisión
     */
    recordDecisionResult(decision, success, analysis) {
        // Aquí se podría implementar aprendizaje o ajustes basados en resultados
        if (!success && decision.priority === 'high') {
            console.warn(`⚠️ Decisión de alta prioridad falló: ${decision.type}`);
            
            // Aumentar agresividad temporalmente si fallan decisiones importantes
            if (decision.type === 'attack' || decision.type === 'expand') {
                this.configurationManager.updateAggressiveness(0.1, 15000);
            }
        }
    }

    // ===== EVENT HANDLERS =====

    /**
     * 🏆 Manejar conquista de planeta
     */
    onPlanetConquered(data) {
        if (data.newOwner === 'player') {
            console.log('🤖 IA: Planeta perdido, aumentando agresividad');
            this.configurationManager.updateAggressiveness(0.15, 30000);
            
            // Tomar decisión inmediata si es crítico
            setTimeout(() => {
                if (this.isActive) {
                    this.executeDecisionCycle();
                }
            }, 1000);
        } else if (data.newOwner === 'ai') {
            console.log('🤖 IA: Planeta conquistado exitosamente');
        }
    }

    /**
     * 🚁 Manejar llegada de flota
     */
    onFleetArrived(data) {
        if (data.owner === 'ai') {
            console.log(`🤖 IA: Flota llegó a ${data.targetId}`);
        }
    }

    /**
     * 🏭 Manejar producción de planeta
     */
    onPlanetProduction(data) {
        // Podría usarse para análisis de economía
    }

    // ===== STRATEGY EXECUTION HANDLERS =====

    /**
     * 🌍 Manejar expansión ejecutada
     */
    handleExpansionExecuted(data) {
        console.log(`🌍 Expansión ejecutada: ${data.attacker} → ${data.target}`);
        
        // Emitir evento para otros sistemas
        eventBus.emit('ai:expansion_executed', data);
    }

    /**
     * ⚔️ Manejar ataque ejecutado
     */
    handleAttackExecuted(data) {
        console.log(`⚔️ Ataque ejecutado contra ${data.target} con ${data.attackers} atacantes`);
        
        // Emitir evento para otros sistemas
        eventBus.emit('ai:attack_executed', data);
    }

    /**
     * 🛡️ Manejar defensa ejecutada
     */
    handleDefenseExecuted(data) {
        console.log(`🛡️ Defensa ejecutada para ${data.target} contra ${data.threat}`);
        
        // Emitir evento para otros sistemas
        eventBus.emit('ai:defense_executed', data);
    }

    /**
     * 🔧 Manejar refuerzo ejecutado
     */
    handleReinforcementExecuted(data) {
        console.log(`🔧 Refuerzo ejecutado: ${data.reinforcer} → ${data.target}`);
        
        // Emitir evento para otros sistemas
        eventBus.emit('ai:reinforcement_executed', data);
    }

    // ===== MÉTODOS AUXILIARES =====

    /**
     * 📊 Actualizar métricas del sistema
     */
    updateSystemMetrics(updateTime) {
        this.systemMetrics.totalUpdates++;
        
        const totalTime = this.systemMetrics.averageUpdateTime * 
                         (this.systemMetrics.totalUpdates - 1) + updateTime;
        
        this.systemMetrics.averageUpdateTime = 
            totalTime / this.systemMetrics.totalUpdates;
        
        // Verificar rendimiento cada 100 updates
        if (this.systemMetrics.totalUpdates % 100 === 0) {
            this.performanceCheck();
        }
    }

    /**
     * ⚡ Verificar rendimiento
     */
    performanceCheck() {
        const avgTime = this.systemMetrics.averageUpdateTime;
        
        if (avgTime > 10) { // Más de 10ms promedio
            console.warn(`⚠️ AISystem rendimiento degradado: ${avgTime.toFixed(2)}ms promedio`);
        }
        
        this.systemMetrics.lastPerformanceCheck = Date.now();
    }

    /**
     * 📈 Obtener información de debug
     */
    getDebugInfo() {
        const config = this.configurationManager.getConfig();
        const personality = this.configurationManager.getPersonalityProfile();
        
        return {
            // Estado del sistema
            isActive: this.isActive,
            isInitialized: this.isInitialized,
            lastDecisionTime: this.lastDecisionTime,
            
            // Configuración actual
            configuration: {
                aggressiveness: config.aggressiveness,
                expansionPriority: config.expansionPriority,
                riskTolerance: config.riskTolerance,
                decisionInterval: config.decisionInterval
            },
            
            // Personalidad
            personality: personality,
            
            // Métricas del sistema
            systemMetrics: this.systemMetrics,
            
            // Estadísticas de gestores
            managerStats: {
                analysis: this.analysisManager.getAnalysisStats(),
                decisions: this.decisionManager.getDecisionStats(),
                targeting: this.targetingManager.getTargetingStats(),
                strategies: this.strategyManager.getStrategyStats(),
                configuration: this.configurationManager.getAdaptationStats()
            }
        };
    }

    /**
     * 🎛️ Actualizar configuración
     */
    updateConfig(newConfig) {
        const success = this.configurationManager.updateConfig(newConfig);
        
        if (success) {
            this.updateManagerConfigurations(this.configurationManager.getConfig());
            console.log('🎛️ Configuración de IA actualizada');
        }
        
        return success;
    }

    /**
     * 🔄 Resetear configuración
     */
    resetConfiguration() {
        this.configurationManager.resetToOriginal();
        this.updateManagerConfigurations(this.configurationManager.getConfig());
        console.log('🔄 Configuración de IA reseteada');
    }

    /**
     * ⏸️ Pausar IA
     */
    pause() {
        this.isActive = false;
        console.log('⏸️ IA pausada');
    }

    /**
     * ▶️ Reanudar IA
     */
    resume() {
        this.isActive = true;
        console.log('▶️ IA reanudada');
    }

    /**
     * 🗑️ Destruir sistema
     */
    destroy() {
        this.isActive = false;
        
        // Destruir gestores
        if (this.configurationManager) this.configurationManager.destroy();
        if (this.analysisManager) this.analysisManager.destroy();
        if (this.decisionManager) this.decisionManager.destroy();
        if (this.targetingManager) this.targetingManager.destroy();
        if (this.strategyManager) this.strategyManager.destroy();
        
        // Limpiar referencias
        this.configurationManager = null;
        this.analysisManager = null;
        this.decisionManager = null;
        this.targetingManager = null;
        this.strategyManager = null;
        
        console.log('🗑️ AISystem destruido');
    }

    update(deltaTime) {
        if (!this.enabled) return;
        
        try {
            // Actualizar configuración de IA
            if (this.aiConfigurationManager) {
                this.aiConfigurationManager.update(deltaTime);
            }
            
            // Ejecutar decisiones de IA
            if (this.aiDecisionManager) {
                this.aiDecisionManager.makeDecisions(deltaTime);
            }
            
            // Actualizar targeting
            if (this.aiTargetingManager) {
                this.aiTargetingManager.updateTargets(deltaTime);
            }
            
        } catch (error) {
            console.error('Error en AISystem update:', error);
        }
    }

    enable() {
        this.enabled = true;
        console.log('AISystem habilitado');
    }

    disable() {
        this.enabled = false;
        console.log('AISystem deshabilitado');
    }

    isEnabled() {
        return this.enabled;
    }

}