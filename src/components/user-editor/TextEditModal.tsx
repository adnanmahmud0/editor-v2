import { useState, useEffect } from "react";
import { useEditor, TextElement } from "./EditorContext";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
} from "lucide-react";

interface TextEditModalProps {
  onClose: () => void;
  editingElement?: TextElement;
}

export function TextEditModal({ onClose, editingElement }: TextEditModalProps) {
  const { addElement, updateElement } = useEditor();
  const [content, setContent] = useState(editingElement?.content || "");
  const [fontSize, setFontSize] = useState(editingElement?.fontSize || 30);
  const [fontFamily, setFontFamily] = useState(
    editingElement?.fontFamily || "PlayfairDisplaySC-Regular",
  );
  const [fontWeight, setFontWeight] = useState(
    editingElement?.fontWeight || "normal",
  );
  const [color, setColor] = useState(editingElement?.color || "#000000");
  const [italic, setItalic] = useState(editingElement?.italic || false);
  const [underline, setUnderline] = useState(
    editingElement?.underline || false,
  );
  const [align, setAlign] = useState<"left" | "center" | "right">(
    editingElement?.align || "left",
  );

  const handleOk = () => {
    if (editingElement) {
      updateElement(editingElement.id, {
        content,
        fontSize,
        fontFamily,
        fontWeight,
        color,
        italic,
        underline,
        align,
      });
    } else {
      const newElement: TextElement = {
        id: Date.now().toString(),
        type: "text",
        content,
        x: 100,
        y: 100,
        fontSize,
        fontFamily,
        fontWeight,
        color,
        italic,
        underline,
        align,
      };
      addElement(newElement);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded"
          >
            <option value="PlayfairDisplaySC-Regular">
              PlayfairDisplaySC-Regular
            </option>
            <option value="Arapey-Regular">Arapey-Regular</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>

          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded"
          >
            <option value="12">12pt</option>
            <option value="14">14pt</option>
            <option value="16">16pt</option>
            <option value="18">18pt</option>
            <option value="24">24pt</option>
            <option value="30">30pt</option>
            <option value="36">36pt</option>
            <option value="48">48pt</option>
          </select>

          <button
            onClick={() =>
              setFontWeight(fontWeight === "bold" ? "normal" : "bold")
            }
            className={`p-2 border border-gray-300 rounded ${fontWeight === "bold" ? "bg-gray-200" : ""}`}
          >
            <Bold className="w-5 h-5" />
          </button>

          <button
            onClick={() => setItalic(!italic)}
            className={`p-2 border border-gray-300 rounded ${italic ? "bg-gray-200" : ""}`}
          >
            <Italic className="w-5 h-5" />
          </button>

          <button
            onClick={() => setUnderline(!underline)}
            className={`p-2 border border-gray-300 rounded ${underline ? "bg-gray-200" : ""}`}
          >
            <Underline className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 border border-gray-300 rounded p-1">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 cursor-pointer"
            />
          </div>

          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => setAlign("left")}
              className={`p-2 ${align === "left" ? "bg-gray-200" : ""}`}
            >
              <AlignLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAlign("center")}
              className={`p-2 ${align === "center" ? "bg-gray-200" : ""}`}
            >
              <AlignCenter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAlign("right")}
              className={`p-2 ${align === "right" ? "bg-gray-200" : ""}`}
            >
              <AlignRight className="w-5 h-5" />
            </button>
          </div>

          <button className="p-2 border border-gray-300 rounded">
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area */}
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 p-4 border border-gray-300 rounded resize-none"
            placeholder="Enter your text here..."
            style={{
              fontSize: fontSize,
              fontFamily: fontFamily,
              fontWeight: fontWeight,
              color: color,
              fontStyle: italic ? "italic" : "normal",
              textDecoration: underline ? "underline" : "none",
              textAlign: align,
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-8 py-2 border-2 border-cyan-500 text-cyan-500 rounded hover:bg-cyan-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleOk}
            className="px-8 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
