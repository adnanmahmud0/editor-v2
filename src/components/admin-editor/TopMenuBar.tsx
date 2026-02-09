import { File, Edit, Image, Type, ChevronDown } from "lucide-react";

export function TopMenuBar() {
  const menuItems = [
    { label: "File", icon: File },
    { label: "Edit", icon: Edit },
    { label: "Object", icon: null },
    { label: "Type", icon: Type },
    { label: "Select", icon: null },
    { label: "Effect", icon: null },
    { label: "View", icon: null },
    { label: "Window", icon: null },
    { label: "Help", icon: null },
  ];

  return (
    <div className="h-12 bg-[#323232] border-b border-[#1a1a1a] flex items-center px-4 gap-6">
      {/* Logo Area */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-800 rounded flex items-center justify-center font-bold">
          Ai
        </div>
        <span className="text-sm font-semibold">Design Editor</span>
      </div>

      {/* Menu Items */}
      <div className="flex gap-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className="px-3 py-1.5 text-sm hover:bg-[#404040] rounded transition-colors flex items-center gap-1"
          >
            {item.label}
            <ChevronDown className="w-3 h-3" />
          </button>
        ))}
      </div>
    </div>
  );
}
