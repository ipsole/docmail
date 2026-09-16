'use client';

import React from 'react';
import { DocdrilConversation } from '@/types';
import {
  Star,
  Mail,
  PlusCircle,
  Trash2,
  RotateCcw,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: DocdrilConversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onToggleStar: (e: React.MouseEvent, id: string, current: boolean) => void;
  folderTitle: string;
  currentFolder: string;
  onConnectClick: () => void;
  // Multi-selection props
  selectedIds: Set<string>;
  onToggleSelect: (e: React.MouseEvent, id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchMoveToTrash: () => void;
  onBatchRestore: () => void;
  onBatchDeleteForever: () => void;
  onEmptyTrash: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onToggleStar,
  folderTitle,
  currentFolder,
  onConnectClick,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBatchMoveToTrash,
  onBatchRestore,
  onBatchDeleteForever,
  onEmptyTrash,
}) => {
  const isTrash = currentFolder.replace(/^INBOX\./, '').toLowerCase() === 'trash';
  const hasSelection = selectedIds.size > 0;
  const isAllSelected = conversations.length > 0 && selectedIds.size === conversations.length;

  return (
    <section
      aria-label="Conversation list"
      className="w-full md:w-80 lg:w-96 flex flex-col h-full select-none p-3 sm:p-4 space-y-2.5 flex-shrink-0"
    >
      {/* Header Capsule */}
      <div className="glass-surface px-4 py-2.5 flex items-center justify-between text-xs text-slate-700 font-bold">
        <div className="flex items-center space-x-2">
          <span className="text-slate-900 font-extrabold">{folderTitle}</span>
          <span className="glass-inset px-2.5 py-0.5 rounded-full text-[10px] text-rose-600 font-bold">
            {conversations.length}
          </span>
        </div>

        {/* Empty Trash button when in Trash folder */}
        {isTrash && conversations.length > 0 && !hasSelection && (
          <button
            onClick={onEmptyTrash}
            className="flex items-center space-x-1 text-[11px] text-rose-600 hover:text-rose-700 font-bold px-2.5 py-1 rounded-xl glass-card hover:bg-rose-50 transition-colors cursor-pointer"
            title="Empty all items in trash permanently"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {/* Floating Elevated Batch Actions Bar */}
      {hasSelection && (
        <div className="glass-surface p-2.5 rounded-2xl flex items-center justify-between shadow-lg border border-rose-200/80 bg-white/95 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className="flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-rose-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{selectedIds.size} selected</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            {isTrash ? (
              <>
                <button
                  onClick={onBatchRestore}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-colors"
                  title="Restore selected to Inbox"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
                <button
                  onClick={onBatchDeleteForever}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors"
                  title="Delete permanently"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Delete Forever</span>
                </button>
              </>
            ) : (
              <button
                onClick={onBatchMoveToTrash}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 hover:text-white hover:bg-rose-500 glass-card transition-all cursor-pointer shadow-sm"
                title="Move selected to Trash"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </button>
            )}

            <button
              onClick={onClearSelection}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {conversations.length === 0 ? (
          <div className="glass-surface p-8 text-center space-y-4 my-4">
            <div className="w-14 h-14 glass-inset rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
              {isTrash ? <Trash2 className="w-6 h-6 text-slate-400" /> : <Mail className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {isTrash ? 'Trash is Empty' : 'No Emails Yet'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                {isTrash
                  ? 'Deleted conversations will appear here. You can restore or delete them permanently.'
                  : 'Connect your business mail account or wait for live incoming messages.'}
              </p>
            </div>
            {!isTrash && (
              <button
                onClick={onConnectClick}
                className="rose-glow-btn px-5 py-2.5 text-xs font-bold inline-flex items-center space-x-2 cursor-pointer uppercase tracking-wider"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Mail Settings</span>
              </button>
            )}
          </div>
        ) : (
          conversations.map((c) => {
            const isSelected = c.id === selectedConversationId;
            const isChecked = selectedIds.has(c.id);
            const isUnread = c.unreadCount > 0;

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all relative group ${
                  isSelected ? 'glass-card-active shadow-md' : 'glass-card hover:shadow-sm'
                } ${isChecked ? 'ring-2 ring-rose-400 bg-rose-50/40' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2 min-w-0">
                    {/* Multi-select checkbox */}
                    <button
                      type="button"
                      onClick={(e) => onToggleSelect(e, c.id)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isChecked
                          ? 'text-rose-600 bg-rose-100/80'
                          : 'text-slate-300 group-hover:text-slate-500 hover:bg-slate-100'
                      }`}
                      title={isChecked ? 'Deselect' : 'Select'}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,114,182,0.9)] flex-shrink-0" />
                    )}

                    <span
                      className={`text-xs truncate ${
                        isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'
                      }`}
                    >
                      {c.subject || '(No Subject)'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium flex-shrink-0 ml-2">
                    <span>
                      {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false })}
                    </span>
                    <button
                      onClick={(e) => onToggleStar(e, c.id, c.isStarred)}
                      className="p-0.5 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          c.isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-sans pl-7">
                  {c.snippet || 'No preview available'}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pl-7">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="glass-inset px-2.5 py-0.5 rounded-full text-slate-700 font-semibold">
                      {c.messageCount} {c.messageCount === 1 ? 'msg' : 'msgs'}
                    </span>
                    {Array.isArray(c.tags) &&
                      c.tags.map((t) => {
                        const isImp = t === 'important';
                        return (
                          <span
                            key={t}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                              isImp
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {t}
                          </span>
                        );
                      })}
                  </div>

                  {isTrash && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                      In Trash
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
