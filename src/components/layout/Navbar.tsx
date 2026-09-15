'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  Search,
  RefreshCw,
  PenSquare,
  SlidersHorizontal,
  ChevronDown,
  LogOut,
  Shield,
  Check,
} from 'lucide-react';
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
  onMenuToggle?: () => void;
  isMobileSidebarOpen?: boolean;
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
  onMenuToggle,
  isMobileSidebarOpen,
}) => {
  const [user, setUser] = useState<{ name?: string; email?: string; picture?: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="px-3 sm:px-4 py-2.5 sm:py-3 select-none flex-shrink-0 z-30">
      <div className="glass-surface px-3 sm:px-5 py-2 flex items-center justify-between shadow-lg relative">
        {/* Left: Mobile Menu + Branding + Mailbox Picker */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Drawer Hamburger */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              aria-label="Toggle navigation menu"
              className="md:hidden w-8 h-8 glass-card rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}

          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="w-8 h-8 sm:w-9 sm:h-9 glass-card rounded-2xl flex items-center justify-center p-1.5 bg-white/95 shadow-sm group-hover:scale-105 transition-transform border border-white/80">
              <img src="/docdril.svg" alt="DocMail" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-black text-xs sm:text-sm tracking-tight text-slate-900 block leading-tight">
                DocMail
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                  by Docdril
                </span>
              </div>
            </div>
          </Link>

          {/* Mailbox Selector Pill (Responsive) */}
          {mailboxes.length > 0 && (
            <div className="hidden sm:flex items-center ml-2">
              <div className="glass-inset px-3 py-1 rounded-full flex items-center space-x-1.5 border border-white/70">
                <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                <select
                  aria-label="Select active mailbox"
                  value={selectedMailboxId}
                  onChange={(e) => onSelectMailbox(e.target.value)}
                  className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer pr-1"
                >
                  {mailboxes.map((mbx) => (
                    <option key={mbx.id} value={mbx.id} className="bg-white text-slate-800 font-medium">
                      {mbx.emailAddress}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Center: Search Bar (Desktop Capsule) */}
        <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-4">
          <div className="w-full glass-inset px-3.5 py-1.5 rounded-full flex items-center space-x-2 transition-all focus-within:bg-white/80 focus-within:shadow-md border border-white/70">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search conversations, senders, or topics..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Right Actions Cluster */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Mobile Search Icon Toggle */}
          <button
            onClick={() => setIsSearchOpenMobile(!isSearchOpenMobile)}
            aria-label="Toggle search bar"
            className="md:hidden w-8 h-8 glass-card rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Refresh Sync Button */}
          <button
            onClick={onRefresh}
            title="Sync Mailboxes"
            aria-label="Sync Mailboxes"
            className="w-8 h-8 glass-card rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Luminous Live Status Pulse Indicator */}
          <div
            title={isRealtimeConnected ? 'Live Cloud Sync Active' : 'Connecting to mail stream...'}
            className="flex items-center space-x-1.5 glass-inset px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRealtimeConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
              }`}
            />
            <span className="hidden lg:inline text-[11px] font-bold">
              {isRealtimeConnected ? 'Live' : 'Syncing'}
            </span>
          </div>

          {/* Gateway & Integration Settings Trigger */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              title="Mail Gateway & Integration Settings"
              aria-label="Mail Gateway & Integration Settings"
              className="w-8 h-8 glass-card rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}

          {/* User Profile Avatar with Dropdown */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-1 glass-card p-1 rounded-full hover:shadow-md transition-all cursor-pointer border border-white/80"
                aria-label="User profile menu"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'User'}
                    className="w-6 h-6 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                    {user.name?.[0] || 'U'}
                  </div>
                )}
                <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:block mr-0.5" />
              </button>

              {/* Profile Popover Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-surface p-3 shadow-2xl rounded-2xl space-y-2 border border-white/80 z-50 text-xs">
                  <div className="pb-2 border-b border-white/60">
                    <p className="font-bold text-slate-900 truncate">{user.name || 'Docdril Administrator'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>

                  {/* Mailbox switcher in mobile view */}
                  <div className="sm:hidden pb-2 border-b border-white/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Mailbox</span>
                    <div className="space-y-1 pt-1">
                      {mailboxes.map((mbx) => (
                        <button
                          key={mbx.id}
                          onClick={() => {
                            onSelectMailbox(mbx.id);
                            setIsProfileOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs ${
                            mbx.id === selectedMailboxId
                              ? 'bg-rose-50 text-rose-700 font-bold'
                              : 'text-slate-700 hover:bg-white/50'
                          }`}
                        >
                          <span className="truncate">{mbx.emailAddress}</span>
                          {mbx.id === selectedMailboxId && <Check className="w-3.5 h-3.5 text-rose-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/admin"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-2 px-2 py-1.5 rounded-xl hover:bg-white/60 text-slate-700 transition-colors font-medium"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>Admin Console</span>
                  </Link>

                  <a
                    href="/api/auth/logout"
                    className="flex items-center space-x-2 px-2 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Compose Button */}
          <button
            onClick={onComposeClick}
            className="luminous-btn flex items-center space-x-1.5 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <PenSquare className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />
            <span className="hidden sm:inline">Compose</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Expandable Drawer */}
      {isSearchOpenMobile && (
        <div className="md:hidden mt-2 glass-surface p-2 shadow-md">
          <div className="glass-inset px-3 py-1.5 rounded-full flex items-center space-x-2 border border-white/70">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
