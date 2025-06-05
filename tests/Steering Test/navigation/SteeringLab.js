/**
 * 🧭 STEERING BEHAVIORS LABORATORY
 * Implementación completa de comportamientos de dirección para navegación sutil
 * Basado en los principios de Craig Reynolds
 * ACTUALIZADO: Incluye flotas, spatial hashing y comportamientos de boids
 */

import { Vector2D } from './Vector2D.js';
import { SteeringVehicle } from './SteeringVehicle.js';
import { Obstacle } from './Obstacle.js';
import { Fleet } from './Fleet.js';
import { SpatialHash } from './SpatialHash.js';

export class SteeringLab {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.isPaused = false;
        
        // Estado del laboratorio
        this.vehicles = []; // Naves individuales
        this.fleets = []; // Flotas de naves
        this.obstacles = []; // Obstáculos (planetas)
        this.dragStart = null;
        this.isDragging = false;
        
        // Spatial hashing para optimización
        this.spatialHash = new SpatialHash(50);
        
        // Modo de operación
        this.operationMode = 'individual'; // 'individual' o 'fleet'
        
        // Configuración de steering behaviors
        this.config = {
            sensors: {
                length: 80,
                width: 15,
                lateralCount: 2,
                lateralAngle: 30 // grados
            },
            forces: {
                maxForce: 200,
                maxSpeed: 120,
                seekWeight: 1.0,
                avoidanceWeight: 2.0,
                smoothing: 0.1
            },
            behavior: {
                arrivalRadius: 25,
                slowingDistance: 60,
                enableArrival: true,
                enableWander: false
            },
            fleet: {
                size: 5,
                formation: 'spread', // 'spread', 'line', 'wedge', 'circle'
                spacing: 15,
                enableBoids: true,
                separationWeight: 1.5,
                alignmentWeight: 1.0,
                cohesionWeight: 0.8
            },
            debug: {
                showSensors: true,
                showForces: true,
                showVelocity: true,
                showTrails: true,
                showObstacleZones: false,
                showSpatialGrid: false,
                showFleetConnections: true,
                showFleetCenter: true
            }
        };
        
        // Métricas de rendimiento
        this.metrics = {
            fps: 60,
            frameTime: 0,
            calculations: 0,
            avgCalculationTime: 0,
            avoidances: 0,
            spatialQueries: 0,
            totalVehicles: 0,
            totalFleets: 0
        };
        
        // Control de tiempo
        this.lastFrameTime = 0;
        this.frameCount = 0;
        
