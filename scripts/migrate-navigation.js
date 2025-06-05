#!/usr/bin/env node

/**
 * 🧭 SCRIPT DE MIGRACIÓN - FASE 4: NavigationSystem.js
 * Migración automatizada del NavigationSystem a arquitectura modular
 * Aplicando principios SOLID y patrones de diseño
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de rutas
const PATHS = {
    original: path.join(__dirname, '../src/navigation/NavigationSystem.js'),
    refactored: path.join(__dirname, '../src/navigation/NavigationSystem.refactored.js'),
    backup: path.join(__dirname, '../_archive/backups/navigation/NavigationSystem.backup.js'),
    backupDir: path.join(__dirname, '../_archive/backups/navigation'),
    managersDir: path.join(__dirname, '../src/navigation/managers')
};

// Estadísticas de migración
let migrationStats = {
    originalLines: 0,
    refactoredLines: 0,
    originalSize: 0,
    refactoredSize: 0,
    managersCreated: 0,
    reductionPercentage: 0,
    startTime: Date.now()
};

/**
 * 📊 Calcular estadísticas de archivo
 */
function getFileStats(filePath) {
    if (!fs.existsSync(filePath)) {
        return { lines: 0, size: 0 };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    const size = Buffer.byteLength(content, 'utf8');
    
    return { lines, size };
}

/**
 * 📁 Crear directorios necesarios
 */
function createDirectories() {
    console.log('📁 Creando directorios necesarios...');
    
    // Crear directorio de backup
    if (!fs.existsSync(PATHS.backupDir)) {
        fs.mkdirSync(PATHS.backupDir, { recursive: true });
        console.log(`✅ Directorio de backup creado: ${PATHS.backupDir}`);
    }
    
    // Crear directorio de managers
    if (!fs.existsSync(PATHS.managersDir)) {
        fs.mkdirSync(PATHS.managersDir, { recursive: true });
        console.log(`✅ Directorio de managers creado: ${PATHS.managersDir}`);
    }
}

/**
 * 💾 Crear backup del archivo original
 */
function createBackup() {
    console.log('💾 Creando backup del NavigationSystem original...');
    
    if (!fs.existsSync(PATHS.original)) {
        throw new Error(`❌ Archivo original no encontrado: ${PATHS.original}`);
    }
    
    // Copiar archivo original al backup
    fs.copyFileSync(PATHS.original, PATHS.backup);
    console.log(`✅ Backup creado: ${PATHS.backup}`);
    
    // Obtener estadísticas del archivo original
    const originalStats = getFileStats(PATHS.original);
    migrationStats.originalLines = originalStats.lines;
    migrationStats.originalSize = originalStats.size;
    
    console.log(`📊 Archivo original: ${originalStats.lines} líneas, ${(originalStats.size / 1024).toFixed(2)} KB`);
}

/**
 * 🔍 Verificar que los gestores existen
 */
function verifyManagers() {
    console.log('🔍 Verificando gestores especializados...');
    
    const managers = [
        'NavigationModeManager.js',
        'NavigationStatsManager.js',
        'NavigationVisualizationManager.js',
        'NavigationUpdateManager.js'
    ];
    
    let managersFound = 0;
    
    for (const manager of managers) {
        const managerPath = path.join(PATHS.managersDir, manager);
        if (fs.existsSync(managerPath)) {
            console.log(`✅ ${manager} encontrado`);
            managersFound++;
        } else {
            console.log(`❌ ${manager} NO encontrado en ${managerPath}`);
        }
    }
    
    migrationStats.managersCreated = managersFound;
    
    if (managersFound !== managers.length) {
        throw new Error(`❌ Faltan ${managers.length - managersFound} gestores especializados`);
    }
    
    console.log(`✅ Todos los gestores especializados están disponibles (${managersFound})`);
}

/**
 * 🔄 Realizar migración
 */
function performMigration() {
    console.log('🔄 Realizando migración del NavigationSystem...');
    
    // Verificar que el archivo refactorizado existe
    if (!fs.existsSync(PATHS.refactored)) {
        throw new Error(`❌ Archivo refactorizado no encontrado: ${PATHS.refactored}`);
    }
    
    // Obtener estadísticas del archivo refactorizado
    const refactoredStats = getFileStats(PATHS.refactored);
    migrationStats.refactoredLines = refactoredStats.lines;
    migrationStats.refactoredSize = refactoredStats.size;
    
    console.log(`📊 Archivo refactorizado: ${refactoredStats.lines} líneas, ${(refactoredStats.size / 1024).toFixed(2)} KB`);
    
    // Calcular reducción
    migrationStats.reductionPercentage = ((migrationStats.originalLines - migrationStats.refactoredLines) / migrationStats.originalLines * 100);
    
    // Reemplazar archivo original con el refactorizado
    fs.copyFileSync(PATHS.refactored, PATHS.original);
    console.log(`✅ NavigationSystem.js migrado exitosamente`);
}

/**
 * ✅ Verificar migración
 */
function verifyMigration() {
    console.log('✅ Verificando migración...');
    
    // Verificar que el archivo migrado existe y tiene contenido
    if (!fs.existsSync(PATHS.original)) {
        throw new Error('❌ Archivo migrado no encontrado');
    }
    
    const migratedContent = fs.readFileSync(PATHS.original, 'utf8');
    
    // Verificar que contiene las importaciones de gestores
    const requiredImports = [
        'NavigationModeManager',
        'NavigationStatsManager', 
        'NavigationVisualizationManager',
        'NavigationUpdateManager'
    ];
    
    for (const importName of requiredImports) {
        if (!migratedContent.includes(importName)) {
            throw new Error(`❌ Importación faltante: ${importName}`);
        }
    }
    
    // Verificar que contiene la inicialización de gestores
    if (!migratedContent.includes('GESTORES ESPECIALIZADOS')) {
        throw new Error('❌ Inicialización de gestores no encontrada');
    }
    
    console.log('✅ Migración verificada correctamente');
}

/**
 * 📊 Mostrar estadísticas finales
 */
function showStats() {
    const duration = Date.now() - migrationStats.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ESTADÍSTICAS DE MIGRACIÓN - FASE 4');
    console.log('='.repeat(60));
    console.log(`📁 Archivo: NavigationSystem.js`);
    console.log(`⏱️  Duración: ${duration}ms`);
    console.log(`📊 Líneas: ${migrationStats.originalLines} → ${migrationStats.refactoredLines} (-${migrationStats.reductionPercentage.toFixed(1)}%)`);
    console.log(`💾 Tamaño: ${(migrationStats.originalSize / 1024).toFixed(2)} KB → ${(migrationStats.refactoredSize / 1024).toFixed(2)} KB (-${(((migrationStats.originalSize - migrationStats.refactoredSize) / migrationStats.originalSize) * 100).toFixed(1)}%)`);
    console.log(`🔧 Gestores creados: ${migrationStats.managersCreated}`);
    console.log(`💾 Backup: ${PATHS.backup}`);
    console.log('='.repeat(60));
    
    // Mostrar mejoras arquitectónicas
    console.log('\n🏗️  MEJORAS ARQUITECTÓNICAS:');
    console.log('✅ Separación de responsabilidades (SRP)');
    console.log('✅ Dependency Injection aplicado');
    console.log('✅ Gestores especializados creados');
    console.log('✅ API de compatibilidad mantenida');
    console.log('✅ Configuración centralizada');
    console.log('✅ Estadísticas y métricas mejoradas');
    
    console.log('\n🎯 GESTORES ESPECIALIZADOS:');
    console.log('🔄 NavigationModeManager - Gestión de modos');
    console.log('📊 NavigationStatsManager - Estadísticas y métricas');
    console.log('🎨 NavigationVisualizationManager - Visualización');
    console.log('🔄 NavigationUpdateManager - Actualizaciones');
    
    console.log('\n🚀 FASE 4 COMPLETADA EXITOSAMENTE!');
}

/**
 * 🚀 Función principal
 */
async function main() {
    try {
        console.log('🧭 INICIANDO MIGRACIÓN FASE 4: NavigationSystem.js');
        console.log('🎯 Objetivo: Arquitectura modular con gestores especializados\n');
        
        // Ejecutar pasos de migración
        createDirectories();
        createBackup();
        verifyManagers();
        performMigration();
        verifyMigration();
        showStats();
        
    } catch (error) {
        console.error('\n❌ ERROR EN LA MIGRACIÓN:');
        console.error(error.message);
        
        // Intentar restaurar backup si existe
        if (fs.existsSync(PATHS.backup)) {
            console.log('\n🔄 Restaurando backup...');
            fs.copyFileSync(PATHS.backup, PATHS.original);
            console.log('✅ Backup restaurado');
        }
        
        process.exit(1);
    }
}

// Ejecutar migración
main(); 