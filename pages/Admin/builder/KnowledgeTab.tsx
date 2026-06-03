
import React, { useState, useEffect } from 'react';
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
  Database,
  Search,
  ArrowRight,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface KnowledgeTabProps {
  agentId: string;
}

const KnowledgeTab: React.FC<KnowledgeTabProps> = ({ agentId }) => {
  const [sources, setSources] = useState<StandaloneKnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSource, setAddingSource] = useState<'none' | 'file' | 'url' | 'text' | 'qa'>('none');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Form states
  const [urlData, setUrlData] = useState({ url: '', title: '' });
  const [textData, setTextData] = useState({ text: '', title: '' });
  const [qaData, setQaData] = useState({ title: '', pairs: [{ q: '', a: '' }] });
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (agentId !== 'new') {
      fetchSources();
    }
  }, [agentId]);

  const fetchSources = async () => {
    try {
      const response = await apiService.standalone.agents.kb.list(agentId);
      if (response.success) setSources(response.data);
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
      toast.success('Reprocessing heartbeat sent');
      fetchSources();
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
    const toastId = toast.loading('Uploading document...');
    try {
      const response = await apiService.standalone.agents.kb.uploadFile(agentId, file);
      if (response.success) {
        toast.success('Document added to ingestion queue', { id: toastId });
        setAddingSource('none');
        fetchSources();
      }
    } catch (error) {
      toast.error('Upload failed', { id: toastId });
    } finally {
      setUploadingFile(false);
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
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
          <Database size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Save Agent First</h3>
        <p className="text-gray-500 font-medium max-w-sm">Please save your agent configuration before uploading knowledge sources.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn pb-10">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h3 className="text-lg font-black text-gray-900">Knowledge Inventory</h3>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Foundational data for RAG processing</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <button onClick={() => setAddingSource('file')} className="px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-700 uppercase tracking-widest hover:border-purple-200 hover:text-[#a26da8] transition-all flex items-center gap-2">
              <FileText size={14} /> Add File
           </button>
           <button onClick={() => setAddingSource('url')} className="px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-700 uppercase tracking-widest hover:border-purple-200 hover:text-[#a26da8] transition-all flex items-center gap-2">
              <Globe size={14} /> Add Website
           </button>
           <button onClick={() => setAddingSource('text')} className="px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-700 uppercase tracking-widest hover:border-purple-200 hover:text-[#a26da8] transition-all flex items-center gap-2">
              <Type size={14} /> Add Text
           </button>
           <button onClick={() => setAddingSource('qa')} className="px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-700 uppercase tracking-widest hover:border-purple-200 hover:text-[#a26da8] transition-all flex items-center gap-2">
              <HelpCircle size={14} /> Add QA
           </button>
        </div>
      </div>

      {/* Add Source Forms */}
      {addingSource !== 'none' && (
        <div className="bg-gray-50 border border-gray-100 rounded-[32px] p-8 animate-slideDown">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              {addingSource === 'file' && <FileText size={16} />}
              {addingSource === 'url' && <Globe size={16} />}
              {addingSource === 'text' && <Type size={16} />}
              {addingSource === 'qa' && <HelpCircle size={16} />}
              Configure New Source
            </h4>
            <button onClick={() => setAddingSource('none')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500">Cancel</button>
          </div>

          {addingSource === 'file' && (
            <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-gray-200 rounded-[28px] hover:border-purple-200 transition-all group relative">
               <div className="flex flex-col items-center gap-4 text-center cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-[#a26da8] group-hover:scale-110 transition-transform">
                     <Plus size={32} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">Upload PDF, DOCX, or TXT</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manual parsing handled locally</p>
                  </div>
               </div>
               <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileUpload}
                disabled={uploadingFile}
               />
               {uploadingFile && (
                 <div className="absolute inset-0 bg-white/80 rounded-[28px] flex items-center justify-center">
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
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-100"
                 />
                 <input 
                  type="text" 
                  placeholder="Internal Title"
                  value={urlData.title}
                  onChange={(e) => setUrlData({...urlData, title: e.target.value})}
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-100"
                 />
               </div>
               <button onClick={handleAddUrl} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Add Knowledge Link</button>
            </div>
          )}

          {addingSource === 'text' && (
            <div className="space-y-6">
               <input 
                type="text" 
                placeholder="Topic Title"
                value={textData.title}
                onChange={(e) => setTextData({...textData, title: e.target.value})}
                className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-100"
               />
               <textarea 
                rows={8}
                placeholder="Paste direct information text here..."
                value={textData.text}
                onChange={(e) => setTextData({...textData, text: e.target.value})}
                className="w-full px-8 py-6 bg-white border border-gray-100 rounded-[28px] text-sm font-medium shadow-sm focus:ring-2 focus:ring-purple-100"
               />
               <button onClick={handleAddText} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Ingest Raw Text</button>
            </div>
          )}

          {addingSource === 'qa' && (
            <div className="space-y-6">
               <input 
                type="text" 
                placeholder="FAQ Set Title"
                value={qaData.title}
                onChange={(e) => setQaData({...qaData, title: e.target.value})}
                className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-100"
               />
               
               <div className="space-y-4 max-h-[500px] overflow-y-auto px-1 pr-2 scrollbar-thin scrollbar-thumb-gray-100 scrollbar-track-transparent">
                 {qaData.pairs.map((pair, idx) => (
                   <div key={idx} className="p-6 bg-white border border-gray-100 rounded-[28px] space-y-4 relative group/pair shadow-sm">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Question {idx + 1}</span>
                         {qaData.pairs.length > 1 && (
                            <button 
                              onClick={() => {
                                const newPairs = qaData.pairs.filter((_, i) => i !== idx);
                                setQaData({...qaData, pairs: newPairs});
                              }}
                              className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
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
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all"
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
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-purple-100 min-h-[100px] transition-all"
                      />
                   </div>
                 ))}
               </div>

               <div className="flex gap-4">
                 <button 
                  onClick={() => setQaData({...qaData, pairs: [...qaData.pairs, { q: '', a: '' }]})}
                  className="flex-1 py-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-purple-200 transition-all flex items-center justify-center gap-2"
                 >
                    <Plus size={16} /> Add Another Pair
                 </button>
                 <button 
                  onClick={handleAddQA}
                  className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
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
          <div className="flex justify-center py-20">
             <Loader2 className="w-8 h-8 text-gray-200 animate-spin" />
          </div>
        ) : sources.length > 0 ? (
          sources.map((source) => (
            <div key={source._id} className="group flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[28px] hover:border-purple-100 hover:shadow-xl hover:shadow-purple-50 transition-all">
               <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    source.status === 'ready' ? 'bg-purple-50 text-[#a26da8]' : 
                    source.status === 'processing' ? 'bg-blue-50 text-blue-500' :
                    'bg-red-50 text-red-500'
                  }`}>
                    {source.type === 'file' ? <FileText size={20} /> : 
                     source.type === 'url' ? <Globe size={20} /> :
                     source.type === 'text' ? <Type size={20} /> :
                     <HelpCircle size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                       <h5 className="text-sm font-black text-gray-900">{source.title}</h5>
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                         source.status === 'ready' ? 'border-green-100 bg-green-50 text-green-600' :
                         source.status === 'processing' ? 'border-blue-100 bg-blue-50 text-blue-500' :
                         'border-red-100 bg-red-50 text-red-500'
                       }`}>
                         {source.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[9px] font-bold text-gray-400 font-mono uppercase">
                       <span>{source.type}</span>
                       <span>•</span>
                       <span>{source.chunk_count} Chunks</span>
                       <span>•</span>
                       <span>Added {new Date(source.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
               </div>

               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                   onClick={() => handleReprocess(source._id)}
                   disabled={processingId === source._id}
                   className="p-3 text-gray-400 hover:text-[#a26da8] hover:bg-purple-50 rounded-xl transition-all"
                   title="Reprocess Source"
                  >
                    <RotateCw size={16} className={processingId === source._id ? 'animate-spin' : ''} />
                  </button>
                  <button 
                   onClick={() => handleDelete(source._id)}
                   className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                   title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="py-20 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-center">
             <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                <Database size={28} />
             </div>
             <p className="font-black text-gray-400 text-xs uppercase tracking-widest">No knowledge sources attached yet.</p>
          </div>
        )}
      </div>

      {/* Sync Status Footer */}
      {sources.length > 0 && (
        <div className="p-8 bg-purple-50/30 rounded-[32px] border border-purple-100/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm">
                 <CheckCircle2 size={20} />
              </div>
              <div>
                 <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Vectore Index Synchronized</p>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Last updated: Just now</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                 <span className="text-lg font-black text-gray-900">{sources.reduce((acc, s) => acc + s.chunk_count, 0)}</span>
                 <span className="text-[9px] font-bold text-gray-400 uppercase">Active Chunks</span>
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
