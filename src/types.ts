export interface Choice {
  id: string;
  text: string;
  correct: boolean;
}

export interface LinearScreen {
  id: string;
  kind: "content" | "question";
  title: string;
  body: string;
  choices?: Choice[];
}

export interface LinearLesson {
  title: string;
  screens: LinearScreen[];
}
