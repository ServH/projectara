/**
 * 🚀 FLEET LAUNCH MANAGER - Gestor de Lanzamiento de Flotas
 * Encapsula toda la lógica relacionada con el lanzamiento de flotas desde planetas
 * Responsabilidad única: Gestionar el lanzamiento progresivo de oleadas de naves
 */

import { FormationFactory } from '../formations/FormationFactory.js';
import eventBus, { GAME_EVENTS } from '../../core/EventBus.js';

export class FleetLaunchManager {
    constructor() {
        this.launchQueues = new Map(); // Una cola por planeta
        this.defaultConfig = {
            maxWaveSize: 8,
            launchInterval: 200, // ms entre oleadas
            maxConcurrentFleets: 3,
            maxAngleVariation: Math.PI / 6 // 30 grados
        };
    }

    /**
     * Inicializar cola de lanzamiento para un planeta
     * @param {string} planetId 
     */
    initializeLaunchQueue(planetId) {
        if (!this.launchQueues.has(planetId)) {
            this.launchQueues.set(planetId, {
                pendingWaves: [],
                isLaunching: false,
                lastLaunchTime: 0,
                currentNearbyFleets: 0,
                config: { ...this.defaultConfig }
            });
        }
    }

    /**
     * Enviar flota desde un planeta
     * @param {Object} planet - Planeta origen
     * @param {Object} targetPlanet - Planeta destino
     * @param {number} percentage - Porcentaje de naves a enviar
     * @returns {Object|null} Datos de la primera flota lanzada
     */
    sendFleet(planet, targetPlanet, percentage = 0.5) {
        this.initializeLaunchQueue(planet.id);

        const totalShipsToSend = Math.floor(planet.ships * percentage);
        if (totalShipsToSend <= 0) {
            return null;
        }

        // Reducir naves del planeta inmediatamente
        planet.ships -= totalShipsToSend;

        // Calcular oleadas
        const waves = this.calculateWaves(totalShipsToSend);
        
        console.log(`🌊 Preparando ${totalShipsToSend} naves en ${waves.length} oleadas para lanzamiento progresivo: [${waves.join(', ')}]`);

        // Agregar oleadas a la cola
        const queue = this.launchQueues.get(planet.id);
        waves.forEach((waveSize, waveIndex) => {
            const fleetData = this.createWaveFleetData(
                planet,
                targetPlanet, 
                waveSize, 
                waveIndex, 
                waves.length,
                totalShipsToSend
            );
            
            queue.pendingWaves.push({
                waveIndex: waveIndex,
                totalWaves: waves.length,
                totalShipsInSwarm: totalShipsToSend,
                fleetData: fleetData
            });
        });

        // Iniciar procesamiento de cola si no está activo
        if (!queue.isLaunching) {
            this.startLaunchSequence(planet.id);
        }

        // Retornar datos del primer lanzamiento para compatibilidad
        return this.createWaveFleetData(
            planet,
            targetPlanet, 
            waves[0], 
            0, 
            waves.length,
            totalShipsToSend
        );
    }

    /**
     * Calcular oleadas de naves
     * @param {number} totalShips 
     * @returns {Array} Array con el tamaño de cada oleada
     */
    calculateWaves(totalShips) {
        const waves = [];
        const maxWaveSize = this.defaultConfig.maxWaveSize;
        
        for (let i = 0; i < totalShips; i += maxWaveSize) {
            const waveSize = Math.min(maxWaveSize, totalShips - i);
            waves.push(waveSize);
        }
        
        return waves;
    }

    /**
     * Iniciar secuencia de lanzamiento
     * @param {string} planetId 
     */
    startLaunchSequence(planetId) {
        const queue = this.launchQueues.get(planetId);
        if (!queue || queue.pendingWaves.length === 0) return;

        queue.isLaunching = true;
        
        // Lanzar la primera oleada inmediatamente
        const firstWave = queue.pendingWaves.shift();
        this.launchWaveNow(firstWave);
        queue.lastLaunchTime = Date.now();
        queue.currentNearbyFleets++;
    }

    /**
     * Procesar cola de lanzamiento de un planeta
     * @param {string} planetId 
     */
    processLaunchQueue(planetId) {
        const queue = this.launchQueues.get(planetId);
        if (!queue || !queue.isLaunching) return;

        const now = Date.now();
        const timeSinceLastLaunch = now - queue.lastLaunchTime;

        // Verificar si es tiempo de lanzar la siguiente oleada
        if (timeSinceLastLaunch >= queue.config.launchInterval && 
            queue.pendingWaves.length > 0 && 
            queue.currentNearbyFleets < queue.config.maxConcurrentFleets) {
            
            const nextWave = queue.pendingWaves.shift();
            this.launchWaveNow(nextWave);
            queue.lastLaunchTime = now;
            queue.currentNearbyFleets++;
        }

        // Si no hay más oleadas, detener el lanzamiento
        if (queue.pendingWaves.length === 0) {
            queue.isLaunching = false;
        }
    }

    /**
     * Lanzar una oleada inmediatamente
     * @param {Object} waveData 
     */
    launchWaveNow(waveData) {
        console.log(`🚀 Lanzando oleada ${waveData.waveIndex + 1}/${waveData.totalWaves}: ${waveData.fleetData.ships} naves`);
        
        // Emitir evento para crear la flota real en el sistema de navegación
        eventBus.emit(GAME_EVENTS.FLEET_LAUNCHED, waveData.fleetData);
        
        return waveData.fleetData;
    }

