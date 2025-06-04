/**
 * 🧮 VECTOR 2D - Matemáticas Vectoriales Completas
 * Implementación completa de operaciones vectoriales para steering behaviors
 * Migrado exactamente del laboratorio - FUNCIONALIDAD PROBADA
 */

export class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 📐 Crear vector desde coordenadas
     */
    static from(x, y) {
        return new Vector2D(x, y);
    }

    /**
     * 📐 Crear vector cero
     */
    static zero() {
        return new Vector2D(0, 0);
    }

    /**
     * 📐 Crear vector desde ángulo y magnitud
     */
    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    /**
     * 📐 Crear vector aleatorio
     */
    static random(magnitude = 1) {
        const angle = Math.random() * Math.PI * 2;
        return Vector2D.fromAngle(angle, magnitude);
    }

    /**
     * 📐 Crear copia del vector
     */
    copy() {
        return new Vector2D(this.x, this.y);
    }

    /**
     * ➕ Sumar vector
     */
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    /**
     * ➖ Restar vector
     */
    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    /**
     * ✖️ Multiplicar por escalar
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * ➗ Dividir por escalar
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    /**
     * 📏 Calcular magnitud (longitud)
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * 📏 Calcular magnitud al cuadrado (más eficiente)
     */
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * 🧭 Normalizar vector (magnitud = 1)
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    /**
     * 🎯 Establecer magnitud específica
     */
    setMagnitude(magnitude) {
        this.normalize();
        this.multiply(magnitude);
        return this;
    }

    /**
     * 🔒 Limitar magnitud máxima
     */
    limit(maxMagnitude) {
        const mag = this.magnitude();
        if (mag > maxMagnitude) {
            this.setMagnitude(maxMagnitude);
        }
        return this;
    }

    /**
     * 📐 Calcular ángulo del vector
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * 🔄 Rotar vector por ángulo
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;
        this.x = newX;
        this.y = newY;
        return this;
    }

    /**
     * ⊥ Obtener vector perpendicular
     */
    perpendicular() {
        return new Vector2D(-this.y, this.x);
    }

    /**
     * 📏 Calcular distancia a otro vector
     */
    distance(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 📏 Calcular distancia al cuadrado (más eficiente)
     */
    distanceSquared(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return dx * dx + dy * dy;
    }

    /**
     * 🔗 Producto punto
     */
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    /**
     * ✖️ Producto cruz (en 2D devuelve escalar)
     */
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }

    /**
     * 🔄 Interpolar linealmente hacia otro vector
     */
    lerp(target, amount) {
        this.x += (target.x - this.x) * amount;
        this.y += (target.y - this.y) * amount;
        return this;
    }

    /**
     * 🎯 Verificar si es vector cero
     */
    isZero() {
        return this.x === 0 && this.y === 0;
    }

    /**
     * ⚖️ Verificar igualdad con otro vector
     */
    equals(vector, tolerance = 0.0001) {
        return Math.abs(this.x - vector.x) < tolerance && 
               Math.abs(this.y - vector.y) < tolerance;
    }

    /**
     * 📝 Convertir a string
     */
    toString() {
        return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    /**
     * 📦 Convertir a objeto plano
     */
    toObject() {
        return { x: this.x, y: this.y };
    }

    // ========================================
    // MÉTODOS ESTÁTICOS PARA OPERACIONES
    // ========================================

    /**
     * ➕ Sumar dos vectores (sin modificar originales)
     */
    static add(v1, v2) {
        return new Vector2D(v1.x + v2.x, v1.y + v2.y);
    }

    /**
     * ➖ Restar dos vectores (sin modificar originales)
     */
    static subtract(v1, v2) {
        return new Vector2D(v1.x - v2.x, v1.y - v2.y);
    }

    /**
     * ✖️ Multiplicar vector por escalar (sin modificar original)
     */
    static multiply(vector, scalar) {
        return new Vector2D(vector.x * scalar, vector.y * scalar);
    }

    /**
     * ➗ Dividir vector por escalar (sin modificar original)
     */
    static divide(vector, scalar) {
        if (scalar !== 0) {
            return new Vector2D(vector.x / scalar, vector.y / scalar);
        }
        return vector.copy();
    }

    /**
     * 🧭 Normalizar vector (sin modificar original)
     */
    static normalize(vector) {
        const mag = vector.magnitude();
        if (mag > 0) {
            return Vector2D.divide(vector, mag);
        }
        return Vector2D.zero();
    }

    /**
     * 📏 Calcular distancia entre dos vectores
     */
    static distance(v1, v2) {
        return v1.distance(v2);
    }

    /**
     * 🔗 Producto punto entre dos vectores
     */
    static dot(v1, v2) {
        return v1.dot(v2);
    }

    /**
     * ✖️ Producto cruz entre dos vectores
     */
    static cross(v1, v2) {
        return v1.cross(v2);
    }

    /**
     * 🔄 Interpolar linealmente entre dos vectores
     */
    static lerp(v1, v2, amount) {
        return new Vector2D(
            v1.x + (v2.x - v1.x) * amount,
            v1.y + (v2.y - v1.y) * amount
        );
    }

    /**
     * 🔄 Rotar vector por ángulo (sin modificar original)
     */
    static rotate(vector, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2D(
            vector.x * cos - vector.y * sin,
            vector.x * sin + vector.y * cos
        );
    }

    /**
     * 🎯 Crear vector desde dos puntos
     */
    static fromPoints(p1, p2) {
        return new Vector2D(p2.x - p1.x, p2.y - p1.y);
    }

    /**
     * 📐 Calcular ángulo entre dos vectores
     */
    static angleBetween(v1, v2) {
        const dot = Vector2D.dot(v1, v2);
        const mag1 = v1.magnitude();
        const mag2 = v2.magnitude();
        
        if (mag1 === 0 || mag2 === 0) return 0;
        
        const cosAngle = dot / (mag1 * mag2);
        return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    }

    /**
     * 🎯 Proyectar vector sobre otro
     */
    static project(vector, onto) {
        const dot = Vector2D.dot(vector, onto);
        const magSquared = onto.magnitudeSquared();
        
        if (magSquared === 0) return Vector2D.zero();
        
        const scalar = dot / magSquared;
        return Vector2D.multiply(onto, scalar);
    }

    /**
     * 🔄 Reflejar vector sobre una normal
     */
    static reflect(vector, normal) {
        const normalizedNormal = Vector2D.normalize(normal);
        const dot = Vector2D.dot(vector, normalizedNormal);
        const reflection = Vector2D.multiply(normalizedNormal, 2 * dot);
        return Vector2D.subtract(vector, reflection);
    }
} 