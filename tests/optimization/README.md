# 🧪 Fleet Optimization Laboratory

## Descripción

El **Fleet Optimization Laboratory** es un entorno aislado de testing diseñado para probar y comparar diferentes técnicas de optimización de rendimiento con miles de flotas simuladas. Permite evaluar el impacto de cada optimización antes de implementarla en el proyecto principal.

## 🚀 Características Principales

### 📊 Escenarios de Testing
- **Light (500 flotas)**: Validación básica de optimizaciones
- **Medium (1000 flotas)**: Carga típica del juego
- **Heavy (2000 flotas)**: Stress testing pesado
- **Extreme (3000 flotas)**: Límite superior de rendimiento
- **Insane (5000 flotas)**: Test de ruptura del sistema

### ⚡ Técnicas de Optimización Implementadas

1. **Object Pooling**: Reutilización de objetos para evitar garbage collection
2. **Viewport Culling**: Solo renderizar objetos visibles en pantalla
3. **Level of Detail (LOD)**: Diferentes niveles de detalle según distancia
4. **Batch Rendering**: Agrupar renderizado por tipo de objeto
5. **Spatial Grid**: Particionado espacial para optimizar consultas
6. **Adaptive Quality**: Ajuste automático de calidad según FPS
7. **Canvas Rendering**: Renderizado optimizado en Canvas 2D
8. **Web Workers**: Procesamiento paralelo de cálculos

### 📈 Métricas Monitoreadas
- **FPS**: Frames por segundo
- **Frame Time**: Tiempo por frame en ms
- **Render Time**: Tiempo de renderizado
- **Update Time**: Tiempo de actualización lógica
- **Memory Usage**: Uso de memoria
- **Visible Objects**: Objetos renderizados vs culled

## 🎮 Cómo Usar el Laboratorio

### 1. Abrir el Laboratorio
```bash
# Navegar a la carpeta del proyecto
cd projectAra/tests/optimization

# Abrir en navegador
open fleet-optimization-lab.html
```

### 2. Configurar Escenario
1. **Ajustar Fleet Count**: Slider de 100 a 5000 flotas
2. **Speed Multiplier**: Velocidad de movimiento (0.1x - 3.0x)
3. **Spawn Pattern**: Patrón de generación (Random, Grid, Clusters, Lines, Spiral)
4. **Generar Escenario**: Botón "🚀 Generate Scenario"

### 3. Activar Optimizaciones
- **Hacer clic en técnicas**: Los botones se iluminan cuando están activos
- **Ajustar parámetros**: Culling Distance y LOD Threshold
- **Aplicar cambios**: Las optimizaciones se aplican en tiempo real

### 4. Monitorear Rendimiento
- **Gráfico en tiempo real**: Muestra FPS con colores según rendimiento
- **Métricas detalladas**: Panel con todas las estadísticas
- **Viewport info**: Información de cámara y objetos visibles

### 5. Controles de Cámara
- **Arrastrar**: Mover viewport
- **Scroll**: Zoom in/out
- **Navegación libre**: Explorar el mapa de 2000x2000

## 🧪 Testing Automatizado

### Presets Rápidos
```javascript
// Usar presets predefinidos
lab.loadPreset('light');    // 500 flotas
lab.loadPreset('medium');   // 1000 flotas  
lab.loadPreset('heavy');    // 2000 flotas
lab.loadPreset('extreme');  // 3000 flotas
lab.loadPreset('insane');   // 5000 flotas
```

### Benchmarks
```javascript
// Ejecutar benchmark individual
const result = await lab.startBenchmark();

// Stress test automático
lab.startStressTest(); // Incrementa flotas hasta encontrar límite
```

### Comparación de Optimizaciones
```javascript
// Comparar diferentes configuraciones
const comparison = await benchmarkRunner.runComparisonTest('heavy', [
    'baseline', 'basic', 'intermediate', 'advanced', 'maximum'
]);
```

## 📊 Configuraciones de Optimización

### Baseline (Sin optimizaciones)
```javascript
{
    pooling: false,
    culling: false,
    lod: false,
    batching: false,
    spatial: false,
    adaptive: false,
    canvas: true,
    workers: false
}
```

### Basic (Optimizaciones básicas)
```javascript
{
    pooling: true,      // Object pooling activo
    culling: true,      // Viewport culling activo
    lod: false,
    batching: false,
    spatial: false,
    adaptive: false,
    canvas: true,
    workers: false
}
```

### Maximum (Todas las optimizaciones)
```javascript
{
    pooling: true,
    culling: true,
    lod: true,
    batching: true,
    spatial: true,
    adaptive: true,
    canvas: true,
    workers: true
}
```

## 🔧 API del Laboratorio

### Clase Principal: FleetOptimizationLab

