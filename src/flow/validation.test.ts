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

describe("validate", () => {
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

  it("flags a screen whose title is only whitespace", () => {
    const nodes = [content("a", "   "), end("x")];
    const edges = [edge("a", "x")];
    expect(validate({ startId: "a", nodes, edges })).toEqual([
      { nodeId: "a", message: "Every screen needs a title." },
    ]);
  });

  it("names the first unconnected answer in the message", () => {
    const nodes = [question("q"), end("y")];
    const edges = [edge("q", "y", "choice-1")];
    expect(validate({ startId: "q", nodes, edges })[0].message).toBe("Answer 1 doesn't lead anywhere yet.");
  });

  it("flags screens that only link to each other and can't be reached from the start", () => {
    const nodes = [content("a"), end("x"), content("b"), content("c")];
    const edges = [edge("a", "x"), edge("b", "c"), edge("c", "b")];
    const unreachable = validate({ startId: "a", nodes, edges })
      .filter((i) => i.message.includes("can't be reached"))
      .map((i) => i.nodeId);
    expect(unreachable).toEqual(["b", "c"]);
  });

  it("flags screens reachable only from an orphan", () => {
    const nodes = [content("a"), end("x"), content("orphan"), end("y")];
    const edges = [edge("a", "x"), edge("orphan", "y")];
    const unreachable = validate({ startId: "a", nodes, edges })
      .filter((i) => i.message.includes("can't be reached"))
      .map((i) => i.nodeId);
    expect(unreachable).toEqual(["orphan", "y"]);
  });

  it("does not repeat words in the unreachable message", () => {
    const nodes = [content("a"), end("x"), end("orphan")];
    const edges = [edge("a", "x")];
    expect(validate({ startId: "a", nodes, edges })[0].message).toBe("This screen can't be reached from the start screen.");
  });

  it("flags a content screen with nothing connected to Continue", () => {
    const nodes = [content("a")];
    expect(validate({ startId: "a", nodes, edges: [] })).toHaveLength(1);
  });
});
