import { useState } from "react";
import type { FlowLesson } from "../types";
import { fromShareCode, toShareCode } from "./share";

interface Props {
  lesson: FlowLesson;
  onImport: (lesson: FlowLesson) => void;
  onClose: () => void;
}

export default function ShareDialog({ lesson, onImport, onClose }: Props) {
  const code = toShareCode(lesson);
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const importCode = () => {
    const next = fromShareCode(pasted);
    if (!next) {
      setError("That code isn't a valid Pathways lesson. Copy the whole code and try again.");
      return;
    }
    onImport(next);
    onClose();
  };

  return (
    <div className="overlay">
      <div className="dialog">
        <div className="player-head">
          <span className="kind">Share code</span>
          <span className="spacer" />
          <button className="btn small" onClick={onClose}>Close</button>
        </div>
        <div className="dialog-body">
          <label className="field">
            <span>This lesson's code</span>
            <textarea rows={6} readOnly value={code} onFocus={(e) => e.target.select()} />
          </label>
          <button className="btn" onClick={copy}>{copied ? "Copied" : "Copy code"}</button>
          <label className="field">
            <span>Paste a code to replace this lesson</span>
            <textarea rows={6} value={pasted} onChange={(e) => { setPasted(e.target.value); setError(""); }} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={!pasted.trim()} onClick={importCode}>Replace lesson</button>
        </div>
      </div>
    </div>
  );
}
