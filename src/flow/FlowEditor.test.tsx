// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import type { FlowEdge, FlowLesson, ScreenNode } from "../types";
import { FLOW_KEY } from "../storage";
import { toShareCode } from "./share";
import FlowEditor from "./FlowEditor";
import NodePanel, { MAX_CHOICES } from "./NodePanel";

// React Flow measures the canvas, which jsdom doesn't support.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.DOMMatrixReadOnly ??= class {
    m22 = 1;
    constructor() {}
  } as unknown as typeof DOMMatrixReadOnly;
});

const content = (id: string, title: string): ScreenNode => ({
  id, type: "content", position: { x: 0, y: 0 }, data: { kind: "content", title, body: "" },
});
const end = (id: string, title = "Done"): ScreenNode => ({
  id, type: "end", position: { x: 0, y: 0 }, data: { kind: "end", title, body: "" },
});
const question = (id: string, answers: number): ScreenNode => ({
  id, type: "question", position: { x: 0, y: 0 },
  data: {
    kind: "question", title: "Pick one", body: "",
    choices: Array.from({ length: answers }, (_, i) => ({ id: `${id}-a${i}`, text: `Answer ${i + 1}`, correct: i === 0 })),
  },
});
const edge = (source: string, target: string, sourceHandle = "next"): FlowEdge => ({
  id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle,
});

function renderEditor(lesson: FlowLesson) {
  localStorage.setItem(FLOW_KEY, JSON.stringify(lesson));
  return render(
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}

const saved = (): FlowLesson => JSON.parse(localStorage.getItem(FLOW_KEY)!);
const edgeSummary = (edges: FlowEdge[]) => edges.map((e) => `${e.source}:${e.sourceHandle}->${e.target}`).sort();
const issuesPanel = () => screen.getByText("Issues").closest(".panel-section") as HTMLElement;
// Issues list each screen's title, so clicking one is a canvas-free way to select a screen.
const selectViaIssue = (title: string) => fireEvent.click(within(issuesPanel()).getAllByText(title)[0]);
const titleInput = () => screen.getByLabelText(/^(Title|Question)$/) as HTMLInputElement;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("FlowEditor side panel", () => {
  // Two unreachable content screens, so both appear in the Issues list.
  const twoScreens: FlowLesson = {
    title: "Lesson",
    startId: "start",
    nodes: [content("start", "Start"), content("a", "Screen A"), content("b", "Screen B")],
    edges: [],
  };

  it("shows the newly selected screen's title after switching screens", () => {
    renderEditor(twoScreens);
    selectViaIssue("Screen A");
    expect(titleInput().value).toBe("Screen A");

    selectViaIssue("Screen B");
    expect(titleInput().value).toBe("Screen B");
  });

  it("edits the selected screen, not the one selected before it", () => {
    renderEditor(twoScreens);
    selectViaIssue("Screen A");
    selectViaIssue("Screen B");
    // Type onto whatever the input shows, like a user would. A stale panel would write "Screen A!" onto B.
    fireEvent.change(titleInput(), { target: { value: `${titleInput().value}!` } });

    const titles = Object.fromEntries(saved().nodes.map((n) => [n.id, n.data.title]));
    expect(titles).toEqual({ start: "Start", a: "Screen A", b: "Screen B!" });
  });
});

describe("FlowEditor answers", () => {
  it("lets a question have up to 6 answers", () => {
    expect(MAX_CHOICES).toBe(6);
    renderEditor({ title: "Lesson", startId: "start", nodes: [content("start", "Start")], edges: [] });
    fireEvent.click(screen.getByRole("button", { name: "Add question" }));

    const add = screen.getByRole("button", { name: "Add answer" });
    for (let i = 2; i < 6; i++) {
      expect(add).toBeEnabledButton();
      fireEvent.click(add);
    }
    expect(screen.getAllByLabelText("Answer text")).toHaveLength(6);
    expect(add).toBeDisabledButton();
  });

  it("keeps later answers pointing at the same screens when an answer is removed", () => {
    // Answer 4 is left unconnected so the question shows up in Issues and can be selected there.
    renderEditor({
      title: "Lesson",
      startId: "q",
      nodes: [question("q", 4), end("x", "X"), end("y", "Y"), end("z", "Z")],
      edges: [edge("q", "x", "choice-0"), edge("q", "y", "choice-1"), edge("q", "z", "choice-2")],
    });
    selectViaIssue("Pick one");

    fireEvent.click(screen.getAllByRole("button", { name: "Remove answer" })[1]);

    const q = saved().nodes.find((n) => n.id === "q")!;
    expect(q.data.choices!.map((c) => c.text)).toEqual(["Answer 1", "Answer 3", "Answer 4"]);
    expect(edgeSummary(saved().edges)).toEqual(["q:choice-0->x", "q:choice-1->z"]);
  });
});

describe("FlowEditor deleting screens", () => {
  it("removes the deleted screen's connections", () => {
    renderEditor({
      title: "Lesson",
      startId: "start",
      nodes: [content("start", "Start"), content("mid", "Middle"), end("x", "X"), content("orphan", "Orphan")],
      edges: [edge("start", "mid"), edge("mid", "x"), edge("orphan", "mid")],
    });
    selectViaIssue("Orphan");
    fireEvent.click(screen.getByRole("button", { name: "Delete screen" }));

    expect(saved().nodes.map((n) => n.id)).toEqual(["start", "mid", "x"]);
    expect(edgeSummary(saved().edges)).toEqual(["mid:next->x", "start:next->mid"]);
  });
});

describe("FlowEditor autosave", () => {
  it("saves a screen's new position after it is moved", async () => {
    const { container } = renderEditor({
      title: "Lesson",
      startId: "start",
      nodes: [content("start", "Start"), end("x", "X")],
      edges: [edge("start", "x")],
    });
    const node = container.querySelector('[data-id="x"]') as HTMLElement;
    expect(node).not.toBeNull();

    // React Flow drags with d3-drag, which reads `event.view`. jsdom under Vitest rejects `view`
    // in the MouseEvent constructor, so it's attached after the event is created.
    const mouse = (target: EventTarget, type: string, x: number, y: number) =>
      act(() => {
        const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1 });
        Object.defineProperty(event, "view", { value: window });
        target.dispatchEvent(event);
      });
    mouse(node, "mousedown", 0, 0);
    mouse(document.defaultView!, "mousemove", 75, 45);
    mouse(document.defaultView!, "mousemove", 150, 90);
    mouse(document.defaultView!, "mouseup", 150, 90);
    // d3-drag swallows the next click until a zero-delay timer fires; let it fire so later tests can click.
    await new Promise((r) => setTimeout(r, 0));

    const moved = saved().nodes.find((n) => n.id === "x")!;
    expect(moved.position).not.toEqual({ x: 0, y: 0 });
  });
});

