import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import type { ClientCharter, DraftTone } from '../types/mailbox.ts';

interface CharterModalProps {
  isOpen: boolean;
  charter: ClientCharter;
  onClose: () => void;
  onSave: (charter: ClientCharter) => Promise<void>;
}

const TONES: DraftTone[] = [
  'Executive Crisp',
  'Warm & Diplomatic',
  'Direct Decline',
  'Schedule Coordination'
];

export function CharterModal({ isOpen, charter, onClose, onSave }: CharterModalProps) {
  const [form, setForm] = useState<ClientCharter>(charter);
  const [newRule, setNewRule] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(charter);
  }, [charter, isOpen]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setForm((prev) => ({
      ...prev,
      autoHandleRules: [...prev.autoHandleRules, newRule.trim()]
    }));
    setNewRule('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="charter-title"
        className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 id="charter-title" className="text-base font-bold text-slate-900">
              Client Delegation Charter
            </h2>
            <p className="text-xs text-slate-500">
              AI uses these live boundaries to assign reply ownership and draft replies.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close charter modal"
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Name
              </label>
              <input
                type="text"
                required
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Personal Assistant Name
              </label>
              <input
                type="text"
                required
                value={form.assistantName}
                onChange={(e) => setForm({ ...form, assistantName: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Spend Escalation Threshold (USD)
              </label>
              <input
                type="number"
                min={0}
                value={form.spendLimitUsd}
                onChange={(e) =>
                  setForm({ ...form, spendLimitUsd: Math.max(0, Number(e.target.value) || 0) })
                }
                className="w-full px-3 py-1.5 text-sm font-mono tabular-nums border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Reply Tone
              </label>
              <select
                value={form.preferredTone}
                onChange={(e) =>
                  setForm({ ...form, preferredTone: e.target.value as DraftTone })
                }
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Scheduling Window
            </label>
            <input
              type="text"
              value={form.schedulingWindow}
              onChange={(e) => setForm({ ...form, schedulingWindow: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Delegation & Escalation Rules
            </label>
            <ul className="space-y-1.5 mb-2">
              {form.autoHandleRules.map((rule, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                >
                  <span className="text-slate-800">{rule}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        autoHandleRules: form.autoHandleRules.filter((_, i) => i !== idx)
                      })
                    }
                    aria-label="Remove rule"
                    className="p-1 text-slate-400 hover:text-red-700 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
                placeholder="Add new delegation or escalation rule..."
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Charter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
