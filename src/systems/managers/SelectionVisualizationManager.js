/**
 * 🎨 SELECTION VISUALIZATION MANAGER
 * Gestor especializado para la visualización de elementos seleccionados
 * Responsabilidad única: Renderizar indicadores visuales de selección
 */

export class SelectionVisualizationManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado de visualización
        this.selectedPlanets = new Set();
        this.animationTime = 0;
        this.lastRenderTime = 0;
        
        // Callbacks configurables
        this.callbacks = {
            onRenderComplete: null,
            onAnimationUpdate: null
        };
        
        console.log('🎨 SelectionVisualizationManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * 🔄 Actualizar planetas seleccionados
     */
    updateSelectedPlanets(selectedPlanetIds) {
        this.selectedPlanets.clear();
        selectedPlanetIds.forEach(id => this.selectedPlanets.add(id));
        
        console.log(`🎨 Actualizados ${selectedPlanetIds.length} planetas seleccionados para visualización`);
    }

    /**
     * 🎬 Actualizar animaciones
     */
    updateAnimations(deltaTime) {
        this.animationTime += deltaTime;
        
        if (this.callbacks.onAnimationUpdate) {
            this.callbacks.onAnimationUpdate({
                animationTime: this.animationTime,
                deltaTime
            });
        }
    }

    /**
     * 🎨 Renderizar indicadores de selección
     */
    render(ctx, camera) {
        if (this.selectedPlanets.size === 0) {
            return;
        }

        const currentTime = Date.now();
        this.lastRenderTime = currentTime;

        // Configurar contexto para selección
        ctx.save();
        
        // Renderizar cada planeta seleccionado
        this.selectedPlanets.forEach(planetId => {
            const planet = this.gameEngine.getPlanetById(planetId);
            if (planet && this.isPlanetVisible(planet, camera)) {
                this.renderPlanetSelection(ctx, planet, camera);
            }
        });

        // Renderizar estadísticas si está habilitado
        if (this.config.showSelectionStats && this.selectedPlanets.size > 0) {
            this.renderSelectionStats(ctx, camera);
        }

        ctx.restore();

        if (this.callbacks.onRenderComplete) {
            this.callbacks.onRenderComplete({
                renderedCount: this.selectedPlanets.size,
                renderTime: Date.now() - currentTime
            });
        }
    }

    /**
     * 🪐 Renderizar selección de un planeta individual
     */
    renderPlanetSelection(ctx, planet, camera) {
        const screenPos = camera.worldToScreen(planet.x, planet.y);
        const screenRadius = planet.radius * camera.zoom;

        // Calcular efectos de animación
        const pulsePhase = (this.animationTime * this.config.pulseSpeed) % (Math.PI * 2);
        const pulseIntensity = (Math.sin(pulsePhase) + 1) * 0.5; // 0 a 1
        
        // Renderizar anillo de selección principal
        this.renderSelectionRing(ctx, screenPos, screenRadius, pulseIntensity);
        
        // Renderizar efectos adicionales
        if (this.config.showSelectionGlow) {
            this.renderSelectionGlow(ctx, screenPos, screenRadius, pulseIntensity);
        }
        
        if (this.config.showSelectionCorners) {
            this.renderSelectionCorners(ctx, screenPos, screenRadius);
        }
        
        // Renderizar información del planeta si está habilitado
        if (this.config.showPlanetInfo) {
            this.renderPlanetInfo(ctx, planet, screenPos, screenRadius);
        }
    }

    /**
     * 💍 Renderizar anillo de selección
     */
    renderSelectionRing(ctx, screenPos, screenRadius, pulseIntensity) {
        const ringRadius = screenRadius + this.config.selectionRingOffset + 
                          (pulseIntensity * this.config.pulseMagnitude);
        
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, ringRadius, 0, Math.PI * 2);
        
        // Color con alpha animado
        const alpha = this.config.selectionAlpha * (0.5 + pulseIntensity * 0.5);
        ctx.strokeStyle = this.addAlphaToColor(this.config.selectionColor, alpha);
        ctx.lineWidth = this.config.selectionLineWidth;
        
        // Efecto de línea discontinua si está habilitado
        if (this.config.useDashedLine) {
            ctx.setLineDash([this.config.dashLength, this.config.dashGap]);
        }
        
        ctx.stroke();
        
        // Resetear línea discontinua
        if (this.config.useDashedLine) {
            ctx.setLineDash([]);
        }
    }

    /**
     * ✨ Renderizar efecto de brillo
     */
    renderSelectionGlow(ctx, screenPos, screenRadius, pulseIntensity) {
        const glowRadius = screenRadius + this.config.glowOffset + 
                          (pulseIntensity * this.config.glowPulseMagnitude);
        
        // Crear gradiente radial para el brillo
        const gradient = ctx.createRadialGradient(
            screenPos.x, screenPos.y, screenRadius,
            screenPos.x, screenPos.y, glowRadius
        );
        
        const glowAlpha = this.config.glowAlpha * pulseIntensity;
        gradient.addColorStop(0, this.addAlphaToColor(this.config.glowColor, glowAlpha));
        gradient.addColorStop(1, this.addAlphaToColor(this.config.glowColor, 0));
        
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    /**
     * 📐 Renderizar esquinas de selección
     */
    renderSelectionCorners(ctx, screenPos, screenRadius) {
        const cornerSize = this.config.cornerSize;
        const cornerOffset = screenRadius + this.config.cornerOffset;
        
        ctx.strokeStyle = this.config.cornerColor;
        ctx.lineWidth = this.config.cornerLineWidth;
        
        // Posiciones de las esquinas
        const corners = [
            { x: screenPos.x - cornerOffset, y: screenPos.y - cornerOffset }, // Top-left
            { x: screenPos.x + cornerOffset, y: screenPos.y - cornerOffset }, // Top-right
            { x: screenPos.x - cornerOffset, y: screenPos.y + cornerOffset }, // Bottom-left
            { x: screenPos.x + cornerOffset, y: screenPos.y + cornerOffset }  // Bottom-right
        ];
        
        corners.forEach(corner => {
            this.renderCorner(ctx, corner.x, corner.y, cornerSize);
        });
    }

    /**
     * 📐 Renderizar una esquina individual
     */
    renderCorner(ctx, x, y, size) {
        ctx.beginPath();
        // Línea horizontal
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        // Línea vertical
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.stroke();
    }

    /**
     * 📊 Renderizar información del planeta
     */
    renderPlanetInfo(ctx, planet, screenPos, screenRadius) {
        const infoY = screenPos.y - screenRadius - this.config.infoOffset;
        
        ctx.fillStyle = this.config.infoTextColor;
        ctx.font = this.config.infoFont;
        ctx.textAlign = 'center';
        
        // Información básica
        const infoText = `${planet.ships} ships`;
        ctx.fillText(infoText, screenPos.x, infoY);
        
        // Información adicional si hay espacio
        if (this.config.showDetailedInfo && screenRadius > this.config.minRadiusForDetails) {
            const productionText = `+${planet.production}/s`;
            ctx.fillText(productionText, screenPos.x, infoY + this.config.infoLineHeight);
        }
    }

    /**
     * 📈 Renderizar estadísticas de selección
     */
    renderSelectionStats(ctx, camera) {
        const stats = this.calculateSelectionStats();
        if (!stats) return;
        
        const x = this.config.statsPosition.x;
        const y = this.config.statsPosition.y;
        
        ctx.fillStyle = this.config.statsBackgroundColor;
        ctx.fillRect(x, y, this.config.statsWidth, this.config.statsHeight);
        
        ctx.fillStyle = this.config.statsTextColor;
        ctx.font = this.config.statsFont;
        ctx.textAlign = 'left';
        
        let currentY = y + this.config.statsLineHeight;
        
        ctx.fillText(`Planetas: ${stats.count}`, x + this.config.statsPadding, currentY);
        currentY += this.config.statsLineHeight;
        
        ctx.fillText(`Naves: ${stats.totalShips}`, x + this.config.statsPadding, currentY);
        currentY += this.config.statsLineHeight;
        
        ctx.fillText(`Producción: ${stats.totalProduction}/s`, x + this.config.statsPadding, currentY);
    }

    /**
     * 📊 Calcular estadísticas de selección
     */
    calculateSelectionStats() {
        if (this.selectedPlanets.size === 0) return null;
        
        let totalShips = 0;
        let totalProduction = 0;
        let validPlanets = 0;
        
        this.selectedPlanets.forEach(planetId => {
            const planet = this.gameEngine.getPlanetById(planetId);
            if (planet) {
                totalShips += planet.ships;
                totalProduction += planet.production;
                validPlanets++;
            }
        });
        
        return {
            count: validPlanets,
            totalShips,
            totalProduction,
            averageShips: validPlanets > 0 ? totalShips / validPlanets : 0
        };
    }

    /**
     * 🔍 Verificar si un planeta es visible en cámara
     */
    isPlanetVisible(planet, camera) {
        const screenPos = camera.worldToScreen(planet.x, planet.y);
        const screenRadius = planet.radius * camera.zoom;
        
        return (screenPos.x + screenRadius >= 0 && 
                screenPos.x - screenRadius <= camera.width &&
                screenPos.y + screenRadius >= 0 && 
                screenPos.y - screenRadius <= camera.height);
    }

    /**
     * 🎨 Agregar alpha a un color
     */
    addAlphaToColor(color, alpha) {
        if (color.startsWith('#')) {
            // Convertir hex a rgba
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        // Asumir que ya es rgba o rgb
        if (color.includes('rgba')) {
            return color.replace(/[\d\.]+\)$/g, `${alpha})`);
        }
        
        if (color.includes('rgb')) {
            return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        
        return color;
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Configuración de SelectionVisualizationManager actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        return {
            selectedCount: this.selectedPlanets.size,
            selectedPlanets: Array.from(this.selectedPlanets),
            animationTime: this.animationTime,
            lastRenderTime: this.lastRenderTime,
            stats: this.calculateSelectionStats(),
            config: this.config
        };
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        this.selectedPlanets.clear();
        
        // Limpiar referencias
        this.gameEngine = null;
        this.callbacks = {};
        this.config = null;
        
        console.log('💥 SelectionVisualizationManager destruido');
    }
} 