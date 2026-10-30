import type { FlowEdge, FlowLesson, LinearLesson, ScreenNode } from "../types";
import { choiceHandle } from "./ids";

export const MIGRATED_END_ID = "migrated-end";

export function linearToFlow(lesson: LinearLesson): FlowLesson {
  const screens = [...lesson.screens];
  const last = screens[screens.length - 1];

  // Linear lessons have no end screens. The last content screen becomes the end;
  // if the lesson ends on a question, an end screen is added so its answers lead somewhere.
  if (last?.kind === "question") {
    screens.push({ id: MIGRATED_END_ID, kind: "content", title: "Lesson complete", body: "" });
  }

  const nodes: ScreenNode[] = screens.map((screen, i) => {
    const kind = i === screens.length - 1 && screen.kind === "content" ? "end" : screen.kind;
    return {
      id: screen.id,
      type: kind,
      position: { x: i * 300, y: (i % 2) * 80 },
      data: { kind, title: screen.title, body: screen.body, choices: screen.choices },
    };
  });

  const edges: FlowEdge[] = [];
  for (let i = 0; i < screens.length - 1; i++) {
    const from = screens[i];
    const to = screens[i + 1];
    if (from.kind === "question") {
      from.choices?.forEach((_, c) =>
        edges.push({ id: `${from.id}-${c}`, source: from.id, sourceHandle: choiceHandle(c), target: to.id })
      );
    } else {
      edges.push({ id: `${from.id}-next`, source: from.id, sourceHandle: "next", target: to.id });
    }
  }

  return { title: lesson.title, startId: screens[0]?.id ?? "", nodes, edges };
}
