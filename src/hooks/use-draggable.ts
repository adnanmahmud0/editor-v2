"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useDraggable(initialX = 0, initialY = 0) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag on left click
    if (e.button !== 0) return;
    
    // Check if we should ignore (e.g. if clicking a button inside the handle)
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) return;

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    
    // Prevent text selection during drag
    e.preventDefault();
  }, [position.x, position.y]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  return { position, onMouseDown, isDragging };
}
