'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ConversationList } from '@/components/mail/ConversationList';
import { MessageView } from '@/components/mail/MessageView';
import { ComposerModal } from '@/components/mail/ComposerModal';
import { AiAssistantPanel } from '@/components/mail/AiAssistantPanel';
import { HostingerSettingsModal } from '@/components/mail/HostingerSettingsModal';
import { DocdrilConversation, DocdrilMailbox, DocdrilMessage } from '@/types';
import { Mail, ShieldCheck } from 'lucide-react';

export default function DocMailDashboard() {
  const [mailboxes, setMailboxes] = useState<DocdrilMailbox[]>([]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<string>('');
  const [currentFolder, setCurrentFolder] = useState<string>('INBOX');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [tagsList, setTagsList] = useState<{ tag: string; count: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conversations, setConversations] = useState<DocdrilConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<DocdrilConversation | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const selectedConversationIdRef = useRef<string | null>(null);
  selectedConversationIdRef.current = selectedConversationId;

  // Modals
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitialTo, setComposerInitialTo] = useState<string[]>([]);
  const [composerInitialSubject, setComposerInitialSubject] = useState('');
  const [composerInReplyToCnvId, setComposerInReplyToCnvId] = useState<string | undefined>(undefined);
  const [composerRecipientName, setComposerRecipientName] = useState<string>('');

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Mobile navigation state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear selection when folder or mailbox changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentFolder, selectedMailboxId]);

  const [mailboxSyncing, setMailboxSyncing] = useState(false);

  // 1. Fetch Connected Mailboxes
  const loadMailboxes = useCallback(async () => {
    try {
      setMailboxSyncing(true);
      const res = await fetch('/api/v1/mailboxes');
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setMailboxes(data.data);
        if (!selectedMailboxId) {
          setSelectedMailboxId(data.data[0].id);
        }
      } else {
        // Fallback default mailboxes so UI immediately renders
        const defaultList: DocdrilMailbox[] = [
          {
            id: 'mbx_1699703',
            organizationId: 'org_docdril_primary',
            providerAccountId: 'acc_hostinger_docdril',
            provider: 'hostinger',
            providerMailboxId: '1699703',
            emailAddress: 'team@docdril.com',
            displayName: 'Team Docdril',
            status: 'ACTIVE',
            quotaBytes: 5368709120,
            usedBytes: 1530920,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-15T00:00:00.000Z',
          },
          {
            id: 'mbx_1699704',
            organizationId: 'org_docdril_primary',
            providerAccountId: 'acc_hostinger_docdril',
            provider: 'hostinger',
            providerMailboxId: '1699704',
            emailAddress: 'info@docdril.com',
            displayName: 'Info Docdril',
            status: 'ACTIVE',
            quotaBytes: 5368709120,
            usedBytes: 819200,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-15T00:00:00.000Z',
          },
        ];
        setMailboxes(defaultList);
        if (!selectedMailboxId) {
          setSelectedMailboxId(defaultList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load mailboxes:', err);
    } finally {
      setMailboxSyncing(false);
    }
  }, [selectedMailboxId]);

  useEffect(() => {
    loadMailboxes();
  }, [loadMailboxes]);

  // 2. Fetch Conversations
  const loadConversations = useCallback(async () => {
    if (!selectedMailboxId) {
      setConversations([]);
      setSelectedConversationId(null);
      setSelectedConversation(null);
      return;
    }

    try {
      let url = `/api/v1/conversations?mailboxId=${selectedMailboxId}`;
      if (currentFolder === 'STARRED') {
        url += '&starred=true';
      } else {
        url += `&folder=${encodeURIComponent(currentFolder)}`;
      }

      if (selectedTag) {
        url += `&tag=${encodeURIComponent(selectedTag)}`;
      }

      if (searchQuery.trim()) {
        url += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        setConversations(data.data);
        const currentSelId = selectedConversationIdRef.current;
        if (data.data.length > 0) {
          if (!currentSelId || !data.data.some((c: any) => c.id === currentSelId)) {
            setSelectedConversationId(data.data[0].id);
          }
        } else {
          setSelectedConversationId(null);
          setSelectedConversation(null);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [selectedMailboxId, currentFolder, selectedTag, searchQuery]);

  const loadTags = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/tags');
      const d = await res.json();
      if (d.data) setTagsList(d.data);
    } catch (e) {
      console.warn('Failed to load tags:', e);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadTags();
  }, [loadConversations, loadTags]);

  // 3. Fetch Selected Thread
  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversation(null);
      setIsThreadLoading(false);
      return;
    }

    let isCurrent = true;
    setIsThreadLoading(true);

    fetch(`/api/v1/conversations/${selectedConversationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCurrent && data.data) {
          setSelectedConversation(data.data);
        }
      })
      .catch((err) => console.error('Failed to load thread:', err))
      .finally(() => {
        if (isCurrent) setIsThreadLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedConversationId]);

  // 4. Real-time Events Listener
  useEffect(() => {
    const eventSource = new EventSource('/api/v1/events/stream');

    eventSource.addEventListener('connected', () => {
      setIsRealtimeConnected(true);
    });

    eventSource.addEventListener('message.received', () => {
      loadConversations();
    });

    eventSource.addEventListener('message.sent', () => {
      loadConversations();
    });

    eventSource.onerror = () => {
      setIsRealtimeConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [loadConversations]);

  const handleToggleStar = async (e: React.MouseEvent, conversationId: string, currentVal: boolean) => {
    e.stopPropagation();
    const nextVal = !currentVal;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        let tags = c.tags ? [...c.tags] : ['general'];
        if (nextVal) {
          if (!tags.includes('important')) tags.push('important');
        } else {
          tags = tags.filter((t) => t !== 'important');
          if (tags.length === 0) tags = ['general'];
        }
        return { ...c, isStarred: nextVal, tags };
      })
    );

    try {
      await fetch(`/api/v1/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: nextVal }),
      });
      loadTags();
    } catch (err) {
      console.error('Failed to persist star status:', err);
    }
  };

  const handleReply = (message: DocdrilMessage) => {
    setComposerInitialTo([message.senderEmail]);
    setComposerInitialSubject(
      message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`
    );
    setComposerInReplyToCnvId(message.conversationId);
    setComposerRecipientName(message.senderName || '');
    setIsComposerOpen(true);
  };

  const handleForward = (message: DocdrilMessage) => {
    setComposerInitialTo([]);
    setComposerInitialSubject(
      message.subject.startsWith('Fwd:') ? message.subject : `Fwd: ${message.subject}`
    );
    setComposerInReplyToCnvId(message.conversationId);
    setComposerRecipientName('');
    setIsComposerOpen(true);
  };

  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(conversations.map((c) => c.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchMoveToTrash = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const nextList = conversations.filter((c) => !selectedIds.has(c.id));
    setConversations(nextList);
    if (selectedConversationId && selectedIds.has(selectedConversationId)) {
      if (nextList.length > 0) {
        setSelectedConversationId(nextList[0].id);
      } else {
        setSelectedConversationId(null);
        setSelectedConversation(null);
      }
    }
    setSelectedIds(new Set());

    try {
      await fetch('/api/v1/conversations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trash',
          conversationIds: ids,
          mailboxId: selectedMailboxId,
        }),
      });
      loadConversations();
    } catch (err) {
      console.error('Failed to move to trash:', err);
      loadConversations();
    }
  };

  const handleBatchRestore = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const nextList = conversations.filter((c) => !selectedIds.has(c.id));
    setConversations(nextList);
    if (selectedConversationId && selectedIds.has(selectedConversationId)) {
      if (nextList.length > 0) {
        setSelectedConversationId(nextList[0].id);
      } else {
        setSelectedConversationId(null);
        setSelectedConversation(null);
      }
    }
    setSelectedIds(new Set());

    try {
      await fetch('/api/v1/conversations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          conversationIds: ids,
          mailboxId: selectedMailboxId,
        }),
      });
      loadConversations();
    } catch (err) {
      console.error('Failed to restore from trash:', err);
      loadConversations();
    }
  };

  const handleBatchDeleteForever = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${selectedIds.size} conversation(s)? This cannot be undone.`
      )
    ) {
      return;
    }
    const ids = Array.from(selectedIds);
    const nextList = conversations.filter((c) => !selectedIds.has(c.id));
    setConversations(nextList);
    if (selectedConversationId && selectedIds.has(selectedConversationId)) {
      if (nextList.length > 0) {
        setSelectedConversationId(nextList[0].id);
      } else {
        setSelectedConversationId(null);
        setSelectedConversation(null);
      }
    }
    setSelectedIds(new Set());

    try {
      await fetch('/api/v1/conversations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_forever',
          conversationIds: ids,
          mailboxId: selectedMailboxId,
        }),
      });
      loadConversations();
    } catch (err) {
      console.error('Failed to delete permanently:', err);
      loadConversations();
    }
  };

  const handleEmptyTrash = async () => {
    if (
      !window.confirm(
        'Are you sure you want to empty the Trash? All deleted messages will be permanently purged.'
      )
    ) {
      return;
    }
    setConversations([]);
    setSelectedConversationId(null);
    setSelectedConversation(null);
    setSelectedIds(new Set());

    try {
      await fetch('/api/v1/conversations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'empty_trash',
          mailboxId: selectedMailboxId,
        }),
      });
      loadConversations();
    } catch (err) {
      console.error('Failed to empty trash:', err);
      loadConversations();
    }
  };

  const handleSingleMoveToTrash = async (conversationId: string) => {
    const nextList = conversations.filter((c) => c.id !== conversationId);
    setConversations(nextList);
    if (selectedConversationId === conversationId) {
      if (nextList.length > 0) {
        setSelectedConversationId(nextList[0].id);
      } else {
        setSelectedConversationId(null);
        setSelectedConversation(null);
        setIsMobileDetailView(false);
      }
    }
    try {
      await fetch(`/api/v1/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      loadConversations();
    } catch (err) {
      console.error('Failed to trash conversation:', err);
      loadConversations();
    }
  };

  const handleSingleRestore = async (conversationId: string) => {
    const nextList = conversations.filter((c) => c.id !== conversationId);
    setConversations(nextList);
    if (selectedConversationId === conversationId) {
      if (nextList.length > 0) {
        setSelectedConversationId(nextList[0].id);
      } else {
        setSelectedConversationId(null);
        setSelectedConversation(null);
        setIsMobileDetailView(false);
      }
    }
    try {
      await fetch(`/api/v1/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrash: false, restore: true }),
      });
      loadConversations();
    } catch (err) {
      console.error('Failed to restore conversation:', err);
      loadConversations();
    }
  };

  const handleSingleDeleteForever = async (conversationId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this email? This cannot be undone.'
      )
    ) {
      return;
    }
    const nextList = conversations.filter((c) => c.id !== conversationId);
    setConversations(nextList);
    if (selectedConversationId === conversationId) {
      if (nextList.length > 0) {
        setSelectedConversationId(nextList[0].id);
      } else {
        setSelectedConversationId(null);
        setSelectedConversation(null);
        setIsMobileDetailView(false);
      }
    }
    try {
      await fetch(`/api/v1/conversations/${conversationId}?permanent=true`, {
        method: 'DELETE',
      });
      loadConversations();
    } catch (err) {
      console.error('Failed to permanently delete conversation:', err);
      loadConversations();
    }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount > 0 ? 1 : 0), 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar
        onComposeClick={() => {
          setComposerInitialTo([]);
          setComposerInitialSubject('');
          setComposerInReplyToCnvId(undefined);
          setComposerRecipientName('');
          setIsComposerOpen(true);
        }}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={loadConversations}
        mailboxes={mailboxes}
        selectedMailboxId={selectedMailboxId}
        onSelectMailbox={setSelectedMailboxId}
        isRealtimeConnected={isRealtimeConnected}
        onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Desktop Static + Mobile Drawer) */}
        <Sidebar
          currentFolder={currentFolder}
          onSelectFolder={(folder) => {
            setCurrentFolder(folder);
            setSelectedTag('');
            setIsMobileDetailView(false);
          }}
          selectedTag={selectedTag}
          onSelectTag={(tag) => {
            setSelectedTag(tag);
            setIsMobileDetailView(false);
          }}
          tags={tagsList}
          unreadCount={totalUnread}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Mailboxes Loading State or Main Inbox View */}
        {mailboxes.length === 0 ? (
          <main className="flex-1 flex items-center justify-center p-8 select-none">
            <div className="glass-surface p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center mx-auto p-2 bg-white shadow-sm border border-white/80">
                <img src="/docdril.svg" alt="DocMail" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  {mailboxSyncing ? 'Updating Mailboxes...' : 'Docdril Communication Hub'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Connecting to live cloud infrastructure for docdril.com.
                </p>
              </div>
            </div>
          </main>
        ) : (
          <>
            {/* Middle Conversations Column (Mobile Master View) */}
            <div
              className={`h-full ${
                isMobileDetailView ? 'hidden md:flex' : 'flex flex-1 md:flex-initial'
              }`}
            >
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={(id) => {
                  setSelectedConversationId(id);
                  setIsMobileDetailView(true);
                }}
                onToggleStar={handleToggleStar}
                folderTitle={selectedTag ? `Tag: ${selectedTag}` : currentFolder.replace('INBOX.', '')}
                currentFolder={currentFolder}
                onConnectClick={() => setIsSettingsModalOpen(true)}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onBatchMoveToTrash={handleBatchMoveToTrash}
                onBatchRestore={handleBatchRestore}
                onBatchDeleteForever={handleBatchDeleteForever}
                onEmptyTrash={handleEmptyTrash}
              />
            </div>

            {/* Right Reader Pane (Mobile Detail View) */}
            <div
              className={`h-full flex-1 ${
                isMobileDetailView ? 'flex' : 'hidden md:flex'
              }`}
            >
              <MessageView
                conversation={selectedConversation}
                currentFolder={currentFolder}
                onReply={handleReply}
                onForward={handleForward}
                onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
                isAiDrawerOpen={isAiDrawerOpen}
                onConnectClick={() => setIsSettingsModalOpen(true)}
                onBackMobile={() => setIsMobileDetailView(false)}
                onMoveToTrash={handleSingleMoveToTrash}
                onRestoreFromTrash={handleSingleRestore}
                onDeletePermanently={handleSingleDeleteForever}
                onToggleTag={async (conversationId, tag, action) => {
                  try {
                    await fetch('/api/v1/tags', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ conversationId, tag, action }),
                    });
                    loadConversations();
                    loadTags();
                    if (selectedConversation && selectedConversation.id === conversationId) {
                      const updatedTags =
                        action === 'remove'
                          ? (selectedConversation.tags || []).filter((t) => t !== tag)
                          : Array.from(new Set([...(selectedConversation.tags || []), tag]));
                      setSelectedConversation({ ...selectedConversation, tags: updatedTags });
                    }
                  } catch (e) {
                    console.error('Failed to update tag:', e);
                  }
                }}
                isLoading={isThreadLoading}
              />
            </div>

            {/* AI Assistant Drawer */}
            <AiAssistantPanel
              isOpen={isAiDrawerOpen}
              onClose={() => setIsAiDrawerOpen(false)}
              conversation={selectedConversation}
              onApplyDraftToComposer={(text) => {
                if (selectedConversation) {
                  const latest = selectedConversation.messages?.[selectedConversation.messages.length - 1];
                  if (latest) handleReply(latest);
                }
              }}
            />
          </>
        )}
      </div>

      {/* Floating Composer */}
      <ComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        initialTo={composerInitialTo}
        initialSubject={composerInitialSubject}
        initialInReplyToConversationId={composerInReplyToCnvId}
        initialRecipientName={composerRecipientName}
        activeMailbox={mailboxes.find((m) => m.id === selectedMailboxId) || mailboxes[0]}
        mailboxes={mailboxes}
        onSendSuccess={loadConversations}
      />

      {/* Hostinger Agentic Settings Modal */}
      <HostingerSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
