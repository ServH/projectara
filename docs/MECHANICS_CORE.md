# 🎯 MECÁNICAS CORE - PROJECT ARA

## 🚀 Visión General

Project Ara implementa las mecánicas fundamentales de Galcon con un enfoque en **ritmo frenético**, **feedback inmediato** y **simplicidad elegante**.

## 🎮 Mecánicas Fundamentales

### 1. 🪐 PRODUCCIÓN AUTOMÁTICA DE NAVES

#### Estado Actual
- Velocidad: 0.5-2.0 naves/segundo según tamaño
- Problema: **Demasiado lenta para ritmo frenético**

#### Mejoras Planificadas
```javascript
// Nuevas velocidades de producción
const PRODUCTION_RATES = {
    small: 2.0,   // 2 naves/segundo
    medium: 3.5,  // 3.5 naves/segundo  
    large: 5.0,   // 5 naves/segundo
    huge: 7.0     // 7 naves/segundo
};
```

#### Implementación
- **Archivo**: `src/entities/Planet.js`
- **Método**: `getProductionRate()`
- **Sistema**: Producción continua en `update(deltaTime)`

---

### 2. 🎯 MULTISELECCIÓN FLUIDA

#### Estado Actual
- ✅ Click individual funciona
- ✅ Drag selection básico implementado
- ❌ **Falta drag & drop para envío**

#### Mecánica Objetivo
1. **Selección**: Drag para seleccionar múltiples planetas
2. **Envío**: Drag desde planetas seleccionados al objetivo
3. **Feedback**: Líneas visuales durante el drag

#### Implementación Planificada
```javascript
// Nuevo flujo de drag & drop
1. MouseDown en planeta seleccionado → Iniciar drag
2. MouseMove → Mostrar línea de envío
3. MouseUp en planeta objetivo → Enviar flotas
```

---

### 3. 🚀 ENVÍO MASIVO DE FLOTAS

#### Estado Actual
- ✅ Click en objetivo envía desde seleccionados
- ❌ **Falta drag & drop intuitivo**
- ❌ **Falta feedback visual durante envío**

#### Mejoras Planificadas
- **Drag & Drop**: Arrastrar desde selección al objetivo
- **Líneas de envío**: Visualizar trayectorias
- **Porcentaje dinámico**: Ajustar con scroll wheel

---

### 4. 🤖 IA AGRESIVA

#### Estado Actual
- ✅ Toma decisiones cada 2 segundos
- ✅ Evalúa situaciones (expand, attack, defend)
- ❌ **No es suficientemente agresiva**
- ❌ **Decisiones muy espaciadas**

#### Mejoras Planificadas
```javascript
// Nueva configuración de IA
const AI_CONFIG = {
    decisionInterval: 800,      // 0.8 segundos (más frecuente)
    aggressiveness: 0.9,        // Muy agresiva
    minShipsToAttack: 8,        // Umbral más bajo
    fleetSendPercentage: 0.8    // Envía más naves
};
```

---

### 5. ⚔️ COMBATE INSTANTÁNEO

#### Estado Actual
- ✅ Combate se resuelve al llegar flotas
- ✅ Sistema simple: atacantes vs defensores
- ✅ Conquista automática si atacantes > defensores

#### Funcionamiento
```javascript
// Lógica de combate actual
if (attackingShips > defendingShips) {
    // Conquista exitosa
    planet.owner = attacker;
    planet.ships = attackingShips - defendingShips;
} else {
    // Defensa exitosa
    planet.ships = defendingShips - attackingShips;
}
```

---

## 🔧 Configuraciones de Balance

### Producción de Naves
```javascript
// src/config/BalanceConfig.js
export const PRODUCTION_CONFIG = {
    rates: {
        small: 2.0,    // naves/segundo
        medium: 3.5,
        large: 5.0,
        huge: 7.0
    },
    capacities: {
        small: 50,     // máximo naves
        medium: 100,
        large: 200,
        huge: 300
    }
};
```

### IA Comportamiento
```javascript
export const AI_CONFIG = {
    decisionInterval: 800,        // ms entre decisiones
    aggressiveness: 0.9,          // 0-1 nivel agresividad
    expansionPriority: 0.8,       // prioridad expandirse
    fleetSendPercentage: 0.8,     // % naves a enviar
    minShipsToAttack: 8           // mínimo para atacar
};
```

### Movimiento de Flotas
```javascript
export const MOVEMENT_CONFIG = {
    baseSpeed: 200,               // píxeles/segundo
    speedVariation: 0.2,          // variación por tamaño
    trailLength: 12,              // longitud estela
    arrivalThreshold: 5           // píxeles para "llegada"
};
```

---

## 📊 Métricas de Rendimiento

### Objetivos de Ritmo
- **Producción**: 2-7 naves/segundo por planeta
- **IA**: Decisiones cada 0.8 segundos
- **Flotas**: Velocidad 200+ píxeles/segundo
- **Combate**: Resolución < 50ms
- **Feedback**: Respuesta visual < 100ms

### Objetivos Técnicos
- **FPS**: 60 constantes
- **Planetas**: Soporte 50+ simultáneos
- **Flotas**: Soporte 100+ simultáneas
- **Memoria**: < 100MB uso RAM
- **CPU**: < 30% uso en dispositivos medios

---

## 🎨 Feedback Visual

### Estados de Planetas
- **Neutral**: Gris con pulso suave
- **Jugador**: Verde con glow intenso
- **IA**: Rojo con glow agresivo
- **Seleccionado**: Anillo pulsante
- **Objetivo**: Highlight temporal

### Efectos de Flotas
- **Trail**: Estela de partículas
- **Llegada**: Explosión de conquista
- **Envío**: Pulso desde origen

### Feedback de Acciones
- **Selección**: Glow inmediato
- **Envío**: Línea de trayectoria
- **Conquista**: Cambio de color animado
- **Producción**: Pulso en números

---

## 🚀 Roadmap de Implementación

### Fase 1: Reorganización (Actual)
- [x] Crear estructura de carpetas
- [x] Mover archivos existentes
- [x] Documentar mecánicas

### Fase 2: Mecánicas Core
- [ ] Acelerar producción de naves
- [ ] Implementar drag & drop
- [ ] Hacer IA más agresiva
- [ ] Mejorar feedback visual

### Fase 3: Polish y Efectos
- [ ] Sistema de partículas
- [ ] Animaciones fluidas
- [ ] Efectos de sonido
- [ ] Optimización de rendimiento

### Fase 4: Características Avanzadas
- [ ] Planetas especiales
- [ ] Power-ups temporales
- [ ] Modos de juego
- [ ] Multijugador local 