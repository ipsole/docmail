'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Plus, Tag, Copy } from 'lucide-react';
import { DocdrilTemplate } from '@/types';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocdrilTemplate[]>([]);

  useEffect(() => {
    fetch('/api/v1/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setTemplates(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans p-4 space-y-4 select-none">
      <header className="glass-surface px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inbox</span>
          </Link>
          <div className="h-4 w-px bg-white/60" />
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center shadow-[0_0_12px_rgba(244,114,182,0.5)]">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="font-extrabold text-sm text-slate-900 tracking-tight">DocMail Email Templates</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full space-y-4">
        {templates.length === 0 ? (
          <div className="glass-surface p-12 text-center space-y-3 my-8 max-w-md mx-auto">
            <div className="w-16 h-16 glass-inset rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
              <FileText className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-900">No Templates Saved</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Saved email templates will show up here for fast insertion during composing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{tpl.title}</h2>
                    <div className="text-xs text-slate-500 mt-0.5">Subject: {tpl.subject}</div>
                  </div>
                  <span className="text-[10px] glass-inset text-slate-700 font-bold px-2.5 py-0.5 rounded-full capitalize">
                    {tpl.category}
                  </span>
                </div>

                <div className="glass-inset p-3 rounded-xl text-xs text-slate-700 font-sans leading-relaxed border border-white/60">
                  {tpl.bodyText || tpl.bodyHtml.replace(/<[^>]*>?/gm, '')}
                </div>

                {tpl.variables && tpl.variables.length > 0 && (
                  <div className="pt-2 border-t border-white/60 flex items-center space-x-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold">Variables:</span>
                    {tpl.variables.map((v) => (
                      <code key={v} className="bg-pink-100/60 text-pink-700 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
