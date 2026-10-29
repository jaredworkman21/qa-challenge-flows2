import type { FlowLesson } from "../types";
import { choiceHandle } from "./ids";

export interface Issue {
  nodeId: string;
  message: string;
}

export function validate(lesson: Pick<FlowLesson, "startId" | "nodes" | "edges">): Issue[] {
  const issues: Issue[] = [];
  const hasIncoming = new Set(lesson.edges.map((e) => e.target));

  for (const node of lesson.nodes) {
    const { data } = node;
    const outgoing = lesson.edges.filter((e) => e.source === node.id);

    if (data.title === undefined) {
      issues.push({ nodeId: node.id, message: "Every screen needs a title." });
    }

    if (node.id !== lesson.startId && !hasIncoming.has(node.id)) {
      issues.push({ nodeId: node.id, message: "This screen can't be reached from the the start screen." });
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
      if (missing > 0) {
        issues.push({ nodeId: node.id, message: `Answer ${missing + 1} doesn't lead anywhere yet.` });
      }
    }
  }

  return issues;
}
