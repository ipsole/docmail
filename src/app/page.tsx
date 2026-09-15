'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conversations, setConversations] = useState<DocdrilConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<DocdrilConversation | null>(null);

  // Modals
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitialTo, setComposerInitialTo] = useState<string[]>([]);
  const [composerInitialSubject, setComposerInitialSubject] = useState('');
  const [composerInReplyToCnvId, setComposerInReplyToCnvId] = useState<string | undefined>(undefined);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

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

      if (searchQuery.trim()) {
        url += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        setConversations(data.data);
        if (data.data.length > 0 && (!selectedConversationId || !data.data.some((c: any) => c.id === selectedConversationId))) {
          setSelectedConversationId(data.data[0].id);
        } else if (data.data.length === 0) {
          setSelectedConversationId(null);
          setSelectedConversation(null);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [selectedMailboxId, currentFolder, searchQuery, selectedConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 3. Fetch Selected Thread
  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversation(null);
      return;
    }

    fetch(`/api/v1/conversations/${selectedConversationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setSelectedConversation(data.data);
      })
      .catch((err) => console.error('Failed to load thread:', err));
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
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isStarred: !currentVal } : c))
    );
  };

  const handleReply = (message: DocdrilMessage) => {
    setComposerInitialTo([message.senderEmail]);
    setComposerInitialSubject(
      message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`
    );
    setComposerInReplyToCnvId(message.conversationId);
    setIsComposerOpen(true);
  };

  const handleForward = (message: DocdrilMessage) => {
    setComposerInitialTo([]);
    setComposerInitialSubject(
      message.subject.startsWith('Fwd:') ? message.subject : `Fwd: ${message.subject}`
    );
    setComposerInReplyToCnvId(message.conversationId);
    setIsComposerOpen(true);
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount > 0 ? 1 : 0), 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar
        onComposeClick={() => setIsComposerOpen(true)}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={loadConversations}
        mailboxes={mailboxes}
        selectedMailboxId={selectedMailboxId}
        onSelectMailbox={setSelectedMailboxId}
        isRealtimeConnected={isRealtimeConnected}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentFolder={currentFolder}
          onSelectFolder={setCurrentFolder}
          unreadCount={totalUnread}
        />

        {/* Mailboxes Loading State or Main Inbox View */}
        {mailboxes.length === 0 ? (
          <main className="flex-1 flex items-center justify-center p-8 select-none">
            <div className="glass-surface p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center mx-auto p-2 bg-white shadow-sm border border-white/80">
                <img src="/docdril.svg" alt="DocMail" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Synchronizing Hostinger Mailboxes</div>
                <div className="text-xs text-slate-500 mt-1">Loading team@docdril.com & info@docdril.com...</div>
              </div>
            </div>
          </main>
        ) : (
          <>
            {/* Middle Conversation List */}
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onToggleStar={handleToggleStar}
              folderTitle={currentFolder.replace('INBOX.', '')}
              onConnectClick={() => setIsSettingsModalOpen(true)}
            />

            {/* Right Reader Pane */}
            <MessageView
              conversation={selectedConversation}
              onReply={handleReply}
              onForward={handleForward}
              onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
              isAiDrawerOpen={isAiDrawerOpen}
              onConnectClick={() => setIsSettingsModalOpen(true)}
            />

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
