"use client";

import {
  Plus,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Undo2,
  Redo2,
  FileUp,
  FileText,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import * as fabric from "fabric";
import { jsPDF } from "jspdf";

const FabricCanvas = dynamic(() => import("./FabricCanvas"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white" />,
});

export function Canvas({
  onCanvasActive,
}: {
  onCanvasActive?: (canvas: fabric.Canvas | null) => void;
}) {
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
  const [showCustomSizeModal, setShowCustomSizeModal] = useState(false);
  const [customWidth, setCustomWidth] = useState("800");
  const [customHeight, setCustomHeight] = useState("600");
  const canvasRefs = useRef<Map<number, fabric.Canvas>>(new Map());

  // History state
  const [historyState, setHistoryState] = useState<{
    history: Page[][];
    index: number;
  }>({
    history: [[]],
    index: 0,
  });

  const saveToHistory = useCallback((currentPages: Page[]) => {
    setHistoryState((prev) => {
      // Avoid duplicates
      const last = prev.history[prev.index];
      if (JSON.stringify(last) === JSON.stringify(currentPages)) return prev;

      const newHistory = prev.history.slice(0, prev.index + 1);
      newHistory.push(JSON.parse(JSON.stringify(currentPages)));
      
      // Limit history to 50 steps
      if (newHistory.length > 50) newHistory.shift();
      
      return {
        history: newHistory,
        index: newHistory.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index <= 0) return prev;
      const nextIndex = prev.index - 1;
      const previousPages = prev.history[nextIndex];
      
      setPages(previousPages);
      
      // Sync canvases
      setTimeout(() => {
        previousPages.forEach(async (pageData: any) => {
          const canvas = canvasRefs.current.get(pageData.id);
          if (canvas && pageData.canvasData) {
            await canvas.loadFromJSON(pageData.canvasData);
            canvas.requestRenderAll();
          }
        });
      }, 0);

      return { ...prev, index: nextIndex };
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index >= prev.history.length - 1) return prev;
      const nextIndex = prev.index + 1;
      const nextPages = prev.history[nextIndex];
      
      setPages(nextPages);
      
      // Sync canvases
      setTimeout(() => {
        nextPages.forEach(async (pageData: any) => {
          const canvas = canvasRefs.current.get(pageData.id);
          if (canvas && pageData.canvasData) {
            await canvas.loadFromJSON(pageData.canvasData);
            canvas.requestRenderAll();
          }
        });
      }, 0);

      return { ...prev, index: nextIndex };
    });
  }, []);
 
  const [clipboard, setClipboard] = useState<any>(null);

  const syncState = useCallback(() => {
    const currentPages = pages.map((page) => {
        const c = canvasRefs.current.get(page.id);
        return {
          ...page,
          canvasData: c ? (c as any).toJSON(['id', 'data']) : null,
        };
    });
    saveToHistory(currentPages);
  }, [pages, saveToHistory]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (activePageId === null) return;
    const canvas = canvasRefs.current.get(activePageId);
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    // Don't trigger shortcuts if user is typing in a text field
    const targetTag = (e.target as HTMLElement).tagName.toLowerCase();
    if (targetTag === "input" || targetTag === "textarea") return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          undo();
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 'd':
          e.preventDefault();
          // Duplicate logic
          activeObject.clone(['id', 'data']).then((cloned: any) => {
              canvas.discardActiveObject();
              cloned.set({
                  left: activeObject.left! + 10,
                  top: activeObject.top! + 10,
                  id: `id_${Date.now()}`
              });
              if (cloned.type === 'activeSelection') {
                  cloned.canvas = canvas;
                  cloned.forEachObject((inner: any) => canvas.add(inner));
                  cloned.setCoords();
              } else {
                  canvas.add(cloned);
              }
              canvas.setActiveObject(cloned);
              canvas.requestRenderAll();
              syncState();
          });
          break;
        case 'c':
          e.preventDefault();
          activeObject.clone(['id', 'data']).then((cloned: any) => {
              setClipboard(cloned);
          });
          break;
        case 'v':
          e.preventDefault();
          if (!clipboard) return;
          clipboard.clone(['id', 'data']).then((cloned: any) => {
              canvas.discardActiveObject();
              cloned.set({
                  left: (activeObject.left || 0) + 20,
                  top: (activeObject.top || 0) + 20,
                  evented: true,
                  id: `id_${Date.now()}`
              });
              if (cloned.type === 'activeSelection') {
                  cloned.canvas = canvas;
                  cloned.forEachObject((inner: any) => canvas.add(inner));
                  cloned.setCoords();
              } else {
                  canvas.add(cloned);
              }
              canvas.setActiveObject(cloned);
              canvas.requestRenderAll();
              syncState();
          });
          break;
        case 'g':
          e.preventDefault();
          if (e.shiftKey) {
              if (activeObject.type === 'group') {
                  (activeObject as any).toActiveSelection();
                  canvas.requestRenderAll();
                  syncState();
              }
          } else {
              const activeObjects = canvas.getActiveObjects();
              if (activeObjects.length > 1) {
                  const group = new fabric.Group(activeObjects, {
                      subTargetCheck: true
                  } as any);
                  (group as any).id = `id_${Date.now()}`;
                  activeObjects.forEach(obj => canvas.remove(obj));
                  canvas.add(group);
                  canvas.setActiveObject(group);
                  canvas.requestRenderAll();
                  syncState();
              }
          }
          break;
      }
    } else {
      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (activeObject && activeObject.type !== "textbox" || ! (activeObject as any).isEditing) {
              const activeObjects = canvas.getActiveObjects();
              canvas.discardActiveObject();
              activeObjects.forEach((obj) => canvas.remove(obj));
              canvas.requestRenderAll();
              syncState();
          }
          break;
      }
    }
  }, [activePageId, undo, redo, syncState, clipboard]);

  useEffect(() => {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);


  const handleCanvasReady = (pageId: number, canvas: fabric.Canvas) => {
    canvasRefs.current.set(pageId, canvas);

    // Attach a helper to update page size from within the canvas instance
    // This allows external tools (like ToolPalette) to trigger a resize of the page state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvas as any).updatePageSize = (width: number, height: number) => {
      setPages((prevPages) =>
        prevPages.map((p) => (p.id === pageId ? { ...p, width, height } : p)),
      );
    };

    if (activePageId === pageId && onCanvasActive) {
      onCanvasActive(canvas);
    }

    // Also attach selection listeners to update active canvas if needed
    canvas.on("mouse:down", () => {
      if (activePageId !== pageId) {
        setActivePageId(pageId);
      }
      if (onCanvasActive) onCanvasActive(canvas);
    });

    // Handle Textbox resizing (reflow instead of scale)
    canvas.on("object:scaling", (e) => {
      const target = e.target;
      if (!target) return;

      if (target.type === "textbox") {
        const textbox = target as fabric.Textbox;
        // Only reflow if scaling horizontally via side controls
        // Fabric uses transform.action to indicate which control is being used, but it's internal
        // However, we can just check if scaleX changed and update width, then reset scaleX

        // Standard "reflow" behavior:

        // If scaleX changed significantly but scaleY didn't (indicating side pull likely)
        // Or just always force width update for Textbox?
        // Usually we want to allow font scaling via corner controls, and reflow via side controls.
        // But distinguishing them in 'object:scaling' is tricky without checking which control was clicked.
        // Fabric v6 exposes 'transform' object in the event or on canvas.

        // Let's assume user wants reflow on width change.
        // We can update width and reset scaleX.

        const transform = (canvas as any)._currentTransform;
        if (!transform) return;

        const sX = textbox.scaleX || 1;

        if (transform.corner === "mr" || transform.corner === "ml") {
          // Side scaling -> Update width only (reflow)
          const newWidth = textbox.width! * sX;
          textbox.set({
            width: newWidth,
            scaleX: 1,
          });
        } else if (
          transform.corner === "tl" ||
          transform.corner === "tr" ||
          transform.corner === "bl" ||
          transform.corner === "br"
        ) {
          // Corner scaling -> Update font size (prevent distortion)
          const newFontSize = Math.round(textbox.fontSize! * sX);
          // Also update width proportionally to maintain aspect ratio during scaling
          const newWidth = textbox.width! * sX;
          textbox.set({
            fontSize: newFontSize,
            width: newWidth,
            scaleX: 1,
            scaleY: 1,
          });
        }
      }
    });

    // Smart Guides (Center Snapping)
    const guidelines: fabric.Line[] = [];

    const clearGuidelines = () => {

      guidelines.forEach((line) => canvas.remove(line));
      guidelines.length = 0;
      canvas.requestRenderAll();
    };


    canvas.on("object:modified", syncState);
    canvas.on("object:added", syncState);
    canvas.on("object:removed", syncState);

    canvas.on("mouse:up", () => {
        clearGuidelines();
        syncState();
    });

    canvas.on("object:moving", (opt) => {
      const obj = opt.target;
      if (!obj) return;

      const canvasWidth = canvas.width!;
      const canvasHeight = canvas.height!;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const threshold = 10;

      // Clear previous guidelines but don't render yet
      guidelines.forEach((line) => canvas.remove(line));
      guidelines.length = 0;

      let snappedX = false;
      let snappedY = false;

      const objCenter = obj.getCenterPoint();

      // Snap to Vertical Center (X axis)
      if (Math.abs(objCenter.x - centerX) < threshold) {
        obj.setPositionByOrigin(
          new fabric.Point(centerX, objCenter.y),
          "center",
          "center",
        );
        snappedX = true;

        const line = new fabric.Line([centerX, 0, centerX, canvasHeight], {
          stroke: "#ff0077",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          strokeDashArray: [4, 4],
          opacity: 0.8,
        });
        canvas.add(line);
        guidelines.push(line);
      }

      // Snap to Horizontal Center (Y axis)
      if (Math.abs(objCenter.y - centerY) < threshold) {
        const currentCenter = obj.getCenterPoint();
        obj.setPositionByOrigin(
          new fabric.Point(currentCenter.x, centerY),
          "center",
          "center",
        );
        snappedY = true;

        const line = new fabric.Line([0, centerY, canvasWidth, centerY], {
          stroke: "#ff0077",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          strokeDashArray: [4, 4],
          opacity: 0.8,
        });
        canvas.add(line);
        guidelines.push(line);
      }

      if (snappedX || snappedY) {
        canvas.requestRenderAll();
      }
    });




    // Custom selection logic for Groups:
    // - Single click (detail === 1): Select the parent Group
    // - Double click (detail === 2): Select the specific Child (Fabric handles this if subTargetCheck=true)
    canvas.on("mouse:down", (opt) => {
      const evt = opt.e as MouseEvent;
      const target = opt.target;

      // Check if we clicked an object that is part of a group
      if (target && target.group) {
        // If it's a single click, force selection of the group
        if (evt.detail === 1) {
          // If the group is already the active object, don't re-select it
          // This allows default interactions (like scaling/rotating via controls) to work
          const activeObject = canvas.getActiveObject();
          if (activeObject === target.group || activeObject === target) {
            return;
          }

          canvas.setActiveObject(target.group);
          canvas.requestRenderAll();
        }
        // If it's a double click (detail === 2), we let Fabric select the child
        // (which it does because we set subTargetCheck: true on the group)
      }
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

  const [zoom, setZoom] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState("custom");

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.1));
  const handleResetZoom = () => setZoom(1);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY;
      if (delta > 0) {
        handleZoomOut();
      } else {
        handleZoomIn();
      }
    }
  };

  const handleExport = () => {
    // 1. Gather all pages and their canvas data
    const projectData = {
      pages: pages.map((page) => {
        const canvas = canvasRefs.current.get(page.id);
        return {
          ...page,
          canvasData: canvas ? canvas.toJSON() : null,
        };
      }),
      version: "1.0.0",
      timestamp: Date.now(),
    };

    // 2. Convert to JSON string
    const jsonString = JSON.stringify(projectData, null, 2);

    // 3. Create a blob and download link
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const projectData = JSON.parse(jsonContent);

        if (!projectData.pages || !Array.isArray(projectData.pages)) {
          alert("Invalid project file format");
          return;
        }

        // 1. Restore pages state
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newPages = projectData.pages.map((p: any) => ({
          id: p.id,
          name: p.name,
          width: p.width,
          height: p.height,
          backgroundImage: p.backgroundImage,
          hasContent: p.hasContent,
        }));
        setPages(newPages);

        if (newPages.length > 0) {
          setActivePageId(newPages[0].id);
        } else {
          setActivePageId(null);
        }

        // 2. We need to wait for React to render the new canvases (via updated pages state)
        // This is tricky because we need the refs to be populated.
        // A simple timeout might work, or we can use a "pendingImport" state.
        // For simplicity, let's use a small timeout to allow effects to run.
        setTimeout(async () => {
          for (const pageData of projectData.pages) {
            const canvas = canvasRefs.current.get(pageData.id);
            if (canvas && pageData.canvasData) {
              await canvas.loadFromJSON(pageData.canvasData);
              canvas.requestRenderAll();
            }
          }
        }, 100);
      } catch (error) {
        console.error("Error importing project:", error);
        alert("Failed to import project");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleDownloadPDF = async () => {
    if (pages.length === 0) return;

    // Initialize PDF with the dimensions of the first page
    // (Assuming all pages are same size for now, or we can change size per page)
    // jsPDF uses mm by default, but we can pass points (pt) or pixels (px).
    // Let's use points which are 1/72 inch. Fabric pixels are usually 96dpi or 72dpi depending on context.
    // Ideally we match the pixel dimensions 1:1.
    const firstPage = pages[0];
    const pdf = new jsPDF({
      orientation:
        firstPage.width > firstPage.height ? "landscape" : "portrait",
      unit: "px",
      format: [firstPage.width, firstPage.height],
    });

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const canvas = canvasRefs.current.get(page.id);

      if (canvas) {
        // Temporarily clear selection for clean export
        const activeObject = canvas.getActiveObject();
        canvas.discardActiveObject();
        canvas.requestRenderAll();

        // 1. Calculate Bleed Margin and Gaps
        const bleedMm = 5;
        const gapMm = 2; // Offset mark from design corner
        const ptPerMm = 72 / 25.4;
        const bleedPt = bleedMm * ptPerMm;
        const gapPt = gapMm * ptPerMm;
        const finalWidth = page.width + bleedPt * 2;
        const finalHeight = page.height + bleedPt * 2;

        // Correct page adding logic with bleed size
        if (i === 0) {
            // Re-initialize first page with bleed
            pdf.deletePage(1);
        }
        pdf.addPage([finalWidth, finalHeight], page.width > page.height ? "landscape" : "portrait");

        // Convert to high-res image
        const dataUrl = canvas.toDataURL({
          format: "png",
          quality: 1,
          multiplier: 4, 
        });

        // 2. Add artboard image centered on the larger page
        pdf.addImage(dataUrl, "PNG", bleedPt, bleedPt, page.width, page.height);

        // 3. Black Cut Marks (Crop Marks) with 2mm GAP
        pdf.setDrawColor(0, 0, 0); // Black
        pdf.setLineWidth(1);

        // Top Left
        pdf.line(bleedPt, 0, bleedPt, bleedPt - gapPt); 
        pdf.line(0, bleedPt, bleedPt - gapPt, bleedPt);

        // Top Right
        pdf.line(finalWidth - bleedPt, 0, finalWidth - bleedPt, bleedPt - gapPt);
        pdf.line(finalWidth, bleedPt, finalWidth - bleedPt + gapPt, bleedPt);

        // Bottom Left
        pdf.line(bleedPt, finalHeight, bleedPt, finalHeight - bleedPt + gapPt);
        pdf.line(0, finalHeight - bleedPt, bleedPt - gapPt, finalHeight - bleedPt);

        // Bottom Right
        pdf.line(finalWidth - bleedPt, finalHeight, finalWidth - bleedPt, finalHeight - bleedPt + gapPt);
        pdf.line(finalWidth, finalHeight - bleedPt, finalWidth - bleedPt + gapPt, finalHeight - bleedPt);

        // Restore selection
        if (activeObject) {
          canvas.setActiveObject(activeObject);
          canvas.requestRenderAll();
        }
      }
    }

    pdf.save(`project-${Date.now()}.pdf`);
  };

  const pageSizes = [
    { label: "Custom", value: "custom", width: 800, height: 600 },
    { label: "A5 (Portrait)", value: "a5-portrait", width: 419.5, height: 595.3 },
    { label: "A5 (Landscape)", value: "a5-landscape", width: 595.3, height: 419.5 },
    { label: "A4 (Portrait)", value: "a4-portrait", width: 595.3, height: 841.9 },
    { label: "A4 (Landscape)", value: "a4-landscape", width: 841.9, height: 595.3 },
    { label: "A3 (Portrait)", value: "a3-portrait", width: 841.9, height: 1190.6 },
    { label: "A3 (Landscape)", value: "a3-landscape", width: 1190.6, height: 841.9 },
    { label: "Letter", value: "letter", width: 612, height: 792 },
    { label: "Legal", value: "legal", width: 612, height: 1008 },
    { label: "Tabloid", value: "tabloid", width: 792, height: 1224 },
    { label: "1920x1080", value: "1080p", width: 1920, height: 1080 },
    { label: "1080x1080 (Square)", value: "square", width: 1080, height: 1080 },
  ];

  const addPage = () => {
    if (selectedPageSize === "custom") {
      setShowCustomSizeModal(true);
      return;
    }

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

  const handleCustomSizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const width = parseInt(customWidth) || 800;
    const height = parseInt(customHeight) || 600;

    const newPage = {
      id: Date.now(),
      name: `Artboard ${pages.length + 1}`,
      width: width,
      height: height,
      backgroundImage: null,
      hasContent: false,
    };

    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    setShowCustomSizeModal(false);
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
              ? {
                  ...page,
                  width: selectedSize.width,
                  height: selectedSize.height,
                }
              : page,
          ),
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
            const { objects, options: _options } =
              await fabric.loadSVGFromString(svgContent);

            console.log(_options); // Suppress unused warning

            // Convert Text objects to Textbox for editing and better wrapping support
            const editableObjects = objects
              .map((obj) => {
                if (obj && (obj.type === "text" || obj.type === "i-text")) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const textObj = obj as any;
                  // Exclude 'type' from options as it is read-only on the instance
                  const { type: _type, ...options } = textObj.toObject();
                  console.log(_type); // Suppress unused warning
                  // Ensure ID is preserved
                  if (textObj.id) options.id = textObj.id;

                  // Use Textbox instead of IText/Text
                  // This allows wrapping (areatext) and better editing
                  return new fabric.Textbox(textObj.text || "", {
                    ...options,
                    width: textObj.width, // Preserve original width
                    splitByGrapheme: false,
                  });
                }
                // Ensure subTargetCheck is true for groups to allow deep selection if needed
                if (obj && obj.type === "group") {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (obj as any).subTargetCheck = true;
                }
                return obj;
              })
              .filter(
                (obj) => obj !== null && obj !== undefined,
              ) as fabric.Object[];

            // Create a temporary group to handle scaling and positioning
            const group = new fabric.Group(editableObjects, {
              interactive: true,
              subTargetCheck: true,
            });

            // Use SVG dimensions if available to update canvas size
            // Parse dimensions as they might be strings (e.g., "500px")
            const svgWidth =
              typeof _options.width === "number"
                ? _options.width
                : parseFloat(_options.width) || group.width || 800;
            const svgHeight =
              typeof _options.height === "number"
                ? _options.height
                : parseFloat(_options.height) || group.height || 600;

            // Update page state to show we have content and update dimensions
            setPages(
              pages.map((page) =>
                page.id === pageId
                  ? {
                      ...page,
                      hasContent: true,
                      width: svgWidth,
                      height: svgHeight,
                    }
                  : page,
              ),
            );

            // Position the content in the center of the new dimensions
            group.set({
              left: svgWidth / 2,
              top: svgHeight / 2,
              originX: "center",
              originY: "center",
            });

            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.requestRenderAll();
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
            if (
              imgInstance.width! > canvas.width! ||
              imgInstance.height! > canvas.height!
            ) {
              imgInstance.scaleToWidth(canvas.width! * 0.8);
            }
            imgInstance.set({
              left: canvas.width! / 2,
              top: canvas.height! / 2,
              originX: "center",
              originY: "center",
            });
            canvas.add(imgInstance);
            canvas.renderAll();
            setPages(
              pages.map((page) =>
                page.id === pageId ? { ...page, hasContent: true } : page,
              ),
            );
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 bg-[#E8F1F8] overflow-hidden relative flex flex-col">
      {/* Top Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-[#D1E1EF] rounded-lg px-4 py-2 flex items-center gap-4 shadow-lg z-10">
        <div className="flex items-center gap-2 border-r border-[#D1E1EF] pr-4 mr-2">
          <button
            onClick={undo}
            disabled={historyState.index <= 0}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyState.index >= historyState.history.length - 1}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#D1E1EF] mx-2" />
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-slate-100 rounded text-slate-600"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-slate-100 rounded text-slate-600"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 ml-2"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>


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

        <div className="w-px h-4 bg-[#D1E1EF]" />

        {/* Export / Import Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#1C75BC] hover:bg-slate-50 px-2 py-1 rounded transition-colors"
            title="Export Project JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#1C75BC] hover:bg-slate-50 px-2 py-1 rounded transition-colors cursor-pointer">
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImport}
            />
          </label>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            title="Download as PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Artboards */}
      <div className="flex-1 overflow-auto p-8" onWheel={handleWheel}>
        <div
          className="min-h-full flex flex-col items-center justify-start gap-16 py-16 origin-top transition-transform duration-200 ease-out"
        >
          {pages.map((page) => (
            <div key={page.id} className="relative group/page">
              <div
                className={`bg-white shadow-2xl relative transition-shadow ${
                  activePageId === page.id ? "ring-2 ring-[#1C75BC]" : ""
                }`}
                style={{ width: page.width * zoom, height: page.height * zoom }}
                onClick={() => setActivePageId(page.id)}
              >
                <FabricCanvas
                  width={page.width}
                  height={page.height}
                  zoom={zoom}
                  onCanvasReady={(canvas) => handleCanvasReady(page.id, canvas)}
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Size Modal */}
      {showCustomSizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Custom Canvas Size
            </h3>
            <form onSubmit={handleCustomSizeSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C75BC] focus:border-transparent"
                    placeholder="e.g. 800"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C75BC] focus:border-transparent"
                    placeholder="e.g. 600"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCustomSizeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1C75BC] hover:bg-[#155a8e] rounded-md transition-colors shadow-sm"
                >
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
