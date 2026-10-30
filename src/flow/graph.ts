import { addEdge, type Connection } from "@xyflow/react";
import type { FlowEdge } from "../types";
import { choiceHandle } from "./ids";

// Each output (Continue, or one answer) leads to one screen, so a new connection replaces the old one.
export const connect = (edges: FlowEdge[], c: Connection): FlowEdge[] =>
  addEdge(c, edges.filter((e) => !(e.source === c.source && e.sourceHandle === c.sourceHandle)));

export const isValidConnection = (c: Connection | FlowEdge) => c.source !== c.target;

export const removeNodeEdges = (edges: FlowEdge[], nodeId: string): FlowEdge[] =>
  edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

// Answer handles are positional, so removing an answer drops its edge and shifts the later ones down.
export function removeChoiceEdges(edges: FlowEdge[], nodeId: string, index: number): FlowEdge[] {
  return edges.flatMap((e) => {
    if (e.source !== nodeId) return [e];
    const match = e.sourceHandle?.match(/^choice-(\d+)$/);
    if (!match) return [e];
    const i = Number(match[1]);
    if (i === index) return [];
    return i > index ? [{ ...e, sourceHandle: choiceHandle(i - 1) }] : [e];
  });
}
