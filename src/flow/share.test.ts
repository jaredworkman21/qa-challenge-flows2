import { describe, expect, it } from "vitest";
import { sampleLesson } from "../storage";
import { linearToFlow } from "./migrate";
import { fromShareCode, toShareCode } from "./share";

const lesson = linearToFlow(sampleLesson);

describe("share codes", () => {
  it("round-trips a lesson, including which answer leads where", () => {
    const imported = fromShareCode(toShareCode(lesson));
    expect(imported).not.toBeNull();
    expect(imported!.title).toBe(lesson.title);
    expect(imported!.startId).toBe(lesson.startId);
    expect(imported!.nodes).toEqual(lesson.nodes);
    expect(imported!.edges.map((e) => [e.source, e.sourceHandle, e.target])).toEqual(
      lesson.edges.map((e) => [e.source, e.sourceHandle, e.target])
    );
  });

  it.each([
    ["not JSON", "{oops"],
    ["empty object", "{}"],
    ["wrong version", JSON.stringify({ v: 1, nodes: [], edges: [] })],
    ["nodes not an array", JSON.stringify({ v: 2, startId: "a", nodes: {}, edges: [] })],
    ["start screen missing", JSON.stringify({ v: 2, startId: "nope", nodes: [{ id: "a" }], edges: [] })],
    ["null", "null"],
  ])("rejects %s", (_, code) => {
    expect(fromShareCode(code)).toBeNull();
  });

  it("defaults a missing title", () => {
    const code = JSON.stringify({ v: 2, startId: "a", nodes: [{ id: "a" }], edges: [] });
    expect(fromShareCode(code)!.title).toBe("Untitled lesson");
  });
});
