'use client';

import React from 'react';
import { DocdrilConversation, DocdrilMessage } from '@/types';
import {
  Reply,
  Forward,
  Star,
  Paperclip,
  Sparkles,
  User,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';

interface MessageViewProps {
  conversation: DocdrilConversation | null;
  onReply: (message: DocdrilMessage) => void;
  onForward: (message: DocdrilMessage) => void;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
  onConnectClick: () => void;
  onBackMobile?: () => void;
}

export const MessageView: React.FC<MessageViewProps> = ({
  conversation,
  onReply,
  onForward,
  onToggleAiDrawer,
  isAiDrawerOpen,
  onConnectClick,
  onBackMobile,
}) => {
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-xs select-none">
        <div className="glass-surface p-10 text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 glass-inset rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
            <User className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-800 text-sm">Select an Email to Read</p>
          <p className="text-slate-500 text-xs leading-relaxed">
            All messages are securely synchronized in real time with your cloud mail server.
          </p>
        </div>
      </div>
    );
  }

  const messages = conversation.messages || [];
  const latestMessage = messages[messages.length - 1];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Mobile Back Button */}
      {onBackMobile && (
        <button
          onClick={onBackMobile}
          className="md:hidden flex items-center space-x-2 text-xs font-bold text-slate-700 glass-card px-3.5 py-1.5 rounded-full self-start hover:text-slate-900 transition-all cursor-pointer border border-white/80 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
          <span>Back to Inbox</span>
        </button>
      )}

      {/* High-Contrast Obsidian Header Card */}
      <div className="obsidian-card p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4 overflow-hidden">
          {/* Glowing Luminous Orb */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-pink-300 to-rose-400 p-0.5 shadow-[0_0_16px_rgba(244,114,182,0.6)] flex items-center justify-center flex-shrink-0">
            <span className="font-extrabold text-white text-sm sm:text-base">
              {(conversation.subject || 'M')[0]?.toUpperCase()}
            </span>
          </div>

          <div className="overflow-hidden">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
              {conversation.subject || '(No Subject)'}
            </h1>
            <div className="flex items-center space-x-2 text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              <span>{messages.length} {messages.length === 1 ? 'Message' : 'Messages'}</span>
              <span>•</span>
              <span className="text-rose-300 font-medium">Encrypted & Verified</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* AI Drawer Trigger */}
          <button
            onClick={onToggleAiDrawer}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isAiDrawerOpen
                ? 'bg-rose-500 text-white shadow-[0_0_14px_rgba(244,114,182,0.7)]'
                : 'bg-white/10 text-zinc-200 hover:bg-white/20 border border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden sm:inline">Docdril AI</span>
          </button>

          {latestMessage && (
            <button
              onClick={() => onReply(latestMessage)}
              className="rose-glow-btn flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Reply className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reply</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m) => (
          <div key={m.id} className="glass-surface p-6 space-y-4">
            {/* Sender header */}
            <div className="flex items-start justify-between border-b border-white/60 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {(m.senderName || m.senderEmail)[0]?.toUpperCase() || 'M'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">
                      {m.senderName || m.senderEmail}
                    </span>
                    <span className="text-xs text-slate-500">&lt;{m.senderEmail}&gt;</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    To: {m.recipients.map((r) => r.email).join(', ')}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">
                  {format(new Date(m.receivedAt), 'MMM d, yyyy, h:mm a')}
                </div>
              </div>
            </div>

            {/* Message Body */}
            {m.bodyHtml ? (
              <div
                className="text-sm text-slate-800 leading-relaxed font-sans overflow-x-auto break-words bg-white/50 p-4 rounded-2xl border border-white/60 shadow-sm"
                dangerouslySetInnerHTML={{ __html: m.bodyHtml }}
              />
            ) : m.bodyText ? (
              <div className="text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap bg-white/50 p-4 rounded-2xl border border-white/60 shadow-sm">
                {m.bodyText}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">
                (No text content in this message)
              </div>
            )}

            {/* Attachments */}
            {m.attachments && m.attachments.length > 0 && (
              <div className="pt-3 border-t border-white/60">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-rose-500" />
                  <span>{m.attachments.length} Attachment(s)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.attachments.map((att) => {
                    const sizeNum = att.sizeBytes || 0;
                    const sizeStr = sizeNum > 0 ? `${Math.round(sizeNum / 1024)} KB` : '';
                    const messageUid = m.providerMessageId || m.id;
                    const downloadUrl = `/api/v1/attachments?mailboxId=${encodeURIComponent(conversation.mailboxId)}&folder=${encodeURIComponent(m.providerFolder || 'INBOX')}&uid=${encodeURIComponent(messageUid)}&attachmentId=${encodeURIComponent(att.id)}&filename=${encodeURIComponent(att.filename)}`;

                    return (
                      <a
                        key={att.id}
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="glass-card flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-800 hover:text-rose-600 font-medium cursor-pointer transition-colors"
                      >
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        <span>{att.filename}</span>
                        {sizeStr && (
                          <span className="text-slate-500 text-[10px]">
                            ({sizeStr})
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 text-xs">
              <button
                onClick={() => onReply(m)}
                className="glass-card flex items-center space-x-1 px-3 py-1.5 text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <Reply className="w-3.5 h-3.5 text-rose-500" />
                <span>Reply</span>
              </button>
              <button
                onClick={() => onForward(m)}
                className="glass-card flex items-center space-x-1 px-3 py-1.5 text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <Forward className="w-3.5 h-3.5 text-slate-400" />
                <span>Forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
