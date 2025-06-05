/**
 * 🗺️ FLEET MAPPING MANAGER
 * Gestor especializado para mapeos bidireccionales entre flotas legacy y nuevas
 * Responsabilidad única: Gestionar mapeos y búsquedas de flotas
 */

export class FleetMappingManager {
    constructor() {
        this.fleetMap = new Map(); // Mapeo de IDs legacy → Fleet nuevo
        this.legacyFleetMap = new Map(); // Mapeo Fleet nuevo → datos legacy
        
        console.log('🗺️ FleetMappingManager inicializado');
    }

    /**
     * 🗺️ Registrar mapeo bidireccional
     */
    registerFleetMapping(legacyId, fleet, legacyData) {
        // Mapeo legacy ID → Fleet nuevo
        this.fleetMap.set(legacyId, fleet);
        
        // Mapeo Fleet nuevo → datos legacy
        this.legacyFleetMap.set(fleet, legacyData);
        
        console.log(`🗺️ Mapeo registrado: ${legacyId} ↔ Fleet(${fleet.vehicles.length} naves)`);
    }

    /**
     * 🔍 Obtener Fleet nuevo por ID legacy
     */
    getFleetByLegacyId(legacyId) {
        return this.fleetMap.get(legacyId);
    }

    /**
     * 📊 Obtener datos legacy por Fleet nuevo
     */
    getLegacyDataByFleet(fleet) {
        return this.legacyFleetMap.get(fleet);
    }

    /**
     * 🔍 Verificar si existe mapeo para ID legacy
     */
    hasFleetMapping(legacyId) {
        return this.fleetMap.has(legacyId);
    }

    /**
     * 🔍 Verificar si existe mapeo para Fleet
     */
    hasLegacyMapping(fleet) {
        return this.legacyFleetMap.has(fleet);
    }

    /**
     * 🗑️ Remover mapeo de flota
     */
    removeFleetMapping(legacyId) {
        const fleet = this.fleetMap.get(legacyId);
        
        if (fleet) {
            // Remover ambos mapeos
            this.fleetMap.delete(legacyId);
            this.legacyFleetMap.delete(fleet);
            
            console.log(`🗑️ Mapeo removido: ${legacyId}`);
            return true;
        }
        
        return false;
    }

    /**
     * 🔄 Actualizar datos legacy en mapeo
     */
    updateLegacyData(fleet, newLegacyData) {
        if (this.legacyFleetMap.has(fleet)) {
            this.legacyFleetMap.set(fleet, newLegacyData);
            return true;
        }
        return false;
    }

    /**
     * 📋 Obtener todas las flotas mapeadas
     */
    getAllFleets() {
        return Array.from(this.fleetMap.values());
    }

    /**
     * 📋 Obtener todos los IDs legacy
     */
    getAllLegacyIds() {
        return Array.from(this.fleetMap.keys());
    }

    /**
     * 📋 Obtener todos los datos legacy
     */
    getAllLegacyData() {
        return Array.from(this.legacyFleetMap.values());
    }

    /**
     * 🔍 Buscar flotas por criterio
     */
    findFleetsByCriteria(criteria) {
        const results = [];
        
        this.fleetMap.forEach((fleet, legacyId) => {
            const legacyData = this.legacyFleetMap.get(fleet);
            
            // Verificar criterios
            let matches = true;
            
            if (criteria.owner && fleet.owner !== criteria.owner) {
                matches = false;
            }
            
            if (criteria.isActive !== undefined && fleet.isActive !== criteria.isActive) {
                matches = false;
            }
            
            if (criteria.hasArrived !== undefined && fleet.hasArrived !== criteria.hasArrived) {
                matches = false;
            }
            
            if (criteria.fromPlanet && legacyData.fromPlanet !== criteria.fromPlanet) {
                matches = false;
            }
            
            if (criteria.toPlanet && legacyData.toPlanet !== criteria.toPlanet) {
                matches = false;
            }
            
            if (criteria.minShips && fleet.vehicles.length < criteria.minShips) {
                matches = false;
            }
            
            if (criteria.maxShips && fleet.vehicles.length > criteria.maxShips) {
                matches = false;
            }
            
            if (matches) {
                results.push({
                    legacyId,
                    fleet,
                    legacyData
                });
            }
        });
        
        return results;
    }

    /**
     * 🔍 Buscar flotas activas
     */
    getActiveFleets() {
        return this.findFleetsByCriteria({ isActive: true });
    }

