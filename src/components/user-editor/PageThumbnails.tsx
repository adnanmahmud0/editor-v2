import { useEditor } from "./EditorContext";

export function PageThumbnails() {
  const { pages, currentPageIndex, setCurrentPageIndex } = useEditor();

  return (
    <div className="flex justify-center gap-4">
      {pages.map((page, index) => (
        <div key={page.id} className="flex flex-col items-center gap-2">
          <button
            onClick={() => setCurrentPageIndex(index)}
            className={`w-32 h-40 bg-white border-2 rounded shadow-sm hover:shadow-md transition-shadow ${
              currentPageIndex === index ? "border-cyan-500" : "border-gray-300"
            }`}
          >
            <div className="w-full h-full p-2 overflow-hidden">
              {/* Simplified thumbnail preview */}
              <div className="w-full h-full bg-gray-50 border border-gray-200"></div>
            </div>
          </button>
          <span
            className={`text-sm ${currentPageIndex === index ? "text-cyan-500" : "text-gray-600"}`}
          >
            Page {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
