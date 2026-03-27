
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import * as d3 from 'd3';
import { motion } from 'motion/react';

const StrategicQuadrant: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ids = params.get('ids')?.split(',') || [];
    
    if (ids.length === 0) {
      navigate('/evaluations');
      return;
    }

    const fetchItems = async () => {
      try {
        const results = await Promise.all(ids.map(id => apiService.evaluations.get(id)));
        setItems(results.filter(r => r.success).map(r => r.data));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [location, navigate]);

  useEffect(() => {
    if (loading || items.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1200;
    const height = 650;
    const margin = { top: 60, right: 220, bottom: 80, left: 280 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Draw Quadrant Backgrounds
    const quadrants = [
      { name: "Strategic Bets", x: 0, y: 0, color: "#f43f5e", opacity: 0.1, label: "High Value + Low Feasibility" },
      { name: "Quick Wins", x: innerWidth / 2, y: 0, color: "#8b5cf6", opacity: 0.1, label: "High Value + High Feasibility" },
      { name: "Low Priority", x: 0, y: innerHeight / 2, color: "#64748b", opacity: 0.1, label: "Low Value + Low Feasibility" },
      { name: "Tactical Gains", x: innerWidth / 2, y: innerHeight / 2, color: "#10b981", opacity: 0.1, label: "Low Value + High Feasibility" }
    ];

    quadrants.forEach(q => {
      g.append("rect")
        .attr("x", q.x)
        .attr("y", q.y)
        .attr("width", innerWidth / 2)
        .attr("height", innerHeight / 2)
        .attr("fill", q.color)
        .attr("fill-opacity", q.opacity)
        .attr("stroke", "rgba(15, 23, 42, 0.05)")
        .attr("stroke-width", 1);

      g.append("text")
        .attr("x", q.x + innerWidth / 4)
        .attr("y", q.y + 25)
        .attr("text-anchor", "middle")
        .attr("fill", q.color)
        .attr("font-size", "10px")
        .attr("font-weight", "900")
        .attr("text-transform", "uppercase")
        .attr("letter-spacing", "0.1em")
        .attr("opacity", 0.4)
        .text(q.name);
    });

    // Draw Main Axes
    g.append("line")
      .attr("x1", 0)
      .attr("y1", innerHeight / 2)
      .attr("x2", innerWidth)
      .attr("y2", innerHeight / 2)
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 4")
      .attr("opacity", 0.2);

    g.append("line")
      .attr("x1", innerWidth / 2)
      .attr("y1", 0)
      .attr("x2", innerWidth / 2)
      .attr("y2", innerHeight)
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 4")
      .attr("opacity", 0.2);

    // Outer Border
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "none")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2);

    // Axis Titles
    // Value Axis (Vertical)
    const valueAxisG = g.append("g").attr("transform", `translate(-95, ${innerHeight / 2}) rotate(-90)`);
    valueAxisG.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#0f172a")
      .attr("font-size", "12px")
      .attr("font-weight", "900")
      .attr("text-transform", "uppercase")
      .attr("letter-spacing", "0.15em")
      .text("Business Value");
    
    // Feasibility Axis (Horizontal)
    const feasibilityAxisG = g.append("g").attr("transform", `translate(${innerWidth / 2}, ${innerHeight + 55})`);
    feasibilityAxisG.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#0f172a")
      .attr("font-size", "12px")
      .attr("font-weight", "900")
      .attr("text-transform", "uppercase")
      .attr("letter-spacing", "0.15em")
      .text("Implementation Feasibility");

    // Axis Labels
    const yLabels = [
      { label: "High", y: 0 },
      { label: "Medium", y: innerHeight / 2 },
      { label: "Low", y: innerHeight }
    ];
    yLabels.forEach(l => {
      g.append("text")
        .attr("x", -15)
        .attr("y", l.y)
        .attr("fill", "#64748b")
        .attr("font-size", "10px")
        .attr("font-weight", "900")
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .text(l.label);
    });

    const xLabels = [
      { label: "Low", x: 0 },
      { label: "Medium", x: innerWidth / 2 },
      { label: "High", x: innerWidth }
    ];
    xLabels.forEach(l => {
      g.append("text")
        .attr("x", l.x)
        .attr("y", innerHeight + 25)
        .attr("fill", "#64748b")
        .attr("font-size", "10px")
        .attr("font-weight", "900")
        .attr("text-anchor", "middle")
        .text(l.label);
    });

    // Plotting Scales - Linear 0-100% for both axes to match "Medium" center labels
    const xScale = d3.scaleLinear()
      .domain([0.0, 1.0])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([1.0, 0.0])
      .range([0, innerHeight]);

    // Plot Items
    const plottedPoints: {x: number, y: number, item: any, idx: number, color: string}[] = [];
    const quadrantCounts = { qw: 0, sb: 0, tg: 0, lp: 0 };
    
    items.forEach((item, idx) => {
      const bv = (item.aiAnalysis?.businessBenefitScore || 0) / 100;
      const as = (item.aiAnalysis?.automationScore || 0) / 100;
      let feasibilityScore = item.aiAnalysis?.feasibilityScore;
      if (!feasibilityScore) {
        feasibilityScore = item.aiAnalysis?.automationScore || 0;
      }
      const f = (feasibilityScore || 0) / 100;

      // Count per quadrant for callout logic
      if (bv >= 0.5 && f >= 0.5) quadrantCounts.qw++;
      else if (bv >= 0.5 && f < 0.5) quadrantCounts.sb++;
      else if (bv < 0.5 && f >= 0.5) quadrantCounts.tg++;
      else quadrantCounts.lp++;

      // Use the scales for plotting
      const origX = xScale(f);
      const origY = yScale(bv);
      let x = origX;
      let y = origY;

      // Determine quadrant boundaries to prevent points from shifting to wrong quadrants
      const midX = innerWidth / 2;
      const midY = innerHeight / 2;
      const minX = f >= 0.5 ? midX : 0;
      const maxX = f >= 0.5 ? innerWidth : midX;
      const minY = bv >= 0.5 ? 0 : midY;
      const maxY = bv >= 0.5 ? midY : innerHeight;

      // Collision detection - Deterministic spiral search to ensure consistent plotting
      let attempts = 0;
      const collisionRadius = 38; // Optimized for clarity and packing
      while (attempts < 150) {
        let collision = false;
        for (const p of plottedPoints) {
          const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
          if (dist < collisionRadius) {
            collision = true;
            break;
          }
        }
        if (!collision) break;
        
        // Deterministic offset using a spiral pattern based on attempts and index
        const angle = attempts * 0.4 + (idx * 0.1);
        const radius = attempts * 1.5;
        x = origX + Math.cos(angle) * radius;
        y = origY + Math.sin(angle) * radius;
        
        // Clamp to quadrant boundaries with padding to keep points inside their correct quadrant
        x = Math.max(minX + 20, Math.min(maxX - 20, x));
        y = Math.max(minY + 20, Math.min(maxY - 20, y));
        
        attempts++;
      }

      // Categorization Logic
      let dotColor = "#64748b"; 
      if (bv >= 0.5 && f >= 0.5) {
        dotColor = "#8b5cf6"; // Quick Wins (Top-Right)
      } else if (bv >= 0.5 && f < 0.5) {
        dotColor = "#f43f5e"; // Strategic Bets (Top-Left)
      } else if (bv < 0.5 && f >= 0.5) {
        dotColor = "#10b981"; // Tactical Gains (Bottom-Right)
      } else {
        dotColor = "#64748b"; // Low Priority (Bottom-Left)
      }

      plottedPoints.push({x, y, item, idx, color: dotColor});
    });

    const isMany = Object.values(quadrantCounts).some(c => c > 7);

    plottedPoints.forEach((p) => {
      const dot = g.append("g")
        .attr("transform", `translate(${p.x}, ${p.y})`)
        .style("cursor", "pointer")
        .on("click", () => setSelectedItem(p.item));

      dot.append("circle")
        .attr("r", 14)
        .attr("fill", p.color)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.1))");

      dot.append("text")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "11px")
        .attr("font-weight", "900")
        .style("pointer-events", "none")
        .text(p.idx + 1);

      if (!isMany) {
        // Individual Label Logic for few items
        const isRightSide = p.x > innerWidth / 2;
        const isBottomSide = p.y > innerHeight / 2;
        const forceRight = p.x < 100;
        const forceLeft = p.x > innerWidth - 100;
        const effectiveIsRight = forceRight ? true : (forceLeft ? false : isRightSide);
        const labelX = effectiveIsRight ? 18 : -18;
        const labelY = isBottomSide ? -16 : 20;
        const labelText = p.item.discovery?.processName || "Process";

        dot.append("text")
          .attr("x", labelX)
          .attr("y", labelY)
          .attr("text-anchor", effectiveIsRight ? "start" : "end")
          .attr("fill", "white")
          .attr("stroke", "white")
          .attr("stroke-width", 3)
          .attr("font-size", "9px")
          .attr("font-weight", "800")
          .attr("text-transform", "uppercase")
          .attr("opacity", 0.8)
          .text(labelText);

        dot.append("text")
          .attr("x", labelX)
          .attr("y", labelY)
          .attr("text-anchor", effectiveIsRight ? "start" : "end")
          .attr("fill", "#1e293b")
          .attr("font-size", "9px")
          .attr("font-weight", "800")
          .attr("text-transform", "uppercase")
          .text(labelText);
      }
    });

    if (isMany) {
      // Leader Line Callouts for many items
      const leftItems = plottedPoints.filter(p => p.x < innerWidth / 2).sort((a, b) => a.y - b.y);
      const rightItems = plottedPoints.filter(p => p.x >= innerWidth / 2).sort((a, b) => a.y - b.y);

      const drawCallouts = (group: typeof plottedPoints, side: 'left' | 'right') => {
        const count = group.length;
        if (count === 0) return;

        const totalHeight = innerHeight - 60;
        const startY = 30;
        const step = totalHeight / (count > 1 ? count - 1 : 1);

        group.forEach((p, i) => {
          const targetY = startY + (i * step);
          const targetX = side === 'left' ? -270 : innerWidth + 10;
          const labelText = p.item.discovery?.processName || "Process";

          // Leader Line
          const path = d3.path();
          path.moveTo(p.x, p.y);
          // Elbow
          const midX = side === 'left' ? p.x - 20 : p.x + 20;
          path.lineTo(midX, p.y);
          path.lineTo(side === 'left' ? targetX + 260 : targetX - 10, targetY);
          path.lineTo(targetX, targetY);

          g.append("path")
            .attr("d", path.toString())
            .attr("fill", "none")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2,2")
            .attr("opacity", 0.5);

          // Label
          const label = g.append("text")
            .attr("x", targetX)
            .attr("y", targetY)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .attr("fill", "#1e293b")
            .attr("font-size", "8px")
            .attr("font-weight", "800")
            .attr("text-transform", "uppercase");

          label.append("tspan")
            .attr("fill", p.color)
            .text(`${p.idx + 1}. `);

          label.append("tspan")
            .text(labelText.length > 55 ? labelText.substring(0, 52) + "..." : labelText);
        });
      };

      drawCallouts(leftItems, 'left');
      drawCallouts(rightItems, 'right');
    }


  }, [loading, items]);

  const dimensionMap: Record<string, string> = {
    costOptimization: 'processVolume',
    operationsImprovement: 'orchestrationComplexity',
    riskTolerance: 'riskTolerance'
  };

  const normalize = (val?: string) => {
    if (val === 'high') return 5;
    if (val === 'medium') return 3;
    if (val === 'low') return 1;
    return 1;
  };

  const getGranularScore = (item: any, dim: string) => {
    const mappedDim = dimensionMap[dim] || dim;
    const val = item.aiAnalysis?.dimensions?.[mappedDim];
    return normalize(val);
  };

  const getFeasibilityParams = (item: any) => {
    const dims = item.aiAnalysis?.dimensions || {};
    return [
      { label: 'Technical Feasibility', score: normalize(dims.dataStructure) },
      { label: 'Process Simplicity', score: 6 - normalize(dims.orchestrationComplexity) },
      { label: 'Exception Stability', score: 6 - normalize(dims.exceptionHandling) },
      { label: 'Governance Risk', score: 6 - normalize(dims.complianceSensitivity) },
      { label: 'Operational Risk', score: 6 - normalize(dims.businessCriticality) }
    ];
  };

  const getROIPotential = (item: any) => {
    const bv = item.aiAnalysis?.businessBenefitScore || 0;
    const as = item.aiAnalysis?.automationScore || 0;
    // ROI is a function of Value and Ease of Implementation
    const score = (bv * as) / 10000;
    if (score >= 0.45) return { label: 'High', color: 'text-emerald-500' };
    if (score >= 0.20) return { label: 'Medium', color: 'text-amber-500' };
    return { label: 'Low', color: 'text-rose-500' };
  };

  const getQuadrantColor = (item: any) => {
    const bv = (item.aiAnalysis?.businessBenefitScore || 0) / 100;
    let feasibilityScore = item.aiAnalysis?.feasibilityScore;
    if (!feasibilityScore) {
      feasibilityScore = item.aiAnalysis?.automationScore || 0;
    }
    const f = (feasibilityScore || 0) / 100;
    
    if (bv >= 0.5 && f >= 0.5) return "#8b5cf6"; // Quick Wins
    if (bv >= 0.5 && f < 0.5) return "#f43f5e"; // Strategic Bets
    if (bv < 0.5 && f >= 0.5) return "#10b981"; // Tactical Gains
    return "#64748b"; // Low Priority
  };

  const getQuadrantComment = (item: any) => {
    const bv = (item.aiAnalysis?.businessBenefitScore || 0) / 100;
    let feasibilityScore = item.aiAnalysis?.feasibilityScore;
    if (!feasibilityScore) {
      feasibilityScore = item.aiAnalysis?.automationScore || 0;
    }
    const f = (feasibilityScore || 0) / 100;
    const as = item.aiAnalysis?.automationScore || 0;
    const roi = getROIPotential(item).label;

    if (bv >= 0.5 && f >= 0.5) {
      return `This process is a Quick Win, offering high Business Value (${Math.round(bv*100)}%) and high Feasibility (${Math.round(f*100)}%). With a ${roi} ROI potential, it should be prioritized for immediate deployment to deliver rapid organizational impact.`;
    } else if (bv >= 0.5 && f < 0.5) {
      return `Positioned as a Strategic Bet, this process delivers significant Business Value (${Math.round(bv*100)}%) but requires careful orchestration due to its lower feasibility (${Math.round(f*100)}%). The ${roi} ROI potential justifies the investment in handling its underlying challenges for long-term gains.`;
    } else if (bv < 0.5 && f >= 0.5) {
      return `This Tactical Gain process provides a reliable path to operational efficiency. While Business Value (${Math.round(bv*100)}%) is moderate, its high feasibility (${Math.round(f*100)}%) and ${roi} ROI potential make it an ideal candidate for steady, low-risk automation.`;
    } else {
      return `Classified as Low Priority, this process shows limited Business Value (${Math.round(bv*100)}%) and lower Feasibility (${Math.round(f*100)}%). Given the ${roi} ROI potential, it is recommended to focus resources on higher-impact quadrants at this stage.`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdff] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-8 border-[#9d7bb0]/20 border-t-[#9d7bb0] rounded-full animate-spin"></div>
        <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Generating Strategic Quadrant...</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10 bg-[#fcfdff] min-h-screen print:p-0 print:bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, footer, .print\\:hidden { display: none !important; }
          .bg-white { background-color: white !important; }
          .shadow-xl, .shadow-sm { shadow: none !important; }
          body { padding: 0 !important; margin: 0 !important; }
          .rounded-[56px] { border-radius: 0 !important; border: none !important; }
        }
      `}} />
      <div className="flex items-center justify-between print:mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/evaluations')} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-600 shadow-sm transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Strategic Quadrant</h1>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Multi-Process Fit Visualization</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-gray-100 print:hidden shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print PDF
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item, idx) => (
              <div key={item._id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm min-w-[140px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: getQuadrantColor(item)}}></span>
                <span className="text-[9px] font-black text-gray-600 uppercase truncate max-w-[100px]">{item.discovery?.processName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {/* Main Quadrant Visualization - Full Width */}
        <div className="bg-white rounded-[56px] border border-gray-100 shadow-xl p-12 flex flex-col items-center justify-center overflow-hidden relative">
          <svg ref={svgRef} width="1200" height="650" viewBox="0 0 1200 650" className="max-w-full h-auto"></svg>
          
          {/* How to Read Guide */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-5xl border-t border-gray-50 pt-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></div>
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Quick Wins</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">High Value (&ge; 50%) + High Feasibility (&ge; 50%). Immediate priorities for implementation.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div>
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Strategic Bets</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">High Value (&ge; 50%) + Lower Feasibility (&lt; 50%). Requires strategic investment.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Tactical Gains</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Lower Value (&lt; 50%) + High Feasibility (&ge; 50%). Good for operational efficiency.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></div>
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Low Priority</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Lower Business Value (&lt; 50%) + Low Feasibility (&lt; 50%). Deprioritize in roadmap.</p>
            </div>
          </div>

          {/* Interactive Detail Modal (Overlay) */}
          {selectedItem && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm p-12 flex flex-col items-center justify-center text-center"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-8 right-8 p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>

               <div className="max-w-2xl space-y-8">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{color: getQuadrantColor(selectedItem)}}>Process Insight</span>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{selectedItem.discovery?.processName}</h2>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Business Value</p>
                    <p className="text-2xl font-black" style={{color: getQuadrantColor(selectedItem)}}>{selectedItem.aiAnalysis?.businessBenefitScore}%</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Automation Score</p>
                    <p className="text-2xl font-black" style={{color: getQuadrantColor(selectedItem)}}>{selectedItem.aiAnalysis?.automationScore}%</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">ROI Potential</p>
                    <p className={`text-2xl font-black ${getROIPotential(selectedItem).color}`}>
                      {getROIPotential(selectedItem).label}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 font-medium leading-relaxed">
                  {getQuadrantComment(selectedItem)}
                </p>

                <div className="flex gap-4 justify-center pt-4">
                  <button 
                    onClick={() => navigate(`/results/${selectedItem._id}`)}
                    className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-gray-100"
                  >
                    View Full Analysis
                  </button>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="bg-white border border-gray-200 text-gray-900 px-8 py-4 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-gray-50 transition-all"
                  >
                    Back to Quadrant
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Granular Parameters - Comparison Grid Below */}
        <div className="bg-white p-12 rounded-[56px] border border-gray-100 shadow-sm space-y-12">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Fit Insights Comparison</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detailed parameter cross-reference across selected processes</p>
          </div>
          
          <div className="overflow-x-auto pb-6 custom-scrollbar">
            <div className="flex gap-8 min-w-max">
              {items.map((item, idx) => (
                <div key={item._id} className="w-[350px] space-y-8 bg-gray-50/50 p-8 rounded-[40px] border border-gray-100">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm" style={{backgroundColor: getQuadrantColor(item)}}>
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-gray-900 uppercase block truncate max-w-[200px]">{item.discovery?.processName}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Process Profile</span>
                    </div>
                  </div>

                  {/* Summary Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Value Score</p>
                      <p className="text-lg font-black" style={{color: getQuadrantColor(item)}}>{item.aiAnalysis?.businessBenefitScore}%</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Feasibility</p>
                      <p className="text-lg font-black" style={{color: getQuadrantColor(item)}}>
                        {(() => {
                          let f = item.aiAnalysis?.feasibilityScore;
                          if (!f && item.aiAnalysis?.automationScore && item.aiAnalysis?.businessBenefitScore) {
                            f = Math.round((item.aiAnalysis.automationScore + item.aiAnalysis.businessBenefitScore) / 2);
                          }
                          return f ? `${f}%` : '-';
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-10">
                    {/* Business Value Section */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 text-xs shadow-sm">💎</div>
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Value Metrics</h4>
                      </div>
                      
                      <div className="space-y-5">
                        {[
                          { label: 'Cost Optimization', score: getGranularScore(item, 'costOptimization') },
                          { label: 'Ops Improvement', score: getGranularScore(item, 'operationsImprovement') },
                          { label: 'Risk Improvement', score: getGranularScore(item, 'riskTolerance') }
                        ].map((param, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{param.label}</span>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map(val => (
                                <div 
                                  key={val} 
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                                    val <= param.score ? 'bg-[#002147] text-white shadow-sm' : 'bg-white text-gray-200 border border-gray-100'
                                  }`}
                                >
                                  {val}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feasibility Section */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center text-[#4db6ac] text-xs shadow-sm">🛠️</div>
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Feasibility</h4>
                      </div>
                      
                      <div className="space-y-5">
                        {getFeasibilityParams(item).map((param, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{param.label}</span>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map(val => (
                                <div 
                                  key={val} 
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                                    val <= param.score ? 'bg-[#002147] text-white shadow-sm' : 'bg-white text-gray-200 border border-gray-100'
                                  }`}
                                >
                                  {val}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategicQuadrant;
