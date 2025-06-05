/**
 * 🔲 SELECTION DRAG MANAGER
 * Gestor especializado para selección por arrastre (drag selection)
 * Responsabilidad única: Gestionar la selección rectangular por arrastre
 */

export class SelectionDragManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Estado del drag
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCurrentX = 0;
        this.dragCurrentY = 0;
        this.isMultiSelect = false;
        
        // Callbacks configurables
        this.callbacks = {
            onDragStart: null,
            onDragUpdate: null,
            onDragEnd: null,
            onPlanetsSelected: null
        };
        
        console.log('🔲 SelectionDragManager inicializado');
    }

    /**
     * 🔗 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * 🎬 Iniciar drag selection
     */
    startDrag(x, y, options = {}) {
        const { isMultiSelect = false } = options;
        
        this.isDragging = true;
        this.dragStartX = x;
        this.dragStartY = y;
        this.dragCurrentX = x;
        this.dragCurrentY = y;
        this.isMultiSelect = isMultiSelect;
        
        console.log(`🔲 Iniciando drag selection en (${x}, ${y}), multi: ${isMultiSelect}`);
        
        if (this.callbacks.onDragStart) {
            this.callbacks.onDragStart({
                startX: x,
                startY: y,
                isMultiSelect
            });
        }
        
        return true;
    }

    /**
     * 🔄 Actualizar drag selection
     */
    updateDrag(x, y) {
        if (!this.isDragging) {
            return false;
        }
        
        this.dragCurrentX = x;
        this.dragCurrentY = y;
        
        // Calcular área de selección
        const selectionArea = this.getSelectionArea();
        
        if (this.callbacks.onDragUpdate) {
            this.callbacks.onDragUpdate({
                currentX: x,
                currentY: y,
                area: selectionArea
            });
        }
        
        return true;
    }

    /**
     * 🏁 Finalizar drag selection
     */
    endDrag(x, y) {
        if (!this.isDragging) {
            return false;
        }
        
        this.dragCurrentX = x;
        this.dragCurrentY = y;
        
        // Calcular área final y seleccionar planetas
        const selectionArea = this.getSelectionArea();
        const selectedPlanets = this.selectPlanetsInArea(selectionArea);
        
        console.log(`🔲 Finalizando drag selection: ${selectedPlanets.length} planetas seleccionados`);
        
        // Emitir eventos
        if (this.callbacks.onDragEnd) {
            this.callbacks.onDragEnd({
                endX: x,
                endY: y,
                area: selectionArea,
                selectedPlanets
            });
        }
        
        if (selectedPlanets.length > 0 && this.callbacks.onPlanetsSelected) {
            this.callbacks.onPlanetsSelected({
                planets: selectedPlanets,
                area: selectionArea,
                isMultiSelect: this.isMultiSelect
            });
        }
        
        // Resetear estado
        this.resetDrag();
        
        return selectedPlanets;
    }

    /**
     * 🚫 Cancelar drag selection
     */
    cancelDrag() {
        if (!this.isDragging) {
            return false;
        }
        
        console.log('🚫 Cancelando drag selection');
        
        if (this.callbacks.onDragEnd) {
            this.callbacks.onDragEnd({
                cancelled: true,
                area: this.getSelectionArea()
            });
        }
        
        this.resetDrag();
        return true;
    }

    /**
     * 🔄 Resetear estado del drag
     */
    resetDrag() {
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCurrentX = 0;
        this.dragCurrentY = 0;
        this.isMultiSelect = false;
    }

    /**
     * 📐 Obtener área de selección actual
     */
    getSelectionArea() {
        const minX = Math.min(this.dragStartX, this.dragCurrentX);
        const maxX = Math.max(this.dragStartX, this.dragCurrentX);
        const minY = Math.min(this.dragStartY, this.dragCurrentY);
        const maxY = Math.max(this.dragStartY, this.dragCurrentY);
        
        return {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * 🎯 Seleccionar planetas en el área especificada
     */
    selectPlanetsInArea(area) {
        const { minX, minY, maxX, maxY } = area;
        const selectedPlanets = [];
        
        // Verificar área mínima
        if (area.width < this.config.minDragDistance || 
            area.height < this.config.minDragDistance) {
            console.log('🔲 Área de drag demasiado pequeña, ignorando');
            return selectedPlanets;
        }
        
        // Obtener todos los planetas
        const allPlanets = this.gameEngine.getAllPlanets();
        
        allPlanets.forEach(planet => {
            if (this.isPlanetInArea(planet, area) && this.canSelectPlanet(planet)) {
                selectedPlanets.push(planet);
            }
        });
        
        console.log(`🎯 ${selectedPlanets.length} planetas encontrados en área de drag`);
        return selectedPlanets;
    }

    /**
     * 🔍 Verificar si un planeta está en el área de selección
     */
    isPlanetInArea(planet, area) {
        const { minX, minY, maxX, maxY } = area;
        
        // Verificar si el centro del planeta está en el área
        if (planet.x >= minX && planet.x <= maxX && 
            planet.y >= minY && planet.y <= maxY) {
            return true;
        }
        
        // Verificar si el área del planeta intersecta con el área de selección
        const planetRadius = planet.radius || this.config.defaultPlanetRadius;
        
        return (planet.x + planetRadius >= minX && planet.x - planetRadius <= maxX &&
                planet.y + planetRadius >= minY && planet.y - planetRadius <= maxY);
    }

    /**
     * ✅ Verificar si un planeta puede ser seleccionado
     */
    canSelectPlanet(planet) {
        if (!planet) return false;
        
        // Solo se pueden seleccionar planetas del jugador actual
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        return planet.owner === currentPlayer;
    }

    /**
     * 📏 Calcular distancia de drag
     */
    getDragDistance() {
        const dx = this.dragCurrentX - this.dragStartX;
        const dy = this.dragCurrentY - this.dragStartY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 🔍 Verificar si está haciendo drag
     */
    getIsDragging() {
        return this.isDragging;
    }

    /**
     * 📊 Obtener estado actual del drag
     */
    getDragState() {
        return {
            isDragging: this.isDragging,
            startX: this.dragStartX,
            startY: this.dragStartY,
            currentX: this.dragCurrentX,
            currentY: this.dragCurrentY,
            isMultiSelect: this.isMultiSelect,
            area: this.isDragging ? this.getSelectionArea() : null,
            distance: this.isDragging ? this.getDragDistance() : 0
        };
    }

    /**
     * 🎨 Obtener datos para renderizado
     */
    getRenderData() {
        if (!this.isDragging) {
            return null;
        }
        
        const area = this.getSelectionArea();
        const distance = this.getDragDistance();
        
        // Solo mostrar si supera la distancia mínima
        if (distance < this.config.minDragDistance) {
            return null;
        }
        
        return {
            area,
            distance,
            isMultiSelect: this.isMultiSelect,
            style: {
                strokeColor: this.isMultiSelect ? 
                    this.config.multiSelectColor : this.config.normalSelectColor,
                fillColor: this.isMultiSelect ? 
                    this.config.multiSelectFillColor : this.config.normalSelectFillColor,
                lineWidth: this.config.dragLineWidth,
                alpha: this.config.dragAlpha
            }
        };
    }

    /**
     * 🔄 Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Configuración de SelectionDragManager actualizada');
    }

    /**
     * 📊 Obtener información de debug
     */
    getDebugInfo() {
        return {
            isDragging: this.isDragging,
            dragState: this.getDragState(),
            renderData: this.getRenderData(),
            config: this.config
        };
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        this.cancelDrag();
        
        // Limpiar referencias
        this.gameEngine = null;
        this.callbacks = {};
        this.config = null;
        
        console.log('💥 SelectionDragManager destruido');
    }
} 