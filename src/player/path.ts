// The learner's path through a preview. Each step records whether the answer given there was correct.
export interface Step {
  id: string;
  correct?: boolean;
}

export const start = (startId: string): Step[] => [{ id: startId }];

export const current = (path: Step[]) => path[path.length - 1].id;

export const advance = (path: Step[], nextId: string, correct?: boolean): Step[] => [
  ...path.slice(0, -1),
  { ...path[path.length - 1], correct },
  { id: nextId },
];

// Going back un-answers the screen you return to, so re-answering doesn't count twice.
export const back = (path: Step[]): Step[] =>
  path.length > 1 ? [...path.slice(0, -2), { id: path[path.length - 2].id }] : path;

export function score(path: Step[]) {
  const answered = path.filter((s) => s.correct !== undefined);
  return { correct: answered.filter((s) => s.correct).length, answered: answered.length };
}
