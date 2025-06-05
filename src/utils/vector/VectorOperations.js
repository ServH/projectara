/**
 * ➕ VECTOR OPERATIONS
 * Operaciones matemáticas básicas para vectores 2D
 * Parte de la refactorización FASE 5 del Vector2D
 */

export class VectorOperations {
    /**
     * ➕ Sumar vector (modifica el vector actual)
     */
    static add(vector, other) {
        vector.x += other.x;
        vector.y += other.y;
        return vector;
    }

    /**
     * ➖ Restar vector (modifica el vector actual)
     */
    static subtract(vector, other) {
        vector.x -= other.x;
        vector.y -= other.y;
        return vector;
    }

    /**
     * ✖️ Multiplicar por escalar (modifica el vector actual)
     */
    static multiply(vector, scalar) {
        vector.x *= scalar;
        vector.y *= scalar;
        return vector;
    }

    /**
     * ➗ Dividir por escalar (modifica el vector actual)
     */
    static divide(vector, scalar) {
        if (scalar !== 0) {
            vector.x /= scalar;
            vector.y /= scalar;
        }
        return vector;
    }

    /**
     * 📏 Calcular magnitud (longitud)
     */
    static magnitude(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    /**
     * 📏 Calcular magnitud al cuadrado (más eficiente)
     */
    static magnitudeSquared(vector) {
        return vector.x * vector.x + vector.y * vector.y;
    }

    /**
     * 🧭 Normalizar vector (modifica el vector actual)
     */
    static normalize(vector) {
        const mag = this.magnitude(vector);
        if (mag > 0) {
            this.divide(vector, mag);
        }
        return vector;
    }

    /**
     * 🎯 Establecer magnitud específica (modifica el vector actual)
     */
    static setMagnitude(vector, magnitude) {
        this.normalize(vector);
        this.multiply(vector, magnitude);
        return vector;
    }

    /**
     * 🔒 Limitar magnitud máxima (modifica el vector actual)
     */
    static limit(vector, maxMagnitude) {
        const mag = this.magnitude(vector);
        if (mag > maxMagnitude) {
            this.setMagnitude(vector, maxMagnitude);
        }
        return vector;
    }

    /**
     * 📏 Calcular distancia entre dos vectores
     */
    static distance(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 📏 Calcular distancia al cuadrado (más eficiente)
     */
    static distanceSquared(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return dx * dx + dy * dy;
    }

    /**
     * 🔗 Producto punto
     */
    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * ✖️ Producto cruz (en 2D devuelve escalar)
     */
    static cross(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    }

    /**
     * 🎯 Interpolación lineal (modifica el vector actual)
     */
    static lerp(vector, target, t) {
        const clampedT = Math.max(0, Math.min(1, t));
        vector.x = vector.x + (target.x - vector.x) * clampedT;
        vector.y = vector.y + (target.y - vector.y) * clampedT;
        return vector;
    }

    /**
     * ⚖️ Verificar igualdad con tolerancia
     */
    static equals(v1, v2, tolerance = 0.0001) {
        return Math.abs(v1.x - v2.x) < tolerance && 
               Math.abs(v1.y - v2.y) < tolerance;
    }

    /**
     * 🎯 Verificar si es vector cero
     */
    static isZero(vector) {
        return vector.x === 0 && vector.y === 0;
    }
} 