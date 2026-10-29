import { useState } from "react";
import type { Choice, ScreenData, ScreenNode } from "../types";
import { answerId } from "./ids";

export const MAX_CHOICES = 4;

interface Props {
  node: ScreenNode;
  isStart: boolean;
  onChange: (patch: Partial<ScreenData>) => void;
  onDelete: () => void;
}

export default function NodePanel({ node, isStart, onChange, onDelete }: Props) {
  const [title, setTitle] = useState(node.data.title);
  const [body, setBody] = useState(node.data.body);
  const choices = node.data.choices ?? [];
  const isQuestion = node.data.kind === "question";

  const setChoice = (id: string, patch: Partial<Choice>) =>
    onChange({ choices: choices.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  return (
    <div className="panel-section">
      <div className="panel-head">
        <span className="kind">{isStart ? "Start screen" : `${node.data.kind} screen`}</span>
      </div>
      <label className="field">
        <span>{isQuestion ? "Question" : "Title"}</span>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onChange({ title: e.target.value });
          }}
        />
      </label>
      {!isQuestion && (
        <label className="field">
          <span>Body</span>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              onChange({ body: e.target.value });
            }}
          />
        </label>
      )}
      {isQuestion && (
        <div className="field">
          <span>Answers</span>
          {choices.map((c) => (
            <div className="choice-row" key={c.id}>
              <input value={c.text} onChange={(e) => setChoice(c.id, { text: e.target.value })} aria-label="Answer text" />
              <label className="check">
                <input type="checkbox" checked={c.correct} onChange={(e) => setChoice(c.id, { correct: e.target.checked })} />
                Correct
              </label>
              <button
                className="btn small"
                aria-label="Remove answer"
                disabled={choices.length <= 2}
                onClick={() => onChange({ choices: choices.filter((x) => x.id !== c.id) })}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="btn small"
            disabled={choices.length >= MAX_CHOICES}
            onClick={() => onChange({ choices: [...choices, { id: answerId(), text: `Answer ${choices.length + 1}`, correct: false }] })}
          >
            Add answer
          </button>
          <p className="hint">Drag from the dot next to an answer to choose where it leads too.</p>
        </div>
      )}
      <button
        className="btn danger"
        disabled={isStart}
        title={isStart ? "The start screen can't be deleted" : undefined}
        onClick={onDelete}
      >
        Delete screen
      </button>
    </div>
  );
}
