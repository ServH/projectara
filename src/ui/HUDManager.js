/**
 * 📊 GALCON GAME - HUD MANAGER (OPTIMIZADO)
 * Gestión optimizada del HUD separada del HTML
 * OPTIMIZACIÓN: requestAnimationFrame en lugar de setInterval
 */

export class HUDManager {
    constructor(gameEngine, selectionSystem, dragDropHandler) {
        this.gameEngine = gameEngine;
        this.selectionSystem = selectionSystem;
        this.dragDropHandler = dragDropHandler;
        
        // Elementos del HUD
        this.hudElements = {
            planets: document.getElementById('hud-planets'),
            fleets: document.getElementById('hud-fleets'),
            percentage: document.getElementById('hud-percentage'),
            fps: document.getElementById('hud-fps'),
            selected: document.getElementById('hud-selected'),
            state: document.getElementById('hud-state'),
            statusIndicator: document.getElementById('statusIndicator')
        };
        
        // OPTIMIZACIÓN: Control de actualización optimizado
        this.isRunning = false;
        this.lastUpdate = 0;
        this.updateInterval = 100; // 100ms = 10 FPS para HUD (suficiente)
        
        // Cache de valores anteriores para evitar actualizaciones innecesarias
        this.previousValues = {
            planetsCount: -1,
            fleetsCount: -1,
            percentage: -1,
            fps: -1,
            selectedCount: -1,
            gameState: '',
            isPaused: null
        };
        
        console.log('📊 HUDManager inicializado - Elementos encontrados:', {
            planets: !!this.hudElements.planets,
            fleets: !!this.hudElements.fleets,
            percentage: !!this.hudElements.percentage,
            fps: !!this.hudElements.fps,
            selected: !!this.hudElements.selected,
            state: !!this.hudElements.state,
            statusIndicator: !!this.hudElements.statusIndicator
        });
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastUpdate = performance.now();
        
        // OPTIMIZACIÓN: Usar requestAnimationFrame en lugar de setInterval
        this.updateLoop();
        
        console.log('📊 HUD Manager iniciado con requestAnimationFrame optimizado');
    }

    stop() {
        this.isRunning = false;
        console.log('📊 HUD Manager detenido');
    }

    // OPTIMIZACIÓN: Loop optimizado con requestAnimationFrame
    updateLoop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        
        // Solo actualizar cada 100ms (10 FPS para HUD)
        if (now - this.lastUpdate >= this.updateInterval) {
            this.updateHUD();
            this.lastUpdate = now;
        }
        
