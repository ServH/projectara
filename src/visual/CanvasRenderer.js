/**
 * 🎨 GALCON GAME - CANVAS 2D RENDERER
 * Sistema de renderizado optimizado con Canvas 2D para máximo rendimiento
 * Mantiene toda la funcionalidad del movimiento orgánico y efectos visuales
 * 
 * OPTIMIZACIONES CANVAS 2D:
 * - ⚡ Renderizado directo sin manipulación DOM
 * - 🧮 Cache de formas y colores
 * - 🎯 Viewport culling optimizado
 * - 📊 Batch rendering de elementos similares
 * - 🌊 Preserva movimiento orgánico completo
 * - 🎮 Sistema de overlay para feedback interactivo
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class CanvasRenderer {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        
        // 🚀 OPTIMIZACIÓN: Flag de debug centralizado
        this.debugMode = false;
        
        // 🚀 OPTIMIZACIÓN: Cache de formas y colores
        this.renderCache = {
            triangleShape: null,
            planetGradients: new Map(),
            fleetColors: new Map(),
            lastCacheUpdate: 0,
            cacheInterval: 1000 // Actualizar cache cada segundo
        };
        
        // 🚀 OPTIMIZACIÓN: Cache matemático expandido
        this.mathCache = {
            sin: new Map(),
            cos: new Map(),
            angles: new Map(),
            distances: new Map(),
            cacheSize: 0,
            maxCacheSize: 1000
        };
        
        // 🚀 OPTIMIZACIÓN: Configuración de optimización
        this.optimizationConfig = {
            frameSkipping: {
                enabled: false, // Canvas es más rápido, menos necesario
                skipInterval: 2,
                frameCounter: 0
            },
            lod: {
                enabled: true,
                maxVisibleFleets: 100, // Canvas puede manejar más
                distanceThresholds: [200, 400, 800] // Niveles de detalle
            },
            culling: {
                enabled: true,
                margin: 100 // Margen más amplio para Canvas
            },
            batching: {
                enabled: true,
                fleetBatchSize: 50,
                planetBatchSize: 20
            }
        };
        
        // 🚀 OPTIMIZACIÓN: Métricas de rendimiento
        this.performanceMetrics = {
            frameTime: 0,
            renderTime: 0,
            updateTime: 0,
            drawCalls: 0,
            culledObjects: 0,
            visibleFleets: 0,
            visiblePlanets: 0
        };
        
        // 🚀 OPTIMIZACIÓN: Cache de viewport
        this.viewport = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            centerX: 0,
            centerY: 0,
            lastUpdate: 0
        };
        
        // 🌊 EFECTOS VISUALES: Cache de trails y efectos
        this.visualEffects = {
            trails: new Map(),
            explosions: [],
            particles: [],
            backgroundStars: []
        };
        
        // 🎮 NUEVO: Sistema de overlay para feedback interactivo
        this.overlayElements = {
            dragLines: [],
            selectionBoxes: [],
            planetHighlights: [],
            targetHighlights: [],
            feedbackLines: []
        };
        
        this.setupCanvas();
        this.precomputeMathCache();
        this.setupEventListeners();
        this.generateBackgroundStars();
        this.setupOverlaySystem();
        
        if (this.debugMode) {
            console.log('🎨 CanvasRenderer inicializado con optimizaciones Canvas 2D');
        }
    }

    /**
     * 🎮 NUEVO: Configurar sistema de overlay para feedback interactivo
     */
    setupOverlaySystem() {
        // Exponer métodos para que otros sistemas puedan añadir elementos de overlay
        window.canvasOverlay = {
            addDragLine: this.addDragLine.bind(this),
            removeDragLine: this.removeDragLine.bind(this),
            clearDragLines: this.clearDragLines.bind(this),
            addPlanetHighlight: this.addPlanetHighlight.bind(this),
            removePlanetHighlight: this.removePlanetHighlight.bind(this),
            addTargetHighlight: this.addTargetHighlight.bind(this),
            removeTargetHighlight: this.removeTargetHighlight.bind(this),
            addSelectionBox: this.addSelectionBox.bind(this),
            updateSelectionBox: this.updateSelectionBox.bind(this),
            removeSelectionBox: this.removeSelectionBox.bind(this),
            clearAllOverlays: this.clearAllOverlays.bind(this)
        };
        
        console.log('🎮 Sistema de overlay Canvas configurado');
    }

    /**
     * 🎮 Añadir línea de drag & drop
     */
    addDragLine(id, fromX, fromY, toX, toY, options = {}) {
        const line = {
            id: id,
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            color: options.color || '#00ff88',
            width: options.width || 3,
            opacity: options.opacity || 0.7,
            dashArray: options.dashArray || [8, 4],
            animation: options.animation || null,
            timestamp: Date.now()
        };
        
        // Remover línea existente con el mismo ID
        this.removeDragLine(id);
        
        this.overlayElements.dragLines.push(line);
        return line;
    }

    /**
     * 🎮 Remover línea de drag & drop
     */
    removeDragLine(id) {
        this.overlayElements.dragLines = this.overlayElements.dragLines.filter(line => line.id !== id);
    }

    /**
     * 🎮 Limpiar todas las líneas de drag
     */
    clearDragLines() {
        this.overlayElements.dragLines = [];
    }

    /**
     * 🎮 Añadir highlight de planeta
     */
    addPlanetHighlight(id, x, y, radius, options = {}) {
        const highlight = {
            id: id,
            x: x,
            y: y,
            radius: radius,
            color: options.color || '#ffaa00',
            width: options.width || 4,
            opacity: options.opacity || 0.8,
            animation: options.animation || 'pulse',
            timestamp: Date.now()
        };
        
        // Remover highlight existente con el mismo ID
        this.removePlanetHighlight(id);
        
        this.overlayElements.planetHighlights.push(highlight);
        return highlight;
    }

    /**
     * 🎮 Remover highlight de planeta
     */
    removePlanetHighlight(id) {
        this.overlayElements.planetHighlights = this.overlayElements.planetHighlights.filter(h => h.id !== id);
    }

    /**
     * 🎮 Añadir highlight de objetivo
     */
    addTargetHighlight(id, x, y, radius, options = {}) {
        const highlight = {
            id: id,
            x: x,
            y: y,
            radius: radius,
            color: options.color || '#ff6666',
            width: options.width || 5,
            opacity: options.opacity || 0.9,
            animation: options.animation || 'pulse',
            timestamp: Date.now()
        };
        
        // Remover highlight existente con el mismo ID
        this.removeTargetHighlight(id);
        
        this.overlayElements.targetHighlights.push(highlight);
        return highlight;
    }

    /**
     * 🎮 Remover highlight de objetivo
     */
    removeTargetHighlight(id) {
        this.overlayElements.targetHighlights = this.overlayElements.targetHighlights.filter(h => h.id !== id);
    }

    /**
     * 🎮 Añadir caja de selección
     */
    addSelectionBox(id, x, y, width, height, options = {}) {
        const box = {
            id: id,
            x: x,
            y: y,
            width: width,
            height: height,
            color: options.color || '#00ff88',
            borderWidth: options.borderWidth || 2,
            fillOpacity: options.fillOpacity || 0.1,
            borderOpacity: options.borderOpacity || 0.8,
            timestamp: Date.now()
        };
        
        // Remover caja existente con el mismo ID
        this.removeSelectionBox(id);
        
        this.overlayElements.selectionBoxes.push(box);
        return box;
    }

    /**
     * 🎮 Actualizar caja de selección
     */
    updateSelectionBox(id, x, y, width, height) {
        const box = this.overlayElements.selectionBoxes.find(b => b.id === id);
        if (box) {
            box.x = x;
            box.y = y;
            box.width = width;
            box.height = height;
        }
    }

    /**
     * 🎮 Remover caja de selección
     */
    removeSelectionBox(id) {
        this.overlayElements.selectionBoxes = this.overlayElements.selectionBoxes.filter(b => b.id !== id);
    }

    /**
     * 🎮 Limpiar todos los overlays
     */
    clearAllOverlays() {
        this.overlayElements.dragLines = [];
        this.overlayElements.selectionBoxes = [];
        this.overlayElements.planetHighlights = [];
        this.overlayElements.targetHighlights = [];
        this.overlayElements.feedbackLines = [];
    }

    /**
     * 🚀 OPTIMIZACIÓN: Configurar canvas 2D
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas no encontrado');
            return;
        }
        
        // Convertir de SVG a Canvas si es necesario
        if (this.canvas.tagName.toLowerCase() === 'svg') {
            const parent = this.canvas.parentNode;
            const newCanvas = document.createElement('canvas');
            newCanvas.id = 'gameCanvas';
            newCanvas.style.cssText = this.canvas.style.cssText;
            parent.replaceChild(newCanvas, this.canvas);
            this.canvas = newCanvas;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Configurar canvas para alta calidad
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Configurar estilos
        this.canvas.style.background = 'radial-gradient(ellipse at center, #000033 0%, #000011 70%, #000000 100%)';
        this.canvas.style.cursor = 'crosshair';
        
        // Actualizar tamaño
        this.updateCanvasSize();
        
        // Manejar redimensionamiento
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
        });
        
        if (this.debugMode) {
            console.log('🖼️ Canvas 2D configurado');
        }
    }

    /**
     * Actualizar tamaño del canvas
     */
    updateCanvasSize() {
        if (!this.canvas) return;
        
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Configurar tamaño real del canvas
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Configurar tamaño CSS
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Escalar contexto para alta resolución
        this.ctx.scale(dpr, dpr);
        
        // Actualizar viewport
        this.viewport.width = rect.width;
        this.viewport.height = rect.height;
        this.viewport.centerX = rect.width / 2;
        this.viewport.centerY = rect.height / 2;
        this.viewport.lastUpdate = performance.now();
    }

    /**
     * 🚀 OPTIMIZACIÓN: Precomputar cache matemático
     */
    precomputeMathCache() {
        // Precomputar ángulos comunes (cada grado para mayor precisión)
        for (let degrees = 0; degrees < 360; degrees++) {
            const radians = degrees * (Math.PI / 180);
            this.mathCache.sin.set(degrees, Math.sin(radians));
            this.mathCache.cos.set(degrees, Math.cos(radians));
        }
        
        // Precomputar forma del triángulo de flota
        this.renderCache.triangleShape = [
            { x: -4, y: -2 },
            { x: 4, y: 0 },
            { x: -4, y: 2 }
        ];
        
        if (this.debugMode) {
            console.log(`✅ Cache matemático precomputado: ${this.mathCache.sin.size} valores`);
        }
    }

    /**
     * Generar estrellas de fondo
     */
    generateBackgroundStars() {
        const starCount = 200;
        this.visualEffects.backgroundStars = [];
        
        for (let i = 0; i < starCount; i++) {
            this.visualEffects.backgroundStars.push({
                x: Math.random() * 2000,
                y: Math.random() * 2000,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        eventBus.on(GAME_EVENTS.FLEET_LAUNCHED, this.onFleetLaunched.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived.bind(this));
        eventBus.on(GAME_EVENTS.PLANET_CONQUERED, this.onPlanetConquered.bind(this));
        eventBus.on(GAME_EVENTS.BATTLE_START, this.onBattleStart.bind(this));
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular ángulo con cache
     */
    calculateAngleOptimized(dx, dy) {
        const key = `${Math.round(dx * 10)},${Math.round(dy * 10)}`;
        
        if (this.mathCache.angles.has(key)) {
            return this.mathCache.angles.get(key);
        }
        
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        if (this.mathCache.angles.size < this.mathCache.maxCacheSize) {
            this.mathCache.angles.set(key, angle);
        }
        
        return angle;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Calcular distancia con cache
     */
    calculateDistanceOptimized(x1, y1, x2, y2) {
        const key = `${Math.round(x1)},${Math.round(y1)},${Math.round(x2)},${Math.round(y2)}`;
        
        if (this.mathCache.distances.has(key)) {
            return this.mathCache.distances.get(key);
        }
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.mathCache.distances.size < this.mathCache.maxCacheSize) {
            this.mathCache.distances.set(key, distance);
        }
        
        return distance;
    }

    /**
     * Verificar si un punto está en el viewport
     */
    isInViewport(x, y, margin = 0) {
        return (
            x >= this.viewport.x - margin &&
            x <= this.viewport.x + this.viewport.width + margin &&
            y >= this.viewport.y - margin &&
            y <= this.viewport.y + this.viewport.height + margin
        );
    }

    /**
     * Iniciar renderizado
     */
    start() {
        this.isRunning = true;
        this.render();
        console.log('🎨 CanvasRenderer iniciado');
    }

    /**
     * Detener renderizado
     */
    stop() {
        this.isRunning = false;
        console.log('🎨 CanvasRenderer detenido');
    }

    /**
     * 🚀 OPTIMIZACIÓN: Loop principal de renderizado
     */
    render() {
        if (!this.isRunning) return;
        
        const frameStart = performance.now();
        
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
        
        // Obtener datos de renderizado
        const renderData = this.gameEngine.getRenderData();
        
        // Renderizar fondo
        this.renderBackground();
        
        // Renderizar con LOD y culling
        this.renderWithOptimizations(renderData);
        
        // 🎮 NUEVO: Renderizar overlays de feedback interactivo
        this.renderOverlays();
        
        // Renderizar efectos visuales
        this.renderVisualEffects();
        
        // Actualizar métricas
        this.performanceMetrics.frameTime = performance.now() - frameStart;
        
        requestAnimationFrame(() => this.render());
    }

    /**
     * 🎮 NUEVO: Renderizar overlays de feedback interactivo
     */
    renderOverlays() {
        const currentTime = Date.now();
        
        // Renderizar líneas de drag & drop
        this.overlayElements.dragLines.forEach(line => {
            this.renderDragLine(line, currentTime);
        });
        
        // Renderizar cajas de selección
        this.overlayElements.selectionBoxes.forEach(box => {
            this.renderSelectionBox(box, currentTime);
        });
        
        // Renderizar highlights de planetas
        this.overlayElements.planetHighlights.forEach(highlight => {
            this.renderPlanetHighlight(highlight, currentTime);
        });
        
        // Renderizar highlights de objetivos
        this.overlayElements.targetHighlights.forEach(highlight => {
            this.renderTargetHighlight(highlight, currentTime);
        });
    }

    /**
     * 🎮 Renderizar línea de drag & drop
     */
    renderDragLine(line, currentTime) {
        this.ctx.save();
        
        // Configurar estilo de línea
        this.ctx.strokeStyle = line.color;
        this.ctx.lineWidth = line.width;
        this.ctx.globalAlpha = line.opacity;
        
        // Configurar línea discontinua si está especificada
        if (line.dashArray) {
            this.ctx.setLineDash(line.dashArray);
        }
        
        // Aplicar animación si existe
        if (line.animation === 'pulse') {
            const pulseIntensity = Math.sin((currentTime - line.timestamp) * 0.005) * 0.3 + 0.7;
            this.ctx.globalAlpha *= pulseIntensity;
        }
        
        // Dibujar línea
        this.ctx.beginPath();
        this.ctx.moveTo(line.fromX, line.fromY);
        this.ctx.lineTo(line.toX, line.toY);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    /**
     * 🎮 Renderizar caja de selección
     */
    renderSelectionBox(box, currentTime) {
        this.ctx.save();
        
        // Renderizar relleno
        this.ctx.fillStyle = box.color;
        this.ctx.globalAlpha = box.fillOpacity;
        this.ctx.fillRect(box.x, box.y, box.width, box.height);
        
        // Renderizar borde
        this.ctx.strokeStyle = box.color;
        this.ctx.lineWidth = box.borderWidth;
        this.ctx.globalAlpha = box.borderOpacity;
        this.ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        this.ctx.restore();
    }

    /**
     * 🎮 Renderizar highlight de planeta
     */
    renderPlanetHighlight(highlight, currentTime) {
        this.ctx.save();
        
        // Configurar estilo
        this.ctx.strokeStyle = highlight.color;
        this.ctx.lineWidth = highlight.width;
        this.ctx.globalAlpha = highlight.opacity;
        
        // Aplicar animación
        if (highlight.animation === 'pulse') {
            const pulseIntensity = Math.sin((currentTime - highlight.timestamp) * 0.008) * 0.4 + 0.6;
            this.ctx.globalAlpha *= pulseIntensity;
            const radiusMultiplier = 1 + Math.sin((currentTime - highlight.timestamp) * 0.008) * 0.1;
            
            // Dibujar círculo con pulso
            this.ctx.beginPath();
            this.ctx.arc(highlight.x, highlight.y, highlight.radius * radiusMultiplier, 0, Math.PI * 2);
            this.ctx.stroke();
        } else {
            // Dibujar círculo normal
            this.ctx.beginPath();
            this.ctx.arc(highlight.x, highlight.y, highlight.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    /**
     * 🎮 Renderizar highlight de objetivo
     */
    renderTargetHighlight(highlight, currentTime) {
        this.ctx.save();
        
        // Configurar estilo
        this.ctx.strokeStyle = highlight.color;
        this.ctx.lineWidth = highlight.width;
        this.ctx.globalAlpha = highlight.opacity;
        
        // Aplicar animación más intensa para objetivos
        if (highlight.animation === 'pulse') {
            const pulseIntensity = Math.sin((currentTime - highlight.timestamp) * 0.012) * 0.5 + 0.5;
            this.ctx.globalAlpha *= pulseIntensity;
            const radiusMultiplier = 1 + Math.sin((currentTime - highlight.timestamp) * 0.012) * 0.2;
            
            // Dibujar círculo con pulso intenso
            this.ctx.beginPath();
            this.ctx.arc(highlight.x, highlight.y, highlight.radius * radiusMultiplier, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    /**
     * Renderizar fondo con estrellas
     */
    renderBackground() {
        // Renderizar estrellas de fondo
        this.ctx.fillStyle = '#ffffff';
        this.visualEffects.backgroundStars.forEach(star => {
            if (this.isInViewport(star.x, star.y, 50)) {
                const twinkle = Math.sin(Date.now() * 0.001 + star.twinkle) * 0.3 + 0.7;
                this.ctx.globalAlpha = star.opacity * twinkle;
                this.ctx.fillRect(star.x - star.size/2, star.y - star.size/2, star.size, star.size);
            }
        });
        this.ctx.globalAlpha = 1.0;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Renderizar con optimizaciones
     */
    renderWithOptimizations(renderData) {
        const renderStart = performance.now();
        
        // Filtrar objetos visibles
        const visibleFleets = this.cullFleets(renderData.fleets || []);
        const visiblePlanets = this.cullPlanets(renderData.planets || []);
        
        // Aplicar LOD a flotas
        const lodFleets = this.applyLOD(visibleFleets);
        
        // Renderizar en batches
        this.renderPlanetsBatch(visiblePlanets);
        this.renderFleetsBatch(lodFleets);
        
        // Actualizar métricas
        this.performanceMetrics.renderTime = performance.now() - renderStart;
        this.performanceMetrics.visibleFleets = lodFleets.length;
        this.performanceMetrics.visiblePlanets = visiblePlanets.length;
        this.performanceMetrics.culledObjects = 
            (renderData.fleets?.length || 0) - visibleFleets.length +
            (renderData.planets?.length || 0) - visiblePlanets.length;
    }

    /**
     * 🚀 OPTIMIZACIÓN: Culling de flotas
     */
    cullFleets(fleets) {
        if (!this.optimizationConfig.culling.enabled) return fleets;
        
        return fleets.filter(fleet => 
            this.isInViewport(fleet.x, fleet.y, this.optimizationConfig.culling.margin)
        );
    }

    /**
     * 🚀 OPTIMIZACIÓN: Culling de planetas
     */
    cullPlanets(planets) {
        if (!this.optimizationConfig.culling.enabled) return planets;
        
        return planets.filter(planet => 
            this.isInViewport(planet.x, planet.y, planet.radius + this.optimizationConfig.culling.margin)
        );
    }

    /**
     * 🚀 OPTIMIZACIÓN: Aplicar Level of Detail
     */
    applyLOD(fleets) {
        if (!this.optimizationConfig.lod.enabled) return fleets;
        
        const maxFleets = this.optimizationConfig.lod.maxVisibleFleets;
        if (fleets.length <= maxFleets) return fleets;
        
        // Ordenar por distancia al centro
        const fleetsWithDistance = fleets.map(fleet => ({
            ...fleet,
            distance: this.calculateDistanceOptimized(
                fleet.x, fleet.y, 
                this.viewport.centerX, this.viewport.centerY
            )
        }));
        
        fleetsWithDistance.sort((a, b) => a.distance - b.distance);
        return fleetsWithDistance.slice(0, maxFleets);
    }

    /**
     * 🚀 OPTIMIZACIÓN: Renderizar planetas en batch
     */
    renderPlanetsBatch(planets) {
        planets.forEach(planet => {
            this.renderPlanet(planet);
        });
    }

    /**
     * 🚀 OPTIMIZACIÓN: Renderizar flotas en batch
     */
    renderFleetsBatch(fleets) {
        // Agrupar flotas por color para batch rendering
        const fleetsByColor = new Map();
        
        fleets.forEach(fleet => {
            const color = fleet.color || this.getFleetColor(fleet);
            if (!fleetsByColor.has(color)) {
                fleetsByColor.set(color, []);
            }
            fleetsByColor.get(color).push(fleet);
        });
        
        // Renderizar cada grupo de color
        fleetsByColor.forEach((colorFleets, color) => {
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = color;
            
            colorFleets.forEach(fleet => {
                this.renderFleet(fleet);
            });
        });
    }

    /**
     * 🌊 RENDERIZAR PLANETA con efectos visuales completos
     */
    renderPlanet(planetData) {
        const { x, y, radius, color, ships, owner } = planetData;
        
        // Crear gradiente si no existe en cache
        let gradient = this.renderCache.planetGradients.get(color);
        if (!gradient) {
            gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.7, this.darkenColor(color, 0.3));
            gradient.addColorStop(1, this.darkenColor(color, 0.6));
            this.renderCache.planetGradients.set(color, gradient);
        }
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Renderizar planeta con gradiente
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Borde del planeta
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Texto de naves
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${Math.max(10, radius * 0.4)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(ships || 0, 0, 0);
        
        this.ctx.restore();
    }

    /**
     * 🌊 RENDERIZAR FLOTA con movimiento orgánico completo
     */
    renderFleet(fleetData) {
        const { x, y, targetX, targetY, color, organicIntensity, trail } = fleetData;
        
        // Renderizar trail si existe
        if (trail && trail.length > 1) {
            this.renderFleetTrail(trail, color);
        }
        
        // Calcular ángulo de rotación
        const dx = targetX - x;
        const dy = targetY - y;
        const angle = this.calculateAngleOptimized(dx, dy);
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle * Math.PI / 180);
        
        // Aplicar efectos orgánicos
        if (organicIntensity !== undefined) {
            const intensity = organicIntensity;
            const scale = 1 + intensity * 0.2;
            const opacity = 0.7 + 0.3 * intensity;
            
            this.ctx.scale(scale, scale);
            this.ctx.globalAlpha = opacity;
        }
        
        // Renderizar triángulo de flota
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        const shape = this.renderCache.triangleShape;
        this.ctx.moveTo(shape[0].x, shape[0].y);
        this.ctx.lineTo(shape[1].x, shape[1].y);
        this.ctx.lineTo(shape[2].x, shape[2].y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    /**
     * 🌊 RENDERIZAR TRAIL de flota
     */
    renderFleetTrail(trail, color) {
        if (trail.length < 2) return;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(trail[0].x, trail[0].y);
        
        for (let i = 1; i < trail.length; i++) {
            const alpha = i / trail.length * 0.3;
            this.ctx.globalAlpha = alpha;
            this.ctx.lineTo(trail[i].x, trail[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Renderizar efectos visuales adicionales
     */
    renderVisualEffects() {
        // Renderizar explosiones
        this.visualEffects.explosions.forEach((explosion, index) => {
            this.renderExplosion(explosion);
            
            // Remover explosiones terminadas
            if (explosion.life <= 0) {
                this.visualEffects.explosions.splice(index, 1);
            }
        });
        
        // Renderizar partículas
        this.visualEffects.particles.forEach((particle, index) => {
            this.renderParticle(particle);
            
            // Remover partículas terminadas
            if (particle.life <= 0) {
                this.visualEffects.particles.splice(index, 1);
            }
        });
    }

    /**
     * Obtener color de flota
     */
    getFleetColor(fleet) {
        const ownerColors = {
            'player': '#00ff88',
            'enemy': '#ff4444',
            'neutral': '#888888'
        };
        
        return ownerColors[fleet.owner] || '#ffffff';
    }

    /**
     * Oscurecer color para gradientes
     */
    darkenColor(color, factor) {
        // Implementación simple de oscurecimiento
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            const newR = Math.floor(r * (1 - factor));
            const newG = Math.floor(g * (1 - factor));
            const newB = Math.floor(b * (1 - factor));
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        return color;
    }

    /**
     * Event handlers
     */
    onFleetLaunched(data) {
        // Crear efecto de lanzamiento
        this.createLaunchEffect(data.startX, data.startY);
    }

    onFleetArrived(data) {
        // Crear efecto de llegada
        this.createArrivalEffect(data.targetX, data.targetY);
    }

    onPlanetConquered(data) {
        // Crear efecto de conquista
        this.createConquestEffect(data.x, data.y, data.newColor);
    }

    onBattleStart(data) {
        // Crear efecto de batalla
        this.createBattleEffect(data.x, data.y);
    }

    /**
     * Crear efectos visuales
     */
    createLaunchEffect(x, y) {
        // Implementar efecto de lanzamiento
    }

    createArrivalEffect(x, y) {
        // Implementar efecto de llegada
    }

    createConquestEffect(x, y, color) {
        // Implementar efecto de conquista
    }

    createBattleEffect(x, y) {
        // Implementar efecto de batalla
    }

    renderExplosion(explosion) {
        // Implementar renderizado de explosión
    }

    renderParticle(particle) {
        // Implementar renderizado de partícula
    }

    /**
     * Obtener métricas de rendimiento
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            viewport: { ...this.viewport },
            cacheStats: {
                mathCacheSize: this.mathCache.angles.size + this.mathCache.distances.size,
                renderCacheSize: this.renderCache.planetGradients.size
            },
            performance: { ...this.performanceMetrics },
            overlays: {
                dragLines: this.overlayElements.dragLines.length,
                selectionBoxes: this.overlayElements.selectionBoxes.length,
                planetHighlights: this.overlayElements.planetHighlights.length,
                targetHighlights: this.overlayElements.targetHighlights.length
            }
        };
    }

    /**
     * Destruir renderer
     */
    destroy() {
        this.stop();
        
        // Limpiar event listeners
        eventBus.off(GAME_EVENTS.FLEET_LAUNCHED, this.onFleetLaunched);
        eventBus.off(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived);
        eventBus.off(GAME_EVENTS.PLANET_CONQUERED, this.onPlanetConquered);
        eventBus.off(GAME_EVENTS.BATTLE_START, this.onBattleStart);
        
        // Limpiar caches
        this.mathCache.sin.clear();
        this.mathCache.cos.clear();
        this.mathCache.angles.clear();
        this.mathCache.distances.clear();
        this.renderCache.planetGradients.clear();
        
        // Limpiar overlays
        this.clearAllOverlays();
        
        // Limpiar sistema de overlay global
        if (window.canvasOverlay) {
            delete window.canvasOverlay;
        }
        
        console.log('🎨 CanvasRenderer destruido');
    }
}

export default CanvasRenderer; 