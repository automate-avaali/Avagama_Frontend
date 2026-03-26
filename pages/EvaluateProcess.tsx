import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { apiService } from "../services/api";
import { useCortex } from "../context/CortexContext";

const EvaluateProcess: React.FC = () => {
  const [step, setStep] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; title: string; message: string; onAcknowledge?: () => void } | null>(null);
  const [activeDimension, setActiveDimension] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const { credits, refreshCredits } = useCortex();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    processName: "",
    description: "",
    model: "mistral-large-latest",
    agentType: "Process Discovery Agent",
    volume: "",
    frequency: "-",
    complexity: 5,
    exceptionRate: 20,
    riskTolerance: "Medium",
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');

  // Prefill if ID exists in URL
  useEffect(() => {
    refreshCredits();

    if (idParam) {
      setEvaluationId(idParam);
      const fetchDraft = async () => {
        try {
          const res = await apiService.evaluations.get(idParam);
          if (res.success) {
            const data = res.data;
              setFormData({
                processName: data.discovery?.processName || "",
                description: data.discovery?.strategicContext || "",
                model: data.aiConfig?.baseModel || "mistral-large-latest",
                agentType: data.discovery?.targetAgent || "Process Discovery Agent",
                volume: data.operations?.monthlyVolume?.toString() || "",
                frequency: data.operations?.frequency || "-",
                complexity: data.operations?.complexityScore || 5,
                exceptionRate: data.operations?.exceptionRate || 20,
                riskTolerance: data.operations?.riskTolerance || "Medium",
              });
          }
        } catch (err) {
          console.error("Error fetching draft:", err);
        }
      };
      fetchDraft();
    }
  }, [idParam]);

  // Animation effect for the dimension loader
  useEffect(() => {
    let interval: number;
    if (isEvaluating) {
      interval = window.setInterval(() => {
        setActiveDimension((prev) => (prev + 1) % 10);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isEvaluating]);

  const handleNext = () => step < 5 && setStep(step + 1);
  const handlePrev = () => step > 1 && setStep(step - 1);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const payload: any = {
        processName: formData.processName,
        strategicContext: formData.description,
        targetAgent: formData.agentType,
      };
      
      if (evaluationId) {
        payload.id = evaluationId;
      }
      
      const res = await apiService.evaluations.create(payload);
      if (res.success) {
        const newId = res.data._id || res.data.id;
        setEvaluationId(newId);
        navigate("/evaluations");
      }
    } catch (error) {
      console.error("Save draft error:", error);
      alert("Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setShowConfirm(false);
      setIsEvaluating(true);

      const payload: any = {
        processName: formData.processName,
        strategicContext: formData.description,
        targetAgent: formData.agentType,
      };
      
      if (evaluationId) {
        payload.id = evaluationId;
      }

      const createRes = await apiService.evaluations.create(payload);

      if (!createRes.success) throw new Error("Creation failed");
      const currentId = createRes.data._id || createRes.data.id;
      setEvaluationId(currentId);

      if (selectedFile) {
        await apiService.evaluations.uploadSOP(currentId, selectedFile);
      }

      await apiService.evaluations.updateOperations(currentId, {
        monthlyVolume: formData.volume === "" ? "" : Number(formData.volume),
        frequency: formData.frequency === "-" ? "" : formData.frequency,
        complexityScore: Number(formData.complexity),
        exceptionRate: Number(formData.exceptionRate),
        riskTolerance: formData.riskTolerance,
        complianceSensitivity: "Medium",
        decisionPoints: 3,
      });

      await apiService.evaluations.updateAIConfig(currentId, {
        baseModel: formData.model,
        riskAppetite: formData.riskTolerance,
      });

      const runRes = await apiService.evaluations.runAgent(currentId);
      
      // Refresh credits in real-time after successful evaluation with a small delay
      setTimeout(() => {
        refreshCredits();
      }, 1500);
      
      localStorage.setItem("latestEvaluationResult", JSON.stringify(runRes.data));
      navigate(`/results/${currentId}`);
    } catch (error: any) {
      console.error("Evaluation pipeline error:", error);
      setIsEvaluating(false);
      
      const errorMessage = error.message || "";
      const status = error.status;

      if (status === 404 || status === 500) {
        setErrorModal({
          show: true,
          title: "System Maintenance",
          message: "The server is currently experiencing high load or is under maintenance. Please try again after some time.",
          onAcknowledge: () => navigate('/dashboard')
        });
        return;
      }

      if (errorMessage.toLowerCase().includes('insufficient credits') || errorMessage.toLowerCase().includes('credit')) {
        setErrorModal({
          show: true,
          title: "Insufficient Credits",
          message: "Your AI credit balance is too low to execute this evaluation. Please contact your administrator to allocate additional credits to your workspace.",
          onAcknowledge: () => navigate('/dashboard')
        });
      } else if (errorMessage.toLowerCase().includes('invalid json')) {
        setErrorModal({
          show: true,
          title: "Intelligence Synthesis Error",
          message: "The AI Agent encountered a formatting anomaly while generating your report. This can happen with highly complex inputs. Please try re-executing or switching the LLM Engine in Step 4.",
          onAcknowledge: () => navigate('/dashboard')
        });
      } else {
        alert("Pipeline disruption. Please verify inputs and re-execute.");
      }
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.processName.trim()) {
      errors.push("Process Name is not provided");
    }
    if (formData.volume !== "" && Number(formData.volume) < 0) {
      errors.push("Monthly Transaction Volume is not valid (must be non-negative)");
    }

    if (errors.length > 0) {
      setErrorModal({
        show: true,
        title: "Strategic Input Validation",
        message: `The following operational parameters require correction: ${errors.join(" and ")}. Please ensure all process identifiers and metrics are accurate to proceed with the assessment.`,
        onAcknowledge: () => setErrorModal(null)
      });
      return false;
    }
    return true;
  };

  const dimensions = [
    { name: "Decision intensity", icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2", color: "text-teal-400 bg-teal-50 border-teal-100" },
    { name: "Process volume", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "text-blue-400 bg-blue-50 border-blue-100" },
    { name: "Data structure", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "text-purple-400 bg-purple-50 border-purple-100" },
    { name: "Process frequency", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-pink-400 bg-pink-50 border-pink-100" },
    { name: "Context awareness", icon: "M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-indigo-400 bg-indigo-50 border-indigo-100" },
    { name: "Risk tolerance", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "text-rose-400 bg-rose-50 border-rose-100" },
    { name: "Exception handling", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-orange-400 bg-orange-50 border-orange-100" },
    { name: "Compliance sensitivity", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", color: "text-violet-400 bg-violet-50 border-violet-100" },
    { name: "Knowledge intensity", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "text-emerald-400 bg-emerald-50 border-emerald-100" },
    { name: "Orchestration complexity", icon: "M11 4a2 2 0 114 0v1a2 2 0 11-4 0V4zM4 11a2 2 0 114 0v1a2 2 0 11-4 0v-1zm10 0a2 2 0 114 0v1a2 2 0 11-4 0v-1z", color: "text-cyan-400 bg-cyan-50 border-cyan-100" },
  ];

  if (isEvaluating) {
    return createPortal(
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
        <div className="relative w-full max-w-[300px] md:max-w-[600px] aspect-square flex items-center justify-center">
          <div className="text-center z-10 animate-pulse">
             <h2 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight">Evaluating</h2>
             <p className="text-base md:text-xl font-bold text-gray-400">your process..</p>
          </div>
          {dimensions.map((dim, i) => {
            const angle = (i * 36) * (Math.PI / 180);
            const radius = window.innerWidth < 768 ? 120 : 220;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isActive = i === activeDimension;
            return (
              <div 
                key={i}
                className="absolute transition-all duration-500 flex flex-col items-center gap-2 md:gap-3"
                style={{ 
                  transform: `translate(${x}px, ${y}px)`,
                  opacity: isActive ? 1 : 0.4,
                  scale: isActive ? '1.15' : '1'
                }}
              >
                <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl border-2 flex items-center justify-center shadow-lg transition-all ${dim.color} ${isActive ? 'shadow-xl -translate-y-2' : ''}`}>
                  <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={dim.icon} />
                  </svg>
                </div>
                <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-tighter text-center max-w-[80px] md:max-w-[100px] leading-tight transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                  {dim.name}
                </p>
              </div>
            );
          })}
          <div className="absolute inset-0 border border-gray-50 rounded-full scale-[0.85]"></div>
          <div className="absolute inset-0 border-2 border-dashed border-gray-100 rounded-full scale-[1.1] animate-[spin_60s_linear_infinite]"></div>
        </div>
      </div>,
      document.body
    );
  }

  const stepsList = [
    { id: 1, label: "Discovery" },
    { id: 2, label: "SOP Upload" },
    { id: 3, label: "Operations" },
    { id: 4, label: "Finalize" }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-gray-50 min-h-screen relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/evaluations")}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Evaluate a process</h1>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border flex items-center gap-1 transition-all ${credits <= 5 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-[#9d7bb0]/10 text-[#9d7bb0] border-[#9d7bb0]/20'}`}>
            AI Credit: <span className="text-xs md:text-sm font-black">{credits} Remaining</span>
            {credits <= 5 && <span className="ml-1 text-[8px] uppercase font-black hidden sm:inline">(Low - Contact Admin)</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button 
            onClick={handleSaveDraft}
            disabled={isSavingDraft || !formData.processName}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 text-xs md:text-sm font-bold border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isSavingDraft ? 'Saving...' : 'Save as draft'}
          </button>
          <button
            onClick={() => {
              if (step === 4) {
                if (validateForm()) {
                  setShowConfirm(true);
                }
              } else {
                handleNext();
              }
            }}
            className="flex-1 lg:flex-none bg-[#9d7bb0] text-white px-6 md:px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#8b6aa1] transition-all shadow-lg shadow-purple-100 text-xs md:text-sm"
          >
            {step === 4 ? "Run AI Agent" : "Next step"}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm p-6 md:p-12 max-w-5xl mx-auto min-h-[500px] md:min-h-[650px] flex flex-col">
        {/* Layered Stepper with Connector Line Behind */}
        <div className="relative flex justify-between items-start mb-16 md:mb-24 px-4 md:px-10">
          {/* Background Connecting Line */}
          <div className="absolute top-5 left-[calc(20px+1rem)] md:left-[calc(40px+2.5rem)] right-[calc(20px+1rem)] md:right-[calc(40px+2.5rem)] h-[2px] bg-gray-100 z-0">
            <div 
              className="h-full bg-[#9d7bb0] transition-all duration-500" 
              style={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
            ></div>
          </div>
          
          {stepsList.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-500 ring-4 ring-white ${step >= s.id ? "bg-[#9d7bb0] text-white shadow-lg" : "bg-gray-100 text-gray-400"}`}>
                {s.id}
              </div>
              <span className={`absolute top-10 md:top-12 whitespace-nowrap text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center ${step >= s.id ? "text-[#9d7bb0]" : "text-gray-400"} ${step === s.id ? 'block' : 'hidden sm:block'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-grow pt-4">
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Process name</label>
                  <input
                    name="processName"
                    value={formData.processName}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="e.g., Accounts Payable Automation"
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-[#9d7bb0]/10 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Business Objective</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Provide the current Standard Operating Procedure (SOP) for this process... Or Upload a SOP Document in the next Step"
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-[#9d7bb0]/10 outline-none transition-all resize-none font-medium"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 md:space-y-10 animate-fadeIn">
              <div className="max-w-xl mx-auto space-y-6 md:space-y-8 text-center">
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Upload SOP Document</h3>
                  <p className="text-xs md:text-sm text-gray-400 font-medium leading-relaxed">
                    Ingest your Standard Operating Procedure document for high-fidelity dimensional grounding.
                  </p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group cursor-pointer p-8 md:p-14 border-2 border-dashed rounded-[32px] md:rounded-[48px] transition-all flex flex-col items-center justify-center gap-4 md:gap-6 ${selectedFile ? 'border-[#4db6ac] bg-[#4db6ac]/5' : 'border-gray-100 hover:border-[#9d7bb0]/30 hover:bg-gray-50'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept=".pdf,.txt,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
                  />
                  
                  <div className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[32px] flex items-center justify-center text-3xl md:text-4xl transition-transform group-hover:scale-110 ${selectedFile ? 'bg-white text-[#4db6ac] shadow-lg shadow-teal-100' : 'bg-white text-[#9d7bb0] shadow-lg shadow-purple-100'}`}>
                    {selectedFile ? '📄' : '📤'}
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <p className={`text-sm md:text-base font-black uppercase tracking-widest ${selectedFile ? 'text-[#4db6ac]' : 'text-gray-900'} truncate max-w-full px-4`}>
                      {selectedFile ? selectedFile.name : 'Select SOP File'}
                    </p>
                    <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-60">
                      PDF, TXT, DOC, XLSX, JPG, PNG
                    </p>
                  </div>
                  
                  {selectedFile && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white rounded-full text-red-400 hover:text-red-600 shadow-sm border border-gray-100"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                </div>

                <div className="p-4 md:p-6 bg-blue-50 rounded-2xl md:rounded-3xl border border-blue-100 flex items-start gap-3 md:gap-4 text-left">
                  <div className="text-xl md:text-2xl">🔐</div>
                  <div className="space-y-1">
                    <p className="text-[9px] md:text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Contextual Grounding</p>
                    <p className="text-[10px] md:text-xs text-blue-700 leading-relaxed font-medium">Documents are processed using secure ephemeral embeddings to provide evidence-based scoring recommendations.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 md:space-y-10 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Volume (tx)</label>
                  <input
                    name="volume"
                    value={formData.volume}
                    onChange={handleInputChange}
                    type="number"
                    placeholder="0"
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none font-medium text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Frequency</label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none font-medium text-sm md:text-base"
                  >
                    <option>-</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Batch Monthly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Process Complexity</label>
                    <span className="text-sm font-black text-[#9d7bb0]">{formData.complexity}/10</span>
                  </div>
                  <input
                    name="complexity"
                    type="range"
                    min="1"
                    max="10"
                    value={formData.complexity}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#9d7bb0]"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Exception Rate (%)</label>
                    <span className="text-sm font-black text-[#4db6ac]">{formData.exceptionRate}%</span>
                  </div>
                  <input
                    name="exceptionRate"
                    type="range"
                    min="0"
                    max="100"
                    value={formData.exceptionRate}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#4db6ac]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 md:space-y-8 animate-fadeIn pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Identity Section */}
                <div className="bg-gray-50 p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-gray-100 space-y-6">
                  <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-200 pb-4">Process Identity</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Process Name</span>
                      <span className="text-sm md:text-base font-bold text-gray-900">{formData.processName || "Unnamed Process"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Ingested Documentation</span>
                      <span className={`text-xs md:text-sm font-bold flex items-center gap-2 ${selectedFile ? 'text-[#4db6ac]' : 'text-gray-400'}`}>
                        {selectedFile ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span className="truncate">{selectedFile.name}</span>
                          </>
                        ) : 'None provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations Section */}
                <div className="bg-gray-50 p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-gray-100 space-y-6">
                  <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-200 pb-4">Operational Metrics</h3>
                  <div className="grid grid-cols-2 gap-x-4 md:gap-x-6 gap-y-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Monthly Volume</span>
                      <span className="text-xs md:text-sm font-bold text-gray-900">{formData.volume ? `${formData.volume} tx` : '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Frequency</span>
                      <span className="text-xs md:text-sm font-bold text-gray-900">{formData.frequency}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Complexity</span>
                      <span className="text-xs md:text-sm font-bold text-gray-900">{formData.complexity} / 10</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Exception Rate</span>
                      <span className="text-xs md:text-sm font-bold text-[#4db6ac]">{formData.exceptionRate}%</span>
                    </div>
                  </div>
                </div>

                {/* AI Configuration Section */}
                <div className="bg-gray-50 p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-gray-100 space-y-6 lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <div className="space-y-6">
                      <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-200 pb-4">Intelligence Stack</h3>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Synthesizer Engine</span>
                          <span className="text-xs md:text-sm font-bold text-[#9d7bb0]">Avagama Process Intelligence</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Risk Appetite</span>
                          <span className="text-xs md:text-sm font-bold text-gray-900">{formData.riskTolerance}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-200 pb-4">Business Objective</h3>
                      <div className="flex flex-col">
                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Description</span>
                        <span className="text-[11px] md:text-xs font-medium text-gray-600 leading-relaxed italic">
                          {formData.description ? `"${formData.description}"` : 'No additional context provided.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-12">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="px-8 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-all uppercase text-[10px] tracking-widest"
          >
            Go back
          </button>
        </div>
      </div>

      {showConfirm && createPortal(
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-[32px] md:rounded-[50px] p-8 md:p-16 max-w-xl w-full shadow-2xl space-y-8 md:space-y-10 border border-white/20 animate-scaleUp">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-[#9d7bb0]/10 text-[#9d7bb0] rounded-2xl md:rounded-[30px] flex items-center justify-center mx-auto border border-[#9d7bb0]/20 shadow-inner">
              <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div className="text-center space-y-3 md:space-y-4">
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Initiate AI Assessment?</h3>
              <p className="text-gray-500 text-sm md:text-lg leading-relaxed">
                Trigger the <strong className="text-gray-900">{formData.model === 'mistral-large-latest' ? 'Advanced Reasoner' : 'Efficiency Engine'}</strong> Agent to perform deep 10-dimensional analysis {selectedFile && 'using your SOP reference'}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 md:py-5 border-2 border-gray-100 rounded-2xl md:rounded-3xl font-black text-gray-400 hover:bg-gray-50 transition-colors uppercase text-[10px] md:text-xs tracking-widest">Hold on</button>
              <button onClick={handleFinalSubmit} className="flex-1 py-4 md:py-5 bg-[#9d7bb0] text-white rounded-2xl md:rounded-3xl font-black hover:bg-[#8b6aa1] shadow-2xl shadow-purple-200 transition-all uppercase text-[10px] md:text-xs tracking-widest">Execute Agent</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {errorModal?.show && createPortal(
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-[32px] md:rounded-[50px] p-8 md:p-16 max-w-xl w-full shadow-2xl space-y-6 md:space-y-8 border border-white/20 animate-scaleUp">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 text-red-500 rounded-2xl md:rounded-[24px] flex items-center justify-center mx-auto border border-red-100">
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center space-y-2 md:space-y-3">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{errorModal.title}</h3>
              <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">
                {errorModal.message}
              </p>
            </div>
            <button 
              onClick={() => {
                if (errorModal?.onAcknowledge) {
                  errorModal.onAcknowledge();
                } else {
                  setErrorModal(null);
                  navigate('/dashboard');
                }
              }} 
              className="w-full py-4 md:py-5 bg-gray-900 text-white rounded-2xl md:rounded-3xl font-black hover:bg-black transition-all uppercase text-[10px] md:text-xs tracking-widest shadow-xl shadow-gray-200"
            >
              Acknowledge
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EvaluateProcess;