```javascript
// Acceder a la instancia
const lab = window.lab;

// Generar escenario personalizado
lab.config.fleetCount = 2000;
lab.config.spawnPattern = 'clusters';
lab.generateScenario();

// Activar optimizaciones
lab.optimizations.culling = true;
lab.optimizations.lod = true;
lab.config.cullingDistance = 300;

// Obtener métricas actuales
const metrics = lab.metrics;
console.log(`FPS: ${metrics.fps}, Rendered: ${metrics.renderedFleets}`);
```

### Técnicas de Optimización

```javascript
// Object Pooling
import { ObjectPool } from './optimization-techniques.js';
const pool = new ObjectPool(createFn, resetFn, 10000);

// Spatial Grid
import { SpatialGrid } from './optimization-techniques.js';
const grid = new SpatialGrid(200, 2000, 2000);

// Viewport Culling
import { ViewportCuller } from './optimization-techniques.js';
const culler = new ViewportCuller(200);

// Level of Detail
import { LODSystem } from './optimization-techniques.js';
const lod = new LODSystem([300, 600, 1000]);
```

## 📈 Interpretación de Resultados

### Colores de Rendimiento
- **🟢 Verde (55+ FPS)**: Excelente rendimiento
- **🟡 Amarillo (30-54 FPS)**: Rendimiento aceptable  
- **🔴 Rojo (<30 FPS)**: Rendimiento pobre

### Métricas Objetivo
- **FPS Target**: 60 FPS (mínimo 30 FPS)
- **Frame Time**: <16.67ms (máximo 33.33ms)
- **Render Time**: <8ms (máximo 20ms)
- **Memory Usage**: <50MB (máximo 200MB)

### Análisis de Bottlenecks
```javascript
// Identificar cuello de botella
const report = performanceMonitor.getDetailedReport();
console.log(`Bottleneck: ${report.performance.bottleneck}`);
// Posibles valores: 'rendering', 'logic', 'balanced'
```

## 🚀 Migración al Proyecto Principal

### 1. Identificar Optimizaciones Efectivas
```javascript
// Ejecutar suite completa
const suiteReport = await benchmarkRunner.runFullSuite();
console.log(`Success Rate: ${suiteReport.summary.successRate}%`);
```

### 2. Exportar Configuración Óptima
```javascript
// Exportar resultados
const results = benchmarkRunner.exportResults('json');
const csvData = benchmarkRunner.exportResults('csv');
const htmlReport = benchmarkRunner.exportResults('html');
```

### 3. Aplicar al Proyecto Principal
1. **Copiar técnicas efectivas** de `optimization-techniques.js`
2. **Integrar configuraciones** que mostraron mejor rendimiento
3. **Implementar gradualmente** empezando por las más impactantes
4. **Validar en entorno real** con el juego completo

## 🔍 Debugging y Troubleshooting

### Console Commands
```javascript
// Información del laboratorio
console.log(lab);

// Estadísticas detalladas
console.log(lab.metrics);
console.log(lab.optimizations);

// Forzar recolección de basura (Chrome)
if (window.gc) window.gc();

// Información de memoria
console.log(performance.memory);
```

### Problemas Comunes

**🐛 FPS muy bajo con pocas flotas**
- Verificar que Canvas esté habilitado
- Desactivar todas las optimizaciones para baseline
- Revisar console por errores

**🐛 Web Workers no funcionan**
- Verificar que `fleet-worker.js` esté accesible
- Revisar CORS si se ejecuta desde file://
- Usar servidor local (Live Server, etc.)

**🐛 Métricas inconsistentes**
- Esperar período de calentamiento (5 segundos)
- Cerrar otras pestañas del navegador
- Verificar que no haya throttling de CPU

## 📁 Estructura de Archivos

```
tests/optimization/
├── fleet-optimization-lab.html     # Laboratorio principal
├── optimization-techniques.js      # Técnicas de optimización
├── fleet-worker.js                # Web Worker para cálculos
├── benchmark-config.js            # Configuración de benchmarks
├── README.md                      # Esta documentación
├── test-optimization-baseline.html # Tests existentes
└── test-optimization-comparison.html
```

## 🎯 Próximos Pasos

1. **Ejecutar baseline** con tu hardware específico
2. **Probar optimizaciones incrementales** (basic → intermediate → advanced)
3. **Identificar configuración óptima** para tu caso de uso
4. **Documentar resultados** para referencia futura
5. **Migrar técnicas efectivas** al proyecto principal

## 💡 Tips de Optimización

### Para 500-1000 flotas:
- **Viewport Culling** es suficiente
- **Object Pooling** ayuda con GC
- **LOD** puede ser opcional

### Para 1000-2000 flotas:
- **Spatial Grid** se vuelve importante
- **Batch Rendering** muestra beneficios
- **LOD agresivo** es recomendado

### Para 2000+ flotas:
- **Todas las optimizaciones** son necesarias
- **Web Workers** para cálculos pesados
- **Adaptive Quality** para mantener FPS

---

¡El laboratorio está listo para experimentar! 🧪✨

Usa `window.lab` en la consola para acceder a todas las funcionalidades programáticamente. 