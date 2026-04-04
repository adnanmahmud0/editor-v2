"use client";

import { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  X,
  Type,
  ChevronDown,
  Palette,
  Layout,
} from "lucide-react";
import type { TextElement } from "../user-editor/typs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TextEditModalProps {
  text: TextElement;
  position: { x: number; y: number; width: number; height: number };
  onSave: (text: TextElement) => void;
  onCancel: () => void;
}

export function TextEditModal({
  text,
  position,
  onSave,
  onCancel,
}: TextEditModalProps) {
  const [content, setContent] = useState(text.content);
  const [fontSize, setFontSize] = useState(text.fontSize || 16);
  const [fontFamily, setFontFamily] = useState(text.fontFamily);
  const [color, setColor] = useState(text.color);
  const [bold, setBold] = useState(text.bold);
  const [italic, setItalic] = useState(text.italic);
  const [underline, setUnderline] = useState(text.underline);
  const [align, setAlign] = useState(text.align || "left");
  const [lineHeight, setLineHeight] = useState(text.lineHeight || 1.2);

  const presetSizes = [
    6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 28, 30, 32, 34, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96,
  ];
  const fontSizeOptions = presetSizes.includes(fontSize)
    ? presetSizes
    : [...presetSizes, fontSize].sort((a, b) => a - b);

  const handleSave = () => {
    onSave({
      ...text,
      content,
      fontSize,
      fontFamily,
      color,
      bold,
      italic,
      underline,
      align,
      lineHeight,
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="p-0 overflow-hidden max-w-[95vw] sm:max-w-[850px] border-none shadow-2xl rounded-2xl"
      >
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Type className="w-4 h-4 text-blue-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Edit Text
            </DialogTitle>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-gray-50/50 border-b">
          {/* Font Group */}
          <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
            <div className="relative group">
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer min-w-[160px]"
              >
                <option value="'Playfair Display SC', serif">Playfair Display SC</option>
                <option value="'Arapey', serif">Arapey</option>
                <option value="'Crimson Text', serif">Crimson Text</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative group">
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer min-w-[70px]"
              >
                {fontSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Formatting Group */}
          <div className="flex items-center gap-1 px-4 border-r border-gray-200">
            <button
              onClick={() => setBold(!bold)}
              className={`p-2 rounded-lg transition-all ${bold ? "bg-blue-600 text-white shadow-sm" : "hover:bg-white border border-transparent hover:border-gray-200 text-gray-600"}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => setItalic(!italic)}
              className={`p-2 rounded-lg transition-all ${italic ? "bg-blue-600 text-white shadow-sm" : "hover:bg-white border border-transparent hover:border-gray-200 text-gray-600"}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => setUnderline(!underline)}
              className={`p-2 rounded-lg transition-all ${underline ? "bg-blue-600 text-white shadow-sm" : "hover:bg-white border border-transparent hover:border-gray-200 text-gray-600"}`}
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment Group */}
          <div className="flex items-center gap-1 px-4 border-r border-gray-200">
            <button
              onClick={() => setAlign("left")}
              className={`p-2 rounded-lg transition-all ${align === "left" ? "bg-blue-600 text-white shadow-sm" : "hover:bg-white border border-transparent hover:border-gray-200 text-gray-600"}`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAlign("center")}
              className={`p-2 rounded-lg transition-all ${align === "center" ? "bg-blue-600 text-white shadow-sm" : "hover:bg-white border border-transparent hover:border-gray-200 text-gray-600"}`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAlign("right")}
              className={`p-2 rounded-lg transition-all ${align === "right" ? "bg-blue-600 text-white shadow-sm" : "hover:bg-white border border-transparent hover:border-gray-200 text-gray-600"}`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Layout Group */}
          <div className="flex items-center gap-3 px-4">
            <div className="flex items-center gap-2 group">
              <Layout className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <div className="relative">
                <select
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="appearance-none pl-2 pr-6 py-1.5 border border-transparent hover:border-gray-200 rounded-md bg-transparent text-sm font-medium text-gray-600 focus:ring-0 outline-none transition-all cursor-pointer"
                >
                  {[0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.5, 3.0].map((lh) => (
                    <option key={lh} value={lh}>
                      {lh}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 group pl-4 border-l border-gray-200">
              <Palette className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white overflow-hidden p-0.5 hover:border-blue-400 transition-colors shadow-sm">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                  title="Text Color"
                />
                <div 
                  className="w-full h-full rounded-full border border-gray-100 shadow-inner"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Editor Body */}
        <div className="p-8 bg-white min-h-[350px] flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full p-8 rounded-xl border border-gray-100 bg-gray-50/30 resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all text-gray-800 placeholder:text-gray-300"
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              fontWeight: bold ? "bold" : "normal",
              fontStyle: italic ? "italic" : "normal",
              textDecoration: underline ? "underline" : "none",
              color: color,
              textAlign: align,
              lineHeight: lineHeight,
            }}
            placeholder="Type your text here..."
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-gray-50/50 border-t">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-10 py-2.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm font-bold rounded-xl hover:from-blue-600 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
