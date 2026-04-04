export interface BaseElement {
  id: string;
  visible?: boolean;
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

export type PageElement = TextElement | ImageElement | any;

export interface Page {
  id: number;
  elements: PageElement[];
}