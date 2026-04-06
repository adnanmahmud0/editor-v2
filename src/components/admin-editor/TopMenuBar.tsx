"use client";

interface TopMenuBarProps {
  onSave?: () => void;
}

export function TopMenuBar({ onSave }: TopMenuBarProps) {
  return (
    <div className="h-12 bg-white border-b border-[#D1E1EF] flex items-center px-4 justify-between shadow-sm z-50">
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#1C75BC] rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
          Ai
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800 tracking-tight leading-none uppercase">Admin Designer</span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">TEMPLATE V1.2.0</span>
        </div>
      </div>

      {/* Project Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-[#D1E1EF] rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Design Active</span>
        </div>
        
        {/* Save/Publish could go here */}
        <button 
          onClick={onSave}
          className="px-4 py-1.5 bg-[#1C75BC] hover:bg-[#1664a0] text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 uppercase tracking-wide"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