    /**
     * 🔍 Buscar flotas que han llegado
     */
    getArrivedFleets() {
        return this.findFleetsByCriteria({ hasArrived: true });
    }

    /**
     * 🔍 Buscar flotas por propietario
     */
    getFleetsByOwner(owner) {
        return this.findFleetsByCriteria({ owner });
    }

    /**
     * 🔍 Buscar flotas desde planeta específico
     */
    getFleetsFromPlanet(planetId) {
        return this.findFleetsByCriteria({ fromPlanet: planetId });
    }

    /**
     * 🔍 Buscar flotas hacia planeta específico
     */
    getFleetsToPlanet(planetId) {
        return this.findFleetsByCriteria({ toPlanet: planetId });
    }

    /**
     * 🧹 Limpiar mapeos de flotas inactivas
     */
    cleanupInactiveFleets() {
        const fleetsToRemove = [];
        
        this.fleetMap.forEach((fleet, legacyId) => {
            if (!fleet.isActive || (fleet.hasArrived && fleet.frameCounter > 300)) {
                fleetsToRemove.push(legacyId);
            }
        });
        
        fleetsToRemove.forEach(legacyId => {
            this.removeFleetMapping(legacyId);
        });
        
        if (fleetsToRemove.length > 0) {
            console.log(`🧹 ${fleetsToRemove.length} mapeos de flotas inactivas removidos`);
        }
        
        return fleetsToRemove.length;
    }

    /**
     * 📊 Obtener estadísticas de mapeos
     */
    getMappingStats() {
        const allFleets = this.getAllFleets();
        const activeFleets = allFleets.filter(f => f.isActive);
        const arrivedFleets = allFleets.filter(f => f.hasArrived);
        
        // Estadísticas por propietario
        const ownerStats = {};
        allFleets.forEach(fleet => {
            const owner = fleet.owner || 'unknown';
            if (!ownerStats[owner]) {
                ownerStats[owner] = { count: 0, totalShips: 0 };
            }
            ownerStats[owner].count++;
            ownerStats[owner].totalShips += fleet.vehicles.length;
        });
        
        return {
            totalMappings: this.fleetMap.size,
            totalFleets: allFleets.length,
            activeFleets: activeFleets.length,
            arrivedFleets: arrivedFleets.length,
            totalVehicles: allFleets.reduce((sum, f) => sum + f.vehicles.length, 0),
            averageFleetSize: allFleets.length > 0 ? 
                allFleets.reduce((sum, f) => sum + f.vehicles.length, 0) / allFleets.length : 0,
            ownerStats
        };
    }

    /**
     * 🔄 Iterar sobre todos los mapeos
     */
    forEachMapping(callback) {
        this.fleetMap.forEach((fleet, legacyId) => {
            const legacyData = this.legacyFleetMap.get(fleet);
            callback(fleet, legacyId, legacyData);
        });
    }

    /**
     * 🧹 Limpiar todos los mapeos
     */
    clearAllMappings() {
        const count = this.fleetMap.size;
        this.fleetMap.clear();
        this.legacyFleetMap.clear();
        
        console.log(`🧹 ${count} mapeos limpiados`);
        return count;
    }

    /**
     * 🔍 Validar integridad de mapeos
     */
    validateMappingIntegrity() {
        const issues = [];
        
        // Verificar que todos los mapeos sean bidireccionales
        this.fleetMap.forEach((fleet, legacyId) => {
            if (!this.legacyFleetMap.has(fleet)) {
                issues.push(`Mapeo unidireccional detectado: ${legacyId} → Fleet sin mapeo inverso`);
            }
        });
        
        this.legacyFleetMap.forEach((legacyData, fleet) => {
            const legacyId = legacyData.id;
            if (!this.fleetMap.has(legacyId) || this.fleetMap.get(legacyId) !== fleet) {
                issues.push(`Mapeo inverso inconsistente: Fleet → ${legacyId}`);
            }
        });
        
        if (issues.length > 0) {
            console.warn('⚠️ Problemas de integridad en mapeos:', issues);
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * 🗺️ Obtener información de debug
     */
    getDebugInfo() {
        return {
            mappingStats: this.getMappingStats(),
            integrityCheck: this.validateMappingIntegrity(),
            mapSizes: {
                fleetMap: this.fleetMap.size,
                legacyFleetMap: this.legacyFleetMap.size
            }
        };
    }
} 