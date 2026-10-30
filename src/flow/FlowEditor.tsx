import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FlowLesson, ScreenData, ScreenKind, ScreenNode } from "../types";
import { loadFlow, saveFlow } from "../storage";
import { nodeTypes } from "./nodes";
import { FlowMetaContext } from "./context";
import { answerId, screenId } from "./ids";
import { validate } from "./validation";
import NodePanel from "./NodePanel";
import ShareDialog from "./ShareDialog";
import FlowPlayer from "../player/FlowPlayer";

const defaults: Record<ScreenKind, () => ScreenData> = {
  content: () => ({ kind: "content", title: "New screen", body: "" }),
  question: () => ({
    kind: "question",
    title: "New question",
    body: "",
    choices: [
      { id: answerId(), text: "Answer 1", correct: true },
      { id: answerId(), text: "Answer 2", correct: false },
    ],
  }),
  end: () => ({ kind: "end", title: "Lesson complete", body: "Nice work." }),
};

export default function FlowEditor() {
  const initial = useMemo(loadFlow, []);
  const [title] = useState(initial.title);
  const [startId, setStartId] = useState(initial.startId);
  const [nodes, setNodes] = useState<ScreenNode[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState("");

  const lesson: FlowLesson = { title, startId, nodes, edges };
  const issues = useMemo(() => validate({ startId, nodes, edges }), [startId, nodes, edges]);
  const issueIds = useMemo(() => new Set(issues.map((i) => i.nodeId)), [issues]);
  const selected = nodes.find((n) => n.id === selectedId);

  const dataKey = JSON.stringify(nodes.map((n) => [n.id, n.data]));
  useEffect(() => {
    saveFlow({ title, startId, nodes, edges });
  }, [dataKey, edges, startId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const onNodesChange = useCallback(
    (changes: NodeChange<ScreenNode>[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    []
  );
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((es) => applyEdgeChanges(changes, es)), []);
  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((es) => addEdge(c, es.filter((e) => !(e.source === c.source && e.target === c.target)))),
    []
  );
  const isValidConnection = useCallback((c: Connection | Edge) => c.source !== c.sourceHandle, []);

  const addScreen = (kind: ScreenKind) => {
    const id = screenId();
    setNodes((ns) => [
      ...ns,
      { id, type: kind, position: { x: 120 + ns.length * 30, y: 260 + ns.length * 20 }, data: defaults[kind]() },
    ]);
    setSelectedId(id);
  };

  const updateNode = (id: string, patch: Partial<ScreenData>) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));

  const deleteNode = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setSelectedId(null);
  };

  const importLesson = (next: FlowLesson) => {
    setNodes(next.nodes);
    setEdges(next.edges);
    setStartId(next.startId);
    setSelectedId(null);
    setToast("Lesson replaced");
  };

  return (
    <FlowMetaContext.Provider value={{ startId, issueIds }}>
      <div className="app">
        <header className="topbar">
          <span className="brand">Pathways</span>
          <span className="lesson-title">{title}</span>
          <div className="toolbar">
            <button className="btn" onClick={() => addScreen("content")}>Add content</button>
            <button className="btn" onClick={() => addScreen("question")}>Add question</button>
            <button className="btn" onClick={() => addScreen("end")}>Add end screen</button>
          </div>
          <span className="spacer" />
          <button className="btn" onClick={() => setSharing(true)}>Share code</button>
          <button className="btn" onClick={() => setPreviewing(true)}>Preview</button>
          <button
            className="btn primary"
            disabled={issues.length > 0}
            title={issues.length ? "Fix the issues in the side panel to publish" : undefined}
            onClick={() => setToast("Published")}
          >
            Publish
          </button>
        </header>
        <div className="workspace">
          <div className="canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              onPaneClick={() => setSelectedId(null)}
              defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
              fitView
            >
              <Background gap={20} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
          <aside className="side">
            {selected ? (
              <NodePanel
                node={selected}
                isStart={selected.id === startId}
                onChange={(patch) => updateNode(selected.id, patch)}
                onDelete={() => deleteNode(selected.id)}
              />
            ) : (
              <div className="panel-section empty">
                <p>Select a screen to edit it.</p>
                <p className="hint">Drag between the dots to connect screens. Select a connection and press Delete to remove it.</p>
              </div>
            )}
            <div className="panel-section">
              <div className="panel-head">
                <span className="kind">Issues</span>
                <span className="count">{issues.length}</span>
              </div>
              {issues.length === 0 ? (
                <p className="ok">Ready to publish.</p>
              ) : (
                <ul className="issues">
                  {issues.map((issue, i) => (
                    <li key={i}>
                      <button className="issue" onClick={() => setSelectedId(issue.nodeId)}>
                        <strong>{nodes.find((n) => n.id === issue.nodeId)?.data.title}</strong>
                        <span>{issue.message}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
        {previewing && <FlowPlayer lesson={lesson} onClose={() => setPreviewing(false)} />}
        {sharing && <ShareDialog lesson={lesson} onImport={importLesson} onClose={() => setSharing(false)} />}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </FlowMetaContext.Provider>
  );
}
