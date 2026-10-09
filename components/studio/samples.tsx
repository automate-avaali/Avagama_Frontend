// Demo / test sample inputs for blueprints, served from public/sample-blueprint-inputs/manifest.json.
import React, { useEffect, useState } from 'react';
import { FileText, FileJson } from 'lucide-react';
import { Button, cx } from './ui';

export interface SampleFile { name: string; kind: 'document' | 'input'; url: string }
export interface PlaygroundSample { id: string; label: string; expect: string; input: Record<string, any>; files: SampleFile[] }
export interface OrchestrationSample { id: string; label: string; expect: string; text: string; files: SampleFile[] }
export interface SampleManifest {
  playground: { template: string; slug: string; samples: PlaygroundSample[] }[];
  orchestration: { blueprint: string; slug: string; field: string; samples: OrchestrationSample[] }[];
}

let cache: Promise<SampleManifest | null> | null = null;
export const loadSampleManifest = () => {
  if (!cache) cache = fetch('/sample-blueprint-inputs/manifest.json').then(r => (r.ok ? r.json() : null)).catch(() => null);
  return cache;
};

export const useSampleManifest = () => {
  const [m, setM] = useState<SampleManifest | null>(null);
  useEffect(() => { let live = true; loadSampleManifest().then(x => { if (live) setM(x); }); return () => { live = false; }; }, []);
  return m;
};

const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Find the template samples for a process: by solution slug first, then by the template name in the process name.
export const findTemplateSamples = (m: SampleManifest | null, opts: { slug?: string | null; name?: string | null }) => {
  if (!m) return null;
  if (opts.slug) { const hit = m.playground.find(t => t.slug === opts.slug); if (hit) return hit; }
  const n = norm(opts.name);
  if (!n) return null;
  return m.playground.find(t => n.includes(norm(t.template))) || null;
};

export const SampleFileLinks: React.FC<{ files: SampleFile[]; className?: string }> = ({ files, className }) => (
  <div className={cx('flex flex-wrap gap-1.5', className)}>
    {files.map(f => (
      <a key={f.url} href={f.url} target="_blank" rel="noreferrer" download={f.kind === 'input' ? f.name : undefined}
        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[12px] text-slate-600 hover:border-slate-300 hover:text-slate-900"
        title={f.kind === 'document' ? 'Open the source document' : 'Download the input JSON'}>
        {f.kind === 'document' ? <FileText className="h-3.5 w-3.5" /> : <FileJson className="h-3.5 w-3.5" />}{f.name}
      </a>
    ))}
  </div>
);

export const SampleList: React.FC<{ samples: { id: string; label: string; expect: string; files: SampleFile[] }[]; onUse?: (id: string) => void; useLabel?: string }> = ({ samples, onUse, useLabel = 'Use' }) => (
  <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
    {samples.map(s => (
      <div key={s.id} className="flex items-start gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium text-slate-900">{s.label}</div>
          <div className="text-[12.5px] text-slate-500">Expected: {s.expect}</div>
          <SampleFileLinks files={s.files} className="mt-1.5" />
        </div>
        {onUse && <Button size="sm" variant="subtle" onClick={() => onUse(s.id)}>{useLabel}</Button>}
      </div>
    ))}
  </div>
);

