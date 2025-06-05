/**
 * 🎬 DEMOSTRACIÓN AUTOMÁTICA DEL LABORATORIO DE FLOTAS
 * Script para mostrar las capacidades del sistema de steering behaviors
 */

export class FleetDemo {
    constructor(steeringLab) {
        this.lab = steeringLab;
        this.isRunning = false;
        this.currentStep = 0;
        this.stepTimer = 0;
        this.stepDuration = 5000; // 5 segundos por paso
        
        this.demoSteps = [
            {
                name: "Introducción",
                description: "Bienvenido al Laboratorio de Flotas",
                action: () => this.stepIntroduction()
            },
            {
                name: "Naves Individuales",
                description: "Demostrando steering behaviors básicos",
                action: () => this.stepIndividualVehicles()
            },
            {
                name: "Formación Dispersa",
                description: "Flota en formación spread",
                action: () => this.stepSpreadFormation()
            },
            {
                name: "Formación en Cuña",
                description: "Flota táctica en wedge",
                action: () => this.stepWedgeFormation()
            },
            {
                name: "Formación Circular",
                description: "Flota defensiva en círculo",
                action: () => this.stepCircleFormation()
            },
            {
                name: "Múltiples Flotas",
                description: "Varias flotas interactuando",
                action: () => this.stepMultipleFleets()
            },
            {
                name: "Spatial Hashing",
                description: "Visualización de optimización",
                action: () => this.stepSpatialHashing()
            },
            {
                name: "Comportamientos de Boids",
                description: "Ajustando parámetros en tiempo real",
                action: () => this.stepBoidsDemo()
            },
            {
                name: "Navegación Compleja",
                description: "Obstáculos y evasión avanzada",
                action: () => this.stepComplexNavigation()
            },
            {
                name: "Fin de Demo",
                description: "Demostración completada",
                action: () => this.stepFinish()
            }
        ];
        
        console.log('🎬 FleetDemo inicializado');
    }

    /**
     * 🚀 Iniciar demostración
     */
    start() {
        this.isRunning = true;
        this.currentStep = 0;
        this.stepTimer = 0;
        
        // Configurar laboratorio para demo
        this.lab.clearAll();
        this.setupDemoEnvironment();
        
        console.log('🎬 Iniciando demostración automática');
        this.executeCurrentStep();
    }

    /**
     * 🛑 Detener demostración
     */
    stop() {
        this.isRunning = false;
        console.log('🛑 Demostración detenida');
    }

    /**
     * 🔄 Actualizar demostración
     */
    update(deltaTime) {
        if (!this.isRunning) return;
        
        this.stepTimer += deltaTime * 1000; // Convertir a ms
        
        if (this.stepTimer >= this.stepDuration) {
            this.nextStep();
        }
    }

    /**
     * ➡️ Siguiente paso
     */
    nextStep() {
        this.currentStep++;
        this.stepTimer = 0;
        
        if (this.currentStep >= this.demoSteps.length) {
            this.stop();
            return;
        }
        
        this.executeCurrentStep();
    }

    /**
     * ⚡ Ejecutar paso actual
     */
    executeCurrentStep() {
        const step = this.demoSteps[this.currentStep];
        console.log(`🎬 Paso ${this.currentStep + 1}: ${step.name} - ${step.description}`);
        
        // Mostrar información en pantalla
        this.showStepInfo(step);
        
        // Ejecutar acción del paso
        step.action();
    }

    /**
     * 📋 Configurar entorno de demo
     */
    setupDemoEnvironment() {
        // Configuración óptima para demo
        this.lab.config.debug.showTrails = true;
        this.lab.config.debug.showForces = false;
        this.lab.config.debug.showSensors = false;
        this.lab.config.debug.showFleetConnections = true;
        this.lab.config.debug.showFleetCenter = true;
        
        // Velocidades moderadas para mejor visualización
        this.lab.config.forces.maxSpeed = 80;
        this.lab.config.forces.maxForce = 150;
    }

