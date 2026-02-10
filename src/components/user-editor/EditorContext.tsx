import { createContext, useContext, useState, ReactNode } from "react";

export interface TextElement {
  id: string;
  type: "text";
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
}

export interface ImageElement {
  id: string;
  type: "image";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export type Element = TextElement | ImageElement;

export interface Page {
  id: string;
  elements: Element[];
  background?: string;
}

interface EditorContextType {
  pages: Page[];
  currentPageIndex: number;
  selectedElementId: string | null;
  setPages: (pages: Page[]) => void;
  setCurrentPageIndex: (index: number) => void;
  setSelectedElementId: (id: string | null) => void;
  addElement: (element: Element) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElement: (id: string) => void;
  getCurrentPage: () => Page;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<Page[]>([
    { id: "1", elements: [] },
    { id: "2", elements: [] },
    { id: "3", elements: [] },
    { id: "4", elements: [] },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );

  const getCurrentPage = () => pages[currentPageIndex];

  const addElement = (element: Element) => {
    const newPages = [...pages];
    newPages[currentPageIndex].elements.push(element);
    setPages(newPages);
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    const newPages = [...pages];
    const elementIndex = newPages[currentPageIndex].elements.findIndex(
      (el) => el.id === id,
    );
    if (elementIndex !== -1) {
      newPages[currentPageIndex].elements[elementIndex] = {
        ...newPages[currentPageIndex].elements[elementIndex],
        ...updates,
      } as Element;
      setPages(newPages);
    }
  };

  const deleteElement = (id: string) => {
    const newPages = [...pages];
    newPages[currentPageIndex].elements = newPages[
      currentPageIndex
    ].elements.filter((el) => el.id !== id);
    setPages(newPages);
    setSelectedElementId(null);
  };

  return (
    <EditorContext.Provider
      value={{
        pages,
        currentPageIndex,
        selectedElementId,
        setPages,
        setCurrentPageIndex,
        setSelectedElementId,
        addElement,
        updateElement,
        deleteElement,
        getCurrentPage,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return context;
}
