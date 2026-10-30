import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FLOW_KEY, LINEAR_KEY, loadFlow, sampleLesson, saveFlow } from "./storage";
import { linearToFlow } from "./flow/migrate";
import type { FlowLesson, LinearLesson } from "./types";

const flow: FlowLesson = {
  title: "Closing Shift",
  startId: "a",
  nodes: [{ id: "a", type: "end", position: { x: 40, y: 80 }, data: { kind: "end", title: "Lock up", body: "" } }],
  edges: [],
};

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  };
}

describe("storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("migrates the sample lesson when nothing is saved", () => {
    expect(loadFlow()).toEqual(linearToFlow(sampleLesson));
  });

  it("migrates a saved linear lesson on first load", () => {
    const linear: LinearLesson = {
      title: "Old",
      screens: [
        { id: "a", kind: "content", title: "A", body: "" },
        { id: "b", kind: "content", title: "B", body: "" },
      ],
    };
    localStorage.setItem(LINEAR_KEY, JSON.stringify(linear));
    expect(loadFlow()).toEqual(linearToFlow(linear));
  });

  it("round-trips a saved flow lesson, including layout", () => {
    saveFlow(flow);
    expect(loadFlow()).toEqual(flow);
  });

  it("prefers a saved flow lesson over a linear one", () => {
    localStorage.setItem(LINEAR_KEY, JSON.stringify(sampleLesson));
    saveFlow(flow);
    expect(loadFlow()).toEqual(flow);
  });

  it("falls back to migration when the saved flow is not valid JSON", () => {
    localStorage.setItem(FLOW_KEY, "{not json");
    expect(loadFlow()).toEqual(linearToFlow(sampleLesson));
  });

  it("falls back to migration when localStorage throws on read", () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); } });
    expect(loadFlow()).toEqual(linearToFlow(sampleLesson));
  });

  it("does not throw when localStorage throws on write", () => {
    vi.stubGlobal("localStorage", { setItem: () => { throw new Error("quota exceeded"); } });
    expect(() => saveFlow(flow)).not.toThrow();
  });

  it("does not log lesson contents when saving", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    saveFlow(flow);
    expect(log).not.toHaveBeenCalled();
  });
});
