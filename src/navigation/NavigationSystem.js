/**
 * 🧭 NAVIGATION SYSTEM - REFACTORIZADO FASE 4
 * Sistema de navegación modular con gestores especializados
 * Aplicando principios SOLID y patrones de diseño
 */

import { NAVIGATION_CONFIG, NavigationConfigManager } from './NavigationConfig.js';
import ObstacleDetector from './ObstacleDetector.js';
import ArrivalSystem from './ArrivalSystem.js';
import { SpatialHashSystem } from '../systems/SpatialHashSystem.js';
import { LegacyFleetAdapter } from '../adapters/LegacyFleetAdapter.js';
import { GALCON_STEERING_CONFIG_PROBADA } from '../config/SteeringConfig.js';
import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

// Gestores especializados
import { NavigationModeManager } from './managers/NavigationModeManager.js';
import { NavigationStatsManager } from './managers/NavigationStatsManager.js';
import { NavigationVisualizationManager } from './managers/NavigationVisualizationManager.js';
import { NavigationUpdateManager } from './managers/NavigationUpdateManager.js';

export class NavigationSystem {
    constructor(gameEngine, canvasRenderer) {
        this.gameEngine = gameEngine;
        this.canvasRenderer = canvasRenderer;
        
        // Configuración
        this.config = NAVIGATION_CONFIG;
        this.steeringConfig = GALCON_STEERING_CONFIG_PROBADA;
        
        // Subsistemas core (mantener compatibilidad)
        this.obstacleDetector = new ObstacleDetector(gameEngine);
        this.arrivalSystem = new ArrivalSystem();
        this.spatialHash = new SpatialHashSystem(50); // Celdas de 50px
        this.fleetAdapter = new LegacyFleetAdapter(gameEngine);
        this.legacyFleetAdapter = this.fleetAdapter; // Alias para compatibilidad
        
        // 🆕 GESTORES ESPECIALIZADOS (Dependency Injection)
        this.modeManager = new NavigationModeManager(gameEngine, this.fleetAdapter);
        this.statsManager = new NavigationStatsManager();
        this.visualizationManager = new NavigationVisualizationManager(canvasRenderer);
        this.updateManager = new NavigationUpdateManager(
            gameEngine, 
            this.fleetAdapter, 
            this.spatialHash, 
            this.obstacleDetector, 
            this.arrivalSystem
        );
        
        // Integrar adaptador con gameEngine si steering behaviors está activo
        if (this.modeManager.isSteeringMode()) {
            this.fleetAdapter.integrateWithGameEngine();
        }
        
        // 🔗 Configurar event listeners para recibir flotas automáticamente
        this.setupEventListeners();
        
        console.log(`🧭 NavigationSystem refactorizado inicializado - ${this.modeManager.getCurrentMode()} activo`);
    }

    /**
     * 🔄 Actualizar sistema de navegación (COORDINADOR)
     */
    update() {
        if (!this.gameEngine) return;
        
        // Delegar actualización a los gestores especializados
        this.updateManager.update(
            this.modeManager, 
            this.statsManager, 
            this.visualizationManager
        );
    }

    /**
     * 🎨 Renderizar navegación
     */
    render(ctx) {
        // Solo renderizar en modo steering
        if (this.modeManager.isSteeringMode()) {
            this.visualizationManager.renderSteeringNavigation(ctx, this.fleetAdapter);
        }
    }

    /**
     * 🔄 Cambiar entre modos de navegación
     */
    toggleNavigationMode() {
        const newMode = this.modeManager.toggleNavigationMode();
        console.log(`🔄 Modo de navegación cambiado a: ${newMode}`);
        return newMode;
    }

    /**
     * 🎯 Configurar modo de navegación específico
     */
    setNavigationMode(useSteeringBehaviors) {
        return this.modeManager.setNavigationMode(useSteeringBehaviors);
    }

