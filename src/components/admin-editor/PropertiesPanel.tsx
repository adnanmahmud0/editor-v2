"use client";

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
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

  if (!selectedObject) {
    return (
      <div className="flex-1 border-b border-[#D1E1EF] p-4 overflow-auto flex items-center justify-center text-slate-400 text-xs">
        No selection
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
            <input
              type="number"
              className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
              value={props.width}
              onChange={(e) =>
                updateProperty("width", parseInt(e.target.value))
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">H</label>
            <input
              type="number"
              className="w-full bg-slate-50 border border-[#D1E1EF] rounded px-2 py-1 text-sm text-slate-800"
              value={props.height}
              onChange={(e) =>
                updateProperty("height", parseInt(e.target.value))
              }
            />
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
        <input
          type="range"
          min="0"
          max="100"
          className="w-full"
          value={props.opacity}
          onChange={(e) => updateProperty("opacity", parseInt(e.target.value))}
        />
        <div className="text-right text-xs text-slate-500 mt-1">
          {props.opacity}%
        </div>
      </div>
    </div>
  );
}
