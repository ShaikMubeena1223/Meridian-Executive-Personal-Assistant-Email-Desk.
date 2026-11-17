import { useEffect, useMemo, useState } from 'react';
import { Menu, Mail, Plus, SlidersHorizontal } from 'lucide-react';
import type {
  ClientCharter,
  DraftTone,
  EmailCategory,
  EmailThread,
  IngestEmailPayload,
  ResponsibilityOwner,
  UserRole
} from './types/mailbox.ts';
import { MailboxSidebar, type QueueFilter } from './components/MailboxSidebar.tsx';
import { ThreadListPane } from './components/ThreadListPane.tsx';
import { ThreadDetailPane } from './components/ThreadDetailPane.tsx';
import { IncomingEmailModal } from './components/IncomingEmailModal.tsx';
import { CharterModal } from './components/CharterModal.tsx';

const DEFAULT_CHARTER: ClientCharter = {
  clientName: 'Elena Vance',
  clientTitle: 'Chief Executive Officer',
  assistantName: 'Marcus Chen',
  spendLimitUsd: 5000,
  preferredTone: 'Executive Crisp',
  schedulingWindow: 'Tue–Thu, 10:00 AM–4:30 PM PT',
  autoHandleRules: []
};

export default function App() {
  const [role, setRole] = useState<UserRole>('assistant');
  const [charter, setCharter] = useState<ClientCharter>(DEFAULT_CHARTER);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [activeQueue, setActiveQueue] = useState<QueueFilter>('all');
  const [activeCategory, setActiveCategory] = useState<'All' | EmailCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [isTriagingAll, setIsTriagingAll] = useState(false);
  const [isAnalyzingId, setIsAnalyzingId] = useState<string | null>(null);
  const [isDraftingId, setIsDraftingId] = useState<string | null>(null);
  const [isSendingId, setIsSendingId] = useState<string | null>(null);

  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [charterModalOpen, setCharterModalOpen] = useState(false);

  useEffect(() => {
    const loadMailbox = async () => {
      setIsLoading(true);
      setErrorBanner(null);
      try {
        const res = await fetch('/api/mailbox');
        const data = (await res.json()) as {
          charter?: ClientCharter;
          threads?: EmailThread[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || 'Failed to load mailbox');
        if (data.charter) setCharter(data.charter);
        const list = data.threads ?? [];
        setThreads(list);
        if (list[0]) setActiveThreadId(list[0].id);
      } catch (err) {
        setErrorBanner(err instanceof Error ? err.message : 'Unable to reach server');
      } finally {
        setIsLoading(false);
      }
    };
    void loadMailbox();
  }, []);

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    setActiveQueue(nextRole === 'client' ? 'client_attention' : 'all');
  };

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return threads.filter((t) => {
      let matchesQueue = true;
      if (activeQueue === 'client_attention') {
        matchesQueue =
          t.responsibility === 'needs_client_decision' ||
          t.responsibility === 'ready_for_client_approval';
      } else if (activeQueue === 'handled_by_pa') {
        matchesQueue =
          t.responsibility === 'assistant_handle' ||
          t.responsibility === 'waiting_external' ||
          t.responsibility === 'resolved';
      } else if (activeQueue !== 'all') {
        matchesQueue = t.responsibility === activeQueue;
      }

      const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
      const matchesSearch =
        !q ||
        t.subject.toLowerCase().includes(q) ||
        t.participantName.toLowerCase().includes(q) ||
        t.participantOrg.toLowerCase().includes(q) ||
        t.aiSummary.toLowerCase().includes(q);

      return matchesQueue && matchesCategory && matchesSearch;
    });
  }, [threads, activeQueue, activeCategory, searchQuery]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  const untriagedCount = useMemo(
    () => threads.filter((t) => t.responsibility === 'needs_triage').length,
    [threads]
  );

  const replaceThreadInState = (updated: EmailThread) => {
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setMobileDetailOpen(true);
    const target = threads.find((t) => t.id === id);
    if (target?.unread) {
      void handleUpdateThread(id, { unread: false });
    }
  };

  const handleTriageAll = async () => {
    setIsTriagingAll(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/emails/triage-pending', { method: 'POST' });
      const data = (await res.json()) as { threads?: EmailThread[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Auto-triage failed');
      if (data.threads) setThreads(data.threads);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Auto-triage failed');
    } finally {
      setIsTriagingAll(false);
    }
  };

  const handleAnalyze = async (id: string) => {
    setIsAnalyzingId(id);
    setErrorBanner(null);
    try {
      const res = await fetch(`/api/emails/${id}/analyze`, { method: 'POST' });
      const data = (await res.json()) as { thread?: EmailThread; error?: string };
      if (!res.ok || !data.thread) throw new Error(data.error || 'Analysis failed');
      replaceThreadInState(data.thread);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzingId(null);
    }
  };

  const handleDraft = async (id: string, tone: DraftTone, instruction: string) => {
    setIsDraftingId(id);
    setErrorBanner(null);
    try {
      const res = await fetch(`/api/emails/${id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, instruction })
      });
      const data = (await res.json()) as { thread?: EmailThread; error?: string };
      if (!res.ok || !data.thread) throw new Error(data.error || 'Drafting failed');
      replaceThreadInState(data.thread);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Drafting failed');
    } finally {
      setIsDraftingId(null);
    }
  };

  const handleUpdateThread = async (id: string, patch: Partial<EmailThread>) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      const data = (await res.json()) as { thread?: EmailThread };
      if (res.ok && data.thread) replaceThreadInState(data.thread);
    } catch {
      // ignore transient error
    }
  };

  const handleAddNote = async (
    id: string,
    content: string,
    nextResponsibility?: ResponsibilityOwner
  ) => {
    setErrorBanner(null);
    try {
      const res = await fetch(`/api/emails/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorRole: role,
          content,
          nextResponsibility
        })
      });
      const data = (await res.json()) as { thread?: EmailThread; error?: string };
      if (!res.ok || !data.thread) throw new Error(data.error || 'Failed to save note');
      replaceThreadInState(data.thread);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to save note');
    }
  };

  const handleSendReply = async (id: string, body: string, markResolved: boolean) => {
    setIsSendingId(id);
    setErrorBanner(null);
    try {
      const res = await fetch(`/api/emails/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          sentByRole: role,
          markResolved
        })
      });
      const data = (await res.json()) as { thread?: EmailThread; error?: string };
      if (!res.ok || !data.thread) throw new Error(data.error || 'Failed to send reply');
      replaceThreadInState(data.thread);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setIsSendingId(null);
    }
  };

  const handleIngestEmail = async (payload: IngestEmailPayload) => {
    setIsIngesting(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/emails/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as { thread?: EmailThread; error?: string };
      if (!res.ok || !data.thread) throw new Error(data.error || 'Failed to ingest email');
      setThreads((prev) => [data.thread!, ...prev]);
      setActiveThreadId(data.thread.id);
      setActiveQueue('all');
      setActiveCategory('All');
      setMobileDetailOpen(true);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to ingest email');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteThread = async (id: string) => {
    try {
      const res = await fetch(`/api/emails/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (activeThreadId === id) {
          setActiveThreadId(next[0]?.id ?? null);
          setMobileDetailOpen(false);
        }
        return next;
      });
    } catch {
      // ignore
    }
  };

  const handleSaveCharter = async (nextCharter: ClientCharter) => {
    const res = await fetch('/api/mailbox/charter', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextCharter)
    });
    const data = (await res.json()) as { charter?: ClientCharter; error?: string };
    if (!res.ok || !data.charter) {
      setErrorBanner(data.error || 'Failed to update delegation charter');
      return;
    }
    setCharter(data.charter);
  };

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      <MailboxSidebar
        role={role}
        charter={charter}
        threads={threads}
        activeQueue={activeQueue}
        activeCategory={activeCategory}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onRoleChange={handleRoleChange}
        onQueueChange={setActiveQueue}
        onCategoryChange={setActiveCategory}
        onOpenCharter={() => setCharterModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="shrink-0 flex items-center justify-between gap-8 px-4 sm:px-6 h-14 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md"
            >
              <Menu className="w-4 h-4" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 whitespace-nowrap shrink-0">
                {role === 'assistant' ? 'Assistant Desk' : 'Client Brief'}
              </span>
              <span className="text-slate-300 shrink-0" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-slate-900 truncate">
                {activeThread ? activeThread.subject : 'Inbox'}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCharterModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Delegation Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setIngestModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Email</span>
            </button>
          </div>
        </header>

        {errorBanner && (
          <div
            role="alert"
            className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-xs text-red-900 flex items-center justify-between gap-4"
          >
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="font-semibold underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex-1 flex min-h-0">
          <div className={`${mobileDetailOpen ? 'hidden md:flex' : 'flex'} w-full md:w-auto min-h-0`}>
            <ThreadListPane
              role={role}
              threads={filteredThreads}
              activeThreadId={activeThreadId}
              searchQuery={searchQuery}
              untriagedCount={untriagedCount}
              isTriagingAll={isTriagingAll}
              isLoading={isLoading}
              onSearchChange={setSearchQuery}
              onSelectThread={handleSelectThread}
              onTriageAll={handleTriageAll}
              onOpenIngest={() => setIngestModalOpen(true)}
            />
          </div>

          <main
            className={`${
              mobileDetailOpen ? 'flex' : 'hidden md:flex'
            } flex-1 min-w-0 min-h-0 flex-col`}
          >
            {activeThread ? (
              <ThreadDetailPane
                role={role}
                charter={charter}
                thread={activeThread}
                isAnalyzing={isAnalyzingId === activeThread.id}
                isDrafting={isDraftingId === activeThread.id}
                isSending={isSendingId === activeThread.id}
                onBackMobile={() => setMobileDetailOpen(false)}
                onAnalyze={handleAnalyze}
                onDraft={handleDraft}
                onUpdateThread={handleUpdateThread}
                onAddNote={handleAddNote}
                onSendReply={handleSendReply}
                onDeleteThread={handleDeleteThread}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="max-w-sm">
                  <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-slate-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-slate-900">
                    Select an email thread
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Choose a conversation from the queue to inspect AI triage notes, reply ownership, and drafted responses.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <IncomingEmailModal
        isOpen={ingestModalOpen}
        isSubmitting={isIngesting}
        onClose={() => setIngestModalOpen(false)}
        onIngest={handleIngestEmail}
      />

      <CharterModal
        isOpen={charterModalOpen}
        charter={charter}
        onClose={() => setCharterModalOpen(false)}
        onSave={handleSaveCharter}
      />
    </div>
  );
}
