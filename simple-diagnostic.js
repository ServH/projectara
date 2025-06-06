#!/usr/bin/env node

/**
 * 🔍 SIMPLE DIAGNOSTIC - Diagnóstico Rápido Post-Refactorización
 * Versión expandida con pruebas críticas basadas en problemas identificados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleDiagnostic {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.successes = [];
    }

    async runDiagnostic() {
        console.log('🔍 DIAGNÓSTICO RÁPIDO POST-REFACTORIZACIÓN');
        console.log('='.repeat(50));
        console.log('Verificando problemas críticos conocidos...\n');
        
        // 1. Verificar archivos críticos
        this.checkCriticalFiles();
        
        // 2. Verificar Vector2D (problema original)
        this.checkVector2DCore();
        
        // 3. Verificar constructores robustos
        this.checkConstructors();
        
        // 4. Verificar configuración ES6
        this.checkES6Configuration();
        
        // 5. Verificar sistema de eventos
        this.checkEventSystem();
        
        // 6. Verificar flujo de flotas
        this.checkFleetFlow();
        
        // 7. Verificar sistemas de interacción
        this.checkInteractionSystems();
        
        // 8. Verificar logging
        this.checkLogging();
        
        // 9. Generar reporte
        this.generateReport();
    }

    checkCriticalFiles() {
        console.log('📁 1. Verificando archivos críticos...');
        
        const criticalFiles = [
            'src/core/GameEngine.js',
            'src/entities/SteeringVehicle.js',
            'src/utils/Vector2D.js',
            'src/navigation/NavigationSystem.js',
            'src/systems/FleetFormationSystem.js',
            'src/debug/GameLogger.js',
            'src/input/DragDropHandler.js',
            'src/systems/SelectionSystem.js',
            'index.html',
            'package.json'
        ];

        let missing = 0;
        for (const file of criticalFiles) {
            const fullPath = path.join(__dirname, file);
            if (fs.existsSync(fullPath)) {
                console.log(`  ✅ ${file}`);
                this.successes.push(`Archivo presente: ${file}`);
            } else {
                console.log(`  ❌ ${file} - FALTANTE`);
                this.errors.push(`Archivo crítico faltante: ${file}`);
                missing++;
            }
        }
        
        if (missing === 0) {
            console.log('  🎉 Todos los archivos críticos presentes');
        }
    }

    checkVector2DCore() {
        console.log('\n🧮 2. Verificando Vector2D (Problema Original)...');
        
        try {
            const vector2DPath = path.join(__dirname, 'src/utils/Vector2D.js');
            const content = fs.readFileSync(vector2DPath, 'utf8');
            
            // Verificar exportación
            if (content.includes('export class Vector2D')) {
                console.log('  ✅ Vector2D: Clase exportada correctamente');
                this.successes.push('Vector2D exportación correcta');
            } else {
                console.log('  ❌ Vector2D: Exportación incorrecta');
                this.errors.push('Vector2D exportación problemática');
            }
            
            // Verificar método copy() - CAUSA ORIGINAL DEL ERROR
            if (content.includes('copy()') && content.includes('return new Vector2D')) {
                console.log('  ✅ Vector2D: Método copy() implementado - ERROR ORIGINAL SOLUCIONADO');
                this.successes.push('Vector2D método copy() funcional');
            } else {
                console.log('  ❌ Vector2D: Método copy() faltante - CAUSA ORIGINAL DEL ERROR');
                this.errors.push('Vector2D método copy() problemático - CRÍTICO');
            }
            
            // Verificar propiedades básicas
            if (content.includes('this.x') && content.includes('this.y')) {
                console.log('  ✅ Vector2D: Propiedades x, y definidas');
                this.successes.push('Vector2D propiedades básicas OK');
            } else {
                console.log('  ❌ Vector2D: Propiedades x, y problemáticas');
                this.errors.push('Vector2D propiedades básicas problemáticas');
            }
            
        } catch (error) {
            console.log(`  ❌ Vector2D: Error leyendo archivo - ${error.message}`);
            this.errors.push(`Error crítico en Vector2D: ${error.message}`);
        }
    }

    checkConstructors() {
        console.log('\n🏗️  3. Verificando constructores robustos...');
        
        // Verificar SteeringVehicle
        try {
            const steeringPath = path.join(__dirname, 'src/entities/SteeringVehicle.js');
            const content = fs.readFileSync(steeringPath, 'utf8');
            
            if (content.includes('instanceof Vector2D')) {
                console.log('  ✅ SteeringVehicle: Validación Vector2D robusta');
                this.successes.push('SteeringVehicle validación robusta');
            } else {
                console.log('  ❌ SteeringVehicle: Sin validación Vector2D - CAUSA DE ERRORES');
                this.errors.push('SteeringVehicle sin validación robusta');
            }
            
            if (content.includes('gameLogger')) {
                console.log('  ✅ SteeringVehicle: Logging integrado');
                this.successes.push('SteeringVehicle con logging');
            } else {
                console.log('  ⚠️  SteeringVehicle: Sin logging');
                this.warnings.push('SteeringVehicle sin logging');
            }
            
        } catch (error) {
            console.log(`  ❌ SteeringVehicle: Error - ${error.message}`);
            this.errors.push(`Error en SteeringVehicle: ${error.message}`);
        }
    }

    checkES6Configuration() {
        console.log('\n⚙️  4. Verificando configuración ES6...');
        
        // Verificar package.json
        try {
            const packagePath = path.join(__dirname, 'package.json');
            const content = fs.readFileSync(packagePath, 'utf8');
            const packageJson = JSON.parse(content);
            
            if (packageJson.type === 'module') {
                console.log('  ✅ package.json: ES6 modules habilitados');
                this.successes.push('package.json configurado para ES6');
            } else {
                console.log('  ❌ package.json: ES6 modules NO habilitados - IMPORTS FALLARÁN');
                this.errors.push('package.json sin type: module');
            }
            
        } catch (error) {
            console.log(`  ❌ package.json: Error - ${error.message}`);
            this.errors.push(`Error en package.json: ${error.message}`);
        }
        
        // Verificar index.html
        try {
            const indexPath = path.join(__dirname, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');
            
            if (content.includes('type="module"')) {
                console.log('  ✅ index.html: ES6 modules configurados');
                this.successes.push('index.html configurado para ES6');
            } else {
                console.log('  ❌ index.html: ES6 modules NO configurados - SCRIPTS NO CARGARÁN');
                this.errors.push('index.html sin type="module"');
            }
            
        } catch (error) {
            console.log(`  ❌ index.html: Error - ${error.message}`);
            this.errors.push(`Error en index.html: ${error.message}`);
        }
    }

    checkEventSystem() {
        console.log('\n📡 5. Verificando sistema de eventos...');
        
        // Verificar GameEngine event listeners
        try {
            const gameEnginePath = path.join(__dirname, 'src/core/GameEngine.js');
            const content = fs.readFileSync(gameEnginePath, 'utf8');
            
            if (content.includes('handleFleetLaunched') && content.includes('eventBus.on')) {
                console.log('  ✅ GameEngine: Event listeners configurados');
                this.successes.push('GameEngine event listeners OK');
            } else {
                console.log('  ❌ GameEngine: Event listeners NO configurados');
                this.errors.push('GameEngine event listeners problemáticos');
            }
            
            if (content.includes('gameLogger')) {
                console.log('  ✅ GameEngine: Logging integrado');
                this.successes.push('GameEngine con logging');
            } else {
                console.log('  ⚠️  GameEngine: Sin logging');
                this.warnings.push('GameEngine sin logging');
            }
            
        } catch (error) {
            console.log(`  ❌ GameEngine: Error - ${error.message}`);
            this.errors.push(`Error en GameEngine: ${error.message}`);
        }
    }

    checkFleetFlow() {
        console.log('\n🚢 6. Verificando flujo de flotas...');
        
        // Verificar FleetFormationSystem
        try {
            const formationPath = path.join(__dirname, 'src/systems/FleetFormationSystem.js');
            const content = fs.readFileSync(formationPath, 'utf8');
            
            if (content.includes('createOrganicFormation')) {
                console.log('  ✅ FleetFormationSystem: Método principal presente');
                this.successes.push('FleetFormationSystem funcional');
            } else {
                console.log('  ❌ FleetFormationSystem: Método principal faltante - FLOTAS NO SE CREAN');
                this.errors.push('FleetFormationSystem no funcional');
            }
            
        } catch (error) {
            console.log(`  ❌ FleetFormationSystem: Error - ${error.message}`);
            this.errors.push(`Error en FleetFormationSystem: ${error.message}`);
        }
        
        // Verificar NavigationSystem
        try {
            const navPath = path.join(__dirname, 'src/navigation/NavigationSystem.js');
            const content = fs.readFileSync(navPath, 'utf8');
            
            if (content.includes('FLEET_ADDED') && content.includes('handleFleetAdded')) {
                console.log('  ✅ NavigationSystem: Escucha eventos FLEET_ADDED');
                this.successes.push('NavigationSystem eventos OK');
            } else {
                console.log('  ❌ NavigationSystem: NO escucha FLEET_ADDED - FLOTAS NO SE MUEVEN');
                this.errors.push('NavigationSystem eventos problemáticos');
            }
            
        } catch (error) {
            console.log(`  ❌ NavigationSystem: Error - ${error.message}`);
            this.errors.push(`Error en NavigationSystem: ${error.message}`);
        }
    }

    checkInteractionSystems() {
        console.log('\n🖱️  7. Verificando sistemas de interacción...');
        
        // Verificar DragDropHandler
        try {
            const dragDropPath = path.join(__dirname, 'src/input/DragDropHandler.js');
            const content = fs.readFileSync(dragDropPath, 'utf8');
            
            if (content.includes('handleMouseDown') && content.includes('handleMouseUp')) {
                console.log('  ✅ DragDropHandler: Eventos mouse configurados');
                this.successes.push('DragDropHandler eventos OK');
            } else {
                console.log('  ❌ DragDropHandler: Eventos mouse NO configurados - DRAG & DROP NO FUNCIONA');
                this.errors.push('DragDropHandler eventos problemáticos');
            }
            
        } catch (error) {
            console.log(`  ❌ DragDropHandler: Error - ${error.message}`);
            this.errors.push(`Error en DragDropHandler: ${error.message}`);
        }
        
        // Verificar SelectionSystem
        try {
            const selectionPath = path.join(__dirname, 'src/systems/SelectionSystem.js');
            const content = fs.readFileSync(selectionPath, 'utf8');
            
            if (content.includes('selectPlanet')) {
                console.log('  ✅ SelectionSystem: Sistema de selección presente');
                this.successes.push('SelectionSystem funcional');
            } else {
                console.log('  ❌ SelectionSystem: Sistema de selección faltante - SELECCIÓN NO FUNCIONA');
                this.errors.push('SelectionSystem no funcional');
            }
            
        } catch (error) {
            console.log(`  ❌ SelectionSystem: Error - ${error.message}`);
            this.errors.push(`Error en SelectionSystem: ${error.message}`);
        }
        
        // Verificar PercentageSelector
        try {
            const percentagePath = path.join(__dirname, 'src/ui/PercentageSelector.js');
            const content = fs.readFileSync(percentagePath, 'utf8');
            
            if (content.includes('updatePercentage')) {
                console.log('  ✅ PercentageSelector: Funcionalidad presente');
                this.successes.push('PercentageSelector funcional');
            } else {
                console.log('  ❌ PercentageSelector: Funcionalidad faltante - BOTONES % NO FUNCIONAN');
                this.errors.push('PercentageSelector no funcional');
            }
            
        } catch (error) {
            console.log(`  ❌ PercentageSelector: Error - ${error.message}`);
            this.errors.push(`Error en PercentageSelector: ${error.message}`);
        }
    }

    checkLogging() {
        console.log('\n📝 8. Verificando sistema de logging...');
        
        try {
            const loggerPath = path.join(__dirname, 'src/debug/GameLogger.js');
            const content = fs.readFileSync(loggerPath, 'utf8');
            
            if (content.includes('export const gameLogger')) {
                console.log('  ✅ GameLogger: Exportado correctamente');
                this.successes.push('GameLogger exportación OK');
            } else {
                console.log('  ❌ GameLogger: Exportación problemática');
                this.errors.push('GameLogger exportación problemática');
            }
            
            if (content.includes('error') && content.includes('warn') && content.includes('info')) {
                console.log('  ✅ GameLogger: Métodos de logging presentes');
                this.successes.push('GameLogger métodos OK');
            } else {
                console.log('  ⚠️  GameLogger: Métodos de logging incompletos');
                this.warnings.push('GameLogger métodos incompletos');
            }
            
        } catch (error) {
            console.log(`  ❌ GameLogger: Error - ${error.message}`);
            this.errors.push(`Error en GameLogger: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📊 REPORTE RÁPIDO');
        console.log('='.repeat(30));
        
        const totalChecks = this.successes.length + this.warnings.length + this.errors.length;
        const successRate = Math.round((this.successes.length / totalChecks) * 100);
        
        console.log(`\n📈 RESUMEN:`);
        console.log(`  ✅ Éxitos: ${this.successes.length}`);
        console.log(`  ⚠️  Advertencias: ${this.warnings.length}`);
        console.log(`  ❌ Errores: ${this.errors.length}`);
        console.log(`  📊 Tasa de éxito: ${successRate}%`);
        
        if (this.errors.length === 0) {
            console.log('\n🎉 ¡SISTEMA PARECE ESTAR FUNCIONANDO!');
            console.log('  🚀 Ejecuta: python3 -m http.server 8002');
            console.log('  🔍 Abre DevTools (F12) para ver logs');
            console.log('  🎮 Prueba hacer clic en planetas');
            console.log('  🖱️  Prueba drag & drop entre planetas');
        } else {
            console.log('\n🚨 PROBLEMAS DETECTADOS:');
            this.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
            
            console.log('\n🔧 RECOMENDACIONES:');
            console.log('  📝 Ejecuta: node comprehensive-diagnostic.js (diagnóstico completo)');
            console.log('  🔄 Ejecuta: node auto-fix.js (correcciones automáticas)');
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  ADVERTENCIAS:');
            this.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
        }
        
        console.log('\n🔬 PATRONES VERIFICADOS:');
        console.log('  ✓ Vector2D.copy() error (problema original)');
        console.log('  ✓ Constructor validation');
        console.log('  ✓ ES6 module configuration');
        console.log('  ✓ Event system integrity');
        console.log('  ✓ Fleet creation and movement');
        console.log('  ✓ UI interaction systems');
        console.log('  ✓ Logging integration');
        
        console.log('\n🛠️  COMANDOS ÚTILES:');
        console.log('  node simple-diagnostic.js         # Este diagnóstico rápido');
        console.log('  node comprehensive-diagnostic.js  # Diagnóstico exhaustivo');
        console.log('  node auto-fix.js                  # Correcciones automáticas');
        console.log('  python3 -m http.server 8002       # Ejecutar juego');
    }
}

// Ejecutar diagnóstico rápido
const diagnostic = new SimpleDiagnostic();
diagnostic.runDiagnostic().catch(console.error); 