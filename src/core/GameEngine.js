/**
 * 🎮 GALCON GAME - GAME ENGINE
 * Motor principal del juego con arquitectura modular
 * MILESTONE 2.1: Integración de PercentageSelector
 * MILESTONE 2.2: Integración de Sistemas de Optimización
 */

import eventBus, { GAME_EVENTS } from './EventBus.js';
import Planet from '../entities/Planet.js';
import Fleet from '../entities/Fleet.js';
import AISystem from '../systems/AISystem.js';
import PercentageSelector from '../ui/PercentageSelector.js'; // 🎛️ MILESTONE 2.1
import FleetRedirectionSystem from '../systems/FleetRedirectionSystem.js'; // 🔄 MILESTONE 2.1
import PerformanceProfiler from '../debug/PerformanceProfiler.js'; // 📊 MILESTONE 2.2
import CullingSystem from '../visual/CullingSystem.js'; // 👁️ MILESTONE 2.2
import MemoryManager from '../systems/MemoryManager.js'; // 🧠 MILESTONE 2.2
import SpatialGrid from '../systems/SpatialGrid.js'; // 🗺️ MILESTONE 2.2
import SVGPool from '../visual/SVGPool.js'; // 🏊 MILESTONE 2.2
import FleetPhysics from '../systems/FleetPhysics.js'; // 🐦 MILESTONE 2.2
import { GAME_CONFIG } from '../config/GameConfig.js';
import { BALANCE_CONFIG } from '../config/BalanceConfig.js';

export class GameEngine {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.gameState = 'menu'; // menu, playing, paused, ended
        
        // Entidades del juego
        this.planets = new Map();
        this.fleets = new Map();
        this.players = new Map();
        
        // Sistemas del juego - MILESTONE 2.1
        this.aiSystem = null;
        this.percentageSelector = null;
        this.fleetRedirectionSystem = null;
        
        // 📊 MILESTONE 2.2: Sistemas de optimización
        this.performanceProfiler = null;
        this.cullingSystem = null;
        this.memoryManager = null;
        this.spatialGrid = null;
        this.svgPool = null;
        this.fleetPhysics = null;
        
        // Configuración del juego usando nueva configuración
        this.config = {
            world: {
                width: window.innerWidth,
                height: window.innerHeight,
                planetCount: 25,
                minPlanetDistance: 80
            },
            gameplay: {
                fleetSendPercentage: 0.8, // Más agresivo
                gameSpeed: 1.0
            },
            performance: {
                targetFPS: 60,
                maxFleets: 100,
                enableProfiling: true, // 📊 MILESTONE 2.2
                enableCulling: true,   // 👁️ MILESTONE 2.2
                enableSpatialGrid: true, // 🗺️ MILESTONE 2.2
                enableMemoryManager: true, // 🧠 MILESTONE 2.2
                enableSVGPool: true,   // 🏊 MILESTONE 2.2
                enableFleetPhysics: false // 🐦 MILESTONE 2.2 (experimental)
            }
        };
        
        // Intentar usar configuraciones externas si están disponibles
        try {
            if (typeof GAME_CONFIG !== 'undefined') {
                this.config.world = { ...this.config.world, ...GAME_CONFIG.world };
                this.config.gameplay = { ...this.config.gameplay, ...GAME_CONFIG.gameplay };
                this.config.performance = { ...this.config.performance, ...GAME_CONFIG.performance };
            }
        } catch (error) {
            console.warn('⚠️ Usando configuración por defecto:', error.message);
        }
        
        // Sistema de tiempo
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        this.frameCount = 0;
        
        // Estadísticas
        this.stats = {
            fps: 0,
            planetsCount: 0,
            fleetsCount: 0,
            gameTime: 0
        };
        
