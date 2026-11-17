import { useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import type { IngestEmailPayload } from '../types/mailbox.ts';

interface IncomingEmailModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onIngest: (payload: IngestEmailPayload) => Promise<void>;
}

const SCENARIOS: Array<{
  label: string;
  data: IngestEmailPayload;
}> = [
  {
    label: 'Hotel Travel Change ($1,150)',
    data: {
      senderName: 'Claire Dupont',
      senderEmail: 'reservations@legrandparis.fr',
      senderOrg: 'Hôtel Le Grand Paris',
      subject: 'Confirmation Update: Executive Suite Nov 28–30',
      body:
        'Dear Marcus,\n\nWe can confirm early check-in at 10:00 AM on Nov 28 for Ms. Vance at a total corporate rate of $1,150 for two nights, including airport transfer. Please confirm flight arrival time by Friday so we can dispatch the driver.'
    }
  },
  {
    label: 'Forbes Interview Request',
    data: {
      senderName: 'Nadia Patel',
      senderEmail: 'npatel@forbesmedia.com',
      senderOrg: 'Forbes Enterprise Tech',
      subject: 'Interview Request: 2027 Enterprise AI Governance Feature',
      body:
        'Hi Elena,\n\nI’m writing a feature on how mid-market CEOs are structuring AI security budgets for 2027. Would you have 20 minutes next Tuesday or Wednesday for an on-the-record call? Our print deadline is Nov 20.'
    }
  },
  {
    label: 'Vendor Overcharge ($8,400)',
    data: {
      senderName: 'Billing Operations',
      senderEmail: 'ar@omniroute.io',
      senderOrg: 'OmniRoute Cloud',
      subject: 'Invoice #INV-9921 Past Due Notice — $8,400 Overage Charge',
      body:
        'Hello,\n\nYour October bandwidth overage invoice (#INV-9921) for $8,400 is scheduled for auto-debit on Nov 18 unless disputed in writing. Please confirm approval or attach your usage dispute.'
    }
  }
];

export function IncomingEmailModal({
  isOpen,
  isSubmitting,
  onClose,
  onIngest
}: IncomingEmailModalProps) {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderOrg, setSenderOrg] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  if (!isOpen) return null;

  const loadScenario = (data: IngestEmailPayload) => {
    setSenderName(data.senderName);
    setSenderEmail(data.senderEmail);
    setSenderOrg(data.senderOrg);
    setSubject(data.subject);
    setBody(data.body);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !subject.trim() || !body.trim() || isSubmitting) return;
    await onIngest({
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim() || 'sender@example.com',
      senderOrg: senderOrg.trim() || 'External Organization',
      subject: subject.trim(),
      body: body.trim()
    });
    setSenderName('');
    setSenderEmail('');
    setSenderOrg('');
    setSubject('');
    setBody('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingest-title"
        className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 id="ingest-title" className="text-base font-bold text-slate-900">
              Simulate Incoming Email
            </h2>
            <p className="text-xs text-slate-500">
              AI will classify category, summarize the message, and assign reply ownership.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => loadScenario(s.data)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sender Name *
              </label>
              <input
                required
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nadia Patel"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sender Email
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="nadia@forbes.com"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization
              </label>
              <input
                type="text"
                value={senderOrg}
                onChange={(e) => setSenderOrg(e.target.value)}
                placeholder="Forbes Media"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
            <input
              required
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Interview Request: 2027 Enterprise AI Governance"
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Body *
            </label>
            <textarea
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste the incoming email message..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !senderName.trim() || !subject.trim() || !body.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Ingesting & Analyzing...' : 'Ingest & Auto-Triage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
