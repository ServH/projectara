/**
 * 🔄 GAMEENGINE MIGRATION SCRIPT
 * Script para migrar del GameEngine original al refactorizado
 * 
 * PROPÓSITO:
 * - Hacer backup del GameEngine original
 * - Reemplazar con la versión refactorizada
 * - Validar que la migración sea exitosa
 */

import fs from 'fs';
import path from 'path';

class GameEngineMigration {
    constructor() {
        this.projectRoot = process.cwd();
        this.originalPath = path.join(this.projectRoot, 'src/core/GameEngine.js');
        this.refactoredPath = path.join(this.projectRoot, 'src/core/GameEngine.refactored.js');
        this.backupPath = path.join(this.projectRoot, 'src/core/GameEngine.original.js');
        
        console.log('🔄 GameEngine Migration Script initialized');
    }

    /**
     * Ejecutar migración completa
     */
    async migrate() {
        try {
            console.log('🔄 Starting GameEngine migration...');
            
            // Verificar archivos
            this.verifyFiles();
            
            // Crear backup
            this.createBackup();
            
            // Reemplazar archivo
            this.replaceGameEngine();
            
            // Verificar migración
            this.verifyMigration();
            
            console.log('✅ GameEngine migration completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            this.rollback();
            return false;
        }
    }

    /**
     * Verificar que los archivos necesarios existen
     */
    verifyFiles() {
        if (!fs.existsSync(this.originalPath)) {
            throw new Error(`Original GameEngine not found: ${this.originalPath}`);
        }
        
        if (!fs.existsSync(this.refactoredPath)) {
            throw new Error(`Refactored GameEngine not found: ${this.refactoredPath}`);
        }
        
        console.log('✅ Required files verified');
    }

    /**
     * Crear backup del GameEngine original
     */
    createBackup() {
        try {
            fs.copyFileSync(this.originalPath, this.backupPath);
            console.log(`✅ Backup created: ${this.backupPath}`);
        } catch (error) {
            throw new Error(`Failed to create backup: ${error.message}`);
        }
    }

    /**
     * Reemplazar GameEngine original con la versión refactorizada
     */
    replaceGameEngine() {
        try {
            fs.copyFileSync(this.refactoredPath, this.originalPath);
            console.log('✅ GameEngine replaced with refactored version');
        } catch (error) {
            throw new Error(`Failed to replace GameEngine: ${error.message}`);
        }
    }

    /**
     * Verificar que la migración fue exitosa
     */
    verifyMigration() {
        try {
            const content = fs.readFileSync(this.originalPath, 'utf8');
            
            // Verificar que contiene las importaciones de los nuevos gestores
            const hasConfigManager = content.includes('ConfigurationManager');
            const hasStateManager = content.includes('StateManager');
            const hasSystemsManager = content.includes('SystemsManager');
            
            if (!hasConfigManager || !hasStateManager || !hasSystemsManager) {
                throw new Error('Migrated file does not contain expected managers');
            }
            
            // Verificar que no contiene código legacy
            const hasLegacyCode = content.includes('this.planets = new Map()') ||
                                 content.includes('this.config = this.initializeConfig()');
            
            if (hasLegacyCode) {
                throw new Error('Migrated file still contains legacy code');
            }
            
            console.log('✅ Migration verification passed');
            
        } catch (error) {
            throw new Error(`Migration verification failed: ${error.message}`);
        }
    }

    /**
     * Rollback en caso de error
     */
    rollback() {
        try {
            if (fs.existsSync(this.backupPath)) {
                fs.copyFileSync(this.backupPath, this.originalPath);
                console.log('🔄 Rollback completed - original GameEngine restored');
            }
        } catch (error) {
            console.error('❌ Rollback failed:', error);
        }
    }

    /**
     * Limpiar archivos temporales
     */
    cleanup() {
        try {
            // Remover archivo refactorizado temporal
            if (fs.existsSync(this.refactoredPath)) {
                fs.unlinkSync(this.refactoredPath);
                console.log('🧹 Temporary refactored file removed');
            }
        } catch (error) {
            console.warn('⚠️ Cleanup warning:', error.message);
        }
    }

    /**
     * Obtener estadísticas de la migración
     */
    getStats() {
        const originalStats = fs.statSync(this.backupPath);
        const newStats = fs.statSync(this.originalPath);
        
        return {
            originalSize: originalStats.size,
            newSize: newStats.size,
            sizeDifference: newStats.size - originalStats.size,
            migrationDate: new Date().toISOString()
        };
    }
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const migration = new GameEngineMigration();
    
    migration.migrate().then(success => {
        if (success) {
            const stats = migration.getStats();
            console.log('📊 Migration Stats:', stats);
            
            // Limpiar archivos temporales
            migration.cleanup();
            
            process.exit(0);
        } else {
            process.exit(1);
        }
    });
}

export default GameEngineMigration; 