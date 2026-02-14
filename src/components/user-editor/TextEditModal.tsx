"use client";

import { useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, X } from 'lucide-react';
import type { TextElement } from '../user-editor/typs';

interface TextEditModalProps {
  text: TextElement;
  position: { x: number; y: number; width: number; height: number };
  onSave: (text: TextElement) => void;
  onCancel: () => void;
}

export function TextEditModal({ text, position, onSave, onCancel }: TextEditModalProps) {
  const [content, setContent] = useState(text.content);
  const [fontSize, setFontSize] = useState(text.fontSize);
  const [fontFamily, setFontFamily] = useState(text.fontFamily);
  const [color, setColor] = useState(text.color);
  const [bold, setBold] = useState(text.bold);
  const [italic, setItalic] = useState(text.italic);
  const [underline, setUnderline] = useState(text.underline);
  const [align, setAlign] = useState(text.align || 'left');

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
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col w-[800px] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-4 px-6 py-4 border-b bg-gray-50/50 rounded-t-lg">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded bg-white shadow-sm focus:ring-2 focus:ring-cyan-400 outline-none"
          >
            <option value="PlayfairDisplaySC-Regular">PlayfairDisplaySC-Regular</option>
            <option value="Arapey-Regular">Arapey-Regular</option>
            <option value="CrimsonText-SemiBold">CrimsonText-SemiBold</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>

          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded bg-white shadow-sm focus:ring-2 focus:ring-cyan-400 outline-none"
          >
            {[12, 14, 16, 18, 20, 24, 25, 30, 36, 48, 60, 72].map(size => (
              <option key={size} value={size}>{size}pt</option>
            ))}
          </select>

          <div className="flex items-center gap-1 border-x px-4">
            <button
              onClick={() => setBold(!bold)}
              className={`p-2 rounded transition-colors ${bold ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Bold className="w-5 h-5" />
            </button>

            <button
              onClick={() => setItalic(!italic)}
              className={`p-2 rounded transition-colors ${italic ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Italic className="w-5 h-5" />
            </button>

            <button
              onClick={() => setUnderline(!underline)}
              className={`p-2 rounded transition-colors ${underline ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Underline className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1 border-x px-4">
            <button
              onClick={() => setAlign('left')}
              className={`p-2 rounded transition-colors ${align === 'left' ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Align Left"
            >
              <AlignLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAlign('center')}
              className={`p-2 rounded transition-colors ${align === 'center' ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Align Center"
            >
              <AlignCenter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAlign('right')}
              className={`p-2 rounded transition-colors ${align === 'right' ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Align Right"
            >
              <AlignRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAlign('justify')}
              className={`p-2 rounded transition-colors ${align === 'justify' ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Justify"
            >
              <AlignJustify className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 border border-gray-300 rounded cursor-pointer p-1 bg-white"
                title="Text Color"
              />
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded ml-auto transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area */}
        <div className="flex-1 p-8 bg-white min-h-[300px]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-6 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-4 focus:ring-cyan-400/20 focus:border-cyan-400 transition-all"
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              fontWeight: bold ? 'bold' : 'normal',
              fontStyle: italic ? 'italic' : 'normal',
              textDecoration: underline ? 'underline' : 'none',
              color: color,
              textAlign: align,
            }}
            placeholder="Enter your text here..."
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-8 py-6 border-t bg-gray-50/50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-10 py-3 text-gray-500 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-12 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-bold rounded-lg hover:from-cyan-500 hover:to-cyan-600 shadow-lg shadow-cyan-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}