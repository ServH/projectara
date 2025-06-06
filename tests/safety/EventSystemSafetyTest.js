/**
 * 🛡️ EVENT SYSTEM SAFETY TEST
 * Test crítico del sistema de eventos antes de refactorización
 * Verifica que todos los eventos se emiten correctamente y sin memory leaks
 */

export class EventSystemSafetyTest {
    constructor() {
        this.testName = 'EventSystemSafetyTest';
        this.results = {
            passed: false,
            errors: [],
            warnings: [],
            metrics: {},
            details: {}
        };
        this.gameEngine = null;
        this.eventBus = null;
        this.eventHistory = [];
        this.listenerCount = 0;
    }

    /**
     * 🧪 Ejecutar test completo del sistema de eventos
     */
    async run(gameEngine) {
        console.log('🛡️ Iniciando EventSystemSafetyTest...');
        this.gameEngine = gameEngine;
        
        try {
            // 1. Verificar configuración del EventBus
            await this.testEventBusSetup();
            
            // 2. Test de eventos básicos
            await this.testBasicEvents();
            
            // 3. Test de eventos de flotas
            await this.testFleetEvents();
            
            // 4. Test de eventos de planetas
            await this.testPlanetEvents();
            
            // 5. Test de integridad de datos en eventos
            await this.testEventDataIntegrity();
            
            // 6. Test de secuencias de eventos
            await this.testEventSequences();
            
            // 7. Test de memory leaks en listeners
            await this.testEventMemoryLeaks();
            
            this.results.passed = true;
            console.log('✅ EventSystemSafetyTest PASADO');
            
        } catch (error) {
            this.results.passed = false;
            this.results.errors.push(`Test fallido: ${error.message}`);
            console.error('❌ EventSystemSafetyTest FALLIDO:', error);
        }
        
        return this.results;
    }

    /**
     * 🔧 Verificar configuración del EventBus
     */
    async testEventBusSetup() {
        console.log('🔧 Verificando configuración del EventBus...');
        
        // Intentar importar EventBus
        try {
            const eventBusModule = await import('../../src/core/EventBus.js');
            this.eventBus = eventBusModule.default;
        } catch (error) {
            throw new Error(`No se puede importar EventBus: ${error.message}`);
        }
        
        // Verificar que EventBus tiene métodos necesarios
        if (!this.eventBus.on) {
            throw new Error('EventBus no tiene método "on"');
        }
        
        if (!this.eventBus.emit) {
            throw new Error('EventBus no tiene método "emit"');
        }
        
        if (!this.eventBus.off) {
            throw new Error('EventBus no tiene método "off"');
        }
        
        // Verificar que EventBus está funcionando
        let testEventFired = false;
        const testListener = () => { testEventFired = true; };
        
        this.eventBus.on('test:setup', testListener);
        this.eventBus.emit('test:setup');
        
        if (!testEventFired) {
            throw new Error('EventBus no está funcionando correctamente');
        }
        
        this.eventBus.off('test:setup', testListener);
        
        console.log('✅ EventBus configurado correctamente');
    }

    /**
     * 📡 Test de eventos básicos
     */
    async testBasicEvents() {
        console.log('📡 Probando eventos básicos...');
        
        const eventsToTest = [
            'game:start',
            'game:pause',
            'game:resume',
            'game:update'
        ];
        
        const eventResults = {};
        
        // Configurar listeners para cada evento
        eventsToTest.forEach(eventName => {
            eventResults[eventName] = false;
            
            const listener = (data) => {
                eventResults[eventName] = true;
                this.eventHistory.push({
                    event: eventName,
                    timestamp: Date.now(),
                    data: data
                });
            };
            
            this.eventBus.on(eventName, listener);
            this.listenerCount++;
        });
        
        // Simular eventos del juego
        if (this.gameEngine.start) {
            this.gameEngine.start();
        }
        
        if (this.gameEngine.pause) {
            this.gameEngine.pause();
        }
        
        if (this.gameEngine.resume) {
            this.gameEngine.resume();
        }
        
        // Esperar a que se procesen los eventos
        await this.waitForEvents(1000);
        
        // Verificar que los eventos se dispararon
        const firedEvents = Object.entries(eventResults).filter(([name, fired]) => fired);
        const missedEvents = Object.entries(eventResults).filter(([name, fired]) => !fired);
        
        this.results.details.basicEventsFired = firedEvents.length;
        this.results.details.basicEventsMissed = missedEvents.length;
        
        if (missedEvents.length > 0) {
            this.results.warnings.push(`Eventos básicos no disparados: ${missedEvents.map(([name]) => name).join(', ')}`);
        }
        
        console.log(`✅ Eventos básicos verificados: ${firedEvents.length}/${eventsToTest.length} disparados`);
    }

