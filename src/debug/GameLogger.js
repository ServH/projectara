/**
 * 🔍 GAME LOGGER - Sistema de Logging Centralizado
 * Captura todos los errores, eventos y métricas del juego
 * Permite diagnóstico en tiempo real
 */

class GameLogger {
    constructor() {
        this.logs = [];
        this.errors = [];
        this.warnings = [];
        this.events = [];
        this.metrics = new Map();
        this.startTime = Date.now();
        this.isEnabled = true;
        
        // Interceptar errores globales
        this.setupGlobalErrorHandling();
        
        // Configurar niveles de log
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };
        
        this.currentLevel = this.logLevels.DEBUG;
    }

    setupGlobalErrorHandling() {
        // Interceptar errores globales
        window.addEventListener('error', (event) => {
            this.error('GLOBAL_ERROR', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Interceptar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.error('UNHANDLED_PROMISE_REJECTION', {
                reason: event.reason,
                stack: event.reason?.stack
            });
        });

        // NO interceptar console.error para evitar bucle infinito
        // La interceptación de console.error se ha removido para evitar recursión
    }

    log(level, category, message, data = null) {
        if (!this.isEnabled || level > this.currentLevel) return;
        
        const timestamp = Date.now() - this.startTime;
        const logEntry = {
            timestamp,
            level: Object.keys(this.logLevels)[level],
            category,
            message,
            data
        };
        
        this.logs.push(logEntry);
        
        // Mantener solo los últimos 1000 logs
        if (this.logs.length > 1000) {
            this.logs.shift();
        }
        
        // Categorizar por tipo
        switch (level) {
            case this.logLevels.ERROR:
                this.errors.push(logEntry);
                break;
            case this.logLevels.WARN:
                this.warnings.push(logEntry);
                break;
        }
        
        // Output a consola con formato
        this.outputToConsole(logEntry);
    }

    error(category, message, data = null) {
        this.log(this.logLevels.ERROR, category, message, data);
    }

    warn(category, message, data = null) {
        this.log(this.logLevels.WARN, category, message, data);
    }

    info(category, message, data = null) {
        this.log(this.logLevels.INFO, category, message, data);
    }

    debug(category, message, data = null) {
        this.log(this.logLevels.DEBUG, category, message, data);
    }

    trace(category, message, data = null) {
        this.log(this.logLevels.TRACE, category, message, data);
    }

    // Logging específico para eventos del juego
    logEvent(eventType, eventData) {
        const eventEntry = {
            timestamp: Date.now() - this.startTime,
            type: eventType,
            data: eventData
        };
        
        this.events.push(eventEntry);
        this.debug('EVENT', `${eventType}`, eventData);
    }

    // Métricas de rendimiento
    startMetric(name) {
        this.metrics.set(name, { start: performance.now() });
    }

    endMetric(name) {
        const metric = this.metrics.get(name);
        if (metric) {
            metric.end = performance.now();
            metric.duration = metric.end - metric.start;
            this.debug('METRIC', `${name}: ${metric.duration.toFixed(2)}ms`);
        }
    }

    outputToConsole(logEntry) {
        const { timestamp, level, category, message, data } = logEntry;
        const timeStr = `[${(timestamp / 1000).toFixed(3)}s]`;
        const prefix = this.getLevelPrefix(level);
        
        const logMessage = `${timeStr} ${prefix} ${category}: ${message}`;
        
        switch (level) {
            case 'ERROR':
                console.error(logMessage, data || '');
                break;
            case 'WARN':
                console.warn(logMessage, data || '');
                break;
            case 'INFO':
                console.info(logMessage, data || '');
                break;
            default:
                console.log(logMessage, data || '');
        }
    }

    getLevelPrefix(level) {
        const prefixes = {
            ERROR: '❌',
            WARN: '⚠️',
            INFO: 'ℹ️',
            DEBUG: '🔧',
            TRACE: '🔍'
        };
        return prefixes[level] || '📝';
    }

    // Generar reporte de diagnóstico
    generateDiagnosticReport() {
        const report = {
            summary: {
                totalLogs: this.logs.length,
                errors: this.errors.length,
                warnings: this.warnings.length,
                events: this.events.length,
                uptime: Date.now() - this.startTime
            },
            recentErrors: this.errors.slice(-10),
            recentWarnings: this.warnings.slice(-10),
            recentEvents: this.events.slice(-20),
            metrics: Object.fromEntries(this.metrics)
        };
        
        return report;
    }

    // Exportar logs para análisis
    exportLogs() {
        const exportData = {
            timestamp: new Date().toISOString(),
            logs: this.logs,
            errors: this.errors,
            warnings: this.warnings,
            events: this.events,
            metrics: Object.fromEntries(this.metrics)
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Limpiar logs
    clear() {
        this.logs = [];
        this.errors = [];
        this.warnings = [];
        this.events = [];
        this.metrics.clear();
    }

    // Configurar nivel de logging
    setLevel(level) {
        if (typeof level === 'string') {
            this.currentLevel = this.logLevels[level.toUpperCase()] ?? this.logLevels.DEBUG;
        } else {
            this.currentLevel = level;
        }
    }

    // Habilitar/deshabilitar logging
    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
}

// Instancia global del logger
const gameLogger = new GameLogger();

// Hacer disponible globalmente para debugging
window.gameLogger = gameLogger;

export default gameLogger; 