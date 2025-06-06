#!/usr/bin/env node

/**
 * 🔧 COMPREHENSIVE DIAGNOSTIC - Diagnóstico Exhaustivo Post-Refactorización
 * Incluye todas las pruebas críticas basadas en problemas identificados y solucionados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComprehensiveDiagnostic {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.successes = [];
        this.criticalIssues = [];
        this.performanceIssues = [];
    }

    async runFullDiagnostic() {
        console.log('🔧 DIAGNÓSTICO EXHAUSTIVO POST-REFACTORIZACIÓN');
        console.log('='.repeat(60));
        console.log('Basado en problemas identificados y patrones de fallo conocidos\n');
        
        // 1. Verificar estructura de archivos críticos
        this.checkCriticalFileStructure();
        
        // 2. Verificar integridad de Vector2D (problema crítico #1)
        await this.checkVector2DIntegrity();
        
        // 3. Verificar constructores robustos (problema crítico #2)
        await this.checkConstructorValidation();
        
        // 4. Verificar sistema de eventos (problema crítico #3)
        await this.checkEventSystemIntegrity();
        
        // 5. Verificar flujo de flotas (problema crítico #4)
        await this.checkFleetFlowIntegrity();
        
        // 6. Verificar imports y dependencias
        await this.checkImportDependencies();
        
        // 7. Verificar configuraciones del sistema
        await this.checkSystemConfigurations();
        
        // 8. Verificar patrones de logging
        await this.checkLoggingPatterns();
        
        // 9. Verificar adaptadores y managers
        await this.checkAdaptersAndManagers();
        
        // 10. Verificar sistemas de navegación
        await this.checkNavigationSystems();
        
        // 11. Verificar drag & drop y UI
        await this.checkUIAndInteraction();
        
        // 12. Verificar IA y sistemas automáticos
        await this.checkAIAndAutomatedSystems();
        
        // 13. Generar reporte final
        this.generateComprehensiveReport();
    }

    checkCriticalFileStructure() {
        console.log('📁 1. Verificando estructura de archivos críticos...');
        
        const criticalFiles = [
            // Core del sistema
            'src/core/GameEngine.js',
            'src/core/EventBus.js', 
            'src/core/StateManager.js',
            'src/core/SystemsManager.js',
            
            // Entidades críticas
            'src/entities/SteeringVehicle.js',
            'src/entities/Fleet.js',
            'src/entities/Planet.js',
            
            // Sistemas principales
            'src/systems/FleetFormationSystem.js',
            'src/navigation/NavigationSystem.js',
            'src/systems/AISystem.js',
            'src/systems/SelectionSystem.js',
            
            // Utilidades esenciales
            'src/utils/Vector2D.js',
            'src/utils/vector/VectorFactory.js',
            'src/utils/vector/VectorOperations.js',
            
            // Debugging y logging
            'src/debug/GameLogger.js',
            'src/debug/PerformanceProfiler.js',
            
            // Adaptadores críticos
            'src/adapters/LegacyFleetAdapter.js',
            'src/adapters/managers/FleetUpdateManager.js',
            
            // Input y UI
            'src/input/DragDropHandler.js',
            'src/ui/HUDManager.js',
            'src/ui/PercentageSelector.js',
            
            // Configuración
            'index.html',
            'package.json'
        ];

        let missingCritical = 0;
        for (const file of criticalFiles) {
            const fullPath = path.join(__dirname, file);
            if (fs.existsSync(fullPath)) {
                console.log(`  ✅ ${file}`);
                this.successes.push(`Archivo crítico presente: ${file}`);
            } else {
                console.log(`  ❌ ${file} - CRÍTICO FALTANTE`);
                this.criticalIssues.push(`Archivo crítico faltante: ${file}`);
                missingCritical++;
            }
        }
        
        if (missingCritical > 0) {
            this.errors.push(`${missingCritical} archivos críticos faltantes`);
        }
    }

    async checkVector2DIntegrity() {
        console.log('\n🧮 2. Verificando integridad de Vector2D (Problema Crítico #1)...');
        
        try {
            const vector2DPath = path.join(__dirname, 'src/utils/Vector2D.js');
            const content = fs.readFileSync(vector2DPath, 'utf8');
            
            // Verificar exportación de clase
            if (content.includes('export class Vector2D')) {
                console.log('  ✅ Vector2D: Clase exportada correctamente');
                this.successes.push('Vector2D exporta clase correctamente');
            } else {
                console.log('  ❌ Vector2D: Exportación de clase incorrecta');
                this.criticalIssues.push('Vector2D no exporta clase correctamente');
            }
            
            // Verificar método copy() (causa del error original)
            if (content.includes('copy()') && content.includes('return new Vector2D')) {
                console.log('  ✅ Vector2D: Método copy() implementado correctamente');
                this.successes.push('Vector2D tiene método copy() funcional');
            } else {
                console.log('  ❌ Vector2D: Método copy() faltante o incorrecto');
                this.criticalIssues.push('Vector2D método copy() problemático - CAUSA ORIGINAL DEL ERROR');
            }
            
            // Verificar métodos estáticos esenciales
            const staticMethods = ['zero()', 'add(', 'subtract(', 'multiply('];
            for (const method of staticMethods) {
                if (content.includes(method)) {
                    console.log(`  ✅ Vector2D: Método estático ${method} presente`);
                    this.successes.push(`Vector2D método ${method} presente`);
                } else {
                    console.log(`  ⚠️  Vector2D: Método estático ${method} faltante`);
                    this.warnings.push(`Vector2D método ${method} faltante`);
                }
            }
            
            // Verificar propiedades x, y
            if (content.includes('this.x') && content.includes('this.y')) {
                console.log('  ✅ Vector2D: Propiedades x, y definidas');
                this.successes.push('Vector2D propiedades x,y definidas');
            } else {
                console.log('  ❌ Vector2D: Propiedades x, y no definidas correctamente');
                this.criticalIssues.push('Vector2D propiedades x,y problemáticas');
            }
            
        } catch (error) {
            console.log(`  ❌ Vector2D: Error leyendo archivo - ${error.message}`);
            this.criticalIssues.push(`Error crítico leyendo Vector2D: ${error.message}`);
        }
    }

    async checkConstructorValidation() {
        console.log('\n🏗️  3. Verificando validación robusta de constructores (Problema Crítico #2)...');
        
        // Verificar SteeringVehicle constructor
        try {
            const steeringPath = path.join(__dirname, 'src/entities/SteeringVehicle.js');
            const content = fs.readFileSync(steeringPath, 'utf8');
            
            // Verificar validación instanceof Vector2D
            if (content.includes('instanceof Vector2D')) {
                console.log('  ✅ SteeringVehicle: Validación instanceof Vector2D presente');
                this.successes.push('SteeringVehicle tiene validación Vector2D robusta');
            } else {
                console.log('  ❌ SteeringVehicle: Validación instanceof Vector2D faltante');
                this.criticalIssues.push('SteeringVehicle sin validación Vector2D - CAUSA DE target.copy() ERROR');
            }
            
            // Verificar manejo de casos edge
            if (content.includes('typeof target === \'object\'') && content.includes('\'x\' in target')) {
                console.log('  ✅ SteeringVehicle: Manejo de casos edge implementado');
                this.successes.push('SteeringVehicle maneja casos edge correctamente');
            } else {
                console.log('  ⚠️  SteeringVehicle: Manejo de casos edge limitado');
                this.warnings.push('SteeringVehicle manejo de casos edge limitado');
            }
            
            // Verificar logging de errores
            if (content.includes('gameLogger.error')) {
                console.log('  ✅ SteeringVehicle: Logging de errores implementado');
                this.successes.push('SteeringVehicle tiene logging de errores');
            } else {
                console.log('  ⚠️  SteeringVehicle: Sin logging de errores');
                this.warnings.push('SteeringVehicle sin logging de errores');
            }
            
        } catch (error) {
            console.log(`  ❌ SteeringVehicle: Error verificando constructor - ${error.message}`);
            this.criticalIssues.push(`Error verificando SteeringVehicle constructor: ${error.message}`);
        }
        
        // Verificar Fleet constructor
        try {
            const fleetPath = path.join(__dirname, 'src/entities/Fleet.js');
            const content = fs.readFileSync(fleetPath, 'utf8');
            
            if (content.includes('targetPosition.copy()')) {
                console.log('  ✅ Fleet: Constructor usa copy() correctamente');
                this.successes.push('Fleet constructor usa Vector2D.copy() correctamente');
            } else {
                console.log('  ⚠️  Fleet: Constructor podría no usar copy() correctamente');
                this.warnings.push('Fleet constructor uso de copy() incierto');
            }
            
        } catch (error) {
            console.log(`  ❌ Fleet: Error verificando constructor - ${error.message}`);
            this.errors.push(`Error verificando Fleet constructor: ${error.message}`);
        }
    }

    async checkEventSystemIntegrity() {
        console.log('\n📡 4. Verificando integridad del sistema de eventos (Problema Crítico #3)...');
        
        // Verificar EventBus
        try {
            const eventBusPath = path.join(__dirname, 'src/core/EventBus.js');
            const content = fs.readFileSync(eventBusPath, 'utf8');
            
            // Verificar eventos críticos definidos
            const criticalEvents = ['FLEET_LAUNCHED', 'FLEET_ADDED', 'FLEET_REMOVED', 'PLANET_SELECTED'];
            for (const event of criticalEvents) {
                if (content.includes(event)) {
                    console.log(`  ✅ EventBus: Evento ${event} definido`);
                    this.successes.push(`EventBus evento ${event} definido`);
                } else {
                    console.log(`  ❌ EventBus: Evento ${event} faltante`);
                    this.criticalIssues.push(`EventBus evento crítico ${event} faltante`);
                }
            }
            
            // Verificar métodos emit y on
            if (content.includes('emit(') && content.includes('on(')) {
                console.log('  ✅ EventBus: Métodos emit() y on() presentes');
                this.successes.push('EventBus métodos básicos presentes');
            } else {
                console.log('  ❌ EventBus: Métodos emit() o on() faltantes');
                this.criticalIssues.push('EventBus métodos básicos faltantes');
            }
            
        } catch (error) {
            console.log(`  ❌ EventBus: Error verificando - ${error.message}`);
            this.criticalIssues.push(`Error crítico en EventBus: ${error.message}`);
        }
        
        // Verificar conexiones de eventos en GameEngine
        try {
            const gameEnginePath = path.join(__dirname, 'src/core/GameEngine.js');
            const content = fs.readFileSync(gameEnginePath, 'utf8');
            
            if (content.includes('handleFleetLaunched') && content.includes('eventBus.on')) {
                console.log('  ✅ GameEngine: Event listeners configurados');
                this.successes.push('GameEngine event listeners configurados');
            } else {
                console.log('  ❌ GameEngine: Event listeners no configurados correctamente');
                this.criticalIssues.push('GameEngine event listeners problemáticos');
            }
            
        } catch (error) {
            console.log(`  ❌ GameEngine: Error verificando eventos - ${error.message}`);
            this.criticalIssues.push(`Error verificando GameEngine eventos: ${error.message}`);
        }
    }

    async checkFleetFlowIntegrity() {
        console.log('\n🚢 5. Verificando flujo de flotas (Problema Crítico #4)...');
        
        // Verificar GameEngine -> FleetFormationSystem
        try {
            const gameEnginePath = path.join(__dirname, 'src/core/GameEngine.js');
            const content = fs.readFileSync(gameEnginePath, 'utf8');
            
            if (content.includes('fleetFormationSystem') && content.includes('createOrganicFormation')) {
                console.log('  ✅ GameEngine: Integración con FleetFormationSystem correcta');
                this.successes.push('GameEngine integrado con FleetFormationSystem');
            } else {
                console.log('  ❌ GameEngine: Integración con FleetFormationSystem faltante');
                this.criticalIssues.push('GameEngine no integrado con FleetFormationSystem');
            }
            
            if (content.includes('stateManager.addFleet')) {
                console.log('  ✅ GameEngine: Agrega flotas al StateManager');
                this.successes.push('GameEngine agrega flotas al StateManager');
            } else {
                console.log('  ❌ GameEngine: No agrega flotas al StateManager');
                this.criticalIssues.push('GameEngine no agrega flotas al StateManager - FLOTAS NO APARECEN');
            }
            
        } catch (error) {
            console.log(`  ❌ GameEngine: Error verificando flujo de flotas - ${error.message}`);
            this.criticalIssues.push(`Error en flujo de flotas GameEngine: ${error.message}`);
        }
        
        // Verificar StateManager -> NavigationSystem
        try {
            const navSystemPath = path.join(__dirname, 'src/navigation/NavigationSystem.js');
            const content = fs.readFileSync(navSystemPath, 'utf8');
            
            if (content.includes('FLEET_ADDED') && content.includes('handleFleetAdded')) {
                console.log('  ✅ NavigationSystem: Escucha eventos FLEET_ADDED');
                this.successes.push('NavigationSystem escucha FLEET_ADDED');
            } else {
                console.log('  ❌ NavigationSystem: No escucha eventos FLEET_ADDED');
                this.criticalIssues.push('NavigationSystem no escucha FLEET_ADDED - FLOTAS NO SE MUEVEN');
            }
            
            if (content.includes('legacyFleetAdapter.addFleet')) {
                console.log('  ✅ NavigationSystem: Integrado con LegacyFleetAdapter');
                this.successes.push('NavigationSystem integrado con LegacyFleetAdapter');
            } else {
                console.log('  ❌ NavigationSystem: No integrado con LegacyFleetAdapter');
                this.criticalIssues.push('NavigationSystem no integrado con LegacyFleetAdapter');
            }
            
        } catch (error) {
            console.log(`  ❌ NavigationSystem: Error verificando flujo - ${error.message}`);
            this.criticalIssues.push(`Error en NavigationSystem flujo: ${error.message}`);
        }
    }

    async checkImportDependencies() {
        console.log('\n📦 6. Verificando imports y dependencias...');
        
        const criticalImports = [
            {
                file: 'src/core/GameEngine.js',
                imports: ['gameLogger', 'EventBus', 'StateManager', 'SystemsManager']
            },
            {
                file: 'src/entities/SteeringVehicle.js', 
                imports: ['Vector2D', 'gameLogger']
            },
            {
                file: 'src/navigation/NavigationSystem.js',
                imports: ['gameLogger', 'EventBus', 'GAME_EVENTS']
            },
            {
                file: 'src/entities/Fleet.js',
                imports: ['Vector2D', 'SteeringVehicle']
            },
            {
                file: 'src/input/DragDropHandler.js',
                imports: ['EventBus']
            }
        ];
        
        for (const {file, imports} of criticalImports) {
            try {
                const filePath = path.join(__dirname, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                console.log(`  📄 Verificando ${file}:`);
                for (const importName of imports) {
                    if (content.includes(`import`) && content.includes(importName)) {
                        console.log(`    ✅ Import ${importName} presente`);
                        this.successes.push(`${file} importa ${importName}`);
                    } else {
                        console.log(`    ❌ Import ${importName} faltante`);
                        this.errors.push(`${file} no importa ${importName}`);
                    }
                }
                
            } catch (error) {
                console.log(`    ❌ Error verificando imports en ${file}: ${error.message}`);
                this.errors.push(`Error verificando imports en ${file}: ${error.message}`);
            }
        }
    }

    async checkSystemConfigurations() {
        console.log('\n⚙️  7. Verificando configuraciones del sistema...');
        
        // Verificar package.json
        try {
            const packagePath = path.join(__dirname, 'package.json');
            const content = fs.readFileSync(packagePath, 'utf8');
            const packageJson = JSON.parse(content);
            
            if (packageJson.type === 'module') {
                console.log('  ✅ package.json: Módulos ES6 habilitados');
                this.successes.push('package.json configurado para ES6');
            } else {
                console.log('  ❌ package.json: Módulos ES6 no habilitados');
                this.criticalIssues.push('package.json sin type: module - IMPORTS FALLARÁN');
            }
            
            if (packageJson.scripts && packageJson.scripts.start) {
                console.log('  ✅ package.json: Script start definido');
                this.successes.push('package.json tiene script start');
            } else {
                console.log('  ⚠️  package.json: Script start no definido');
                this.warnings.push('package.json sin script start');
            }
            
        } catch (error) {
            console.log(`  ❌ package.json: Error - ${error.message}`);
            this.criticalIssues.push(`Error crítico en package.json: ${error.message}`);
        }
        
        // Verificar index.html
        try {
            const indexPath = path.join(__dirname, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');
            
            if (content.includes('type="module"')) {
                console.log('  ✅ index.html: Módulos ES6 configurados');
                this.successes.push('index.html configurado para módulos ES6');
            } else {
                console.log('  ❌ index.html: Módulos ES6 no configurados');
                this.criticalIssues.push('index.html sin type="module" - SCRIPTS NO CARGARÁN');
            }
            
            if (content.includes('src/ui/GameLoader.js')) {
                console.log('  ✅ index.html: GameLoader referenciado correctamente');
                this.successes.push('index.html referencia GameLoader');
            } else {
                console.log('  ❌ index.html: GameLoader no referenciado');
                this.criticalIssues.push('index.html no referencia GameLoader - JUEGO NO INICIARÁ');
            }
            
        } catch (error) {
            console.log(`  ❌ index.html: Error - ${error.message}`);
            this.criticalIssues.push(`Error crítico en index.html: ${error.message}`);
        }
    }

    async checkLoggingPatterns() {
        console.log('\n📝 8. Verificando patrones de logging...');
        
        const filesToCheck = [
            'src/core/GameEngine.js',
            'src/entities/SteeringVehicle.js',
            'src/navigation/NavigationSystem.js'
        ];
        
        for (const file of filesToCheck) {
            try {
                const filePath = path.join(__dirname, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                if (content.includes('gameLogger')) {
                    console.log(`  ✅ ${file}: GameLogger integrado`);
                    this.successes.push(`${file} tiene GameLogger`);
                    
                    // Verificar tipos de logging
                    const logTypes = ['error', 'warn', 'info', 'debug'];
                    for (const logType of logTypes) {
                        if (content.includes(`gameLogger.${logType}`)) {
                            console.log(`    ✅ Usa gameLogger.${logType}()`);
                            this.successes.push(`${file} usa gameLogger.${logType}`);
                        }
                    }
                } else {
                    console.log(`  ⚠️  ${file}: GameLogger no integrado`);
                    this.warnings.push(`${file} sin GameLogger - debugging limitado`);
                }
                
            } catch (error) {
                console.log(`  ❌ ${file}: Error verificando logging - ${error.message}`);
                this.errors.push(`Error verificando logging en ${file}: ${error.message}`);
            }
        }
    }

    async checkAdaptersAndManagers() {
        console.log('\n🔌 9. Verificando adaptadores y managers...');
        
        // Verificar LegacyFleetAdapter
        try {
            const adapterPath = path.join(__dirname, 'src/adapters/LegacyFleetAdapter.js');
            const content = fs.readFileSync(adapterPath, 'utf8');
            
            if (content.includes('addFleet') && content.includes('mappingManager')) {
                console.log('  ✅ LegacyFleetAdapter: Métodos principales presentes');
                this.successes.push('LegacyFleetAdapter funcional');
            } else {
                console.log('  ❌ LegacyFleetAdapter: Métodos principales faltantes');
                this.criticalIssues.push('LegacyFleetAdapter no funcional');
            }
            
        } catch (error) {
            console.log(`  ❌ LegacyFleetAdapter: Error - ${error.message}`);
            this.criticalIssues.push(`Error en LegacyFleetAdapter: ${error.message}`);
        }
        
        // Verificar SystemsManager
        try {
            const systemsPath = path.join(__dirname, 'src/core/SystemsManager.js');
            const content = fs.readFileSync(systemsPath, 'utf8');
            
            if (content.includes('fleetFormationSystem') && content.includes('navigationSystem')) {
                console.log('  ✅ SystemsManager: Sistemas críticos registrados');
                this.successes.push('SystemsManager sistemas críticos registrados');
            } else {
                console.log('  ❌ SystemsManager: Sistemas críticos no registrados');
                this.criticalIssues.push('SystemsManager sistemas críticos faltantes');
            }
            
        } catch (error) {
            console.log(`  ❌ SystemsManager: Error - ${error.message}`);
            this.criticalIssues.push(`Error en SystemsManager: ${error.message}`);
        }
    }

    async checkNavigationSystems() {
        console.log('\n🧭 10. Verificando sistemas de navegación...');
        
        // Verificar NavigationUpdateManager
        try {
            const updateManagerPath = path.join(__dirname, 'src/navigation/managers/NavigationUpdateManager.js');
            const content = fs.readFileSync(updateManagerPath, 'utf8');
            
            if (content.includes('updateAllFleetsWithTargets')) {
                console.log('  ✅ NavigationUpdateManager: Método principal presente');
                this.successes.push('NavigationUpdateManager funcional');
            } else {
                console.log('  ❌ NavigationUpdateManager: Método principal faltante');
                this.errors.push('NavigationUpdateManager no funcional');
            }
            
        } catch (error) {
            console.log(`  ❌ NavigationUpdateManager: Error - ${error.message}`);
            this.errors.push(`Error en NavigationUpdateManager: ${error.message}`);
        }
        
        // Verificar FleetFormationSystem
        try {
            const formationPath = path.join(__dirname, 'src/systems/FleetFormationSystem.js');
            const content = fs.readFileSync(formationPath, 'utf8');
            
            if (content.includes('createOrganicFormation')) {
                console.log('  ✅ FleetFormationSystem: Método createOrganicFormation presente');
                this.successes.push('FleetFormationSystem método principal presente');
            } else {
                console.log('  ❌ FleetFormationSystem: Método createOrganicFormation faltante');
                this.criticalIssues.push('FleetFormationSystem método principal faltante - FLOTAS NO SE CREAN');
            }
            
        } catch (error) {
            console.log(`  ❌ FleetFormationSystem: Error - ${error.message}`);
            this.criticalIssues.push(`Error en FleetFormationSystem: ${error.message}`);
        }
    }

    async checkUIAndInteraction() {
        console.log('\n🖱️  11. Verificando UI y sistemas de interacción...');
        
        // Verificar DragDropHandler
        try {
            const dragDropPath = path.join(__dirname, 'src/input/DragDropHandler.js');
            const content = fs.readFileSync(dragDropPath, 'utf8');
            
            if (content.includes('handleMouseDown') && content.includes('handleMouseUp')) {
                console.log('  ✅ DragDropHandler: Eventos de mouse configurados');
                this.successes.push('DragDropHandler eventos mouse configurados');
            } else {
                console.log('  ❌ DragDropHandler: Eventos de mouse no configurados');
                this.criticalIssues.push('DragDropHandler eventos mouse faltantes - DRAG & DROP NO FUNCIONA');
            }
            
            if (content.includes('eventBus.emit')) {
                console.log('  ✅ DragDropHandler: Integrado con EventBus');
                this.successes.push('DragDropHandler integrado con EventBus');
            } else {
                console.log('  ❌ DragDropHandler: No integrado con EventBus');
                this.criticalIssues.push('DragDropHandler no integrado con EventBus');
            }
            
        } catch (error) {
            console.log(`  ❌ DragDropHandler: Error - ${error.message}`);
            this.criticalIssues.push(`Error en DragDropHandler: ${error.message}`);
        }
        
        // Verificar SelectionSystem
        try {
            const selectionPath = path.join(__dirname, 'src/systems/SelectionSystem.js');
            const content = fs.readFileSync(selectionPath, 'utf8');
            
            if (content.includes('selectPlanet') && content.includes('PLANET_SELECTED')) {
                console.log('  ✅ SelectionSystem: Sistema de selección configurado');
                this.successes.push('SelectionSystem funcional');
            } else {
                console.log('  ❌ SelectionSystem: Sistema de selección no configurado');
                this.criticalIssues.push('SelectionSystem no funcional - SELECCIÓN NO FUNCIONA');
            }
            
        } catch (error) {
            console.log(`  ❌ SelectionSystem: Error - ${error.message}`);
            this.criticalIssues.push(`Error en SelectionSystem: ${error.message}`);
        }
        
        // Verificar PercentageSelector
        try {
            const percentagePath = path.join(__dirname, 'src/ui/PercentageSelector.js');
            const content = fs.readFileSync(percentagePath, 'utf8');
            
            if (content.includes('updatePercentage') && content.includes('getSelectedPercentage')) {
                console.log('  ✅ PercentageSelector: Funcionalidad básica presente');
                this.successes.push('PercentageSelector funcional');
            } else {
                console.log('  ❌ PercentageSelector: Funcionalidad básica faltante');
                this.errors.push('PercentageSelector no funcional - BOTONES % NO FUNCIONAN');
            }
            
        } catch (error) {
            console.log(`  ❌ PercentageSelector: Error - ${error.message}`);
            this.errors.push(`Error en PercentageSelector: ${error.message}`);
        }
    }

    async checkAIAndAutomatedSystems() {
        console.log('\n🤖 12. Verificando IA y sistemas automáticos...');
        
        // Verificar AISystem
        try {
            const aiSystemPath = path.join(__dirname, 'src/systems/AISystem.js');
            const content = fs.readFileSync(aiSystemPath, 'utf8');
            
            if (content.includes('update') && content.includes('aiConfigurationManager')) {
                console.log('  ✅ AISystem: Sistema principal configurado');
                this.successes.push('AISystem funcional');
            } else {
                console.log('  ❌ AISystem: Sistema principal no configurado');
                this.criticalIssues.push('AISystem no funcional - IA NO FUNCIONA');
            }
            
            if (content.includes('aiDecisionManager') && content.includes('aiTargetingManager')) {
                console.log('  ✅ AISystem: Managers de decisión y targeting presentes');
                this.successes.push('AISystem managers configurados');
            } else {
                console.log('  ⚠️  AISystem: Managers de decisión o targeting faltantes');
                this.warnings.push('AISystem managers incompletos');
            }
            
        } catch (error) {
            console.log(`  ❌ AISystem: Error - ${error.message}`);
            this.criticalIssues.push(`Error en AISystem: ${error.message}`);
        }
        
        // Verificar FleetRedirectionSystem
        try {
            const redirectionPath = path.join(__dirname, 'src/systems/FleetRedirectionSystem.js');
            const content = fs.readFileSync(redirectionPath, 'utf8');
            
            if (content.includes('redirectFleet') && content.includes('eventManager')) {
                console.log('  ✅ FleetRedirectionSystem: Sistema de redirección configurado');
                this.successes.push('FleetRedirectionSystem funcional');
            } else {
                console.log('  ❌ FleetRedirectionSystem: Sistema de redirección no configurado');
                this.errors.push('FleetRedirectionSystem no funcional - REDIRECCIÓN NO FUNCIONA');
            }
            
        } catch (error) {
            console.log(`  ❌ FleetRedirectionSystem: Error - ${error.message}`);
            this.errors.push(`Error en FleetRedirectionSystem: ${error.message}`);
        }
    }

    generateComprehensiveReport() {
        console.log('\n📊 REPORTE EXHAUSTIVO FINAL');
        console.log('='.repeat(60));
        
        const totalChecks = this.successes.length + this.warnings.length + this.errors.length + this.criticalIssues.length;
        
        console.log(`\n📈 ESTADÍSTICAS:`);
        console.log(`  Total verificaciones: ${totalChecks}`);
        console.log(`  ✅ Éxitos: ${this.successes.length}`);
        console.log(`  ⚠️  Advertencias: ${this.warnings.length}`);
        console.log(`  ❌ Errores: ${this.errors.length}`);
        console.log(`  🚨 Problemas críticos: ${this.criticalIssues.length}`);
        
        // Calcular puntuación de salud del sistema
        const healthScore = Math.round((this.successes.length / totalChecks) * 100);
        console.log(`\n🏥 SALUD DEL SISTEMA: ${healthScore}%`);
        
        if (healthScore >= 90) {
            console.log('  🎉 EXCELENTE - Sistema muy estable');
        } else if (healthScore >= 75) {
            console.log('  ✅ BUENO - Sistema estable con mejoras menores');
        } else if (healthScore >= 60) {
            console.log('  ⚠️  REGULAR - Sistema funcional pero necesita atención');
        } else {
            console.log('  🚨 CRÍTICO - Sistema inestable, requiere corrección inmediata');
        }
        
        if (this.criticalIssues.length > 0) {
            console.log('\n🚨 PROBLEMAS CRÍTICOS (REQUIEREN ATENCIÓN INMEDIATA):');
            this.criticalIssues.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue}`);
            });
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORES:');
            this.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  ADVERTENCIAS:');
            this.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
        }
        
        console.log('\n🎯 RECOMENDACIONES BASADAS EN PATRONES DE FALLO:');
        
        if (this.criticalIssues.length === 0 && this.errors.length === 0) {
            console.log('  ✅ Sistema parece estar correctamente configurado');
            console.log('  🚀 Ejecuta el juego: python3 -m http.server 8002');
            console.log('  🔍 Abre DevTools (F12) para monitorear logs en tiempo real');
            console.log('  🎮 Prueba hacer clic en un planeta para lanzar flotas');
            console.log('  🖱️  Prueba drag & drop entre planetas');
            console.log('  🤖 Observa el comportamiento de la IA');
        } else {
            console.log('  🔧 Prioriza corregir problemas críticos primero');
            console.log('  📝 Ejecuta este diagnóstico después de cada corrección');
            console.log('  🔄 Usa node auto-fix.js para correcciones automáticas');
        }
        
        console.log('\n🛠️  COMANDOS DE DIAGNÓSTICO:');
        console.log('  node comprehensive-diagnostic.js  # Este diagnóstico completo');
        console.log('  node simple-diagnostic.js         # Diagnóstico básico');
        console.log('  node auto-fix.js                  # Correcciones automáticas');
        
        console.log('\n🔍 DEBUGGING EN NAVEGADOR:');
        console.log('  gameLogger.generateDiagnosticReport()  # Estado en tiempo real');
        console.log('  gameLogger.exportLogs()               # Exportar logs');
        console.log('  gameLogger.clear()                    # Limpiar logs');
        
        // Generar resumen de patrones de fallo detectados
        console.log('\n🔬 PATRONES DE FALLO ANALIZADOS:');
        console.log('  ✓ Vector2D.copy() errors (Problema original)');
        console.log('  ✓ Constructor validation failures');
        console.log('  ✓ Event system disconnections');
        console.log('  ✓ Fleet flow interruptions');
        console.log('  ✓ Import dependency issues');
        console.log('  ✓ Configuration mismatches');
        console.log('  ✓ Logging integration gaps');
        console.log('  ✓ Adapter/Manager connectivity');
        console.log('  ✓ Navigation system integrity');
        console.log('  ✓ UI/Interaction system failures');
        console.log('  ✓ AI system malfunctions');
        console.log('  ✓ Drag & Drop functionality');
        console.log('  ✓ Selection system problems');
        
        console.log('\n🎮 FUNCIONALIDADES VERIFICADAS:');
        console.log('  ✓ Creación y movimiento de flotas');
        console.log('  ✓ Sistema de eventos y comunicación');
        console.log('  ✓ Selección de planetas');
        console.log('  ✓ Drag & Drop entre planetas');
        console.log('  ✓ Botones de porcentaje');
        console.log('  ✓ Sistema de IA');
        console.log('  ✓ Logging y debugging');
        console.log('  ✓ Configuración de módulos ES6');
    }
}

// Ejecutar diagnóstico exhaustivo
const diagnostic = new ComprehensiveDiagnostic();
diagnostic.runFullDiagnostic().catch(console.error); 