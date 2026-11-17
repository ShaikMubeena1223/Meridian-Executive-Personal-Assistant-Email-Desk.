import { Loader2, Plus, Search, Sparkles } from 'lucide-react';
import type { EmailThread, UserRole } from '../types/mailbox.ts';
import {
  formatRelativeTime,
  getPriorityTextClass,
  getResponsibilityDisplay
} from '../utils/responsibilityMeta.ts';

interface ThreadListPaneProps {
  role: UserRole;
  threads: EmailThread[];
  activeThreadId: string | null;
  searchQuery: string;
  untriagedCount: number;
  isTriagingAll: boolean;
  isLoading: boolean;
  onSearchChange: (q: string) => void;
  onSelectThread: (id: string) => void;
  onTriageAll: () => Promise<void>;
  onOpenIngest: () => void;
}

export function ThreadListPane({
  role,
  threads,
  activeThreadId,
  searchQuery,
  untriagedCount,
  isTriagingAll,
  isLoading,
  onSearchChange,
  onSelectThread,
  onTriageAll,
  onOpenIngest
}: ThreadListPaneProps) {
  return (
    <section
      aria-label="Email Threads"
      className="w-full md:w-[356px] shrink-0 border-r border-slate-200 bg-white flex flex-col min-h-0"
    >
      <div className="p-3.5 border-b border-slate-200 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sender, subject, or summary..."
            aria-label="Search email threads"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-700 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
          </span>

          <div className="flex items-center gap-2">
            {role === 'assistant' && untriagedCount > 0 && (
              <button
                type="button"
                onClick={() => void onTriageAll()}
                disabled={isTriagingAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                {isTriagingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>
                  {isTriagingAll
                    ? 'Triaging...'
                    : `Auto-Triage (${untriagedCount})`}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenIngest}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Email</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 animate-pulse space-y-2"
              >
                <div className="h-3.5 w-2/3 bg-slate-200 rounded" />
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              {role === 'client'
                ? 'Nothing waiting on your decision'
                : 'No threads in this queue'}
            </p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {role === 'client'
                ? 'Your Personal Assistant is handling routine threads. Switch to "All Threads" or simulate a new email to test.'
                : 'Try adjusting your search or filter, or simulate an incoming email.'}
            </p>
          </div>
        ) : (
          threads.map((thread) => {
            const selected = thread.id === activeThreadId;
            const resp = getResponsibilityDisplay(thread.responsibility);

            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={`w-full text-left px-4 py-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-blue-700 ${
                  selected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={`truncate ${
                      thread.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                    }`}
                  >
                    {thread.participantName}
                    <span className="font-normal text-slate-500"> · {thread.participantOrg}</span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-400 shrink-0">
                    {formatRelativeTime(thread.lastUpdatedAt)}
                  </span>
                </div>

                <p
                  className={`mt-1 text-sm leading-snug line-clamp-1 ${
                    thread.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'
                  }`}
                >
                  {thread.subject}
                </p>

                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {thread.aiSummary || thread.messages[thread.messages.length - 1]?.body}
                </p>

                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className={`font-semibold ${resp.textClass}`}>{resp.shortLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className={getPriorityTextClass(thread.priority)}>{thread.priority}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{thread.category}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
