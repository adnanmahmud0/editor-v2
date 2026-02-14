"use client";

import { useState } from 'react';
import { Upload, RotateCw, Trash2, Palette, X } from 'lucide-react';
import type { ImageElement } from '../user-editor/typs';

interface ImageEditModalProps {
  image: ImageElement;
  position: { x: number; y: number; width: number; height: number };
  onUpdate: (image: ImageElement) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ImageEditModal({ image, position, onUpdate, onDelete, onClose }: ImageEditModalProps) {
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [brightness, setBrightness] = useState(image.brightness);
  const [contrast, setContrast] = useState(image.contrast);
  const [saturation, setSaturation] = useState(image.saturation);

  const handleRotate = () => {
    onUpdate({
      ...image,
      rotation: (image.rotation + 90) % 360
    });
  };

  const handleDelete = () => {
    onDelete(image.id);
  };

  const handleImageUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        onUpdate({
          ...image,
          url
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = () => {
    onUpdate({
      ...image,
      brightness,
      contrast,
      saturation
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col w-[600px] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
          <h3 className="font-bold text-gray-700">Edit Image</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Image Preview */}
          <div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[200px] items-center overflow-hidden">
            <div className="relative group max-w-full">
              <img 
                src={image.url} 
                alt="Preview" 
                className="max-h-[300px] object-contain rounded-lg shadow-md transition-all"
                style={{
                  transform: `rotate(${image.rotation}deg)`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-cyan-400 hover:bg-cyan-50 transition-all cursor-pointer group">
              <div className="p-3 bg-gray-100 rounded-full group-hover:bg-cyan-100 transition-colors">
                <Upload className="w-6 h-6 text-gray-600 group-hover:text-cyan-600" />
              </div>
              <span className="text-sm font-semibold text-gray-600 group-hover:text-cyan-600">Update Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpdate}
              />
            </label>

            <button
              onClick={handleRotate}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-cyan-400 hover:bg-cyan-50 transition-all group"
            >
              <div className="p-3 bg-gray-100 rounded-full group-hover:bg-cyan-100 transition-colors">
                <RotateCw className="w-6 h-6 text-gray-600 group-hover:text-cyan-600" />
              </div>
              <span className="text-sm font-semibold text-gray-600 group-hover:text-cyan-600">Rotate 90°</span>
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Adjustments
              </h4>
              <button 
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSaturation(100);
                  onUpdate({ ...image, brightness: 100, contrast: 100, saturation: 100 });
                }}
                className="text-xs text-cyan-500 font-bold hover:underline"
              >
                Reset All
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Brightness</label>
                  <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBrightness(val);
                    onUpdate({ ...image, brightness: val });
                  }}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contrast</label>
                  <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setContrast(val);
                    onUpdate({ ...image, contrast: val });
                  }}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saturation</label>
                  <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSaturation(val);
                    onUpdate({ ...image, saturation: val });
                  }}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-8 py-6 border-t bg-gray-50/50">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-3 text-red-500 font-bold rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            DELETE
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-8 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-bold rounded-lg hover:from-cyan-500 hover:to-cyan-600 shadow-lg shadow-cyan-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}