describe("FlowEditor share code import", () => {
  it("shows the imported lesson's title", () => {
    renderEditor({ title: "Original", startId: "start", nodes: [content("start", "Start")], edges: [] });
    const imported: FlowLesson = { title: "Imported lesson", startId: "s", nodes: [end("s")], edges: [] };

    fireEvent.click(screen.getByRole("button", { name: "Share code" }));
    fireEvent.change(screen.getByLabelText("Paste a code to replace this lesson"), {
      target: { value: toShareCode(imported) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Replace lesson" }));

    expect(document.querySelector(".lesson-title")!.textContent).toBe("Imported lesson");
    expect(saved().title).toBe("Imported lesson");
  });
});

describe("NodePanel", () => {
  it("disables Add answer only at the maximum", () => {
    const noop = () => {};
    const { rerender } = render(
      <NodePanel node={question("q", MAX_CHOICES - 1)} isStart={false} onChange={noop} onRemoveChoice={noop} onDelete={noop} />
    );
    expect(screen.getByRole("button", { name: "Add answer" })).toBeEnabledButton();

    rerender(
      <NodePanel node={question("q", MAX_CHOICES)} isStart={false} onChange={noop} onRemoveChoice={noop} onDelete={noop} />
    );
    expect(screen.getByRole("button", { name: "Add answer" })).toBeDisabledButton();
  });
});

expect.extend({
  toBeEnabledButton: (el: HTMLButtonElement) => ({ pass: !el.disabled, message: () => "expected button to be enabled" }),
  toBeDisabledButton: (el: HTMLButtonElement) => ({ pass: el.disabled, message: () => "expected button to be disabled" }),
});

declare module "vitest" {
  interface Assertion {
    toBeEnabledButton(): void;
    toBeDisabledButton(): void;
  }
}
