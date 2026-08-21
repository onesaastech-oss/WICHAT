import React, { useEffect, useMemo, useState } from 'react';
import { Header, Sidebar } from '../../component/Menu';
import { FiGitBranch, FiMessageSquare, FiType, FiGitMerge, FiFlag, FiStopCircle, FiSave, FiUploadCloud, FiPower, FiPlus, FiTrash2, FiLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createFlow, getFlow, getFlowStatus, listFlows, publishFlow, toggleFlow, updateFlowDraft, validateFlow } from '../../api/flowBuilder';

const palette = [
  { type: 'message', label: 'Message', icon: FiMessageSquare, defaults: { text: 'Thanks for contacting us.', interactive: false, items: [{ id: 'option_1', title: 'Yes' }, { id: 'option_2', title: 'No' }] } },
  { type: 'keyword', label: 'Keyword', icon: FiType, defaults: { value: 'hello', match: 'contains' } },
  { type: 'condition', label: 'Condition', icon: FiGitMerge, defaults: { value: 'yes' } },
  { type: 'end', label: 'End', icon: FiFlag, defaults: {} },
  { type: 'stop', label: 'Stop', icon: FiStopCircle, defaults: {} },
];

const emptyGraph = () => ({ version: 1, nodes: [{ id: 'start', type: 'start', position: { x: 80, y: 80 }, data: {} }], edges: [] });
const labelFor = (node) => node.type === 'message' ? node.data?.text || 'Message' : node.type === 'keyword' ? `Keyword: ${node.data?.value || ''}` : node.type[0].toUpperCase() + node.type.slice(1);

