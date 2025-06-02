/**
 * 🎛️ GALCON GAME - PERCENTAGE SELECTOR
 * Sistema de selección de porcentaje de naves estilo Galcon auténtico
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class PercentageSelector {
    constructor(gameEngine = null) {
        // Referencia al GameEngine para acceder a planetas seleccionados
        this.gameEngine = gameEngine;
        
        // Porcentajes disponibles (estilo Galcon)
        this.percentages = [25, 50, 75, 100];
        this.currentPercentageIndex = 1; // 50% por defecto
        
        // Configuración visual
        this.config = {
            indicatorColor: '#00ff88',
            indicatorSize: 32,
            animationDuration: 200,
            position: { x: 150, y: 100 }
        };
        
        // Elementos visuales
        this.indicator = null;
        this.percentageText = null;
        
        this.init();
        console.log('🎛️ PercentageSelector inicializado');
    }

    /**
     * Inicializar el selector
     */
    init() {
        this.createVisualIndicator();
        this.setupEventListeners();
        this.updateDisplay();
    }

    /**
     * Crear indicador visual en el HUD (DESHABILITADO - usando solo HUD)
     */
    createVisualIndicator() {
        // Ya no creamos el indicador SVG grande, solo usamos el HUD
        console.log('🎛️ Indicador visual deshabilitado - usando solo HUD');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Rueda del ratón para cambiar porcentaje
        document.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        
        // Teclado numérico para porcentajes rápidos
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        // Eventos del juego
        eventBus.on('percentage:change', this.onPercentageChange.bind(this));
        
        console.log('🎛️ Event listeners configurados');
    }

    /**
     * Manejar rueda del ratón (MEJORADO con debug)
     */
    onWheel(event) {
        console.log('🎛️ Evento wheel detectado:', event.deltaY);
        
        // Solo procesar si hay planetas seleccionados
        const hasSelected = this.hasSelectedPlanets();
        console.log('🎛️ ¿Hay planetas seleccionados?', hasSelected);
        
        if (!hasSelected) {
            console.log('🎛️ No hay planetas seleccionados, ignorando wheel');
            return;
        }

        event.preventDefault();
        
        const delta = event.deltaY > 0 ? 1 : -1;
        console.log('🎛️ Cambiando porcentaje con delta:', delta);
        this.changePercentage(delta);
    }

    /**
     * Manejar teclas del teclado (MEJORADO con debug)
     */
    onKeyDown(event) {
        console.log('🎛️ Tecla presionada:', event.key);
        
        // Solo procesar si hay planetas seleccionados
        const hasSelected = this.hasSelectedPlanets();
        console.log('🎛️ ¿Hay planetas seleccionados?', hasSelected);
        
        if (!hasSelected) {
            console.log('🎛️ No hay planetas seleccionados, ignorando tecla');
            return;
        }

        let targetIndex = -1;
        
        switch (event.key) {
            case '1':
                targetIndex = 0; // 25%
                break;
            case '2':
                targetIndex = 1; // 50%
                break;
            case '3':
                targetIndex = 2; // 75%
                break;
            case '4':
                targetIndex = 3; // 100%
                break;
        }

        if (targetIndex !== -1) {
            event.preventDefault();
            console.log(`🎛️ Cambiando a porcentaje índice ${targetIndex} (${this.percentages[targetIndex]}%)`);
            this.setPercentageIndex(targetIndex);
        }
    }

    /**
     * Cambiar porcentaje por delta
     */
    changePercentage(delta) {
        const newIndex = Math.max(0, Math.min(this.percentages.length - 1, 
            this.currentPercentageIndex + delta));
        
        if (newIndex !== this.currentPercentageIndex) {
            this.setPercentageIndex(newIndex);
        }
    }

    /**
     * Establecer porcentaje por índice
     */
    setPercentageIndex(index) {
        if (index < 0 || index >= this.percentages.length) return;
        
        const oldPercentage = this.getCurrentPercentage();
        this.currentPercentageIndex = index;
        const newPercentage = this.getCurrentPercentage();
        
        this.updateDisplay();
        this.animateChange();
        
        // Emitir evento de cambio
        eventBus.emit('percentage:changed', {
            oldPercentage,
            newPercentage,
            index: this.currentPercentageIndex
        });
        
        console.log(`🎛️ Porcentaje cambiado: ${oldPercentage}% → ${newPercentage}%`);
    }

    /**
     * Obtener porcentaje actual
     */
    getCurrentPercentage() {
        return this.percentages[this.currentPercentageIndex];
    }

    /**
     * Obtener factor decimal (0.0 - 1.0)
     */
    getCurrentFactor() {
        return this.getCurrentPercentage() / 100;
    }

    /**
     * Verificar si hay planetas seleccionados (CORREGIDO)
     */
    hasSelectedPlanets() {
        // Método 1: Si tenemos referencia al GameEngine
        if (this.gameEngine) {
            const selectedCount = this.gameEngine.getSelectedPlanetsCount();
            return selectedCount > 0;
        }
        
        // Método 2: Buscar en el DOM si hay planetas seleccionados
        const hudSelected = document.getElementById('hud-selected');
        if (hudSelected) {
            const count = parseInt(hudSelected.textContent) || 0;
            return count > 0;
        }
        
        // Método 3: Fallback - siempre permitir (para testing)
        console.warn('⚠️ No se puede verificar planetas seleccionados, permitiendo cambio de porcentaje');
        return true;
    }

    /**
     * Actualizar display visual (SIMPLIFICADO - solo logs)
     */
    updateDisplay() {
        const percentage = this.getCurrentPercentage();
        console.log(`🎛️ Display actualizado: ${percentage}% - El HUD se actualiza automáticamente`);
    }

    /**
     * Animar cambio de porcentaje
     */
    animateChange() {
        if (!this.indicator) return;
        
        // Efecto de pulso
        this.indicator.style.transform = 'scale(1.2)';
        this.indicator.style.transition = `transform ${this.config.animationDuration}ms ease-out`;
        
        setTimeout(() => {
            this.indicator.style.transform = 'scale(1.0)';
        }, this.config.animationDuration);
    }

    /**
     * Mostrar/ocultar indicador
     */
    setVisible(visible) {
        if (!this.indicator) return;
        
        this.indicator.style.display = visible ? 'block' : 'none';
    }

    /**
     * Event handler para cambios externos
     */
    onPercentageChange(data) {
        if (data.index !== undefined) {
            this.setPercentageIndex(data.index);
        }
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            currentPercentage: this.getCurrentPercentage(),
            currentIndex: this.currentPercentageIndex,
            factor: this.getCurrentFactor(),
            hasSelectedPlanets: this.hasSelectedPlanets()
        };
    }

    /**
     * Destruir el selector
     */
    destroy() {
        // Remover event listeners
        document.removeEventListener('wheel', this.onWheel);
        document.removeEventListener('keydown', this.onKeyDown);
        
        // Remover elementos visuales
        if (this.indicator && this.indicator.parentNode) {
            this.indicator.parentNode.removeChild(this.indicator);
        }
        
        console.log('💥 PercentageSelector destruido');
    }
}

export default PercentageSelector; 