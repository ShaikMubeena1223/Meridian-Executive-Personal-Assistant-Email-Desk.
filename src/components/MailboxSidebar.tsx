import { SlidersHorizontal, X } from 'lucide-react';
import type {
  ClientCharter,
  EmailCategory,
  EmailThread,
  ResponsibilityOwner,
  UserRole
} from '../types/mailbox.ts';

export type QueueFilter =
  | 'all'
  | 'client_attention'
  | 'handled_by_pa'
  | ResponsibilityOwner;

interface MailboxSidebarProps {
  role: UserRole;
  charter: ClientCharter;
  threads: EmailThread[];
  activeQueue: QueueFilter;
  activeCategory: 'All' | EmailCategory;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onRoleChange: (role: UserRole) => void;
  onQueueChange: (q: QueueFilter) => void;
  onCategoryChange: (c: 'All' | EmailCategory) => void;
  onOpenCharter: () => void;
}

const CATEGORIES: Array<'All' | EmailCategory> = [
  'All',
  'Board & Investors',
  'Deals & Partners',
  'Legal & Finance',
  'Scheduling & Travel',
  'Operations'
];

export function MailboxSidebar({
  role,
  charter,
  threads,
  activeQueue,
  activeCategory,
  mobileOpen,
  onCloseMobile,
  onRoleChange,
  onQueueChange,
  onCategoryChange,
  onOpenCharter
}: MailboxSidebarProps) {
  const countBy = (fn: (t: EmailThread) => boolean) => threads.filter(fn).length;

  const assistantQueues: Array<{ id: QueueFilter; label: string; count: number }> = [
    { id: 'all', label: 'All Inbox Threads', count: threads.length },
    {
      id: 'needs_triage',
      label: 'Needs Triage',
      count: countBy((t) => t.responsibility === 'needs_triage')
    },
    {
      id: 'assistant_handle',
      label: 'Assistant Owns',
      count: countBy((t) => t.responsibility === 'assistant_handle')
    },
    {
      id: 'ready_for_client_approval',
      label: 'Ready for Approval',
      count: countBy((t) => t.responsibility === 'ready_for_client_approval')
    },
    {
      id: 'needs_client_decision',
      label: 'Needs Client Input',
      count: countBy((t) => t.responsibility === 'needs_client_decision')
    },
    {
      id: 'waiting_external',
      label: 'Waiting External',
      count: countBy((t) => t.responsibility === 'waiting_external')
    },
    {
      id: 'resolved',
      label: 'Resolved',
      count: countBy((t) => t.responsibility === 'resolved')
    }
  ];

  const clientQueues: Array<{ id: QueueFilter; label: string; count: number }> = [
    {
      id: 'client_attention',
      label: 'Needs My Input',
      count: countBy(
        (t) =>
          t.responsibility === 'needs_client_decision' ||
          t.responsibility === 'ready_for_client_approval'
      )
    },
    {
      id: 'handled_by_pa',
      label: 'Handled by Assistant',
      count: countBy(
        (t) =>
          t.responsibility === 'assistant_handle' ||
          t.responsibility === 'waiting_external' ||
          t.responsibility === 'resolved'
      )
    },
    { id: 'all', label: 'All Threads', count: threads.length }
  ];

  const visibleQueues = role === 'assistant' ? assistantQueues : clientQueues;

  const sidebarBody = (
    <div className="flex h-full flex-col bg-slate-50/70 border-r border-slate-200">
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 bg-white">
        <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Meridian
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 border-b border-slate-200 bg-white space-y-2.5">
        <div className="text-xs font-medium text-slate-500">Active Workspace View</div>
        <div
          className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg"
          role="tablist"
          aria-label="Switch perspective between Personal Assistant and Client"
        >
          <button
            type="button"
            role="tab"
            aria-selected={role === 'assistant'}
            onClick={() => onRoleChange('assistant')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              role === 'assistant'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assistant
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'client'}
            onClick={() => onRoleChange('client')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              role === 'client'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Client
          </button>
        </div>
        <p className="text-xs text-slate-500 leading-snug">
          {role === 'assistant'
            ? `Triaging for ${charter.clientName} as ${charter.assistantName}`
            : `Executive brief for ${charter.clientName}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <section aria-label="Responsibility Queues">
          <div className="px-2.5 mb-2 text-xs font-semibold text-slate-500">
            Reply Ownership
          </div>
          <nav className="space-y-0.5">
            {visibleQueues.map((q) => {
              const active = activeQueue === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    onQueueChange(q.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white text-blue-700 font-semibold border border-slate-200 shadow-2xs'
                      : 'text-slate-700 hover:bg-white/80 hover:text-slate-900 font-medium border border-transparent'
                  }`}
                >
                  <span className="truncate">{q.label}</span>
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      active ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  >
                    {q.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </section>

        <section aria-label="Categories">
          <div className="px-2.5 mb-2 text-xs font-semibold text-slate-500">
            Categories
          </div>
          <nav className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              const count =
                cat === 'All'
                  ? threads.length
                  : threads.filter((t) => t.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onCategoryChange(cat);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-slate-200/70 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  <span className="font-mono tabular-nums text-slate-400">{count}</span>
                </button>
              );
            })}
          </nav>
        </section>
      </div>

      <div className="p-3 border-t border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => {
            onOpenCharter();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Delegation Charter</span>
          </span>
          <span className="font-mono tabular-nums text-slate-500">
            ${charter.spendLimitUsd.toLocaleString()}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[252px] shrink-0 h-screen sticky top-0">
        {sidebarBody}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/30"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-[272px] max-w-[85vw] h-full bg-white shadow-xl">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
}
