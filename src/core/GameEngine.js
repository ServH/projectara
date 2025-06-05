/**
 * 🎮 GAME ENGINE - REFACTORED VERSION
 * Motor principal del juego con arquitectura limpia y responsabilidades separadas
 * 
 * RESPONSABILIDADES:
 * - Coordinar el ciclo de vida del juego
 * - Gestionar el game loop principal
 * - Coordinar entre gestores especializados
 * - Manejar eventos del juego
 */

import eventBus, { GAME_EVENTS } from './EventBus.js';
import { Planet } from '../entities/Planet.js';
import { Fleet } from '../entities/Fleet.js';
import ConfigurationManager from './ConfigurationManager.js';
import StateManager from './StateManager.js';
import SystemsManager from './SystemsManager.js';

export class GameEngine {
    constructor() {
        // Gestores especializados
        this.configurationManager = new ConfigurationManager();
        this.stateManager = new StateManager();
        this.systemsManager = new SystemsManager(this, this.configurationManager);
        
        // Timing del juego
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        
        // 🎨 Referencia al renderer
        this.renderer = null;
        
        // Cache de colores para rendimiento
        this.ownerColors = {
            player: '#00ff88',
            enemy: '#ff4444',
            neutral: '#ffaa00',
            ai: '#ff4444'
        };
        
        this.setupEventListeners();
        
        console.log('🎮 GameEngine initialized with clean architecture');
    }

    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        eventBus.on(GAME_EVENTS.FLEET_LAUNCHED, this.handleFleetLaunched.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_ARRIVED, this.handleFleetArrived.bind(this));
        eventBus.on(GAME_EVENTS.PLANET_CONQUERED, this.handlePlanetConquered.bind(this));
        eventBus.on(GAME_EVENTS.GAME_START, this.start.bind(this));
        eventBus.on(GAME_EVENTS.GAME_PAUSE, this.pause.bind(this));
        eventBus.on(GAME_EVENTS.GAME_RESUME, this.resume.bind(this));
        eventBus.on(GAME_EVENTS.GAME_RESET, this.reset.bind(this));
        eventBus.on('percentage:changed', this.handlePercentageChanged.bind(this));
        eventBus.on('selection:getCount', this.getSelectedPlanetsCount.bind(this));
    }

    /**
     * Inicializar el juego
     */
    async init() {
        console.log('🚀 Initializing GameEngine...');
        
        try {
            // Inicializar sistemas
            await this.systemsManager.initialize();
            
            // Crear jugadores
            this.createPlayers();
            
            // Generar mundo
            this.generateWorld();
            
            // Establecer estado inicial
            this.stateManager.setGameState('playing');
            
            // Iniciar game loop
            this.startGameLoop();
            
            console.log('✅ GameEngine initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ GameEngine initialization failed:', error);
            throw error;
        }
    }

    /**
     * Crear jugadores del juego
     */
    createPlayers() {
        const playerData = {
            id: 'player',
            name: 'Jugador',
            color: '#00ff88',
            isHuman: true
        };

        const aiData = {
            id: 'ai',
            name: 'IA',
            color: '#ff4444',
            isHuman: false
        };

        this.stateManager.addPlayer(playerData);
        this.stateManager.addPlayer(aiData);

        console.log('👥 Players created');
    }

    /**
     * Generar mundo del juego
     */
    generateWorld() {
        console.log('🌍 Generating world...');
        
        const config = this.configurationManager.getSection('world');
        const dimensions = this.getWorldDimensions();
        
        // Actualizar configuración con dimensiones reales
        this.configurationManager.updateConfiguration('world', {
            width: dimensions.width,
            height: dimensions.height
        });
        
        const planetPositions = this.generatePlanetPositions(
            config.planetCount,
            dimensions.width,
            dimensions.height,
            config.minPlanetDistance
        );
        
        this.createPlanets(planetPositions);
        
        console.log(`🪐 ${config.planetCount} planets generated in ${dimensions.width}x${dimensions.height} area`);
    }

    /**
     * Obtener dimensiones del mundo
     */
    getWorldDimensions() {
        const gameCanvas = document.getElementById('gameCanvas');
        let width = 800;
        let height = 600;
        
        if (gameCanvas) {
            const viewBox = gameCanvas.getAttribute('viewBox');
            if (viewBox) {
                const [, , w, h] = viewBox.split(' ').map(Number);
                width = w;
                height = h;
            } else {
                const rect = gameCanvas.getBoundingClientRect();
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
            const position = this.findValidPlanetPosition(
                positions, 
                width, 
                height, 
                margin, 
                minDistance, 
                maxAttempts
            );
            
            if (position) {
                positions.push(position);
            }
        }
        
        return positions;
    }

    /**
     * Encontrar posición válida para un planeta
     */
    findValidPlanetPosition(existingPositions, width, height, margin, minDistance, maxAttempts) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const position = {
                x: margin + Math.random() * (width - 2 * margin),
                y: margin + Math.random() * (height - 2 * margin)
            };
            
            if (this.isValidPlanetPosition(position, existingPositions, minDistance)) {
                return position;
            }
        }
        
        return null;
    }

    /**
     * Verificar si una posición es válida para un planeta
     */
    isValidPlanetPosition(position, existingPositions, minDistance) {
        return existingPositions.every(existingPos => {
            const distance = Math.sqrt(
                Math.pow(position.x - existingPos.x, 2) + 
                Math.pow(position.y - existingPos.y, 2)
            );
            return distance >= minDistance;
        });
    }

    /**
     * Crear planetas en las posiciones generadas
     */
    createPlanets(positions) {
        const planetSizes = ['small', 'medium', 'large', 'huge'];
        const sizeWeights = [0.4, 0.35, 0.2, 0.05];
        
        positions.forEach((position, index) => {
            const size = this.weightedRandomSelect(planetSizes, sizeWeights);
            const owner = this.determinePlanetOwner(index);
            
            const planet = new Planet(`planet_${index}`, position.x, position.y, size, owner);
            this.stateManager.addPlanet(planet);
        });
    }

    /**
     * Determinar propietario inicial del planeta
     */
    determinePlanetOwner(index) {
        if (index === 0) return 'player';
        if (index === 1) return 'ai';
        return 'neutral';
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
        this.stateManager.setRunning(true);
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    /**
     * Loop principal del juego
     */
    gameLoop() {
        if (!this.stateManager.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Actualizar juego si no está pausado
        if (!this.stateManager.isPaused) {
            this.update(this.deltaTime / 1000); // Convertir a segundos
        }
        
        // 🎨 CRÍTICO: Renderizar usando el CanvasRenderer
        if (this.renderer && typeof this.renderer.render === 'function') {
            this.renderer.render();
        }
        
        // Continuar loop
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Actualizar lógica del juego
     */
    update(deltaTime) {
        // Actualizar tiempo de juego
        this.stateManager.incrementGameTime(deltaTime * 1000);
        
        // Actualizar planetas
        this.updatePlanets(deltaTime);
        
        // Actualizar sistemas
        this.systemsManager.updateSystems(deltaTime);
        
        // Limpiar entidades inactivas
        this.cleanupInactiveEntities();
        
        // Verificar condiciones de victoria
        this.checkWinConditions();
    }

    /**
     * Actualizar todos los planetas
     */
    updatePlanets(deltaTime) {
        const planets = this.stateManager.getAllPlanets();
        planets.forEach(planet => {
            if (typeof planet.update === 'function') {
                planet.update(deltaTime);
            }
        });
    }

    /**
     * Limpiar entidades inactivas
     */
    cleanupInactiveEntities() {
        // Limpiar flotas que han llegado
        const removedCount = this.stateManager.cleanup();
        
        // Log solo si se removieron entidades
        if (removedCount > 0) {
            console.log(`🧹 Cleaned up ${removedCount} inactive entities`);
        }
    }

    /**
     * Verificar condiciones de victoria
     */
    checkWinConditions() {
        const statistics = this.stateManager.getStatistics();
        
        // Solo verificar cada 60 frames para optimización
        if (statistics.frameCount % 60 !== 0) return;
        
        const playerPlanets = this.stateManager.getPlanetsByOwner('player');
        const aiPlanets = this.stateManager.getPlanetsByOwner('ai');
        
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
        this.stateManager.setGameState('ended');
        this.stateManager.setRunning(false);
        
        eventBus.emit(GAME_EVENTS.GAME_END, {
            winner,
            timestamp: Date.now(),
            statistics: this.stateManager.getStatistics()
        });
        
        console.log(`🏆 Game ended. Winner: ${winner}`);
    }

    /**
     * Enviar flota desde planetas seleccionados
     */
    sendFleetFromSelected(targetPlanetId, percentage = null, targetClickX = null, targetClickY = null) {
        const selectedPlanets = this.getSelectedPlanets();
        
        if (selectedPlanets.length === 0) {
            console.warn('No planets selected for fleet launch');
            return;
        }
        
        const targetPlanet = this.stateManager.getPlanet(targetPlanetId);
        if (!targetPlanet) {
            console.warn(`Target planet ${targetPlanetId} not found`);
            return;
        }
        
        const config = this.configurationManager.getSection('gameplay');
        const fleetPercentage = percentage || config.fleetSendPercentage;
        
        selectedPlanets.forEach(planet => {
            this.launchFleetFromPlanet(planet, targetPlanet, fleetPercentage, targetClickX, targetClickY);
        });
    }

    /**
     * Lanzar flota desde un planeta específico
     */
    launchFleetFromPlanet(sourcePlanet, targetPlanet, percentage, targetClickX, targetClickY) {
        if (sourcePlanet.owner !== 'player' || sourcePlanet.ships <= 1) {
            return;
        }
        
        const shipsToSend = Math.floor(sourcePlanet.ships * percentage);
        if (shipsToSend <= 0) return;
        
        // Usar método del planeta para enviar flota
        sourcePlanet.sendFleet(targetPlanet, percentage, targetClickX, targetClickY);
    }

    /**
     * Obtener planetas seleccionados
     */
    getSelectedPlanets() {
        return this.stateManager.getAllPlanets().filter(planet => planet.isSelected);
    }

    /**
     * Obtener conteo de planetas seleccionados
     */
    getSelectedPlanetsCount() {
        return this.getSelectedPlanets().length;
    }

    /**
     * Obtener planeta en posición específica
     */
    getPlanetAtPosition(x, y) {
        const planets = this.stateManager.getAllPlanets();
        
        return planets.find(planet => {
            if (typeof planet.containsPoint === 'function') {
                return planet.containsPoint(x, y);
            }
            
            // Fallback para detección básica
            const distance = Math.sqrt(
                Math.pow(x - planet.x, 2) + 
                Math.pow(y - planet.y, 2)
            );
            return distance <= (planet.radius || 25);
        }) || null;
    }

    /**
     * Obtener color del propietario
     */
    getOwnerColor(owner) {
        return this.ownerColors[owner] || this.ownerColors.neutral;
    }

    /**
     * Obtener datos para renderizado
     */
    getRenderData() {
        return {
            planets: this.stateManager.getAllPlanets(),
            fleets: this.stateManager.getAllFleets(),
            players: this.stateManager.getAllPlayers(),
            statistics: this.stateManager.getStatistics(),
            gameState: this.stateManager.getGameState()
        };
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        const statistics = this.stateManager.getStatistics();
        const systemsInfo = this.systemsManager.getSystemsDebugInfo();
        
        return {
            fps: Math.round(1000 / this.deltaTime),
            frameCount: statistics.frameCount,
            gameTime: Math.round(statistics.gameTime / 1000),
            planetsCount: statistics.planetsCount,
            fleetsCount: statistics.fleetsCount,
            playersCount: statistics.playersCount,
            gameState: this.stateManager.getGameState(),
            isRunning: this.stateManager.isRunning,
            isPaused: this.stateManager.isPaused,
            systems: systemsInfo,
            configuration: this.configurationManager.isValid()
        };
    }

    // Event Handlers
    handleFleetLaunched(data) {
        console.log(`🚀 Fleet launched: ${data.ships} ships from ${data.fromPlanet} to ${data.toPlanet}`);
    }

    handleFleetArrived(data) {
        console.log(`🎯 Fleet arrived: ${data.ships} ships at ${data.toPlanet}`);
    }

    handlePlanetConquered(data) {
        console.log(`⚔️ Planet conquered: ${data.planetId} now owned by ${data.newOwner}`);
    }

    handlePercentageChanged(data) {
        // Actualizar configuración de porcentaje
        this.configurationManager.updateConfiguration('gameplay', {
            fleetSendPercentage: data.percentage
        });
    }

    // Game State Controls
    start() {
        this.stateManager.setGameState('playing');
        this.stateManager.setRunning(true);
        this.stateManager.setPaused(false);
    }

    pause() {
        this.stateManager.setPaused(true);
    }

    resume() {
        this.stateManager.setPaused(false);
    }

    reset() {
        this.stateManager.reset();
        this.generateWorld();
        this.createPlayers();
    }

    // Public API Methods
    getPlanet(id) {
        return this.stateManager.getPlanet(id);
    }

    getAllPlanets() {
        return this.stateManager.getAllPlanets();
    }

    getAllFleets() {
        return this.stateManager.getAllFleets();
    }

    connectNavigationRenderer(canvasRenderer) {
        // 🎨 Almacenar referencia al renderer para el game loop
        this.renderer = canvasRenderer;
        
        // Conectar al sistema de navegación
        this.systemsManager.connectNavigationRenderer(canvasRenderer);
        
        console.log('🎨 CanvasRenderer conectado al GameEngine y NavigationSystem');
    }

    /**
     * Destruir el motor del juego
     */
    destroy() {
        console.log('💥 Destroying GameEngine...');
        
        this.stateManager.setRunning(false);
        this.systemsManager.destroy();
        
        // Limpiar event listeners
        eventBus.off(GAME_EVENTS.FLEET_LAUNCHED, this.handleFleetLaunched);
        eventBus.off(GAME_EVENTS.FLEET_ARRIVED, this.handleFleetArrived);
        eventBus.off(GAME_EVENTS.PLANET_CONQUERED, this.handlePlanetConquered);
        
        console.log('💥 GameEngine destroyed');
    }
}

export default GameEngine; 