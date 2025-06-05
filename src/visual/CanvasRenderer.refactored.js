/**
 * 🎨 CANVAS RENDERER - REFACTORIZADO
 * Sistema de renderizado modular con gestores especializados
 * 
 * ARQUITECTURA REFACTORIZADA:
 * - CanvasRenderingManager: Renderizado básico de entidades
 * - CanvasEffectsManager: Efectos visuales y animaciones
 * - CanvasOverlayManager: Sistema de overlay interactivo
 * - CanvasOptimizationManager: Optimizaciones de rendimiento
 * - CanvasMetricsManager: Métricas y debug
 * 
 * PATRÓN: Coordinator Pattern + Dependency Injection
 * PRINCIPIOS: SOLID, Separation of Concerns, Modularity
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';
import { CanvasRenderingManager } from './managers/CanvasRenderingManager.js';
import { CanvasEffectsManager } from './managers/CanvasEffectsManager.js';
import { CanvasOverlayManager } from './managers/CanvasOverlayManager.js';
import { CanvasOptimizationManager } from './managers/CanvasOptimizationManager.js';
import { CanvasMetricsManager } from './managers/CanvasMetricsManager.js';

export class CanvasRenderer {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        
        // 🚀 CONFIGURACIÓN UNIFICADA
        this.config = {
            // Canvas configuration
            canvas: {
                width: 'auto',
                height: 'auto',
                contextType: '2d',
                alpha: false
            },
            
            // Rendering settings
            rendering: {
                planetMinRadius: 8,
                planetMaxRadius: 40,
                fleetMinSize: 2,
                fleetMaxSize: 8,
                backgroundStars: 200
            },
            
            // Optimization settings
            optimization: {
                culling: true,
                lod: true,
                batching: true,
                caching: true
            },
            
            // Effects settings
            effects: {
                trails: true,
                explosions: true,
                particles: true,
                animations: true
            },
            
            // Overlay settings
            overlay: {
                dragLines: true,
                highlights: true,
                selectionBoxes: true
            },
            
            // Performance settings
            performance: {
                targetFPS: 60,
                maxDrawCalls: 1000,
                enableMetrics: true,
                enableDebug: false
            }
        };
        
        // 🎯 GESTORES ESPECIALIZADOS
        this.managers = {
            rendering: null,
            effects: null,
            overlay: null,
            optimization: null,
            metrics: null
        };
        
        // 📊 ESTADO DEL RENDERIZADOR
        this.renderState = {
            lastRenderTime: 0,
            frameCount: 0,
            isInitialized: false
        };
        
        this.initializeRenderer();
        
        console.log('🎨 CanvasRenderer refactorizado inicializado');
    }
    
    /**
     * 🔧 Inicializar renderizador y gestores
     */
    initializeRenderer() {
        try {
            // 1. Configurar canvas
            this.setupCanvas();
            
            // 2. Inicializar gestores especializados
            this.initializeManagers();
            
            // 3. Configurar eventos
            this.setupEventListeners();
            
            // 4. Configurar sistema de overlay global
            this.setupGlobalOverlaySystem();
            
            this.renderState.isInitialized = true;
            
            console.log('🔧 CanvasRenderer inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando CanvasRenderer:', error);
            throw error;
        }
    }
    
    /**
     * 🎯 Inicializar gestores especializados
     */
    initializeManagers() {
        // 1. Gestor de métricas (primero para tracking)
        this.managers.metrics = new CanvasMetricsManager(this.config.performance);
        
        // 2. Gestor de optimización
        this.managers.optimization = new CanvasOptimizationManager(this.canvas, this.config.optimization);
        
        // 3. Gestor de renderizado básico
        this.managers.rendering = new CanvasRenderingManager(this.canvas, this.ctx, this.config);
        
        // 4. Gestor de efectos
        this.managers.effects = new CanvasEffectsManager(this.ctx, this.config.effects);
        
        // 5. Gestor de overlay
        this.managers.overlay = new CanvasOverlayManager(this.ctx, this.config.overlay);
        
        // 🔗 Configurar callbacks entre gestores
        this.setupManagerCallbacks();
        
        console.log('🎯 Gestores especializados inicializados');
    }
    
    /**
     * 🔗 Configurar callbacks entre gestores
     */
    setupManagerCallbacks() {
        // Métricas observa a otros gestores
        this.managers.metrics.addObserver((event, data) => {
            if (event === 'update') {
                // Actualizar estadísticas de optimización
                const optimizationMetrics = this.managers.optimization.getOptimizationMetrics();
                this.managers.metrics.updateRenderStats({
                    culledObjects: optimizationMetrics.culling.culledObjects,
                    lodReductions: optimizationMetrics.lod.reductions,
                    cacheHits: optimizationMetrics.cache.hitRatio * optimizationMetrics.cache.totalRequests,
                    cacheMisses: (1 - optimizationMetrics.cache.hitRatio) * optimizationMetrics.cache.totalRequests
                });
            }
        });
        
        console.log('🔗 Callbacks entre gestores configurados');
    }
    
    /**
     * 🖼️ Configurar canvas
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Could not get 2D context');
        }
        
        // Configurar propiedades del contexto
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Actualizar tamaño
        this.updateCanvasSize();
        
        console.log('🖼️ Canvas configurado');
    }
    
    /**
     * 📐 Actualizar tamaño del canvas
     */
    updateCanvasSize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Actualizar viewport en gestores
        if (this.managers.optimization) {
            this.managers.optimization.updateViewport();
        }
        if (this.managers.rendering) {
            this.managers.rendering.updateViewport();
        }
    }
    
    /**
     * 🎧 Configurar event listeners
     */
    setupEventListeners() {
        // Eventos del juego
        eventBus.on(GAME_EVENTS.FLEET_LAUNCHED, this.onFleetLaunched.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived.bind(this));
        eventBus.on(GAME_EVENTS.PLANET_CONQUERED, this.onPlanetConquered.bind(this));
        eventBus.on(GAME_EVENTS.BATTLE_START, this.onBattleStart.bind(this));
        
        // Eventos de ventana
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
        });
        
        console.log('🎧 Event listeners configurados');
    }
    
    /**
     * 🌐 Configurar sistema de overlay global
     */
    setupGlobalOverlaySystem() {
        // Exponer API de overlay globalmente
        window.canvasOverlay = {
            addDragLine: this.managers.overlay.addDragLine.bind(this.managers.overlay),
            removeDragLine: this.managers.overlay.removeDragLine.bind(this.managers.overlay),
            clearDragLines: () => this.managers.overlay.overlayElements.dragLines = [],
            addPlanetHighlight: this.managers.overlay.addPlanetHighlight.bind(this.managers.overlay),
            removePlanetHighlight: this.managers.overlay.removePlanetHighlight.bind(this.managers.overlay),
            addTargetHighlight: this.managers.overlay.addTargetHighlight.bind(this.managers.overlay),
            removeTargetHighlight: this.managers.overlay.removeTargetHighlight.bind(this.managers.overlay),
            addSelectionBox: this.managers.overlay.addSelectionBox.bind(this.managers.overlay),
            updateSelectionBox: this.managers.overlay.updateSelectionBox.bind(this.managers.overlay),
            removeSelectionBox: this.managers.overlay.removeSelectionBox.bind(this.managers.overlay),
            clearAllOverlays: this.managers.overlay.clearAllOverlays.bind(this.managers.overlay)
        };
        
        console.log('🌐 Sistema de overlay global configurado');
    }
    
    /**
     * ▶️ Iniciar renderizado
     */
    start() {
        if (!this.renderState.isInitialized) {
            console.warn('⚠️ Renderer not initialized');
            return;
        }
        
        this.isRunning = true;
        console.log('▶️ CanvasRenderer iniciado');
    }
    
    /**
     * ⏹️ Detener renderizado
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ CanvasRenderer detenido');
    }
    
    /**
     * 🎨 MÉTODO PRINCIPAL DE RENDERIZADO
     */
    render() {
        if (!this.isRunning || !this.renderState.isInitialized) {
            return;
        }
        
        try {
            // 📊 Iniciar tracking de métricas
            this.managers.metrics.startFrame();
            this.managers.metrics.startRender();
            
            // 🎯 Obtener datos del juego
            const renderData = this.gatherRenderData();
            
            // ⚡ Optimizar datos de renderizado
            const optimizedData = this.managers.optimization.optimizeRenderData(renderData);
            
            // 🎨 Renderizar entidades básicas
            this.managers.rendering.renderEntities(optimizedData);
            
            // 🌊 Renderizar efectos visuales
            this.managers.effects.renderEffects();
            
            // 🎮 Renderizar overlays interactivos
            this.managers.overlay.renderOverlays();
            
            // 📊 Finalizar tracking de métricas
            this.managers.metrics.endRender();
            this.managers.metrics.endFrame();
            
            // 🔄 Actualizar estado
            this.updateRenderState();
            
        } catch (error) {
            console.error('❌ Error en renderizado:', error);
        }
    }
    
    /**
     * 📊 Recopilar datos de renderizado
     */
    gatherRenderData() {
        if (!this.gameEngine) {
            return { planets: [], fleets: [], effects: [] };
        }
        
        const renderData = {
            planets: [],
            fleets: [],
            effects: []
        };
        
        // Obtener planetas
        if (this.gameEngine.planets) {
            renderData.planets = this.gameEngine.planets.map(planet => ({
                x: planet.x,
                y: planet.y,
                radius: planet.radius,
                owner: planet.owner,
                population: planet.population,
                maxPopulation: planet.maxPopulation
            }));
        }
        
        // Obtener flotas
        if (this.gameEngine.fleets) {
            renderData.fleets = this.gameEngine.fleets.map(fleet => ({
                x: fleet.x,
                y: fleet.y,
                angle: fleet.angle || 0,
                size: fleet.size || 5,
                owner: fleet.owner,
                population: fleet.population
            }));
        }
        
        return renderData;
    }
    
    /**
     * 🔄 Actualizar estado del renderizador
     */
    updateRenderState() {
        this.renderState.lastRenderTime = Date.now();
        this.renderState.frameCount++;
        
        // Actualizar estadísticas en gestores
        const stats = {
            planetsRendered: this.gameEngine?.planets?.length || 0,
            fleetsRendered: this.gameEngine?.fleets?.length || 0,
            effectsRendered: this.managers.effects.getEffectsStats().explosions + 
                           this.managers.effects.getEffectsStats().trails,
            overlaysRendered: Object.values(this.managers.overlay.getOverlayStats()).reduce((a, b) => a + b, 0)
        };
        
        this.managers.metrics.updateRenderStats(stats);
    }
    
    /**
     * 🚀 Evento: Flota lanzada
     */
    onFleetLaunched(data) {
        if (this.managers.effects) {
            this.managers.effects.createLaunchEffect(data.x, data.y, {
                color: this.getPlayerColor(data.owner),
                radius: 25
            });
        }
    }
    
    /**
     * 🎯 Evento: Flota llegó
     */
    onFleetArrived(data) {
        if (this.managers.effects) {
            this.managers.effects.createArrivalEffect(data.x, data.y, {
                color: this.getPlayerColor(data.owner),
                radius: 20
            });
        }
    }
    
    /**
     * 👑 Evento: Planeta conquistado
     */
    onPlanetConquered(data) {
        if (this.managers.effects) {
            this.managers.effects.createConquestEffect(data.x, data.y, {
                color: this.getPlayerColor(data.newOwner),
                radius: 35
            });
        }
    }
    
    /**
     * ⚔️ Evento: Batalla iniciada
     */
    onBattleStart(data) {
        if (this.managers.effects) {
            this.managers.effects.createBattleEffect(data.x, data.y, {
                color: '#ff4444',
                radius: 30
            });
        }
    }
    
    /**
     * 🎨 Obtener color del jugador
     */
    getPlayerColor(owner) {
        if (owner === 0) return '#666666'; // Neutral
        if (owner === 1) return '#00ff88'; // Player
        return '#ff4444'; // Enemy
    }
    
    /**
     * 📊 Obtener métricas de rendimiento
     */
    getPerformanceMetrics() {
        if (!this.managers.metrics) {
            return null;
        }
        
        return {
            ...this.managers.metrics.getMetrics(),
            optimization: this.managers.optimization.getOptimizationMetrics(),
            effects: this.managers.effects.getEffectsStats(),
            overlay: this.managers.overlay.getOverlayStats()
        };
    }
    
    /**
     * 🐛 Obtener información de debug
     */
    getDebugInfo() {
        if (!this.managers.metrics) {
            return {};
        }
        
        return {
            ...this.managers.metrics.getDebugInfo(),
            renderState: {
                frameCount: this.renderState.frameCount,
                lastRenderTime: this.renderState.lastRenderTime,
                isRunning: this.isRunning
            },
            managers: {
                rendering: this.managers.rendering ? 'OK' : 'ERROR',
                effects: this.managers.effects ? 'OK' : 'ERROR',
                overlay: this.managers.overlay ? 'OK' : 'ERROR',
                optimization: this.managers.optimization ? 'OK' : 'ERROR',
                metrics: this.managers.metrics ? 'OK' : 'ERROR'
            }
        };
    }
    
    /**
     * 🔧 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Propagar configuración a gestores
        if (this.managers.rendering && newConfig.rendering) {
            this.managers.rendering.updateConfig(newConfig);
        }
        if (this.managers.effects && newConfig.effects) {
            this.managers.effects.updateConfig(newConfig);
        }
        if (this.managers.overlay && newConfig.overlay) {
            this.managers.overlay.updateConfig(newConfig);
        }
        if (this.managers.optimization && newConfig.optimization) {
            this.managers.optimization.updateConfig(newConfig);
        }
        
        console.log('🔧 Configuración del renderer actualizada');
    }
    
    /**
     * 🧹 Destruir renderizador y gestores
     */
    destroy() {
        // Detener renderizado
        this.stop();
        
        // Destruir gestores
        Object.values(this.managers).forEach(manager => {
            if (manager && typeof manager.destroy === 'function') {
                manager.destroy();
            }
        });
        
        // Limpiar referencias
        this.managers = {};
        this.canvas = null;
        this.ctx = null;
        this.gameEngine = null;
        
        // Limpiar overlay global
        if (window.canvasOverlay) {
            delete window.canvasOverlay;
        }
        
        console.log('🧹 CanvasRenderer destruido');
    }
} 