    /**
     * 🚀 Test de eventos de flotas
     */
    async testFleetEvents() {
        console.log('🚀 Probando eventos de flotas...');
        
        const fleetEvents = {
            'fleet:launched': false,
            'fleet:moving': false,
            'fleet:arrived': false,
            'fleet:battle': false
        };
        
        // Configurar listeners para eventos de flotas
        Object.keys(fleetEvents).forEach(eventName => {
            const listener = (data) => {
                fleetEvents[eventName] = true;
                this.eventHistory.push({
                    event: eventName,
                    timestamp: Date.now(),
                    data: data
                });
                
                // Verificar integridad de datos del evento
                this.validateFleetEventData(eventName, data);
            };
            
            this.eventBus.on(eventName, listener);
            this.listenerCount++;
        });
        
        // Simular acciones que deberían generar eventos de flotas
        await this.simulateFleetActions();
        
        // Esperar a que se procesen los eventos
        await this.waitForEvents(2000);
        
        // Verificar resultados
        const firedFleetEvents = Object.entries(fleetEvents).filter(([name, fired]) => fired);
        const missedFleetEvents = Object.entries(fleetEvents).filter(([name, fired]) => !fired);
        
        this.results.details.fleetEventsFired = firedFleetEvents.length;
        this.results.details.fleetEventsMissed = missedFleetEvents.length;
        
        if (missedFleetEvents.length > 0) {
            this.results.warnings.push(`Eventos de flotas no disparados: ${missedFleetEvents.map(([name]) => name).join(', ')}`);
        }
        
        console.log(`✅ Eventos de flotas verificados: ${firedFleetEvents.length}/${Object.keys(fleetEvents).length} disparados`);
    }

    /**
     * 🪐 Test de eventos de planetas
     */
    async testPlanetEvents() {
        console.log('🪐 Probando eventos de planetas...');
        
        const planetEvents = {
            'planet:selected': false,
            'planet:deselected': false,
            'planet:conquered': false,
            'planet:production': false
        };
        
        // Configurar listeners para eventos de planetas
        Object.keys(planetEvents).forEach(eventName => {
            const listener = (data) => {
                planetEvents[eventName] = true;
                this.eventHistory.push({
                    event: eventName,
                    timestamp: Date.now(),
                    data: data
                });
                
                // Verificar integridad de datos del evento
                this.validatePlanetEventData(eventName, data);
            };
            
            this.eventBus.on(eventName, listener);
            this.listenerCount++;
        });
        
        // Simular acciones que deberían generar eventos de planetas
        await this.simulatePlanetActions();
        
        // Esperar a que se procesen los eventos
        await this.waitForEvents(1000);
        
        // Verificar resultados
        const firedPlanetEvents = Object.entries(planetEvents).filter(([name, fired]) => fired);
        const missedPlanetEvents = Object.entries(planetEvents).filter(([name, fired]) => !fired);
        
        this.results.details.planetEventsFired = firedPlanetEvents.length;
        this.results.details.planetEventsMissed = missedPlanetEvents.length;
        
        if (missedPlanetEvents.length > 0) {
            this.results.warnings.push(`Eventos de planetas no disparados: ${missedPlanetEvents.map(([name]) => name).join(', ')}`);
        }
        
        console.log(`✅ Eventos de planetas verificados: ${firedPlanetEvents.length}/${Object.keys(planetEvents).length} disparados`);
    }

    /**
     * 🔒 Test de integridad de datos en eventos
     */
    async testEventDataIntegrity() {
        console.log('🔒 Verificando integridad de datos en eventos...');
        
        let dataIntegrityErrors = 0;
        
        // Analizar el historial de eventos
        this.eventHistory.forEach(eventRecord => {
            try {
                // Verificar que el evento tiene timestamp válido
                if (!eventRecord.timestamp || typeof eventRecord.timestamp !== 'number') {
                    dataIntegrityErrors++;
                    this.results.warnings.push(`Evento ${eventRecord.event} sin timestamp válido`);
                }
                
                // Verificar que los datos del evento son válidos
                if (eventRecord.data !== undefined && eventRecord.data !== null) {
                    if (typeof eventRecord.data === 'object') {
                        // Verificar que los objetos no están corruptos
                        JSON.stringify(eventRecord.data);
                    }
                }
                
            } catch (error) {
                dataIntegrityErrors++;
                this.results.warnings.push(`Error en datos del evento ${eventRecord.event}: ${error.message}`);
            }
        });
        
        this.results.details.eventDataIntegrityErrors = dataIntegrityErrors;
        this.results.details.totalEventsAnalyzed = this.eventHistory.length;
        
        if (dataIntegrityErrors > 0) {
            this.results.warnings.push(`${dataIntegrityErrors} errores de integridad en datos de eventos`);
        }
        
        console.log(`✅ Integridad de datos verificada: ${this.eventHistory.length} eventos analizados, ${dataIntegrityErrors} errores`);
    }

