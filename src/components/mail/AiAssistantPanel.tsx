'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle, ArrowRight, X } from 'lucide-react';
import { DocdrilConversation } from '@/types';
import { AiSummaryResult, AiDraftResponse } from '@/services/ai/ai-communication.service';

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: DocdrilConversation | null;
  onApplyDraftToComposer: (draftText: string) => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  isOpen,
  onClose,
  conversation,
  onApplyDraftToComposer,
}) => {
  const [summary, setSummary] = useState<AiSummaryResult | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [draft, setDraft] = useState<AiDraftResponse | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  if (!isOpen || !conversation) return null;

  const messages = conversation.messages || [];
  const latestMessage = messages[messages.length - 1];

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const res = await fetch('/api/v1/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id }),
      });
      const data = await res.json();
      if (data.data) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleGenerateDraft = async (tone: 'professional' | 'concise' | 'empathetic') => {
    if (!latestMessage) return;
    setIsLoadingDraft(true);
    try {
      const res = await fetch('/api/v1/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: latestMessage.id, tone }),
      });
      const data = await res.json();
      if (data.data) {
        setDraft(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDraft(false);
    }
  };

  return (
    <aside aria-label="DocMail AI Assistant" className="w-80 flex flex-col h-full overflow-hidden select-none p-4 space-y-4">
      {/* Header Capsule */}
      <div className="glass-surface px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center shadow-[0_0_12px_rgba(244,114,182,0.5)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-extrabold text-xs text-slate-800 tracking-wider uppercase">
            DocMail AI
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 glass-card flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
        {/* Thread Insight Card */}
        <div className="glass-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">
              Thread Insight
            </span>
            <button
              onClick={handleGenerateSummary}
              disabled={isLoadingSummary}
              className="rose-glow-btn px-3 py-1 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {isLoadingSummary ? 'Analyzing...' : 'Summarize'}
            </button>
          </div>

          {summary ? (
            <div className="space-y-3">
              <p className="text-slate-700 leading-relaxed font-sans text-xs bg-white/40 p-3 rounded-xl border border-white/60">
                {summary.summary}
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <span className="glass-inset px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  {summary.priority} priority
                </span>
                <span className="glass-inset px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-600 capitalize">
                  {summary.sentiment}
                </span>
              </div>

              {summary.actionItems.length > 0 && (
                <div className="pt-2 border-t border-white/40 space-y-1.5">
                  <span className="font-bold text-slate-800 text-[10px] tracking-wider uppercase">
                    Action Items:
                  </span>
                  {summary.actionItems.map((action, i) => (
                    <div key={i} className="flex items-start space-x-2 text-slate-700 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              Click &quot;Summarize&quot; to distill thread history and highlight next actions.
            </p>
          )}
        </div>

        {/* Reply Drafting Card */}
        <div className="glass-surface p-4 space-y-3">
          <span className="font-bold text-slate-700 uppercase text-[10px] tracking-widest block">
            Smart Reply Generator
          </span>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleGenerateDraft('professional')}
              disabled={isLoadingDraft}
              className="glass-card py-2 text-[10px] font-bold text-slate-700 hover:text-rose-600 text-center uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              Pro
            </button>
            <button
              onClick={() => handleGenerateDraft('concise')}
              disabled={isLoadingDraft}
              className="glass-card py-2 text-[10px] font-bold text-slate-700 hover:text-rose-600 text-center uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              Concise
            </button>
            <button
              onClick={() => handleGenerateDraft('empathetic')}
              disabled={isLoadingDraft}
              className="glass-card py-2 text-[10px] font-bold text-slate-700 hover:text-rose-600 text-center uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              Warm
            </button>
          </div>

          {draft && (
            <div className="glass-inset p-3.5 rounded-2xl space-y-3 mt-2 border border-white/60">
              <p className="text-slate-800 font-sans text-xs whitespace-pre-line leading-relaxed">
                {draft.suggestedBodyText}
              </p>

              <button
                onClick={() => onApplyDraftToComposer(draft.suggestedBodyText)}
                className="obsidian-card w-full flex items-center justify-center space-x-1.5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                <span>Use in Composer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
