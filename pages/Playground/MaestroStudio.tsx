// Agent Playground — UiPath Maestro-style studio shell. Navigation state lives in the URL
// (?view=…&flow=…&run=…) so refresh, back/forward and shared links land on the same screen.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Workflow, History, AlertTriangle, UserCheck, Zap, LayoutTemplate, ChevronsLeft, ChevronsRight, Network } from 'lucide-react';
import { apiService } from '../../services/api';
import { StudioTheme, cx, useFillHeight } from '../../components/studio/ui';
import { DesignerView } from './DesignerView';
import { InstanceDetailView, InstancesView, Nav, ProcessesView, TasksView, TemplatesView, TriggersView } from './StudioViews';
import { Lookups } from './PropertiesPanel';

type View = 'processes' | 'designer' | 'instances' | 'instance' | 'incidents' | 'tasks' | 'triggers' | 'templates';

const NAV_ITEMS: { key: View; label: string; icon: React.ComponentType<any>; group: 'Build' | 'Operate' }[] = [
  { key: 'processes', label: 'Processes', icon: Workflow, group: 'Build' },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate, group: 'Build' },
  { key: 'instances', label: 'Instances', icon: History, group: 'Operate' },
  { key: 'incidents', label: 'Incidents', icon: AlertTriangle, group: 'Operate' },
  { key: 'tasks', label: 'Tasks', icon: UserCheck, group: 'Operate' },
  { key: 'triggers', label: 'Triggers', icon: Zap, group: 'Operate' },
];