        // Continuar el loop
        requestAnimationFrame(() => this.updateLoop());
    }

    updateHUD() {
        try {
            // OPTIMIZACIÓN: Solo actualizar si hay cambios
            this.updatePlanetsCount();
            this.updateFleetsCount();
            this.updatePercentage();
            this.updateFPS();
            this.updateSelectedCount();
            this.updateGameState();
            
        } catch (error) {
            console.warn('⚠️ Error actualizando HUD:', error);
        }
    }

    // OPTIMIZACIÓN: Métodos individuales para cada elemento con cache
    updatePlanetsCount() {
        if (!this.gameEngine?.stats) return;
        
        const count = this.gameEngine.stats.planetsCount || 0;
        if (count !== this.previousValues.planetsCount) {
            if (this.hudElements.planets) {
                this.hudElements.planets.textContent = count;
            }
            this.previousValues.planetsCount = count;
        }
    }

    updateFleetsCount() {
        if (!this.gameEngine?.stats) return;
        
        const count = this.gameEngine.stats.fleetsCount || 0;
        if (count !== this.previousValues.fleetsCount) {
            if (this.hudElements.fleets) {
                this.hudElements.fleets.textContent = count;
            }
            this.previousValues.fleetsCount = count;
        }
    }

    updatePercentage() {
        if (!this.gameEngine?.percentageSelector) return;
        
        const percentage = this.gameEngine.percentageSelector.getCurrentPercentage();
        if (percentage !== this.previousValues.percentage) {
            if (this.hudElements.percentage) {
                this.hudElements.percentage.textContent = percentage + '%';
                
                // OPTIMIZACIÓN: Cache de colores
                const color = this.getPercentageColor(percentage);
                this.hudElements.percentage.style.color = color;
            }
            this.previousValues.percentage = percentage;
        }
    }

    updateFPS() {
        if (!this.gameEngine?.stats) return;
        
        const fps = Math.round(this.gameEngine.stats.fps) || 0;
        if (fps !== this.previousValues.fps) {
            if (this.hudElements.fps) {
                this.hudElements.fps.textContent = fps;
            }
            this.previousValues.fps = fps;
        }
    }

    updateSelectedCount() {
        if (!this.selectionSystem) return;
        
        // Usar la API correcta del SelectionSystem refactorizado
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const count = selectedPlanets ? selectedPlanets.length : 0;
        
        if (count !== this.previousValues.selectedCount) {
            if (this.hudElements.selected) {
                this.hudElements.selected.textContent = count;
            }
            this.previousValues.selectedCount = count;
        }
    }

    updateGameState() {
        if (!this.gameEngine) return;
        
        const gameState = this.gameEngine.gameState || 'unknown';
        const isPaused = this.gameEngine.isPaused;
        
        // Solo actualizar si hay cambios
        if (gameState !== this.previousValues.gameState || isPaused !== this.previousValues.isPaused) {
            
            // Actualizar texto del estado
            if (this.hudElements.state) {
                if (isPaused) {
                    this.hudElements.state.textContent = 'PAUSADO';
                } else {
                    this.hudElements.state.textContent = 'JUGANDO';
                }
            }
            
            // Actualizar indicador visual
            if (this.hudElements.statusIndicator) {
                if (isPaused) {
                    this.hudElements.statusIndicator.classList.add('paused');
                } else {
                    this.hudElements.statusIndicator.classList.remove('paused');
                }
            }
            
            this.previousValues.gameState = gameState;
            this.previousValues.isPaused = isPaused;
        }
    }

    // OPTIMIZACIÓN: Cache estático de colores de porcentaje
    getPercentageColor(percentage) {
        // Cache estático para evitar crear objetos
        if (!HUDManager.percentageColors) {
            HUDManager.percentageColors = {
                25: '#ffaa00',  // Naranja - conservador
                50: '#00ff88',  // Verde - equilibrado
                75: '#ff6666',  // Rojo claro - agresivo
                100: '#ff0000' // Rojo - muy agresivo
            };
        }
        
        return HUDManager.percentageColors[percentage] || '#00ff88';
    }

    // Método para forzar actualización completa (útil para debugging)
    forceUpdate() {
        // Resetear cache para forzar actualización
        this.previousValues = {
            planetsCount: -1,
            fleetsCount: -1,
            percentage: -1,
            fps: -1,
            selectedCount: -1,
            gameState: '',
            isPaused: null
        };
        
        this.updateHUD();
        console.log('📊 HUD actualización forzada completada');
    }

    // Método para cambiar la frecuencia de actualización
    setUpdateInterval(intervalMs) {
        this.updateInterval = Math.max(50, intervalMs); // Mínimo 50ms (20 FPS)
        console.log(`📊 HUD intervalo de actualización cambiado a ${this.updateInterval}ms`);
    }

    // Información de debug
    getDebugInfo() {
        return {
            isRunning: this.isRunning,
            updateInterval: this.updateInterval,
            lastUpdate: this.lastUpdate,
            elementsFound: Object.keys(this.hudElements).filter(key => !!this.hudElements[key]).length,
            totalElements: Object.keys(this.hudElements).length,
            previousValues: { ...this.previousValues }
        };
    }

    // Cleanup
    destroy() {
        this.stop();
        this.hudElements = null;
        this.gameEngine = null;
        this.selectionSystem = null;
        this.dragDropHandler = null;
        console.log('📊 HUD Manager destruido');
    }
}

export default HUDManager; 