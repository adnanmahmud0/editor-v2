"use client";

import {
  MousePointer2,
  Hand,
  PenTool,
  Type,
  Square,
  Circle,
  Minus,
  Pencil,
  Pipette,
  ZoomIn,
  Move,
  Hexagon,
  Star,
  ArrowUpRight,
  Eraser,
} from "lucide-react";
import { useState } from "react";

export function ToolPalette() {
  const [activeTool, setActiveTool] = useState("select");

  const tools = [
    { id: "select", icon: MousePointer2, label: "Selection Tool" },
    { id: "direct", icon: Move, label: "Direct Selection Tool" },
    { id: "pen", icon: PenTool, label: "Pen Tool" },
    { id: "pencil", icon: Pencil, label: "Pencil Tool" },
    { id: "text", icon: Type, label: "Type Tool" },
    { id: "line", icon: Minus, label: "Line Tool" },
    { id: "rectangle", icon: Square, label: "Rectangle Tool" },
    { id: "ellipse", icon: Circle, label: "Ellipse Tool" },
    { id: "polygon", icon: Hexagon, label: "Polygon Tool" },
    { id: "star", icon: Star, label: "Star Tool" },
    { id: "eyedropper", icon: Pipette, label: "Eyedropper Tool" },
    { id: "eraser", icon: Eraser, label: "Eraser Tool" },
    { id: "hand", icon: Hand, label: "Hand Tool" },
    { id: "zoom", icon: ZoomIn, label: "Zoom Tool" },
  ];

  return (
    <div className="w-16 bg-[#262626] border-r border-[#3a3a3a] flex flex-col items-center py-3 gap-1">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`w-11 h-11 flex items-center justify-center rounded transition-colors group relative ${
              activeTool === tool.id
                ? "bg-[#404040] text-white"
                : "text-gray-400 hover:bg-[#333333] hover:text-gray-200"
            }`}
            title={tool.label}
          >
            <Icon className="w-5 h-5" />

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a1a] text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {tool.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
