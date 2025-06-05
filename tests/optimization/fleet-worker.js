/**
 * 🧵 FLEET CALCULATION WEB WORKER
 * Procesa cálculos de movimiento de flotas en paralelo
 */

// Escuchar mensajes del hilo principal
self.onmessage = function(e) {
    const { type, data } = e.data;

    switch (type) {
        case 'updateFleets':
            const updatedFleets = updateFleets(data.fleets, data.deltaTime, data.config);
            self.postMessage({
                type: 'fleetsUpdated',
                updatedFleets: updatedFleets,
                processingTime: performance.now() - data.startTime
            });
            break;

        case 'calculateCollisions':
            const collisions = calculateCollisions(data.fleets, data.spatialGrid);
            self.postMessage({
                type: 'collisionsCalculated',
                collisions: collisions
            });
            break;

        case 'pathfinding':
            const paths = calculatePaths(data.requests);
            self.postMessage({
                type: 'pathsCalculated',
                paths: paths
            });
            break;

        case 'spatialUpdate':
            const spatialData = updateSpatialGrid(data.objects, data.gridConfig);
            self.postMessage({
                type: 'spatialUpdated',
                spatialData: spatialData
            });
            break;

        default:
            console.warn('Unknown worker message type:', type);
    }
};

/**
 * Actualizar posiciones de flotas
 */
function updateFleets(fleets, deltaTime, config = {}) {
    const speedMultiplier = config.speedMultiplier || 1.0;
    const mapSize = config.mapSize || 2000;
    const updatedFleets = [];

    for (let i = 0; i < fleets.length; i++) {
        const fleet = fleets[i];
        
        // Calcular movimiento hacia target
        const dx = fleet.targetX - fleet.x;
        const dy = fleet.targetY - fleet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            // Mover hacia target
            const moveDistance = fleet.speed * deltaTime * speedMultiplier;
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            fleet.x += normalizedDx * moveDistance;
            fleet.y += normalizedDy * moveDistance;
        } else {
            // Generar nuevo target aleatorio
            fleet.targetX = Math.random() * mapSize;
            fleet.targetY = Math.random() * mapSize;
        }

        // Mantener dentro de los límites del mapa
        fleet.x = Math.max(0, Math.min(mapSize, fleet.x));
        fleet.y = Math.max(0, Math.min(mapSize, fleet.y));

        updatedFleets.push({
            id: fleet.id,
            x: fleet.x,
            y: fleet.y,
            targetX: fleet.targetX,
            targetY: fleet.targetY,
            speed: fleet.speed
        });
    }

    return updatedFleets;
}

/**
 * Calcular colisiones entre flotas
 */
function calculateCollisions(fleets, spatialGrid) {
    const collisions = [];
    const collisionRadius = 10;
    const processedPairs = new Set();

    // Usar spatial grid para optimizar detección de colisiones
    if (spatialGrid && spatialGrid.cells) {
        Object.values(spatialGrid.cells).forEach(cell => {
            const cellFleets = cell.objects || [];
            
            for (let i = 0; i < cellFleets.length; i++) {
                for (let j = i + 1; j < cellFleets.length; j++) {
                    const fleet1 = cellFleets[i];
                    const fleet2 = cellFleets[j];
                    
                    const pairKey = `${Math.min(fleet1.id, fleet2.id)}-${Math.max(fleet1.id, fleet2.id)}`;
                    if (processedPairs.has(pairKey)) continue;
                    processedPairs.add(pairKey);

                    const dx = fleet2.x - fleet1.x;
                    const dy = fleet2.y - fleet1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < collisionRadius) {
                        collisions.push({
                            fleet1: fleet1.id,
                            fleet2: fleet2.id,
                            distance: distance,
                            x: (fleet1.x + fleet2.x) / 2,
                            y: (fleet1.y + fleet2.y) / 2
                        });
                    }
                }
            }
        });
    } else {
        // Fallback: detección bruta force (solo para pocos objetos)
        for (let i = 0; i < fleets.length && i < 100; i++) {
            for (let j = i + 1; j < fleets.length && j < 100; j++) {
                const fleet1 = fleets[i];
                const fleet2 = fleets[j];

                const dx = fleet2.x - fleet1.x;
                const dy = fleet2.y - fleet1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < collisionRadius) {
                    collisions.push({
                        fleet1: fleet1.id,
                        fleet2: fleet2.id,
                        distance: distance,
                        x: (fleet1.x + fleet2.x) / 2,
                        y: (fleet1.y + fleet2.y) / 2
                    });
                }
            }
        }
    }

    return collisions;
}

/**
 * Calcular rutas de pathfinding
 */