    /**
     * 🔧 Obtener configuración actual
     */
    getCurrentConfig() {
        return this.modeManager.isSteeringMode() ? this.steeringConfig : this.config;
    }

    /**
     * 📊 Obtener estadísticas básicas
     */
    getStats() {
        return this.statsManager.getExpandedStats(
            this.modeManager.getCurrentMode(),
            this.fleetAdapter,
            this.spatialHash,
            this.obstacleDetector,
            this.arrivalSystem,
            this.visualizationManager.trajectoryCache
        );
    }

    /**
     * 📊 Obtener estadísticas expandidas
     */
    getExpandedStats() {
        return this.getStats(); // Ahora es lo mismo
    }

    /**
     * 🚀 Procesar navegación por lotes (método público para compatibilidad)
     */
    processBatchNavigation() {
        this.updateManager.processBatchNavigation(this.statsManager);
    }

    /**
     * 🎛️ Configuración dinámica
     */
    setUpdateInterval(frames) {
        this.updateManager.setUpdateInterval(frames);
        NavigationConfigManager.updateInterval(frames);
    }

    setVisualization(enabled) {
        this.visualizationManager.setVisualization(enabled);
        NavigationConfigManager.setVisualization(enabled);
    }

    setDebugMode(enabled) {
        NavigationConfigManager.setDebugMode(enabled);
    }

    /**
     * 🎨 Configuración de visualización
     */
    setTrajectoryColor(color) {
        this.visualizationManager.setTrajectoryColor(color);
    }

    setTrajectoryOpacity(opacity) {
        this.visualizationManager.setTrajectoryOpacity(opacity);
    }

    /**
     * 📊 Obtener información del modo actual
     */
    getModeInfo() {
        return this.modeManager.getModeInfo();
    }

    /**
     * 📈 Obtener resumen de rendimiento
     */
    getPerformanceSummary() {
        return this.statsManager.getPerformanceSummary();
    }

    /**
     * 📊 Obtener estadísticas de visualización
     */
    getVisualizationStats() {
        return this.visualizationManager.getVisualizationStats();
    }

    /**
     * 🔄 Resetear estadísticas
     */
    resetStats() {
        this.statsManager.resetStats();
    }

    /**
     * 🧹 Limpiar visualización
     */
    clearVisualization() {
        this.visualizationManager.clearVisualization();
    }

    /**
     * 🔄 Convertir planetas a obstáculos para una flota específica (EXCLUYENDO SU DESTINO)
     */
    convertPlanetsToObstaclesForFleet(planets, targetPlanetId) {
        return planets
            .filter(planet => planet.id !== targetPlanetId) // Excluir planeta destino
            .map(planet => ({
                position: { x: planet.x, y: planet.y },
                radius: planet.radius + 10, // Buffer de seguridad
                id: planet.id,
                type: 'planet'
            }));
    }

    /**
     * 🔄 Actualizar spatial hash con obstáculos
     */
    updateSpatialHashWithObstacles(obstacles) {
        // Limpiar hash anterior
        this.spatialHash.clear();
        
        // Insertar obstáculos
        obstacles.forEach(obstacle => {
            this.spatialHash.insert(
                obstacle,
                { x: obstacle.position.x, y: obstacle.position.y },
                obstacle.radius
            );
        });
    }

    /**
     * 🧹 Cleanup completo
     */
    destroy() {
        // Limpiar event listeners
        eventBus.off(GAME_EVENTS.FLEET_ADDED, this.handleFleetAdded.bind(this));
        eventBus.off(GAME_EVENTS.FLEET_REMOVED, this.handleFleetRemoved.bind(this));
        
        // Destruir subsistemas core
        this.obstacleDetector.destroy();
        this.arrivalSystem.destroy();
        
        // Destruir gestores especializados
        this.visualizationManager.destroy();
        
        console.log('🧭 NavigationSystem refactorizado destruido');
    }

