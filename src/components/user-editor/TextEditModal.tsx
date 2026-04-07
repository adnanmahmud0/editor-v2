"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Move,
  Search,
  Check,
  Sparkles,
} from "lucide-react";
import type { TextElement } from "../user-editor/typs";
import { useDraggable } from "@/hooks/use-draggable";

const GOOGLE_FONTS_LIB = [
  // Sans-Serif (Modern)
  { name: "Inter", category: "sans" },
  { name: "Roboto", category: "sans" },
  { name: "Montserrat", category: "sans" },
  { name: "Poppins", category: "sans" },
  { name: "Open Sans", category: "sans" },
  { name: "Lato", category: "sans" },
  { name: "Raleway", category: "sans" },
  { name: "Nunito", category: "sans" },
  { name: "Ubuntu", category: "sans" },
  
  // Serif (Classic)
  { name: "Playfair Display", category: "serif" },
  { name: "Merriweather", category: "serif" },
  { name: "Lora", category: "serif" },
  { name: "Libre Baskerville", category: "serif" },
  { name: "PT Serif", category: "serif" },
  { name: "EB Garamond", category: "serif" },
  
  // Script / Handwriting (Elegant)
  { name: "Pacifico", category: "script" },
  { name: "Dancing Script", category: "script" },
  { name: "Great Vibes", category: "script" },
  { name: "Sacramento", category: "script" },
  { name: "Satisfy", category: "script" },
  { name: "Caveat", category: "script" },
  { name: "Shadows Into Light", category: "script" },
  { name: "Kaushan Script", category: "script" },
  { name: "Yellowtail", category: "script" },
  { name: "Courgette", category: "script" },

  // Display (Bold / Funky)
  { name: "Oswald", category: "display" },
  { name: "Lobster", category: "display" },
  { name: "Righteous", category: "display" },
  { name: "Abril Fatface", category: "display" },
  { name: "Bangers", category: "display" },
  { name: "Alfa Slab One", category: "display" },
  { name: "Special Elite", category: "display" },
  { name: "Monoton", category: "display" },
];

interface TextEditModalProps {
  text: TextElement;
  position: { x: number; y: number; width: number; height: number };
  onUpdate: (text: TextElement) => void;
  onSave: (text: TextElement) => void;
  onCancel: () => void;
}

