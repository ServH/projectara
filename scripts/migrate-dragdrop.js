#!/usr/bin/env node

/**
 * 🎯 SCRIPT DE MIGRACIÓN AUTOMATIZADA - DRAGDROPHANDLER.JS
 * Migra automáticamente de la versión monolítica a la versión modular
 * FASE 6 de la refactorización completa
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas de archivos
const PROJECT_ROOT = path.join(__dirname, '..');
const ORIGINAL_FILE = path.join(PROJECT_ROOT, 'src/input/DragDropHandler.js');
const REFACTORED_FILE = path.join(PROJECT_ROOT, 'src/input/DragDropHandler.refactored.js');
const BACKUP_FILE = path.join(PROJECT_ROOT, '_archive/backups/input/DragDropHandler.backup.js');

// Colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function createBackupDirectory() {
    const backupDir = path.dirname(BACKUP_FILE);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        log(`📁 Directorio de backup creado: ${backupDir}`, 'blue');
    }
}

function createBackup() {
    try {
        createBackupDirectory();
        
        if (fs.existsSync(ORIGINAL_FILE)) {
            fs.copyFileSync(ORIGINAL_FILE, BACKUP_FILE);
            log(`💾 Backup creado: ${BACKUP_FILE}`, 'green');
            return true;
        } else {
            log(`❌ Archivo original no encontrado: ${ORIGINAL_FILE}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Error creando backup: ${error.message}`, 'red');
        return false;
    }
}

function validateRefactoredFile() {
    try {
        if (!fs.existsSync(REFACTORED_FILE)) {
            log(`❌ Archivo refactorizado no encontrado: ${REFACTORED_FILE}`, 'red');
            return false;
        }
        
        const content = fs.readFileSync(REFACTORED_FILE, 'utf8');
        
        // Verificar que contiene las importaciones de gestores
        const requiredImports = [
            'DragStateManager',
            'DragEventManager', 
            'DragVisualizationManager',
            'DragExecutionManager'
        ];
        
        for (const importName of requiredImports) {
            if (!content.includes(importName)) {
                log(`❌ Falta importación: ${importName}`, 'red');
                return false;
            }
        }
        
        // Verificar que contiene los métodos principales
        const requiredMethods = [
            'initializeManagers',
            'setupManagerCallbacks',
            'onDragStart',
            'onDragUpdate', 
            'onDragEnd',
            'isDragActive',
            'getDebugInfo'
        ];
        
        for (const method of requiredMethods) {
            if (!content.includes(method)) {
                log(`❌ Falta método: ${method}`, 'red');
                return false;
            }
        }
        
        log(`✅ Archivo refactorizado validado correctamente`, 'green');
        return true;
        
    } catch (error) {
        log(`❌ Error validando archivo refactorizado: ${error.message}`, 'red');
        return false;
    }
}

function validateManagerFiles() {
    const managerFiles = [
        'src/input/managers/DragStateManager.js',
        'src/input/managers/DragEventManager.js',
        'src/input/managers/DragVisualizationManager.js',
        'src/input/managers/DragExecutionManager.js'
    ];
    
    for (const managerFile of managerFiles) {
        const fullPath = path.join(PROJECT_ROOT, managerFile);
        if (!fs.existsSync(fullPath)) {
            log(`❌ Archivo de gestor no encontrado: ${managerFile}`, 'red');
            return false;
        }
    }
    
    log(`✅ Todos los archivos de gestores encontrados`, 'green');
    return true;
}

function performMigration() {
    try {
        // Copiar archivo refactorizado sobre el original
        fs.copyFileSync(REFACTORED_FILE, ORIGINAL_FILE);
        log(`🔄 Migración completada: ${ORIGINAL_FILE}`, 'green');
        return true;
    } catch (error) {
        log(`❌ Error en migración: ${error.message}`, 'red');
        return false;
    }
}

function rollback() {
    try {
        if (fs.existsSync(BACKUP_FILE)) {
            fs.copyFileSync(BACKUP_FILE, ORIGINAL_FILE);
            log(`🔄 Rollback completado desde: ${BACKUP_FILE}`, 'yellow');
            return true;
        } else {
            log(`❌ Archivo de backup no encontrado para rollback`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Error en rollback: ${error.message}`, 'red');
        return false;
    }
}

function getFileStats(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        const size = fs.statSync(filePath).size;
        
        return { lines, size };
    } catch (error) {
        return null;
    }
}

function showMigrationStats() {
    const originalStats = getFileStats(BACKUP_FILE);
    const refactoredStats = getFileStats(ORIGINAL_FILE);
    
    if (originalStats && refactoredStats) {
        const lineReduction = originalStats.lines - refactoredStats.lines;
        const sizeReduction = originalStats.size - refactoredStats.size;
        const linePercentage = ((lineReduction / originalStats.lines) * 100).toFixed(1);
        const sizePercentage = ((sizeReduction / originalStats.size) * 100).toFixed(1);
        
        log('\n📊 ESTADÍSTICAS DE MIGRACIÓN:', 'cyan');
        log(`📄 Líneas: ${originalStats.lines} → ${refactoredStats.lines} (${lineReduction > 0 ? '-' : '+'}${Math.abs(lineReduction)} líneas, ${linePercentage}%)`, 'blue');
        log(`💾 Tamaño: ${(originalStats.size/1024).toFixed(2)} KB → ${(refactoredStats.size/1024).toFixed(2)} KB (${sizePercentage}%)`, 'blue');
        log(`🏗️ Arquitectura: Monolítica → Modular (4 gestores especializados)`, 'green');
        log(`🎯 Responsabilidades: 6+ → 1 (coordinación)`, 'green');
    }
}

async function testImports() {
    try {
        log('\n🧪 Probando importaciones...', 'yellow');
        
        // Intentar importar el archivo migrado
        const { DragDropHandler } = await import(`file://${ORIGINAL_FILE}`);
        
        if (DragDropHandler) {
            log('✅ Importación exitosa de DragDropHandler', 'green');
            return true;
        } else {
            log('❌ Error: DragDropHandler no exportado correctamente', 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Error en importación: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    log('🎯 INICIANDO MIGRACIÓN DE DRAGDROPHANDLER.JS', 'bright');
    log('FASE 6: Refactorización a arquitectura modular\n', 'cyan');
    
    // Paso 1: Crear backup
    log('📦 Paso 1: Creando backup...', 'yellow');
    if (!createBackup()) {
        log('❌ Migración abortada: Error en backup', 'red');
        process.exit(1);
    }
    
    // Paso 2: Validar archivo refactorizado
    log('\n🔍 Paso 2: Validando archivo refactorizado...', 'yellow');
    if (!validateRefactoredFile()) {
        log('❌ Migración abortada: Archivo refactorizado inválido', 'red');
        process.exit(1);
    }
    
    // Paso 3: Validar archivos de gestores
    log('\n🔍 Paso 3: Validando archivos de gestores...', 'yellow');
    if (!validateManagerFiles()) {
        log('❌ Migración abortada: Archivos de gestores faltantes', 'red');
        process.exit(1);
    }
    
    // Paso 4: Realizar migración
    log('\n🔄 Paso 4: Realizando migración...', 'yellow');
    if (!performMigration()) {
        log('❌ Migración fallida', 'red');
        process.exit(1);
    }
    
    // Paso 5: Probar importaciones
    log('\n🧪 Paso 5: Probando importaciones...', 'yellow');
    if (!await testImports()) {
        log('⚠️ Error en importaciones, realizando rollback...', 'yellow');
        rollback();
        process.exit(1);
    }
    
    // Paso 6: Mostrar estadísticas
    showMigrationStats();
    
    log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE', 'green');
    log('✅ DragDropHandler.js refactorizado con arquitectura modular', 'green');
    log('✅ 4 gestores especializados creados', 'green');
    log('✅ Principios SOLID aplicados', 'green');
    log('✅ Dependency Injection implementado', 'green');
    log('\n📁 Backup disponible en:', 'blue');
    log(`   ${BACKUP_FILE}`, 'blue');
}

// Manejar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
    log('🔄 REALIZANDO ROLLBACK DE DRAGDROPHANDLER.JS', 'yellow');
    if (rollback()) {
        log('✅ Rollback completado exitosamente', 'green');
    } else {
        log('❌ Error en rollback', 'red');
        process.exit(1);
    }
} else if (args.includes('--stats')) {
    log('📊 ESTADÍSTICAS DE DRAGDROPHANDLER.JS', 'cyan');
    showMigrationStats();
} else {
    main().catch(error => {
        log(`❌ Error inesperado: ${error.message}`, 'red');
        process.exit(1);
    });
} 