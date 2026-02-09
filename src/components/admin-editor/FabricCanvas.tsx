"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";

interface FabricCanvasProps {
  width: number;
  height: number;
  onCanvasReady: (canvas: fabric.Canvas) => void;
}

export default function FabricCanvas({
  width,
  height,
  onCanvasReady,
}: FabricCanvasProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasEl.current) return;

    // Create the canvas instance
    const canvas = new fabric.Canvas(canvasEl.current, {
      width,
      height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true, // Keep selected object in place (don't jump to top)
    });

    fabricCanvasRef.current = canvas;
    onCanvasReady(canvas);

    // Cleanup on unmount
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handle resizing
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({ width, height });
      fabricCanvasRef.current.renderAll();
    }
  }, [width, height]);

  return <canvas ref={canvasEl} />;
}
