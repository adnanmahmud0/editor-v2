"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";

interface FabricCanvasProps {
  width: number;
  height: number;
  zoom?: number;
  onCanvasReady: (canvas: fabric.Canvas) => void;
}

export default function FabricCanvas({
  width,
  height,
  zoom = 1,
  onCanvasReady,
}: FabricCanvasProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasEl.current) return;

    // Create the canvas instance
    const canvas = new fabric.Canvas(canvasEl.current, {
      width: width * zoom,
      height: height * zoom,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      imageSmoothingEnabled: true,
    });

    // Disable object caching globally for maximum quality during zoom
    // This ensures that objects are re-rendered from paths rather than using a low-res cache
    fabric.Object.prototype.objectCaching = false;

    canvas.setZoom(zoom);

    fabricCanvasRef.current = canvas;
    onCanvasReady(canvas);

    // Cleanup on unmount
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handle resizing and zooming
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({ 
        width: width * zoom, 
        height: height * zoom 
      });
      fabricCanvasRef.current.setZoom(zoom);
      fabricCanvasRef.current.renderAll();
    }
  }, [width, height, zoom]);

  return <canvas ref={canvasEl} style={{ outline: "none" }} />;
}
