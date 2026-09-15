// Docdril Centralized Contact Service
// Bridges email conversations with CRM records and contact metadata

import { db } from '../../lib/db';
import { DocdrilContact } from '../../types';

export class ContactService {
  /**
   * Find or create contact from an email address during incoming/outgoing mail.
   */
  static async getOrCreateContact(
    organizationId: string,
    email: string,
    name?: string | null
  ): Promise<DocdrilContact> {
    const existing = await db.findContactByEmail(organizationId, email);
    if (existing) {
      if (name && (!existing.name || existing.name === email)) {
        existing.name = name;
      }
      existing.lastInteractionAt = new Date().toISOString();
      return existing;
    }

    const newContact: DocdrilContact = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId,
      name: name || email.split('@')[0],
      email,
      company: email.includes('@') ? email.split('@')[1].split('.')[0].toUpperCase() : null,
      phone: null,
      notes: 'Auto-created via Docdril Communication interaction',
      tags: ['Email-Contact'],
      lastInteractionAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return db.createContact(newContact);
  }

  /**
   * Link an existing conversation to a contact record.
   */
  static async linkConversationToContact(
    conversationId: string,
    contactId: string
  ): Promise<void> {
    await db.updateConversation(conversationId, { contactId });
  }
}
