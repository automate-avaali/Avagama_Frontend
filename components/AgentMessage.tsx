import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Wrench } from 'lucide-react';

// ---------------------------------------------------------------------------
// AgentMessage — the single, shared renderer for assistant/agent chat replies.
// Used by every chat surface (public chat, builder preview, …) so responses
// look consistent: tool calls become clean chips, Markdown/tables render
// properly, citations become hoverable source badges, and messy model output
// (raw XML, reasoning tags, ASCII rules, tab-separated tables) is normalised.
// Built on react-markdown + remark-gfm.
// ---------------------------------------------------------------------------

export interface ParsedToolCall { name: string; params: Record<string, string>; }

// Citation metadata from the agent test-chat response (data.citations[]). All
// location fields are optional — public/deployed chat may only send the base ones.
export interface Citation {
  index: number;
  source_id?: string;
  chunk_id?: string;
  score?: number;
  chunk_index?: number;
  page?: number;
  line_start?: number;
  line_end?: number;
  char_start?: number;
  char_end?: number;
}

// Turn a run of tab-separated lines into a GitHub-flavoured Markdown table so it
// renders as a real table instead of raw columns of text.
const convertTabTables = (block: string): string => {
  const lines = block.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].includes('\t')) {
      const run: string[] = [];
      while (i < lines.length && lines[i].includes('\t')) { run.push(lines[i]); i++; }
      if (run.length >= 2) {
        const rows = run.map(l => l.split('\t').map(c => c.trim().replace(/<br\s*\/?>/gi, ' ').replace(/\|/g, '\\|')));
        const cols = Math.max(...rows.map(r => r.length));
        const pad = (r: string[]) => { const c = [...r]; while (c.length < cols) c.push(''); return c; };
        out.push('', '| ' + pad(rows[0]).join(' | ') + ' |', '| ' + pad(rows[0]).map(() => '---').join(' | ') + ' |');
        for (let r = 1; r < rows.length; r++) out.push('| ' + pad(rows[r]).join(' | ') + ' |');
        out.push('');
      } else {
        out.push(...run);
      }
    } else { out.push(lines[i]); i++; }
  }
  return out.join('\n');
};

// Normalise LaTeX math delimiters so remark-math / KaTeX can render them:
//   \[ … \]  → $$…$$ (display)      ·   \( … \) → $…$ (inline)
//   bare [ …\frac… ] → $$…$$        — some models drop the backslash on the delimiter
//   but keep the LaTeX commands inside; $…$ / $$…$$ are already handled and left alone.
const MATH_CMD = /\\(?:frac|sqrt|text|begin|end|sum|int|prod|lim|cdot|times|div|leq|geq|neq|approx|pm|alpha|beta|gamma|delta|theta|lambda|mu|sigma|omega|pi|infty|partial|nabla|left|right|hat|bar|vec|overline|mathrm|mathbf)\b/;
const normalizeMath = (s: string): string => {
  let out = s
    .replace(/\\\[\s*([\s\S]+?)\s*\\\]/g, (_w, m) => `\n\n$$${m}$$\n\n`)
    .replace(/\\\(\s*([\s\S]+?)\s*\\\)/g, (_w, m) => `$${m}$`);
  // Bare [ … ] (no nested brackets) that clearly contains LaTeX → display math.
  out = out.replace(/\[\s*([^\[\]]*?)\s*\]/g, (whole, inner) =>
    MATH_CMD.test(inner) ? `\n\n$$${inner}$$\n\n` : whole);
  return out;
};

