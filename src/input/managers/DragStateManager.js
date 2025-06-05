/**
 * 🎯 DRAG STATE MANAGER
 * Gestor especializado para el estado del sistema de drag & drop
 * Responsabilidad única: Gestionar el estado y coordenadas del drag
 */

export class DragStateManager {
    constructor(config = {}) {
        // Estado del drag
        this.isDragging = false;
        this.dragStartPlanet = null;
        this.targetPlanet = null;
        this.dragEligible = false;
        
        // Coordenadas
        this.currentX = 0;
        this.currentY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Configuración
        this.config = {
            dragThreshold: 15,
            ...config
        };
        
        console.log('🎯 DragStateManager inicializado');
    }

    /**
     * 🎯 Inicializar drag en posición específica
     */
    initializeDrag(x, y) {
        this.dragStartX = x;
        this.dragStartY = y;
        this.currentX = x;
        this.currentY = y;
        this.targetPlanet = null;
        this.dragEligible = false;
    }

    /**
     * 🎯 Actualizar posición actual
     */
    updatePosition(x, y) {
        this.currentX = x;
        this.currentY = y;
    }

    /**
     * 🎯 Verificar si se debe iniciar el drag
     */
    shouldStartDrag() {
        if (this.isDragging) return false;
        
        const distance = Math.sqrt(
            Math.pow(this.currentX - this.dragStartX, 2) + 
            Math.pow(this.currentY - this.dragStartY, 2)
        );
        
        return distance > this.config.dragThreshold;
    }

    /**
     * 🎯 Iniciar drag
     */
    startDrag() {
        this.isDragging = true;
        this.targetPlanet = null;
        console.log('🎯 Estado de drag iniciado');
    }

    /**
     * 🎯 Establecer planeta objetivo
     */
    setTargetPlanet(planet) {
        this.targetPlanet = planet;
    }

    /**
     * 🎯 Verificar si hay objetivo válido
     */
    hasValidTarget() {
        return this.targetPlanet !== null;
    }

    /**
     * 🎯 Establecer elegibilidad de drag
     */
    setDragEligible(eligible) {
        this.dragEligible = eligible;
        console.log(`🎯 Drag elegibilidad: ${eligible ? 'SÍ' : 'NO'}`);
    }

    /**
     * 🎯 Verificar si el drag es elegible
     */
    isDragEligible() {
        return this.dragEligible;
    }

    /**
     * 🎯 Resetear estado del drag
     */
    resetDrag() {
        this.isDragging = false;
        this.dragStartPlanet = null;
        this.targetPlanet = null;
        this.dragEligible = false;
        console.log('🎯 Estado de drag reseteado');
    }

    /**
     * 🎯 Obtener estado actual
     */
    getState() {
        return {
            isDragging: this.isDragging,
            hasTarget: this.hasValidTarget(),
            targetPlanet: this.targetPlanet?.id || null,
            currentPosition: { x: this.currentX, y: this.currentY },
            startPosition: { x: this.dragStartX, y: this.dragStartY },
            dragEligible: this.dragEligible
        };
    }

    /**
     * 🎯 Verificar si está activo
     */
    isActive() {
        return this.isDragging;
    }

    /**
     * 🎯 Obtener coordenadas de destino
     */
    getTargetCoordinates() {
        if (this.targetPlanet && this.targetPlanet.x && this.targetPlanet.y) {
            return { x: this.targetPlanet.x, y: this.targetPlanet.y };
        }
        return { x: this.currentX, y: this.currentY };
    }

    /**
     * 🎯 Obtener información de debug
     */
    getDebugInfo() {
        return {
            ...this.getState(),
            dragDistance: Math.sqrt(
                Math.pow(this.currentX - this.dragStartX, 2) + 
                Math.pow(this.currentY - this.dragStartY, 2)
            ),
            threshold: this.config.dragThreshold
        };
    }
} 