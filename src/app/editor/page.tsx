import { EditorProvider } from "./components/EditorContext";
import { Editor } from "./components/Editor";

export default function page() {
  return (
    <EditorProvider>
      <Editor />
    </EditorProvider>
  );
}
