/**
 * 🎨 DRAG VISUALIZATION MANAGER
 * Gestor especializado para la visualización del sistema de drag & drop
 * Responsabilidad única: Gestionar elementos visuales y efectos del drag
 */

export class DragVisualizationManager {
    constructor(selectionSystem, dragStateManager, config = {}) {
        this.selectionSystem = selectionSystem;
        this.dragStateManager = dragStateManager;
        
        // Sistema de overlay Canvas
        this.overlaySystem = null;
        
        // Elementos visuales
        this.previewLines = [];
        this.targetHighlight = null;
        
        // Configuración visual
        this.config = {
            lineColor: '#ffaa00',
            lineWidth: 2,
            lineOpacity: 0.7,
            selectedLineColor: '#00ff88',
            selectedLineWidth: 3,
            targetColor: '#ff6666',
            targetWidth: 4,
            targetOpacity: 0.8,
            launchColor: '#00ff88',
            launchWidth: 5,
            launchOpacity: 1.0,
            ...config
        };
        
        this.setupOverlaySystem();
        console.log('🎨 DragVisualizationManager inicializado');
    }

    /**
     * 🎮 Configurar sistema de overlay Canvas
     */
    setupOverlaySystem() {
        const checkOverlay = () => {
            if (window.canvasOverlay) {
                this.overlaySystem = window.canvasOverlay;
                console.log('🎮 Sistema de overlay Canvas conectado');
                return true;
            }
            return false;
        };
        
        if (!checkOverlay()) {
            // Reintentar cada 100ms hasta que esté disponible
            const retryInterval = setInterval(() => {
                if (checkOverlay()) {
                    clearInterval(retryInterval);
                }
            }, 100);
        }
    }

    /**
     * 🎨 Crear elementos visuales para el preview
     */
    createPreviewElements() {
        if (!this.overlaySystem) {
            console.warn('⚠️ Sistema de overlay no disponible');
            return;
        }
        
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        // Limpiar líneas existentes
        this.clearPreviewElements();
        
        // Crear líneas desde todos los planetas seleccionados
        this.previewLines = [];
        playerPlanets.forEach((planet, index) => {
            const lineId = `drag-line-${planet.id}`;
            this.previewLines.push({ id: lineId, planetId: planet.id });
        });
        
        console.log(`🎮 Creadas ${this.previewLines.length} líneas de preview`);
    }

    /**
     * 🎨 Actualizar preview visual del drag
     */
    updateDragPreview() {
        if (!this.overlaySystem) return;
        
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        // Obtener coordenadas de destino
        const targetCoords = this.dragStateManager.getTargetCoordinates();
        const hasTarget = this.dragStateManager.hasValidTarget();
        
        // Actualizar líneas
        playerPlanets.forEach((planet, index) => {
            const lineId = `drag-line-${planet.id}`;
            
            // Configurar opciones de línea según si hay objetivo
            const options = {
                color: hasTarget ? this.config.targetColor : this.config.selectedLineColor,
                width: hasTarget ? this.config.selectedLineWidth + 1 : this.config.selectedLineWidth,
                opacity: hasTarget ? 0.9 : 0.7,
                dashArray: hasTarget ? [12, 6] : [8, 4],
                animation: 'pulse'
            };
            
            this.overlaySystem.addDragLine(
                lineId, 
                planet.x, 
                planet.y, 
                targetCoords.x, 
                targetCoords.y, 
                options
            );
        });
        
        // Actualizar highlight del objetivo
        this.updateTargetHighlight();
    }

    /**
     * 🎨 Actualizar highlight del objetivo
     */
    updateTargetHighlight() {
        if (!this.overlaySystem) return;
        
        if (this.dragStateManager.hasValidTarget()) {
            const targetPlanet = this.dragStateManager.targetPlanet;
            
            const options = {
                color: this.config.targetColor,
                width: this.config.targetWidth,
                opacity: this.config.targetOpacity,
                animation: 'pulse'
            };
            
            this.overlaySystem.addTargetHighlight(
                'target-highlight',
                targetPlanet.x,
                targetPlanet.y,
                targetPlanet.radius + 10,
                options
            );
        } else {
            this.overlaySystem.removeTargetHighlight('target-highlight');
        }
    }

    /**
     * 🎨 Mostrar efecto de lanzamiento
     */
    showLaunchEffect() {
        if (!this.overlaySystem || !this.dragStateManager.hasValidTarget()) return;
        
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        const targetPlanet = this.dragStateManager.targetPlanet;
        
        // Crear efectos de lanzamiento desde cada planeta
        playerPlanets.forEach((planet, index) => {
            const effectId = `launch-effect-${planet.id}`;
            
            // Línea de lanzamiento con animación
            const options = {
                color: this.config.launchColor,
                width: this.config.launchWidth,
                opacity: this.config.launchOpacity,
                animation: 'launch'
            };
            
            this.overlaySystem.addDragLine(
                effectId,
                planet.x,
                planet.y,
                targetPlanet.x,
                targetPlanet.y,
                options
            );
            
            // Remover efecto después de 1 segundo
            setTimeout(() => {
                this.overlaySystem.removeDragLine(effectId);
            }, 1000);
        });
        
        console.log(`🎨 Efectos de lanzamiento creados para ${playerPlanets.length} planetas`);
    }

    /**
     * 🎨 Limpiar elementos visuales del preview
     */
    clearPreviewElements() {
        if (this.overlaySystem) {
            this.overlaySystem.clearDragLines();
            this.overlaySystem.removeTargetHighlight('target-highlight');
        }
        
        this.previewLines = [];
    }

    /**
     * 🎨 Resetear visualización
     */
    resetVisualization() {
        this.clearPreviewElements();
        console.log('🎨 Visualización reseteada');
    }

    /**
     * 🎨 Actualizar configuración visual
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🎨 Configuración visual actualizada');
    }

    /**
     * 🎨 Verificar disponibilidad del sistema de overlay
     */
    isOverlayAvailable() {
        return !!this.overlaySystem;
    }

    /**
     * 🎨 Obtener información de debug
     */
    getDebugInfo() {
        return {
            hasOverlaySystem: !!this.overlaySystem,
            previewLines: this.previewLines.length,
            hasTargetHighlight: this.dragStateManager.hasValidTarget(),
            config: this.config
        };
    }

    /**
     * 🎨 Destruir elementos visuales
     */
    destroy() {
        this.clearPreviewElements();
        this.overlaySystem = null;
        console.log('💥 DragVisualizationManager destruido');
    }
} 