// Convert citation markers into Markdown links that the `a` component renders as
// hoverable source badges. Handles two marker styles:
//   • fullwidth 【1†L1-L3】  (one or several sources per bracket) — always a citation
//   • ASCII [1], [2]        — only when the number is a real citation index
// The index is encoded in the href (#cite:N) so the badge can look up its metadata.
const linkifyCitations = (s: string, valid: Set<number>): string => {
  // Fullwidth 【n†loc】 (one or several). Consume a leading space so the badge sits snug.
  let out = s.replace(/[ \t ]*【\s*([^】]*?)\s*】/g, (whole, inner) => {
    const re = /(\d+)\s*†\s*([^,，;、]+)/g;
    const parts: string[] = [];
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(String(inner))) !== null) {
      parts.push(`[${mm[1]}](#cite:${mm[1]} "${(mm[2] || '').trim().replace(/"/g, '')}")`);
    }
    if (parts.length === 0) {
      const num = String(inner).trim();
      return /^\d+$/.test(num) ? `[${num}](#cite:${num} "")` : whole; // leave non-citation brackets alone
    }
    return parts.join('');
  });
  // ASCII [n] citation markers → badges. Convert known indices (or any [n] when the
  // response carries no citation list). A preceding word char (e.g. arr[0]) is skipped
  // and "[n](…)" links are left alone; a leading space is dropped so spacing is uniform.
  out = out.replace(/(^|[^\w])[ \t ]*\[(\d{1,3})\](?!\()/g, (whole, pre, n) => {
    if (!(valid.size === 0 || valid.has(Number(n)))) return whole;
    const sep = /\s/.test(pre) ? '' : pre; // drop a whitespace separator; keep punctuation / start
    return `${sep}[${n}](#cite:${n} "")`;
  });
  // Let citation badges hug the following punctuation (no "¹ ." gap).
  out = out.replace(/(\]\(#cite:\d+ "[^"]*"\))[ \t ]+([.,;:!?，。；：！？)])/g, '$1$2');
  return out;
};

// Clean up messy agent formatting: drop heavy ASCII divider lines, convert
// tab-separated tables to Markdown, and linkify citations. Fenced code untouched.
const normalizeAgentMarkdown = (input: string, valid: Set<number>): string =>
  input
    .split(/(```[\s\S]*?```)/g)
    .map((seg, idx) => {
      if (idx % 2 === 1) return seg; // fenced code — leave exactly as-is
      const noRules = seg.replace(/^[^\S\n]*[─-╿]{3,}[^\S\n]*$/gm, ''); // box-drawing rules
      return linkifyCitations(normalizeMath(convertTabTables(noRules)), valid);
    })
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// Pull out <tool_call>…</tool_call> markup (both the <function=…><parameter=…>
// form and the OpenAI-style JSON form), strip stray reasoning tags, and return
// the human-readable text plus any parsed tool calls.
export const parseAgentContent = (
  raw: string,
  validIndices: Set<number> = new Set(),
): { text: string; toolCalls: ParsedToolCall[] } => {
  let text = raw || '';
  const toolCalls: ParsedToolCall[] = [];

  const blockRe = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(text)) !== null) {
    const inner = (m[1] || '').trim();
    let name = 'tool';
    const params: Record<string, string> = {};

    const nameMatch = inner.match(/<function=([^>\s]+)\s*>/i);
    if (nameMatch) {
      name = nameMatch[1];
      const paramRe = /<parameter=([^>\s]+)\s*>\s*([\s\S]*?)\s*<\/parameter>/gi;
      let p: RegExpExecArray | null;
      while ((p = paramRe.exec(inner)) !== null) params[p[1]] = (p[2] || '').trim();
    } else {
      try {
        const j: any = JSON.parse(inner);
        name = j?.name || j?.function?.name || 'tool';
        const args = j?.arguments ?? j?.parameters ?? j?.function?.arguments;
        const parsed = typeof args === 'string' ? JSON.parse(args) : args;
        if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([k, v]) => { params[k] = typeof v === 'string' ? v : JSON.stringify(v); });
        }
      } catch { /* leave as a generic tool chip */ }
    }
    toolCalls.push({ name, params });
  }

  text = text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
    .replace(/<tool_call>[\s\S]*$/gi, '')
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<\/?think(?:ing)?>/gi, '')
    .trim();

  text = normalizeAgentMarkdown(text, validIndices);

  return { text, toolCalls };
};

// Hover label for a citation badge — rich when metadata is present, otherwise a
// simple "Source N" (+ any inline location captured from a 【N†loc】 marker).
const citationLabel = (c: Citation | undefined, fallbackTitle: string, num: string): string => {
  if (c) {
    const bits = [`Source ${c.index}`];
    if (c.page != null) bits.push(`Page ${c.page}`);
    if (c.line_start != null && c.line_end != null) bits.push(`lines ${c.line_start}–${c.line_end}`);
    else if (c.line_start != null) bits.push(`line ${c.line_start}`);
    if (typeof c.score === 'number') bits.push(`similarity ${c.score.toFixed(2)}`);
    return bits.join(' · ');
  }
  return `Source ${num}${fallbackTitle ? ` · ${fallbackTitle}` : ''}`;
};

