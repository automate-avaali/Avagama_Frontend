import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Wrench } from 'lucide-react';

// ---------------------------------------------------------------------------
// AgentMessage — the single, shared renderer for assistant/agent chat replies.
// Used by every chat surface (public chat, builder preview, …) so responses
// look consistent: tool calls become clean chips, Markdown/tables render
// properly, and messy model output (raw XML, reasoning tags, ASCII rules,
// tab-separated tables) is normalised. Built on react-markdown + remark-gfm.
// ---------------------------------------------------------------------------

export interface ParsedToolCall { name: string; params: Record<string, string>; }

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

// Clean up messy agent formatting: drop heavy ASCII divider lines and convert
// tab-separated tables to Markdown. Fenced code blocks are left untouched.
const normalizeAgentMarkdown = (input: string): string =>
  input
    .split(/(```[\s\S]*?```)/g)
    .map((seg, idx) => {
      if (idx % 2 === 1) return seg; // fenced code — leave exactly as-is
      const noRules = seg.replace(/^[^\S\n]*[─-╿]{3,}[^\S\n]*$/gm, ''); // box-drawing rules
      return convertTabTables(noRules);
    })
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// Pull out <tool_call>…</tool_call> markup (both the <function=…><parameter=…>
// form and the OpenAI-style JSON form), strip stray reasoning tags, and return
// the human-readable text plus any parsed tool calls.
export const parseAgentContent = (raw: string): { text: string; toolCalls: ParsedToolCall[] } => {
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

  text = normalizeAgentMarkdown(text);

  return { text, toolCalls };
};

const mdComponents = {
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
  a: (props: any) => <a className="text-[#a26da8] font-semibold hover:underline break-words" target="_blank" rel="noopener noreferrer" {...props} />,
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

interface AgentMessageProps {
  content: string;
  className?: string;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ content, className = '' }) => {
  const { text, toolCalls } = parseAgentContent(content);
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
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{text}</ReactMarkdown>
      )}
      {!text && toolCalls.length === 0 && <span className="text-gray-400 italic">…</span>}
    </div>
  );
};

export default AgentMessage;