    // ========================================
    // MÉTODOS DE COMPATIBILIDAD (Legacy API)
    // ========================================

    /**
     * ✅ Verificar si está en modo steering (compatibilidad)
     */
    get useSteeringBehaviors() {
        return this.modeManager.isSteeringMode();
    }

    /**
     * ✅ Verificar si está en modo legacy (compatibilidad)
     */
    get legacyMode() {
        return this.modeManager.isLegacyMode();
    }

    /**
     * 🚀 Procesar una flota individual (compatibilidad legacy)
     */
    processFleet(fleet, planets) {
        return this.updateManager.processFleet(fleet, planets);
    }

    /**
     * 🚀 Procesar navegación de una nave individual (compatibilidad)
     */
    processFleetNavigation(fleet) {
        return this.updateManager.processFleetNavigation(fleet);
    }

    /**
     * 🚧 Manejar evitación de obstáculos (compatibilidad)
     */
    handleObstacleAvoidance(fleet, obstacles, finalTarget) {
        return this.updateManager.handleObstacleAvoidance(fleet, obstacles, finalTarget);
    }

    /**
     * 🎯 Manejar llegada de nave (compatibilidad)
     */
    handleFleetArrival(fleet, arrivalPoint) {
        return this.updateManager.handleFleetArrival(fleet, arrivalPoint);
    }

    /**
     * 🎨 Actualizar trayectoria de una nave (compatibilidad)
     */
    updateFleetTrajectory(fleet, target, obstacles) {
        return this.visualizationManager.updateFleetTrajectory(fleet, target, obstacles);
    }

    /**
     * 🎨 Actualizar visualización (compatibilidad)
     */
    updateVisualization(fleets) {
        return this.visualizationManager.updateVisualization(fleets);
    }

    /**
     * 🎨 Dibujar trayectoria de flota (compatibilidad)
     */
    drawFleetTrajectory(fleet) {
        return this.visualizationManager.drawFleetTrajectory(fleet);
    }

    /**
     * 🧹 Limpiar caches (compatibilidad)
     */
    cleanupCaches() {
        this.updateManager.cleanupCaches();
        this.visualizationManager.cleanupTrajectoryCache();
    }

    /**
     * 📦 Crear lotes de flotas (compatibilidad)
     */
    createFleetBatches(fleets) {
        return this.updateManager.createFleetBatches(fleets);
    }

    /**
     * 📊 Actualizar estadísticas (compatibilidad)
     */
    updateStats(processingTime) {
        this.statsManager.updatePerformanceStats(processingTime);
    }

    // 🔗 Configurar event listeners para recibir flotas automáticamente
    setupEventListeners() {
        // Escuchar cuando se agregan flotas al StateManager
        eventBus.on(GAME_EVENTS.FLEET_ADDED, this.handleFleetAdded.bind(this));
        
        // Escuchar cuando se remueven flotas del StateManager
        eventBus.on(GAME_EVENTS.FLEET_REMOVED, this.handleFleetRemoved.bind(this));
        
        console.log('🔗 NavigationSystem event listeners configurados');
    }

    /**
     * 🚀 Manejar flota agregada al StateManager
     */
    handleFleetAdded({ fleetId, fleet }) {
        // Solo procesar en modo steering
        if (this.modeManager.isSteeringMode()) {
            console.log(`🧭 NavigationSystem recibió nueva flota: ${fleetId}`);
            
            // Agregar flota al adaptador para navegación
            this.fleetAdapter.addFleet(fleet);
        }
    }

    /**
     * 🗑️ Manejar flota removida del StateManager
     */
    handleFleetRemoved({ fleetId, fleet }) {
        if (this.modeManager.isSteeringMode()) {
            console.log(`🧭 NavigationSystem removió flota: ${fleetId}`);
            
            // Remover flota del adaptador
            this.fleetAdapter.removeFleet(fleetId);
        }
    }
}

export default NavigationSystem; 