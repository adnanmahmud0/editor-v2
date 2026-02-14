"use client";

import {
  MousePointer2,
  Hand,
  Type,
  Square,
  Circle,
  Minus,
  Pencil,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  FoldVertical,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import * as fabric from "fabric";

interface ToolPaletteProps {
  canvas: fabric.Canvas | null;
}

export function ToolPalette({ canvas }: ToolPaletteProps) {
  const [activeTool, setActiveTool] = useState("select");
  const [hasSelection, setHasSelection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Tool Switching and Mode Setting
  useEffect(() => {
    if (!canvas) return;

    const fabricCanvas = canvas;

    // Reset Defaults
    // eslint-disable-next-line
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = true;
    fabricCanvas.defaultCursor = "default";
    fabricCanvas.hoverCursor = "move";

    // Apply Tool Specific Modes
    if (activeTool === "pencil") {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      // eslint-disable-next-line
      fabricCanvas.freeDrawingBrush.width = 5;
      fabricCanvas.freeDrawingBrush.color = "#000000";
    } else if (activeTool === "hand") {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "grab";
      fabricCanvas.hoverCursor = "grab";
    } else if (activeTool === "text") {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "text";
      fabricCanvas.hoverCursor = "text";
    }

    fabricCanvas.requestRenderAll();
  }, [activeTool, canvas]);

  // Track Selection State
  useEffect(() => {
    if (!canvas) return;

    const updateSelection = () => {
      setHasSelection(!!canvas.getActiveObject());
    };

    canvas.on("selection:created", updateSelection);
    canvas.on("selection:updated", updateSelection);
    canvas.on("selection:cleared", updateSelection);

    return () => {
      canvas.off("selection:created", updateSelection);
      canvas.off("selection:updated", updateSelection);
      canvas.off("selection:cleared", updateSelection);
    };
  }, [canvas]);

  // Hand Tool Panning Logic and Shape Creation
  useEffect(() => {
    if (!canvas) return;

    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;
    let startX = 0;
    let startY = 0;
    let activeObject: fabric.Object | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMouseDown = (opt: any) => {
      const evt = opt.e;
      const pointer = canvas.getScenePoint(evt);

      if (activeTool === "hand") {
        isDragging = true;
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        canvas.defaultCursor = "grabbing";
      } else if (activeTool === "text") {
        isDragging = true;
        startX = pointer.x;
        startY = pointer.y;

        // Create Textbox immediately
        const text = new fabric.Textbox("", {
          left: startX,
          top: startY,
          width: 0,
          fontSize: 20,
          fontFamily: "Arial",
          fill: "#000000",
          splitByGrapheme: true,
        });
        canvas.add(text);
        activeObject = text;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMouseMove = (opt: any) => {
      const evt = opt.e;
      const pointer = canvas.getScenePoint(evt);

      if (isDragging && activeTool === "hand") {
        const vpt = canvas.viewportTransform!;
        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      } else if (isDragging && activeTool === "text" && activeObject) {
        const width = Math.abs(pointer.x - startX);
        (activeObject as fabric.Textbox).set({ width: Math.max(20, width) });
        canvas.requestRenderAll();
      }
    };

    const onMouseUp = () => {
      if (activeTool === "hand") {
        canvas.setViewportTransform(canvas.viewportTransform!);
        isDragging = false;
        canvas.defaultCursor = "grab";
      } else if (activeTool === "text") {
        if (activeObject) {
          // If width is very small (click), set default width
          if (activeObject.width! < 20) {
            activeObject.set({ width: 300, text: "Double click to edit" });
          } else {
            if ((activeObject as fabric.Textbox).text === "") {
              (activeObject as fabric.Textbox).set({
                text: "Double click to edit",
              });
            }
          }
          activeObject.setCoords();
          canvas.setActiveObject(activeObject);
          canvas.requestRenderAll();
        }
        isDragging = false;
        activeObject = null;
        setActiveTool("select");
      }
    };

    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);

    return () => {
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:up", onMouseUp);
    };
  }, [canvas, activeTool]);

  const addShape = (type: string) => {
    if (!canvas) return;

    let obj: fabric.Object | null = null;
    // Get center of viewport
    const center = canvas.getVpCenter();
    const defaultProps = {
      left: center.x,
      top: center.y,
      fill: "#1C75BC",
      originX: "center" as const,
      originY: "center" as const,
    };

    switch (type) {
      case "text":
        obj = new fabric.Textbox("Double click to edit", {
          ...defaultProps,
          fill: "#000000",
          fontSize: 24,
          fontFamily: "Arial",
          width: 300, // Set a fixed width for wrapping
        });
        break;
      case "rectangle":
        obj = new fabric.Rect({
          ...defaultProps,
          width: 100,
          height: 100,
        });
        break;
      case "ellipse":
        obj = new fabric.Circle({
          ...defaultProps,
          radius: 50,
        });
        break;
      case "line":
        obj = new fabric.Line([0, 0, 100, 0], {
          ...defaultProps,
          stroke: "#1C75BC",
          strokeWidth: 2,
        });
        break;
    }

    if (obj) {
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      // Ensure we are in select mode after adding
      setActiveTool("select");
    }
  };

  const handleAlign = (alignment: string) => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const canvasWidth = canvas.width!;
    const canvasHeight = canvas.height!;
    const bound = activeObject.getBoundingRect();

    switch (alignment) {
      case "left":
        activeObject.set({ left: activeObject.left! - bound.left });
        break;
      case "center":
        canvas.centerObjectH(activeObject);
        break;
      case "right":
        activeObject.set({
          left: activeObject.left! + (canvasWidth - (bound.left + bound.width)),
        });
        break;
      case "top":
        activeObject.set({ top: activeObject.top! - bound.top });
        break;
      case "middle":
        canvas.centerObjectV(activeObject);
        break;
      case "bottom":
        activeObject.set({
          top: activeObject.top! + (canvasHeight - (bound.top + bound.height)),
        });
        break;
    }
    activeObject.setCoords();
    canvas.requestRenderAll();
    canvas.fire("object:modified");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = async (f) => {
      const data = f.target?.result as string;
      if (file.type.includes("svg")) {
        // Handle SVG
        const { objects, options } = await fabric.loadSVGFromURL(data);
        const validObjects = objects.filter(
          (obj) => obj !== null && obj !== undefined,
        ) as fabric.Object[];

        const processedObjects = validObjects.map((obj) => {
          if (obj.type === "text" || obj.type === "i-text") {
            const textObj = obj as fabric.Text;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { type: _type, ...objProps } = textObj.toObject() as any;
            console.log(_type); // Use it to satisfy linter
            return new fabric.Textbox(textObj.text || "", {
              ...objProps,
              width: textObj.width || 300,
            });
          }
          return obj;
        });

        const group = new fabric.Group(processedObjects, options);

        // Update canvas size to match SVG dimensions if the helper is available
        const svgWidth =
          typeof options.width === "number"
            ? options.width
            : parseFloat(options.width) || group.width || 800;
        const svgHeight =
          typeof options.height === "number"
            ? options.height
            : parseFloat(options.height) || group.height || 600;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((canvas as any).updatePageSize) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (canvas as any).updatePageSize(svgWidth, svgHeight);
        }

        const center = { x: svgWidth / 2, y: svgHeight / 2 };
        group.set({
          left: center.x,
          top: center.y,
          originX: "center",
          originY: "center",
          subTargetCheck: true, // Enable sub-selection
        });

        canvas.add(group);
        canvas.setActiveObject(group);
      } else {
        // Handle Raster Images (PNG, JPG)
        const img = await fabric.FabricImage.fromURL(data);
        const center = canvas.getVpCenter();
        img.set({
          left: center.x,
          top: center.y,
          originX: "center",
          originY: "center",
        });
        // Scale down if too big
        if (img.width! > 500) {
          img.scaleToWidth(500);
        }
        canvas.add(img);
        canvas.setActiveObject(img);
      }
      canvas.requestRenderAll();
      setActiveTool("select");
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const tools = [
    {
      id: "select",
      icon: MousePointer2,
      label: "Selection Tool",
      action: () => setActiveTool("select"),
    },
    {
      id: "text",
      icon: Type,
      label: "Textarea Tool",
      action: () => setActiveTool("text"),
    },
    {
      id: "image",
      icon: ImageIcon,
      label: "Image Tool",
      action: () => fileInputRef.current?.click(),
    },
    {
      id: "rectangle",
      icon: Square,
      label: "Rectangle Tool",
      action: () => addShape("rectangle"),
    },
    {
      id: "ellipse",
      icon: Circle,
      label: "Ellipse Tool",
      action: () => addShape("ellipse"),
    },
    {
      id: "line",
      icon: Minus,
      label: "Line Tool",
      action: () => addShape("line"),
    },
    {
      id: "pencil",
      icon: Pencil,
      label: "Pencil Tool",
      action: () => setActiveTool("pencil"),
    },
    {
      id: "hand",
      icon: Hand,
      label: "Hand Tool",
      action: () => setActiveTool("hand"),
    },
  ];

  return (
    <div className="w-16 bg-white border-r border-[#D1E1EF] flex flex-col items-center py-3 gap-1">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.svg"
        onChange={handleImageUpload}
      />

      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            onClick={() => {
              if (
                tool.id === "text" ||
                tool.id === "rectangle" ||
                tool.id === "ellipse" ||
                tool.id === "line" ||
                tool.id === "image"
              ) {
                tool.action();
              } else {
                tool.action();
              }
            }}
            className={`w-11 h-11 flex items-center justify-center rounded transition-colors group relative ${
              isActive
                ? "bg-[#1C75BC] text-white"
                : "text-slate-400 hover:bg-[#E8F1F8] hover:text-[#1C75BC]"
            }`}
            title={tool.label}
          >
            <Icon className="w-5 h-5" />

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1C75BC] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {tool.label}
            </div>
          </button>
        );
      })}

      {/* Alignment Tools Separator */}
      <div className="w-8 h-px bg-slate-200 my-2" />

      {/* Alignment Tools */}
      <div
        className={`flex flex-col gap-1 ${!hasSelection ? "opacity-50 pointer-events-none" : ""}`}
      >
        <button
          onClick={() => handleAlign("left")}
          className="w-11 h-11 flex items-center justify-center rounded text-slate-400 hover:bg-[#E8F1F8] hover:text-[#1C75BC] group relative"
          title="Align Left"
        >
          <AlignLeft className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1C75BC] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Align Left
          </div>
        </button>
        <button
          onClick={() => handleAlign("center")}
          className="w-11 h-11 flex items-center justify-center rounded text-slate-400 hover:bg-[#E8F1F8] hover:text-[#1C75BC] group relative"
          title="Align Center"
        >
          <AlignCenter className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1C75BC] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Align Center
          </div>
        </button>
        <button
          onClick={() => handleAlign("right")}
          className="w-11 h-11 flex items-center justify-center rounded text-slate-400 hover:bg-[#E8F1F8] hover:text-[#1C75BC] group relative"
          title="Align Right"
        >
          <AlignRight className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1C75BC] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Align Right
          </div>
        </button>
        <button
          onClick={() => handleAlign("top")}
          className="w-11 h-11 flex items-center justify-center rounded text-slate-400 hover:bg-[#E8F1F8] hover:text-[#1C75BC] group relative"
          title="Align Top"
        >
          <ArrowUpToLine className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1C75BC] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Align Top
          </div>
        </button>
        <button
          onClick={() => handleAlign("middle")}
          className="w-11 h-11 flex items-center justify-center rounded text-slate-400 hover:bg-[#E8F1F8] hover:text-[#1C75BC] group relative"
          title="Align Middle"
        >
          <FoldVertical className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1C75BC] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Align Middle
          </div>
        </button>
        <button
          onClick={() => handleAlign("bottom")}
          className="w-11 h-11 flex items-center justify-center rounded text-slate-400 hover:bg-[#E8F1F8] hover:text-[#1C75BC] group relative"
          title="Align Bottom"
        >
          <ArrowDownToLine className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1C75BC] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Align Bottom
          </div>
        </button>
      </div>
    </div>
  );
}
