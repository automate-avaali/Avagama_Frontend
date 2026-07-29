import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';
import AgentMessage from '../components/AgentMessage';

interface Msg { role: 'user' | 'assistant'; text: string }

const prettifySlug = (slug: string) =>
  (slug || 'Assistant')
    .replace(/-[a-z0-9]{6,}$/i, '') // drop the trailing hash segment
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Assistant';

const PublicChat: React.FC = () => {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || undefined;

  const [agentName, setAgentName] = useState(prettifySlug(slug));
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingInfo(true);
      try {
        const res = token
          ? await apiService.deployedAgent.publicInfo(token)   // published (preview) agent via share_token
          : await apiService.deployedAgent.info(slug);          // deployed agent via deployment slug
        if (cancelled) return;
        if (res.success && res.data) {
          const d = res.data;
          const name = d.name || d.agent?.name || prettifySlug(slug);
          const greeting = d.persona?.greeting || d.greeting || d.agent?.persona?.greeting || `Hi! I'm ${name}. How can I help you today?`;
          setAgentName(name);
          setMessages([{ role: 'assistant', text: greeting }]);
        } else {
          setMessages([{ role: 'assistant', text: `Hi! I'm ${prettifySlug(slug)}. How can I help you today?` }]);
        }
      } catch (e: any) {
        if (cancelled) return;
        // info endpoint may not exist even when chat works — never block; fall back to a default greeting.
        setMessages([{ role: 'assistant', text: `Hi! I'm ${prettifySlug(slug)}. How can I help you today?` }]);
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setSending(true);
    try {
      const res = token
        ? await apiService.deployedAgent.publicChat(token, { session_id: sessionId, message: text })
        : await apiService.deployedAgent.chat(slug, { session_id: sessionId, message: text });
      const reply = res?.data?.reply ?? res?.reply ?? "Sorry, I couldn't generate a response.";
      if (res?.data?.session_id) setSessionId(res.data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${e?.message || 'Something went wrong. Please try again.'}` }]);
    } finally {
      setSending(false);
    }
  };

  const initial = (agentName || 'A').charAt(0).toUpperCase();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#fafafa] flex justify-center px-4 py-8">
      <div className="w-full max-w-2xl flex flex-col bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-white">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#a26da8] to-[#6fcbbd] text-white flex items-center justify-center font-black text-lg shadow-sm">{initial}</div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-gray-900 tracking-tight truncate">{agentName}</h1>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online · Powered by Avagama AI
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4 custom-scrollbar bg-[#fbfbfe]">
          {loadingInfo && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" size={26} /></div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#a26da8] flex items-center justify-center shrink-0 mr-2 mt-0.5"><Sparkles size={14} /></div>
                )}
                <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#a26da8] text-white rounded-br-md'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                }`}>
                  {m.role === 'assistant'
                    ? <AgentMessage content={m.text} />
                    : <span className="whitespace-pre-wrap">{m.text}</span>}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#a26da8] flex items-center justify-center shrink-0 mr-2"><Sparkles size={14} /></div>
              <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type your message…"
              rows={1}
              maxLength={4000}
              className="flex-1 resize-none max-h-32 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-purple-200 focus:ring-2 focus:ring-purple-50 transition-all"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="w-11 h-11 shrink-0 rounded-2xl bg-[#a26da8] text-white flex items-center justify-center hover:bg-[#8e5a94] disabled:opacity-40 transition-all"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicChat;
