/**
 * 🎮 CANVAS OVERLAY MANAGER
 * Gestor especializado para sistema de overlay interactivo del juego
 * 
 * RESPONSABILIDADES:
 * - Drag lines para feedback visual
 * - Highlights de planetas y objetivos
 * - Selection boxes para selección múltiple
 * - Elementos de UI interactivos
 * 
 * PATRÓN: Command Pattern
 * PRINCIPIOS: Single Responsibility, Command
 */

export class CanvasOverlayManager {
    constructor(ctx, config = {}) {
        this.ctx = ctx;
        this.config = {
            // Drag line settings
            dragLines: {
                enabled: true,
                defaultColor: '#00ff88',
                defaultWidth: 3,
                defaultOpacity: 0.7,
                dashArray: [8, 4],
                animationSpeed: 0.1,
                ...config.dragLines
            },
            
            // Highlight settings
            highlights: {
                enabled: true,
                planetColor: '#ffaa00',
                targetColor: '#ff4444',
                defaultWidth: 4,
                defaultOpacity: 0.8,
                pulseSpeed: 0.003,
                ...config.highlights
            },
            
            // Selection box settings
            selectionBoxes: {
                enabled: true,
                defaultColor: '#44aaff',
                defaultWidth: 2,
                defaultOpacity: 0.6,
                fillOpacity: 0.1,
                ...config.selectionBoxes
            }
        };
        
        // Elementos de overlay activos
        this.overlayElements = {
            dragLines: [],
            planetHighlights: [],
            targetHighlights: [],
            selectionBoxes: [],
            feedbackLines: []
        };
        
        // Estado de animaciones
        this.animationState = {
            dashOffset: 0,
            pulsePhase: 0,
            lastUpdate: Date.now()
        };
        
        console.log('🎮 CanvasOverlayManager inicializado');
    }
    
    /**
     * 🎨 Renderizar todos los overlays
     */
    renderOverlays() {
        const currentTime = Date.now();
        this.updateAnimationState(currentTime);
        
        this.ctx.save();
        
        // Renderizar drag lines
        if (this.config.dragLines.enabled) {
            this.renderDragLines(currentTime);
        }
        
        // Renderizar highlights de planetas
        if (this.config.highlights.enabled) {
            this.renderPlanetHighlights(currentTime);
        }
        
        // Renderizar highlights de objetivos
        if (this.config.highlights.enabled) {
            this.renderTargetHighlights(currentTime);
        }
        
        // Renderizar selection boxes
        if (this.config.selectionBoxes.enabled) {
            this.renderSelectionBoxes(currentTime);
        }
        
        this.ctx.restore();
        
        // Limpiar elementos expirados
        this.cleanupExpiredElements(currentTime);
    }
    
    /**
     * 🔄 Actualizar estado de animaciones
     */
    updateAnimationState(currentTime) {
        const deltaTime = currentTime - this.animationState.lastUpdate;
        
        // Actualizar offset de dash para líneas animadas
        this.animationState.dashOffset += this.config.dragLines.animationSpeed * deltaTime;
        if (this.animationState.dashOffset > 100) {
            this.animationState.dashOffset = 0;
        }
        
        // Actualizar fase de pulso
        this.animationState.pulsePhase = (currentTime * this.config.highlights.pulseSpeed) % (Math.PI * 2);
        
        this.animationState.lastUpdate = currentTime;
    }
    
    /**
     * 🖱️ Renderizar drag lines
     */
    renderDragLines(currentTime) {
        for (const line of this.overlayElements.dragLines) {
            this.renderDragLine(line, currentTime);
        }
    }
    
    /**
     * 🖱️ Renderizar drag line individual
     */
    renderDragLine(line, currentTime) {
        const { fromX, fromY, toX, toY, color, width, opacity, dashArray, animation } = line;
        
        this.ctx.save();
        
        // Configurar estilo
        this.ctx.strokeStyle = color || this.config.dragLines.defaultColor;
        this.ctx.lineWidth = width || this.config.dragLines.defaultWidth;
        this.ctx.globalAlpha = opacity || this.config.dragLines.defaultOpacity;
        this.ctx.lineCap = 'round';
        
        // Configurar dash si está especificado
        if (dashArray) {
            this.ctx.setLineDash(dashArray);
            if (animation) {
                this.ctx.lineDashOffset = this.animationState.dashOffset;
            }
        }
        
        // Dibujar línea
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();
        
        // Dibujar flecha en el destino
        this.drawArrowHead(toX, toY, fromX, fromY, color || this.config.dragLines.defaultColor);
        
        this.ctx.restore();
    }
    
