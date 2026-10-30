export const screenId = () => `screen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const answerId = () => `ans-${Math.random().toString(36).slice(2, 8)}`;

export const choiceHandle = (index: number) => `choice-${index}`;
