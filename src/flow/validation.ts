import type { FlowLesson } from "../types";
import { choiceHandle } from "./ids";

export interface Issue {
  nodeId: string;
  message: string;
}

function reachableFrom(startId: string, edges: FlowLesson["edges"]): Set<string> {
  const seen = new Set<string>([startId]);
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of edges) {
      if (e.source === id && !seen.has(e.target)) {
        seen.add(e.target);
        queue.push(e.target);
      }
    }
  }
  return seen;
}

export function validate(lesson: Pick<FlowLesson, "startId" | "nodes" | "edges">): Issue[] {
  const issues: Issue[] = [];
  const reachable = reachableFrom(lesson.startId, lesson.edges);

  for (const node of lesson.nodes) {
    const { data } = node;
    const outgoing = lesson.edges.filter((e) => e.source === node.id);

    if (!data.title?.trim()) {
      issues.push({ nodeId: node.id, message: "Every screen needs a title." });
    }

    if (!reachable.has(node.id)) {
      issues.push({ nodeId: node.id, message: "This screen can't be reached from the start screen." });
    }

    if (data.kind === "content" && outgoing.length === 0) {
      issues.push({ nodeId: node.id, message: "Connect Continue to another screen, or finish the path with an end screen." });
    }

    if (data.kind === "question") {
      const choices = data.choices ?? [];
      if (choices.length < 2) {
        issues.push({ nodeId: node.id, message: "Questions need at least two answers." });
      }
      if (!choices.some((c) => c.correct)) {
        issues.push({ nodeId: node.id, message: "Mark at least one answer as correct." });
      }
      const connected = new Set(outgoing.map((e) => e.sourceHandle));
      const missing = choices.findIndex((_, i) => !connected.has(choiceHandle(i)));
      if (missing !== -1) {
        issues.push({ nodeId: node.id, message: `Answer ${missing + 1} doesn't lead anywhere yet.` });
      }
    }
  }

  return issues;
}
