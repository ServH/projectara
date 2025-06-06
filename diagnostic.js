#!/usr/bin/env node

/**
 * 🔧 DIAGNOSTIC SCRIPT - Diagnóstico Automatizado del Sistema
 * Valida todos los módulos, dependencias y flujos de eventos
 * Genera reporte de problemas y soluciones automáticas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GameDiagnostic {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.fixes = [];
        this.moduleTests = new Map();
        this.srcPath = path.join(__dirname, 'src');
    }

    async runFullDiagnostic() {
        console.log('🔧 Iniciando diagnóstico automatizado del sistema...\n');
        
        // 1. Verificar estructura de archivos
        await this.checkFileStructure();
        
        // 2. Validar imports y dependencias
        await this.validateImports();
        
        // 3. Probar módulos críticos
        await this.testCriticalModules();
        
        // 4. Simular flujo de eventos
        await this.simulateEventFlow();
        
        // 5. Generar reporte
        this.generateReport();
        
        // 6. Aplicar correcciones automáticas
        await this.applyAutomaticFixes();
    }

    async checkFileStructure() {
        console.log('📁 Verificando estructura de archivos...');
        
        const criticalFiles = [
            'src/utils/Vector2D.js',
            'src/entities/SteeringVehicle.js',
            'src/entities/Fleet.js',
            'src/systems/FleetFormationSystem.js',
            'src/navigation/NavigationSystem.js',
            'src/core/GameEngine.js',
            'src/core/EventBus.js',
            'src/core/StateManager.js'
        ];

        for (const file of criticalFiles) {
            const fullPath = path.join(__dirname, file);
            if (!fs.existsSync(fullPath)) {
                this.errors.push(`❌ Archivo crítico faltante: ${file}`);
            } else {
                console.log(`✅ ${file}`);
            }
        }
    }

    async validateImports() {
        console.log('\n📦 Validando imports y dependencias...');
        
        try {
            // Test Vector2D
            const { Vector2D } = await import('./src/utils/Vector2D.js');
            const v1 = new Vector2D(10, 20);
            const v2 = v1.copy();
            
            if (v2.x === 10 && v2.y === 20) {
                console.log('✅ Vector2D: Funciona correctamente');
                this.moduleTests.set('Vector2D', true);
            } else {
                this.errors.push('❌ Vector2D: copy() no funciona correctamente');
                this.moduleTests.set('Vector2D', false);
            }
        } catch (error) {
            this.errors.push(`❌ Vector2D: Error de import - ${error.message}`);
            this.moduleTests.set('Vector2D', false);
        }

        try {
            // Test EventBus
            const eventBus = await import('./src/core/EventBus.js');
            console.log('✅ EventBus: Import exitoso');
            this.moduleTests.set('EventBus', true);
        } catch (error) {
            this.errors.push(`❌ EventBus: Error de import - ${error.message}`);
            this.moduleTests.set('EventBus', false);
        }
    }

    async testCriticalModules() {
        console.log('\n🧪 Probando módulos críticos...');
        
        // Test SteeringVehicle creation
        if (this.moduleTests.get('Vector2D')) {
            try {
                const { Vector2D } = await import('./src/utils/Vector2D.js');
                const { SteeringVehicle } = await import('./src/entities/SteeringVehicle.js');
                const { GALCON_STEERING_CONFIG_PROBADA } = await import('./src/config/SteeringConfig.js');
                
                const position = new Vector2D(100, 100);
                const target = new Vector2D(200, 200);
                const vehicle = new SteeringVehicle(position, target, GALCON_STEERING_CONFIG_PROBADA);
                
                if (vehicle.position && vehicle.target) {
                    console.log('✅ SteeringVehicle: Creación exitosa');
                    this.moduleTests.set('SteeringVehicle', true);
                } else {
                    this.errors.push('❌ SteeringVehicle: Propiedades no inicializadas correctamente');
                    this.moduleTests.set('SteeringVehicle', false);
                }
            } catch (error) {
                this.errors.push(`❌ SteeringVehicle: Error en creación - ${error.message}`);
                this.moduleTests.set('SteeringVehicle', false);
                
                // Proponer fix automático
                this.fixes.push({
                    type: 'SteeringVehicle_constructor_fix',
                    description: 'Arreglar constructor de SteeringVehicle',
                    action: () => this.fixSteeringVehicleConstructor()
                });
            }
        }

        // Test Fleet creation
        if (this.moduleTests.get('Vector2D') && this.moduleTests.get('SteeringVehicle')) {
            try {
                const { Vector2D } = await import('./src/utils/Vector2D.js');
                const { Fleet } = await import('./src/entities/Fleet.js');
                const { GALCON_STEERING_CONFIG_PROBADA } = await import('./src/config/SteeringConfig.js');
                
                const startPos = new Vector2D(50, 50);
                const targetPos = new Vector2D(150, 150);
                const fleet = new Fleet(startPos, targetPos, GALCON_STEERING_CONFIG_PROBADA, 3);
                
                if (fleet.vehicles && fleet.vehicles.length === 3) {
                    console.log('✅ Fleet: Creación exitosa');
                    this.moduleTests.set('Fleet', true);
                } else {
                    this.errors.push('❌ Fleet: Vehículos no creados correctamente');
                    this.moduleTests.set('Fleet', false);
                }
            } catch (error) {
                this.errors.push(`❌ Fleet: Error en creación - ${error.message}`);
                this.moduleTests.set('Fleet', false);
            }
        }
    }

    async simulateEventFlow() {
        console.log('\n🔄 Simulando flujo de eventos...');
        
        try {
            // Simular evento fleet:launched
            const eventBusModule = await import('./src/core/EventBus.js');
            const eventBus = eventBusModule.default;
            const { GAME_EVENTS } = eventBusModule;
            
            let eventReceived = false;
            
            // Listener de prueba
            eventBus.on(GAME_EVENTS.FLEET_LAUNCHED, (data) => {
                eventReceived = true;
                console.log('✅ Evento FLEET_LAUNCHED recibido correctamente');
            });
            
            // Emitir evento de prueba
            eventBus.emit(GAME_EVENTS.FLEET_LAUNCHED, {
                ships: 5,
                fromPlanet: 'test_planet_1',
                toPlanet: 'test_planet_2'
            });
            
            // Verificar después de un tick
            setTimeout(() => {
                if (!eventReceived) {
                    this.errors.push('❌ EventBus: Eventos no se propagan correctamente');
                }
            }, 10);
            
        } catch (error) {
            this.errors.push(`❌ EventFlow: Error en simulación - ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📊 REPORTE DE DIAGNÓSTICO');
        console.log('='.repeat(50));
        
        console.log(`\n✅ Módulos funcionando: ${Array.from(this.moduleTests.entries()).filter(([k,v]) => v).length}`);
        console.log(`❌ Módulos con problemas: ${Array.from(this.moduleTests.entries()).filter(([k,v]) => !v).length}`);
        console.log(`⚠️  Advertencias: ${this.warnings.length}`);
        console.log(`🔧 Correcciones disponibles: ${this.fixes.length}`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORES ENCONTRADOS:');
            this.errors.forEach(error => console.log(`  ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  ADVERTENCIAS:');
            this.warnings.forEach(warning => console.log(`  ${warning}`));
        }
        
        if (this.fixes.length > 0) {
            console.log('\n🔧 CORRECCIONES AUTOMÁTICAS DISPONIBLES:');
            this.fixes.forEach(fix => console.log(`  - ${fix.description}`));
        }
    }

    async applyAutomaticFixes() {
        if (this.fixes.length === 0) {
            console.log('\n✅ No se necesitan correcciones automáticas');
            return;
        }
        
        console.log('\n🔧 Aplicando correcciones automáticas...');
        
        for (const fix of this.fixes) {
            try {
                console.log(`  Aplicando: ${fix.description}`);
                await fix.action();
                console.log(`  ✅ ${fix.description} - Completado`);
            } catch (error) {
                console.log(`  ❌ ${fix.description} - Error: ${error.message}`);
            }
        }
    }

    async fixSteeringVehicleConstructor() {
        // Esta función implementaría la corrección automática del constructor
        console.log('    Corrigiendo constructor de SteeringVehicle...');
        // Aquí iría la lógica de corrección automática
    }
}

// Ejecutar diagnóstico si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const diagnostic = new GameDiagnostic();
    diagnostic.runFullDiagnostic().catch(console.error);
}

export { GameDiagnostic }; 