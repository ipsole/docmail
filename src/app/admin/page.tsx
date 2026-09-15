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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white h-16 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inbox</span>
          </Link>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-base tracking-tight">Docdril Administration</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Hostinger Mail Infrastructure Hub</span>
        </div>
      </header>

      {/* Admin Nav Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('health')}
          className={`py-3.5 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'health'
              ? 'border-docdril-600 text-docdril-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Infrastructure Health</span>
        </button>

        <button
          onClick={() => setActiveTab('mailboxes')}
          className={`py-3.5 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'mailboxes'
              ? 'border-docdril-600 text-docdril-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Connected Mailboxes ({mailboxes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('keys')}
          className={`py-3.5 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'keys'
              ? 'border-docdril-600 text-docdril-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Service API Keys ({apiKeys.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3.5 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'audit'
              ? 'border-docdril-600 text-docdril-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* TAB 1: HEALTH & INFRASTRUCTURE */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Status overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="text-xs text-slate-400 font-medium">Provider Status</div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-lg font-bold text-slate-900 capitalize">
                    {healthData?.provider?.name || 'Hostinger'}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {healthData?.provider?.hasApiToken
                    ? 'Hostinger Live Token Detected'
                    : 'Mock / Testing Provider active'}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="text-xs text-slate-400 font-medium">Inbound Webhook Gateway</div>
                <div className="flex items-center space-x-2">
                  <Webhook className="w-5 h-5 text-docdril-600" />
                  <span className="text-lg font-bold text-slate-900">Active</span>
                </div>
                <div className="text-xs text-slate-500 font-mono truncate">
                  /api/v1/webhooks/hostinger
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="text-xs text-slate-400 font-medium">Docdril Ecosystem Connections</div>
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-purple-600" />
                  <span className="text-lg font-bold text-slate-900">
                    {apiKeys.length} Service Credential(s)
                  </span>
                </div>
                <div className="text-xs text-slate-500">CRM, AI & Support connected</div>
              </div>
            </div>

            {/* Diagnostics Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Hostinger Integration Diagnostics
              </h2>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Hostinger API Base URL</span>
                  <span className="font-mono text-slate-800">https://api.mail.hostinger.com</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Hostinger Order Resource ID</span>
                  <span className="font-mono text-slate-800">
                    {healthData?.provider?.orderResourceId || 'OR_DOCDRIL_HOSTINGER'}
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Mailboxes Configured for Docdril
              </span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {mailboxes.map((mbx) => (
                <div key={mbx.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                      <span>{mbx.displayName}</span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        {mbx.status}
                      </span>
                    </div>
                    <div className="text-slate-500 font-mono">{mbx.emailAddress}</div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-slate-400 text-[11px]">
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
          <div className="space-y-6">
            {/* Create API Key Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Issue New Service Account Credential
              </h2>
              <p className="text-xs text-slate-500">
                Generate scoped API keys for Docdril CRM, Docdril Support, Docdril AI, and future apps.
              </p>

              <form onSubmit={handleCreateApiKey} className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Application Name (e.g. Docdril CRM)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-docdril-500"
                />
                <button
                  type="submit"
                  className="bg-docdril-600 hover:bg-docdril-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </form>

              {generatedKey && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
                  <div className="text-xs font-bold text-emerald-800">
                    Generated API Key (Copy now - will not be displayed again):
                  </div>
                  <div className="font-mono text-xs text-slate-900 bg-white p-2 rounded border border-emerald-300 select-all">
                    {generatedKey}
                  </div>
                </div>
              )}
            </div>

            {/* List API Keys */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Service Credentials
                </span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">{k.name}</div>
                      <div className="font-mono text-slate-400 text-[11px]">
                        Prefix: dd_live_{k.prefix}...
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {k.scopes.map((s) => (
                        <span
                          key={s}
                          className="bg-slate-100 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded"
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                System Audit Trail
              </span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 font-mono">{log.action}</div>
                    <div className="text-slate-500 text-[11px]">
                      Entity: {log.entityType} ({log.entityId || 'system'})
                    </div>
                  </div>
                  <div className="text-right text-slate-400 text-[11px]">
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
