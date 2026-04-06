"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";

interface PageCanvasProps {
  page: any;
  selectedElement: string | null;
  onElementSelect: (
    id: string,
    position: { x: number; y: number; width: number; height: number },
  ) => void;
  onElementDoubleClick: (
    id: string,
    position: { x: number; y: number; width: number; height: number },
    fabricObj?: fabric.Object,
  ) => void;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  zoom?: number;
}

export function PageCanvas({
  page,
  selectedElement,
  onElementSelect,
  onElementDoubleClick,
  onCanvasReady,
  zoom = 1,
}: PageCanvasProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const isReadyRef = useRef(false);
  const [hoveredObject, setHoveredObject] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
  } | null>(null);

  // Use refs for callbacks to avoid stale closures in fabric listeners
  const onElementSelectRef = useRef(onElementSelect);
  const onElementDoubleClickRef = useRef(onElementDoubleClick);

  useEffect(() => {
    onElementSelectRef.current = onElementSelect;
    onElementDoubleClickRef.current = onElementDoubleClick;
  }, [onElementSelect, onElementDoubleClick]);

  const styleControls = useCallback((obj: any) => {
    if (!obj.controls) return;
    
    // In Fabric 7, controls are shared by reference. 
    // To have different colors for different controls on the same object,
    // we need to make sure we're not overwriting shared prototype controls.
    obj.controls = { ...obj.controls };

    const cornerColor = "#f97316"; // Orange for Scaling
    const rotationColor = "#22c55e"; // Green for Rotation
    const sideColor = "#ffffff";    // White for Stretching
    const sideStroke = "#3b82f6";   // Blue outline for sides
    
    const corners = ["tl", "tr", "bl", "br"];
    const middles = ["ml", "mt", "mr", "mb"];
    
    // Set general border style
    obj.set({
      transparentCorners: false,
      cornerSize: 10,
      cornerStyle: "rect",
      borderColor: cornerColor,
      borderDashArray: [4, 4],
    });

    // Explicitly set corner handles to Orange
    corners.forEach(key => {
      if (obj.controls[key]) {
        obj.controls[key] = Object.create(obj.controls[key]);
        obj.controls[key].cornerColor = cornerColor;
        obj.controls[key].cornerStrokeColor = cornerColor;
      }
    });

    // Explicitly set middle handles to White with Blue stroke
    middles.forEach(key => {
      if (obj.controls[key]) {
        obj.controls[key] = Object.create(obj.controls[key]);
        obj.controls[key].cornerColor = sideColor;
        obj.controls[key].cornerStrokeColor = sideStroke;
      }
    });
    
    // Set rotation handle to Green
    if (obj.controls.mtr) {
      obj.controls.mtr = Object.create(obj.controls.mtr);
      obj.controls.mtr.cornerColor = rotationColor;
      obj.controls.mtr.cornerStrokeColor = rotationColor;
      obj.controls.mtr.withConnection = true;
    }

    obj.setCoords();
  }, []);

  useEffect(() => {
    if (!canvasEl.current) return;
    isReadyRef.current = false;

    // Initialize fabric canvas
    const canvas = new fabric.Canvas(canvasEl.current, {
      width: page.width || 794,
      height: page.height || 1123,
      backgroundColor: page.backgroundColor || "#ffffff",
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    // Load canvas data if available
    if (page.canvasData) {
      // Fabric 6+ loadFromJSON might not preserve custom properties like 'id'
      // unless we explicitly handle them or they are in the JSON.
      canvas.loadFromJSON(page.canvasData).then(() => {
        const canvasObjects = canvas.getObjects();
        const jsonObjects = page.canvasData.objects || [];

        // Helper to recursively assign IDs and properties
        const processObjects = (fabObjs: any[], jsonObjs: any[], parentId?: string) => {
          fabObjs.forEach((obj: any, index: number) => {
            const jsonObj = jsonObjs[index];

            // Sync ID from JSON if missing on Fabric object
            if (!obj.id && jsonObj && jsonObj.id) {
              obj.id = jsonObj.id;
            }

            // Assign a unique DETERMINISTIC ID if still missing
            if (!obj.id) {
              obj.id = parentId ? `${parentId}-${index}` : `obj-${index}`;
            }

            // Ensure the ID is set as a property that Fabric's get('id') can see
            if (obj.set) {
              obj.set("id", obj.id);
            }

            obj.set({
              hasControls: true,
              lockScalingFlip: true,
              editable: false,
              // Make sure objects are not protected from deletion
              selectable: true,
              evented: true,
            });

            styleControls(obj);

            const nestedFabObjects =
              obj._objects || (obj.getObjects && obj.getObjects());
            if (nestedFabObjects && jsonObj && jsonObj.objects) {
              processObjects(nestedFabObjects, jsonObj.objects, obj.id);
            }
          });
        };

        processObjects(canvasObjects, jsonObjects);
        
        // Ensure dimensions are correct after load
        canvas.setDimensions({
          width: page.width || 794,
          height: page.height || 1123
        });
        canvas.calcOffset();
        canvas.renderAll();
        
        // Give it a tiny bit of time for images to settle before starting sync
        setTimeout(() => {
          if (!fabricCanvasRef.current) return;
          isReadyRef.current = true;
        }, 50);
      });
    } else {
      isReadyRef.current = true;
    }

    // Handle object selection
    canvas.on("selection:created", (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        handleObjectSelection(obj);
      }
    });

    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        handleObjectSelection(obj);
      }
    });

    canvas.on("selection:cleared", () => {
      onElementSelectRef.current("", { x: 0, y: 0, width: 0, height: 0 });
    });

    canvas.on("mouse:over", (e) => {
      const obj = e.target as any;
      if (!obj) return;

      const objType = (obj.type || "").toLowerCase();
      if (
        objType === "text" ||
        objType === "itext" ||
        objType === "textbox" ||
        objType === "image"
      ) {
        const bound = obj.getBoundingRect();
        setHoveredObject({
          x: bound.left,
          y: bound.top,
          width: bound.width,
          height: bound.height,
          type: objType,
        });
      }
    });

    canvas.on("mouse:out", () => {
      setHoveredObject(null);
    });

    canvas.on("mouse:dblclick", (e) => {
      let obj = e.target as any;
      if (!obj) return;

      if (obj.type === "group") {
        const children = obj._objects || (obj.getObjects && obj.getObjects());
        if (children && children.length > 0) {
          const textChild = children.find((child: any) => {
            const t = (child.type || "").toLowerCase();
            return (
              t === "text" || t === "itext" || t === "textbox" || t === "image"
            );
          });
          if (textChild) {
            obj = textChild;
          }
        }
      }

      const objType = (obj.type || "").toLowerCase();
      if (
        objType !== "text" &&
        objType !== "itext" &&
        objType !== "textbox" &&
        objType !== "image"
      ) {
        return;
      }

      const bound = obj.getBoundingRect();
      const id = (obj as any).id || "unknown";

      onElementDoubleClickRef.current(
        id,
        {
          x: bound.left,
          y: bound.top,
          width: bound.width,
          height: bound.height,
        },
        obj,
      );
    });

    // Handle object modifications (moving, scaling)
    canvas.on("object:modified", (e) => {
      const obj = e.target;
      if (obj) {
        handleObjectSelection(obj);
      }
    });

    const handleObjectSelection = (obj: fabric.Object) => {
      const bound = obj.getBoundingRect();
      // Ensure we get the ID from the object, checking custom properties if needed
      const id = (obj as any).id || (obj.get && (obj.get as any)("id"));
      console.log("Object selected in canvas:", obj.type, "ID:", id);

      onElementSelectRef.current(id || "unknown", {
        x: bound.left,
        y: bound.top,
        width: bound.width,
        height: bound.height,
      });
    };

    return () => {
      canvas.dispose();
    };
  }, [page.id]); // Only re-initialize on page ID change, not every page update

  // Handle external updates to the canvas (e.g. from modals)
  useEffect(() => {
    let aborted = false;
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // CRITICAL: If page.elements is defined, it is our source of truth for what SHOULD exist.
    if (!page.elements) return;

    // Simple sync: find objects in canvas and update them based on page elements
    const syncElements = async () => {
      if (aborted || !fabricCanvasRef.current || !isReadyRef.current) return;

      let needsRender = false;
      const canvas = fabricCanvasRef.current;
      const currentObjects = canvas.getObjects();

      // Collect ALL valid IDs from page.elements, including any nested IDs if they were expanded
      const elementIds = new Set(
        page.elements.map((el: any) => el.id).filter(Boolean),
      );

      // Safety check: Don't remove if elementIds are not populated yet
      if (page.elements.length > 0 && elementIds.size === 0) {
        console.warn("Sync trace: elements exists but IDs are missing. Skipping sync to prevent data loss.");
        return;
      }

      // 1. Remove objects from canvas ONLY if they have an ID and that ID is definitely not in state.
      // We skip objects without IDs to avoid deleting internal Fabric objects or temporary layers.
      // IMPORTANT: We only do this if the number of elements in state has actually decreased,
      // to prevent mass-deletion during initial load or unrelated state updates.
      const canvasObjects = canvas.getObjects();

      // Safety check: if elementIds is empty but we have canvas objects,
      // it might mean the state hasn't loaded yet. Don't clear the canvas.
      if (elementIds.size === 0 && canvasObjects.length > 0) {
        console.warn(
          "Sync: elementIds is empty but canvas has objects. Skipping removal for safety.",
        );
      } else {
        canvasObjects.forEach((obj) => {
          const id = (obj as any).id || (obj.get && obj.get("id"));

          // Only process objects with a tracking ID
          if (id && id !== "unknown") {
            const existsInState = elementIds.has(id);

            if (!existsInState) {
              // Check if it's a child of a group that might still be in state
              let parent = obj.group;
              let parentInState = false;
              while (parent) {
                const parentId =
                  (parent as any).id || (parent.get && parent.get("id"));
                if (parentId && elementIds.has(parentId)) {
                  parentInState = true;
                  break;
                }
                parent = parent.group;
              }

              if (!parentInState) {
                console.log(
                  "Sync: Removing object from canvas that was deleted from state:",
                  id,
                );
                canvas.remove(obj);
                needsRender = true;
              }
            }
          }
        });
      }

      // Helper to find object by ID recursively
      const findObjectById = (
        objects: fabric.FabricObject[],
        id: string,
      ): fabric.FabricObject | null => {
        for (const obj of objects) {
          if ((obj as any).id === id) return obj;
          if ((obj as any)._objects) {
            const found = findObjectById((obj as any)._objects, id);
            if (found) return found;
          }
        }
        return null;
      };

      for (const el of page.elements) {
        if (aborted || !fabricCanvasRef.current) break;

        const obj = findObjectById(canvas.getObjects(), el.id);
        if (obj) {
          needsRender = true;

          // Sync position, rotation and scale (Universal for all objects)
          const positionChanged = 
            obj.left !== el.left || 
            obj.top !== el.top || 
            obj.angle !== (el.rotation || 0) ||
            (el.scaleX !== undefined && obj.scaleX !== el.scaleX) ||
            (el.scaleY !== undefined && obj.scaleY !== el.scaleY);

          if (positionChanged) {
            obj.set({
              left: el.left ?? obj.left,
              top: el.top ?? obj.top,
              angle: el.rotation ?? obj.angle,
              scaleX: el.scaleX ?? obj.scaleX,
              scaleY: el.scaleY ?? obj.scaleY,
            });
            obj.setCoords();
            needsRender = true;
          }

          // Sync visibility
          const isVisible = el.visible !== false;
          if (obj.visible !== isVisible) {
            obj.set("visible", isVisible);
            if (!isVisible && canvas.getActiveObjects().includes(obj)) {
              canvas.discardActiveObject();
            }
          }

          if (
            el.type === "text" ||
            el.type === "IText" ||
            el.type === "textbox"
          ) {
            (obj as any).set({
              text: el.content,
              fill: el.color,
              fontSize: el.fontSize,
              fontFamily: el.fontFamily,
              fontWeight: el.bold ? "bold" : "normal",
              fontStyle: el.italic ? "italic" : "normal",
              underline: el.underline,
              textAlign: el.align,
              lineHeight: el.lineHeight || 1.2,
            });
            obj.setCoords();
          } else if (el.type === "image" || el.type === "Image") {
            const imageObj = obj as fabric.FabricImage;

            // Update source if changed
            const currentSrc =
              (imageObj as any).getSrc?.() ||
              (imageObj as any)._element?.src ||
              (imageObj as any).src;

            // Use a more robust check for data URLs or just check if it's a different string
            if (el.url && currentSrc !== el.url) {
              console.log("Updating image source for", el.id);
              try {
                // In Fabric 7, we can use fabric.util.loadImage
                const imgElement = await fabric.util.loadImage(el.url, {
                  crossOrigin: "anonymous",
                });
                
                if (aborted || !fabricCanvasRef.current) return;

                imageObj.setElement(imgElement);
                imageObj.set({
                  width: imgElement.width,
                  height: imgElement.height,
                });

                // If the object is in a group, we need to mark the group as dirty
                let parent = imageObj.group;
                while (parent) {
                  parent.set({ dirty: true });
                  parent = parent.group;
                }

                needsRender = true;
              } catch (err) {
                console.error("Error updating image source:", err);
              }
            }

            // ALWAYS sync scale/size if available in state, regardless of source changes
            if (el.width && el.height) {
              const targetScaleX = el.scaleX ?? el.width / imageObj.width!;
              const targetScaleY = el.scaleY ?? el.height / imageObj.height!;

              console.log("Syncing image size:", el.id, {
                targetScaleX,
                targetScaleY,
              });

              imageObj.set({ scaleX: targetScaleX, scaleY: targetScaleY });
              imageObj.setCoords();
              needsRender = true;
            }

            // Apply filters
            const filters: any[] = [];

            if (el.brightness !== undefined && el.brightness !== 100) {
              filters.push(
                new fabric.filters.Brightness({
                  brightness: (el.brightness - 100) / 100,
                }),
              );
            }
            if (el.contrast !== undefined && el.contrast !== 100) {
              filters.push(
                new fabric.filters.Contrast({
                  contrast: (el.contrast - 100) / 100,
                }),
              );
            }
            if (el.saturation !== undefined && el.saturation !== 100) {
              filters.push(
                new fabric.filters.Saturation({
                  saturation: (el.saturation - 100) / 100,
                }),
              );
            }

            // Only update filters if they changed (simple check)
            imageObj.filters = filters;
            imageObj.applyFilters();
            imageObj.setCoords();
            needsRender = true;
          } else if (el.type === "shape") {
            (obj as any).set({
              fill: el.fill || "#3b82f6",
            });
            obj.setCoords();
            needsRender = true;
          }

        } else {
          // If object NOT found, it means it's a new element (e.g. from Paste)
          // We need to create it and add it to the canvas.
          if (
            el.type === "text" ||
            el.type === "IText" ||
            el.type === "textbox"
          ) {
            const textObj = new fabric.IText(el.content || "", {
              id: el.id,
              left: el.left,
              top: el.top,
              fill: el.color || "#000000",
              fontSize: el.fontSize || 20,
              fontFamily: el.fontFamily || "Arial",
              fontWeight: el.bold ? "bold" : "normal",
              fontStyle: el.italic ? "italic" : "normal",
              underline: el.underline || false,
              textAlign: el.align || "left",
              lineHeight: el.lineHeight || 1.2,
              scaleX: el.scaleX || 1,
              scaleY: el.scaleY || 1,
              angle: el.rotation || 0,
            });
            styleControls(textObj);
            canvas.add(textObj);
            needsRender = true;
          } else if (el.type === "image" || el.type === "Image") {
            if (el.url) {
              try {
                const imgElement = await fabric.util.loadImage(el.url, {
                  crossOrigin: "anonymous",
                });
                
                if (aborted || !fabricCanvasRef.current) return;

                const imageObj = new fabric.FabricImage(imgElement, {
                  id: el.id,
                  left: el.left,
                  top: el.top,
                  angle: el.rotation || 0,
                  scaleX: el.scaleX || el.width / imgElement.width || 1,
                  scaleY: el.scaleY || el.height / imgElement.height || 1,
                });

                styleControls(imageObj);
                canvas.add(imageObj);
                needsRender = true;
              } catch (err) {
                console.error("Error adding image during sync:", err);
              }
            }
          } else if (el.type === "shape") {
            let shape: fabric.FabricObject;
            const commonProps = {
              id: el.id,
              left: el.left,
              top: el.top,
              fill: el.fill || "#3b82f6",
              angle: el.rotation || 0,
              scaleX: el.scaleX || 1,
              scaleY: el.scaleY || 1,
            };

            if (el.shapeType === "rect") {
              shape = new fabric.Rect({
                ...commonProps,
                width: el.width || 100,
                height: el.height || 100,
              });
            } else if (el.shapeType === "circle") {
              shape = new fabric.Circle({
                ...commonProps,
                radius: (el.width || 100) / 2,
              });
            } else {
              shape = new fabric.Triangle({
                ...commonProps,
                width: el.width || 100,
                height: el.height || 100,
              });
            }
            styleControls(shape);
            canvas.add(shape);
            needsRender = true;
          }
        }
      }


      if (needsRender && !aborted && fabricCanvasRef.current) {
        canvas.requestRenderAll();
      }
    };

    syncElements();

    return () => {
      aborted = true;
    };
  }, [page.elements, page.id]);

  // Handle background color sync separately for smoothness
  useEffect(() => {
    if (fabricCanvasRef.current && page.backgroundColor) {
      fabricCanvasRef.current.set("backgroundColor", page.backgroundColor);
      fabricCanvasRef.current.renderAll();
    }
  }, [page.backgroundColor]);


  return (
    <div
      className="relative transition-transform duration-300 ease-out"
      style={{ 
        width: (page.width || 794), 
        height: (page.height || 1123),
        transform: `scale(${zoom})`,
        transformOrigin: "top center"
      }}
    >
      <canvas ref={canvasEl} />

      {/* Hover Tooltip/Alert */}
      {hoveredObject && (
        <div
          className="absolute z-[100] pointer-events-none transition-all duration-200 ease-out"
          style={{
            left: hoveredObject.x + hoveredObject.width / 2,
            top: hoveredObject.y - 40,
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg border border-blue-400/30 flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
            <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse" />
            Double click to edit
          </div>
          {/* Tooltip Arrow */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-600/90 mx-auto" />
        </div>
      )}
    </div>
  );
}
