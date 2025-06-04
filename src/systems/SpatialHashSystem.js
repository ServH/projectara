/**
 * 🔍 SPATIAL HASH SYSTEM - Optimización Espacial O(n²) → O(n)
 * Sistema de hash espacial para optimizar búsquedas de vecinos
 * Migrado exactamente del laboratorio - OPTIMIZACIÓN PROBADA
 */

import { Vector2D } from '../utils/Vector2D.js';

export class SpatialHashSystem {
    constructor(cellSize = 50) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.objects = new Map(); // Mapeo objeto → celdas que ocupa
        
        // Estadísticas de rendimiento
        this.stats = {
            totalObjects: 0,
            totalCells: 0,
            averageObjectsPerCell: 0,
            lastUpdateTime: 0,
            queriesPerFrame: 0
        };
        
        console.log(`🔍 SpatialHashSystem inicializado con cellSize: ${cellSize}`);
    }

    /**
     * 🔑 Calcular clave de celda para una posición
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * 📍 Obtener todas las celdas que ocupa un objeto
     */
    getObjectCells(position, radius = 0) {
        const cells = [];
        
        // Calcular rango de celdas que ocupa el objeto
        const minX = Math.floor((position.x - radius) / this.cellSize);
        const maxX = Math.floor((position.x + radius) / this.cellSize);
        const minY = Math.floor((position.y - radius) / this.cellSize);
        const maxY = Math.floor((position.y + radius) / this.cellSize);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                cells.push(`${x},${y}`);
            }
        }
        
        return cells;
    }

    /**
     * ➕ Insertar objeto en el hash espacial
     */
    insert(object, position, radius = 0) {
        // Si el objeto ya existe, actualizarlo
        if (this.objects.has(object)) {
            this.update(object, position, radius);
            return;
        }
        
        const cells = this.getObjectCells(position, radius);
        
        // Insertar en cada celda
        cells.forEach(cellKey => {
            if (!this.grid.has(cellKey)) {
                this.grid.set(cellKey, new Set());
            }
            this.grid.get(cellKey).add(object);
        });
        
        // Guardar las celdas que ocupa este objeto
        this.objects.set(object, {
            cells: cells,
            position: position.copy(),
            radius: radius
        });
        
        this.stats.totalObjects++;
    }

    /**
     * 🔄 Actualizar posición de objeto existente
     */
    update(object, newPosition, newRadius = 0) {
        if (!this.objects.has(object)) {
            this.insert(object, newPosition, newRadius);
            return;
        }
        
        const oldData = this.objects.get(object);
        const newCells = this.getObjectCells(newPosition, newRadius);
        
        // Optimización: solo actualizar si cambió de celda
        const oldCellsSet = new Set(oldData.cells);
        const newCellsSet = new Set(newCells);
        
        const cellsChanged = oldData.cells.length !== newCells.length ||
                           !oldData.cells.every(cell => newCellsSet.has(cell));
        
        if (cellsChanged) {
            // Remover de celdas antiguas
            oldData.cells.forEach(cellKey => {
                const cell = this.grid.get(cellKey);
                if (cell) {
                    cell.delete(object);
                    if (cell.size === 0) {
                        this.grid.delete(cellKey);
                    }
                }
            });
            
            // Insertar en celdas nuevas
            newCells.forEach(cellKey => {
                if (!this.grid.has(cellKey)) {
                    this.grid.set(cellKey, new Set());
                }
                this.grid.get(cellKey).add(object);
            });
            
            // Actualizar datos del objeto
            this.objects.set(object, {
                cells: newCells,
                position: newPosition.copy(),
                radius: newRadius
            });
        } else {
            // Solo actualizar posición sin cambiar celdas
            oldData.position = newPosition.copy();
            oldData.radius = newRadius;
        }
    }

    /**
     * ➖ Remover objeto del hash espacial
     */
    remove(object) {
        if (!this.objects.has(object)) return;
        
        const objectData = this.objects.get(object);
        
        // Remover de todas las celdas
        objectData.cells.forEach(cellKey => {
            const cell = this.grid.get(cellKey);
            if (cell) {
                cell.delete(object);
                if (cell.size === 0) {
                    this.grid.delete(cellKey);
                }
            }
        });
        
        this.objects.delete(object);
        this.stats.totalObjects--;
    }

    /**
     * 🔍 Obtener objetos cercanos a una posición
     */
    getNearby(position, radius) {
        this.stats.queriesPerFrame++;
        
        const nearbyObjects = new Set();
        const cells = this.getObjectCells(position, radius);
        
        cells.forEach(cellKey => {
            const cell = this.grid.get(cellKey);
            if (cell) {
                cell.forEach(object => {
                    // Verificar distancia real
                    const objectData = this.objects.get(object);
                    if (objectData) {
                        const distance = position.distance(objectData.position);
                        if (distance <= radius + objectData.radius) {
                            nearbyObjects.add(object);
                        }
                    }
                });
            }
        });
        
        return Array.from(nearbyObjects);
    }

    /**
     * 🔍 Obtener objetos en un área rectangular
     */
    getInArea(minX, minY, maxX, maxY) {
        const objectsInArea = new Set();
        
        const minCellX = Math.floor(minX / this.cellSize);
        const maxCellX = Math.floor(maxX / this.cellSize);
        const minCellY = Math.floor(minY / this.cellSize);
        const maxCellY = Math.floor(maxY / this.cellSize);
        
        for (let x = minCellX; x <= maxCellX; x++) {
            for (let y = minCellY; y <= maxCellY; y++) {
                const cellKey = `${x},${y}`;
                const cell = this.grid.get(cellKey);
                
                if (cell) {
                    cell.forEach(object => {
                        const objectData = this.objects.get(object);
                        if (objectData) {
                            const pos = objectData.position;
                            if (pos.x >= minX && pos.x <= maxX && 
                                pos.y >= minY && pos.y <= maxY) {
                                objectsInArea.add(object);
                            }
                        }
                    });
                }
            }
        }
        
        return Array.from(objectsInArea);
    }

    /**
     * 🔍 Detectar colisiones entre objetos
     */
    detectCollisions() {
        const collisions = [];
        const checkedPairs = new Set();
        
        this.grid.forEach((cell, cellKey) => {
            const objects = Array.from(cell);
            
            for (let i = 0; i < objects.length; i++) {
                for (let j = i + 1; j < objects.length; j++) {
                    const obj1 = objects[i];
                    const obj2 = objects[j];
                    
                    // Evitar verificar el mismo par dos veces
                    const pairKey = obj1.id < obj2.id ? `${obj1.id}-${obj2.id}` : `${obj2.id}-${obj1.id}`;
                    if (checkedPairs.has(pairKey)) continue;
                    checkedPairs.add(pairKey);
                    
                    const data1 = this.objects.get(obj1);
                    const data2 = this.objects.get(obj2);
                    
                    if (data1 && data2) {
                        const distance = data1.position.distance(data2.position);
                        const minDistance = data1.radius + data2.radius;
                        
                        if (distance < minDistance) {
                            collisions.push({
                                object1: obj1,
                                object2: obj2,
                                distance: distance,
                                overlap: minDistance - distance
                            });
                        }
                    }
                }
            }
        });
        
        return collisions;
    }

    /**
     * 🧹 Limpiar hash espacial
     */
    clear() {
        this.grid.clear();
        this.objects.clear();
        this.stats.totalObjects = 0;
        this.stats.totalCells = 0;
    }

    /**
     * 📊 Actualizar estadísticas de rendimiento
     */
    updateStats() {
        this.stats.totalCells = this.grid.size;
        
        if (this.stats.totalCells > 0) {
            let totalObjectsInCells = 0;
            this.grid.forEach(cell => {
                totalObjectsInCells += cell.size;
            });
            this.stats.averageObjectsPerCell = totalObjectsInCells / this.stats.totalCells;
        } else {
            this.stats.averageObjectsPerCell = 0;
        }
        
        this.stats.lastUpdateTime = Date.now();
    }

    /**
     * 📊 Obtener estadísticas de rendimiento
     */
    getStats() {
        this.updateStats();
        return {
            ...this.stats,
            cellSize: this.cellSize,
            memoryUsage: this.getMemoryUsage()
        };
    }

    /**
     * 💾 Calcular uso de memoria aproximado
     */
    getMemoryUsage() {
        let totalMemory = 0;
        
        // Memoria del grid
        totalMemory += this.grid.size * 50; // Aproximado por entrada del Map
        
        // Memoria de los objetos
        totalMemory += this.objects.size * 100; // Aproximado por objeto
        
        return {
            totalBytes: totalMemory,
            totalKB: (totalMemory / 1024).toFixed(2),
            gridEntries: this.grid.size,
            objectEntries: this.objects.size
        };
    }

    /**
     * 🎨 Renderizar debug del grid espacial
     */
    renderDebug(ctx, camera = null) {
        ctx.save();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        // Calcular área visible
        const viewMinX = camera ? camera.x - camera.width / 2 : 0;
        const viewMaxX = camera ? camera.x + camera.width / 2 : ctx.canvas.width;
        const viewMinY = camera ? camera.y - camera.height / 2 : 0;
        const viewMaxY = camera ? camera.y + camera.height / 2 : ctx.canvas.height;
        
        // Dibujar grid solo en área visible
        const minCellX = Math.floor(viewMinX / this.cellSize);
        const maxCellX = Math.floor(viewMaxX / this.cellSize);
        const minCellY = Math.floor(viewMinY / this.cellSize);
        const maxCellY = Math.floor(viewMaxY / this.cellSize);
        
        for (let x = minCellX; x <= maxCellX; x++) {
            for (let y = minCellY; y <= maxCellY; y++) {
                const cellKey = `${x},${y}`;
                const cell = this.grid.get(cellKey);
                
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;
                
                // Color según cantidad de objetos
                if (cell && cell.size > 0) {
                    const intensity = Math.min(cell.size / 5, 1);
                    ctx.fillStyle = `rgba(0, 255, 0, ${intensity * 0.2})`;
                    ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                    
                    // Mostrar número de objetos
                    ctx.fillStyle = '#00ff00';
                    ctx.font = '10px monospace';
                    ctx.fillText(cell.size.toString(), cellX + 2, cellY + 12);
                }
                
                // Borde de celda
                ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
            }
        }
        
        ctx.restore();
    }

    /**
     * 🔧 Optimizar hash espacial
     */
    optimize() {
        // Remover celdas vacías
        const emptyCells = [];
        this.grid.forEach((cell, cellKey) => {
            if (cell.size === 0) {
                emptyCells.push(cellKey);
            }
        });
        
        emptyCells.forEach(cellKey => {
            this.grid.delete(cellKey);
        });
        
        // Resetear contador de queries
        this.stats.queriesPerFrame = 0;
        
        console.log(`🔧 SpatialHash optimizado: ${emptyCells.length} celdas vacías removidas`);
    }

    /**
     * 💥 Destruir sistema
     */
    destroy() {
        this.clear();
        console.log('💥 SpatialHashSystem destruido');
    }
} 