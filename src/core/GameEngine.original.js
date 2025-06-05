/**
 * 🎮 GALCON GAME - GAME ENGINE (REFACTORIZADO FASE 1)
 * Motor principal del juego con arquitectura modular optimizada
 * HITO 2.5: Optimización crítica para 60 FPS estables
 * MILESTONE 2.3: Navegación inteligente integrada
 * 
 * OPTIMIZACIONES APLICADAS:
 * - ❌ Eliminados 85+ console.log del loop crítico
 * - ⚡ Optimizado gameLoop y update
 * - 🧪 Separados métodos de testing
 * - 📊 Cacheadas estadísticas y validaciones
 * - 🗺️ Optimizado spatial grid
 * - 🧭 Sistema de navegación inteligente integrado
 */

import eventBus, { GAME_EVENTS } from './EventBus.js';
import Planet from '../entities/Planet.js';
import { Fleet } from '../entities/Fleet.js';
import AISystem from '../systems/AISystem.js';
import PercentageSelector from '../ui/PercentageSelector.js';
import FleetRedirectionSystem from '../systems/FleetRedirectionSystem.js';
import PerformanceProfiler from '../debug/PerformanceProfiler.js';
import CullingSystem from '../visual/CullingSystem.js';
import { GAME_CONFIG } from '../config/GameConfig.js';
import { BALANCE_CONFIG } from '../config/BalanceConfig.js';
import { FleetFormationSystem } from '../systems/FleetFormationSystem.js';
import NavigationSystem from '../navigation/NavigationSystem.js';

export class GameEngine {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.gameState = 'menu';
        
        // Entidades del juego
        this.planets = new Map();
        this.fleets = new Map();
        this.players = new Map();
        
        // Sistemas del juego
        this.aiSystem = null;
        this.percentageSelector = null;
        this.fleetRedirectionSystem = null;
        this.fleetFormationSystem = null;
        this.navigationSystem = null;  // 🧭 Sistema de navegación inteligente
        
        // Sistemas de optimización
        this.performanceProfiler = null;
        this.cullingSystem = null;
        
        // 🚀 OPTIMIZACIÓN: Cache de configuración
        this.config = this.initializeConfig();
        
        // 🚀 OPTIMIZACIÓN: Cache de colores de propietarios
        this.ownerColors = {
            player: '#00ff88',
            enemy: '#ff4444',
            neutral: '#ffaa00',
            ai: '#ff4444'
        };
        
        // Sistema de tiempo optimizado
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        this.frameCount = 0;
        
        // 🚀 OPTIMIZACIÓN: Cache de estadísticas (actualizar cada 30 frames)
        this.statsUpdateCounter = 0;
        this.statsUpdateInterval = 30;
        this.stats = {
            fps: 0,
            planetsCount: 0,
            fleetsCount: 0,
            gameTime: 0,
            renderTime: 0,
            updateTime: 0,
            memoryUsage: 0
        };
        
        // 🚀 OPTIMIZACIÓN: Cache de validaciones
        this.validationCache = {
            lastPlanetCheck: 0,
            playerPlanetsCount: 0,
            aiPlanetsCount: 0
        };
        
        // 🚀 OPTIMIZACIÓN: Flags de debug (solo en desarrollo)
        this.debugMode = false; // Cambiar a true solo para debugging
        
        this.setupEventListeners();
        
