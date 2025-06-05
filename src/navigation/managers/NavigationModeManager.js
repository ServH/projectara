/**
 * 🔄 NAVIGATION MODE MANAGER
 * Gestiona el cambio entre modos de navegación (Steering Behaviors vs Legacy)
 * Parte de la refactorización FASE 4 del NavigationSystem
 */

export class NavigationModeManager {
    constructor(gameEngine, fleetAdapter) {
        this.gameEngine = gameEngine;
        this.fleetAdapter = fleetAdapter;
        
        // Estado del modo de navegación
        this.useSteeringBehaviors = true;
        this.legacyMode = false;
        
        // Configuración de modos
        this.modes = {
            STEERING: 'steering',
            LEGACY: 'legacy'
        };
        
        console.log('🔄 NavigationModeManager inicializado');
    }

    /**
     * 🔄 Cambiar entre modos de navegación
     */
    toggleNavigationMode() {
        this.useSteeringBehaviors = !this.useSteeringBehaviors;
        this.legacyMode = !this.useSteeringBehaviors;
        
        if (this.useSteeringBehaviors) {
            this.fleetAdapter.integrateWithGameEngine();
            console.log('🔄 Cambiado a Steering Behaviors');
        } else {
            this.fleetAdapter.restoreGameEngine();
            console.log('🔄 Cambiado a navegación Legacy');
        }
        
        return this.getCurrentMode();
    }

    /**
     * 🎯 Configurar modo de navegación específico
     */
    setNavigationMode(useSteeringBehaviors) {
        if (this.useSteeringBehaviors === useSteeringBehaviors) {
            return this.getCurrentMode();
        }
        
        return this.toggleNavigationMode();
    }

    /**
     * 📊 Obtener modo actual
     */
    getCurrentMode() {
        return this.useSteeringBehaviors ? this.modes.STEERING : this.modes.LEGACY;
    }

    /**
     * ✅ Verificar si está en modo steering
     */
    isSteeringMode() {
        return this.useSteeringBehaviors;
    }

    /**
     * ✅ Verificar si está en modo legacy
     */
    isLegacyMode() {
        return this.legacyMode;
    }

    /**
     * 📊 Obtener información del modo actual
     */
    getModeInfo() {
        return {
            current: this.getCurrentMode(),
            useSteeringBehaviors: this.useSteeringBehaviors,
            legacyMode: this.legacyMode,
            available: Object.values(this.modes)
        };
    }
} 