// Static Markdown components (everything except the citation-aware <a>).
const baseComponents: Record<string, any> = {
  h1: (props: any) => <h3 className="text-[15px] font-black text-gray-900 mt-3 mb-1.5" {...props} />,
  h2: (props: any) => <h4 className="text-[14px] font-black text-gray-900 mt-3 mb-1.5" {...props} />,
  h3: (props: any) => <h5 className="text-[13px] font-black text-gray-900 mt-2.5 mb-1" {...props} />,
  table: ({ node, ...props }: any) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-gray-100">
      <table className="min-w-full border-collapse" {...props} />
    </div>
  ),
  thead: (props: any) => <thead className="bg-gray-50" {...props} />,
  th: (props: any) => <th className="px-3 py-2 text-left border-b border-gray-100 text-[11px] font-black uppercase tracking-wider text-gray-500 whitespace-nowrap" {...props} />,
  td: (props: any) => <td className="px-3 py-2 border-b border-gray-50 text-xs text-gray-700 align-top" {...props} />,
  p: (props: any) => <p className="mb-2 last:mb-0 break-words leading-relaxed" {...props} />,
  strong: (props: any) => <strong className="font-black text-gray-900" {...props} />,
  em: (props: any) => <em className="italic" {...props} />,
  ul: (props: any) => <ul className="list-disc ml-5 space-y-1 my-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal ml-5 space-y-1 my-2" {...props} />,
  li: (props: any) => <li className="pl-1 break-words leading-relaxed" {...props} />,
  hr: (props: any) => <hr className="my-3 border-gray-100" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-purple-100 pl-4 py-1 my-3 italic text-gray-500" {...props} />,
  code: ({ className, children, ...props }: any) => {
    const isBlock = /language-/.test(className || '');
    return isBlock
      ? <code className={`font-mono ${className || ''}`} {...props}>{children}</code>
      : <code className="bg-gray-100 text-[#8e5a94] rounded px-1.5 py-0.5 text-[0.85em] font-mono break-words" {...props}>{children}</code>;
  },
  pre: (props: any) => <pre className="my-2 bg-slate-900 text-slate-100 rounded-xl p-3 overflow-x-auto text-[12px] leading-relaxed" {...props} />,
};

// Build the component map with a citation-aware <a> bound to this message's sources.
const makeComponents = (byIndex: Record<number, Citation>): Record<string, any> => ({
  ...baseComponents,
  a: ({ node, href, title, children, ...props }: any) => {
    if (typeof href === 'string' && href.startsWith('#cite')) {
      const idx = Number(href.split(':')[1]);
      const c = Number.isFinite(idx) ? byIndex[idx] : undefined;
      return (
        <sup
          title={citationLabel(c, title, String(children))}
          className="inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 ml-0.5 rounded-md bg-purple-100 text-[#8e5a94] text-[9px] font-black align-super no-underline cursor-help"
        >
          {children}
        </sup>
      );
    }
    return <a href={href} title={title} className="text-[#a26da8] font-semibold hover:underline break-words" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
  },
});

interface AgentMessageProps {
  content: string;
  /** Structured citation metadata (from data.citations[]) for rich hover labels. */
  citations?: Citation[];
  className?: string;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ content, citations, className = '' }) => {
  const byIndex = React.useMemo(() => {
    const map: Record<number, Citation> = {};
    (citations || []).forEach(c => { if (c && typeof c.index === 'number') map[c.index] = c; });
    return map;
  }, [citations]);
  const validIndices = React.useMemo(() => new Set(Object.keys(byIndex).map(Number)), [byIndex]);
  const { text, toolCalls } = React.useMemo(() => parseAgentContent(content, validIndices), [content, validIndices]);
  const components = React.useMemo(() => makeComponents(byIndex), [byIndex]);

  return (
    <div className={`max-w-none overflow-x-auto space-y-2 ${className}`}>
      {toolCalls.map((tc, i) => (
        <div key={i} className="rounded-xl border border-purple-100 bg-purple-50/60 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-purple-100/70">
            <Wrench size={12} className="text-[#a26da8] shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#a26da8]">Using tool</span>
            <span className="text-[11px] font-black text-gray-800 font-mono break-all">{tc.name}</span>
          </div>
          {Object.keys(tc.params).length > 0 && (
            <div className="px-3 py-2 space-y-1">
              {Object.entries(tc.params).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[11px] leading-relaxed">
                  <span className="font-black text-gray-400 uppercase tracking-wider shrink-0">{k}</span>
                  <span className="font-mono text-gray-600 break-words line-clamp-3">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {text && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
          components={components}
        >{text}</ReactMarkdown>
      )}
      {!text && toolCalls.length === 0 && <span className="text-gray-400 italic">…</span>}
    </div>
  );
};

export default AgentMessage;
