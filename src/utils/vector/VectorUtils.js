/**
 * 🔧 VECTOR UTILS
 * Utilidades de conversión, validación y formateo para vectores 2D
 * Parte de la refactorización FASE 5 del Vector2D
 */

export class VectorUtils {
    /**
     * 📝 Convertir vector a string
     */
    static toString(vector, precision = 2) {
        return `Vector2D(${vector.x.toFixed(precision)}, ${vector.y.toFixed(precision)})`;
    }

    /**
     * 📦 Convertir vector a objeto plano
     */
    static toObject(vector) {
        return { x: vector.x, y: vector.y };
    }

    /**
     * 📦 Convertir vector a array [x, y]
     */
    static toArray(vector) {
        return [vector.x, vector.y];
    }

    /**
     * 📦 Convertir vector a coordenadas polares
     */
    static toPolar(vector) {
        const radius = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        const angle = Math.atan2(vector.y, vector.x);
        return { radius, angle };
    }

    /**
     * 📦 Convertir vector a string CSV
     */
    static toCSV(vector, separator = ',') {
        return `${vector.x}${separator}${vector.y}`;
    }

    /**
     * ✅ Validar que el objeto es un vector válido
     */
    static isValid(vector) {
        return vector && 
               typeof vector.x === 'number' && 
               typeof vector.y === 'number' && 
               !isNaN(vector.x) && 
               !isNaN(vector.y) &&
               isFinite(vector.x) &&
               isFinite(vector.y);
    }

    /**
     * ✅ Verificar si es vector cero
     */
    static isZero(vector, tolerance = 0.0001) {
        return Math.abs(vector.x) < tolerance && Math.abs(vector.y) < tolerance;
    }

    /**
     * ✅ Verificar si es vector unitario
     */
    static isUnit(vector, tolerance = 0.0001) {
        const mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        return Math.abs(mag - 1) < tolerance;
    }

    /**
     * ✅ Verificar igualdad entre vectores
     */
    static equals(v1, v2, tolerance = 0.0001) {
        return Math.abs(v1.x - v2.x) < tolerance && 
               Math.abs(v1.y - v2.y) < tolerance;
    }

    /**
     * 🔧 Limpiar vector (eliminar valores muy pequeños)
     */
    static clean(vector, tolerance = 0.0001) {
        return {
            x: Math.abs(vector.x) < tolerance ? 0 : vector.x,
            y: Math.abs(vector.y) < tolerance ? 0 : vector.y
        };
    }

    /**
     * 🔧 Redondear componentes del vector
     */
    static round(vector, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return {
            x: Math.round(vector.x * factor) / factor,
            y: Math.round(vector.y * factor) / factor
        };
    }

    /**
     * 🔧 Truncar componentes del vector
     */
    static floor(vector) {
        return {
            x: Math.floor(vector.x),
            y: Math.floor(vector.y)
        };
    }

    /**
     * 🔧 Redondear hacia arriba componentes del vector
     */
    static ceil(vector) {
        return {
            x: Math.ceil(vector.x),
            y: Math.ceil(vector.y)
        };
    }

    /**
     * 🔧 Obtener valor absoluto de componentes
     */
    static abs(vector) {
        return {
            x: Math.abs(vector.x),
            y: Math.abs(vector.y)
        };
    }

    /**
     * 🔧 Aplicar función a cada componente
     */
    static map(vector, fn) {
        return {
            x: fn(vector.x),
            y: fn(vector.y)
        };
    }

    /**
     * 🔧 Clampar componentes entre min y max
     */
    static clamp(vector, min, max) {
        return {
            x: Math.max(min, Math.min(max, vector.x)),
            y: Math.max(min, Math.min(max, vector.y))
        };
    }

    /**
     * 📊 Obtener estadísticas de un array de vectores
     */
    static getStats(vectors) {
        if (vectors.length === 0) {
            return {
                count: 0,
                min: { x: 0, y: 0 },
                max: { x: 0, y: 0 },
                average: { x: 0, y: 0 },
                sum: { x: 0, y: 0 }
            };
        }

        let minX = vectors[0].x, maxX = vectors[0].x;
        let minY = vectors[0].y, maxY = vectors[0].y;
        let sumX = 0, sumY = 0;

        for (const vector of vectors) {
            minX = Math.min(minX, vector.x);
            maxX = Math.max(maxX, vector.x);
            minY = Math.min(minY, vector.y);
            maxY = Math.max(maxY, vector.y);
            sumX += vector.x;
            sumY += vector.y;
        }

        return {
            count: vectors.length,
            min: { x: minX, y: minY },
            max: { x: maxX, y: maxY },
            average: { x: sumX / vectors.length, y: sumY / vectors.length },
            sum: { x: sumX, y: sumY }
        };
    }

    /**
     * 🎨 Formatear vector para debug
     */
    static debug(vector, label = 'Vector') {
        const polar = this.toPolar(vector);
        return `${label}: (${vector.x.toFixed(3)}, ${vector.y.toFixed(3)}) | mag: ${polar.radius.toFixed(3)} | angle: ${(polar.angle * 180 / Math.PI).toFixed(1)}°`;
    }

    /**
     * 🔍 Buscar vector más cercano en un array
     */
    static findClosest(target, vectors) {
        if (vectors.length === 0) return null;

        let closest = vectors[0];
        let minDistance = this.distanceSquared(target, closest);

        for (let i = 1; i < vectors.length; i++) {
            const distance = this.distanceSquared(target, vectors[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closest = vectors[i];
            }
        }

        return closest;
    }

    /**
     * 📏 Calcular distancia al cuadrado (helper interno)
     */
    static distanceSquared(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return dx * dx + dy * dy;
    }
} 