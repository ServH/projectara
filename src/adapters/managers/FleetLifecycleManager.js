/**
 * 🔧 FLEET LIFECYCLE MANAGER
 * Gestor especializado para integración con gameEngine y gestión del ciclo de vida
 * Responsabilidad única: Gestionar integración, interceptación y estadísticas
 */

export class FleetLifecycleManager {
    constructor(gameEngine, dataConverter, mappingManager) {
        this.gameEngine = gameEngine;
        this.dataConverter = dataConverter;
        this.mappingManager = mappingManager;
        
        // Referencias originales para restauración
        this.originalMethods = {};
        this.isIntegrated = false;
        
        // Estadísticas de integración
        this.integrationStats = {
            fleetsIntercepted: 0,
            fleetsCreated: 0,
            methodsIntercepted: 0,
            startTime: Date.now()
        };
        
        console.log('🔧 FleetLifecycleManager inicializado');
    }

    /**
     * 🔧 Integrar con gameEngine existente
     */
    integrateWithGameEngine() {
        if (!this.gameEngine) {
            console.warn('⚠️ GameEngine no disponible para integración');
            return false;
        }

        if (this.isIntegrated) {
            console.warn('⚠️ Ya está integrado con GameEngine');
            return false;
        }

        try {
            // Interceptar onFleetLaunched si existe
            this.interceptOnFleetLaunched();
            
            // Interceptar otros métodos relevantes si existen
            this.interceptFleetMethods();
            
            this.isIntegrated = true;
            console.log('🔧 GameEngine integrado exitosamente con steering behaviors');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al integrar con GameEngine:', error);
            return false;
        }
    }

    /**
     * 🔧 Interceptar método onFleetLaunched
     */
    interceptOnFleetLaunched() {
        if (this.gameEngine.onFleetLaunched && typeof this.gameEngine.onFleetLaunched === 'function') {
            // Guardar referencia original
            this.originalMethods.onFleetLaunched = this.gameEngine.onFleetLaunched.bind(this.gameEngine);
            
            // Interceptar método
            this.gameEngine.onFleetLaunched = (data) => {
                try {
                    // Validar datos legacy
                    if (!this.dataConverter.validateLegacyData(data)) {
                        console.warn('⚠️ Datos legacy inválidos, usando método original');
                        return this.originalMethods.onFleetLaunched(data);
                    }
                    
                    // Crear Fleet nuevo en lugar del legacy
                    const newFleet = this.dataConverter.createFleetFromLegacyData(data);
                    
                    // Registrar mapeo
                    this.mappingManager.registerFleetMapping(data.id, newFleet, data);
                    
                    // Agregar a la colección de flotas del gameEngine si existe
                    if (this.gameEngine.fleets) {
                        this.gameEngine.fleets.set(data.id, newFleet);
                    }
                    
                    // Actualizar estadísticas del gameEngine si existe
                    if (this.gameEngine.stats) {
                        this.gameEngine.stats.fleetsCount = this.gameEngine.fleets ? this.gameEngine.fleets.size : 0;
                    }
                    
                    // Actualizar estadísticas de integración
                    this.integrationStats.fleetsIntercepted++;
                    this.integrationStats.fleetsCreated++;
                    
                    console.log(`🔧 Fleet ${data.id} interceptada y convertida a steering behaviors`);
                    
                } catch (error) {
                    console.error('❌ Error al interceptar onFleetLaunched:', error);
                    // Fallback al método original
                    return this.originalMethods.onFleetLaunched(data);
                }
            };
            
            this.integrationStats.methodsIntercepted++;
            console.log('🔧 Método onFleetLaunched interceptado');
        }
    }

    /**
     * 🔧 Interceptar otros métodos de flota relevantes
     */
    interceptFleetMethods() {
        // Interceptar removeFleet si existe
        if (this.gameEngine.removeFleet && typeof this.gameEngine.removeFleet === 'function') {
            this.originalMethods.removeFleet = this.gameEngine.removeFleet.bind(this.gameEngine);
            
            this.gameEngine.removeFleet = (fleetId) => {
                // Remover del mapping manager también
                this.mappingManager.removeFleetMapping(fleetId);
                
                // Llamar método original
                return this.originalMethods.removeFleet(fleetId);
            };
            
            this.integrationStats.methodsIntercepted++;
            console.log('🔧 Método removeFleet interceptado');
        }

        // Interceptar updateFleets si existe
        if (this.gameEngine.updateFleets && typeof this.gameEngine.updateFleets === 'function') {
            this.originalMethods.updateFleets = this.gameEngine.updateFleets.bind(this.gameEngine);
            
            // No interceptamos update por ahora para evitar conflictos
            // El NavigationSystem ya maneja la actualización
            console.log('🔧 Método updateFleets detectado pero no interceptado (manejado por NavigationSystem)');
        }
    }