const MaestroStudio: React.FC = () => {
  const height = useFillHeight();
  const [sp, setSp] = useSearchParams();
  const view = (sp.get('view') as View) || 'processes';
  const flowId = sp.get('flow') || undefined;
  const runId = sp.get('run') || undefined;
  const filterFlow = sp.get('fflow') || undefined;
  const filterStatus = sp.get('fstatus') || undefined;
  const autoRun = sp.get('autorun') === '1';

  const [lookups, setLookups] = useState<Lookups>({ agents: [], connectors: [], flows: [], nodeTypes: [] });
  const [counts, setCounts] = useState<{ incidents: number; tasks: number }>({ incidents: 0, tasks: 0 });
  const [railCollapsed, setRailCollapsed] = useState<boolean>(() => { try { return localStorage.getItem('maestroRail') === '1'; } catch { return false; } });

  const refreshFlows = useCallback(async () => {
    try { const r = await apiService.playground.flows.list({ limit: 100 }); setLookups(l => ({ ...l, flows: r?.data || [] })); } catch { /* lists show their own errors */ }
  }, []);

  useEffect(() => {
    // Catalogs drive the toolbox / property pickers; each failure is isolated so one bad call
    // doesn't blank the whole studio.
    apiService.playground.catalog.getNodeTypes().then(r => setLookups(l => ({ ...l, nodeTypes: r?.data || [] }))).catch(() => {});
    apiService.playground.catalog.getConnectors().then(r => setLookups(l => ({ ...l, connectors: r?.data || [] }))).catch(() => {});
    apiService.playground.catalog.getAgents().then(r => setLookups(l => ({ ...l, agents: r?.data || [] }))).catch(() => {});
    refreshFlows();
  }, [refreshFlows]);

  const loadCounts = useCallback(async () => {
    try {
      const r = await apiService.playground.runs.stats();
      const d = r?.data || {};
      setCounts({ incidents: d.incidents ?? d.by_status?.failed ?? 0, tasks: Math.max(d.by_status?.waiting_approval || 0, d.waiting?.approval || 0) });
    } catch { /* badge counts are best-effort */ }
  }, []);
  useEffect(() => { loadCounts(); const t = setInterval(loadCounts, 20000); return () => clearInterval(t); }, [loadCounts]);
  useEffect(() => { loadCounts(); }, [view, loadCounts]);

  const go = useCallback((params: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) next.set(k, v); });
    setSp(next);
  }, [setSp]);

  const nav: Nav = useMemo(() => ({
    openProcess: (id, opts) => go({ view: 'designer', flow: id, autorun: opts?.run ? '1' : undefined }),
    openInstance: id => go({ view: 'instance', run: id }),
    openInstances: f => go({ view: 'instances', fflow: f?.flow_id, fstatus: f?.status }),
    openTriggers: id => go({ view: 'triggers', flow: id }),
    refreshFlows,
  }), [go, refreshFlows]);

  const toggleRail = () => setRailCollapsed(c => { try { localStorage.setItem('maestroRail', c ? '0' : '1'); } catch {} return !c; });
  const compactRail = railCollapsed || view === 'designer' || view === 'instance';
  const activeKey: View = view === 'designer' ? 'processes' : view === 'instance' ? 'instances' : view;

  return (
    <StudioTheme accent="maestro" className="flex bg-[#f4f5f7]" style={{ height: height ?? undefined, minHeight: 520 }}>
      {/* Left navigation rail */}
      <aside className={cx('flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200', compactRail ? 'w-[56px]' : 'w-[224px]')}>
        <div className={cx('flex h-14 items-center border-b border-slate-200', compactRail ? 'justify-center' : 'gap-2.5 px-4')}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#fa4616] text-white"><Network className="h-[18px] w-[18px]" /></span>
          {!compactRail && (
            <div className="min-w-0 leading-tight">
              <div className="text-[14px] font-semibold text-slate-900">Maestro</div>
              <div className="text-[11.5px] text-slate-500">Agent Playground</div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {(['Build', 'Operate'] as const).map(g => (
            <div key={g} className="mb-1">
              {!compactRail ? <div className="px-4 pb-1 pt-2 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">{g}</div> : <div className="mx-3 my-2 border-t border-slate-100" />}
              {NAV_ITEMS.filter(i => i.group === g).map(item => {
                const I = item.icon;
                const active = activeKey === item.key;
                const badge = item.key === 'incidents' ? counts.incidents : item.key === 'tasks' ? counts.tasks : 0;
                return (
                  <button key={item.key} onClick={() => go({ view: item.key })} title={compactRail ? item.label : undefined}
                    className={cx('relative flex w-full items-center text-[13.5px] transition-colors', compactRail ? 'h-10 justify-center' : 'h-9 gap-2.5 px-4',
                      active ? 'bg-[var(--sx-primary-soft)] font-semibold text-[var(--sx-primary)]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}>
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--sx-primary)]" />}
                    <I className="h-4 w-4 shrink-0" />
                    {!compactRail && <span className="flex-1 text-left">{item.label}</span>}
                    {badge > 0 && (
                      <span className={cx('rounded-full px-1.5 text-[11px] font-semibold leading-[18px] text-white', item.key === 'incidents' ? 'bg-red-600' : 'bg-amber-500', compactRail && 'absolute right-1.5 top-1 px-1 text-[10px] leading-[15px]')}>{badge > 99 ? '99+' : badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        {view !== 'designer' && view !== 'instance' && (
          <button onClick={toggleRail} className="flex h-10 items-center justify-center gap-2 border-t border-slate-200 text-[12.5px] text-slate-500 hover:bg-slate-50" title={railCollapsed ? 'Expand' : 'Collapse'}>
            {railCollapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" />Collapse</>}
          </button>
        )}
      </aside>

      {/* Main area */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        {view === 'processes' && <ProcessesView nav={nav} />}
        {view === 'designer' && flowId && (
          <DesignerView key={flowId} flowId={flowId} lookups={lookups} autoRun={autoRun}
            onBack={() => go({ view: 'processes' })}
            onOpenFlow={id => nav.openProcess(id)}
            onOpenInstance={nav.openInstance}
            onOpenInstancesFor={id => nav.openInstances({ flow_id: id })}
            onOpenTriggersFor={id => nav.openTriggers(id)}
            onFlowsChanged={refreshFlows} />
        )}
        {view === 'designer' && !flowId && <ProcessesView nav={nav} />}
        {view === 'instances' && <InstancesView nav={nav} lookups={lookups} initialFilter={{ flow_id: filterFlow, status: filterStatus }} />}
        {view === 'incidents' && <InstancesView nav={nav} lookups={lookups} mode="incidents" />}
        {view === 'instance' && runId && <InstanceDetailView key={runId} runId={runId} nav={nav} lookups={lookups} onBack={() => window.history.length > 1 ? window.history.back() : go({ view: 'instances' })} />}
        {view === 'tasks' && <TasksView nav={nav} />}
        {view === 'triggers' && <TriggersView nav={nav} lookups={lookups} flowId={flowId} />}
        {view === 'templates' && <TemplatesView nav={nav} lookups={lookups} />}
      </main>
    </StudioTheme>
  );
};

export default MaestroStudio;
