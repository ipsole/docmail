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
} from 'lucide-react';

interface SidebarProps {
  currentFolder: string;
  onSelectFolder: (folder: string) => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  onSelectFolder,
  unreadCount,
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

  return (
    <aside className="w-60 p-4 select-none flex flex-col justify-between">
      <div className="space-y-6">
        {/* Mail Folders */}
        <div className="glass-surface p-3 space-y-1">
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
                  onClick={() => onSelectFolder(f.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
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

        {/* Business Tools */}
        <div className="glass-surface p-3 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1">
            Ecosystem
          </div>
          <nav className="space-y-1">
            <Link
              href="/contacts"
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
          className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs transition-all ${
            pathname.startsWith('/admin')
              ? 'obsidian-card shadow-lg font-bold'
              : 'glass-card text-slate-800 hover:text-slate-900 font-semibold'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-500" />
          <span>Hostinger Admin</span>
        </Link>
      </div>
    </aside>
  );
};
