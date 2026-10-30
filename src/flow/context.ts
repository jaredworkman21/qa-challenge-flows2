import { createContext, useContext } from "react";

interface FlowMeta {
  startId: string;
  issueIds: Set<string>;
}

export const FlowMetaContext = createContext<FlowMeta>({ startId: "", issueIds: new Set() });

export const useFlowMeta = () => useContext(FlowMetaContext);
