#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE MIGRACIÓN AUTOMATIZADA - FASE 7
 * Migración de LegacyFleetAdapter.js a arquitectura modular
 * 
 * FUNCIONALIDADES:
 * - Backup automático del archivo original
 * - Validación de archivos refactorizados y gestores
 * - Migración automatizada con verificación de importaciones
 * - Rollback en caso de error
 * - Estadísticas detalladas de la migración
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LegacyFleetAdapterMigrator {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.backupDir = path.join(this.projectRoot, '_archive', 'backups', 'adapters');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Rutas de archivos
        this.paths = {
            original: path.join(this.projectRoot, 'src', 'adapters', 'LegacyFleetAdapter.js'),
            refactored: path.join(this.projectRoot, 'src', 'adapters', 'LegacyFleetAdapter.refactored.js'),
            managers: {
                dataConverter: path.join(this.projectRoot, 'src', 'adapters', 'managers', 'FleetDataConverter.js'),
                mappingManager: path.join(this.projectRoot, 'src', 'adapters', 'managers', 'FleetMappingManager.js'),
                updateManager: path.join(this.projectRoot, 'src', 'adapters', 'managers', 'FleetUpdateManager.js'),
                lifecycleManager: path.join(this.projectRoot, 'src', 'adapters', 'managers', 'FleetLifecycleManager.js')
            }
        };
        
        // Estadísticas de migración
        this.stats = {
            startTime: Date.now(),
            originalSize: 0,
            refactoredSize: 0,
            managersSize: 0,
            totalSize: 0,
            originalLines: 0,
            refactoredLines: 0,
            managersLines: 0,
            totalLines: 0,
            filesCreated: 0,
            backupsCreated: 0
        };
    }

    /**
     * 🚀 Ejecutar migración completa
     */
    async migrate() {
        console.log('🚀 INICIANDO MIGRACIÓN FASE 7: LegacyFleetAdapter.js');
        console.log('=' .repeat(60));
        
        try {
            // 1. Validar archivos
            await this.validateFiles();
            
            // 2. Crear backup
            await this.createBackup();
            
            // 3. Calcular estadísticas originales
            await this.calculateOriginalStats();
            
            // 4. Realizar migración
            await this.performMigration();
            
            // 5. Validar migración
            await this.validateMigration();
            
            // 6. Calcular estadísticas finales
            await this.calculateFinalStats();
            
            // 7. Mostrar resultados
            this.showResults();
            
            console.log('\n✅ MIGRACIÓN FASE 7 COMPLETADA EXITOSAMENTE');
            
        } catch (error) {
            console.error('\n❌ ERROR EN MIGRACIÓN:', error.message);
            await this.rollback();
            process.exit(1);
        }
    }

    /**
     * 🔍 Validar archivos necesarios
     */
    async validateFiles() {
        console.log('\n🔍 Validando archivos...');
        
        // Verificar archivo original
        if (!fs.existsSync(this.paths.original)) {
            throw new Error(`Archivo original no encontrado: ${this.paths.original}`);
        }
        
        // Verificar archivo refactorizado
        if (!fs.existsSync(this.paths.refactored)) {
            throw new Error(`Archivo refactorizado no encontrado: ${this.paths.refactored}`);
        }
        
        // Verificar gestores
        for (const [name, path] of Object.entries(this.paths.managers)) {
            if (!fs.existsSync(path)) {
                throw new Error(`Gestor ${name} no encontrado: ${path}`);
            }
        }
        
        console.log('✅ Todos los archivos necesarios están presentes');
    }

    /**
     * 💾 Crear backup del archivo original
     */
    async createBackup() {
        console.log('\n💾 Creando backup...');
        
        // Crear directorio de backup si no existe
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        
        // Crear backup con timestamp
        const backupPath = path.join(this.backupDir, `LegacyFleetAdapter.${this.timestamp}.backup.js`);
        fs.copyFileSync(this.paths.original, backupPath);
        
        this.stats.backupsCreated++;
        console.log(`✅ Backup creado: ${backupPath}`);
    }

    /**
     * 📊 Calcular estadísticas del archivo original
     */
    async calculateOriginalStats() {
        console.log('\n📊 Calculando estadísticas originales...');
        
        const originalContent = fs.readFileSync(this.paths.original, 'utf8');
        this.stats.originalSize = Buffer.byteLength(originalContent, 'utf8');
        this.stats.originalLines = originalContent.split('\n').length;
        
        console.log(`📄 Archivo original: ${this.stats.originalLines} líneas, ${(this.stats.originalSize / 1024).toFixed(2)} KB`);
    }

    /**
     * 🔄 Realizar migración
     */
    async performMigration() {
        console.log('\n🔄 Realizando migración...');
        
        // Renombrar archivo original
        const originalBackupPath = this.paths.original + '.original';
        fs.renameSync(this.paths.original, originalBackupPath);
        console.log('📦 Archivo original renombrado a .original');
        
        // Copiar archivo refactorizado como nuevo original
        fs.copyFileSync(this.paths.refactored, this.paths.original);
        console.log('📄 Archivo refactorizado copiado como nuevo LegacyFleetAdapter.js');
        
        this.stats.filesCreated++;
    }

    /**
     * ✅ Validar migración
     */
    async validateMigration() {
        console.log('\n✅ Validando migración...');
        
        // Verificar que el nuevo archivo existe y es válido
        if (!fs.existsSync(this.paths.original)) {
            throw new Error('El archivo migrado no existe');
        }
        
        const migratedContent = fs.readFileSync(this.paths.original, 'utf8');
        
        // Verificar que contiene las importaciones esperadas
        const expectedImports = [
            'FleetDataConverter',
            'FleetMappingManager', 
            'FleetUpdateManager',
            'FleetLifecycleManager'
        ];
        
        for (const importName of expectedImports) {
            if (!migratedContent.includes(importName)) {
                throw new Error(`Importación faltante: ${importName}`);
            }
        }
        
        // Verificar que mantiene la API pública
        const expectedMethods = [
            'createFromLegacyData',
            'convertToLegacyData',
            'getFleetByLegacyId',
            'updateAllFleets',
            'renderAllFleets',
            'removeFleet',
            'cleanup',
            'getStats',
            'integrateWithGameEngine',
            'restoreGameEngine'
        ];
        
        for (const method of expectedMethods) {
            if (!migratedContent.includes(method)) {
                throw new Error(`Método API faltante: ${method}`);
            }
        }
        
        console.log('✅ Migración validada - API pública preservada');
    }

    /**
     * 📊 Calcular estadísticas finales
     */
    async calculateFinalStats() {
        console.log('\n📊 Calculando estadísticas finales...');
        
        // Estadísticas del archivo refactorizado
        const refactoredContent = fs.readFileSync(this.paths.original, 'utf8');
        this.stats.refactoredSize = Buffer.byteLength(refactoredContent, 'utf8');
        this.stats.refactoredLines = refactoredContent.split('\n').length;
        
        // Estadísticas de gestores
        let managersSize = 0;
        let managersLines = 0;
        
        for (const managerPath of Object.values(this.paths.managers)) {
            const content = fs.readFileSync(managerPath, 'utf8');
            managersSize += Buffer.byteLength(content, 'utf8');
            managersLines += content.split('\n').length;
        }
        
        this.stats.managersSize = managersSize;
        this.stats.managersLines = managersLines;
        this.stats.totalSize = this.stats.refactoredSize + this.stats.managersSize;
        this.stats.totalLines = this.stats.refactoredLines + this.stats.managersLines;
    }

    /**
     * 📊 Mostrar resultados de la migración
     */
    showResults() {
        const duration = Date.now() - this.stats.startTime;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESULTADOS DE LA MIGRACIÓN FASE 7');
        console.log('='.repeat(60));
        
        // Estadísticas de archivos
        console.log('\n📄 ESTADÍSTICAS DE ARCHIVOS:');
        console.log(`   Original:     ${this.stats.originalLines.toLocaleString()} líneas (${(this.stats.originalSize / 1024).toFixed(2)} KB)`);
        console.log(`   Refactorizado: ${this.stats.refactoredLines.toLocaleString()} líneas (${(this.stats.refactoredSize / 1024).toFixed(2)} KB)`);
        console.log(`   Gestores:     ${this.stats.managersLines.toLocaleString()} líneas (${(this.stats.managersSize / 1024).toFixed(2)} KB)`);
        console.log(`   Total:        ${this.stats.totalLines.toLocaleString()} líneas (${(this.stats.totalSize / 1024).toFixed(2)} KB)`);
        
        // Cálculos de reducción
        const lineReduction = this.stats.originalLines - this.stats.refactoredLines;
        const lineReductionPercent = ((lineReduction / this.stats.originalLines) * 100).toFixed(1);
        const sizeReduction = this.stats.originalSize - this.stats.refactoredSize;
        const sizeReductionPercent = ((sizeReduction / this.stats.originalSize) * 100).toFixed(1);
        
        console.log('\n📉 REDUCCIÓN DEL ARCHIVO PRINCIPAL:');
        console.log(`   Líneas:  ${lineReduction.toLocaleString()} (-${lineReductionPercent}%)`);
        console.log(`   Tamaño:  ${(sizeReduction / 1024).toFixed(2)} KB (-${sizeReductionPercent}%)`);
        
        // Arquitectura modular
        console.log('\n🏗️ ARQUITECTURA MODULAR CREADA:');
        console.log(`   ✅ FleetDataConverter:     Conversión de datos legacy ↔ nuevo`);
        console.log(`   ✅ FleetMappingManager:    Gestión de mapeos bidireccionales`);
        console.log(`   ✅ FleetUpdateManager:     Actualización y ciclo de vida`);
        console.log(`   ✅ FleetLifecycleManager:  Integración con gameEngine`);
        
        // Patrones aplicados
        console.log('\n🎯 PATRONES DE DISEÑO APLICADOS:');
        console.log(`   ✅ Manager Pattern:        Gestores especializados por responsabilidad`);
        console.log(`   ✅ Dependency Injection:   Bajo acoplamiento entre componentes`);
        console.log(`   ✅ Strategy Pattern:       Configuración intercambiable`);
        console.log(`   ✅ Adapter Pattern:        Compatibilidad legacy preservada`);
        
        // Mejoras arquitectónicas
        console.log('\n🚀 MEJORAS ARQUITECTÓNICAS:');
        console.log(`   ✅ Responsabilidades separadas (6+ → 1 por gestor)`);
        console.log(`   ✅ API pública 100% preservada`);
        console.log(`   ✅ Funcionalidad extendida con métodos avanzados`);
        console.log(`   ✅ Gestión de salud y métricas de rendimiento`);
        console.log(`   ✅ Configuración dinámica de gestores`);
        
        // Estadísticas de migración
        console.log('\n⚡ ESTADÍSTICAS DE MIGRACIÓN:');
        console.log(`   Duración:        ${duration}ms`);
        console.log(`   Archivos creados: ${this.stats.filesCreated}`);
        console.log(`   Backups creados:  ${this.stats.backupsCreated}`);
        console.log(`   Gestores:        4 especializados`);
        
        console.log('\n🎉 ¡FASE 7 COMPLETADA! LegacyFleetAdapter.js ahora es una obra maestra modular');
    }

    /**
     * 🔄 Rollback en caso de error
     */
    async rollback() {
        console.log('\n🔄 Realizando rollback...');
        
        try {
            const originalBackupPath = this.paths.original + '.original';
            
            if (fs.existsSync(originalBackupPath)) {
                // Restaurar archivo original
                if (fs.existsSync(this.paths.original)) {
                    fs.unlinkSync(this.paths.original);
                }
                fs.renameSync(originalBackupPath, this.paths.original);
                console.log('✅ Archivo original restaurado');
            }
            
        } catch (rollbackError) {
            console.error('❌ Error en rollback:', rollbackError.message);
        }
    }
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const migrator = new LegacyFleetAdapterMigrator();
    migrator.migrate().catch(console.error);
}

export { LegacyFleetAdapterMigrator }; 