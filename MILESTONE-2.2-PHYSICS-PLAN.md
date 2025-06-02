# 🚀 MILESTONE 2.2 - PHYSICS: Sistema de Navegación Inteligente

## 🎯 **Objetivo Principal**
Crear un sistema de navegación realista donde las naves:
- Se orienten correctamente (vértice apuntando al destino)
- Tengan movimiento orgánico y fluido
- Eviten obstáculos (planetas) de forma inteligente
- Mantengan orientación dinámica durante la navegación
- Soporten 200+ naves simultáneas con rendimiento óptimo

## 📋 **Especificaciones Técnicas**

### **Comportamiento de Naves**
- **Orientación**: Vértice del triángulo apunta hacia destino final
- **Movimiento**: Realista con física sutil, se siente "vivo"
- **Navegación**: Detección intermedia - evita planetas grandes/cercanos en ruta
- **Gravedad**: Visual/orgánica, NO atrae sino que obliga a rodear obstáculos
- **Reorientación**: Automática durante navegación, siempre hacia destino final

### **Física Orgánica**
- **NO es gravedad real**: Los planetas no atraen naves
- **ES navegación inteligente**: Las naves detectan obstáculos y los rodean
- **Curvatura natural**: Al rodear un planeta, la nave pierde orientación temporalmente
- **Reorientación automática**: Una vez superado el obstáculo, vuelve a apuntar al destino

## 🏗️ **Arquitectura del Sistema**

### **Componentes Principales**
1. **NavSystem** - Sistema de navegación principal
2. **OrientationController** - Control de orientación de naves
3. **ObstacleDetector** - Detección de planetas en ruta
4. **PathCalculator** - Cálculo de rutas alternativas
5. **PhysicsEngine** - Motor de física ligero y optimizado

### **Flujo de Navegación**
```
Lanzamiento → Orientación Inicial → Detección Obstáculos → 
Cálculo Ruta → Movimiento Suave → Reorientación Dinámica → Llegada
```

## 📊 **Hitos Incrementales**

### **🎯 Hito 1: Orientación Visual Básica**
**Objetivo**: Naves apuntan correctamente hacia su destino
**Duración**: 1-2 iteraciones

**Tareas**:
- [ ] Calcular ángulo desde posición actual hacia destino final
- [ ] Aplicar rotación al triángulo SVG usando `transform="rotate()"`
- [ ] Actualizar orientación en tiempo real durante movimiento
- [ ] Validar que el vértice apunta correctamente al destino

**Criterios de Éxito**:
- ✅ Triángulos apuntan visualmente hacia planeta destino
- ✅ Orientación se mantiene durante movimiento recto
- ✅ No hay glitches visuales en rotación

---

### **🎯 Hito 2: Movimiento Suave y Orgánico**
**Objetivo**: Movimiento realista con aceleración/desaceleración
**Duración**: 2-3 iteraciones

**Tareas**:
- [ ] Implementar aceleración gradual al inicio (0 → velocidad máxima)
- [ ] Implementar desaceleración al acercarse al destino
- [ ] Añadir micro-variaciones en velocidad para sensación orgánica
- [ ] Optimizar cálculos para 200+ naves simultáneas

**Criterios de Éxito**:
- ✅ Naves aceleran suavemente al salir del planeta
- ✅ Naves desaceleran al acercarse al destino
- ✅ Movimiento se siente natural y orgánico
- ✅ Rendimiento estable con 200+ naves

---

### **🎯 Hito 3: Posiciones Precisas de Salida/Llegada**
**Objetivo**: Salida desde borde del planeta, llegada al collider
**Duración**: 1-2 iteraciones

**Tareas**:
- [ ] Calcular punto de salida en borde del planeta origen
- [ ] Calcular punto de llegada en collider del planeta destino
- [ ] Ajustar trayectoria para usar estos puntos precisos
- [ ] Validar que naves no aparecen/desaparecen abruptamente

**Criterios de Éxito**:
- ✅ Naves salen visualmente desde el borde del planeta
- ✅ Naves llegan al collider del planeta destino
- ✅ No hay teleportación o aparición abrupta

---

### **🎯 Hito 4: Detección de Obstáculos**
**Objetivo**: Detectar planetas que interfieren con la ruta directa
**Duración**: 2-3 iteraciones

**Tareas**:
- [ ] Algoritmo de detección de intersección línea-círculo
- [ ] Filtrar solo planetas "significativos" (tamaño/proximidad)
- [ ] Optimizar detección para múltiples naves simultáneas
- [ ] Sistema de cache para evitar recálculos innecesarios

**Criterios de Éxito**:
- ✅ Detecta correctamente planetas en ruta directa
- ✅ Ignora planetas muy pequeños o lejanos
- ✅ Rendimiento optimizado para 200+ naves
- ✅ No hay falsos positivos/negativos

---

### **🎯 Hito 5: Navegación Inteligente (Rodear Obstáculos)**
**Objetivo**: Calcular rutas alternativas para evitar planetas
**Duración**: 3-4 iteraciones

