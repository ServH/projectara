/**
 * 🎨 FLEET REDIRECTION VISUALIZATION MANAGER
 * Gestor especializado para renderizado visual y efectos de redirección
 * Responsabilidad única: Manejar indicadores visuales, animaciones y feedback
 */

export class FleetRedirectionVisualizationManager {
    constructor(gameEngine, config) {
        this.gameEngine = gameEngine;
        this.config = config;
        
        // Elementos de visualización
        this.selectionIndicators = new Map();
        this.redirectionEffects = new Map();
        this.animationFrames = new Map();
        
        // Configuración visual
        this.visualConfig = {
            selectionColor: config.selectionColor || '#00ff00',
            selectionOpacity: config.selectionOpacity || 0.7,
            selectionPulseSpeed: config.selectionPulseSpeed || 2000,
            redirectionTrailColor: config.redirectionTrailColor || '#ffff00',
            redirectionTrailWidth: config.redirectionTrailWidth || 3,
            redirectionTrailDuration: config.redirectionTrailDuration || 1500,
            feedbackAnimationDuration: config.feedbackAnimationDuration || 800,
            glowIntensity: config.glowIntensity || 0.8
        };
        
        // Callbacks configurables
        this.callbacks = {
            onIndicatorCreated: null,
            onIndicatorRemoved: null,
            onEffectCompleted: null,
            onAnimationFrame: null
        };
        
        console.log('🎨 FleetRedirectionVisualizationManager inicializado');
    }

    /**
     * 🎨 Configurar callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * ✨ Mostrar indicador de selección para flota
     */
    showSelectionIndicator(fleetId, fleet) {
        if (this.selectionIndicators.has(fleetId)) {
            this.removeSelectionIndicator(fleetId);
        }

        const indicator = this.createSelectionIndicator(fleet);
        this.selectionIndicators.set(fleetId, indicator);
        
        // Iniciar animación de pulso
        this.startPulseAnimation(fleetId, indicator);
        
        if (this.callbacks.onIndicatorCreated) {
            this.callbacks.onIndicatorCreated(fleetId, indicator);
        }
        
        console.log(`✨ Indicador de selección creado para flota ${fleetId}`);
        return indicator;
    }

    /**
     * 🎯 Crear elemento visual de indicador
     */
    createSelectionIndicator(fleet) {
        const svg = document.querySelector('#game-svg');
        if (!svg) return null;

        // Crear grupo para el indicador
        const indicatorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        indicatorGroup.classList.add('fleet-selection-indicator');
        
        // Círculo principal de selección
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', fleet.x);
        circle.setAttribute('cy', fleet.y);
        circle.setAttribute('r', this.config.fleetRadius * 1.5);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', this.visualConfig.selectionColor);
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('opacity', this.visualConfig.selectionOpacity);
        
        // Círculo de glow exterior
        const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glowCircle.setAttribute('cx', fleet.x);
        glowCircle.setAttribute('cy', fleet.y);
        glowCircle.setAttribute('r', this.config.fleetRadius * 2);
        glowCircle.setAttribute('fill', 'none');
        glowCircle.setAttribute('stroke', this.visualConfig.selectionColor);
        glowCircle.setAttribute('stroke-width', '1');
        glowCircle.setAttribute('opacity', this.visualConfig.glowIntensity * 0.3);
        glowCircle.classList.add('glow-circle');
        
        indicatorGroup.appendChild(glowCircle);
        indicatorGroup.appendChild(circle);
        svg.appendChild(indicatorGroup);
        
        return {
            group: indicatorGroup,
            circle: circle,
            glowCircle: glowCircle,
            fleetId: fleet.id
        };
    }

    /**
     * 💫 Iniciar animación de pulso
     */
    startPulseAnimation(fleetId, indicator) {
        if (!indicator || !indicator.circle) return;
        
        const startTime = Date.now();
        const duration = this.visualConfig.selectionPulseSpeed;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % duration) / duration;
            
