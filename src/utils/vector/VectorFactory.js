/**
 * 🏭 VECTOR FACTORY
 * Factory para crear vectores con diferentes métodos de construcción
 * Parte de la refactorización FASE 5 del Vector2D
 */

import { VectorGeometry } from './VectorGeometry.js';

export class VectorFactory {
    /**
     * 📐 Crear vector desde coordenadas
     */
    static from(x, y) {
        return { x, y };
    }

    /**
     * 📐 Crear vector cero
     */
    static zero() {
        return { x: 0, y: 0 };
    }

    /**
     * 📐 Crear vector unitario (1, 0)
     */
    static unit() {
        return { x: 1, y: 0 };
    }

    /**
     * 📐 Crear vector desde ángulo y magnitud
     */
    static fromAngle(angle, magnitude = 1) {
        return VectorGeometry.fromAngle(angle, magnitude);
    }

    /**
     * 📐 Crear vector aleatorio
     */
    static random(magnitude = 1) {
        return VectorGeometry.random(magnitude);
    }

    /**
     * 🎯 Crear vector desde dos puntos
     */
    static fromPoints(p1, p2) {
        return VectorGeometry.fromPoints(p1, p2);
    }

    /**
     * 📐 Crear copia de un vector
     */
    static copy(vector) {
        return { x: vector.x, y: vector.y };
    }

    /**
     * 📐 Crear vector desde objeto plano
     */
    static fromObject(obj) {
        return { x: obj.x || 0, y: obj.y || 0 };
    }

    /**
     * 📐 Crear vector desde array [x, y]
     */
    static fromArray(arr) {
        return { x: arr[0] || 0, y: arr[1] || 0 };
    }

    /**
     * 📐 Crear vector desde string "x,y"
     */
    static fromString(str) {
        const parts = str.split(',').map(s => parseFloat(s.trim()));
        return { x: parts[0] || 0, y: parts[1] || 0 };
    }

    /**
     * 📐 Crear vector desde coordenadas polares
     */
    static fromPolar(radius, angle) {
        return this.fromAngle(angle, radius);
    }

    /**
     * 📐 Crear conjunto de vectores en círculo
     */
    static circlePoints(count, radius = 1, centerX = 0, centerY = 0) {
        const points = [];
        const angleStep = (Math.PI * 2) / count;
        
        for (let i = 0; i < count; i++) {
            const angle = i * angleStep;
            points.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }
        
        return points;
    }

    /**
     * 📐 Crear conjunto de vectores en grilla
     */
    static gridPoints(width, height, spacing = 1, offsetX = 0, offsetY = 0) {
        const points = [];
        
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                points.push({
                    x: offsetX + x * spacing,
                    y: offsetY + y * spacing
                });
            }
        }
        
        return points;
    }

    /**
     * 📐 Crear vectores direccionales básicos
     */
    static directions() {
        return {
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 },
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 },
            UP_LEFT: { x: -0.707, y: -0.707 },
            UP_RIGHT: { x: 0.707, y: -0.707 },
            DOWN_LEFT: { x: -0.707, y: 0.707 },
            DOWN_RIGHT: { x: 0.707, y: 0.707 }
        };
    }

    /**
     * 🎯 Interpolación lineal entre dos vectores
     */
    static lerp(a, b, t) {
        const clampedT = Math.max(0, Math.min(1, t));
        return {
            x: a.x + (b.x - a.x) * clampedT,
            y: a.y + (b.y - a.y) * clampedT
        };
    }

    /**
     * 🎯 Crear vector normalizado desde otro vector
     */
    static normalized(vector) {
        const mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (mag === 0) return this.zero();
        
        return {
            x: vector.x / mag,
            y: vector.y / mag
        };
    }

    /**
     * 🎯 Crear vector con magnitud específica desde otro vector
     */
    static withMagnitude(vector, magnitude) {
        const normalized = this.normalized(vector);
        return {
            x: normalized.x * magnitude,
            y: normalized.y * magnitude
        };
    }
} 