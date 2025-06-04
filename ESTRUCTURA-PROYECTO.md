# 📁 Estructura del Proyecto - ProjectAra

## 🎯 Estructura Actual (Limpia)

```
projectAra/
├── 📄 index.html                          # Punto de entrada del juego
├── 📄 README.md                           # Documentación principal
├── 📄 DOCUMENTACION-STEERING-BEHAVIORS.md # Documentación técnica completa
├── 📄 ESTRUCTURA-PROYECTO.md              # Este archivo
├── 📄 LICENSE                             # Licencia MIT
├── 📄 .gitignore                          # Archivos ignorados por Git
│
├── 📁 css/                                # 🎨 Estilos del juego
│   ├── main.css                           # Estilos principales
│   └── ui-styles.css                      # Estilos de interfaz
│
├── 📁 src/                                # 🎯 Código fuente principal
│   ├── 📁 config/                         # ⚙️ Configuraciones
│   │   ├── SteeringConfig.js              # Configuración de steering behaviors
│   │   ├── GameConfig.js                  # Configuración general del juego
│   │   ├── BalanceConfig.js               # Balance y dificultad
│   │   └── OrganicMovementConfig.js       # Configuración de movimiento orgánico
│   │
│   ├── 📁 core/                           # 🎮 Motor del juego
│   │   ├── GameEngine.js                  # Motor principal del juego
│   │   └── EventBus.js                    # Sistema de eventos
│   │
│   ├── 📁 entities/                       # 🚀 Entidades del juego
│   │   ├── SteeringVehicle.js             # Nave individual con IA
│   │   ├── Fleet.js                       # Gestión de flotas
│   │   └── Planet.js                      # Planetas con lanzamiento progresivo
│   │
│   ├── 📁 systems/                        # 🔧 Sistemas del juego
│   │   ├── SpatialHashSystem.js           # Optimización espacial O(n)
│   │   ├── FleetFormationSystem.js        # Sistema de formaciones
│   │   ├── FleetRedirectionSystem.js      # Redirección de flotas
│   │   ├── SelectionSystem.js             # Sistema de selección
│   │   └── AISystem.js                    # Inteligencia artificial
│   │
│   ├── 📁 navigation/                     # 🧭 Sistema de navegación
│   │   ├── NavigationSystem.js            # Sistema híbrido de navegación
│   │   ├── NavigationConfig.js            # Configuración de navegación
│   │   ├── ObstacleDetector.js            # Detección de obstáculos
│   │   └── ArrivalSystem.js               # Sistema de llegadas
│   │
│   ├── 📁 adapters/                       # 🔄 Adaptadores de compatibilidad
│   │   └── LegacyFleetAdapter.js          # Adaptador para sistema legacy
│   │
│   ├── 📁 visual/                         # 🎨 Sistema de renderizado
│   │   ├── CanvasRenderer.js              # Renderizador Canvas 2D optimizado
│   │   └── CullingSystem.js               # Sistema de culling
│   │
│   ├── 📁 input/                          # 🖱️ Manejo de entrada
│   │   └── DragDropHandler.js             # Sistema drag & drop
│   │
│   ├── 📁 ui/                             # 🖼️ Interfaz de usuario
│   │   ├── GameLoader.js                  # Cargador del juego
│   │   ├── HUDManager.js                  # Gestión del HUD
│   │   └── PercentageSelector.js          # Selector de porcentaje
│   │
│   ├── 📁 debug/                          # 🐛 Herramientas de debug
│   │   ├── PerformanceProfiler.js         # Profiler de rendimiento
│   │   └── BenchmarkSuite.js              # Suite de benchmarks
│   │
│   └── 📁 utils/                          # 🛠️ Utilidades
│       └── Vector2D.js                    # Matemáticas vectoriales
│
└── 📁 _archive/                           # 📦 Archivos archivados
    ├── 📁 obsolete/                       # Archivos obsoletos movidos
    │   ├── 📁 systems/                    # Sistemas legacy obsoletos
    │   ├── 📁 labs/                       # Laboratorios de desarrollo
    │   ├── entities.backup/               # Backup de entidades
    │   ├── systems.backup/                # Backup de sistemas
    │   ├── navigation.backup/             # Backup de navegación
    │   ├── FASE*.md                       # Documentación de fases
    │   ├── PLAN-INTEGRACION-STEERING.md   # Plan de integración
    │   ├── PROJECT_STATUS.md              # Estado del proyecto
    │   └── test-imports.js                # Tests de imports
    │
    ├── 📁 backups/                        # Backups históricos
    │   ├── core/                          # Backups del motor
    │   ├── entities/                      # Backups de entidades
    │   ├── html/                          # Backups HTML
    │   ├── html-svg/                      # Backups HTML-SVG
    │   ├── visual/                        # Backups visuales
    │   └── visual-svg/                    # Backups SVG
    │
    └── 📁 docs/                           # Documentación archivada
        ├── changelog/                     # Historial de cambios
        ├── hitos del milestone/           # Documentación de hitos
        ├── milestone 2.2/                 # Milestone 2.2
        └── milestone 2.3/                 # Milestone 2.3
```

