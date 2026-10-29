import { useState } from "react";
import type { Choice, FlowLesson } from "../types";
import { choiceHandle } from "../flow/ids";

interface Props {
  lesson: FlowLesson;
  onClose: () => void;
}

const FINISHED = "__finished";

export default function FlowPlayer({ lesson, onClose }: Props) {
  const [currentId, setCurrentId] = useState(lesson.startId);
  const [correct, setCorrect] = useState(0);
  const node = lesson.nodes.find((n) => n.id === currentId);
  const order = lesson.nodes.map((n) => n.id);
  const questionCount = lesson.nodes.filter((n) => n.data.kind === "question").length;

  const go = (target?: string) => setCurrentId(target ?? FINISHED);
  const next = () => go(lesson.edges.find((e) => e.source === currentId)?.target);
  const answer = (choice: Choice, index: number) => {
    if (choice.correct) setCorrect((n) => n + 1);
    go(lesson.edges.find((e) => e.source === currentId && e.sourceHandle === choiceHandle(index))?.target);
  };
  const back = () => {
    const i = order.indexOf(currentId);
    if (i > 0) setCurrentId(order[i - 1]);
  };
  const restart = () => {
    setCurrentId(lesson.startId);
    setCorrect(0);
  };

  let content: React.ReactNode;
  if (currentId === FINISHED || node?.data.kind === "end") {
    content = (
      <>
        <h2>{node?.data.title ?? "End of lesson"}</h2>
        {node?.data.body && <p>{node.data.body}</p>}
        {questionCount > 0 && (
          <p className="score">You answered {correct} of {questionCount} questions correctly.</p>
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
          <button className="btn" disabled={currentId === lesson.startId} onClick={back}>Back</button>
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
          <button className="btn" disabled={currentId === lesson.startId} onClick={back}>Back</button>
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
