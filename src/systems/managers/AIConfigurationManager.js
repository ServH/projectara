/**
 * 🎛️ AI CONFIGURATION MANAGER
 * Gestiona la configuración y personalidad de la IA
 * Responsabilidad única: Configuración dinámica y adaptación
 */

import { AI_CONFIG } from '../../config/BalanceConfig.js';

export class AIConfigurationManager {
    constructor(gameEngine, baseConfig = {}) {
        this.gameEngine = gameEngine;
        this.baseConfig = this.createDefaultConfig();
        this.currentConfig = { ...this.baseConfig, ...baseConfig };
        this.originalConfig = { ...this.currentConfig };
        
        // Estado de adaptación
        this.adaptationHistory = [];
        this.adaptationTimers = new Map();
        this.personalityProfile = this.generatePersonalityProfile();
        
        console.log('🎛️ AIConfigurationManager inicializado');
    }

    /**
     * ⚙️ Crear configuración por defecto
     */
    createDefaultConfig() {
        return {
            // Timing
            decisionInterval: AI_CONFIG.timing?.decisionInterval || 600,
            reactionDelay: 1000,
            adaptationCheckInterval: 5000,
            
            // Personality Core
            aggressiveness: AI_CONFIG.behavior?.aggressiveness || 0.85,
            expansionPriority: AI_CONFIG.behavior?.expansionPriority || 0.9,
            riskTolerance: AI_CONFIG.behavior?.riskTolerance || 0.7,
            patience: 0.6,
            opportunism: 0.8,
            
            // Combat Thresholds
            minShipsToAttack: AI_CONFIG.thresholds?.minShipsToAttack || 8,
            minShipsToDefend: AI_CONFIG.thresholds?.minShipsToDefend || 5,
            strengthRatioAttack: AI_CONFIG.thresholds?.strengthRatioAttack || 1.2,
            strengthRatioDefend: AI_CONFIG.thresholds?.strengthRatioDefend || 0.6,
            
            // Send Percentages
            attackPercentage: AI_CONFIG.sendPercentages?.attack || 0.8,
            expandPercentage: AI_CONFIG.sendPercentages?.expand || 0.7,
            reinforcePercentage: AI_CONFIG.sendPercentages?.reinforce || 0.5,
            defendPercentage: AI_CONFIG.sendPercentages?.defend || 0.4,
            
            // Strategy Parameters
            maxTargets: 2,
            maxAttackers: 2,
            multiActionThreshold: 0.8,
            expansionRadius: 300,
            defensiveRadius: 200,
            
            // Adaptation Settings
            enableAdaptation: true,
            adaptationRate: 0.1,
            adaptationDuration: 30000,
            maxAdaptationChange: 0.3,
            adaptationCooldown: 10000,
            
            // Situational Modifiers
            situationalModifiers: {
                losing: { aggressiveness: 0.2, riskTolerance: 0.3 },
                winning: { aggressiveness: -0.1, expansionPriority: 0.1 },
                neutral: { aggressiveness: 0.0, riskTolerance: 0.0 },
                desperate: { aggressiveness: 0.4, riskTolerance: 0.5 }
            },
            
            // Debug
            enableDebugMode: false,
            logLevel: 'info'
        };
    }

    /**
     * 🧬 Generar perfil de personalidad
     */
    generatePersonalityProfile() {
        const config = this.currentConfig;
        
        let personality = 'balanced';
        
        if (config.aggressiveness > 0.8 && config.riskTolerance > 0.7) {
            personality = 'aggressive';
        } else if (config.expansionPriority > 0.8 && config.opportunism > 0.7) {
            personality = 'expansionist';
        } else if (config.riskTolerance < 0.4 && config.patience > 0.7) {
            personality = 'defensive';
        } else if (config.opportunism > 0.8 && config.aggressiveness < 0.6) {
            personality = 'opportunistic';
        }
        
        return {
            type: personality,
            traits: this.getPersonalityTraits(personality),
            strengths: this.getPersonalityStrengths(personality),
            weaknesses: this.getPersonalityWeaknesses(personality)
        };
    }

