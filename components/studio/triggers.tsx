// Shared trigger manager (interval / cron+timezone / once / webhook) for Orchestration pipelines
// (W-18..W-24) and Agent Playground processes (P-18..P-24). Both APIs share one schema.
import React, { useEffect, useMemo, useState } from 'react';
import toast from './notify';
import { Clock, Webhook, CalendarClock, Repeat, Plus, MoreHorizontal, Play, Pencil, KeyRound, Trash2, RefreshCw, Zap } from 'lucide-react';
import {
  Button, ConfirmDialog, CopyButton, EmptyState, ErrorBanner, Field, IconButton, Input, Menu, Modal, Select, Spinner,
  StatusPill, Tag, Td, TextArea, Th, Toggle, Callout, cx, errMessage, fmtDateTime, timeAgo,
} from './ui';

export interface TriggerApi {
  list: (targetId?: string) => Promise<any>;
  create: (targetId: string, data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  remove: (id: string) => Promise<any>;
  run: (id: string, input?: any) => Promise<any>;
  rotateToken: (id: string) => Promise<any>;
}

interface Props {
  api: TriggerApi;
  targets: { id: string; name: string }[];
  targetKey: 'flow_id' | 'pipeline_id';
  targetNoun: string;                 // "process" | "pipeline"
  fixedTargetId?: string;             // when shown inside one process / pipeline
  onOpenInstance?: (id: string) => void;
  compact?: boolean;
}

const TIMEZONES = ['Asia/Kolkata', 'UTC', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney'];
const localTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; } })();

export const describeTrigger = (t: any) => {
  const tr = t?.trigger || {};
  switch (tr.type) {
    case 'interval': return `Every ${tr.every_minutes >= 60 && tr.every_minutes % 60 === 0 ? `${tr.every_minutes / 60} h` : `${tr.every_minutes} min`}`;
    case 'cron': return `Cron ${tr.cron}${tr.timezone ? ` (${tr.timezone})` : ''}`;
    case 'once': return `Once · ${fmtDateTime(tr.run_at)}`;
    case 'webhook': return `Webhook${t.hook_prefix ? ` · ${t.hook_prefix}…` : ''}`;
    default: return tr.type || '—';
  }
};

const TypeIcon: React.FC<{ type?: string }> = ({ type }) => {
  const I = type === 'webhook' ? Webhook : type === 'cron' ? CalendarClock : type === 'once' ? Clock : Repeat;
  return <I className="h-4 w-4 text-slate-500" />;
};

interface FormState {
  id?: string; name: string; targetId: string; type: 'interval' | 'cron' | 'once' | 'webhook';
  every_minutes: number; cron: string; timezone: string; run_at: string; overlap: 'allow' | 'skip';
  input: string; enabled: boolean; rate_limit_per_min: number;
}
const blankForm = (targetId = ''): FormState => ({
  name: '', targetId, type: 'interval', every_minutes: 60, cron: '0 9 * * 1-5', timezone: localTz, run_at: '',
  overlap: 'allow', input: '', enabled: true, rate_limit_per_min: 60,
});

