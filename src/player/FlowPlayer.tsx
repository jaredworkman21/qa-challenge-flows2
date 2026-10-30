import { useState } from "react";
import type { Choice, FlowLesson } from "../types";
import { choiceHandle } from "../flow/ids";
import * as Path from "./path";

interface Props {
  lesson: FlowLesson;
  onClose: () => void;
}

const FINISHED = "__finished";

export default function FlowPlayer({ lesson, onClose }: Props) {
  const [path, setPath] = useState(() => Path.start(lesson.startId));
  const currentId = Path.current(path);
  const node = lesson.nodes.find((n) => n.id === currentId);
  const { correct, answered } = Path.score(path);
  const canGoBack = path.length > 1;

  const go = (target?: string, wasCorrect?: boolean) =>
    setPath((p) => Path.advance(p, target ?? FINISHED, wasCorrect));
  const next = () => go(lesson.edges.find((e) => e.source === currentId)?.target);
  const answer = (choice: Choice, index: number) =>
    go(lesson.edges.find((e) => e.source === currentId && e.sourceHandle === choiceHandle(index))?.target, choice.correct);
  const back = () => setPath(Path.back);
  const restart = () => setPath(Path.start(lesson.startId));

  let content: React.ReactNode;
  if (currentId === FINISHED || node?.data.kind === "end") {
    content = (
      <>
        <h2>{node?.data.title ?? "End of lesson"}</h2>
        {node?.data.body && <p>{node.data.body}</p>}
        {answered > 0 && (
          <p className="score">You answered {correct} of {answered} questions correctly.</p>
        )}
        <div className="player-nav">
          <span />
          <button className="btn primary" onClick={restart}>Restart</button>
        </div>
      </>
    );
  } else if (!node) {
    content = (
      <>
        <h2>Screen not found</h2>
        <p>This lesson has a broken connection.</p>
        <div className="player-nav">
          <span />
          <button className="btn" onClick={restart}>Restart</button>
        </div>
      </>
    );
  } else if (node.data.kind === "question") {
    content = (
      <>
        <h2>{node.data.title}</h2>
        <div className="answers">
          {node.data.choices?.map((c, i) => (
            <button key={c.id} className="btn answer" onClick={() => answer(c, i)}>
              {c.text}
            </button>
          ))}
        </div>
        <div className="player-nav">
          <button className="btn" disabled={!canGoBack} onClick={back}>Back</button>
          <span />
        </div>
      </>
    );
  } else {
    content = (
      <>
        <h2>{node.data.title}</h2>
        <p>{node.data.body}</p>
        <div className="player-nav">
          <button className="btn" disabled={!canGoBack} onClick={back}>Back</button>
          <button className="btn primary" onClick={next}>Continue</button>
        </div>
      </>
    );
  }

  return (
    <div className="overlay">
      <div className="player">
        <div className="player-head">
          <span className="kind">Preview · {lesson.title}</span>
          <span className="spacer" />
          <button className="btn small" onClick={onClose}>Close preview</button>
        </div>
        <div className="player-body">{content}</div>
      </div>
    </div>
  );
}
