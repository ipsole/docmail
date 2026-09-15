'use client';

import React from 'react';
import { DocdrilConversation } from '@/types';
import { Star, Mail, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: DocdrilConversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onToggleStar: (e: React.MouseEvent, id: string, current: boolean) => void;
  folderTitle: string;
  onConnectClick: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onToggleStar,
  folderTitle,
  onConnectClick,
}) => {
  return (
    <section aria-label="Conversation list" className="w-full md:w-80 lg:w-96 flex flex-col h-full select-none p-3 sm:p-4 space-y-3 flex-shrink-0">
      {/* Header Capsule */}
      <div className="glass-surface px-4 py-3 flex items-center justify-between text-xs text-slate-700 font-bold">
        <div className="flex items-center space-x-2">
          <span className="text-slate-900 font-extrabold">{folderTitle}</span>
          <span className="glass-inset px-2.5 py-0.5 rounded-full text-[10px] text-rose-600 font-bold">
            {conversations.length}
          </span>
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {conversations.length === 0 ? (
          <div className="glass-surface p-8 text-center space-y-4 my-4">
            <div className="w-14 h-14 glass-inset rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">No Emails Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                Connect your business mail account or wait for live incoming messages.
              </p>
            </div>
            <button
              onClick={onConnectClick}
              className="rose-glow-btn px-5 py-2.5 text-xs font-bold inline-flex items-center space-x-2 cursor-pointer uppercase tracking-wider"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Mail Settings</span>
            </button>
          </div>
        ) : (
          conversations.map((c) => {
            const isSelected = c.id === selectedConversationId;
            const isUnread = c.unreadCount > 0;

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected ? 'glass-card-active' : 'glass-card'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,114,182,0.9)]" />
                    )}
                    <span
                      className={`text-xs truncate max-w-[170px] ${
                        isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'
                      }`}
                    >
                      {c.subject || '(No Subject)'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium">
                    <span>
                      {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false })}
                    </span>
                    <button
                      onClick={(e) => onToggleStar(e, c.id, c.isStarred)}
                      className="p-0.5 hover:text-amber-500 transition-colors"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          c.isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-sans">
                  {c.snippet || 'No preview available'}
                </p>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="glass-inset px-2.5 py-0.5 rounded-full text-slate-700 font-semibold">
                    {c.messageCount} {c.messageCount === 1 ? 'msg' : 'msgs'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