    /**
     * 🔄 Restaurar gameEngine original
     */
    restoreGameEngine() {
        if (!this.gameEngine || !this.isIntegrated) {
            return false;
        }

        try {
            // Restaurar métodos originales
            Object.keys(this.originalMethods).forEach(methodName => {
                if (this.originalMethods[methodName]) {
                    this.gameEngine[methodName] = this.originalMethods[methodName];
                    console.log(`🔄 Método ${methodName} restaurado`);
                }
            });
            
            // Limpiar referencias
            this.originalMethods = {};
            this.isIntegrated = false;
            
            console.log('🔄 GameEngine restaurado al estado original');
            return true;
            
        } catch (error) {
            console.error('❌ Error al restaurar GameEngine:', error);
            return false;
        }
    }

    /**
     * 📊 Obtener estadísticas del adaptador
     */
    getAdapterStats() {
        const mappingStats = this.mappingManager.getMappingStats();
        
        return {
            ...mappingStats,
            integration: {
                ...this.integrationStats,
                isIntegrated: this.isIntegrated,
                uptime: Date.now() - this.integrationStats.startTime,
                interceptedMethods: Object.keys(this.originalMethods)
            }
        };
    }

    /**
     * 📊 Obtener información detallada de debug
     */
    getDetailedDebugInfo() {
        const allFleets = this.mappingManager.getAllFleets();
        
        // Estadísticas por formación
        const formationStats = {};
        allFleets.forEach(fleet => {
            const formation = fleet.formation || 'unknown';
            if (!formationStats[formation]) {
                formationStats[formation] = { count: 0, totalVehicles: 0 };
            }
            formationStats[formation].count++;
            formationStats[formation].totalVehicles += fleet.vehicles.length;
        });
        
        // Estadísticas de comportamiento
        const behaviorStats = {
            totalVehicles: allFleets.reduce((sum, f) => sum + f.vehicles.length, 0),
            avoidingVehicles: allFleets.reduce((sum, f) => sum + (f.debugInfo?.avoidingVehicles || 0), 0),
            seekingVehicles: allFleets.reduce((sum, f) => sum + (f.debugInfo?.seekingVehicles || 0), 0)
        };
        
        return {
            adapter: this.getAdapterStats(),
            fleets: allFleets.map(fleet => fleet.getStats ? fleet.getStats() : {}),
            formations: formationStats,
            behaviors: behaviorStats,
            gameEngine: {
                hasGameEngine: !!this.gameEngine,
                hasFleets: !!(this.gameEngine && this.gameEngine.fleets),
                hasStats: !!(this.gameEngine && this.gameEngine.stats),
                fleetsCount: this.gameEngine && this.gameEngine.fleets ? this.gameEngine.fleets.size : 0
            }
        };
    }

    /**
     * 🔧 Crear flota desde datos legacy (método público)
     */
    createFleetFromLegacy(legacyFleetData) {
        try {
            // Validar datos
            if (!this.dataConverter.validateLegacyData(legacyFleetData)) {
                throw new Error('Datos legacy inválidos');
            }
            
            // Crear flota
            const newFleet = this.dataConverter.createFleetFromLegacyData(legacyFleetData);
            
            // Registrar mapeo
            this.mappingManager.registerFleetMapping(legacyFleetData.id, newFleet, legacyFleetData);
            
            // Actualizar estadísticas
            this.integrationStats.fleetsCreated++;
            
            return newFleet;
            
        } catch (error) {
            console.error('❌ Error al crear flota desde legacy:', error);
            return null;
        }
    }

    /**
     * 🔍 Verificar estado de integración
     */
    checkIntegrationHealth() {
        const issues = [];
        
        // Verificar gameEngine
        if (!this.gameEngine) {
            issues.push('GameEngine no disponible');
        }
        
        // Verificar integración
        if (!this.isIntegrated) {
            issues.push('No está integrado con GameEngine');
        }
        
        // Verificar métodos interceptados
        if (this.isIntegrated && Object.keys(this.originalMethods).length === 0) {
            issues.push('Integrado pero sin métodos interceptados');
        }
        
        // Verificar gestores
        if (!this.dataConverter) {
            issues.push('DataConverter no disponible');
        }
        
        if (!this.mappingManager) {
            issues.push('MappingManager no disponible');
        }
        
        // Verificar integridad de mapeos
        const mappingIntegrity = this.mappingManager.validateMappingIntegrity();
        if (!mappingIntegrity.isValid) {
            issues.push(...mappingIntegrity.issues);
        }
        
        return {
            isHealthy: issues.length === 0,
            issues,
            lastCheck: Date.now()
        };
    }

    /**
     * 🔄 Reinicializar integración
     */
    reinitializeIntegration() {
        console.log('🔄 Reinicializando integración...');
        
        // Restaurar estado original
        this.restoreGameEngine();
        
        // Reintegrar
        const success = this.integrateWithGameEngine();
        
        if (success) {
            console.log('✅ Integración reinicializada exitosamente');
        } else {
            console.error('❌ Error al reinicializar integración');
        }
        
        return success;
    }

    /**
     * 💥 Destruir el manager
     */
    destroy() {
        // Restaurar gameEngine
        this.restoreGameEngine();
        
        // Limpiar referencias
        this.gameEngine = null;
        this.dataConverter = null;
        this.mappingManager = null;
        this.originalMethods = {};
        this.isIntegrated = false;
        
        console.log('💥 FleetLifecycleManager destruido');
    }
} 