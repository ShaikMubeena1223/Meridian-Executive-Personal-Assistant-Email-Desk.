export type UserRole = 'assistant' | 'client';

export type EmailCategory =
  | 'Board & Investors'
  | 'Deals & Partners'
  | 'Legal & Finance'
  | 'Scheduling & Travel'
  | 'Operations';

export type ResponsibilityOwner =
  | 'needs_triage'
  | 'assistant_handle'
  | 'needs_client_decision'
  | 'ready_for_client_approval'
  | 'waiting_external'
  | 'resolved';

export type PriorityLevel = 'Urgent' | 'High' | 'Normal' | 'Low';

export type DraftTone =
  | 'Executive Crisp'
  | 'Warm & Diplomatic'
  | 'Direct Decline'
  | 'Schedule Coordination';

export interface EmailMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'external' | 'client' | 'assistant';
  timestamp: string;
  body: string;
}

export interface InternalNote {
  id: string;
  authorRole: UserRole;
  authorName: string;
  timestamp: string;
  content: string;
}

export interface ClientCharter {
  clientName: string;
  clientTitle: string;
  assistantName: string;
  spendLimitUsd: number;
  preferredTone: DraftTone;
  schedulingWindow: string;
  autoHandleRules: string[];
}

export interface EmailThread {
  id: string;
  subject: string;
  participantName: string;
  participantEmail: string;
  participantOrg: string;
  category: EmailCategory;
  priority: PriorityLevel;
  responsibility: ResponsibilityOwner;
  responsibilityReason: string;
  aiSummary: string;
  extractedActionItems: string[];
  messages: EmailMessage[];
  internalNotes: InternalNote[];
  draftReply: string;
  draftTone: DraftTone;
  lastUpdatedAt: string;
  unread: boolean;
}

export interface MailboxState {
  charter: ClientCharter;
  threads: EmailThread[];
}

export interface IngestEmailPayload {
  senderName: string;
  senderEmail: string;
  senderOrg: string;
  subject: string;
  body: string;
}
