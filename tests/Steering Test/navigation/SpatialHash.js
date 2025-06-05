/**
 * 🗺️ SPATIAL HASH - Optimización de consultas espaciales
 * Divide el espacio en celdas para reducir complejidad de O(n²) a O(n)
 * Esencial para manejar miles de naves eficientemente
 */

import { Vector2D } from './Vector2D.js';

export class SpatialHash {
    constructor(cellSize = 50) {
        this.cellSize = cellSize;
        this.grid = new Map(); // Mapa de celdas
        this.objects = new Set(); // Objetos registrados
        
        console.log(`🗺️ SpatialHash creado con tamaño de celda: ${cellSize}px`);
    }

    /**
     * 🧹 Limpiar grid
     */
    clear() {
        this.grid.clear();
        this.objects.clear();
    }

    /**
     * 📍 Obtener clave de celda para una posición
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * ➕ Insertar objeto en el grid
     */
    insert(object) {
        if (!object.position) {
            console.warn('⚠️ Objeto sin posición no puede ser insertado en SpatialHash');
            return;
        }

        const key = this.getCellKey(object.position.x, object.position.y);
        
        if (!this.grid.has(key)) {
            this.grid.set(key, new Set());
        }
        
        this.grid.get(key).add(object);
        this.objects.add(object);
    }

    /**
     * ➖ Remover objeto del grid
     */
    remove(object) {
        if (!object.position) return;

        const key = this.getCellKey(object.position.x, object.position.y);
        
        if (this.grid.has(key)) {
            this.grid.get(key).delete(object);
            
            // Limpiar celda vacía
            if (this.grid.get(key).size === 0) {
                this.grid.delete(key);
            }
        }
        
        this.objects.delete(object);
    }

    /**
     * 🔄 Actualizar posición de objeto
     */
    update(object, oldPosition) {
        if (oldPosition) {
            // Remover de posición anterior
            const oldKey = this.getCellKey(oldPosition.x, oldPosition.y);
            if (this.grid.has(oldKey)) {
                this.grid.get(oldKey).delete(object);
                if (this.grid.get(oldKey).size === 0) {
                    this.grid.delete(oldKey);
                }
            }
        }
        
        // Insertar en nueva posición
        this.insert(object);
    }