        console.log('🧭 SteeringLab inicializado con soporte para flotas');
    }

    /**
     * 🚀 Inicializar laboratorio
     */
    init() {
        this.setupCanvas();
        this.setupControls();
        this.generateInitialObstacles();
        this.start();
        
        console.log('🧭 Steering Behaviors Lab iniciado con flotas');
    }

    /**
     * 🖼️ Configurar canvas
     */
    setupCanvas() {
        this.canvas = document.getElementById('steeringCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas del laboratorio no encontrado');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.updateCanvasSize();
        
        // Event listeners
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        window.addEventListener('resize', this.updateCanvasSize.bind(this));
        
        console.log('🖼️ Canvas configurado');
    }

    /**
     * 📐 Actualizar tamaño del canvas
     */
    updateCanvasSize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    /**
     * 🎛️ Configurar controles
     */
    setupControls() {
        // Configurar sliders de flotas
        this.setupSlider('fleetSize', 'fleetSizeValue', (value) => {
            this.config.fleet.size = parseInt(value);
            document.getElementById('fleetSizeValue').textContent = value + ' naves';
        });
        
        this.setupSlider('formationSpacing', 'formationSpacingValue', (value) => {
            this.config.fleet.spacing = parseInt(value);
            document.getElementById('formationSpacingValue').textContent = value + 'px';
        });
        
        // Configurar selector de formación
        const formationSelect = document.getElementById('fleetFormation');
        if (formationSelect) {
            formationSelect.addEventListener('change', (e) => {
                this.config.fleet.formation = e.target.value;
                // Actualizar formaciones de flotas existentes
                this.fleets.forEach(fleet => {
                    fleet.setFormation(e.target.value);
                });
            });
        }
        
        // Configurar sliders de boids
        this.setupSlider('separationWeight', 'separationWeightValue', (value) => {
            this.config.fleet.separationWeight = parseFloat(value);
            // Actualizar flotas existentes
            this.fleets.forEach(fleet => {
                fleet.boidSettings.separationWeight = parseFloat(value);
            });
        });
        
        this.setupSlider('alignmentWeight', 'alignmentWeightValue', (value) => {
            this.config.fleet.alignmentWeight = parseFloat(value);
            this.fleets.forEach(fleet => {
                fleet.boidSettings.alignmentWeight = parseFloat(value);
            });
        });
        
        this.setupSlider('cohesionWeight', 'cohesionWeightValue', (value) => {
            this.config.fleet.cohesionWeight = parseFloat(value);
            this.fleets.forEach(fleet => {
                fleet.boidSettings.cohesionWeight = parseFloat(value);
            });
        });
        
        this.setupSlider('separationRadius', 'separationRadiusValue', (value) => {
            const radius = parseInt(value);
            document.getElementById('separationRadiusValue').textContent = radius + 'px';
            this.fleets.forEach(fleet => {
                fleet.boidSettings.separationRadius = radius;
            });
        });
        
        // Configurar sliders de sensores
        this.setupSlider('sensorLength', 'sensorLengthValue', (value) => {
            this.config.sensors.length = parseInt(value);
        });
        
        this.setupSlider('sensorWidth', 'sensorWidthValue', (value) => {
            this.config.sensors.width = parseInt(value);
        });
        
        this.setupSlider('lateralSensors', 'lateralSensorsValue', (value) => {
            this.config.sensors.lateralCount = parseInt(value);
            document.getElementById('lateralSensorsValue').textContent = value + ' sensores';
        });
        
        this.setupSlider('sensorAngle', 'sensorAngleValue', (value) => {
            this.config.sensors.lateralAngle = parseInt(value);
            document.getElementById('sensorAngleValue').textContent = value + '°';
        });
        
        // Configurar sliders de fuerzas
        this.setupSlider('maxForce', 'maxForceValue', (value) => {
            this.config.forces.maxForce = parseInt(value);
        });
        
        this.setupSlider('maxSpeed', 'maxSpeedValue', (value) => {
            this.config.forces.maxSpeed = parseInt(value);
            document.getElementById('maxSpeedValue').textContent = value + ' px/s';
        });
        
        this.setupSlider('seekWeight', 'seekWeightValue', (value) => {
            this.config.forces.seekWeight = parseFloat(value);
        });
        
        this.setupSlider('avoidanceWeight', 'avoidanceWeightValue', (value) => {
            this.config.forces.avoidanceWeight = parseFloat(value);
        });
        
        this.setupSlider('smoothing', 'smoothingValue', (value) => {
            this.config.forces.smoothing = parseFloat(value);
        });
        
        // Configurar sliders de comportamiento
        this.setupSlider('arrivalRadius', 'arrivalRadiusValue', (value) => {
            this.config.behavior.arrivalRadius = parseInt(value);
            document.getElementById('arrivalRadiusValue').textContent = value + 'px';
        });
        
        this.setupSlider('slowingDistance', 'slowingDistanceValue', (value) => {
            this.config.behavior.slowingDistance = parseInt(value);
            document.getElementById('slowingDistanceValue').textContent = value + 'px';
        });
        
        // Configurar checkboxes
        this.setupCheckbox('enableBoids', (checked) => {
            this.config.fleet.enableBoids = checked;
        });
        
        this.setupCheckbox('enableArrival', (checked) => {
            this.config.behavior.enableArrival = checked;
        });
        
        this.setupCheckbox('enableWander', (checked) => {
            this.config.behavior.enableWander = checked;
        });
        
        this.setupCheckbox('showSensors', (checked) => {
            this.config.debug.showSensors = checked;
        });
        
        this.setupCheckbox('showForces', (checked) => {
            this.config.debug.showForces = checked;
        });
        
        this.setupCheckbox('showVelocity', (checked) => {
            this.config.debug.showVelocity = checked;
        });
        
        this.setupCheckbox('showTrails', (checked) => {
            this.config.debug.showTrails = checked;
        });
        
        this.setupCheckbox('showObstacleZones', (checked) => {
            this.config.debug.showObstacleZones = checked;
        });
        
        this.setupCheckbox('showSpatialGrid', (checked) => {
            this.config.debug.showSpatialGrid = checked;
        });
        
        this.setupCheckbox('showFleetConnections', (checked) => {
            this.config.debug.showFleetConnections = checked;
        });
        
        this.setupCheckbox('showFleetCenter', (checked) => {
            this.config.debug.showFleetCenter = checked;
        });
        
        // Configurar botones de acción
        document.getElementById('clearAll').addEventListener('click', () => {
            this.clearAll();
        });
        
        document.getElementById('addRandomObstacles').addEventListener('click', () => {
            this.addRandomObstacles();
        });
        
        document.getElementById('spawnFleet').addEventListener('click', () => {
            this.spawnRandomVehicle();
        });
        
        document.getElementById('startDemo').addEventListener('click', () => {
            // El evento se maneja en el HTML principal
            console.log('🎬 Botón de demo clickeado');
        });
        
        document.getElementById('pauseResume').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('resetToDefaults').addEventListener('click', () => {
            this.resetToDefaults();
        });
        
        document.getElementById('exportConfig').addEventListener('click', () => {
            this.exportConfiguration();
        });
        
        console.log('🎛️ Controles configurados con soporte para flotas');
    }

    /**
     * 🎛️ Configurar slider
     */
    setupSlider(sliderId, valueId, callback) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                if (!valueDisplay.textContent.includes('sensores') && !valueDisplay.textContent.includes('°') && !valueDisplay.textContent.includes('px/s')) {
                    valueDisplay.textContent = value + (valueDisplay.textContent.includes('px') ? 'px' : '');
                }
                callback(value);
            });
        }
    }

    /**
     * ☑️ Configurar checkbox
     */
    setupCheckbox(checkboxId, callback) {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                callback(e.target.checked);
            });
        }
    }

    /**
     * 🎲 Generar obstáculos iniciales
     */
    generateInitialObstacles() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const width = canvasRect.width;
        const height = canvasRect.height;
        
        // Crear algunos obstáculos estratégicamente ubicados
        const obstacleConfigs = [
            { x: width * 0.3, y: height * 0.3, radius: 25 },
            { x: width * 0.7, y: height * 0.4, radius: 30 },
            { x: width * 0.5, y: height * 0.6, radius: 20 },
            { x: width * 0.2, y: height * 0.7, radius: 35 },
            { x: width * 0.8, y: height * 0.2, radius: 28 }
        ];
        
        obstacleConfigs.forEach(config => {
            this.obstacles.push(new Obstacle(
                new Vector2D(config.x, config.y),
                config.radius
            ));
        });
        
        console.log(`🎲 ${this.obstacles.length} obstáculos iniciales generados`);
    }

    /**
     * 🖱️ Manejar mouse down
     */
    onMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (event.shiftKey) {
            // Shift + Click: Crear obstáculo
            this.addObstacle(x, y);
        } else if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd + Click: Cambiar modo
            this.toggleOperationMode();
        } else {
            // Verificar si se clickeó un obstáculo
            const clickedObstacle = this.getObstacleAtPosition(x, y);
            
            if (clickedObstacle) {
                // Remover obstáculo
                this.removeObstacle(clickedObstacle);
            } else {
                // Iniciar drag & drop
                this.startDrag(x, y);
            }
        }
    }

    /**
     * 🖱️ Manejar mouse move
     */
    onMouseMove(event) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.dragEnd = new Vector2D(x, y);
    }

    /**
     * 🖱️ Manejar mouse up
     */
    onMouseUp(event) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.endDrag(x, y);
    }

    /**
     * 🎯 Iniciar drag & drop
     */
    startDrag(x, y) {
        this.isDragging = true;
        this.dragStart = new Vector2D(x, y);
        this.dragEnd = new Vector2D(x, y);
    }

    /**
     * 🎯 Finalizar drag & drop
     */
    endDrag(x, y) {
        const target = new Vector2D(x, y);
        const distance = this.dragStart.distance(target);
        
        if (distance > 20) { // Mínima distancia para crear nave/flota
            if (this.operationMode === 'fleet') {
                this.createFleet(this.dragStart, target);
            } else {
                this.createVehicle(this.dragStart, target);
            }
        }
        
        this.isDragging = false;
        this.dragStart = null;
        this.dragEnd = null;
    }

    /**
     * 🚀 Crear vehículo individual
     */
    createVehicle(start, target) {
        const vehicle = new SteeringVehicle(
            start.copy(),
            target.copy(),
            this.config
        );
        
        this.vehicles.push(vehicle);
        this.spatialHash.insert(vehicle);
        
        console.log(`🚀 Vehículo creado: ${start.toString()} → ${target.toString()}`);
    }

    /**
     * 🚁 Crear flota
     */
    createFleet(start, target) {
        const fleet = new Fleet(
            start.copy(),
            target.copy(),
            this.config,
            this.config.fleet.size
        );
        
        fleet.setFormation(this.config.fleet.formation);
        this.fleets.push(fleet);
        
        // Agregar vehículos de la flota al spatial hash
        fleet.vehicles.forEach(vehicle => {
            this.spatialHash.insert(vehicle);
        });
        
        console.log(`🚁 Flota creada: ${start.toString()} → ${target.toString()} (${fleet.vehicles.length} naves)`);
    }

    /**
     * 🔄 Cambiar modo de operación
     */
    toggleOperationMode() {
        this.operationMode = this.operationMode === 'individual' ? 'fleet' : 'individual';
        console.log(`🔄 Modo cambiado a: ${this.operationMode}`);
        
        // Actualizar UI si existe
        const modeDisplay = document.getElementById('operationMode');
        if (modeDisplay) {
            modeDisplay.textContent = this.operationMode === 'fleet' ? 'FLOTA' : 'INDIVIDUAL';
        }
    }

    /**
     * 🚀 Crear vehículo/flota aleatorio
     */
    spawnRandomVehicle() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const width = canvasRect.width;
        const height = canvasRect.height;
        
        const start = new Vector2D(
            50 + Math.random() * (width - 100),
            50 + Math.random() * (height - 100)
        );
        
        const target = new Vector2D(
            50 + Math.random() * (width - 100),
            50 + Math.random() * (height - 100)
        );
        
        if (this.operationMode === 'fleet') {
            this.createFleet(start, target);
        } else {
            this.createVehicle(start, target);
        }
    }

    /**
     * ➕ Agregar obstáculo
     */
    addObstacle(x, y) {
        const obstacle = new Obstacle(
            new Vector2D(x, y),
            15 + Math.random() * 25
        );
        
        this.obstacles.push(obstacle);
        console.log(`➕ Obstáculo agregado en (${x.toFixed(1)}, ${y.toFixed(1)})`);
    }

    /**
     * ➖ Remover obstáculo
     */
    removeObstacle(obstacle) {
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
            console.log(`➖ Obstáculo removido`);
        }
    }

    /**
     * 🎯 Obtener obstáculo en posición
     */
    getObstacleAtPosition(x, y) {
        const point = new Vector2D(x, y);
        return this.obstacles.find(obstacle => {
            return obstacle.position.distance(point) <= obstacle.radius;
        });
    }

    /**
     * 🎲 Agregar obstáculos aleatorios
     */
    addRandomObstacles() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const width = canvasRect.width;
        const height = canvasRect.height;
        
        for (let i = 0; i < 3; i++) {
            this.addObstacle(
                100 + Math.random() * (width - 200),
                100 + Math.random() * (height - 200)
            );
        }
    }

    /**
     * 🧹 Limpiar todo
     */
    clearAll() {
        this.vehicles = [];
        this.fleets = [];
        this.obstacles = [];
        this.spatialHash.clear();
        this.generateInitialObstacles();
        this.metrics.avoidances = 0;
        this.metrics.spatialQueries = 0;
        console.log('🧹 Laboratorio limpiado');
    }

    /**
     * ⏸️ Toggle pausa
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const button = document.getElementById('pauseResume');
        button.textContent = this.isPaused ? '▶️ Reanudar' : '⏸️ Pausar';
        console.log(this.isPaused ? '⏸️ Pausado' : '▶️ Reanudado');
    }

    /**
     * 🔄 Resetear a valores por defecto
     */
    resetToDefaults() {
        // Resetear sliders a valores por defecto
        document.getElementById('sensorLength').value = 80;
        document.getElementById('sensorWidth').value = 15;
        document.getElementById('lateralSensors').value = 2;
        document.getElementById('sensorAngle').value = 30;
        document.getElementById('maxForce').value = 200;
        document.getElementById('maxSpeed').value = 120;
        document.getElementById('seekWeight').value = 1.0;
        document.getElementById('avoidanceWeight').value = 2.0;
        document.getElementById('smoothing').value = 0.1;
        document.getElementById('arrivalRadius').value = 25;
        document.getElementById('slowingDistance').value = 60;
        
        // Disparar eventos para actualizar configuración
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.dispatchEvent(new Event('input'));
        });
        
        console.log('🔄 Valores reseteados a por defecto');
    }

    /**
     * 💾 Exportar configuración
     */
    exportConfiguration() {
        const config = {
            sensors: this.config.sensors,
            forces: this.config.forces,
            behavior: this.config.behavior,
            fleet: this.config.fleet,
            debug: this.config.debug,
            obstacles: this.obstacles.map(obs => ({
                x: obs.position.x,
                y: obs.position.y,
                radius: obs.radius
            }))
        };
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'steering-behaviors-config.json';
        link.click();
        
        console.log('💾 Configuración exportada');
    }

    /**
     * 🚀 Iniciar loop principal
     */
    start() {
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
        
        console.log('🚀 Loop del laboratorio iniciado');
    }

    /**
     * 🔄 Loop principal del laboratorio
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Actualizar métricas de FPS
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.metrics.fps = Math.round(1 / deltaTime);
        }
        
        if (!this.isPaused) {
            // Actualizar simulación
            this.update(deltaTime);
        }
        
        // Renderizar siempre
        this.render();
        
        // Actualizar UI
        this.updateUI();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 🔄 Actualizar simulación
     */
    update(deltaTime) {
        const startTime = performance.now();
        this.metrics.calculations = 0;
        this.metrics.spatialQueries = 0;
        
        // Limpiar spatial hash
        this.spatialHash.clear();
        
        // Insertar todos los vehículos en spatial hash
        this.vehicles.forEach(vehicle => {
            if (!vehicle.hasArrived) {
                this.spatialHash.insert(vehicle);
            }
        });
        
        this.fleets.forEach(fleet => {
            fleet.vehicles.forEach(vehicle => {
                if (!vehicle.hasArrived) {
                    this.spatialHash.insert(vehicle);
                }
            });
        });
        
        // Actualizar vehículos individuales
        this.vehicles.forEach(vehicle => {
            if (!vehicle.hasArrived) {
                vehicle.update(deltaTime, this.obstacles, this.config);
                this.metrics.calculations++;
                
                // Contar evasiones
                if (vehicle.isAvoiding) {
                    this.metrics.avoidances++;
                }
            }
        });
        
        // Actualizar flotas
        this.fleets.forEach(fleet => {
            if (!fleet.hasArrived) {
                fleet.update(deltaTime, this.obstacles, this.spatialHash);
                this.metrics.calculations += fleet.vehicles.length;
                
                // Contar evasiones de la flota
                fleet.vehicles.forEach(vehicle => {
                    if (vehicle.isAvoiding) {
                        this.metrics.avoidances++;
                    }
                });
            }
        });
        
        // Remover vehículos que han llegado
        this.vehicles = this.vehicles.filter(vehicle => !vehicle.hasArrived);
        
        // Remover flotas que han llegado
        this.fleets = this.fleets.filter(fleet => !fleet.hasArrived);
        
        // Actualizar métricas
        this.metrics.totalVehicles = this.vehicles.length + 
            this.fleets.reduce((sum, fleet) => sum + fleet.vehicles.length, 0);
        this.metrics.totalFleets = this.fleets.length;
        
        // Calcular tiempo promedio de cálculos
        const calcTime = performance.now() - startTime;
        this.metrics.avgCalculationTime = 
            (this.metrics.avgCalculationTime * 0.9) + (calcTime * 0.1);
    }

    /**
     * 🎨 Renderizar laboratorio
     */
    render() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar grid espacial si está habilitado
        if (this.config.debug.showSpatialGrid) {
            this.renderSpatialGrid();
        }
        
        // Renderizar obstáculos
        this.renderObstacles();
        
        // Renderizar vehículos individuales
        this.renderVehicles();
        
        // Renderizar flotas
        this.renderFleets();
        
        // Renderizar drag & drop en progreso
        if (this.isDragging && this.dragStart && this.dragEnd) {
            this.renderDragLine();
        }
        
        // Renderizar indicador de modo
        this.renderModeIndicator();
    }

    /**
     * 🎨 Renderizar grid espacial
     */
    renderSpatialGrid() {
        const canvasRect = this.canvas.getBoundingClientRect();
        this.spatialHash.renderDebug(this.ctx, canvasRect.width, canvasRect.height);
    }

    /**
     * 🎨 Renderizar obstáculos
     */
    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            obstacle.render(this.ctx, this.config.debug);
        });
    }

    /**
     * 🎨 Renderizar vehículos individuales
     */
    renderVehicles() {
        this.vehicles.forEach(vehicle => {
            vehicle.render(this.ctx, this.config.debug);
        });
    }

    /**
     * 🎨 Renderizar flotas
     */
    renderFleets() {
        this.fleets.forEach(fleet => {
            fleet.render(this.ctx, this.config.debug);
        });
    }

    /**
     * 🎨 Renderizar línea de drag & drop
     */
    renderDragLine() {
        this.ctx.save();
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        this.ctx.setLineDash([8, 4]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.dragStart.x, this.dragStart.y);
        this.ctx.lineTo(this.dragEnd.x, this.dragEnd.y);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    /**
     * 🎨 Renderizar indicador de modo
     */
    renderModeIndicator() {
        this.ctx.save();
        
        // Fondo del indicador
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 120, 30);
        
        // Borde
        this.ctx.strokeStyle = this.operationMode === 'fleet' ? '#00ff88' : '#00aaff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, 10, 120, 30);
        
        // Texto
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `MODO: ${this.operationMode.toUpperCase()}`,
            70, 28
        );
        
        this.ctx.restore();
    }

    /**
     * 📊 Actualizar UI
     */
    updateUI() {
        document.getElementById('debugFPS').textContent = this.metrics.fps;
        document.getElementById('debugFleets').textContent = this.metrics.totalVehicles;
        document.getElementById('debugObstacles').textContent = this.obstacles.length;
        document.getElementById('debugCalculations').textContent = this.metrics.calculations;
        document.getElementById('debugAvgTime').textContent = this.metrics.avgCalculationTime.toFixed(1) + 'ms';
        document.getElementById('debugAvoidances').textContent = this.metrics.avoidances;
        
        // Actualizar métricas adicionales si existen
        const spatialQueriesElement = document.getElementById('debugSpatialQueries');
        if (spatialQueriesElement) {
            spatialQueriesElement.textContent = this.metrics.spatialQueries;
        }
        
        const totalFleetsElement = document.getElementById('debugTotalFleets');
        if (totalFleetsElement) {
            totalFleetsElement.textContent = this.metrics.totalFleets;
        }
    }

    /**
     * 🛑 Detener laboratorio
     */
    stop() {
        this.isRunning = false;
        console.log('🛑 Laboratorio detenido');
    }

    /**
     * 💥 Destruir laboratorio
     */
    destroy() {
        this.stop();
        this.vehicles = [];
        this.fleets = [];
        this.obstacles = [];
        console.log('💥 Laboratorio destruido');
    }
} 