import { useState } from "react";
import {
  useEditor,
  Element as EditorElement,
  TextElement,
  ImageElement,
} from "./EditorContext";
import { Pencil, RotateCw, Trash2 } from "lucide-react";
import { TextEditModal } from "./TextEditModal";

interface CanvasElementProps {
  element: EditorElement;
}

export function CanvasElement({ element }: CanvasElementProps) {
  const {
    selectedElementId,
    setSelectedElementId,
    deleteElement,
    updateElement,
  } = useEditor();
  const [showEditModal, setShowEditModal] = useState(false);
  const isSelected = selectedElementId === element.id;

  const handleRotate = () => {
    if (element.type === "image") {
      const rotation = ((element as ImageElement).rotation + 90) % 360;
      updateElement(element.id, { rotation });
    }
  };

  const handleDelete = () => {
    deleteElement(element.id);
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  if (element.type === "text") {
    const textElement = element as TextElement;
    return (
      <>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedElementId(element.id);
          }}
          className={`absolute cursor-pointer ${isSelected ? "border-2 border-dashed border-gray-800" : ""}`}
          style={{
            left: textElement.x,
            top: textElement.y,
            fontSize: textElement.fontSize,
            fontFamily: textElement.fontFamily,
            fontWeight: textElement.fontWeight,
            color: textElement.color,
            fontStyle: textElement.italic ? "italic" : "normal",
            textDecoration: textElement.underline ? "underline" : "none",
            textAlign: textElement.align,
            whiteSpace: "pre-wrap",
            padding: "8px",
          }}
        >
          {textElement.content}

          {isSelected && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2 bg-white border border-gray-300 rounded shadow-lg p-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded"
              >
                <Pencil className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          )}
        </div>

        {showEditModal && (
          <TextEditModal
            onClose={() => setShowEditModal(false)}
            editingElement={textElement}
          />
        )}
      </>
    );
  }

  if (element.type === "image") {
    const imageElement = element as ImageElement;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElementId(element.id);
        }}
        className={`absolute cursor-pointer ${isSelected ? "border-2 border-dashed border-gray-800" : ""}`}
        style={{
          left: imageElement.x,
          top: imageElement.y,
          width: imageElement.width,
          height: imageElement.height,
          transform: `rotate(${imageElement.rotation}deg)`,
        }}
      >
        <img
          src={imageElement.src}
          alt=""
          className="w-full h-full object-cover"
        />

        {isSelected && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2 bg-white border border-gray-300 rounded shadow-lg p-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-sm">Edit</span>
            </button>
            <button
              onClick={handleRotate}
              className="flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-sm">Rotate</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
