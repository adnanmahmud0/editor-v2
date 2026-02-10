import { Undo, Type, Image, List } from "lucide-react";

interface ToolbarProps {
  onAddText: () => void;
  onAddImage: () => void;
}

export function Toolbar({ onAddText, onAddImage }: ToolbarProps) {
  return (
    <div className="flex flex-col gap-2">
      <button className="w-12 h-12 bg-white border-2 border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center">
        <Undo className="w-5 h-5 text-gray-600" />
      </button>

      <button
        onClick={onAddText}
        className="w-12 h-12 bg-white border-2 border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center group relative"
      >
        <Type className="w-5 h-5 text-gray-600" />
        <span className="absolute right-0 top-0 text-cyan-500 text-xs font-bold">
          +
        </span>
      </button>

      <button
        onClick={onAddImage}
        className="w-12 h-12 bg-white border-2 border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center group relative"
      >
        <Image className="w-5 h-5 text-gray-600" />
        <span className="absolute right-0 top-0 text-cyan-500 text-xs font-bold">
          +
        </span>
      </button>

      <button className="w-12 h-12 bg-white border-2 border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center">
        <List className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}
