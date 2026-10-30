export interface Choice {
  id: string;
  text: string;
  correct: boolean;
}

export interface LinearScreen {
  id: string;
  kind: "content" | "question";
  title: string;
  body: string;
  choices?: Choice[];
}

export interface LinearLesson {
  title: string;
  screens: LinearScreen[];
}

export type ScreenKind = "content" | "question" | "end";

export interface ScreenData extends Record<string, unknown> {
  kind: ScreenKind;
  title: string;
  body: string;
  choices?: Choice[];
}

export type ScreenNode = import("@xyflow/react").Node<ScreenData>;
export type FlowEdge = import("@xyflow/react").Edge;

export interface FlowLesson {
  title: string;
  startId: string;
  nodes: ScreenNode[];
  edges: FlowEdge[];
}
