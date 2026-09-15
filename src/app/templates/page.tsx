'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Plus, Copy, Trash2, Check, X } from 'lucide-react';
import { DocdrilTemplate } from '@/types';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocdrilTemplate[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('business');
  const [bodyText, setBodyText] = useState('');
  const [variablesStr, setVariablesStr] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadTemplates = () => {
    fetch('/api/v1/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setTemplates(data.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !bodyText) return;

    const variables = variablesStr
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/v1/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          category,
          bodyText,
          variables,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setTitle('');
        setSubject('');
        setBodyText('');
        setVariablesStr('');
        loadTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/v1/templates?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyTemplateContent = (tpl: DocdrilTemplate) => {
    const text = tpl.bodyText || tpl.bodyHtml.replace(/<[^>]*>?/gm, '');
    navigator.clipboard.writeText(text);
    setCopiedId(tpl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans p-3 sm:p-4 space-y-4 select-none">
      {/* Header */}
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
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">DocMail Templates</h1>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="rose-glow-btn px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Template</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full space-y-4">
        {templates.length === 0 ? (
          <div className="glass-surface p-10 text-center space-y-3 my-8 max-w-md mx-auto">
            <div className="w-14 h-14 glass-inset rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-900">No Templates Saved</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Saved email templates appear here for fast one-click insertion when drafting messages.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="rose-glow-btn px-4 py-2 text-xs font-bold uppercase tracking-wider mt-2 inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Template</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="glass-card p-4 sm:p-5 space-y-3 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{tpl.title}</h2>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        Subject: <span className="text-slate-700">{tpl.subject}</span>
                      </div>
                    </div>
                    <span className="text-[10px] glass-inset text-slate-700 font-bold px-2.5 py-0.5 rounded-full capitalize">
                      {tpl.category}
                    </span>
                  </div>

                  <div className="glass-inset p-3 rounded-xl text-xs text-slate-700 font-sans leading-relaxed border border-white/60 line-clamp-4">
                    {tpl.bodyText || tpl.bodyHtml.replace(/<[^>]*>?/gm, '')}
                  </div>

                  {tpl.variables && tpl.variables.length > 0 && (
                    <div className="pt-2 border-t border-white/60 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-[10px]">Variables:</span>
                      {tpl.variables.map((v) => (
                        <code key={v} className="bg-pink-100/70 text-pink-800 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/60 flex items-center justify-between">
                  <button
                    onClick={() => copyTemplateContent(tpl)}
                    className="glass-card px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === tpl.id ? 'Copied' : 'Copy Content'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1.5 glass-card rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass-surface w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl border border-white/80 bg-white/90">
            <div className="flex items-center justify-between pb-2 border-b border-white/60">
              <h2 className="text-base font-extrabold text-slate-900">Create New Template</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 glass-card rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Template Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Intro"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="business">Business</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="check-in">Check-in</option>
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Subject Line</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up regarding {{project}}"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Template Body</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type template message body... Use {{variable_name}} for dynamic fields."
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Variables <span className="text-[10px] text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. first_name, company, project"
                  value={variablesStr}
                  onChange={(e) => setVariablesStr(e.target.value)}
                  className="w-full glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rose-glow-btn px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

