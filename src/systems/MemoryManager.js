/**
 * 🧠 GALCON GAME - MEMORY MANAGER
 * Sistema de gestión de memoria para optimizar uso de recursos
 * MILESTONE 2.2: Optimizaciones de Rendimiento
 */

export class MemoryManager {
    constructor() {
        // Configuración de limpieza
        this.config = {
            cleanupInterval: 5000,      // Limpiar cada 5 segundos
            maxFleetAge: 30000,         // Flotas máximo 30s después de llegar
            maxEffectAge: 10000,        // Efectos máximo 10s
            maxTrailAge: 15000,         // Trails máximo 15s
            maxEventListeners: 100,     // Máximo event listeners
            memoryThreshold: 100,       // MB threshold para limpieza forzada
            garbageCollectionInterval: 30000 // GC cada 30s
        };
        
        // Objetos programados para limpieza
        this.scheduledCleanups = new Map();
        this.cleanupId = 0;
        
        // Referencias para tracking
        this.trackedObjects = new WeakMap();
        this.eventListeners = new Set();
        this.svgElements = new Set();
        
        // Estadísticas
        this.stats = {
            objectsCreated: 0,
            objectsCleaned: 0,
            memoryFreed: 0,
            lastCleanup: Date.now(),
            cleanupCycles: 0
        };
        
        // Timers
        this.cleanupTimer = null;
        this.gcTimer = null;
        
        this.startCleanupCycle();
        console.log('🧠 MemoryManager inicializado');
    }

    /**
     * Iniciar ciclo de limpieza automática
     */
    startCleanupCycle() {
        // Limpieza regular
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
        
        // Garbage collection sugerido
        this.gcTimer = setInterval(() => {
            this.suggestGarbageCollection();
        }, this.config.garbageCollectionInterval);
    }

    /**
     * Programar limpieza de objeto
     */
    scheduleCleanup(object, delay = 0, cleanupFunction = null) {
        const cleanupId = ++this.cleanupId;
        const cleanupTime = Date.now() + delay;
        
        this.scheduledCleanups.set(cleanupId, {
            object: object,
            cleanupTime: cleanupTime,
            cleanupFunction: cleanupFunction,
            type: this.getObjectType(object)
        });
        
        // Trackear objeto
        this.trackedObjects.set(object, {
            id: cleanupId,
            createdAt: Date.now(),
            type: this.getObjectType(object)
        });
        
        this.stats.objectsCreated++;
        
        return cleanupId;
    }

    /**
     * Cancelar limpieza programada
     */
    cancelCleanup(cleanupId) {
        if (this.scheduledCleanups.has(cleanupId)) {
            this.scheduledCleanups.delete(cleanupId);
            return true;
        }
        return false;
    }

    /**
     * Realizar limpieza automática
     */
    performCleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        // Limpiar objetos programados
        for (const [id, cleanup] of this.scheduledCleanups.entries()) {
            if (now >= cleanup.cleanupTime) {
                this.cleanupObject(cleanup);
                this.scheduledCleanups.delete(id);
                cleanedCount++;
            }
        }
        
        // Limpiar elementos SVG huérfanos
        cleanedCount += this.cleanupOrphanedSVGElements();
        
        // Limpiar event listeners huérfanos
        cleanedCount += this.cleanupOrphanedEventListeners();
        
        // Actualizar estadísticas
        this.stats.objectsCleaned += cleanedCount;
        this.stats.lastCleanup = now;
        this.stats.cleanupCycles++;
        
        if (cleanedCount > 0) {
            console.log(`🧹 MemoryManager: ${cleanedCount} objetos limpiados`);
        }
        
