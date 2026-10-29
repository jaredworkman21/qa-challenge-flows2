import type { FlowLesson } from "../types";

export function toShareCode(lesson: FlowLesson): string {
  return JSON.stringify(
    {
      v: 2,
      title: lesson.title,
      startId: lesson.startId,
      nodes: lesson.nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: lesson.edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    },
    null,
    2
  );
}

export function fromShareCode(code: string): FlowLesson | null {
  try {
    const parsed = JSON.parse(code);
    if (parsed?.v !== 2 || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return { title: parsed.title ?? "Untitled lesson", startId: parsed.startId, nodes: parsed.nodes, edges: parsed.edges };
  } catch {
    return null;
  }
}
