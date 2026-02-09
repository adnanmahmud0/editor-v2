"use client";

import { Eye, EyeOff, Lock, Unlock, ChevronRight, Layers } from "lucide-react";
import React, { useState, useEffect } from "react";
import * as fabric from "fabric";

interface LayersPanelProps {
  canvas: fabric.Canvas | null;
}

export function LayersPanel({ canvas }: LayersPanelProps) {
  const [objects, setObjects] = useState<fabric.Object[]>([]);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);

  useEffect(() => {
    if (!canvas) {
      setObjects([]);
      setActiveObject(null);
      return;
    }

    const updateLayers = () => {
      // Get objects and reverse so top layer is first
      setObjects([...canvas.getObjects()].reverse());
      setActiveObject(canvas.getActiveObject() || null);
    };

    canvas.on("object:added", updateLayers);
    canvas.on("object:removed", updateLayers);
    canvas.on("object:modified", updateLayers);
    canvas.on("selection:created", updateLayers);
    canvas.on("selection:updated", updateLayers);
    canvas.on("selection:cleared", updateLayers);

    updateLayers();

    return () => {
      canvas.off("object:added", updateLayers);
      canvas.off("object:removed", updateLayers);
      canvas.off("object:modified", updateLayers);
      canvas.off("selection:created", updateLayers);
      canvas.off("selection:updated", updateLayers);
      canvas.off("selection:cleared", updateLayers);
    };
  }, [canvas]);

  const selectObject = (obj: fabric.Object) => {
    if (canvas) {
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    }
  };

  const toggleVisible = (e: React.MouseEvent, obj: fabric.Object) => {
    e.stopPropagation();
    obj.set("visible", !obj.visible);
    if (!obj.visible) {
        canvas?.discardActiveObject();
    }
    canvas?.requestRenderAll();
    // Force update local state since object property changed
    setObjects([...(canvas?.getObjects() || [])].reverse());
  };

  const toggleLock = (e: React.MouseEvent, obj: fabric.Object) => {
    e.stopPropagation();
    const isLocked = !!obj.lockMovementX;
    obj.set({
        lockMovementX: !isLocked,
        lockMovementY: !isLocked,
        lockRotation: !isLocked,
        lockScalingX: !isLocked,
        lockScalingY: !isLocked,
    });
    canvas?.requestRenderAll();
    setObjects([...(canvas?.getObjects() || [])].reverse());
  };

  const getObjectName = (obj: fabric.Object, index: number) => {
    // Check for ID or Name from Illustrator/SVG
    // @ts-ignore - id exists on fabric objects but might not be in types depending on version
    if (obj.id) return obj.id;
    // @ts-ignore
    if (obj.name) return obj.name;

    if (obj.type === 'image') return 'Image';
    if (obj.type === 'path') return 'Path';
    if (obj.type === 'rect') return 'Rectangle';
    if (obj.type === 'circle') return 'Circle';
    if (obj.type === 'i-text') return 'Text';
    if (obj.type === 'group') return 'Group';
    return `Layer ${objects.length - index}`;
  };

  return (
    <div className="flex-1 p-4 overflow-auto border-t border-[#D1E1EF] h-1/2">
      <h3 className="text-xs font-semibold mb-4 text-[#1C75BC] uppercase flex items-center gap-2">
        <Layers className="w-4 h-4" /> Layers
      </h3>

      <div className="space-y-1">
        {objects.length === 0 && (
            <div className="text-xs text-slate-400 text-center py-4">No layers</div>
        )}
        {objects.map((obj, index) => {
           const isSelected = activeObject === obj;
           const isLocked = !!obj.lockMovementX;
           return (
            <div 
                key={index} 
                onClick={() => selectObject(obj)}
                className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer group text-slate-700 border border-transparent ${
                    isSelected ? "bg-[#E8F1F8] border-[#1C75BC]" : "hover:bg-[#E8F1F8]"
                }`}
            >
              <ChevronRight className="w-3 h-3 text-slate-400 opacity-0" />
              <div className="w-4 h-4 flex items-center justify-center bg-slate-100 border rounded text-[10px] text-slate-500">
                {obj.type === 'image' ? 'IMG' : obj.type.substring(0, 1).toUpperCase()}
              </div>
              <span className="flex-1 text-xs truncate">
                {getObjectName(obj, index)}
              </span>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => toggleLock(e, obj)} className="p-1 hover:bg-slate-200 rounded">
                    {isLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                </button>
                <button onClick={(e) => toggleVisible(e, obj)} className="p-1 hover:bg-slate-200 rounded">
                    {obj.visible ? <Eye className="w-3 h-3 text-slate-600" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
