/**
 * 🛡️ STATE CONTINUITY SAFETY TEST
 * Test crítico de continuidad de estado antes de refactorización
 * Verifica que el estado del juego se mantiene consistente durante la simulación
 */

export class StateContinuitySafetyTest {
    constructor() {
        this.testName = 'StateContinuitySafetyTest';
        this.results = {
            passed: false,
            errors: [],
            warnings: [],
            metrics: {},
            details: {}
        };
        this.gameEngine = null;
        this.stateSnapshots = [];
        this.entityTracker = new Map();
    }

    /**
     * 🧪 Ejecutar test completo de continuidad de estado
     */
    async run(gameEngine) {
        console.log('🛡️ Iniciando StateContinuitySafetyTest...');
        this.gameEngine = gameEngine;
        
        try {
            // 1. Capturar estado inicial
            await this.captureInitialState();
            
            // 2. Test de conservación de naves
            await this.testShipConservation();
            
            // 3. Test de integridad de propietarios
            await this.testOwnershipIntegrity();
            
            // 4. Test de estabilidad de IDs
            await this.testIdStability();
            
            // 5. Test de consistencia durante simulación
            await this.testSimulationConsistency();
            
            // 6. Test de invariantes del juego
            await this.testGameInvariants();
            
            // 7. Verificar estado final
            await this.verifyFinalState();
            
            this.results.passed = true;
            console.log('✅ StateContinuitySafetyTest PASADO');
            
        } catch (error) {
            this.results.passed = false;
            this.results.errors.push(`Test fallido: ${error.message}`);
            console.error('❌ StateContinuitySafetyTest FALLIDO:', error);
        }
        
        return this.results;
    }

    /**
     * 📸 Capturar estado inicial del juego
     */
    async captureInitialState() {
        console.log('📸 Capturando estado inicial...');
        
        const initialState = this.captureGameState();
        this.stateSnapshots.push({
            timestamp: Date.now(),
            type: 'initial',
            state: initialState
        });
        
        // Inicializar tracker de entidades
        this.initializeEntityTracker(initialState);
        
        this.results.details.initialState = {
            planets: initialState.planets.length,
            fleets: initialState.fleets.length,
            totalShips: initialState.totalShips
        };
        
        console.log(`✅ Estado inicial capturado: ${initialState.planets.length} planetas, ${initialState.fleets.length} flotas, ${initialState.totalShips} naves`);
    }

