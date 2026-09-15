'use client';

import React, { useState } from 'react';
import { X, Webhook, Bot, Shield, Check, Copy, ExternalLink, Globe, Key } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'webhooks' | 'mcp' | 'deployment'>('webhooks');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const webhookUrl = 'https://docmail.docdril.com/api/v1/webhooks/hostinger';
  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        'hostinger-mail': {
          command: 'npx',
          args: ['-y', '@hostinger/mail-mcp-server'],
          env: {
            HOSTINGER_API_TOKEN: '35896e7a96cd8cb8a66e1a1ece92df977d33047bf1102cfb747618598372059b',
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
      <div className="glass-surface w-full max-w-2xl p-6 sm:p-8 space-y-6 relative shadow-2xl bg-white/80 max-h-[90vh] flex flex-col">
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
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Agentic Mail & Infrastructure Settings
            </h2>
            <p className="text-xs text-slate-500">
              Hostinger Webhooks, MCP AI Server, and docmail.docdril.com configuration
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-white/60 pb-2">
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'webhooks'
                ? 'obsidian-card shadow-md'
                : 'glass-card text-slate-600 hover:text-slate-900'
            }`}
          >
            <Webhook className="w-3.5 h-3.5 text-rose-400" />
            <span>1. Hostinger Webhook</span>
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'mcp'
                ? 'obsidian-card shadow-md'
                : 'glass-card text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-pink-400" />
            <span>2. MCP Server (AI)</span>
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
            <span>3. Vercel & Auth</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-slate-700">
          {/* TAB 1: WEBHOOKS */}
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
                    <span>Open Hostinger hPanel</span>
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
                    className="rose-glow-btn px-3 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'webhook' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="glass-card p-4 space-y-2.5">
                <h4 className="font-extrabold text-slate-900 text-xs">How to configure inside Hostinger hPanel:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 font-medium pl-1 leading-relaxed">
                  <li>In your Hostinger hPanel, navigate to <strong>Emails &rarr; docdril.com &rarr; Agentic mail &rarr; Webhooks</strong>.</li>
                  <li>Click <strong>Set up</strong>.</li>
                  <li>Paste the Webhook URL: <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px]">{webhookUrl}</code></li>
                  <li>Check the event triggers: <strong>message.received</strong> and <strong>message.sent</strong>.</li>
                  <li>Save the webhook. If Hostinger generates a Webhook Secret, copy it and add it as <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px]">HOSTINGER_WEBHOOK_SECRET</code> in Vercel.</li>
                </ol>
              </div>

              <div className="glass-inset p-3 rounded-xl flex items-center space-x-2 text-emerald-700 font-semibold text-[11px]">
                <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>DocMail's webhook receiver includes automatic HMAC SHA-256 validation and idempotent delivery defense.</span>
              </div>
            </div>
          )}

          {/* TAB 2: MCP SERVER */}
          {activeTab === 'mcp' && (
            <div className="space-y-4">
              <div className="glass-inset p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Model Context Protocol (MCP) Configuration</span>
                  <button
                    onClick={() => copyToClipboard(mcpConfigJson, 'mcp')}
                    className="rose-glow-btn px-3 py-1.5 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedField === 'mcp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'mcp' ? 'Copied JSON' : 'Copy JSON'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Add this to your <code className="font-mono bg-white/60 px-1 rounded">claude_desktop_config.json</code> or Cursor / Antigravity settings to let AI models directly read and draft emails on your Hostinger mailboxes:
                </p>
                <pre className="bg-zinc-900 text-zinc-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {mcpConfigJson}
                </pre>
              </div>

              <div className="glass-card p-4 space-y-2">
                <h4 className="font-bold text-slate-900">What MCP Enables For Docdril:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>Autonomous email reading, drafting, and thread triage directly from AI agents.</li>
                  <li>Zero-latency natural language inbox queries ("Find placement invites from universities").</li>
                  <li>Seamless multi-agent workflows integrated with your existing developer stack.</li>
                </ul>
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
