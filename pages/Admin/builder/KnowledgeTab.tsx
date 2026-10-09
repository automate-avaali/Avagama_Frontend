
import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../../services/api';
import { StandaloneKnowledgeSource } from '../../../types/standalone';
import { 
  FileText, 
  Globe, 
  Type, 
  HelpCircle, 
  Plus, 
  Trash2, 
  RotateCw, 
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Database,
  Search,
  ArrowRight,
  Loader2
} from 'lucide-react';
import toast from '../../../components/studio/notify';

interface KnowledgeTabProps {
  agentId: string;
  refreshKey?: number;
}

const KnowledgeTab: React.FC<KnowledgeTabProps> = ({ agentId, refreshKey }) => {
  const [sources, setSources] = useState<StandaloneKnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSource, setAddingSource] = useState<'none' | 'file' | 'url' | 'text' | 'qa'>('none');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Form states
  const [urlData, setUrlData] = useState({ url: '', title: '' });
  const [textData, setTextData] = useState({ text: '', title: '' });
  const [qaData, setQaData] = useState({ title: '', pairs: [{ q: '', a: '' }] });
  const [uploadingFile, setUploadingFile] = useState(false);
  const pollersRef = useRef<Record<string, boolean>>({});

  // Stop every polling loop when the tab unmounts.
  useEffect(() => () => { pollersRef.current = {}; }, []);

  useEffect(() => {
    if (agentId !== 'new') {
      fetchSources();
    }
  }, [agentId, refreshKey]);

  // Merge a freshly-fetched source into the list (live status / chunk_count updates).
  const mergeSource = (updated: any) => {
    if (!updated?._id) return;
    setSources(prev => {
      const exists = prev.some(s => s._id === updated._id);
      return exists
        ? prev.map(s => (s._id === updated._id ? { ...s, ...updated } : s))
        : [updated, ...prev];
    });
  };

  // KB indexing is asynchronous: upload returns status "processing" and chunk_count
  // climbs live. Poll the source every 2s (backing off to 5s after a minute) until it
  // reaches a terminal state (ready | failed). Same model as URL/Text/Q&A sources.
  const pollSource = async (sourceId: string) => {
    if (!sourceId || pollersRef.current[sourceId]) return; // already polling
    pollersRef.current[sourceId] = true;
    const started = Date.now();
    const TIMEOUT_MS = 30 * 60 * 1000;
    try {
      while (pollersRef.current[sourceId]) {
        let data: any = null;
        try {
          const res = await apiService.standalone.agents.kb.getSource(agentId, sourceId);
          data = res?.data;
        } catch { /* transient network/server hiccup — keep polling */ }

        if (!pollersRef.current[sourceId]) break; // unmounted mid-request
        if (data) {
          mergeSource(data);
          if (data.status === 'ready') {
            if (data.error_message) toast(`Indexed with warnings: ${data.error_message}`, { icon: '⚠️' });
            else toast.success(`Indexed — ${(data.chunk_count || 0).toLocaleString()} chunk${data.chunk_count === 1 ? '' : 's'}`);
            break;
          }
          if (data.status === 'failed') {
            toast.error(data.error_message || 'Indexing failed');
            break;
          }
        }
        if (Date.now() - started > TIMEOUT_MS) break;
        await new Promise(r => setTimeout(r, Date.now() - started > 60 * 1000 ? 5000 : 2000));
      }
    } finally {
      delete pollersRef.current[sourceId];
    }
  };

  const fetchSources = async () => {
    try {
      const response = await apiService.standalone.agents.kb.list(agentId);
      if (response.success) {
        setSources(response.data);
        // Resume polling any source still indexing (survives navigating away and back).
        (response.data || []).forEach((s: any) => {
          if (s.status === 'processing' || s.status === 'pending') pollSource(s._id);
        });
      }
    } catch (error) {
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sourceId: string) => {
    try {
      await apiService.standalone.agents.kb.deleteSource(agentId, sourceId);
      toast.success('Source removed');
      fetchSources();
    } catch (error) {
      toast.error('Deletion failed');
    }
  };

  const handleReprocess = async (sourceId: string) => {
    setProcessingId(sourceId);
    try {
      await apiService.standalone.agents.kb.reprocessSource(agentId, sourceId);
      toast.success('Reprocessing started');
      // Flip to processing locally and poll to completion (reprocess is async too).
      mergeSource({ _id: sourceId, status: 'processing', error_message: null });
      pollSource(sourceId);
    } catch (error) {
      toast.error('Reprocess request failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const toastId = toast.loading('Uploading document…');
    try {
      const response = await apiService.standalone.agents.kb.uploadFile(agentId, file);
      const src = response?.data;
      if (response.success && src) {
        // Async: upload returns the source with status "processing". Show it now and poll.
        toast.success('Upload received — indexing in the background', { id: toastId });
        setAddingSource('none');
        mergeSource(src);
        pollSource(src._id);
      } else {
        toast.error('Upload failed', { id: toastId });
      }
    } catch (error: any) {
      // 422 = the file could not be read to text (corrupt / empty / unreadable scan) — synchronous.
      const msg = error?.status === 422
        ? (error?.message || 'Could not extract readable text from the file')
        : (error?.message || 'Upload failed');
      toast.error(msg, { id: toastId });
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

  const handleAddUrl = async () => {
    if (!urlData.url || !urlData.title) return toast.error('Fill all fields');
    try {
      await apiService.standalone.agents.kb.addUrl(agentId, urlData);
      toast.success('Website added');
      setAddingSource('none');
      setUrlData({ url: '', title: '' });
      fetchSources();
    } catch (error) {
      toast.error('Failed to add URL');
    }
  };

  const handleAddText = async () => {
    if (!textData.text || !textData.title) return toast.error('Fill all fields');
    try {
      await apiService.standalone.agents.kb.addText(agentId, textData);
      toast.success('Direct knowledge added');
      setAddingSource('none');
      setTextData({ text: '', title: '' });
      fetchSources();
    } catch (error) {
      toast.error('Failed to add text');
    }
  };

  const handleAddQA = async () => {
    if (!qaData.title) return toast.error('Title is required');
    if (qaData.pairs.some(p => !p.q.trim() || !p.a.trim())) {
      return toast.error('All QA pairs must be filled');
    }

    try {
      await apiService.standalone.agents.kb.addQa(agentId, qaData);
      toast.success('FAQ Knowledge added');
      setAddingSource('none');
      setQaData({ title: '', pairs: [{ q: '', a: '' }] });
      fetchSources();
    } catch (error) {
      toast.error('Failed to add QA');
    }
  };

  if (agentId === 'new') {
    return (
      <div className="py-14 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
          <Database size={32} />
        </div>
        <h3 className="text-[18px] font-semibold text-slate-900 mb-2">Save Agent First</h3>
        <p className="text-slate-500 font-medium max-w-sm">Please save your agent configuration before uploading knowledge sources.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-3">
           <div className="w-10 h-10 shrink-0 rounded-lg bg-purple-50 flex items-center justify-center text-[#a26da8]"><Database size={20} /></div>
           <div>
              <h3 className="text-[17px] font-semibold text-slate-900 leading-tight">Knowledge Inventory</h3>
              <p className="text-[13px] text-slate-500 mt-0.5">Foundational data for RAG processing</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <button onClick={() => setAddingSource('file')} className="px-5 py-3 bg-white border border-slate-200 rounded-lg text-[12.5px] font-semibold text-slate-700 hover:border-purple-200 hover:text-[#a26da8] transition-all flex items-center gap-2">
              <FileText size={14} /> Add File
           </button>
           <button onClick={() => setAddingSource('url')} className="px-5 py-3 bg-white border border-slate-200 rounded-lg text-[12.5px] font-semibold text-slate-700 hover:border-purple-200 hover:text-[#a26da8] transition-all flex items-center gap-2">
              <Globe size={14} /> Add Website
           </button>
           <button onClick={() => setAddingSource('text')} className="px-5 py-3 bg-white border border-slate-200 rounded-lg text-[12.5px] font-semibold text-slate-700 hover:border-purple-200 hover:text-[#a26da8] transition-all flex items-center gap-2">
              <Type size={14} /> Add Text
           </button>
           <button onClick={() => setAddingSource('qa')} className="px-5 py-3 bg-white border border-slate-200 rounded-lg text-[12.5px] font-semibold text-slate-700 hover:border-purple-200 hover:text-[#a26da8] transition-all flex items-center gap-2">
              <HelpCircle size={14} /> Add QA
           </button>
        </div>
      </div>

      {/* Add Source Forms */}
      {addingSource !== 'none' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 animate-slideDown">
          <div className="flex justify-between items-center mb-5">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              {addingSource === 'file' && <FileText size={16} />}
              {addingSource === 'url' && <Globe size={16} />}
              {addingSource === 'text' && <Type size={16} />}
              {addingSource === 'qa' && <HelpCircle size={16} />}
              Configure New Source
            </h4>
            <button onClick={() => setAddingSource('none')} className="text-[12.5px] font-semibold text-slate-500 hover:text-red-500">Cancel</button>
          </div>

          {addingSource === 'file' && (
            <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-purple-200 transition-all group relative">
               <div className="flex flex-col items-center gap-4 text-center cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-[#a26da8] group-hover:scale-110 transition-transform">
                     <Plus size={32} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Upload PDF, DOCX, or TXT</p>
                    <p className="text-[13px] font-medium text-slate-500 mt-1">Manual parsing handled locally</p>
                  </div>
               </div>
               <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileUpload}
                disabled={uploadingFile}
               />
               {uploadingFile && (
                 <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#a26da8] animate-spin" />
                 </div>
               )}
            </div>
          )}

          {addingSource === 'url' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <input 
                  type="text" 
                  placeholder="Website URL (e.g. https://docs.example.com)"
                  value={urlData.url}
                  onChange={(e) => setUrlData({...urlData, url: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-normal focus:ring-2 focus:ring-purple-100 outline-none focus:border-[#a26da8]"
                 />
                 <input 
                  type="text" 
                  placeholder="Internal Title"
                  value={urlData.title}
                  onChange={(e) => setUrlData({...urlData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-normal focus:ring-2 focus:ring-purple-100 outline-none focus:border-[#a26da8]"
                 />
               </div>
               <button onClick={handleAddUrl} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-[13px] hover:bg-black transition-all">Add Knowledge Link</button>
            </div>
          )}

          {addingSource === 'text' && (
            <div className="space-y-6">
               <input 
                type="text" 
                placeholder="Topic Title"
                value={textData.title}
                onChange={(e) => setTextData({...textData, title: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-normal focus:ring-2 focus:ring-purple-100 outline-none focus:border-[#a26da8]"
               />
               <textarea 
                rows={8}
                placeholder="Paste direct information text here..."
                value={textData.text}
                onChange={(e) => setTextData({...textData, text: e.target.value})}
                className="w-full px-5 py-4 bg-white border border-slate-300 rounded-lg text-sm font-normal focus:ring-2 focus:ring-purple-100 outline-none focus:border-[#a26da8]"
               />
               <button onClick={handleAddText} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-[13px] hover:bg-black transition-all">Ingest Raw Text</button>
            </div>
          )}

          {addingSource === 'qa' && (
            <div className="space-y-6">
               <input 
                type="text" 
                placeholder="FAQ Set Title"
                value={qaData.title}
                onChange={(e) => setQaData({...qaData, title: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-normal focus:ring-2 focus:ring-purple-100 outline-none focus:border-[#a26da8]"
               />
               
               <div className="space-y-4 max-h-[500px] overflow-y-auto px-1 pr-2 scrollbar-thin scrollbar-thumb-gray-100 scrollbar-track-transparent">
                 {qaData.pairs.map((pair, idx) => (
                   <div key={idx} className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 relative group/pair shadow-sm">
                      <div className="flex items-center justify-between">
                         <span className="text-[12.5px] font-semibold text-purple-400">Question {idx + 1}</span>
                         {qaData.pairs.length > 1 && (
                            <button 
                              onClick={() => {
                                const newPairs = qaData.pairs.filter((_, i) => i !== idx);
                                setQaData({...qaData, pairs: newPairs});
                              }}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                         )}
                      </div>
                      <input 
                        placeholder="Type question here..."
                        value={pair.q}
                        onChange={(e) => {
                          const newPairs = [...qaData.pairs];
                          newPairs[idx].q = e.target.value;
                          setQaData({...qaData, pairs: newPairs});
                        }}
                        className="w-full px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-normal outline-none focus:ring-2 focus:ring-purple-100 transition-all focus:border-[#a26da8]"
                      />
                      <textarea 
                        rows={3}
                        placeholder="Type answer here..."
                        value={pair.a}
                        onChange={(e) => {
                          const newPairs = [...qaData.pairs];
                          newPairs[idx].a = e.target.value;
                          setQaData({...qaData, pairs: newPairs});
                        }}
                        className="w-full px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-normal outline-none focus:ring-2 focus:ring-purple-100 min-h-[100px] transition-all focus:border-[#a26da8]"
                      />
                   </div>
                 ))}
               </div>

               <div className="flex gap-4">
                 <button 
                  onClick={() => setQaData({...qaData, pairs: [...qaData.pairs, { q: '', a: '' }]})}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold text-[13px] hover:border-purple-200 transition-all flex items-center justify-center gap-2"
                 >
                    <Plus size={16} /> Add Another Pair
                 </button>
                 <button 
                  onClick={handleAddQA}
                  className="flex-[2] py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-[13px] hover:bg-black transition-all"
                 >
                    Save FAQ Set
                 </button>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Sources List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-14">
             <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
        ) : sources.length > 0 ? (
          sources.map((source: any) => (
            <div key={source._id} className="group flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl hover:border-purple-100 hover:shadow-sm transition-all">
               <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    source.status === 'ready' ? 'bg-purple-50 text-[#a26da8]' :
                    (source.status === 'processing' || source.status === 'pending') ? 'bg-blue-50 text-blue-500' :
                    'bg-red-50 text-red-500'
                  }`}>
                    {source.type === 'file' ? <FileText size={20} /> : 
                     source.type === 'url' ? <Globe size={20} /> :
                     source.type === 'text' ? <Type size={20} /> :
                     <HelpCircle size={20} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                       <h5 className="text-sm font-semibold text-slate-900">{source.title}</h5>
                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 capitalize ${
                         source.status === 'ready' ? (source.error_message ? 'border-amber-100 bg-amber-50 text-amber-600' : 'border-green-100 bg-green-50 text-green-600') :
                         (source.status === 'processing' || source.status === 'pending') ? 'border-blue-100 bg-blue-50 text-blue-500' :
                         'border-red-100 bg-red-50 text-red-500'
                       }`}>
                         {(source.status === 'processing' || source.status === 'pending') && <Loader2 size={9} className="animate-spin" />}
                         {source.status === 'ready' && source.error_message ? 'partial' : source.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[11.5px] font-medium text-slate-500 font-mono">
                       <span className="uppercase">{source.type}</span>
                       <span>•</span>
                       {(source.status === 'processing' || source.status === 'pending') ? (
                         <span className="text-blue-500 flex items-center gap-1.5 normal-case tracking-normal">
                           <Loader2 size={10} className="animate-spin" /> Indexing… {(source.chunk_count || 0).toLocaleString()} chunks
                         </span>
                       ) : (
                         <span>{(source.chunk_count || 0).toLocaleString()} Chunks</span>
                       )}
                       <span>•</span>
                       <span>Added {new Date(source.createdAt).toLocaleDateString()}</span>
                    </div>
                    {source.status === 'ready' && source.error_message && (
                      <div className="flex items-start gap-1.5 mt-2 text-[12.5px] font-medium text-amber-600">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {source.error_message}
                      </div>
                    )}
                    {source.status === 'failed' && (
                      <div className="flex items-start gap-1.5 mt-2 text-[12.5px] font-medium text-red-500">
                        <AlertCircle size={12} className="shrink-0 mt-0.5" /> {source.error_message || 'Could not index this source. Try re-uploading.'}
                      </div>
                    )}
                  </div>
               </div>

               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                   onClick={() => handleReprocess(source._id)}
                   disabled={processingId === source._id}
                   className="p-3 text-slate-500 hover:text-[#a26da8] hover:bg-purple-50 rounded-xl transition-all"
                   title="Reprocess Source"
                  >
                    <RotateCw size={16} className={processingId === source._id ? 'animate-spin' : ''} />
                  </button>
                  <button 
                   onClick={() => handleDelete(source._id)}
                   className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                   title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="py-14 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
             <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                <Database size={28} />
             </div>
             <p className="font-semibold text-slate-500 text-[13px]">No knowledge sources attached yet.</p>
          </div>
        )}
      </div>

      {/* Sync Status Footer */}
      {sources.length > 0 && (
        <div className="p-6 bg-purple-50/30 rounded-xl border border-purple-100/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm">
                 <CheckCircle2 size={20} />
              </div>
              <div>
                 <p className="text-[13px] font-semibold text-slate-900">Vector index synchronized</p>
                 <p className="text-[12.5px] font-medium text-slate-500 mt-0.5">Last updated: Just now</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                 <span className="text-[17px] font-semibold text-slate-900">{sources.reduce((acc, s) => acc + s.chunk_count, 0)}</span>
                 <span className="text-[11.5px] font-medium text-slate-500">Active Chunks</span>
              </div>
              <button 
                onClick={fetchSources}
                className="p-3 bg-white border border-purple-100 rounded-xl text-[#a26da8] hover:bg-purple-100 transition-all"
              >
                <RotateCw size={18} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeTab;
