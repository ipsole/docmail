'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Paperclip,
  Send,
  FileText,
  ChevronDown,
  PenTool,
  Check,
} from 'lucide-react';
import { DocdrilTemplate, DocdrilSignature, DocdrilMailbox, DocdrilContact } from '@/types';

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTo?: string[];
  initialSubject?: string;
  initialInReplyToConversationId?: string;
  onSendSuccess?: () => void;
  activeMailbox?: DocdrilMailbox | null;
  mailboxes?: DocdrilMailbox[];
  initialRecipientName?: string;
}

export const ComposerModal: React.FC<ComposerModalProps> = ({
  isOpen,
  onClose,
  initialTo = [],
  initialSubject = '',
  initialInReplyToConversationId,
  onSendSuccess,
  activeMailbox,
  mailboxes = [],
  initialRecipientName = '',
}) => {
  const [to, setTo] = useState<string>(initialTo.join(', '));
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState('');
  const [showBcc, setShowBcc] = useState(false);
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<DocdrilTemplate[]>([]);
  const [signatures, setSignatures] = useState<DocdrilSignature[]>([]);
  const [contacts, setContacts] = useState<DocdrilContact[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<string>('');
  const [showSignatureMenu, setShowSignatureMenu] = useState(false);
  const [selectedMailboxId, setSelectedMailboxId] = useState<string>(activeMailbox?.id || '');

  // Keep selectedMailboxId synced
  useEffect(() => {
    if (activeMailbox?.id) {
      setSelectedMailboxId(activeMailbox.id);
    }
  }, [activeMailbox]);

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo.join(', '));
      setSubject(initialSubject);
      setError(null);

      // 1. Fetch templates
      fetch('/api/v1/templates')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setTemplates(data.data);
        })
        .catch(() => {});

      // 2. Fetch contacts for variable replacement
      fetch('/api/v1/contacts')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setContacts(data.data);
        })
        .catch(() => {});

      // 3. Fetch signatures and auto-select based on active mailbox
      fetch('/api/v1/signatures')
        .then((res) => res.json())
        .then((data) => {
          if (data.data && Array.isArray(data.data)) {
            setSignatures(data.data);

            const activeMbx = mailboxes.find((m) => m.id === selectedMailboxId) || activeMailbox;
            const email = (activeMbx?.emailAddress || '').toLowerCase();

            if (email.includes('team')) {
              const teamSig = data.data.find(
                (s: DocdrilSignature) =>
                  s.id === 'sig_team' ||
                  s.name.toLowerCase().includes('team') ||
                  s.contentHtml.toLowerCase().includes('team docdril')
              );
              if (teamSig) {
                setSelectedSignature(teamSig.id);
                return;
              }
            } else if (email.includes('info')) {
              const infoSig = data.data.find(
                (s: DocdrilSignature) =>
                  s.id === 'sig_info' ||
                  s.name.toLowerCase() === 'docdril' ||
                  s.contentHtml.toLowerCase().includes('docdril')
              );
              if (infoSig) {
                setSelectedSignature(infoSig.id);
                return;
              }
            }

            const def = data.data.find((s: DocdrilSignature) => s.isDefault);
            if (def) setSelectedSignature(def.id);
            else if (data.data.length > 0) setSelectedSignature(data.data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialTo, initialSubject, activeMailbox, selectedMailboxId, mailboxes]);

  if (!isOpen) return null;

  const currentMailbox =
    mailboxes.find((m) => m.id === selectedMailboxId) || activeMailbox || mailboxes[0];

  // Helper to resolve variables dynamically
  const resolveTemplateVariables = (text: string) => {
    let recipientFirstName = '';
    let recipientCompany = 'Docdril';

    // 1. Try initialRecipientName
    if (initialRecipientName.trim()) {
      recipientFirstName = initialRecipientName.trim().split(' ')[0];
    }

    // 2. Try matching contact by email
    const firstRecipientEmail = to.split(',')[0]?.trim().toLowerCase();
    if (firstRecipientEmail) {
      const contact = contacts.find(
        (c) => c.email.toLowerCase() === firstRecipientEmail
      );
      if (contact) {
        if (!recipientFirstName && contact.name) {
          recipientFirstName = contact.name.trim().split(' ')[0];
        }
        if (contact.company) {
          recipientCompany = contact.company;
        }
      } else if (!recipientFirstName) {
        // Fallback to capitalizing username part of email
        const userPart = firstRecipientEmail.split('@')[0];
        if (userPart.toLowerCase() === 'itpiyu') {
          recipientFirstName = 'Piyush';
        } else {
          recipientFirstName = userPart.charAt(0).toUpperCase() + userPart.slice(1);
        }
      }
    }

    if (!recipientFirstName) recipientFirstName = 'there';

    // Sender name from active mailbox
    const senderName = currentMailbox?.displayName || 'Team Docdril';

    // Project context
    let projectVal = 'Docdril initiatives';
    if (subject.toLowerCase().includes('regarding')) {
      const parts = subject.split(/regarding/i);
      if (parts[1]?.trim()) projectVal = parts[1].trim();
    }

    return text
      .replace(/\{\{\s*first_name\s*\}\}/gi, recipientFirstName)
      .replace(/\{\{\s*company\s*\}\}/gi, recipientCompany)
      .replace(/\{\{\s*sender_name\s*\}\}/gi, senderName)
      .replace(/\{\{\s*project\s*\}\}/gi, projectVal)
      .replace(/\{\{\s*[a-zA-Z0-9_-]+\s*\}\}/g, ''); // Clean up any remaining unresolved brackets
  };

  const handleApplyTemplate = (tpl: DocdrilTemplate) => {
    const rawSubject = tpl.subject || '';
    const rawBody = tpl.bodyText || tpl.bodyHtml.replace(/<[^>]*>?/gm, '');

    const resolvedSubject = resolveTemplateVariables(rawSubject);
    const resolvedBody = resolveTemplateVariables(rawBody);

    setSubject(resolvedSubject);
    setBody(resolvedBody);
  };

  const handleSend = async () => {
    setError(null);
    const toRecipients = to
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (toRecipients.length === 0) {
      setError('Please provide at least one recipient in "To".');
      return;
    }

    if (!subject.trim()) {
      setError('Please provide a subject line.');
      return;
    }

    setIsSending(true);

    try {
      let finalHtml = `<p>${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      const sig = signatures.find((s) => s.id === selectedSignature);
      if (sig && selectedSignature !== 'none') {
        finalHtml += `<br><br>${sig.contentHtml}`;
      }

      const res = await fetch('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailboxId: currentMailbox?.id,
          to: toRecipients,
          cc: cc ? cc.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
          bcc: bcc ? bcc.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
          subject,
          bodyText: body,
          bodyHtml: finalHtml,
          inReplyToConversationId: initialInReplyToConversationId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch email');
      }

      setIsSending(false);
      onClose();
      if (onSendSuccess) onSendSuccess();
    } catch (err: any) {
      setIsSending(false);
      setError(err.message || 'Error sending message');
    }
  };

  const currentSigObj = signatures.find((s) => s.id === selectedSignature);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-md">
      <div className="glass-surface w-full max-w-2xl flex flex-col overflow-hidden max-h-[92vh] p-5 sm:p-6 space-y-4 shadow-2xl bg-white/80">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/60 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              {initialInReplyToConversationId ? 'Reply Message' : 'New Message'}
            </span>
            <span className="glass-inset px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-600">
              Docdril Secure
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 glass-card rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50/90 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl font-medium">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-2 text-xs">
          {/* FROM Mailbox indicator / selector */}
          <div className="glass-inset px-4 py-2 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-14 text-slate-500 font-bold">From:</span>
              <span className="font-bold text-slate-800">
                {currentMailbox?.displayName || 'Docdril'}
              </span>
              <span className="text-slate-500 text-[11px]">
                &lt;{currentMailbox?.emailAddress || 'team@docdril.com'}&gt;
              </span>
            </div>
            {mailboxes.length > 1 && (
              <select
                value={selectedMailboxId}
                onChange={(e) => {
                  setSelectedMailboxId(e.target.value);
                  const newMbx = mailboxes.find((m) => m.id === e.target.value);
                  if (newMbx?.emailAddress.includes('team')) {
                    const s = signatures.find((x) => x.id === 'sig_team' || x.name.includes('Team'));
                    if (s) setSelectedSignature(s.id);
                  } else if (newMbx?.emailAddress.includes('info')) {
                    const s = signatures.find((x) => x.id === 'sig_info' || x.name === 'Docdril');
                    if (s) setSelectedSignature(s.id);
                  }
                }}
                className="bg-transparent text-[11px] font-semibold text-rose-600 focus:outline-none cursor-pointer border border-rose-200 rounded-lg px-2 py-0.5"
              >
                {mailboxes.map((m) => (
                  <option key={m.id} value={m.id} className="text-slate-800">
                    {m.displayName} ({m.emailAddress})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* TO */}
          <div className="glass-inset px-4 py-2.5 rounded-2xl flex items-center">
            <span className="w-14 text-slate-500 font-bold">To:</span>
            <input
              type="text"
              placeholder="recipients@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-slate-900 font-medium"
            />
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-semibold">
              {!showCc && (
                <button type="button" onClick={() => setShowCc(true)} className="hover:text-rose-600 cursor-pointer">
                  Cc
                </button>
              )}
              {!showBcc && (
                <button type="button" onClick={() => setShowBcc(true)} className="hover:text-rose-600 cursor-pointer">
                  Bcc
                </button>
              )}
            </div>
          </div>

          {showCc && (
            <div className="glass-inset px-4 py-2 rounded-2xl flex items-center">
              <span className="w-14 text-slate-500 font-bold">Cc:</span>
              <input
                type="text"
                placeholder="cc@example.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-slate-900 font-medium"
              />
            </div>
          )}

          {showBcc && (
            <div className="glass-inset px-4 py-2 rounded-2xl flex items-center">
              <span className="w-14 text-slate-500 font-bold">Bcc:</span>
              <input
                type="text"
                placeholder="bcc@example.com"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-slate-900 font-medium"
              />
            </div>
          )}

          {/* Subject */}
          <div className="glass-inset px-4 py-2.5 rounded-2xl flex items-center">
            <span className="w-14 text-slate-500 font-bold">Subject:</span>
            <input
              type="text"
              placeholder="Subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-slate-900 font-bold"
            />
          </div>
        </div>

        {/* Toolbar: Templates & Signatures */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {templates.length > 0 && (
            <div className="relative group">
              <button
                type="button"
                className="glass-card px-3 py-1.5 flex items-center space-x-1.5 font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>Insert Template</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute left-0 top-full mt-1 glass-surface p-2 w-64 hidden group-hover:block z-20 space-y-1 bg-white/95 shadow-xl border border-white/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Dynamic Templates
                </div>
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-rose-50 rounded-xl text-xs text-slate-800 truncate font-medium cursor-pointer transition-colors"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Signature Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSignatureMenu(!showSignatureMenu)}
              className="glass-card px-3 py-1.5 flex items-center space-x-1.5 font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5 text-rose-500" />
              <span>
                Signature: {selectedSignature === 'none' ? 'None' : currentSigObj?.name || 'Default'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showSignatureMenu && (
              <div className="absolute left-0 top-full mt-1 glass-surface p-2 w-56 z-20 space-y-1 bg-white/95 shadow-xl border border-white/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Email Signatures
                </div>
                {signatures.map((sig) => (
                  <button
                    key={sig.id}
                    type="button"
                    onClick={() => {
                      setSelectedSignature(sig.id);
                      setShowSignatureMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                      selectedSignature === sig.id
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-800 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span className="truncate">{sig.name}</span>
                    {selectedSignature === sig.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSignature('none');
                    setShowSignatureMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                    selectedSignature === 'none'
                      ? 'bg-rose-500 text-white font-bold'
                      : 'text-slate-800 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <span>No Signature</span>
                  {selectedSignature === 'none' && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-[160px] glass-inset p-4 rounded-2xl flex flex-col justify-between">
          <textarea
            aria-label="Email message body"
            rows={7}
            placeholder="Type your message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-full bg-transparent focus:outline-none resize-none text-slate-800 text-sm placeholder-slate-400 leading-relaxed font-sans"
          />

          {/* Live Signature Preview Footer */}
          {selectedSignature !== 'none' && currentSigObj && (
            <div className="mt-2 pt-2 border-t border-slate-200/60 opacity-80 pointer-events-none select-none">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Attached Signature ({currentSigObj.name})
              </div>
              <div
                className="text-xs text-slate-600"
                dangerouslySetInnerHTML={{ __html: currentSigObj.contentHtml }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="glass-card w-9 h-9 flex items-center justify-center text-slate-600 rounded-full hover:text-slate-900 cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={handleSend}
              className="rose-glow-btn flex items-center space-x-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
