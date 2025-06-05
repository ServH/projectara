/**
 * ⚔️ BATTLE MANAGER - Gestor de Combate de Planetas
 * Encapsula toda la lógica relacionada con combate, conquista y defensa
 * Responsabilidad única: Gestionar las batallas en planetas
 */

import eventBus, { GAME_EVENTS } from '../../core/EventBus.js';

export class BattleManager {
    constructor() {
        this.battleHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * Procesar ataque a un planeta
     * @param {Object} planet - Planeta que recibe el ataque
     * @param {number} attackingShips - Número de naves atacantes
     * @param {string} attackerOwner - Propietario de las naves atacantes
     * @returns {Object} Resultado de la batalla
     */
    processAttack(planet, attackingShips, attackerOwner) {
        const battleResult = this.createBattleResult(planet, attackingShips, attackerOwner);
        
        // Emitir evento de inicio de batalla
        eventBus.emit(GAME_EVENTS.BATTLE_START, battleResult);

        if (planet.owner === attackerOwner) {
            // Refuerzo - simplemente añadir naves
            this.handleReinforcement(planet, attackingShips, battleResult);
        } else {
            // Combate
            this.handleCombat(planet, attackingShips, attackerOwner, battleResult);
        }

        // Emitir evento de fin de batalla
        eventBus.emit(GAME_EVENTS.BATTLE_END, battleResult);

        // Guardar en historial
        this.addToHistory(battleResult);

        return battleResult;
    }

    /**
     * Crear resultado inicial de batalla
     * @param {Object} planet 
     * @param {number} attackingShips 
     * @param {string} attackerOwner 
     * @returns {Object}
     */
    createBattleResult(planet, attackingShips, attackerOwner) {
        return {
            planetId: planet.id,
            attackingShips,
            attackerOwner,
            defendingShips: planet.ships,
            defenderOwner: planet.owner,
            conquered: false,
            shipsRemaining: 0,
            battleType: planet.owner === attackerOwner ? 'reinforcement' : 'combat',
            timestamp: Date.now()
        };
    }

    /**
     * Manejar refuerzo de naves aliadas
     * @param {Object} planet 
     * @param {number} attackingShips 
     * @param {Object} battleResult 
     */
    handleReinforcement(planet, attackingShips, battleResult) {
        const oldShips = planet.ships;
        const newShips = Math.min(planet.ships + attackingShips, planet.maxShips);
        
        planet.ships = newShips;
        battleResult.shipsRemaining = planet.ships;
        battleResult.conquered = false;
        battleResult.shipsAdded = newShips - oldShips;
        battleResult.shipsLost = attackingShips - (newShips - oldShips); // Naves perdidas por capacidad
        
        console.log(`🤝 Refuerzo recibido en ${planet.id}: ${oldShips} + ${attackingShips} = ${planet.ships} naves`);
    }

    /**
     * Manejar combate entre fuerzas enemigas
     * @param {Object} planet 
     * @param {number} attackingShips 
     * @param {string} attackerOwner 
     * @param {Object} battleResult 
     */
    handleCombat(planet, attackingShips, attackerOwner, battleResult) {
        const totalDefense = planet.ships;
        const totalAttack = attackingShips;

        console.log(`⚔️ Combate en ${planet.id}: ${totalAttack} atacantes vs ${totalDefense} defensores`);

        if (totalAttack > totalDefense) {
            // Conquista exitosa
            this.handleConquest(planet, attackerOwner, totalAttack - totalDefense, battleResult);
        } else {
            // Defensa exitosa
            this.handleDefense(planet, totalDefense - totalAttack, battleResult);
        }
    }

    /**
     * Manejar conquista exitosa
     * @param {Object} planet 
     * @param {string} attackerOwner 
     * @param {number} shipsRemaining 
     * @param {Object} battleResult 
     */
    handleConquest(planet, attackerOwner, shipsRemaining, battleResult) {
        const oldOwner = planet.owner;
        
        planet.owner = attackerOwner;
        planet.ships = shipsRemaining;
        
        battleResult.conquered = true;
        battleResult.shipsRemaining = planet.ships;
        battleResult.oldOwner = oldOwner;
        battleResult.newOwner = attackerOwner;

        console.log(`🎉 CONQUISTA EXITOSA: ${planet.id} cambia de ${oldOwner} a ${planet.owner} con ${planet.ships} naves`);

        // Emitir evento de conquista
        eventBus.emit(GAME_EVENTS.PLANET_CONQUERED, {
            planetId: planet.id,
            oldOwner,
            newOwner: planet.owner,
            shipsRemaining: planet.ships,
            battleResult
        });
    }

    /**
     * Manejar defensa exitosa
     * @param {Object} planet 
     * @param {number} shipsRemaining 
     * @param {Object} battleResult 
     */
    handleDefense(planet, shipsRemaining, battleResult) {
        planet.ships = shipsRemaining;
        
        battleResult.conquered = false;
        battleResult.shipsRemaining = planet.ships;
        battleResult.defendersLost = battleResult.defendingShips - shipsRemaining;

        console.log(`🛡️ DEFENSA EXITOSA: ${planet.id} mantiene ${planet.owner} con ${planet.ships} naves restantes`);
    }

    /**
     * Simular ataque sin ejecutarlo
     * @param {Object} planet 
     * @param {number} attackingShips 
     * @param {string} attackerOwner 
     * @returns {Object} Resultado simulado
     */
    simulateAttack(planet, attackingShips, attackerOwner) {
        const simulation = this.createBattleResult(planet, attackingShips, attackerOwner);
        
        if (planet.owner === attackerOwner) {
            // Simulación de refuerzo
            const newShips = Math.min(planet.ships + attackingShips, planet.maxShips);
            simulation.shipsRemaining = newShips;
            simulation.shipsAdded = newShips - planet.ships;
            simulation.shipsLost = attackingShips - simulation.shipsAdded;
        } else {
            // Simulación de combate
            const totalDefense = planet.ships;
            const totalAttack = attackingShips;

            if (totalAttack > totalDefense) {
                simulation.conquered = true;
                simulation.shipsRemaining = totalAttack - totalDefense;
                simulation.newOwner = attackerOwner;
            } else {
                simulation.conquered = false;
                simulation.shipsRemaining = totalDefense - totalAttack;
                simulation.defendersLost = totalAttack;
            }
        }

        simulation.simulated = true;
        return simulation;
    }

    /**
     * Añadir batalla al historial
     * @param {Object} battleResult 
     */
    addToHistory(battleResult) {
        this.battleHistory.push({
            ...battleResult,
            id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        // Mantener tamaño del historial
        if (this.battleHistory.length > this.maxHistorySize) {
            this.battleHistory.shift();
        }
    }

    /**
     * Obtener historial de batallas
     * @param {string} planetId - ID del planeta (opcional)
     * @returns {Array} Historial de batallas
     */
    getBattleHistory(planetId = null) {
        if (planetId) {
            return this.battleHistory.filter(battle => battle.planetId === planetId);
        }
        return [...this.battleHistory];
    }

    /**
     * Obtener estadísticas de combate
     * @param {string} planetId - ID del planeta (opcional)
     * @returns {Object} Estadísticas
     */
    getBattleStats(planetId = null) {
        const battles = this.getBattleHistory(planetId);
        
        const stats = {
            totalBattles: battles.length,
            conquests: battles.filter(b => b.conquered).length,
            defenses: battles.filter(b => !b.conquered && b.battleType === 'combat').length,
            reinforcements: battles.filter(b => b.battleType === 'reinforcement').length,
            totalShipsLost: battles.reduce((sum, b) => sum + (b.defendersLost || 0), 0),
            totalShipsGained: battles.reduce((sum, b) => sum + (b.shipsAdded || 0), 0)
        };

        stats.conquestRate = stats.totalBattles > 0 ? 
            (stats.conquests / (stats.conquests + stats.defenses)) * 100 : 0;

        return stats;
    }

    /**
     * Limpiar historial de batallas
     */
    clearHistory() {
        this.battleHistory = [];
    }

    /**
     * Obtener batallas recientes
     * @param {number} count - Número de batallas a obtener
     * @returns {Array}
     */
    getRecentBattles(count = 10) {
        return this.battleHistory
            .slice(-count)
            .reverse(); // Más recientes primero
    }
} 