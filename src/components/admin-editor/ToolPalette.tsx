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
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import * as fabric from "fabric";

interface ToolPaletteProps {
  canvas: fabric.Canvas | null;
}

export function ToolPalette({ canvas }: ToolPaletteProps) {
  const [activeTool, setActiveTool] = useState("select");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Tool Switching and Mode Setting
  useEffect(() => {
    if (!canvas) return;

    // Reset Defaults
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';

    // Apply Tool Specific Modes
    if (activeTool === 'pencil') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = 5;
        canvas.freeDrawingBrush.color = "#000000";
    } else if (activeTool === 'hand') {
        canvas.selection = false;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
    }

    canvas.requestRenderAll();

  }, [activeTool, canvas]);

  // Hand Tool Panning Logic
  useEffect(() => {
      if (!canvas) return;
      
      let isDragging = false;
      let lastPosX = 0;
      let lastPosY = 0;

      const onMouseDown = (opt: any) => {
          if (activeTool === 'hand') {
              const evt = opt.e;
              isDragging = true;
              canvas.selection = false;
              lastPosX = evt.clientX;
              lastPosY = evt.clientY;
              canvas.defaultCursor = 'grabbing';
          }
      };

      const onMouseMove = (opt: any) => {
          if (isDragging && activeTool === 'hand') {
              const evt = opt.e;
              const vpt = canvas.viewportTransform!;
              vpt[4] += evt.clientX - lastPosX;
              vpt[5] += evt.clientY - lastPosY;
              canvas.requestRenderAll();
              lastPosX = evt.clientX;
              lastPosY = evt.clientY;
          }
      };

      const onMouseUp = () => {
          if (activeTool === 'hand') {
            canvas.setViewportTransform(canvas.viewportTransform!);
            isDragging = false;
            canvas.defaultCursor = 'grab';
          }
      };

      canvas.on('mouse:down', onMouseDown);
      canvas.on('mouse:move', onMouseMove);
      canvas.on('mouse:up', onMouseUp);

      return () => {
          canvas.off('mouse:down', onMouseDown);
          canvas.off('mouse:move', onMouseMove);
          canvas.off('mouse:up', onMouseUp);
      }
  }, [canvas, activeTool]);

  const addShape = (type: string) => {
      if (!canvas) return;
      
      let obj: fabric.Object | null = null;
      // Get center of viewport
      const center = canvas.getVpCenter();
      const defaultProps = {
          left: center.x,
          top: center.y,
          fill: '#1C75BC',
          originX: 'center' as const,
          originY: 'center' as const,
      };

      switch (type) {
          case 'text':
              obj = new fabric.IText('Double click to edit', {
                  ...defaultProps,
                  fill: '#000000',
                  fontSize: 24,
                  fontFamily: 'Arial',
              });
              break;
          case 'rectangle':
              obj = new fabric.Rect({
                  ...defaultProps,
                  width: 100,
                  height: 100,
              });
              break;
          case 'ellipse':
              obj = new fabric.Circle({
                  ...defaultProps,
                  radius: 50,
              });
              break;
          case 'line':
               obj = new fabric.Line([0, 0, 100, 0], {
                  ...defaultProps,
                  stroke: '#1C75BC',
                  strokeWidth: 2,
               });
               break;
      }

      if (obj) {
          canvas.add(obj);
          canvas.setActiveObject(obj);
          canvas.requestRenderAll();
          // Ensure we are in select mode after adding
          setActiveTool('select');
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = async (f) => {
        const data = f.target?.result as string;
        if (file.type.includes('svg')) {
             // Handle SVG
             const { objects, options } = await fabric.loadSVGFromURL(data);
             const validObjects = objects.filter(obj => obj !== null && obj !== undefined) as fabric.Object[];
             const group = new fabric.Group(validObjects, options);
             // Ungroup for editing if preferred, or keep as group
             // User wants to edit, so maybe ungroup?
             // But usually importing image means keeping it as one unless explicitly ungrouped.
             // Wait, user said "in the svg there will be text image... edit it".
             // If they upload an SVG via this tool, it should probably be treated like the main canvas load.
             // Let's add it as a group first.
             const center = canvas.getVpCenter();
             group.set({
                 left: center.x,
                 top: center.y,
                 originX: 'center',
                 originY: 'center'
             });
             canvas.add(group);
             canvas.setActiveObject(group);
             // Auto-ungroup if it's complex? 
             // Let's leave it as group, user can double click to enter group (if enabled) or we can provide ungroup button.
             // For now, let's just add it.
        } else {
            // Handle Raster Images (PNG, JPG)
            const img = await fabric.FabricImage.fromURL(data);
            const center = canvas.getVpCenter();
            img.set({
                left: center.x,
                top: center.y,
                originX: 'center',
                originY: 'center'
            });
            // Scale down if too big
            if (img.width! > 500) {
                img.scaleToWidth(500);
            }
            canvas.add(img);
            canvas.setActiveObject(img);
        }
        canvas.requestRenderAll();
        setActiveTool('select');
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const tools = [
    { id: "select", icon: MousePointer2, label: "Selection Tool", action: () => setActiveTool('select') },
    { id: "text", icon: Type, label: "Type Tool", action: () => addShape('text') },
    { id: "image", icon: ImageIcon, label: "Image Tool", action: () => fileInputRef.current?.click() },
    { id: "rectangle", icon: Square, label: "Rectangle Tool", action: () => addShape('rectangle') },
    { id: "ellipse", icon: Circle, label: "Ellipse Tool", action: () => addShape('ellipse') },
    { id: "line", icon: Minus, label: "Line Tool", action: () => addShape('line') },
    { id: "pencil", icon: Pencil, label: "Pencil Tool", action: () => setActiveTool('pencil') },
    { id: "hand", icon: Hand, label: "Hand Tool", action: () => setActiveTool('hand') },
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
                if (tool.id === 'text' || tool.id === 'rectangle' || tool.id === 'ellipse' || tool.id === 'line' || tool.id === 'image') {
                    // One-off actions don't change state to themselves (except image which triggers input)
                    // But we might want to highlight them briefly or just run action.
                    tool.action();
                    // If it's a mode-less tool (add shape), we usually stay in 'select' or switch to it.
                    // The addShape function handles switching back to select.
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
    </div>
  );
}
