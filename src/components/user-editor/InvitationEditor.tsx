/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Type,
  Image,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  AlignLeft,
  AlignRight,
  AlignStartVertical as AlignTop,
  AlignCenterVertical as AlignMiddle,
  AlignEndVertical as AlignBottom,
  AlignCenterHorizontal as CenterHorizontal,
  BringToFront,
  SendToBack,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
  Palette,
  Square,
  Circle,
  Triangle as TriangleIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlignCenter,
  AlignJustify,
  Grid3X3 as CenterIcon,
  X,
  Sun,
  Minus,
} from "lucide-react";

import * as fabric from "fabric";
import { useDraggable } from "@/hooks/use-draggable";
import { ImageEditModal } from "./ImageEditModal";
import { ImageElement, TextElement, ShapeElement, Page } from "./typs";
import { PageCanvas } from "./PageCanvas";
import { TextEditModal } from "./TextEditModal";
import { CloudUploadModal } from "./CloudUploadModal";

export function InvitationEditor() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [canvasInstances, setCanvasInstances] = useState<
    Record<number, fabric.Canvas>
  >({});
  const [editingText, setEditingText] = useState<TextElement | null>(null);
  const [editingImage, setEditingImage] = useState<ImageElement | null>(null);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [elementPosition, setElementPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [historyState, setHistoryState] = useState({
    history: [] as string[],
    index: -1,
  });
  const isUndoRedoAction = useRef(false);
  const [clipboard, setClipboard] = useState<any[] | null>(null);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);


  const { position: sideToolsPos, onMouseDown: handleSideToolsDrag } = useDraggable(
    typeof window !== 'undefined' ? (window.innerWidth / 2 + 405) : 1100,
    typeof window !== 'undefined' ? (window.innerHeight / 2 - 200) : 120
  );



  const handleCopy = () => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    const idsToCopy = activeObjects
      .map((obj) => (obj as any).id || (obj.get && (obj.get as any)("id")))
      .filter((id) => id && id !== "unknown");

    if (idsToCopy.length === 0) return;

    // Find the elements in state corresponding to these IDs
    const currentPageData = pages.find((p) => p.id === currentPage);
    if (!currentPageData) return;

    const elementsToCopy = (currentPageData.elements || []).filter((el: any) =>
      idsToCopy.includes(el.id),
    );

    if (elementsToCopy.length > 0) {
      setClipboard(JSON.parse(JSON.stringify(elementsToCopy)));
    }
  };

  const handlePaste = () => {
    if (!clipboard || clipboard.length === 0) return;

    const currentPageData = pages.find((p) => p.id === currentPage);
    if (!currentPageData) return;

    const canvasWidth = currentPageData.width || 794;
    const canvasHeight = currentPageData.height || 1123;

    // Calculate group center of clipboard items to align with canvas center
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    clipboard.forEach((el: any) => {
      minX = Math.min(minX, el.left || 0);
      minY = Math.min(minY, el.top || 0);
      maxX = Math.max(maxX, (el.left || 0) + (el.width || 50));
      maxY = Math.max(maxY, (el.top || 0) + (el.height || 50));
    });

    const clipboardCenterX = (minX + maxX) / 2;
    const clipboardCenterY = (minY + maxY) / 2;

    const offsetX = canvasWidth / 2 - clipboardCenterX;
    const offsetY = canvasHeight / 2 - clipboardCenterY;

    setPages((prevPages) => {
      const updated = prevPages.map((p) => {
        if (p.id !== currentPage) return p;

        const newElements = clipboard.map((el) => {
          return {
            ...el,
            id: `${el.type || "element"}-${Math.random().toString(36).substr(2, 9)}`,
            left: (el.left || 0) + offsetX,
            top: (el.top || 0) + offsetY,
          };
        });

        return {
          ...p,
          elements: [...(p.elements || []), ...newElements],
        };
      });
      saveToHistory(updated);
      return updated;
    });
  };

  const handleDuplicate = () => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) return;

    activeObjects.forEach((obj: any) => {
        obj.clone((cloned: any) => {
            canvas.discardActiveObject();
            cloned.set({
                left: obj.left + 15,
                top: obj.top + 15,
                id: `id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
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
            
            const serialized = (cloned as any).toObject(['id', 'data', 'selectable', 'evented']);
            setPages((prevPages) => {
                const updated = prevPages.map((p) => {
                  if (p.id !== currentPage) return p;
                  return { ...p, elements: [...p.elements, serialized] };
                });
                saveToHistory(updated);
                return updated;
            });
        });
    });
  };

  const handleElementOpacityChange = (value: number) => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) return;

    activeObjects.forEach((obj: any) => { obj.set({ opacity: value }); });
    canvas.requestRenderAll();

    const ids = activeObjects.map((obj: any) => obj.id).filter(id => id);
    setPages((prevPages) => {
      const updated = prevPages.map((p) => {
        if (p.id !== currentPage) return p;
        return {
          ...p,
          elements: p.elements.map((el: any) => {
            if (ids.includes(el.id)) return { ...el, opacity: value };
            return el;
          }),
        };
      });
      saveToHistory(updated);
      return updated;
    });
  };

  const handleCanvasReady = useCallback((pageId: number, canvas: fabric.Canvas) => {

    setCanvasInstances((prev) => {
      // Avoid unnecessary state updates if it's already there
      if (prev[pageId] === canvas) return prev;
      return { ...prev, [pageId]: canvas };
    });

    canvas.off("object:modified");
    canvas.on("object:modified", (e) => {
      const target = e.target as any;
      if (!target) return;

      if (
        target.type === "text" ||
        target.type === "iText" ||
        target.type === "textbox"
      ) {
        const currentFontSize = target.fontSize || 16;
        const sx = target.scaleX || 1;
        const sy = target.scaleY || 1;

        if (sx !== 1 || sy !== 1) {
          const effectiveFontSize = currentFontSize * sx;
          target.set({
            fontSize: effectiveFontSize,
            scaleX: 1,
            scaleY: 1,
          });
          target.setCoords();
        }
      }

      if (target && target.id) {
        setPages((prevPages) => {
          const updated = prevPages.map((pageItem) => {
            if (pageItem.id !== pageId) return pageItem;
            return {
              ...pageItem,
              elements: (pageItem.elements || []).map((el: any) => {
                if (el.id !== target.id) return el;
                return {
                  ...el,
                  left: target.left,
                  top: target.top,
                  scaleX: target.scaleX,
                  scaleY: target.scaleY,
                  rotation: target.angle,
                  ...(el.type === "text"
                    ? {
                        content: target.text,
                        color: target.fill as string,
                        fontSize: target.fontSize,
                        fontFamily: target.fontFamily,
                        bold: target.fontWeight === "bold",
                        italic: target.fontStyle === "italic",
                        underline: target.underline,
                        align: target.textAlign,
                        lineHeight: target.lineHeight,
                        charSpacing: target.charSpacing,
                      }
                    : el.type === "image"
                      ? {
                          width: target.width * target.scaleX,
                          height: target.height * target.scaleY,
                          scaleX: target.scaleX,
                          scaleY: target.scaleY,
                          url:
                            target.getSrc?.() ||
                            target._element?.src ||
                            el.url,
                        }
                      : el.type === "shape"
                        ? {
                            fill: target.fill as string,
                          }
                        : {}),

                };
              }),
            };
          });
          // Note: we'll call saveToHistory in an effect or another pattern if needed,
          // but for direct canvas interactions, let's keep it here for now.
          return updated;
        });
      }
    });

    canvas.off("object:added");
    canvas.on("object:added", (e) => {
      const target = e.target as any;
      if (target && target.id) {
        // Handle added objects if necessary (e.g. from Paste)
      }
    });

    canvas.off("mouse:dblclick");
    canvas.on("mouse:dblclick", (e) => {
      const target = e.target as any;
      if (target && (target.type === "text" || target.type === "textbox" || target.type === "iText")) {
        const textElement: TextElement = {
            id: target.id,
            content: target.text,
            type: "text",
            left: target.left,
            top: target.top,
            fontSize: target.fontSize,
            fontFamily: target.fontFamily,
            color: target.fill as string,
            bold: target.fontWeight === "bold",
            italic: target.fontStyle === "italic",
            underline: target.underline,
            align: target.textAlign,
            lineHeight: target.lineHeight,
            rotation: target.angle,
        };
        const rect = target.getBoundingRect(true);
        setElementPosition({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        });
        setEditingText(textElement);
      } else if (target && target.type === "image") {
        const imageElement: ImageElement = {
            id: target.id,
            type: "image",
            url: target.getSrc?.() || target._element?.src || "",
            left: target.left,
            top: target.top,
            width: target.width * target.scaleX,
            height: target.height * target.scaleY,
            scaleX: target.scaleX,
            scaleY: target.scaleY,
            rotation: target.angle,
            brightness: target.brightness || 100,
            contrast: target.contrast || 100,
            saturation: target.saturation || 100
        };
        const rect = target.getBoundingRect(true);
        setElementPosition({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        });
        setEditingImage(imageElement);
      }
    });
  }, [pages]);

  const saveToHistory = (newPages: any[]) => {
    if (isUndoRedoAction.current) return;

    const pagesJson = JSON.stringify(newPages);
    
    setHistoryState((prev) => {
      // Avoid double save if nothing changed
      if (prev.history[prev.index] === pagesJson) return prev;

      const newHistory = prev.history.slice(0, prev.index + 1);
      newHistory.push(pagesJson);
      
      // Limit history to 50 steps
      const finalHistory = newHistory.length > 50 ? newHistory.slice(1) : newHistory;
      
      return {
        history: finalHistory,
        index: finalHistory.length - 1,
      };
    });
  };

  const undo = () => {
    setHistoryState((prev) => {
      if (prev.index <= 0) return prev;
      
      isUndoRedoAction.current = true;
      const newIndex = prev.index - 1;
      const prevPages = JSON.parse(prev.history[newIndex]);
      
      setPages(prevPages);
      
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 100);

      return { ...prev, index: newIndex };
    });
  };

  const redo = () => {
    setHistoryState((prev) => {
      if (prev.index >= prev.history.length - 1) return prev;
      
      isUndoRedoAction.current = true;
      const newIndex = prev.index + 1;
      const nextPages = JSON.parse(prev.history[newIndex]);
      
      setPages(nextPages);
      
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 100);

      return { ...prev, index: newIndex };
    });
  };

  const handleBackgroundColorChange = (color: string) => {
    setPages((prevPages) => {
      const updated = prevPages.map((p) => {
        if (p.id !== currentPage) return p;
        return {
          ...p,
          backgroundColor: color,
        };
      });
      saveToHistory(updated);
      return updated;
    });
  };

  const handleAddShape = (shapeType: 'rect' | 'circle' | 'triangle') => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    let shape: fabric.FabricObject;
    const commonProps = {
      left: 100,
      top: 100,
      fill: "#3b82f6",
      id: `shape-${Date.now()}`,
    };

    if (shapeType === 'rect') {
      shape = new fabric.Rect({
        ...commonProps,
        width: 100,
        height: 100,
      });
    } else if (shapeType === 'circle') {
      shape = new fabric.Circle({
        ...commonProps,
        radius: 50,
      });
    } else {
      shape = new fabric.Triangle({
        ...commonProps,
        width: 100,
        height: 100,
      });
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();

    const newShape: ShapeElement = {
      id: (shape as any).id,
      type: 'shape',
      shapeType,
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: "#3b82f6",
      rotation: 0,
    };

    const updated = pages.map((p) => {
      if (p.id === currentPage) {
        return {
          ...p,
          elements: [...(p.elements || []), newShape],
        };
      }
      return p;
    });
    setPages(updated);
    saveToHistory(updated);
  };

  const handleElementColorChange = (color: string) => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    activeObjects.forEach((obj: any) => {
      obj.set({ fill: color });
    });
    canvas.renderAll();

    const idsToUpdate = activeObjects.map((obj: any) => obj.id).filter(id => id && id !== "unknown");

    setPages((prevPages) => {
      const updated = prevPages.map((p) => {
        if (p.id !== currentPage) return p;
        return {
          ...p,
          elements: (p.elements || []).map((el: any) => {
            if (idsToUpdate.includes(el.id)) {
              return { ...el, color: color, fill: color };
            }
            return el;
          }),
        };
      });
      saveToHistory(updated);
      return updated;
    });
  };

  const handleAddPage = () => {
    const newId = pages.length > 0 ? Math.max(...pages.map(p => p.id)) + 1 : 1;
    const firstPage = pages[0] || {};
    const newPage = {
      id: newId,
      elements: [],
      backgroundColor: "#ffffff",
      width: firstPage.width || 794,
      height: firstPage.height || 1123,
    };
    const updated = [...pages, newPage];
    setPages(updated);
    setCurrentPage(newId);
    saveToHistory(updated);
  };


  const handleRemovePage = (id: number) => {
    if (pages.length <= 1) return;
    const updated = pages.filter(p => p.id !== id);
    setPages(updated);
    if (currentPage === id) {
      setCurrentPage(updated[0].id);
    }
    saveToHistory(updated);
  };

  const handleMovePage = (id: number, direction: 'left' | 'right') => {
    const index = pages.findIndex(p => p.id === id);
    if (direction === 'left' && index > 0) {
      const updated = [...pages];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      setPages(updated);
      saveToHistory(updated);
    } else if (direction === 'right' && index < pages.length - 1) {
      const updated = [...pages];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      setPages(updated);
      saveToHistory(updated);
    }
  };

  const handleToggleVisibility = () => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) return;

    const idsToToggle = activeObjects
      .map((obj) => (obj as any).id || (obj.get && obj.get("id")))
      .filter((id) => id && id !== "unknown");
    if (idsToToggle.length === 0) return;

    setPages((prevPages) => {
      const updated = prevPages.map((p) => {
        if (p.id !== currentPage) return p;

        const updatedElements = (p.elements || []).map((el: any) => {
          if (idsToToggle.includes(el.id)) {
            const newVisible = el.visible === false ? true : false;

            // Update the fabric object directly as well for immediate feedback
            const fabObj = canvas
              .getObjects()
              .find(
                (o) =>
                  (o as any).id === el.id || (o.get && o.get("id") === el.id),
              );
            if (fabObj) {
              fabObj.set("visible", newVisible);
              if (!newVisible) {
                canvas.discardActiveObject();
              }
            }

            return { ...el, visible: newVisible };
          }
          return el;
        });

        return { ...p, elements: updatedElements };
      });
      saveToHistory(updated);
      return updated;
    });

    canvas.renderAll();
  };

  const handleDelete = () => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) return;

    // Helper to gather all IDs from objects and their children (for groups)
    const getAllIds = (objs: any[]): string[] => {
      let ids: string[] = [];
      objs.forEach((obj) => {
        const id = (obj as any).id || (obj.get && obj.get("id"));
        if (id && id !== "unknown") {
          ids.push(id);
        }

        // Check for nested objects in groups
        const nestedObjects =
          obj._objects || (obj.getObjects && obj.getObjects());
        if (nestedObjects && nestedObjects.length > 0) {
          ids = [...ids, ...getAllIds(nestedObjects)];
        }
      });
      return ids;
    };

    const idsToRemove = getAllIds(activeObjects);
    if (idsToRemove.length === 0) return;

    // 1. Remove from Fabric canvas first
    activeObjects.forEach((obj) => {
      canvas.remove(obj);
    });

    canvas.discardActiveObject();
    canvas.renderAll();

    // 2. Capture the new canvas state as JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newCanvasJson = (canvas as any).toJSON(["id"]);

    // 3. Update React state for pages
    setPages((prevPages) => {
      const updated = prevPages.map((p) => {
        if (p.id !== currentPage) return p;

        // Filter out elements that were removed
        const filteredElements = (p.elements || []).filter((el: any) => {
          return !idsToRemove.includes(el.id);
        });

        return {
          ...p,
          elements: filteredElements,
          canvasData: newCanvasJson,
        };
      });
      saveToHistory(updated);
      return updated;
    });

    // 4. Update other state
    setSelectedElement(null);
    setElementPosition(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        handleToggleVisibility();
      }

      // Copy/Paste shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          handleCopy();
        } else if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          handlePaste();
        }
      }

      // Undo/Redo shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        } else if (e.key === "y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, canvasInstances, historyState, clipboard, pages]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      // If a modal is open, we don't want to deselect anything from the global click
      // as the interaction is occurring with the modal.
      if (editingText || editingImage) return;

      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        // Click was outside the editor container
        const canvas = canvasInstances[currentPage];
        if (canvas && !(canvas as any).destroyed) {
          canvas.discardActiveObject();
          canvas.renderAll();
        }
        setSelectedElement(null);
        setElementPosition(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [currentPage, canvasInstances, editingText, editingImage]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch("/project/project.json");
        const data = await response.json();
        if (data.pages) {
          // Initialize elements array for each page from canvasData if elements don't exist
          const initializedPages = data.pages.map((p: any) => {
            if (!p.elements && p.canvasData && p.canvasData.objects) {
              const elements: any[] = [];

                  // Helper to extract editable elements from canvas objects
                  const extractElements = (objects: any[], parentId?: string) => {
                    objects.forEach((obj: any, index: number) => {
                      const type = obj.type?.toLowerCase();

                      // Ensure EVERY object has a STABLE ID in the JSON
                      if (!obj.id) {
                        obj.id = parentId ? `${parentId}-${index}` : `obj-${index}`;
                      }
                      const id = obj.id;

                  // Add ALL objects to the elements list to track them in state
                  if (
                    type === "text" ||
                    type === "itext" ||
                    type === "textbox"
                  ) {
                    elements.push({
                      id: id,
                      type: "text",
                      content: obj.text || "",
                      left: obj.left,
                      top: obj.top,
                      fontSize: obj.fontSize,
                      fontFamily: obj.fontFamily,
                      color: obj.fill,
                      bold: obj.fontWeight === "bold",
                      italic: obj.fontStyle === "italic",
                      underline: obj.underline,
                      align: obj.textAlign || "left",
                    });
                  } else if (type === "image") {
                    elements.push({
                      id: id,
                      type: "image",
                      url: obj.src || "",
                      left: obj.left,
                      top: obj.top,
                      width: obj.width * (obj.scaleX || 1),
                      height: obj.height * (obj.scaleY || 1),
                      rotation: obj.angle || 0,
                      brightness: 100,
                      contrast: 100,
                      saturation: 100,
                    });
                  } else if (type === "group") {
                    // Add the group itself to elements to track it
                    elements.push({
                      id: id,
                      type: "group",
                      left: obj.left,
                      top: obj.top,
                      width: obj.width * (obj.scaleX || 1),
                      height: obj.height * (obj.scaleY || 1),
                    });
                  } else {
                    // Track other types (shapes, paths, etc.) generically so they don't get deleted by sync
                    elements.push({
                      id: id,
                      type: type,
                      left: obj.left,
                      top: obj.top,
                    });
                  }

                      if (obj.objects) {
                        extractElements(obj.objects, id);
                      }
                });
              };

              extractElements(p.canvasData.objects);
              return { ...p, elements };
            }
            return p;
          });

          if (initializedPages.length > 0) {
            const firstPageId = initializedPages[0].id;
            setPages(initializedPages);
            setCurrentPage((prev) => (prev === 1 ? firstPageId : prev));
            
            // Set initial history
            setHistoryState({
              history: [JSON.stringify(initializedPages)],
              index: 0,
            });
          } else {
            setPages(initializedPages);
          }
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, []);

  const handleElementSelect = useCallback((
    elementId: string,
    position: { x: number; y: number; width: number; height: number },
  ) => {
    if (!elementId || elementId === "") {
      setSelectedElement(null);
      setElementPosition(null);
      return;
    }
    setSelectedElement(elementId);
    setElementPosition(position);
  }, []);

  const handleElementDoubleClick = useCallback((
    elementId: string,
    position: { x: number; y: number; width: number; height: number },
    fabricObj?: any,
  ) => {
    if (!elementId || elementId === "") return;

    // Find in state first (to preserve ID and basic type if possible)
    let element = pages.map(p => p.elements || []).flat().find((e: any) => e.id === elementId);

    // Always fetch current values from the actual canvas object (ground truth)
    if (fabricObj) {
      const type = fabricObj.type?.toLowerCase();
      if (type === "text" || type === "itext" || type === "textbox") {
        let content = fabricObj.text || "";
        if (type === "textbox" && fabricObj._textLines) {
          content = fabricObj._textLines
            .map((line: string[]) => line.join(""))
            .join("\n");
        }
        element = {
          ...(element || {}),
          id: elementId,
          type: "text",
          content: content,
          left: fabricObj.left,
          top: fabricObj.top,
          fontSize: fabricObj.fontSize,
          fontFamily: fabricObj.fontFamily,
          color: (fabricObj.fill as string) || "#000000",
          bold: fabricObj.fontWeight === "bold",
          italic: fabricObj.fontStyle === "italic",
          underline: fabricObj.underline,
          align: fabricObj.textAlign || "left",
          lineHeight: fabricObj.lineHeight || 1.2,
        };
      } else if (type === "image") {
        const src =
          fabricObj.getSrc?.() ||
          fabricObj._element?.src ||
          fabricObj.src ||
          "";
        element = {
          ...(element || {}),
          id: elementId,
          type: "image",
          url: src,
          left: fabricObj.left,
          top: fabricObj.top,
          width: fabricObj.width * (fabricObj.scaleX || 1),
          height: fabricObj.height * (fabricObj.scaleY || 1),
          rotation: fabricObj.angle,
          brightness: 100, // Filters (if implemented)
          contrast: 100,
          saturation: 100,
        };
      }
    }

    if (element) {
      setElementPosition(position);
      if (element.type === "text") {
        setEditingText(element as TextElement);
      } else if (element.type === "image") {
        setEditingImage(element as ImageElement);
      }
    }
  }, [pages]);

  const handleTextSave = useCallback((updatedText: TextElement) => {
    setPages((prevPages) => {
      return prevPages.map((p) => {
        if (p.id === currentPage) {
          const elements = p.elements || [];
          const exists = elements.some((e: any) => e.id === updatedText.id);
          return {
            ...p,
            elements: exists
              ? elements.map((e: any) =>
                  e.id === updatedText.id ? updatedText : e,
                )
              : [...elements, updatedText],
          };
        }
        return p;
      });
    });
    setEditingText(null);
  }, [currentPage]);

  const handleTextUpdate = useCallback((updatedText: TextElement) => {
    setPages((prevPages) => {
      return prevPages.map((p) => {
        if (p.id === currentPage) {
          const elements = p.elements || [];
          return {
            ...p,
            elements: elements.map((e: any) =>
              e.id === updatedText.id ? { ...updatedText } : e,
            ),
          };
        }
        return p;
      });
    });
  }, [currentPage]);

  const handleImageUpdate = useCallback((updatedImage: ImageElement) => {
    setPages((prevPages) => {
      return prevPages.map((p) => {
        if (p.id === currentPage) {
          const elements = p.elements || [];
          const exists = elements.some((e: any) => e.id === updatedImage.id);
          const updatedElements = exists
            ? elements.map((e: any) =>
                e.id === updatedImage.id ? { ...updatedImage } : e,
              )
            : [...elements, { ...updatedImage }];

          return {
            ...p,
            elements: updatedElements,
          };
        }
        return p;
      });
    });
    setEditingImage({ ...updatedImage });
  }, [currentPage]);

  const handleImageDelete = useCallback((imageId: string) => {
    setPages((prevPages) => {
      return prevPages.map((p) => {
        if (p.id === currentPage) {
          return {
            ...p,
            elements: (p.elements || []).filter((e: any) => e.id !== imageId),
          };
        }
        return p;
      });
    });
    setEditingImage(null);
    setSelectedElement(null);
  }, [currentPage]);

  const handleModalClose = useCallback(() => {
    setEditingText(null);
    setEditingImage(null);
    setSelectedElement(null);
  }, []);

  const handleImagePickerClose = useCallback(() => {
    setIsImagePickerOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-blue-500 font-medium">Loading design...</div>
      </div>
    );
  }

  const page = pages.find((p) => p.id === currentPage);

  const downloadPDF = async () => {
    if (pages.length === 0) return;

    try {
      const { jsPDF } = await import("jspdf");

      const firstPage = pages[0];
      const margin = 5; // Reduced margin for "less outside space"
      const pxToMm = 0.352778;

      const designWidthMm = (firstPage.width || 794) * pxToMm;
      const designHeightMm = (firstPage.height || 1123) * pxToMm;
      const pdfWidth = designWidthMm + margin * 2;
      const pdfHeight = designHeightMm + margin * 2;

      const doc = new jsPDF({
        orientation: designWidthMm > designHeightMm ? "landscape" : "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        if (i > 0) {
          const pWidth = p.width * pxToMm + margin * 2;
          const pHeight = p.height * pxToMm + margin * 2;
          doc.addPage(
            [pWidth, pHeight],
            p.width > p.height ? "landscape" : "portrait",
          );
        }

        const activeCanvas = canvasInstances[p.id];
        let imgData = "";

        if (activeCanvas) {
          // Use the actual live canvas instance that has all user changes
          imgData = activeCanvas.toDataURL({
            format: "png",
            multiplier: 2,
          });
        } else if (p.canvasData) {
          // Fallback if canvas instance is somehow not available
          const tempCanvasEl = document.createElement("canvas");
          tempCanvasEl.width = p.width * 2;
          tempCanvasEl.height = p.height * 2;

          const staticCanvas = new fabric.StaticCanvas(tempCanvasEl, {
            width: p.width,
            height: p.height,
            backgroundColor: p.backgroundColor || "#ffffff",
          });


          await staticCanvas.loadFromJSON(p.canvasData);
          staticCanvas.renderAll();
          imgData = staticCanvas.toDataURL({
            format: "png",
            multiplier: 2,
          });
          staticCanvas.dispose();
        }

        if (imgData) {
          const pDesignWidthMm = p.width * pxToMm;
          const pDesignHeightMm = p.height * pxToMm;

          doc.addImage(
            imgData,
            "PNG",
            margin,
            margin,
            pDesignWidthMm,
            pDesignHeightMm,
          );

          // Draw professional cut marks as per user image
          doc.setDrawColor(0, 0, 0); // Black marks
          doc.setLineWidth(0.05); // Hairline thickness

          const markLen = 4; // Length of the mark
          const markOffset = 0.5; // Small gap from design

          // Top-left
          doc.line(
            margin - markLen - markOffset,
            margin,
            margin - markOffset,
            margin,
          );
          doc.line(
            margin,
            margin - markLen - markOffset,
            margin,
            margin - markOffset,
          );

          // Top-right
          doc.line(
            margin + pDesignWidthMm + markOffset,
            margin,
            margin + pDesignWidthMm + markLen + markOffset,
            margin,
          );
          doc.line(
            margin + pDesignWidthMm,
            margin - markLen - markOffset,
            margin + pDesignWidthMm,
            margin - markOffset,
          );

          // Bottom-left
          doc.line(
            margin - markLen - markOffset,
            margin + pDesignHeightMm,
            margin - markOffset,
            margin + pDesignHeightMm,
          );
          doc.line(
            margin,
            margin + pDesignHeightMm + markOffset,
            margin,
            margin + pDesignHeightMm + markLen + markOffset,
          );

          // Bottom-right
          doc.line(
            margin + pDesignWidthMm + markOffset,
            margin + pDesignHeightMm,
            margin + pDesignWidthMm + markLen + markOffset,
            margin + pDesignHeightMm,
          );
          doc.line(
            margin + pDesignWidthMm,
            margin + pDesignHeightMm + markOffset,
            margin + pDesignWidthMm,
            margin + pDesignHeightMm + markLen + markOffset,
          );
        }
      }

      doc.save("invitation-design.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleNext = async () => {
    const currentIndex = pages.findIndex((p) => p.id === currentPage);
    if (currentIndex < pages.length - 1) {
      setCurrentPage(pages[currentIndex + 1].id);
    } else {
      await downloadPDF();
    }
  };

  const handleBack = () => {
    const currentIndex = pages.findIndex((p) => p.id === currentPage);
    if (currentIndex > 0) {
      setCurrentPage(pages[currentIndex - 1].id);
    }
  };

  const handleAddText = () => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    // Use Textbox instead of IText to match the initial design elements
    const text = new fabric.Textbox("New Text", {
      left: 100,
      top: 100,
      width: 200, // Textbox needs a width
      fontFamily: "Arial",
      fontSize: 40,
      fill: "#000000",
      id: `text-${Date.now()}`,
      editable: false, // Disable native editing to use modal
      lockScalingFlip: true,
      hasControls: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    // Also update elements array for consistency
    const newText: TextElement = {
      id: (text as any).id as string,
      type: "text",
      content: "New Text",
      left: 100,
      top: 100,
      fontSize: 40,
      fontFamily: "Arial",
      color: "#000000",
      bold: false,
      italic: false,
      underline: false,
      align: "left",
    };

    const updated = pages.map((p) => {
      if (p.id === currentPage) {
        return {
          ...p,
          elements: [...(p.elements || []), newText],
        };
      }
      return p;
    });
    setPages(updated);
    saveToHistory(updated);
  };

  const handleImageUpload = (data: string) => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    fabric.FabricImage.fromURL(data, {
      crossOrigin: "anonymous",
    }).then((img) => {
      // Scale image to fit canvas
      const scale = Math.min(200 / img.width!, 200 / img.height!);
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: 100,
        top: 100,
        id: `image-${Date.now()}`,
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();

      // Update elements array
      const newImage: ImageElement = {
        id: (img as any).id as string,
        type: "image",
        url: data,
        left: 100,
        top: 100,
        width: img.width! * scale,
        height: img.height! * scale,
        rotation: 0,
        brightness: 100,
        contrast: 100,
        saturation: 100,
      };

      const updated = pages.map((p) => {
        if (p.id === currentPage) {
          return {
            ...p,
            elements: [...(p.elements || []), newImage],
          };
        }
        return p;
      });
      setPages(updated);
      saveToHistory(updated);
    });
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      handleImageUpload(data);
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = "";
  };

  const handleAlign = (
    type: "left" | "center" | "right" | "top" | "middle" | "bottom" | "both",
  ) => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const boundingRect = activeObject.getBoundingRect();
    const canvasWidth = canvas.width!;
    const canvasHeight = canvas.height!;

    switch (type) {
      case "left":
        activeObject.set({ left: activeObject.left! - boundingRect.left });
        break;
      case "center":
        canvas.centerObjectH(activeObject);
        break;
      case "right":
        activeObject.set({
          left:
            activeObject.left! +
            (canvasWidth - boundingRect.left - boundingRect.width),
        });
        break;
      case "top":
        activeObject.set({ top: activeObject.top! - boundingRect.top });
        break;
      case "middle":
        canvas.centerObjectV(activeObject);
        break;
      case "bottom":
        activeObject.set({
          top:
            activeObject.top! +
            (canvasHeight - boundingRect.top - boundingRect.height),
        });
        break;
      case "both":
        canvas.centerObject(activeObject);
        break;
    }


    activeObject.setCoords();
    canvas.renderAll();

    // Sync to state manually since programmatic changes don't always trigger object:modified
    const objectId = (activeObject as any).id;
    if (objectId) {
      setPages((prevPages) => {
        const updated = prevPages.map((p) => {
          if (p.id !== currentPage) return p;
          return {
            ...p,
            elements: p.elements.map((el: any) => {
              if (el.id !== objectId) return el;
              return {
                ...el,
                left: activeObject.left,
                top: activeObject.top,
                scaleX: activeObject.scaleX,
                scaleY: activeObject.scaleY,
                rotation: activeObject.angle,
              };
            }),
          };
        });
        saveToHistory(updated);
        return updated;
      });
    }
  };

  const handleBringToFront = () => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    canvas.bringObjectToFront(activeObject);
    canvas.renderAll();

    const objectId = (activeObject as any).id;
    if (objectId) {
      setPages((prevPages) => {
        const updated = prevPages.map((p) => {
          if (p.id !== currentPage) return p;
          const element = p.elements.find((el: any) => el.id === objectId);
          if (!element) return p;
          const otherElements = p.elements.filter(
            (el: any) => el.id !== objectId,
          );
          return {
            ...p,
            elements: [...otherElements, element],
          };
        });
        saveToHistory(updated);
        return updated;
      });
    }
  };

  const handleSendToBack = () => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    canvas.sendObjectToBack(activeObject);
    canvas.renderAll();

    const objectId = (activeObject as any).id;
    if (objectId) {
      setPages((prevPages) => {
        const updated = prevPages.map((p) => {
          if (p.id !== currentPage) return p;
          const element = p.elements.find((el: any) => el.id === objectId);
          if (!element) return p;
          const otherElements = p.elements.filter(
            (el: any) => el.id !== objectId,
          );
          return {
            ...p,
            elements: [element, ...otherElements],
          };
        });
        saveToHistory(updated);
        return updated;
      });
    }
  };

  const handleTextPropertyChange = (property: string, value: any) => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (
      !activeObject ||
      !(
        activeObject.type === "text" ||
        activeObject.type === "itext" ||
        activeObject.type === "textbox"
      )
    )
      return;

    activeObject.set({ [property]: value });
    canvas.renderAll();

    // Sync to state
    const objectId = (activeObject as any).id;
    if (objectId) {
      setPages((prevPages) => {
        const updated = prevPages.map((p) => {
          if (p.id !== currentPage) return p;
          return {
            ...p,
            elements: p.elements.map((el: any) => {
              if (el.id !== objectId) return el;
              const updatedEl = { ...el, [property]: value };
              // If it's alignment, use the specific property name 'align' in our state
              if (property === "textAlign") updatedEl.align = value;
              return updatedEl;
            }),
          };
        });
        saveToHistory(updated);
        return updated;
      });
    }
  };

  const getActionButton = () => {
    if (currentPage === 1) return "Next";
    if (currentPage === 3) return "Checkout";
    return "Next";
  };

  const steps = [
    { number: 1, label: "Choose your background" },
    { number: 2, label: "Customize your design" },
    { number: 3, label: "Checkout" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8]">
      {/* Stepper */}
      <div className="w-full max-w-4xl mx-auto pt-12 pb-8 px-6">
        <div className="relative flex justify-between">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((2 - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>

          {steps.map((step) => (
            <div
              key={step.number}
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  step.number === 2
                    ? "bg-blue-500 border-blue-500 text-white"
                    : step.number < 2
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {step.number}
              </div>
              <div
                className={`mt-2 text-xs font-medium ${step.number === 2 ? "text-blue-500" : "text-gray-400"}`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Page Thumbnails */}
      <div className="flex justify-center items-center gap-4 py-6 px-4 overflow-x-auto custom-scrollbar">
        {pages.map((p, index) => {
          const canvas = canvasInstances[p.id];
          let thumbSrc: string | undefined;
          if (canvas && !(canvas as any).destroyed) {
            try {
              thumbSrc = canvas.toDataURL({
                format: "png",
                multiplier: 0.15,
              });
            } catch {
              thumbSrc = undefined;
            }
          }

          return (
            <div key={p.id} className="text-center flex-shrink-0 group relative">
              {/* Page Reordering Controls */}
              <div className="absolute -top-2 left-0 right-0 flex justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  disabled={index === 0}
                  onClick={() => handleMovePage(p.id, 'left')}
                  className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-gray-600"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <div className="flex gap-1">
                    {pages.length > 1 && (
                        <button
                            onClick={() => handleRemovePage(p.id)}
                            className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center text-red-400 hover:text-red-600"
                        >
                            <X className="w-2.5 h-2.5" />
                        </button>
                    )}
                    <button
                    disabled={index === pages.length - 1}
                    onClick={() => handleMovePage(p.id, 'right')}
                    className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-gray-600"
                    >
                    <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
              </div>

              <button
                onClick={() => setCurrentPage(p.id)}
                className={`w-14 h-[72px] bg-white border-2 rounded shadow-sm overflow-hidden transition-all ${
                  currentPage === p.id
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt={`Page ${p.id} preview`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a2b3c]" />
                )}
              </button>
              <div
                className={`mt-1 text-[10px] font-medium ${
                  currentPage === p.id ? "text-blue-500" : "text-gray-400"
                }`}
              >
                Page {index + 1}
              </div>
            </div>
          );
        })}
        
        {/* Add Page Button */}
        <button
          onClick={handleAddPage}
          className="w-14 h-[72px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-all group flex-shrink-0"
          title="Add New Page"
        >
          <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
          <span className="text-[10px] mt-1 text-gray-400 group-hover:text-blue-500 font-medium">Add Page</span>
        </button>
      </div>


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start p-12 overflow-auto custom-scrollbar">
        <div ref={containerRef} className="relative flex items-center">
          {/* Canvas Wrapper - Render all pages and show/hide them */}
          <div>
            {pages.map((p) => (
              <div
                key={p.id}
                style={{ display: currentPage === p.id ? "block" : "none" }}
              >
                <PageCanvas
                  page={p}
                  selectedElement={selectedElement}
                  onElementSelect={handleElementSelect}
                  onElementDoubleClick={handleElementDoubleClick}
                  onCanvasReady={(canvas) => handleCanvasReady(p.id, canvas)}
                  zoom={zoom}
                />
              </div>
            ))}
          </div>


          {/* Floating Side Toolbar */}
          <div 
            className="fixed flex flex-col bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200 z-[200] max-h-[90vh] overflow-y-auto custom-scrollbar"
            style={{
              left: `${sideToolsPos.x}px`,
              top: `${sideToolsPos.y}px`,
              width: "144px"
            }}
          >

            <div 
              className="h-6 flex items-center justify-center bg-gray-50 cursor-move border-b border-gray-100"
              onMouseDown={handleSideToolsDrag}
            >
              <div className="w-6 h-1 bg-gray-300 rounded-full" />
            </div>
            {/* Main Actions Grid */}
            <div className="grid grid-cols-3 border-b border-gray-100">
              <button
                onClick={undo}
                disabled={historyState.index <= 0}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-r border-b border-gray-50 group disabled:opacity-30"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              </button>
              <button
                onClick={redo}
                disabled={historyState.index >= historyState.history.length - 1}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-r border-b border-gray-50 group disabled:opacity-30"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              </button>
              <button
                onClick={() => setShowLayers(!showLayers)}
                className={`w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-b border-gray-50 group transition-colors ${showLayers ? "bg-blue-50" : ""}`}
                title="Layers"
              >
                <Layers
                  className={`w-5 h-5 ${showLayers ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500"}`}
                />
              </button>

              <button
                onClick={handleCopy}
                disabled={!selectedElement}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-r border-b border-gray-50 group disabled:opacity-30"
                title="Copy (Alt+C)"
              >
                <Copy className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              </button>
              <button
                onClick={handlePaste}
                disabled={!clipboard || clipboard.length === 0}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-r border-b border-gray-50 group disabled:opacity-30"
                title="Paste (Alt+V)"
              >
                <ClipboardPaste className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              </button>

              <button
                onClick={handleToggleVisibility}
                className="w-12 h-12 flex items-center justify-center hover:bg-red-50 border-b border-gray-50 group disabled:opacity-30"
                title="Delete Object"
                disabled={!selectedElement}
              >
                  <Trash2 className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
              </button>

              <button
                onClick={handleAddText}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-r border-b border-gray-50 group"
                title="Add Text"
              >
                <Type className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              </button>
              <button
                onClick={() => setIsImagePickerOpen(true)}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-r border-b border-gray-50 group"
                title="Add Image"
              >
                <Image className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              </button>
              <div className="relative group overflow-hidden w-12 h-12 border-b border-gray-50">
                <button
                  className="w-full h-full flex items-center justify-center hover:bg-gray-50 group transition-colors"
                  title="Page Background Color"
                >
                  <Palette className="w-5 h-5 text-gray-500 group-hover:text-blue-500" />
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-[2]"
                    value={pages.find(p => p.id === currentPage)?.backgroundColor || "#ffffff"}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  />
                </button>
              </div>

              <button
                onClick={handleDuplicate}
                disabled={!selectedElement}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-r border-b border-gray-50 group disabled:opacity-30"
                title="Duplicate Object (Ctrl+D)"
              >
                <div className="relative">
                  <Copy className="w-5 h-5 text-purple-500 group-hover:text-purple-600 transition-colors" />
                  <Plus className="w-2 h-2 absolute -top-1 -right-1 text-purple-600 bg-white rounded-full" />
                </div>
              </button>
              <button
                onClick={() => {
                  const current = pages.find(p => p.id === currentPage)?.elements?.find((el: any) => el.id === selectedElement)?.opacity || 1;
                  handleElementOpacityChange(Math.max(current - 0.1, 0.1));
                }}
                disabled={!selectedElement}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-r border-b border-gray-50 group disabled:opacity-30"
                title="Decrease Opacity"
              >
                <div className="relative">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <Minus className="w-2.5 h-2.5 absolute -top-1 -right-2 text-red-500" />
                </div>
              </button>
              <button
                onClick={() => {
                  const current = pages.find(p => p.id === currentPage)?.elements?.find((el: any) => el.id === selectedElement)?.opacity || 1;
                  handleElementOpacityChange(Math.min(current + 0.1, 1));
                }}
                disabled={!selectedElement}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-b border-gray-50 group disabled:opacity-30"
                title="Increase Opacity"
              >
                <div className="relative">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <Plus className="w-2.5 h-2.5 absolute -top-1 -right-2 text-green-500" />
                </div>
              </button>

              <button
                onClick={handleZoomOut}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-r border-gray-50 group"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              </button>
              <button
                onClick={handleZoomReset}
                className="w-12 h-12 flex flex-col items-center justify-center hover:bg-white border-r border-gray-50 group"
                title="Reset View"
              >
                <Maximize2 className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
                <span className="text-[10px] font-bold text-gray-700 group-hover:text-blue-500 leading-none mt-0.5">{Math.round(zoom * 100)}%</span>
              </button>
              <button
                onClick={handleZoomIn}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 group"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              </button>
            </div>





            {/* Shapes Grid */}
            <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50/20">
              <button
                onClick={() => handleAddShape('rect')}
                className="w-12 h-12 flex items-center justify-center hover:bg-white border-r border-gray-50 group"
                title="Rectangle"
              >
                <Square className="w-5 h-5 text-gray-500 group-hover:text-blue-500" />
              </button>
              <button
                onClick={() => handleAddShape('circle')}
                className="w-12 h-12 flex items-center justify-center hover:bg-white border-r border-gray-50 group"
                title="Circle"
              >
                <Circle className="w-5 h-5 text-gray-500 group-hover:text-blue-500" />
              </button>
              <button
                onClick={() => handleAddShape('triangle')}
                className="w-12 h-12 flex items-center justify-center hover:bg-white group"
                title="Triangle"
              >
                <TriangleIcon className="w-5 h-5 text-gray-500 group-hover:text-blue-500" />
              </button>
            </div>





            {/* Element Fill Color - Only show when element is selected */}
            {selectedElement && (
                <div className="relative group overflow-hidden">
                <button
                    className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-b border-gray-100 group transition-colors"
                    title="Element Fill Color"
                >
                    <div 
                        className="w-5 h-5 rounded-sm border border-gray-200" 
                        style={{ 
                            backgroundColor: pages.find(p => p.id === currentPage)?.elements?.find((el: any) => el.id === selectedElement)?.fill || 
                                           pages.find(p => p.id === currentPage)?.elements?.find((el: any) => el.id === selectedElement)?.color || 
                                           "#3b82f6" 
                        }} 
                    />
                    <input
                        type="color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-[2]"
                        value={pages.find(p => p.id === currentPage)?.elements?.find((el: any) => el.id === selectedElement)?.fill || 
                               pages.find(p => p.id === currentPage)?.elements?.find((el: any) => el.id === selectedElement)?.color || 
                               "#3b82f6"}
                        onChange={(e) => handleElementColorChange(e.target.value)}
                    />
                </button>
                </div>
            )}



            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAddImage}
              className="hidden"
              accept="image/*"
            />

            {/* Alignment Tools - Only show when an element is selected */}
            {selectedElement && (
              <>
                {/* Object Positioning Alignment */}
                <div className="flex flex-col border-t border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-3 gap-0">
                      <button
                        onClick={() => handleAlign("left")}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white group"
                        title="Align Left"
                      >
                        <AlignLeft className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleAlign("center")}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white group border-x border-gray-100"
                        title="Align Center (H)"
                      >
                        <CenterHorizontal className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleAlign("right")}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white group"
                        title="Align Right"
                      >
                        <AlignRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-0 border-t border-gray-100">
                      <button
                        onClick={() => handleAlign("top")}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white group"
                        title="Align Top"
                      >
                        <AlignTop className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleAlign("middle")}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white group border-x border-gray-100"
                        title="Align Middle (V)"
                      >
                        <AlignMiddle className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleAlign("bottom")}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white group"
                        title="Align Bottom"
                      >
                        <AlignBottom className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </button>
                    </div>

                    <button
                        onClick={() => handleAlign("both")}
                        className="w-full h-12 flex items-center justify-center hover:bg-white border-t border-gray-100 group transition-colors font-medium text-[10px] gap-2"
                        title="Center on Canvas"
                      >
                        <CenterIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                        <span className="text-gray-400 group-hover:text-blue-500">Center Both</span>
                    </button>

                    {/* Text Alignment - Only for TextElements */}
                    {pages.find(p => p.id === currentPage)?.elements?.find((el: any) => el.id === selectedElement)?.type === "text" && (
                    <div className="grid grid-cols-4 border-t border-gray-100 bg-gray-50/50">
                        <button
                        onClick={() => handleTextPropertyChange("textAlign", "left")}
                        className="w-full h-10 flex items-center justify-center hover:bg-white group border-r border-gray-100"
                        title="Text Align Left"
                        >
                        <AlignLeft className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500" />
                        </button>
                        <button
                        onClick={() => handleTextPropertyChange("textAlign", "center")}
                        className="w-full h-10 flex items-center justify-center hover:bg-white group border-r border-gray-100"
                        title="Text Align Center"
                        >
                        <AlignCenter className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500" />
                        </button>
                        <button
                        onClick={() => handleTextPropertyChange("textAlign", "right")}
                        className="w-full h-10 flex items-center justify-center hover:bg-white group border-r border-gray-100"
                        title="Text Align Right"
                        >
                        <AlignRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500" />
                        </button>
                        <button
                        onClick={() => handleTextPropertyChange("textAlign", "justify")}
                        className="w-full h-10 flex items-center justify-center hover:bg-white group"
                        title="Text Align Justify"
                        >
                        <AlignJustify className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500" />
                        </button>
                    </div>
                    )}

                  <div className="border-t border-gray-100 my-0.5 opacity-50" />

                  <button
                    onClick={handleBringToFront}
                    className="w-12 h-12 flex items-center justify-center hover:bg-white group transition-colors"
                    title="Bring to Front"
                  >
                    <BringToFront className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </button>
                  <button
                    onClick={handleSendToBack}
                    className="w-12 h-12 flex items-center justify-center hover:bg-white group transition-colors"
                    title="Send to Back"
                  >
                    <SendToBack className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </button>
                </div>

              </>
            )}
          </div>

          {/* Layers Panel */}
          {showLayers && (
            <div className="absolute right-16 top-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Layers</h3>
                <button
                  onClick={() => setShowLayers(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pages
                  .find((p) => p.id === currentPage)
                  ?.elements?.slice()
                  .reverse()
                  .map((el: any) => (
                    <div
                      key={el.id}
                      className={`flex items-center justify-between p-2 rounded border ${selectedElement === el.id ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:bg-gray-50"}`}
                    >
                      <div
                        className="flex items-center gap-2 cursor-pointer flex-1 overflow-hidden"
                        onClick={() => {
                          setSelectedElement(el.id);
                          const canvas = canvasInstances[currentPage];
                          if (canvas) {
                            const obj = canvas
                              .getObjects()
                              .find(
                                (o) =>
                                  (o as any).id === el.id ||
                                  (o.get && o.get("id") === el.id),
                              );
                            if (obj && el.visible !== false) {
                              canvas.setActiveObject(obj);
                              canvas.renderAll();
                            }
                          }
                        }}
                      >
                        {el.type === "text" ? (
                          <Type className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : (
                          <Image className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        <span className="text-sm truncate text-gray-600">
                          {el.type === "text"
                            ? el.content || "Text"
                            : el.type === "image"
                              ? "Image"
                              : el.type}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPages((prevPages) => {
                            return prevPages.map((p) => {
                              if (p.id !== currentPage) return p;
                              const updatedElements = (p.elements || []).map(
                                (element: any) => {
                                  if (element.id === el.id) {
                                    const newVisible =
                                      element.visible === false ? true : false;
                                    const canvas = canvasInstances[currentPage];
                                    if (canvas) {
                                      const fabObj = canvas
                                        .getObjects()
                                        .find(
                                          (o) =>
                                            (o as any).id === el.id ||
                                            (o.get && o.get("id") === el.id),
                                        );
                                      if (fabObj) {
                                        fabObj.set("visible", newVisible);
                                        if (!newVisible)
                                          canvas.discardActiveObject();
                                        canvas.renderAll();
                                      }
                                    }
                                    return { ...element, visible: newVisible };
                                  }
                                  return element;
                                },
                              );
                              return { ...p, elements: updatedElements };
                            });
                          });
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500"
                      >
                        {el.visible === false ? (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-12 py-2.5 bg-white text-gray-600 font-medium rounded shadow-sm border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pages.findIndex((p) => p.id === currentPage) === 0}
          >
            Back
          </button>
          <button className="px-12 py-2.5 bg-[#e1f0ff] text-blue-600 font-medium rounded shadow-sm border border-blue-100 hover:bg-[#d4e9ff] transition-all">
            Save
          </button>
          <button
            onClick={handleNext}
            className="px-12 py-2.5 bg-gradient-to-b from-blue-400 to-blue-600 text-white font-medium rounded shadow-md hover:from-blue-500 hover:to-blue-700 transition-all"
          >
            {getActionButton()}
          </button>
        </div>
      </div>

      {/* Modals */}
      {editingText && elementPosition && (
        <TextEditModal
          text={editingText}
          position={elementPosition}
          onUpdate={handleTextUpdate}
          onSave={handleTextSave}
          onCancel={handleModalClose}
        />
      )}

      <CloudUploadModal
        isOpen={isImagePickerOpen}
        onClose={handleImagePickerClose}
        onUpload={handleImageUpload}
      />

      {editingImage && elementPosition && (
        <ImageEditModal
          image={editingImage}
          position={elementPosition}
          onUpdate={handleImageUpdate}
          onDelete={handleImageDelete}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
