// Docdril Communication Internal Event Types
import { DocdrilMessage, DocdrilConversation } from '../../types';

export type DocdrilEventType =
  | 'message.received'
  | 'message.sent'
  | 'message.read'
  | 'message.starred'
  | 'message.deleted'
  | 'conversation.created'
  | 'conversation.updated'
  | 'contact.created'
  | 'contact.updated'
  | 'mailbox.updated'
  | 'webhook.received';

export interface DocdrilEvent<T = any> {
  id: string;
  type: DocdrilEventType;
  organizationId: string;
  entityId: string;
  entityType: 'message' | 'conversation' | 'contact' | 'mailbox';
  timestamp: string;
  payload: T;
}

export type MessageReceivedPayload = {
  message: DocdrilMessage;
  conversation: DocdrilConversation;
};

export type MessageSentPayload = {
  message: DocdrilMessage;
  conversationId: string;
};
