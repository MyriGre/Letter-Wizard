// AI-AGENT-HEADER
// path: /src/types/editor.ts
// summary: Type definitions for letters, screens, and elements used by the editor.
// last-reviewed: 2025-12-08
// line-range: 1-120

export type DeviceMode = 'mobile' | 'desktop';

export type ElementType =
  | 'header'
  | 'subheader'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'button'
  | 'single-choice'
  | 'multiple-choice'
  | 'input'
  | 'file'
  | 'date'
  | 'date-input'
  | 'rating'
  | 'ranking'
  | 'group';

export type TextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number; // Numeric value (stored as number, rendered in rem)
  align?: 'left' | 'center' | 'right';
  fontFamily?: string;
  width?: number; // px
  height?: number; // px
  color?: string;
  borderRadius?: number;
};

export type BrandTheme = 'Bold' | 'Accent' | 'Minimal';

export type Brand = {
  id?: string;
  name?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  fontFamily?: string;
  fontHeader?: string;
  fontParagraph?: string;
  theme?: BrandTheme;
};

export interface BaseElement {
  id: string;
  type: ElementType;
  content?: string;
  props?: Record<string, unknown>;
  style?: TextStyle;
  parentId?: string;
}

export interface Screen {
  id: string;
  order: number;
  mode: 'scroll' | 'single-screen';
  elements: BaseElement[];
  style?: {
    background?: string;
    backgroundImage?: string;
    backgroundOverlayColor?: string;
    backgroundOverlayOpacity?: number;
    backgroundSize?: 'cover' | 'contain';
    backgroundPosition?: string;
    textColor?: string;
    accentColor?: string;
    buttonColor?: string;
    alignItems?: 'start' | 'center' | 'end';
    justifyContent?: 'start' | 'center' | 'end';
    variantKey?: string; // identifier of the selected preset
    elementSpacing?: number; // px gap between elements
  };
  title?: string;
  ctaLabel?: string;
  navNextLabel?: string;
  navBackLabel?: string;
  navDoneLabel?: string;
  navCloseLabel?: string;
}

export type UploadItem = {
  id: string;
  src: string;
  kind: 'image' | 'video';
  name?: string;
};

export interface Letter {
  id: string;
  title: string;
  description?: string;
  language?: string;
  brandId?: string;
  screens: Screen[];
}
