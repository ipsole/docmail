// Internal Event Bus for Docdril Ecosystem
import { EventEmitter } from 'events';
import { DocdrilEvent, DocdrilEventType } from './event-types';

type EventHandler = (event: DocdrilEvent) => Promise<void> | void;

class DocdrilEventBus {
  private emitter = new EventEmitter();
  private sseClients: Set<(event: DocdrilEvent) => void> = new Set();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publish an internal event across the platform.
   */
  async emit(event: DocdrilEvent): Promise<void> {
    // 1. Emit to typed listeners
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event);

    // 2. Broadcast to real-time UI SSE clients
    for (const client of this.sseClients) {
      try {
        client(event);
      } catch (err) {
        console.error('[EventBus] Error dispatching to SSE client:', err);
      }
    }
  }

  /**
   * Subscribe to specific event types.
   */
  subscribe(eventType: DocdrilEventType | '*', handler: EventHandler): () => void {
    this.emitter.on(eventType, handler);
    return () => {
      this.emitter.off(eventType, handler);
    };
  }

  /**
   * Register a Server-Sent Events client for real-time updates.
   */
  registerSseClient(callback: (event: DocdrilEvent) => void): () => void {
    this.sseClients.add(callback);
    return () => {
      this.sseClients.delete(callback);
    };
  }
}

export const eventBus = new DocdrilEventBus();
