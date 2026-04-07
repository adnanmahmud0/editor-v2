"use client";

import React, { useState, useEffect } from "react";
import * as fabric from "fabric";
import { 
  Plus, 
  Minus as MinusIcon, 
  Bold, 
  Italic, 
  Underline, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Search,
} from "lucide-react";

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
  { name: "Work Sans", category: "sans" },
  { name: "Quicksand", category: "sans" },
  { name: "Mulish", category: "sans" },
  { name: "Kanit", category: "sans" },
  { name: "Manrope", category: "sans" },
  { name: "Outfit", category: "sans" },
  { name: "Urbanist", category: "sans" },
  { name: "Lexend", category: "sans" },
  
  // Serif (Classic)
  { name: "Playfair Display", category: "serif" },
  { name: "Merriweather", category: "serif" },
  { name: "Lora", category: "serif" },
  { name: "Libre Baskerville", category: "serif" },
  { name: "PT Serif", category: "serif" },
  { name: "EB Garamond", category: "serif" },
  { name: "Crimson Text", category: "serif" },
  { name: "Arvo", category: "serif" },
  { name: "Zilla Slab", category: "serif" },
  { name: "Bree Serif", category: "serif" },
  { name: "DM Serif Display", category: "serif" },
  { name: "Old Standard TT", category: "serif" },
  { name: "Cardo", category: "serif" },
  { name: "Domine", category: "serif" },
  
  // Script / Handwriting (Elegant)
  { name: "Pacifico", category: "script" },
  { name: "Dancing Script", category: "script" },
  { name: "Great Vibes", category: "script" },
  { name: "Sacramento", category: "script" },
  { name: "Satisfy", category: "script" },
  { name: "Pacifico", category: "script" },
  { name: "Caveat", category: "script" },
  { name: "Shadows Into Light", category: "script" },
  { name: "Indie Flower", category: "script" },
  { name: "Amatic SC", category: "script" },
  { name: "Architects Daughter", category: "script" },
  { name: "Kaushan Script", category: "script" },
  { name: "Yellowtail", category: "script" },
  { name: "Courgette", category: "script" },
  { name: "Allura", category: "script" },
  { name: "Alex Brush", category: "script" },
  { name: "Pinyon Script", category: "script" },
  { name: "Mrs Saint Delafield", category: "script" },
  { name: "Homemade Apple", category: "script" },
  { name: "La Belle Aurore", category: "script" },
  { name: "Bad Script", category: "script" },
  { name: "Homemade Apple", category: "script" },

  // Display (Bold / Funky)
  { name: "Oswald", category: "display" },
  { name: "Lobster", category: "display" },
  { name: "Righteous", category: "display" },
  { name: "Abril Fatface", category: "display" },
  { name: "Bangers", category: "display" },
  { name: "Alfa Slab One", category: "display" },
  { name: "Special Elite", category: "display" },
  { name: "FrederickatheGreat", category: "display" },
  { name: "UnifrakturMaguntia", category: "display" },
  { name: "Syncopate", category: "display" },
  { name: "Press Start 2P", category: "display" },
  { name: "Modak", category: "display" },
  { name: "Monoton", category: "display" },
  { name: "Codystar", category: "display" },
  { name: "Megrim", category: "display" },
  { name: "Ewert", category: "display" },
  
  // Monospace (Coding)
  { name: "Fira Code", category: "mono" },
  { name: "Source Code Pro", category: "mono" },
  { name: "Courier Prime", category: "mono" },
  { name: "JetBrains Mono", category: "mono" },
  { name: "Roboto Mono", category: "mono" },
  { name: "Inconsolata", category: "mono" },
  { name: "Space Mono", category: "mono" },
];

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null;
}

