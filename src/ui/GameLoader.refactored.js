/**
 * 🚀 GAME LOADER - REFACTORED
 * Coordinador principal del proceso de carga del juego
 * Patrón: Coordinator Pattern + Dependency Injection
 */

import LoadingUIManager from './managers/LoadingUIManager.js';
import ModuleLoadingManager from './managers/ModuleLoadingManager.js';
import CanvasSetupManager from './managers/CanvasSetupManager.js';
import SystemInitializationManager from './managers/SystemInitializationManager.js';
import GlobalControlsManager from './managers/GlobalControlsManager.js';
import DebugToolsManager from './managers/DebugToolsManager.js';

export class GameLoader {
    constructor() {
        // Gestores especializados
        this.loadingUIManager = new LoadingUIManager();
        this.moduleLoadingManager = new ModuleLoadingManager();
        this.canvasSetupManager = new CanvasSetupManager();
        this.systemInitializationManager = new SystemInitializationManager();
        this.globalControlsManager = new GlobalControlsManager();
        this.debugToolsManager = new DebugToolsManager();
        
        this.isLoading = false;
        this.loadedSystems = null;
        
        console.log('🚀 GameLoader refactorizado inicializado');
    }

    async load() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('🚀 Iniciando carga del juego...');
            
            // Paso 1: Setup Canvas
            this.loadingUIManager.updateProgress(10, 'Configurando Canvas 2D...');
            await this.canvasSetupManager.setupCanvas();
            await this.delay(200);

            // Paso 2: Cargar módulos
            this.loadingUIManager.updateProgress(30, 'Cargando motor del juego...');
            const modules = await this.loadModules();
            await this.delay(200);

            // Paso 3: Inicializar sistemas
            this.loadingUIManager.updateProgress(70, 'Configurando sistemas...');
            this.loadedSystems = await this.systemInitializationManager.initializeSystems(modules);
            await this.delay(200);

            // Paso 4: Configurar controles
            this.loadingUIManager.updateProgress(90, 'Configurando controles...');
            this.globalControlsManager.activate(this.loadedSystems);
            this.debugToolsManager.initialize(this.loadedSystems.gameEngine);
            await this.delay(200);

            // Paso 5: Finalizar
            this.loadingUIManager.updateProgress(100, '¡Listo para conquistar la galaxia!');
            await this.delay(500);
            
            await this.finalize();
            
            console.log('🚀 Carga completada exitosamente');
            
        } catch (error) {
            console.error('🚀 Error durante la carga:', error);
            this.loadingUIManager.setError(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    async loadModules() {
        const moduleSpecs = [
            { path: '../core/GameEngine.js', name: 'GameEngine' },
            { path: '../systems/AISystem.js', name: 'AISystem' },
            { path: '../systems/FleetRedirectionSystem.js', name: 'FleetRedirectionSystem' },
            { path: '../visual/CanvasRenderer.js', name: 'CanvasRenderer' },
            { path: '../systems/SelectionSystem.js', name: 'SelectionSystem' },
            { path: '../input/DragDropHandler.js', name: 'DragDropHandler' },
            { path: './HUDManager.js', name: 'HUDManager' }
        ];
        
        const modules = {};
        for (const spec of moduleSpecs) {
            modules[spec.name] = await this.moduleLoadingManager.loadModule(spec.path, spec.name);
        }
        
        return modules;
    }

    async finalize() {
        await this.loadingUIManager.hide();
        
        // Mostrar barras de UI
        const topBar = document.getElementById('topBar');
        const bottomBar = document.querySelector('.bottom-bar');
        
        if (topBar) topBar.style.display = 'flex';
        if (bottomBar) bottomBar.style.display = 'flex';
        
        setTimeout(() => {
            this.loadingUIManager.remove();
        }, 500);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getLoadedSystems() {
        return this.loadedSystems;
    }

    isLoadingComplete() {
        return !this.isLoading && this.loadedSystems !== null;
    }

    destroy() {
        this.globalControlsManager.destroy();
        this.loadingUIManager.destroy();
        this.moduleLoadingManager.destroy();
        this.canvasSetupManager.destroy();
        this.systemInitializationManager.destroy();
        this.debugToolsManager.destroy();
        
        console.log('🚀 GameLoader destruido');
    }
}

export default GameLoader; 