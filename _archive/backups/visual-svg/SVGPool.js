/**
 * 🏊 GALCON GAME - SVG OBJECT POOL
 * Sistema de pooling avanzado para elementos SVG
 * MILESTONE 2.2: Optimizaciones Críticas para Biomas
 */

export class SVGPool {
    constructor() {
        // Pools por tipo de elemento
        this.pools = {
            circles: [],
            triangles: [],
            hexagons: [],
            lines: [],
            paths: [],
            groups: [],
            texts: []
        };
        
        // Configuración de pools
        this.config = {
            maxPoolSize: 100,        // Máximo elementos por pool
            preAllocate: 20,         // Pre-asignar elementos al inicio
            cleanupInterval: 30000,  // Limpiar pools cada 30s
            maxIdleTime: 60000       // Tiempo máximo inactivo
        };
        
        // Estadísticas
        this.stats = {
            created: 0,
            reused: 0,
            destroyed: 0,
            poolHits: 0,
            poolMisses: 0
        };
        
        this.initializePools();
        this.startCleanupTimer();
        
        console.log('🏊 SVGPool inicializado con pools avanzados');
    }

    /**
     * Inicializar pools con elementos pre-asignados
     */
    initializePools() {
        // Pre-crear elementos más comunes
        for (let i = 0; i < this.config.preAllocate; i++) {
            this.pools.circles.push(this.createCircle());
            this.pools.groups.push(this.createGroup());
            this.pools.texts.push(this.createText());
        }
        
        // Pre-crear algunos elementos menos comunes
        for (let i = 0; i < Math.floor(this.config.preAllocate / 2); i++) {
            this.pools.triangles.push(this.createTriangle());
            this.pools.lines.push(this.createLine());
        }
        
        console.log(`🏊 Pools pre-inicializados: ${this.getTotalPooledElements()} elementos`);
    }

    /**
     * Obtener círculo del pool o crear nuevo
     */
    getCircle() {
        return this.getFromPool('circles', () => this.createCircle());
    }

    /**
     * Obtener triángulo del pool o crear nuevo
     */
    getTriangle() {
        return this.getFromPool('triangles', () => this.createTriangle());
    }

    /**
     * Obtener hexágono del pool o crear nuevo
     */
    getHexagon() {
        return this.getFromPool('hexagons', () => this.createHexagon());
    }

    /**
     * Obtener línea del pool o crear nuevo
     */
    getLine() {
        return this.getFromPool('lines', () => this.createLine());
    }

    /**
     * Obtener grupo del pool o crear nuevo
     */
    getGroup() {
        return this.getFromPool('groups', () => this.createGroup());
    }

    /**
     * Obtener texto del pool o crear nuevo
     */
    getText() {
        return this.getFromPool('texts', () => this.createText());
    }

    /**
     * Método genérico para obtener elemento del pool
     */
    getFromPool(poolName, createFunction) {
        const pool = this.pools[poolName];
        
        if (pool && pool.length > 0) {
            const element = pool.pop();
            element.dataset.pooled = 'false';
            element.dataset.lastUsed = Date.now().toString();
            this.stats.reused++;
            this.stats.poolHits++;
            return element;
        }
        
        // Si no hay elementos en el pool, crear nuevo
        const newElement = createFunction();
        newElement.dataset.pooled = 'false';
        newElement.dataset.lastUsed = Date.now().toString();
        this.stats.created++;
        this.stats.poolMisses++;
        return newElement;
    }

    /**
     * Devolver elemento al pool
     */
    returnToPool(element) {
        if (!element || !element.tagName) return;
        
        const poolName = this.getPoolNameForElement(element);
        if (!poolName) {
            element.remove();
            this.stats.destroyed++;
            return;
        }
        
        const pool = this.pools[poolName];
        
        // Verificar límite del pool
        if (pool.length >= this.config.maxPoolSize) {
            element.remove();
            this.stats.destroyed++;
            return;
        }
        
        // Limpiar elemento antes de devolverlo
        this.cleanElement(element);
        element.dataset.pooled = 'true';
        element.dataset.returnedAt = Date.now().toString();
        
        pool.push(element);
    }

