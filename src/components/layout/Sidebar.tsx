'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  Star,
  Send,
  FileEdit,
  Archive,
  Trash2,
  AlertOctagon,
  Users,
  FileText,
  Shield,
  X,
  Tag,
} from 'lucide-react';

interface SidebarProps {
  currentFolder: string;
  onSelectFolder: (folder: string) => void;
  selectedTag?: string;
  onSelectTag?: (tag: string) => void;
  tags?: { tag: string; count: number }[];
  unreadCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  onSelectFolder,
  selectedTag = '',
  onSelectTag,
  tags = [],
  unreadCount,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();

  const folders = [
    { id: 'INBOX', name: 'Inbox', icon: Inbox, badge: unreadCount },
    { id: 'STARRED', name: 'Starred', icon: Star },
    { id: 'INBOX.Sent', name: 'Sent', icon: Send },
    { id: 'INBOX.Drafts', name: 'Drafts', icon: FileEdit },
    { id: 'INBOX.Archive', name: 'Archive', icon: Archive },
    { id: 'INBOX.Trash', name: 'Trash', icon: Trash2 },
    { id: 'INBOX.Spam', name: 'Spam', icon: AlertOctagon },
  ];

  const handleFolderClick = (id: string) => {
    onSelectFolder(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 select-none">
      <div className="space-y-5">
        {/* Mobile Header with close button */}
        <div className="flex md:hidden items-center justify-between px-2 pb-1 border-b border-white/60">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 glass-card rounded-xl flex items-center justify-center p-1 bg-white">
              <img src="/docdril.svg" alt="DocMail" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-xs text-slate-900">DocMail Navigation</span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="w-7 h-7 glass-card rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mail Folders */}
        <div className="glass-surface p-3 space-y-1 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1">
            Mailboxes
          </div>
          <nav className="space-y-1">
            {folders.map((f) => {
              const Icon = f.icon;
              const isActive = pathname === '/' && currentFolder === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => handleFolderClick(f.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'obsidian-card shadow-lg font-bold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/40 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-rose-300' : 'text-slate-400'
                      }`}
                    />
                    <span>{f.name}</span>
                  </div>
                  {!!f.badge && f.badge > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,114,182,0.8)]'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {f.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mailbox Tags */}
        <div className="glass-surface p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tags</span>
            <Tag className="w-3 h-3 text-slate-400" />
          </div>
          <nav className="space-y-1">
            {/* General Tag */}
            <button
              onClick={() => {
                if (onSelectTag) onSelectTag(selectedTag === 'general' ? '' : 'general');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all cursor-pointer ${
                selectedTag === 'general'
                  ? 'obsidian-card shadow-md font-bold'
                  : 'text-slate-700 hover:bg-white/40 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                <span className="capitalize">General</span>
              </div>
            </button>

            {/* Important Tag */}
            <button
              onClick={() => {
                if (onSelectTag) onSelectTag(selectedTag === 'important' ? '' : 'important');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all cursor-pointer ${
                selectedTag === 'important'
                  ? 'obsidian-card shadow-md font-bold'
                  : 'text-slate-700 hover:bg-white/40 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)] flex-shrink-0" />
                <span className="capitalize">Important</span>
              </div>
            </button>

            {/* Custom Dynamic Tags */}
            {tags
              .filter((t) => t.tag !== 'general' && t.tag !== 'important')
              .map((t) => (
                <button
                  key={t.tag}
                  onClick={() => {
                    if (onSelectTag) onSelectTag(selectedTag === t.tag ? '' : t.tag);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all cursor-pointer ${
                    selectedTag === t.tag
                      ? 'obsidian-card shadow-md font-bold'
                      : 'text-slate-700 hover:bg-white/40 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
                    <span className="capitalize">{t.tag}</span>
                  </div>
                  {t.count > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
          </nav>
        </div>

        {/* Business Tools */}
        <div className="glass-surface p-3 space-y-1 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1">
            Ecosystem
          </div>
          <nav className="space-y-1">
            <Link
              href="/contacts"
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                pathname === '/contacts'
                  ? 'obsidian-card shadow-lg font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/40 font-medium'
              }`}
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span>Contacts</span>
            </Link>

            <Link
              href="/templates"
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                pathname === '/templates'
                  ? 'obsidian-card shadow-lg font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/40 font-medium'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Templates</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Admin Panel Link */}
      <div className="pt-3">
        <Link
          href="/admin"
          onClick={handleLinkClick}
          className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs transition-all ${
            pathname.startsWith('/admin')
              ? 'obsidian-card shadow-lg font-bold'
              : 'glass-card text-slate-800 hover:text-slate-900 font-semibold'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-500" />
          <span>Admin Console</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white/85 backdrop-blur-xl h-full shadow-2xl z-50 flex flex-col border-r border-white/80 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