    /**
     * ➡️ Dibujar cabeza de flecha
     */
    drawArrowHead(toX, toY, fromX, fromY, color) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - arrowLength * Math.cos(angle - arrowAngle),
            toY - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.lineTo(
            toX - arrowLength * Math.cos(angle + arrowAngle),
            toY - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 🪐 Renderizar highlights de planetas
     */
    renderPlanetHighlights(currentTime) {
        for (const highlight of this.overlayElements.planetHighlights) {
            this.renderPlanetHighlight(highlight, currentTime);
        }
    }
    
    /**
     * 🪐 Renderizar highlight de planeta individual
     */
    renderPlanetHighlight(highlight, currentTime) {
        const { x, y, radius, color, width, opacity, animation } = highlight;
        
        this.ctx.save();
        
        // Calcular efecto de pulso si está habilitado
        let currentRadius = radius;
        let currentOpacity = opacity || this.config.highlights.defaultOpacity;
        
        if (animation === 'pulse') {
            const pulse = Math.sin(this.animationState.pulsePhase) * 0.5 + 0.5;
            currentRadius = radius * (1 + pulse * 0.3);
            currentOpacity = (opacity || this.config.highlights.defaultOpacity) * (0.7 + pulse * 0.3);
        }
        
        // Configurar estilo
        this.ctx.strokeStyle = color || this.config.highlights.planetColor;
        this.ctx.lineWidth = width || this.config.highlights.defaultWidth;
        this.ctx.globalAlpha = currentOpacity;
        
        // Dibujar círculo de highlight
        this.ctx.beginPath();
        this.ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * 🎯 Renderizar highlights de objetivos
     */
    renderTargetHighlights(currentTime) {
        for (const highlight of this.overlayElements.targetHighlights) {
            this.renderTargetHighlight(highlight, currentTime);
        }
    }
    
    /**
     * 🎯 Renderizar highlight de objetivo individual
     */
    renderTargetHighlight(highlight, currentTime) {
        const { x, y, radius, color, width, opacity, animation } = highlight;
        
        this.ctx.save();
        
        // Calcular efecto de pulso
        let currentRadius = radius;
        let currentOpacity = opacity || this.config.highlights.defaultOpacity;
        
        if (animation === 'pulse') {
            const pulse = Math.sin(this.animationState.pulsePhase * 1.5) * 0.5 + 0.5;
            currentRadius = radius * (1 + pulse * 0.2);
            currentOpacity = (opacity || this.config.highlights.defaultOpacity) * (0.8 + pulse * 0.2);
        }
        
        // Configurar estilo
        this.ctx.strokeStyle = color || this.config.highlights.targetColor;
        this.ctx.lineWidth = width || this.config.highlights.defaultWidth;
        this.ctx.globalAlpha = currentOpacity;
        
        // Dibujar cruz de objetivo
        const crossSize = currentRadius * 0.7;
        
        this.ctx.beginPath();
        // Línea horizontal
        this.ctx.moveTo(x - crossSize, y);
        this.ctx.lineTo(x + crossSize, y);
        // Línea vertical
        this.ctx.moveTo(x, y - crossSize);
        this.ctx.lineTo(x, y + crossSize);
        this.ctx.stroke();
        
        // Dibujar círculo exterior
        this.ctx.beginPath();
        this.ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * 📦 Renderizar selection boxes
     */
    renderSelectionBoxes(currentTime) {
        for (const box of this.overlayElements.selectionBoxes) {
            this.renderSelectionBox(box, currentTime);
        }
    }
    
    /**
     * 📦 Renderizar selection box individual
     */
    renderSelectionBox(box, currentTime) {
        const { x, y, width, height, color, lineWidth, opacity, fillOpacity } = box;
        
        this.ctx.save();
        
        // Configurar estilo del borde
        this.ctx.strokeStyle = color || this.config.selectionBoxes.defaultColor;
        this.ctx.lineWidth = lineWidth || this.config.selectionBoxes.defaultWidth;
        this.ctx.globalAlpha = opacity || this.config.selectionBoxes.defaultOpacity;
        
        // Dibujar borde
        this.ctx.strokeRect(x, y, width, height);
        
        // Dibujar relleno semi-transparente
        if (fillOpacity > 0) {
            this.ctx.fillStyle = color || this.config.selectionBoxes.defaultColor;
            this.ctx.globalAlpha = fillOpacity || this.config.selectionBoxes.fillOpacity;
            this.ctx.fillRect(x, y, width, height);
        }
        
        this.ctx.restore();
    }
    
    /**
     * ➕ Añadir drag line
     */
    addDragLine(id, fromX, fromY, toX, toY, options = {}) {
        const line = {
            id: id,
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            color: options.color || this.config.dragLines.defaultColor,
            width: options.width || this.config.dragLines.defaultWidth,
            opacity: options.opacity || this.config.dragLines.defaultOpacity,
            dashArray: options.dashArray || this.config.dragLines.dashArray,
            animation: options.animation !== false,
            timestamp: Date.now()
        };
        
        // Remover línea existente con el mismo ID
        this.removeDragLine(id);
        
        this.overlayElements.dragLines.push(line);
        return line;
    }
    
    /**
     * ➖ Remover drag line
     */
    removeDragLine(id) {
        this.overlayElements.dragLines = this.overlayElements.dragLines.filter(line => line.id !== id);
    }
    
    /**
     * ➕ Añadir highlight de planeta
     */
    addPlanetHighlight(id, x, y, radius, options = {}) {
        const highlight = {
            id: id,
            x: x,
            y: y,
            radius: radius,
            color: options.color || this.config.highlights.planetColor,
            width: options.width || this.config.highlights.defaultWidth,
            opacity: options.opacity || this.config.highlights.defaultOpacity,
            animation: options.animation || 'pulse',
            timestamp: Date.now()
        };
        
        // Remover highlight existente con el mismo ID
        this.removePlanetHighlight(id);
        
        this.overlayElements.planetHighlights.push(highlight);
        return highlight;
    }
    
    /**
     * ➖ Remover highlight de planeta
     */
    removePlanetHighlight(id) {
        this.overlayElements.planetHighlights = this.overlayElements.planetHighlights.filter(h => h.id !== id);
    }
    
    /**
     * ➕ Añadir highlight de objetivo
     */
    addTargetHighlight(id, x, y, radius, options = {}) {
        const highlight = {
            id: id,
            x: x,
            y: y,
            radius: radius,
            color: options.color || this.config.highlights.targetColor,
            width: options.width || this.config.highlights.defaultWidth,
            opacity: options.opacity || this.config.highlights.defaultOpacity,
            animation: options.animation || 'pulse',
            timestamp: Date.now()
        };
        
        // Remover highlight existente con el mismo ID
        this.removeTargetHighlight(id);
        
        this.overlayElements.targetHighlights.push(highlight);
        return highlight;
    }
    
    /**
     * ➖ Remover highlight de objetivo
     */
    removeTargetHighlight(id) {
        this.overlayElements.targetHighlights = this.overlayElements.targetHighlights.filter(h => h.id !== id);
    }
    
    /**
     * ➕ Añadir selection box
     */
    addSelectionBox(id, x, y, width, height, options = {}) {
        const box = {
            id: id,
            x: x,
            y: y,
            width: width,
            height: height,
            color: options.color || this.config.selectionBoxes.defaultColor,
            lineWidth: options.lineWidth || this.config.selectionBoxes.defaultWidth,
            opacity: options.opacity || this.config.selectionBoxes.defaultOpacity,
            fillOpacity: options.fillOpacity || this.config.selectionBoxes.fillOpacity,
            timestamp: Date.now()
        };
        
        // Remover box existente con el mismo ID
        this.removeSelectionBox(id);
        
        this.overlayElements.selectionBoxes.push(box);
        return box;
    }
    
    /**
     * 🔄 Actualizar selection box
     */
    updateSelectionBox(id, x, y, width, height) {
        const box = this.overlayElements.selectionBoxes.find(b => b.id === id);
        if (box) {
            box.x = x;
            box.y = y;
            box.width = width;
            box.height = height;
            box.timestamp = Date.now();
        }
    }
    
    /**
     * ➖ Remover selection box
     */
    removeSelectionBox(id) {
        this.overlayElements.selectionBoxes = this.overlayElements.selectionBoxes.filter(b => b.id !== id);
    }
    
    /**
     * 🧹 Limpiar elementos expirados
     */
    cleanupExpiredElements(currentTime) {
        const maxAge = 30000; // 30 segundos
        
        // Limpiar drag lines antiguas
        this.overlayElements.dragLines = this.overlayElements.dragLines.filter(
            line => currentTime - line.timestamp < maxAge
        );
        
        // Limpiar highlights antiguos
        this.overlayElements.planetHighlights = this.overlayElements.planetHighlights.filter(
            highlight => currentTime - highlight.timestamp < maxAge
        );
        
        this.overlayElements.targetHighlights = this.overlayElements.targetHighlights.filter(
            highlight => currentTime - highlight.timestamp < maxAge
        );
        
        // Limpiar selection boxes antiguos
        this.overlayElements.selectionBoxes = this.overlayElements.selectionBoxes.filter(
            box => currentTime - box.timestamp < maxAge
        );
    }
    
    /**
     * 🧹 Limpiar todos los overlays
     */
    clearAllOverlays() {
        this.overlayElements.dragLines = [];
        this.overlayElements.planetHighlights = [];
        this.overlayElements.targetHighlights = [];
        this.overlayElements.selectionBoxes = [];
        this.overlayElements.feedbackLines = [];
        
        console.log('🧹 Todos los overlays limpiados');
    }
    
    /**
     * 📊 Obtener estadísticas de overlay
     */
    getOverlayStats() {
        return {
            dragLines: this.overlayElements.dragLines.length,
            planetHighlights: this.overlayElements.planetHighlights.length,
            targetHighlights: this.overlayElements.targetHighlights.length,
            selectionBoxes: this.overlayElements.selectionBoxes.length
        };
    }
    
    /**
     * 🧹 Destruir gestor
     */
    destroy() {
        this.clearAllOverlays();
        console.log('🧹 CanvasOverlayManager destruido');
    }
} 