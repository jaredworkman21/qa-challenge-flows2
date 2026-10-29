import { useState } from "react";
import type { LinearLesson } from "../types";

interface Props {
  lesson: LinearLesson;
  onClose: () => void;
}

export default function LinearPlayer({ lesson, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const screen = lesson.screens[index];
  const questions = lesson.screens.filter((s) => s.kind === "question").length;
  const done = index >= lesson.screens.length;

  return (
    <div className="overlay">
      <div className="player">
        <div className="player-head">
          <span className="kind">Preview</span>
          <span className="spacer" />
          <button className="btn small" onClick={onClose}>Close preview</button>
        </div>
        {done ? (
          <div className="player-body">
            <h2>Lesson complete</h2>
            <p>You answered {correct} of {questions} questions correctly.</p>
            <button className="btn primary" onClick={() => { setIndex(0); setCorrect(0); }}>Restart</button>
          </div>
        ) : (
          <div className="player-body">
            <p className="kind">Screen {index + 1} of {lesson.screens.length}</p>
            <h2>{screen.title}</h2>
            {screen.kind === "content" && <p>{screen.body}</p>}
            {screen.kind === "question" ? (
              <div className="answers">
                {screen.choices?.map((c) => (
                  <button
                    key={c.id}
                    className="btn answer"
                    onClick={() => { if (c.correct) setCorrect((n) => n + 1); setIndex(index + 1); }}
                  >
                    {c.text}
                  </button>
                ))}
              </div>
            ) : (
              <div className="player-nav">
                <button className="btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>Back</button>
                <button className="btn primary" onClick={() => setIndex(index + 1)}>Continue</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