    /**
     * 🔍 Obtener objetos cercanos en un radio
     */
    getNearby(position, radius) {
        const nearby = new Set();
        
        // Calcular rango de celdas a revisar
        const minX = Math.floor((position.x - radius) / this.cellSize);
        const maxX = Math.floor((position.x + radius) / this.cellSize);
        const minY = Math.floor((position.y - radius) / this.cellSize);
        const maxY = Math.floor((position.y + radius) / this.cellSize);
        
        // Revisar todas las celdas en el rango
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const key = `${x},${y}`;
                
                if (this.grid.has(key)) {
                    for (const object of this.grid.get(key)) {
                        const distance = position.distance(object.position);
                        if (distance <= radius) {
                            nearby.add(object);
                        }
                    }
                }
            }
        }
        
        return Array.from(nearby);
    }

    /**
     * 🔍 Obtener objetos en una celda específica
     */
    getObjectsInCell(x, y) {
        const key = this.getCellKey(x, y);
        return this.grid.has(key) ? Array.from(this.grid.get(key)) : [];
    }

    /**
     * 🔍 Obtener objetos en celdas vecinas (incluyendo la actual)
     */
    getObjectsInNeighborhood(position) {
        const objects = new Set();
        const cellX = Math.floor(position.x / this.cellSize);
        const cellY = Math.floor(position.y / this.cellSize);
        
        // Revisar celda actual y las 8 vecinas
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cellX + dx},${cellY + dy}`;
                
                if (this.grid.has(key)) {
                    for (const object of this.grid.get(key)) {
                        objects.add(object);
                    }
                }
            }
        }
        
        return Array.from(objects);
    }

    /**
     * 📊 Obtener estadísticas del grid
     */
    getStats() {
        const totalCells = this.grid.size;
        const totalObjects = this.objects.size;
        
        let maxObjectsPerCell = 0;
        let minObjectsPerCell = Infinity;
        let totalObjectsInCells = 0;
        
        for (const cell of this.grid.values()) {
            const count = cell.size;
            maxObjectsPerCell = Math.max(maxObjectsPerCell, count);
            minObjectsPerCell = Math.min(minObjectsPerCell, count);
            totalObjectsInCells += count;
        }
        
        const avgObjectsPerCell = totalCells > 0 ? totalObjectsInCells / totalCells : 0;
        
        return {
            cellSize: this.cellSize,
            totalCells,
            totalObjects,
            maxObjectsPerCell: maxObjectsPerCell === -Infinity ? 0 : maxObjectsPerCell,
            minObjectsPerCell: minObjectsPerCell === Infinity ? 0 : minObjectsPerCell,
            avgObjectsPerCell: avgObjectsPerCell.toFixed(2)
        };
    }

    /**
     * 🎨 Renderizar grid para debug
     */
    renderDebug(ctx, canvasWidth, canvasHeight) {
        ctx.save();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        
        // Dibujar líneas del grid
        for (let x = 0; x <= canvasWidth; x += this.cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
        }
        
        for (let y = 0; y <= canvasHeight; y += this.cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        }
        
        // Dibujar celdas ocupadas
        ctx.fillStyle = '#00ff88';
        ctx.globalAlpha = 0.1;
        
        for (const [key, objects] of this.grid.entries()) {
            if (objects.size > 0) {
                const [cellX, cellY] = key.split(',').map(Number);
                const x = cellX * this.cellSize;
                const y = cellY * this.cellSize;
                
                ctx.fillRect(x, y, this.cellSize, this.cellSize);
                
                // Mostrar número de objetos en la celda
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.8;
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(
                    objects.size.toString(),
                    x + this.cellSize / 2,
                    y + this.cellSize / 2
                );
                ctx.restore();
            }
        }
        
        ctx.restore();
    }

    /**
     * 🔧 Optimizar tamaño de celda basado en densidad
     */
    optimizeCellSize(averageObjectRadius, targetObjectsPerCell = 4) {
        if (this.objects.size === 0) return;
        
        // Calcular densidad actual
        const stats = this.getStats();
        const currentAvg = parseFloat(stats.avgObjectsPerCell);
        
        // Ajustar tamaño de celda si es necesario
        if (currentAvg > targetObjectsPerCell * 2) {
            // Demasiados objetos por celda, aumentar tamaño
            this.cellSize = Math.min(this.cellSize * 1.5, averageObjectRadius * 8);
            this.rebuild();
        } else if (currentAvg < targetObjectsPerCell / 2 && this.cellSize > averageObjectRadius * 2) {
            // Muy pocos objetos por celda, reducir tamaño
            this.cellSize = Math.max(this.cellSize * 0.75, averageObjectRadius * 2);
            this.rebuild();
        }
    }

    /**
     * 🔄 Reconstruir grid completo
     */
    rebuild() {
        const objects = Array.from(this.objects);
        this.clear();
        
        objects.forEach(object => {
            this.insert(object);
        });
        
        console.log(`🔄 SpatialHash reconstruido con tamaño de celda: ${this.cellSize}px`);
    }

    /**
     * 🎯 Detectar colisiones potenciales
     */
    detectPotentialCollisions(object, radius) {
        const nearby = this.getNearby(object.position, radius);
        const collisions = [];
        
        nearby.forEach(other => {
            if (other !== object) {
                const distance = object.position.distance(other.position);
                if (distance < radius) {
                    collisions.push({
                        object: other,
                        distance: distance,
                        overlap: radius - distance
                    });
                }
            }
        });
        
        // Ordenar por distancia (más cercanos primero)
        collisions.sort((a, b) => a.distance - b.distance);
        
        return collisions;
    }

    /**
     * 📝 Convertir a string para debugging
     */
    toString() {
        const stats = this.getStats();
        return `SpatialHash(cellSize: ${stats.cellSize}, cells: ${stats.totalCells}, objects: ${stats.totalObjects})`;
    }
} 