# 🚀 Documentación Completa - Sistema de Steering Behaviors

## 📋 Índice
1. [Resumen del Sistema](#resumen-del-sistema)
2. [Arquitectura General](#arquitectura-general)
3. [Configuración del Sistema](#configuración-del-sistema)
4. [Componentes Principales](#componentes-principales)
5. [Comportamientos Implementados](#comportamientos-implementados)
6. [Sistema de Espaciado Dinámico](#sistema-de-espaciado-dinámico)
7. [Optimizaciones](#optimizaciones)
8. [Guía de Modificación](#guía-de-modificación)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen del Sistema

El sistema de **Steering Behaviors** implementado proporciona navegación inteligente y fluida para las naves del juego Galcon. Basado en los algoritmos de Craig Reynolds, incluye comportamientos avanzados como evasión predictiva, formaciones dinámicas, y espaciado orbital automático.

### ✨ Características Principales
- **Navegación Predictiva**: Las naves anticipan obstáculos y calculan rutas inteligentes
- **Espaciado Dinámico**: Evita superposición de naves al llegar al destino
- **Formaciones Dinámicas**: 4 tipos de formación que cambian automáticamente
- **Sistema Anti-Atascamiento**: Detecta y resuelve naves bloqueadas
- **Optimización Espacial**: Hash espacial para rendimiento O(n) en lugar de O(n²)
- **Histéresis Anti-Bailoteo**: Evita cambios bruscos de comportamiento

---

## 🏗️ Arquitectura General

```
src/
├── config/
│   └── SteeringConfig.js          # ⚙️ Configuración principal
├── entities/
│   ├── SteeringVehicle.js         # 🚀 Nave individual con IA
│   ├── Fleet.js                   # 🚁 Gestión de flotas
│   └── Planet.js                  # 🌍 Lanzamiento progresivo
├── systems/
│   ├── SpatialHashSystem.js       # 🔍 Optimización espacial
│   └── NavigationSystem.js        # 🧭 Sistema híbrido
├── adapters/
│   └── LegacyFleetAdapter.js      # 🔄 Compatibilidad
└── utils/
    └── Vector2D.js                # 📐 Matemáticas vectoriales
```

---

## ⚙️ Configuración del Sistema

### 📍 Archivo Principal: `src/config/SteeringConfig.js`

```javascript
export const GALCON_STEERING_CONFIG_PROBADA = {
    // 🔍 SENSORES - Detección de obstáculos
    sensors: {
        length: 30,           // Alcance de detección (píxeles)
        width: 5,             // Ancho del sensor
        lateralCount: 1,      // Número de sensores laterales
        lateralAngle: 15      // Ángulo de sensores laterales (grados)
    },
    
    // ⚡ FUERZAS - Comportamiento de movimiento
    forces: {
        maxSpeed: 120,        // Velocidad máxima (píxeles/segundo)
        maxForce: 200,        // Fuerza máxima aplicable
        seekWeight: 1,        // Peso de la fuerza de búsqueda
        avoidanceWeight: 2,   // Peso de la evasión (2x más importante)
        smoothing: 0.7        // Suavizado de movimiento (0-1)
    },
    
    // 🎯 COMPORTAMIENTO - Llegada y navegación
    behavior: {
        enableArrival: true,     // Activar desaceleración al llegar
        arrivalRadius: 25,       // Radio de llegada (píxeles)
        slowingDistance: 60,     // Distancia para empezar a frenar
        enableWander: false      // Vagabundeo (desactivado en Galcon)
    },
    
    // 🚁 FLOTA - Formaciones y comportamiento grupal
    fleet: {
        formation: 'spread',     // Formación inicial
        size: 15,               // Tamaño base de flota
        spacing: 30,            // Espaciado entre naves
        enableBoids: true,      // Activar comportamiento de enjambre
        separationWeight: 1.5,  // Peso de separación entre naves
        alignmentWeight: 1,     // Peso de alineación de velocidades
        cohesionWeight: 0.8     // Peso de cohesión grupal
    },
    
    // 🌊 GALCON - Configuración específica del juego
    galcon: {
        maxWaveSize: 8,         // Máximo naves por oleada
        launchDelay: 200,       // Delay entre oleadas (ms)
        formationProbability: {  // Probabilidad de cada formación
            spread: 0.4,        // 40% - Dispersa (versátil)
            line: 0.2,          // 20% - Línea (atravesar)
            wedge: 0.2,         // 20% - Cuña (ataque)
            circle: 0.2         // 20% - Círculo (defensa)
        }
    }
};
```

---

## 🧩 Componentes Principales

### 1. 🚀 SteeringVehicle.js - Nave Individual

**Responsabilidades:**
- Navegación inteligente con evasión predictiva
- Detección y resolución de atascamientos
- Espaciado dinámico con otras naves
- Posicionamiento orbital alrededor del destino

**Métodos Clave:**
```javascript
// Navegación principal
calculateSteeringForce(obstacles, config, otherVehicles)
calculateIntelligentNavigation(obstacles, config)

// Espaciado dinámico
calculateSpacingForces(otherVehicles)
calculateOrbitalForce(otherVehicles)
calculateOrbitalPosition(otherVehicles)

// Anti-atascamiento
detectStuckState()
calculateEscapeForce(config)
```

### 2. 🚁 Fleet.js - Gestión de Flotas

**Responsabilidades:**
- Gestión de múltiples naves como grupo
- Formaciones dinámicas (spread, line, wedge, circle)
- Comportamientos de boids (separación, alineación, cohesión)
- Limpieza progresiva de naves que llegan

**Formaciones Disponibles:**
- **Spread (40%)**: Dispersión en rejilla para versatilidad
- **Line (20%)**: Línea perpendicular para atravesar defensas
- **Wedge (20%)**: Cuña para ataques concentrados
- **Circle (20%)**: Círculo para maniobras defensivas

### 3. 🔍 SpatialHashSystem.js - Optimización Espacial

**Responsabilidades:**
- Optimización de detección de colisiones O(n²) → O(n)
- Hash espacial dinámico que se adapta al número de entidades
- Gestión eficiente de memoria

**Configuración:**
```javascript
// Tamaño de celda se ajusta automáticamente
cellSize = Math.max(50, averageEntitySize * 3)
```

### 4. 🧭 NavigationSystem.js - Sistema Híbrido

**Responsabilidades:**
- Integración entre steering behaviors y sistema legacy
- Conversión automática de planetas a obstáculos
- Modo dual para compatibilidad

---

## 🎮 Comportamientos Implementados

### 1. 🎯 Seek (Búsqueda)
Movimiento directo hacia el objetivo con desaceleración gradual.

**Configuración:**
- `forces.seekWeight`: Intensidad de la búsqueda
- `behavior.arrivalRadius`: Radio de llegada
- `behavior.slowingDistance`: Distancia para frenar

### 2. 🚧 Obstacle Avoidance (Evasión de Obstáculos)
Sistema predictivo con histéresis anti-bailoteo.

**Configuración:**
- `forces.avoidanceWeight`: Intensidad de evasión (recomendado: 2)
- `sensors.length`: Alcance de detección
- `sensors.lateralAngle`: Ángulo de sensores laterales

**Sistema de Histéresis:**
```javascript
avoidanceState: {
    entryThreshold: 0.5,    // Umbral para ENTRAR en evasión
    exitThreshold: 0.3,     // Umbral para SALIR (evita bailoteo)
    framesSinceLastThreat: 0
}
```

### 3. 🌊 Boids (Comportamiento de Enjambre)
Tres fuerzas que crean movimiento orgánico grupal:

**Separación**: Evita colisiones entre naves
- `fleet.separationWeight`: 1.5 (recomendado)

**Alineación**: Sincroniza velocidades
- `fleet.alignmentWeight`: 1.0

**Cohesión**: Mantiene el grupo unido
- `fleet.cohesionWeight`: 0.8

### 4. 🎲 Wander (Vagabundeo)
Movimiento aleatorio suave (desactivado en Galcon).

---

## 🌍 Sistema de Espaciado Dinámico

### Características
- **Posicionamiento Orbital**: Las naves se distribuyen alrededor del planeta destino
- **Capas Automáticas**: Crea anillos concéntricos según el número de naves
- **Repulsión Entre Naves**: Evita superposición durante el movimiento

### Configuración del Espaciado
```javascript
spacingSystem: {
    spacingRadius: 12,        // Radio personal de cada nave
    repulsionStrength: 150,   // Fuerza de repulsión entre naves
    orbitalActivationDistance: planetRadius + 80  // Cuándo se activa
}
```

### Cálculo de Posiciones Orbitales
```javascript
// Radio base
baseOrbitalRadius = planetRadius + 25

// Capas adicionales si hay muchas naves
orbitalLayer = Math.floor((vehicleCount - 1) / maxVehiclesInRadius)
finalOrbitalRadius = baseOrbitalRadius + (orbitalLayer * spacingNeeded * 1.5)
```

---

## ⚡ Optimizaciones

### 1. Spatial Hashing
- **Antes**: O(n²) - cada nave verifica contra todas las demás
- **Después**: O(n) - solo verifica naves en celdas cercanas

### 2. Sensores Adaptativos
- **Líderes**: Sensores completos para navegación
- **Seguidores**: 70% de longitud para mejor rendimiento

### 3. Renderizado Progresivo
- **Oleadas Graduales**: Máximo 8 naves por oleada
- **Delay Inteligente**: 200ms entre lanzamientos
- **Cleanup Automático**: Eliminación de naves llegadas

### 4. Suavizado Dinámico
```javascript
// Más suavizado con muchos obstáculos
if (obstacles.length > 2) {
    smoothing = Math.min(baseSmoothing + 0.3, 0.9);
}
```

---

## 🔧 Guía de Modificación

### Cambiar Velocidad de las Naves
```javascript
// En SteeringConfig.js
forces: {
    maxSpeed: 150,    // Aumentar para naves más rápidas
    maxForce: 250     // Aumentar proporcionalmente
}
```

### Ajustar Sensibilidad de Evasión
```javascript
// En SteeringConfig.js
sensors: {
    length: 40,       // Mayor alcance = evasión más temprana
    lateralAngle: 20  // Mayor ángulo = mejor detección lateral
}
```

### Modificar Formaciones
```javascript
// En SteeringConfig.js
galcon: {
    formationProbability: {
        spread: 0.6,  // Más formaciones dispersas
        line: 0.1,    // Menos líneas
        wedge: 0.2,
        circle: 0.1
    }
}
```

### Cambiar Espaciado Entre Naves
```javascript
// En SteeringVehicle.js constructor
spacingSystem: {
    spacingRadius: 15,        // Mayor espacio personal
    repulsionStrength: 200    // Repulsión más fuerte
}
```

### Ajustar Tamaño de Oleadas
```javascript
// En SteeringConfig.js
galcon: {
    maxWaveSize: 12,    // Oleadas más grandes
    launchDelay: 150    // Lanzamiento más rápido
}
```

---

## 🐛 Troubleshooting

### Problema: Naves se quedan paradas
**Causa**: Error en cálculo de fuerzas o atascamiento
**Solución**: 
1. Verificar que `targetPlanet` esté definido
2. Revisar logs de sistema anti-atascamiento
3. Ajustar `stuckThreshold` si es necesario

### Problema: Naves se superponen al llegar
**Causa**: Sistema orbital no activado o mal configurado
**Solución**:
1. Verificar que `otherVehicles` se pase correctamente
2. Ajustar `orbitalActivationDistance`
3. Aumentar `spacingRadius`

### Problema: Navegación muy nerviosa
**Causa**: Suavizado insuficiente o histéresis mal configurada
**Solución**:
1. Aumentar `forces.smoothing` (0.8-0.9)
2. Ajustar umbrales de histéresis
3. Reducir `forces.avoidanceWeight`

### Problema: Rendimiento bajo
**Causa**: Demasiadas verificaciones de colisión
**Solución**:
1. Verificar que SpatialHashSystem esté activo
2. Reducir `sensors.length` para seguidores
3. Aumentar `launchDelay` entre oleadas

---

## 📊 Métricas de Rendimiento

### Configuración Óptima Probada
- **60 FPS estables** con hasta 100 naves simultáneas
- **Tiempo de respuesta**: < 16ms por frame
- **Memoria**: Gestión automática con cleanup progresivo

### Límites Recomendados
- **Máximo naves por flota**: 50
- **Máximo flotas simultáneas**: 10
- **Frecuencia de actualización**: 60 FPS

---

## 🎯 Próximas Mejoras Sugeridas

1. **Pathfinding A***: Para mapas con obstáculos complejos
2. **Formaciones Personalizadas**: Editor de formaciones
3. **IA Táctica**: Comportamientos según tipo de misión
4. **Efectos Visuales**: Rastros y partículas mejoradas
5. **Configuración en Tiempo Real**: Panel de ajustes dinámicos

---

*Documentación generada para el sistema de Steering Behaviors v1.0*
*Última actualización: Diciembre 2024* 