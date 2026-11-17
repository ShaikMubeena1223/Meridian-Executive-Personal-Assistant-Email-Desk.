import type { PriorityLevel, ResponsibilityOwner } from '../types/mailbox.ts';

export function getResponsibilityDisplay(owner: ResponsibilityOwner): {
  label: string;
  shortLabel: string;
  textClass: string;
} {
  switch (owner) {
    case 'needs_triage':
      return {
        label: 'Needs Triage',
        shortLabel: 'Untriaged',
        textClass: 'text-slate-600'
      };
    case 'assistant_handle':
      return {
        label: 'Assistant Handles',
        shortLabel: 'Assistant Owns',
        textClass: 'text-blue-700'
      };
    case 'needs_client_decision':
      return {
        label: 'Needs Client Decision',
        shortLabel: 'Client Decision',
        textClass: 'text-amber-700'
      };
    case 'ready_for_client_approval':
      return {
        label: 'Ready for Client Approval',
        shortLabel: 'Approve Draft',
        textClass: 'text-emerald-700'
      };
    case 'waiting_external':
      return {
        label: 'Waiting on External Reply',
        shortLabel: 'Waiting External',
        textClass: 'text-slate-500'
      };
    case 'resolved':
      return {
        label: 'Resolved',
        shortLabel: 'Resolved',
        textClass: 'text-slate-500'
      };
  }
}

export function getPriorityTextClass(priority: PriorityLevel): string {
  switch (priority) {
    case 'Urgent':
      return 'text-red-700 font-semibold';
    case 'High':
      return 'text-amber-700 font-medium';
    case 'Normal':
      return 'text-slate-600';
    case 'Low':
      return 'text-slate-400';
  }
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
