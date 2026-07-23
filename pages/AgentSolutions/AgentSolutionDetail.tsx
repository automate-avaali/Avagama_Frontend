import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ArrowRight, ExternalLink, Download, Copy, Check, CheckCircle2, Circle,
  RotateCcw, FileText, Sparkles, AlertTriangle, Info, X, Play, Rocket, MonitorSmartphone, UploadCloud,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAgentSolution, AgentSolution, SampleFile, SamplePO, ScenarioTone } from './agentSolutionsData';

const toneStyles: Record<ScenarioTone, { chip: string; ring: string; dot: string; label: string }> = {
  success: { chip: 'bg-green-50 text-green-600', ring: 'hover:border-green-200', dot: 'bg-green-500', label: 'Success' },
  info: { chip: 'bg-sky-50 text-sky-600', ring: 'hover:border-sky-200', dot: 'bg-sky-500', label: 'Standard' },
  warning: { chip: 'bg-amber-50 text-amber-600', ring: 'hover:border-amber-200', dot: 'bg-amber-500', label: 'Partial' },
  danger: { chip: 'bg-red-50 text-red-600', ring: 'hover:border-red-200', dot: 'bg-red-500', label: 'Errors' },
};

const poToText = (p: SamplePO) => {
  const lines = p.lines
    .map(l => `  ${l.code}\t${l.description}\tQty ${l.qty}\t${p.currency} ${l.unitPrice.toFixed(2)}${l.flag ? `  (${l.flag})` : ''}`)
    .join('\n');
  return [
    `PURCHASE ORDER`,
    `Company: ${p.company}`,
    `PO Number: ${p.poNumber}`,
    `PO Date: ${p.poDate}`,
    `Delivery Date: ${p.deliveryDate}`,
    `Customer Code: ${p.customerCode}`,
    `GST No: ${p.gst}`,
    `Payment Terms: ${p.paymentTerms}`,
    `Currency: ${p.currency}`,
    `Shipping Address: ${p.shippingAddress}`,
    ``,
    `Line Items:`,
    lines,
  ].join('\n');
};

