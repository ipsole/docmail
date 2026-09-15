// Docdril AI Communication Service
// Provides thread summarization, smart drafting, priority categorization, and action item extraction.

import { DocdrilConversation, DocdrilMessage } from '../../types';

export interface AiSummaryResult {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'urgent' | 'negative';
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
  keyTopics: string[];
}

export interface AiDraftResponse {
  subject: string;
  suggestedBodyText: string;
  suggestedBodyHtml: string;
  tone: 'professional' | 'concise' | 'empathetic';
}

export class AiCommunicationService {
  /**
   * Summarize a conversation and extract action items and priority.
   */
  static async summarizeConversation(conversation: DocdrilConversation): Promise<AiSummaryResult> {
    const messages = conversation.messages || [];
    const latest = messages[messages.length - 1];
    const text = latest?.bodyText || latest?.snippet || conversation.snippet || '';

    // Deterministic intelligence heuristic / rule engine
    const isUrgent = /urgent|asap|critical|immediate|sla|security/i.test(
      `${conversation.subject} ${text}`
    );
    const hasQuestion = /\?|could we|can you|please let us know|schedule/i.test(text);

    let priority: 'high' | 'medium' | 'low' = 'low';
    if (isUrgent) priority = 'high';
    else if (hasQuestion) priority = 'medium';

    const actionItems: string[] = [];
    if (hasQuestion) {
      actionItems.push('Review schedule request and reply with availability.');
    }
    if (isUrgent) {
      actionItems.push('Escalate to on-call or technical lead.');
    }
    if (actionItems.length === 0) {
      actionItems.push('Acknowledge receipt and archive if no further input needed.');
    }

    return {
      summary: `Discussion concerning "${conversation.subject}". ${text.substring(0, 180)}...`,
      sentiment: isUrgent ? 'urgent' : 'neutral',
      priority,
      actionItems,
      keyTopics: ['Communication', 'Partnership', 'Docdril Ecosystem'],
    };
  }

  /**
   * Generate an intelligent reply draft for a message.
   */
  static async suggestReply(
    message: DocdrilMessage,
    tone: 'professional' | 'concise' | 'empathetic' = 'professional'
  ): Promise<AiDraftResponse> {
    const sender = message.senderName || message.senderEmail.split('@')[0];
    const subject = message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`;

    let body = '';
    if (tone === 'concise') {
      body = `Hi ${sender},\n\nThank you for reaching out. We have received your note and are reviewing the details. We will follow up shortly.\n\nBest,\nDocdril Team`;
    } else if (tone === 'empathetic') {
      body = `Dear ${sender},\n\nThank you for bringing this to our attention. We understand the importance of this matter and are prioritizing your request.\n\nOur engineering and support leads are coordinating right now to ensure everything runs smoothly.\n\nWarm regards,\nDocdril Team`;
    } else {
      body = `Dear ${sender},\n\nThank you for contacting Docdril. We would be pleased to assist with your inquiry regarding "${message.subject}".\n\nCould you please let us know your preferred time window for a brief discussion this week?\n\nBest regards,\nDocdril Team`;
    }

    return {
      subject,
      suggestedBodyText: body,
      suggestedBodyHtml: `<p>${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
      tone,
    };
  }
}
