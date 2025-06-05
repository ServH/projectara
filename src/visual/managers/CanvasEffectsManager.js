/**
 * 🌊 CANVAS EFFECTS MANAGER
 * Gestor especializado para efectos visuales y animaciones del juego
 * 
 * RESPONSABILIDADES:
 * - Trails de flotas y movimiento orgánico
 * - Explosiones y efectos de batalla
 * - Partículas y animaciones
 * - Efectos de lanzamiento y llegada
 * 
 * PATRÓN: Strategy Pattern
 * PRINCIPIOS: Single Responsibility, Strategy
 */

export class CanvasEffectsManager {
    constructor(ctx, config = {}) {
        this.ctx = ctx;
        this.config = {
            // Trail settings
            trails: {
                enabled: true,
                maxLength: 20,
                fadeSpeed: 0.95,
                minOpacity: 0.1,
                width: 2,
                ...config.trails
            },
            
            // Explosion settings
            explosions: {
                enabled: true,
                duration: 1000,
                maxRadius: 50,
                particleCount: 15,
                colors: ['#ff4444', '#ff8844', '#ffaa44'],
                ...config.explosions
            },
            
            // Particle settings
            particles: {
                enabled: true,
                gravity: 0.1,
                friction: 0.98,
                maxLifetime: 2000,
                ...config.particles
            },
            
            // Animation settings
            animations: {
                enabled: true,
                pulseSpeed: 0.002,
                glowIntensity: 0.3,
                ...config.animations
            }
        };
        
        // Estado de efectos activos
        this.activeEffects = {
            trails: new Map(),
            explosions: [],
            particles: [],
            animations: new Map()
        };
        
        // Estrategias de efectos
        this.effectStrategies = {
            launch: this.createLaunchEffect.bind(this),
            arrival: this.createArrivalEffect.bind(this),
            conquest: this.createConquestEffect.bind(this),
            battle: this.createBattleEffect.bind(this),
            destruction: this.createDestructionEffect.bind(this)
        };
        
        // Cache de efectos
        this.effectCache = {
            gradients: new Map(),
            patterns: new Map(),
            lastCleanup: Date.now(),
            cleanupInterval: 5000
        };
        
        console.log('🌊 CanvasEffectsManager inicializado');
    }
    
    /**
     * 🎨 Renderizar todos los efectos activos
     */
    renderEffects() {
        const currentTime = Date.now();
        
        // Renderizar trails
        if (this.config.trails.enabled) {
            this.renderTrails(currentTime);
        }
        
        // Renderizar explosiones
        if (this.config.explosions.enabled) {
            this.renderExplosions(currentTime);
        }
        
        // Renderizar partículas
        if (this.config.particles.enabled) {
            this.renderParticles(currentTime);
        }
        
        // Renderizar animaciones
        if (this.config.animations.enabled) {
            this.renderAnimations(currentTime);
        }
        
        // Limpiar efectos expirados
        this.cleanupExpiredEffects(currentTime);
    }
    
