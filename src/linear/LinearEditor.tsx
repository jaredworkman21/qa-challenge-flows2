import type { Choice, LinearLesson, LinearScreen } from "../types";

interface Props {
  lesson: LinearLesson;
  onChange: (lesson: LinearLesson) => void;
}

const newId = () => Math.random().toString(36).slice(2, 9);

export default function LinearEditor({ lesson, onChange }: Props) {
  const setScreens = (screens: LinearScreen[]) => onChange({ ...lesson, screens });
  const update = (id: string, patch: Partial<LinearScreen>) =>
    setScreens(lesson.screens.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => setScreens(lesson.screens.filter((s) => s.id !== id));
  const move = (index: number, delta: number) => {
    const next = [...lesson.screens];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setScreens(next);
  };
  const add = (kind: LinearScreen["kind"]) =>
    setScreens([
      ...lesson.screens,
      kind === "question"
        ? { id: newId(), kind, title: "New question", body: "", choices: [{ id: newId(), text: "Answer", correct: true }] }
        : { id: newId(), kind, title: "New screen", body: "" },
    ]);
  const updateChoice = (screen: LinearScreen, choiceId: string, patch: Partial<Choice>) =>
    update(screen.id, { choices: screen.choices?.map((c) => (c.id === choiceId ? { ...c, ...patch } : c)) });

  return (
    <main className="linear">
      {lesson.screens.map((screen, i) => (
        <section className="screen-card" key={screen.id}>
          <div className="screen-head">
            <span className="kind">{i + 1}. {screen.kind === "question" ? "Question" : "Content"}</span>
            <span className="spacer" />
            <button className="btn small" disabled={i === 0} onClick={() => move(i, -1)}>Up</button>
            <button className="btn small" disabled={i === lesson.screens.length - 1} onClick={() => move(i, 1)}>Down</button>
            <button className="btn small danger" onClick={() => remove(screen.id)}>Delete</button>
          </div>
          <label className="field">
            <span>{screen.kind === "question" ? "Question" : "Title"}</span>
            <input value={screen.title} onChange={(e) => update(screen.id, { title: e.target.value })} />
          </label>
          {screen.kind === "content" && (
            <label className="field">
              <span>Body</span>
              <textarea rows={3} value={screen.body} onChange={(e) => update(screen.id, { body: e.target.value })} />
            </label>
          )}
          {screen.kind === "question" && (
            <div className="choices">
              {screen.choices?.map((c) => (
                <div className="choice-row" key={c.id}>
                  <input value={c.text} onChange={(e) => updateChoice(screen, c.id, { text: e.target.value })} />
                  <label className="check">
                    <input type="checkbox" checked={c.correct} onChange={(e) => updateChoice(screen, c.id, { correct: e.target.checked })} />
                    Correct
                  </label>
                </div>
              ))}
              <button
                className="btn small"
                onClick={() => update(screen.id, { choices: [...(screen.choices ?? []), { id: newId(), text: "Answer", correct: false }] })}
              >
                Add answer
              </button>
            </div>
          )}
        </section>
      ))}
      <div className="add-row">
        <button className="btn" onClick={() => add("content")}>Add content screen</button>
        <button className="btn" onClick={() => add("question")}>Add question</button>
      </div>
    </main>
  );
}
