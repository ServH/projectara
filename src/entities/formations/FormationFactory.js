/**
 * 🏭 FORMATION FACTORY - Fábrica de Formaciones
 * Implementa el patrón Factory para crear diferentes estrategias de formación
 * Centraliza la creación y gestión de formaciones disponibles
 */

import { SpreadFormation } from './SpreadFormation.js';
import { LineFormation } from './LineFormation.js';
import { WedgeFormation } from './WedgeFormation.js';
import { CircleFormation } from './CircleFormation.js';

export class FormationFactory {
    static formations = new Map([
        ['spread', SpreadFormation],
        ['line', LineFormation],
        ['wedge', WedgeFormation],
        ['circle', CircleFormation]
    ]);

    /**
     * Crear una formación específica
     * @param {string} formationType - Tipo de formación ('spread', 'line', 'wedge', 'circle')
     * @param {number} spacing - Espaciado entre vehículos
     * @returns {FormationStrategy} Instancia de la formación solicitada
     */
    static createFormation(formationType = 'spread', spacing = 30) {
        const FormationClass = this.formations.get(formationType.toLowerCase());
        
        if (!FormationClass) {
            console.warn(`FormationFactory: Tipo de formación '${formationType}' no encontrado. Usando 'spread' por defecto.`);
            return new SpreadFormation(spacing);
        }
        
        return new FormationClass(spacing);
    }

    /**
     * Obtener lista de formaciones disponibles
     * @returns {string[]} Array con los nombres de las formaciones disponibles
     */
    static getAvailableFormations() {
        return Array.from(this.formations.keys());
    }

    /**
     * Verificar si una formación existe
     * @param {string} formationType 
     * @returns {boolean}
     */
    static isValidFormation(formationType) {
        return this.formations.has(formationType.toLowerCase());
    }

    /**
     * Obtener información de todas las formaciones disponibles
     * @returns {Object[]} Array con información de cada formación
     */
    static getAllFormationsInfo() {
        const formationsInfo = [];
        
        for (const [type, FormationClass] of this.formations) {
            const instance = new FormationClass();
            formationsInfo.push({
                type,
                ...instance.getInfo()
            });
        }
        
        return formationsInfo;
    }

    /**
     * Registrar una nueva formación
     * @param {string} name - Nombre de la formación
     * @param {class} FormationClass - Clase que implementa FormationStrategy
     */
    static registerFormation(name, FormationClass) {
        if (typeof FormationClass !== 'function') {
            throw new Error('FormationFactory: FormationClass debe ser una clase válida');
        }
        
        this.formations.set(name.toLowerCase(), FormationClass);
        console.log(`FormationFactory: Formación '${name}' registrada exitosamente`);
    }

    /**
     * Obtener formación recomendada basada en el tamaño de la flota
     * @param {number} fleetSize 
     * @returns {string} Tipo de formación recomendada
     */
    static getRecommendedFormation(fleetSize) {
        if (fleetSize === 1) {
            return 'spread'; // Para una sola nave, spread es suficiente
        } else if (fleetSize <= 5) {
            return 'line'; // Pocas naves, línea es efectiva
        } else if (fleetSize <= 15) {
            return 'wedge'; // Tamaño medio, cuña para penetración
        } else {
            return 'spread'; // Muchas naves, dispersión para cobertura
        }
    }
} 