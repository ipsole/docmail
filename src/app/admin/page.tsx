'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Server,
  Key,
  Webhook,
  Activity,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Mail,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react';
import { DocdrilApiKey, DocdrilAuditLog, DocdrilMailbox } from '@/types';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'health' | 'mailboxes' | 'keys' | 'audit'>('health');
  const [healthData, setHealthData] = useState<any>(null);
  const [mailboxes, setMailboxes] = useState<DocdrilMailbox[]>([]);
  const [apiKeys, setApiKeys] = useState<DocdrilApiKey[]>([]);
  const [auditLogs, setAuditLogs] = useState<DocdrilAuditLog[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    // Load health
    fetch('/api/v1/admin/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setHealthData(data.data);
      })
      .catch(() => {});

    // Load mailboxes
    fetch('/api/v1/mailboxes')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setMailboxes(data.data);
      })
      .catch(() => {});

    // Load API Keys
    fetch('/api/v1/admin/api-keys')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setApiKeys(data.data);
      })
      .catch(() => {});

    // Load Audit Logs
    fetch('/api/v1/admin/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setAuditLogs(data.data);
      })
      .catch(() => {});
  }, []);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/v1/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          scopes: ['messages:read', 'messages:send', 'contacts:read'],
        }),
      });
      const data = await res.json();
      if (data.data) {
        setApiKeys((prev) => [data.data, ...prev]);
        setGeneratedKey(data.data.rawSecretKey);
        setNewKeyName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans p-3 sm:p-4 space-y-4 select-none">
      {/* Top Header */}
      <header className="glass-surface px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Inbox</span>
          </Link>
          <div className="h-4 w-px bg-white/60" />
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center shadow-[0_0_12px_rgba(244,114,182,0.5)]">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">DocMail Admin Console</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
          <span>DocMail Core Infrastructure</span>
        </div>
      </header>

      {/* Admin Nav Tabs */}
      <div className="glass-surface px-3 sm:px-6 py-2 flex space-x-2 overflow-x-auto text-xs font-semibold scrollbar-none shadow-sm">
        <button
          onClick={() => setActiveTab('health')}
          className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'health'
              ? 'obsidian-card shadow-md font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-rose-400" />
          <span>Infrastructure Health</span>
        </button>

        <button
          onClick={() => setActiveTab('mailboxes')}
          className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'mailboxes'
              ? 'obsidian-card shadow-md font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-pink-400" />
          <span>Mailboxes ({mailboxes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('keys')}
          className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'keys'
              ? 'obsidian-card shadow-md font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span>Service API Keys ({apiKeys.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'obsidian-card shadow-md font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <main className="flex-1 max-w-6xl mx-auto w-full space-y-5">
        {/* TAB 1: HEALTH & INFRASTRUCTURE */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            {/* Status overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="glass-card p-5 space-y-2">
                <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Mail Gateway Engine</div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-base font-bold text-slate-900">
                    {healthData?.provider?.name === 'hostinger' ? 'Cloud Mail Gateway' : (healthData?.provider?.name || 'Cloud Mail Engine')}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {healthData?.provider?.hasApiToken
                    ? 'Cloud Mail API Token Active'
                    : 'Mock / Testing Provider active'}
                </div>
              </div>

              <div className="glass-card p-5 space-y-2">
                <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Inbound Webhook Gateway</div>
                <div className="flex items-center space-x-2">
                  <Webhook className="w-5 h-5 text-rose-500" />
                  <span className="text-base font-bold text-slate-900">Active</span>
                </div>
                <div className="text-xs text-slate-500 font-mono truncate">
                  /api/v1/webhooks/hostinger
                </div>
              </div>

              <div className="glass-card p-5 space-y-2">
                <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Docdril Ecosystem Connections</div>
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-purple-500" />
                  <span className="text-base font-bold text-slate-900">
                    {apiKeys.length} Service Credential(s)
                  </span>
                </div>
                <div className="text-xs text-slate-500">CRM, AI & Support connected</div>
              </div>
            </div>

            {/* Diagnostics Panel */}
            <div className="glass-surface p-5 sm:p-6 space-y-4 shadow-md">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Cloud Mail Gateway Diagnostics
              </h2>
              <div className="divide-y divide-white/60 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Mail Gateway API URL</span>
                  <span className="font-mono text-slate-800">https://api.mail.hostinger.com</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Mailbox Cluster Resource ID</span>
                  <span className="font-mono text-slate-800">
                    {healthData?.provider?.orderResourceId || 'OR_DOCDRIL_CLUSTER'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Inbound Webhook Verification</span>
                  <span className="font-semibold text-emerald-600">
                    Bearer Token Header Auth Enabled
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Realtime UI Dispatch Engine</span>
                  <span className="font-semibold text-emerald-600">
                    Server-Sent Events (SSE) Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MAILBOXES */}
        {activeTab === 'mailboxes' && (
          <div className="glass-surface shadow-md overflow-hidden">
            <div className="p-4 border-b border-white/60 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Organization Mailboxes
              </span>
            </div>
            <div className="divide-y divide-white/60 text-xs">
              {mailboxes.map((mbx) => (
                <div key={mbx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/40 transition-colors">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                      <span>{mbx.displayName}</span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        {mbx.status}
                      </span>
                    </div>
                    <div className="text-slate-500 font-mono text-xs">{mbx.emailAddress}</div>
                  </div>

                  <div className="sm:text-right space-y-0.5">
                    <div className="text-slate-500 text-[11px]">
                      Quota: {Math.round(mbx.usedBytes / (1024 * 1024))} MB /{' '}
                      {Math.round(mbx.quotaBytes / (1024 * 1024 * 1024))} GB
                    </div>
                    <div className="text-slate-400 font-mono text-[10px]">ID: {mbx.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: API KEYS */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            {/* Create API Key Form */}
            <div className="glass-surface p-5 shadow-md space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Issue New Service Account Credential
              </h2>
              <p className="text-xs text-slate-500">
                Generate scoped API keys for Docdril CRM, Docdril Support, Docdril AI, and future integrations.
              </p>

              <form onSubmit={handleCreateApiKey} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Application Name (e.g. Docdril CRM)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 text-xs glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
                <button
                  type="submit"
                  className="rose-glow-btn px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-md text-xs font-bold uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </form>

              {generatedKey && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                  <div className="text-xs font-bold text-emerald-800">
                    Generated API Key (Copy now - will not be displayed again):
                  </div>
                  <div className="font-mono text-xs text-slate-900 bg-white/90 p-2 rounded-lg border border-emerald-300 select-all break-all">
                    {generatedKey}
                  </div>
                </div>
              )}
            </div>

            {/* List API Keys */}
            <div className="glass-surface shadow-md overflow-hidden">
              <div className="p-4 border-b border-white/60">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Service Credentials
                </span>
              </div>
              <div className="divide-y divide-white/60 text-xs">
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/40">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">{k.name}</div>
                      <div className="font-mono text-slate-400 text-[11px]">
                        Prefix: dd_live_{k.prefix}...
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {k.scopes.map((s) => (
                        <span
                          key={s}
                          className="glass-inset text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="glass-surface shadow-md overflow-hidden">
            <div className="p-4 border-b border-white/60">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                System Audit Trail
              </span>
            </div>
            <div className="divide-y divide-white/60 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/40">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 font-mono">{log.action}</div>
                    <div className="text-slate-500 text-[11px]">
                      Entity: {log.entityType} ({log.entityId || 'system'})
                    </div>
                  </div>
                  <div className="sm:text-right text-slate-400 text-[11px]">
                    <div>{new Date(log.createdAt).toLocaleString()}</div>
                    <div className="font-mono text-[10px]">IP: {log.ipAddress || '127.0.0.1'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
