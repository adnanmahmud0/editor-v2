"use client";

import { useState, useEffect, useRef } from 'react';
import { Type, Image, Trash2, Eye, EyeOff, Layers, AlignLeft, AlignCenter, AlignRight, AlignJustify, AlignStartVertical as AlignTop, AlignCenterVertical as AlignMiddle, AlignEndVertical as AlignBottom, AlignCenterHorizontal as CenterHorizontal } from 'lucide-react';
import * as fabric from 'fabric';
import { ImageEditModal } from './ImageEditModal';
import { ImageElement, TextElement, Page } from './typs';
import { PageCanvas } from './PageCanvas';
import { TextEditModal } from './TextEditModal';

export function InvitationEditor() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [canvasInstances, setCanvasInstances] = useState<Record<number, fabric.Canvas>>({});
  const [editingText, setEditingText] = useState<TextElement | null>(null);
  const [editingImage, setEditingImage] = useState<ImageElement | null>(null);
  const [elementPosition, setElementPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleVisibility = () => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) return;

    const idsToToggle = activeObjects.map(obj => (obj as any).id || (obj.get && obj.get('id'))).filter(id => id && id !== 'unknown');
    if (idsToToggle.length === 0) return;

    setPages(prevPages => {
      return prevPages.map(p => {
        if (p.id !== currentPage) return p;

        const updatedElements = (p.elements || []).map((el: any) => {
          if (idsToToggle.includes(el.id)) {
            const newVisible = el.visible === false ? true : false;
            
            // Update the fabric object directly as well for immediate feedback
            const fabObj = canvas.getObjects().find(o => ((o as any).id === el.id) || (o.get && o.get('id') === el.id));
            if (fabObj) {
              fabObj.set('visible', newVisible);
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
      objs.forEach(obj => {
        const id = (obj as any).id || (obj.get && obj.get('id'));
        if (id && id !== 'unknown') {
          ids.push(id);
        }
        
        // Check for nested objects in groups
        const nestedObjects = obj._objects || (obj.getObjects && obj.getObjects());
        if (nestedObjects && nestedObjects.length > 0) {
          ids = [...ids, ...getAllIds(nestedObjects)];
        }
      });
      return ids;
    };

    const idsToRemove = getAllIds(activeObjects);
    if (idsToRemove.length === 0) return;
    
    // 1. Remove from Fabric canvas first
    activeObjects.forEach(obj => {
      canvas.remove(obj);
    });
    
    canvas.discardActiveObject();
    canvas.renderAll();
    
    // 2. Capture the new canvas state as JSON
    const newCanvasJson = canvas.toJSON(['id']);

    // 3. Update React state for pages
    setPages(prevPages => {
      return prevPages.map(p => {
        if (p.id !== currentPage) return p;
        
        // Filter out elements that were removed
        const filteredElements = (p.elements || []).filter((el: any) => {
          return !idsToRemove.includes(el.id);
        });

        return {
          ...p,
          elements: filteredElements,
          canvasData: newCanvasJson
        };
      });
    });

    // 4. Update other state
    setSelectedElement(null);
    setElementPosition(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, canvasInstances]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch('/project/project.json');
        const data = await response.json();
        if (data.pages) {
          // Initialize elements array for each page from canvasData if elements don't exist
          const initializedPages = data.pages.map((p: any) => {
            if (!p.elements && p.canvasData && p.canvasData.objects) {
              const elements: any[] = [];
              
              // Helper to extract editable elements from canvas objects
              const extractElements = (objects: any[]) => {
                objects.forEach((obj: any) => {
                  const type = obj.type?.toLowerCase();
                  
                  // Ensure EVERY object has an ID in the JSON
                  if (!obj.id) {
                    obj.id = `${type || 'element'}-${Math.random().toString(36).substr(2, 9)}`;
                  }
                  const id = obj.id;

                  // Add ALL objects to the elements list to track them in state
                  if (type === 'text' || type === 'itext' || type === 'textbox') {
                    elements.push({
                      id: id,
                      type: 'text',
                      content: obj.text || '',
                      x: obj.left,
                      y: obj.top,
                      fontSize: obj.fontSize,
                      fontFamily: obj.fontFamily,
                      color: obj.fill,
                      bold: obj.fontWeight === 'bold',
                      italic: obj.fontStyle === 'italic',
                      underline: obj.underline,
                      align: obj.textAlign || 'left'
                    });
                  } else if (type === 'image') {
                    elements.push({
                      id: id,
                      type: 'image',
                      url: obj.src || '',
                      x: obj.left,
                      y: obj.top,
                      width: obj.width * (obj.scaleX || 1),
                      height: obj.height * (obj.scaleY || 1),
                      rotation: obj.angle || 0,
                      brightness: 100,
                      contrast: 100,
                      saturation: 100
                    });
                  } else if (type === 'group') {
                    // Add the group itself to elements to track it
                    elements.push({
                      id: id,
                      type: 'group',
                      x: obj.left,
                      y: obj.top,
                      width: obj.width * (obj.scaleX || 1),
                      height: obj.height * (obj.scaleY || 1)
                    });
                  } else {
                    // Track other types (shapes, paths, etc.) generically so they don't get deleted by sync
                    elements.push({
                      id: id,
                      type: type,
                      x: obj.left,
                      y: obj.top
                    });
                  }
                  
                  if (obj.objects) {
                    extractElements(obj.objects);
                  }
                });
              };
              
              extractElements(p.canvasData.objects);
              return { ...p, elements };
            }
            return p;
          });

          setPages(initializedPages);
          if (initializedPages.length > 0) {
            setCurrentPage(initializedPages[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-blue-500 font-medium">Loading design...</div>
      </div>
    );
  }

  const page = pages.find(p => p.id === currentPage);

  const handleElementSelect = (elementId: string, position: { x: number; y: number; width: number; height: number }) => {
    if (!elementId || elementId === '') {
      setSelectedElement(null);
      setElementPosition(null);
      return;
    }
    setSelectedElement(elementId);
    setElementPosition(position);
  };

  const handleElementDoubleClick = (elementId: string, position: { x: number; y: number; width: number; height: number }, fabricObj?: any) => {
    if (!elementId || elementId === '') return;

    // Find the element in the page elements
    let element = page?.elements?.find((e: any) => e.id === elementId);
    
    // If not found in page.elements but we have fabricObj, create a virtual element for the modal
    if (!element && fabricObj) {
      const type = fabricObj.type?.toLowerCase();
      if (type === 'text' || type === 'itext' || type === 'textbox') {
        element = {
          id: elementId,
          type: 'text',
          content: fabricObj.text || '',
          x: fabricObj.left,
          y: fabricObj.top,
          fontSize: fabricObj.fontSize,
          fontFamily: fabricObj.fontFamily,
          color: fabricObj.fill,
          bold: fabricObj.fontWeight === 'bold',
          italic: fabricObj.fontStyle === 'italic',
          underline: fabricObj.underline,
          align: fabricObj.textAlign || 'left'
        };
      } else if (type === 'image') {
        const src = fabricObj.getSrc?.() || fabricObj._element?.src || fabricObj.src || '';
        element = {
          id: elementId,
          type: 'image',
          url: src,
          x: fabricObj.left,
          y: fabricObj.top,
          width: fabricObj.width * fabricObj.scaleX,
          height: fabricObj.height * fabricObj.scaleY,
          rotation: fabricObj.angle,
          brightness: 100,
          contrast: 100,
          saturation: 100
        };
      }
    }
    
    if (element) {
      setElementPosition(position);
      if (element.type === 'text') {
        setEditingText(element as TextElement);
      } else if (element.type === 'image') {
        setEditingImage(element as ImageElement);
      }
    }
  };

  const handleTextSave = (updatedText: TextElement) => {
    setPages(pages.map(p => {
      if (p.id === currentPage) {
        const elements = p.elements || [];
        const exists = elements.some((e: any) => e.id === updatedText.id);
        return {
          ...p,
          elements: exists 
            ? elements.map((e: any) => e.id === updatedText.id ? updatedText : e)
            : [...elements, updatedText]
        };
      }
      return p;
    }));
    setEditingText(null);
  };

  const handleImageUpdate = (updatedImage: ImageElement) => {
    console.log('Updating image:', updatedImage);
    const newPages = pages.map(p => {
      if (p.id === currentPage) {
        const elements = p.elements || [];
        const exists = elements.some((e: any) => e.id === updatedImage.id);
        const updatedElements = exists 
          ? elements.map((e: any) => e.id === updatedImage.id ? { ...updatedImage } : e)
          : [...elements, { ...updatedImage }];
        
        return {
          ...p,
          elements: updatedElements
        };
      }
      return p;
    });
    
    setPages(newPages);
    setEditingImage({ ...updatedImage });
  };

  const handleImageDelete = (imageId: string) => {
    setPages(pages.map(p => {
      if (p.id === currentPage) {
        return {
          ...p,
          elements: (p.elements || []).filter((e: any) => e.id !== imageId)
        };
      }
      return p;
    }));
    setEditingImage(null);
    setSelectedElement(null);
  };

  const downloadPDF = async () => {
    if (pages.length === 0) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      
      const firstPage = pages[0];
      const margin = 5; // Reduced margin for "less outside space"
      const pxToMm = 0.352778;
      
      const designWidthMm = (firstPage.width || 794) * pxToMm;
      const designHeightMm = (firstPage.height || 1123) * pxToMm;
      const pdfWidth = designWidthMm + (margin * 2);
      const pdfHeight = designHeightMm + (margin * 2);

      const doc = new jsPDF({
        orientation: designWidthMm > designHeightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        if (i > 0) {
          const pWidth = (p.width * pxToMm) + (margin * 2);
          const pHeight = (p.height * pxToMm) + (margin * 2);
          doc.addPage([pWidth, pHeight], p.width > p.height ? 'landscape' : 'portrait');
        }

        const activeCanvas = canvasInstances[p.id];
        let imgData = '';

        if (activeCanvas) {
          // Use the actual live canvas instance that has all user changes
          imgData = activeCanvas.toDataURL({
            format: 'png',
            multiplier: 2
          });
        } else if (p.canvasData) {
          // Fallback if canvas instance is somehow not available
          const tempCanvasEl = document.createElement('canvas');
          tempCanvasEl.width = p.width * 2;
          tempCanvasEl.height = p.height * 2;
          
          const staticCanvas = new fabric.StaticCanvas(tempCanvasEl, {
            width: p.width,
            height: p.height
          });

          await staticCanvas.loadFromJSON(p.canvasData);
          staticCanvas.renderAll();
          imgData = staticCanvas.toDataURL({
            format: 'png',
            multiplier: 2
          });
          staticCanvas.dispose();
        }

        if (imgData) {
          const pDesignWidthMm = p.width * pxToMm;
          const pDesignHeightMm = p.height * pxToMm;

          doc.addImage(imgData, 'PNG', margin, margin, pDesignWidthMm, pDesignHeightMm);

          // Draw professional cut marks as per user image
          doc.setDrawColor(0, 0, 0); // Black marks
          doc.setLineWidth(0.05); // Hairline thickness

          const markLen = 4; // Length of the mark
          const markOffset = 0.5; // Small gap from design

          // Top-left
          doc.line(margin - markLen - markOffset, margin, margin - markOffset, margin);
          doc.line(margin, margin - markLen - markOffset, margin, margin - markOffset);

          // Top-right
          doc.line(margin + pDesignWidthMm + markOffset, margin, margin + pDesignWidthMm + markLen + markOffset, margin);
          doc.line(margin + pDesignWidthMm, margin - markLen - markOffset, margin + pDesignWidthMm, margin - markOffset);

          // Bottom-left
          doc.line(margin - markLen - markOffset, margin + pDesignHeightMm, margin - markOffset, margin + pDesignHeightMm);
          doc.line(margin, margin + pDesignHeightMm + markOffset, margin, margin + pDesignHeightMm + markLen + markOffset);

          // Bottom-right
          doc.line(margin + pDesignWidthMm + markOffset, margin + pDesignHeightMm, margin + pDesignWidthMm + markLen + markOffset, margin + pDesignHeightMm);
          doc.line(margin + pDesignWidthMm, margin + pDesignHeightMm + markOffset, margin + pDesignWidthMm, margin + pDesignHeightMm + markLen + markOffset);
        }
      }

      doc.save('invitation-design.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleNext = async () => {
    const currentIndex = pages.findIndex(p => p.id === currentPage);
    if (currentIndex < pages.length - 1) {
      setCurrentPage(pages[currentIndex + 1].id);
    } else {
      await downloadPDF();
    }
  };

  const handleBack = () => {
    const currentIndex = pages.findIndex(p => p.id === currentPage);
    if (currentIndex > 0) {
      setCurrentPage(pages[currentIndex - 1].id);
    }
  };

  const handleAddText = () => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    // Use Textbox instead of IText to match the initial design elements
    const text = new fabric.Textbox('New Text', {
      left: 100,
      top: 100,
      width: 200, // Textbox needs a width
      fontFamily: 'Arial',
      fontSize: 40,
      fill: '#000000',
      id: `text-${Date.now()}`,
      editable: false, // Disable native editing to use modal
      lockScalingFlip: true,
      hasControls: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    // Also update elements array for consistency
    const newText: TextElement = {
      id: (text as any).id as string,
      type: 'text',
      content: 'New Text',
      x: 100,
      y: 100,
      fontSize: 40,
      fontFamily: 'Arial',
      color: '#000000',
      bold: false,
      italic: false,
      underline: false,
      align: 'left'
    };

    setPages(pages.map(p => {
      if (p.id === currentPage) {
        return {
          ...p,
          elements: [...(p.elements || []), newText]
        };
      }
      return p;
    }));
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      const canvas = canvasInstances[currentPage];
      if (!canvas) return;

      fabric.Image.fromURL(data, {
        crossOrigin: 'anonymous'
      }).then((img) => {
        // Scale image to fit canvas
        const scale = Math.min(200 / img.width!, 200 / img.height!);
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: 100,
          top: 100,
          id: `image-${Date.now()}`
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        // Update elements array
        const newImage: ImageElement = {
          id: (img as any).id as string,
          type: 'image',
          url: data,
          x: 100,
          y: 100,
          width: img.width! * scale,
          height: img.height! * scale,
          rotation: 0,
          brightness: 100,
          contrast: 100,
          saturation: 100
        };

        setPages(pages.map(p => {
          if (p.id === currentPage) {
            return {
              ...p,
              elements: [...(p.elements || []), newImage]
            };
          }
          return p;
        }));
      });
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const boundingRect = activeObject.getBoundingRect();
    const canvasWidth = canvas.width!;
    const canvasHeight = canvas.height!;

    switch (type) {
      case 'left':
        activeObject.set({ left: activeObject.left! - boundingRect.left });
        break;
      case 'center':
        canvas.centerObjectH(activeObject);
        break;
      case 'right':
        activeObject.set({ left: activeObject.left! + (canvasWidth - boundingRect.left - boundingRect.width) });
        break;
      case 'top':
        activeObject.set({ top: activeObject.top! - boundingRect.top });
        break;
      case 'middle':
        canvas.centerObjectV(activeObject);
        break;
      case 'bottom':
        activeObject.set({ top: activeObject.top! + (canvasHeight - boundingRect.top - boundingRect.height) });
        break;
    }

    activeObject.setCoords();
    canvas.renderAll();
    
    // Sync to state manually since programmatic changes don't always trigger object:modified
    const objectId = (activeObject as any).id;
    if (objectId) {
      setPages(prevPages => prevPages.map(p => {
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
              rotation: activeObject.angle
            };
          })
        };
      }));
    }
  };

  const handleTextPropertyChange = (property: string, value: any) => {
    const canvas = canvasInstances[currentPage];
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject || !(activeObject.type === 'text' || activeObject.type === 'itext' || activeObject.type === 'textbox')) return;

    activeObject.set({ [property]: value });
    canvas.renderAll();
    
    // Sync to state
    const objectId = (activeObject as any).id;
    if (objectId) {
      setPages(prevPages => prevPages.map(p => {
        if (p.id !== currentPage) return p;
        return {
          ...p,
          elements: p.elements.map((el: any) => {
            if (el.id !== objectId) return el;
            const updatedEl = { ...el, [property]: value };
            // If it's alignment, use the specific property name 'align' in our state
            if (property === 'textAlign') updatedEl.align = value;
            return updatedEl;
          })
        };
      }));
    }
  };

  const getActionButton = () => {
    if (currentPage === 1) return 'Next';
    if (currentPage === 3) return 'Checkout';
    return 'Next';
  };

  const steps = [
    { number: 1, label: 'Choose your background' },
    { number: 2, label: 'Customize your design' },
    { number: 3, label: 'Checkout' }
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
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  step.number === 2 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : step.number < 2
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step.number}
              </div>
              <div className={`mt-2 text-xs font-medium ${step.number === 2 ? 'text-blue-500' : 'text-gray-400'}`}>
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Page Thumbnails */}
      <div className="flex justify-center gap-4 py-6">
        {pages.map((p) => (
          <div key={p.id} className="text-center flex-shrink-0">
            <button
              onClick={() => setCurrentPage(p.id)}
              className={`w-14 h-18 bg-[#1a2b3c] border-2 rounded shadow-sm overflow-hidden transition-all ${
                currentPage === p.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent opacity-20'
              }`}
            >
              <div className="w-full h-full"></div>
            </button>
            <div className={`mt-1 text-[10px] font-medium ${currentPage === p.id ? 'text-blue-500' : 'text-gray-400'}`}>
              Page {p.id}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start pb-12">
        <div className="relative flex items-center">
          {/* Canvas Wrapper - Render all pages and show/hide them */}
          <div className="bg-white p-1 shadow-2xl rounded-sm">
            {pages.map((p) => (
              <div 
                key={p.id} 
                style={{ display: currentPage === p.id ? 'block' : 'none' }}
              >
                <PageCanvas
                  page={p}
                  selectedElement={selectedElement}
                  onElementSelect={handleElementSelect}
                  onElementDoubleClick={handleElementDoubleClick}
                  onCanvasReady={(canvas) => {
                    setCanvasInstances(prev => ({ ...prev, [p.id]: canvas }));
                    
                    canvas.on('object:modified', (e) => {
                      // Sync state back to pages when object is modified on canvas
                      const target = e.target;
                      if (target && (target as any).id) {
                        setPages(prevPages => prevPages.map(pageItem => {
                          if (pageItem.id !== p.id) return pageItem;
                          return {
                            ...pageItem,
                            elements: (pageItem.elements || []).map((el: any) => {
                              if (el.id !== (target as any).id) return el;
                              return {
                                ...el,
                                left: target.left,
                                 top: target.top,
                                 scaleX: target.scaleX,
                                 scaleY: target.scaleY,
                                 rotation: target.angle,
                                // If it's a text element, also sync content and other properties
                                ...(el.type === 'text' ? {
                                  content: (target as any).text,
                                  color: target.fill as string,
                                  fontSize: (target as any).fontSize,
                                  fontFamily: (target as any).fontFamily,
                                  bold: (target as any).fontWeight === 'bold',
                                  italic: (target as any).fontStyle === 'italic',
                                  underline: (target as any).underline,
                                  align: (target as any).textAlign
                                } : {})
                              };
                            })
                          };
                        }));
                      }
                    });

                    canvas.on('object:added', (e) => {
                      const target = e.target as any;
                      if (target && !target.id?.toString().includes('text-') && !target.id?.toString().includes('image-')) {
                        // Optional: handle other objects added
                      }
                    });
                  }}
                />
              </div>
            ))}
          </div>

          {/* Floating Right Toolbar */}
          <div className="absolute -right-16 top-0 flex flex-col gap-0 bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
            <button 
              onClick={handleAddText}
              className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-b border-gray-100 group"
              title="Add Text"
            >
              <Type className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-b border-gray-100 group"
              title="Add Image"
            >
              <Image className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </button>
            <button 
              onClick={handleToggleVisibility}
              className="w-12 h-12 flex items-center justify-center hover:bg-red-50 border-b border-gray-100 group disabled:opacity-30"
              title="Delete/Hide Object"
              disabled={!selectedElement}
            >
              {pages.find(p => p.id === currentPage)?.elements?.find((el: any) => el.id === selectedElement)?.visible === false ? (
                <Trash2 className="w-5 h-5 text-red-500 transition-colors" />
              ) : (
                <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
              )}
            </button>

            <button 
              onClick={() => setShowLayers(!showLayers)}
              className={`w-12 h-12 flex items-center justify-center hover:bg-gray-50 border-b border-gray-100 group transition-colors ${showLayers ? 'bg-blue-50' : ''}`}
              title="Layers"
            >
              <Layers className={`w-5 h-5 ${showLayers ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'}`} />
            </button>

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
                {/* Text Alignment - Only for text elements */}
                {pages.find(p => p.id === currentPage)?.elements.find((el: any) => el.id === selectedElement)?.type === 'text' && (
                  <div className="flex flex-col border-t border-gray-100 bg-blue-50/30">
                    <button 
                      onClick={() => handleTextPropertyChange('textAlign', 'left')}
                      className="w-12 h-10 flex items-center justify-center hover:bg-white group transition-colors"
                      title="Text Align Left"
                    >
                      <AlignLeft className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    </button>
                    <button 
                      onClick={() => handleTextPropertyChange('textAlign', 'center')}
                      className="w-12 h-10 flex items-center justify-center hover:bg-white group transition-colors"
                      title="Text Align Center"
                    >
                      <AlignCenter className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    </button>
                    <button 
                      onClick={() => handleTextPropertyChange('textAlign', 'right')}
                      className="w-12 h-10 flex items-center justify-center hover:bg-white group transition-colors"
                      title="Text Align Right"
                    >
                      <AlignRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    </button>
                    <button 
                      onClick={() => handleTextPropertyChange('textAlign', 'justify')}
                      className="w-12 h-10 flex items-center justify-center hover:bg-white group transition-colors"
                      title="Text Align Justify"
                    >
                      <AlignJustify className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    </button>
                  </div>
                )}

                {/* Object Positioning Alignment */}
                <div className="flex flex-col border-t border-gray-100 bg-gray-50/50">
                  <button 
                    onClick={() => handleAlign('left')}
                    className="w-12 h-12 flex items-center justify-center hover:bg-white group transition-colors"
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </button>
                  <button 
                    onClick={() => handleAlign('center')}
                    className="w-12 h-12 flex items-center justify-center hover:bg-white group transition-colors"
                    title="Align Center Horizontally"
                  >
                    <CenterHorizontal className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </button>
                  <button 
                    onClick={() => handleAlign('right')}
                    className="w-12 h-12 flex items-center justify-center hover:bg-white group transition-colors"
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </button>
                  <button 
                    onClick={() => handleAlign('top')}
                    className="w-12 h-12 flex items-center justify-center hover:bg-white group transition-colors"
                    title="Align Top"
                  >
                    <AlignTop className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </button>
                  <button 
                    onClick={() => handleAlign('middle')}
                    className="w-12 h-12 flex items-center justify-center hover:bg-white group transition-colors"
                    title="Align Middle Vertically"
                  >
                    <AlignMiddle className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </button>
                  <button 
                    onClick={() => handleAlign('bottom')}
                    className="w-12 h-12 flex items-center justify-center hover:bg-white group transition-colors"
                    title="Align Bottom"
                  >
                    <AlignBottom className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
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
                <button onClick={() => setShowLayers(false)} className="text-gray-400 hover:text-gray-600">×</button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pages.find(p => p.id === currentPage)?.elements?.slice().reverse().map((el: any) => (
                  <div 
                    key={el.id} 
                    className={`flex items-center justify-between p-2 rounded border ${selectedElement === el.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div 
                      className="flex items-center gap-2 cursor-pointer flex-1 overflow-hidden"
                      onClick={() => {
                        setSelectedElement(el.id);
                        const canvas = canvasInstances[currentPage];
                        if (canvas) {
                          const obj = canvas.getObjects().find(o => ((o as any).id === el.id) || (o.get && o.get('id') === el.id));
                          if (obj && el.visible !== false) {
                            canvas.setActiveObject(obj);
                            canvas.renderAll();
                          }
                        }
                      }}
                    >
                      {el.type === 'text' ? <Type className="w-4 h-4 text-gray-400 shrink-0" /> : <Image className="w-4 h-4 text-gray-400 shrink-0" />}
                      <span className="text-sm truncate text-gray-600">
                        {el.type === 'text' ? el.content || 'Text' : (el.type === 'image' ? 'Image' : el.type)}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPages(prevPages => {
                          return prevPages.map(p => {
                            if (p.id !== currentPage) return p;
                            const updatedElements = (p.elements || []).map((element: any) => {
                              if (element.id === el.id) {
                                const newVisible = element.visible === false ? true : false;
                                const canvas = canvasInstances[currentPage];
                                if (canvas) {
                                  const fabObj = canvas.getObjects().find(o => ((o as any).id === el.id) || (o.get && o.get('id') === el.id));
                                  if (fabObj) {
                                    fabObj.set('visible', newVisible);
                                    if (!newVisible) canvas.discardActiveObject();
                                    canvas.renderAll();
                                  }
                                }
                                return { ...element, visible: newVisible };
                              }
                              return element;
                            });
                            return { ...p, elements: updatedElements };
                          });
                        });
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-500"
                    >
                      {el.visible === false ? <Trash2 className="w-4 h-4 text-red-500" /> : <Trash2 className="w-4 h-4" />}
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
            disabled={pages.findIndex(p => p.id === currentPage) === 0}
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
          onSave={handleTextSave}
          onCancel={() => {
            setEditingText(null);
            setSelectedElement(null);
          }}
        />
      )}

      {editingImage && elementPosition && (
        <ImageEditModal
          image={editingImage}
          position={elementPosition}
          onUpdate={handleImageUpdate}
          onDelete={handleImageDelete}
          onClose={() => {
            setEditingImage(null);
            setSelectedElement(null);
          }}
        />
      )}
    </div>
  );
}