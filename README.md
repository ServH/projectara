# 🚀 PROJECT ARA - Galcon-Style Space Conquest Game

**Un juego de conquista espacial en tiempo real con ritmo frenético y mecánicas fluidas**

![Project Status](https://img.shields.io/badge/Status-Active%20Development-green)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎮 Descripción

Project Ara es una implementación moderna del clásico juego Galcon, optimizada para **ritmo frenético** y **feedback inmediato**. Combina mecánicas simples con estrategia profunda, ofreciendo partidas rápidas e intensas.

### ✨ Características Principales

- 🪐 **Producción automática acelerada**: 2.5-8.0 naves/segundo
- 🤖 **IA súper agresiva**: Decisiones cada 600ms
- 🎯 **Drag & Drop intuitivo**: Envío de flotas arrastrando
- ⚡ **Multiselección fluida**: Selección múltiple con feedback visual
- 🎨 **Efectos visuales modernos**: Animaciones GPU-accelerated
- 📱 **Responsive design**: Funciona en desktop y móvil

---

## 🚀 Inicio Rápido

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/project-ara.git
cd project-ara

# Servir localmente (Python)
python -m http.server 8000

# O con Node.js
npx serve .
```

### Jugar
1. Abre `http://localhost:8000` en tu navegador
2. Selecciona tus planetas (verdes) haciendo click o arrastrando
3. Arrastra hacia planetas enemigos (rojos) o neutrales (grises) para atacar
4. ¡Conquista toda la galaxia!

---

## 🎯 Controles

| Acción | Control |
|--------|---------|
| **Seleccionar planeta** | Click izquierdo |
| **Selección múltiple** | Arrastrar para crear caja |
| **Añadir a selección** | Ctrl + Click |
| **Seleccionar todos** | Ctrl + A |
| **Enviar flotas** | Arrastrar desde seleccionados al objetivo |
| **Debug mode** | F1 |
| **Reiniciar** | F5 |
| **Pausar** | ESC o Espacio |

---

## 🏗️ Arquitectura

### Estructura del Proyecto
```
projectAra/
├── src/
│   ├── core/           # Sistemas fundamentales
│   │   ├── GameEngine.js
│   │   ├── EventBus.js
│   │   └── ...
│   ├── entities/       # Entidades del juego
│   │   ├── Planet.js
│   │   ├── Fleet.js
│   │   └── ...
│   ├── systems/        # Sistemas de juego
│   │   ├── AISystem.js
│   │   ├── SelectionSystem.js
│   │   └── ...
│   ├── input/          # Control del jugador
│   │   ├── DragDropHandler.js
│   │   └── ...
│   └── config/         # Configuraciones
│       ├── GameConfig.js
│       └── BalanceConfig.js
├── css/                # Estilos
├── docs/               # Documentación
└── assets/             # Recursos
```

### Sistemas Principales

#### 🎮 GameEngine
- Loop principal a 60 FPS
- Gestión de entidades
- Sistema de eventos
- Verificación de victoria

#### 🪐 Planet System
- Producción automática de naves
- Capacidades variables por tamaño
- Mecánicas de conquista
- Efectos visuales

#### 🤖 AI System
- Decisiones cada 600ms
- Múltiples estrategias
- Evaluación de situaciones
- Ataques coordinados

#### 🎯 Input System
- Multiselección fluida
- Drag & Drop intuitivo
- Feedback visual inmediato
- Controles responsivos

---

## ⚖️ Balance y Configuración

### Producción de Naves
```javascript
// Velocidades por tamaño de planeta
small:  2.5 naves/segundo
medium: 4.0 naves/segundo
large:  6.0 naves/segundo
huge:   8.0 naves/segundo
```

### IA Comportamiento
```javascript
// Configuración de agresividad
decisionInterval: 600ms     // Muy frecuente
aggressiveness: 0.85        // Muy agresiva
minShipsToAttack: 8         // Threshold bajo
attackPercentage: 0.8       // 80% de naves
```

### Personalización
Todos los parámetros son configurables en:
- `src/config/GameConfig.js` - Configuración general
- `src/config/BalanceConfig.js` - Balance de mecánicas

---

## 📊 Métricas de Rendimiento

### Objetivos
- **FPS**: 60 constantes
- **Planetas**: Soporte 50+ simultáneos
- **Flotas**: Soporte 100+ simultáneas
- **Respuesta**: < 100ms feedback visual
- **Memoria**: < 100MB uso RAM

### Optimizaciones
- Hardware acceleration (GPU)
- Efficient collision detection
- Object pooling para flotas
- Culling de elementos fuera de pantalla

---

## 🛠️ Desarrollo

### Requisitos
- Navegador moderno con ES6+ support
- Servidor web local para desarrollo
- Editor con soporte JavaScript/ES6

### Scripts de Desarrollo
```bash
# Servidor de desarrollo
npm run dev

# Linting
npm run lint

# Testing
npm run test

# Build para producción
npm run build
```

### Estructura de Commits
```
feat: nueva característica
fix: corrección de bug
docs: actualización documentación
style: cambios de estilo/formato
refactor: refactorización de código
test: añadir/modificar tests
```

---

## 📚 Documentación

- [📁 Estructura del Proyecto](docs/PROJECT_STRUCTURE.md)
- [🎯 Mecánicas Core](docs/MECHANICS_CORE.md)
- [📝 Log de Desarrollo](docs/DEVELOPMENT_LOG.md)
- [🔧 API Reference](docs/API_REFERENCE.md)

---

## 🚀 Roadmap

### ✅ Fase 1: Core Mechanics (Completada)
- [x] Arquitectura modular
- [x] Producción acelerada
- [x] IA agresiva
- [x] Drag & Drop
- [x] Efectos visuales

### 🔄 Fase 2: Polish & Optimization (En desarrollo)
- [ ] Balanceo fino
- [ ] Efectos de sonido
- [ ] Optimización rendimiento
- [ ] Testing extensivo

### 📋 Fase 3: Advanced Features
- [ ] Planetas especiales
- [ ] Power-ups temporales
- [ ] Modos de juego
- [ ] Multijugador local

### 🌟 Fase 4: Enhanced Experience
- [ ] Campaña single-player
- [ ] Editor de mapas
- [ ] Achievements
- [ ] Leaderboards

---

## 🤝 Contribuir

### Cómo Contribuir
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guidelines
- Seguir la arquitectura modular existente
- Documentar nuevas características
- Mantener compatibilidad con configuraciones
- Añadir tests para nueva funcionalidad

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

## 🙏 Agradecimientos

- Inspirado en el clásico **Galcon** de Phil Hassey
- Arquitectura basada en patrones modernos de game development
- Comunidad de desarrolladores de juegos web

---

## 📞 Contacto

- **Proyecto**: [Project Ara](https://github.com/tu-usuario/project-ara)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/project-ara/issues)
- **Documentación**: [Wiki](https://github.com/tu-usuario/project-ara/wiki)

---

**¡Conquista la galaxia! 🌌** 