        if (this.debugMode) {
            console.log('🎮 GameEngine inicializado con optimizaciones Canvas 2D');
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Inicializar configuración con fallbacks
     */
    initializeConfig() {
        const defaultConfig = {
            world: {
                width: window.innerWidth,
                height: window.innerHeight,
                planetCount: 25,
                minPlanetDistance: 80
            },
            gameplay: {
                fleetSendPercentage: 0.8,
                gameSpeed: 1.0,
                planetGrowthRate: 0.5,
                maxPlanetShips: 100
            },
            performance: {
                targetFPS: 60,
                maxFleets: 100,
                enableProfiling: true,
                enableCulling: true,
                enableSpatialGrid: true,
                maxPlanets: 50
            }
        };
        
        // Intentar usar configuraciones externas si están disponibles
        try {
            if (typeof GAME_CONFIG !== 'undefined') {
                defaultConfig.world = { ...defaultConfig.world, ...GAME_CONFIG.world };
                defaultConfig.gameplay = { ...defaultConfig.gameplay, ...GAME_CONFIG.gameplay };
                defaultConfig.performance = { ...defaultConfig.performance, ...GAME_CONFIG.performance };
            }
        } catch (error) {
            if (this.debugMode) {
            console.warn('⚠️ Usando configuración por defecto:', error.message);
        }
        }
        
        return defaultConfig;
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
        eventBus.on('percentage:changed', this.onPercentageChanged.bind(this));
        eventBus.on('selection:getCount', this.getSelectedPlanetsCount.bind(this));
    }

    /**
     * Inicializar el juego
     */
    init() {
        if (this.debugMode) {
        console.log('🚀 Inicializando GameEngine...');
        }
        
        this.createPlayers();
        this.generateWorld();
        this.initializeSystems();
        this.startGameLoop();
        
        this.gameState = 'playing';
        
        if (this.debugMode) {
        console.log('✅ GameEngine inicializado correctamente');
        }
        
        return this;
    }

    /**
     * Inicializar sistemas del juego
     */
    initializeSystems() {
        // Inicializar sistema de IA
        this.aiSystem = new AISystem(this);
        
        // Inicializar PercentageSelector
        this.percentageSelector = new PercentageSelector(this);
        
        // Inicializar FleetRedirectionSystem
        this.fleetRedirectionSystem = new FleetRedirectionSystem(this);
        
        // Inicializar FleetFormationSystem
        this.fleetFormationSystem = new FleetFormationSystem(this);
        
        // Inicializar sistemas de optimización
        if (this.config.performance.enableProfiling) {
            this.performanceProfiler = new PerformanceProfiler();
            this.performanceProfiler.start();
        }
        
        if (this.config.performance.enableCulling) {
            this.cullingSystem = new CullingSystem(
                this.config.world.width, 
                this.config.world.height
            );
        }
        
        // 🧭 Inicializar sistema de navegación inteligente
        this.navigationSystem = new NavigationSystem(this, null); // CanvasRenderer se conectará después
        
        if (this.debugMode) {
            console.log('🤖 Sistemas del juego inicializados con optimizaciones Canvas 2D');
        }
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

        if (this.debugMode) {
        console.log('👥 Jugadores creados');
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Generar mundo con dimensiones optimizadas
     */
    generateWorld() {
        if (this.debugMode) {
        console.log('🌍 Generando mundo...');
        }
        
        // 🚀 OPTIMIZACIÓN: Cache de dimensiones
        const dimensions = this.getWorldDimensions();
        this.config.world.width = dimensions.width;
        this.config.world.height = dimensions.height;
        
        const { planetCount, minPlanetDistance } = this.config.world;
        const planetSizes = ['small', 'medium', 'large', 'huge'];
        const sizeWeights = [0.4, 0.35, 0.2, 0.05];
        
        this.planets.clear();
        
        const positions = this.generatePlanetPositions(
            planetCount, 
            dimensions.width, 
            dimensions.height, 
            minPlanetDistance
        );
        
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
        
        if (this.debugMode) {
            console.log(`🪐 ${planetCount} planetas generados en área ${dimensions.width}x${dimensions.height}`);
        }
        
        this.updateStatsCache();
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener dimensiones del mundo con cache
     */
    getWorldDimensions() {
        const gameCanvas = document.getElementById('gameCanvas');
        let width = 800;
        let height = 600;
        
        if (gameCanvas) {
            const viewBox = gameCanvas.getAttribute('viewBox');
            if (viewBox) {
                const [x, y, w, h] = viewBox.split(' ').map(Number);
                width = w;
                height = h;
            } else {
                const rect = gameCanvas.getBoundingClientRect();
                width = rect.width || 800;
                height = rect.height || 600;
            }
        } else {
            const gameArea = document.querySelector('.game-area');
            if (gameArea) {
                const rect = gameArea.getBoundingClientRect();
                width = rect.width || 800;
                height = rect.height || 600;
            }
        }
        
        return { width, height };
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
     * 🚀 OPTIMIZACIÓN: Loop principal optimizado
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Iniciar medición de frame (solo si profiling está habilitado)
        if (this.performanceProfiler) {
            this.performanceProfiler.startFrame();
        }
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        this.gameTime += this.deltaTime;
        this.frameCount++;
        
        // 🚀 OPTIMIZACIÓN: Actualizar FPS cada 60 frames en lugar de cada frame
        if (this.frameCount % 60 === 0) {
            this.stats.fps = Math.round(1000 / this.deltaTime);
        }
        
        // Medir tiempo de actualización
        if (this.performanceProfiler) {
            this.performanceProfiler.measureUpdateTime(() => {
                this.update(this.deltaTime);
            });
        } else {
            this.update(this.deltaTime);
        }
        
        // Finalizar medición de frame
        if (this.performanceProfiler) {
            this.performanceProfiler.endFrame();
            this.performanceProfiler.updateGameObjectCounts(
                this.planets.size,
                this.fleets.size
            );
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 🚀 OPTIMIZACIÓN: Update optimizado sin logs críticos
     */
    update(deltaTime) {
        const dt = Math.min(deltaTime / 1000, 1/30);
        
        if (this.isPaused) return;
        
        // Actualizar planetas
        for (const planet of this.planets.values()) {
            planet.update(dt);
        }
        
        // Actualizar flotas
        for (const fleet of this.fleets.values()) {
            // 🔧 CORREGIDO: Solo actualizar flotas legacy, las de steering behaviors las maneja NavigationSystem
            if (fleet.update && typeof fleet.update === 'function') {
                // Verificar si es una flota legacy (tiene método update con 1 parámetro)
                // vs flota steering behaviors (tiene método update con 3 parámetros)
                if (fleet.constructor.name === 'Fleet' && fleet.vehicles) {
                    // Es una flota de steering behaviors - NO actualizar aquí
                    // El NavigationSystem ya la maneja con obstacles y spatialHash
                    continue;
                } else {
                    // Es una flota legacy - actualizar normalmente
                    fleet.update(dt);
                }
            }
        }
        
        // Actualizar física de flotas (experimental)
        if (this.config.performance.enableFleetPhysics && this.fleetPhysics) {
            const activeFleets = Array.from(this.fleets.values()).filter(f => !f.hasArrived);
            this.fleetPhysics.updateFleetPhysics(activeFleets, dt);
        }
        
        // Limpiar flotas que han llegado
        this.cleanupArrivedFleets();
        
        // Actualizar IA
        if (this.aiSystem) {
            this.aiSystem.update(dt);
        }
        
        // 🧭 Actualizar sistema de navegación inteligente
        if (this.navigationSystem) {
            this.navigationSystem.update();
        }
        
        // 🚀 OPTIMIZACIÓN: Verificar condiciones de victoria con cache
        this.checkWinConditionsOptimized();
        
        // 🚀 OPTIMIZACIÓN: Actualizar estadísticas solo cada N frames
        this.updateStatsOptimized();
    }

    /**
     * 🚀 OPTIMIZACIÓN: Limpiar flotas sin logs
     */
    cleanupArrivedFleets() {
        const fleetsToRemove = [];
        
        this.fleets.forEach((fleet, id) => {
            if (fleet.hasArrived) {
                fleetsToRemove.push(id);
                
                if (this.config.performance.enableMemoryManager && this.memoryManager) {
                    this.memoryManager.scheduleCleanup(fleet, 1000);
                }
            }
        });
        
        fleetsToRemove.forEach(id => {
            this.fleets.delete(id);
        });
    }

    /**
     * 🚀 OPTIMIZACIÓN: Verificar condiciones de victoria con cache
     */
    checkWinConditionsOptimized() {
        // Solo verificar cada 60 frames para optimizar
        if (this.frameCount % 60 !== 0) return;
        
        const now = this.gameTime;
        if (now - this.validationCache.lastPlanetCheck < 1000) return; // Máximo una vez por segundo
        
        const playerPlanets = Array.from(this.planets.values()).filter(p => p.owner === 'player');
        const aiPlanets = Array.from(this.planets.values()).filter(p => p.owner === 'ai');
        
        this.validationCache.lastPlanetCheck = now;
        this.validationCache.playerPlanetsCount = playerPlanets.length;
        this.validationCache.aiPlanetsCount = aiPlanets.length;
        
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
        
        if (this.debugMode) {
        console.log(`🏆 Juego terminado. Ganador: ${winner}`);
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Enviar flotas sin logs críticos
     */
    sendFleetFromSelected(targetPlanetId, percentage = null, targetClickX = null, targetClickY = null) {
        const targetPlanet = this.planets.get(targetPlanetId);
        if (!targetPlanet) {
            if (this.debugMode) {
            console.error(`❌ Planeta objetivo ${targetPlanetId} no encontrado`);
            }
            return;
        }
        
        const selectedPlanets = Array.from(this.planets.values())
            .filter(p => p.isSelected && p.owner === 'player');
        
        if (selectedPlanets.length === 0) {
            if (this.debugMode) {
            console.warn('⚠️ No hay planetas seleccionados del jugador');
            }
            return;
        }
        
        // Determinar porcentaje de envío
        let sendPercentage;
        if (percentage !== null) {
            sendPercentage = percentage;
        } else if (this.percentageSelector) {
            sendPercentage = this.percentageSelector.getCurrentFactor();
        } else {
            sendPercentage = this.config.gameplay.fleetSendPercentage;
        }
        
        let totalFleetsSent = 0;
        selectedPlanets.forEach(planet => {
            if (planet.ships > 1) {
                const fleetData = planet.sendFleet(targetPlanet, sendPercentage, targetClickX, targetClickY);
                
                if (fleetData) {
                    totalFleetsSent++;
                }
            }
        });
        
        if (this.debugMode && totalFleetsSent > 0) {
            console.log(`🏁 ${totalFleetsSent} flotas enviadas a ${targetPlanet.id}`);
                }
    }

    /**
     * Obtener color del propietario (con cache)
     */
    getOwnerColor(owner) {
        return this.ownerColors[owner] || '#ffffff';
    }

    /**
     * Obtener planeta por ID
     */
    getPlanet(id) {
        return this.planets.get(id);
    }

    /**
     * Obtener todos los planetas
     */
    getAllPlanets() {
        return Array.from(this.planets.values());
    }

    /**
     * Obtener todas las flotas
     */
    getAllFleets() {
        return Array.from(this.fleets.values());
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener planeta en posición sin logs
     */
    getPlanetAtPosition(x, y) {
        if (isNaN(x) || isNaN(y) || x === undefined || y === undefined) {
            return null;
        }
        
        let closestPlanet = null;
        let closestDistance = Infinity;
        const clickRadius = 25;
        
        for (const planet of this.planets.values()) {
            const distance = Math.sqrt(
                Math.pow(planet.x - x, 2) + 
                Math.pow(planet.y - y, 2)
            );
            
            const totalRadius = planet.radius + clickRadius;
            
            if (distance <= totalRadius && distance < closestDistance) {
                closestDistance = distance;
                closestPlanet = planet;
            }
        }
        
        return closestPlanet;
    }

    /**
     * Event handler para cambios de porcentaje (sin logs)
     */
    onPercentageChanged(data) {
        // Lógica sin logs para optimización
    }

    /**
     * Obtener número de planetas seleccionados
     */
    getSelectedPlanetsCount() {
        return Array.from(this.planets.values())
            .filter(p => p.isSelected && p.owner === 'player').length;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Event handlers sin logs críticos
     */
    onFleetLaunched(data) {
        // Usar sistema de formación orgánica
        if (this.fleetFormationSystem && this.fleetFormationSystem.needsOrganicFormation(data)) {
            const organicFleets = this.fleetFormationSystem.createOrganicFormation(data);
            
            organicFleets.forEach(fleet => {
                this.fleets.set(fleet.id, fleet);
                
                // 🔧 CORREGIDO: Registrar también en LegacyFleetAdapter para que NavigationSystem las encuentre
                if (this.navigationSystem && this.navigationSystem.fleetAdapter) {
                    // Crear datos legacy para el adaptador
                    const legacyData = {
                        id: fleet.legacyId || fleet.id,
                        x: fleet.startPosition.x,
                        y: fleet.startPosition.y,
                        startX: fleet.startPosition.x,
                        startY: fleet.startPosition.y,
                        targetX: fleet.targetPosition.x,
                        targetY: fleet.targetPosition.y,
                        ships: fleet.fleetSize,
                        owner: fleet.owner,
                        color: fleet.color,
                        fromPlanet: fleet.fromPlanet,
                        toPlanet: fleet.toPlanet,
                        speed: 50,
                        launchTime: Date.now()
                    };
                    
                    // Mapear la flota en el adaptador
                    this.navigationSystem.fleetAdapter.fleetMap.set(legacyData.id, fleet);
                    this.navigationSystem.fleetAdapter.legacyFleetMap.set(fleet, legacyData);
                }
            });
            
            if (this.debugMode) {
                console.log(`🌊 Formación orgánica: ${organicFleets.length} naves registradas en NavigationSystem`);
            }
        } else {
            // 🔧 USAR LEGACYFLEETADAPTER para compatibilidad
            if (this.navigationSystem && this.navigationSystem.fleetAdapter) {
                const newFleet = this.navigationSystem.fleetAdapter.createFromLegacyData(data);
                this.fleets.set(data.id, newFleet);
            } else {
                // Fallback: crear flota legacy simple
                const legacyFleet = {
                    id: data.id,
                    x: data.x,
                    y: data.y,
                    targetX: data.targetX,
                    targetY: data.targetY,
                    ships: data.ships,
                    owner: data.owner,
                    color: data.color,
                    speed: data.speed || 50,
                    hasArrived: false,
                    update: function(deltaTime) {
                        // Movimiento simple hacia el objetivo
                        const dx = this.targetX - this.x;
                        const dy = this.targetY - this.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance > 5) {
                            this.x += (dx / distance) * this.speed * deltaTime;
                            this.y += (dy / distance) * this.speed * deltaTime;
                        } else {
                            this.hasArrived = true;
                        }
                    },
                    getRenderData: function() {
                        return {
                            id: this.id,
                            x: this.x,
                            y: this.y,
                            ships: this.ships,
                            owner: this.owner,
                            color: this.color,
                            hasArrived: this.hasArrived
                        };
                    }
                };
                this.fleets.set(data.id, legacyFleet);
            }
        }

        this.stats.fleetsCount = this.fleets.size;
    }
        
    onFleetArrived(data) {
        // Validar datos de la flota
        if (!data.toPlanet || !data.ships || !data.owner) {
            if (this.debugMode) {
            console.error(`❌ Datos de flota inválidos:`, data);
            }
            return;
        }
        
        const targetPlanet = this.planets.get(data.toPlanet);
        if (!targetPlanet) {
            if (this.debugMode) {
            console.error(`❌ Planeta objetivo ${data.toPlanet} no encontrado`);
            }
            return;
        }
        
        // Procesar el ataque
        const battleResult = targetPlanet.receiveAttack(data.ships, data.owner);
        
        // Si el planeta fue conquistado, notificar a la IA
        if (battleResult.conquered && battleResult.defenderOwner === 'ai' && this.aiSystem) {
                this.aiSystem.onPlanetLost(targetPlanet.id);
            }
        
        // Limpiar la flota que llegó
        if (data.fleetId && this.fleets.has(data.fleetId)) {
            this.fleets.delete(data.fleetId);
            this.stats.fleetsCount = this.fleets.size;
        }
    }

    onPlanetConquered(data) {
        if (this.debugMode) {
        console.log(`⚔️ Planeta ${data.planetId} conquistado: ${data.oldOwner} → ${data.newOwner}`);
        }
    }

    /**
     * Controles del juego
     */
    start() {
        this.gameState = 'playing';
        this.isPaused = false;
        if (this.debugMode) {
        console.log('▶️ Juego iniciado');
        }
    }

    pause() {
        this.isPaused = true;
        this.gameState = 'paused';
        if (this.debugMode) {
        console.log('⏸️ Juego pausado');
        }
    }

    resume() {
        this.isPaused = false;
        this.gameState = 'playing';
        if (this.debugMode) {
        console.log('▶️ Juego reanudado');
        }
    }

    reset() {
        this.fleets.clear();
        this.planets.clear();
        this.gameTime = 0;
        this.frameCount = 0;
        
        if (this.aiSystem) {
            this.aiSystem.destroy();
        }
        
        this.generateWorld();
        this.initializeSystems();
        this.gameState = 'playing';
        
        if (this.debugMode) {
        console.log('🔄 Juego reiniciado');
    }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Actualizar estadísticas solo cada N frames
     */
    updateStatsOptimized() {
        this.statsUpdateCounter++;
        if (this.statsUpdateCounter >= this.statsUpdateInterval) {
            this.updateStatsCache();
            this.statsUpdateCounter = 0;
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Cache de estadísticas
     */
    updateStatsCache() {
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
        
        // Aplicar culling si está habilitado
        if (this.config.performance.enableCulling && this.cullingSystem) {
            planets = this.cullingSystem.cullPlanets(this.planets);
            fleets = this.cullingSystem.cullFleets(this.fleets);
        }
        
        // 🔧 CORREGIDO: Manejar flotas de steering behaviors que devuelven arrays
        const fleetRenderData = [];
        fleets.forEach(fleet => {
            const renderData = fleet.getRenderData();
            if (renderData) {
                if (Array.isArray(renderData)) {
                    // Flota de steering behaviors - agregar cada vehículo
                    fleetRenderData.push(...renderData);
                } else {
                    // Flota legacy - agregar directamente
                    fleetRenderData.push(renderData);
                }
            }
        });
        
        return {
            planets: planets.map(p => p.getRenderData()),
            fleets: fleetRenderData,
            gameState: this.gameState,
            stats: this.stats,
            cullingStats: this.cullingSystem ? this.cullingSystem.getStats() : null
        };
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            gameState: this.gameState,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            stats: this.stats,
            config: this.config,
            planetsCount: this.planets.size,
            fleetsCount: this.fleets.size,
            players: Array.from(this.players.values()),
            validationCache: this.validationCache
        };
    }

    /**
     * Destruir el motor del juego
     */
    destroy() {
        this.isRunning = false;
        
        if (this.aiSystem) {
            this.aiSystem.destroy();
        }
        
        if (this.navigationSystem) {
            this.navigationSystem.destroy();
        }
        
        if (this.performanceProfiler) {
            this.performanceProfiler.destroy();
        }
        
        this.planets.clear();
        this.fleets.clear();
        this.players.clear();
        
        if (this.debugMode) {
            console.log('💥 GameEngine destruido');
        }
        }
        
    // 🧪 MÉTODOS DE TESTING SEPARADOS (solo para desarrollo)
    
    /**
     * 🧪 TESTING: Crear flota directamente (solo para tests)
     */
    createFleet(sourceX, sourceY, targetX, targetY, ships, owner) {
        if (!this.debugMode) return null; // Solo en modo debug
        
        const fleetData = {
            id: `fleet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x: sourceX,
            y: sourceY,
            targetX: targetX,
            targetY: targetY,
            ships: ships,
            owner: owner,
            color: this.getOwnerColor(owner),
            speed: 50,
            fromPlanet: null,
            toPlanet: null
        };

        // 🔧 USAR LEGACYFLEETADAPTER para compatibilidad
        let fleet;
        if (this.navigationSystem && this.navigationSystem.legacyFleetAdapter) {
            fleet = this.navigationSystem.legacyFleetAdapter.createFromLegacyData(fleetData);
        } else {
            // Fallback: crear flota legacy simple
            fleet = {
                id: fleetData.id,
                x: fleetData.x,
                y: fleetData.y,
                targetX: fleetData.targetX,
                targetY: fleetData.targetY,
                ships: fleetData.ships,
                owner: fleetData.owner,
                color: fleetData.color,
                speed: fleetData.speed,
                hasArrived: false,
                update: function(deltaTime) {
                    const dx = this.targetX - this.x;
                    const dy = this.targetY - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 5) {
                        this.x += (dx / distance) * this.speed * deltaTime;
                        this.y += (dy / distance) * this.speed * deltaTime;
                    } else {
                        this.hasArrived = true;
                    }
                },
                getRenderData: function() {
                    return {
                        id: this.id,
                        x: this.x,
                        y: this.y,
                        ships: this.ships,
                        owner: this.owner,
                        color: this.color,
                        hasArrived: this.hasArrived
                    };
                }
            };
        }
        
        this.fleets.set(fleet.id || fleet.legacyId, fleet);
        
        console.log(`🧪 Flota de test creada: ${fleet.id || fleet.legacyId} (${ships} naves de ${owner})`);
        return fleet;
    }
        
    /**
     * 🧪 TESTING: Activar modo debug
     */
    enableDebugMode() {
        this.debugMode = true;
        console.log('🔧 Modo debug activado');
    }

    /**
     * 🧪 TESTING: Desactivar modo debug
     */
    disableDebugMode() {
        this.debugMode = false;
        console.log('🔧 Modo debug desactivado');
    }

    /**
     * 🧭 Conectar CanvasRenderer al sistema de navegación
     * Llamado desde GameLoader después de inicializar el renderer
     */
    connectNavigationRenderer(canvasRenderer) {
        if (this.navigationSystem && canvasRenderer) {
            this.navigationSystem.canvasRenderer = canvasRenderer;
            console.log('🧭 NavigationSystem conectado al CanvasRenderer');
        }
    }
}

export default GameEngine;