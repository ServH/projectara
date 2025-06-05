/**
 * 🚀 OPTIMIZATION TECHNIQUES MODULE
 * Técnicas avanzadas de optimización para testing con miles de flotas
 */

// 🔧 OBJECT POOLING SYSTEM
export class ObjectPool {
    constructor(createFn, resetFn, maxSize = 10000) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = new Set();
        this.maxSize = maxSize;
    }

    acquire() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        
        this.active.add(obj);
        return obj;
    }

    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            this.resetFn(obj);
            
            if (this.pool.length < this.maxSize) {
                this.pool.push(obj);
            }
        }
    }

    getStats() {
        return {
            pooled: this.pool.length,
            active: this.active.size,
            total: this.pool.length + this.active.size
        };
    }
}

// 🗺️ SPATIAL GRID SYSTEM
export class SpatialGrid {
    constructor(cellSize = 200, mapWidth = 2000, mapHeight = 2000) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(mapWidth / cellSize);
        this.rows = Math.ceil(mapHeight / cellSize);
        this.cells = new Map();
        this.objectToCells = new Map();
    }

    getCellKey(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }

    addObject(obj, x, y) {
        const key = this.getCellKey(x, y);
        
        if (!this.cells.has(key)) {
            this.cells.set(key, new Set());
        }
        
        this.cells.get(key).add(obj);
        this.objectToCells.set(obj, key);
    }

    removeObject(obj) {
        const key = this.objectToCells.get(obj);
        if (key && this.cells.has(key)) {
            this.cells.get(key).delete(obj);
            this.objectToCells.delete(obj);
        }
    }

    updateObject(obj, newX, newY) {
        const oldKey = this.objectToCells.get(obj);
        const newKey = this.getCellKey(newX, newY);
        
        if (oldKey !== newKey) {
            this.removeObject(obj);
            this.addObject(obj, newX, newY);
        }
    }

    getObjectsInRadius(x, y, radius) {
        const objects = new Set();
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCol = Math.floor(x / this.cellSize);
        const centerRow = Math.floor(y / this.cellSize);

        for (let col = centerCol - cellRadius; col <= centerCol + cellRadius; col++) {
            for (let row = centerRow - cellRadius; row <= centerRow + cellRadius; row++) {
                const key = `${col},${row}`;
                const cell = this.cells.get(key);
                if (cell) {
                    cell.forEach(obj => objects.add(obj));
                }
            }
        }

        return Array.from(objects);
    }

    getVisibleObjects(viewport) {
        const objects = new Set();
        const startCol = Math.floor(viewport.x / this.cellSize);
        const endCol = Math.floor((viewport.x + viewport.width) / this.cellSize);
        const startRow = Math.floor(viewport.y / this.cellSize);
        const endRow = Math.floor((viewport.y + viewport.height) / this.cellSize);

        for (let col = startCol; col <= endCol; col++) {
            for (let row = startRow; row <= endRow; row++) {
                const key = `${col},${row}`;
                const cell = this.cells.get(key);
                if (cell) {
                    cell.forEach(obj => objects.add(obj));
                }
            }
        }

        return Array.from(objects);
    }

    clear() {
        this.cells.clear();
        this.objectToCells.clear();
    }

    getStats() {
        return {
            totalCells: this.cells.size,
            totalObjects: this.objectToCells.size,
            averageObjectsPerCell: this.objectToCells.size / Math.max(1, this.cells.size)
        };
    }
}

// 🎯 VIEWPORT CULLING SYSTEM
export class ViewportCuller {
    constructor(margin = 100) {
        this.margin = margin;
        this.lastViewport = null;
        this.visibleObjects = new Set();
        this.culledObjects = new Set();
    }

    updateViewport(viewport) {
        this.lastViewport = { ...viewport };
    }

    cullObjects(objects, viewport = this.lastViewport) {
        if (!viewport) return { visible: objects, culled: [] };

        const visible = [];
        const culled = [];

        const left = viewport.x - this.margin;
        const right = viewport.x + viewport.width + this.margin;
        const top = viewport.y - this.margin;
        const bottom = viewport.y + viewport.height + this.margin;

        objects.forEach(obj => {
            if (obj.x >= left && obj.x <= right && obj.y >= top && obj.y <= bottom) {
                visible.push(obj);
                this.visibleObjects.add(obj);
                this.culledObjects.delete(obj);
            } else {
                culled.push(obj);
                this.culledObjects.add(obj);
                this.visibleObjects.delete(obj);
            }
        });

        return { visible, culled };
    }

    getStats() {
        return {
            visible: this.visibleObjects.size,
            culled: this.culledObjects.size,
            total: this.visibleObjects.size + this.culledObjects.size
        };
    }
}

