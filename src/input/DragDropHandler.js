/**
 * 🎯 GALCON GAME - DRAG & DROP HANDLER
 * Sistema de drag & drop para envío de flotas estilo Galcon
 */

import eventBus, { GAME_EVENTS } from '../core/EventBus.js';

export class DragDropHandler {
    constructor(gameEngine, selectionSystem) {
        this.gameEngine = gameEngine;
        this.selectionSystem = selectionSystem;
        
        // Estado del drag
        this.isDragging = false;
        this.dragStartPlanet = null;
        this.targetPlanet = null;
        this.currentX = 0;
        this.currentY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Elementos visuales
        this.previewLines = []; // Array de líneas desde múltiples planetas
        this.targetHighlight = null;
        
        // Configuración
        this.config = {
            dragThreshold: 15, // Aumentado para evitar conflictos
            lineColor: '#ffaa00',
            lineWidth: 2,
            lineOpacity: 0.7,
            selectedLineColor: '#00ff88',
            selectedLineWidth: 3
        };
        
        this.setupEventListeners();
        console.log('🎯 DragDropHandler inicializado');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Esperar a que el canvas esté listo
        const setupListeners = () => {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                // Usar eventos con mayor prioridad para drag & drop
                canvas.addEventListener('mousedown', this.onMouseDown.bind(this), true);
                canvas.addEventListener('mousemove', this.onMouseMove.bind(this), true);
                canvas.addEventListener('mouseup', this.onMouseUp.bind(this), true);
                
                // Eventos del sistema de selección
                eventBus.on(GAME_EVENTS.SELECTION_START, this.onSelectionStart.bind(this));
                eventBus.on(GAME_EVENTS.SELECTION_END, this.onSelectionEnd.bind(this));
                
                console.log('🎯 DragDropHandler event listeners configurados');
            } else {
                setTimeout(setupListeners, 100);
            }
        };
        setupListeners();
    }

    /**
     * Manejar mouse down
     */
    onMouseDown(event) {
        console.log(`🖱️ CLICK DETECTADO en DragDropHandler`); // Log básico para verificar
        
        if (event.button !== 0) return; // Solo botón izquierdo

        // Obtener posición relativa al canvas
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.dragStartX = x;
        this.dragStartY = y;
        this.currentX = x;
        this.currentY = y;

        // Verificar planetas seleccionados
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerSelectedPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        console.log(`🖱️ Click en (${Math.round(x)}, ${Math.round(y)}) - Planetas player seleccionados: ${playerSelectedPlanets.length}`);
        
        // Verificar si hay planetas seleccionados del jugador
        const clickedPlanet = this.gameEngine.getPlanetAtPosition(x, y);
        
        if (clickedPlanet) {
            console.log(`🖱️ Planeta clickeado: ${clickedPlanet.id} (${clickedPlanet.owner})`);
        }
        
        // Solo iniciar drag si hay planetas seleccionados Y no estamos clickeando en un planeta del jugador
        if (playerSelectedPlanets.length > 0 && (!clickedPlanet || clickedPlanet.owner !== 'player')) {
            // Preparar para posible drag & drop
            this.prepareForDrag(x, y);
            console.log(`🎯 Preparando drag desde ${playerSelectedPlanets.length} planetas seleccionados`);
        } else {
            if (playerSelectedPlanets.length === 0) {
                console.log(`❌ No se puede hacer drag: no hay planetas del player seleccionados`);
            } else if (clickedPlanet && clickedPlanet.owner === 'player') {
                console.log(`❌ No se puede hacer drag: clickeando en planeta propio ${clickedPlanet.id}`);
            }
        }
    }

    /**
     * Preparar para drag (no iniciar aún)
     */
    prepareForDrag(x, y) {
        this.dragStartX = x;
        this.dragStartY = y;
        // No iniciar drag aún, esperar movimiento
    }

    /**
     * Manejar movimiento del mouse
     */
    onMouseMove(event) {
        // Obtener posición actual
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        this.currentX = event.clientX - rect.left;
        this.currentY = event.clientY - rect.top;

        // Si no estamos dragging, verificar si debemos iniciar
        if (!this.isDragging) {
            const distance = Math.sqrt(
                Math.pow(this.currentX - this.dragStartX, 2) + 
                Math.pow(this.currentY - this.dragStartY, 2)
            );
            
            // Solo iniciar drag si hay planetas seleccionados y superamos el threshold
            const selectedPlanets = this.selectionSystem.getSelectedPlanets();
            const playerSelectedPlanets = selectedPlanets.filter(p => p.owner === 'player');
            
            if (distance > this.config.dragThreshold && playerSelectedPlanets.length > 0) {
                this.startDragFromSelection();
                event.stopPropagation(); // Prevenir que el SelectionSystem maneje este evento
            }
            return;
        }

        // Si ya estamos dragging, actualizar
        if (this.isDragging) {
            // Verificar planeta objetivo
            this.checkTargetPlanet();
            
            // Actualizar preview visual
            this.updateDragPreview();
            
            event.stopPropagation(); // Prevenir que otros sistemas manejen este evento
        }
    }

    /**
     * Iniciar drag desde planetas seleccionados
     */
    startDragFromSelection() {
        console.log(`🎯 INICIANDO DRAG desde planetas seleccionados`);
        
        this.isDragging = true;
        this.targetPlanet = null;
        
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        console.log(`🎯 Planetas para drag: ${playerPlanets.length}`);
        playerPlanets.forEach(p => {
            console.log(`  - ${p.id}: ${p.ships} naves`);
        });
        
        this.createPreviewElements();
        
        // Emitir evento
        eventBus.emit('dragdrop:start', {
            selectedPlanets: this.selectionSystem.getSelectedPlanets().length,
            x: this.currentX,
            y: this.currentY
        });
        
        console.log(`🎯 Drag iniciado desde ${this.selectionSystem.getSelectedPlanets().length} planetas`);
    }

    /**
     * Manejar mouse up - EJECUTAR AUTOMÁTICAMENTE SI HAY OBJETIVO
     */
    onMouseUp(event) {
        console.log(`🔍 MouseUp - isDragging: ${this.isDragging}, targetPlanet: ${this.targetPlanet?.id || 'none'}`);
        
        if (!this.isDragging) return;

        // Si hay un objetivo válido, ejecutar automáticamente
        if (this.targetPlanet) {
            console.log(`🎯 Ejecutando drag & drop automáticamente a ${this.targetPlanet.id}`);
            this.completeDragDrop();
            event.stopPropagation(); // Prevenir que otros sistemas manejen este evento
        } else {
            console.log('🎯 Drag cancelado - no hay objetivo válido');
        }
        
        // Resetear estado
        this.resetDragState();
    }

    /**
     * Crear elementos visuales para el preview
     */
    createPreviewElements() {
        const svg = document.getElementById('gameCanvas');
        if (!svg) return;

        // Crear líneas desde todos los planetas seleccionados
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        this.previewLines = [];
        
        playerPlanets.forEach((planet, index) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('stroke', this.config.selectedLineColor);
            line.setAttribute('stroke-width', this.config.selectedLineWidth);
            line.setAttribute('stroke-opacity', this.config.lineOpacity);
            line.setAttribute('stroke-dasharray', '8,4');
            line.style.pointerEvents = 'none';
            line.setAttribute('data-planet-id', planet.id);
            
            // Añadir efecto de pulso escalonado
            line.style.animation = `dragLinePulse 1.5s ease-in-out infinite ${index * 0.1}s`;
            
            svg.appendChild(line);
            this.previewLines.push(line);
        });

        // Crear highlight del objetivo
        this.targetHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.targetHighlight.setAttribute('fill', 'none');
        this.targetHighlight.setAttribute('stroke', '#ffaa00');
        this.targetHighlight.setAttribute('stroke-width', 4);
        this.targetHighlight.setAttribute('stroke-opacity', 0.8);
        this.targetHighlight.style.display = 'none';
        this.targetHighlight.style.pointerEvents = 'none';
        
        svg.appendChild(this.targetHighlight);
        
        console.log(`🎯 Creadas ${this.previewLines.length} líneas de preview convergentes`);
    }

    /**
     * Actualizar preview visual del drag
     */
    updateDragPreview() {
        if (this.previewLines.length === 0) return;

        // Obtener planetas seleccionados
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        // Determinar coordenadas de destino
        let targetX, targetY;
        
        if (this.targetPlanet && this.targetPlanet.x && this.targetPlanet.y) {
            // Si hay objetivo válido, las líneas convergen al planeta
            targetX = this.targetPlanet.x;
            targetY = this.targetPlanet.y;
        } else {
            // Si no hay objetivo, las líneas van al cursor
            targetX = this.currentX;
            targetY = this.currentY;
        }
        
        // Validar que las coordenadas sean números válidos
        if (isNaN(targetX) || isNaN(targetY) || targetX === undefined || targetY === undefined) {
            console.warn(`⚠️ Coordenadas de destino inválidas: (${targetX}, ${targetY})`);
            return;
        }
        
        this.previewLines.forEach((line, index) => {
            if (index < playerPlanets.length) {
                const planet = playerPlanets[index];
                
                // Validar coordenadas del planeta origen
                if (!planet.x || !planet.y || isNaN(planet.x) || isNaN(planet.y)) {
                    console.warn(`⚠️ Planeta ${planet.id} tiene coordenadas inválidas: (${planet.x}, ${planet.y})`);
                    return;
                }
                
                // Línea desde el planeta hasta el objetivo/cursor (CONVERGENCIA)
                line.setAttribute('x1', planet.x);
                line.setAttribute('y1', planet.y);
                line.setAttribute('x2', targetX);
                line.setAttribute('y2', targetY);
                
                // Si hay objetivo válido, hacer las líneas más visibles y convergentes
                if (this.targetPlanet) {
                    line.setAttribute('stroke-opacity', 0.9);
                    line.setAttribute('stroke-width', this.config.selectedLineWidth + 1);
                    line.setAttribute('stroke-dasharray', '12,6'); // Líneas más marcadas
                } else {
                    // Calcular distancia para ajustar opacidad cuando no hay objetivo
                    const distance = Math.sqrt(
                        Math.pow(targetX - planet.x, 2) + 
                        Math.pow(targetY - planet.y, 2)
                    );
                    const opacity = Math.min(0.8, Math.max(0.3, 1 - distance / 500));
                    line.setAttribute('stroke-opacity', opacity);
                    line.setAttribute('stroke-width', this.config.selectedLineWidth);
                    line.setAttribute('stroke-dasharray', '8,4'); // Líneas normales
                }
            }
        });
    }

    /**
     * Verificar si estamos sobre un planeta objetivo válido
     */
    checkTargetPlanet() {
        const planet = this.gameEngine.getPlanetAtPosition(this.currentX, this.currentY);
        
        // Solo considerar planetas que no sean del jugador como objetivos válidos
        // Y que tengan propiedades válidas
        let validTarget = null;
        if (planet && planet.owner !== 'player' && planet.id && planet.x && planet.y && planet.radius) {
            validTarget = planet;
        }
        
        if (validTarget !== this.targetPlanet) {
            this.targetPlanet = validTarget;
            this.updateTargetHighlight();
            
            // Log para debug
            if (this.targetPlanet) {
                console.log(`🎯 Objetivo válido detectado: ${this.targetPlanet.id} (${this.targetPlanet.owner}) en (${this.targetPlanet.x}, ${this.targetPlanet.y})`);
            }
        }
    }

    /**
     * Actualizar highlight del objetivo
     */
    updateTargetHighlight() {
        if (!this.targetHighlight) return;

        if (this.targetPlanet && this.targetPlanet.x && this.targetPlanet.y && this.targetPlanet.radius) {
            // Mostrar highlight en el planeta objetivo
            this.targetHighlight.setAttribute('cx', this.targetPlanet.x);
            this.targetHighlight.setAttribute('cy', this.targetPlanet.y);
            this.targetHighlight.setAttribute('r', this.targetPlanet.radius + 15);
            this.targetHighlight.style.display = 'block';
            
            // Cambiar color según tipo de objetivo
            const color = this.targetPlanet.owner === 'neutral' ? '#ffaa00' : '#ff6666';
            this.targetHighlight.setAttribute('stroke', color);
            this.targetHighlight.setAttribute('stroke-width', 5);
            
            // Animación de pulso más intensa cuando hay objetivo
            this.targetHighlight.style.animation = 'dragTargetPulse 0.4s ease-in-out infinite alternate';
            
            // Cambiar color de TODAS las líneas cuando hay objetivo válido
            this.previewLines.forEach(line => {
                line.setAttribute('stroke', color);
            });
        } else {
            // Ocultar highlight
            this.targetHighlight.style.display = 'none';
            
            // Restaurar color original de las líneas
            this.previewLines.forEach(line => {
                line.setAttribute('stroke', this.config.selectedLineColor);
            });
        }
    }

    /**
     * Completar drag & drop (MEJORADO con targeting flexible)
     */
    completeDragDrop() {
        // Validación estricta del objetivo
        if (!this.targetPlanet || !this.targetPlanet.id || !this.targetPlanet.x || !this.targetPlanet.y) {
            console.log('🎯 Drag & drop cancelado - objetivo inválido o incompleto');
            return;
        }

        // Obtener planetas seleccionados del jugador
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        if (playerPlanets.length === 0) {
            console.log('🎯 Drag & drop cancelado - no hay planetas del jugador seleccionados');
            return;
        }

        console.log(`🚀 Enviando flotas desde ${playerPlanets.length} planetas a ${this.targetPlanet.id} (${this.targetPlanet.owner})`);
        
        // 🎯 NUEVO: Pasar coordenadas del mouse para targeting flexible
        // Usar las coordenadas actuales del mouse como punto de llegada preferido
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const mouseX = this.currentX;
        const mouseY = this.currentY;
        
        console.log(`🎯 Targeting flexible: enviando a coordenadas (${mouseX}, ${mouseY}) en planeta ${this.targetPlanet.id}`);
        
        // Usar el método del GameEngine con coordenadas de targeting
        this.gameEngine.sendFleetFromSelected(this.targetPlanet.id, null, mouseX, mouseY);

        // Efecto visual de confirmación
        this.showLaunchEffect();
        
        // Emitir evento de envío masivo
        eventBus.emit('dragdrop:complete', {
            fromPlanets: playerPlanets.map(p => p.id),
            targetPlanet: this.targetPlanet.id,
            targetCoords: { x: mouseX, y: mouseY },
            fleetsLaunched: playerPlanets.length
        });
        
        console.log(`🏁 Drag & drop completado: flotas enviadas desde ${playerPlanets.length} planetas`);
    }

    /**
     * Mostrar efecto visual de lanzamiento
     */
    showLaunchEffect() {
        if (!this.targetPlanet || !this.targetPlanet.x || !this.targetPlanet.y || !this.targetPlanet.radius) {
            console.error('❌ No se puede mostrar efecto: planeta objetivo inválido');
            return;
        }

        const svg = document.getElementById('gameCanvas');
        if (!svg) return;
        
        // Efecto en el objetivo
        const targetEffect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        targetEffect.setAttribute('cx', this.targetPlanet.x);
        targetEffect.setAttribute('cy', this.targetPlanet.y);
        targetEffect.setAttribute('r', this.targetPlanet.radius);
        targetEffect.setAttribute('fill', 'none');
        targetEffect.setAttribute('stroke', '#00ff88');
        targetEffect.setAttribute('stroke-width', 5);
        targetEffect.setAttribute('stroke-opacity', 0.9);
        targetEffect.style.pointerEvents = 'none';
        targetEffect.style.animation = 'launchConfirmation 0.8s ease-out forwards';
        
        svg.appendChild(targetEffect);
        
        // Efectos en planetas de origen
        const selectedPlanets = this.selectionSystem.getSelectedPlanets();
        const playerPlanets = selectedPlanets.filter(p => p.owner === 'player');
        
        playerPlanets.forEach((planet, index) => {
            setTimeout(() => {
                const originEffect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                originEffect.setAttribute('cx', planet.x);
                originEffect.setAttribute('cy', planet.y);
                originEffect.setAttribute('r', planet.radius + 5);
                originEffect.setAttribute('fill', 'none');
                originEffect.setAttribute('stroke', '#00ff88');
                originEffect.setAttribute('stroke-width', 3);
                originEffect.setAttribute('stroke-opacity', 0.7);
                originEffect.style.pointerEvents = 'none';
                originEffect.style.animation = 'launchConfirmation 0.6s ease-out forwards';
                
                svg.appendChild(originEffect);
                
                setTimeout(() => {
                    if (originEffect.parentNode) {
                        originEffect.parentNode.removeChild(originEffect);
                    }
                }, 600);
            }, index * 100); // Escalonar efectos
        });
        
        // Remover efecto del objetivo
        setTimeout(() => {
            if (targetEffect.parentNode) {
                targetEffect.parentNode.removeChild(targetEffect);
            }
        }, 800);
    }

    /**
     * Resetear estado del drag
     */
    resetDragState() {
        this.isDragging = false;
        this.dragStartPlanet = null;
        this.targetPlanet = null;
        
        // Limpiar líneas de preview
        this.previewLines.forEach(line => {
            if (line.parentNode) {
                line.parentNode.removeChild(line);
            }
        });
        this.previewLines = [];
        
        // Limpiar highlight del objetivo
        if (this.targetHighlight && this.targetHighlight.parentNode) {
            this.targetHighlight.parentNode.removeChild(this.targetHighlight);
            this.targetHighlight = null;
        }
    }

    /**
     * Event handlers del sistema de selección
     */
    onSelectionStart(data) {
        // Si estamos en medio de un drag, cancelarlo
        if (this.isDragging) {
            this.resetDragState();
        }
    }

    onSelectionEnd(data) {
        // Preparar para posible drag & drop
    }

    /**
     * Verificar si estamos en modo drag
     */
    isDragActive() {
        return this.isDragging;
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            isDragging: this.isDragging,
            previewLinesCount: this.previewLines.length,
            targetPlanet: this.targetPlanet?.id || null,
            hasTargetHighlight: !!this.targetHighlight
        };
    }

    /**
     * Destruir el handler
     */
    destroy() {
        this.resetDragState();
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mousemove', this.onMouseMove);
            canvas.removeEventListener('mouseup', this.onMouseUp);
        }
        
        console.log('💥 DragDropHandler destruido');
    }
}

export default DragDropHandler; 