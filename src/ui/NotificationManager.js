/**
 * 📢 NOTIFICATION MANAGER - Sistema de Notificaciones
 * Gestiona notificaciones temporales para eventos importantes del juego
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 3000; // 3 segundos
        this.container = null;
        
        this.setupContainer();
        this.setupEventListeners();
        
        console.log('📢 NotificationManager inicializado');
    }

    /**
     * Crear contenedor de notificaciones
     */
    setupContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            pointer-events: none;
            max-width: 350px;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * Configurar listeners de eventos del juego
     */
    setupEventListeners() {
        eventBus.on(GAME_EVENTS.PLANET_CONQUERED, this.onPlanetConquered.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_ARRIVED, this.onFleetArrived.bind(this));
        eventBus.on(GAME_EVENTS.FLEET_LAUNCHED, this.onFleetLaunched.bind(this));
        eventBus.on(GAME_EVENTS.BATTLE_START, this.onBattleStart.bind(this));
        eventBus.on(GAME_EVENTS.BATTLE_END, this.onBattleEnd.bind(this));
    }

    /**
     * Mostrar notificación
     */
    showNotification(type, title, message, duration = this.defaultDuration) {
        // Limitar número de notificaciones
        if (this.notifications.length >= this.maxNotifications) {
            this.removeOldestNotification();
        }

        const notification = this.createNotificationElement(type, title, message);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Auto-remover después del tiempo especificado
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        return notification;
    }

    /**
     * Crear elemento de notificación
     */
    createNotificationElement(type, title, message) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            conquest: { bg: 'rgba(0, 255, 136, 0.9)', border: '#00ff88', icon: '👑' },
            fleet: { bg: 'rgba(0, 136, 255, 0.9)', border: '#0088ff', icon: '🚀' },
            battle: { bg: 'rgba(255, 136, 0, 0.9)', border: '#ff8800', icon: '⚔️' },
            arrival: { bg: 'rgba(136, 255, 0, 0.9)', border: '#88ff00', icon: '🎯' },
            warning: { bg: 'rgba(255, 136, 136, 0.9)', border: '#ff8888', icon: '⚠️' }
        };

        const color = colors[type] || colors.fleet;

        notification.style.cssText = `
            background: ${color.bg};
            border: 2px solid ${color.border};
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 8px;
            color: #000000;
            font-family: 'Arial', sans-serif;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.3s ease-out;
            pointer-events: auto;
            cursor: pointer;
            backdrop-filter: blur(5px);
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${color.icon}</span>
                <div>
                    <div style="font-size: 14px; margin-bottom: 2px;">${title}</div>
                    <div style="font-size: 12px; opacity: 0.8;">${message}</div>
                </div>
            </div>
        `;

        // Permitir cerrar al hacer clic
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        return notification;
    }

    /**
     * Remover notificación específica
     */
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    /**
     * Remover la notificación más antigua
     */
    removeOldestNotification() {
        if (this.notifications.length > 0) {
            this.removeNotification(this.notifications[0]);
        }
    }

    /**
     * Event Handlers
     */
    onPlanetConquered(data) {
        const isPlayerConquest = data.newOwner === 'player';
        const isPlayerLoss = data.oldOwner === 'player';
        
        if (isPlayerConquest) {
            this.showNotification(
                'conquest',
                '¡Planeta Conquistado!',
                `Has conquistado ${data.planetId} con ${data.shipsRemaining} naves`,
                4000
            );
        } else if (isPlayerLoss) {
            this.showNotification(
                'warning',
                'Planeta Perdido',
                `Has perdido el control de ${data.planetId}`,
                4000
            );
        }
    }

    onFleetArrived(data) {
        if (data.owner === 'player') {
            this.showNotification(
                'arrival',
                'Flota Llegó',
                `${data.ships} naves llegaron a ${data.toPlanet}`,
                2500
            );
        }
    }

    onFleetLaunched(data) {
        if (data.owner === 'player' && data.ships >= 10) { // Solo flotas grandes
            this.showNotification(
                'fleet',
                'Flota Enviada',
                `${data.ships} naves hacia ${data.toPlanet}`,
                2000
            );
        }
    }

    onBattleStart(data) {
        if (data.defenderOwner === 'player' || data.attackerOwner === 'player') {
            this.showNotification(
                'battle',
                'Batalla Iniciada',
                `Combate en ${data.planetId}`,
                2000
            );
        }
    }

    onBattleEnd(data) {
        // Solo mostrar si fue una batalla significativa
        if (data.conquered && (data.oldOwner === 'player' || data.newOwner === 'player')) {
            // Ya se maneja en onPlanetConquered
            return;
        }
    }

    /**
     * Limpiar todas las notificaciones
     */
    clearAll() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }

    /**
     * Destruir el manager
     */
    destroy() {
        this.clearAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        console.log('📢 NotificationManager destruido');
    }
}

// Agregar estilos CSS para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .notification:hover {
        transform: scale(1.02);
        transition: transform 0.2s ease;
    }
`;
document.head.appendChild(style);

export default NotificationManager; 