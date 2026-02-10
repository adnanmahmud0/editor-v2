import { useEditor, Element as EditorElement } from "./EditorContext";
import { CanvasElement } from "./CanvasElement";

export function Canvas() {
  const { getCurrentPage, setSelectedElementId } = useEditor();
  const currentPage = getCurrentPage();

  return (
    <div
      className="bg-white border-2 border-gray-300 aspect-[8.5/11] max-w-3xl mx-auto relative"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedElementId(null);
        }
      }}
    >
      {currentPage.elements.map((element) => (
        <CanvasElement key={element.id} element={element} />
      ))}
    </div>
  );
}
