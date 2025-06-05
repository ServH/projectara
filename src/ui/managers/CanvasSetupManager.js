/**
 * 🖼️ CANVAS SETUP MANAGER
 * Gestiona la configuración y setup del canvas HTML5
 * Patrón: Builder Pattern
 */

export class CanvasSetupManager {
    constructor(config = {}) {
        this.config = {
            canvasId: 'gameCanvas',
            gameAreaSelector: '.game-area',
            enableHighDPI: true,
            enableContextMenu: false,
            enableImageSmoothing: true,
            contextType: '2d',
            contextAttributes: {
                alpha: false,
                desynchronized: true,
                willReadFrequently: false
            },
            ...config
        };
        
        // Referencias
        this.canvas = null;
        this.context = null;
        this.gameArea = null;
        
        // Estado
        this.isSetup = false;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.resizeObserver = null;
        this.eventListeners = new Map();
        
        // Métricas
        this.metrics = {
            setupTime: 0,
            resizeCount: 0,
            lastResize: null,
            canvasSize: { width: 0, height: 0 },
            displaySize: { width: 0, height: 0 }
        };
        
        this.init();
    }

    /**
     * Inicializa el gestor
     */
    init() {
        this.gameArea = document.querySelector(this.config.gameAreaSelector);
        if (!this.gameArea) {
            console.error(`🖼️ Game area no encontrada: ${this.config.gameAreaSelector}`);
            return;
        }
        
        console.log('🖼️ CanvasSetupManager inicializado');
    }

    /**
     * Configura el canvas completamente
     * @returns {Promise<Object>} Canvas y contexto configurados
     */
    async setupCanvas() {
        const startTime = performance.now();
        
        try {
            // Paso 1: Crear o obtener canvas
            this.canvas = this.createOrGetCanvas();
            
            // Paso 2: Configurar propiedades básicas
            this.configureCanvasProperties();
            
            // Paso 3: Obtener contexto
            this.context = this.setupContext();
            
            // Paso 4: Configurar tamaño inicial
            this.updateCanvasSize();
            
            // Paso 5: Configurar event listeners
            this.setupEventListeners();
            
            // Paso 6: Configurar observador de redimensionamiento
            this.setupResizeObserver();
            
            this.isSetup = true;
            this.metrics.setupTime = performance.now() - startTime;
            
            console.log(`🖼️ Canvas configurado exitosamente (${this.metrics.setupTime.toFixed(2)}ms)`);
            
            return {
                canvas: this.canvas,
                context: this.context,
                metrics: this.getMetrics()
            };
            
        } catch (error) {
            console.error('🖼️ Error configurando canvas:', error);
            throw error;
        }
    }

    /**
     * Crea un nuevo canvas o obtiene el existente
     * @returns {HTMLCanvasElement} Canvas element
     */
    createOrGetCanvas() {
        let canvas = document.getElementById(this.config.canvasId);
        
        if (!canvas) {
            // Crear nuevo canvas
            canvas = document.createElement('canvas');
            canvas.id = this.config.canvasId;
            this.gameArea.appendChild(canvas);
            console.log('🖼️ Nuevo canvas creado');
        } else {
            // Verificar que sea realmente un canvas
            if (canvas.tagName.toLowerCase() !== 'canvas') {
                const newCanvas = document.createElement('canvas');
                newCanvas.id = this.config.canvasId;
                newCanvas.style.cssText = canvas.style.cssText;
                canvas.parentNode.replaceChild(newCanvas, canvas);
                canvas = newCanvas;
                console.log('🖼️ Elemento reemplazado por canvas');
            } else {
                console.log('🖼️ Canvas existente reutilizado');
            }
        }
        
        return canvas;
    }

    /**
     * Configura propiedades básicas del canvas
     */
    configureCanvasProperties() {
        if (!this.canvas) return;
        
        // Configurar estilos CSS
        this.canvas.style.display = 'block';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1';
        
        // Configurar atributos
        this.canvas.setAttribute('tabindex', '0'); // Para eventos de teclado
        
        // Deshabilitar menú contextual si está configurado
        if (!this.config.enableContextMenu) {
            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        }
        
        console.log('🖼️ Propiedades básicas del canvas configuradas');
    }

    /**
     * Configura el contexto de renderizado
     * @returns {CanvasRenderingContext2D} Contexto configurado
     */
    setupContext() {
        if (!this.canvas) {
            throw new Error('Canvas no disponible para configurar contexto');
        }
        
        const context = this.canvas.getContext(
            this.config.contextType, 
            this.config.contextAttributes
        );
        
        if (!context) {
            throw new Error(`No se pudo obtener contexto ${this.config.contextType}`);
        }
        
        // Configurar propiedades del contexto
        if (context instanceof CanvasRenderingContext2D) {
            context.imageSmoothingEnabled = this.config.enableImageSmoothing;
            context.imageSmoothingQuality = 'high';
            context.textBaseline = 'middle';
            context.textAlign = 'center';
        }
        
        console.log(`🖼️ Contexto ${this.config.contextType} configurado`);
        return context;
    }

    /**
     * Actualiza el tamaño del canvas
     */
    updateCanvasSize() {
        if (!this.canvas || !this.gameArea) return;
        
        const rect = this.gameArea.getBoundingClientRect();
        const dpr = this.config.enableHighDPI ? this.devicePixelRatio : 1;
        
        // Tamaño de display (CSS)
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        
        // Tamaño del canvas (buffer interno)
        const canvasWidth = displayWidth * dpr;
        const canvasHeight = displayHeight * dpr;
        
        // Aplicar tamaños
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Escalar contexto para high DPI
        if (this.context && dpr !== 1) {
            this.context.scale(dpr, dpr);
        }
        
        // Actualizar métricas
        this.metrics.canvasSize = { width: canvasWidth, height: canvasHeight };
        this.metrics.displaySize = { width: displayWidth, height: displayHeight };
        this.metrics.resizeCount++;
        this.metrics.lastResize = Date.now();
        
        console.log(`🖼️ Canvas redimensionado: ${displayWidth}x${displayHeight} (${canvasWidth}x${canvasHeight})`);
    }