    /**
     * 🌟 Renderizar trails de flotas
     */
    renderTrails(currentTime) {
        this.ctx.save();
        
        for (const [fleetId, trail] of this.activeEffects.trails) {
            if (trail.points.length < 2) continue;
            
            this.ctx.strokeStyle = trail.color;
            this.ctx.lineWidth = this.config.trails.width;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            // Renderizar trail con gradiente de opacidad
            for (let i = 1; i < trail.points.length; i++) {
                const point = trail.points[i];
                const prevPoint = trail.points[i - 1];
                
                // Calcular opacidad basada en la edad del punto
                const age = currentTime - point.timestamp;
                const maxAge = this.config.trails.maxLength * 50; // 50ms por punto
                const opacity = Math.max(
                    this.config.trails.minOpacity,
                    1 - (age / maxAge)
                );
                
                this.ctx.globalAlpha = opacity;
                this.ctx.beginPath();
                this.ctx.moveTo(prevPoint.x, prevPoint.y);
                this.ctx.lineTo(point.x, point.y);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
    
    /**
     * 💥 Renderizar explosiones
     */
    renderExplosions(currentTime) {
        this.ctx.save();
        
        for (let i = this.activeEffects.explosions.length - 1; i >= 0; i--) {
            const explosion = this.activeEffects.explosions[i];
            const age = currentTime - explosion.startTime;
            const progress = age / explosion.duration;
            
            if (progress >= 1) {
                this.activeEffects.explosions.splice(i, 1);
                continue;
            }
            
            this.renderExplosion(explosion, progress);
        }
        
        this.ctx.restore();
    }
    
    /**
     * 💥 Renderizar explosión individual
     */
    renderExplosion(explosion, progress) {
        const { x, y, maxRadius, color, particles } = explosion;
        
        // Renderizar onda expansiva
        const currentRadius = maxRadius * progress;
        const opacity = 1 - progress;
        
        this.ctx.globalAlpha = opacity * 0.6;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Renderizar partículas de la explosión
        for (const particle of particles) {
            this.renderExplosionParticle(particle, progress);
        }
    }
    
    /**
     * ✨ Renderizar partícula de explosión
     */
    renderExplosionParticle(particle, progress) {
        const currentX = particle.startX + particle.velocityX * progress * 100;
        const currentY = particle.startY + particle.velocityY * progress * 100;
        const size = particle.size * (1 - progress * 0.5);
        const opacity = 1 - progress;
        
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(currentX, currentY, size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 🚀 Crear efecto de lanzamiento
     */
    createLaunchEffect(x, y, options = {}) {
        const effect = {
            type: 'launch',
            x, y,
            startTime: Date.now(),
            duration: 500,
            maxRadius: options.radius || 30,
            color: options.color || '#00ff88',
            particles: this.generateLaunchParticles(x, y, options.color)
        };
        
        this.activeEffects.explosions.push(effect);
        return effect;
    }
    
    /**
     * 🎯 Crear efecto de llegada
     */
    createArrivalEffect(x, y, options = {}) {
        const effect = {
            type: 'arrival',
            x, y,
            startTime: Date.now(),
            duration: 300,
            maxRadius: options.radius || 20,
            color: options.color || '#44aaff',
            particles: this.generateArrivalParticles(x, y, options.color)
        };
        
        this.activeEffects.explosions.push(effect);
        return effect;
    }
    
    /**
     * 👑 Crear efecto de conquista
     */
    createConquestEffect(x, y, options = {}) {
        const effect = {
            type: 'conquest',
            x, y,
            startTime: Date.now(),
            duration: 800,
            maxRadius: options.radius || 40,
            color: options.color || '#ffaa00',
            particles: this.generateConquestParticles(x, y, options.color)
        };
        
        this.activeEffects.explosions.push(effect);
        
        // Añadir animación de pulso
        this.addPulseAnimation(`conquest_${Date.now()}`, x, y, {
            baseRadius: 25,
            color: options.color || '#ffaa00',
            intensity: 0.5,
            duration: 2000
        });
        
        return effect;
    }
    
    /**
     * ⚔️ Crear efecto de batalla
     */
    createBattleEffect(x, y, options = {}) {
        const effect = {
            type: 'battle',
            x, y,
            startTime: Date.now(),
            duration: 600,
            maxRadius: options.radius || 35,
            color: options.color || '#ff4444',
            particles: this.generateBattleParticles(x, y, options.color)
        };
        
        this.activeEffects.explosions.push(effect);
        
        // Añadir animación de pulso intermitente
        this.addPulseAnimation(`battle_${Date.now()}`, x, y, {
            baseRadius: 20,
            color: options.color || '#ff4444',
            intensity: 0.7,
            duration: 1500
        });
        
        return effect;
    }
    
    /**
     * 💀 Crear efecto de destrucción
     */
    createDestructionEffect(x, y, options = {}) {
        const effect = {
            type: 'destruction',
            x, y,
            startTime: Date.now(),
            duration: 1000,
            maxRadius: options.radius || 50,
            color: options.color || '#ff0000',
            particles: this.generateDestructionParticles(x, y, options.color)
        };
        
        this.activeEffects.explosions.push(effect);
        
        // Añadir múltiples pulsos para efecto dramático
        this.addPulseAnimation(`destruction_${Date.now()}_1`, x, y, {
            baseRadius: 30,
            color: '#ff0000',
            intensity: 1.0,
            duration: 2500
        });
        
        this.addPulseAnimation(`destruction_${Date.now()}_2`, x, y, {
            baseRadius: 45,
            color: '#ff4444',
            intensity: 0.8,
            duration: 3000
        });
        
        return effect;
    }
    
    /**
     * 🌟 Añadir trail a una flota
     */
    addFleetTrail(fleetId, x, y, color = '#00ff88') {
        if (!this.activeEffects.trails.has(fleetId)) {
            this.activeEffects.trails.set(fleetId, {
                points: [],
                color: color,
                lastUpdate: Date.now()
            });
        }
        
        const trail = this.activeEffects.trails.get(fleetId);
        const now = Date.now();
        
        // Añadir nuevo punto si ha pasado suficiente tiempo
        if (now - trail.lastUpdate > 50) { // 50ms entre puntos
            trail.points.push({
                x, y,
                timestamp: now
            });
            
            // Limitar longitud del trail
            if (trail.points.length > this.config.trails.maxLength) {
                trail.points.shift();
            }
            
            trail.lastUpdate = now;
        }
    }
    
    /**
     * 💓 Añadir animación de pulso
     */
    addPulseAnimation(id, x, y, options = {}) {
        this.activeEffects.animations.set(id, {
            type: 'pulse',
            x, y,
            baseRadius: options.baseRadius || 20,
            color: options.color || '#ffffff',
            intensity: options.intensity || 0.3,
            startTime: Date.now(),
            duration: options.duration || 1000
        });
    }
    
    /**
     * 🚀 Generar partículas de lanzamiento
     */
    generateLaunchParticles(x, y, color = '#00ff88') {
        const particles = [];
        const count = this.config.explosions.particleCount;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            particles.push({
                startX: x,
                startY: y,
                velocityX: Math.cos(angle) * (Math.random() * 2 + 1),
                velocityY: Math.sin(angle) * (Math.random() * 2 + 1),
                size: Math.random() * 3 + 1,
                color: color
            });
        }
        
        return particles;
    }
    
    /**
     * 🎯 Generar partículas de llegada
     */
    generateArrivalParticles(x, y, color = '#44aaff') {
        const particles = [];
        const count = Math.floor(this.config.explosions.particleCount * 0.7);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                startX: x,
                startY: y,
                velocityX: Math.cos(angle) * (Math.random() * 1.5 + 0.5),
                velocityY: Math.sin(angle) * (Math.random() * 1.5 + 0.5),
                size: Math.random() * 2 + 0.5,
                color: color
            });
        }
        
        return particles;
    }
    
    /**
     * 👑 Generar partículas de conquista
     */
    generateConquestParticles(x, y, color = '#ffaa00') {
        const particles = [];
        const count = this.config.explosions.particleCount * 1.5;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                startX: x,
                startY: y,
                velocityX: Math.cos(angle) * (Math.random() * 3 + 1),
                velocityY: Math.sin(angle) * (Math.random() * 3 + 1),
                size: Math.random() * 4 + 1,
                color: i % 3 === 0 ? '#ffffff' : color
            });
        }
        
        return particles;
    }
    
    /**
     * ⚔️ Generar partículas de batalla
     */
    generateBattleParticles(x, y, color = '#ff4444') {
        const particles = [];
        const count = this.config.explosions.particleCount * 1.2;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                startX: x,
                startY: y,
                velocityX: Math.cos(angle) * (Math.random() * 2.5 + 0.8),
                velocityY: Math.sin(angle) * (Math.random() * 2.5 + 0.8),
                size: Math.random() * 3 + 0.8,
                color: i % 4 === 0 ? '#ffaa00' : color
            });
        }
        
        return particles;
    }
    
    /**
     * 💀 Generar partículas de destrucción
     */
    generateDestructionParticles(x, y, color = '#ff0000') {
        const particles = [];
        const count = this.config.explosions.particleCount * 2;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                startX: x,
                startY: y,
                velocityX: Math.cos(angle) * (Math.random() * 4 + 1.5),
                velocityY: Math.sin(angle) * (Math.random() * 4 + 1.5),
                size: Math.random() * 5 + 1,
                color: i % 5 === 0 ? '#ffffff' : (i % 3 === 0 ? '#ffaa00' : color)
            });
        }
        
        return particles;
    }
    
    /**
     * 💓 Renderizar animación de pulso
     */
    renderPulseAnimation(animation, currentTime) {
        const { x, y, baseRadius, color, intensity } = animation;
        const pulse = Math.sin(currentTime * this.config.animations.pulseSpeed) * 0.5 + 0.5;
        const currentRadius = baseRadius * (1 + pulse * intensity);
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.3 + pulse * 0.4;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    /**
     * 🎭 Renderizar animaciones especiales
     */
    renderAnimations(currentTime) {
        for (const [id, animation] of this.activeEffects.animations) {
            switch (animation.type) {
                case 'pulse':
                    this.renderPulseAnimation(animation, currentTime);
                    break;
            }
        }
    }
    
    /**
     * 🧹 Limpiar efectos expirados
     */
    cleanupExpiredEffects(currentTime) {
        // Limpiar trails antiguos
        for (const [fleetId, trail] of this.activeEffects.trails) {
            trail.points = trail.points.filter(
                point => currentTime - point.timestamp < this.config.trails.maxLength * 100
            );
            
            if (trail.points.length === 0) {
                this.activeEffects.trails.delete(fleetId);
            }
        }
        
        // Limpiar animaciones expiradas
        for (const [id, animation] of this.activeEffects.animations) {
            if (currentTime - animation.startTime > animation.duration) {
                this.activeEffects.animations.delete(id);
            }
        }
    }
    
    /**
     * 📊 Obtener estadísticas de efectos
     */
    getEffectsStats() {
        return {
            trails: this.activeEffects.trails.size,
            explosions: this.activeEffects.explosions.length,
            particles: this.activeEffects.particles.length,
            animations: this.activeEffects.animations.size
        };
    }
    
    /**
     * 🧹 Limpiar todos los efectos
     */
    clearAllEffects() {
        this.activeEffects.trails.clear();
        this.activeEffects.explosions = [];
        this.activeEffects.particles = [];
        this.activeEffects.animations.clear();
    }
    
    /**
     * 🧹 Destruir gestor
     */
    destroy() {
        this.clearAllEffects();
        this.effectCache.gradients.clear();
        this.effectCache.patterns.clear();
        
        console.log('🧹 CanvasEffectsManager destruido');
    }
} 