export default function Flow() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => JSON.parse(localStorage.getItem('sidebarMinimized') || 'false'));
  const [projectId, setProjectId] = useState('');
  const [flowId, setFlowId] = useState(null);
  const [flowName, setFlowName] = useState('Customer Support Flow');
  const [graph, setGraph] = useState(emptyGraph);
  const [selectedId, setSelectedId] = useState('start');
  const [connectFrom, setConnectFrom] = useState(null);
  const [flows, setFlows] = useState([]);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized)), [isMinimized]);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setProjectId(user.selected_project_id || user.projects?.[0]?.project_id || '');
  }, []);
  useEffect(() => { if (projectId) loadFlows(); }, [projectId]);

  const openFlow = async (id) => {
    const result = await getFlow(projectId, id);
    if (result.error) throw new Error(result.error);
    setFlowId(id); setFlowName(result.data.name); setGraph(result.data.draft || emptyGraph()); setSelectedId(null); setConnectFrom(null);
  };
  const loadFlows = async () => {
    try {
      const result = await listFlows(projectId); const items = result.data || []; setFlows(items);
      const status = await getFlowStatus(projectId); setEnabled(Boolean(status.flow_builder_enabled));
      const requested = localStorage.getItem('flowBuilderOpenId');
      if (requested) { localStorage.removeItem('flowBuilderOpenId'); await openFlow(requested); }
      else if (status.active_flow?.flow_id) await openFlow(status.active_flow.flow_id); else if (items[0]) await openFlow(items[0].flow_id);
    } catch (error) { toast.error(error?.response?.data?.error || 'Unable to load flows'); }
  };
  const addNode = (item, position = { x: 260, y: 120 }) => {
    const id = `${item.type}-${Date.now()}`;
    setGraph((current) => ({ ...current, nodes: [...current.nodes, { id, type: item.type, position, data: { ...item.defaults } }] }));
    setSelectedId(id);
  };
  const dropNode = (event) => {
    event.preventDefault(); const item = palette.find((entry) => entry.type === event.dataTransfer.getData('flow-node')); if (!item) return;
    const rect = event.currentTarget.getBoundingClientRect(); addNode(item, { x: Math.max(20, event.clientX - rect.left - 90), y: Math.max(20, event.clientY - rect.top - 35) });
  };
  const selectNode = (id) => {
    if (!connectFrom) { if (selectedId === id) setConnectFrom(id); setSelectedId(id); return; }
    if (connectFrom !== id) setGraph((current) => ({ ...current, edges: [...current.edges, { id: `edge-${Date.now()}`, source: connectFrom, target: id }] }));
    setConnectFrom(null); setSelectedId(id);
  };
  const updateNode = (field, value) => setGraph((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedId ? { ...node, data: { ...node.data, [field]: value } } : node) }));
  const deleteNode = () => {
    if (!selectedId || selectedId === 'start') return;
    setGraph((current) => ({ ...current, nodes: current.nodes.filter((node) => node.id !== selectedId), edges: current.edges.filter((edge) => edge.source !== selectedId && edge.target !== selectedId) }));
    setSelectedId(null);
  };
  const save = async () => {
    if (!projectId) return toast.error('Select a project first');
    setBusy(true);
    try {
      let id = flowId;
      if (!id) { const result = await createFlow({ project_id: projectId, name: flowName, graph }); if (result.error || !result.data?.flow_id) throw new Error(result.error || 'Flow was not created'); id = result.data.flow_id; setFlowId(id); }
      else { const result = await updateFlowDraft({ project_id: projectId, flow_id: id, name: flowName, graph }); if (result.error) throw new Error(result.error); }
      toast.success('Draft saved'); await loadFlows();
    } catch (error) { toast.error(error?.response?.data?.error || 'Failed to save draft'); } finally { setBusy(false); }
  };
  const publish = async () => {
    if (!flowId) return toast.error('Save the flow before publishing');
    setBusy(true);
    try {
      const result = await validateFlow({ project_id: projectId, graph });
      if (!result.valid) return toast.error((result.errors || []).join(', '));
      const saved = await updateFlowDraft({ project_id: projectId, flow_id: flowId, name: flowName, graph }); if (saved.error) throw new Error(saved.error); const published = await publishFlow({ project_id: projectId, flow_id: flowId }); if (published.error) throw new Error(published.error); toast.success('Flow published');
    } catch (error) { toast.error(error?.response?.data?.error || 'Failed to publish'); } finally { setBusy(false); }
  };
  const toggle = async () => {
    try { const result = await toggleFlow({ project_id: projectId, flow_id: flowId, enabled: !enabled }); if (result.error) return toast.error(result.error); setEnabled(!enabled); toast.success(`Flow Builder turned ${!enabled ? 'on' : 'off'}`); } catch { toast.error('Failed to update Flow Builder'); }
  };
  const selectedNode = useMemo(() => graph.nodes.find((node) => node.id === selectedId), [graph.nodes, selectedId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
      <main className={`pt-16 transition-all ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
        <div className="p-4 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><FiGitBranch className="text-indigo-600" /> Flow Builder</h1><p className="text-sm text-slate-500 mt-1">Drag nodes onto the canvas, then click two nodes to connect them.</p></div><div className="flex gap-2"><button onClick={save} disabled={busy} className="btn-primary"><FiSave /> Save draft</button><button onClick={publish} disabled={busy} className="btn-secondary"><FiUploadCloud /> Publish</button><button onClick={toggle} disabled={!flowId} className="btn-secondary"><FiPower /> {enabled ? 'Enabled' : 'Enable'}</button></div></div>
          <div className="flex gap-3 mb-4 overflow-x-auto">{flows.map((flow) => <button key={flow.flow_id} onClick={() => openFlow(flow.flow_id)} className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap ${flow.flow_id === flowId ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}>{flow.name}</button>)}<button onClick={() => { setFlowId(null); setFlowName('New Flow'); setGraph(emptyGraph()); }} className="px-3 py-2 rounded-lg border border-dashed text-indigo-600 whitespace-nowrap"><FiPlus className="inline" /> New flow</button></div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="flex items-center gap-3 p-3 border-b"><input value={flowName} onChange={(event) => setFlowName(event.target.value)} className="font-semibold bg-transparent outline-none px-2 py-1" /><span className="text-xs text-slate-400">{enabled ? 'Live' : 'Draft mode'}</span></div>
            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_250px] min-h-[620px]">
              <aside className="p-3 border-r bg-slate-50/70"><p className="text-xs font-bold uppercase text-slate-400 mb-3">Nodes</p>{palette.map((item) => { const Icon = item.icon; return <div key={item.type} draggable onDragStart={(event) => event.dataTransfer.setData('flow-node', item.type)} onClick={() => addNode(item)} className="flex items-center gap-2 p-3 mb-2 bg-white border rounded-xl cursor-grab hover:border-indigo-400 text-sm"><span className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Icon /></span>{item.label}</div>; })}<p className="text-xs text-slate-400 mt-5 leading-5">Start is created automatically. Select a node, then select another node to connect them.</p></aside>
              <section onDragOver={(event) => event.preventDefault()} onDrop={dropNode} className="relative min-h-[620px] overflow-auto bg-[radial-gradient(#dbe3f0_1px,transparent_1px)] [background-size:18px_18px] p-5">{graph.nodes.map((node) => <div key={node.id} onClick={() => selectNode(node.id)} style={{ left: node.position?.x || 20, top: node.position?.y || 20 }} className={`absolute w-44 rounded-xl border-2 bg-white shadow-sm cursor-pointer ${selectedId === node.id ? 'border-indigo-500 ring-4 ring-indigo-100' : connectFrom === node.id ? 'border-amber-500' : 'border-slate-200'}`}><div className="px-3 py-2 border-b text-xs font-bold">{node.type}</div><div className="p-3 text-sm text-slate-600 break-words">{labelFor(node)}</div><div className="text-[10px] text-center text-indigo-500 pb-2">click to select/connect</div></div>)}</section>
              <aside className="p-4 border-l"><p className="text-xs font-bold uppercase text-slate-400 mb-3">Node settings</p>{selectedNode ? <div className="space-y-3"><div className="text-sm font-semibold">{selectedNode.type}</div>{selectedNode.type === 'message' && <><label className="text-xs text-slate-500">Message<textarea value={selectedNode.data?.text || ''} onChange={(event) => updateNode('text', event.target.value)} rows={5} className="field mt-1" /></label><label className="flex gap-2 text-xs"><input type="checkbox" checked={Boolean(selectedNode.data?.interactive)} onChange={(event) => updateNode('interactive', event.target.checked)} /> Interactive list</label></>}{['keyword', 'condition'].includes(selectedNode.type) && <label className="text-xs text-slate-500">Match value<input value={selectedNode.data?.value || ''} onChange={(event) => updateNode('value', event.target.value)} className="field mt-1" /></label>}{selectedNode.type !== 'start' && <button onClick={deleteNode} className="text-sm text-rose-600 flex items-center gap-2"><FiTrash2 /> Delete node</button>}</div> : <p className="text-sm text-slate-400">Select a node to edit it.</p>}</aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
