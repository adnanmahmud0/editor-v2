"use client";

import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

interface PageCanvasProps {
  page: any;
  selectedElement: string | null;
  onElementSelect: (id: string, position: { x: number; y: number; width: number; height: number }) => void;
  onElementDoubleClick: (id: string, position: { x: number; y: number; width: number; height: number }, fabricObj?: fabric.Object) => void;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export function PageCanvas({ page, selectedElement, onElementSelect, onElementDoubleClick, onCanvasReady }: PageCanvasProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // Expose update function to parent via ref or effect if needed
  // For now, we'll rely on the parent updating the page state and this component re-rendering

  useEffect(() => {
    if (!canvasEl.current) return;

    // Initialize fabric canvas
    const canvas = new fabric.Canvas(canvasEl.current, {
      width: page.width || 794,
      height: page.height || 1123,
      backgroundColor: '#ffffff',
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
        const processObjects = (fabObjs: any[], jsonObjs: any[]) => {
          fabObjs.forEach((obj: any, index: number) => {
            const jsonObj = jsonObjs[index];
            
            // Sync ID from JSON if missing on Fabric object
            if (!obj.id && jsonObj && jsonObj.id) {
              obj.id = jsonObj.id;
            }
            
            // Assign a unique ID if still missing
            if (!obj.id) {
              const type = obj.type?.toLowerCase();
              obj.id = `${type || 'element'}-${Math.random().toString(36).substr(2, 9)}`;
            }

            // Ensure the ID is set as a property that Fabric's get('id') can see
            if (obj.set) {
              obj.set('id', obj.id);
            }
            
            obj.set({
              hasControls: true,
              lockScalingFlip: true,
              editable: false,
              // Make sure objects are not protected from deletion
              selectable: true,
              evented: true
            });

            const nestedFabObjects = obj._objects || (obj.getObjects && obj.getObjects());
            if (nestedFabObjects && jsonObj && jsonObj.objects) {
              processObjects(nestedFabObjects, jsonObj.objects);
            }
          });
        };

        processObjects(canvasObjects, jsonObjects);
        canvas.renderAll();
      });
    }

    // Handle object selection
    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        handleObjectSelection(obj);
      }
    });

    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        handleObjectSelection(obj);
      }
    });

    canvas.on('selection:cleared', () => {
      onElementSelect('', { x: 0, y: 0, width: 0, height: 0 });
    });

    // Handle object double click
    canvas.on('mouse:dblclick', (e) => {
      const obj = e.target;
      if (obj) {
        const bound = obj.getBoundingRect();
        const id = (obj as any).id || 'unknown';
        onElementDoubleClick(id, {
          x: bound.left,
          y: bound.top,
          width: bound.width,
          height: bound.height,
        }, obj);
      }
    });

    // Handle object modifications (moving, scaling)
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (obj) {
        handleObjectSelection(obj);
      }
    });

    const handleObjectSelection = (obj: fabric.Object) => {
      const bound = obj.getBoundingRect();
      // Ensure we get the ID from the object, checking custom properties if needed
      const id = (obj as any).id || (obj.get && (obj.get as any)('id'));
      console.log('Object selected in canvas:', obj.type, 'ID:', id);
      
      onElementSelect(id || 'unknown', {
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
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    // CRITICAL: If page.elements is defined, it is our source of truth for what SHOULD exist.
    if (!page.elements) return;

    // Simple sync: find objects in canvas and update them based on page elements
    const syncElements = async () => {
      let needsRender = false;
      const currentObjects = canvas.getObjects();
      
      // Collect ALL valid IDs from page.elements, including any nested IDs if they were expanded
      const elementIds = new Set(page.elements.map((el: any) => el.id));

      // 1. Remove objects from canvas ONLY if they have an ID and that ID is definitely not in state.
      // We skip objects without IDs to avoid deleting internal Fabric objects or temporary layers.
      // IMPORTANT: We only do this if the number of elements in state has actually decreased,
      // to prevent mass-deletion during initial load or unrelated state updates.
      const canvasObjects = canvas.getObjects();
      
      // Safety check: if elementIds is empty but we have canvas objects, 
      // it might mean the state hasn't loaded yet. Don't clear the canvas.
      if (elementIds.size === 0 && canvasObjects.length > 0) {
        console.warn('Sync: elementIds is empty but canvas has objects. Skipping removal for safety.');
      } else {
        canvasObjects.forEach(obj => {
          const id = (obj as any).id || (obj.get && obj.get('id'));
          
          // Only process objects with a tracking ID
          if (id && id !== 'unknown') {
            const existsInState = elementIds.has(id);
            
            if (!existsInState) {
              // Check if it's a child of a group that might still be in state
              let parent = obj.group;
              let parentInState = false;
              while (parent) {
                const parentId = (parent as any).id || (parent.get && parent.get('id'));
                if (parentId && elementIds.has(parentId)) {
                  parentInState = true;
                  break;
                }
                parent = parent.group;
              }

              if (!parentInState) {
                console.log('Sync: Removing object from canvas that was deleted from state:', id);
                canvas.remove(obj);
                needsRender = true;
              }
            }
          }
        });
      }

      // Helper to find object by ID recursively
      const findObjectById = (objects: fabric.FabricObject[], id: string): fabric.FabricObject | null => {
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
        const obj = findObjectById(canvas.getObjects(), el.id);
        if (obj) {
          needsRender = true;

          // Sync visibility
          const isVisible = el.visible !== false;
          if (obj.visible !== isVisible) {
            obj.set('visible', isVisible);
            if (!isVisible && canvas.getActiveObjects().includes(obj)) {
              canvas.discardActiveObject();
            }
          }

          if (el.type === 'text' || el.type === 'IText' || el.type === 'textbox') {
            (obj as any).set({ 
              text: el.content, 
              fill: el.color, 
              fontSize: el.fontSize,
              fontFamily: el.fontFamily,
              fontWeight: el.bold ? 'bold' : 'normal',
              fontStyle: el.italic ? 'italic' : 'normal',
              underline: el.underline,
              textAlign: el.align
            });
          } else if (el.type === 'image' || el.type === 'Image') {
            const imageObj = obj as fabric.FabricImage;
            
            // Update rotation
            if (imageObj.angle !== el.rotation) {
              imageObj.set({ angle: el.rotation });
              needsRender = true;
            }

            // Update source if changed
            const currentSrc = (imageObj as any).getSrc?.() || (imageObj as any)._element?.src || (imageObj as any).src;
            
            // Use a more robust check for data URLs or just check if it's a different string
            if (el.url && currentSrc !== el.url) {
              console.log('Updating image source for', el.id);
              try {
                // In Fabric 7, we can use fabric.util.loadImage
                const imgElement = await fabric.util.loadImage(el.url, {
                  crossOrigin: 'anonymous'
                });
                
                imageObj.setElement(imgElement);
                imageObj.set({
                  width: imgElement.width,
                  height: imgElement.height
                });

                // If we have specific width/height in the element from previous state, 
                // we might need to rescale, but usually we want to keep the scale 
                // or match the new image dimensions to the old ones.
                // For now, let's just ensure it's updated.
                
                if (el.width && el.height) {
                  imageObj.scaleToWidth(el.width);
                  imageObj.scaleToHeight(el.height);
                }
                
                // If the object is in a group, we need to mark the group as dirty
                let parent = imageObj.group;
                while (parent) {
                  parent.set({ dirty: true });
                  parent = parent.group;
                }

                needsRender = true;
              } catch (err) {
                console.error('Error updating image source:', err);
              }
            }

            // Apply filters
            const filters: any[] = [];
            
            if (el.brightness !== undefined && el.brightness !== 100) {
              filters.push(new fabric.filters.Brightness({ brightness: (el.brightness - 100) / 100 }));
            }
            if (el.contrast !== undefined && el.contrast !== 100) {
              filters.push(new fabric.filters.Contrast({ contrast: (el.contrast - 100) / 100 }));
            }
            if (el.saturation !== undefined && el.saturation !== 100) {
              filters.push(new fabric.filters.Saturation({ saturation: (el.saturation - 100) / 100 }));
            }

            // Only update filters if they changed (simple check)
            imageObj.filters = filters;
            imageObj.applyFilters();
            imageObj.setCoords();
            needsRender = true;
          }
        }
      }
      
      if (needsRender) {
        canvas.requestRenderAll();
      }
    };

    syncElements();
  }, [page.elements, page.id]); // Added page.id to ensure sync on page switch too

  return (
    <div className="relative bg-white shadow-lg" style={{ width: page.width || 794, height: page.height || 1123 }}>
      <canvas ref={canvasEl} />
    </div>
  );
}