/**
 * 🧪 LABORATORIO DE PATHFINDING
 * Entorno de pruebas para optimizar algoritmos de navegación
 * MILESTONE 2.3: Desarrollo y testing de pathfinding avanzado
 */

export class PathfindingLab {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        
        // Estado del laboratorio
        this.obstacles = []; // Planetas obstáculo
        this.fleets = []; // Naves en movimiento
        this.startPoint = null; // Punto de inicio para drag & drop
        this.targetPoint = null; // Punto objetivo
        
        // Configuración de pathfinding
        this.config = {
            detection: {
                radius: 50,
                avoidanceDistance: 80,
                routeBuffer: 15,
                enabled: true
            },
            algorithm: 'simple', // 'simple', 'astar', 'flow'
            visualization: {
                showTrajectories: true,
                showObstacleZones: true,
                showAvoidancePoints: false,
                showPerformanceMetrics: true
            }
        };
        
        // Métricas de rendimiento
        this.metrics = {
            fps: 60,
            frameTime: 0,
            calculationsPerFrame: 0,
            averageCalculationTime: 0,
            totalCalculations: 0
        };
        
        // Estado de interacción
        this.isDragging = false;
        this.dragStart = null;
        
        console.log('🧪 PathfindingLab inicializado');
    }

    /**
     * 🚀 Inicializar laboratorio
     */
    init() {
        this.setupCanvas();
        this.setupControls();
        this.generateInitialObstacles();
        this.start();
        
        console.log('🧪 Laboratorio de Pathfinding iniciado');
    }

    /**
     * 🖼️ Configurar canvas
     */
    setupCanvas() {
        this.canvas = document.getElementById('labCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas del laboratorio no encontrado');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Configurar tamaño
        this.updateCanvasSize();
        
        // Event listeners
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        window.addEventListener('resize', this.updateCanvasSize.bind(this));
        
        console.log('🖼️ Canvas del laboratorio configurado');
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
        // Sliders de detección
        this.setupSlider('detectionRadius', 'detectionRadiusValue', (value) => {
            this.config.detection.radius = parseInt(value);
        });
        
        this.setupSlider('avoidanceDistance', 'avoidanceDistanceValue', (value) => {
            this.config.detection.avoidanceDistance = parseInt(value);
        });
        
        this.setupSlider('routeBuffer', 'routeBufferValue', (value) => {
            this.config.detection.routeBuffer = parseInt(value);
        });
        
        // Checkboxes
        this.setupCheckbox('enableDetection', (checked) => {
            this.config.detection.enabled = checked;
        });
        
        this.setupCheckbox('showTrajectories', (checked) => {
            this.config.visualization.showTrajectories = checked;
        });
        
        this.setupCheckbox('showObstacleZones', (checked) => {
            this.config.visualization.showObstacleZones = checked;
        });
        
        this.setupCheckbox('showAvoidancePoints', (checked) => {
            this.config.visualization.showAvoidancePoints = checked;
        });
        
        // Radio buttons para algoritmos
        document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.config.algorithm = e.target.value;
                    console.log(`🧭 Algoritmo cambiado a: ${this.config.algorithm}`);
                }
            });
        });
        
        // Botones de acción
        document.getElementById('clearAll').addEventListener('click', () => {
            this.clearAll();
        });
        
        document.getElementById('addRandomObstacles').addEventListener('click', () => {
            this.addRandomObstacles();
        });
        
        document.getElementById('runBenchmark').addEventListener('click', () => {
            this.runBenchmark();
        });
        
        document.getElementById('exportConfig').addEventListener('click', () => {
            this.exportConfiguration();
        });
        
        console.log('🎛️ Controles del laboratorio configurados');
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
                valueDisplay.textContent = value + 'px';
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
        
        // Crear algunos obstáculos de ejemplo
        for (let i = 0; i < 5; i++) {
            this.obstacles.push({
                id: `obstacle_${i}`,
                x: 100 + Math.random() * (width - 200),
                y: 100 + Math.random() * (height - 200),
                radius: 20 + Math.random() * 30,
                color: '#ff6666'
            });
        }
        
        console.log(`🎲 ${this.obstacles.length} obstáculos iniciales generados`);
    }

    /**
     * 🖱️ Manejar mouse down
     */
    onMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Verificar si se clickeó un obstáculo
        const clickedObstacle = this.getObstacleAtPosition(x, y);
        
        if (event.shiftKey) {
            // Shift + Click: Crear nuevo obstáculo
            this.addObstacle(x, y);
        } else if (clickedObstacle) {
            // Click en obstáculo: Remover
            this.removeObstacle(clickedObstacle.id);
        } else {
            // Click normal: Iniciar drag & drop
            this.startDrag(x, y);
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
        
        this.targetPoint = { x, y };
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
        this.dragStart = { x, y };
        this.targetPoint = { x, y };
        
        console.log(`🎯 Drag iniciado en (${x.toFixed(1)}, ${y.toFixed(1)})`);
    }

    /**
     * 🎯 Finalizar drag & drop
     */
    endDrag(x, y) {
        if (!this.dragStart) return;
        
        // Crear nueva nave
        this.createFleet(this.dragStart.x, this.dragStart.y, x, y);
        
        // Reset estado
        this.isDragging = false;
        this.dragStart = null;
        this.targetPoint = null;
        
        console.log(`🎯 Drag finalizado en (${x.toFixed(1)}, ${y.toFixed(1)})`);
    }

    /**
     * 🚀 Crear nueva nave
     */
    createFleet(startX, startY, targetX, targetY) {
        const fleet = {
            id: `fleet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x: startX,
            y: startY,
            startX: startX,
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            speed: 100, // pixels por segundo
            color: '#00ff88',
            trail: [],
            path: [], // Ruta calculada por pathfinding
            currentPathIndex: 0,
            isMoving: true,
            hasArrived: false,
            createdAt: Date.now()
        };
        
        // Calcular ruta inicial
        this.calculatePath(fleet);
        
        this.fleets.push(fleet);
        
        console.log(`🚀 Nueva nave creada: ${fleet.id}`);
    }

    /**
     * 🧭 Calcular ruta para una nave
     */
    calculatePath(fleet) {
        const startTime = performance.now();
        
        switch (this.config.algorithm) {
            case 'simple':
                this.calculateSimplePath(fleet);
                break;
            case 'astar':
                this.calculateAStarPath(fleet);
                break;
            case 'flow':
                this.calculateFlowFieldPath(fleet);
                break;
            default:
                this.calculateSimplePath(fleet);
        }
        
        const calculationTime = performance.now() - startTime;
        this.updateMetrics(calculationTime);
        
        console.log(`🧭 Ruta calculada para ${fleet.id} en ${calculationTime.toFixed(2)}ms`);
    }

    /**
     * 🧭 Algoritmo de evitación simple
     */
    calculateSimplePath(fleet) {
        fleet.path = [
            { x: fleet.startX, y: fleet.startY },
            { x: fleet.targetX, y: fleet.targetY }
        ];
        
        // TODO: Implementar evitación simple
        // Por ahora, ruta directa
    }

    /**
     * 🧭 Algoritmo A*
     */
    calculateAStarPath(fleet) {
        // TODO: Implementar A*
        this.calculateSimplePath(fleet); // Fallback temporal
    }

    /**
     * 🧭 Algoritmo Flow Field
     */
    calculateFlowFieldPath(fleet) {
        // TODO: Implementar Flow Field
        this.calculateSimplePath(fleet); // Fallback temporal
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
        this.metrics.fps = Math.round(1000 / (currentTime - this.lastFrameTime + deltaTime * 1000));
        this.metrics.frameTime = deltaTime * 1000;
        
        // Actualizar simulación
        this.update(deltaTime);
        
        // Renderizar
        this.render();
        
        // Actualizar UI
        this.updateUI();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 🔄 Actualizar simulación
     */
    update(deltaTime) {
        // Actualizar naves
        this.fleets.forEach(fleet => {
            if (fleet.isMoving && !fleet.hasArrived) {
                this.updateFleet(fleet, deltaTime);
            }
        });
        
        // Limpiar naves que han llegado
        this.fleets = this.fleets.filter(fleet => !fleet.hasArrived);
    }

    /**
     * 🚀 Actualizar nave individual
     */
    updateFleet(fleet, deltaTime) {
        // Movimiento simple hacia el objetivo
        const dx = fleet.targetX - fleet.x;
        const dy = fleet.targetY - fleet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            // Ha llegado
            fleet.hasArrived = true;
            fleet.isMoving = false;
            return;
        }
        
        // Mover hacia el objetivo
        const moveDistance = fleet.speed * deltaTime;
        fleet.x += (dx / distance) * moveDistance;
        fleet.y += (dy / distance) * moveDistance;
        
        // Actualizar trail
        fleet.trail.push({ x: fleet.x, y: fleet.y, timestamp: Date.now() });
        if (fleet.trail.length > 20) {
            fleet.trail.shift();
        }
    }

    /**
     * 🎨 Renderizar laboratorio
     */
    render() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar obstáculos
        this.renderObstacles();
        
        // Renderizar zonas de obstáculos
        if (this.config.visualization.showObstacleZones) {
            this.renderObstacleZones();
        }
        
        // Renderizar naves
        this.renderFleets();
        
        // Renderizar trayectorias
        if (this.config.visualization.showTrajectories) {
            this.renderTrajectories();
        }
        
        // Renderizar drag & drop en progreso
        if (this.isDragging && this.dragStart && this.targetPoint) {
            this.renderDragLine();
        }
    }

    /**
     * 🎨 Renderizar obstáculos
     */
    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.save();
            
            // Círculo principal
            this.ctx.fillStyle = obstacle.color;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Borde
            this.ctx.strokeStyle = obstacle.color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 1;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }

    /**
     * 🎨 Renderizar zonas de obstáculos
     */
    renderObstacleZones() {
        this.obstacles.forEach(obstacle => {
            this.ctx.save();
            
            // Zona de detección
            this.ctx.strokeStyle = '#ffaa00';
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius + this.config.detection.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Zona de evitación
            this.ctx.strokeStyle = '#ff4444';
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius + this.config.detection.avoidanceDistance, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }

    /**
     * 🎨 Renderizar naves
     */
    renderFleets() {
        this.fleets.forEach(fleet => {
            // Trail
            if (fleet.trail.length > 1) {
                this.ctx.save();
                this.ctx.strokeStyle = fleet.color;
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.3;
                this.ctx.beginPath();
                this.ctx.moveTo(fleet.trail[0].x, fleet.trail[0].y);
                for (let i = 1; i < fleet.trail.length; i++) {
                    this.ctx.lineTo(fleet.trail[i].x, fleet.trail[i].y);
                }
                this.ctx.stroke();
                this.ctx.restore();
            }
            
            // Nave
            this.ctx.save();
            this.ctx.fillStyle = fleet.color;
            this.ctx.beginPath();
            this.ctx.arc(fleet.x, fleet.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    /**
     * 🎨 Renderizar trayectorias
     */
    renderTrajectories() {
        this.fleets.forEach(fleet => {
            if (fleet.path && fleet.path.length > 1) {
                this.ctx.save();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 0.6;
                this.ctx.setLineDash([3, 3]);
                
                this.ctx.beginPath();
                this.ctx.moveTo(fleet.path[0].x, fleet.path[0].y);
                for (let i = 1; i < fleet.path.length; i++) {
                    this.ctx.lineTo(fleet.path[i].x, fleet.path[i].y);
                }
                this.ctx.stroke();
                
                this.ctx.restore();
            }
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
        this.ctx.lineTo(this.targetPoint.x, this.targetPoint.y);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    /**
     * 📊 Actualizar UI
     */
    updateUI() {
        document.getElementById('statFPS').textContent = this.metrics.fps;
        document.getElementById('statFleets').textContent = this.fleets.length;
        document.getElementById('statObstacles').textContent = this.obstacles.length;
        document.getElementById('statCalculations').textContent = this.metrics.calculationsPerFrame;
        document.getElementById('statAvgTime').textContent = this.metrics.averageCalculationTime.toFixed(2) + 'ms';
    }

    /**
     * 📊 Actualizar métricas
     */
    updateMetrics(calculationTime) {
        this.metrics.totalCalculations++;
        this.metrics.calculationsPerFrame++;
        this.metrics.averageCalculationTime = 
            (this.metrics.averageCalculationTime * 0.9) + (calculationTime * 0.1);
    }

    /**
     * 🎯 Obtener obstáculo en posición
     */
    getObstacleAtPosition(x, y) {
        return this.obstacles.find(obstacle => {
            const dx = x - obstacle.x;
            const dy = y - obstacle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= obstacle.radius;
        });
    }

    /**
     * ➕ Agregar obstáculo
     */
    addObstacle(x, y) {
        const obstacle = {
            id: `obstacle_${Date.now()}`,
            x: x,
            y: y,
            radius: 20 + Math.random() * 20,
            color: '#ff6666'
        };
        
        this.obstacles.push(obstacle);
        console.log(`➕ Obstáculo agregado en (${x.toFixed(1)}, ${y.toFixed(1)})`);
    }

    /**
     * ➖ Remover obstáculo
     */
    removeObstacle(id) {
        this.obstacles = this.obstacles.filter(obstacle => obstacle.id !== id);
        console.log(`➖ Obstáculo ${id} removido`);
    }

    /**
     * 🧹 Limpiar todo
     */
    clearAll() {
        this.obstacles = [];
        this.fleets = [];
        console.log('🧹 Laboratorio limpiado');
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
        
        console.log('🎲 Obstáculos aleatorios agregados');
    }

    /**
     * 📊 Ejecutar benchmark
     */
    runBenchmark() {
        console.log('📊 Ejecutando benchmark de pathfinding...');
        // TODO: Implementar benchmark
    }

    /**
     * 💾 Exportar configuración
     */
    exportConfiguration() {
        const config = {
            detection: this.config.detection,
            algorithm: this.config.algorithm,
            visualization: this.config.visualization,
            obstacles: this.obstacles
        };
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'pathfinding-config.json';
        link.click();
        
        console.log('💾 Configuración exportada');
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
        this.obstacles = [];
        this.fleets = [];
        console.log('💥 Laboratorio destruido');
    }
} 