    /**
     * 🎭 Obtener rasgos de personalidad
     */
    getPersonalityTraits(personality) {
        const traits = {
            aggressive: ['Ataque constante', 'Alta toma de riesgos', 'Respuesta rápida'],
            expansionist: ['Prioriza crecimiento', 'Busca oportunidades', 'Expansión territorial'],
            defensive: ['Juego conservador', 'Protege recursos', 'Planificación a largo plazo'],
            opportunistic: ['Aprovecha debilidades', 'Flexible', 'Timing preciso'],
            balanced: ['Equilibrado', 'Adaptable', 'Estrategia mixta']
        };
        
        return traits[personality] || traits.balanced;
    }

    /**
     * 💪 Obtener fortalezas de personalidad
     */
    getPersonalityStrengths(personality) {
        const strengths = {
            aggressive: ['Presión constante', 'Intimidación', 'Ataques sorpresa'],
            expansionist: ['Control territorial', 'Recursos abundantes', 'Múltiples frentes'],
            defensive: ['Economía sólida', 'Posiciones fortificadas', 'Contraataques efectivos'],
            opportunistic: ['Timing perfecto', 'Eficiencia', 'Adaptabilidad'],
            balanced: ['Versatilidad', 'Sin debilidades obvias', 'Respuesta apropiada']
        };
        
        return strengths[personality] || strengths.balanced;
    }

    /**
     * 🎯 Obtener debilidades de personalidad
     */
    getPersonalityWeaknesses(personality) {
        const weaknesses = {
            aggressive: ['Sobreextensión', 'Recursos limitados', 'Vulnerable a defensas'],
            expansionist: ['Defensa débil', 'Dispersión de fuerzas', 'Vulnerable a ataques focalizados'],
            defensive: ['Crecimiento lento', 'Pierde oportunidades', 'Vulnerable a presión sostenida'],
            opportunistic: ['Inconsistente', 'Dependiente de errores enemigos', 'Falta de iniciativa'],
            balanced: ['Sin especialización', 'Predecible', 'Falta de ventajas distintivas']
        };
        
        return weaknesses[personality] || weaknesses.balanced;
    }

    /**
     * 🔄 Adaptar configuración a la situación
     */
    adaptToSituation(situationAnalysis) {
        if (!this.currentConfig.enableAdaptation) return false;
        
        const situation = this.determineSituation(situationAnalysis);
        const modifiers = this.currentConfig.situationalModifiers[situation];
        
        if (!modifiers) return false;
        
        // Verificar cooldown
        const now = Date.now();
        const lastAdaptation = this.adaptationTimers.get('lastAdaptation') || 0;
        
        if (now - lastAdaptation < this.currentConfig.adaptationCooldown) {
            return false;
        }
        
        // Aplicar modificadores
        const changes = this.applyAdaptationModifiers(modifiers);
        
        if (changes.length > 0) {
            this.adaptationTimers.set('lastAdaptation', now);
            this.scheduleAdaptationReset(changes);
            
            console.log(`🎛️ IA adaptándose a situación: ${situation}`, changes);
            return true;
        }
        
        return false;
    }

    /**
     * 📊 Determinar situación actual
     */
    determineSituation(analysis) {
        const { strengthRatio, planetRatio, threatLevel } = analysis;
        
        if (strengthRatio < 0.3 || threatLevel > 0.8) {
            return 'desperate';
        } else if (strengthRatio < 0.6 || planetRatio < 0.5) {
            return 'losing';
        } else if (strengthRatio > 1.5 && planetRatio > 1.2) {
            return 'winning';
        } else {
            return 'neutral';
        }
    }

    /**
     * ⚡ Aplicar modificadores de adaptación
     */
    applyAdaptationModifiers(modifiers) {
        const changes = [];
        const rate = this.currentConfig.adaptationRate;
        const maxChange = this.currentConfig.maxAdaptationChange;
        
        for (const [key, modifier] of Object.entries(modifiers)) {
            if (this.currentConfig.hasOwnProperty(key)) {
                const currentValue = this.currentConfig[key];
                const change = modifier * rate;
                const clampedChange = Math.max(-maxChange, Math.min(maxChange, change));
                const newValue = Math.max(0, Math.min(1, currentValue + clampedChange));
                
                if (Math.abs(newValue - currentValue) > 0.01) {
                    this.currentConfig[key] = newValue;
                    changes.push({
                        property: key,
                        oldValue: currentValue,
                        newValue: newValue,
                        change: clampedChange
                    });
                }
            }
        }
        
        // Actualizar perfil de personalidad si hay cambios significativos
        if (changes.length > 0) {
            this.personalityProfile = this.generatePersonalityProfile();
        }
        
        return changes;
    }

