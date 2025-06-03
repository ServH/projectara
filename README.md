# 🚀 GALCON GAME - Canvas 2D Optimized

Juego estilo Galcon con renderizado Canvas 2D optimizado y movimiento orgánico de flotas.

## 🎮 Características Principales

- **🎨 Canvas 2D**: Renderizado optimizado de alta performance
- **🌊 Movimiento Orgánico**: Flotas con comportamiento natural y fluido
- **🎯 Controles Galcon**: Drag & drop, selección múltiple, feedback visual
- **⚡ Optimizaciones**: Culling, LOD, cache matemático, batch rendering
- **🎛️ Interfaz Completa**: HUD, selección, efectos visuales

## 📁 Estructura del Proyecto

```
projectAra/
├── index.html                    # Juego principal (Canvas 2D)
├── css/
│   ├── main.css                 # Estilos principales
│   └── ui-styles.css            # Estilos de interfaz
├── src/
│   ├── core/
│   │   ├── GameEngine.js        # Motor principal del juego
│   │   └── EventBus.js          # Sistema de eventos
│   ├── entities/
│   │   ├── Planet.js            # Lógica de planetas
│   │   └── Fleet.js             # Lógica de flotas
│   ├── systems/
│   │   ├── SelectionSystem.js   # Sistema de selección
│   │   ├── AISystem.js          # Inteligencia artificial
│   │   ├── FleetPhysics.js      # Física de flotas
│   │   ├── FleetFormationSystem.js
│   │   ├── FleetRedirectionSystem.js
│   │   ├── MemoryManager.js
│   │   └── SpatialGrid.js
│   ├── input/
│   │   └── DragDropHandler.js   # Drag & drop para Canvas
│   ├── visual/
│   │   ├── CanvasRenderer.js    # Renderer Canvas 2D ⭐
│   │   └── CullingSystem.js     # Sistema de culling
│   ├── ui/
│   │   ├── GameLoader.js        # Cargador Canvas 2D
│   │   ├── HUDManager.js        # Gestión de HUD
│   │   └── PercentageSelector.js
│   ├── config/
│   │   ├── GameConfig.js
│   │   ├── BalanceConfig.js
│   │   └── OrganicMovementConfig.js
│   └── debug/
│       └── PerformanceProfiler.js
└── _archive/                    # Archivos obsoletos y backups
    ├── backups/
    │   ├── entities/           # Backups de entities
    │   ├── visual-svg/         # Archivos SVG obsoletos
    │   └── html-svg/           # HTML con SVG
    └── docs/
```

## 🚀 Cómo Usar

### Juego Principal
```bash
# Abrir index.html
open http://localhost:8080/index.html
```

## 🎮 Controles

- **🖱️ Clic**: Seleccionar planeta
- **🖱️ Ctrl+Clic**: Selección múltiple
- **🖱️ Shift+Clic**: Seleccionar todos los planetas
- **🖱️ Doble Clic**: Seleccionar todos los planetas
- **📦 Drag**: Selección por área
- **🎯 Drag & Drop**: Enviar flotas con líneas visuales
- **🖱️ Clic Derecho**: Envío rápido de flotas
- **⌨️ Ctrl+A**: Seleccionar todos
- **⌨️ Escape**: Limpiar selección

## ⚡ Optimizaciones Canvas 2D

### Renderizado
- **Batch Rendering**: Agrupación por colores
- **Viewport Culling**: Solo renderizar objetos visibles
- **Level of Detail**: Reducir detalles según distancia
- **Cache Matemático**: Precálculo de trigonometría

### Interactividad
- **Sistema de Overlay**: Elementos interactivos en Canvas
- **Coordenadas Precisas**: Manejo correcto de eventos
- **Feedback Visual**: Líneas y efectos en tiempo real

### Memoria
- **Object Pooling**: Reutilización de objetos
- **Spatial Grid**: Optimización de colisiones
- **Memory Manager**: Gestión automática de memoria

## 🎨 Características Visuales

- **🌊 Movimiento Orgánico**: Flotas con comportamiento natural
- **✨ Efectos Visuales**: Trails, explosiones, partículas
- **🎯 Feedback Interactivo**: Líneas de drag & drop
- **🌟 Highlights**: Planetas objetivo resaltados
- **📦 Selección Visual**: Cajas de selección animadas

## 📊 Rendimiento

### Canvas 2D Performance
- **5000 flotas**: 60 FPS estables
- **Memoria**: Uso optimizado con pooling
- **CPU**: Carga reducida con culling y LOD

### Métricas en Tiempo Real
- FPS counter
- Frame time
- Render time
- Objetos visibles/culled

## 🐛 Debug

- **F1**: Panel de debug
- **F2**: Reporte de rendimiento
- **F5**: Reiniciar juego
- **F6**: Benchmark ligero
- **F7**: Benchmark completo

## 🏗️ Arquitectura

### Sistemas Principales
1. **GameEngine**: Lógica central y coordinación
2. **CanvasRenderer**: Renderizado optimizado
3. **SelectionSystem**: Selección de planetas
4. **DragDropHandler**: Interacción drag & drop
5. **AISystem**: Inteligencia artificial

### Flujo de Datos
```
GameEngine → getRenderData() → CanvasRenderer → Canvas 2D
     ↓
SelectionSystem ← Mouse Events ← DragDropHandler
     ↓
EventBus → Sistemas → Actualización Estado
```

## 🔄 Próximas Mejoras

- [ ] Efectos de lanzamiento mejorados
- [ ] Optimización de trails
- [ ] Shaders para efectos avanzados
- [ ] Multiplayer networking
- [ ] Sonido y música

---

**Estado**: ✅ Canvas 2D optimizado y funcional
**Rendimiento**: ⚡ 60 FPS con 5000+ objetos
**Arquitectura**: 🎨 Canvas 2D puro 