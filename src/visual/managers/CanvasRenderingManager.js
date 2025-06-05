/**
 * 🎨 CANVAS RENDERING MANAGER
 * Gestor especializado para renderizado básico de entidades del juego
 * 
 * RESPONSABILIDADES:
 * - Renderizado de planetas y flotas
 * - Configuración y gestión del canvas
 * - Renderizado de background y elementos básicos
 * - Batch rendering optimizado
 * 
 * PATRÓN: Template Method Pattern
 * PRINCIPIOS: Single Responsibility, Open/Closed
 */

export class CanvasRenderingManager {
    constructor(canvas, ctx, config = {}) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = {
            // Canvas configuration
            canvas: {
                width: 'auto',
                height: 'auto',
                contextType: '2d',
                alpha: false,
                ...config.canvas
            },
            
            // Rendering settings
            rendering: {
                planetMinRadius: 8,
                planetMaxRadius: 40,
                fleetMinSize: 2,
                fleetMaxSize: 8,
                backgroundStars: 200,
                ...config.rendering
            },
            
            // Colors
            colors: {
                background: '#0a0a0a',
                neutral: '#666666',
                player: '#00ff88',
                enemy: '#ff4444',
                stars: '#ffffff',
                ...config.colors
            }
        };
        
        // Cache de renderizado
        this.renderCache = {
            triangleShape: null,
            planetGradients: new Map(),
            fleetColors: new Map(),
            backgroundStars: [],
            lastCacheUpdate: 0,
            cacheInterval: 1000
        };
        