const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const TriggerManager: React.FC<Props> = ({ api, targets, targetKey, targetNoun, fixedTargetId, onOpenInstance, compact }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ hook_token: string; hook_url: string; title: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const targetName = (id?: string) => targets.find(t => t.id === id)?.name || (id ? `${targetNoun} ${String(id).slice(-6)}` : '—');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.list(fixedTargetId);
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) { setError(errMessage(e, 'Failed to load triggers')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [fixedTargetId]);

  const openCreate = () => { setFormError(null); setForm(blankForm(fixedTargetId || targets[0]?.id || '')); };
  const openEdit = (t: any) => {
    const tr = t.trigger || {};
    setFormError(null);
    setForm({
      id: t._id, name: t.name || '', targetId: t[targetKey], type: tr.type || 'interval',
      every_minutes: tr.every_minutes || 60, cron: tr.cron || '0 9 * * 1-5', timezone: tr.timezone || localTz,
      run_at: toLocalInput(tr.run_at), overlap: tr.overlap || 'allow',
      input: t.input && Object.keys(t.input).length ? JSON.stringify(t.input, null, 2) : '',
      enabled: t.enabled !== false, rate_limit_per_min: t.rate_limit_per_min || 60,
    });
  };

  const save = async () => {
    if (!form) return;
    if (!form.targetId) { setFormError(`Choose a ${targetNoun}.`); return; }
    const trigger: any = { type: form.type, overlap: form.overlap };
    if (form.type === 'interval') {
      if (!(form.every_minutes >= 1)) { setFormError('Interval must be at least 1 minute.'); return; }
      trigger.every_minutes = Number(form.every_minutes);
    }
    if (form.type === 'cron') {
      if (form.cron.trim().split(/\s+/).length !== 5) { setFormError('Cron needs 5 fields: minute hour day-of-month month day-of-week (e.g. 0 9 * * 1-5).'); return; }
      trigger.cron = form.cron.trim();
      if (form.timezone) trigger.timezone = form.timezone;
    }
    if (form.type === 'once') {
      const d = new Date(form.run_at);
      if (!form.run_at || isNaN(d.getTime())) { setFormError('Pick a date and time.'); return; }
      if (d.getTime() <= Date.now()) { setFormError('The run time must be in the future.'); return; }
      trigger.run_at = d.toISOString();
    }
    let input: any;
    if (form.input.trim()) {
      try { input = JSON.parse(form.input); } catch (e: any) { setFormError(`Input is not valid JSON: ${e.message}`); return; }
    }
    const body: any = { name: form.name.trim(), trigger, enabled: form.enabled, ...(input !== undefined ? { input } : {}) };
    if (form.type === 'webhook') body.rate_limit_per_min = Number(form.rate_limit_per_min) || 60;
    setSaving(true); setFormError(null);
    try {
      const res = form.id ? await api.update(form.id, body) : await api.create(form.targetId, body);
      toast.success(form.id ? 'Trigger updated' : 'Trigger created');
      const d = res?.data || {};
      if (!form.id && d.hook_token) setSecret({ hook_token: d.hook_token, hook_url: d.hook_url, title: 'Webhook trigger created' });
      setForm(null);
      load();
    } catch (e: any) {
      setFormError(errMessage(e, 'Failed to save trigger') + (Array.isArray(e?.issues) && e.issues.length ? ` — ${e.issues.join('; ')}` : ''));
    } finally { setSaving(false); }
  };

  const toggle = async (t: any) => {
    setBusyId(t._id);
    try {
      await api.update(t._id, { enabled: !t.enabled });
      setItems(prev => prev.map(x => x._id === t._id ? { ...x, enabled: !t.enabled } : x));
      load();
    } catch (e: any) { toast.error(errMessage(e, 'Failed to update trigger')); }
    finally { setBusyId(null); }
  };

  const runNow = async (t: any) => {
    setBusyId(t._id);
    try {
      const res = await api.run(t._id);
      const id = res?.data?._id || res?.data?.run_id || res?.data?.execution_id;
      toast.success('Instance started');
      load();
      if (id && onOpenInstance) onOpenInstance(id);
    } catch (e: any) {
      toast.error(e?.status === 409 ? 'Skipped — the previous instance from this trigger is still active (overlap: skip).' : errMessage(e, 'Failed to start'));
    } finally { setBusyId(null); }
  };

  const rotate = async (t: any) => {
    setBusyId(t._id);
    try {
      const res = await api.rotateToken(t._id);
      setSecret({ hook_token: res?.data?.hook_token, hook_url: res?.data?.hook_url, title: 'New webhook token' });
      load();
    } catch (e: any) { toast.error(errMessage(e, 'Failed to rotate token')); }
    finally { setBusyId(null); }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.remove(confirmDelete._id);
      toast.success('Trigger deleted');
      setItems(prev => prev.filter(x => x._id !== confirmDelete._id));
    } catch (e: any) { toast.error(errMessage(e, 'Failed to delete trigger')); }
    setConfirmDelete(null);
  };

  const sorted = useMemo(() => [...items].sort((a, b) => (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0)), [items]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[13px] text-slate-500">
          {compact ? 'Start instances automatically on a schedule or from an external system.' : `Triggers start ${targetNoun} instances automatically — on an interval, a cron schedule in a timezone, once at a set time, or from a webhook.`}
        </div>
        <div className="flex items-center gap-2">
          <IconButton label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></IconButton>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openCreate} disabled={!fixedTargetId && !targets.length}>New trigger</Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? <Spinner label="Loading triggers…" /> : sorted.length === 0 ? (
          <EmptyState icon={<Zap className="h-5 w-5" />} title="No triggers yet"
            description={!fixedTargetId && !targets.length ? `Create a ${targetNoun} first, then add a trigger to it.` : `Add a trigger to run this ${targetNoun} automatically.`}
            action={(fixedTargetId || targets.length > 0) && <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>New trigger</Button>} compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead><tr>
                <Th>Name</Th>{!fixedTargetId && <Th className="capitalize">{targetNoun}</Th>}<Th>Schedule</Th><Th>Next run</Th><Th>Last run</Th><Th className="text-right">Runs</Th><Th>Enabled</Th><Th className="w-10" />
              </tr></thead>
              <tbody>
                {sorted.map(t => (
                  <tr key={t._id} className="hover:bg-slate-50/60">
                    <Td><div className="flex items-center gap-2"><TypeIcon type={t.trigger?.type} /><span className="font-medium text-slate-900">{t.name || <span className="text-slate-400">Unnamed</span>}</span></div></Td>
                    {!fixedTargetId && <Td className="max-w-[220px] truncate">{targetName(t[targetKey])}</Td>}
                    <Td>
                      <div className="flex items-center gap-1.5">{describeTrigger(t)}{t.trigger?.overlap === 'skip' && <Tag tone="gray" title="Not started while the previous instance is still active">no overlap</Tag>}</div>
                    </Td>
                    <Td>{t.enabled && t.next_run_at ? <span title={fmtDateTime(t.next_run_at)}>{timeAgo(t.next_run_at)}</span> : <span className="text-slate-400">{t.trigger?.type === 'webhook' ? 'On request' : '—'}</span>}</Td>
                    <Td>
                      {t.last_result ? (
                        <div className="flex items-center gap-1.5" title={t.last_error || ''}>
                          <StatusPill status={t.last_result} />
                          <span className="text-[12px] text-slate-500">{timeAgo(t.last_run_at)}</span>
                          {t.last_error && <span className="max-w-[160px] truncate text-[12px] text-red-600">{t.last_error}</span>}
                        </div>
                      ) : <span className="text-slate-400">Never</span>}
                    </Td>
                    <Td className="text-right tabular-nums">{t.run_count ?? 0}</Td>
                    <Td><Toggle checked={!!t.enabled} onChange={() => toggle(t)} disabled={busyId === t._id} /></Td>
                    <Td className="text-right">
                      <Menu trigger={open => <IconButton label="Actions" onClick={open}><MoreHorizontal className="h-4 w-4" /></IconButton>} items={[
                        { label: 'Run now', icon: <Play className="h-4 w-4" />, onClick: () => runNow(t) },
                        { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(t) },
                        ...(t.trigger?.type === 'webhook' ? [{ label: 'Rotate token', icon: <KeyRound className="h-4 w-4" />, onClick: () => rotate(t) }] : []),
                        'divider',
                        { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setConfirmDelete(t) },
                      ]} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!form} onClose={() => !saving && setForm(null)} title={form?.id ? 'Edit trigger' : 'New trigger'} width={600}
        footer={<><Button onClick={() => setForm(null)} disabled={saving}>Cancel</Button><Button variant="primary" loading={saving} onClick={save}>{form?.id ? 'Save changes' : 'Create trigger'}</Button></>}>
        {form && (
          <div className="space-y-4">
            {formError && <ErrorBanner message={formError} />}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekday 9 AM" autoFocus /></Field>
              {!fixedTargetId ? (
                <Field label={targetNoun[0].toUpperCase() + targetNoun.slice(1)} required>
                  <Select value={form.targetId} disabled={!!form.id} onChange={e => setForm({ ...form, targetId: e.target.value })}>
                    <option value="">Select…</option>
                    {targets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </Field>
              ) : <div />}
            </div>

            <Field label="Trigger type" required>
              <div className="grid grid-cols-4 gap-2">
                {([['interval', 'Interval', Repeat], ['cron', 'Schedule', CalendarClock], ['once', 'Once', Clock], ['webhook', 'Webhook', Webhook]] as const).map(([k, label, I]) => (
                  <button key={k} type="button" disabled={!!form.id && form.type !== k && (form.type === 'webhook' || k === 'webhook')}
                    onClick={() => setForm({ ...form, type: k })}
                    className={cx('flex flex-col items-center gap-1 rounded-md border px-2 py-2.5 text-[12.5px] font-medium transition disabled:opacity-40',
                      form.type === k ? 'border-[var(--sx-primary)] bg-[var(--sx-primary-soft)] text-[var(--sx-primary)]' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
                    <I className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>
            </Field>

            {form.type === 'interval' && (
              <Field label="Run every (minutes)" required hint="Minimum 1 minute. 60 = hourly, 1440 = daily.">
                <Input type="number" min={1} value={form.every_minutes} onChange={e => setForm({ ...form, every_minutes: Number(e.target.value) })} />
              </Field>
            )}
            {form.type === 'cron' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cron expression" required hint="minute hour day month weekday · 0 9 * * 1-5 = 9:00 Mon–Fri">
                  <Input value={form.cron} onChange={e => setForm({ ...form, cron: e.target.value })} className="font-mono" />
                </Field>
                <Field label="Timezone" hint="IANA name">
                  <Input list="sx-tz" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} />
                  <datalist id="sx-tz">{Array.from(new Set([localTz, ...TIMEZONES])).map(z => <option key={z} value={z} />)}</datalist>
                </Field>
              </div>
            )}
            {form.type === 'once' && (
              <Field label="Run at" required hint="Your local time; must be in the future.">
                <Input type="datetime-local" value={form.run_at} onChange={e => setForm({ ...form, run_at: e.target.value })} />
              </Field>
            )}
            {form.type === 'webhook' && (
              <div className="space-y-3">
                <Callout tone="info">A secret URL is generated. External systems POST to it to start an instance; the request body becomes the input. The token is shown <b>once</b>.</Callout>
                <Field label="Rate limit (requests per minute)"><Input type="number" min={1} value={form.rate_limit_per_min} onChange={e => setForm({ ...form, rate_limit_per_min: Number(e.target.value) })} /></Field>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="If the previous instance is still running">
                <Select value={form.overlap} onChange={e => setForm({ ...form, overlap: e.target.value as any })}>
                  <option value="allow">Start another instance (allow)</option>
                  <option value="skip">Skip this run (skip)</option>
                </Select>
              </Field>
              <div className="flex items-end pb-2"><Toggle checked={form.enabled} onChange={v => setForm({ ...form, enabled: v })} label="Enabled" /></div>
            </div>
            <Field label="Input (JSON)" hint={form.type === 'webhook' ? "Used when the webhook body is empty; a webhook's payload replaces it." : 'Passed to every instance this trigger starts.'}>
              <TextArea rows={4} className="font-mono text-[12.5px]" value={form.input} onChange={e => setForm({ ...form, input: e.target.value })} placeholder='{ "source": "erp-batch" }' />
            </Field>
          </div>
        )}
      </Modal>

      <Modal open={!!secret} onClose={() => setSecret(null)} title={secret?.title || 'Webhook'} width={620}
        footer={<Button variant="primary" onClick={() => setSecret(null)}>I've copied it</Button>}>
        {secret && (
          <div className="space-y-3">
            <Callout tone="warning" title="Copy this now">For security the token is shown only once. If it is lost, use “Rotate token” to issue a new one — the old one stops working immediately.</Callout>
            <Field label="Webhook URL">
              <div className="flex items-center gap-2"><Input readOnly value={secret.hook_url || ''} className="font-mono text-[12px]" /><CopyButton text={secret.hook_url || ''} /></div>
            </Field>
            <Field label="Token">
              <div className="flex items-center gap-2"><Input readOnly value={secret.hook_token || ''} className="font-mono text-[12px]" /><CopyButton text={secret.hook_token || ''} /></div>
            </Field>
            <div className="rounded-md bg-slate-900 p-3 font-mono text-[12px] text-slate-100 break-all">
              curl -X POST "{secret.hook_url}" -H "Content-Type: application/json" -d '{'{'}"input": {'{'}"example": true{'}'}{'}'}'
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmDelete} title="Delete trigger?" confirmLabel="Delete"
        message={<>“{confirmDelete?.name || describeTrigger(confirmDelete)}” will stop starting new instances. Instances it already started are kept.</>}
        onConfirm={doDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
};
