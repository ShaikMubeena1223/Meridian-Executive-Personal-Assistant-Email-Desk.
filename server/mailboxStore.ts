import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  ClientCharter,
  EmailMessage,
  EmailThread,
  InternalNote,
  MailboxState
} from '../src/types/mailbox.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const MAILBOX_FILE = path.join(DATA_DIR, 'mailbox.json');

const SEED_STATE: MailboxState = {
  charter: {
    clientName: 'Elena Vance',
    clientTitle: 'Chief Executive Officer',
    assistantName: 'Marcus Chen',
    spendLimitUsd: 5000,
    preferredTone: 'Executive Crisp',
    schedulingWindow: 'Tue–Thu, 10:00 AM–4:30 PM PT (30 min slots preferred)',
    autoHandleRules: [
      'Confirm flights, hotels, and conference logistics within $2,500 travel budget',
      'Decline unsolicited vendor cold outreach and generic podcast pitches politely',
      'Escalate any legal MSA redline, board commitment, or spend above $5,000',
      'Require client approval before confirming 1-on-1 investor dinners or press interviews'
    ]
  },
  threads: [
    {
      id: 'thread-sequoia-dinner',
      subject: 'Q4 Board Prep & Pre-Board Dinner Timing (Nov 19)',
      participantName: 'David Park',
      participantEmail: 'dpark@northstarventures.com',
      participantOrg: 'Northstar Ventures',
      category: 'Board & Investors',
      priority: 'Urgent',
      responsibility: 'ready_for_client_approval',
      responsibilityReason:
        'Board investor dinner confirmation requires Elena’s final sign-off; Marcus has already verified calendar availability and drafted the reply.',
      aiSummary:
        'David Park (Lead Investor) requested moving the Nov 19 pre-board dinner from 7:00 PM to 6:30 PM at Alderwood and asked whether Elena prefers bringing CFO Priya Nair for the ARR deep-dive.',
      extractedActionItems: [
        'Confirm 6:30 PM time change on Nov 19 at Alderwood',
        'Decide whether CFO Priya Nair joins the dinner or joins formal Board session only',
        'Share pre-read deck 48 hours ahead (by Nov 17)'
      ],
      messages: [
        {
          id: 'm-seq-1',
          senderName: 'David Park',
          senderEmail: 'dpark@northstarventures.com',
          senderRole: 'external',
          timestamp: '2026-11-14T16:10:00.000Z',
          body:
            'Hi Elena,\n\nLooking forward to next Wednesday’s board meeting. Would 7:00 PM at Alderwood still work for our pre-board dinner, or should we lock a private room?'
        },
        {
          id: 'm-seq-2',
          senderName: 'Marcus Chen (on behalf of Elena Vance)',
          senderEmail: 'marcus@meridianhq.com',
          senderRole: 'assistant',
          timestamp: '2026-11-14T17:45:00.000Z',
          body:
            'Hi David,\n\nMarcus here from Elena’s office. We reserved the private alcove at Alderwood under Vance for Nov 19. Let us know if you need any dietary accommodations.'
        },
        {
          id: 'm-seq-3',
          senderName: 'David Park',
          senderEmail: 'dpark@northstarventures.com',
          senderRole: 'external',
          timestamp: '2026-11-14T20:15:00.000Z',
          body:
            'Thanks Marcus! My flight out of SFO moved slightly earlier—could we shift dinner up 30 minutes to 6:30 PM? Also Elena, let me know if you want Priya to join us for the Q4 ARR bridge discussion or keep dinner 1:1.'
        }
      ],
      internalNotes: [
        {
          id: 'n-seq-1',
          authorRole: 'assistant',
          authorName: 'Marcus Chen',
          timestamp: '2026-11-14T20:28:00.000Z',
          content:
            'Elena — Your 5:30 PM product review ends at 6:00 PM, so 6:30 PM at Alderwood (12 min drive) works cleanly. I drafted a reply confirming 6:30 PM and keeping dinner 1:1 with Priya joining the formal Board session next morning. Approve to send or edit below.'
        }
      ],
      draftReply:
        'Hi David,\n\n6:30 PM at Alderwood works well—I’ve updated our reservation. Let’s keep dinner 1:1 so we can focus on 2027 strategic priorities, and Priya will walk through the full Q4 ARR bridge during the formal board session on Thursday morning. We’ll send the pre-read deck over by Monday afternoon.\n\nBest,\nElena',
      draftTone: 'Executive Crisp',
      lastUpdatedAt: '2026-11-14T20:28:00.000Z',
      unread: true
    },
    {
      id: 'thread-snowflake-renewal',
      subject: 'Urgent: Data Warehouse Enterprise Renewal (+18% Uplift)',
      participantName: 'Hannah Brooks',
      participantEmail: 'hbrooks@cloudscale.io',
      participantOrg: 'CloudScale Data',
      category: 'Legal & Finance',
      priority: 'High',
      responsibility: 'needs_client_decision',
      responsibilityReason:
        'Annual contract value ($142,000) exceeds the $5,000 delegation threshold and requires strategic guidance on multi-year lock-in vs. competitive bid.',
      aiSummary:
        'CloudScale is proposing an 18% renewal increase ($142k/yr vs. $120k/yr) unless Meridian commits to a 2-year term by Nov 22. VP Engineering notes migration to an alternative would take 10 weeks.',
      extractedActionItems: [
        'Decide between 1-year renewal pushback (cap at 5%) vs. 2-year commitment for flat pricing',
        'Contract deadline: Nov 22, 2026 before auto-renewal tier applies'
      ],
      messages: [
        {
          id: 'm-cs-1',
          senderName: 'Hannah Brooks',
          senderEmail: 'hbrooks@cloudscale.io',
          senderRole: 'external',
          timestamp: '2026-11-14T15:00:00.000Z',
          body:
            'Hi Elena,\n\nAhead of your Dec 1 renewal date, our updated 2027 enterprise rate card puts your current compute tier at $142,000/yr (+18%). If we execute a 2-year agreement by Nov 22, I can hold your current $120,000/yr rate and include 15TB additional cold storage.\n\nPlease let me know how you’d like to proceed.'
        }
      ],
      internalNotes: [
        {
          id: 'n-cs-1',
          authorRole: 'assistant',
          authorName: 'Marcus Chen',
          timestamp: '2026-11-14T15:40:00.000Z',
          content:
            'Flagging for your decision since this is $142k (> $5k limit). I checked with Sam (VP Eng)—he says switching warehouses isn’t realistic in Q4, so we have two good plays: (1) Counter with a 1-year renewal at +4% max, or (2) Take the 2-year flat rate at $120k. Which direction should I draft?'
        }
      ],
      draftReply: '',
      draftTone: 'Executive Crisp',
      lastUpdatedAt: '2026-11-14T15:40:00.000Z',
      unread: true
    },
    {
      id: 'thread-singapore-travel',
      subject: 'FinTech Summit Singapore: Speaker Logistics & Hotel Confirmation',
      participantName: 'Mei Lin Tan',
      participantEmail: 'meilin@apacfintech.org',
      participantOrg: 'APAC FinTech Summit',
      category: 'Scheduling & Travel',
      priority: 'Normal',
      responsibility: 'assistant_handle',
      responsibilityReason:
        'Keynote logistics, AV check slot, and hotel block ($1,480 total) fall cleanly inside Marcus’s $2,500 travel delegation charter.',
      aiSummary:
        'Conference organizers need Elena’s flight arrival time for airport transfer, speaker bio confirmation, and 15-minute AV soundcheck slot selection on Dec 3.',
      extractedActionItems: [
        'Provide SQ31 arrival details (Dec 2, 18:20 SGT)',
        'Book 4:00 PM SGT AV rehearsal slot on Dec 3',
        'Confirm Fullerton Bay hotel confirmation #FB-88412'
      ],
      messages: [
        {
          id: 'm-sg-1',
          senderName: 'Mei Lin Tan',
          senderEmail: 'meilin@apacfintech.org',
          senderRole: 'external',
          timestamp: '2026-11-14T12:05:00.000Z',
          body:
            'Dear Marcus & Elena,\n\nWe are excited to host Elena’s keynote on Dec 4 at 9:30 AM. Could your office share her Singapore arrival flight for VIP pickup, and pick either 2:30 PM or 4:00 PM SGT on Dec 3 for the stage AV check?'
        }
      ],
      internalNotes: [
        {
          id: 'n-sg-1',
          authorRole: 'assistant',
          authorName: 'Marcus Chen',
          timestamp: '2026-11-14T12:30:00.000Z',
          content:
            'Within travel charter ($1,480 hotel already confirmed). I’ll reply directly with SQ31 arrival and lock the 4:00 PM Dec 3 AV slot so Elena has morning open for Asia customer calls.'
        }
      ],
      draftReply:
        'Hi Mei Lin,\n\nElena arrives on Singapore Airlines SQ31 on Dec 2 at 18:20 SGT (hotel confirmation #FB-88412 at Fullerton Bay). Please lock the 4:00 PM SGT AV check on Dec 3—we’ll also attach her updated headshot and 60-word bio here.\n\nBest regards,\nMarcus Chen\nOffice of Elena Vance',
      draftTone: 'Schedule Coordination',
      lastUpdatedAt: '2026-11-14T12:30:00.000Z',
      unread: false
    },
    {
      id: 'thread-acme-msa',
      subject: 'Re: Meridian x Apex Logistics — Enterprise MSA Redlines',
      participantName: 'Jordan Alvarez',
      participantEmail: 'jalvarez@apexlogistics.com',
      participantOrg: 'Apex Logistics',
      category: 'Deals & Partners',
      priority: 'High',
      responsibility: 'needs_triage',
      responsibilityReason: 'Awaiting initial triage and reply responsibility classification.',
      aiSummary:
        'Untriaged incoming legal/commercial thread regarding Apex Logistics ($210k ARR deal) requesting mutual indemnification cap adjustment and 45-day payment terms.',
      extractedActionItems: ['Review MSA Section 8.2 liability cap', 'Coordinate with external counsel'],
      messages: [
        {
          id: 'm-acme-1',
          senderName: 'Jordan Alvarez',
          senderEmail: 'jalvarez@apexlogistics.com',
          senderRole: 'external',
          timestamp: '2026-11-14T21:10:00.000Z',
          body:
            'Hi Elena,\n\nOur General Counsel completed review of the $210k Enterprise MSA. We are aligned on pricing and SLA, with two remaining items: (1) increasing the mutual indemnification cap from 1x to 2x annual fees, and (2) moving Net-30 to Net-45 payment terms.\n\nIf you can confirm acceptance by Tuesday, we can countersign before Thanksgiving.'
        }
      ],
      internalNotes: [],
      draftReply: '',
      draftTone: 'Warm & Diplomatic',
      lastUpdatedAt: '2026-11-14T21:10:00.000Z',
      unread: true
    },
    {
      id: 'thread-podcast-pitch',
      subject: 'Invitation: "Founders Unfiltered" Podcast Guest Appearance',
      participantName: 'Liam O’Connor',
      participantEmail: 'liam@foundersunfiltered.fm',
      participantOrg: 'Founders Unfiltered Media',
      category: 'Operations',
      priority: 'Low',
      responsibility: 'needs_triage',
      responsibilityReason: 'Awaiting initial triage against client delegation rules.',
      aiSummary:
        'Untriaged media/podcast pitch asking for a 60-minute remote interview in December.',
      extractedActionItems: ['Evaluate alignment with Q4 comms priorities'],
      messages: [
        {
          id: 'm-pod-1',
          senderName: 'Liam O’Connor',
          senderEmail: 'liam@foundersunfiltered.fm',
          senderRole: 'external',
          timestamp: '2026-11-14T18:50:00.000Z',
          body:
            'Hey Elena,\n\nBig fan of what you’re building at Meridian! Would love to have you on our weekly podcast (around 4,500 listeners) for a 60-minute video recording sometime in early December. Let me know if you’re open to it!'
        }
      ],
      internalNotes: [],
      draftReply: '',
      draftTone: 'Direct Decline',
      lastUpdatedAt: '2026-11-14T18:50:00.000Z',
      unread: true
    },
    {
      id: 'thread-advisory-note',
      subject: 'Q3 Advisory Retainer Wire Confirmation — Dr. Aris Thorne',
      participantName: 'Dr. Aris Thorne',
      participantEmail: 'aris@thorneadvisory.org',
      participantOrg: 'Thorne Security Advisory',
      category: 'Operations',
      priority: 'Normal',
      responsibility: 'resolved',
      responsibilityReason:
        'Handled end-to-end by Marcus under the standing advisory retainer policy; confirmation sent and receipt archived.',
      aiSummary:
        'Confirmed Q3 security advisory invoice ($2,200) payment and scheduled the next 30-minute check-in for Dec 9.',
      extractedActionItems: ['Completed — Dec 9 calendar hold sent'],
      messages: [
        {
          id: 'm-adv-1',
          senderName: 'Dr. Aris Thorne',
          senderEmail: 'aris@thorneadvisory.org',
          senderRole: 'external',
          timestamp: '2026-11-13T14:00:00.000Z',
          body:
            'Hi Marcus, checking in on whether Q3 advisory invoice #1042 ($2,200) cleared AP, and happy to lock our next brief sync in early December.'
        },
        {
          id: 'm-adv-2',
          senderName: 'Marcus Chen (on behalf of Elena Vance)',
          senderEmail: 'marcus@meridianhq.com',
          senderRole: 'assistant',
          timestamp: '2026-11-13T16:12:00.000Z',
          body:
            'Hi Aris,\n\nAP confirmed ACH batch #8821 cleared yesterday for $2,200. I also sent over a calendar invite for Dec 9 at 11:00 AM PT with Elena.\n\nBest,\nMarcus Chen'
        }
      ],
      internalNotes: [
        {
          id: 'n-adv-1',
          authorRole: 'assistant',
          authorName: 'Marcus Chen',
          timestamp: '2026-11-13T16:13:00.000Z',
          content: 'Verified AP wire and confirmed Dec 9 sync within charter limits.'
        }
      ],
      draftReply: '',
      draftTone: 'Executive Crisp',
      lastUpdatedAt: '2026-11-13T16:13:00.000Z',
      unread: false
    }
  ]
};

