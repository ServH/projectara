# 🚁 LABORATORIO DE FLOTAS - STEERING BEHAVIORS

## 🎯 **NUEVAS CARACTERÍSTICAS IMPLEMENTADAS**

### ✅ **Sistema de Flotas Completo**
- **Formaciones dinámicas**: Dispersa, Línea, Cuña, Círculo
- **Liderazgo**: Una nave líder guía la formación
- **Comportamientos de Boids**: Separación, Alineación, Cohesión
- **Spatial Hashing**: Optimización O(n²) → O(n) para miles de naves

### ✅ **Controles Avanzados**
- **Modo Individual/Flota**: Ctrl/Cmd + Click para cambiar
- **Configuración en tiempo real**: Todos los parámetros ajustables
- **Debug visual completo**: Grid espacial, conexiones de flota, centros de masa

---

## 🎮 **GUÍA DE USO**

### **Controles Básicos**
- **Drag & Drop**: Crear nave individual o flota (según modo)
- **Shift + Click**: Crear obstáculo
- **Ctrl/Cmd + Click**: Cambiar entre modo Individual/Flota
- **Click en obstáculo**: Remover obstáculo

### **Modos de Operación**

#### 🚀 **Modo Individual**
- Crea naves individuales con steering behaviors completos
- Cada nave evita obstáculos independientemente
- Ideal para probar algoritmos básicos

#### 🚁 **Modo Flota**
- Crea grupos de 3-15 naves en formación
- Líder usa steering behaviors, seguidores usan boids
- Formaciones: Dispersa, Línea, Cuña, Círculo
- Optimizado con spatial hashing

---

## 🧪 **EXPERIMENTOS RECOMENDADOS**

### **1. Comparación de Rendimiento**
```
1. Crear 50 naves individuales
2. Observar FPS y tiempo de cálculo
3. Limpiar y crear 10 flotas de 5 naves
4. Comparar métricas de rendimiento
```

### **2. Comportamientos de Boids**
```
1. Activar modo Flota
2. Crear una flota grande (10-15 naves)
3. Ajustar pesos de Separación/Alineación/Cohesión
4. Observar cómo cambia el comportamiento grupal
```

### **3. Formaciones Tácticas**
```
1. Crear flota en formación "Cuña"
2. Colocar obstáculos en el camino
3. Observar cómo la formación se adapta
4. Cambiar a formación "Línea" en tiempo real
```

### **4. Spatial Hashing**
```
1. Activar "Grid Espacial" en debug
2. Crear múltiples flotas
3. Observar cómo se distribuyen en el grid
4. Verificar optimización en métricas
```

---

## 📊 **MÉTRICAS DE RENDIMIENTO**

### **Indicadores Clave**
- **FPS**: Frames por segundo (objetivo: >30)
- **Naves Activas**: Total de vehículos en simulación
- **Flotas Activas**: Número de flotas gestionadas
- **Cálculos/Frame**: Operaciones de steering por frame
- **Tiempo Promedio**: Tiempo de cálculo por frame
- **Consultas Espaciales**: Optimización del spatial hash

### **Benchmarks Esperados**
- **Individual**: 100+ naves a 60 FPS
- **Flotas**: 20+ flotas (100+ naves) a 30+ FPS
- **Spatial Hash**: Reducción 70-90% en consultas de vecindad

---

## 🔧 **CONFIGURACIÓN AVANZADA**

### **Parámetros de Flota**
- **Tamaño**: 3-15 naves por flota
- **Formación**: Spread/Line/Wedge/Circle
- **Espaciado**: Distancia entre naves (10-30px)

### **Comportamientos de Boids**
- **Separación**: Evitar aglomeración (0.5-3.0)
- **Alineación**: Seguir dirección grupal (0.5-3.0)
- **Cohesión**: Mantenerse cerca (0.5-3.0)
- **Radio de Separación**: Distancia mínima (10-40px)

### **Debug Visual**
- **Grid Espacial**: Ver optimización spatial hash
- **Conexiones de Flota**: Líneas entre líder y seguidores
- **Centro de Flota**: Punto de masa promedio
- **Fuerzas**: Vectores de steering en tiempo real

---

## 🚀 **CASOS DE USO PARA GALCON**

### **1. Flotas de Ataque**
```javascript
// Configuración recomendada para ataques
fleetSize: 8-12
formation: 'wedge'
separationWeight: 2.0
alignmentWeight: 1.5
cohesionWeight: 1.0
```

### **2. Patrullas Defensivas**
```javascript
// Configuración para defensa
fleetSize: 5-8
formation: 'circle'
separationWeight: 1.0
alignmentWeight: 2.0
cohesionWeight: 1.5
```

### **3. Exploración**
```javascript
// Configuración para reconocimiento
fleetSize: 3-5
formation: 'spread'
separationWeight: 1.5
alignmentWeight: 1.0
cohesionWeight: 0.8
```

---

## 🎯 **PRÓXIMOS PASOS**

### **Optimizaciones Pendientes**
- [ ] **Flow Fields**: Para movimiento masivo de flotas
- [ ] **Hierarchical Pathfinding**: A* para rutas complejas
- [ ] **Formation Transitions**: Cambios suaves entre formaciones
- [ ] **Dynamic Leadership**: Cambio de líder automático

### **Integración con Galcon**
- [ ] **Fleet Manager**: Sistema de gestión de flotas
- [ ] **Combat Behaviors**: Comportamientos de combate
- [ ] **Resource Optimization**: Gestión eficiente de memoria
- [ ] **Network Sync**: Sincronización multijugador

---

## 💡 **TIPS DE OPTIMIZACIÓN**

1. **Usa flotas para grupos grandes** (>5 naves)
2. **Ajusta el tamaño del spatial hash** según densidad
3. **Limita las fuerzas de boids** para evitar oscilaciones
4. **Usa formaciones apropiadas** según el contexto
5. **Monitorea las métricas** para detectar cuellos de botella

---

## 🔗 **RECURSOS ADICIONALES**

- **Craig Reynolds - Steering Behaviors**: http://www.red3d.com/cwr/steer/
- **Boids Algorithm**: https://en.wikipedia.org/wiki/Boids
- **Spatial Hashing**: Optimización para detección de colisiones
- **Flow Fields**: Para movimiento masivo eficiente

---

**¡El laboratorio está listo para experimentar con navegación avanzada y comportamientos de flota!** 🚁✨ 