function calculatePaths(requests) {
    const paths = [];

    requests.forEach(request => {
        const { from, to, obstacles = [] } = request;
        
        // Pathfinding simple A* simplificado
        const path = simplePathfinding(from, to, obstacles);
        
        paths.push({
            id: request.id,
            path: path,
            distance: calculatePathDistance(path)
        });
    });

    return paths;
}

/**
 * Pathfinding simple (línea recta con evasión básica)
 */
function simplePathfinding(from, to, obstacles) {
    const path = [from];
    
    // Si no hay obstáculos, línea recta
    if (obstacles.length === 0) {
        path.push(to);
        return path;
    }

    // Pathfinding básico con evasión
    let current = { ...from };
    const stepSize = 50;
    const maxSteps = 100;
    let steps = 0;

    while (steps < maxSteps) {
        const dx = to.x - current.x;
        const dy = to.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < stepSize) {
            path.push(to);
            break;
        }

        // Calcular siguiente paso
        const nextX = current.x + (dx / distance) * stepSize;
        const nextY = current.y + (dy / distance) * stepSize;

        // Verificar colisión con obstáculos
        let collision = false;
        for (const obstacle of obstacles) {
            const obstacleDistance = Math.sqrt(
                (nextX - obstacle.x) ** 2 + (nextY - obstacle.y) ** 2
            );
            if (obstacleDistance < obstacle.radius + 20) {
                collision = true;
                break;
            }
        }

        if (!collision) {
            current = { x: nextX, y: nextY };
            path.push({ ...current });
        } else {
            // Evasión simple: intentar rodear
            const avoidanceAngle = Math.PI / 4; // 45 grados
            const angle = Math.atan2(dy, dx);
            
            // Probar ambas direcciones
            for (const direction of [-1, 1]) {
                const newAngle = angle + (avoidanceAngle * direction);
                const avoidX = current.x + Math.cos(newAngle) * stepSize;
                const avoidY = current.y + Math.sin(newAngle) * stepSize;
                
                let avoidCollision = false;
                for (const obstacle of obstacles) {
                    const obstacleDistance = Math.sqrt(
                        (avoidX - obstacle.x) ** 2 + (avoidY - obstacle.y) ** 2
                    );
                    if (obstacleDistance < obstacle.radius + 20) {
                        avoidCollision = true;
                        break;
                    }
                }
                
                if (!avoidCollision) {
                    current = { x: avoidX, y: avoidY };
                    path.push({ ...current });
                    break;
                }
            }
        }

        steps++;
    }

    return path;
}

/**
 * Calcular distancia total de una ruta
 */
function calculatePathDistance(path) {
    let totalDistance = 0;
    
    for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i-1].x;
        const dy = path[i].y - path[i-1].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    
    return totalDistance;
}

/**
 * Actualizar spatial grid
 */
function updateSpatialGrid(objects, gridConfig) {
    const { cellSize = 200, mapWidth = 2000, mapHeight = 2000 } = gridConfig;
    const cols = Math.ceil(mapWidth / cellSize);
    const rows = Math.ceil(mapHeight / cellSize);
    const cells = {};

    // Distribuir objetos en celdas
    objects.forEach(obj => {
        const col = Math.floor(obj.x / cellSize);
        const row = Math.floor(obj.y / cellSize);
        const key = `${col},${row}`;

        if (!cells[key]) {
            cells[key] = {
                objects: [],
                bounds: {
                    left: col * cellSize,
                    right: (col + 1) * cellSize,
                    top: row * cellSize,
                    bottom: (row + 1) * cellSize
                }
            };
        }

        cells[key].objects.push(obj);
    });

    return {
        cells: cells,
        stats: {
            totalCells: Object.keys(cells).length,
            totalObjects: objects.length,
            averageObjectsPerCell: objects.length / Math.max(1, Object.keys(cells).length)
        }
    };
}

/**
 * Utilidades matemáticas optimizadas
 */
const MathUtils = {
    // Distancia rápida sin sqrt (para comparaciones)
    fastDistance: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    },

    // Normalizar vector
    normalize: (x, y) => {
        const length = Math.sqrt(x * x + y * y);
        return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
    },

    // Interpolar entre dos puntos
    lerp: (a, b, t) => {
        return a + (b - a) * t;
    },

    // Clamp valor entre min y max
    clamp: (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    }
};

// Exponer utilidades para uso interno
self.MathUtils = MathUtils;

// Mensaje de inicialización
self.postMessage({
    type: 'workerReady',
    message: '🧵 Fleet Worker initialized and ready for processing'
});

console.log('🧵 Fleet Calculation Worker loaded successfully'); 