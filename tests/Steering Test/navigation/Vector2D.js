/**
 * 📐 VECTOR 2D - Matemáticas Vectoriales
 * Clase completa para operaciones vectoriales en 2D
 * Esencial para steering behaviors
 */

export class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 📋 Crear copia del vector
     */
    copy() {
        return new Vector2D(this.x, this.y);
    }

    /**
     * 🔄 Establecer valores
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
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
     * ➕ Sumar vector (estático)
     */
    static add(v1, v2) {
        return new Vector2D(v1.x + v2.x, v1.y + v2.y);
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
     * ➖ Restar vector (estático)
     */
    static subtract(v1, v2) {
        return new Vector2D(v1.x - v2.x, v1.y - v2.y);
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
     * ✖️ Multiplicar por escalar (estático)
     */
    static multiply(vector, scalar) {
        return new Vector2D(vector.x * scalar, vector.y * scalar);
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
     * 🧭 Normalizar vector (longitud = 1)
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    /**
     * 🧭 Obtener vector normalizado (estático)
     */
    static normalize(vector) {
        const normalized = vector.copy();
        return normalized.normalize();
    }

    /**
     * 📐 Calcular distancia a otro vector
     */
    distance(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 📐 Calcular distancia al cuadrado (más eficiente)
     */
    distanceSquared(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return dx * dx + dy * dy;
    }

    /**
     * 🔄 Producto escalar (dot product)
     */
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    /**
     * 🔄 Producto escalar (estático)
     */
    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * 🔄 Producto cruz (cross product) - devuelve escalar en 2D
     */
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }

    /**
     * 📐 Calcular ángulo del vector (en radianes)
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * 📐 Calcular ángulo entre dos vectores
     */
    angleBetween(vector) {
        const dot = this.dot(vector);
        const mag1 = this.magnitude();
        const mag2 = vector.magnitude();
        
        if (mag1 === 0 || mag2 === 0) return 0;
        
        const cosAngle = dot / (mag1 * mag2);
        return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    }

    /**
     * 🔄 Rotar vector por ángulo (radianes)
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
     * 🔄 Obtener vector rotado (estático)
     */
    static rotate(vector, angle) {
        const rotated = vector.copy();
        return rotated.rotate(angle);
    }

    /**
     * 📏 Limitar magnitud máxima
     */
    limit(maxMagnitude) {
        const magSq = this.magnitudeSquared();
        if (magSq > maxMagnitude * maxMagnitude) {
            this.normalize();
            this.multiply(maxMagnitude);
        }
        return this;
    }

    /**
     * 📏 Establecer magnitud específica
     */
    setMagnitude(magnitude) {
        this.normalize();
        this.multiply(magnitude);
        return this;
    }

    /**
     * 🎯 Interpolar linealmente hacia otro vector
     */
    lerp(target, amount) {
        this.x += (target.x - this.x) * amount;
        this.y += (target.y - this.y) * amount;
        return this;
    }

    /**
     * 🎯 Interpolar linealmente (estático)
     */
    static lerp(start, end, amount) {
        return new Vector2D(
            start.x + (end.x - start.x) * amount,
            start.y + (end.y - start.y) * amount
        );
    }

    /**
     * 🔄 Obtener vector perpendicular (90° a la izquierda)
     */
    perpendicular() {
        return new Vector2D(-this.y, this.x);
    }

    /**
     * 🔄 Obtener vector perpendicular a la derecha
     */
    perpendicularRight() {
        return new Vector2D(this.y, -this.x);
    }

    /**
     * 🎯 Proyectar este vector sobre otro
     */
    project(onto) {
        const dot = this.dot(onto);
        const magSq = onto.magnitudeSquared();
        
        if (magSq === 0) return new Vector2D(0, 0);
        
        const scalar = dot / magSq;
        return Vector2D.multiply(onto, scalar);
    }

    /**
     * 🎯 Reflejar vector sobre una normal
     */
    reflect(normal) {
        const normalizedNormal = Vector2D.normalize(normal);
        const dot = this.dot(normalizedNormal);
        const reflection = Vector2D.multiply(normalizedNormal, 2 * dot);
        return Vector2D.subtract(this, reflection);
    }

    /**
     * 🔍 Verificar si el vector es cero
     */
    isZero() {
        return this.x === 0 && this.y === 0;
    }

    /**
     * 🔍 Verificar si dos vectores son iguales
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
     * 📊 Convertir a array
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * 📊 Convertir a objeto
     */
    toObject() {
        return { x: this.x, y: this.y };
    }

    // ========================================
    // 🎯 MÉTODOS ESTÁTICOS ÚTILES
    // ========================================

    /**
     * 🎲 Vector aleatorio
     */
    static random() {
        const angle = Math.random() * Math.PI * 2;
        return new Vector2D(Math.cos(angle), Math.sin(angle));
    }

    /**
     * 🎲 Vector aleatorio con magnitud específica
     */
    static randomWithMagnitude(magnitude) {
        return Vector2D.random().multiply(magnitude);
    }

    /**
     * 🧭 Vector desde ángulo
     */
    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    /**
     * 🔢 Vector cero
     */
    static zero() {
        return new Vector2D(0, 0);
    }

    /**
     * 🔢 Vector unitario hacia arriba
     */
    static up() {
        return new Vector2D(0, -1);
    }

    /**
     * 🔢 Vector unitario hacia abajo
     */
    static down() {
        return new Vector2D(0, 1);
    }

    /**
     * 🔢 Vector unitario hacia la izquierda
     */
    static left() {
        return new Vector2D(-1, 0);
    }

    /**
     * 🔢 Vector unitario hacia la derecha
     */
    static right() {
        return new Vector2D(1, 0);
    }

    /**
     * 📐 Calcular centro entre múltiples vectores
     */
    static center(vectors) {
        if (vectors.length === 0) return Vector2D.zero();
        
        const sum = vectors.reduce((acc, vec) => acc.add(vec), Vector2D.zero());
        return sum.divide(vectors.length);
    }

    /**
     * 📏 Encontrar el vector más cercano en un array
     */
    static closest(target, vectors) {
        if (vectors.length === 0) return null;
        
        let closest = vectors[0];
        let minDistance = target.distance(closest);
        
        for (let i = 1; i < vectors.length; i++) {
            const distance = target.distance(vectors[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closest = vectors[i];
            }
        }
        
        return closest;
    }
} 