        // Limpieza forzada si se supera threshold de memoria
        this.checkMemoryThreshold();
    }

    /**
     * Limpiar objeto específico
     */
    cleanupObject(cleanup) {
        const { object, cleanupFunction, type } = cleanup;
        
        try {
            if (cleanupFunction) {
                cleanupFunction(object);
            } else {
                this.defaultCleanup(object, type);
            }
        } catch (error) {
            console.warn('⚠️ Error en limpieza de objeto:', error);
        }
    }

    /**
     * Limpieza por defecto según tipo de objeto
     */
    defaultCleanup(object, type) {
        switch (type) {
            case 'fleet':
                this.cleanupFleet(object);
                break;
            case 'effect':
                this.cleanupEffect(object);
                break;
            case 'svgElement':
                this.cleanupSVGElement(object);
                break;
            case 'eventListener':
                this.cleanupEventListener(object);
                break;
            default:
                this.genericCleanup(object);
        }
    }

    /**
     * Limpiar flota
     */
    cleanupFleet(fleet) {
        if (fleet && fleet.hasArrived) {
            // Limpiar trail
            if (fleet.trail) {
                fleet.trail.length = 0;
            }
            
            // Remover elemento visual si existe
            if (fleet.element && fleet.element.parentNode) {
                fleet.element.parentNode.removeChild(fleet.element);
            }
            
            // Limpiar referencias
            fleet.element = null;
            fleet.trail = null;
        }
    }

    /**
     * Limpiar efecto visual
     */
    cleanupEffect(effect) {
        if (effect && effect.element) {
            if (effect.element.parentNode) {
                effect.element.parentNode.removeChild(effect.element);
            }
            effect.element = null;
        }
    }

    /**
     * Limpiar elemento SVG
     */
    cleanupSVGElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        this.svgElements.delete(element);
    }

    /**
     * Limpiar event listener
     */
    cleanupEventListener(listenerInfo) {
        if (listenerInfo && listenerInfo.element && listenerInfo.type && listenerInfo.listener) {
            listenerInfo.element.removeEventListener(listenerInfo.type, listenerInfo.listener);
            this.eventListeners.delete(listenerInfo);
        }
    }

    /**
     * Limpieza genérica
     */
    genericCleanup(object) {
        if (object && typeof object.destroy === 'function') {
            object.destroy();
        }
    }

    /**
     * Limpiar elementos SVG huérfanos
     */
    cleanupOrphanedSVGElements() {
        let cleanedCount = 0;
        
        for (const element of this.svgElements) {
            if (!element.parentNode || !document.contains(element)) {
                this.svgElements.delete(element);
                cleanedCount++;
            }
        }
        
        return cleanedCount;
    }

    /**
     * Limpiar event listeners huérfanos
     */
    cleanupOrphanedEventListeners() {
        let cleanedCount = 0;
        
        for (const listener of this.eventListeners) {
            if (!listener.element || !document.contains(listener.element)) {
                this.eventListeners.delete(listener);
                cleanedCount++;
            }
        }
        
        return cleanedCount;
    }

    /**
     * Verificar threshold de memoria
     */
    checkMemoryThreshold() {
        if (performance.memory) {
            const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
            
            if (usedMB > this.config.memoryThreshold) {
                console.warn(`⚠️ Memoria alta: ${usedMB.toFixed(1)}MB - Forzando limpieza`);
                this.forceCleanup();
            }
        }
    }

    /**
     * Forzar limpieza inmediata
     */
    forceCleanup() {
        // Limpiar todos los objetos programados
        for (const [id, cleanup] of this.scheduledCleanups.entries()) {
            this.cleanupObject(cleanup);
            this.scheduledCleanups.delete(id);
        }
        
        // Limpiar elementos huérfanos
        this.cleanupOrphanedSVGElements();
        this.cleanupOrphanedEventListeners();
        
        // Sugerir garbage collection
        this.suggestGarbageCollection();
        
        console.log('🧹 Limpieza forzada completada');
    }

    /**
     * Sugerir garbage collection
     */
    suggestGarbageCollection() {
        if (window.gc) {
            // Solo disponible en Chrome con --enable-precise-memory-info
            window.gc();
            console.log('🗑️ Garbage collection ejecutado');
        }
    }

    /**
     * Trackear elemento SVG
     */
    trackSVGElement(element) {
        this.svgElements.add(element);
        return element;
    }

    /**
     * Trackear event listener
     */
    trackEventListener(element, type, listener) {
        const listenerInfo = { element, type, listener };
        this.eventListeners.add(listenerInfo);
        return listenerInfo;
    }

    /**
     * Obtener tipo de objeto
     */
    getObjectType(object) {
        if (!object) return 'unknown';
        
        if (object.tagName) return 'svgElement';
        if (object.ships !== undefined) return 'fleet';
        if (object.element && object.duration) return 'effect';
        if (object.type && object.listener) return 'eventListener';
        
        return 'generic';
    }

    /**
     * Obtener estadísticas de memoria
     */
    getMemoryStats() {
        const memoryInfo = performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
        } : null;
        
        return {
            ...this.stats,
            scheduledCleanups: this.scheduledCleanups.size,
            trackedSVGElements: this.svgElements.size,
            trackedEventListeners: this.eventListeners.size,
            memory: memoryInfo
        };
    }

    /**
     * Configurar parámetros de memoria
     */
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Reiniciar timers si cambiaron los intervalos
        if (newConfig.cleanupInterval || newConfig.garbageCollectionInterval) {
            this.stop();
            this.startCleanupCycle();
        }
        
        console.log('🧠 MemoryManager reconfigurado:', newConfig);
    }

    /**
     * Detener gestión de memoria
     */
    stop() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        
        if (this.gcTimer) {
            clearInterval(this.gcTimer);
            this.gcTimer = null;
        }
    }

    /**
     * Destruir memory manager
     */
    destroy() {
        this.stop();
        this.forceCleanup();
        this.scheduledCleanups.clear();
        this.svgElements.clear();
        this.eventListeners.clear();
        
        console.log('💥 MemoryManager destruido');
    }
}

export default MemoryManager; 