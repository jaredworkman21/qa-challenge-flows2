import { describe, expect, it } from "vitest";
import { advance, back, current, score, start } from "./path";

describe("preview path", () => {
  it("starts on the start screen", () => {
    expect(current(start("a"))).toBe("a");
  });

  it("goes back to the screen the learner actually came from", () => {
    // a -> q -> (branch) z: Back from z should return to q, not whatever is before z in the node list
    let path = start("a");
    path = advance(path, "q");
    path = advance(path, "z", true);
    expect(current(back(path))).toBe("q");
  });

  it("does nothing when going back from the start", () => {
    const path = start("a");
    expect(back(path)).toBe(path);
  });

  it("only scores questions on the learner's path", () => {
    let path = start("q1");
    path = advance(path, "end", true);
    expect(score(path)).toEqual({ correct: 1, answered: 1 });
  });

  it("does not double count a question answered again after going back", () => {
    let path = start("q");
    path = advance(path, "x", true);
    path = back(path);
    path = advance(path, "x", true);
    expect(score(path)).toEqual({ correct: 1, answered: 1 });
  });

  it("forgets an answer when the learner goes back past the question", () => {
    let path = start("q");
    path = advance(path, "x", false);
    path = back(path);
    expect(score(path)).toEqual({ correct: 0, answered: 0 });
  });

  it("does not count content screens as questions", () => {
    let path = start("a");
    path = advance(path, "b");
    path = advance(path, "c");
    expect(score(path)).toEqual({ correct: 0, answered: 0 });
  });
});
