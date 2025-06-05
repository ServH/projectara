#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE MIGRACIÓN AUTOMATIZADA - AISYSTEM
 * Migra AISystem.js al nuevo sistema modular
 * FASE 10: AISystem → 5 gestores especializados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de rutas
const PATHS = {
    original: path.join(__dirname, '../src/systems/AISystem.js'),
    refactored: path.join(__dirname, '../src/systems/AISystem.refactored.js'),
    backup: path.join(__dirname, '../src/systems/AISystem.backup.js'),
    managers: path.join(__dirname, '../src/systems/managers'),
    tests: path.join(__dirname, '../tests/refactoring')
};

// Gestores requeridos
const REQUIRED_MANAGERS = [
    'AIConfigurationManager.js',
    'AIAnalysisManager.js',
    'AIDecisionManager.js',
    'AITargetingManager.js',
    'AIStrategyManager.js'
];

class AISystemMigrator {
    constructor() {
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.migrationLog = [];
        this.errors = [];
    }

    /**
     * 📋 Ejecutar migración completa
     */
    async migrate() {
        console.log('🚀 INICIANDO MIGRACIÓN DE AISYSTEM');
        console.log('=' .repeat(60));
        
        try {
            // Fase 1: Verificaciones previas
            await this.preflightChecks();
            
            // Fase 2: Crear backup
            await this.createBackup();
            
            // Fase 3: Verificar gestores
            await this.verifyManagers();
            
            // Fase 4: Ejecutar migración
            await this.executeMigration();
            
            // Fase 5: Verificar migración
            await this.verifyMigration();
            
            // Fase 6: Generar reporte
            await this.generateReport();
            
            console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
            
        } catch (error) {
            console.error('❌ ERROR EN MIGRACIÓN:', error.message);
            await this.rollback();
            throw error;
        }
    }

    /**
     * 🔍 Verificaciones previas
     */
    async preflightChecks() {
        this.log('🔍 Ejecutando verificaciones previas...');
        
        // Verificar archivo original
        if (!fs.existsSync(PATHS.original)) {
            throw new Error(`Archivo original no encontrado: ${PATHS.original}`);
        }
        
        // Verificar archivo refactorizado
        if (!fs.existsSync(PATHS.refactored)) {
            throw new Error(`Archivo refactorizado no encontrado: ${PATHS.refactored}`);
        }
        
        // Verificar directorio de gestores
        if (!fs.existsSync(PATHS.managers)) {
            throw new Error(`Directorio de gestores no encontrado: ${PATHS.managers}`);
        }
        
        this.log('✅ Verificaciones previas completadas');
    }

    /**
     * 💾 Crear backup del archivo original
     */
    async createBackup() {
        this.log('💾 Creando backup del archivo original...');
        
        const backupPath = `${PATHS.original}.${this.timestamp}.backup`;
        fs.copyFileSync(PATHS.original, backupPath);
        
        this.log(`✅ Backup creado: ${backupPath}`);
    }

    /**
     * 🔧 Verificar gestores especializados
     */
    async verifyManagers() {
        this.log('🔧 Verificando gestores especializados...');
        
        const missingManagers = [];
        
        for (const manager of REQUIRED_MANAGERS) {
            const managerPath = path.join(PATHS.managers, manager);
            if (!fs.existsSync(managerPath)) {
                missingManagers.push(manager);
            } else {
                // Verificar que el archivo no esté vacío
                const stats = fs.statSync(managerPath);
                if (stats.size === 0) {
                    missingManagers.push(`${manager} (vacío)`);
                }
            }
        }
        
        if (missingManagers.length > 0) {
            throw new Error(`Gestores faltantes o vacíos: ${missingManagers.join(', ')}`);
        }
        
        this.log(`✅ Todos los gestores verificados (${REQUIRED_MANAGERS.length})`);
    }

    /**
     * ⚡ Ejecutar migración
     */
    async executeMigration() {
        this.log('⚡ Ejecutando migración...');
        
        // Reemplazar archivo original con versión refactorizada
        fs.copyFileSync(PATHS.refactored, PATHS.original);
        
        this.log('✅ Archivo principal migrado');
    }

