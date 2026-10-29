import { describe, expect, it } from "vitest";
import type { FlowEdge, ScreenNode } from "../types";
import { validate } from "./validation";

const content = (id: string, title = "Screen"): ScreenNode => ({
  id, type: "content", position: { x: 0, y: 0 }, data: { kind: "content", title, body: "" },
});
const question = (id: string): ScreenNode => ({
  id, type: "question", position: { x: 0, y: 0 },
  data: {
    kind: "question", title: "Q", body: "",
    choices: [{ id: "a", text: "A", correct: true }, { id: "b", text: "B", correct: false }],
  },
});
const end = (id: string): ScreenNode => ({
  id, type: "end", position: { x: 0, y: 0 }, data: { kind: "end", title: "Done", body: "" },
});
const edge = (source: string, target: string, sourceHandle = "next"): FlowEdge => ({
  id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle,
});

describe.skip("validate", () => {
  it("passes a complete lesson", () => {
    const nodes = [content("a"), question("q"), end("x"), end("y")];
    const edges = [edge("a", "q"), edge("q", "x", "choice-0"), edge("q", "y", "choice-1")];
    expect(validate({ startId: "a", nodes, edges })).toEqual([]);
  });

  it("flags a screen nothing points to", () => {
    const nodes = [content("a"), end("x"), end("orphan")];
    const edges = [edge("a", "x")];
    expect(validate({ startId: "a", nodes, edges }).map((i) => i.nodeId)).toEqual(["orphan"]);
  });

  it("flags an unconnected first answer", () => {
    const nodes = [question("q"), end("y")];
    const edges = [edge("q", "y", "choice-1")];
    expect(validate({ startId: "q", nodes, edges })).toHaveLength(1);
  });

  it("flags a screen with an empty title", () => {
    const nodes = [content("a", ""), end("x")];
    const edges = [edge("a", "x")];
    expect(validate({ startId: "a", nodes, edges })).toHaveLength(1);
  });
});
