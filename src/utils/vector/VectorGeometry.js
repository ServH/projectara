/**
 * 📐 VECTOR GEOMETRY
 * Operaciones geométricas avanzadas para vectores 2D
 * Parte de la refactorización FASE 5 del Vector2D
 */

export class VectorGeometry {
    /**
     * 📐 Calcular ángulo del vector
     */
    static angle(vector) {
        return Math.atan2(vector.y, vector.x);
    }

    /**
     * 🔄 Rotar vector por ángulo (modifica el vector actual)
     */
    static rotate(vector, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = vector.x * cos - vector.y * sin;
        const newY = vector.x * sin + vector.y * cos;
        vector.x = newX;
        vector.y = newY;
        return vector;
    }

    /**
     * 🔄 Obtener vector perpendicular (rotado 90 grados)
     */
    static perpendicular(vector) {
        return { x: -vector.y, y: vector.x };
    }

    /**
     * 📐 Calcular ángulo entre dos vectores
     */
    static angleBetween(v1, v2) {
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        if (mag1 === 0 || mag2 === 0) return 0;
        
        const cosAngle = dot / (mag1 * mag2);
        return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    }

    /**
     * 🎯 Proyectar vector sobre otro
     */
    static project(vector, onto) {
        const dot = vector.x * onto.x + vector.y * onto.y;
        const magSquared = onto.x * onto.x + onto.y * onto.y;
        
        if (magSquared === 0) return { x: 0, y: 0 };
        
        const scalar = dot / magSquared;
        return {
            x: onto.x * scalar,
            y: onto.y * scalar
        };
    }

    /**
     * 🔄 Reflejar vector sobre una normal
     */
    static reflect(vector, normal) {
        // Normalizar la normal
        const normalMag = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        if (normalMag === 0) return { x: vector.x, y: vector.y };
        
        const normalizedNormal = {
            x: normal.x / normalMag,
            y: normal.y / normalMag
        };
        
        const dot = vector.x * normalizedNormal.x + vector.y * normalizedNormal.y;
        
        return {
            x: vector.x - 2 * dot * normalizedNormal.x,
            y: vector.y - 2 * dot * normalizedNormal.y
        };
    }

    /**
     * 📐 Crear vector desde ángulo y magnitud
     */
    static fromAngle(angle, magnitude = 1) {
        return {
            x: Math.cos(angle) * magnitude,
            y: Math.sin(angle) * magnitude
        };
    }

    /**
     * 🎯 Crear vector desde dos puntos
     */
    static fromPoints(p1, p2) {
        return {
            x: p2.x - p1.x,
            y: p2.y - p1.y
        };
    }

    /**
     * 📐 Crear vector aleatorio
     */
    static random(magnitude = 1) {
        const angle = Math.random() * Math.PI * 2;
        return this.fromAngle(angle, magnitude);
    }

    /**
     * 🔄 Rotar vector por ángulo (sin modificar original)
     */
    static rotated(vector, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: vector.x * cos - vector.y * sin,
            y: vector.x * sin + vector.y * cos
        };
    }

    /**
     * 📏 Calcular área del triángulo formado por tres puntos
     */
    static triangleArea(p1, p2, p3) {
        return Math.abs(
            (p1.x * (p2.y - p3.y) + 
             p2.x * (p3.y - p1.y) + 
             p3.x * (p1.y - p2.y)) / 2
        );
    }

    /**
     * 🎯 Verificar si un punto está dentro de un triángulo
     */
    static isPointInTriangle(point, a, b, c) {
        const totalArea = this.triangleArea(a, b, c);
        const area1 = this.triangleArea(point, b, c);
        const area2 = this.triangleArea(a, point, c);
        const area3 = this.triangleArea(a, b, point);
        
        return Math.abs(totalArea - (area1 + area2 + area3)) < 0.0001;
    }

    /**
     * 📐 Calcular el centroide de un conjunto de puntos
     */
    static centroid(points) {
        if (points.length === 0) return { x: 0, y: 0 };
        
        const sum = points.reduce((acc, point) => ({
            x: acc.x + point.x,
            y: acc.y + point.y
        }), { x: 0, y: 0 });
        
        return {
            x: sum.x / points.length,
            y: sum.y / points.length
        };
    }
} 