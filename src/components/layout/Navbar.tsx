'use client';

import React from 'react';
import { Search, RefreshCw, PenSquare, PlusCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface DocdrilMailbox {
  id: string;
  emailAddress: string;
  displayName: string;
}

interface NavbarProps {
  onComposeClick: () => void;
  onSettingsClick?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  mailboxes: DocdrilMailbox[];
  selectedMailboxId: string;
  onSelectMailbox: (id: string) => void;
  isRealtimeConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onComposeClick,
  onSettingsClick,
  searchQuery,
  onSearchChange,
  onRefresh,
  mailboxes,
  selectedMailboxId,
  onSelectMailbox,
  isRealtimeConnected,
}) => {
  const [user, setUser] = React.useState<{ name?: string; email?: string; picture?: string } | null>(null);

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="px-4 py-3 select-none flex-shrink-0 z-30">
      <div className="glass-surface px-5 py-2.5 flex items-center justify-between shadow-lg">
        {/* Left Branding & Mailbox Select */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-9 h-9 glass-card rounded-2xl flex items-center justify-center p-1.5 bg-white/90 shadow-sm group-hover:scale-105 transition-transform border border-white/80">
              <img src="/docdril.svg" alt="DocMail" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-900 block leading-tight">
                DocMail
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                  by Docdril
                </span>
              </div>
            </div>
          </Link>

          {/* Mailbox Selector */}
          {mailboxes.length > 0 && (
            <div className="hidden md:flex items-center ml-2">
              <div className="glass-inset px-3 py-1.5 rounded-full flex items-center">
                <select
                  aria-label="Select active mailbox"
                  value={selectedMailboxId}
                  onChange={(e) => onSelectMailbox(e.target.value)}
                  className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer pr-2"
                >
                  {mailboxes.map((mbx) => (
                    <option key={mbx.id} value={mbx.id} className="bg-white text-slate-800">
                      {mbx.emailAddress}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Translucent Capsule Search Bar */}
        <div className="flex-1 max-w-md mx-6">
          <div className="glass-inset px-4 py-2 rounded-full flex items-center space-x-2.5 transition-all focus-within:bg-white/70 focus-within:shadow-md">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search conversations, senders, or topics..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Refresh Sync Button */}
          <button
            onClick={onRefresh}
            title="Sync with Hostinger"
            className="w-8 h-8 glass-card rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Luminous Status Pill */}
          <div
            title={isRealtimeConnected ? 'Hostinger Real-time SSE active' : 'Connecting to real-time events...'}
            className="hidden lg:flex items-center space-x-1.5 glass-inset px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRealtimeConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
              }`}
            />
            <span className="text-[11px] font-bold">{isRealtimeConnected ? 'Live' : 'Standby'}</span>
          </div>

          {/* Agentic & Webhook Settings Trigger */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              title="Hostinger Webhooks & Agentic Setup"
              className="glass-card px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>Agentic Mail</span>
            </button>
          )}

          {/* User Profile / Logout */}
          {user && (
            <div className="hidden sm:flex items-center space-x-2 glass-inset px-2.5 py-1 rounded-full">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name?.[0] || 'U'}
                </div>
              )}
              <span className="text-[11px] font-semibold text-slate-700 max-w-[100px] truncate">
                {user.name || user.email}
              </span>
              <a
                href="/api/auth/logout"
                title="Sign Out"
                className="text-[10px] text-slate-400 hover:text-rose-600 font-bold ml-1 transition-colors"
              >
                Sign Out
              </a>
            </div>
          )}

          {/* Sleek Obsidian Matte Pill Button */}
          <button
            onClick={onComposeClick}
            className="luminous-btn flex items-center space-x-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <PenSquare className="w-3.5 h-3.5 text-rose-300" />
            <span>Compose</span>
          </button>
        </div>
      </div>
    </header>
  );
};