        this.setupEventListeners();
        console.log('🎮 GameEngine inicializado con PercentageSelector');
    }

    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        eventBus.on(GAME_EVENTS.FLEET_LAUNCHED, this.onFleetLaunched.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived.bind(this));
        eventBus.on(GAME_EVENTS.PLANET_CONQUERED, this.onPlanetConquered.bind(this));
        eventBus.on(GAME_EVENTS.GAME_START, this.start.bind(this));
        eventBus.on(GAME_EVENTS.GAME_PAUSE, this.pause.bind(this));
        eventBus.on(GAME_EVENTS.GAME_RESUME, this.resume.bind(this));
        eventBus.on(GAME_EVENTS.GAME_RESET, this.reset.bind(this));
        
        // 🎛️ NUEVO: Eventos del PercentageSelector
        eventBus.on('percentage:changed', this.onPercentageChanged.bind(this));
        eventBus.on('selection:getCount', this.getSelectedPlanetsCount.bind(this));
    }

    /**
     * Inicializar el juego
     */
    init() {
        console.log('🚀 Inicializando GameEngine...');
        
        this.createPlayers();
        this.generateWorld();
        this.initializeSystems();
        this.startGameLoop();
        
        this.gameState = 'playing';
        console.log('✅ GameEngine inicializado correctamente');
        
        return this;
    }

    /**
     * Inicializar sistemas del juego
     */
    initializeSystems() {
        // Inicializar sistema de IA
        this.aiSystem = new AISystem(this);
        
        // 🎛️ MILESTONE 2.1: Inicializar PercentageSelector con referencia al GameEngine
        this.percentageSelector = new PercentageSelector(this);
        
        // 🔄 MILESTONE 2.1: Inicializar FleetRedirectionSystem
        this.fleetRedirectionSystem = new FleetRedirectionSystem(this);
        
        // 📊 MILESTONE 2.2: Inicializar PerformanceProfiler
        if (this.config.performance.enableProfiling) {
            this.performanceProfiler = new PerformanceProfiler();
            this.performanceProfiler.start();
        }
        
        // 👁️ MILESTONE 2.2: Inicializar CullingSystem con dimensiones del mundo
        if (this.config.performance.enableCulling) {
            this.cullingSystem = new CullingSystem(
                this.config.world.width, 
                this.config.world.height
            );
        }
        
        // 🧠 MILESTONE 2.2: Inicializar MemoryManager
        if (this.config.performance.enableMemoryManager) {
            this.memoryManager = new MemoryManager();
        }
        
        // 🗺️ MILESTONE 2.2: Inicializar SpatialGrid con dimensiones del mundo
        if (this.config.performance.enableSpatialGrid) {
            this.spatialGrid = new SpatialGrid(
                this.config.world.width, 
                this.config.world.height,
                100 // Tamaño de celda
            );
        }
        
        // 🏊 MILESTONE 2.2: Inicializar SVGPool
        if (this.config.performance.enableSVGPool) {
            this.svgPool = new SVGPool();
        }
        
        // 🐦 MILESTONE 2.2: Inicializar FleetPhysics (experimental)
        if (this.config.performance.enableFleetPhysics) {
            this.fleetPhysics = new FleetPhysics();
        }
        
        console.log('🤖 Sistemas del juego inicializados con optimizaciones del Milestone 2.2');
    }

    /**
     * Crear jugadores
     */
    createPlayers() {
        this.players.set('player', {
            id: 'player',
            name: 'Jugador',
            color: '#00ff88',
            isHuman: true
        });

        this.players.set('ai', {
            id: 'ai',
            name: 'IA',
            color: '#ff4444',
            isHuman: false
        });

        console.log('👥 Jugadores creados');
    }

    /**
     * Generar mundo con planetas
     */
    generateWorld() {
        console.log('🌍 Generando mundo...');
        
        // Obtener dimensiones del área de juego responsive
        const gameArea = document.querySelector('.game-area');
        let width = window.innerWidth;
        let height = window.innerHeight - 110; // Restar altura de barras superior e inferior
        
        if (gameArea) {
            const rect = gameArea.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
        }
        
        // Actualizar configuración con dimensiones reales
        this.config.world.width = width;
        this.config.world.height = height;
        
        const { planetCount, minPlanetDistance } = this.config.world;
        const planetSizes = ['small', 'medium', 'large', 'huge'];
        const sizeWeights = [0.4, 0.35, 0.2, 0.05];
        
        this.planets.clear();
        
        const positions = this.generatePlanetPositions(planetCount, width, height, minPlanetDistance);
        
        positions.forEach((pos, index) => {
            const size = this.weightedRandomSelect(planetSizes, sizeWeights);
            
            let owner = 'neutral';
            if (index === 0) {
                owner = 'player';
            } else if (index === 1) {
                owner = 'ai';
            }
            
            const planet = new Planet(`planet_${index}`, pos.x, pos.y, size, owner);
            this.planets.set(planet.id, planet);
        });
        
        console.log(`🪐 ${planetCount} planetas generados en área ${width}x${height}`);
        this.updateStats();
    }

    /**
     * Generar posiciones válidas para planetas
     */
    generatePlanetPositions(count, width, height, minDistance) {
        const positions = [];
        const margin = 100;
        const maxAttempts = 1000;
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let validPosition = false;
            let pos;
            
            while (!validPosition && attempts < maxAttempts) {
                pos = {
                    x: margin + Math.random() * (width - 2 * margin),
                    y: margin + Math.random() * (height - 2 * margin)
                };
                
                validPosition = true;
                
                for (const existingPos of positions) {
                    const distance = Math.sqrt(
                        Math.pow(pos.x - existingPos.x, 2) + 
                        Math.pow(pos.y - existingPos.y, 2)
                    );
                    
                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            if (validPosition) {
                positions.push(pos);
            }
        }
        
        return positions;
    }

    /**
     * Selección aleatoria con pesos
     */
    weightedRandomSelect(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }

    /**
     * Iniciar loop principal del juego
     */
    startGameLoop() {
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    /**
     * Loop principal del juego
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // 📊 NUEVO: Iniciar medición de frame
        if (this.performanceProfiler) {
            this.performanceProfiler.startFrame();
        }
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        this.gameTime += this.deltaTime;
        this.frameCount++;
        
        // Actualizar FPS cada segundo
        if (this.frameCount % 60 === 0) {
            this.stats.fps = Math.round(1000 / this.deltaTime);
        }
        
        // 📊 NUEVO: Medir tiempo de actualización
        if (this.performanceProfiler) {
            this.performanceProfiler.measureUpdateTime(() => {
                this.update(this.deltaTime);
            });
        } else {
            this.update(this.deltaTime);
        }
        
        // 📊 NUEVO: Finalizar medición de frame
        if (this.performanceProfiler) {
            this.performanceProfiler.endFrame();
            
            // Actualizar conteos de objetos para el profiler
            this.performanceProfiler.updateGameObjectCounts(
                this.planets.size,
                this.fleets.size
            );
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Actualizar estado del juego
     */
    update(deltaTime) {
        // Convertir deltaTime a segundos y limitar
        const dt = Math.min(deltaTime / 1000, 1/30);
        
        if (this.isPaused) return;
        
        // 🗺️ MILESTONE 2.2: Limpiar spatial grid para nueva frame
        if (this.config.performance.enableSpatialGrid && this.spatialGrid) {
            this.spatialGrid.clear();
        }
        
        // Actualizar planetas (producción)
        for (const planet of this.planets.values()) {
            planet.update(dt);
            
            // 🗺️ MILESTONE 2.2: Insertar planeta en spatial grid
            if (this.config.performance.enableSpatialGrid && this.spatialGrid) {
                this.spatialGrid.insert(planet);
            }
        }
        
        // Actualizar flotas (movimiento)
        for (const fleet of this.fleets.values()) {
            fleet.update(dt);
            
            // 🗺️ MILESTONE 2.2: Insertar flota en spatial grid
            if (this.config.performance.enableSpatialGrid && this.spatialGrid) {
                this.spatialGrid.insert(fleet);
            }
        }
        
        // 🐦 MILESTONE 2.2: Actualizar física de flotas (experimental)
        if (this.config.performance.enableFleetPhysics && this.fleetPhysics) {
            const activeFleets = Array.from(this.fleets.values()).filter(f => !f.hasArrived);
            this.fleetPhysics.updateFleetPhysics(activeFleets, dt);
        }
        
        // 🗺️ MILESTONE 2.2: Actualizar cache del spatial grid
        if (this.config.performance.enableSpatialGrid && this.spatialGrid) {
            this.spatialGrid.updateCache();
        }
        
        // Limpiar flotas que han llegado
        this.cleanupArrivedFleets();
        
        // Actualizar IA
        if (this.aiSystem) {
            this.aiSystem.update(dt);
        }
        
        // Verificar condiciones de victoria
        this.checkWinConditions();
        
        // Actualizar estadísticas
        this.updateStats();
    }

    /**
     * Limpiar flotas que han llegado
     */
    cleanupArrivedFleets() {
        const fleetsToRemove = [];
        
        this.fleets.forEach((fleet, id) => {
            if (fleet.hasArrived) {
                fleetsToRemove.push(id);
                
                // 🧠 MILESTONE 2.2: Programar limpieza con MemoryManager
                if (this.config.performance.enableMemoryManager && this.memoryManager) {
                    this.memoryManager.scheduleCleanup(fleet, 1000); // Limpiar después de 1 segundo
                }
            }
        });
        
        fleetsToRemove.forEach(id => {
            this.fleets.delete(id);
        });
    }

    /**
     * Verificar condiciones de victoria
     */
    checkWinConditions() {
        const playerPlanets = Array.from(this.planets.values()).filter(p => p.owner === 'player');
        const aiPlanets = Array.from(this.planets.values()).filter(p => p.owner === 'ai');
        
        if (playerPlanets.length === 0) {
            this.endGame('ai');
        } else if (aiPlanets.length === 0) {
            this.endGame('player');
        }
    }

    /**
     * Terminar el juego
     */
    endGame(winner) {
        this.gameState = 'ended';
        eventBus.emit(GAME_EVENTS.GAME_END, { winner });
        console.log(`🏆 Juego terminado. Ganador: ${winner}`);
    }

    /**
     * 🎛️ MEJORADO: Enviar flotas desde planetas seleccionados con porcentaje dinámico y targeting flexible
     */
    sendFleetFromSelected(targetPlanetId, percentage = null, targetClickX = null, targetClickY = null) {
        console.log(`🚀 sendFleetFromSelected llamado: targetPlanet=${targetPlanetId}, percentage=${percentage}, clickPos=(${targetClickX}, ${targetClickY})`);
        
        const targetPlanet = this.planets.get(targetPlanetId);
        if (!targetPlanet) {
            console.error(`❌ Planeta objetivo ${targetPlanetId} no encontrado`);
            return;
        }
        
        console.log(`🎯 Planeta objetivo: ${targetPlanet.id} (${targetPlanet.owner})`);
        
        const selectedPlanets = Array.from(this.planets.values())
            .filter(p => p.isSelected && p.owner === 'player');
        
        console.log(`🪐 Planetas seleccionados encontrados: ${selectedPlanets.length}`);
        selectedPlanets.forEach(p => {
            console.log(`  - ${p.id}: ${p.ships} naves, seleccionado: ${p.isSelected}`);
        });
        
        if (selectedPlanets.length === 0) {
            console.warn('⚠️ No hay planetas seleccionados del jugador');
            return;
        }
        
        // 🎛️ NUEVO: Usar porcentaje del PercentageSelector si no se especifica
        let sendPercentage;
        if (percentage !== null) {
            sendPercentage = percentage;
        } else if (this.percentageSelector) {
            sendPercentage = this.percentageSelector.getCurrentFactor();
        } else {
            sendPercentage = this.config.gameplay.fleetSendPercentage;
        }
        
        console.log(`📊 Porcentaje de envío: ${Math.round(sendPercentage * 100)}%`);
        
        let totalFleetsSent = 0;
        selectedPlanets.forEach(planet => {
            if (planet.ships > 1) {
                console.log(`🚀 Enviando flota desde ${planet.id} (${planet.ships} naves)`);
                
                // 🎯 NUEVO: Pasar coordenadas de click para targeting flexible
                const fleetData = planet.sendFleet(targetPlanet, sendPercentage, targetClickX, targetClickY);
                
                if (fleetData) {
                    totalFleetsSent++;
                    console.log(`✅ Flota enviada: ${fleetData.ships} naves`);
                } else {
                    console.log(`❌ No se pudo enviar flota desde ${planet.id}`);
                }
            } else {
                console.log(`⚠️ Planeta ${planet.id} no tiene suficientes naves (${planet.ships})`);
            }
        });
        
        console.log(`🏁 Total de flotas enviadas: ${totalFleetsSent}/${selectedPlanets.length}`);
    }

    /**
     * Obtener planeta por ID
     */
    getPlanet(id) {
        return this.planets.get(id);
    }

    /**
     * Obtener planeta en posición
     */
    getPlanetAtPosition(x, y) {
        // Validar coordenadas de entrada
        if (isNaN(x) || isNaN(y) || x === undefined || y === undefined) {
            console.warn(`⚠️ Coordenadas inválidas para getPlanetAtPosition: (${x}, ${y})`);
            return null;
        }
        
        for (const planet of this.planets.values()) {
            // Validar que el planeta tenga propiedades válidas
            if (!planet.x || !planet.y || !planet.radius || 
                isNaN(planet.x) || isNaN(planet.y) || isNaN(planet.radius)) {
                continue;
            }
            
            if (planet.containsPoint(x, y)) {
                return planet;
            }
        }
        return null;
    }

    /**
     * 🎛️ NUEVO: Event handler para cambios de porcentaje
     */
    onPercentageChanged(data) {
        console.log(`🎛️ Porcentaje cambiado: ${data.oldPercentage}% → ${data.newPercentage}%`);
        
        // Aquí se pueden añadir efectos visuales o sonoros
        // Por ejemplo, mostrar el nuevo porcentaje en el HUD
    }

    /**
     * 🎛️ NUEVO: Obtener número de planetas seleccionados
     */
    getSelectedPlanetsCount() {
        const selectedCount = Array.from(this.planets.values())
            .filter(p => p.isSelected && p.owner === 'player').length;
        
        return selectedCount;
    }

    /**
     * Event handlers
     */
    onFleetLaunched(data) {
        const fleet = new Fleet(data);
        this.fleets.set(fleet.id, fleet);
        console.log(`🚀 Flota ${fleet.id} añadida al juego`);
    }

    onFleetArrived(data) {
        console.log(`🎯 Flota llegó:`, data);
        
        // Validar datos de la flota
        if (!data.toPlanet || !data.ships || !data.owner) {
            console.error(`❌ Datos de flota inválidos:`, data);
            return;
        }
        
        const targetPlanet = this.planets.get(data.toPlanet);
        if (!targetPlanet) {
            console.error(`❌ Planeta objetivo ${data.toPlanet} no encontrado`);
            return;
        }
        
        console.log(`⚔️ Atacando planeta ${targetPlanet.id}: ${data.ships} naves de ${data.owner} vs ${targetPlanet.ships} naves de ${targetPlanet.owner}`);
        
        // Procesar el ataque
        const battleResult = targetPlanet.receiveAttack(data.ships, data.owner);
        
        console.log(`🏁 Resultado batalla:`, battleResult);
        
        // Si el planeta fue conquistado, actualizar estadísticas
        if (battleResult.conquered) {
            console.log(`🎉 ¡Planeta ${targetPlanet.id} conquistado por ${data.owner}!`);
            
            // Notificar a la IA si perdió un planeta
            if (battleResult.defenderOwner === 'ai' && this.aiSystem) {
                this.aiSystem.onPlanetLost(targetPlanet.id);
            }
        }
    }

    onPlanetConquered(data) {
        console.log(`⚔️ Planeta ${data.planetId} conquistado: ${data.oldOwner} → ${data.newOwner}`);
    }

    /**
     * Controles del juego
     */
    start() {
        this.gameState = 'playing';
        this.isPaused = false;
        console.log('▶️ Juego iniciado');
    }

    pause() {
        this.isPaused = true;
        this.gameState = 'paused';
        console.log('⏸️ Juego pausado');
    }

    resume() {
        this.isPaused = false;
        this.gameState = 'playing';
        console.log('▶️ Juego reanudado');
    }

    reset() {
        this.fleets.clear();
        this.planets.clear();
        this.gameTime = 0;
        this.frameCount = 0;
        
        // Reinicializar sistemas
        if (this.aiSystem) {
            this.aiSystem.destroy();
        }
        
        this.generateWorld();
        this.initializeSystems();
        this.gameState = 'playing';
        console.log('🔄 Juego reiniciado');
    }

    /**
     * Actualizar estadísticas
     */
    updateStats() {
        this.stats.fps = Math.round(1000 / this.deltaTime);
        this.stats.planetsCount = this.planets.size;
        this.stats.fleetsCount = this.fleets.size;
        this.stats.gameTime = this.gameTime;
    }

    /**
     * Obtener datos para renderizado
     */
    getRenderData() {
        let planets = Array.from(this.planets.values());
        let fleets = Array.from(this.fleets.values());
        
        // 👁️ MILESTONE 2.2: Aplicar culling si está habilitado
        if (this.config.performance.enableCulling && this.cullingSystem) {
            planets = this.cullingSystem.cullPlanets(this.planets);
            fleets = this.cullingSystem.cullFleets(this.fleets);
        }
        
        return {
            planets: planets.map(p => p.getRenderData()),
            fleets: fleets.map(f => f.getRenderData()),
            gameState: this.gameState,
            stats: this.stats,
            // 👁️ MILESTONE 2.2: Incluir estadísticas de culling
            cullingStats: this.cullingSystem ? this.cullingSystem.getStats() : null
        };
    }

    /**
     * 📊 NUEVO: Obtener reporte de rendimiento
     */
    getPerformanceReport() {
        if (this.performanceProfiler) {
            return this.performanceProfiler.generateReport();
        }
        return null;
    }

    /**
     * 📊 NUEVO: Configurar escenario para benchmarks
     */
    setScenarioConfig(config) {
        if (config.planetCount) {
            this.config.world.planetCount = config.planetCount;
        }
        
        // Regenerar mundo con nueva configuración
        this.generateWorld();
        
        // Simular flotas iniciales si se especifica
        if (config.initialFleets) {
            this.simulateInitialFleets(config.initialFleets);
        }
    }

    /**
     * 📊 NUEVO: Simular flotas iniciales para benchmarks
     */
    simulateInitialFleets(targetCount) {
        const playerPlanets = Array.from(this.planets.values())
            .filter(p => p.owner === 'player' && p.ships > 10);
        
        const targetPlanets = Array.from(this.planets.values())
            .filter(p => p.owner !== 'player');
        
        let fleetsCreated = 0;
        
        while (fleetsCreated < targetCount && playerPlanets.length > 0 && targetPlanets.length > 0) {
            const fromPlanet = playerPlanets[Math.floor(Math.random() * playerPlanets.length)];
            const toPlanet = targetPlanets[Math.floor(Math.random() * targetPlanets.length)];
            
            if (fromPlanet.ships > 5) {
                const ships = Math.floor(fromPlanet.ships * 0.3);
                const fleetData = fromPlanet.sendFleet(toPlanet, 0.3);
                
                if (fleetData) {
                    fleetsCreated++;
                }
            }
        }
        
        console.log(`📊 ${fleetsCreated} flotas iniciales simuladas para benchmark`);
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        const baseInfo = {
            gameState: this.gameState,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            stats: this.stats,
            config: this.config,
            planetsCount: this.planets.size,
            fleetsCount: this.fleets.size,
            players: Array.from(this.players.values())
        };
        
        // 🎛️ NUEVO: Añadir información del PercentageSelector
        if (this.percentageSelector) {
            baseInfo.percentageSelector = this.percentageSelector.getDebugInfo();
        }
        
        // 🔄 NUEVO: Añadir información del FleetRedirectionSystem
        if (this.fleetRedirectionSystem) {
            baseInfo.fleetRedirectionSystem = this.fleetRedirectionSystem.getDebugInfo();
        }
        
        // 📊 NUEVO: Añadir información del PerformanceProfiler
        if (this.performanceProfiler) {
            baseInfo.performanceProfiler = this.performanceProfiler.getMetrics();
        }
        
        // 📊 MILESTONE 2.2: Añadir información del CullingSystem
        if (this.cullingSystem) {
            baseInfo.cullingSystem = this.cullingSystem.getDebugInfo();
        }
        
        // 🧠 MILESTONE 2.2: Añadir información del MemoryManager
        if (this.memoryManager) {
            baseInfo.memoryManager = this.memoryManager.getDebugInfo();
        }
        
        // 🗺️ MILESTONE 2.2: Añadir información del SpatialGrid
        if (this.spatialGrid) {
            baseInfo.spatialGrid = this.spatialGrid.getDebugInfo();
        }
        
        // 🏊 MILESTONE 2.2: Añadir información del SVGPool
        if (this.svgPool) {
            baseInfo.svgPool = this.svgPool.getDebugInfo();
        }
        
        // 🐦 MILESTONE 2.2: Añadir información del FleetPhysics
        if (this.fleetPhysics) {
            baseInfo.fleetPhysics = this.fleetPhysics.getDebugInfo();
        }
        
        return baseInfo;
    }

    /**
     * Destruir el motor del juego
     */
    destroy() {
        this.isRunning = false;
        
        // Limpiar sistemas
        if (this.aiSystem) {
            this.aiSystem.destroy();
        }
        
        // 🎛️ NUEVO: Destruir PercentageSelector
        if (this.percentageSelector) {
            this.percentageSelector.destroy();
        }
        
        // 🔄 NUEVO: Destruir FleetRedirectionSystem
        if (this.fleetRedirectionSystem) {
            this.fleetRedirectionSystem.destroy();
        }
        
        // 📊 NUEVO: Destruir PerformanceProfiler
        if (this.performanceProfiler) {
            this.performanceProfiler.destroy();
        }
        
        // 📊 MILESTONE 2.2: Destruir CullingSystem
        if (this.cullingSystem) {
            this.cullingSystem.destroy();
        }
        
        // 🧠 MILESTONE 2.2: Destruir MemoryManager
        if (this.memoryManager) {
            this.memoryManager.destroy();
        }
        
        // 🗺️ MILESTONE 2.2: Destruir SpatialGrid
        if (this.spatialGrid) {
            this.spatialGrid.destroy();
        }
        
        // 🏊 MILESTONE 2.2: Destruir SVGPool
        if (this.svgPool) {
            this.svgPool.destroy();
        }
        
        // 🐦 MILESTONE 2.2: Destruir FleetPhysics
        if (this.fleetPhysics) {
            this.fleetPhysics.destroy();
        }
        
        // Limpiar entidades
        this.planets.clear();
        this.fleets.clear();
        this.players.clear();
        
        console.log('💥 GameEngine destruido');
    }
}

export default GameEngine;