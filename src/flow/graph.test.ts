import { describe, expect, it } from "vitest";
import type { FlowEdge } from "../types";
import { connect, isValidConnection, removeChoiceEdges, removeNodeEdges } from "./graph";

const edge = (source: string, target: string, sourceHandle = "next"): FlowEdge => ({
  id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle,
});
const conn = (source: string, target: string, sourceHandle = "next") => ({
  source, target, sourceHandle, targetHandle: null,
});
const summary = (edges: FlowEdge[]) => edges.map((e) => `${e.source}:${e.sourceHandle}->${e.target}`);

describe("connect", () => {
  it("replaces the existing connection from the same answer", () => {
    const edges = [edge("q", "x", "choice-0")];
    expect(summary(connect(edges, conn("q", "y", "choice-0")))).toEqual(["q:choice-0->y"]);
  });

  it("keeps connections from other answers on the same question", () => {
    const edges = [edge("q", "x", "choice-0")];
    expect(summary(connect(edges, conn("q", "x", "choice-1")))).toEqual(["q:choice-0->x", "q:choice-1->x"]);
  });

  it("replaces Continue on a content screen", () => {
    const edges = [edge("a", "x")];
    expect(summary(connect(edges, conn("a", "y")))).toEqual(["a:next->y"]);
  });
});

describe("isValidConnection", () => {
  it("rejects connecting a screen to itself", () => {
    expect(isValidConnection(conn("a", "a"))).toBe(false);
  });

  it("allows connecting to another screen", () => {
    expect(isValidConnection(conn("a", "b"))).toBe(true);
  });
});

describe("removeNodeEdges", () => {
  it("removes edges into and out of the deleted screen", () => {
    const edges = [edge("a", "b"), edge("b", "c"), edge("c", "d")];
    expect(summary(removeNodeEdges(edges, "b"))).toEqual(["c:next->d"]);
  });
});

describe("removeChoiceEdges", () => {
  const edges = [
    edge("q", "x", "choice-0"),
    edge("q", "y", "choice-1"),
    edge("q", "z", "choice-2"),
    edge("other", "w", "choice-1"),
  ];

  it("drops the removed answer's edge and shifts later answers down", () => {
    expect(summary(removeChoiceEdges(edges, "q", 1))).toEqual([
      "q:choice-0->x",
      "q:choice-1->z",
      "other:choice-1->w",
    ]);
  });

  it("leaves other screens' edges alone", () => {
    expect(removeChoiceEdges(edges, "q", 0).filter((e) => e.source === "other")).toEqual([edges[3]]);
  });
});
