"use client";

import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  Layers,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import * as fabric from "fabric";

interface LayersPanelProps {
  canvas: fabric.Canvas | null;
}

interface LayerItemProps {
  obj: fabric.Object;
  index: number;
  depth: number;
  activeObject: fabric.Object | null;
  onSelect: (obj: fabric.Object) => void;
  onToggleVisible: (e: React.MouseEvent, obj: fabric.Object) => void;
  onToggleLock: (e: React.MouseEvent, obj: fabric.Object) => void;
  getObjectName: (obj: fabric.Object, index: number) => string;
}

const LayerItem: React.FC<LayerItemProps> = ({
  obj,
  index,
  depth,
  activeObject,
  onSelect,
  onToggleVisible,
  onToggleLock,
  getObjectName,
}) => {
  const [expanded, setExpanded] = useState(true);
  const isGroup = obj.type === "group";
  const children = isGroup ? (obj as fabric.Group).getObjects().reverse() : [];
  const isSelected = activeObject === obj;
  const isLocked = !!obj.lockMovementX;

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect(obj);
        }}
        className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer group text-slate-700 border border-transparent ${
          isSelected ? "bg-[#E8F1F8] border-[#1C75BC]" : "hover:bg-[#E8F1F8]"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isGroup ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-slate-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-slate-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-500" />
            )}
          </button>
        ) : (
          <ChevronRight className="w-3 h-3 text-slate-400 opacity-0" />
        )}

        <div className="w-4 h-4 flex items-center justify-center bg-slate-100 border rounded text-[10px] text-slate-500">
          {obj.type === "image"
            ? "IMG"
            : obj.type.substring(0, 1).toUpperCase()}
        </div>
        <span className="flex-1 text-xs truncate">
          {getObjectName(obj, index)}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => onToggleLock(e, obj)}
            className="p-1 hover:bg-slate-200 rounded"
          >
            {isLocked ? (
              <Lock className="w-3 h-3 text-red-400" />
            ) : (
              <Unlock className="w-3 h-3 text-slate-400" />
            )}
          </button>
          <button
            onClick={(e) => onToggleVisible(e, obj)}
            className="p-1 hover:bg-slate-200 rounded"
          >
            {obj.visible ? (
              <Eye className="w-3 h-3 text-slate-600" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {isGroup &&
        expanded &&
        children.map((child, i) => (
          <LayerItem
            key={i}
            obj={child}
            index={i}
            depth={depth + 1}
            activeObject={activeObject}
            onSelect={onSelect}
            onToggleVisible={onToggleVisible}
            onToggleLock={onToggleLock}
            getObjectName={getObjectName}
          />
        ))}
    </>
  );
};

export function LayersPanel({ canvas }: LayersPanelProps) {
  const [objects, setObjects] = useState<fabric.Object[]>([]);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);

  useEffect(() => {
    if (!canvas) {
      // eslint-disable-next-line
      setObjects([]);
      setActiveObject(null);
      return;
    }

    let timeout: NodeJS.Timeout;
    const updateLayers = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setObjects([...canvas.getObjects()].reverse());
        setActiveObject(canvas.getActiveObject() || null);
      }, 50); // Debounce updates to avoid flickering during bulk operations
    };

    canvas.on("object:added", updateLayers);
    canvas.on("object:removed", updateLayers);
    canvas.on("object:modified", updateLayers);
    canvas.on("selection:created", updateLayers);
    canvas.on("selection:updated", updateLayers);
    canvas.on("selection:cleared", updateLayers);

    updateLayers();

    return () => {
      clearTimeout(timeout);
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
      // If object is inside a group, we might need to handle it differently
      // For now, try standard selection.
      // If it's a child of a group, Fabric might not let us set it as active object directly
      // without breaking the group.
      // But let's try.
      if (obj.group) {
        // It's inside a group.
        // Option 1: Select the group
        // canvas.setActiveObject(obj.group);
        // Option 2: Just highlight it?
        // We can't easily select a child inside a group without ungrouping or specialized logic.
        // For now, let's select the top-level group if it has one.
        canvas.setActiveObject(obj.group);
      } else {
        canvas.setActiveObject(obj);
      }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((obj as any).id) return (obj as any).id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((obj as any).name) return (obj as any).name;

    if (obj.type === "image") return "Image";
    if (obj.type === "path") return "Path";
    if (obj.type === "rect") return "Rectangle";
    if (obj.type === "circle") return "Circle";
    if (obj.type === "i-text") return "Text";
    if (obj.type === "textbox") return "Textbox";
    if (obj.type === "group")
      return `Group (${(obj as fabric.Group).getObjects().length})`;

    // For nested items, we might want a different naming scheme, but this is fine
    return `Layer ${index + 1}`;
  };

  return (
    <div className="flex-1 p-4 overflow-auto border-t border-[#D1E1EF] h-1/2">
      <h3 className="text-xs font-semibold mb-4 text-[#1C75BC] uppercase flex items-center gap-2">
        <Layers className="w-4 h-4" /> Layers
      </h3>

      <div className="space-y-1">
        {objects.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-4">
            No layers
          </div>
        )}
        {objects.map((obj, index) => (
          <LayerItem
            key={index}
            obj={obj}
            index={index}
            depth={0}
            activeObject={activeObject}
            onSelect={selectObject}
            onToggleVisible={toggleVisible}
            onToggleLock={toggleLock}
            getObjectName={getObjectName}
          />
        ))}
      </div>
    </div>
  );
}
