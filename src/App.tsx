import { useEffect, useState } from "react";
import type { LinearLesson } from "./types";
import { loadLinear, saveLinear } from "./storage";
import LinearEditor from "./linear/LinearEditor";
import LinearPlayer from "./player/LinearPlayer";

export default function App() {
  const [lesson, setLesson] = useState<LinearLesson>(loadLinear);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => saveLinear(lesson), [lesson]);

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Pathways</span>
        <span className="lesson-title">{lesson.title}</span>
        <span className="spacer" />
        <button className="btn primary" onClick={() => setPreviewing(true)}>Preview</button>
      </header>
      <LinearEditor lesson={lesson} onChange={setLesson} />
      {previewing && <LinearPlayer lesson={lesson} onClose={() => setPreviewing(false)} />}
    </div>
  );
}
