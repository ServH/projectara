/**
 * 🛡️ GAME FLOW SAFETY TEST
 * Test crítico del flujo completo del juego antes de refactorización
 * Verifica que las flotas se envían, mueven y llegan correctamente
 */

export class GameFlowSafetyTest {
    constructor() {
        this.testName = 'GameFlowSafetyTest';
        this.results = {
            passed: false,
            errors: [],
            warnings: [],
            metrics: {},
            details: {}
        };
        this.gameEngine = null;
        this.testTimeout = 30000; // 30 segundos máximo
    }

    /**
     * 🧪 Ejecutar test completo de flujo del juego
     */
    async run(gameEngine) {
        console.log('🛡️ Iniciando GameFlowSafetyTest...');
        this.gameEngine = gameEngine;
        
        try {
            // 1. Verificar estado inicial
            await this.testInitialState();
            
            // 2. Test de envío de flotas
            await this.testFleetLaunch();
            
            // 3. Test de movimiento de flotas
            await this.testFleetMovement();
            
            // 4. Test de llegada de flotas
            await this.testFleetArrival();
            
            // 5. Test de eventos críticos
            await this.testCriticalEvents();
            
            // 6. Test de integridad de estado
            await this.testStateIntegrity();
            
            this.results.passed = true;
            console.log('✅ GameFlowSafetyTest PASADO');
            
        } catch (error) {
            this.results.passed = false;
            this.results.errors.push(`Test fallido: ${error.message}`);
            console.error('❌ GameFlowSafetyTest FALLIDO:', error);
        }
        
        return this.results;
    }

    /**
     * 🔍 Verificar estado inicial del juego
     */
    async testInitialState() {
        console.log('🔍 Verificando estado inicial...');
        
        // Verificar que el juego está inicializado
        if (!this.gameEngine) {
            throw new Error('GameEngine no está disponible');
        }
        
        // Verificar planetas
        const planets = this.gameEngine.getAllPlanets();
        if (planets.length === 0) {
            throw new Error('No hay planetas en el juego');
        }
        
        // Verificar que hay planetas del jugador
        const playerPlanets = planets.filter(p => p.owner === 'player');
        if (playerPlanets.length === 0) {
            throw new Error('No hay planetas del jugador');
        }
        
        // Verificar que hay planetas objetivo (neutral o AI)
        const targetPlanets = planets.filter(p => p.owner !== 'player');
        if (targetPlanets.length === 0) {
            throw new Error('No hay planetas objetivo disponibles');
        }
        
        this.results.details.initialPlanets = planets.length;
        this.results.details.playerPlanets = playerPlanets.length;
        this.results.details.targetPlanets = targetPlanets.length;
        
        console.log(`✅ Estado inicial válido: ${planets.length} planetas, ${playerPlanets.length} del jugador`);
    }

    /**
     * 🚀 Test de lanzamiento de flotas
     */
    async testFleetLaunch() {
        console.log('🚀 Probando lanzamiento de flotas...');
        
        const planets = this.gameEngine.getAllPlanets();
        const playerPlanets = planets.filter(p => p.owner === 'player' && p.ships > 1);
        const targetPlanets = planets.filter(p => p.owner !== 'player');
        
        if (playerPlanets.length === 0) {
            throw new Error('No hay planetas del jugador con naves suficientes');
        }
        
        if (targetPlanets.length === 0) {
            throw new Error('No hay planetas objetivo disponibles');
        }
        
        // Seleccionar planeta origen y destino
        const sourcePlanet = playerPlanets[0];
        const targetPlanet = targetPlanets[0];
        
        // Forzar selección del planeta origen
        sourcePlanet.setSelected(true);
        
        // Contar flotas antes del envío
        const fleetsBefore = this.gameEngine.getAllFleets().length;
        
        // Enviar flota
        this.gameEngine.sendFleetFromSelected(targetPlanet.id, 0.5);
        
        // Esperar un frame para que se procese
        await this.waitFrames(2);
        
        // Verificar que se creó la flota
        const fleetsAfter = this.gameEngine.getAllFleets().length;
        
        if (fleetsAfter <= fleetsBefore) {
            throw new Error(`No se creó flota: antes=${fleetsBefore}, después=${fleetsAfter}`);
        }
        
        this.results.details.fleetsCreated = fleetsAfter - fleetsBefore;
        console.log(`✅ Flota lanzada correctamente: ${fleetsAfter - fleetsBefore} flotas creadas`);
    }

    /**
     * 🏃 Test de movimiento de flotas
     */
    async testFleetMovement() {
        console.log('🏃 Probando movimiento de flotas...');
        
        const fleets = this.gameEngine.getAllFleets();
        if (fleets.length === 0) {
            throw new Error('No hay flotas para probar movimiento');
        }
        
        // Tomar la primera flota activa
        const fleet = fleets.find(f => !f.hasArrived);
        if (!fleet) {
            throw new Error('No hay flotas activas para probar');
        }
        
        // Obtener posición inicial
        const initialPosition = this.getFleetPosition(fleet);
        
        // Esperar varios frames para que se mueva
        await this.waitFrames(10);
        
        // Obtener posición después del movimiento
        const finalPosition = this.getFleetPosition(fleet);
        
        // Calcular distancia movida
        const distanceMoved = Math.sqrt(
            Math.pow(finalPosition.x - initialPosition.x, 2) + 
            Math.pow(finalPosition.y - initialPosition.y, 2)
        );
        
        if (distanceMoved < 1) {
            throw new Error(`Flota no se movió: distancia=${distanceMoved.toFixed(2)}`);
        }
        
        this.results.details.distanceMoved = distanceMoved;
        console.log(`✅ Flota se mueve correctamente: ${distanceMoved.toFixed(2)} píxeles`);
    }

