"use client";

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Plus,
  Minus as MinusIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import * as fabric from "fabric";

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null;
}

export function PropertiesPanel({ canvas }: PropertiesPanelProps) {
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(
    null,
  );
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
    shadowBlur: 0,
    shadowColor: "rgba(0,0,0,0.3)",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  });

  useEffect(() => {
    if (!canvas) return;

    const updateProps = () => {
      const activeObj = canvas.getActiveObject();
      setSelectedObject(activeObj || null);

      if (activeObj) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeObjAny = activeObj as any;
        setProps({
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
          shadowBlur: activeObjAny.shadow?.blur || 0,
          shadowColor: activeObjAny.shadow?.color || "rgba(0,0,0,0.3)",
          shadowOffsetX: activeObjAny.shadow?.offsetX || 0,
          shadowOffsetY: activeObjAny.shadow?.offsetY || 0,
        });
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
    if (!selectedObject || !canvas) return;

    let finalValue = value;
    if (key === "width") {
      if (selectedObject.type === "textbox") {
        // For textbox, update width directly to allow reflow
        finalValue = value;
        selectedObject.set("scaleX", 1); // Ensure scale is reset
      } else {
        selectedObject.set("scaleX", value / selectedObject.width!);
        finalValue = undefined; // handled via scale
      }
    } else if (key === "height") {
      selectedObject.set("scaleY", value / selectedObject.height!);
      finalValue = undefined;
    } else if (key === "opacity") {
      finalValue = value / 100;
    }

    if (finalValue !== undefined) {
      selectedObject.set(key, finalValue);
    }

    selectedObject.setCoords();
    canvas.requestRenderAll();

    // Update local state
    setProps((prev) => ({ ...prev, [key]: value }));
  };

  const handleUngroup = () => {
    if (!selectedObject || !canvas) return;

    if (selectedObject.type === "group") {
      let currentObj = selectedObject;
      let attempts = 0;

      // Iteratively ungroup if the result is a single group (wrapper)
      // This handles Illustrator's nested group structure (Group -> Group -> Content)
      while (currentObj && currentObj.type === "group" && attempts < 20) {
        // Check for toActiveSelection or fallback
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((currentObj as any).toActiveSelection) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activeSelection = (currentObj as any).toActiveSelection();
          // If we got an ActiveSelection, check its contents
          if (activeSelection && activeSelection.type === "activeSelection") {
            const objects = activeSelection.getObjects();
            if (objects.length === 1) {
              const singleObj = objects[0];
              canvas.discardActiveObject();
              canvas.setActiveObject(singleObj);
              currentObj = singleObj;
            } else {
              break;
            }
          } else {
            break;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((currentObj as any)._restoreObjectsState) {
          // Fallback using internal method
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const objects = (currentObj as any).getObjects();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (currentObj as any)._restoreObjectsState();
          canvas.remove(currentObj);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          objects.forEach((obj: any) => {
            canvas.add(obj);
            obj.setDirty(true);
          });

          if (objects.length === 1) {
            const singleObj = objects[0];
            canvas.setActiveObject(singleObj);
            currentObj = singleObj;
          } else {
            // Select all un-grouped objects
            // We need to create a selection or just leave them
            // For now, let's just select the first one or nothing to avoid complexity
            // Ideally we should create an ActiveSelection but that requires toActiveSelection logic
            break;
          }
        } else {
          break;
        }
        attempts++;
      }

      canvas.requestRenderAll();
      // Force update to refresh selection state in UI
      const active = canvas.getActiveObject();
      setSelectedObject(active || null);
    }
  };

  const handleCanvasBgChange = (color: string) => {
    if (!canvas) return;
    canvas.set("backgroundColor", color);
    canvas.requestRenderAll();
    // Use an event to trigger sync if needed, or just let it be
    canvas.fire("object:modified");
  };

  if (!selectedObject) {
    return (
      <div className="flex-1 border-b border-[#D1E1EF] p-4 overflow-auto h-1/2">
        <h3 className="text-xs font-semibold text-[#1C75BC] uppercase mb-4">
          Artboard
        </h3>
        <div className="mb-6">
          <h4 className="text-xs mb-2 text-slate-500">Background Color</h4>
          <div className="flex gap-2">
            <input
              type="color"
              className="w-10 h-10 rounded border border-[#D1E1EF] p-1 cursor-pointer"
              value={(canvas?.backgroundColor as string) || "#ffffff"}
              onChange={(e) => handleCanvasBgChange(e.target.value)}
            />
            <input
              type="text"
              className="flex-1 bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
              value={(canvas?.backgroundColor as string) || "#ffffff"}
              onChange={(e) => handleCanvasBgChange(e.target.value)}
            />
          </div>
        </div>
        <div className="text-[10px] text-slate-400 mt-10 text-center">
            Select an element to view its properties
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 border-b border-[#D1E1EF] p-4 overflow-auto h-1/2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-[#1C75BC] uppercase">
          Properties
        </h3>
        {selectedObject.type === "group" && (
          <button
            onClick={handleUngroup}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-200 transition-colors"
          >
            Ungroup
          </button>
        )}
      </div>

      {/* Text Properties */}
      {(selectedObject.type === "textbox" ||
        selectedObject.type === "text" ||
        selectedObject.type === "i-text") && (
        <div className="mb-6">
          <h4 className="text-xs mb-2 text-slate-500">Text Content</h4>
          <textarea
            className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800 min-h-[80px] mb-3 resize-y"
            value={props.text}
            onChange={(e) => updateProperty("text", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-xs text-slate-500">Size</label>
              <input
                type="number"
                className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
                value={props.fontSize}
                onChange={(e) =>
                  updateProperty("fontSize", parseInt(e.target.value))
                }
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Align</label>
              <div className="flex border border-[#D1E1EF] rounded bg-slate-50">
                <button
                  className={`flex-1 p-1 hover:bg-slate-200 ${props.textAlign === "left" ? "bg-slate-200" : ""}`}
                  onClick={() => updateProperty("textAlign", "left")}
                >
                  <AlignLeft className="w-3 h-3 mx-auto" />
                </button>
                <button
                  className={`flex-1 p-1 hover:bg-slate-200 ${props.textAlign === "center" ? "bg-slate-200" : ""}`}
                  onClick={() => updateProperty("textAlign", "center")}
                >
                  <AlignCenter className="w-3 h-3 mx-auto" />
                </button>
                <button
                  className={`flex-1 p-1 hover:bg-slate-200 ${props.textAlign === "right" ? "bg-slate-200" : ""}`}
                  onClick={() => updateProperty("textAlign", "right")}
                >
                  <AlignRight className="w-3 h-3 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-slate-500 block mb-1">
              Font Family
            </label>
            <select
              className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
              value={props.fontFamily}
              onChange={(e) => updateProperty("fontFamily", e.target.value)}
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Impact">Impact</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Style</label>
              <div className="flex border border-[#D1E1EF] rounded bg-slate-50">
                <button
                  className={`flex-1 p-1 hover:bg-slate-200 ${props.fontWeight === "bold" ? "bg-slate-200" : ""}`}
                  onClick={() =>
                    updateProperty(
                      "fontWeight",
                      props.fontWeight === "bold" ? "normal" : "bold",
                    )
                  }
                  title="Bold"
                >
                  <Bold className="w-3 h-3 mx-auto" />
                </button>
                <button
                  className={`flex-1 p-1 hover:bg-slate-200 ${props.fontStyle === "italic" ? "bg-slate-200" : ""}`}
                  onClick={() =>
                    updateProperty(
                      "fontStyle",
                      props.fontStyle === "italic" ? "normal" : "italic",
                    )
                  }
                  title="Italic"
                >
                  <Italic className="w-3 h-3 mx-auto" />
                </button>
                <button
                  className={`flex-1 p-1 hover:bg-slate-200 ${props.underline ? "bg-slate-200" : ""}`}
                  onClick={() => updateProperty("underline", !props.underline)}
                  title="Underline"
                >
                  <Underline className="w-3 h-3 mx-auto" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                Line Height
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
                value={props.lineHeight}
                onChange={(e) =>
                  updateProperty("lineHeight", parseFloat(e.target.value))
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Transform */}
      <div className="mb-6">
        <h4 className="text-xs mb-2 text-slate-500">Transform</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500">X</label>
            <input
              type="number"
              className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
              value={props.left}
              onChange={(e) => updateProperty("left", parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Y</label>
            <input
              type="number"
              className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
              value={props.top}
              onChange={(e) => updateProperty("top", parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">W</label>
            <div className="flex items-center gap-1">
              <button onClick={() => updateProperty("width", props.width - 5)} className="p-1 hover:bg-slate-200 rounded"><MinusIcon className="w-3 h-3" /></button>
              <input
                type="number"
                className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-1 py-1 text-center text-xs text-slate-800"
                value={props.width}
                onChange={(e) => updateProperty("width", parseInt(e.target.value))}
              />
              <button onClick={() => updateProperty("width", props.width + 5)} className="p-1 hover:bg-slate-200 rounded"><Plus className="w-3 h-3" /></button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">H</label>
            <div className="flex items-center gap-1">
              <button onClick={() => updateProperty("height", props.height - 5)} className="p-1 hover:bg-slate-200 rounded"><MinusIcon className="w-3 h-3" /></button>
              <input
                type="number"
                className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-1 py-1 text-center text-xs text-slate-800"
                value={props.height}
                onChange={(e) => updateProperty("height", parseInt(e.target.value))}
              />
              <button onClick={() => updateProperty("height", props.height + 5)} className="p-1 hover:bg-slate-200 rounded"><Plus className="w-3 h-3" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="mb-6">
        <h4 className="text-xs mb-2 text-slate-500">Appearance</h4>

        {/* Fill */}
        <div className="mb-3">
          <label className="text-xs text-slate-500 block mb-1">Fill</label>
          <div className="flex gap-2">
            <div
              className="w-8 h-8 rounded border border-[#D1E1EF] cursor-pointer"
              style={{ backgroundColor: props.fill }}
            />
            <input
              type="text"
              className="flex-1 bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
              value={props.fill}
              onChange={(e) => updateProperty("fill", e.target.value)}
            />
          </div>
        </div>

        {/* Stroke */}
        <div className="mb-3">
          <label className="text-xs text-slate-500 block mb-1">Stroke</label>
          <div className="flex gap-2">
            <div
              className="w-8 h-8 rounded border border-[#D1E1EF] cursor-pointer"
              style={{ backgroundColor: props.stroke }}
            />
            <input
              type="text"
              className="flex-1 bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
              value={props.stroke}
              onChange={(e) => updateProperty("stroke", e.target.value)}
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Stroke Width
          </label>
          <input
            type="number"
            className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
            value={props.strokeWidth}
            onChange={(e) =>
              updateProperty("strokeWidth", parseInt(e.target.value))
            }
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="mb-6">
        <h4 className="text-xs mb-2 text-slate-500">Opacity</h4>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => updateProperty("opacity", Math.max(0, props.opacity - 10))}
            className="p-1 hover:bg-slate-200 rounded transition-colors"
          >
            <MinusIcon className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex-1 px-1">
            <input
              type="range"
              min="0"
              max="100"
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#1C75BC]"
              value={props.opacity}
              onChange={(e) => updateProperty("opacity", parseInt(e.target.value))}
            />
            <div className="text-center text-[10px] text-slate-400 mt-1 font-medium">
              {props.opacity}%
            </div>
          </div>
          <button 
            onClick={() => updateProperty("opacity", Math.min(100, props.opacity + 10))}
            className="p-1 hover:bg-slate-200 rounded transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Stroke */}
      <div className="mb-6 border-t border-slate-100 pt-4">
        <h4 className="text-[10px] font-bold mb-3 text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          Stroke
        </h4>
        <div className="flex gap-2 mb-2">
          <input
            type="color"
            className="w-8 h-8 rounded border border-[#D1E1EF] p-1 cursor-pointer bg-white"
            value={props.stroke}
            onChange={(e) => updateProperty("stroke", e.target.value)}
          />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <button onClick={() => updateProperty("strokeWidth", Math.max(0, props.strokeWidth - 1))} className="p-1 hover:bg-slate-200 rounded"><MinusIcon className="w-3 h-3" /></button>
              <input
                type="number"
                className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-1 py-1 text-center text-xs text-slate-800"
                value={props.strokeWidth}
                onChange={(e) => updateProperty("strokeWidth", parseInt(e.target.value))}
              />
              <button onClick={() => updateProperty("strokeWidth", props.strokeWidth + 1)} className="p-1 hover:bg-slate-200 rounded"><Plus className="w-3 h-3" /></button>
            </div>
            <div className="text-[9px] text-slate-400 text-center mt-1 uppercase font-medium">Width</div>
          </div>
        </div>
      </div>

      {/* Shadow */}
      <div className="mb-6 border-t border-slate-100 pt-4 pb-4">
        <h4 className="text-[10px] font-bold mb-3 text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          Shadow
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2 flex gap-2">
            <input
              type="color"
              className="w-8 h-8 rounded border border-[#D1E1EF] p-1 cursor-pointer bg-white"
              value={props.shadowColor.length === 7 ? props.shadowColor : "#000000"}
              onChange={(e) => updateProperty("shadowColor", e.target.value)}
            />
            <div className="flex-1">
                <input
                    type="range"
                    min="0"
                    max="50"
                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#1C75BC]"
                    value={props.shadowBlur}
                    onChange={(e) => updateProperty("shadowBlur", parseInt(e.target.value))}
                />
                <div className="text-[9px] text-slate-400 mt-1 uppercase font-medium">Blur: {props.shadowBlur}px</div>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">X Offset</label>
            <input
              type="number"
              className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-xs text-slate-800"
              value={props.shadowOffsetX}
              onChange={(e) => updateProperty("shadowOffsetX", parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Y Offset</label>
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
  );
}
