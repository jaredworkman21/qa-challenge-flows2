import { describe, expect, it } from "vitest";
import type { LinearLesson } from "../types";
import { sampleLesson } from "../storage";
import { MIGRATED_END_ID, linearToFlow } from "./migrate";
import { validate } from "./validation";

const summary = (lesson: ReturnType<typeof linearToFlow>) =>
  lesson.edges.map((e) => `${e.source}:${e.sourceHandle}->${e.target}`);

describe("linearToFlow", () => {
  it("connects every screen to the next, including the last pair", () => {
    const flow = linearToFlow({
      title: "T",
      screens: [
        { id: "a", kind: "content", title: "A", body: "" },
        { id: "b", kind: "content", title: "B", body: "" },
        { id: "c", kind: "content", title: "C", body: "" },
      ],
    });
    expect(summary(flow)).toEqual(["a:next->b", "b:next->c"]);
  });

  it("sends every answer of a question to the next screen", () => {
    const flow = linearToFlow({
      title: "T",
      screens: [
        {
          id: "q", kind: "question", title: "Q", body: "",
          choices: [{ id: "c1", text: "1", correct: true }, { id: "c2", text: "2", correct: false }],
        },
        { id: "a", kind: "content", title: "A", body: "" },
      ],
    });
    expect(summary(flow)).toEqual(["q:choice-0->a", "q:choice-1->a"]);
  });

  it("turns the last content screen into an end screen", () => {
    const flow = linearToFlow(sampleLesson);
    const last = flow.nodes[flow.nodes.length - 1];
    expect(last.type).toBe("end");
    expect(last.data).toMatchObject({ kind: "end", title: "You're ready to open" });
  });

  it("adds an end screen when the lesson ends on a question", () => {
    const lesson: LinearLesson = {
      title: "T",
      screens: [{
        id: "q", kind: "question", title: "Q", body: "",
        choices: [{ id: "c1", text: "1", correct: true }, { id: "c2", text: "2", correct: false }],
      }],
    };
    const flow = linearToFlow(lesson);
    expect(flow.nodes.map((n) => n.type)).toEqual(["question", "end"]);
    expect(summary(flow)).toEqual([`q:choice-0->${MIGRATED_END_ID}`, `q:choice-1->${MIGRATED_END_ID}`]);
  });

  it("keeps the original screen order and starts at the first screen", () => {
    const flow = linearToFlow(sampleLesson);
    expect(flow.startId).toBe("s1");
    expect(flow.nodes.map((n) => n.id)).toEqual(sampleLesson.screens.map((s) => s.id));
  });

  it("produces a lesson with no validation issues from the sample", () => {
    expect(validate(linearToFlow(sampleLesson))).toEqual([]);
  });

  it("handles an empty lesson", () => {
    expect(linearToFlow({ title: "Empty", screens: [] })).toEqual({ title: "Empty", startId: "", nodes: [], edges: [] });
  });
});
