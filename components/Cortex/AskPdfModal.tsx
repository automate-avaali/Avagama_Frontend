import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useCortex } from '../../context/CortexContext';
import { apiService } from '../../services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  _id?: string;
  citations?: Array<{snippet: string, score: number}>;
}

interface UploadedDocument {
  documentId: string;
  name: string;
  timestamp: number;
}

const AskPdfModal: React.FC = () => {
  const { isAskPdfOpen, closeAskPdf } = useCortex();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const markdownStyles = `
    .markdown-body {
      font-size: 14px;
      line-height: 1.6;
    }
    .markdown-body p { margin-bottom: 12px; }
    .markdown-body p:last-child { margin-bottom: 0; }
    .markdown-body strong { font-weight: 700; color: inherit; }
    .markdown-body ul, .markdown-body ol { margin-bottom: 12px; padding-left: 20px; }
    .markdown-body li { margin-bottom: 4px; }
    .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { 
      font-weight: 800; 
      margin-top: 16px; 
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 12px;
    }
  `;

  useEffect(() => {
    // Load saved documents from local storage
    const savedDocs = localStorage.getItem('askPdfDocuments');
    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch (e) {
        console.error("Failed to parse saved documents");
      }
    }
  }, []);

  useEffect(() => {
    if (isAskPdfOpen) {
      if (activeDocumentId) {
        fetchHistory(activeDocumentId);
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
      setActiveDocumentId(null);
    }
  }, [isAskPdfOpen, activeDocumentId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchHistory = async (docId: string) => {
    setFetchingHistory(true);
    try {
      const res = await apiService.documents.getChatHistory(docId);
      if (res.success && Array.isArray(res.messages)) {
        setMessages(res.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to fetch chat history", err);
      setMessages([]);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await apiService.documents.upload(file);
      if (res.success && res.documentId) {
        const newDoc: UploadedDocument = {
          documentId: res.documentId,
          name: file.name,
          timestamp: Date.now()
        };
        
        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
        localStorage.setItem('askPdfDocuments', JSON.stringify(updatedDocs));
        
        setActiveDocumentId(newDoc.documentId);
        setMessages([]);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeDocumentId || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiService.documents.ask(activeDocumentId, userMessage.content);

      if (res.success) {
        // Fetch history to get the actual message IDs from the server
        fetchHistory(activeDocumentId);
      }
    } catch (err: any) {
      console.error("Failed to send message", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error processing your request. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeDocumentId) return;
    
    // Optimistically remove from UI
    setMessages(prev => prev.filter(m => m._id !== messageId));
    
    try {
      await apiService.documents.deleteMessage(activeDocumentId, messageId);
    } catch (err) {
      console.error("Failed to delete message", err);
      // Re-fetch history if delete fails to restore state
      fetchHistory(activeDocumentId);
    }
  };

  const handleCopyMessage = async (messageId: string, fallbackContent: string) => {
    if (!activeDocumentId) return;
    try {
      // Try to fetch the latest message content from the server
      const res = await apiService.documents.getMessage(activeDocumentId, messageId);
      if (res.success && res.message?.content) {
        navigator.clipboard.writeText(res.message.content);
      } else {
        navigator.clipboard.writeText(fallbackContent);
      }
    } catch (err) {
      console.error("Failed to fetch message for copying", err);
      navigator.clipboard.writeText(fallbackContent);
    }
  };

  const handleDeleteChat = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // In a real app, you'd have an API endpoint to delete the document
      // await apiService.documents.delete(documentId);
      
      const updatedDocs = documents.filter(d => d.documentId !== documentId);
      setDocuments(updatedDocs);
      localStorage.setItem('askPdfDocuments', JSON.stringify(updatedDocs));
      
      if (activeDocumentId === documentId) {
        setActiveDocumentId(null);
        setMessages([]);
      }
      setDocumentToDelete(null);
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await apiService.documents.upload(file);
      if (res.success && res.documentId) {
        const newDoc: UploadedDocument = {
          documentId: res.documentId,
          name: file.name,
          timestamp: Date.now()
        };
        
        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
        localStorage.setItem('askPdfDocuments', JSON.stringify(updatedDocs));
        
        setActiveDocumentId(newDoc.documentId);
        setMessages([]);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isAskPdfOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 lg:p-8">
          <style>{markdownStyles}</style>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAskPdf}
            className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="relative w-full max-w-6xl h-[85vh] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20"
          >
            {/* Sidebar (History) */}
            <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 flex flex-col shrink-0 h-1/3 md:h-full">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Ask PDF</h3>
                    <p className="text-[10px] font-bold text-gray-400">Document Q&A</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveDocumentId(null)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                  title="New Chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-4">Recent Documents</p>
                {documents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic px-2">No documents uploaded yet.</p>
                ) : (
                  documents.map(doc => (
                    <div key={doc.documentId} className="relative group">
                      {documentToDelete === doc.documentId ? (
                        <div className="w-full px-4 py-3 rounded-xl text-sm bg-red-50 border border-red-100 flex items-center justify-between">
                          <span className="text-red-600 font-bold truncate pr-2 text-xs">Delete {doc.name}?</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocumentToDelete(null);
                              }}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDeleteChat(doc.documentId, e)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-200 transition-colors"
                              title="Confirm Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setActiveDocumentId(doc.documentId)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center gap-3 pr-10 ${
                              activeDocumentId === doc.documentId 
                                ? 'bg-white shadow-sm border border-gray-100 text-[#a26da8] font-bold' 
                                : 'text-gray-600 hover:bg-gray-100 font-medium'
                            }`}
                          >
                            <svg className="w-4 h-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <span className="truncate">{doc.name}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocumentToDelete(doc.documentId);
                            }}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity ${
                              activeDocumentId === doc.documentId ? 'opacity-100' : ''
                            }`}
                            title="Delete document"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white h-2/3 md:h-full relative">
              <button 
                onClick={closeAskPdf}
                className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {!activeDocumentId ? (
                // Upload Screen
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div 
                    className="w-full max-w-md p-10 border-2 border-dashed border-gray-200 rounded-[32px] bg-gray-50 hover:bg-gray-100 hover:border-purple-200 transition-all cursor-pointer flex flex-col items-center justify-center gap-6"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".pdf,.docx,.txt,.xlsx,.png,.jpg,.jpeg"
                    />
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center text-purple-500">
                      {uploading ? (
                        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 mb-2">Upload Document</h4>
                      <p className="text-sm text-gray-500 font-medium">Drag & drop or click to browse</p>
                      <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">Supports PDF, DOCX, TXT, XLSX, PNG, JPG</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Chat Screen
                <>
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 truncate max-w-[200px] md:max-w-md">
                        {documents.find(d => d.documentId === activeDocumentId)?.name || 'Document'}
                      </h3>
                    </div>
                  </div>

                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                    {fetchingHistory ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-pulse flex space-x-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-gray-600">Document analyzed and ready.</p>
                          <p className="text-sm text-gray-500">Ask any question about the contents.</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            msg.role === 'user' 
                              ? 'bg-gray-900 text-white' 
                              : 'bg-gradient-to-br from-[#a26da8] to-[#6fcbbd] text-white shadow-sm'
                          }`}>
                            {msg.role === 'user' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            )}
                          </div>
                          <div className={`max-w-[85%] rounded-2xl p-5 relative ${
                            msg.role === 'user' 
                              ? 'bg-gray-900 text-white rounded-tr-sm' 
                              : 'bg-white border border-gray-100 shadow-sm rounded-tl-sm'
                          }`}>
                            {msg._id && (
                              <div className={`absolute top-2 ${msg.role === 'user' ? 'left-2' : 'right-2'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <button
                                  onClick={() => handleCopyMessage(msg._id!, msg.content)}
                                  className={`p-1.5 rounded-lg text-gray-400 hover:text-[#a26da8] ${msg.role === 'user' ? 'hover:bg-white/10' : 'hover:bg-purple-50'}`}
                                  title="Copy message"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg._id!)}
                                  className={`p-1.5 rounded-lg text-gray-400 hover:text-red-500 ${msg.role === 'user' ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                                  title="Delete message"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                            {msg.role === 'user' ? (
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            ) : (
                              <div className="space-y-4">
                                <div className="markdown-body">
                                  <Markdown>{msg.content}</Markdown>
                                </div>
                                {msg.citations && msg.citations.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sources</p>
                                    <div className="space-y-2">
                                      {msg.citations.map((cit, cIdx) => (
                                        <div key={cIdx} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                          <p className="text-xs text-gray-600 italic leading-relaxed">"{cit.snippet}"</p>
                                          <div className="mt-2 flex justify-end">
                                            <span className="text-[9px] font-bold text-[#a26da8] bg-purple-50 px-2 py-0.5 rounded-md">
                                              Relevance: {Math.round(cit.score * 100)}%
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                    {loading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#a26da8] to-[#6fcbbd] text-white shadow-sm flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm p-5 flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="p-4 md:p-6 bg-white border-t border-gray-50">
                    <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about this document..."
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-[#a26da8]/20 focus:border-[#a26da8] block p-4 pr-14 transition-all"
                        disabled={loading}
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-50 disabled:hover:bg-gray-900 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </form>
                    <div className="text-center mt-3">
                      <p className="text-[10px] text-gray-400 font-medium">AI can make mistakes. Verify important information from the source document.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AskPdfModal;
