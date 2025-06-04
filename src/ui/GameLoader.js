/**
 * 🚀 GALCON GAME - GAME LOADER (CANVAS 2D ONLY)
 * Sistema de carga progresiva optimizado para Canvas 2D
 */

export class GameLoader {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.progressBar = document.getElementById('loadingProgressBar');
        this.statusText = document.getElementById('loadingStatus');
        this.topBar = document.getElementById('topBar');
        this.progress = 0;
        
        // OPTIMIZACIÓN: Unificar intervalos en un solo timer
        this.updateInterval = null;
        this.isRunning = false;
    }

    updateProgress(progress, status) {
        this.progress = Math.min(100, Math.max(0, progress));
        this.progressBar.style.width = this.progress + '%';
        this.statusText.textContent = status;
    }

    async load() {
        try {
            this.updateProgress(10, 'Configurando Canvas 2D...');
            this.setupCanvas();
            await this.delay(200);

            this.updateProgress(30, 'Cargando motor del juego...');
            const { default: GameEngine } = await import('../core/GameEngine.js');
            await this.delay(200);

            this.updateProgress(50, 'Configurando sistemas...');
            const { default: AISystem } = await import('../systems/AISystem.js');
            const { default: FleetRedirectionSystem } = await import('../systems/FleetRedirectionSystem.js');
            await this.delay(200);

            this.updateProgress(70, 'Generando galaxia...');
            
            // Inicializar el juego
            const gameEngine = new GameEngine();
            gameEngine.init();
            
            this.updateProgress(85, 'Configurando Canvas 2D...');
            
            // 🚀 IMPORTANTE: Cargar CanvasRenderer PRIMERO para configurar overlay
            const { default: CanvasRenderer } = await import('../visual/CanvasRenderer.js');
            const renderer = new CanvasRenderer(gameEngine);
            console.log('🎨 Canvas 2D Renderer cargado');
            
            // 🧭 Conectar NavigationSystem al CanvasRenderer
            gameEngine.connectNavigationRenderer(renderer);
            
            renderer.start();
            await this.delay(200);
            
            this.updateProgress(90, 'Configurando controles...');
            
            // 🚀 AHORA cargar sistemas que dependen del overlay
            const { default: SelectionSystem } = await import('../systems/SelectionSystem.js');
            const { default: DragDropHandler } = await import('../input/DragDropHandler.js');
            
            const selectionSystem = new SelectionSystem(gameEngine);
            const dragDropHandler = new DragDropHandler(gameEngine, selectionSystem);
            
            await this.delay(200);

            this.updateProgress(100, '¡Listo para conquistar la galaxia!');
            await this.delay(500);

            // Ocultar pantalla de carga y mostrar interfaz
            this.loadingScreen.classList.add('hidden');
            this.topBar.style.display = 'flex';
            
            // Mostrar barra inferior también
            const bottomBar = document.querySelector('.bottom-bar');
            if (bottomBar) {
                bottomBar.style.display = 'flex';
            }
            
            // OPTIMIZACIÓN: Importar HUDManager separado
            const { default: HUDManager } = await import('./HUDManager.js');
            const hudManager = new HUDManager(gameEngine, selectionSystem, dragDropHandler);
            hudManager.start();
            
            // Configurar controles globales
            this.setupGlobalControls(gameEngine, selectionSystem, dragDropHandler);
            
            setTimeout(() => {
                this.loadingScreen.remove();
            }, 500);

        } catch (error) {
            console.error('Error cargando el juego:', error);
            this.updateProgress(0, 'Error: ' + error.message);
        }
    }

    setupCanvas() {
        const gameArea = document.querySelector('.game-area');
        let canvas = document.getElementById('gameCanvas');
        
        // Crear canvas HTML para Canvas 2D
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            gameArea.appendChild(canvas);
        } else if (canvas.tagName.toLowerCase() !== 'canvas') {
            // Reemplazar cualquier elemento existente con canvas
            const newCanvas = document.createElement('canvas');
            newCanvas.id = 'gameCanvas';
            newCanvas.style.cssText = canvas.style.cssText;
            canvas.parentNode.replaceChild(newCanvas, canvas);
            canvas = newCanvas;
        }
        
        console.log('🖼️ Canvas 2D configurado');
        this.updateCanvasSize();
        
        // Manejar redimensionamiento
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
        });
    }
    
    updateCanvasSize() {
        const canvas = document.getElementById('gameCanvas');
        const gameArea = document.querySelector('.game-area');
        
        if (canvas && gameArea) {
            const rect = gameArea.getBoundingClientRect();
            
            // Configurar Canvas 2D para alta resolución
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        }
    }

    setupGlobalControls(gameEngine, selectionSystem, dragDropHandler) {
        // 🔧 BOTÓN TEMPORAL: Toggle líneas de trayectoria
        const toggleButton = document.getElementById('toggleTrajectories');
        if (toggleButton) {
            let trajectoriesEnabled = true;
            
            toggleButton.addEventListener('click', () => {
                trajectoriesEnabled = !trajectoriesEnabled;
                
                // Actualizar configuración
                if (gameEngine.navigationSystem) {
                    gameEngine.navigationSystem.setVisualization(trajectoriesEnabled);
                }
                
                // Actualizar botón
                if (trajectoriesEnabled) {
                    toggleButton.textContent = '🎨 Líneas: ON';
                    toggleButton.classList.remove('off');
                } else {
                    toggleButton.textContent = '🎨 Líneas: OFF';
                    toggleButton.classList.add('off');
                    
                    // Limpiar líneas existentes
                    if (gameEngine.navigationSystem) {
                        gameEngine.navigationSystem.clearVisualization();
                    }
                }
                
                console.log(`🎨 Trayectorias: ${trajectoriesEnabled ? 'ACTIVADAS' : 'DESACTIVADAS'}`);
            });
        }
        
        // Manejar teclas globales
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'F1':
                    event.preventDefault();
                    this.toggleDebugPanel(gameEngine);
                    break;
                case 'F2':
                    event.preventDefault();
                    this.generatePerformanceReport(gameEngine);
                    break;
                case 'F3':
                    event.preventDefault();
                    this.toggleProfiling(gameEngine);
                    break;
                case 'F4':
                    event.preventDefault();
                    this.resetProfiler(gameEngine);
                    break;
                case 'F5':
                    event.preventDefault();
                    gameEngine.reset();
                    break;
                case 'F6':
                    event.preventDefault();
                    this.runLightBenchmark(gameEngine);
                    break;
                case 'F7':
                    event.preventDefault();
                    this.runFullBenchmark(gameEngine);
                    break;
                case 'Escape':
                    event.preventDefault();
                    selectionSystem.clearSelection();
                    break;
                case 'a':
                case 'A':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        selectionSystem.selectAll();
                    }
                    break;
            }
        });
        
        console.log('🎮 Controles globales configurados');
    }

    async toggleDebugPanel(gameEngine) {
        // OPTIMIZACIÓN: Importar DebugPanel dinámicamente
        const { default: DebugPanel } = await import('./DebugPanel.js');
        
        if (!this.debugPanel) {
            this.debugPanel = new DebugPanel(gameEngine);
        }
        
        this.debugPanel.toggle();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 📊 MÉTODOS DE PROFILING
    generatePerformanceReport(gameEngine) {
        const report = gameEngine.getPerformanceReport();
        if (report) {
            console.log('📊 REPORTE DE RENDIMIENTO:', report);
            
            // Mostrar resumen en consola
            console.log(`📊 FPS: ${report.performance.fps.average} (min: ${report.performance.fps.min}, max: ${report.performance.fps.max})`);
            console.log(`📊 Memoria: ${report.memory.used}MB (${report.memory.usagePercent}%)`);
            console.log(`📊 Objetos: ${report.objects.total} (SVG: ${report.objects.svgElements})`);
            console.log(`📊 Estado: ${report.analysis.status}`);
            
            if (report.analysis.issues.length > 0) {
                console.warn('⚠️ Problemas detectados:', report.analysis.issues);
            }
            
            if (report.analysis.recommendations.length > 0) {
                console.log('💡 Recomendaciones:', report.analysis.recommendations);
            }
        } else {
            console.warn('⚠️ Profiler no disponible');
        }
    }

    toggleProfiling(gameEngine) {
        if (gameEngine.performanceProfiler) {
            if (gameEngine.performanceProfiler.isRecording) {
                const data = gameEngine.performanceProfiler.stopRecording();
                console.log(`📊 Grabación detenida. ${data.length} muestras registradas`);
                console.log('📊 Datos de grabación:', data);
            } else {
                gameEngine.performanceProfiler.startRecording();
                console.log('📊 Grabación de profiling iniciada');
            }
        } else {
            console.warn('⚠️ Profiler no disponible');
        }
    }

    resetProfiler(gameEngine) {
        if (gameEngine.performanceProfiler) {
            gameEngine.performanceProfiler.reset();
            console.log('📊 Métricas de profiler reseteadas');
        } else {
            console.warn('⚠️ Profiler no disponible');
        }
    }

    async runLightBenchmark(gameEngine) {
        console.log('🧪 Iniciando benchmark ligero...');
        
        try {
            // Importar BenchmarkSuite dinámicamente
            const { default: BenchmarkSuite } = await import('../debug/BenchmarkSuite.js');
            const benchmark = new BenchmarkSuite(gameEngine);
            
            const result = await benchmark.runScenario('light');
            console.log('🧪 Benchmark ligero completado:', result);
            
            benchmark.destroy();
        } catch (error) {
            console.error('❌ Error en benchmark ligero:', error);
        }
    }

    async runFullBenchmark(gameEngine) {
        console.log('🧪 Iniciando benchmark completo...');
        
        try {
            // Importar BenchmarkSuite dinámicamente
            const { default: BenchmarkSuite } = await import('../debug/BenchmarkSuite.js');
            const benchmark = new BenchmarkSuite(gameEngine);
            
            const report = await benchmark.runFullBenchmark();
            console.log('🧪 Benchmark completo finalizado:', report);
            
            // Mostrar resumen
            console.log(`🧪 Escenarios ejecutados: ${report.summary.successful}/${report.summary.totalScenarios}`);
            
            if (report.recommendations.length > 0) {
                console.log('💡 Recomendaciones del benchmark:');
                report.recommendations.forEach(rec => {
                    console.log(`- [${rec.priority}] ${rec.issue}: ${rec.solution}`);
                });
            }
            
            benchmark.destroy();
        } catch (error) {
            console.error('❌ Error en benchmark completo:', error);
        }
    }
}

export default GameLoader; 