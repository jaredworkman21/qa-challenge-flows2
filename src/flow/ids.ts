export const screenId = () => `screen-${Math.floor(Date.now() / 1000)}`;

export const answerId = () => `ans-${Math.random().toString(36).slice(2, 8)}`;

export const choiceHandle = (index: number) => `choice-${index}`;