    /**
     * Notificar que una flota ha partido (para gestión de concurrencia)
     * @param {string} planetId 
     */
    notifyFleetDeparted(planetId) {
        const queue = this.launchQueues.get(planetId);
        if (queue && queue.currentNearbyFleets > 0) {
            queue.currentNearbyFleets--;
        }
    }

    /**
     * Crear datos de flota para una oleada específica
     * @param {Object} planet 
     * @param {Object} targetPlanet 
     * @param {number} waveSize 
     * @param {number} waveIndex 
     * @param {number} totalWaves 
     * @param {number} totalShips 
     * @returns {Object}
     */
    createWaveFleetData(planet, targetPlanet, waveSize, waveIndex, totalWaves, totalShips) {
        const launchPosition = this.calculateLaunchPosition(planet, targetPlanet);
        
        return {
            id: `fleet_${Date.now()}_${waveIndex}_${Math.random().toString(36).substr(2, 9)}`,
            ships: waveSize,
            owner: planet.owner,
            fromPlanet: planet.id,
            toPlanet: targetPlanet.id,
            targetPlanet: targetPlanet,
            
            // Posiciones de lanzamiento
            startX: launchPosition.x,
            startY: launchPosition.y,
            x: launchPosition.x,
            y: launchPosition.y,
            targetX: targetPlanet.x,
            targetY: targetPlanet.y,
            
            // Metadatos de enjambre
            waveIndex: waveIndex,
            totalWaves: totalWaves,
            totalShipsInSwarm: totalShips,
            isSwarmFleet: true,
            
            // Configuración de steering behaviors
            useSteeringBehaviors: true,
            formation: this.selectFormationForWave(waveIndex, totalWaves),
            
            launchTime: Date.now()
        };
    }

    /**
     * Calcular posición de lanzamiento inteligente
     * @param {Object} planet 
     * @param {Object} targetPlanet 
     * @returns {Object} Posición {x, y}
     */
    calculateLaunchPosition(planet, targetPlanet) {
        // Calcular dirección hacia el planeta destino
        const directionToTarget = {
            x: targetPlanet.x - planet.x,
            y: targetPlanet.y - planet.y
        };
        
        const distanceToTarget = Math.sqrt(
            directionToTarget.x * directionToTarget.x + 
            directionToTarget.y * directionToTarget.y
        );
        
        // Normalizar dirección
        const normalizedDirection = {
            x: directionToTarget.x / distanceToTarget,
            y: directionToTarget.y / distanceToTarget
        };
        
        // Posición de salida en el borde del planeta hacia el destino
        const launchDistance = planet.radius + 8; // Justo fuera del borde del planeta
        const baseAngle = Math.atan2(normalizedDirection.y, normalizedDirection.x);
        
        // Variación angular para dispersión de oleada
        const angleVariation = (Math.random() - 0.5) * this.defaultConfig.maxAngleVariation;
        const finalAngle = baseAngle + angleVariation;
        
        // Calcular posición final de lanzamiento
        return {
            x: planet.x + Math.cos(finalAngle) * launchDistance,
            y: planet.y + Math.sin(finalAngle) * launchDistance
        };
    }

    /**
     * Seleccionar formación para oleada específica
     * @param {number} waveIndex 
     * @param {number} totalWaves 
     * @returns {string}
     */
    selectFormationForWave(waveIndex, totalWaves) {
        // Usar FormationFactory para obtener formación recomendada
        if (totalWaves > 1) {
            // Primera oleada: spread (más común)
            if (waveIndex === 0) return 'spread';
            
            // Oleadas intermedias: alternar
            const formations = FormationFactory.getAvailableFormations();
            return formations[waveIndex % formations.length];
        }
        
        // Oleada única: usar recomendación del factory
        return FormationFactory.getRecommendedFormation(8); // Tamaño típico de oleada
    }

    /**
     * Obtener estado de la cola de lanzamiento
     * @param {string} planetId 
     * @returns {Object}
     */
    getLaunchQueueStatus(planetId) {
        const queue = this.launchQueues.get(planetId);
        if (!queue) {
            return { exists: false };
        }

        return {
            exists: true,
            isLaunching: queue.isLaunching,
            pendingWaves: queue.pendingWaves.length,
            currentNearbyFleets: queue.currentNearbyFleets,
            lastLaunchTime: queue.lastLaunchTime,
            nextLaunchIn: queue.isLaunching && queue.pendingWaves.length > 0 ? 
                Math.max(0, queue.config.launchInterval - (Date.now() - queue.lastLaunchTime)) : 0
        };
    }

    /**
     * Limpiar cola de lanzamiento de un planeta
     * @param {string} planetId 
     */
    clearLaunchQueue(planetId) {
        if (this.launchQueues.has(planetId)) {
            this.launchQueues.delete(planetId);
        }
    }

    /**
     * Actualizar configuración de lanzamiento
     * @param {Object} newConfig 
     */
    updateConfig(newConfig) {
        this.defaultConfig = { ...this.defaultConfig, ...newConfig };
    }
} 