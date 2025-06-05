/**
 * 🖼️ SELECTION OVERLAY MANAGER
 * Gestor especializado para overlay de drag selection y integración con UI
 * Responsabilidad única: Gestionar elementos de overlay y UI de selección
 */

export class SelectionOverlayManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado del overlay
        this.overlayElement = null;
        this.dragOverlay = null;
        this.isOverlayActive = false;
        this.currentDragData = null;
        
        // Callbacks configurables
        this.callbacks = {
            onOverlayCreated: null,
            onOverlayUpdated: null,
            onOverlayDestroyed: null
        };
        
        console.log('🖼️ SelectionOverlayManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * 🎬 Inicializar overlay
     */
    initializeOverlay() {
        if (this.overlayElement) {
            console.warn('⚠️ Overlay ya inicializado');
            return false;
        }

        // Crear elemento de overlay principal
        this.overlayElement = document.createElement('div');
        this.overlayElement.id = 'selection-overlay';
        this.overlayElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: ${this.config.overlayZIndex};
            overflow: hidden;
        `;

        // Agregar al contenedor del juego
        const gameContainer = document.getElementById(this.config.gameContainerId) || document.body;
        gameContainer.appendChild(this.overlayElement);

        this.isOverlayActive = true;

        if (this.callbacks.onOverlayCreated) {
            this.callbacks.onOverlayCreated({ overlayElement: this.overlayElement });
        }

        console.log('🖼️ Overlay de selección inicializado');
        return true;
    }

    /**
     * 🔲 Crear overlay de drag selection
     */
    createDragOverlay(dragData) {
        if (!this.isOverlayActive) {
            console.warn('⚠️ Overlay no está activo');
            return false;
        }

        // Remover overlay anterior si existe
        this.removeDragOverlay();

        const { startX, startY, currentX, currentY, isMultiSelect } = dragData;

        // Calcular dimensiones
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        // Crear elemento de drag
        this.dragOverlay = document.createElement('div');
        this.dragOverlay.className = 'drag-selection-overlay';
        
        // Aplicar estilos
        const style = this.getDragOverlayStyle(left, top, width, height, isMultiSelect);
        this.dragOverlay.style.cssText = style;

        // Agregar al overlay principal
        this.overlayElement.appendChild(this.dragOverlay);
        this.currentDragData = dragData;

        if (this.callbacks.onOverlayUpdated) {
            this.callbacks.onOverlayUpdated({
                type: 'dragCreated',
                dragData,
                element: this.dragOverlay
            });
        }

        return true;
    }

    /**
     * 🔄 Actualizar overlay de drag selection
     */
    updateDragOverlay(dragData) {
        if (!this.dragOverlay || !this.isOverlayActive) {
            return this.createDragOverlay(dragData);
        }

        const { startX, startY, currentX, currentY, isMultiSelect } = dragData;

        // Calcular nuevas dimensiones
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        // Actualizar estilos
        const style = this.getDragOverlayStyle(left, top, width, height, isMultiSelect);
        this.dragOverlay.style.cssText = style;
        this.currentDragData = dragData;

        if (this.callbacks.onOverlayUpdated) {
            this.callbacks.onOverlayUpdated({
                type: 'dragUpdated',
                dragData,
                element: this.dragOverlay
            });
        }

        return true;
    }

    /**
     * 🚫 Remover overlay de drag selection
     */
    removeDragOverlay() {
        if (this.dragOverlay) {
            this.dragOverlay.remove();
            this.dragOverlay = null;
            this.currentDragData = null;

            if (this.callbacks.onOverlayUpdated) {
                this.callbacks.onOverlayUpdated({
                    type: 'dragRemoved'
                });
            }

            console.log('🚫 Drag overlay removido');
            return true;
        }
        return false;
    }

    /**
     * 🎨 Obtener estilos para drag overlay
     */
    getDragOverlayStyle(left, top, width, height, isMultiSelect) {
        const colors = isMultiSelect ? {
            border: this.config.multiSelectBorderColor,
            background: this.config.multiSelectBackgroundColor
        } : {
            border: this.config.normalSelectBorderColor,
            background: this.config.normalSelectBackgroundColor
        };

        return `
            position: absolute;
            left: ${left}px;
            top: ${top}px;
            width: ${width}px;
            height: ${height}px;
            border: ${this.config.dragBorderWidth}px ${this.config.dragBorderStyle} ${colors.border};
            background-color: ${colors.background};
            pointer-events: none;
            box-sizing: border-box;
            ${this.config.useDragAnimation ? `transition: all ${this.config.dragAnimationDuration}ms ease;` : ''}
            ${this.config.useDragShadow ? `box-shadow: ${this.config.dragShadow};` : ''}
        `;
    }

    /**
     * 📊 Crear overlay de información de selección
     */
    createSelectionInfoOverlay(selectionStats, position) {
        if (!this.isOverlayActive) return false;

        // Remover info overlay anterior
        this.removeSelectionInfoOverlay();

        const infoOverlay = document.createElement('div');
        infoOverlay.className = 'selection-info-overlay';
        infoOverlay.style.cssText = `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            background: ${this.config.infoBackgroundColor};
            color: ${this.config.infoTextColor};
            padding: ${this.config.infoPadding}px;
            border-radius: ${this.config.infoBorderRadius}px;
            font-family: ${this.config.infoFontFamily};
            font-size: ${this.config.infoFontSize}px;
            border: 1px solid ${this.config.infoBorderColor};
            pointer-events: none;
            z-index: ${this.config.infoZIndex};
            ${this.config.useInfoShadow ? `box-shadow: ${this.config.infoShadow};` : ''}
        `;

        // Crear contenido
        infoOverlay.innerHTML = this.generateSelectionInfoHTML(selectionStats);

        this.overlayElement.appendChild(infoOverlay);
        this.selectionInfoOverlay = infoOverlay;

        return true;
    }

    /**
     * 📝 Generar HTML para información de selección
     */
    generateSelectionInfoHTML(stats) {
        return `
            <div class="selection-info-header">Selección</div>
            <div class="selection-info-item">Planetas: ${stats.count}</div>
            <div class="selection-info-item">Naves: ${stats.totalShips}</div>
            <div class="selection-info-item">Producción: ${stats.totalProduction}/s</div>
            ${stats.averageShips > 0 ? `<div class="selection-info-item">Promedio: ${Math.round(stats.averageShips)} naves</div>` : ''}
        `;
    }

    /**
     * 🚫 Remover overlay de información
     */
    removeSelectionInfoOverlay() {
        if (this.selectionInfoOverlay) {
            this.selectionInfoOverlay.remove();
            this.selectionInfoOverlay = null;
            return true;
        }
        return false;
    }

    /**
     * 🎯 Crear indicadores de planetas seleccionados
     */
    createPlanetIndicators(selectedPlanets, camera) {
        if (!this.isOverlayActive) return false;

        // Remover indicadores anteriores
        this.removePlanetIndicators();

        this.planetIndicators = [];

        selectedPlanets.forEach(planet => {
            const screenPos = camera.worldToScreen(planet.x, planet.y);
            const indicator = this.createPlanetIndicator(planet, screenPos);
            
            if (indicator) {
                this.overlayElement.appendChild(indicator);
                this.planetIndicators.push(indicator);
            }
        });

        console.log(`🎯 Creados ${this.planetIndicators.length} indicadores de planetas`);
        return true;
    }

    /**
     * 🪐 Crear indicador individual de planeta
     */
    createPlanetIndicator(planet, screenPos) {
        const indicator = document.createElement('div');
        indicator.className = 'planet-selection-indicator';
        indicator.style.cssText = `
            position: absolute;
            left: ${screenPos.x - this.config.indicatorSize / 2}px;
            top: ${screenPos.y - this.config.indicatorSize / 2}px;
            width: ${this.config.indicatorSize}px;
            height: ${this.config.indicatorSize}px;
            border: ${this.config.indicatorBorderWidth}px solid ${this.config.indicatorColor};
            border-radius: 50%;
            pointer-events: none;
            ${this.config.useIndicatorAnimation ? `animation: pulse ${this.config.indicatorAnimationDuration}ms infinite;` : ''}
        `;

        return indicator;
    }

    /**
     * 🚫 Remover indicadores de planetas
     */
    removePlanetIndicators() {
        if (this.planetIndicators) {
            this.planetIndicators.forEach(indicator => indicator.remove());
            this.planetIndicators = [];
            return true;
        }
        return false;
    }

    /**
     * 🔄 Actualizar posición de indicadores
     */
    updatePlanetIndicators(selectedPlanets, camera) {
        if (!this.planetIndicators || this.planetIndicators.length !== selectedPlanets.length) {
            return this.createPlanetIndicators(selectedPlanets, camera);
        }

        selectedPlanets.forEach((planet, index) => {
            if (this.planetIndicators[index]) {
                const screenPos = camera.worldToScreen(planet.x, planet.y);
                const indicator = this.planetIndicators[index];
                
                indicator.style.left = `${screenPos.x - this.config.indicatorSize / 2}px`;
                indicator.style.top = `${screenPos.y - this.config.indicatorSize / 2}px`;
            }
        });

        return true;
    }

    /**
     * 🎨 Agregar estilos CSS dinámicos
     */
    addDynamicStyles() {
        if (document.getElementById('selection-overlay-styles')) {
            return; // Ya agregados
        }

        const styleSheet = document.createElement('style');
        styleSheet.id = 'selection-overlay-styles';
        styleSheet.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .selection-info-overlay {
                user-select: none;
            }
            
            .selection-info-header {
                font-weight: bold;
                margin-bottom: 4px;
                border-bottom: 1px solid ${this.config.infoBorderColor};
                padding-bottom: 2px;
            }
            
            .selection-info-item {
                margin: 2px 0;
                font-size: ${this.config.infoFontSize - 1}px;
            }
        `;

        document.head.appendChild(styleSheet);
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Configuración de SelectionOverlayManager actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        return {
            isOverlayActive: this.isOverlayActive,
            hasDragOverlay: !!this.dragOverlay,
            hasSelectionInfo: !!this.selectionInfoOverlay,
            planetIndicatorCount: this.planetIndicators ? this.planetIndicators.length : 0,
            currentDragData: this.currentDragData,
            config: this.config
        };
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        // Remover todos los overlays
        this.removeDragOverlay();
        this.removeSelectionInfoOverlay();
        this.removePlanetIndicators();

        // Remover overlay principal
        if (this.overlayElement) {
            this.overlayElement.remove();
            this.overlayElement = null;
        }

        // Remover estilos dinámicos
        const styleSheet = document.getElementById('selection-overlay-styles');
        if (styleSheet) {
            styleSheet.remove();
        }

        this.isOverlayActive = false;

        if (this.callbacks.onOverlayDestroyed) {
            this.callbacks.onOverlayDestroyed();
        }

        // Limpiar referencias
        this.gameEngine = null;
        this.callbacks = {};
        this.config = null;

        console.log('💥 SelectionOverlayManager destruido');
    }
} 