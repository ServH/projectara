/**
 * 👁️ GALCON GAME - CULLING SYSTEM
 * Sistema de culling para optimizar renderizado
 * MILESTONE 2.2: Optimizaciones de Rendimiento
 */

export class CullingSystem {
    constructor(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        // Configuración de culling
        this.config = {
            frustumPadding: 100,     // Padding extra para viewport
            distanceCulling: true,   // Culling por distancia
            sizeCulling: true,       // Culling por tamaño
            lodLevels: {
                high: 0,     // 0-500px del centro
                medium: 500, // 500-1000px del centro
                low: 1000,   // 1000px+ del centro
                cull: 1500   // Más de 1500px = no renderizar
            },
            minRenderSize: 2         // Tamaño mínimo para renderizar
        };
        
        // Viewport actual
        this.viewport = {
            x: 0,
            y: 0,
            width: worldWidth,
            height: worldHeight,
            centerX: worldWidth / 2,
            centerY: worldHeight / 2
        };
        
        // Estadísticas
        this.stats = {
            totalObjects: 0,
            culledObjects: 0,
            renderedObjects: 0,
            cullingRate: 0
        };
        
        console.log('👁️ CullingSystem inicializado');
    }

    /**
     * Actualizar viewport (cuando cambia la cámara)
     */
    updateViewport(x, y, width, height) {
        this.viewport.x = x;
        this.viewport.y = y;
        this.viewport.width = width;
        this.viewport.height = height;
        this.viewport.centerX = x + width / 2;
        this.viewport.centerY = y + height / 2;
    }

    /**
     * Verificar si un objeto está en el viewport
     */
    isInViewport(object) {
        const radius = object.radius || 10;
        const padding = this.config.frustumPadding;
        
        return (object.x + radius >= this.viewport.x - padding &&
                object.x - radius <= this.viewport.x + this.viewport.width + padding &&
                object.y + radius >= this.viewport.y - padding &&
                object.y - radius <= this.viewport.y + this.viewport.height + padding);
    }

    /**
     * Determinar si un objeto debe renderizarse
     */
    shouldRender(object) {
        // Verificar viewport
        if (!this.isInViewport(object)) {
            return false;
        }
        
        // Verificar tamaño mínimo
        if (this.config.sizeCulling) {
            const radius = object.radius || 10;
            if (radius < this.config.minRenderSize) {
                return false;
            }
        }
        
        // Verificar distancia
        if (this.config.distanceCulling) {
            const distance = this.getDistanceFromCenter(object);
            if (distance > this.config.lodLevels.cull) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Obtener nivel de detalle (LOD) para un objeto
     */
    getLODLevel(object) {
        if (!this.config.distanceCulling) {
            return 'high';
        }
        
        const distance = this.getDistanceFromCenter(object);
        
        if (distance <= this.config.lodLevels.high) {
            return 'high';
        } else if (distance <= this.config.lodLevels.medium) {
            return 'medium';
        } else if (distance <= this.config.lodLevels.low) {
            return 'low';
        } else {
            return 'cull';
        }
    }

    /**
     * Filtrar objetos para renderizado
     */
    cullObjects(objects) {
        this.stats.totalObjects = objects.length;
        this.stats.culledObjects = 0;
        this.stats.renderedObjects = 0;
        
        const visibleObjects = [];
        
        objects.forEach(object => {
            if (this.shouldRender(object)) {
                // Añadir información de LOD
                object._lodLevel = this.getLODLevel(object);
                visibleObjects.push(object);
                this.stats.renderedObjects++;
            } else {
                this.stats.culledObjects++;
            }
        });
        
        this.stats.cullingRate = (this.stats.culledObjects / this.stats.totalObjects) * 100;
        
        return visibleObjects;
    }

    /**
     * Filtrar planetas para renderizado
     */
    cullPlanets(planets) {
        return this.cullObjects(Array.from(planets.values()));
    }

    /**
     * Filtrar flotas para renderizado
     */
    cullFleets(fleets) {
        return this.cullObjects(Array.from(fleets.values()));
    }

    /**
     * Calcular distancia desde el centro del viewport
     */
    getDistanceFromCenter(object) {
        const dx = object.x - this.viewport.centerX;
        const dy = object.y - this.viewport.centerY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Obtener configuración de renderizado según LOD
     */
    getRenderConfig(lodLevel) {
        switch (lodLevel) {
            case 'high':
                return {
                    showDetails: true,
                    showEffects: true,
                    showText: true,
                    quality: 1.0
                };
            case 'medium':
                return {
                    showDetails: true,
                    showEffects: false,
                    showText: true,
                    quality: 0.8
                };
            case 'low':
                return {
                    showDetails: false,
                    showEffects: false,
                    showText: false,
                    quality: 0.6
                };
            default:
                return {
                    showDetails: false,
                    showEffects: false,
                    showText: false,
                    quality: 0.4
                };
        }
    }

    /**
     * Optimizar elementos SVG según LOD
     */
    optimizeElement(element, lodLevel) {
        const config = this.getRenderConfig(lodLevel);
        
        // Ajustar opacidad según calidad
        if (element.style) {
            element.style.opacity = config.quality;
        }
        
        // Ocultar detalles en LOD bajo
        if (!config.showDetails) {
            const details = element.querySelectorAll('.detail, .glow, .border');
            details.forEach(detail => {
                detail.style.display = 'none';
            });
        }
        
        // Ocultar texto en LOD bajo
        if (!config.showText) {
            const texts = element.querySelectorAll('text');
            texts.forEach(text => {
                text.style.display = 'none';
            });
        }
        
        return element;
    }

    /**
     * Redimensionar sistema de culling
     */
    resize(newWidth, newHeight) {
        this.worldWidth = newWidth;
        this.worldHeight = newHeight;
        this.updateViewport(0, 0, newWidth, newHeight);
        
        console.log(`👁️ CullingSystem redimensionado: ${newWidth}x${newHeight}`);
    }

    /**
     * Obtener estadísticas de culling
     */
    getStats() {
        return {
            ...this.stats,
            viewport: { ...this.viewport },
            config: { ...this.config }
        };
    }

    /**
     * Configurar parámetros de culling
     */
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('👁️ CullingSystem reconfigurado:', newConfig);
    }

    /**
     * Destruir sistema de culling
     */
    destroy() {
        console.log('💥 CullingSystem destruido');
    }
}

export default CullingSystem; 