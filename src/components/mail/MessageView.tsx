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
  Trash2,
  RotateCcw,
  AlertTriangle,
  Tag,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';

interface MessageViewProps {
  conversation: DocdrilConversation | null;
  currentFolder?: string;
  onReply: (message: DocdrilMessage) => void;
  onForward: (message: DocdrilMessage) => void;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
  onConnectClick: () => void;
  onBackMobile?: () => void;
  onMoveToTrash?: (conversationId: string) => void;
  onRestoreFromTrash?: (conversationId: string) => void;
  onDeletePermanently?: (conversationId: string) => void;
  onToggleTag?: (conversationId: string, tag: string, action: 'add' | 'remove') => void;
  isLoading?: boolean;
}

export const MessageView: React.FC<MessageViewProps> = ({
  conversation,
  currentFolder = 'INBOX',
  onReply,
  onForward,
  onToggleAiDrawer,
  isAiDrawerOpen,
  onConnectClick,
  onBackMobile,
  onMoveToTrash,
  onRestoreFromTrash,
  onDeletePermanently,
  onToggleTag,
  isLoading = false,
}) => {
  if (isLoading && !conversation) {
    return (
      <div className="flex-1 flex flex-col h-full p-3 sm:p-4 space-y-3 select-none">
        <div className="obsidian-card p-4 sm:p-5 h-20 rounded-2xl flex items-center space-x-3 sm:space-x-4 animate-pulse">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-white/20 rounded-full w-1/3" />
            <div className="h-3 bg-white/10 rounded-full w-1/4" />
          </div>
        </div>
        <div className="flex-1 glass-surface p-6 rounded-3xl space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded-full w-1/4" />
          <div className="h-3 bg-slate-100 rounded-full w-3/4" />
          <div className="h-3 bg-slate-100 rounded-full w-2/3" />
          <div className="h-3 bg-slate-100 rounded-full w-1/2" />
        </div>
      </div>
    );
  }

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
  const isTrash = currentFolder.replace(/^INBOX\./, '').toLowerCase() === 'trash' || conversation.isTrash;

  return (
    <main
      aria-label="Message details"
      className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-4 space-y-3 relative"
    >
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
            <div className="flex items-center space-x-2 text-[11px] sm:text-xs text-zinc-400 mt-0.5 flex-wrap gap-y-1">
              <span>
                {messages.length} {messages.length === 1 ? 'Message' : 'Messages'}
              </span>
              <span>•</span>
              {isTrash ? (
                <span className="text-rose-400 font-medium">In Trash</span>
              ) : (
                <span className="text-rose-300 font-medium">Encrypted & Verified</span>
              )}

              {/* Interactive Tag Badges */}
              {Array.isArray(conversation.tags) &&
                conversation.tags.map((t) => {
                  const isImp = t === 'important';
                  return (
                    <button
                      key={t}
                      onClick={() => onToggleTag && onToggleTag(conversation.id, t, 'remove')}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize cursor-pointer transition-all ${
                        isImp
                          ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 hover:bg-rose-500/50'
                          : 'bg-white/10 text-zinc-300 border border-white/20 hover:bg-white/20'
                      }`}
                      title={`Click to remove tag "${t}"`}
                    >
                      {t} &times;
                    </button>
                  );
                })}

              {/* Quick Tag Add Buttons */}
              {onToggleTag && (
                <div className="flex items-center space-x-1 ml-1">
                  {!conversation.tags?.includes('important') && (
                    <button
                      onClick={() => onToggleTag(conversation.id, 'important', 'add')}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 transition-colors cursor-pointer"
                      title="Mark as Important"
                    >
                      + Important
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const newTag = window.prompt('Enter custom tag name (e.g. invoice, client, followup):');
                      if (newTag && newTag.trim()) {
                        onToggleTag(conversation.id, newTag.trim().toLowerCase(), 'add');
                      }
                    }}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300 hover:bg-white/20 transition-colors cursor-pointer flex items-center space-x-0.5"
                    title="Add custom tag"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Tag</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
          {/* Trash & Restore Actions */}
          {isTrash ? (
            <>
              {onRestoreFromTrash && (
                <button
                  onClick={() => onRestoreFromTrash(conversation.id)}
                  className="flex items-center space-x-1 sm:space-x-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 cursor-pointer transition-all"
                  title="Restore conversation to Inbox"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restore</span>
                </button>
              )}
              {onDeletePermanently && (
                <button
                  onClick={() => onDeletePermanently(conversation.id)}
                  className="flex items-center space-x-1 sm:space-x-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 cursor-pointer transition-all"
                  title="Delete permanently forever"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete Forever</span>
                </button>
              )}
            </>
          ) : (
            onMoveToTrash && (
              <button
                onClick={() => onMoveToTrash(conversation.id)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/30 hover:border-rose-500/40 text-zinc-300 hover:text-rose-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
                title="Move to Trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}

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

          {!isTrash && latestMessage && (
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
    </main>
  );
};
