/**
 * 🏭 PLANET CONFIG FACTORY - Fábrica de Configuración de Planetas
 * Centraliza toda la configuración relacionada con planetas
 * Implementa Factory Pattern para diferentes tipos y tamaños de planetas
 */

export class PlanetConfigFactory {
    static planetSizes = {
        small: {
            radius: 15,
            initialShips: 15,
            maxShips: 60,
            productionRate: 2.5,
            colliderMultiplier: 2.0
        },
        medium: {
            radius: 25,
            initialShips: 25,
            maxShips: 120,
            productionRate: 4.0,
            colliderMultiplier: 1.6
        },
        large: {
            radius: 35,
            initialShips: 40,
            maxShips: 250,
            productionRate: 6.0,
            colliderMultiplier: 1.4
        },
        huge: {
            radius: 45,
            initialShips: 60,
            maxShips: 400,
            productionRate: 8.0,
            colliderMultiplier: 1.3
        }
    };

    static planetTypes = {
        normal: {
            specialBonus: 1.0,
            description: 'Planeta estándar'
        },
        industrial: {
            specialBonus: 1.5,
            description: 'Planeta industrial con producción mejorada'
        },
        fortress: {
            specialBonus: 0.8,
            description: 'Planeta fortaleza con defensa mejorada'
        },
        mining: {
            specialBonus: 1.3,
            description: 'Planeta minero con recursos abundantes'
        }
    };

    static ownerColors = {
        player: '#00ff88',
        ai: '#ff4444',
        neutral: '#888888'
    };

    /**
     * Crear configuración completa para un planeta
     * @param {string} size - Tamaño del planeta
     * @param {string} type - Tipo del planeta
     * @param {string} owner - Propietario del planeta
     * @returns {Object} Configuración completa
     */
    static createPlanetConfig(size = 'medium', type = 'normal', owner = 'neutral') {
        const sizeConfig = this.planetSizes[size] || this.planetSizes.medium;
        const typeConfig = this.planetTypes[type] || this.planetTypes.normal;
        
        return {
            // Configuración de tamaño
            radius: sizeConfig.radius,
            initialShips: sizeConfig.initialShips,
            maxShips: sizeConfig.maxShips,
            baseProductionRate: sizeConfig.productionRate,
            colliderMultiplier: sizeConfig.colliderMultiplier,
            
            // Configuración de tipo
            specialBonus: typeConfig.specialBonus,
            type: type,
            typeDescription: typeConfig.description,
            
            // Configuración de propietario
            owner: owner,
            color: this.ownerColors[owner] || this.ownerColors.neutral,
            
            // Propiedades calculadas
            productionRate: sizeConfig.productionRate * typeConfig.specialBonus,
            colliderRadius: sizeConfig.radius * sizeConfig.colliderMultiplier,
            
            // Metadatos
            size: size,
            createdAt: Date.now()
        };
    }

    /**
     * Obtener configuración de tamaño específico
     * @param {string} size 
     * @returns {Object}
     */
    static getSizeConfig(size) {
        return { ...this.planetSizes[size] } || { ...this.planetSizes.medium };
    }

    /**
     * Obtener configuración de tipo específico
     * @param {string} type 
     * @returns {Object}
     */
    static getTypeConfig(type) {
        return { ...this.planetTypes[type] } || { ...this.planetTypes.normal };
    }

    /**
     * Obtener color para un propietario
     * @param {string} owner 
     * @returns {string}
     */
    static getOwnerColor(owner) {
        return this.ownerColors[owner] || this.ownerColors.neutral;
    }

    /**
     * Obtener todos los tamaños disponibles
     * @returns {string[]}
     */
    static getAvailableSizes() {
        return Object.keys(this.planetSizes);
    }

    /**
     * Obtener todos los tipos disponibles
     * @returns {string[]}
     */
    static getAvailableTypes() {
        return Object.keys(this.planetTypes);
    }

    /**
     * Obtener todos los propietarios disponibles
     * @returns {string[]}
     */
    static getAvailableOwners() {
        return Object.keys(this.ownerColors);
    }

    /**
     * Validar configuración de planeta
     * @param {Object} config 
     * @returns {boolean}
     */
    static validateConfig(config) {
        const requiredFields = ['radius', 'initialShips', 'maxShips', 'productionRate', 'owner'];
        
        for (const field of requiredFields) {
            if (config[field] === undefined || config[field] === null) {
                console.warn(`PlanetConfigFactory: Campo requerido '${field}' faltante`);
                return false;
            }
        }

        // Validar rangos
        if (config.radius <= 0 || config.initialShips < 0 || config.maxShips <= 0 || config.productionRate < 0) {
            console.warn('PlanetConfigFactory: Valores numéricos inválidos');
            return false;
        }

        if (config.initialShips > config.maxShips) {
            console.warn('PlanetConfigFactory: initialShips no puede ser mayor que maxShips');
            return false;
        }

        return true;
    }

    /**
     * Crear configuración aleatoria
     * @returns {Object}
     */
    static createRandomConfig() {
        const sizes = this.getAvailableSizes();
        const types = this.getAvailableTypes();
        const owners = ['player', 'ai', 'neutral'];

        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomOwner = owners[Math.floor(Math.random() * owners.length)];

        return this.createPlanetConfig(randomSize, randomType, randomOwner);
    }

    /**
     * Actualizar configuración de tamaños
     * @param {Object} newSizes 
     */
    static updateSizeConfigs(newSizes) {
        this.planetSizes = { ...this.planetSizes, ...newSizes };
    }

    /**
     * Actualizar configuración de tipos
     * @param {Object} newTypes 
     */
    static updateTypeConfigs(newTypes) {
        this.planetTypes = { ...this.planetTypes, ...newTypes };
    }

    /**
     * Actualizar colores de propietarios
     * @param {Object} newColors 
     */
    static updateOwnerColors(newColors) {
        this.ownerColors = { ...this.ownerColors, ...newColors };
    }

    /**
     * Registrar nuevo tamaño de planeta
     * @param {string} name 
     * @param {Object} config 
     */
    static registerSize(name, config) {
        if (!config.radius || !config.initialShips || !config.maxShips || !config.productionRate) {
            throw new Error('PlanetConfigFactory: Configuración de tamaño incompleta');
        }
        
        this.planetSizes[name] = { ...config };
        console.log(`PlanetConfigFactory: Tamaño '${name}' registrado exitosamente`);
    }

    /**
     * Registrar nuevo tipo de planeta
     * @param {string} name 
     * @param {Object} config 
     */
    static registerType(name, config) {
        if (!config.specialBonus || !config.description) {
            throw new Error('PlanetConfigFactory: Configuración de tipo incompleta');
        }
        
        this.planetTypes[name] = { ...config };
        console.log(`PlanetConfigFactory: Tipo '${name}' registrado exitosamente`);
    }

    /**
     * Obtener estadísticas de configuración
     * @returns {Object}
     */
    static getConfigStats() {
        return {
            totalSizes: Object.keys(this.planetSizes).length,
            totalTypes: Object.keys(this.planetTypes).length,
            totalOwners: Object.keys(this.ownerColors).length,
            averageProductionRate: Object.values(this.planetSizes)
                .reduce((sum, config) => sum + config.productionRate, 0) / Object.keys(this.planetSizes).length,
            sizeRange: {
                minRadius: Math.min(...Object.values(this.planetSizes).map(s => s.radius)),
                maxRadius: Math.max(...Object.values(this.planetSizes).map(s => s.radius))
            }
        };
    }
} 