async function ensureMailboxFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(MAILBOX_FILE);
  } catch {
    await fs.writeFile(MAILBOX_FILE, JSON.stringify(SEED_STATE, null, 2), 'utf-8');
  }
}

export async function getMailboxState(): Promise<MailboxState> {
  await ensureMailboxFile();
  const raw = await fs.readFile(MAILBOX_FILE, 'utf-8');
  const parsed = JSON.parse(raw) as MailboxState;
  parsed.threads.sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
  return parsed;
}

async function writeMailboxState(state: MailboxState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(MAILBOX_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export async function getThreadById(id: string): Promise<EmailThread | undefined> {
  const state = await getMailboxState();
  return state.threads.find((t) => t.id === id);
}

export async function saveThread(thread: EmailThread): Promise<EmailThread> {
  const state = await getMailboxState();
  const idx = state.threads.findIndex((t) => t.id === thread.id);
  if (idx >= 0) {
    state.threads[idx] = thread;
  } else {
    state.threads.unshift(thread);
  }
  await writeMailboxState(state);
  return thread;
}

export async function updateThreadFields(
  id: string,
  patch: Partial<EmailThread>
): Promise<EmailThread | null> {
  const state = await getMailboxState();
  const thread = state.threads.find((t) => t.id === id);
  if (!thread) return null;

  Object.assign(thread, patch, { lastUpdatedAt: new Date().toISOString() });
  await writeMailboxState(state);
  return thread;
}

export async function appendInternalNote(
  id: string,
  note: InternalNote,
  nextResponsibility?: EmailThread['responsibility']
): Promise<EmailThread | null> {
  const state = await getMailboxState();
  const thread = state.threads.find((t) => t.id === id);
  if (!thread) return null;

  thread.internalNotes.push(note);
  if (nextResponsibility) {
    thread.responsibility = nextResponsibility;
  }
  thread.lastUpdatedAt = new Date().toISOString();
  await writeMailboxState(state);
  return thread;
}

export async function sendReplyMessage(
  id: string,
  message: EmailMessage,
  nextResponsibility: EmailThread['responsibility'],
  auditNote?: InternalNote
): Promise<EmailThread | null> {
  const state = await getMailboxState();
  const thread = state.threads.find((t) => t.id === id);
  if (!thread) return null;

  thread.messages.push(message);
  thread.draftReply = '';
  thread.responsibility = nextResponsibility;
  thread.unread = false;
  if (auditNote) {
    thread.internalNotes.push(auditNote);
  }
  thread.lastUpdatedAt = new Date().toISOString();
  await writeMailboxState(state);
  return thread;
}

export async function updateClientCharter(charter: ClientCharter): Promise<ClientCharter> {
  const state = await getMailboxState();
  state.charter = charter;
  await writeMailboxState(state);
  return charter;
}

export async function deleteThread(id: string): Promise<boolean> {
  const state = await getMailboxState();
  const next = state.threads.filter((t) => t.id !== id);
  if (next.length === state.threads.length) return false;
  state.threads = next;
  await writeMailboxState(state);
  return true;
}