## 🎯 Archivos Principales por Funcionalidad

### 🚀 Sistema de Steering Behaviors
- **SteeringVehicle.js**: Nave individual con IA avanzada
- **Fleet.js**: Gestión de flotas con formaciones dinámicas
- **SteeringConfig.js**: Configuración completa del sistema
- **SpatialHashSystem.js**: Optimización espacial O(n)

### 🧭 Sistema de Navegación
- **NavigationSystem.js**: Coordinador principal híbrido
- **ObstacleDetector.js**: Detección inteligente de obstáculos
- **ArrivalSystem.js**: Gestión de llegadas
- **LegacyFleetAdapter.js**: Compatibilidad con sistema legacy

### 🎮 Motor del Juego
- **GameEngine.js**: Motor principal optimizado
- **EventBus.js**: Sistema de comunicación por eventos
- **CanvasRenderer.js**: Renderizado Canvas 2D de alto rendimiento

### ⚙️ Configuración
- **SteeringConfig.js**: Parámetros de steering behaviors
- **GameConfig.js**: Configuración general
- **BalanceConfig.js**: Balance y dificultad
- **NavigationConfig.js**: Configuración de navegación

## 🧹 Archivos Movidos a _archive/obsolete/

### Sistemas Legacy Obsoletos
- **SpatialGrid.js** → Reemplazado por SpatialHashSystem.js
- **MemoryManager.js** → Gestión automática implementada
- **FleetPhysics.js** → Integrado en SteeringVehicle.js

### Laboratorios de Desarrollo
- **PathfindingLab.js** → Laboratorio de desarrollo movido

### Documentación de Desarrollo
- **FASE*.md** → Documentación de fases de desarrollo
- **PLAN-INTEGRACION-STEERING.md** → Plan de integración completado
- **PROJECT_STATUS.md** → Estado del proyecto archivado

### Backups de Sistemas
- **entities.backup/** → Backup de entidades pre-steering
- **systems.backup/** → Backup de sistemas legacy
- **navigation.backup/** → Backup de navegación básica

## 📊 Métricas de Limpieza

### Antes de la Limpieza
- **Archivos totales**: ~80 archivos
- **Sistemas activos**: 15
- **Documentación**: 8 archivos principales
- **Backups**: Dispersos en múltiples carpetas

### Después de la Limpieza
- **Archivos activos**: ~35 archivos
- **Sistemas activos**: 8 sistemas core
- **Documentación**: 3 archivos principales
- **Archivos archivados**: ~45 archivos organizados

### Beneficios de la Limpieza
- ✅ **Estructura clara**: Fácil navegación y comprensión
- ✅ **Separación de responsabilidades**: Cada carpeta tiene un propósito específico
- ✅ **Documentación centralizada**: Información clave en archivos principales
- ✅ **Archivos obsoletos organizados**: Preservados pero separados
- ✅ **Imports optimizados**: Solo dependencias necesarias

## 🔧 Guía de Navegación

### Para Desarrolladores Nuevos
1. **Empezar por**: `README.md` para visión general
2. **Configuración**: `src/config/SteeringConfig.js`
3. **Lógica principal**: `src/entities/SteeringVehicle.js`
4. **Motor del juego**: `src/core/GameEngine.js`

### Para Modificaciones
1. **Comportamiento de naves**: `src/entities/SteeringVehicle.js`
2. **Formaciones**: `src/entities/Fleet.js`
3. **Configuración**: `src/config/SteeringConfig.js`
4. **Navegación**: `src/navigation/NavigationSystem.js`

### Para Debugging
1. **Herramientas**: `src/debug/`
2. **Configuración de debug**: `src/config/SteeringConfig.js`
3. **Logs del sistema**: Console del navegador
4. **Métricas**: Panel de debug (F1)

## 📚 Documentación Relacionada

- **[README.md](./README.md)**: Documentación principal del proyecto
- **[DOCUMENTACION-STEERING-BEHAVIORS.md](./DOCUMENTACION-STEERING-BEHAVIORS.md)**: Guía técnica completa
- **[src/config/SteeringConfig.js](./src/config/SteeringConfig.js)**: Configuración comentada

---

*Estructura documentada para ProjectAra v1.0*
*Última actualización: Diciembre 2024* 