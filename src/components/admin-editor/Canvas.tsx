"use client";

import { Plus, Settings, Upload } from "lucide-react";
import { useState } from "react";

export function Canvas() {
  interface Page {
    id: number;
    name: string;
    width: number;
    height: number;
    backgroundImage: string | null;
  }

  const [pages, setPages] = useState<Page[]>([
    {
      id: 1,
      name: "Artboard 1",
      width: 800,
      height: 600,
      backgroundImage: null,
    },
  ]);

  const [selectedPageSize, setSelectedPageSize] = useState("custom");

  const pageSizes = [
    { label: "Custom", value: "custom", width: 800, height: 600 },
    { label: "A4 (Portrait)", value: "a4-portrait", width: 595, height: 842 },
    { label: "A4 (Landscape)", value: "a4-landscape", width: 842, height: 595 },
    { label: "Letter", value: "letter", width: 612, height: 792 },
    { label: "Legal", value: "legal", width: 612, height: 1008 },
    { label: "Tabloid", value: "tabloid", width: 792, height: 1224 },
    { label: "1920x1080", value: "1080p", width: 1920, height: 1080 },
    { label: "1080x1080 (Square)", value: "square", width: 1080, height: 1080 },
  ];

  const addPage = () => {
    const selectedSize =
      pageSizes.find((size) => size.value === selectedPageSize) || pageSizes[0];
    const newPage = {
      id: pages.length + 1,
      name: `Artboard ${pages.length + 1}`,
      width: selectedSize.width,
      height: selectedSize.height,
      backgroundImage: null,
    };
    setPages([...pages, newPage]);
  };

  const handleImageUpload = (
    pageId: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setPages(
          pages.map((page) =>
            page.id === pageId ? { ...page, backgroundImage: imageUrl } : page,
          ),
        );
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 bg-[#2b2b2b] overflow-auto p-8 relative">
      {/* Top Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#404040] rounded-lg px-4 py-2 flex items-center gap-4 shadow-lg z-10">
        <label className="text-sm text-gray-400">Page Size:</label>
        <select
          value={selectedPageSize}
          onChange={(e) => setSelectedPageSize(e.target.value)}
          className="bg-[#262626] text-sm text-gray-300 outline-none border border-[#404040] rounded px-2 py-1"
        >
          {pageSizes.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>

        <div className="w-px h-4 bg-[#404040]" />

        <button
          onClick={addPage}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors bg-[#404040] hover:bg-[#4a4a4a] px-3 py-1 rounded"
        >
          <Plus className="w-4 h-4" />
          Add Page
        </button>
      </div>

      {/* Canvas Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#404040] rounded-lg px-4 py-2 flex items-center gap-4 shadow-lg z-10">
        <button className="text-sm text-gray-400 hover:text-white transition-colors">
          Fit to Screen
        </button>
        <div className="w-px h-4 bg-[#404040]" />
        <select className="bg-transparent text-sm text-gray-300 outline-none">
          <option>100%</option>
          <option>200%</option>
          <option>50%</option>
          <option>25%</option>
        </select>
      </div>

      {/* Artboards */}
      <div className="min-h-full flex flex-col items-center justify-start gap-16 py-16">
        {pages.map((page) => (
          <div key={page.id} className="relative">
            <div
              className="bg-white shadow-2xl relative"
              style={{ width: page.width, height: page.height }}
            >
              {/* Background Image */}
              {page.backgroundImage && (
                <img
                  src={page.backgroundImage}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Upload Area - shown when no image */}
              {!page.backgroundImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Upload className="w-12 h-12" />
                    <span className="text-sm">Click to upload design</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(page.id, e)}
                    />
                  </label>
                </div>
              )}

              {/* Upload Button - shown when image exists */}
              {page.backgroundImage && (
                <div className="absolute top-4 right-4">
                  <label className="cursor-pointer flex items-center gap-2 bg-[#1a1a1a]/80 hover:bg-[#1a1a1a] text-white px-3 py-2 rounded text-sm transition-colors">
                    <Upload className="w-4 h-4" />
                    Change
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(page.id, e)}
                    />
                  </label>
                </div>
              )}

              {/* Grid overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #000 1px, transparent 1px),
                    linear-gradient(to bottom, #000 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Artboard Label */}
              <div className="absolute -top-6 left-0 text-xs text-gray-400 flex items-center gap-2">
                <span>{page.name}</span>
                <span className="text-gray-600">
                  ({page.width} × {page.height}px)
                </span>
              </div>

              {/* Ruler markers - Top */}
              <div className="absolute -top-4 left-0 right-0 h-4 bg-[#323232] border-b border-[#1a1a1a] flex items-center text-[10px] text-gray-500 overflow-hidden">
                {Array.from({ length: Math.ceil(page.width / 50) + 1 }).map(
                  (_, i) => (
                    <div
                      key={i}
                      style={{ width: "50px" }}
                      className="text-center"
                    >
                      {i * 50}
                    </div>
                  ),
                )}
              </div>

              {/* Ruler markers - Left */}
              <div className="absolute -left-4 top-0 bottom-0 w-4 bg-[#323232] border-r border-[#1a1a1a] flex flex-col text-[10px] text-gray-500 overflow-hidden">
                {Array.from({ length: Math.ceil(page.height / 50) + 1 }).map(
                  (_, i) => (
                    <div
                      key={i}
                      style={{ height: "50px" }}
                      className="flex items-center justify-center"
                    >
                      <span className="transform -rotate-90 whitespace-nowrap">
                        {i * 50}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