export function PropertiesPanel({ canvas }: PropertiesPanelProps) {
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [props, setProps] = useState({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 0,
    opacity: 100,
    text: "",
    fontSize: 20,
    textAlign: "left",
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    underline: false,
    linethrough: false,
    lineHeight: 1.16,
    charSpacing: 0,
    shadowBlur: 0,
    shadowColor: "rgba(0,0,0,0.3)",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    projectTitle: "Untitled Template",
    projectCategory: "Invitation",
  });

  useEffect(() => {
    if (!canvas) return;

    const updateProps = () => {
      const activeObj = canvas.getActiveObject();
      setSelectedObject(activeObj || null);

      if (activeObj) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeObjAny = activeObj as any;
        setProps(prev => ({
          ...prev,
          width: Math.round(activeObj.width! * activeObj.scaleX!),
          height: Math.round(activeObj.height! * activeObj.scaleY!),
          left: Math.round(activeObj.left!),
          top: Math.round(activeObj.top!),
          fill: (activeObj.fill as string) || "#ffffff",
          stroke: (activeObj.stroke as string) || "#000000",
          strokeWidth: activeObj.strokeWidth || 0,
          opacity: (activeObj.opacity || 1) * 100,
          text: activeObjAny.text || "",
          fontSize: activeObjAny.fontSize || 20,
          textAlign: activeObjAny.textAlign || "left",
          fontFamily: activeObjAny.fontFamily || "Arial",
          fontWeight: activeObjAny.fontWeight || "normal",
          fontStyle: activeObjAny.fontStyle || "normal",
          underline: activeObjAny.underline || false,
          linethrough: activeObjAny.linethrough || false,
          lineHeight: activeObjAny.lineHeight || 1.16,
          charSpacing: activeObjAny.charSpacing || 0,
          shadowBlur: activeObjAny.shadow?.blur || 0,
          shadowColor: activeObjAny.shadow?.color || "rgba(0,0,0,0.3)",
          shadowOffsetX: activeObjAny.shadow?.offsetX || 0,
          shadowOffsetY: activeObjAny.shadow?.offsetY || 0,
        }));
      }
    };

    canvas.on("selection:created", updateProps);
    canvas.on("selection:updated", updateProps);
    canvas.on("selection:cleared", updateProps);
    canvas.on("object:modified", updateProps);

    return () => {
      canvas.off("selection:created", updateProps);
      canvas.off("selection:updated", updateProps);
      canvas.off("selection:cleared", updateProps);
      canvas.off("object:modified", updateProps);
    };
  }, [canvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateProperty = (key: string, value: any) => {
    if (key.startsWith("project")) {
        setProps(prev => ({ ...prev, [key]: value }));
        return;
    }

    if (!selectedObject || !canvas) return;

    let finalValue = value;
    if (key === "width") {
      if (selectedObject.type === "textbox") {
        finalValue = value;
        selectedObject.set("scaleX", 1);
      } else {
        selectedObject.set("scaleX", value / selectedObject.width!);
        finalValue = undefined;
      }
    } else if (key === "height") {
      if (selectedObject.type === "textbox") {
        finalValue = value;
        selectedObject.set("scaleY", 1);
      } else {
        selectedObject.set("scaleY", value / selectedObject.height!);
        finalValue = undefined;
      }
    } else if (key === "opacity") {
      finalValue = value / 100;
    } else if (key.startsWith("shadow")) {
      const s = (selectedObject.shadow as fabric.Shadow) || new fabric.Shadow({ color: "rgba(0,0,0,0.3)", blur: 0, offsetX: 0, offsetY: 0 });
      if (key === "shadowBlur") s.blur = value;
      if (key === "shadowColor") s.color = value;
      if (key === "shadowOffsetX") s.offsetX = value;
      if (key === "shadowOffsetY") s.offsetY = value;
      selectedObject.set("shadow", s);
      finalValue = undefined;
    }

    if (finalValue !== undefined) {
      selectedObject.set(key as any, finalValue);
    }
    
    canvas.requestRenderAll();
    setProps((prev) => ({ ...prev, [key]: value }));
  };

  const [fontSearch, setFontSearch] = useState("");
  const [fontFilter, setFontFilter] = useState("all");
  const [isLoadingFont, setIsLoadingFont] = useState(false);
  
  const loadGoogleFont = async (fontFamily: string) => {
    setIsLoadingFont(true);
    const linkId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      // Load all common weights + Italics
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap`;
      document.head.appendChild(link);
    }

    try {
        // Wait for font to load before re-rendering
        await (document as any).fonts.load(`1em "${fontFamily}"`);
        await (document as any).fonts.ready;
        if (canvas) canvas.requestRenderAll();
    } catch (e) {
        console.error("Font failed to load", e);
    } finally {
        setIsLoadingFont(false);
    }
  };

  const handleFontChange = async (font: string) => {
    await loadGoogleFont(font);
    updateProperty("fontFamily", font);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
      {/* Project Info */}
      <div className="pb-4 border-b border-slate-100">
        <h4 className="text-[10px] font-bold mb-3 text-slate-400 uppercase tracking-widest text-center">Admin Controls</h4>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase tracking-tight">Template Title</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#1C75BC] outline-none transition-all"
              value={props.projectTitle}
              onChange={(e) => updateProperty("projectTitle", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase tracking-tight">Category</label>
            <select
              className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#1C75BC] outline-none transition-all appearance-none cursor-pointer"
              value={props.projectCategory}
              onChange={(e) => updateProperty("projectCategory", e.target.value)}
            >
                <option value="Invitation">Invitation</option>
                <option value="Wedding">Wedding</option>
                <option value="Birthday">Birthday</option>
                <option value="Corporate">Corporate</option>
            </select>
          </div>
        </div>
      </div>

      {!selectedObject ? (
        <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
          <Type className="w-10 h-10 mb-3 text-slate-300" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
            Select an element<br/>to edit properties
          </p>
        </div>
      ) : (
        <>
          {/* Dimensions */}
          <div>
            <h4 className="text-[10px] font-bold mb-3 text-slate-400 uppercase tracking-widest">Dimensions</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-bold">X</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
                  value={props.left}
                  onChange={(e) => updateProperty("left", parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-bold">Y</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
                  value={props.top}
                  onChange={(e) => updateProperty("top", parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-bold">Width</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
                  value={props.width}
                  onChange={(e) => updateProperty("width", parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-bold">Height</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
                  value={props.height}
                  onChange={(e) => updateProperty("height", parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Style */}
          <div>
            <h4 className="text-[10px] font-bold mb-3 text-slate-400 uppercase tracking-widest">Character Style</h4>
            <div className="space-y-4">
              {/* Opacity */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-500 font-bold">Opacity</label>
                  <span className="text-[10px] text-slate-800 font-bold">{Math.round(props.opacity)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full accent-[#1C75BC]"
                  value={props.opacity}
                  onChange={(e) => updateProperty("opacity", parseInt(e.target.value))}
                />
              </div>

              {/* Colors */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 block mb-1 font-bold">Fill</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent"
                      value={props.fill}
                      onChange={(e) => updateProperty("fill", e.target.value)}
                    />
                    <span className="text-[10px] font-mono text-slate-400">{props.fill.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 block mb-1 font-bold">Stroke</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent"
                      value={props.stroke}
                      onChange={(e) => updateProperty("stroke", e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-12 bg-slate-50 border border-[#D1E1EF] rounded px-1 text-[10px] text-slate-800"
                      value={props.strokeWidth}
                      onChange={(e) => updateProperty("strokeWidth", parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {selectedObject.type === "textbox" && (
                <div className={`space-y-4 pt-2 border-t border-slate-100 mt-2 transition-opacity duration-300 ${isLoadingFont ? 'opacity-40 animate-pulse' : 'opacity-100'}`}>
                  {/* Font Family Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Typography</label>
                        {isLoadingFont && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Preparing...</span>}
                    </div>
                    <div className="relative mb-2">
                        <input
                            type="text"
                            placeholder="Find any Google font..."
                            className="w-full bg-white border border-[#D1E1EF] rounded px-8 py-2 text-[10px] text-slate-800 outline-none focus:ring-1 focus:ring-[#1C75BC] transition-all font-bold uppercase tracking-tight"
                            value={fontSearch}
                            onChange={(e) => setFontSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && fontSearch) {
                                    handleFontChange(fontSearch);
                                    setFontSearch("");
                                }
                            }}
                        />
                        <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="flex gap-1 mb-2 overflow-x-auto pb-1 invisible-scrollbar">
                        {["all", "serif", "sans", "script", "display", "mono"].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFontFilter(cat)}
                                className={`px-2 py-1 rounded text-[9px] uppercase font-bold tracking-tighter whitespace-nowrap transition-all ${
                                    fontFilter === cat 
                                    ? "bg-[#1C75BC] text-white" 
                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex gap-1.5 flex-wrap max-h-40 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-[#D1E1EF] custom-scrollbar">
                        {GOOGLE_FONTS_LIB
                            .filter(f => (fontFilter === 'all' || f.category === fontFilter) && f.name.toLowerCase().includes(fontSearch.toLowerCase()))
                            .map(fontObj => (
                            <button
                                key={fontObj.name}
                                onClick={() => handleFontChange(fontObj.name)}
                                className={`px-2.5 py-2 rounded text-[11px] whitespace-nowrap transition-all border flex-grow text-center ${
                                    props.fontFamily === fontObj.name 
                                    ? "bg-[#1C75BC] border-[#1C75BC] text-white shadow-md font-bold scale-105 z-10" 
                                    : "bg-white border-slate-200 text-slate-700 hover:border-[#1C75BC] hover:bg-slate-100 hover:scale-105"
                                }`}
                                style={{ fontFamily: fontObj.name }}
                            >
                                {fontObj.name}
                            </button>
                        ))}
                        {fontSearch && !GOOGLE_FONTS_LIB.find(f => f.name.toLowerCase() === fontSearch.toLowerCase()) && (
                             <button
                                onClick={() => { handleFontChange(fontSearch); setFontSearch(""); }}
                                className="px-2.5 py-2 rounded text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold w-full uppercase"
                            >
                                Load "{fontSearch}" from Google
                            </button>
                        )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateProperty("fontWeight", props.fontWeight === "bold" ? "normal" : "bold")}
                      className={`flex-1 p-2 rounded border ${props.fontWeight === "bold" ? "bg-[#1C75BC] border-[#1C75BC] text-white shadow-sm" : "bg-white border-[#D1E1EF] text-slate-600 hover:bg-slate-50"} transition-all`}
                    >
                      <Bold className="w-4 h-4 mx-auto" />
                    </button>
                    <button 
                      onClick={() => updateProperty("fontStyle", props.fontStyle === "italic" ? "normal" : "italic")}
                      className={`flex-1 p-2 rounded border ${props.fontStyle === "italic" ? "bg-[#1C75BC] border-[#1C75BC] text-white shadow-sm" : "bg-white border-[#D1E1EF] text-slate-600 hover:bg-slate-50"} transition-all`}
                    >
                      <Italic className="w-4 h-4 mx-auto" />
                    </button>
                    <button 
                      onClick={() => updateProperty("underline", !props.underline)}
                      className={`flex-1 p-2 rounded border ${props.underline ? "bg-[#1C75BC] border-[#1C75BC] text-white shadow-sm" : "bg-white border-[#D1E1EF] text-slate-600 hover:bg-slate-50"} transition-all`}
                    >
                      <Underline className="w-4 h-4 mx-auto" />
                    </button>
                  </div>

                  <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-[#D1E1EF]">
                    <button onClick={() => updateProperty("textAlign", "left")} className={`flex-1 p-1 rounded ${props.textAlign === "left" ? "bg-white shadow-sm text-[#1C75BC]" : "text-slate-400"}`}><AlignLeft className="w-4 h-4 mx-auto" /></button>
                    <button onClick={() => updateProperty("textAlign", "center")} className={`flex-1 p-1 rounded ${props.textAlign === "center" ? "bg-white shadow-sm text-[#1C75BC]" : "text-slate-400"}`}><AlignCenter className="w-4 h-4 mx-auto" /></button>
                    <button onClick={() => updateProperty("textAlign", "right")} className={`flex-1 p-1 rounded ${props.textAlign === "right" ? "bg-white shadow-sm text-[#1C75BC]" : "text-slate-400"}`}><AlignRight className="w-4 h-4 mx-auto" /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1 font-bold">Line Height</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
                        value={props.lineHeight}
                        onChange={(e) => updateProperty("lineHeight", parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1 font-bold">Spacing</label>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
                        value={props.charSpacing}
                        onChange={(e) => updateProperty("charSpacing", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Shadow */}
          <div>
            <h4 className="text-[10px] font-bold mb-3 text-slate-400 uppercase tracking-widest">Global Shadow</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">Blur</label>
                   <input
                    type="number"
                    className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
                    value={props.shadowBlur}
                    onChange={(e) => updateProperty("shadowBlur", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 font-bold">Color</label>
                  <input
                    type="color"
                    className="w-full h-7 bg-transparent rounded cursor-pointer border-none p-0"
                    value={props.shadowColor}
                    onChange={(e) => updateProperty("shadowColor", e.target.value)}
                  />
                </div>
                <div>
                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">X Offset</label>
                   <input
                    type="number"
                    className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
                    value={props.shadowOffsetX}
                    onChange={(e) => updateProperty("shadowOffsetX", parseInt(e.target.value))}
                  />
                </div>
                <div>
                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">Y Offset</label>
                   <input
                    type="number"
                    className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
                    value={props.shadowOffsetY}
                    onChange={(e) => updateProperty("shadowOffsetY", parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