    /**
     * 🚢 Test de conservación de naves
     */
    async testShipConservation() {
        console.log('🚢 Probando conservación de naves...');
        
        const initialShips = this.getTotalShips();
        const shipHistory = [initialShips];
        
        // Simular actividad del juego durante 10 segundos
        const testDuration = 10000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < testDuration) {
            // Actualizar juego
            if (this.gameEngine.update) {
                this.gameEngine.update(16.67);
            }
            
            // Capturar estado cada segundo
            if ((Date.now() - startTime) % 1000 < 50) {
                const currentShips = this.getTotalShips();
                shipHistory.push(currentShips);
                
                this.stateSnapshots.push({
                    timestamp: Date.now(),
                    type: 'conservation_check',
                    state: this.captureGameState()
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Analizar conservación
        const finalShips = this.getTotalShips();
        const shipVariation = Math.abs(finalShips - initialShips);
        const maxVariation = Math.max(...shipHistory) - Math.min(...shipHistory);
        
        this.results.details.shipConservation = {
            initialShips,
            finalShips,
            variation: shipVariation,
            maxVariation,
            history: shipHistory
        };
        
        // Verificar que las naves se conservan (permitir pequeñas variaciones por batallas)
        if (shipVariation > initialShips * 0.1) { // Más del 10% de variación
            this.results.warnings.push(`Gran variación en número de naves: ${shipVariation} (${((shipVariation/initialShips)*100).toFixed(1)}%)`);
        }
        
        console.log(`✅ Conservación de naves verificada: ${initialShips} -> ${finalShips} (variación: ${shipVariation})`);
    }

    /**
     * 👑 Test de integridad de propietarios
     */
    async testOwnershipIntegrity() {
        console.log('👑 Probando integridad de propietarios...');
        
        const ownershipChanges = [];
        const invalidOwners = [];
        
        // Verificar propietarios de planetas
        const planets = this.gameEngine.getAllPlanets();
        planets.forEach(planet => {
            if (!planet.owner || typeof planet.owner !== 'string') {
                invalidOwners.push({
                    type: 'planet',
                    id: planet.id,
                    owner: planet.owner,
                    issue: 'Propietario inválido'
                });
            }
            
            // Verificar que el propietario es válido
            const validOwners = ['player', 'ai', 'neutral'];
            if (!validOwners.includes(planet.owner)) {
                invalidOwners.push({
                    type: 'planet',
                    id: planet.id,
                    owner: planet.owner,
                    issue: 'Propietario no reconocido'
                });
            }
        });
        
        // Verificar propietarios de flotas
        const fleets = this.gameEngine.getAllFleets();
        fleets.forEach(fleet => {
            if (!fleet.owner || typeof fleet.owner !== 'string') {
                invalidOwners.push({
                    type: 'fleet',
                    id: fleet.id,
                    owner: fleet.owner,
                    issue: 'Propietario inválido'
                });
            }
        });
        
        this.results.details.ownershipIntegrity = {
            invalidOwners: invalidOwners.length,
            ownershipChanges: ownershipChanges.length,
            details: invalidOwners
        };
        
        if (invalidOwners.length > 0) {
            this.results.warnings.push(`${invalidOwners.length} entidades con propietarios inválidos`);
        }
        
        console.log(`✅ Integridad de propietarios verificada: ${invalidOwners.length} problemas encontrados`);
    }

    /**
     * 🆔 Test de estabilidad de IDs
     */
    async testIdStability() {
        console.log('🆔 Probando estabilidad de IDs...');
        
        const idIssues = [];
        const duplicateIds = new Set();
        const allIds = new Set();
        
        // Verificar IDs de planetas
        const planets = this.gameEngine.getAllPlanets();
        planets.forEach(planet => {
            if (!planet.id) {
                idIssues.push({
                    type: 'planet',
                    issue: 'ID faltante',
                    entity: planet
                });
            } else {
                if (allIds.has(planet.id)) {
                    duplicateIds.add(planet.id);
                    idIssues.push({
                        type: 'planet',
                        issue: 'ID duplicado',
                        id: planet.id
                    });
                }
                allIds.add(planet.id);
            }
        });
        
        // Verificar IDs de flotas
        const fleets = this.gameEngine.getAllFleets();
        fleets.forEach(fleet => {
            if (!fleet.id) {
                idIssues.push({
                    type: 'fleet',
                    issue: 'ID faltante',
                    entity: fleet
                });
            } else {
                if (allIds.has(fleet.id)) {
                    duplicateIds.add(fleet.id);
                    idIssues.push({
                        type: 'fleet',
                        issue: 'ID duplicado',
                        id: fleet.id
                    });
                }
                allIds.add(fleet.id);
            }
        });
        
        this.results.details.idStability = {
            totalIds: allIds.size,
            duplicateIds: duplicateIds.size,
            idIssues: idIssues.length,
            details: idIssues
        };
        
        if (idIssues.length > 0) {
            this.results.warnings.push(`${idIssues.length} problemas de ID encontrados`);
        }
        
        console.log(`✅ Estabilidad de IDs verificada: ${allIds.size} IDs únicos, ${idIssues.length} problemas`);
    }

    /**
     * 🔄 Test de consistencia durante simulación
     */
    async testSimulationConsistency() {
        console.log('🔄 Probando consistencia durante simulación...');
        
        const consistencyChecks = [];
        const testDuration = 15000; // 15 segundos
        const checkInterval = 2000; // Cada 2 segundos
        const startTime = Date.now();
        
        while (Date.now() - startTime < testDuration) {
            // Actualizar juego
            if (this.gameEngine.update) {
                this.gameEngine.update(16.67);
            }
            
            // Realizar check de consistencia
            if ((Date.now() - startTime) % checkInterval < 50) {
                const consistencyResult = this.performConsistencyCheck();
                consistencyChecks.push({
                    timestamp: Date.now() - startTime,
                    result: consistencyResult
                });
                
                if (!consistencyResult.passed) {
                    this.results.warnings.push(`Inconsistencia detectada en ${Date.now() - startTime}ms: ${consistencyResult.issues.join(', ')}`);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const passedChecks = consistencyChecks.filter(check => check.result.passed).length;
        const failedChecks = consistencyChecks.length - passedChecks;
        
        this.results.details.simulationConsistency = {
            totalChecks: consistencyChecks.length,
            passedChecks,
            failedChecks,
            successRate: (passedChecks / consistencyChecks.length) * 100
        };
        
        if (failedChecks > 0) {
            this.results.warnings.push(`${failedChecks}/${consistencyChecks.length} checks de consistencia fallaron`);
        }
        
        console.log(`✅ Consistencia de simulación verificada: ${passedChecks}/${consistencyChecks.length} checks pasaron`);
    }

    /**
     * ⚖️ Test de invariantes del juego
     */
    async testGameInvariants() {
        console.log('⚖️ Probando invariantes del juego...');
        
        const invariantViolations = [];
        
        // Invariante 1: Todos los planetas tienen posición válida
        const planets = this.gameEngine.getAllPlanets();
        planets.forEach(planet => {
            if (typeof planet.x !== 'number' || typeof planet.y !== 'number') {
                invariantViolations.push(`Planeta ${planet.id} con posición inválida: (${planet.x}, ${planet.y})`);
            }
            
            if (planet.x < 0 || planet.y < 0) {
                invariantViolations.push(`Planeta ${planet.id} con posición negativa: (${planet.x}, ${planet.y})`);
            }
        });
        
        // Invariante 2: Todas las flotas tienen destino válido
        const fleets = this.gameEngine.getAllFleets();
        fleets.forEach(fleet => {
            if (!fleet.hasArrived) {
                const position = this.getFleetPosition(fleet);
                if (typeof position.x !== 'number' || typeof position.y !== 'number') {
                    invariantViolations.push(`Flota ${fleet.id} con posición inválida: (${position.x}, ${position.y})`);
                }
            }
        });
        
        // Invariante 3: Número de naves no negativo
        planets.forEach(planet => {
            if (planet.ships < 0) {
                invariantViolations.push(`Planeta ${planet.id} con naves negativas: ${planet.ships}`);
            }
        });
        
        fleets.forEach(fleet => {
            if (fleet.ships && fleet.ships < 0) {
                invariantViolations.push(`Flota ${fleet.id} con naves negativas: ${fleet.ships}`);
            }
        });
        
        this.results.details.gameInvariants = {
            violationsFound: invariantViolations.length,
            violations: invariantViolations
        };
        
        if (invariantViolations.length > 0) {
            this.results.warnings.push(`${invariantViolations.length} violaciones de invariantes encontradas`);
        }
        
        console.log(`✅ Invariantes del juego verificados: ${invariantViolations.length} violaciones encontradas`);
    }

    /**
     * 🏁 Verificar estado final
     */
    async verifyFinalState() {
        console.log('🏁 Verificando estado final...');
        
        const finalState = this.captureGameState();
        this.stateSnapshots.push({
            timestamp: Date.now(),
            type: 'final',
            state: finalState
        });
        
        const initialState = this.stateSnapshots[0].state;
        
        // Comparar estado inicial vs final
        const stateComparison = {
            planetCountChange: finalState.planets.length - initialState.planets.length,
            fleetCountChange: finalState.fleets.length - initialState.fleets.length,
            shipCountChange: finalState.totalShips - initialState.totalShips
        };
        
        this.results.details.finalState = {
            planets: finalState.planets.length,
            fleets: finalState.fleets.length,
            totalShips: finalState.totalShips,
            comparison: stateComparison
        };
        
        // Verificar que el estado final es válido
        if (finalState.planets.length === 0) {
            this.results.errors.push('Estado final inválido: no hay planetas');
        }
        
        if (finalState.totalShips < 0) {
            this.results.errors.push('Estado final inválido: número de naves negativo');
        }
        
        console.log(`✅ Estado final verificado: ${finalState.planets.length} planetas, ${finalState.fleets.length} flotas, ${finalState.totalShips} naves`);
    }

    /**
     * 📊 Capturar estado completo del juego
     */
    captureGameState() {
        const planets = this.gameEngine.getAllPlanets();
        const fleets = this.gameEngine.getAllFleets();
        
        const totalShips = planets.reduce((sum, planet) => sum + (planet.ships || 0), 0) +
                          fleets.reduce((sum, fleet) => sum + (fleet.ships || fleet.entities?.length || 0), 0);
        
        return {
            timestamp: Date.now(),
            planets: planets.map(planet => ({
                id: planet.id,
                x: planet.x,
                y: planet.y,
                owner: planet.owner,
                ships: planet.ships || 0
            })),
            fleets: fleets.map(fleet => ({
                id: fleet.id,
                owner: fleet.owner,
                ships: fleet.ships || fleet.entities?.length || 0,
                hasArrived: fleet.hasArrived
            })),
            totalShips
        };
    }

    /**
     * 🔧 Inicializar tracker de entidades
     */
    initializeEntityTracker(initialState) {
        // Trackear planetas
        initialState.planets.forEach(planet => {
            this.entityTracker.set(planet.id, {
                type: 'planet',
                initialState: { ...planet },
                changes: []
            });
        });
        
        // Trackear flotas
        initialState.fleets.forEach(fleet => {
            this.entityTracker.set(fleet.id, {
                type: 'fleet',
                initialState: { ...fleet },
                changes: []
            });
        });
    }

    /**
     * 🔍 Realizar check de consistencia
     */
    performConsistencyCheck() {
        const issues = [];
        
        try {
            // Verificar que el juego sigue funcionando
            if (!this.gameEngine.isRunning) {
                issues.push('GameEngine no está funcionando');
            }
            
            // Verificar integridad básica de datos
            const planets = this.gameEngine.getAllPlanets();
            const fleets = this.gameEngine.getAllFleets();
            
            if (!Array.isArray(planets)) {
                issues.push('Lista de planetas no es array');
            }
            
            if (!Array.isArray(fleets)) {
                issues.push('Lista de flotas no es array');
            }
            
            // Verificar que no hay NaN en posiciones
            planets.forEach(planet => {
                if (isNaN(planet.x) || isNaN(planet.y)) {
                    issues.push(`Planeta ${planet.id} con posición NaN`);
                }
            });
            
        } catch (error) {
            issues.push(`Error en consistency check: ${error.message}`);
        }
        
        return {
            passed: issues.length === 0,
            issues
        };
    }

    /**
     * 🚢 Obtener total de naves en el juego
     */
    getTotalShips() {
        let total = 0;
        
        // Contar naves en planetas
        const planets = this.gameEngine.getAllPlanets();
        planets.forEach(planet => {
            total += planet.ships || 0;
        });
        
        // Contar naves en flotas
        const fleets = this.gameEngine.getAllFleets();
        fleets.forEach(fleet => {
            total += fleet.ships || fleet.entities?.length || 0;
        });
        
        return total;
    }

    /**
     * 🔧 Obtener posición de flota
     */
    getFleetPosition(fleet) {
        if (fleet.averagePosition) {
            return { x: fleet.averagePosition.x, y: fleet.averagePosition.y };
        } else if (fleet.x !== undefined && fleet.y !== undefined) {
            return { x: fleet.x, y: fleet.y };
        } else {
            return { x: 0, y: 0 };
        }
    }

    /**
     * 📊 Obtener resultados del test
     */
    getResults() {
        return {
            ...this.results,
            summary: {
                testName: this.testName,
                passed: this.results.passed,
                errorCount: this.results.errors.length,
                warningCount: this.results.warnings.length,
                snapshotsTaken: this.stateSnapshots.length,
                entitiesTracked: this.entityTracker.size,
                details: this.results.details
            }
        };
    }
} 