// 📐 LEVEL OF DETAIL SYSTEM
export class LODSystem {
    constructor(thresholds = [300, 600, 1000]) {
        this.thresholds = thresholds; // Distancias para cada nivel
        this.lodLevels = {
            0: 'detailed',    // Triángulos completos
            1: 'simplified',  // Círculos
            2: 'minimal',     // Puntos
            3: 'hidden'       // No renderizar
        };
    }

    calculateLOD(object, viewportCenter, zoom = 1) {
        const distance = Math.sqrt(
            (object.x - viewportCenter.x) ** 2 + 
            (object.y - viewportCenter.y) ** 2
        ) / zoom;

        for (let i = 0; i < this.thresholds.length; i++) {
            if (distance <= this.thresholds[i]) {
                return i;
            }
        }

        return this.thresholds.length; // Máximo LOD (hidden)
    }

    updateObjectsLOD(objects, viewportCenter, zoom = 1) {
        const lodCounts = [0, 0, 0, 0];

        objects.forEach(obj => {
            obj.lodLevel = this.calculateLOD(obj, viewportCenter, zoom);
            lodCounts[obj.lodLevel]++;
        });

        return {
            detailed: lodCounts[0],
            simplified: lodCounts[1],
            minimal: lodCounts[2],
            hidden: lodCounts[3]
        };
    }
}

