'use client';

import React, { useState } from 'react';
import { X, Key, CheckCircle, ExternalLink, ShieldCheck, Mail, Sparkles } from 'lucide-react';

interface ConnectMailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConnectMailboxModal: React.FC<ConnectMailboxModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token.trim()) {
      setError('Please paste your Hostinger Mail API Bearer Token.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate token with Hostinger');
      }

      setSuccessMessage(data.message || 'Connected successfully! Syncing live emails...');
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Connection failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
      <div className="glass-surface w-full max-w-lg p-6 sm:p-8 space-y-6 relative shadow-2xl bg-white/75">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 glass-card rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-white shadow-[0_0_16px_rgba(244,114,182,0.6)]">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Connect Your Mail Account
            </h2>
            <p className="text-xs text-slate-500">
              Link your live business mailbox directly into DocMail
            </p>
          </div>
        </div>

        {/* Step-by-step guidance */}
        <div className="glass-inset p-4 rounded-2xl space-y-2 text-xs text-slate-700 leading-relaxed">
          <div className="font-bold text-slate-900 flex items-center space-x-1.5 mb-1">
            <Key className="w-3.5 h-3.5 text-rose-500" />
            <span>How to generate your token in 30 seconds:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 font-medium">
            <li>
              Log into your{' '}
              <a
                href="https://hpanel.hostinger.com"
                target="_blank"
                rel="noreferrer"
                className="text-rose-600 font-bold underline hover:text-rose-700 inline-flex items-center"
              >
                Mail Control Panel <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </li>
            <li>Go to <strong>Emails</strong> &rarr; Select your domain &rarr; <strong>API / Developer</strong></li>
            <li>Create an API Token with Mailbox permissions</li>
            <li>Paste your Bearer token below</li>
          </ol>
        </div>

        {/* Status Banners */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Mail API Bearer Token
            </label>
            <div className="glass-inset px-4 py-3 rounded-2xl flex items-center focus-within:bg-white/80 transition-all">
              <input
                type="password"
                required
                placeholder="Paste Bearer token (e.g. eyJhbGci...)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 focus:outline-none placeholder-slate-400 font-mono font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center space-x-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Token is encrypted with AES-256-GCM and stored exclusively server-side.</span>
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rose-glow-btn px-6 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-60 flex items-center space-x-2 cursor-pointer shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Verifying & Syncing...' : 'Connect & Sync Mailbox'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