export function TextEditModal({
  text,
  position: basePosition,
  onUpdate,
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
  const [lineHeight, setLineHeight] = useState(text.lineHeight || 1.16);
  const [charSpacing, setCharSpacing] = useState((text as any).charSpacing || 0);
  const [fontSearch, setFontSearch] = useState("");
  const [fontFilter, setFontFilter] = useState("all");
  const [isLoadingFont, setIsLoadingFont] = useState(false);

  const lastSentValues = useRef<any>(null);

  // Center the modal on the screen initially
  const initialX = typeof window !== 'undefined' ? (window.innerWidth - 900) / 2 : 50;
  const initialY = typeof window !== 'undefined' ? (window.innerHeight - 650) / 2 : 100;

  const { position: modalPos, onMouseDown: handleMouseDown } = useDraggable(initialX, initialY);

  const loadGoogleFont = useCallback(async (family: string) => {
    setIsLoadingFont(true);
    const linkId = `google-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap`;
      document.head.appendChild(link);
    }

    try {
        // Wait for the font to be fully ready in the browser
        await (document as any).fonts.load(`1em "${family}"`);
        await (document as any).fonts.ready;
    } catch (e) {
        console.error("Font failed to load", e);
    } finally {
        setIsLoadingFont(false);
    }
  }, []);

  useEffect(() => {
    if (fontFamily) loadGoogleFont(fontFamily);
  }, []); // Only on mount for initial font

  const handleFontChange = async (font: string) => {
    await loadGoogleFont(font);
    setFontFamily(font);
  };

  const triggerUpdate = useCallback(() => {
    const currentValues = {
      content,
      fontSize,
      fontFamily,
      color,
      bold,
      italic,
      underline,
      align,
      lineHeight,
      charSpacing,
    };

    if (lastSentValues.current && 
        JSON.stringify(lastSentValues.current) === JSON.stringify(currentValues)) {
      return;
    }

    lastSentValues.current = currentValues;
    onUpdate({ ...text, ...currentValues });
  }, [onUpdate, text, content, fontSize, fontFamily, color, bold, italic, underline, align, lineHeight]);

  useEffect(() => {
    triggerUpdate();
  }, [triggerUpdate]);

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
      charSpacing,
    });
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const filteredFonts = GOOGLE_FONTS_LIB.filter(f => 
    (fontFilter === 'all' || f.category === fontFilter) && 
    f.name.toLowerCase().includes(fontSearch.toLowerCase())
  );

  return (
    <div 
      className="fixed bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-200 flex flex-col w-[900px] max-h-[92vh] overflow-hidden z-[1000]"
      style={{
        left: `${modalPos.x}px`,
        top: `${modalPos.y}px`,
        transform: 'none',
        transition: 'none', // Ensure NO transitions during drag
      }}
    >
      {/* Header */}
      <div 
        className="px-8 py-5 flex items-center justify-between bg-slate-50 border-b border-slate-100 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <Type className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Master Typography</h3>
            <p className="text-[10px] text-slate-400 font-medium">Design your message with precision</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all duration-200 hover:rotate-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden h-[500px]">
        {/* Left Sidebar: Font Library */}
        <div className="w-[320px] bg-white border-r border-slate-100 flex flex-col p-6 gap-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Font Library</h4>
            
            <div className="relative group">
              <input
                type="text"
                placeholder="Search premium fonts..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-300"
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
              {["all", "sans", "serif", "script", "display"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFontFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tighter transition-all duration-300 ${
                    fontFilter === cat 
                    ? "bg-slate-800 text-white shadow-md shadow-slate-200" 
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredFonts.map(font => (
              <button
                key={font.name}
                onClick={() => handleFontChange(font.name)}
                className={`w-full group relative px-4 py-3 rounded-2xl border text-left transition-all duration-300 ${
                  fontFamily === font.name 
                  ? "bg-slate-50 border-blue-500 ring-4 ring-blue-50 text-blue-600" 
                  : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: font.name }} className="text-sm truncate pr-4">{font.name}</span>
                  {fontFamily === font.name && <Check className="w-3 h-3 text-blue-500" />}
                </div>
                <div className="text-[8px] text-slate-300 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {font.category} • Preloaded
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content: Main Editor */}
        <div className="flex-1 flex flex-col bg-slate-50/30 p-8 gap-8 overflow-y-auto">
          {/* Controls Bar */}
          <div className="grid grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Character Styling</h4>
               <div className="flex flex-wrap gap-2">
                  <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {[
                      { icon: Bold, active: bold, toggle: () => setBold(!bold) },
                      { icon: Italic, active: italic, toggle: () => setItalic(!italic) },
                      { icon: Underline, active: underline, toggle: () => setUnderline(!underline) }
                    ].map((btn, i) => (
                      <button
                        key={i}
                        onClick={btn.toggle}
                        className={`p-3 rounded-xl transition-all duration-300 ${btn.active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                      >
                        <btn.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {[
                      { icon: AlignLeft, key: "left" },
                      { icon: AlignCenter, key: "center" },
                      { icon: AlignRight, key: "right" }
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setAlign(btn.key as any)}
                        className={`p-3 rounded-xl transition-all duration-300 ${align === btn.key ? "bg-slate-800 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                      >
                        <btn.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Font Size</h4>
                  <div className="relative">
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full pl-4 pr-10 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">PT</span>
                  </div>
               </div>
               <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Color</h4>
                  <div className="relative group">
                    <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-3 py-2.5">
                      <div 
                        className="w-6 h-6 rounded-lg shadow-inner border border-slate-100" 
                        style={{ backgroundColor: color }}
                      />
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-400">{color.toUpperCase()}</span>
                    </div>
                  </div>
               </div>

               {/* Add Spacing Controls */}
               <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Line Space</h4>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(Number(e.target.value))}
                      className="w-full pl-4 pr-10 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">LH</span>
                  </div>
               </div>
               <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Letter Space</h4>
                  <div className="relative">
                    <input
                      type="number"
                      value={charSpacing}
                      onChange={(e) => setCharSpacing(Number(e.target.value))}
                      className="w-full pl-4 pr-10 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">LS</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Canvas Preview Area */}
          <div className="flex-1 flex flex-col space-y-3">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content Editor</h4>
                <div className="flex items-center gap-1.5 ">
                    {isLoadingFont ? (
                         <div className="flex items-center gap-2 animate-pulse text-amber-500">
                            <Type className="w-3 h-3 animate-spin" />
                            <span className="text-[9px] font-bold uppercase tracking-tighter">Preparing Typography...</span>
                         </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-blue-500">
                            <Sparkles className="w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase tracking-tighter">Live Preview Mode</span>
                        </div>
                    )}
                </div>
             </div>
             <div className={`flex-1 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-50 overflow-hidden relative group transition-opacity duration-300 ${isLoadingFont ? 'opacity-40' : 'opacity-100'}`}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full p-10 focus:outline-none resize-none bg-transparent relative z-10 transition-all duration-300"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: bold ? "bold" : "normal",
                    fontStyle: italic ? "italic" : "normal",
                    textDecoration: underline ? "underline" : "none",
                    color: color,
                    textAlign: align as any,
                    lineHeight: lineHeight,
                    letterSpacing: `${charSpacing / 10}px`,
                  }}
                  autoFocus
                />
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
             </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autosaving Changes...</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            className="px-10 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[11px] font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-200 transition-all duration-300 transform hover:-translate-y-1 uppercase tracking-widest"
          >
            Save Design
          </button>
        </div>
      </div>
    </div>
  );
}