    /**
     * ✅ Verificar migración
     */
    async verifyMigration() {
        this.log('✅ Verificando migración...');
        
        // Verificar que el archivo migrado existe y tiene contenido
        if (!fs.existsSync(PATHS.original)) {
            throw new Error('Archivo migrado no encontrado');
        }
        
        const stats = fs.statSync(PATHS.original);
        if (stats.size === 0) {
            throw new Error('Archivo migrado está vacío');
        }
        
        // Verificar imports de gestores en el archivo migrado
        const content = fs.readFileSync(PATHS.original, 'utf8');
        
        const expectedImports = [
            'AIConfigurationManager',
            'AIAnalysisManager',
            'AIDecisionManager',
            'AITargetingManager',
            'AIStrategyManager'
        ];
        
        const missingImports = expectedImports.filter(imp => !content.includes(imp));
        
        if (missingImports.length > 0) {
            throw new Error(`Imports faltantes en archivo migrado: ${missingImports.join(', ')}`);
        }
        
        this.log('✅ Migración verificada correctamente');
    }

    /**
     * 📊 Generar reporte de migración
     */
    async generateReport() {
        this.log('📊 Generando reporte de migración...');
        
        const originalStats = fs.statSync(PATHS.original);
        const managersStats = REQUIRED_MANAGERS.map(manager => {
            const managerPath = path.join(PATHS.managers, manager);
            const stats = fs.statSync(managerPath);
            return {
                name: manager,
                size: stats.size,
                lines: this.countLines(managerPath)
            };
        });
        
        const totalManagersSize = managersStats.reduce((sum, m) => sum + m.size, 0);
        const totalManagersLines = managersStats.reduce((sum, m) => sum + m.lines, 0);
        
        const report = {
            timestamp: new Date().toISOString(),
            migration: {
                originalFile: {
                    path: PATHS.original,
                    size: originalStats.size,
                    lines: this.countLines(PATHS.original)
                },
                managers: managersStats,
                totals: {
                    managersCount: REQUIRED_MANAGERS.length,
                    totalSize: totalManagersSize,
                    totalLines: totalManagersLines,
                    sizeIncrease: totalManagersSize - originalStats.size,
                    linesIncrease: totalManagersLines - this.countLines(PATHS.original)
                }
            },
            improvements: {
                architecture: 'SOLID principles implemented',
                separation: 'Single responsibility per manager',
                maintainability: 'Highly improved',
                testability: 'Greatly enhanced',
                extensibility: 'Modular design allows easy extension'
            },
            migrationLog: this.migrationLog
        };
        
        // Guardar reporte
        const reportPath = path.join(__dirname, `../FASE10_AISYSTEM_MIGRATION_REPORT_${this.timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Mostrar resumen
        console.log('\n📊 RESUMEN DE MIGRACIÓN:');
        console.log(`📁 Archivo original: ${this.countLines(PATHS.original)} líneas`);
        console.log(`🏗️ Gestores creados: ${REQUIRED_MANAGERS.length}`);
        console.log(`📈 Total líneas nuevas: ${totalManagersLines} líneas`);
        console.log(`📊 Incremento: +${totalManagersLines - this.countLines(PATHS.original)} líneas`);
        console.log(`💾 Reporte guardado: ${reportPath}`);
        
        this.log(`✅ Reporte generado: ${reportPath}`);
    }

    /**
     * 🔄 Rollback en caso de error
     */
    async rollback() {
        this.log('🔄 Ejecutando rollback...');
        
        try {
            const backupPath = `${PATHS.original}.${this.timestamp}.backup`;
            if (fs.existsSync(backupPath)) {
                fs.copyFileSync(backupPath, PATHS.original);
                this.log('✅ Rollback completado');
            }
        } catch (error) {
            console.error('❌ Error en rollback:', error.message);
        }
    }

    /**
     * 📝 Log de migración
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.migrationLog.push(logEntry);
        console.log(logEntry);
    }

    /**
     * 📊 Contar líneas de archivo
     */
    countLines(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.split('\n').length;
        } catch (error) {
            return 0;
        }
    }
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const migrator = new AISystemMigrator();
    migrator.migrate().catch(error => {
        console.error('💥 MIGRACIÓN FALLIDA:', error);
        process.exit(1);
    });
}

export { AISystemMigrator }; 