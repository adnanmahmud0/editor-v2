import { Canvas } from "@/components/admin-editor/Canvas";
import { LayersPanel } from "@/components/admin-editor/LayersPanel";
import { PropertiesPanel } from "@/components/admin-editor/PropertiesPanel";
import { ToolPalette } from "@/components/admin-editor/ToolPalette";

export default function page() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-gray-200 overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tool Palette */}
        <ToolPalette />

        {/* Canvas Area */}
        <Canvas />

        {/* Right Panels */}
        <div className="w-64 bg-[#262626] border-l border-[#3a3a3a] flex flex-col">
          <PropertiesPanel />
          <LayersPanel />
        </div>
      </div>
    </div>
  );
}