    /**
     * 📢 Mostrar información del paso
     */
    showStepInfo(step) {
        // Crear overlay de información si no existe
        let overlay = document.getElementById('demoOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'demoOverlay';
            overlay.style.cssText = `
                position: absolute;
                top: 50px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: #00ff88;
                padding: 15px 25px;
                border-radius: 10px;
                border: 2px solid #00ff88;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                text-align: center;
                z-index: 1000;
                box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
            `;
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                🎬 PASO ${this.currentStep + 1}/${this.demoSteps.length}
            </div>
            <div style="font-size: 18px; color: #ffffff; margin-bottom: 5px;">
                ${step.name}
            </div>
            <div style="font-size: 12px; color: #88ccff;">
                ${step.description}
            </div>
        `;
    }

    // ========================================
    // 🎬 PASOS DE LA DEMOSTRACIÓN
    // ========================================

    /**
     * 📖 Paso 1: Introducción
     */
    stepIntroduction() {
        this.lab.clearAll();
        // Solo mostrar información, sin crear naves
    }

    /**
     * 🚀 Paso 2: Naves individuales
     */
    stepIndividualVehicles() {
        this.lab.clearAll();
        this.lab.operationMode = 'individual';
        
        const canvas = this.lab.canvas.getBoundingClientRect();
        
        // Crear varias naves individuales
        for (let i = 0; i < 5; i++) {
            const start = new Vector2D(
                100 + i * 50,
                canvas.height * 0.2
            );
            const target = new Vector2D(
                canvas.width * 0.8,
                canvas.height * 0.8
            );
            
            this.lab.createVehicle(start, target);
        }
    }

    /**
     * 🌟 Paso 3: Formación dispersa
     */
    stepSpreadFormation() {
        this.lab.clearAll();
        this.lab.operationMode = 'fleet';
        this.lab.config.fleet.formation = 'spread';
        this.lab.config.fleet.size = 7;
        
        const canvas = this.lab.canvas.getBoundingClientRect();
        const start = new Vector2D(canvas.width * 0.2, canvas.height * 0.3);
        const target = new Vector2D(canvas.width * 0.8, canvas.height * 0.7);
        
        this.lab.createFleet(start, target);
    }

    /**
     * ⚔️ Paso 4: Formación en cuña
     */
    stepWedgeFormation() {
        this.lab.clearAll();
        this.lab.config.fleet.formation = 'wedge';
        this.lab.config.fleet.size = 9;
        
        const canvas = this.lab.canvas.getBoundingClientRect();
        const start = new Vector2D(canvas.width * 0.1, canvas.height * 0.5);
        const target = new Vector2D(canvas.width * 0.9, canvas.height * 0.5);
        
        this.lab.createFleet(start, target);
    }

    /**
     * 🛡️ Paso 5: Formación circular
     */
    stepCircleFormation() {
        this.lab.clearAll();
        this.lab.config.fleet.formation = 'circle';
        this.lab.config.fleet.size = 8;
        
        const canvas = this.lab.canvas.getBoundingClientRect();
        const start = new Vector2D(canvas.width * 0.3, canvas.height * 0.2);
        const target = new Vector2D(canvas.width * 0.7, canvas.height * 0.8);
        
        this.lab.createFleet(start, target);
    }

    /**
     * 🚁 Paso 6: Múltiples flotas
     */
    stepMultipleFleets() {
        this.lab.clearAll();
        this.lab.config.fleet.size = 5;
        
        const canvas = this.lab.canvas.getBoundingClientRect();
        
        // Flota 1: Spread
        this.lab.config.fleet.formation = 'spread';
        this.lab.createFleet(
            new Vector2D(canvas.width * 0.1, canvas.height * 0.2),
            new Vector2D(canvas.width * 0.9, canvas.height * 0.8)
        );
        
        // Flota 2: Line
        this.lab.config.fleet.formation = 'line';
        this.lab.createFleet(
            new Vector2D(canvas.width * 0.1, canvas.height * 0.8),
            new Vector2D(canvas.width * 0.9, canvas.height * 0.2)
        );
        
        // Flota 3: Wedge
        this.lab.config.fleet.formation = 'wedge';
        this.lab.createFleet(
            new Vector2D(canvas.width * 0.5, canvas.height * 0.1),
            new Vector2D(canvas.width * 0.5, canvas.height * 0.9)
        );
    }

    /**
     * 🗺️ Paso 7: Spatial hashing
     */
    stepSpatialHashing() {
        // Mantener flotas anteriores
        this.lab.config.debug.showSpatialGrid = true;
        
        // Crear más flotas para mostrar optimización
        const canvas = this.lab.canvas.getBoundingClientRect();
        
        for (let i = 0; i < 3; i++) {
            this.lab.createFleet(
                new Vector2D(
                    50 + Math.random() * (canvas.width - 100),
                    50 + Math.random() * (canvas.height - 100)
                ),
                new Vector2D(
                    50 + Math.random() * (canvas.width - 100),
                    50 + Math.random() * (canvas.height - 100)
                )
            );
        }
    }

    /**
     * 🐦 Paso 8: Comportamientos de boids
     */
    stepBoidsDemo() {
        this.lab.clearAll();
        this.lab.config.debug.showSpatialGrid = false;
        this.lab.config.fleet.size = 12;
        this.lab.config.fleet.formation = 'spread';
        
        const canvas = this.lab.canvas.getBoundingClientRect();
        const start = new Vector2D(canvas.width * 0.2, canvas.height * 0.5);
        const target = new Vector2D(canvas.width * 0.8, canvas.height * 0.5);
        
        this.lab.createFleet(start, target);
        
        // Animar parámetros de boids
        setTimeout(() => {
            this.lab.config.fleet.separationWeight = 3.0;
        }, 1000);
        
        setTimeout(() => {
            this.lab.config.fleet.cohesionWeight = 2.0;
        }, 2000);
        
        setTimeout(() => {
            this.lab.config.fleet.alignmentWeight = 2.5;
        }, 3000);
    }

    /**
     * 🧩 Paso 9: Navegación compleja
     */
    stepComplexNavigation() {
        this.lab.clearAll();
        
        // Agregar obstáculos complejos
        const canvas = this.lab.canvas.getBoundingClientRect();
        
        // Crear laberinto de obstáculos
        this.lab.addObstacle(canvas.width * 0.3, canvas.height * 0.3);
        this.lab.addObstacle(canvas.width * 0.7, canvas.height * 0.3);
        this.lab.addObstacle(canvas.width * 0.5, canvas.height * 0.5);
        this.lab.addObstacle(canvas.width * 0.3, canvas.height * 0.7);
        this.lab.addObstacle(canvas.width * 0.7, canvas.height * 0.7);
        
        // Crear flota que debe navegar el laberinto
        this.lab.config.fleet.formation = 'line';
        this.lab.config.fleet.size = 6;
        
        this.lab.createFleet(
            new Vector2D(canvas.width * 0.1, canvas.height * 0.1),
            new Vector2D(canvas.width * 0.9, canvas.height * 0.9)
        );
    }

    /**
     * 🎉 Paso 10: Finalizar
     */
    stepFinish() {
        this.lab.clearAll();
        
        // Mostrar mensaje final
        const overlay = document.getElementById('demoOverlay');
        if (overlay) {
            overlay.innerHTML = `
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
                    🎉 ¡DEMOSTRACIÓN COMPLETADA!
                </div>
                <div style="font-size: 14px; color: #ffffff; margin-bottom: 10px;">
                    Laboratorio de Flotas con Steering Behaviors
                </div>
                <div style="font-size: 12px; color: #88ccff;">
                    Experimenta con los controles para crear tus propias simulaciones
                </div>
            `;
            
            // Remover overlay después de 3 segundos
            setTimeout(() => {
                overlay.remove();
            }, 3000);
        }
        
        this.isRunning = false;
    }

    /**
     * 💥 Destruir demo
     */
    destroy() {
        this.stop();
        
        const overlay = document.getElementById('demoOverlay');
        if (overlay) {
            overlay.remove();
        }
        
        console.log('💥 FleetDemo destruido');
    }
} 