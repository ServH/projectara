/**
 * 🧪 TEST DE IMPORTS - Verificación de Dependencias
 * Archivo temporal para verificar que todos los imports funcionen
 */

console.log('🧪 Iniciando test de imports...');

try {
    // Imports básicos
    console.log('📦 Importando Vector2D...');
    const { Vector2D } = await import('./src/utils/Vector2D.js');
    console.log('✅ Vector2D importado correctamente');

    console.log('📦 Importando SteeringConfig...');
    const { GALCON_STEERING_CONFIG_PROBADA } = await import('./src/config/SteeringConfig.js');
    console.log('✅ SteeringConfig importado correctamente');

    console.log('📦 Importando SteeringVehicle...');
    const { SteeringVehicle } = await import('./src/entities/SteeringVehicle.js');
    console.log('✅ SteeringVehicle importado correctamente');

    console.log('📦 Importando SpatialHashSystem...');
    const { SpatialHashSystem } = await import('./src/systems/SpatialHashSystem.js');
    console.log('✅ SpatialHashSystem importado correctamente');

    console.log('📦 Importando Fleet...');
    const { Fleet } = await import('./src/entities/Fleet.js');
    console.log('✅ Fleet importado correctamente');

    console.log('📦 Importando LegacyFleetAdapter...');
    const { LegacyFleetAdapter } = await import('./src/adapters/LegacyFleetAdapter.js');
    console.log('✅ LegacyFleetAdapter importado correctamente');

    console.log('📦 Importando NavigationSystem...');
    const NavigationSystem = await import('./src/navigation/NavigationSystem.js');
    console.log('✅ NavigationSystem importado correctamente');

    console.log('📦 Importando GameEngine...');
    const GameEngine = await import('./src/core/GameEngine.js');
    console.log('✅ GameEngine importado correctamente');

    console.log('🎉 TODOS LOS IMPORTS FUNCIONAN CORRECTAMENTE');

    // Test básico de funcionalidad
    console.log('🧪 Probando funcionalidad básica...');
    
    const vector = new Vector2D(10, 20);
    console.log(`✅ Vector2D funciona: ${vector.toString()}`);
    
    const config = GALCON_STEERING_CONFIG_PROBADA;
    console.log(`✅ Config funciona: maxSpeed = ${config.forces.maxSpeed}`);
    
    console.log('🎉 FUNCIONALIDAD BÁSICA VERIFICADA');

} catch (error) {
    console.error('❌ ERROR EN IMPORTS:', error);
    console.error('Stack trace:', error.stack);
} 