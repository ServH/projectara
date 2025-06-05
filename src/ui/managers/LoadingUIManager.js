/**
 * 🎨 LOADING UI MANAGER
 * Gestiona la interfaz de usuario durante el proceso de carga
 * Patrón: Observer Pattern
 */

export class LoadingUIManager {
    constructor(config = {}) {
        this.config = {
            animationDuration: 300,
            progressAnimationSpeed: 50,
            statusUpdateDelay: 100,
            fadeOutDuration: 500,
            ...config
        };
        
        // Referencias DOM
        this.loadingScreen = null;
        this.progressBar = null;
        this.statusText = null;
        this.topBar = null;
        this.bottomBar = null;
        
        // Estado interno
        this.progress = 0;
        this.isVisible = false;
        this.observers = new Set();
        this.animationFrame = null;
        this.statusQueue = [];
        
        // Configuración de animaciones
        this.progressAnimation = {
            current: 0,
            target: 0,
            speed: this.config.progressAnimationSpeed
        };
        
        this.init();
    }

    /**
     * Inicializa el gestor y obtiene referencias DOM
     */
    init() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.progressBar = document.getElementById('loadingProgressBar');
        this.statusText = document.getElementById('loadingStatus');
        this.topBar = document.getElementById('topBar');
        this.bottomBar = document.querySelector('.bottom-bar');
        
        if (!this.loadingScreen || !this.progressBar || !this.statusText) {
            console.warn('⚠️ LoadingUIManager: Elementos DOM requeridos no encontrados');
            return;
        }
        
        this.isVisible = !this.loadingScreen.classList.contains('hidden');
        this.setupAnimations();
        
