# 🚀 Project Ara - Galcon Game

Un juego estilo Galcon desarrollado con **Canvas 2D optimizado** y sistemas de navegación inteligente.

## 🎯 Características Principales

### ✨ **Renderizado Optimizado**
- **Canvas 2D nativo** con alta resolución (DPR)
- **60 FPS estables** con 5000+ objetos
- **Sistema de overlay** para efectos interactivos
- **Batch rendering** por colores optimizado

### 🧭 **Navegación Inteligente**
- **Sistema de pathfinding** con detección de obstáculos
- **Radio de entrada variable** para llegadas realistas
- **Visualización de trayectorias** en tiempo real
- **Laboratorio de desarrollo** para algoritmos

### 🎮 **Controles Avanzados**
- **Drag & Drop** fluido para envío de flotas
- **Multi-selección** con Ctrl+Click
- **Selección por área** con cajas de selección
- **Ataques rápidos** con click derecho

### 🚀 **Rendimiento**
- **Movimiento orgánico** preservado del juego original
- **Cache matemático** para cálculos optimizados
- **Viewport culling** para objetos fuera de pantalla
- **Profiling integrado** con métricas en tiempo real

## 🛠️ Instalación y Uso

### **Requisitos**
- Navegador moderno con soporte Canvas 2D
- Servidor HTTP local (Python, Node.js, etc.)

### **Inicio Rápido**
```bash
# Clonar repositorio
git clone https://github.com/ServH/projectAra.git
cd projectAra

# Iniciar servidor local
python3 -m http.server 8080

# Abrir en navegador
open http://localhost:8080
```

### **URLs Disponibles**
- **Juego Principal**: `http://localhost:8080/`
- **Laboratorio de Pathfinding**: `http://localhost:8080/pathfinding-lab.html`

## 🎮 Controles del Juego

| Acción | Control |
|--------|---------|
| Seleccionar planeta | `Click` |
| Enviar flotas | `Drag & Drop` |
| Multi-selección | `Ctrl + Click` |
| Seleccionar todos | `Shift + Click` |
| Ataque rápido | `Click Derecho` |
| Deseleccionar | `Esc` |
| Toggle líneas | `Botón 🎨 Líneas` |

### **Teclas de Debug**
| Tecla | Función |
|-------|---------|
| `F1` | Panel de debug |
| `F2` | Reporte de rendimiento |
| `F3` | Toggle profiling |
| `F4` | Reset profiler |
| `F5` | Reiniciar juego |
| `F6` | Benchmark ligero |
| `F7` | Benchmark completo |

## 🧪 Laboratorio de Pathfinding

### **Características**
- **Entorno de pruebas** para algoritmos de navegación
- **Configuración en tiempo real** de parámetros
- **Visualización completa** de rutas y obstáculos
- **Métricas de rendimiento** detalladas
- **Exportación de configuraciones**

### **Controles del Laboratorio**
| Acción | Control |
|--------|---------|
| Crear nave | `Drag & Drop` |
| Crear obstáculo | `Shift + Click` |
| Remover obstáculo | `Click en obstáculo` |
| Ajustar parámetros | `Sliders del panel` |

### **Algoritmos Disponibles**
- **Evitación Simple**: Detección básica y evitación directa
- **A* Pathfinding**: *(En desarrollo)* Búsqueda de ruta óptima
- **Flow Field**: *(En desarrollo)* Campo de flujo para múltiples unidades

## 📁 Estructura del Proyecto

