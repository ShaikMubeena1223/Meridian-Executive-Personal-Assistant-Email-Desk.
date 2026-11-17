import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  getMailboxState,
  getThreadById,
  saveThread,
  updateThreadFields,
  appendInternalNote,
  sendReplyMessage,
  updateClientCharter,
  deleteThread
} from './server/mailboxStore.ts';
import { analyzeEmailThread, generateDraftReply } from './server/mailboxAi.ts';
import type {
  ClientCharter,
  DraftTone,
  EmailThread,
  IngestEmailPayload,
  ResponsibilityOwner,
  UserRole
} from './src/types/mailbox.ts';

const PORT = 3001;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/mailbox', async (_req, res) => {
    try {
      const state = await getMailboxState();
      res.json(state);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to load mailbox'
      });
    }
  });

  app.put('/api/mailbox/charter', async (req, res) => {
    try {
      const charter = req.body as ClientCharter;
      if (!charter.clientName?.trim() || !charter.assistantName?.trim()) {
        res.status(400).json({ error: 'Client name and assistant name are required.' });
        return;
      }
      const saved = await updateClientCharter(charter);
      res.json({ charter: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to update charter'
      });
    }
  });

  app.post('/api/emails/ingest', async (req, res) => {
    try {
      const body = req.body as Partial<IngestEmailPayload>;
      if (!body.senderName?.trim() || !body.subject?.trim() || !body.body?.trim()) {
        res.status(400).json({ error: 'Sender name, subject, and message body are required.' });
        return;
      }

      const state = await getMailboxState();
      const now = new Date().toISOString();
      const newThread: EmailThread = {
        id: `thread-${Date.now().toString(36)}`,
        subject: body.subject.trim(),
        participantName: body.senderName.trim(),
        participantEmail: body.senderEmail?.trim() || 'contact@external.com',
        participantOrg: body.senderOrg?.trim() || 'External Sender',
        category: 'Operations',
        priority: 'Normal',
        responsibility: 'needs_triage',
        responsibilityReason: 'Analyzing incoming message...',
        aiSummary: '',
        extractedActionItems: [],
        messages: [
          {
            id: `msg-${Date.now().toString(36)}`,
            senderName: body.senderName.trim(),
            senderEmail: body.senderEmail?.trim() || 'contact@external.com',
            senderRole: 'external',
            timestamp: now,
            body: body.body.trim()
          }
        ],
        internalNotes: [],
        draftReply: '',
        draftTone: state.charter.preferredTone,
        lastUpdatedAt: now,
        unread: true
      };

      const analysis = await analyzeEmailThread(newThread, state.charter);
      newThread.category = analysis.category;
      newThread.priority = analysis.priority;
      newThread.responsibility = analysis.responsibility;
      newThread.responsibilityReason = analysis.responsibilityReason;
      newThread.aiSummary = analysis.aiSummary;
      newThread.extractedActionItems = analysis.extractedActionItems;

      await saveThread(newThread);
      res.status(201).json({ thread: newThread });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to ingest and analyze email'
      });
    }
  });

  app.post('/api/emails/triage-pending', async (_req, res) => {
    try {
      const state = await getMailboxState();
      const pending = state.threads.filter((t) => t.responsibility === 'needs_triage');

      const updatedThreads: EmailThread[] = [];
      for (const thread of pending) {
        const analysis = await analyzeEmailThread(thread, state.charter);
        const updated = await updateThreadFields(thread.id, {
          category: analysis.category,
          priority: analysis.priority,
          responsibility: analysis.responsibility,
          responsibilityReason: analysis.responsibilityReason,
          aiSummary: analysis.aiSummary,
          extractedActionItems: analysis.extractedActionItems
        });
        if (updated) updatedThreads.push(updated);
      }

      const freshState = await getMailboxState();
      res.json({ triagedCount: updatedThreads.length, threads: freshState.threads });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to triage pending emails'
      });
    }
  });

  app.post('/api/emails/:id/analyze', async (req, res) => {
    try {
      const state = await getMailboxState();
      const thread = state.threads.find((t) => t.id === req.params.id);
      if (!thread) {
        res.status(404).json({ error: 'Thread not found' });
        return;
      }

      const analysis = await analyzeEmailThread(thread, state.charter);
      const updated = await updateThreadFields(thread.id, {
        category: analysis.category,
        priority: analysis.priority,
        responsibility: analysis.responsibility,
        responsibilityReason: analysis.responsibilityReason,
        aiSummary: analysis.aiSummary,
        extractedActionItems: analysis.extractedActionItems
      });

      res.json({ thread: updated });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to analyze thread'
      });
    }
  });

  app.post('/api/emails/:id/draft', async (req, res) => {
    try {
      const { tone, instruction } = req.body as {
        tone?: DraftTone;
        instruction?: string;
      };
      const state = await getMailboxState();
      const thread = state.threads.find((t) => t.id === req.params.id);
      if (!thread) {
        res.status(404).json({ error: 'Thread not found' });
        return;
      }

      const activeTone = tone ?? thread.draftTone ?? state.charter.preferredTone;
      const draftReply = await generateDraftReply(thread, state.charter, activeTone, instruction);

      const updated = await updateThreadFields(thread.id, {
        draftReply,
        draftTone: activeTone
      });

      res.json({ thread: updated });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to generate reply draft'
      });
    }
  });

  app.patch('/api/emails/:id', async (req, res) => {
    try {
      const patch = req.body as Partial<EmailThread>;
      const updated = await updateThreadFields(req.params.id, patch);
      if (!updated) {
        res.status(404).json({ error: 'Thread not found' });
        return;
      }
      res.json({ thread: updated });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to update thread'
      });
    }
  });

  app.post('/api/emails/:id/notes', async (req, res) => {
    try {
      const { authorRole, content, nextResponsibility } = req.body as {
        authorRole?: UserRole;
        content?: string;
        nextResponsibility?: ResponsibilityOwner;
      };
      if (!content?.trim() || !authorRole) {
        res.status(400).json({ error: 'authorRole and content are required.' });
        return;
      }

      const state = await getMailboxState();
      const authorName =
        authorRole === 'assistant' ? state.charter.assistantName : state.charter.clientName;

      const updated = await appendInternalNote(
        req.params.id,
        {
          id: `note-${Date.now().toString(36)}`,
          authorRole,
          authorName,
          timestamp: new Date().toISOString(),
          content: content.trim()
        },
        nextResponsibility
      );

      if (!updated) {
        res.status(404).json({ error: 'Thread not found' });
        return;
      }
      res.json({ thread: updated });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to save internal note'
      });
    }
  });

  app.post('/api/emails/:id/send', async (req, res) => {
    try {
      const { body, sentByRole, markResolved } = req.body as {
        body?: string;
        sentByRole?: UserRole;
        markResolved?: boolean;
      };
      if (!body?.trim() || !sentByRole) {
        res.status(400).json({ error: 'Reply body and sentByRole are required.' });
        return;
      }

      const state = await getMailboxState();
      const thread = await getThreadById(req.params.id);
      if (!thread) {
        res.status(404).json({ error: 'Thread not found' });
        return;
      }

      const senderName =
        sentByRole === 'assistant'
          ? `${state.charter.assistantName} (on behalf of ${state.charter.clientName})`
          : state.charter.clientName;

      const senderEmail =
        sentByRole === 'assistant' ? 'marcus@meridianhq.com' : 'elena@meridianhq.com';

      const nextResponsibility: ResponsibilityOwner = markResolved
        ? 'resolved'
        : 'waiting_external';

      const updated = await sendReplyMessage(
        thread.id,
        {
          id: `msg-${Date.now().toString(36)}`,
          senderName,
          senderEmail,
          senderRole: sentByRole,
          timestamp: new Date().toISOString(),
          body: body.trim()
        },
        nextResponsibility,
        {
          id: `note-${Date.now().toString(36)}`,
          authorRole: sentByRole,
          authorName:
            sentByRole === 'assistant' ? state.charter.assistantName : state.charter.clientName,
          timestamp: new Date().toISOString(),
          content:
            sentByRole === 'client'
              ? 'Approved and sent reply to external recipient.'
              : 'Sent reply on client’s behalf.'
        }
      );

      res.json({ thread: updated });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to send reply'
      });
    }
  });

  app.delete('/api/emails/:id', async (req, res) => {
    try {
      const removed = await deleteThread(req.params.id);
      if (!removed) {
        res.status(404).json({ error: 'Thread not found' });
        return;
      }
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to delete thread'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Meridian Executive & Assistant Desk listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
