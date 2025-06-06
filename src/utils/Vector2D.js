/**
 * 🧮 VECTOR 2D - REFACTORIZADO FASE 5
 * Implementación modular de operaciones vectoriales con módulos especializados
 * Aplicando principios SOLID y patrones de diseño
 */

import { VectorOperations } from './vector/VectorOperations.js';
import { VectorGeometry } from './vector/VectorGeometry.js';
import { VectorFactory } from './vector/VectorFactory.js';
import { VectorUtils } from './vector/VectorUtils.js';

export class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // ========================================
    // MÉTODOS DE INSTANCIA (Modifican el vector actual)
    // ========================================

    /**
     * ➕ Sumar vector
     */
    add(vector) {
        return VectorOperations.add(this, vector);
    }

    /**
     * ➖ Restar vector
     */
    subtract(vector) {
        return VectorOperations.subtract(this, vector);
    }

    /**
     * ✖️ Multiplicar por escalar
     */
    multiply(scalar) {
        return VectorOperations.multiply(this, scalar);
    }

    /**
     * ➗ Dividir por escalar
     */
    divide(scalar) {
        return VectorOperations.divide(this, scalar);
    }

    /**
     * 📏 Calcular magnitud (longitud)
     */
    magnitude() {
        return VectorOperations.magnitude(this);
    }

    /**
     * 📏 Calcular magnitud al cuadrado (más eficiente)
     */
    magnitudeSquared() {
        return VectorOperations.magnitudeSquared(this);
    }

    /**
     * 🧭 Normalizar vector (magnitud = 1)
     */
    normalize() {
        return VectorOperations.normalize(this);
    }

    /**
     * 🎯 Establecer magnitud específica
     */
    setMagnitude(magnitude) {
        return VectorOperations.setMagnitude(this, magnitude);
    }

    /**
     * 🔒 Limitar magnitud máxima
     */
    limit(maxMagnitude) {
        return VectorOperations.limit(this, maxMagnitude);
    }

    /**
     * 📐 Calcular ángulo del vector
     */
    angle() {
        return VectorGeometry.angle(this);
    }

    /**
     * 🔄 Rotar vector por ángulo
     */
    rotate(angle) {
        return VectorGeometry.rotate(this, angle);
    }

    /**
     * 🔄 Obtener vector perpendicular (rotado 90 grados)
     */
    perpendicular() {
        return VectorGeometry.perpendicular(this);
    }

    /**
     * 📏 Calcular distancia a otro vector
     */
    distance(vector) {
        return VectorOperations.distance(this, vector);
    }

    /**
     * 📏 Calcular distancia al cuadrado (más eficiente)
     */
    distanceSquared(vector) {
        return VectorOperations.distanceSquared(this, vector);
    }

    /**
     * 🔗 Producto punto
     */
    dot(vector) {
        return VectorOperations.dot(this, vector);
    }

    /**
     * ✖️ Producto cruz (en 2D devuelve escalar)
     */
    cross(vector) {
        return VectorOperations.cross(this, vector);
    }

    /**
     * 🎯 Interpolación lineal hacia otro vector
     */
    lerp(target, t) {
        return VectorOperations.lerp(this, target, t);
    }

    /**
     * 🎯 Verificar si es vector cero
     */
    isZero() {
        return VectorUtils.isZero(this);
    }

    /**
     * ⚖️ Verificar igualdad con otro vector
     */
    equals(vector, tolerance = 0.0001) {
        return VectorUtils.equals(this, vector, tolerance);
    }

    /**
     * 📐 Crear copia del vector
     */
    copy() {
        return VectorFactory.copy(this);
    }

    /**
     * 📝 Convertir a string
     */
    toString() {
        return VectorUtils.toString(this);
    }

    /**
     * 📦 Convertir a objeto plano
     */
    toObject() {
        return VectorUtils.toObject(this);
    }

    // ========================================
    // MÉTODOS ESTÁTICOS DE CREACIÓN (Factory)
    // ========================================

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
        const point = VectorFactory.fromAngle(angle, magnitude);
        return new Vector2D(point.x, point.y);
    }

    /**
     * 📐 Crear vector aleatorio
     */
    static random(magnitude = 1) {
        const point = VectorFactory.random(magnitude);
        return new Vector2D(point.x, point.y);
    }

    /**
     * 🎯 Crear vector desde dos puntos
     */
    static fromPoints(p1, p2) {
        const point = VectorFactory.fromPoints(p1, p2);
        return new Vector2D(point.x, point.y);
    }

    // ========================================
    // MÉTODOS ESTÁTICOS DE OPERACIONES (Sin modificar originales)
    // ========================================

    /**
     * ➕ Sumar dos vectores (sin modificar originales)
     */
    static add(v1, v2) {
        const result = new Vector2D(v1.x, v1.y);
        return VectorOperations.add(result, v2);
    }

    /**
     * ➖ Restar dos vectores (sin modificar originales)
     */
    static subtract(v1, v2) {
        const result = new Vector2D(v1.x, v1.y);
        return VectorOperations.subtract(result, v2);
    }

    /**
     * ✖️ Multiplicar vector por escalar (sin modificar original)
     */
    static multiply(vector, scalar) {
        const result = new Vector2D(vector.x, vector.y);
        return VectorOperations.multiply(result, scalar);
    }

    /**
     * ➗ Dividir vector por escalar (sin modificar original)
     */
    static divide(vector, scalar) {
        const result = new Vector2D(vector.x, vector.y);
        return VectorOperations.divide(result, scalar);
    }

    /**
     * 🧭 Normalizar vector (sin modificar original)
     */
    static normalize(vector) {
        const result = new Vector2D(vector.x, vector.y);
        return VectorOperations.normalize(result);
    }

    /**
     * 📏 Calcular distancia entre dos vectores
     */
    static distance(v1, v2) {
        return VectorOperations.distance(v1, v2);
    }

    /**
     * 📐 Producto punto entre dos vectores
     */
    static dot(a, b) {
        return VectorOperations.dot(a, b);
    }

    /**
     * ✖️ Producto cruz entre dos vectores
     */
    static cross(v1, v2) {
        return VectorOperations.cross(v1, v2);
    }

    /**
     * 🎯 Interpolación lineal entre dos vectores (método estático)
     */
    static lerp(a, b, t) {
        const point = VectorFactory.lerp(a, b, t);
        return new Vector2D(point.x, point.y);
    }

    /**
     * 📐 Calcular ángulo entre dos vectores
     */
    static angleBetween(v1, v2) {
        return VectorGeometry.angleBetween(v1, v2);
    }

    /**
     * 🎯 Proyectar vector sobre otro
     */
    static project(vector, onto) {
        const point = VectorGeometry.project(vector, onto);
        return new Vector2D(point.x, point.y);
    }

    /**
     * 🔄 Reflejar vector sobre una normal
     */
    static reflect(vector, normal) {
        const point = VectorGeometry.reflect(vector, normal);
        return new Vector2D(point.x, point.y);
    }

    /**
     * 🔄 Rotar vector por ángulo (sin modificar original)
     */
    static rotate(vector, angle) {
        const point = VectorGeometry.rotated(vector, angle);
        return new Vector2D(point.x, point.y);
    }

    // ========================================
    // MÉTODOS DE UTILIDADES Y VALIDACIÓN
    // ========================================

    /**
     * ✅ Validar que el objeto es un vector válido
     */
    static isValid(vector) {
        return VectorUtils.isValid(vector);
    }

    /**
     * 🔧 Limpiar vector (eliminar valores muy pequeños)
     */
    static clean(vector, tolerance = 0.0001) {
        const point = VectorUtils.clean(vector, tolerance);
        return new Vector2D(point.x, point.y);
    }

    /**
     * 🔧 Redondear componentes del vector
     */
    static round(vector, decimals = 0) {
        const point = VectorUtils.round(vector, decimals);
        return new Vector2D(point.x, point.y);
    }

    /**
     * 📊 Obtener estadísticas de un array de vectores
     */
    static getStats(vectors) {
        return VectorUtils.getStats(vectors);
    }

    /**
     * 🎨 Formatear vector para debug
     */
    static debug(vector, label = 'Vector') {
        return VectorUtils.debug(vector, label);
    }

    // ========================================
    // ACCESO A MÓDULOS ESPECIALIZADOS
    // ========================================

    /**
     * 🏭 Acceso al factory de vectores
     */
    static get Factory() {
        return VectorFactory;
    }

    /**
     * ➕ Acceso a operaciones vectoriales
     */
    static get Operations() {
        return VectorOperations;
    }

    /**
     * 📐 Acceso a geometría vectorial
     */
    static get Geometry() {
        return VectorGeometry;
    }

    /**
     * 🔧 Acceso a utilidades vectoriales
     */
    static get Utils() {
        return VectorUtils;
    }
}

export default Vector2D; 