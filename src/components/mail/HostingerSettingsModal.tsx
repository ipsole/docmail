'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Webhook,
  Bot,
  Shield,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Sparkles,
  Key,
  Trash2,
  Plus,
  Info,
  AlertTriangle,
} from 'lucide-react';

interface HostingerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { name?: string; email?: string; picture?: string } | null;
}

export const HostingerSettingsModal: React.FC<HostingerSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'chatgpt' | 'webhooks' | 'deployment'>('chatgpt');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Live API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('ChatGPT MCP Token');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  const webhookUrl = 'https://docmail.docdril.com/api/v1/webhooks/hostinger';
  const chatgptOpenApiUrl = 'https://docmail.docdril.com/api/v1/openapi.json';
  const mcpUrl = 'https://docmail.docdril.com/api/v1/mcp';

  // Load API keys whenever modal is opened
  const loadApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/v1/admin/api-keys');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setApiKeys(json.data);
      }
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
      setNewlyCreatedKey(null);
      setDeleteStatus(null);
    }
  }, [isOpen]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || isCreatingKey) return;

    setIsCreatingKey(true);
    try {
      const res = await fetch('/api/v1/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: ['messages:read', 'messages:send', 'contacts:read', 'contacts:write'],
        }),
      });
      const json = await res.json();
      if (json.data) {
        setNewlyCreatedKey(json.data.rawSecretKey);
        setNewKeyName('ChatGPT MCP Token');
        loadApiKeys();
      }
    } catch (err) {
      console.error('Failed to generate key:', err);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteKey = async (keyId: string, keyName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${keyName}"? Any MCP, ChatGPT, or AI client using this token will be disconnected immediately.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/api-keys?id=${encodeURIComponent(keyId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
        setDeleteStatus(`Token "${keyName}" deleted completely.`);
        setTimeout(() => setDeleteStatus(null), 4000);
      }
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md select-none">
      <div className="glass-surface w-full max-w-2xl p-6 sm:p-8 space-y-6 relative shadow-2xl bg-white/95 max-h-[92vh] flex flex-col rounded-3xl border border-white/80">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 glass-card rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-white shadow-[0_0_16px_rgba(244,114,182,0.6)] flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                DocMail MCP & AI Integration
              </h2>
              <span className="glass-inset px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-600">
                {apiKeys.length} {apiKeys.length === 1 ? 'Token' : 'Tokens'} Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Connect ChatGPT, Claude MCP, desktop agents, and manage authorization tokens
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-white/60 pb-2">
          <button
            onClick={() => setActiveTab('chatgpt')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chatgpt'
                ? 'obsidian-card shadow-md'
                : 'glass-card text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-pink-400" />
            <span>1. ChatGPT & MCP AI</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'webhooks'
                ? 'obsidian-card shadow-md'
                : 'glass-card text-slate-600 hover:text-slate-900'
            }`}
          >
            <Webhook className="w-3.5 h-3.5 text-rose-400" />
            <span>2. Inbound Webhooks</span>
          </button>

          <button
            onClick={() => setActiveTab('deployment')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'deployment'
                ? 'obsidian-card shadow-md'
                : 'glass-card text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Deployment & Auth</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-slate-700">
          {/* TAB 1: CHATGPT & MCP */}
          {activeTab === 'chatgpt' && (
            <div className="space-y-4">
              {/* EXACT MCP CLIENT SETUP GUIDE (Matches user screenshot) */}
              <div className="glass-surface p-4 sm:p-5 rounded-2xl space-y-3.5 border border-rose-200/80 bg-rose-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                      ⚙
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">
                      How to Fill Your MCP Client Screen
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    Match Your Screen Exactly
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Field 1: URL */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-700">
                      <span>1. URL Field:</span>
                      <button
                        onClick={() => copyToClipboard(mcpUrl, 'mcpUrl')}
                        className="text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedField === 'mcpUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'mcpUrl' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-900 break-all select-all font-semibold">
                      {mcpUrl}
                    </div>
                    <p className="text-[10px] font-sans text-slate-500">
                      (Note: <code>{chatgptOpenApiUrl}</code> is also accepted if your client uses OpenAPI)
                    </p>
                  </div>

                  {/* Field 2: Bearer token env var */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-sans font-bold text-slate-700">
                      2. Bearer token env var Field:
                    </div>
                    <div className="bg-slate-100/80 p-2 rounded-xl text-slate-500 italic font-sans text-[11px]">
                      Leave this field <strong>empty</strong> (or type <code>DOCMAIL_API_KEY</code> if required).
                    </div>
                  </div>

                  {/* Field 3: Headers */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-sans font-bold text-slate-700">
                      3. Headers Field:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-sans text-slate-400 block">Header Key:</span>
                        <code className="text-slate-900 font-bold">Authorization</code>{' '}
                        <span className="text-[10px] font-sans text-slate-500">(or <code className="font-bold">key</code> or <code className="font-bold">x-api-key</code>)</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-sans text-slate-400 block">Header Value:</span>
                        <code className="text-slate-900 font-bold">Bearer &lt;your_token&gt;</code>{' '}
                        <span className="text-[10px] font-sans text-slate-500">(or raw token)</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-sans text-emerald-700 font-medium">
                      ✓ DocMail accepts <code className="font-bold">Authorization</code>, <code className="font-bold">key</code>, or <code className="font-bold">x-api-key</code>. All formats work seamlessly.
                    </p>
                  </div>
                </div>
              </div>

              {/* GENERATE NEW TOKEN FORM */}
              <div className="glass-inset p-4 rounded-2xl space-y-3 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Key className="w-4 h-4 text-amber-500" />
                    <span>Generate New Access Token</span>
                  </span>
                </div>

                <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Token label (e.g. ChatGPT MCP, Cursor, Claude)"
                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingKey}
                    className="rose-glow-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isCreatingKey ? 'Generating...' : 'Generate'}</span>
                  </button>
                </form>

                {/* Newly Generated Raw Key Display */}
                {newlyCreatedKey && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span>✓ New Token Generated (Copy now):</span>
                      <button
                        onClick={() => copyToClipboard(newlyCreatedKey, 'newKey')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        {copiedField === 'newKey' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'newKey' ? 'Copied' : 'Copy Token'}</span>
                      </button>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200 font-mono text-xs text-slate-900 break-all select-all font-bold shadow-inner">
                      {newlyCreatedKey}
                    </div>
                    <p className="text-[10px] text-emerald-700 leading-relaxed font-sans">
                      Paste this token into the <strong>Headers</strong> field of your MCP client. For security, once this modal is closed, the full secret will be masked as shown below.
                    </p>
                  </div>
                )}
              </div>

              {/* ACTIVE GENERATED TOKENS LIST */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                      Generated Tokens ({apiKeys.length})
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      (Masked for security)
                    </span>
                  </div>
                  <button
                    onClick={loadApiKeys}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Refresh</span>
                  </button>
                </div>

                {deleteStatus && (
                  <div className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold animate-in fade-in duration-150">
                    {deleteStatus}
                  </div>
                )}

                {isLoadingKeys && apiKeys.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs">Loading active tokens...</div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    No tokens found. Click "Generate" above to create your first MCP token.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map((k) => (
                      <div
                        key={k.id}
                        className="bg-white/80 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:shadow-sm transition-all"
                      >
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">{k.name}</span>
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                              Active
                            </span>
                          </div>
                          {/* Masked Token display */}
                          <div className="font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded inline-block">
                            {k.maskedKey || `dd_live_${k.prefix || 'key'}_••••••••••••••••`}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Created: {new Date(k.createdAt).toLocaleDateString()}
                            {k.lastUsedAt && ` • Last used: ${new Date(k.lastUsedAt).toLocaleTimeString()}`}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteKey(k.id, k.name)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-500 bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                            title="Delete and permanently revoke this token"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ChatGPT Custom GPT Action Link */}
              <div className="glass-inset p-4 rounded-2xl space-y-2 border border-slate-100">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span>For ChatGPT Custom GPT Actions (OpenAPI Schema):</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={chatgptOpenApiUrl}
                    className="w-full bg-white border border-slate-200 p-2 rounded-xl font-mono text-[11px] text-slate-800"
                  />
                  <button
                    onClick={() => copyToClipboard(chatgptOpenApiUrl, 'openapi')}
                    className="rose-glow-btn px-3 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer flex-shrink-0"
                  >
                    {copiedField === 'openapi' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'openapi' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  If creating a Custom GPT under <strong>Explore GPTs &rarr; Create &rarr; Actions &rarr; Import from URL</strong>, paste this schema URL.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: WEBHOOKS */}
          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <div className="glass-inset p-4 rounded-2xl space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Your Production Webhook URL:</span>
                  <a
                    href="https://hpanel.hostinger.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-rose-600 hover:underline flex items-center space-x-1 text-[11px]"
                  >
                    <span>Open Mail Control Panel</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full bg-white/70 border border-white/80 p-2 rounded-xl font-mono text-[11px] text-slate-800"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                    className="rose-glow-btn px-3 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer flex-shrink-0"
                  >
                    {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'webhook' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="glass-card p-4 space-y-2.5">
                <h4 className="font-extrabold text-slate-900 text-xs">How to configure your Webhook:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 font-medium pl-1 leading-relaxed">
                  <li>In your Mail Control Panel, navigate to <strong>Emails &rarr; docdril.com &rarr; Webhooks</strong>.</li>
                  <li>Click <strong>Set up</strong>.</li>
                  <li>Paste the Webhook URL: <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px]">{webhookUrl}</code></li>
                  <li>Check the event triggers: <strong>message.received</strong> and <strong>message.sent</strong>.</li>
                  <li>Both <code className="font-bold">team@docdril.com</code> and <code className="font-bold">info@docdril.com</code> can route to this same webhook URL seamlessly.</li>
                </ol>
              </div>

              <div className="glass-inset p-3 rounded-xl flex items-center space-x-2 text-emerald-700 font-semibold text-[11px]">
                <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>DocMail's webhook receiver includes automatic HMAC SHA-256 validation and idempotent delivery defense.</span>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL & AUTH */}
          {activeTab === 'deployment' && (
            <div className="space-y-4">
              <div className="glass-card p-4 space-y-2.5">
                <h4 className="font-extrabold text-slate-900 text-xs">Vercel Production Environment Variables</h4>
                <p className="text-[11px] text-slate-500">
                  When importing this project into Vercel for <strong>docmail.docdril.com</strong>, add these variables:
                </p>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="glass-inset p-2.5 rounded-xl flex items-center justify-between">
                    <span>HOSTINGER_MAIL_API_TOKEN</span>
                    <span className="text-slate-500 text-[10px]">35896e7a... (Embedded Server-Side)</span>
                  </div>
                  <div className="glass-inset p-2.5 rounded-xl flex items-center justify-between">
                    <span>GOOGLE_CLIENT_ID</span>
                    <span className="text-slate-500 text-[10px]">From Google Cloud Console</span>
                  </div>
                  <div className="glass-inset p-2.5 rounded-xl flex items-center justify-between">
                    <span>GOOGLE_CLIENT_SECRET</span>
                    <span className="text-slate-500 text-[10px]">From Google Cloud Console</span>
                  </div>
                  <div className="glass-inset p-2.5 rounded-xl flex items-center justify-between">
                    <span>ALLOWED_DOMAINS</span>
                    <span className="text-emerald-600 font-bold">docdril.com</span>
                  </div>
                </div>
              </div>

              {currentUser && (
                <div className="glass-inset p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-xs">
                      {currentUser.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                    </div>
                  </div>
                  <a
                    href="/api/auth/logout"
                    className="glass-card px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    Sign Out
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
