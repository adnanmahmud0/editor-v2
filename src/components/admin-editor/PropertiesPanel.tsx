import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";

export function PropertiesPanel() {
  return (
    <div className="flex-1 border-b border-[#3a3a3a] p-4 overflow-auto">
      <h3 className="text-xs font-semibold mb-4 text-gray-400 uppercase">
        Properties
      </h3>

      {/* Transform */}
      <div className="mb-6">
        <h4 className="text-xs mb-2 text-gray-500">Transform</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">X</label>
            <input
              type="number"
              className="w-full bg-[#1a1a1a] border border-[#404040] rounded px-2 py-1 text-sm"
              defaultValue={0}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Y</label>
            <input
              type="number"
              className="w-full bg-[#1a1a1a] border border-[#404040] rounded px-2 py-1 text-sm"
              defaultValue={0}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">W</label>
            <input
              type="number"
              className="w-full bg-[#1a1a1a] border border-[#404040] rounded px-2 py-1 text-sm"
              defaultValue={100}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">H</label>
            <input
              type="number"
              className="w-full bg-[#1a1a1a] border border-[#404040] rounded px-2 py-1 text-sm"
              defaultValue={100}
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="mb-6">
        <h4 className="text-xs mb-2 text-gray-500">Appearance</h4>

        {/* Fill */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Fill</label>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded border border-[#404040] bg-white cursor-pointer" />
            <input
              type="text"
              className="flex-1 bg-[#1a1a1a] border border-[#404040] rounded px-2 py-1 text-sm"
              defaultValue="#FFFFFF"
            />
          </div>
        </div>

        {/* Stroke */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Stroke</label>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded border border-[#404040] bg-black cursor-pointer" />
            <input
              type="text"
              className="flex-1 bg-[#1a1a1a] border border-[#404040] rounded px-2 py-1 text-sm"
              defaultValue="#000000"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Stroke Width
          </label>
          <input
            type="number"
            className="w-full bg-[#1a1a1a] border border-[#404040] rounded px-2 py-1 text-sm"
            defaultValue={1}
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="mb-6">
        <h4 className="text-xs mb-2 text-gray-500">Opacity</h4>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue={100}
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-right">100%</div>
      </div>

      {/* Align */}
      <div>
        <h4 className="text-xs mb-2 text-gray-500">Align</h4>
        <div className="flex gap-1">
          <button className="flex-1 bg-[#1a1a1a] hover:bg-[#333333] border border-[#404040] rounded p-2 transition-colors">
            <AlignLeft className="w-4 h-4 mx-auto" />
          </button>
          <button className="flex-1 bg-[#1a1a1a] hover:bg-[#333333] border border-[#404040] rounded p-2 transition-colors">
            <AlignCenter className="w-4 h-4 mx-auto" />
          </button>
          <button className="flex-1 bg-[#1a1a1a] hover:bg-[#333333] border border-[#404040] rounded p-2 transition-colors">
            <AlignRight className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
