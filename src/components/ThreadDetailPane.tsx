import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  Send,
  Sparkles,
  Trash2,
  UserCheck
} from 'lucide-react';
import type {
  ClientCharter,
  DraftTone,
  EmailThread,
  ResponsibilityOwner,
  UserRole
} from '../types/mailbox.ts';
import {
  formatShortDateTime,
  getPriorityTextClass,
  getResponsibilityDisplay
} from '../utils/responsibilityMeta.ts';

interface ThreadDetailPaneProps {
  role: UserRole;
  charter: ClientCharter;
  thread: EmailThread;
  isAnalyzing: boolean;
  isDrafting: boolean;
  isSending: boolean;
  onBackMobile: () => void;
  onAnalyze: (id: string) => Promise<void>;
  onDraft: (id: string, tone: DraftTone, instruction: string) => Promise<void>;
  onUpdateThread: (id: string, patch: Partial<EmailThread>) => Promise<void>;
  onAddNote: (
    id: string,
    content: string,
    nextResponsibility?: ResponsibilityOwner
  ) => Promise<void>;
  onSendReply: (id: string, body: string, markResolved: boolean) => Promise<void>;
  onDeleteThread: (id: string) => Promise<void>;
}

const RESPONSIBILITY_OPTIONS: Array<{ value: ResponsibilityOwner; label: string }> = [
  { value: 'needs_triage', label: 'Needs Triage' },
  { value: 'assistant_handle', label: 'Assistant Handles' },
  { value: 'ready_for_client_approval', label: 'Ready for Client Approval' },
  { value: 'needs_client_decision', label: 'Needs Client Decision' },
  { value: 'waiting_external', label: 'Waiting on External Reply' },
  { value: 'resolved', label: 'Resolved' }
];

const TONE_OPTIONS: DraftTone[] = [
  'Executive Crisp',
  'Warm & Diplomatic',
  'Direct Decline',
  'Schedule Coordination'
];

