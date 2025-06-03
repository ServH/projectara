/**
 * 🐛 GALCON GAME - DEBUG PANEL (OPTIMIZADO)
 * Panel de debug separado del HTML con actualizaciones optimizadas
 * OPTIMIZACIÓN: requestAnimationFrame y cache de contenido
 */

export class DebugPanel {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Elementos del DOM
        this.debugPanel = document.getElementById('debugPanel');
        this.debugContent = document.getElementById('debugContent');
        
        // OPTIMIZACIÓN: Control de actualización optimizado
        this.isVisible = false;
        this.isUpdating = false;
        this.lastUpdate = 0;
        this.updateInterval = 1000; // 1 segundo para debug (suficiente)
        
        // Cache de contenido anterior para evitar actualizaciones innecesarias
        this.previousContent = '';
        
        console.log('🐛 DebugPanel inicializado - Elementos encontrados:', {
            panel: !!this.debugPanel,
            content: !!this.debugContent
        });
    }

    toggle() {
        if (!this.debugPanel) {
            console.warn('⚠️ Panel de debug no encontrado en el DOM');
            return;
        }

        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (!this.debugPanel) return;
        
        this.debugPanel.classList.remove('hidden');
        this.isVisible = true;
        
        // Iniciar actualizaciones optimizadas
        this.startUpdating();
        
        console.log('🐛 Panel de debug mostrado');
    }

    hide() {
        if (!this.debugPanel) return;
        
        this.debugPanel.classList.add('hidden');
        this.isVisible = false;
        
        // Detener actualizaciones
        this.stopUpdating();
        
        console.log('🐛 Panel de debug ocultado');
    }

    // OPTIMIZACIÓN: Sistema de actualización con requestAnimationFrame
    startUpdating() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        this.lastUpdate = performance.now();
        this.updateLoop();
        
        console.log('🐛 Actualizaciones de debug iniciadas');
    }

    stopUpdating() {
        this.isUpdating = false;
        console.log('🐛 Actualizaciones de debug detenidas');
    }

    // OPTIMIZACIÓN: Loop optimizado con requestAnimationFrame
    updateLoop() {
        if (!this.isUpdating || !this.isVisible) return;
        
        const now = performance.now();
        
        // Solo actualizar cada segundo
        if (now - this.lastUpdate >= this.updateInterval) {
            this.updateContent();
            this.lastUpdate = now;
        }
        
        // Continuar el loop
        requestAnimationFrame(() => this.updateLoop());
    }

    updateContent() {
        if (!this.debugContent || !this.gameEngine) return;
        
        try {
            const newContent = this.generateDebugContent();
            
            // OPTIMIZACIÓN: Solo actualizar DOM si el contenido cambió
            if (newContent !== this.previousContent) {
                this.debugContent.innerHTML = `<pre>${newContent}</pre>`;
                this.previousContent = newContent;
            }
            
        } catch (error) {
            console.warn('⚠️ Error actualizando contenido de debug:', error);
        }
    }

    generateDebugContent() {
        const debugInfo = this.gameEngine.getDebugInfo();
        const performanceReport = this.gameEngine.getPerformanceReport();
        
        let content = `🎮 GAME ENGINE DEBUG
====================
Estado: ${debugInfo.gameState}
Ejecutándose: ${debugInfo.isRunning}
Pausado: ${debugInfo.isPaused}
FPS: ${debugInfo.stats.fps}
Planetas: ${debugInfo.planetsCount}
Flotas: ${debugInfo.fleetsCount}

`;

        // 📊 Información de rendimiento
        if (performanceReport) {
            content += `📊 PERFORMANCE PROFILER
=======================
FPS Actual: ${performanceReport.performance.fps.current}
FPS Promedio: ${performanceReport.performance.fps.average}
FPS Mínimo: ${performanceReport.performance.fps.min}
FPS Máximo: ${performanceReport.performance.fps.max}

Frame Time: ${performanceReport.performance.frameTime.current}ms
Render Time: ${performanceReport.performance.renderTime.current}ms
Update Time: ${performanceReport.performance.updateTime.current}ms

Memoria Usada: ${performanceReport.memory.used}MB
Memoria Total: ${performanceReport.memory.total}MB
Uso: ${performanceReport.memory.usagePercent}%

Elementos SVG: ${performanceReport.objects.svgElements}
Total Objetos: ${performanceReport.objects.total}

Estado: ${performanceReport.analysis.status}
Problemas: ${performanceReport.analysis.issues.length}

`;

            // Mostrar problemas si los hay
            if (performanceReport.analysis.issues.length > 0) {
                content += `⚠️ PROBLEMAS DETECTADOS:
`;
                performanceReport.analysis.issues.forEach(issue => {
                    content += `- ${issue}
`;
                });
                content += `
`;
            }

            // Mostrar recomendaciones
            if (performanceReport.analysis.recommendations.length > 0) {
                content += `💡 RECOMENDACIONES:
`;
                performanceReport.analysis.recommendations.forEach(rec => {
                    content += `- ${rec}
`;
                });
                content += `
`;
            }
        }

        // 🎛️ Información del PercentageSelector
        if (debugInfo.percentageSelector) {
            content += `🎛️ PERCENTAGE SELECTOR
======================
Porcentaje: ${debugInfo.percentageSelector.currentPercentage}%
Factor: ${debugInfo.percentageSelector.factor}
Planetas Seleccionados: ${debugInfo.percentageSelector.hasSelectedPlanets}

`;
        }

        // 🔄 Información del FleetRedirectionSystem
        if (debugInfo.fleetRedirectionSystem) {
            content += `🔄 FLEET REDIRECTION
====================
Flotas Seleccionadas: ${debugInfo.fleetRedirectionSystem.selectedFleets}

`;
        }

        content += `🎮 CONTROLES DE PROFILING
=========================
F2: Generar reporte completo
F3: Iniciar/detener grabación
F4: Resetear métricas
F6: Ejecutar benchmark ligero
F7: Ejecutar benchmark completo

`;

        return content;
    }

    // Método para forzar actualización inmediata
    forceUpdate() {
        this.previousContent = ''; // Resetear cache
        this.updateContent();
        console.log('🐛 Debug panel actualización forzada');
    }

    // Método para cambiar la frecuencia de actualización
    setUpdateInterval(intervalMs) {
        this.updateInterval = Math.max(500, intervalMs); // Mínimo 500ms
        console.log(`🐛 Debug panel intervalo cambiado a ${this.updateInterval}ms`);
    }

    // Información de debug del propio panel
    getDebugInfo() {
        return {
            isVisible: this.isVisible,
            isUpdating: this.isUpdating,
            updateInterval: this.updateInterval,
            lastUpdate: this.lastUpdate,
            contentLength: this.previousContent.length,
            elementsFound: {
                panel: !!this.debugPanel,
                content: !!this.debugContent
            }
        };
    }

    // Cleanup
    destroy() {
        this.stopUpdating();
        this.hide();
        
        this.debugPanel = null;
        this.debugContent = null;
        this.gameEngine = null;
        this.previousContent = '';
        
        console.log('🐛 Debug Panel destruido');
    }
}

export default DebugPanel; 