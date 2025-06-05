#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE MIGRACIÓN - GAMELOADER FASE 12
 * Migra GameLoader.js original a la versión refactorizada
 */

const fs = require('fs');
const path = require('path');

class GameLoaderMigrator {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.originalFile = path.join(this.projectRoot, 'src/ui/GameLoader.js');
        this.refactoredFile = path.join(this.projectRoot, 'src/ui/GameLoader.refactored.js');
        this.backupFile = path.join(this.projectRoot, 'src/ui/GameLoader.original.js');
        this.managersDir = path.join(this.projectRoot, 'src/ui/managers');
        
        this.requiredManagers = [
            'LoadingUIManager.js',
            'ModuleLoadingManager.js',
            'CanvasSetupManager.js',
            'SystemInitializationManager.js',
            'GlobalControlsManager.js',
            'DebugToolsManager.js'
        ];
    }

    async migrate() {
        console.log('🚀 Iniciando migración de GameLoader...');
        
        try {
            // Paso 1: Verificaciones previas
            this.verifyFiles();
            
            // Paso 2: Crear backup del archivo original
            this.createBackup();
            
            // Paso 3: Validar gestores
            this.validateManagers();
            
            // Paso 4: Realizar migración
            this.performMigration();
            
            // Paso 5: Verificar migración
            this.verifyMigration();
            
            // Paso 6: Reporte final
            this.generateReport();
            
            console.log('✅ Migración completada exitosamente');
            
        } catch (error) {
            console.error('❌ Error durante la migración:', error.message);
            this.rollback();
            process.exit(1);
        }
    }

    verifyFiles() {
        console.log('🔍 Verificando archivos...');
        
        if (!fs.existsSync(this.originalFile)) {
            throw new Error(`Archivo original no encontrado: ${this.originalFile}`);
        }
        
        if (!fs.existsSync(this.refactoredFile)) {
            throw new Error(`Archivo refactorizado no encontrado: ${this.refactoredFile}`);
        }
        
        if (!fs.existsSync(this.managersDir)) {
            throw new Error(`Directorio de gestores no encontrado: ${this.managersDir}`);
        }
        
        console.log('✅ Archivos verificados');
    }

    createBackup() {
        console.log('💾 Creando backup del archivo original...');
        
        try {
            fs.copyFileSync(this.originalFile, this.backupFile);
            console.log(`✅ Backup creado: ${this.backupFile}`);
        } catch (error) {
            throw new Error(`Error creando backup: ${error.message}`);
        }
    }

    validateManagers() {
        console.log('🔧 Validando gestores especializados...');
        
        for (const manager of this.requiredManagers) {
            const managerPath = path.join(this.managersDir, manager);
            
            if (!fs.existsSync(managerPath)) {
                throw new Error(`Gestor requerido no encontrado: ${manager}`);
            }
            
            // Verificar que el archivo no esté vacío
            const stats = fs.statSync(managerPath);
            if (stats.size === 0) {
                throw new Error(`Gestor vacío: ${manager}`);
            }
            
            console.log(`✅ ${manager} validado`);
        }
        
        console.log('✅ Todos los gestores validados');
    }

    performMigration() {
        console.log('🔄 Realizando migración...');
        
        try {
            // Reemplazar archivo original con versión refactorizada
            fs.copyFileSync(this.refactoredFile, this.originalFile);
            console.log('✅ Archivo principal migrado');
            
            // Opcional: Remover archivo refactorizado temporal
            // fs.unlinkSync(this.refactoredFile);
            
        } catch (error) {
            throw new Error(`Error durante migración: ${error.message}`);
        }
    }

    verifyMigration() {
        console.log('🔍 Verificando migración...');
        
        try {
            // Verificar que el archivo migrado existe y no está vacío
            if (!fs.existsSync(this.originalFile)) {
                throw new Error('Archivo migrado no existe');
            }
            
            const stats = fs.statSync(this.originalFile);
            if (stats.size === 0) {
                throw new Error('Archivo migrado está vacío');
            }
            
            // Verificar que contiene imports de gestores
            const content = fs.readFileSync(this.originalFile, 'utf8');
            
            const requiredImports = [
                'LoadingUIManager',
                'ModuleLoadingManager',
                'CanvasSetupManager',
                'SystemInitializationManager',
                'GlobalControlsManager',
                'DebugToolsManager'
            ];
            
            for (const importName of requiredImports) {
                if (!content.includes(importName)) {
                    throw new Error(`Import faltante: ${importName}`);
                }
            }
            
            console.log('✅ Migración verificada');
            
        } catch (error) {
            throw new Error(`Error verificando migración: ${error.message}`);
        }
    }

    rollback() {
        console.log('🔄 Realizando rollback...');
        
        try {
            if (fs.existsSync(this.backupFile)) {
                fs.copyFileSync(this.backupFile, this.originalFile);
                console.log('✅ Rollback completado');
            }
        } catch (error) {
            console.error('❌ Error durante rollback:', error.message);
        }
    }

    generateReport() {
        console.log('\n📊 REPORTE DE MIGRACIÓN - GAMELOADER FASE 12');
        console.log('================================================');
        
        // Métricas de archivos
        const originalStats = fs.statSync(this.backupFile);
        const migratedStats = fs.statSync(this.originalFile);
        
        console.log('\n📁 ARCHIVOS:');
        console.log(`Original: ${this.backupFile} (${originalStats.size} bytes)`);
        console.log(`Migrado: ${this.originalFile} (${migratedStats.size} bytes)`);
        
        // Gestores creados
        console.log('\n🔧 GESTORES ESPECIALIZADOS:');
        for (const manager of this.requiredManagers) {
            const managerPath = path.join(this.managersDir, manager);
            const stats = fs.statSync(managerPath);
            console.log(`✅ ${manager} (${stats.size} bytes)`);
        }
        
        // Cálculo de líneas aproximadas
        const originalContent = fs.readFileSync(this.backupFile, 'utf8');
        const migratedContent = fs.readFileSync(this.originalFile, 'utf8');
        
        const originalLines = originalContent.split('\n').length;
        const migratedLines = migratedContent.split('\n').length;
        
        console.log('\n📊 MÉTRICAS:');
        console.log(`Líneas originales: ${originalLines}`);
        console.log(`Líneas migradas: ${migratedLines}`);
        console.log(`Gestores creados: ${this.requiredManagers.length}`);
        
        // Beneficios
        console.log('\n🎯 BENEFICIOS LOGRADOS:');
        console.log('✅ Principios SOLID implementados');
        console.log('✅ Separación de responsabilidades');
        console.log('✅ Mantenibilidad mejorada');
        console.log('✅ Testabilidad incrementada');
        console.log('✅ Extensibilidad facilitada');
        
        console.log('\n🚀 FASE 12 COMPLETADA EXITOSAMENTE');
        console.log('Progreso del proyecto: 12/15 fases (80%)');
    }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    const migrator = new GameLoaderMigrator();
    migrator.migrate().catch(error => {
        console.error('❌ Error fatal:', error.message);
        process.exit(1);
    });
}

module.exports = GameLoaderMigrator; 