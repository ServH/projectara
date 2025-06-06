#!/usr/bin/env node

/**
 * 🎯 FIX-GAME SCRIPT - Script Maestro de Corrección
 * Ejecuta diagnóstico completo, aplica correcciones automáticas y valida el resultado
 */

import { GameDiagnostic } from './diagnostic.js';
import { AutoFixer } from './auto-fix.js';

class GameFixer {
    constructor() {
        this.diagnostic = new GameDiagnostic();
        this.autoFixer = new AutoFixer();
    }

    async fixGame() {
        console.log('🎯 INICIANDO PROCESO DE CORRECCIÓN COMPLETO');
        console.log('='.repeat(60));
        
        // Fase 1: Diagnóstico inicial
        console.log('\n📊 FASE 1: DIAGNÓSTICO INICIAL');
        console.log('-'.repeat(40));
        await this.diagnostic.runFullDiagnostic();
        
        const initialReport = this.diagnostic.generateReport();
        const initialErrors = this.diagnostic.errors.length;
        
        if (initialErrors === 0) {
            console.log('\n✅ No se encontraron errores. El juego debería funcionar correctamente.');
            return;
        }
        
        // Fase 2: Aplicar correcciones automáticas
        console.log('\n🔧 FASE 2: CORRECCIONES AUTOMÁTICAS');
        console.log('-'.repeat(40));
        await this.autoFixer.runAutoFix();
        
        // Fase 3: Diagnóstico post-corrección
        console.log('\n🔍 FASE 3: VALIDACIÓN POST-CORRECCIÓN');
        console.log('-'.repeat(40));
        
        // Crear nueva instancia para diagnóstico limpio
        const postDiagnostic = new GameDiagnostic();
        await postDiagnostic.runFullDiagnostic();
        
        const finalErrors = postDiagnostic.errors.length;
        const errorsFixed = initialErrors - finalErrors;
        
        // Fase 4: Reporte final
        console.log('\n📈 FASE 4: REPORTE FINAL');
        console.log('-'.repeat(40));
        
        console.log(`\n📊 RESUMEN DE CORRECCIONES:`);
        console.log(`   Errores iniciales: ${initialErrors}`);
        console.log(`   Errores finales: ${finalErrors}`);
        console.log(`   Errores corregidos: ${errorsFixed}`);
        console.log(`   Correcciones aplicadas: ${this.autoFixer.appliedFixes.length}`);
        
        if (finalErrors === 0) {
            console.log('\n🎉 ¡ÉXITO! El juego debería funcionar correctamente ahora.');
            console.log('\n🚀 Próximos pasos:');
            console.log('   1. Abre http://localhost:8002/ en tu navegador');
            console.log('   2. Abre las herramientas de desarrollador (F12)');
            console.log('   3. Haz clic en un planeta para probar el lanzamiento de flotas');
            console.log('   4. Revisa la consola para logs detallados');
        } else {
            console.log('\n⚠️  Aún quedan algunos errores por resolver:');
            postDiagnostic.errors.forEach(error => {
                console.log(`   ❌ ${error}`);
            });
            
            console.log('\n🔧 Recomendaciones:');
            console.log('   1. Revisa los errores restantes manualmente');
            console.log('   2. Ejecuta el juego y revisa la consola del navegador');
            console.log('   3. Usa gameLogger.exportLogs() para análisis detallado');
        }
        
        // Generar comandos útiles
        console.log('\n🛠️  COMANDOS ÚTILES:');
        console.log('   node diagnostic.js     - Solo diagnóstico');
        console.log('   node auto-fix.js       - Solo correcciones automáticas');
        console.log('   node fix-game.js       - Proceso completo (este script)');
        
        console.log('\n🔍 DEBUGGING EN EL NAVEGADOR:');
        console.log('   gameLogger.generateDiagnosticReport()  - Reporte en tiempo real');
        console.log('   gameLogger.exportLogs()               - Exportar logs');
        console.log('   gameLogger.clear()                    - Limpiar logs');
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const gameFixer = new GameFixer();
    gameFixer.fixGame().catch(console.error);
}

export { GameFixer }; 