```
projectAra/
├── 📄 index.html                 # Juego principal
├── 🧪 pathfinding-lab.html       # Laboratorio de pathfinding
├── 📁 css/                       # Estilos del juego
├── 📁 src/
│   ├── 📁 core/                  # Motor del juego
│   │   ├── GameEngine.js         # Motor principal
│   │   └── PerformanceProfiler.js # Sistema de profiling
│   ├── 📁 entities/              # Entidades del juego
│   │   ├── Planet.js             # Planetas
│   │   └── Fleet.js              # Flotas de naves
│   ├── 📁 visual/                # Sistemas de renderizado
│   │   └── CanvasRenderer.js     # Renderer Canvas 2D optimizado
│   ├── 📁 navigation/            # Sistema de navegación
│   │   ├── NavigationSystem.js   # Coordinador principal
│   │   ├── NavigationConfig.js   # Configuración centralizada
│   │   ├── ObstacleDetector.js   # Detección de obstáculos
│   │   └── ArrivalSystem.js      # Sistema de llegadas
│   ├── 📁 systems/               # Sistemas del juego
│   │   ├── AISystem.js           # Inteligencia artificial
│   │   ├── SelectionSystem.js    # Sistema de selección
│   │   └── FleetRedirectionSystem.js # Redirección de flotas
│   ├── 📁 input/                 # Manejo de entrada
│   │   └── DragDropHandler.js    # Drag & Drop
│   ├── 📁 ui/                    # Interfaz de usuario
│   │   ├── GameLoader.js         # Cargador del juego
│   │   └── HUDManager.js         # Gestión del HUD
│   ├── 📁 labs/                  # Laboratorios de desarrollo
│   │   └── PathfindingLab.js     # Laboratorio de pathfinding
│   └── 📁 debug/                 # Herramientas de debug
└── 📁 _archive/                  # Archivos archivados
    ├── 📁 backups/               # Backups de versiones anteriores
    └── 📁 docs/                  # Documentación archivada
```

## 🏗️ Arquitectura Técnica

### **Canvas 2D Optimizado**
- **Renderizado directo** sin DOM virtual
- **Double buffering** para animaciones fluidas
- **Viewport culling** automático
- **Cache de transformaciones** matemáticas

### **Sistema de Navegación**
- **Detección de obstáculos** línea-círculo optimizada
- **Cache de cálculos** con invalidación inteligente
- **Visualización en tiempo real** de trayectorias
- **Configuración dinámica** de parámetros

### **Gestión de Estado**
- **GameEngine centralizado** como single source of truth
- **Sistemas modulares** con interfaces bien definidas
- **Event-driven architecture** para comunicación
- **Profiling integrado** para optimización continua

## 📊 Métricas de Rendimiento

### **Benchmarks Actuales**
- **Canvas 2D**: 60 FPS con 5000+ objetos
- **Memoria**: ~50MB para sesión completa
- **Tiempo de carga**: <2 segundos
- **Latencia de input**: <16ms

### **Comparativa con SVG**
| Métrica | Canvas 2D | SVG DOM |
|---------|-----------|---------|
| FPS (5000 objetos) | 60 | 15-20 |
| Memoria | 50MB | 120MB+ |
| Tiempo de renderizado | 8ms | 35ms+ |
| Escalabilidad | Excelente | Limitada |

## 🚀 Roadmap de Desarrollo

### **Milestone 2.3 - Navegación Inteligente** ✅
- [x] Sistema base de navegación
- [x] Detección de obstáculos
- [x] Radio de entrada variable
- [x] Laboratorio de pathfinding
- [ ] Algoritmo A* completo
- [ ] Flow Field para múltiples unidades

### **Milestone 2.4 - IA Avanzada** 🔄
- [ ] Comportamientos de IA mejorados
- [ ] Estrategias dinámicas
- [ ] Dificultad adaptativa
- [ ] Sistema de personalidades

### **Milestone 3.0 - Multijugador** 📋
- [ ] Arquitectura cliente-servidor
- [ ] Sincronización de estado
- [ ] Matchmaking
- [ ] Salas privadas

## 🤝 Contribución

### **Cómo Contribuir**
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

### **Estándares de Código**
- **ES6+ modules** para organización
- **JSDoc comments** para documentación
- **Console logging** con emojis para debugging
- **Performance-first** approach en todas las implementaciones

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Inspirado en el clásico juego **Galcon**
- Desarrollado con **Canvas 2D nativo** para máximo rendimiento
- Optimizado para **navegadores modernos**

---

**🚀 ¡Conquista la galaxia con Project Ara!** 