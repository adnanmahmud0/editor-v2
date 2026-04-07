"use client";

import { useState } from 'react';
import { 
  Upload, 
  RotateCw, 
  Trash2, 
  Palette, 
  X, 
  Move, 
  Sun, 
  Contrast as ContrastIcon, 
  Droplets,
  RotateCcw,
  Sparkles,
  Camera
} from 'lucide-react';
import type { ImageElement } from '../user-editor/typs';
import { useDraggable } from '@/hooks/use-draggable';

interface ImageEditModalProps {
  image: ImageElement;
  position: { x: number; y: number; width: number; height: number };
  onUpdate: (image: ImageElement) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ImageEditModal({ image, position, onUpdate, onDelete, onClose }: ImageEditModalProps) {
  const [brightness, setBrightness] = useState(image.brightness || 100);
  const [contrast, setContrast] = useState(image.contrast || 100);
  const [saturation, setSaturation] = useState(image.saturation || 100);

  // Center the modal on the screen initially
  const initialX = typeof window !== 'undefined' ? (window.innerWidth - 850) / 2 : 50;
  const initialY = typeof window !== 'undefined' ? (window.innerHeight - 600) / 2 : 100;

  const { position: modalPos, onMouseDown: handleMouseDown } = useDraggable(initialX, initialY);

  const handleRotate = () => {
    onUpdate({
      ...image,
      rotation: ((image.rotation || 0) + 90) % 360
    });
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    onUpdate({
        ...image,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        rotation: 0
    });
  };

  const handleImageUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        onUpdate({ ...image, url });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateFilter = (type: 'brightness' | 'contrast' | 'saturation', val: number) => {
      if (type === 'brightness') setBrightness(val);
      if (type === 'contrast') setContrast(val);
      if (type === 'saturation') setSaturation(val);
      onUpdate({ ...image, [type]: val });
  };

  return (
    <div 
      className="fixed bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-200 flex flex-col w-[850px] max-h-[92vh] overflow-hidden z-[1000] animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: `${modalPos.x}px`,
        top: `${modalPos.y}px`,
        transform: 'none',
        transition: 'none',
      }}
    >
      {/* Header */}
      <div 
        className="px-8 py-5 flex items-center justify-between bg-slate-50 border-b border-slate-100 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-200 text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Image Professional</h3>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">Enhance and transform your assets</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden h-[450px]">
        {/* Left: Studio Preview */}
        <div className="flex-1 bg-slate-100/50 p-8 flex items-center justify-center relative group">
           <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
           
           <div className="relative p-2 bg-white rounded-2xl shadow-2xl border border-slate-100 group-hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
                <img 
                    src={image.url} 
                    alt="Preview" 
                    className="max-h-[320px] max-w-full object-contain transition-all duration-300"
                    style={{
                        transform: `rotate(${image.rotation || 0}deg)`,
                        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                    }}
                />
                <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors pointer-events-none" />
           </div>

           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-white rounded-full shadow-lg text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">
                    <Sparkles className="w-3 h-3" /> Filters Active
                </div>
           </div>
        </div>

        {/* Right: Laboratory Controls */}
        <div className="w-[340px] border-l border-slate-100 flex flex-col p-8 gap-8 bg-white overflow-y-auto custom-scrollbar">
           {/* Actions Grid */}
           <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 border border-slate-100 rounded-2xl bg-white hover:bg-slate-50 hover:border-indigo-200 transition-all cursor-pointer group shadow-sm">
                    <Upload className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Replace</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpdate} />
                </label>
                <button 
                    onClick={handleRotate}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-5 border border-slate-100 rounded-2xl bg-white hover:bg-slate-50 hover:border-indigo-200 transition-all group shadow-sm"
                >
                    <RotateCw className="w-5 h-5 text-indigo-500 group-hover:rotate-90 transition-transform" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Rotate 90°</span>
                </button>
           </div>

           <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjustments</h4>
                    <button onClick={handleReset} className="text-[9px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Sun className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Brightness</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{brightness}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="200" value={brightness} 
                            onChange={(e) => updateFilter('brightness', Number(e.target.value))}
                            className="w-full accent-indigo-500 h-1 rounded-full bg-slate-100" 
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ContrastIcon className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Contrast</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{contrast}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="200" value={contrast} 
                            onChange={(e) => updateFilter('contrast', Number(e.target.value))}
                            className="w-full accent-indigo-500 h-1 rounded-full bg-slate-100" 
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Droplets className="w-3.5 h-3.5 text-fuchsia-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Saturation</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{saturation}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="200" value={saturation} 
                            onChange={(e) => updateFilter('saturation', Number(e.target.value))}
                            className="w-full accent-indigo-500 h-1 rounded-full bg-slate-100" 
                        />
                    </div>
                </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => onDelete(image.id)}
          className="flex items-center gap-2 px-5 py-3 text-[10px] font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors uppercase tracking-widest"
        >
          <Trash2 className="w-4 h-4" /> Remove Asset
        </button>
        <button
          onClick={onClose}
          className="px-10 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[11px] font-bold rounded-2xl hover:from-indigo-700 hover:to-indigo-800 shadow-xl shadow-indigo-200 transition-all duration-300 transform hover:-translate-y-1 uppercase tracking-widest"
        >
          Confirm Adjustments
        </button>
      </div>
    </div>
  );
}