import type { FlowEdge, FlowLesson, LinearLesson, ScreenNode } from "../types";
import { choiceHandle } from "./ids";

export function linearToFlow(lesson: LinearLesson): FlowLesson {
  const nodes: ScreenNode[] = lesson.screens.map((screen, i) => ({
    id: screen.id,
    type: screen.kind,
    position: { x: i * 300, y: (i % 2) * 80 },
    data: { kind: screen.kind, title: screen.title, body: screen.body, choices: screen.choices },
  }));

  const edges: FlowEdge[] = [];
  for (let i = 0; i < lesson.screens.length - 2; i++) {
    const from = lesson.screens[i];
    const to = lesson.screens[i + 1];
    if (from.kind === "question") {
      from.choices?.forEach((_, c) =>
        edges.push({ id: `${from.id}-${c}`, source: from.id, sourceHandle: choiceHandle(c), target: to.id })
      );
    } else {
      edges.push({ id: `${from.id}-next`, source: from.id, sourceHandle: "next", target: to.id });
    }
  }

  return { title: lesson.title, startId: lesson.screens[0]?.id ?? "", nodes, edges };
}