**Tareas**:
- [ ] Algoritmo de "rodeo" simple (izquierda/derecha del obstáculo)
- [ ] Cálculo de puntos de waypoint alrededor del planeta
- [ ] Sistema de navegación por waypoints
- [ ] Reorientación automática hacia destino final tras superar obstáculo

**Criterios de Éxito**:
- ✅ Naves rodean planetas en lugar de atravesarlos
- ✅ Eligen la ruta más corta (izquierda vs derecha)
- ✅ Se reorientan hacia destino final tras superar obstáculo
- ✅ Movimiento fluido sin cambios abruptos de dirección

---

### **🎯 Hito 6: Reorientación Dinámica**
**Objetivo**: Orientación automática durante toda la navegación
**Duración**: 2-3 iteraciones

**Tareas**:
- [ ] Sistema de interpolación suave de rotación
- [ ] Lógica de orientación durante navegación por waypoints
- [ ] Transición suave entre "rodeando obstáculo" y "hacia destino"
- [ ] Optimización de cálculos de rotación

**Criterios de Éxito**:
- ✅ Naves se reorientan suavemente durante navegación
- ✅ No hay rotaciones bruscas o glitches visuales
- ✅ Orientación correcta en todas las fases del viaje
- ✅ Rendimiento estable con rotaciones múltiples

---

### **🎯 Hito 7: Optimización y Pulido**
**Objetivo**: Rendimiento final y refinamiento visual
**Duración**: 2-3 iteraciones

**Tareas**:
- [ ] Profiling y optimización de bottlenecks
- [ ] Sistema de LOD (Level of Detail) para naves lejanas
- [ ] Cache inteligente de cálculos costosos
- [ ] Pulido visual y ajuste de parámetros

**Criterios de Éxito**:
- ✅ 200+ naves simultáneas con 60 FPS estables
- ✅ Uso eficiente de memoria
- ✅ Experiencia visual pulida y satisfactoria
- ✅ Sistema robusto y libre de bugs

## 🔧 **Consideraciones Técnicas**

### **Rendimiento**
- **Cálculos espaciados**: Navegación cada 100ms, orientación cada 16ms
- **Spatial partitioning**: Grid para optimizar detección de obstáculos
- **Object pooling**: Reutilización de objetos para evitar GC
- **Batch processing**: Procesar múltiples naves en lotes

### **Arquitectura de Código**
- **Modular**: Cada sistema independiente y testeable
- **Configurable**: Parámetros ajustables sin cambiar código
- **Extensible**: Fácil añadir nuevos comportamientos
- **Debuggeable**: Logging y visualización de debug opcionales

### **Parámetros Configurables**
```javascript
const PHYSICS_CONFIG = {
    navigation: {
        updateInterval: 100,        // ms entre actualizaciones de ruta
        obstacleDetectionRange: 150, // px para detectar obstáculos
        waypointDistance: 50,       // px de distancia a waypoints
        reorientationSpeed: 0.1     // velocidad de rotación
    },
    movement: {
        acceleration: 0.02,         // aceleración inicial
        deceleration: 0.05,         // desaceleración final
        maxSpeed: 2.0,              // velocidad máxima
        organicVariation: 0.1       // variación orgánica
    },
    obstacles: {
        minPlanetSize: 20,          // tamaño mínimo para considerar obstáculo
        detectionBuffer: 10,        // buffer adicional alrededor de planetas
        routingPreference: 'shortest' // 'shortest' | 'safest'
    }
};
```

## 🧪 **Estrategia de Testing**

### **Testing por Hito**
- **Hito 1**: Test visual de orientación con 1 nave
- **Hito 2**: Test de movimiento con 10 naves
- **Hito 3**: Test de posiciones precisas
- **Hito 4**: Test de detección con obstáculos conocidos
- **Hito 5**: Test de navegación con rutas complejas
- **Hito 6**: Test de reorientación en tiempo real
- **Hito 7**: Stress test con 200+ naves

### **Métricas de Éxito**
- **FPS**: Mantener 60 FPS con 200+ naves
- **Precisión**: 99% de naves llegan al destino correcto
- **Fluidez**: No saltos visuales o glitches
- **Realismo**: Movimiento se siente natural y orgánico

## 🚀 **Plan de Ejecución**

### **Metodología**
1. **Un hito a la vez**: No avanzar hasta completar el anterior
2. **Testing continuo**: Probar cada cambio inmediatamente
3. **Iteración rápida**: Cambios pequeños, feedback inmediato
4. **Documentación**: Registrar decisiones y aprendizajes

### **Criterios de Avance**
- ✅ Todos los criterios de éxito del hito cumplidos
- ✅ No regresiones en funcionalidad existente
- ✅ Rendimiento dentro de parámetros aceptables
- ✅ Código limpio y bien documentado

---

**🎯 OBJETIVO FINAL**: Sistema de navegación que haga que las naves se sientan como entidades inteligentes y vivas, navegando de forma natural y realista por el espacio, evitando obstáculos y manteniéndose siempre orientadas hacia su destino con un rendimiento excepcional. 