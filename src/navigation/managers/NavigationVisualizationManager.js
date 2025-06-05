/**
 * 🎨 NAVIGATION VISUALIZATION MANAGER
 * Gestiona la visualización de trayectorias y elementos gráficos de navegación
 * Parte de la refactorización FASE 4 del NavigationSystem
 */

import { NAVIGATION_CONFIG } from '../NavigationConfig.js';

export class NavigationVisualizationManager {
    constructor(canvasRenderer) {
        this.canvasRenderer = canvasRenderer;
        this.config = NAVIGATION_CONFIG.visualization;
        
        // Cache de trayectorias para visualización
        this.trajectoryCache = new Map();
        
        // Control de actualización
        this.frameCounter = 0;
        
        console.log('🎨 NavigationVisualizationManager inicializado');
    }

    /**
     * 🎨 Actualizar visualización de trayectorias
     */
    updateVisualization(fleets) {
        if (!this.canvasRenderer || !this.config.showTrajectories) {
            return;
        }
        
        // Verificar si el sistema de overlay está disponible
        if (!this.canvasRenderer.addDragLine) {
            console.log('⚠️ Sistema de overlay no disponible');
            return;
        }
        
        // Limpiar trayectorias anteriores
        this.clearVisualization();
        
        // Dibujar trayectorias de flotas activas
        const activeFleets = fleets.filter(fleet => fleet.isMoving && !fleet.hasArrived);
        
        if (activeFleets.length > 0) {
            console.log(`🎨 Dibujando ${activeFleets.length} trayectorias usando overlay system`);
        }
        
        activeFleets.forEach(fleet => {
            this.drawFleetTrajectory(fleet);
        });
    }

    /**
     * 🎨 Dibujar trayectoria de una flota específica
     */
    drawFleetTrajectory(fleet) {
        if (!this.canvasRenderer || !this.canvasRenderer.addDragLine) {
            console.log('❌ No hay sistema de overlay disponible');
            return;
        }
        
        // Usar addDragLine del CanvasRenderer
        const trajectoryId = `trajectory_${fleet.id}`;
        
        this.canvasRenderer.addDragLine(
            trajectoryId,
            fleet.x,
            fleet.y,
            fleet.targetX,
            fleet.targetY,
            {
                color: this.config.trajectoryColor,
                width: this.config.trajectoryWidth,
                opacity: this.config.trajectoryOpacity,
                dashArray: [5, 5], // Línea punteada
                animation: null
            }
        );
        
        console.log(`🎨 Trayectoria añadida para flota ${fleet.id}: (${fleet.x.toFixed(1)}, ${fleet.y.toFixed(1)}) → (${fleet.targetX.toFixed(1)}, ${fleet.targetY.toFixed(1)})`);
    }

    /**
     * 🎨 Actualizar trayectoria de una nave para cache
     */
    updateFleetTrajectory(fleet, target, obstacles) {
        const trajectory = {
            fleet: fleet,
            start: { x: fleet.x, y: fleet.y },
            end: { x: target.x, y: target.y },
            obstacles: obstacles,
            timestamp: Date.now(),
            color: fleet.color || this.config.trajectoryColor
        };
        
        this.trajectoryCache.set(fleet.id, trajectory);
    }

    /**
     * 🧹 Limpiar visualización de trayectorias
     */
    clearVisualization() {
        if (this.canvasRenderer && this.canvasRenderer.clearDragLines) {
            // Recopilar IDs de trayectorias para limpiar solo las nuestras
            const trajectoryIds = [];
            
            if (this.canvasRenderer.overlayElements && this.canvasRenderer.overlayElements.dragLines) {
                this.canvasRenderer.overlayElements.dragLines.forEach(line => {
                    if (line.id.startsWith('trajectory_')) {
                        trajectoryIds.push(line.id);
                    }
                });
                
                // Remover solo las trayectorias de navegación
                trajectoryIds.forEach(id => {
                    this.canvasRenderer.removeDragLine(id);
                });
            }
        }
    }

    /**
     * 🎨 Renderizar navegación con steering behaviors
     */
    renderSteeringNavigation(ctx, fleetAdapter) {
        if (!fleetAdapter) return;
        
        // Solo renderizar las flotas básicas sin debug
        fleetAdapter.renderAllFleets(ctx, { 
            showDebug: false,
            showSensors: false,
            showForces: false,
            showTrails: false,
            showFleetConnections: false,
            showFleetCenter: false,
            showSpatialGrid: false
        });
    }

    /**
     * 🧹 Limpiar caches antiguos de trayectorias
     */
    cleanupTrajectoryCache() {
        const now = Date.now();
        const maxAge = this.config.fadeOutTime;
        
        for (const [fleetId, trajectory] of this.trajectoryCache.entries()) {
            if (now - trajectory.timestamp > maxAge) {
                this.trajectoryCache.delete(fleetId);
            }
        }
    }

    /**
     * 🎛️ Configurar visualización
     */
    setVisualization(enabled) {
        this.config.showTrajectories = enabled;
        if (!enabled) {
            this.trajectoryCache.clear();
            this.clearVisualization();
        }
        console.log(`🎨 Visualización de trayectorias ${enabled ? 'activada' : 'desactivada'}`);
    }

    /**
     * 🎨 Configurar color de trayectorias
     */
    setTrajectoryColor(color) {
        this.config.trajectoryColor = color;
        console.log(`🎨 Color de trayectorias cambiado a: ${color}`);
    }

    /**
     * 🎨 Configurar opacidad de trayectorias
     */
    setTrajectoryOpacity(opacity) {
        this.config.trajectoryOpacity = Math.max(0, Math.min(1, opacity));
        console.log(`🎨 Opacidad de trayectorias cambiada a: ${this.config.trajectoryOpacity}`);
    }

    /**
     * 📊 Obtener estadísticas de visualización
     */
    getVisualizationStats() {
        return {
            trajectoriesInCache: this.trajectoryCache.size,
            visualizationEnabled: this.config.showTrajectories,
            trajectoryColor: this.config.trajectoryColor,
            trajectoryOpacity: this.config.trajectoryOpacity,
            trajectoryWidth: this.config.trajectoryWidth
        };
    }

    /**
     * 🧹 Limpiar completamente el manager
     */
    destroy() {
        this.clearVisualization();
        this.trajectoryCache.clear();
        console.log('🎨 NavigationVisualizationManager destruido');
    }
} 