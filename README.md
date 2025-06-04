# 🌌 ProjectAra - Galcon con Steering Behaviors

## 🎮 Descripción
ProjectAra es una implementación avanzada del juego Galcon que integra un sistema completo de **Steering Behaviors** para navegación inteligente de naves espaciales. El proyecto evoluciona desde un sistema básico Canvas 2D hasta una experiencia de juego fluida con IA avanzada.

## ✨ Características Principales

### 🚀 Sistema de Navegación Inteligente
- **Evasión Predictiva**: Las naves anticipan obstáculos y calculan rutas óptimas
- **Espaciado Dinámico**: Distribución automática alrededor de planetas destino
- **Anti-Atascamiento**: Detección y resolución automática de naves bloqueadas
- **Navegación Híbrida**: Compatibilidad total con el sistema legacy

### 🚁 Gestión de Flotas Avanzada
- **4 Formaciones Dinámicas**: Spread, Line, Wedge, Circle
- **Comportamiento de Enjambre**: Separación, alineación y cohesión
- **Lanzamiento Progresivo**: Oleadas graduales para evitar congestión
- **Limpieza Automática**: Gestión eficiente de memoria

### ⚡ Optimizaciones de Rendimiento
- **Spatial Hashing**: Optimización O(n²) → O(n)
- **Sensores Adaptativos**: Configuración dinámica según rol
- **Renderizado Eficiente**: 60 FPS estables con 100+ naves

## 🏗️ Estructura del Proyecto

```
projectAra/
├── src/                          # 🎯 Código fuente principal
│   ├── config/
│   │   └── SteeringConfig.js     # ⚙️ Configuración del sistema
│   ├── entities/
│   │   ├── SteeringVehicle.js    # 🚀 Nave individual con IA
│   │   ├── Fleet.js              # 🚁 Gestión de flotas
│   │   └── Planet.js             # 🌍 Planetas con lanzamiento
│   ├── systems/
│   │   ├── SpatialHashSystem.js  # 🔍 Optimización espacial
│   │   └── NavigationSystem.js   # 🧭 Sistema híbrido
│   ├── adapters/
│   │   └── LegacyFleetAdapter.js # 🔄 Compatibilidad legacy
│   └── utils/
│       └── Vector2D.js           # 📐 Matemáticas vectoriales
├── css/                          # 🎨 Estilos
├── _archive/                     # 📦 Archivos históricos
└── docs/                         # 📚 Documentación adicional
```

## 🚀 Inicio Rápido

### Requisitos
- Navegador web moderno con soporte ES6+
- Servidor HTTP local (Python, Node.js, etc.)

### Instalación
```bash
# Clonar el repositorio
git clone [repository-url]
cd projectAra

# Iniciar servidor local
python3 -m http.server 8080
# o
npx serve .

# Abrir en navegador
open http://localhost:8080
```

### Primer Uso
1. Abre `index.html` en tu navegador
2. Haz clic en un planeta para seleccionarlo
3. Arrastra hacia otro planeta para enviar naves
4. Observa la navegación inteligente en acción

## ⚙️ Configuración

### Configuración Básica
El archivo principal de configuración está en `src/config/SteeringConfig.js`:

```javascript
// Velocidad de las naves
forces: {
    maxSpeed: 120,        // Píxeles por segundo
    maxForce: 200         // Fuerza máxima
}

// Detección de obstáculos
sensors: {
    length: 30,           // Alcance de sensores
    lateralAngle: 15      // Ángulo lateral
}

// Comportamiento de flotas
fleet: {
    spacing: 30,          // Espaciado entre naves
    enableBoids: true     // Activar enjambre
}
```

### Configuración Avanzada
Ver [DOCUMENTACION-STEERING-BEHAVIORS.md](./DOCUMENTACION-STEERING-BEHAVIORS.md) para configuración detallada.

## 🎮 Controles

| Acción | Control |
|--------|---------|
| Seleccionar planeta | Click izquierdo |
| Enviar naves | Arrastrar desde planeta origen a destino |
| Enviar porcentaje | Mantener arrastrar para ajustar % |
| Pausa | Barra espaciadora |

## 🔧 Desarrollo

### Archivos Principales
- **SteeringVehicle.js**: Lógica de navegación individual
- **Fleet.js**: Gestión de grupos de naves
- **SteeringConfig.js**: Configuración del sistema
- **NavigationSystem.js**: Integración con el juego

### Modificaciones Comunes
```javascript
// Cambiar velocidad de naves
forces.maxSpeed = 150;

// Ajustar sensibilidad de evasión
sensors.length = 40;

// Modificar formaciones
galcon.formationProbability.spread = 0.6;
```

## 📊 Rendimiento

### Métricas Actuales
- **60 FPS** estables con 100+ naves
- **< 16ms** tiempo de frame
- **Memoria**: Gestión automática

### Optimizaciones Implementadas
- Spatial hashing para colisiones
- Sensores adaptativos por rol
- Cleanup progresivo de entidades
- Renderizado eficiente

## 🐛 Troubleshooting

### Problemas Comunes

**Naves se quedan paradas**
- Verificar configuración de `targetPlanet`
- Revisar logs de anti-atascamiento

**Rendimiento bajo**
- Reducir número de naves simultáneas
- Ajustar configuración de sensores

**Navegación nerviosa**
- Aumentar `forces.smoothing`
- Ajustar umbrales de histéresis

Ver [Troubleshooting completo](./DOCUMENTACION-STEERING-BEHAVIORS.md#troubleshooting) para más detalles.

## 📚 Documentación

- [**Documentación Completa**](./DOCUMENTACION-STEERING-BEHAVIORS.md) - Guía detallada del sistema
- [**Configuración**](./src/config/SteeringConfig.js) - Parámetros del sistema
- [**Changelog**](./_archive/docs/changelog/) - Historial de cambios

## 🎯 Roadmap

### Próximas Características
- [ ] Pathfinding A* para mapas complejos
- [ ] Editor de formaciones personalizadas
- [ ] IA táctica avanzada
- [ ] Efectos visuales mejorados
- [ ] Panel de configuración en tiempo real

### Mejoras de Rendimiento
- [ ] Web Workers para cálculos pesados
- [ ] LOD (Level of Detail) para naves distantes
- [ ] Culling frustum para renderizado

## 🤝 Contribución

### Estructura de Commits
```
feat: nueva característica
fix: corrección de bug
docs: actualización de documentación
perf: mejora de rendimiento
refactor: refactorización de código
```

### Desarrollo Local
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-caracteristica`
3. Commit cambios: `git commit -m 'feat: agregar nueva característica'`
4. Push a la rama: `git push origin feature/nueva-caracteristica`
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Craig Reynolds** - Por los algoritmos originales de Steering Behaviors
- **Comunidad de Game Development** - Por inspiración y recursos
- **Contribuidores** - Por mejoras y feedback

---

**ProjectAra v1.0** - Sistema de Steering Behaviors para Galcon
*Desarrollado con ❤️ para la comunidad de game development* 