        console.log('🎨 LoadingUIManager inicializado');
    }

    /**
     * Configura las animaciones suaves
     */
    setupAnimations() {
        // Configurar transiciones CSS si no existen
        if (this.progressBar && !this.progressBar.style.transition) {
            this.progressBar.style.transition = `width ${this.config.progressAnimationSpeed}ms ease-out`;
        }
        
        if (this.statusText && !this.statusText.style.transition) {
            this.statusText.style.transition = `opacity ${this.config.statusUpdateDelay}ms ease-in-out`;
        }
    }

    /**
     * Actualiza el progreso con animación suave
     * @param {number} progress - Progreso (0-100)
     * @param {string} status - Texto de estado
     */
    updateProgress(progress, status) {
        const clampedProgress = Math.min(100, Math.max(0, progress));
        
        // Actualizar progreso con animación
        this.setProgress(clampedProgress);
        
        // Actualizar estado si se proporciona
        if (status) {
            this.setStatus(status);
        }
        
        // Notificar observadores
        this.notifyObservers('progress', { progress: clampedProgress, status });
    }

    /**
     * Establece el progreso con animación suave
     * @param {number} progress - Progreso (0-100)
     */
    setProgress(progress) {
        this.progress = progress;
        
        if (this.progressBar) {
            // Animación suave del progress bar
            this.progressAnimation.target = progress;
            this.animateProgress();
        }
    }

    /**
     * Anima el progress bar suavemente
     */
    animateProgress() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const animate = () => {
            const diff = this.progressAnimation.target - this.progressAnimation.current;
            
            if (Math.abs(diff) > 0.1) {
                this.progressAnimation.current += diff * 0.1;
                this.progressBar.style.width = this.progressAnimation.current + '%';
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.progressAnimation.current = this.progressAnimation.target;
                this.progressBar.style.width = this.progressAnimation.current + '%';
            }
        };
        
        animate();
    }

    /**
     * Establece el texto de estado con efecto de fade
     * @param {string} status - Texto de estado
     */
    setStatus(status) {
        if (!this.statusText) return;
        
        // Agregar a cola de estados para evitar cambios muy rápidos
        this.statusQueue.push(status);
        this.processStatusQueue();
    }

    /**
     * Procesa la cola de estados con delays apropiados
     */
    processStatusQueue() {
        if (this.statusQueue.length === 0 || this.processingStatus) return;
        
        this.processingStatus = true;
        const status = this.statusQueue.shift();
        
        // Fade out
        this.statusText.style.opacity = '0';
        
        setTimeout(() => {
            this.statusText.textContent = status;
            // Fade in
            this.statusText.style.opacity = '1';
            
            setTimeout(() => {
                this.processingStatus = false;
                this.processStatusQueue(); // Procesar siguiente en cola
            }, this.config.statusUpdateDelay);
        }, this.config.statusUpdateDelay / 2);
    }

    /**
     * Muestra la pantalla de carga
     */
    show() {
        if (!this.loadingScreen) return;
        
        this.loadingScreen.classList.remove('hidden');
        this.isVisible = true;
        
        // Ocultar barras de UI
        if (this.topBar) this.topBar.style.display = 'none';
        if (this.bottomBar) this.bottomBar.style.display = 'none';
        
        this.notifyObservers('show');
        console.log('🎨 Pantalla de carga mostrada');
    }

    /**
     * Oculta la pantalla de carga con animación
     */
    async hide() {
        if (!this.loadingScreen || !this.isVisible) return;
        
        return new Promise((resolve) => {
            // Animación de fade out
            this.loadingScreen.style.transition = `opacity ${this.config.fadeOutDuration}ms ease-out`;
            this.loadingScreen.style.opacity = '0';
            
            setTimeout(() => {
                this.loadingScreen.classList.add('hidden');
                this.loadingScreen.style.opacity = '1'; // Resetear para próxima vez
                this.isVisible = false;
                
                // Mostrar barras de UI
                if (this.topBar) this.topBar.style.display = 'flex';
                if (this.bottomBar) this.bottomBar.style.display = 'flex';
                
                this.notifyObservers('hide');
                console.log('🎨 Pantalla de carga ocultada');
                resolve();
            }, this.config.fadeOutDuration);
        });
    }

    /**
     * Remueve completamente la pantalla de carga del DOM
     */
    remove() {
        if (this.loadingScreen && this.loadingScreen.parentNode) {
            this.loadingScreen.parentNode.removeChild(this.loadingScreen);
            this.loadingScreen = null;
            this.notifyObservers('remove');
            console.log('🎨 Pantalla de carga removida del DOM');
        }
    }

    /**
     * Establece un mensaje de error
     * @param {string} errorMessage - Mensaje de error
     */
    setError(errorMessage) {
        this.setStatus(`❌ Error: ${errorMessage}`);
        
        // Cambiar color del progress bar a rojo
        if (this.progressBar) {
            this.progressBar.style.backgroundColor = '#ff4444';
        }
        
        this.notifyObservers('error', { message: errorMessage });
    }

    /**
     * Resetea el estado del loading
     */
    reset() {
        this.progress = 0;
        this.progressAnimation.current = 0;
        this.progressAnimation.target = 0;
        this.statusQueue = [];
        this.processingStatus = false;
        
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
            this.progressBar.style.backgroundColor = ''; // Resetear color
        }
        
        if (this.statusText) {
            this.statusText.textContent = '';
            this.statusText.style.opacity = '1';
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.notifyObservers('reset');
        console.log('🎨 LoadingUIManager reseteado');
    }

    /**
     * Añade un observador para eventos del loading
     * @param {Function} observer - Función observadora
     */
    addObserver(observer) {
        this.observers.add(observer);
    }

    /**
     * Remueve un observador
     * @param {Function} observer - Función observadora
     */
    removeObserver(observer) {
        this.observers.delete(observer);
    }

    /**
     * Notifica a todos los observadores
     * @param {string} event - Tipo de evento
     * @param {*} data - Datos del evento
     */
    notifyObservers(event, data = null) {
        this.observers.forEach(observer => {
            try {
                observer(event, data);
            } catch (error) {
                console.error('Error en observador de LoadingUIManager:', error);
            }
        });
    }

    /**
     * Obtiene el estado actual del loading
     * @returns {Object} Estado actual
     */
    getState() {
        return {
            progress: this.progress,
            isVisible: this.isVisible,
            currentStatus: this.statusText?.textContent || '',
            queueLength: this.statusQueue.length
        };
    }

    /**
     * Configura opciones del gestor
     * @param {Object} newConfig - Nueva configuración
     */
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.setupAnimations();
    }

    /**
     * Limpia recursos y event listeners
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.observers.clear();
        this.statusQueue = [];
        
        // Limpiar referencias DOM
        this.loadingScreen = null;
        this.progressBar = null;
        this.statusText = null;
        this.topBar = null;
        this.bottomBar = null;
        
        console.log('🎨 LoadingUIManager destruido');
    }
}

export default LoadingUIManager; 