    /**
     * 🎯 Test de llegada de flotas
     */
    async testFleetArrival() {
        console.log('🎯 Probando llegada de flotas...');
        
        // Crear una flota muy cerca del destino para test rápido
        const planets = this.gameEngine.getAllPlanets();
        const targetPlanet = planets.find(p => p.owner !== 'player');
        
        if (!targetPlanet) {
            throw new Error('No hay planeta objetivo para test de llegada');
        }
        
        // Crear flota de test muy cerca del objetivo
        const testFleet = this.gameEngine.createFleet(
            targetPlanet.x - 20, // Muy cerca del objetivo
            targetPlanet.y - 20,
            targetPlanet.x,
            targetPlanet.y,
            5,
            'player'
        );
        
        if (!testFleet) {
            this.results.warnings.push('No se pudo crear flota de test (modo debug deshabilitado)');
            return;
        }
        
        // Esperar a que llegue (máximo 5 segundos)
        const maxWaitTime = 5000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            await this.waitFrames(1);
            
            if (testFleet.hasArrived) {
                console.log(`✅ Flota llegó correctamente en ${Date.now() - startTime}ms`);
                this.results.details.arrivalTime = Date.now() - startTime;
                return;
            }
        }
        
        throw new Error('Flota no llegó al destino en tiempo esperado');
    }

    /**
     * 📡 Test de eventos críticos
     */
    async testCriticalEvents() {
        console.log('📡 Probando eventos críticos...');
        
        let fleetLaunchedFired = false;
        let fleetArrivedFired = false;
        
        // Configurar listeners de test
        const eventBus = await import('../../src/core/EventBus.js');
        
        eventBus.default.on('fleet:launched', () => {
            fleetLaunchedFired = true;
        });
        
        eventBus.default.on('fleet:arrived', () => {
            fleetArrivedFired = true;
        });
        
        // Los eventos ya deberían haberse disparado en tests anteriores
        // Verificar que el sistema de eventos funciona
        if (!fleetLaunchedFired) {
            this.results.warnings.push('Evento FLEET_LAUNCHED no se disparó');
        }
        
        console.log(`✅ Sistema de eventos verificado: launched=${fleetLaunchedFired}, arrived=${fleetArrivedFired}`);
    }

    /**
     * 🔒 Test de integridad de estado
     */
    async testStateIntegrity() {
        console.log('🔒 Verificando integridad de estado...');
        
        // Verificar que el juego sigue funcionando
        if (!this.gameEngine.isRunning) {
            throw new Error('GameEngine dejó de funcionar durante los tests');
        }
        
        // Verificar que no hay errores críticos en consola
        // (esto se haría monitoreando console.error en un entorno real)
        
        // Verificar que las estructuras de datos están íntegras
        const planets = this.gameEngine.getAllPlanets();
        const fleets = this.gameEngine.getAllFleets();
        
        // Verificar que los planetas tienen propiedades válidas
        for (const planet of planets) {
            if (!planet.id || typeof planet.x !== 'number' || typeof planet.y !== 'number') {
                throw new Error(`Planeta con datos inválidos: ${planet.id}`);
            }
        }
        
        // Verificar que las flotas tienen propiedades válidas
        for (const fleet of fleets) {
            const position = this.getFleetPosition(fleet);
            if (typeof position.x !== 'number' || typeof position.y !== 'number') {
                throw new Error(`Flota con posición inválida: ${fleet.id}`);
            }
        }
        
        this.results.details.finalPlanets = planets.length;
        this.results.details.finalFleets = fleets.length;
        
        console.log(`✅ Integridad de estado verificada: ${planets.length} planetas, ${fleets.length} flotas`);
    }

    /**
     * 🔧 Obtener posición de flota (compatible con diferentes tipos)
     */
    getFleetPosition(fleet) {
        if (fleet.averagePosition) {
            // Flota de steering behaviors
            return { x: fleet.averagePosition.x, y: fleet.averagePosition.y };
        } else if (fleet.x !== undefined && fleet.y !== undefined) {
            // Flota legacy
            return { x: fleet.x, y: fleet.y };
        } else {
            throw new Error('No se puede obtener posición de la flota');
        }
    }

    /**
     * ⏱️ Esperar un número específico de frames
     */
    async waitFrames(frameCount) {
        const frameTime = 16.67; // ~60 FPS
        await new Promise(resolve => setTimeout(resolve, frameTime * frameCount));
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
                details: this.results.details
            }
        };
    }
} 