        // Estado del viewport
        this.viewport = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            centerX: 0,
            centerY: 0,
            lastUpdate: 0
        };
        
        this.initializeCanvas();
        this.generateBackgroundStars();
        this.precomputeShapes();
        
        console.log('🎨 CanvasRenderingManager inicializado');
    }
    
    /**
     * 🔧 Inicializar configuración del canvas
     */
    initializeCanvas() {
        if (!this.canvas || !this.ctx) {
            throw new Error('Canvas o contexto no válido');
        }
        
        // Configurar propiedades del contexto
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Actualizar tamaño del viewport
        this.updateViewport();
        
        console.log('🔧 Canvas inicializado correctamente');
    }
    
    /**
     * 📐 Actualizar viewport
     */
    updateViewport() {
        this.viewport.width = this.canvas.width;
        this.viewport.height = this.canvas.height;
        this.viewport.centerX = this.viewport.width / 2;
        this.viewport.centerY = this.viewport.height / 2;
        this.viewport.lastUpdate = Date.now();
    }
    
    /**
     * ⭐ Generar estrellas de fondo
     */
    generateBackgroundStars() {
        this.renderCache.backgroundStars = [];
        const starCount = this.config.rendering.backgroundStars;
        
        for (let i = 0; i < starCount; i++) {
            this.renderCache.backgroundStars.push({
                x: Math.random() * this.viewport.width * 2,
                y: Math.random() * this.viewport.height * 2,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        console.log(`⭐ ${starCount} estrellas de fondo generadas`);
    }
    
    /**
     * 🔺 Precomputar formas básicas
     */
    precomputeShapes() {
        // Precomputar forma de triángulo para flotas
        this.renderCache.triangleShape = this.createTriangleShape();
        
        console.log('🔺 Formas básicas precomputadas');
    }
    
    /**
     * 🔺 Crear forma de triángulo
     */
    createTriangleShape() {
        const size = 10;
        return [
            { x: 0, y: -size },
            { x: -size * 0.6, y: size * 0.8 },
            { x: size * 0.6, y: size * 0.8 }
        ];
    }
    
    /**
     * 🎨 Renderizar entidades principales (Template Method)
     */
    renderEntities(renderData) {
        if (!renderData) return;
        
        // 1. Limpiar canvas
        this.clearCanvas();
        
        // 2. Renderizar background
        this.renderBackground();
        
        // 3. Renderizar planetas
        if (renderData.planets) {
            this.renderPlanetsBatch(renderData.planets);
        }
        
        // 4. Renderizar flotas
        if (renderData.fleets) {
            this.renderFleetsBatch(renderData.fleets);
        }
        
        // 5. Actualizar cache si es necesario
        this.updateCacheIfNeeded();
    }
    
    /**
     * 🧹 Limpiar canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.viewport.width, this.viewport.height);
    }
    
    /**
     * 🌌 Renderizar background con estrellas
     */
    renderBackground() {
        this.ctx.save();
        
        // Renderizar estrellas
        this.ctx.fillStyle = this.config.colors.stars;
        
        for (const star of this.renderCache.backgroundStars) {
            // Efecto de parpadeo
            const twinkle = Math.sin(Date.now() * 0.001 + star.twinkle) * 0.3 + 0.7;
            this.ctx.globalAlpha = star.opacity * twinkle;
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 🪐 Renderizar planetas en lote
     */
    renderPlanetsBatch(planets) {
        for (const planet of planets) {
            this.renderPlanet(planet);
        }
    }
    
    /**
     * 🪐 Renderizar planeta individual
     */
    renderPlanet(planetData) {
        const { x, y, radius, owner, population, maxPopulation } = planetData;
        
        this.ctx.save();
        
        // Color según propietario
        const color = this.getPlanetColor(owner);
        
        // Crear gradiente si no existe en cache
        let gradient = this.renderCache.planetGradients.get(color);
        if (!gradient) {
            gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.7, this.darkenColor(color, 0.3));
            gradient.addColorStop(1, this.darkenColor(color, 0.6));
            this.renderCache.planetGradients.set(color, gradient);
        }
        
        // Renderizar planeta
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Borde
        this.ctx.strokeStyle = this.lightenColor(color, 0.2);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Población (texto)
        if (population > 0) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${Math.max(10, radius * 0.4)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(Math.floor(population), x, y);
        }
        
        this.ctx.restore();
    }
    
    /**
     * 🚀 Renderizar flotas en lote
     */
    renderFleetsBatch(fleets) {
        for (const fleet of fleets) {
            this.renderFleet(fleet);
        }
    }
    
    /**
     * 🚀 Renderizar flota individual
     */
    renderFleet(fleetData) {
        const { x, y, angle, size, owner, population } = fleetData;
        
        this.ctx.save();
        
        // Posicionar y rotar
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        // Color según propietario
        const color = this.getFleetColor(owner);
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = this.lightenColor(color, 0.3);
        this.ctx.lineWidth = 1;
        
        // Escalar según tamaño
        const scale = Math.max(0.5, Math.min(2, size / 10));
        this.ctx.scale(scale, scale);
        
        // Renderizar triángulo
        this.ctx.beginPath();
        const triangle = this.renderCache.triangleShape;
        this.ctx.moveTo(triangle[0].x, triangle[0].y);
        for (let i = 1; i < triangle.length; i++) {
            this.ctx.lineTo(triangle[i].x, triangle[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Población de la flota (opcional, solo si es grande)
        if (population > 50) {
            this.ctx.save();
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(Math.floor(population), x, y - 15);
            this.ctx.restore();
        }
    }
    
    /**
     * 🎨 Obtener color de planeta
     */
    getPlanetColor(owner) {
        if (owner === 0) return this.config.colors.neutral;
        if (owner === 1) return this.config.colors.player;
        return this.config.colors.enemy;
    }
    
    /**
     * 🎨 Obtener color de flota
     */
    getFleetColor(owner) {
        // Usar cache de colores
        let color = this.renderCache.fleetColors.get(owner);
        if (!color) {
            if (owner === 0) color = this.config.colors.neutral;
            else if (owner === 1) color = this.config.colors.player;
            else color = this.config.colors.enemy;
            
            this.renderCache.fleetColors.set(owner, color);
        }
        return color;
    }
    
    /**
     * 🎨 Oscurecer color
     */
    darkenColor(color, factor) {
        // Implementación simple de oscurecimiento
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
        
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    /**
     * 🎨 Aclarar color
     */
    lightenColor(color, factor) {
        // Implementación simple de aclarado
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + factor));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + factor));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + factor));
        
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    /**
     * 🔄 Actualizar cache si es necesario
     */
    updateCacheIfNeeded() {
        const now = Date.now();
        if (now - this.renderCache.lastCacheUpdate > this.renderCache.cacheInterval) {
            this.clearExpiredCache();
            this.renderCache.lastCacheUpdate = now;
        }
    }
    
    /**
     * 🧹 Limpiar cache expirado
     */
    clearExpiredCache() {
        // Limpiar gradientes si hay demasiados
        if (this.renderCache.planetGradients.size > 50) {
            this.renderCache.planetGradients.clear();
        }
        
        // Limpiar colores de flotas si hay demasiados
        if (this.renderCache.fleetColors.size > 20) {
            this.renderCache.fleetColors.clear();
        }
    }
    
    /**
     * 📊 Obtener información del renderizado
     */
    getRenderingInfo() {
        return {
            viewport: { ...this.viewport },
            cache: {
                planetGradients: this.renderCache.planetGradients.size,
                fleetColors: this.renderCache.fleetColors.size,
                backgroundStars: this.renderCache.backgroundStars.length
            },
            config: this.config
        };
    }
    
    /**
     * 🔧 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Regenerar elementos si es necesario
        if (newConfig.rendering?.backgroundStars) {
            this.generateBackgroundStars();
        }
        
        console.log('🔧 Configuración de renderizado actualizada');
    }
    
    /**
     * 🧹 Limpiar recursos
     */
    destroy() {
        this.renderCache.planetGradients.clear();
        this.renderCache.fleetColors.clear();
        this.renderCache.backgroundStars = [];
        
        console.log('🧹 CanvasRenderingManager destruido');
    }
} 