    /**
     * Configura event listeners básicos
     */
    setupEventListeners() {
        if (!this.canvas) return;
        
        // Listener de redimensionamiento de ventana
        const resizeHandler = () => {
            this.updateCanvasSize();
        };
        
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.set('resize', resizeHandler);
        
        // Listener de cambio de DPI
        const mediaQuery = window.matchMedia(`(resolution: ${this.devicePixelRatio}dppx)`);
        const dpiHandler = () => {
            this.devicePixelRatio = window.devicePixelRatio || 1;
            this.updateCanvasSize();
        };
        
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', dpiHandler);
            this.eventListeners.set('dpi', { mediaQuery, handler: dpiHandler });
        }
        
        // Focus para eventos de teclado
        const focusHandler = () => {
            this.canvas.focus();
        };
        
        this.canvas.addEventListener('click', focusHandler);
        this.eventListeners.set('focus', focusHandler);
        
        console.log('🖼️ Event listeners configurados');
    }

    /**
     * Configura ResizeObserver para cambios de tamaño más precisos
     */
    setupResizeObserver() {
        if (!window.ResizeObserver || !this.gameArea) return;
        
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.gameArea) {
                    this.updateCanvasSize();
                }
            }
        });
        
        this.resizeObserver.observe(this.gameArea);
        console.log('🖼️ ResizeObserver configurado');
    }

    /**
     * Obtiene el canvas configurado
     * @returns {HTMLCanvasElement} Canvas element
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Obtiene el contexto configurado
     * @returns {CanvasRenderingContext2D} Contexto de renderizado
     */
    getContext() {
        return this.context;
    }

    /**
     * Obtiene las dimensiones actuales
     * @returns {Object} Dimensiones del canvas
     */
    getDimensions() {
        return {
            canvas: { ...this.metrics.canvasSize },
            display: { ...this.metrics.displaySize },
            devicePixelRatio: this.devicePixelRatio
        };
    }

    /**
     * Verifica si el canvas está configurado
     * @returns {boolean} True si está configurado
     */
    isCanvasReady() {
        return this.isSetup && this.canvas && this.context;
    }

    /**
     * Limpia el canvas
     */
    clearCanvas() {
        if (!this.context) return;
        
        const { width, height } = this.metrics.displaySize;
        this.context.clearRect(0, 0, width, height);
    }

    /**
     * Configura el viewport del canvas
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} width - Ancho
     * @param {number} height - Alto
     */
    setViewport(x, y, width, height) {
        if (!this.context) return;
        
        this.context.save();
        this.context.beginPath();
        this.context.rect(x, y, width, height);
        this.context.clip();
    }

    /**
     * Restaura el viewport del canvas
     */
    restoreViewport() {
        if (!this.context) return;
        this.context.restore();
    }

    /**
     * Obtiene métricas del canvas
     * @returns {Object} Métricas detalladas
     */
    getMetrics() {
        return {
            ...this.metrics,
            isSetup: this.isSetup,
            devicePixelRatio: this.devicePixelRatio,
            contextType: this.config.contextType,
            highDPIEnabled: this.config.enableHighDPI
        };
    }

    /**
     * Genera reporte del estado del canvas
     * @returns {Object} Reporte detallado
     */
    generateReport() {
        const metrics = this.getMetrics();
        
        return {
            setup: {
                isReady: this.isCanvasReady(),
                setupTime: `${metrics.setupTime.toFixed(2)}ms`,
                contextType: metrics.contextType
            },
            dimensions: {
                canvas: metrics.canvasSize,
                display: metrics.displaySize,
                devicePixelRatio: metrics.devicePixelRatio
            },
            performance: {
                resizeCount: metrics.resizeCount,
                lastResize: metrics.lastResize ? new Date(metrics.lastResize).toISOString() : null
            },
            features: {
                highDPI: metrics.highDPIEnabled,
                imageSmoothing: this.config.enableImageSmoothing,
                contextMenu: this.config.enableContextMenu
            }
        };
    }

    /**
     * Configura opciones del gestor
     * @param {Object} newConfig - Nueva configuración
     */
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Reconfigurar si ya está setup
        if (this.isSetup) {
            this.updateCanvasSize();
            if (this.context && newConfig.enableImageSmoothing !== undefined) {
                this.context.imageSmoothingEnabled = this.config.enableImageSmoothing;
            }
        }
    }

    /**
     * Resetea el canvas
     */
    reset() {
        this.clearCanvas();
        this.metrics.resizeCount = 0;
        this.metrics.lastResize = null;
        console.log('🖼️ Canvas reseteado');
    }

    /**
     * Limpia recursos y event listeners
     */
    destroy() {
        // Limpiar event listeners
        this.eventListeners.forEach((listener, key) => {
            if (key === 'resize') {
                window.removeEventListener('resize', listener);
            } else if (key === 'dpi' && listener.mediaQuery) {
                listener.mediaQuery.removeEventListener('change', listener.handler);
            } else if (key === 'focus') {
                this.canvas?.removeEventListener('click', listener);
            }
        });
        this.eventListeners.clear();
        
        // Limpiar ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        // Limpiar referencias
        this.canvas = null;
        this.context = null;
        this.gameArea = null;
        this.isSetup = false;
        
        console.log('🖼️ CanvasSetupManager destruido');
    }
}

export default CanvasSetupManager; 