            // Calcular opacidad pulsante
            const opacity = this.visualConfig.selectionOpacity * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2));
            
            if (indicator.circle) {
                indicator.circle.setAttribute('opacity', opacity);
            }
            
            if (indicator.glowCircle) {
                const glowOpacity = this.visualConfig.glowIntensity * 0.3 * (0.3 + 0.7 * Math.sin(progress * Math.PI * 2));
                indicator.glowCircle.setAttribute('opacity', glowOpacity);
            }
            
            if (this.callbacks.onAnimationFrame) {
                this.callbacks.onAnimationFrame(fleetId, progress);
            }
            
            // Continuar animación si el indicador aún existe
            if (this.selectionIndicators.has(fleetId)) {
                this.animationFrames.set(fleetId, requestAnimationFrame(animate));
            }
        };
        
        this.animationFrames.set(fleetId, requestAnimationFrame(animate));
    }

    /**
     * 🗑️ Remover indicador de selección
     */
    removeSelectionIndicator(fleetId) {
        const indicator = this.selectionIndicators.get(fleetId);
        if (!indicator) return;
        
        // Cancelar animación
        const animationFrame = this.animationFrames.get(fleetId);
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            this.animationFrames.delete(fleetId);
        }
        
        // Remover elemento del DOM
        if (indicator.group && indicator.group.parentNode) {
            indicator.group.parentNode.removeChild(indicator.group);
        }
        
        this.selectionIndicators.delete(fleetId);
        
        if (this.callbacks.onIndicatorRemoved) {
            this.callbacks.onIndicatorRemoved(fleetId);
        }
        
        console.log(`🗑️ Indicador de selección removido para flota ${fleetId}`);
    }

    /**
     * 🌟 Mostrar efecto de redirección
     */
    showRedirectionEffect(fleetId, fromPosition, toPosition) {
        const effectId = `${fleetId}_${Date.now()}`;
        
        const effect = this.createRedirectionTrail(fromPosition, toPosition);
        this.redirectionEffects.set(effectId, effect);
        
        // Animar el efecto
        this.animateRedirectionTrail(effectId, effect);
        
        console.log(`🌟 Efecto de redirección creado: ${effectId}`);
        return effectId;
    }

    /**
     * 🎯 Crear trail visual de redirección
     */
    createRedirectionTrail(fromPos, toPos) {
        const svg = document.querySelector('#game-svg');
        if (!svg) return null;

        // Crear grupo para el efecto
        const effectGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        effectGroup.classList.add('redirection-effect');
        
        // Línea principal del trail
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromPos.x);
        line.setAttribute('y1', fromPos.y);
        line.setAttribute('x2', toPos.x);
        line.setAttribute('y2', toPos.y);
        line.setAttribute('stroke', this.visualConfig.redirectionTrailColor);
        line.setAttribute('stroke-width', this.visualConfig.redirectionTrailWidth);
        line.setAttribute('opacity', '0');
        line.setAttribute('stroke-dasharray', '10,5');
        
        // Círculo en el punto de destino
        const targetCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        targetCircle.setAttribute('cx', toPos.x);
        targetCircle.setAttribute('cy', toPos.y);
        targetCircle.setAttribute('r', '8');
        targetCircle.setAttribute('fill', 'none');
        targetCircle.setAttribute('stroke', this.visualConfig.redirectionTrailColor);
        targetCircle.setAttribute('stroke-width', '2');
        targetCircle.setAttribute('opacity', '0');
        
        effectGroup.appendChild(line);
        effectGroup.appendChild(targetCircle);
        svg.appendChild(effectGroup);
        
        return {
            group: effectGroup,
            line: line,
            targetCircle: targetCircle,
            fromPos: fromPos,
            toPos: toPos
        };
    }

    /**
     * 🎬 Animar trail de redirección
     */
    animateRedirectionTrail(effectId, effect) {
        if (!effect || !effect.line) return;
        
        const startTime = Date.now();
        const duration = this.visualConfig.redirectionTrailDuration;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 0.3) {
                // Fase 1: Aparecer línea
                const fadeProgress = progress / 0.3;
                effect.line.setAttribute('opacity', fadeProgress * 0.8);
                effect.targetCircle.setAttribute('opacity', fadeProgress * 0.6);
            } else if (progress < 0.7) {
                // Fase 2: Línea completamente visible
                effect.line.setAttribute('opacity', '0.8');
                effect.targetCircle.setAttribute('opacity', '0.6');
                
                // Animar dash offset para efecto de movimiento
                const dashOffset = (progress - 0.3) * 100;
                effect.line.setAttribute('stroke-dashoffset', -dashOffset);
            } else {
                // Fase 3: Desvanecer
                const fadeProgress = 1 - ((progress - 0.7) / 0.3);
                effect.line.setAttribute('opacity', fadeProgress * 0.8);
                effect.targetCircle.setAttribute('opacity', fadeProgress * 0.6);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Efecto completado
                this.removeRedirectionEffect(effectId);
                
                if (this.callbacks.onEffectCompleted) {
                    this.callbacks.onEffectCompleted(effectId);
                }
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * 🗑️ Remover efecto de redirección
     */
    removeRedirectionEffect(effectId) {
        const effect = this.redirectionEffects.get(effectId);
        if (!effect) return;
        
        if (effect.group && effect.group.parentNode) {
            effect.group.parentNode.removeChild(effect.group);
        }
        
        this.redirectionEffects.delete(effectId);
        console.log(`🗑️ Efecto de redirección removido: ${effectId}`);
    }

    /**
     * 🎊 Mostrar feedback de redirección exitosa
     */
    showSuccessFeedback(position) {
        const svg = document.querySelector('#game-svg');
        if (!svg) return;

        // Crear efecto de éxito
        const successGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        successGroup.classList.add('success-feedback');
        
        // Círculo que se expande
        const expandingCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        expandingCircle.setAttribute('cx', position.x);
        expandingCircle.setAttribute('cy', position.y);
        expandingCircle.setAttribute('r', '5');
        expandingCircle.setAttribute('fill', 'none');
        expandingCircle.setAttribute('stroke', '#00ff00');
        expandingCircle.setAttribute('stroke-width', '3');
        expandingCircle.setAttribute('opacity', '1');
        
        successGroup.appendChild(expandingCircle);
        svg.appendChild(successGroup);
        
        // Animar expansión y desvanecimiento
        const startTime = Date.now();
        const duration = this.visualConfig.feedbackAnimationDuration;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const radius = 5 + (progress * 20);
            const opacity = 1 - progress;
            
            expandingCircle.setAttribute('r', radius);
            expandingCircle.setAttribute('opacity', opacity);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (successGroup.parentNode) {
                    successGroup.parentNode.removeChild(successGroup);
                }
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * ❌ Mostrar feedback de redirección fallida
     */
    showErrorFeedback(position, message = '') {
        const svg = document.querySelector('#game-svg');
        if (!svg) return;

        // Crear efecto de error
        const errorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        errorGroup.classList.add('error-feedback');
        
        // X roja
        const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('x1', position.x - 8);
        line1.setAttribute('y1', position.y - 8);
        line1.setAttribute('x2', position.x + 8);
        line1.setAttribute('y2', position.y + 8);
        line1.setAttribute('stroke', '#ff0000');
        line1.setAttribute('stroke-width', '3');
        line1.setAttribute('opacity', '1');
        
        const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('x1', position.x + 8);
        line2.setAttribute('y1', position.y - 8);
        line2.setAttribute('x2', position.x - 8);
        line2.setAttribute('y2', position.y + 8);
        line2.setAttribute('stroke', '#ff0000');
        line2.setAttribute('stroke-width', '3');
        line2.setAttribute('opacity', '1');
        
        errorGroup.appendChild(line1);
        errorGroup.appendChild(line2);
        svg.appendChild(errorGroup);
        
        // Animar desvanecimiento
        const startTime = Date.now();
        const duration = this.visualConfig.feedbackAnimationDuration;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const opacity = 1 - progress;
            line1.setAttribute('opacity', opacity);
            line2.setAttribute('opacity', opacity);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (errorGroup.parentNode) {
                    errorGroup.parentNode.removeChild(errorGroup);
                }
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * 🧹 Limpiar todos los indicadores
     */
    clearAllIndicators() {
        // Remover todos los indicadores de selección
        for (const fleetId of this.selectionIndicators.keys()) {
            this.removeSelectionIndicator(fleetId);
        }
        
        // Remover todos los efectos de redirección
        for (const effectId of this.redirectionEffects.keys()) {
            this.removeRedirectionEffect(effectId);
        }
        
        console.log('🧹 Todos los indicadores visuales limpiados');
    }

    /**
     * 🎨 Actualizar posición de indicador
     */
    updateIndicatorPosition(fleetId, newPosition) {
        const indicator = this.selectionIndicators.get(fleetId);
        if (!indicator) return;
        
        if (indicator.circle) {
            indicator.circle.setAttribute('cx', newPosition.x);
            indicator.circle.setAttribute('cy', newPosition.y);
        }
        
        if (indicator.glowCircle) {
            indicator.glowCircle.setAttribute('cx', newPosition.x);
            indicator.glowCircle.setAttribute('cy', newPosition.y);
        }
    }

    /**
     * 🎛️ Actualizar configuración visual
     */
    updateVisualConfig(newConfig) {
        this.visualConfig = { ...this.visualConfig, ...newConfig };
        console.log('🎛️ Configuración visual actualizada');
    }

    /**
     * 📊 Obtener estadísticas de visualización
     */
    getVisualizationStats() {
        return {
            activeIndicators: this.selectionIndicators.size,
            activeEffects: this.redirectionEffects.size,
            activeAnimations: this.animationFrames.size,
            visualConfig: { ...this.visualConfig }
        };
    }

    /**
     * 🐛 Obtener información de debug
     */
    getDebugInfo() {
        return {
            selectionIndicators: Array.from(this.selectionIndicators.keys()),
            redirectionEffects: Array.from(this.redirectionEffects.keys()),
            animationFrames: Array.from(this.animationFrames.keys()),
            visualConfig: this.visualConfig,
            stats: this.getVisualizationStats()
        };
    }

    /**
     * 💥 Destruir gestor
     */
    destroy() {
        // Limpiar todos los elementos visuales
        this.clearAllIndicators();
        
        // Cancelar todas las animaciones
        for (const animationFrame of this.animationFrames.values()) {
            cancelAnimationFrame(animationFrame);
        }
        
        this.selectionIndicators.clear();
        this.redirectionEffects.clear();
        this.animationFrames.clear();
        
        console.log('💥 FleetRedirectionVisualizationManager destruido');
    }
}