// ---------------------------------------------------------------------------
// Scenario card
// ---------------------------------------------------------------------------
const ScenarioCard: React.FC<{ sample: SampleFile }> = ({ sample }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = toneStyles[sample.tone];

  const copy = async () => {
    if (!sample.po) return;
    try {
      await navigator.clipboard.writeText(poToText(sample.po));
      setCopied(true);
      toast.success('Details copied');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const hasActions = !!sample.fileName || !!sample.po;

  return (
    <div className={`bg-white rounded-[28px] border border-gray-100 shadow-sm transition-all ${t.ring}`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
            <h4 className="text-sm font-black text-gray-900">{sample.label}</h4>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${t.chip}`}>{t.label}</span>
        </div>

        <div className="flex items-start gap-2 text-[13px] text-gray-600 font-medium leading-relaxed">
          <Info size={15} className="text-gray-300 shrink-0 mt-0.5" />
          <span><span className="font-black text-gray-800">Expected: </span>{sample.expectation}</span>
        </div>

        {sample.notes.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {sample.notes.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-[11.5px] text-gray-500 font-medium leading-snug">
                <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" /> {n}
              </li>
            ))}
          </ul>
        )}

        {hasActions && (
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {sample.fileName && (
              <a
                href={`/sample-pos/${sample.fileName}`}
                download
                className="flex items-center gap-2 px-4 py-2.5 bg-[#a26da8] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#8e5a94] transition-all"
              >
                <Download size={13} /> Download PDF
              </a>
            )}
            {sample.po && (
              <button
                onClick={copy}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />} Copy details
              </button>
            )}
            {sample.po && (
              <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-gray-700 transition-all"
              >
                <FileText size={13} /> {open ? 'Hide' : 'Preview'}
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && sample.po && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="bg-[#fbfbfe] rounded-2xl border border-gray-100 p-5 text-[12px]">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                  <Field label="Company" value={sample.po.company} />
                  <Field label="PO Number" value={sample.po.poNumber} />
                  <Field label="Customer Code" value={sample.po.customerCode} />
                  <Field label="Delivery" value={sample.po.deliveryDate} />
                  <Field label="GST No" value={sample.po.gst} />
                  <Field label="Terms" value={`${sample.po.paymentTerms} · ${sample.po.currency}`} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="py-2 pr-3">Code</th>
                        <th className="py-2 pr-3">Description</th>
                        <th className="py-2 pr-3 text-right">Qty</th>
                        <th className="py-2 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 font-semibold">
                      {sample.po.lines.map((l, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-2 pr-3 font-mono text-[11px]">{l.code}</td>
                          <td className="py-2 pr-3">
                            {l.description}
                            {l.flag && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-widest">{l.flag}</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-right">{l.qty}</td>
                          <td className="py-2 text-right">{l.unitPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
    <div className="text-[12px] font-bold text-gray-800 break-words">{value}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Detail page
// ---------------------------------------------------------------------------
const AgentSolutionDetail: React.FC = () => {
  const { agentId = '' } = useParams();
  const navigate = useNavigate();
  const solution = getAgentSolution(agentId);

  const progressKey = `agentTutorial:${agentId}`;
  const welcomeKey = `agentWelcome:${agentId}`;

  const [done, setDone] = useState<boolean[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  // Non-embeddable agents (e.g. behind SSO / X-Frame-Options) default to the
  // launch panel so users never see a blank iframe; embeddable ones show inline.
  const [embedMode, setEmbedMode] = useState<'embed' | 'fallback'>(
    () => (getAgentSolution(agentId)?.embeddable ? 'embed' : 'fallback')
  );
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);
  const usecasesRef = useRef<HTMLDivElement>(null);

  const accentText = solution?.accentText || '#ffffff';

  const featuredSample = useMemo(() => {
    if (!solution) return undefined;
    return (
      solution.samples.find(s => s.id === solution.featuredSampleId) ||
      solution.samples.find(s => s.tone === 'success') ||
      solution.samples[0]
    );
  }, [solution]);

  useEffect(() => {
    if (!solution) return;
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) || 'null');
      if (Array.isArray(saved) && saved.length === solution.steps.length) setDone(saved);
      else setDone(new Array(solution.steps.length).fill(false));
    } catch {
      setDone(new Array(solution.steps.length).fill(false));
    }
    setShowWelcome(!localStorage.getItem(welcomeKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const persist = (next: boolean[]) => {
    setDone(next);
    try { localStorage.setItem(progressKey, JSON.stringify(next)); } catch {}
  };

  const toggleStep = (i: number) => {
    const next = [...done];
    next[i] = !next[i];
    persist(next);
  };

  const resetProgress = () => persist(new Array(solution?.steps.length || 0).fill(false));

  const dismissWelcome = () => {
    setShowWelcome(false);
    try { localStorage.setItem(welcomeKey, '1'); } catch {}
  };

  const startWalkthrough = () => {
    setShowWelcome(false);
    try { localStorage.setItem(welcomeKey, '1'); } catch {}
    setShowWalkthrough(true);
  };

  const markStepDone = (i: number) => {
    if (done[i]) return;
    const next = [...done];
    next[i] = true;
    persist(next);
  };

  const finishWalkthrough = () => {
    persist(new Array(solution?.steps.length || 0).fill(true));
    setShowWalkthrough(false);
    toast.success('Tutorial complete 🎉');
  };

  const completed = done.filter(Boolean).length;
  const total = solution?.steps.length || 0;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const openInNewTab = () => window.open(solution?.agentUrl, '_blank', 'noopener,noreferrer');

  // If the iframe hasn't reported a load shortly after mounting, surface the hint.
  const [showEmbedHint, setShowEmbedHint] = useState(false);
  useEffect(() => {
    if (embedMode !== 'embed') return;
    setIframeLoaded(false);
    setShowEmbedHint(false);
    const t = setTimeout(() => setShowEmbedHint(true), 4000);
    return () => clearTimeout(t);
  }, [embedMode, agentId]);

  const scrollToEmbed = () => embedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const gradient = useMemo(
    () => (solution ? `linear-gradient(135deg, ${solution.accentFrom}, ${solution.accentTo})` : ''),
    [solution]
  );

  if (!solution || solution.status !== 'live') {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#fafafa] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-[24px] bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-6 text-2xl">🚧</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">This solution isn’t available yet</h1>
          <p className="text-gray-500 font-medium mb-8">It may be coming soon or the link is incorrect.</p>
          <Link to="/agent-solutions" className="inline-flex items-center gap-2 px-6 py-3 bg-[#a26da8] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#8e5a94] transition-all">
            <ArrowLeft size={15} /> Back to Agent Solutions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#fafafa]">
      {/* Welcome modal */}
      <AnimatePresence>
        {showWelcome && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={dismissWelcome}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="pointer-events-auto w-full max-w-lg max-h-full flex flex-col bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="h-24 sm:h-28 shrink-0 relative flex items-center justify-center" style={{ background: gradient }}>
                <span className="text-4xl sm:text-5xl drop-shadow-sm">{solution.emoji}</span>
                <button onClick={dismissWelcome} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-8 pt-6 pb-4 custom-scrollbar">
                <div className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-2">Introducing</div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">{solution.name}</h2>
                <p className="text-gray-500 font-medium leading-relaxed mb-6">{solution.tagline}</p>
                <div className="space-y-2.5">
                  {solution.whatItDoes.map((w, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-[#6fcbbd] shrink-0 mt-0.5" />
                      <span className="text-[13.5px] font-semibold text-gray-700 leading-snug">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="shrink-0 px-8 py-5 border-t border-gray-100 bg-white">
                <button
                  onClick={startWalkthrough}
                  className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  style={{ background: gradient, color: accentText }}
                >
                  <Play size={15} /> Start the Guided Walkthrough
                </button>
                <button onClick={dismissWelcome} className="w-full mt-2 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                  Skip for now
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Guided walkthrough */}
      <AnimatePresence>
        {showWalkthrough && (
          <GuidedWalkthrough
            solution={solution}
            featured={featuredSample}
            gradient={gradient}
            accentText={accentText}
            anchors={{ agent: embedRef, usecases: usecasesRef }}
            onClose={() => setShowWalkthrough(false)}
            onStepComplete={markStepDone}
            onFinish={finishWalkthrough}
            onLaunch={openInNewTab}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12">
        {/* Back + header */}
        <button onClick={() => navigate('/agent-solutions')} className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-[11px] font-black uppercase tracking-widest mb-6 transition-colors">
          <ArrowLeft size={15} /> All Agent Solutions
        </button>

        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
          <div className="w-16 h-16 rounded-[22px] flex items-center justify-center text-3xl shadow-lg shrink-0" style={{ background: gradient }}>
            <span className="drop-shadow-sm">{solution.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-1">{solution.category}</div>
            <h1 className="text-[30px] md:text-[36px] font-black text-gray-900 tracking-tight leading-tight">{solution.name}</h1>
            <p className="text-gray-500 font-medium mt-1">{solution.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
            <button onClick={() => setShowWelcome(true)} className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-purple-200 transition-all">
              Intro
            </button>
            <button onClick={() => setShowWalkthrough(true)} className="flex items-center gap-2 px-5 py-3 bg-white border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all" style={{ borderColor: solution.accentFrom, color: solution.accentText && solution.accentText !== '#ffffff' ? solution.accentText : solution.accentFrom }}>
              <Play size={13} /> Start Tutorial
            </button>
            <button onClick={openInNewTab} className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ background: gradient, color: accentText }}>
              <ExternalLink size={14} /> Launch Agent
            </button>
          </div>
        </div>

        {/* ---- Embed / launch ---- */}
        <div ref={embedRef} className="mb-12 scroll-mt-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <MonitorSmartphone size={18} className="text-[#a26da8]" /> The Agent
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEmbedMode(m => (m === 'embed' ? 'fallback' : 'embed'))}
                className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-purple-200 transition-all"
              >
                {embedMode === 'embed' ? 'Use launch panel' : 'Try inline embed'}
              </button>
              <button onClick={openInNewTab} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                <ExternalLink size={13} /> Open in new tab
              </button>
            </div>
          </div>

          {embedMode === 'embed' ? (
            <div>
              {showEmbedHint && !iframeLoaded && (
                <div className="flex items-start gap-3 mb-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-semibold text-amber-700 leading-relaxed">
                    If the window below is blank, this agent blocks in-page embedding for security. Use
                    <button onClick={openInNewTab} className="underline font-black mx-1">Open in new tab</button>
                    to launch it directly.
                  </p>
                </div>
              )}
              <div className="relative bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden" style={{ height: '70vh', minHeight: 520 }}>
                <iframe
                  key={solution.agentUrl}
                  src={solution.agentUrl}
                  title={solution.name}
                  onLoad={() => setIframeLoaded(true)}
                  className="w-full h-full"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
                />
              </div>
            </div>
          ) : (
            <LaunchPanel gradient={gradient} emoji={solution.emoji} name={solution.name} onLaunch={openInNewTab} />
          )}
        </div>

        {/* ---- Tutorial ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Steps */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Rocket size={18} className="text-[#a26da8]" /> Interactive Tutorial
              </h2>
              <div className="flex items-center gap-3">
                {completed > 0 && (
                  <button onClick={resetProgress} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-700 transition-colors">
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
                <button onClick={() => setShowWalkthrough(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all" style={{ background: gradient, color: accentText }}>
                  <Play size={12} /> {completed > 0 ? 'Replay walkthrough' : 'Start walkthrough'}
                </button>
              </div>
            </div>

            {/* progress */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your progress</span>
                <span className="text-[11px] font-black text-[#a26da8]">{completed} / {total} · {pct}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: gradient }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
              </div>
              {pct === 100 && (
                <div className="mt-3 flex items-center gap-2 text-[12px] font-black text-green-600">
                  <CheckCircle2 size={15} /> Tutorial complete — nicely done! 🎉
                </div>
              )}
            </div>

            <div className="space-y-3">
              {solution.steps.map((step, i) => {
                const isDone = done[i];
                const isCurrent = !isDone && done.slice(0, i).every(Boolean);
                return (
                  <div
                    key={i}
                    className={`bg-white rounded-[24px] border shadow-sm p-5 transition-all ${
                      isCurrent ? 'border-purple-200 ring-2 ring-purple-50' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <button onClick={() => toggleStep(i)} className="shrink-0 mt-0.5">
                        {isDone ? (
                          <CheckCircle2 size={26} className="text-[#6fcbbd]" />
                        ) : (
                          <Circle size={26} className={isCurrent ? 'text-[#a26da8]' : 'text-gray-200'} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Step {i + 1}</span>
                          {isCurrent && <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#a26da8] text-[8px] font-black uppercase tracking-widest">You are here</span>}
                        </div>
                        <h3 className={`text-[15px] font-black mb-1 ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{step.title}</h3>
                        <p className="text-[13px] font-medium text-gray-500 leading-relaxed">{step.description}</p>
                        {step.tip && (
                          <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-[#fbfbfe] border border-gray-100 rounded-xl">
                            <Sparkles size={13} className="text-[#a26da8] shrink-0 mt-0.5" />
                            <span className="text-[11.5px] font-semibold text-gray-500 leading-snug">{step.tip}</span>
                          </div>
                        )}
                        {i === 0 && (
                          <button onClick={scrollToEmbed} className="mt-3 text-[10px] font-black text-[#a26da8] uppercase tracking-widest hover:opacity-70 transition-opacity">
                            Jump to the agent →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Samples */}
          <div className="lg:col-span-2 scroll-mt-24" ref={usecasesRef}>
            {(() => {
              const hasDownloads = solution.samples.some(s => !!s.fileName || !!s.po);
              return (
                <>
                  <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-[#a26da8]" /> {hasDownloads ? 'Sample Purchase Orders' : 'Use Cases & Scenarios'}
                  </h2>
                  <p className="text-[13px] font-medium text-gray-500 leading-relaxed mb-5">
                    {hasDownloads
                      ? 'Each sample triggers a different outcome. Download the PDF (or copy the details) and feed it to the agent.'
                      : 'Each card is a different case the agent handles. Try to reproduce each one and compare it to the expected outcome.'}
                  </p>
                </>
              );
            })()}
            {solution.sampleInputs && solution.sampleInputs.length > 0 && (
              <div className="mb-5 p-5 bg-white rounded-[24px] border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Download size={12} /> Sample delivery notes to try
                </div>
                <div className="space-y-2">
                  {solution.sampleInputs.map(si => (
                    <a
                      key={si.id}
                      href={si.url}
                      download
                      className="flex items-start gap-2.5 px-3 py-2.5 bg-[#fbfbfe] border border-gray-100 rounded-xl hover:border-purple-200 transition-all"
                    >
                      <Download size={14} className="shrink-0 mt-0.5" style={{ color: solution.accentFrom }} />
                      <div className="min-w-0">
                        <div className="text-[12px] font-black text-gray-800">{si.label}</div>
                        <div className="text-[10.5px] font-medium text-gray-400 leading-snug">{si.description}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4">
              {solution.samples.map(s => (
                <ScenarioCard key={s.id} sample={s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Guided walkthrough — an interactive, step-by-step overlay launchable anytime.
// Walks the user through a solid valid use case, then recaps every scenario.
// ---------------------------------------------------------------------------
const GuidedWalkthrough: React.FC<{
  solution: AgentSolution;
  featured?: SampleFile;
  gradient: string;
  accentText: string;
  anchors: Record<'agent' | 'usecases', React.RefObject<HTMLElement>>;
  onClose: () => void;
  onStepComplete: (i: number) => void;
  onFinish: () => void;
  onLaunch: () => void;
}> = ({ solution, featured, gradient, accentText, anchors, onClose, onStepComplete, onFinish, onLaunch }) => {
  const stepCount = solution.steps.length;
  const total = stepCount + 1; // + recap panel
  const [idx, setIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isRecap = idx === stepCount;
  const step = solution.steps[idx];
  const anchorKey: 'agent' | 'usecases' = isRecap ? 'usecases' : (step.anchor || 'agent');

  const [ring, setRing] = useState<React.CSSProperties | null>(null);
  const [cardPos, setCardPos] = useState<React.CSSProperties>({ opacity: 0 });

  const next = () => {
    if (idx < stepCount) onStepComplete(idx);
    if (idx < total - 1) setIdx(idx + 1);
    else onFinish();
  };
  const back = () => setIdx(i => Math.max(0, i - 1));

  const handleFile = (file?: File | null) => {
    if (!file) return;
    setUploadedName(file.name);
    onStepComplete(idx);
    toast.success(`${file.name} added`);
    window.setTimeout(() => setIdx(i => Math.min(total - 1, i + 1)), 950);
  };

  const copyFeatured = async () => {
    if (!featured?.po) return;
    try {
      await navigator.clipboard.writeText(poToText(featured.po));
      setCopied(true);
      toast.success('Sample copied');
      setTimeout(() => setCopied(false), 1600);
    } catch { toast.error('Could not copy'); }
  };

  // Spotlight + tip-card positioning against the real on-page target.
  useLayoutEffect(() => {
    const place = () => {
      const el = anchors[anchorKey]?.current || null;
      const vw = window.innerWidth, vh = window.innerHeight;
      const cardW = Math.min(384, vw - 24);
      const cardH = cardRef.current?.offsetHeight || 340;
      if (!el) {
        setRing(null);
        setCardPos({ left: Math.max(12, (vw - cardW) / 2), top: Math.max(12, vh - cardH - 24), width: cardW, opacity: 1 });
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 8;
      setRing({
        position: 'fixed', top: r.top - pad, left: r.left - pad,
        width: r.width + pad * 2, height: r.height + pad * 2,
        borderRadius: 26,
        boxShadow: `0 0 0 3px ${solution.accentFrom}, 0 0 0 9999px rgba(15,23,42,0.55)`,
        pointerEvents: 'none', zIndex: 121,
      });
      const tall = r.height > vh * 0.6;
      let left = Math.min(Math.max(r.left + r.width / 2 - cardW / 2, 12), vw - cardW - 12);
      let top: number;
      if (!tall && vh - r.bottom > cardH + 28) top = r.bottom + 16;
      else if (!tall && r.top > cardH + 28) top = r.top - cardH - 16;
      else { top = vh - cardH - 20; left = Math.min(Math.max((vw - cardW) / 2, 12), vw - cardW - 12); }
      setCardPos({ left, top: Math.max(12, top), width: cardW, opacity: 1 });
    };
    place();
    anchors[anchorKey]?.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const t = window.setTimeout(place, 400);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.clearTimeout(t); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, anchorKey, uploadedName]);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Spotlight: the ring paints both the accent outline and the page dim via a
          huge box-shadow. It is pointer-events:none, so the highlighted target
          (the real embedded agent) stays fully interactive. */}
      {ring ? <div style={ring} /> : <div className="fixed inset-0 bg-slate-900/55 z-[121] pointer-events-none" />}

      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="fixed z-[130] bg-white rounded-[24px] border border-gray-100 shadow-[0_24px_70px_-16px_rgba(17,12,46,0.4)] overflow-hidden flex flex-col"
        style={{ ...cardPos, maxHeight: 'calc(100vh - 24px)' }}
      >
          {/* Header — light */}
          <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: gradient }}>
                <Rocket size={14} style={{ color: accentText }} />
              </span>
              <div className="min-w-0 leading-none">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-800">Guided Walkthrough</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">{isRecap ? 'Recap' : `Step ${idx + 1} of ${stepCount}`}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={onLaunch} title="Open the agent in a new tab" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest transition-all">
                <ExternalLink size={12} /> Tab
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-all">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="shrink-0 px-5 pb-1">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: gradient }} animate={{ width: `${((idx + 1) / total) * 100}%` }} transition={{ duration: 0.35 }} />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            {!isRecap ? (
              <div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black mb-4 shadow-md" style={{ background: gradient, color: accentText }}>
                  {idx + 1}
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">{step.title}</h3>
                <p className="text-[14px] font-medium text-gray-600 leading-relaxed">{step.description}</p>
                {step.tip && (
                  <div className="mt-4 flex items-start gap-2.5 px-4 py-3 bg-[#fbfbfe] border border-gray-100 rounded-2xl">
                    <Sparkles size={15} className="shrink-0 mt-0.5" style={{ color: solution.accentFrom }} />
                    <span className="text-[12.5px] font-semibold text-gray-600 leading-snug">{step.tip}</span>
                  </div>
                )}

                {step.action === 'upload' && (
                  <div className="mt-5">
                    {solution.sampleInputs && solution.sampleInputs.length > 0 && (
                      <>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Grab a sample delivery note</div>
                        <div className="space-y-2 mb-4">
                          {solution.sampleInputs.map(si => (
                            <a
                              key={si.id}
                              href={si.url}
                              download
                              className="flex items-start gap-2.5 px-3 py-2.5 bg-white border border-gray-100 rounded-xl hover:border-purple-200 transition-all"
                            >
                              <Download size={14} className="shrink-0 mt-0.5" style={{ color: solution.accentFrom }} />
                              <div className="min-w-0">
                                <div className="text-[12px] font-black text-gray-800">{si.label}</div>
                                <div className="text-[10.5px] font-medium text-gray-400 leading-snug">{si.description}</div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        uploadedName ? 'border-green-300 bg-green-50' : dragOver ? 'bg-purple-50/60' : 'border-gray-200 hover:border-purple-200 bg-[#fbfbfe]'
                      }`}
                      style={dragOver && !uploadedName ? { borderColor: solution.accentFrom } : undefined}
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        accept=".json,.pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                        onChange={e => handleFile(e.target.files?.[0])}
                      />
                      {uploadedName ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle2 size={18} />
                          <span className="text-[13px] font-black truncate max-w-[220px]">{uploadedName}</span>
                          <span className="text-[11px] font-bold text-green-500">· advancing…</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={26} className="mx-auto text-gray-300 mb-2" />
                          <div className="text-[13px] font-black text-gray-700">Drop your delivery note here or click to upload</div>
                          <div className="text-[11px] font-medium text-gray-400 mt-1">We’ll move to the next step automatically once you add a file</div>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-gray-400 mt-3 leading-snug">
                      Tip: upload the <span className="font-black text-gray-500">same file</span> into the agent window on the page to see it parsed and matched.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                  <CheckCircle2 size={22} />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight mb-1">You’re ready to explore every case</h3>
                <p className="text-[13.5px] font-medium text-gray-500 leading-relaxed mb-5">
                  You’ve seen the full flow. Now try each scenario in the agent and compare it to the expected outcome:
                </p>
                <div className="space-y-2.5">
                  {solution.samples.map(s => {
                    const st = toneStyles[s.tone];
                    const isFeatured = s.id === featured?.id;
                    return (
                      <div key={s.id} className={`flex items-start gap-3 p-3.5 rounded-2xl border ${isFeatured ? 'border-gray-200 bg-gray-50/60' : 'border-gray-100 bg-white'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${st.dot}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[13px] font-black text-gray-900">{s.label}</h4>
                            {isFeatured && <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest" style={{ background: gradient, color: accentText }}>Try first</span>}
                          </div>
                          <p className="text-[12px] font-medium text-gray-500 leading-snug mt-0.5">{s.expectation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Featured sample strip */}
          {idx >= 1 && !isRecap && featured && (!!featured.fileName || !!featured.po) && (
            <div className="shrink-0 px-5 py-3 bg-[#fbfbfe] border-t border-gray-100 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-auto truncate">
                Working sample: <span style={{ color: solution.accentFrom }}>{featured.label}</span>
              </span>
              {featured.fileName && (
                <a href={`/sample-pos/${featured.fileName}`} download className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all" style={{ background: gradient, color: accentText }}>
                  <Download size={12} /> PDF
                </a>
              )}
              {featured.po && (
                <button onClick={copyFeatured} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                  {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />} Copy
                </button>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
            <button
              onClick={back}
              disabled={idx === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50"
            >
              <ArrowLeft size={13} /> Back
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`rounded-full transition-all ${i === idx ? 'w-5 h-2' : 'w-2 h-2'}`}
                  style={{ background: i === idx ? undefined : '#e5e7eb', backgroundImage: i === idx ? gradient : undefined }}
                  aria-label={`Go to panel ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all"
              style={{ background: gradient, color: accentText }}
            >
              {isRecap ? 'Finish' : 'Next'} {isRecap ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
      </motion.div>
    </>
  );
};

const LaunchPanel: React.FC<{ gradient: string; emoji: string; name: string; onLaunch: () => void }> = ({ gradient, emoji, name, onLaunch }) => (
  <div className="relative bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: 420 }}>
    <div className="absolute inset-0 opacity-[0.06]" style={{ background: gradient }} />
    <div className="relative h-full flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="w-20 h-20 rounded-[26px] flex items-center justify-center text-4xl shadow-lg mb-6" style={{ background: gradient }}>
        <span className="drop-shadow-sm">{emoji}</span>
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2">Launch {name}</h3>
      <p className="text-[14px] font-medium text-gray-500 max-w-md leading-relaxed mb-8">
        This agent opens in its own secure window. Click below to launch it in a new tab, then follow the tutorial steps here.
      </p>
      <button onClick={onLaunch} className="flex items-center gap-2 px-8 py-4 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ background: gradient }}>
        <ExternalLink size={15} /> Open the Agent
      </button>
    </div>
  </div>
);

export default AgentSolutionDetail;
