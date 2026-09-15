'use client';

import React, { useState } from 'react';
import { X, Webhook, Bot, Shield, Check, Copy, ExternalLink, Globe, Sparkles, Key } from 'lucide-react';

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

  if (!isOpen) return null;

  const webhookUrl = 'https://docmail.docdril.com/api/v1/webhooks/hostinger';
  const chatgptOpenApiUrl = 'https://docmail.docdril.com/api/v1/openapi.json';
  const mcpUrl = 'https://docmail.docdril.com/api/v1/mcp';
  const apiKey = 'dd_live_crm_service_key';

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        'docmail-service': {
          url: 'https://docmail.docdril.com/api/v1/mcp',
          headers: {
            Authorization: 'Bearer dd_live_crm_service_key',
          },
        },
      },
    },
    null,
    2
  );

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md select-none">
      <div className="glass-surface w-full max-w-2xl p-6 sm:p-8 space-y-6 relative shadow-2xl bg-white/85 max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 glass-card rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-white shadow-[0_0_16px_rgba(244,114,182,0.6)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              DocMail Gateway & AI Integrations
            </h2>
            <p className="text-xs text-slate-500">
              Connect ChatGPT, Claude MCP, inboxes, and docmail.docdril.com ecosystem
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
              {/* ChatGPT Custom GPT Action Link */}
              <div className="glass-inset p-4 rounded-2xl space-y-2 border border-rose-100">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span>ChatGPT Custom GPT Action (OpenAPI Schema URL):</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active & Ready
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={chatgptOpenApiUrl}
                    className="w-full bg-white/80 border border-white/80 p-2 rounded-xl font-mono text-[11px] text-slate-800"
                  />
                  <button
                    onClick={() => copyToClipboard(chatgptOpenApiUrl, 'openapi')}
                    className="rose-glow-btn px-3 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer flex-shrink-0"
                  >
                    {copiedField === 'openapi' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'openapi' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Paste this URL directly into ChatGPT under <strong>Configure &rarr; Actions &rarr; Import from URL</strong>.
                </p>
              </div>

              {/* API Key */}
              <div className="glass-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Key className="w-4 h-4 text-amber-500" />
                    <span>Your Bearer API Key for ChatGPT / Claude:</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(apiKey, 'apikey')}
                    className="glass-card px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedField === 'apikey' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'apikey' ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
                <div className="font-mono bg-slate-100 p-2 rounded-xl text-slate-800 text-[11px] font-semibold select-all">
                  {apiKey}
                </div>
              </div>

              {/* Step-by-Step Guide for ChatGPT */}
              <div className="glass-surface p-4 space-y-2.5 bg-white/90 border border-white/80">
                <h4 className="font-extrabold text-slate-900 text-xs">How to connect with ChatGPT in 30 seconds:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 font-medium pl-1 leading-relaxed">
                  <li>Open <strong>ChatGPT</strong> &rarr; Click <strong>Explore GPTs</strong> &rarr; Click <strong>+ Create</strong>.</li>
                  <li>In the <strong>Configure</strong> tab, scroll down and click <strong>Create new action</strong>.</li>
                  <li>Click <strong>Import from URL</strong> and paste: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600">{chatgptOpenApiUrl}</code></li>
                  <li>Under <strong>Authentication</strong>, select <strong>API Key</strong> &rarr; Auth Type: <strong>Bearer</strong> &rarr; paste the key above.</li>
                  <li>Done! ChatGPT now has full abilities to search threads, read emails, draft replies, manage contacts, and apply templates.</li>
                </ol>
              </div>

              {/* MCP Protocol Endpoint */}
              <div className="glass-inset p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Claude & Desktop MCP Server Endpoint</span>
                  <button
                    onClick={() => copyToClipboard(mcpUrl, 'mcp')}
                    className="glass-card px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedField === 'mcp' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'mcp' ? 'Copied' : 'Copy Endpoint'}</span>
                  </button>
                </div>
                <div className="font-mono bg-white/80 p-2 rounded-xl text-slate-800 text-[11px]">
                  {mcpUrl}
                </div>
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
