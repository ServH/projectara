/**
 * 🚧 OBSTACLE - Obstáculo para Steering Behaviors
 * Representa planetas u otros obstáculos que las naves deben evitar
 */

import { Vector2D } from './Vector2D.js';

export class Obstacle {
    constructor(position, radius) {
        this.position = position.copy();
        this.radius = radius;
        
        // Propiedades visuales
        this.color = this.generateRandomColor();
        this.glowIntensity = 0.5 + Math.random() * 0.5;
        
        // Animación sutil
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.5 + Math.random() * 1.0;
        
        console.log(`🚧 Obstáculo creado en ${position.toString()} con radio ${radius}`);
    }

    /**
     * 🎨 Generar color aleatorio para el obstáculo
     */
    generateRandomColor() {
        const colors = [
            '#ff6b6b', // Rojo coral
            '#4ecdc4', // Turquesa
            '#45b7d1', // Azul cielo
            '#96ceb4', // Verde menta
            '#feca57', // Amarillo dorado
            '#ff9ff3', // Rosa
            '#54a0ff', // Azul brillante
            '#5f27cd', // Púrpura
            '#00d2d3', // Cian
            '#ff9f43'  // Naranja
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 🔄 Actualizar obstáculo (para animaciones)
     */
    update(deltaTime) {
        // Actualizar fase de pulso para animación sutil
        this.pulsePhase += this.pulseSpeed * deltaTime;
        if (this.pulsePhase > Math.PI * 2) {
            this.pulsePhase -= Math.PI * 2;
        }
    }

    /**
     * 🎨 Renderizar obstáculo
     */
    render(ctx, debugConfig) {
        ctx.save();
        
        // Renderizar zona de detección si está habilitado
        if (debugConfig.showObstacleZones) {
            this.renderDetectionZone(ctx);
        }
        
        // Renderizar el obstáculo principal
        this.renderBody(ctx);
        
        ctx.restore();
    }

    /**
     * 🎨 Renderizar cuerpo principal del obstáculo
     */
    renderBody(ctx) {
        ctx.save();
        
        // Calcular radio con pulso sutil
        const pulseAmount = Math.sin(this.pulsePhase) * 0.1;
        const currentRadius = this.radius * (1 + pulseAmount * 0.1);
        
        // Gradiente radial para efecto de profundidad
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, currentRadius
        );
        
        // Color base más brillante en el centro
        const baseColor = this.color;
        const centerColor = this.lightenColor(baseColor, 0.3);
        const edgeColor = this.darkenColor(baseColor, 0.2);
        
        gradient.addColorStop(0, centerColor);
        gradient.addColorStop(0.7, baseColor);
        gradient.addColorStop(1, edgeColor);
        
        // Dibujar círculo principal
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde exterior
        ctx.strokeStyle = this.lightenColor(baseColor, 0.5);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        
        // Efecto de brillo interior
        ctx.globalAlpha = 0.3 + this.glowIntensity * 0.2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
            this.position.x - currentRadius * 0.3, 
            this.position.y - currentRadius * 0.3, 
            currentRadius * 0.2, 
            0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * 🎨 Renderizar zona de detección
     */
    renderDetectionZone(ctx) {
        ctx.save();
        
        // Zona de detección extendida
        const detectionRadius = this.radius * 1.5;
        
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, detectionRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * 🎨 Aclarar color
     */
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
        const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
        const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    /**
     * 🎨 Oscurecer color
     */
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.max(0, Math.floor(r * (1 - amount)));
        const newG = Math.max(0, Math.floor(g * (1 - amount)));
        const newB = Math.max(0, Math.floor(b * (1 - amount)));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    /**
     * 🔍 Verificar si un punto está dentro del obstáculo
     */
    containsPoint(point) {
        return this.position.distance(point) <= this.radius;
    }

    /**
     * 🔍 Verificar intersección con línea
     */
    intersectsLine(lineStart, lineEnd) {
        const d = Vector2D.subtract(lineEnd, lineStart);
        const f = Vector2D.subtract(lineStart, this.position);
        
        const a = d.dot(d);
        const b = 2 * f.dot(d);
        const c = f.dot(f) - this.radius * this.radius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return false; // No hay intersección
        }
        
        const discriminantSqrt = Math.sqrt(discriminant);
        const t1 = (-b - discriminantSqrt) / (2 * a);
        const t2 = (-b + discriminantSqrt) / (2 * a);
        
        // Verificar si alguna intersección está dentro del segmento
        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }

    /**
     * 🔍 Obtener punto de intersección más cercano con línea
     */
    getClosestIntersectionPoint(lineStart, lineEnd) {
        const d = Vector2D.subtract(lineEnd, lineStart);
        const f = Vector2D.subtract(lineStart, this.position);
        
        const a = d.dot(d);
        const b = 2 * f.dot(d);
        const c = f.dot(f) - this.radius * this.radius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return null; // No hay intersección
        }
        
        const discriminantSqrt = Math.sqrt(discriminant);
        const t1 = (-b - discriminantSqrt) / (2 * a);
        const t2 = (-b + discriminantSqrt) / (2 * a);
        
        // Encontrar la intersección más cercana al inicio de la línea
        let closestT = null;
        
        if (t1 >= 0 && t1 <= 1) {
            closestT = t1;
        }
        
        if (t2 >= 0 && t2 <= 1 && (closestT === null || t2 < closestT)) {
            closestT = t2;
        }
        
        if (closestT !== null) {
            return Vector2D.add(lineStart, Vector2D.multiply(d, closestT));
        }
        
        return null;
    }

    /**
     * 📐 Calcular distancia mínima a una línea
     */
    distanceToLine(lineStart, lineEnd) {
        const lineLength = lineStart.distance(lineEnd);
        
        if (lineLength === 0) {
            return this.position.distance(lineStart);
        }
        
        const t = Math.max(0, Math.min(1, 
            Vector2D.subtract(this.position, lineStart).dot(Vector2D.subtract(lineEnd, lineStart)) / 
            (lineLength * lineLength)
        ));
        
        const projection = Vector2D.add(lineStart, 
            Vector2D.multiply(Vector2D.subtract(lineEnd, lineStart), t)
        );
        
        return this.position.distance(projection);
    }

    /**
     * 🎯 Obtener punto más cercano en el borde del obstáculo
     */
    getClosestPointOnEdge(point) {
        const direction = Vector2D.subtract(point, this.position);
        const distance = direction.magnitude();
        
        if (distance === 0) {
            // Si el punto está en el centro, devolver un punto arbitrario en el borde
            return Vector2D.add(this.position, new Vector2D(this.radius, 0));
        }
        
        direction.normalize();
        return Vector2D.add(this.position, Vector2D.multiply(direction, this.radius));
    }

    /**
     * 🎯 Obtener vector normal desde un punto hacia el obstáculo
     */
    getNormalToPoint(point) {
        const direction = Vector2D.subtract(this.position, point);
        return direction.normalize();
    }

    /**
     * 📊 Obtener información del obstáculo
     */
    getInfo() {
        return {
            position: this.position.toObject(),
            radius: this.radius,
            color: this.color,
            area: Math.PI * this.radius * this.radius
        };
    }

    /**
     * 📝 Convertir a string para debugging
     */
    toString() {
        return `Obstacle(pos: ${this.position.toString()}, radius: ${this.radius.toFixed(1)})`;
    }

    /**
     * 📋 Crear copia del obstáculo
     */
    copy() {
        const copy = new Obstacle(this.position, this.radius);
        copy.color = this.color;
        copy.glowIntensity = this.glowIntensity;
        copy.pulsePhase = this.pulsePhase;
        copy.pulseSpeed = this.pulseSpeed;
        return copy;
    }

    /**
     * 🔄 Mover obstáculo a nueva posición
     */
    moveTo(newPosition) {
        this.position = newPosition.copy();
    }

    /**
     * 📏 Cambiar tamaño del obstáculo
     */
    resize(newRadius) {
        this.radius = Math.max(5, newRadius); // Radio mínimo de 5
    }

    /**
     * 🎨 Cambiar color del obstáculo
     */
    setColor(newColor) {
        this.color = newColor;
    }

    /**
     * 💥 Destruir obstáculo (cleanup)
     */
    destroy() {
        // Cleanup si es necesario
        console.log(`💥 Obstáculo destruido: ${this.toString()}`);
    }
} 