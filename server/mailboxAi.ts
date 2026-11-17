import type {
  ClientCharter,
  DraftTone,
  EmailCategory,
  EmailThread,
  PriorityLevel,
  ResponsibilityOwner
} from '../src/types/mailbox.ts';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-120b';

function getGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing. Please add it to your .env configuration.');
  }
  return apiKey;
}

async function callGroqJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const apiKey = getGroqApiKey();
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content?.trim() ?? '{}';
  return JSON.parse(raw) as T;
}

function normalizeCategory(val: string): EmailCategory {
  const valid: EmailCategory[] = [
    'Board & Investors',
    'Deals & Partners',
    'Legal & Finance',
    'Scheduling & Travel',
    'Operations'
  ];
  return valid.includes(val as EmailCategory) ? (val as EmailCategory) : 'Operations';
}

function normalizePriority(val: string): PriorityLevel {
  const valid: PriorityLevel[] = ['Urgent', 'High', 'Normal', 'Low'];
  return valid.includes(val as PriorityLevel) ? (val as PriorityLevel) : 'Normal';
}

function normalizeResponsibility(val: string): ResponsibilityOwner {
  const valid: ResponsibilityOwner[] = [
    'assistant_handle',
    'needs_client_decision',
    'ready_for_client_approval',
    'waiting_external',
    'resolved'
  ];
  return valid.includes(val as ResponsibilityOwner)
    ? (val as ResponsibilityOwner)
    : 'assistant_handle';
}

function formatThreadForPrompt(thread: EmailThread, charter: ClientCharter): string {
  const messagesText = thread.messages
    .map(
      (m) =>
        `[${m.timestamp}] ${m.senderName} <${m.senderEmail}> (${m.senderRole}):\n${m.body}`
    )
    .join('\n\n---\n\n');

  const notesText =
    thread.internalNotes.length > 0
      ? thread.internalNotes
          .map((n) => `[${n.timestamp}] ${n.authorName} (${n.authorRole}): ${n.content}`)
          .join('\n')
      : 'None yet.';

  return [
    `Client: ${charter.clientName} (${charter.clientTitle})`,
    `Personal Assistant: ${charter.assistantName}`,
    `Spend Delegation Limit: $${charter.spendLimitUsd}`,
    `Preferred Tone: ${charter.preferredTone}`,
    `Scheduling Window: ${charter.schedulingWindow}`,
    `Delegation Rules:\n${charter.autoHandleRules.map((r) => `- ${r}`).join('\n')}`,
    '',
    `Thread Subject: ${thread.subject}`,
    `External Participant: ${thread.participantName} (${thread.participantOrg}) <${thread.participantEmail}>`,
    '',
    `Email Conversation History:\n${messagesText}`,
    '',
    `Internal Assistant <-> Client Notes:\n${notesText}`
  ].join('\n');
}

export async function analyzeEmailThread(
  thread: EmailThread,
  charter: ClientCharter
): Promise<{
  category: EmailCategory;
  priority: PriorityLevel;
  responsibility: ResponsibilityOwner;
  responsibilityReason: string;
  aiSummary: string;
  extractedActionItems: string[];
}> {
  const systemPrompt = `You are an AI Email Triage & Conversation Intelligence engine for an executive Personal Assistant platform.
Your job is to organize incoming email threads, understand multi-message conversations, and accurately assign **Reply Responsibility** between the Personal Assistant and the Client based strictly on the Client's Delegation Charter.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "category": "Board & Investors" | "Deals & Partners" | "Legal & Finance" | "Scheduling & Travel" | "Operations",
  "priority": "Urgent" | "High" | "Normal" | "Low",
  "responsibility": "assistant_handle" | "needs_client_decision" | "ready_for_client_approval" | "waiting_external" | "resolved",
  "responsibilityReason": "1 concise sentence explaining why the Personal Assistant or Client owns the next action, referencing delegation rules or thresholds when relevant.",
  "aiSummary": "2 crisp sentences summarizing the entire email conversation, current status, and open decision or request.",
  "extractedActionItems": ["2 to 4 concrete commitments, deadlines, amounts, or open questions"]
}

Rules for responsibility:
- Use "assistant_handle" when the PA can resolve, schedule, or politely decline within the Delegation Charter without bothering the Client.
- Use "needs_client_decision" when the thread involves legal redlines, strategic commitments, board/investor relationships, press, or spend above the Client's spend limit.
- Use "ready_for_client_approval" ONLY if a draft reply already exists and is ready for final client sign-off.
- Use "waiting_external" if the last email was sent by the client/assistant and we are waiting for the external party.
- Use "resolved" if no further reply or follow-up is needed.`;

  const userPrompt = formatThreadForPrompt(thread, charter);
  const result = await callGroqJson<{
    category?: string;
    priority?: string;
    responsibility?: string;
    responsibilityReason?: string;
    aiSummary?: string;
    extractedActionItems?: string[];
  }>(systemPrompt, userPrompt);

  return {
    category: normalizeCategory(result.category ?? thread.category),
    priority: normalizePriority(result.priority ?? thread.priority),
    responsibility: normalizeResponsibility(result.responsibility ?? 'assistant_handle'),
    responsibilityReason:
      result.responsibilityReason?.trim() ||
      'Classified according to thread urgency and delegation charter.',
    aiSummary: result.aiSummary?.trim() || 'Conversation analyzed.',
    extractedActionItems: Array.isArray(result.extractedActionItems)
      ? result.extractedActionItems.filter((x) => typeof x === 'string' && x.trim().length > 0)
      : []
  };
}

export async function generateDraftReply(
  thread: EmailThread,
  charter: ClientCharter,
  tone: DraftTone,
  instruction?: string
): Promise<string> {
  const apiKey = getGroqApiKey();

  const systemPrompt = `You are drafting an email reply for ${charter.clientName} (${charter.clientTitle}), assisted by Personal Assistant ${charter.assistantName}.
Write a realistic, ready-to-send email body ONLY (no subject line, no markdown code blocks, no meta commentary).
Requested Tone: ${tone}.
Client Scheduling Window: ${charter.schedulingWindow}.
Honor any internal Assistant <-> Client notes and specific drafting instructions provided.`;

  const userPrompt = [
    formatThreadForPrompt(thread, charter),
    instruction?.trim()
      ? `\nSpecific Assistant/Client Drafting Instruction:\n${instruction.trim()}`
      : '\nWrite the strongest, clearest reply addressing every open point in the latest message.'
  ].join('\n');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.35
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return (data.choices?.[0]?.message?.content ?? '').trim();
}
