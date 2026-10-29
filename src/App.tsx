import { ReactFlowProvider } from "@xyflow/react";
import FlowEditor from "./flow/FlowEditor";

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}
