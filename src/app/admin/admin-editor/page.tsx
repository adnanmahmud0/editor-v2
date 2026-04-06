"use client";

import { Canvas } from "@/components/admin-editor/Canvas";
import { LayersPanel } from "@/components/admin-editor/LayersPanel";
import { PropertiesPanel } from "@/components/admin-editor/PropertiesPanel";
import { ToolPalette } from "@/components/admin-editor/ToolPalette";
import { TopMenuBar } from "@/components/admin-editor/TopMenuBar";
import { useState } from "react";
import * as fabric from "fabric";

export default function Page() {
  const [activeCanvas, setActiveCanvas] = useState<fabric.Canvas | null>(null);

  const handleSave = () => {
    alert("Project saved successfully to the system.");
    // In a real application, we would call a backend service here
    // with the latest design state (pages).
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#E8F1F8] text-slate-800 overflow-hidden">
      <TopMenuBar onSave={handleSave} />
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tool Palette */}
        <ToolPalette canvas={activeCanvas} />

        {/* Canvas Area */}
        <Canvas onCanvasActive={setActiveCanvas} />

        {/* Right Panels */}
        <div className="w-64 bg-white border-l border-[#D1E1EF] flex flex-col pt-2 shadow-inner">
          <PropertiesPanel canvas={activeCanvas} />
          <LayersPanel canvas={activeCanvas} />
        </div>
      </div>
    </div>
  );
}
