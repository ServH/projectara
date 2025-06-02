/**
 * 🎮 GALCON GAME - GAME ENGINE
 * Motor principal del juego con arquitectura modular
 * MILESTONE 2.1: Integración de PercentageSelector
 */

import eventBus, { GAME_EVENTS } from './EventBus.js';
import Planet from '../entities/Planet.js';
import Fleet from '../entities/Fleet.js';
import AISystem from '../systems/AISystem.js';
import PercentageSelector from '../ui/PercentageSelector.js'; // 🎛️ NUEVO
import FleetRedirectionSystem from '../systems/FleetRedirectionSystem.js'; // 🔄 NUEVO
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
        
        // Sistemas del juego
        this.aiSystem = null;
        this.percentageSelector = null; // 🎛️ NUEVO
        this.fleetRedirectionSystem = null; // 🔄 NUEVO
        
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
                maxFleets: 100
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
        
        // 🎛️ NUEVO: Inicializar PercentageSelector con referencia al GameEngine
        this.percentageSelector = new PercentageSelector(this);
        
        // 🔄 NUEVO: Inicializar FleetRedirectionSystem
        this.fleetRedirectionSystem = new FleetRedirectionSystem(this);
        
        console.log('🤖 Sistemas del juego inicializados con PercentageSelector y FleetRedirectionSystem');
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
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        this.deltaTime = Math.min(this.deltaTime, 1/30);
        
        if (!this.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.updateStats();
        this.frameCount++;
        
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Actualizar lógica del juego
     */
    update(deltaTime) {
        this.gameTime += deltaTime;
        
        // Actualizar planetas
        this.planets.forEach(planet => {
            planet.update(deltaTime);
        });
        
        // Actualizar flotas
        this.fleets.forEach(fleet => {
            fleet.update(deltaTime);
        });
        
        // Actualizar sistema de IA
        if (this.aiSystem) {
            this.aiSystem.update(deltaTime);
        }
        
        // Limpiar flotas que han llegado
        this.cleanupArrivedFleets();
        
        // Verificar condiciones de victoria
        this.checkWinConditions();
    }

    /**
     * Limpiar flotas que han llegado
     */
    cleanupArrivedFleets() {
        const fleetsToRemove = [];
        
        this.fleets.forEach((fleet, id) => {
            if (fleet.hasArrived) {
                fleetsToRemove.push(id);
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
        this.stats.fps = Math.round(1 / this.deltaTime);
        this.stats.planetsCount = this.planets.size;
        this.stats.fleetsCount = this.fleets.size;
        this.stats.gameTime = this.gameTime;
    }

    /**
     * Obtener datos para renderizado
     */
    getRenderData() {
        return {
            planets: Array.from(this.planets.values()).map(p => p.getRenderData()),
            fleets: Array.from(this.fleets.values()).map(f => f.getRenderData()),
            gameState: this.gameState,
            stats: this.stats
        };
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
        
        // Limpiar entidades
        this.planets.clear();
        this.fleets.clear();
        this.players.clear();
        
        console.log('💥 GameEngine destruido');
    }
}

export default GameEngine; 