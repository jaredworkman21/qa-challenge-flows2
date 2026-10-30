import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ScreenNode } from "../types";
import { useFlowMeta } from "./context";
import { choiceHandle } from "./ids";

function Shell({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  const { startId, issueIds } = useFlowMeta();
  const isStart = id === startId;
  return (
    <div className={`node${issueIds.has(id) ? " has-issue" : ""}${isStart ? " is-start" : ""}`}>
      <div className="node-head">
        {isStart && <span className="start-pill">Start</span>}
        <span className="kind">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function ContentNode({ id, data }: NodeProps<ScreenNode>) {
  return (
    <Shell id={id} label="Content">
      <Handle type="target" position={Position.Left} />
      <div className="node-title">{data.title}</div>
      {data.body && <div className="node-body">{data.body}</div>}
      <div className="node-out">
        Continue
        <Handle type="source" position={Position.Right} id="next" />
      </div>
    </Shell>
  );
}

export function QuestionNode({ id, data }: NodeProps<ScreenNode>) {
  return (
    <Shell id={id} label="Question">
      <Handle type="target" position={Position.Left} />
      <div className="node-title">{data.title}</div>
      {data.choices?.map((choice, i) => (
        <div className="node-out" key={choice.id}>
          <span className={choice.correct ? "is-correct" : undefined}>{choice.text}</span>
          <Handle type="source" position={Position.Right} id={choiceHandle(i)} />
        </div>
      ))}
    </Shell>
  );
}

export function EndNode({ id, data }: NodeProps<ScreenNode>) {
  return (
    <Shell id={id} label="End">
      <Handle type="target" position={Position.Left} />
      <div className="node-title">{data.title}</div>
      {data.body && <div className="node-body">{data.body}</div>}
    </Shell>
  );
}

export const nodeTypes = { content: ContentNode, question: QuestionNode, end: EndNode };
