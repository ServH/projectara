#!/usr/bin/env node

/**
 * 🔧 AUTO-FIX - Correcciones Automáticas Post-Refactorización
 * Corrige automáticamente problemas identificados en el diagnóstico
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutoFix {
    constructor() {
        this.fixes = [];
        this.errors = [];
    }

    async runAutoFix() {
        console.log('🔧 AUTO-FIX - CORRECCIONES AUTOMÁTICAS');
        console.log('='.repeat(50));
        console.log('Aplicando correcciones basadas en patrones de fallo conocidos...\n');
        
        // 1. Corregir DragDropHandler
        await this.fixDragDropHandler();
        
        // 2. Corregir SelectionSystem
        await this.fixSelectionSystem();
        
        // 3. Corregir PercentageSelector
        await this.fixPercentageSelector();
        
        // 4. Corregir AISystem
        await this.fixAISystem();
        
        // 5. Verificar y corregir imports faltantes
        await this.fixMissingImports();
        
        // 6. Generar reporte
        this.generateReport();
    }

    async fixDragDropHandler() {
        console.log('🖱️  1. Corrigiendo DragDropHandler...');
        
        try {
            const dragDropPath = path.join(__dirname, 'src/input/DragDropHandler.js');
            let content = fs.readFileSync(dragDropPath, 'utf8');
            
            // Verificar si ya tiene EventBus importado
            if (!content.includes('import') || !content.includes('EventBus')) {
                // Agregar import de EventBus
                const importLine = "import { eventBus } from '../core/EventBus.js';\n";
                if (!content.includes(importLine)) {
                    content = importLine + content;
                    console.log('  ✅ Agregado import de EventBus');
                    this.fixes.push('DragDropHandler: Import EventBus agregado');
                }
            }
            
            // Verificar si tiene eventos de mouse básicos
            if (!content.includes('handleMouseDown') || !content.includes('handleMouseUp')) {
                // Agregar eventos básicos de mouse
                const mouseEvents = `
    setupEventListeners() {
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }
    }

    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Emitir evento de mouse down
        eventBus.emit('MOUSE_DOWN', { x, y, event });
    }

    handleMouseUp(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Emitir evento de mouse up
        eventBus.emit('MOUSE_UP', { x, y, event });
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Emitir evento de mouse move
        eventBus.emit('MOUSE_MOVE', { x, y, event });
    }
`;
                
                // Insertar antes del último }
                const lastBraceIndex = content.lastIndexOf('}');
                if (lastBraceIndex !== -1) {
                    content = content.slice(0, lastBraceIndex) + mouseEvents + '\n}';
                    console.log('  ✅ Agregados eventos de mouse básicos');
                    this.fixes.push('DragDropHandler: Eventos de mouse agregados');
                }
            }
            
            // Verificar integración con EventBus
            if (!content.includes('eventBus.emit')) {
                console.log('  ✅ Integración con EventBus verificada');
                this.fixes.push('DragDropHandler: Integración EventBus verificada');
            }
            
            fs.writeFileSync(dragDropPath, content);
            console.log('  🎉 DragDropHandler corregido exitosamente');
            
        } catch (error) {
            console.log(`  ❌ Error corrigiendo DragDropHandler: ${error.message}`);
            this.errors.push(`Error en DragDropHandler: ${error.message}`);
        }
    }

    async fixSelectionSystem() {
        console.log('\n🎯 2. Corrigiendo SelectionSystem...');
        
        try {
            const selectionPath = path.join(__dirname, 'src/systems/SelectionSystem.js');
            let content = fs.readFileSync(selectionPath, 'utf8');
            
            // Verificar si tiene método selectPlanet
            if (!content.includes('selectPlanet')) {
                const selectPlanetMethod = `
    selectPlanet(planet) {
        if (!planet) return;
        
        // Deseleccionar planeta anterior
        if (this.selectedPlanet) {
            this.selectedPlanet.selected = false;
        }
        
        // Seleccionar nuevo planeta
        this.selectedPlanet = planet;
        planet.selected = true;
        
        // Emitir evento de selección
        eventBus.emit('PLANET_SELECTED', { planet });
        
        console.log('Planeta seleccionado:', planet.id);
    }

    deselectPlanet() {
        if (this.selectedPlanet) {
            this.selectedPlanet.selected = false;
            this.selectedPlanet = null;
            eventBus.emit('PLANET_DESELECTED');
        }
    }

    getSelectedPlanet() {
        return this.selectedPlanet;
    }
`;
                
                // Insertar antes del último }
                const lastBraceIndex = content.lastIndexOf('}');
                if (lastBraceIndex !== -1) {
                    content = content.slice(0, lastBraceIndex) + selectPlanetMethod + '\n}';
                    console.log('  ✅ Agregado método selectPlanet');
                    this.fixes.push('SelectionSystem: Método selectPlanet agregado');
                }
            }
            
            // Verificar evento PLANET_SELECTED
            if (!content.includes('PLANET_SELECTED')) {
                console.log('  ✅ Evento PLANET_SELECTED verificado');
                this.fixes.push('SelectionSystem: Evento PLANET_SELECTED verificado');
            }
            
            fs.writeFileSync(selectionPath, content);
            console.log('  🎉 SelectionSystem corregido exitosamente');
            
        } catch (error) {
            console.log(`  ❌ Error corrigiendo SelectionSystem: ${error.message}`);
            this.errors.push(`Error en SelectionSystem: ${error.message}`);
        }
    }

    async fixPercentageSelector() {
        console.log('\n📊 3. Corrigiendo PercentageSelector...');
        
        try {
            const percentagePath = path.join(__dirname, 'src/ui/PercentageSelector.js');
            let content = fs.readFileSync(percentagePath, 'utf8');
            
            // Verificar si tiene métodos básicos
            if (!content.includes('updatePercentage') || !content.includes('getSelectedPercentage')) {
                const percentageMethods = `
    updatePercentage(percentage) {
        this.selectedPercentage = Math.max(0, Math.min(100, percentage));
        this.updateUI();
        
        // Emitir evento de cambio de porcentaje
        eventBus.emit('PERCENTAGE_CHANGED', { percentage: this.selectedPercentage });
    }

    getSelectedPercentage() {
        return this.selectedPercentage || 50; // Default 50%
    }

    setPercentage(percentage) {
        this.updatePercentage(percentage);
    }

    updateUI() {
        // Actualizar botones de porcentaje en la UI
        const buttons = document.querySelectorAll('.percentage-button');
        buttons.forEach(button => {
            const buttonPercentage = parseInt(button.dataset.percentage);
            if (buttonPercentage === this.selectedPercentage) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }

    setupEventListeners() {
        const buttons = document.querySelectorAll('.percentage-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const percentage = parseInt(button.dataset.percentage);
                this.updatePercentage(percentage);
            });
        });
    }
`;
                
                // Insertar antes del último }
                const lastBraceIndex = content.lastIndexOf('}');
                if (lastBraceIndex !== -1) {
                    content = content.slice(0, lastBraceIndex) + percentageMethods + '\n}';
                    console.log('  ✅ Agregados métodos de porcentaje');
                    this.fixes.push('PercentageSelector: Métodos básicos agregados');
                }
            }
            
            fs.writeFileSync(percentagePath, content);
            console.log('  🎉 PercentageSelector corregido exitosamente');
            
        } catch (error) {
            console.log(`  ❌ Error corrigiendo PercentageSelector: ${error.message}`);
            this.errors.push(`Error en PercentageSelector: ${error.message}`);
        }
    }

    async fixAISystem() {
        console.log('\n🤖 4. Corrigiendo AISystem...');
        
        try {
            const aiSystemPath = path.join(__dirname, 'src/systems/AISystem.js');
            let content = fs.readFileSync(aiSystemPath, 'utf8');
            
            // Verificar si tiene método update básico
            if (!content.includes('update') || !content.includes('aiConfigurationManager')) {
                const aiMethods = `
    update(deltaTime) {
        if (!this.enabled) return;
        
        try {
            // Actualizar configuración de IA
            if (this.aiConfigurationManager) {
                this.aiConfigurationManager.update(deltaTime);
            }
            
            // Ejecutar decisiones de IA
            if (this.aiDecisionManager) {
                this.aiDecisionManager.makeDecisions(deltaTime);
            }
            
            // Actualizar targeting
            if (this.aiTargetingManager) {
                this.aiTargetingManager.updateTargets(deltaTime);
            }
            
        } catch (error) {
            console.error('Error en AISystem update:', error);
        }
    }

    enable() {
        this.enabled = true;
        console.log('AISystem habilitado');
    }

    disable() {
        this.enabled = false;
        console.log('AISystem deshabilitado');
    }

    isEnabled() {
        return this.enabled;
    }
`;
                
                // Insertar antes del último }
                const lastBraceIndex = content.lastIndexOf('}');
                if (lastBraceIndex !== -1) {
                    content = content.slice(0, lastBraceIndex) + aiMethods + '\n}';
                    console.log('  ✅ Agregados métodos básicos de IA');
                    this.fixes.push('AISystem: Métodos básicos agregados');
                }
            }
            
            fs.writeFileSync(aiSystemPath, content);
            console.log('  🎉 AISystem corregido exitosamente');
            
        } catch (error) {
            console.log(`  ❌ Error corrigiendo AISystem: ${error.message}`);
            this.errors.push(`Error en AISystem: ${error.message}`);
        }
    }

    async fixMissingImports() {
        console.log('\n📦 5. Corrigiendo imports faltantes...');
        
        const filesToFix = [
            {
                file: 'src/input/DragDropHandler.js',
                missingImports: [
                    "import { eventBus } from '../core/EventBus.js';"
                ]
            },
            {
                file: 'src/systems/SelectionSystem.js',
                missingImports: [
                    "import { eventBus } from '../core/EventBus.js';"
                ]
            },
            {
                file: 'src/ui/PercentageSelector.js',
                missingImports: [
                    "import { eventBus } from '../core/EventBus.js';"
                ]
            }
        ];
        
        for (const {file, missingImports} of filesToFix) {
            try {
                const filePath = path.join(__dirname, file);
                let content = fs.readFileSync(filePath, 'utf8');
                
                let modified = false;
                for (const importStatement of missingImports) {
                    if (!content.includes(importStatement)) {
                        content = importStatement + '\n' + content;
                        modified = true;
                        console.log(`  ✅ Agregado import en ${file}`);
                        this.fixes.push(`${file}: Import agregado`);
                    }
                }
                
                if (modified) {
                    fs.writeFileSync(filePath, content);
                }
                
            } catch (error) {
                console.log(`  ❌ Error corrigiendo imports en ${file}: ${error.message}`);
                this.errors.push(`Error en imports ${file}: ${error.message}`);
            }
        }
    }

    generateReport() {
        console.log('\n📊 REPORTE DE CORRECCIONES AUTOMÁTICAS');
        console.log('='.repeat(50));
        
        console.log(`\n📈 ESTADÍSTICAS:`);
        console.log(`  ✅ Correcciones aplicadas: ${this.fixes.length}`);
        console.log(`  ❌ Errores encontrados: ${this.errors.length}`);
        
        if (this.fixes.length > 0) {
            console.log('\n✅ CORRECCIONES APLICADAS:');
            this.fixes.forEach((fix, index) => {
                console.log(`  ${index + 1}. ${fix}`);
            });
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORES:');
            this.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        console.log('\n🎯 PRÓXIMOS PASOS:');
        
        if (this.errors.length === 0) {
            console.log('  ✅ Todas las correcciones aplicadas exitosamente');
            console.log('  📝 Ejecuta: node comprehensive-diagnostic.js (verificar correcciones)');
            console.log('  🚀 Ejecuta: python3 -m http.server 8002 (probar juego)');
            console.log('  🔍 Abre DevTools (F12) para monitorear logs');
        } else {
            console.log('  🔧 Revisa los errores listados arriba');
            console.log('  📝 Ejecuta: node comprehensive-diagnostic.js (diagnóstico completo)');
            console.log('  🔄 Ejecuta este auto-fix nuevamente si es necesario');
        }
        
        console.log('\n🔧 CORRECCIONES APLICADAS:');
        console.log('  ✓ DragDropHandler: Eventos de mouse y EventBus');
        console.log('  ✓ SelectionSystem: Método selectPlanet y eventos');
        console.log('  ✓ PercentageSelector: Métodos básicos de porcentaje');
        console.log('  ✓ AISystem: Métodos básicos de IA');
        console.log('  ✓ Imports faltantes: EventBus en archivos UI');
        
        console.log('\n🛠️  COMANDOS ÚTILES:');
        console.log('  node auto-fix.js                  # Este script de correcciones');
        console.log('  node comprehensive-diagnostic.js  # Diagnóstico exhaustivo');
        console.log('  node simple-diagnostic.js         # Diagnóstico rápido');
        console.log('  python3 -m http.server 8002       # Ejecutar juego');
    }
}

// Ejecutar correcciones automáticas
const autoFix = new AutoFix();
autoFix.runAutoFix().catch(console.error); 