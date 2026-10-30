import type { FlowLesson, LinearLesson } from "./types";
import { linearToFlow } from "./flow/migrate";

export const LINEAR_KEY = "pathways.lesson.v1";
export const FLOW_KEY = "pathways.lesson.v2";

export const sampleLesson: LinearLesson = {
  title: "Opening Shift",
  screens: [
    { id: "s1", kind: "content", title: "Welcome to your first shift", body: "This lesson walks you through opening the kitchen. It takes about five minutes." },
    { id: "s2", kind: "content", title: "Clock in and wash up", body: "Clock in at the terminal by the office, then wash your hands for at least 20 seconds before touching any food or equipment." },
    {
      id: "s3", kind: "question", title: "The walk-in cooler reads 45°F. What do you do?", body: "",
      choices: [
        { id: "c1", text: "Log the reading and tell the manager on duty", correct: true },
        { id: "c2", text: "Turn the dial colder and move on", correct: false },
        { id: "c3", text: "Ignore it. It's probably the door being open", correct: false },
      ],
    },
    { id: "s4", kind: "content", title: "Stock the line", body: "Fill the line from the walk-in using first in, first out. Older product goes in front." },
    {
      id: "s5", kind: "question", title: "A guest asks whether the fries are gluten free. What do you say?", body: "",
      choices: [
        { id: "c4", text: "Check the allergen binder, then answer", correct: true },
        { id: "c5", text: "Say yes. Potatoes don't have gluten", correct: false },
      ],
    },
    { id: "s6", kind: "content", title: "You're ready to open", body: "Nice work. Find your shift lead to get your station assignment." },
  ],
};

export function loadLinear(): LinearLesson {
  try {
    const raw = localStorage.getItem(LINEAR_KEY);
    if (raw) return JSON.parse(raw) as LinearLesson;
  } catch {
    // fall through to the sample
  }
  return sampleLesson;
}

export function loadFlow(): FlowLesson {
  try {
    const raw = localStorage.getItem(FLOW_KEY);
    if (raw) return JSON.parse(raw) as FlowLesson;
  } catch {
    // fall through to migration
  }
  return linearToFlow(loadLinear());
}

export function saveFlow(lesson: FlowLesson) {
  try {
    localStorage.setItem(FLOW_KEY, JSON.stringify(lesson));
  } catch {
    // storage unavailable
  }
}