    /**
     * ⏰ Programar reset de adaptación
     */
    scheduleAdaptationReset(changes) {
        const resetTimer = setTimeout(() => {
            this.resetAdaptationChanges(changes);
        }, this.currentConfig.adaptationDuration);
        
        this.adaptationTimers.set('resetTimer', resetTimer);
    }

    /**
     * 🔄 Resetear cambios de adaptación
     */
    resetAdaptationChanges(changes) {
        console.log('🎛️ Reseteando adaptaciones de IA');
        
        changes.forEach(change => {
            this.currentConfig[change.property] = change.oldValue;
        });
        
        // Actualizar perfil de personalidad
        this.personalityProfile = this.generatePersonalityProfile();
        
        // Limpiar timer
        this.adaptationTimers.delete('resetTimer');
    }

    /**
     * 🎯 Actualizar agresividad temporalmente
     */
    updateAggressiveness(delta, duration = 30000) {
        const oldValue = this.currentConfig.aggressiveness;
        const newValue = Math.max(0, Math.min(1, oldValue + delta));
        
        this.currentConfig.aggressiveness = newValue;
        
        console.log(`🎛️ Agresividad actualizada: ${oldValue.toFixed(2)} → ${newValue.toFixed(2)}`);
        
        // Programar reset
        setTimeout(() => {
            this.currentConfig.aggressiveness = oldValue;
            console.log(`🎛️ Agresividad reseteada a: ${oldValue.toFixed(2)}`);
        }, duration);
        
        return newValue;
    }

    /**
     * ✅ Validar configuración
     */
    validateConfiguration(config = this.currentConfig) {
        const errors = [];
        
        // Validar rangos
        const rangeChecks = [
            'aggressiveness', 'expansionPriority', 'riskTolerance', 
            'patience', 'opportunism', 'attackPercentage', 
            'expandPercentage', 'reinforcePercentage', 'defendPercentage'
        ];
        
        rangeChecks.forEach(key => {
            if (config[key] < 0 || config[key] > 1) {
                errors.push(`${key} debe estar entre 0 y 1`);
            }
        });
        
        // Validar valores positivos
        const positiveChecks = [
            'decisionInterval', 'minShipsToAttack', 'minShipsToDefend',
            'maxTargets', 'maxAttackers'
        ];
        
        positiveChecks.forEach(key => {
            if (config[key] <= 0) {
                errors.push(`${key} debe ser mayor que 0`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 📊 Obtener configuración actual
     */
    getConfig() {
        return { ...this.currentConfig };
    }

    /**
     * 🎭 Obtener perfil de personalidad
     */
    getPersonalityProfile() {
        return { ...this.personalityProfile };
    }

    /**
     * 📈 Obtener estadísticas de adaptación
     */
    getAdaptationStats() {
        return {
            adaptationHistory: [...this.adaptationHistory],
            activeTimers: this.adaptationTimers.size,
            personalityType: this.personalityProfile.type,
            isAdaptationEnabled: this.currentConfig.enableAdaptation
        };
    }

    /**
     * 🔧 Actualizar configuración
     */
    updateConfig(newConfig) {
        const validation = this.validateConfiguration(newConfig);
        
        if (!validation.isValid) {
            console.warn('🎛️ Configuración inválida:', validation.errors);
            return false;
        }
        
        this.currentConfig = { ...this.currentConfig, ...newConfig };
        this.personalityProfile = this.generatePersonalityProfile();
        
        console.log('🎛️ Configuración actualizada');
        return true;
    }

    /**
     * 🔄 Resetear a configuración original
     */
    resetToOriginal() {
        this.currentConfig = { ...this.originalConfig };
        this.personalityProfile = this.generatePersonalityProfile();
        
        // Limpiar timers
        this.adaptationTimers.forEach(timer => clearTimeout(timer));
        this.adaptationTimers.clear();
        
        console.log('🎛️ Configuración reseteada a valores originales');
    }

    /**
     * 🗑️ Destruir gestor
     */
    destroy() {
        // Limpiar timers
        this.adaptationTimers.forEach(timer => clearTimeout(timer));
        this.adaptationTimers.clear();
        
        console.log('🎛️ AIConfigurationManager destruido');
    }
} 