// 🎨 BATCH RENDERING SYSTEM
export class BatchRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.batches = {
            detailed: [],
            simplified: [],
            minimal: []
        };
    }

    clear() {
        this.batches.detailed = [];
        this.batches.simplified = [];
        this.batches.minimal = [];
    }

    addToBatch(object, lodLevel) {
        switch (lodLevel) {
            case 0:
                this.batches.detailed.push(object);
                break;
            case 1:
                this.batches.simplified.push(object);
                break;
            case 2:
                this.batches.minimal.push(object);
                break;
        }
    }

    renderBatches() {
        // Renderizar triángulos detallados
        if (this.batches.detailed.length > 0) {
            this.renderDetailedBatch(this.batches.detailed);
        }

        // Renderizar círculos simplificados
        if (this.batches.simplified.length > 0) {
            this.renderSimplifiedBatch(this.batches.simplified);
        }

        // Renderizar puntos mínimos
        if (this.batches.minimal.length > 0) {
            this.renderMinimalBatch(this.batches.minimal);
        }
    }

    renderDetailedBatch(objects) {
        objects.forEach(obj => {
            this.ctx.fillStyle = obj.color;
            this.ctx.beginPath();
            this.ctx.moveTo(obj.x, obj.y - obj.size);
            this.ctx.lineTo(obj.x - obj.size, obj.y + obj.size);
            this.ctx.lineTo(obj.x + obj.size, obj.y + obj.size);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    renderSimplifiedBatch(objects) {
        objects.forEach(obj => {
            this.ctx.fillStyle = obj.color;
            this.ctx.beginPath();
            this.ctx.arc(obj.x, obj.y, obj.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderMinimalBatch(objects) {
        // Agrupar por color para optimizar
        const colorGroups = {};
        objects.forEach(obj => {
            if (!colorGroups[obj.color]) {
                colorGroups[obj.color] = [];
            }
            colorGroups[obj.color].push(obj);
        });

        // Renderizar cada grupo de color
        Object.entries(colorGroups).forEach(([color, objs]) => {
            this.ctx.fillStyle = color;
            objs.forEach(obj => {
                this.ctx.fillRect(obj.x - 1, obj.y - 1, 2, 2);
            });
        });
    }

    getStats() {
        return {
            detailed: this.batches.detailed.length,
            simplified: this.batches.simplified.length,
            minimal: this.batches.minimal.length,
            total: this.batches.detailed.length + this.batches.simplified.length + this.batches.minimal.length
        };
    }
}

// 🔄 ADAPTIVE QUALITY SYSTEM
export class AdaptiveQualitySystem {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;
        this.currentFPS = 60;
        this.fpsHistory = [];
        this.qualityLevel = 1.0; // 0.0 = mínima, 1.0 = máxima
        this.adjustmentRate = 0.05;
        
        this.settings = {
            maxRenderDistance: 1000,
            lodThresholds: [300, 600, 1000],
            cullingMargin: 200,
            maxVisibleObjects: 2000
        };
    }

    updateFPS(fps) {
        this.currentFPS = fps;
        this.fpsHistory.push(fps);
        
        if (this.fpsHistory.length > 30) {
            this.fpsHistory.shift();
        }

        this.adjustQuality();
    }

    adjustQuality() {
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        if (avgFPS < this.targetFPS - 5) {
            // Reducir calidad
            this.qualityLevel = Math.max(0.1, this.qualityLevel - this.adjustmentRate);
        } else if (avgFPS > this.targetFPS + 5) {
            // Aumentar calidad
            this.qualityLevel = Math.min(1.0, this.qualityLevel + this.adjustmentRate);
        }

        this.updateSettings();
    }

    updateSettings() {
        const q = this.qualityLevel;
        
        this.settings.maxRenderDistance = 500 + (q * 1500);
        this.settings.lodThresholds = [
            150 + (q * 150),  // 150-300
            300 + (q * 300),  // 300-600
            500 + (q * 500)   // 500-1000
        ];
        this.settings.cullingMargin = 100 + (q * 300);
        this.settings.maxVisibleObjects = 500 + (q * 2500);
    }

    getSettings() {
        return { ...this.settings };
    }

    getStats() {
        return {
            qualityLevel: this.qualityLevel,
            currentFPS: this.currentFPS,
            averageFPS: this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length,
            settings: this.settings
        };
    }
}

// 🧵 WEB WORKER MANAGER
export class WebWorkerManager {
    constructor() {
        this.workers = [];
        this.taskQueue = [];
        this.isProcessing = false;
    }

    createWorker(workerScript) {
        const worker = new Worker(workerScript);
        this.workers.push(worker);
        return worker;
    }

    async processFleetCalculations(fleets, deltaTime) {
        return new Promise((resolve) => {
            if (this.workers.length === 0) {
                // Fallback: procesar en main thread
                resolve(this.processFleetsFallback(fleets, deltaTime));
                return;
            }

            const worker = this.workers[0];
            
            worker.onmessage = (e) => {
                resolve(e.data.updatedFleets);
            };

            worker.postMessage({
                type: 'updateFleets',
                fleets: fleets.map(f => ({
                    id: f.id,
                    x: f.x,
                    y: f.y,
                    targetX: f.targetX,
                    targetY: f.targetY,
                    speed: f.speed
                })),
                deltaTime
            });
        });
    }

    processFleetsFallback(fleets, deltaTime) {
        return fleets.map(fleet => {
            const dx = fleet.targetX - fleet.x;
            const dy = fleet.targetY - fleet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) {
                const moveDistance = fleet.speed * deltaTime;
                fleet.x += (dx / distance) * moveDistance;
                fleet.y += (dy / distance) * moveDistance;
            }

            return fleet;
        });
    }

    destroy() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
    }
}

// 📊 PERFORMANCE MONITOR
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            frameTime: 0,
            renderTime: 0,
            updateTime: 0,
            memoryUsage: 0,
            objectCount: 0,
            visibleObjects: 0,
            culledObjects: 0
        };

        this.history = {
            fps: [],
            frameTime: [],
            renderTime: [],
            updateTime: []
        };

        this.maxHistoryLength = 300; // 5 segundos a 60 FPS
    }

    startFrame() {
        this.frameStartTime = performance.now();
    }

    startRender() {
        this.renderStartTime = performance.now();
    }

    endRender() {
        this.metrics.renderTime = performance.now() - this.renderStartTime;
    }

    startUpdate() {
        this.updateStartTime = performance.now();
    }

    endUpdate() {
        this.metrics.updateTime = performance.now() - this.updateStartTime;
    }

    endFrame() {
        const frameEndTime = performance.now();
        this.metrics.frameTime = frameEndTime - this.frameStartTime;
        this.metrics.fps = 1000 / this.metrics.frameTime;

        // Actualizar historial
        this.updateHistory('fps', this.metrics.fps);
        this.updateHistory('frameTime', this.metrics.frameTime);
        this.updateHistory('renderTime', this.metrics.renderTime);
        this.updateHistory('updateTime', this.metrics.updateTime);

        // Memoria (aproximada)
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
        }
    }

    updateHistory(metric, value) {
        if (!this.history[metric]) {
            this.history[metric] = [];
        }

        this.history[metric].push(value);
        if (this.history[metric].length > this.maxHistoryLength) {
            this.history[metric].shift();
        }
    }

    updateObjectCounts(total, visible, culled) {
        this.metrics.objectCount = total;
        this.metrics.visibleObjects = visible;
        this.metrics.culledObjects = culled;
    }

    getAverages() {
        const averages = {};
        
        Object.keys(this.history).forEach(metric => {
            const values = this.history[metric];
            if (values.length > 0) {
                averages[metric] = values.reduce((a, b) => a + b, 0) / values.length;
            } else {
                averages[metric] = 0;
            }
        });

        return averages;
    }

    getMetrics() {
        return { ...this.metrics };
    }

    getDetailedReport() {
        const averages = this.getAverages();
        
        return {
            current: this.metrics,
            averages,
            performance: {
                status: this.metrics.fps >= 55 ? 'excellent' : 
                       this.metrics.fps >= 30 ? 'good' : 'poor',
                bottleneck: this.identifyBottleneck()
            }
        };
    }

    identifyBottleneck() {
        if (this.metrics.renderTime > this.metrics.updateTime * 2) {
            return 'rendering';
        } else if (this.metrics.updateTime > this.metrics.renderTime * 2) {
            return 'logic';
        } else {
            return 'balanced';
        }
    }

    reset() {
        Object.keys(this.history).forEach(metric => {
            this.history[metric] = [];
        });
    }
} 