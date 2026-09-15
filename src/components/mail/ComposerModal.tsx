'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Paperclip,
  Send,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { DocdrilTemplate, DocdrilSignature } from '@/types';

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTo?: string[];
  initialSubject?: string;
  initialInReplyToConversationId?: string;
  onSendSuccess?: () => void;
}

export const ComposerModal: React.FC<ComposerModalProps> = ({
  isOpen,
  onClose,
  initialTo = [],
  initialSubject = '',
  initialInReplyToConversationId,
  onSendSuccess,
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
  const [selectedSignature, setSelectedSignature] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo.join(', '));
      setSubject(initialSubject);
      setError(null);

      fetch('/api/v1/templates')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setTemplates(data.data);
        })
        .catch(() => {});

      fetch('/api/v1/signatures')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setSignatures(data.data);
            const def = data.data.find((s: DocdrilSignature) => s.isDefault);
            if (def) setSelectedSignature(def.id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialTo, initialSubject]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: DocdrilTemplate) => {
    setSubject(tpl.subject);
    setBody(tpl.bodyText || tpl.bodyHtml.replace(/<[^>]*>?/gm, ''));
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
      if (sig) {
        finalHtml += `<br><br>${sig.contentHtml}`;
      }

      const res = await fetch('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
      <div className="glass-surface w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh] p-6 space-y-4 shadow-2xl bg-white/70">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/60 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">New Message</span>
            <span className="glass-inset px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-600">
              DocMail Secure
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 glass-card rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
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
        <div className="space-y-2.5 text-xs">
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
                <button type="button" onClick={() => setShowCc(true)} className="hover:text-rose-600">
                  Cc
                </button>
              )}
              {!showBcc && (
                <button type="button" onClick={() => setShowBcc(true)} className="hover:text-rose-600">
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

        {/* Toolbar */}
        <div className="flex items-center space-x-3 text-xs">
          {templates.length > 0 && (
            <div className="relative group">
              <button
                type="button"
                className="glass-card px-3 py-1.5 flex items-center space-x-1.5 font-bold text-slate-700 hover:text-slate-900"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>Template</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute left-0 top-full mt-1 glass-surface p-2 w-56 hidden group-hover:block z-20 space-y-1 bg-white/90">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-white/60 rounded-xl text-xs text-slate-800 truncate font-medium"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-[160px] glass-inset p-4 rounded-2xl">
          <textarea
            aria-label="Email message body"
            rows={8}
            placeholder="Type your message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-full bg-transparent focus:outline-none resize-none text-slate-800 text-sm placeholder-slate-400 leading-relaxed font-sans"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button type="button" className="glass-card w-9 h-9 flex items-center justify-center text-slate-600 rounded-full">
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
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