    /**
     * Determinar a qué pool pertenece un elemento
     */
    getPoolNameForElement(element) {
        const tagName = element.tagName.toLowerCase();
        
        switch (tagName) {
            case 'circle':
                return 'circles';
            case 'polygon':
                // Distinguir entre triángulos y hexágonos por número de puntos
                const points = element.getAttribute('points');
                if (points) {
                    const pointCount = points.split(' ').length;
                    return pointCount <= 3 ? 'triangles' : 'hexagons';
                }
                return 'triangles';
            case 'line':
                return 'lines';
            case 'path':
                return 'paths';
            case 'g':
                return 'groups';
            case 'text':
                return 'texts';
            default:
                return null;
        }
    }

    /**
     * Limpiar elemento para reutilización
     */
    cleanElement(element) {
        // Remover del DOM si está presente
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        // Limpiar atributos específicos (mantener estructura básica)
        const attributesToKeep = ['tagName', 'data-pooled', 'data-returned-at', 'data-last-used'];
        const attributes = Array.from(element.attributes);
        
        attributes.forEach(attr => {
            if (!attributesToKeep.includes(attr.name) && !attr.name.startsWith('data-pool')) {
                element.removeAttribute(attr.name);
            }
        });
        
        // 🔧 CORREGIDO: Limpiar estilos y clase usando setAttribute para SVG
        element.style.cssText = '';
        element.setAttribute('class', ''); // Usar setAttribute en lugar de className para SVG
        
        // Limpiar contenido de texto
        if (element.tagName.toLowerCase() === 'text') {
            element.textContent = '';
        }
    }

    /**
     * Crear elementos específicos
     */
    createCircle() {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.dataset.poolType = 'circle';
        return circle;
    }

    createTriangle() {
        const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        triangle.dataset.poolType = 'triangle';
        return triangle;
    }

    createHexagon() {
        const hexagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        hexagon.dataset.poolType = 'hexagon';
        return hexagon;
    }

    createLine() {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.dataset.poolType = 'line';
        return line;
    }

    createGroup() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.dataset.poolType = 'group';
        return group;
    }

    createText() {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.dataset.poolType = 'text';
        return text;
    }

    /**
     * Limpieza automática de pools
     */
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupIdleElements();
        }, this.config.cleanupInterval);
    }

    /**
     * Limpiar elementos inactivos de los pools
     */
    cleanupIdleElements() {
        const now = Date.now();
        let cleanedCount = 0;
        
        Object.keys(this.pools).forEach(poolName => {
            const pool = this.pools[poolName];
            const originalLength = pool.length;
            
            // Filtrar elementos que han estado inactivos demasiado tiempo
            this.pools[poolName] = pool.filter(element => {
                const returnedAt = parseInt(element.dataset.returnedAt) || now;
                const idleTime = now - returnedAt;
                
                if (idleTime > this.config.maxIdleTime) {
                    element.remove();
                    this.stats.destroyed++;
                    cleanedCount++;
                    return false;
                }
                return true;
            });
        });
        
        if (cleanedCount > 0) {
            console.log(`🧹 Pool cleanup: ${cleanedCount} elementos inactivos eliminados`);
        }
    }

    /**
     * Obtener estadísticas del pool
     */
    getStats() {
        return {
            ...this.stats,
            poolSizes: Object.keys(this.pools).reduce((acc, poolName) => {
                acc[poolName] = this.pools[poolName].length;
                return acc;
            }, {}),
            totalPooled: this.getTotalPooledElements(),
            hitRate: this.stats.poolHits / (this.stats.poolHits + this.stats.poolMisses) * 100
        };
    }

    /**
     * Obtener total de elementos en pools
     */
    getTotalPooledElements() {
        return Object.values(this.pools).reduce((total, pool) => total + pool.length, 0);
    }

    /**
     * Limpiar todos los pools
     */
    clearAllPools() {
        Object.keys(this.pools).forEach(poolName => {
            this.pools[poolName].forEach(element => {
                element.remove();
                this.stats.destroyed++;
            });
            this.pools[poolName] = [];
        });
        
        console.log('🧹 Todos los pools limpiados');
    }

    /**
     * Destruir el sistema de pools
     */
    destroy() {
        this.clearAllPools();
        console.log('💥 SVGPool destruido');
    }
}

export default SVGPool; 