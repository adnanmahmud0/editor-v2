"use client";

import { Plus, Upload, Trash2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import * as fabric from "fabric";

const FabricCanvas = dynamic(() => import("./FabricCanvas"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white" />,
});

export function Canvas({ onCanvasActive }: { onCanvasActive?: (canvas: fabric.Canvas | null) => void }) {
  interface Page {
    id: number;
    name: string;
    width: number;
    height: number;
    backgroundImage: string | null;
    hasContent: boolean;
  }

  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const canvasRefs = useRef<Map<number, fabric.Canvas>>(new Map());

  const handleCanvasReady = (pageId: number, canvas: fabric.Canvas) => {
    canvasRefs.current.set(pageId, canvas);
    if (activePageId === pageId && onCanvasActive) {
        onCanvasActive(canvas);
    }
    
    // Also attach selection listeners to update active canvas if needed
    canvas.on('mouse:down', () => {
        if (activePageId !== pageId) {
            setActivePageId(pageId);
        }
        if (onCanvasActive) onCanvasActive(canvas);
    });
  };

  // Update active canvas when activePageId changes
  useEffect(() => {
    if (activePageId !== null) {
        const canvas = canvasRefs.current.get(activePageId);
        if (canvas && onCanvasActive) {
            onCanvasActive(canvas);
        }
    } else if (onCanvasActive) {
        onCanvasActive(null);
    }
  }, [activePageId, onCanvasActive]);


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
      id: Date.now(),
      name: `Artboard ${pages.length + 1}`,
      width: selectedSize.width,
      height: selectedSize.height,
      backgroundImage: null,
      hasContent: false,
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
  };

  const deletePage = (id: number) => {
    // Clean up canvas instance
    if (canvasRefs.current.has(id)) {
      canvasRefs.current.get(id)?.dispose();
      canvasRefs.current.delete(id);
    }
    setPages(pages.filter((page) => page.id !== id));
    if (activePageId === id) {
      setActivePageId(null);
    }
  };

  const handlePageSizeChange = (value: string) => {
    setSelectedPageSize(value);
    
    // If a page is active, update its size
    if (activePageId) {
      const selectedSize = pageSizes.find((size) => size.value === value);
      if (selectedSize && selectedSize.value !== "custom") {
        setPages(
          pages.map((page) =>
            page.id === activePageId
              ? { ...page, width: selectedSize.width, height: selectedSize.height }
              : page
          )
        );
      }
    }
  };

  const handleImageUpload = async (
    pageId: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "image/svg+xml" || file.type.includes("svg"))) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const svgContent = e.target?.result as string;
        const canvas = canvasRefs.current.get(pageId);
        
        if (canvas) {
          try {
            // Check if loadSVGFromURL or loadSVGFromString is available and how to use it in v7
            // Assuming loadSVGFromString returns a promise resolving to {objects, options} or similar
            // For v6/v7:
            const { objects, options } = await fabric.loadSVGFromString(svgContent);
            
            // Convert Text objects to IText for editing
            const editableObjects = objects.map(obj => {
                if (obj && obj.type === 'text') {
                    const textObj = obj as any;
                    // Exclude 'type' from options as it is read-only on the instance
                    const { type, ...options } = textObj.toObject();
                    // Ensure ID is preserved
                    if (textObj.id) options.id = textObj.id;
                    return new fabric.IText(textObj.text || '', options);
                }
                // Ensure subTargetCheck is true for groups to allow deep selection if needed
                if (obj && obj.type === 'group') {
                    (obj as any).subTargetCheck = true;
                }
                return obj;
            }).filter(obj => obj !== null && obj !== undefined) as fabric.Object[];

            // Create a temporary group to handle scaling and positioning
            const group = new fabric.Group(editableObjects, {
                interactive: true,
                subTargetCheck: true
            });
            
            // Scale to fit if too large
            const canvasWidth = canvas.width!;
            const canvasHeight = canvas.height!;
            const scaleX = (canvasWidth * 0.8) / group.width!;
            const scaleY = (canvasHeight * 0.8) / group.height!;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up if smaller
            
            group.scale(scale);
            
            // Center the content
             group.set({
               left: canvasWidth / 2,
               top: canvasHeight / 2,
               originX: 'center',
               originY: 'center'
             });
 
             canvas.add(group);
             canvas.setActiveObject(group);
             
             // Iteratively ungroup all groups to flatten the structure
             const flattenGroups = () => {
                 let attempts = 0;
                 const MAX_ATTEMPTS = 100; // Safety limit for complex SVGs
                 
                 // Start by ungrouping the main wrapper
                 if ((group as any).toActiveSelection) {
                     (group as any).toActiveSelection();
                     canvas.discardActiveObject();
                 }

                 // Loop until no groups remain or limit reached
                 while (attempts < MAX_ATTEMPTS) {
                     const allObjects = canvas.getObjects();
                     // Find a group that we haven't failed to ungroup yet
                     const groupToUngroup = allObjects.find(obj => obj.type === 'group') as fabric.Group;
                     
                     if (!groupToUngroup) break; // No more groups
                     
                     canvas.setActiveObject(groupToUngroup);
                    if ((groupToUngroup as any).toActiveSelection) {
                        (groupToUngroup as any).toActiveSelection();
                        canvas.discardActiveObject();
                    } else if ((groupToUngroup as any)._restoreObjectsState) {
                        // Fallback for when toActiveSelection is missing (Fabric v7 issues?)
                        // Use internal method to restore objects to canvas space
                        (groupToUngroup as any)._restoreObjectsState();
                        canvas.remove(groupToUngroup);
                        (groupToUngroup as any).getObjects().forEach((obj: any) => {
                            canvas.add(obj);
                            obj.setDirty(true);
                        });
                        canvas.requestRenderAll();
                    } else {
                        // If we can't ungroup it, we must break to avoid infinite loop
                        console.warn("Found a group that cannot be ungrouped", groupToUngroup);
                        // Try to force remove and re-add if possible, but without transform correction it's risky
                        // Just break to be safe
                        break;
                    }
                    attempts++;
                 }
                 
                 canvas.requestRenderAll();
             };

             flattenGroups();
             
             canvas.requestRenderAll();
             
             // Update page state to show we have content
             setPages(
              pages.map((page) =>
                page.id === pageId ? { ...page, hasContent: true } : page,
              ),
            );
          } catch (error) {
            console.error("Error loading SVG:", error);
          }
        }
      };
      reader.readAsText(file);
    } else if (file) {
      // Fallback for non-SVG images (load as image)
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        // Logic for regular images if needed, or just warn user
        // For now, let's just allow background image behavior as fallback or load Image object
        // But user specifically asked for SVG editing.
        // We will implement simple image loading onto canvas too.
        const canvas = canvasRefs.current.get(pageId);
        if (canvas) {
            const imgElement = new Image();
            imgElement.src = imageUrl;
            imgElement.onload = () => {
                const imgInstance = new fabric.Image(imgElement);
                 // Scale to fit
                if (imgInstance.width! > canvas.width! || imgInstance.height! > canvas.height!) {
                  imgInstance.scaleToWidth(canvas.width! * 0.8);
                }
                imgInstance.set({
                  left: canvas.width! / 2,
                  top: canvas.height! / 2,
                  originX: 'center',
                  originY: 'center'
                });
                canvas.add(imgInstance);
                canvas.renderAll();
                 setPages(
                  pages.map((page) =>
                    page.id === pageId ? { ...page, hasContent: true } : page,
                  ),
                );
            }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 bg-[#E8F1F8] overflow-auto p-8 relative">
      {/* Top Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-[#D1E1EF] rounded-lg px-4 py-2 flex items-center gap-4 shadow-lg z-10">
        <label className="text-sm text-slate-500">Page Size:</label>
        <select
          value={selectedPageSize}
          onChange={(e) => handlePageSizeChange(e.target.value)}
          className="bg-slate-50 text-sm text-slate-700 outline-none border border-[#D1E1EF] rounded px-2 py-1"
        >
          {pageSizes.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>

        <div className="w-px h-4 bg-[#D1E1EF]" />

        <button
          onClick={addPage}
          className="flex items-center gap-2 text-sm text-white hover:text-white transition-colors bg-[#1C75BC] hover:bg-[#1664a0] px-3 py-1 rounded"
        >
          <Plus className="w-4 h-4" />
          Add Page
        </button>
      </div>

      {/* Artboards */}
      <div className="min-h-full flex flex-col items-center justify-start gap-16 py-16">
        {pages.map((page) => (
          <div key={page.id} className="relative group/page">
            <div
              className={`bg-white shadow-2xl relative transition-shadow ${
                activePageId === page.id ? "ring-2 ring-[#1C75BC]" : ""
              }`}
              style={{ width: page.width, height: page.height }}
              onClick={() => setActivePageId(page.id)}
            >
              <FabricCanvas
                width={page.width}
                height={page.height}
                onCanvasReady={(canvas) => handleCanvasReady(page.id, canvas)}
              />

              {/* Upload Area - shown when no content */}
              {!page.hasContent && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="pointer-events-auto">
                    <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Upload className="w-12 h-12" />
                      <span className="text-sm">Click to upload SVG design</span>
                      <input
                        type="file"
                        accept=".svg,image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(page.id, e)}
                      />
                    </label>
                  </div>
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
              <div className="absolute -top-10 left-0 text-xs text-slate-500 font-medium flex items-center gap-2 z-50 bg-[#E8F1F8] px-2 py-1 rounded">
                <span>{page.name}</span>
                <span className="text-slate-400">
                  ({page.width} × {page.height}px)
                </span>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePage(page.id);
                }}
                className="absolute -top-10 right-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover/page:opacity-100 z-50 bg-white shadow-sm border border-slate-200"
                title="Delete Page"
              >
                <Trash2 className="w-4 h-4" />
              </button>

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
