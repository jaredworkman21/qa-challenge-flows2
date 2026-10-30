import { afterEach, describe, expect, it, vi } from "vitest";
import { screenId } from "./ids";

describe("screenId", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is unique for screens added in the same instant", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-30T12:00:00Z"));
    const ids = new Set(Array.from({ length: 50 }, screenId));
    expect(ids.size).toBe(50);
  });
});
