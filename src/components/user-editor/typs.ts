export interface BaseElement {
  id: string;
  visible?: boolean;
  opacity?: number;
}


export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  left: number;
  top: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  url: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
}
export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rect' | 'circle' | 'triangle';
  left: number;
  top: number;
  width: number;
  height: number;
  fill: string;
  rotation: number;
  scaleX?: number;
  scaleY?: number;
}

export type PageElement = TextElement | ImageElement | ShapeElement | any;

export interface Page {
  id: number;
  elements: PageElement[];
  backgroundColor?: string;
}