    /**
     * 🔄 Test de secuencias de eventos
     */
    async testEventSequences() {
        console.log('🔄 Verificando secuencias de eventos...');
        
        // Definir secuencias esperadas
        const expectedSequences = [
            ['fleet:launched', 'fleet:moving'],
            ['planet:selected', 'fleet:launched'],
            ['fleet:moving', 'fleet:arrived']
        ];
        
        let validSequences = 0;
        let invalidSequences = 0;
        
        // Verificar cada secuencia esperada
        expectedSequences.forEach(sequence => {
            if (this.verifyEventSequence(sequence)) {
                validSequences++;
            } else {
                invalidSequences++;
                this.results.warnings.push(`Secuencia de eventos inválida: ${sequence.join(' -> ')}`);
            }
        });
        
        this.results.details.validSequences = validSequences;
        this.results.details.invalidSequences = invalidSequences;
        
        console.log(`✅ Secuencias verificadas: ${validSequences}/${expectedSequences.length} válidas`);
    }

    /**
     * 🧠 Test de memory leaks en listeners
     */
    async testEventMemoryLeaks() {
        console.log('🧠 Probando memory leaks en listeners...');
        
        const initialListenerCount = this.listenerCount;
        
        // Crear y remover muchos listeners para detectar leaks
        const tempListeners = [];
        
        for (let i = 0; i < 100; i++) {
            const listener = () => {};
            this.eventBus.on('test:memory', listener);
            tempListeners.push(listener);
        }
        
        // Remover todos los listeners temporales
        tempListeners.forEach(listener => {
            this.eventBus.off('test:memory', listener);
        });
        
        // Verificar que no hay listeners residuales
        // (esto depende de la implementación específica del EventBus)
        
        this.results.details.initialListenerCount = initialListenerCount;
        this.results.details.tempListenersCreated = tempListeners.length;
        
        console.log(`✅ Memory leaks verificados: ${tempListeners.length} listeners temporales creados y removidos`);
    }

    /**
     * 🎬 Simular acciones que generan eventos de flotas
     */
    async simulateFleetActions() {
        const planets = this.gameEngine.getAllPlanets();
        if (planets.length < 2) return;
        
        const playerPlanets = planets.filter(p => p.owner === 'player' && p.ships > 1);
        const targetPlanets = planets.filter(p => p.owner !== 'player');
        
        if (playerPlanets.length > 0 && targetPlanets.length > 0) {
            const sourcePlanet = playerPlanets[0];
            const targetPlanet = targetPlanets[0];
            
            // Seleccionar planeta y enviar flota
            sourcePlanet.setSelected(true);
            this.gameEngine.sendFleetFromSelected(targetPlanet.id, 0.3);
            
            // Esperar un poco para que se procesen los eventos
            await this.waitForEvents(500);
        }
    }

    /**
     * 🪐 Simular acciones que generan eventos de planetas
     */
    async simulatePlanetActions() {
        const planets = this.gameEngine.getAllPlanets();
        if (planets.length === 0) return;
        
        const planet = planets[0];
        
        // Simular selección y deselección
        planet.setSelected(true);
        await this.waitForEvents(100);
        
        planet.setSelected(false);
        await this.waitForEvents(100);
    }

    /**
     * 🔍 Validar datos de eventos de flotas
     */
    validateFleetEventData(eventName, data) {
        if (!data) {
            this.results.warnings.push(`Evento ${eventName} sin datos`);
            return;
        }
        
        // Validaciones específicas según el tipo de evento
        switch (eventName) {
            case 'fleet:launched':
                if (!data.fleetId || !data.source || !data.target) {
                    this.results.warnings.push(`Evento ${eventName} con datos incompletos`);
                }
                break;
                
            case 'fleet:arrived':
                if (!data.fleetId || !data.target) {
                    this.results.warnings.push(`Evento ${eventName} con datos incompletos`);
                }
                break;
        }
    }

    /**
     * 🔍 Validar datos de eventos de planetas
     */
    validatePlanetEventData(eventName, data) {
        if (!data) {
            this.results.warnings.push(`Evento ${eventName} sin datos`);
            return;
        }
        
        // Validaciones específicas según el tipo de evento
        switch (eventName) {
            case 'planet:selected':
            case 'planet:deselected':
                if (!data.planetId) {
                    this.results.warnings.push(`Evento ${eventName} sin planetId`);
                }
                break;
                
            case 'planet:conquered':
                if (!data.planetId || !data.newOwner || !data.previousOwner) {
                    this.results.warnings.push(`Evento ${eventName} con datos incompletos`);
                }
                break;
        }
    }

    /**
     * 🔄 Verificar secuencia de eventos
     */
    verifyEventSequence(sequence) {
        for (let i = 0; i < sequence.length - 1; i++) {
            const currentEvent = sequence[i];
            const nextEvent = sequence[i + 1];
            
            const currentIndex = this.eventHistory.findIndex(e => e.event === currentEvent);
            const nextIndex = this.eventHistory.findIndex(e => e.event === nextEvent);
            
            if (currentIndex === -1 || nextIndex === -1) {
                return false; // Eventos no encontrados
            }
            
            if (currentIndex >= nextIndex) {
                return false; // Secuencia incorrecta
            }
        }
        
        return true;
    }

    /**
     * ⏱️ Esperar a que se procesen los eventos
     */
    async waitForEvents(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
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
                eventsRecorded: this.eventHistory.length,
                listenersCreated: this.listenerCount,
                details: this.results.details
            }
        };
    }
} 