/**
 * 🗺️ GALCON GAME - SPATIAL PARTITIONING SYSTEM
 * Sistema de particionado espacial para optimizar búsquedas
 * MILESTONE 2.2: Optimización para Múltiples Elementos
 */

export class SpatialGrid {
    constructor(worldWidth, worldHeight, cellSize = 100) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cellSize = cellSize;
        
        // Calcular dimensiones de la grid
        this.cols = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);
        
        // Grid de celdas
        this.grid = [];
        this.initializeGrid();
        
        // Cache para optimización
        this.queryCache = new Map();
        this.lastCacheUpdate = 0;
        this.cacheUpdateInterval = 50; // ms
        
        // Estadísticas
        this.stats = {
            totalObjects: 0,
            queriesThisFrame: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        console.log(`🗺️ SpatialGrid inicializado: ${this.cols}x${this.rows} celdas (${cellSize}px cada una)`);
    }

    /**
     * Inicializar grid vacía
     */
    initializeGrid() {
        this.grid = [];
        for (let i = 0; i < this.cols * this.rows; i++) {
            this.grid[i] = new Set();
        }
    }

    /**
     * Limpiar toda la grid
     */
    clear() {
        this.grid.forEach(cell => cell.clear());
        this.stats.totalObjects = 0;
        this.queryCache.clear();
    }

    /**
     * Insertar objeto en la grid
     */
    insert(object) {
        if (!object || typeof object.x !== 'number' || typeof object.y !== 'number') {
            return;
        }
        
        const cellIndex = this.getCellIndex(object.x, object.y);
        if (cellIndex !== -1) {
            this.grid[cellIndex].add(object);
            object._spatialCellIndex = cellIndex; // Cache para remoción rápida
            this.stats.totalObjects++;
        }
    }

    /**
     * Remover objeto de la grid
     */
    remove(object) {
        if (!object || object._spatialCellIndex === undefined) {
            return;
        }
        
        const cellIndex = object._spatialCellIndex;
        if (cellIndex >= 0 && cellIndex < this.grid.length) {
            if (this.grid[cellIndex].delete(object)) {
                this.stats.totalObjects--;
            }
        }
        
        delete object._spatialCellIndex;
    }

    /**
     * Actualizar posición de objeto (remover + insertar)
     */
    update(object) {
        this.remove(object);
        this.insert(object);
    }

    /**
     * Buscar objetos en un área rectangular
     */
    queryRect(x, y, width, height) {
        const cacheKey = `rect_${Math.floor(x)}_${Math.floor(y)}_${Math.floor(width)}_${Math.floor(height)}`;
        
        // Verificar cache
        if (this.queryCache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.queryCache.get(cacheKey);
        }
        
        const results = new Set();
        
        // Calcular rango de celdas a verificar
        const startCol = Math.max(0, Math.floor(x / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.floor((x + width) / this.cellSize));
        const startRow = Math.max(0, Math.floor(y / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.floor((y + height) / this.cellSize));
        
        // Iterar sobre celdas relevantes
        for (let col = startCol; col <= endCol; col++) {
            for (let row = startRow; row <= endRow; row++) {
                const cellIndex = row * this.cols + col;
                const cell = this.grid[cellIndex];
                
                cell.forEach(object => {
                    // Verificar si el objeto está realmente en el área
                    if (this.objectIntersectsRect(object, x, y, width, height)) {
                        results.add(object);
                    }
                });
            }
        }
        
        const resultArray = Array.from(results);
        
        // Cachear resultado
        this.queryCache.set(cacheKey, resultArray);
        this.stats.cacheMisses++;
        this.stats.queriesThisFrame++;
        
        return resultArray;
    }

    /**
     * Buscar objetos cerca de un punto
     */
    queryRadius(x, y, radius) {
        const cacheKey = `radius_${Math.floor(x)}_${Math.floor(y)}_${Math.floor(radius)}`;
        
        // Verificar cache
        if (this.queryCache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.queryCache.get(cacheKey);
        }
        
        // Buscar en área rectangular que contiene el círculo
        const rectX = x - radius;
        const rectY = y - radius;
        const rectSize = radius * 2;
        
        const candidates = this.queryRect(rectX, rectY, rectSize, rectSize);
        
        // Filtrar por distancia real
        const results = candidates.filter(object => {
            const dx = object.x - x;
            const dy = object.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
        
        // Cachear resultado
        this.queryCache.set(cacheKey, results);
        this.stats.cacheMisses++;
        this.stats.queriesThisFrame++;
        
        return results;
    }

    /**
     * Obtener vecinos más cercanos a un objeto
     */
    getNearbyObjects(object, maxDistance, maxCount = 10) {
        if (!object) return [];
        
        const candidates = this.queryRadius(object.x, object.y, maxDistance);
        
        // Filtrar el objeto mismo y calcular distancias
        const neighbors = candidates
            .filter(candidate => candidate !== object)
            .map(candidate => ({
                object: candidate,
                distance: this.getDistance(object, candidate)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxCount)
            .map(item => item.object);
        
        return neighbors;
    }

    /**
     * Detectar colisiones entre objetos
     */
    detectCollisions(objects, collisionRadius = 10) {
        const collisions = [];
        
        objects.forEach(object => {
            const nearby = this.queryRadius(object.x, object.y, collisionRadius * 2);
            
            nearby.forEach(other => {
                if (object !== other && this.getDistance(object, other) < collisionRadius) {
                    // Evitar duplicados (A-B y B-A)
                    if (object.id < other.id) {
                        collisions.push({ object1: object, object2: other });
                    }
                }
            });
        });
        
        return collisions;
    }

    /**
     * Obtener índice de celda para coordenadas
     */
    getCellIndex(x, y) {
        if (x < 0 || x >= this.worldWidth || y < 0 || y >= this.worldHeight) {
            return -1; // Fuera de límites
        }
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (col >= this.cols || row >= this.rows) {
            return -1;
        }
        
        return row * this.cols + col;
    }

    /**
     * Verificar si objeto intersecta con rectángulo
     */
    objectIntersectsRect(object, rectX, rectY, rectWidth, rectHeight) {
        const objRadius = object.radius || 5; // Radio por defecto
        
        return (object.x + objRadius >= rectX &&
                object.x - objRadius <= rectX + rectWidth &&
                object.y + objRadius >= rectY &&
                object.y - objRadius <= rectY + rectHeight);
    }

    /**
     * Calcular distancia entre dos objetos
     */
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Limpiar cache periódicamente
     */
    updateCache() {
        const now = Date.now();
        
        if (now - this.lastCacheUpdate > this.cacheUpdateInterval) {
            this.queryCache.clear();
            this.lastCacheUpdate = now;
            this.stats.queriesThisFrame = 0;
        }
    }

    /**
     * Redimensionar grid si cambia el mundo
     */
    resize(newWidth, newHeight) {
        this.worldWidth = newWidth;
        this.worldHeight = newHeight;
        this.cols = Math.ceil(newWidth / this.cellSize);
        this.rows = Math.ceil(newHeight / this.cellSize);
        
        // Reinicializar grid
        const oldObjects = this.getAllObjects();
        this.initializeGrid();
        
        // Reinsertar objetos
        oldObjects.forEach(object => {
            delete object._spatialCellIndex;
            this.insert(object);
        });
        
        console.log(`🗺️ SpatialGrid redimensionado: ${this.cols}x${this.rows} celdas`);
    }

    /**
     * Obtener todos los objetos en la grid
     */
    getAllObjects() {
        const allObjects = new Set();
        this.grid.forEach(cell => {
            cell.forEach(object => allObjects.add(object));
        });
        return Array.from(allObjects);
    }

    /**
     * Obtener estadísticas de la grid
     */
    getStats() {
        const cellUsage = this.grid.filter(cell => cell.size > 0).length;
        const maxObjectsPerCell = Math.max(...this.grid.map(cell => cell.size));
        const avgObjectsPerCell = this.stats.totalObjects / cellUsage || 0;
        
        return {
            ...this.stats,
            dimensions: { cols: this.cols, rows: this.rows },
            cellSize: this.cellSize,
            totalCells: this.grid.length,
            usedCells: cellUsage,
            cellUsagePercent: (cellUsage / this.grid.length) * 100,
            maxObjectsPerCell,
            avgObjectsPerCell: Math.round(avgObjectsPerCell * 100) / 100,
            cacheSize: this.queryCache.size,
            hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100 || 0
        };
    }

    /**
     * Visualizar grid para debug
     */
    getDebugVisualization() {
        const visualization = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cellIndex = row * this.cols + col;
                const cell = this.grid[cellIndex];
                
                if (cell.size > 0) {
                    visualization.push({
                        x: col * this.cellSize,
                        y: row * this.cellSize,
                        width: this.cellSize,
                        height: this.cellSize,
                        objectCount: cell.size
                    });
                }
            }
        }
        
        return visualization;
    }

    /**
     * Destruir sistema spatial
     */
    destroy() {
        this.clear();
        this.queryCache.clear();
        console.log('💥 SpatialGrid destruido');
    }
}

export default SpatialGrid; 