export function ThreadDetailPane({
  role,
  charter,
  thread,
  isAnalyzing,
  isDrafting,
  isSending,
  onBackMobile,
  onAnalyze,
  onDraft,
  onUpdateThread,
  onAddNote,
  onSendReply,
  onDeleteThread
}: ThreadDetailPaneProps) {
  const [draftText, setDraftText] = useState(thread.draftReply);
  const [selectedTone, setSelectedTone] = useState<DraftTone>(
    thread.draftTone || charter.preferredTone
  );
  const [draftInstruction, setDraftInstruction] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [markResolvedOnSend, setMarkResolvedOnSend] = useState(false);

  useEffect(() => {
    setDraftText(thread.draftReply);
    setSelectedTone(thread.draftTone || charter.preferredTone);
    setDraftInstruction('');
  }, [thread.id, thread.draftReply, thread.draftTone, charter.preferredTone]);

  const respDisplay = getResponsibilityDisplay(thread.responsibility);

  const handleNoteSubmit = async (
    e: FormEvent,
    overrideResponsibility?: ResponsibilityOwner
  ) => {
    e.preventDefault();
    if (!noteInput.trim() || savingNote) return;
    setSavingNote(true);
    try {
      await onAddNote(thread.id, noteInput.trim(), overrideResponsibility);
      setNoteInput('');
    } finally {
      setSavingNote(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!draftText.trim()) return;
    await onUpdateThread(thread.id, {
      draftReply: draftText,
      draftTone: selectedTone,
      responsibility: 'ready_for_client_approval'
    });
  };

  const handleSend = async () => {
    if (!draftText.trim() || isSending) return;
    await onSendReply(thread.id, draftText, markResolvedOnSend);
  };

  return (
    <div className="flex-1 min-w-0 bg-white overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <header className="pb-5 border-b border-slate-200">
          <div className="flex items-center justify-between gap-3 mb-3">
            <button
              type="button"
              onClick={onBackMobile}
              className="md:hidden inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Threads</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`font-semibold ${respDisplay.textClass}`}>
                {respDisplay.label}
              </span>
              <span aria-hidden="true">·</span>
              <span className={getPriorityTextClass(thread.priority)}>{thread.priority} priority</span>
              <span aria-hidden="true">·</span>
              <span>{thread.category}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void onAnalyze(thread.id)}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                )}
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}</span>
              </button>

              <button
                type="button"
                onClick={() => void onDeleteThread(thread.id)}
                aria-label="Delete thread"
                title="Delete thread"
                className="p-1.5 text-slate-400 hover:text-red-700 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 text-balance">
            {thread.subject}
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{thread.participantName}</span>
              <span> · {thread.participantOrg}</span>
              <span className="font-mono text-slate-500"> &lt;{thread.participantEmail}&gt;</span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="resp-select" className="text-xs text-slate-500 whitespace-nowrap">
                Owner:
              </label>
              <select
                id="resp-select"
                value={thread.responsibility}
                onChange={(e) =>
                  void onUpdateThread(thread.id, {
                    responsibility: e.target.value as ResponsibilityOwner
                  })
                }
                className="px-2.5 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-700"
              >
                {RESPONSIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <section
          aria-label="AI Conversation Understanding"
          className="p-4 rounded-lg border border-slate-200 bg-slate-50/80 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-slate-900">
              Conversation Brief & Reply Responsibility
            </h2>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              {thread.messages.length} {thread.messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            {thread.aiSummary || 'Run "Analyze with AI" to generate a conversation brief and classify ownership.'}
          </p>

          {thread.responsibilityReason && (
            <p className="text-xs text-slate-600 pt-2 border-t border-slate-200/80">
              <span className="font-semibold text-slate-800">Why this owner: </span>
              {thread.responsibilityReason}
            </p>
          )}

          {thread.extractedActionItems.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80">
              <p className="text-xs font-semibold text-slate-800 mb-1.5">
                Key Commitments & Open Points
              </p>
              <ul className="space-y-1">
                {thread.extractedActionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section aria-label="Email Conversation History" className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500">Email Thread</h2>
          <div className="space-y-3">
            {thread.messages.map((msg) => {
              const isExternal = msg.senderRole === 'external';
              return (
                <article
                  key={msg.id}
                  className={`p-4 rounded-lg border ${
                    isExternal
                      ? 'border-slate-200 bg-white'
                      : 'border-blue-200/80 bg-blue-50/30'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900">{msg.senderName}</span>
                      <span className="font-mono text-slate-500 ml-1.5">
                        &lt;{msg.senderEmail}&gt;
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      {formatShortDateTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {msg.body}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          aria-label="Internal Assistant and Client Collaboration"
          className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Internal Coordination ({charter.assistantName} ↔ {charter.clientName})</span>
            </div>
            <span className="text-[11px] text-slate-500">Never sent externally</span>
          </div>

          {thread.internalNotes.length > 0 ? (
            <div className="space-y-2">
              {thread.internalNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-md border border-slate-200 bg-white text-sm"
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <span className="font-semibold text-slate-900">
                      {note.authorName}{' '}
                      <span className="font-normal text-slate-500">
                        ({note.authorRole === 'assistant' ? 'Personal Assistant' : 'Client'})
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {formatShortDateTime(note.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No internal hand-off notes yet. Leave guidance or escalate a question below.
            </p>
          )}

          <form onSubmit={(e) => void handleNoteSubmit(e)} className="space-y-2 pt-1">
            <textarea
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder={
                role === 'assistant'
                  ? `Add a private note for ${charter.clientName} (e.g., calendar check, options, or recommendation)...`
                  : `Send private instructions to ${charter.assistantName}...`
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 resize-none"
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {role === 'assistant' ? (
                <>
                  <button
                    type="submit"
                    disabled={savingNote || !noteInput.trim()}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    Save Internal Note
                  </button>
                  <button
                    type="button"
                    disabled={savingNote || !noteInput.trim()}
                    onClick={(e) => void handleNoteSubmit(e, 'needs_client_decision')}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    Escalate to Client
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={savingNote || !noteInput.trim()}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    Add Note
                  </button>
                  <button
                    type="button"
                    disabled={savingNote || !noteInput.trim()}
                    onClick={(e) => void handleNoteSubmit(e, 'assistant_handle')}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    Delegate Back to Assistant
                  </button>
                </>
              )}
            </div>
          </form>
        </section>

        <section
          aria-label="Reply Composer"
          className="p-5 rounded-lg border border-slate-200 bg-white space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {role === 'client'
                  ? 'Proposed Reply & Final Approval'
                  : `Draft Reply to ${thread.participantName}`}
              </h2>
              <p className="text-xs text-slate-500">
                {role === 'client'
                  ? 'Review, edit if needed, and approve to send immediately.'
                  : 'Generate a contextual draft with AI, refine it, then send or request client approval.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Reply Tone"
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value as DraftTone)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-700"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void onDraft(thread.id, selectedTone, draftInstruction)}
                disabled={isDrafting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                {isDrafting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isDrafting ? 'Drafting...' : 'Draft with AI'}</span>
              </button>
            </div>
          </div>

          <input
            type="text"
            value={draftInstruction}
            onChange={(e) => setDraftInstruction(e.target.value)}
            placeholder="Optional AI direction (e.g., 'Counter with 1-year renewal at +4% max' or 'Confirm 6:30 PM 1:1')"
            aria-label="Optional AI drafting instruction"
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-700"
          />

          <textarea
            rows={7}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Write a reply or click 'Draft with AI' to synthesize from the conversation and internal notes..."
            aria-label="Email reply draft"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={markResolvedOnSend}
                onChange={(e) => setMarkResolvedOnSend(e.target.checked)}
                className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
              />
              <span>Mark thread Resolved after sending (otherwise Waiting External)</span>
            </label>

            <div className="flex flex-wrap items-center gap-2.5">
              {role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => void handleRequestApproval()}
                  disabled={!draftText.trim() || isSending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Send to Client for Approval</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!draftText.trim() || isSending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {role === 'client' ? 'Approve & Send Reply' : 'Send on Client’s Behalf'}
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
