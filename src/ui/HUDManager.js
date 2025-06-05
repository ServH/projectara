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
            planets: document.getElementById('hud-planets') || document.getElementById('planets-count'),
            fleets: document.getElementById('hud-fleets') || document.getElementById('fleets-count'),
            percentage: document.getElementById('hud-percentage') || document.getElementById('percentage'),
            fps: document.getElementById('hud-fps') || document.getElementById('fps'),
            selected: document.getElementById('hud-selected') || document.getElementById('selected-count'),
            state: document.getElementById('hud-state') || document.getElementById('game-state'),
            statusIndicator: document.getElementById('statusIndicator') || document.getElementById('status-indicator')
        };
        
        // Estado del HUD
        this.isRunning = false;
        this.updateInterval = 100; // ms
        this.lastUpdate = 0;
        this.lastFrameTime = 0; // Para cálculo de FPS
        
        // Cache de valores previos para optimización
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
            try {
                this.updatePlanetsCount();
            } catch (error) {
                console.warn('⚠️ Error actualizando planetas count:', error);
            }
            
            try {
                this.updateFleetsCount();
            } catch (error) {
                console.warn('⚠️ Error actualizando flotas count:', error);
            }
            
            try {
                this.updatePercentage();
            } catch (error) {
                console.warn('⚠️ Error actualizando porcentaje:', error);
            }
            
            try {
                this.updateFPS();
            } catch (error) {
                console.warn('⚠️ Error actualizando FPS:', error);
            }
            
            try {
                this.updateSelectedCount();
            } catch (error) {
                console.warn('⚠️ Error actualizando selección count:', error);
            }
            
            try {
                this.updateGameState();
            } catch (error) {
                console.warn('⚠️ Error actualizando estado del juego:', error);
            }
            
        } catch (error) {
            console.warn('⚠️ Error crítico actualizando HUD:', error);
        }
    }

    // OPTIMIZACIÓN: Métodos individuales para cada elemento con cache
    updatePlanetsCount() {
        if (!this.gameEngine) return;
        
        try {
            const planets = this.gameEngine.getAllPlanets();
            const count = planets ? planets.length : 0;
            
            if (count !== this.previousValues.planetsCount) {
                if (this.hudElements.planets) {
                    this.hudElements.planets.textContent = count;
                }
                this.previousValues.planetsCount = count;
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo planetas count:', error);
        }
    }

    updateFleetsCount() {
        if (!this.gameEngine) return;
        
        try {
            const fleets = this.gameEngine.getAllFleets();
            const count = fleets ? fleets.length : 0;
            
            if (count !== this.previousValues.fleetsCount) {
                if (this.hudElements.fleets) {
                    this.hudElements.fleets.textContent = count;
                }
                this.previousValues.fleetsCount = count;
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo flotas count:', error);
        }
    }

    updatePercentage() {
        if (!this.gameEngine?.configurationManager) return;
        
        try {
            // Obtener porcentaje de la configuración del juego
            const config = this.gameEngine.configurationManager.getSection('gameplay');
            const percentage = config?.fleetSendPercentage || 50;
            
            if (percentage !== this.previousValues.percentage) {
                if (this.hudElements.percentage) {
                    this.hudElements.percentage.textContent = percentage + '%';
                    
                    // OPTIMIZACIÓN: Cache de colores
                    const color = this.getPercentageColor(percentage);
                    this.hudElements.percentage.style.color = color;
                }
                this.previousValues.percentage = percentage;
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo porcentaje:', error);
        }
    }

    updateFPS() {
        // Calcular FPS basado en el tiempo entre frames
        const now = performance.now();
        if (this.lastFrameTime) {
            const deltaTime = now - this.lastFrameTime;
            const fps = Math.round(1000 / deltaTime);
            
            if (fps !== this.previousValues.fps) {
                if (this.hudElements.fps) {
                    this.hudElements.fps.textContent = fps;
                }
                this.previousValues.fps = fps;
            }
        }
        this.lastFrameTime = now;
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