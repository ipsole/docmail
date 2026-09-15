// Outbound Webhook Dispatcher
// Delivers normalized Docdril communication events to external Docdril apps (CRM, AI, Support)
// Signs payloads with HMAC SHA-256 for integrity verification.

import { eventBus } from '../events/event-bus';
import { DocdrilEvent } from '../events/event-types';
import { db } from '../../lib/db';
import { signWebhookPayload } from '../../lib/crypto';

export class OutboundWebhookDispatcher {
  static init(): void {
    // Listen to all events published on the internal bus
    eventBus.subscribe('*', async (event: DocdrilEvent) => {
      await OutboundWebhookDispatcher.dispatch(event);
    });
  }

  static async dispatch(event: DocdrilEvent): Promise<void> {
    const subscriptions = await db.listWebhookSubscriptions(event.organizationId);
    const matching = subscriptions.filter(
      (sub) => sub.status === 'ACTIVE' && (sub.events.includes(event.type) || sub.events.includes('*'))
    );

    for (const sub of matching) {
      try {
        const payloadString = JSON.stringify(event);
        const signature = signWebhookPayload(payloadString, sub.secret);

        // Deliver payload via HTTP POST asynchronously
        fetch(sub.targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Docdril-Event': event.type,
            'X-Docdril-Delivery-Id': `del_${Date.now()}`,
            'X-Docdril-Signature': signature,
          },
          body: payloadString,
        }).catch((err) => {
          // Log network delivery errors without crashing main loop
          console.warn(`[OutboundWebhook] Delivery to ${sub.targetUrl} failed:`, err.message);
        });
      } catch (err: any) {
        console.error(`[OutboundWebhook] Failed to dispatch event ${event.id} to ${sub.name}:`, err);
      }
    }
  }
}

// Auto-initialize outbound webhook dispatch
OutboundWebhookDispatcher.init();
