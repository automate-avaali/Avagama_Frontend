
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useCortex } from '../../context/CortexContext';
import { apiService } from '../../services/api';

const GlobalCortexSearch: React.FC = () => {
  const { isGlobalSearchOpen, openGlobalSearch, closeGlobalSearch, openAskPdf } = useCortex();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const markdownStyles = `
    .markdown-body {
      font-size: 15px;
      line-height: 1.7;
    }
    .markdown-body p { margin-bottom: 16px; }
    .markdown-body p:last-child { margin-bottom: 0; }
    .markdown-body strong { font-weight: 700; color: #111; }
    .markdown-body ul, .markdown-body ol { margin-bottom: 16px; padding-left: 24px; }
    .markdown-body li { margin-bottom: 6px; }
    .markdown-body h1, .markdown-body h2, .markdown-body h3 { 
      font-weight: 900; 
      margin-top: 24px; 
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 11px;
      color: #999;
    }
  `;

  useEffect(() => {
    if (isGlobalSearchOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
      setAnswer(null);
    }
  }, [isGlobalSearchOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setAnswer(null);

    try {
      const res = await apiService.ai.askCortex(query.trim());
      if (res.success) {
        setAnswer(res.answer);
      }
    } catch (err) {
      console.error("Global search error", err);
      setAnswer("I encountered an error searching across your enterprise data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Ask PDF Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openAskPdf}
        className="fixed bottom-[110px] right-8 z-[150] w-16 h-16 bg-white text-purple-600 rounded-full shadow-2xl flex items-center justify-center group overflow-hidden border border-purple-100"
        title="Ask PDF"
      >
        <div className="absolute inset-0 bg-purple-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </motion.button>

      {/* Global Search Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openGlobalSearch}
        className="fixed bottom-8 right-8 z-[150] w-16 h-16 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isGlobalSearchOpen && (
          <div className="fixed inset-0 z-[210] flex items-start justify-center pt-20 px-4">
            <style>{markdownStyles}</style>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeGlobalSearch}
              className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Avagama Global Search</h3>
                  </div>
                  <button 
                    onClick={closeGlobalSearch}
                    className="text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSearch} className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search across all evaluations, companies and domains..."
                    className="w-full pl-8 pr-20 py-6 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-[28px] outline-none transition-all text-xl font-bold text-gray-900 placeholder:text-gray-300"
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-[52px] px-8 bg-gray-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:bg-gray-200"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Search'
                    )}
                  </button>
                </form>

                <AnimatePresence mode="wait">
                  {answer ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 max-h-[50vh] overflow-y-auto"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div className="space-y-4 w-full">
                          <div className="markdown-body text-gray-700 leading-relaxed font-medium">
                            <Markdown>{answer}</Markdown>
                          </div>
                          <div className="pt-4 border-t border-gray-200 flex gap-4">
                             <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Copy Answer</button>
                             <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Save to Notes</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-6">
                       <div className="w-12 h-12 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Querying Avagama Intelligence...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {[
                         "Suggest high ROI finance automation ideas",
                         "What are the top risks in supply chain?",
                         "Compare Cisco and Microsoft use cases",
                         "Show me all evaluations with >80% ROI"
                       ].map((suggestion, i) => (
                         <button 
                           key={i}
                           onClick={() => {
                             setQuery(suggestion);
                             // Trigger search manually if needed or just let user click search
                           }}
                           className="text-left p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-900 hover:bg-white transition-all group"
                         >
                           <p className="text-xs font-bold text-gray-400 group-hover:text-gray-900 transition-colors">{suggestion}</p>
                         </button>
                       ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                 <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Enterprise RAG Engine v4.0</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalCortexSearch;
