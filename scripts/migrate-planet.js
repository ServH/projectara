#!/usr/bin/env node

/**
 * 🔄 MIGRACIÓN DE PLANET.JS
 * Script para migrar de Planet.js original a Planet.refactored.js
 * Incluye backup automático y validación de migración
 */

const fs = require('fs');
const path = require('path');

class PlanetMigrator {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.originalFile = path.join(this.projectRoot, 'src/entities/Planet.js');
        this.refactoredFile = path.join(this.projectRoot, 'src/entities/Planet.refactored.js');
        this.backupFile = path.join(this.projectRoot, 'src/entities/Planet.original.js');
    }

    /**
     * Ejecutar migración completa
     */
    async migrate() {
        console.log('🚀 INICIANDO MIGRACIÓN DE PLANET.JS');
        console.log('=====================================');

        try {
            // 1. Validar archivos
            this.validateFiles();

            // 2. Crear backup
            this.createBackup();

            // 3. Reemplazar archivo
            this.replaceFile();

            // 4. Validar migración
            this.validateMigration();

            console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
            console.log('=====================================');
            console.log('📁 Backup creado en: Planet.original.js');
            console.log('🔄 Planet.js ahora usa la versión refactorizada');
            console.log('🧪 Ejecuta las pruebas para validar funcionalidad');

        } catch (error) {
            console.error('❌ ERROR EN LA MIGRACIÓN:', error.message);
            this.rollback();
            process.exit(1);
        }
    }

    /**
     * Validar que los archivos existen
     */
    validateFiles() {
        console.log('🔍 Validando archivos...');

        if (!fs.existsSync(this.originalFile)) {
            throw new Error(`Archivo original no encontrado: ${this.originalFile}`);
        }

        if (!fs.existsSync(this.refactoredFile)) {
            throw new Error(`Archivo refactorizado no encontrado: ${this.refactoredFile}`);
        }

        console.log('✅ Archivos validados');
    }

    /**
     * Crear backup del archivo original
     */
    createBackup() {
        console.log('💾 Creando backup...');

        try {
            fs.copyFileSync(this.originalFile, this.backupFile);
            console.log('✅ Backup creado exitosamente');
        } catch (error) {
            throw new Error(`Error creando backup: ${error.message}`);
        }
    }

    /**
     * Reemplazar archivo original con versión refactorizada
     */
    replaceFile() {
        console.log('🔄 Reemplazando archivo...');

        try {
            fs.copyFileSync(this.refactoredFile, this.originalFile);
            console.log('✅ Archivo reemplazado exitosamente');
        } catch (error) {
            throw new Error(`Error reemplazando archivo: ${error.message}`);
        }
    }

    /**
     * Validar que la migración fue exitosa
     */
    validateMigration() {
        console.log('🧪 Validando migración...');

        try {
            // Verificar que el archivo existe y tiene contenido
            const stats = fs.statSync(this.originalFile);
            if (stats.size === 0) {
                throw new Error('El archivo migrado está vacío');
            }

            // Verificar que contiene la clase Planet refactorizada
            const content = fs.readFileSync(this.originalFile, 'utf8');
            if (!content.includes('PLANET REFACTORED')) {
                throw new Error('El archivo no contiene la versión refactorizada');
            }

            if (!content.includes('ProductionManager')) {
                throw new Error('El archivo no contiene ProductionManager');
            }

            if (!content.includes('BattleManager')) {
                throw new Error('El archivo no contiene BattleManager');
            }

            if (!content.includes('FleetLaunchManager')) {
                throw new Error('El archivo no contiene FleetLaunchManager');
            }

            if (!content.includes('PlanetConfigFactory')) {
                throw new Error('El archivo no contiene PlanetConfigFactory');
            }

            console.log('✅ Migración validada');
        } catch (error) {
            throw new Error(`Error validando migración: ${error.message}`);
        }
    }

    /**
     * Rollback en caso de error
     */
    rollback() {
        console.log('🔙 Ejecutando rollback...');

        try {
            if (fs.existsSync(this.backupFile)) {
                fs.copyFileSync(this.backupFile, this.originalFile);
                console.log('✅ Rollback completado');
            }
        } catch (error) {
            console.error('❌ Error en rollback:', error.message);
        }
    }

    /**
     * Mostrar información de la migración
     */
    showInfo() {
        console.log('📊 INFORMACIÓN DE LA MIGRACIÓN');
        console.log('===============================');

        try {
            const originalStats = fs.statSync(this.backupFile);
            const refactoredStats = fs.statSync(this.originalFile);

            console.log(`📁 Archivo original: ${(originalStats.size / 1024).toFixed(2)} KB`);
            console.log(`📁 Archivo refactorizado: ${(refactoredStats.size / 1024).toFixed(2)} KB`);
            
            const reduction = ((originalStats.size - refactoredStats.size) / originalStats.size) * 100;
            if (reduction > 0) {
                console.log(`📉 Reducción de tamaño: ${reduction.toFixed(1)}%`);
            } else {
                console.log(`📈 Incremento de tamaño: ${Math.abs(reduction).toFixed(1)}%`);
            }

            // Mostrar mejoras arquitectónicas
            console.log('\n🏗️ MEJORAS ARQUITECTÓNICAS:');
            console.log('- ✅ ProductionManager: Gestión de producción separada');
            console.log('- ✅ BattleManager: Sistema de combate modular');
            console.log('- ✅ FleetLaunchManager: Lanzamiento de flotas especializado');
            console.log('- ✅ PlanetConfigFactory: Configuración centralizada');
            console.log('- ✅ Responsabilidad única aplicada');
            console.log('- ✅ Dependency Injection implementada');

        } catch (error) {
            console.log('ℹ️  No se pudo calcular estadísticas de archivos');
        }
    }

    /**
     * Verificar dependencias
     */
    checkDependencies() {
        console.log('🔍 Verificando dependencias...');

        const dependencies = [
            'src/entities/planet/ProductionManager.js',
            'src/entities/planet/BattleManager.js',
            'src/entities/planet/FleetLaunchManager.js',
            'src/entities/planet/PlanetConfigFactory.js'
        ];

        let allDependenciesExist = true;

        dependencies.forEach(dep => {
            const depPath = path.join(this.projectRoot, dep);
            if (!fs.existsSync(depPath)) {
                console.error(`❌ Dependencia faltante: ${dep}`);
                allDependenciesExist = false;
            } else {
                console.log(`✅ ${dep}`);
            }
        });

        if (!allDependenciesExist) {
            throw new Error('Faltan dependencias requeridas para la migración');
        }

        console.log('✅ Todas las dependencias están disponibles');
    }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    const migrator = new PlanetMigrator();
    
    migrator.migrate().then(() => {
        migrator.showInfo();
    }).catch((error) => {
        console.error('❌ Migración fallida:', error.message);
        process.exit(1);
    });
}

module.exports = PlanetMigrator; 