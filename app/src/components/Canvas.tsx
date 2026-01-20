// AI-AGENT-HEADER
// path: /src/components/Canvas.tsx
// summary: Editor canvas that renders the letter, supports selection, inline editing, and a floating toolbar.
// last-reviewed: 2025-12-08
// line-range: 1-505

import { Button } from './ui/button';
import { useEditorStore } from '../store/editorStore';
import type { BaseElement, ElementType, Screen, TextStyle } from '../types/editor';
import { cn } from '../lib/cn';
import { CANVAS_ELEMENT_DRAG_TYPE, ELEMENT_DRAG_TYPE, MEDIA_URL_DRAG_TYPE } from '../constants/dnd';
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { getAccessibleTextColor } from './DesignSuggestionPanel';

const textTypes = new Set<BaseElement['type']>(['header', 'subheader', 'paragraph', 'button']);
const resizableTypes = new Set<BaseElement['type']>(['header', 'subheader', 'paragraph', 'button', 'image', 'video']);
const questionElementTypes = new Set<ElementType>([
  'single-choice',
  'multiple-choice',
  'input',
  'file',
  'date',
  'date-input',
  'rating',
  'ranking',
]);

const elementTypeValues: ElementType[] = [
  'header',
  'subheader',
  'paragraph',
  'image',
  'video',
  'button',
  'single-choice',
  'multiple-choice',
  'input',
  'file',
  'date',
  'date-input',
  'rating',
  'ranking',
  'group',
];
const elementTypeSet = new Set<ElementType>(elementTypeValues);
function parseDragPayload(
  dt: DataTransfer,
  screen?: Screen,
  fallbackMoveId?: string | null,
  fallbackNew?: { type?: ElementType; content?: string } | null,
): { type?: ElementType; moveId?: string; content?: string } {
  const typeRaw = dt.getData(ELEMENT_DRAG_TYPE) || '';
  const moveIdRaw = dt.getData(CANVAS_ELEMENT_DRAG_TYPE) || '';
  const contentRaw = dt.getData(MEDIA_URL_DRAG_TYPE) || dt.getData('text/uri-list') || '';
  const plain = dt.getData('text/plain') || '';

  let type: ElementType | undefined = elementTypeSet.has(typeRaw as ElementType) ? (typeRaw as ElementType) : undefined;
  let moveId = moveIdRaw || (fallbackMoveId ?? undefined);
  let content = contentRaw || undefined;

  if (!type && elementTypeSet.has(plain as ElementType)) type = plain as ElementType;
  if (!moveId && screen && plain && screen.elements.some((el) => el.id === plain)) moveId = plain;

  if (!content && plain && /^https?:\/\//i.test(plain)) content = plain;
  if (!type && fallbackNew?.type) type = fallbackNew.type;
  if (!content && fallbackNew?.content) content = fallbackNew.content;
  return { type, moveId, content };
}

function isLetterDrag(
  dt: DataTransfer | null,
  screen?: Screen,
  fallbackMoveId?: string | null,
  fallbackNew?: { type?: ElementType; content?: string } | null,
): boolean {
  if (!dt) return false;
  const types = Array.from(dt.types ?? []);
  if (types.includes('Files')) return false;
  const payload = parseDragPayload(dt, screen, fallbackMoveId, fallbackNew);
  if (payload.type || payload.moveId || payload.content) return true;
  if (fallbackNew?.type || fallbackNew?.content) return true;
  // Extra fallback: some browsers may show the types but block getData until drop.
  return (
    types.includes(ELEMENT_DRAG_TYPE) ||
    types.includes(CANVAS_ELEMENT_DRAG_TYPE) ||
    types.includes(MEDIA_URL_DRAG_TYPE) ||
    types.includes('text/plain') ||
    types.includes('text/uri-list')
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function defaultFontSizeFor(type: ElementType) {
  if (type === 'header') return 26;
  if (type === 'subheader') return 20;
  if (type === 'paragraph') return 16;
  if (type === 'button') return 18;
  return 18;
}

function ResizableWrapper({
  element,
  selected,
  brandColor,
  onResize,
  children,
  minWidth = 160,
  minHeight = 120,
  lockAspect = false,
  applyFontScale = false,
  constrainAxis = 'both',
  showEdges = false,
}: {
  element: BaseElement;
  selected: boolean;
  brandColor: string;
  onResize: (style: Partial<BaseElement['style']>) => void;
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
  lockAspect?: boolean;
  applyFontScale?: boolean;
  constrainAxis?: 'both' | 'x' | 'y';
  showEdges?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const style = element.style ?? {};
  const [isResizing, setIsResizing] = useState(false);

  type ResizeStart = {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    aspect: number;
    dirX: number;
    dirY: number;
    lockAspect: boolean;
  };
  const startRef = useRef<ResizeStart | null>(null);
  const handlePointerMove = (event: PointerEvent) => {
    if (!startRef.current) return;
    event.preventDefault();
    const { x, y, width, height, fontSize, aspect, dirX, dirY, lockAspect: lockAspectDrag } = startRef.current;
    const deltaX = (event.clientX - x) * dirX;
    const deltaY = (event.clientY - y) * dirY;
    let nextWidth = constrainAxis === 'y' ? width : clamp(width + deltaX, minWidth, 1200);
    let nextHeight = constrainAxis === 'x' ? height : clamp(height + deltaY, minHeight, 1200);

    if (lockAspectDrag && aspect > 0 && constrainAxis !== 'y' && constrainAxis !== 'x') {
      const changeW = nextWidth - width;
      const changeH = nextHeight - height;
      if (Math.abs(changeW) > Math.abs(changeH)) {
        nextHeight = clamp(nextWidth / aspect, minHeight, 1200);
      } else {
        nextWidth = clamp(nextHeight * aspect, minWidth, 1200);
      }
    }

    const nextStyle: Partial<BaseElement['style']> = {
      width: Math.round(nextWidth),
      height: Math.round(nextHeight),
    };

    if (applyFontScale && height > 0 && fontSize > 0) {
      const scale = nextHeight / height;
      nextStyle.fontSize = clamp(Math.round(fontSize * scale), 10, 96);
    }

    onResize(nextStyle);
  };

  const handlePointerUp = () => {
    startRef.current = null;
    setIsResizing(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const handlePointerDown = (event: React.PointerEvent, dirX: number, dirY: number) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = boxRef.current?.getBoundingClientRect();
    const currentWidth = style.width ?? rect?.width ?? minWidth;
    const currentHeight = style.height ?? rect?.height ?? minHeight;
    const aspect = currentWidth && currentHeight ? currentWidth / currentHeight : 0;
    const fontSize = style.fontSize ?? defaultFontSizeFor(element.type);
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: currentWidth,
      height: currentHeight,
      fontSize,
      aspect,
      dirX,
      dirY,
      lockAspect: lockAspect && !event.shiftKey,
    };
    setIsResizing(true);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inlineStyle: React.CSSProperties = {
    width: style.width ? `${style.width}px` : '100%',
    height: style.height ? `${style.height}px` : undefined,
    minWidth,
    minHeight,
    maxWidth: '100%',
    maxHeight: '100%',
    boxSizing: 'border-box',
  };

  const handleDefs = showEdges
    ? ([
        { key: 'nw', x: 0, y: 0, cx: -1, cy: -1, cursor: 'nwse-resize' },
        { key: 'n', x: 0.5, y: 0, cx: 0, cy: -1, cursor: 'ns-resize' },
        { key: 'ne', x: 1, y: 0, cx: 1, cy: -1, cursor: 'nesw-resize' },
        { key: 'e', x: 1, y: 0.5, cx: 1, cy: 0, cursor: 'ew-resize' },
        { key: 'se', x: 1, y: 1, cx: 1, cy: 1, cursor: 'nwse-resize' },
        { key: 's', x: 0.5, y: 1, cx: 0, cy: 1, cursor: 'ns-resize' },
        { key: 'sw', x: 0, y: 1, cx: -1, cy: 1, cursor: 'nesw-resize' },
        { key: 'w', x: 0, y: 0.5, cx: -1, cy: 0, cursor: 'ew-resize' },
      ] as const)
    : ([
        { key: 'nw', x: 0, y: 0, cx: -1, cy: -1, cursor: 'nwse-resize' },
        { key: 'ne', x: 1, y: 0, cx: 1, cy: -1, cursor: 'nesw-resize' },
        { key: 'se', x: 1, y: 1, cx: 1, cy: 1, cursor: 'nwse-resize' },
        { key: 'sw', x: 0, y: 1, cx: -1, cy: 1, cursor: 'nesw-resize' },
      ] as const);

  const positionStyle = (pos: { x: number; y: number }): React.CSSProperties => ({
    left: `${pos.x * 100}%`,
    top: `${pos.y * 100}%`,
    transform: 'translate(-50%, -50%)',
  });

  return (
    <div ref={boxRef} className="relative group" style={inlineStyle}>
      {children}
      {selected && (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{ outline: `2px solid ${brandColor}`, outlineOffset: 0, borderRadius: 'inherit' }}
          />
          {handleDefs.map((pos) => (
            <div
              key={pos.key}
              role="presentation"
              className={`pointer-events-auto absolute h-3 w-3 rounded-full bg-white shadow ring-2 ${
                isResizing ? 'ring-blue-400' : 'ring-slate-300 group-hover:ring-blue-500'
              } cursor-${pos.cursor}`}
              style={positionStyle(pos)}
              onPointerDown={(e) => handlePointerDown(e, pos.cx, pos.cy)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function weightClass(style?: TextStyle) {
  if (style?.bold) return 'font-semibold';
  return 'font-medium';
}

function alignmentClass(align?: TextStyle['align']) {
  switch (align) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
}

function decorationClass(style?: TextStyle) {
  return cn({
    italic: style?.italic,
    underline: style?.underline,
  });
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? parseInt(
          normalized
            .split('')
            .map((c) => c + c)
            .join(''),
          16,
        )
      : parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance(rgb: { r: number; g: number; b: number }) {
  const toLin = (c: number) => {
    const chan = c / 255;
    return chan <= 0.03928 ? chan / 12.92 : Math.pow((chan + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b);
}

function contrastRatio(c1: string, c2: string) {
  const L1 = luminance(hexToRgb(c1));
  const L2 = luminance(hexToRgb(c2));
  const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

function isHexColor(value?: string) {
  return typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

function getReadableAccent(accent: string, background: string, fallback: string) {
  if (!isHexColor(accent) || !isHexColor(background)) return fallback;
  return contrastRatio(accent, background) >= 3 ? accent : fallback;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? parseInt(
          normalized
            .split('')
            .map((c) => c + c)
            .join(''),
          16,
        )
      : parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// FontSizeSelector removed with floating toolbar; size editing lives in side panel.

// FloatingToolbar removed; editing controls moved to side panel.

function ElementCard({
  element,
  selected,
  onSelect,
  onChange,
  onChangeProps,
  brandColor,
  screenBackground,
  screenTextColor,
  onDragStart,
  onDragEnd,
  isDragging,
  onPromptFocus,
  onPromptBlur,
  onResizeStyle,
  onSelectMultiple,
}: {
  element: BaseElement;
  selected: boolean;
  onSelect: () => void;
  onSelectMultiple?: (opts?: { append?: boolean; toggle?: boolean }) => void;
  onChange: (content: string) => void;
  onChangeProps: (props: Record<string, unknown>) => void;
  brandColor: string;
  screenBackground: string;
  screenTextColor: string;
  onDragStart: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onPromptFocus?: (id: string) => void;
  onPromptBlur?: (id: string) => void;
  onResizeStyle: (style: Partial<BaseElement['style']>) => void;
}) {
  const isText = textTypes.has(element.type);
  const style = element.style ?? {};
  const effectiveTextColor = style.color ?? screenTextColor;
  const actionTextStyle = { color: effectiveTextColor };
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const addUpload = useEditorStore((state) => state.addUpload);

  const commonClasses = cn(
    'relative w-full rounded-lg px-1 py-1 transition-shadow',
    selected ? 'shadow-soft-lg' : 'hover:shadow-soft-lg',
  );

  const textClasses = cn(weightClass(style), alignmentClass(style.align), decorationClass(style));
  const fontSize = style.fontSize ?? 16;
  const fontSizeRem = `${fontSize / 16}rem`;

  const content = element.content ?? '';
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectionStyle = selected
    ? {
        borderColor: brandColor,
        boxShadow: `0 0 0 2px ${
          questionElementTypes.has(element.type) ? brandColor : `${brandColor}33`
        }`,
      }
    : undefined;
  const draggingStyle = isDragging ? { opacity: 0.6 } : undefined;
  const hasFixedHeight = Boolean(style.height);
  const resizePrompt = () => {
    const node = promptRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const opts =
      e.metaKey || e.ctrlKey ? { toggle: true } : e.shiftKey ? { append: true } : undefined;
    if (opts && onSelectMultiple) {
      onSelectMultiple(opts);
    } else {
      onSelect();
    }
  };

  const usesHandleForDrag = isText || questionElementTypes.has(element.type);

  const resizeToContent = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (!hasFixedHeight) {
      resizeToContent();
    }
    resizePrompt();
  }, [content, fontSizeRem, style.fontFamily, hasFixedHeight]);

  const wrapResizable = (
    node: ReactNode,
    options?: {
      lockAspect?: boolean;
      minWidth?: number;
      minHeight?: number;
      fontScale?: boolean;
      constrainAxis?: 'both' | 'x' | 'y';
      showEdges?: boolean;
    },
  ) => {
    if (!resizableTypes.has(element.type)) return node;
    return (
      <ResizableWrapper
        element={element}
        selected={selected}
        brandColor={brandColor}
        onResize={onResizeStyle}
        lockAspect={options?.lockAspect}
        minWidth={options?.minWidth}
        minHeight={options?.minHeight}
        applyFontScale={options?.fontScale}
        constrainAxis={options?.constrainAxis ?? 'both'}
        showEdges={options?.showEdges ?? false}
        // ensure the wrapper inherits the child's radius for a flush outline
      >
        {node}
      </ResizableWrapper>
    );
  };

  if (isText) {
    const card = (
      <div
        className={commonClasses}
        onClick={handleSelectClick}
        style={{ ...selectionStyle, ...draggingStyle }}
        draggable={!usesHandleForDrag}
        onDragStartCapture={(e) => onDragStart(e, element.id)}
        onDragStart={(e) => onDragStart(e, element.id)}
        onDragEnd={onDragEnd}
        aria-grabbed={isDragging}
      >
        <div
          className={cn(
            'absolute right-2 top-2 z-10 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-xs text-slate-600 shadow-sm',
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          draggable
          onClick={(e) => {
            e.stopPropagation();
            handleSelectClick(e);
          }}
          onDragStart={(e) => onDragStart(e as any, element.id)}
          onDragEnd={onDragEnd}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          ⋮⋮
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            resizeToContent();
            onChange(e.target.value);
          }}
            className={cn(
              'w-full resize-none border-0 bg-transparent p-0 text-inherit leading-normal outline-none focus:ring-0',
            'whitespace-pre-wrap break-words',
            textClasses,
          )}
         style={{
           fontFamily: style.fontFamily,
           fontSize: fontSizeRem,
            color: effectiveTextColor,
            height: hasFixedHeight ? '100%' : undefined,
          }}
          rows={1}
          spellCheck
          aria-label="Edit text"
        />
      </div>
    );

    return wrapResizable(card, { minWidth: 200, minHeight: 0, fontScale: true });
  }

  if (element.type === 'image') {
      const imageUrl = content ? content.trim() : '';
      const mediaProps = (element.props ?? {}) as { aspect?: number };
      const fit = (element.props as { fit?: 'contain' | 'cover' } | undefined)?.fit ?? 'contain';
      const focus = (element.props as { focusX?: number; focusY?: number } | undefined) ?? {};
      const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (!naturalWidth || !naturalHeight) return;
        const aspect = naturalWidth / naturalHeight;
        const currentAspect = style.width && style.height ? style.width / style.height : null;
        const aspectChanged = !currentAspect || Math.abs(currentAspect - aspect) > 0.02;
        if (aspectChanged && (style.width || style.height)) {
          const baseWidth = style.width ?? Math.round((style.height ?? 200) * aspect);
          const targetWidth = Math.max(baseWidth, 120);
          const targetHeight = Math.max(120, Math.round(targetWidth / aspect));
          onResizeStyle({ width: targetWidth, height: targetHeight });
        }
        if (Math.abs((mediaProps.aspect ?? 0) - aspect) > 0.01) {
          onChangeProps({ ...mediaProps, aspect });
        }
      };
      const card = (
        <div
          className="relative w-full overflow-hidden mx-auto"
          onClick={(e) => {
            handleSelectClick(e);
            if (e.altKey && imageUrl) {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              onChangeProps({ ...mediaProps, focusX: Math.round(x * 10) / 10, focusY: Math.round(y * 10) / 10 });
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            ...selectionStyle,
            ...draggingStyle,
            height: style.height ? `${style.height}px` : undefined,
            width: style.width ? `${style.width}px` : '100%',
            maxWidth: '100%',
            borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined,
          }}
          draggable
          onDragStartCapture={(e) => onDragStart(e, element.id)}
          onDragStart={(e) => onDragStart(e, element.id)}
          onDragEnd={onDragEnd}
          aria-grabbed={isDragging}
        >
          <div
            className={cn(
              'absolute right-2 top-2 z-10 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-xs text-slate-600 shadow-sm',
              selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
            draggable
            onClick={(e) => {
              e.stopPropagation();
              handleSelectClick(e);
            }}
            onDragStart={(e) => onDragStart(e as any, element.id)}
            onDragEnd={onDragEnd}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Drag to reorder"
          >
            ⋮⋮
          </div>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Uploaded"
              className="block w-full"
              style={{
                objectFit: fit,
                height: style.height ? '100%' : 'auto',
                objectPosition:
                  focus.focusX !== undefined && focus.focusY !== undefined
                    ? `${focus.focusX}% ${focus.focusY}%`
                    : 'center',
                borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined,
              }}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">Image preview</div>
          )}
        </div>
      );

      return wrapResizable(card, { lockAspect: true, minWidth: 180, minHeight: 140, constrainAxis: 'both', showEdges: true });
    }

  if (element.type === 'video') {
    const videoUrl = content ? content.trim() : '';
    const mediaProps = (element.props ?? {}) as { aspect?: number };
    const fit = (element.props as { fit?: 'contain' | 'cover' } | undefined)?.fit ?? 'contain';
    const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      const naturalWidth = video.videoWidth;
      const naturalHeight = video.videoHeight;
      if (!naturalWidth || !naturalHeight) return;
      const aspect = naturalWidth / naturalHeight;
      const currentAspect = style.width && style.height ? style.width / style.height : null;
      const aspectChanged = !currentAspect || Math.abs(currentAspect - aspect) > 0.02;
      if (aspectChanged && (style.width || style.height)) {
        const baseWidth = style.width ?? Math.round((style.height ?? 220) * aspect);
        const targetWidth = Math.max(baseWidth, 160);
        const targetHeight = Math.max(160, Math.round(targetWidth / aspect));
        onResizeStyle({ width: targetWidth, height: targetHeight });
      }
      if (Math.abs((mediaProps.aspect ?? 0) - aspect) > 0.01) {
        onChangeProps({ ...mediaProps, aspect });
      }
    };
    const card = (
      <div
        className="relative w-full overflow-hidden mx-auto"
          onClick={handleSelectClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          ...selectionStyle,
          ...draggingStyle,
          height: style.height ? `${style.height}px` : undefined,
          width: style.width ? `${style.width}px` : '100%',
          maxWidth: '100%',
          borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined,
        }}
        draggable
        onDragStartCapture={(e) => onDragStart(e, element.id)}
        onDragStart={(e) => onDragStart(e, element.id)}
        onDragEnd={onDragEnd}
        aria-grabbed={isDragging}
      >
        <div
          className={cn(
            'absolute right-2 top-2 z-10 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-xs text-slate-600 shadow-sm',
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          draggable
          onClick={(e) => {
            e.stopPropagation();
            handleSelectClick(e);
          }}
          onDragStart={(e) => onDragStart(e as any, element.id)}
          onDragEnd={onDragEnd}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          ⋮⋮
        </div>
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="block w-full"
            style={{
              objectFit: fit,
              height: style.height ? '100%' : 'auto',
              borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined,
            }}
            onLoadedMetadata={handleVideoLoad}
          />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">Video preview</div>
        )}
      </div>
    );

      return wrapResizable(card, { lockAspect: true, minWidth: 220, minHeight: 160, constrainAxis: 'both', showEdges: true });
    }

  const renderQuestion = () => {
    const rawProps = (element.props ?? {}) as Record<string, unknown>;
    const options = Array.isArray(rawProps.options)
      ? rawProps.options.map((opt) =>
          typeof opt === 'string'
            ? { label: opt }
            : (opt as { label?: string; mediaUrl?: string; mediaKind?: 'image' | 'video'; alt?: string }),
        )
      : [];
    const optionFormat = (rawProps.optionFormat as 'text' | 'media' | 'text-media' | undefined) ?? 'text';
    const defaultLabelPrefix = element.type === 'ranking' ? 'Item' : 'Option';
    const resizeTextarea = (el: HTMLTextAreaElement | null) => {
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };

    const updateOption = (idx: number, value: string) => {
      const next = [...options];
      next[idx] = { ...(next[idx] ?? {}), label: value };
      onChangeProps({ options: next });
    };

    const updateOptionMedia = (idx: number, mediaUrl: string, mediaKind: 'image' | 'video') => {
      const next = [...options];
      next[idx] = { ...(next[idx] ?? {}), mediaUrl, mediaKind };
      onChangeProps({ options: next });
    };

    const addOption = () =>
      onChangeProps({ options: [...options, { label: `${defaultLabelPrefix} ${options.length + 1}` }] });

    if (element.type === 'rating') {
      const max = Math.max(1, Math.min(10, Number(rawProps.max ?? 5)));
      const scaleType = (rawProps.scaleType as 'stars' | 'hearts' | 'numbers' | undefined) ?? 'stars';
      const showPrompt = rawProps.showPrompt !== false;
      const minLabel = (rawProps as { minLabel?: string } | undefined)?.minLabel ?? '';
      const maxLabel = (rawProps as { maxLabel?: string } | undefined)?.maxLabel ?? '';
      const safeBackground = isHexColor(screenBackground) ? screenBackground : '#ffffff';
      const ratingColor = getReadableAccent(brandColor, safeBackground, screenTextColor);
      const renderRatingIcon = (index: number) => {
        if (scaleType === 'hearts') return '♡';
        if (scaleType === 'numbers') return String(index + 1);
        return '☆';
      };
      return (
        <div
          className={commonClasses}
          onClick={handleSelectClick}
          style={{ ...selectionStyle, ...draggingStyle }}
          draggable
          onDragStartCapture={(e) => onDragStart(e, element.id)}
          onDragStart={(e) => onDragStart(e, element.id)}
          onDragEnd={onDragEnd}
          aria-grabbed={isDragging}
        >
          {showPrompt ? (
            <div className="mb-2 flex items-start gap-2">
              <textarea
                ref={promptRef}
                className={cn(
                  'w-full resize-none border-0 bg-transparent px-0 py-1 outline-none focus:border-0 focus:ring-0',
                  weightClass(style),
                  alignmentClass(style.align),
                  decorationClass(style),
                  'whitespace-pre-wrap leading-snug',
                )}
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: `${(style.fontSize ?? 18) / 16}rem`,
                  color: effectiveTextColor,
                }}
                value={content}
                onChange={(e) => {
                  onChange(e.target.value);
                  resizePrompt();
                }}
                placeholder="Question text"
                onFocus={() => onPromptFocus?.(element.id)}
                onBlur={() => onPromptBlur?.(element.id)}
                rows={1}
              />
              {selected && (
                <button
                  type="button"
                  className="shrink-0 text-xs hover:opacity-80"
                  style={actionTextStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeProps({ showPrompt: false });
                  }}
                >
                  Hide
                </button>
              )}
            </div>
          ) : (
            selected && (
              <button
                type="button"
                className="mb-2 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline hover:opacity-80"
                style={actionTextStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeProps({ showPrompt: true });
                }}
              >
                Show question text
              </button>
            )
          )}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: max }).map((_, idx) => (
              <span
                key={idx}
                className="inline-flex h-8 basis-[17%] min-w-[40px] flex-shrink-0 items-center justify-center rounded-full border px-2.5 text-sm font-semibold shadow-sm"
                style={{ color: ratingColor, borderColor: `${ratingColor}55` }}
                aria-label={`Rate ${idx + 1}`}
              >
                {renderRatingIcon(idx)}
              </span>
            ))}
          </div>
          {(minLabel || maxLabel || selected) && (
            <div className="mt-3 flex items-center justify-between gap-2 text-sm text-slate-500">
              {selected ? (
                <>
                  <input
                    className="w-1/2 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    value={minLabel}
                    placeholder="Low"
                    onChange={(e) => onChangeProps({ minLabel: e.target.value })}
                  />
                  <input
                    className="w-1/2 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 text-right outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    value={maxLabel}
                    placeholder="High"
                    onChange={(e) => onChangeProps({ maxLabel: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <span style={{ color: screenTextColor }}>{minLabel}</span>
                  <span style={{ color: screenTextColor }}>{maxLabel}</span>
                </>
              )}
            </div>
          )}
          {selected && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <span>Scale</span>
              <input
                type="number"
                min={1}
                max={10}
                value={max}
                onChange={(e) => onChangeProps({ max: Math.max(1, Math.min(10, Number(e.target.value) || 5)) })}
                className="h-8 w-16 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          )}
        </div>
      );
    }

    if (element.type === 'ranking') {
      const showPrompt = rawProps.showPrompt !== false;
      const renderRankingOption = (opt: { label?: string; mediaUrl?: string; mediaKind?: 'image' | 'video' }, idx: number) => {
        if (optionFormat === 'text') {
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">{idx + 1}</span>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                value={opt.label ?? ''}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder="Option text"
              />
            </div>
          );
        }
        const showLabelArea = optionFormat === 'text-media';
        const mediaUrl = opt.mediaUrl;
        const mediaKind = opt.mediaKind ?? 'image';
        const openFilePicker = () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,video/*';
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const kind = file.type.startsWith('video') ? 'video' : 'image';
            const url = URL.createObjectURL(file);
            updateOptionMedia(idx, url, kind);
            addUpload({ src: url, kind, name: file.name });
          };
          input.click();
        };
        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          e.stopPropagation();
          const dt = e.dataTransfer;
          const file = dt.files?.[0];
          if (file) {
            const kind = file.type.startsWith('video') ? 'video' : 'image';
            const url = URL.createObjectURL(file);
            updateOptionMedia(idx, url, kind);
            addUpload({ src: url, kind, name: file.name });
            return;
          }
          const url = dt.getData(MEDIA_URL_DRAG_TYPE) || dt.getData('text/uri-list');
          if (url) {
            const kind: 'image' | 'video' = url.match(/\\.mp4|\\.mov|\\.webm/i) ? 'video' : 'image';
            updateOptionMedia(idx, url, kind);
          }
        };
        const mediaContent = mediaUrl ? (
          mediaKind === 'video' ? (
            <video className="h-full w-full object-cover" src={mediaUrl} controls />
          ) : (
            <img className="h-full w-full object-cover" src={mediaUrl} alt={opt.label ?? 'Media'} />
          )
        ) : (
          <span className="text-sm text-slate-400">Media placeholder</span>
        );
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-px hover:shadow-md"
            style={{ borderColor: `${brandColor}33` }}
          >
            <div className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600 shadow-sm">
              {idx + 1}
            </div>
            <div
              className="flex h-32 items-center justify-center border-b border-slate-200 bg-slate-50 text-slate-400"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
            >
            {mediaContent}
          </div>
          {showLabelArea && (
            <div className="px-3 py-3">
              <textarea
                  className="w-full resize-none bg-transparent px-1 py-2 text-sm leading-snug outline-none border-0 focus:ring-0 focus:border-0"
                  rows={1}
                  ref={resizeTextarea}
                  value={opt.label ?? ''}
                  onChange={(e) => {
                    resizeTextarea(e.target);
                    updateOption(idx, e.target.value);
                  }}
                  placeholder="Add a label"
                />
              </div>
            )}
          </div>
        );
      };

      return (
        <div
          className={commonClasses}
        onClick={handleSelectClick}
          style={{ ...selectionStyle, ...draggingStyle }}
          draggable
          onDragStartCapture={(e) => onDragStart(e, element.id)}
          onDragStart={(e) => onDragStart(e, element.id)}
          onDragEnd={onDragEnd}
          aria-grabbed={isDragging}
        >
          {showPrompt ? (
            <div className="mb-2 flex items-start gap-2">
              <textarea
                ref={promptRef}
                className={cn(
                  'w-full resize-none border-0 bg-transparent px-0 py-1 outline-none focus:border-0 focus:ring-0',
                  weightClass(style),
                  alignmentClass(style.align),
                  decorationClass(style),
                  'whitespace-pre-wrap leading-snug',
                )}
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: `${(style.fontSize ?? 18) / 16}rem`,
                  color: effectiveTextColor,
                }}
                value={content}
                onChange={(e) => {
                  onChange(e.target.value);
                  resizePrompt();
                }}
                placeholder="Ranking question"
                onFocus={() => onPromptFocus?.(element.id)}
                onBlur={() => onPromptBlur?.(element.id)}
                rows={1}
              />
              {selected && (
                <button
                  type="button"
                  className="shrink-0 text-xs hover:opacity-80"
                  style={actionTextStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeProps({ showPrompt: false });
                  }}
                >
                  Hide
                </button>
              )}
            </div>
          ) : (
            selected && (
              <button
                type="button"
                className="mb-2 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline hover:opacity-80"
                style={actionTextStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeProps({ showPrompt: true });
                }}
              >
                Show question text
              </button>
            )
          )}
          <div className="mb-2 text-xs font-medium" style={{ color: brandColor }}>
            Drag and drop to rank options
          </div>
          <div className={optionFormat === 'text' ? 'space-y-2' : 'grid grid-cols-2 gap-3'}>
            {options.map((opt, idx) => renderRankingOption(opt, idx))}
          </div>
          {selected && (
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={addOption} style={actionTextStyle}>
                + Add item
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (element.type === 'single-choice' || element.type === 'multiple-choice') {
      const isMulti = element.type === 'multiple-choice';
      const removeOption = (idx: number) => {
        const next = [...options];
        next.splice(idx, 1);
        onChangeProps({ options: next });
      };
      const showPrompt = rawProps.showPrompt !== false;
      const renderMediaOption = (opt: { label?: string; mediaUrl?: string; mediaKind?: 'image' | 'video' }, idx: number) => {
        const isTextFirst = false;
        const showLabelArea = optionFormat === 'text-media';
        const mediaUrl = opt.mediaUrl;
        const mediaKind = opt.mediaKind ?? 'image';
        const openFilePicker = () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,video/*';
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const kind = file.type.startsWith('video') ? 'video' : 'image';
            const url = URL.createObjectURL(file);
            updateOptionMedia(idx, url, kind);
            addUpload({ src: url, kind, name: file.name });
          };
          input.click();
        };
        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          e.stopPropagation();
          const dt = e.dataTransfer;
          const file = dt.files?.[0];
          if (file) {
            const kind = file.type.startsWith('video') ? 'video' : 'image';
            const url = URL.createObjectURL(file);
            updateOptionMedia(idx, url, kind);
            addUpload({ src: url, kind, name: file.name });
            return;
          }
          const url = dt.getData(MEDIA_URL_DRAG_TYPE) || dt.getData('text/uri-list');
          if (url) {
            const kind: 'image' | 'video' = url.match(/\.mp4|\.mov|\.webm/i) ? 'video' : 'image';
            updateOptionMedia(idx, url, kind);
          }
        };
        const mediaContent = mediaUrl ? (
          mediaKind === 'video' ? (
            <video className="h-full w-full object-cover" src={mediaUrl} controls />
          ) : (
            <img className="h-full w-full object-cover" src={mediaUrl} alt={opt.label ?? 'Media'} />
          )
        ) : (
          <span className="text-sm text-slate-400">Media placeholder</span>
        );
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-px hover:shadow-md"
            style={{ borderColor: `${brandColor}33` }}
          >
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
              <span
                className={cn(
                  'inline-flex h-4 w-4 items-center justify-center rounded-full border',
                  isMulti ? 'rounded-[6px]' : 'rounded-full',
                )}
                style={{ borderColor: brandColor }}
              />
              <span>{String.fromCharCode(65 + idx)}</span>
            </div>
            {selected && (
              <button
                type="button"
                aria-label="Remove option"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-700"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(idx);
                }}
              >
                ✕
              </button>
            )}
            {showLabelArea && isTextFirst && (
              <div className="px-3 pt-3">
                <textarea
                  className="w-full resize-none bg-transparent px-1 pb-2 text-sm leading-snug outline-none border-0 focus:ring-0 focus:border-0"
                  rows={1}
                  ref={resizeTextarea}
                  value={opt.label ?? ''}
                  onChange={(e) => {
                    resizeTextarea(e.target);
                    updateOption(idx, e.target.value);
                  }}
                  placeholder="Add a label"
                />
              </div>
            )}
          <div
            className="flex h-32 items-center justify-center border-b border-slate-200 bg-slate-50 text-slate-400"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={handleDrop}
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
          >
            {mediaContent}
          </div>
            {showLabelArea && !isTextFirst && (
              <div className="px-3 py-3">
                <textarea
                  className="w-full resize-none bg-transparent px-1 py-2 text-sm leading-snug outline-none border-0 focus:ring-0 focus:border-0"
                  rows={1}
                  ref={resizeTextarea}
                  value={opt.label ?? ''}
                  onChange={(e) => {
                    resizeTextarea(e.target);
                    updateOption(idx, e.target.value);
                  }}
                  placeholder="Add a label"
                />
              </div>
            )}
          </div>
        );
      };
      return (
        <div
          className={commonClasses}
          onClick={handleSelectClick}
          style={{ ...selectionStyle, ...draggingStyle }}
          draggable
          onDragStart={(e) => onDragStart(e, element.id)}
          onDragEnd={onDragEnd}
          aria-grabbed={isDragging}
        >
          {showPrompt ? (
            <div className="mb-2 flex items-start gap-2">
              <textarea
                ref={promptRef}
                className={cn(
                  'w-full resize-none border-0 bg-transparent px-0 py-1 outline-none focus:border-0 focus:ring-0',
                  weightClass(style),
                  alignmentClass(style.align),
                  decorationClass(style),
                  'whitespace-pre-wrap leading-snug',
                )}
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: `${(style.fontSize ?? 18) / 16}rem`,
                  color: effectiveTextColor,
                }}
                value={content}
                onChange={(e) => {
                  onChange(e.target.value);
                  resizePrompt();
                }}
                placeholder={isMulti ? 'Multiple choice question' : 'Single choice question'}
                onFocus={() => onPromptFocus?.(element.id)}
                onBlur={() => onPromptBlur?.(element.id)}
                rows={1}
              />
              {selected && (
                <button
                  type="button"
                  className="shrink-0 text-xs hover:opacity-80"
                  style={actionTextStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeProps({ showPrompt: false });
                  }}
                >
                  Hide
                </button>
              )}
            </div>
          ) : (
            selected && (
              <button
                type="button"
                className="mb-2 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline hover:opacity-80"
                style={actionTextStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeProps({ showPrompt: true });
                }}
              >
                Show question text
              </button>
            )
          )}
          {optionFormat === 'text' ? (
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="group flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type={isMulti ? 'checkbox' : 'radio'}
                      disabled
                      className="h-4 w-4 text-blue-600"
                      aria-label="option"
                    />
                  </div>
                  <input
                    className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    value={opt.label ?? ''}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder="Option text"
                  />
                  {selected && (
                    <button
                      type="button"
                      aria-label="Remove option"
                      className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 group-hover:flex"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(idx);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {options.map((opt, idx) => renderMediaOption(opt, idx))}
            </div>
          )}
          {selected && (
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={addOption} style={actionTextStyle}>
                + Add option
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (element.type === 'input' || element.type === 'date-input' || element.type === 'file') {
      const maxLength = (element.props as { maxLength?: number } | undefined)?.maxLength;
      const dateProps =
        element.type === 'date-input'
          ? ((element.props ?? {}) as { placeholder?: string; showPrompt?: boolean })
          : undefined;
      const datePlaceholder = dateProps?.placeholder || 'Enter a date';
      const fileProps =
        element.type === 'file'
          ? ((element.props ?? {}) as { maxSizeMb?: number; showPrompt?: boolean })
          : undefined;
      const maxSizeMb = fileProps?.maxSizeMb ?? 10;
      const showPrompt = rawProps.showPrompt !== false;

      return (
        <div
          className={commonClasses}
          onClick={handleSelectClick}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ ...selectionStyle, ...draggingStyle }}
        draggable
        onDragStart={(e) => onDragStart(e, element.id)}
        onDragEnd={onDragEnd}
        aria-grabbed={isDragging}
      >
        {showPrompt ? (
          <div className="mb-2 flex items-start gap-2">
            <textarea
              ref={promptRef}
              className={cn(
                'w-full resize-none border-0 bg-transparent px-0 py-1 outline-none focus:border-0 focus:ring-0',
                weightClass(style),
                alignmentClass(style.align),
                decorationClass(style),
                'whitespace-pre-wrap leading-snug',
              )}
              style={{
                fontFamily: style.fontFamily,
                fontSize: `${(style.fontSize ?? 18) / 16}rem`,
                color: effectiveTextColor,
              }}
              value={content}
              onChange={(e) => {
                onChange(e.target.value);
                resizePrompt();
              }}
              placeholder={
                element.type === 'input'
                  ? 'Short text label'
                  : element.type === 'file'
                    ? 'File upload label'
                    : 'Date label'
              }
              onFocus={() => onPromptFocus?.(element.id)}
              onBlur={() => onPromptBlur?.(element.id)}
              rows={1}
            />
            {selected && (
              <button
                type="button"
                className="shrink-0 text-xs hover:opacity-80"
                style={actionTextStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeProps({ showPrompt: false });
                }}
              >
                Hide
              </button>
            )}
          </div>
        ) : (
          selected && (
            <button
              type="button"
              className="mb-2 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline hover:opacity-80"
              style={actionTextStyle}
              onClick={(e) => {
                e.stopPropagation();
                onChangeProps({ showPrompt: true });
              }}
            >
              Show question text
            </button>
          )
        )}
          {element.type === 'file' ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-center">
              <div className="text-4xl text-slate-400">⬆️</div>
              <div className="text-sm font-semibold text-slate-700">Choose file</div>
              <div className="text-xs text-slate-500">Size limit: {maxSizeMb}MB</div>
            </div>
          ) : (
            <div className="relative">
              <input
                disabled
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500 pointer-events-none"
                placeholder={
                  element.type === 'input'
                    ? maxLength
                      ? `User input (max ${maxLength} chars)`
                      : 'User input'
                    : datePlaceholder
                }
                type="text"
                aria-hidden
              />
              {element.type === 'input' && maxLength ? (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                  max {maxLength}
                </span>
              ) : null}
            </div>
          )}
        </div>
      );
    }

    if (element.type === 'date') {
      const dateProps = (element.props ?? {}) as { required?: boolean; mode?: 'date' | 'time' | 'datetime'; placeholder?: string; showPrompt?: boolean };
      const dateMode = dateProps.mode ?? 'date';
      const datePlaceholder =
        dateProps.placeholder ||
        (dateMode === 'time' ? 'Select time' : dateMode === 'datetime' ? 'Select date & time' : 'Select date');
      const dateInputType = dateMode === 'time' ? 'time' : dateMode === 'datetime' ? 'datetime-local' : 'date';
      const showPrompt = rawProps.showPrompt !== false;

      return (
        <div
          className={commonClasses}
          onClick={handleSelectClick}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ ...selectionStyle, ...draggingStyle }}
          draggable
          onDragStart={(e) => onDragStart(e, element.id)}
          onDragEnd={onDragEnd}
          aria-grabbed={isDragging}
        >
          {showPrompt ? (
            <div className="mb-2 flex items-start gap-2">
              <textarea
                ref={promptRef}
                className={cn(
                  'w-full resize-none border-0 bg-transparent px-0 py-1 outline-none focus:border-0 focus:ring-0',
                  weightClass(style),
                  alignmentClass(style.align),
                  decorationClass(style),
                  'whitespace-pre-wrap leading-snug',
                )}
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: `${(style.fontSize ?? 18) / 16}rem`,
                  color: effectiveTextColor,
                }}
                value={content}
                onChange={(e) => {
                  onChange(e.target.value);
                  resizePrompt();
                }}
                placeholder="Date label"
                onFocus={() => onPromptFocus?.(element.id)}
                onBlur={() => onPromptBlur?.(element.id)}
                rows={1}
              />
              {selected && (
                <button
                  type="button"
                  className="shrink-0 text-xs hover:opacity-80"
                  style={actionTextStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeProps({ showPrompt: false });
                  }}
                >
                  Hide
                </button>
              )}
            </div>
          ) : (
            selected && (
              <button
                type="button"
                className="mb-2 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline hover:opacity-80"
                style={actionTextStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeProps({ showPrompt: true });
                }}
              >
                Show question text
              </button>
            )
          )}
          <input
            disabled
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500 pointer-events-none"
            placeholder={datePlaceholder}
            type={dateInputType}
            aria-hidden
          />
        </div>
      );
    }

    return null;
  };

  const questionTypes = new Set<ElementType>([
    'single-choice',
    'multiple-choice',
    'input',
    'file',
    'date',
    'ranking',
    'rating',
  ]);

  if (questionTypes.has(element.type)) {
    const rendered = renderQuestion();
    if (rendered) return rendered;
  }

  return (
    <div
      className={commonClasses}
      onClick={onSelect}
      draggable={!usesHandleForDrag}
      onDragStart={(e) => onDragStart(e, element.id)}
      onDragEnd={onDragEnd}
      aria-grabbed={isDragging}
      style={
        element.type === 'button'
          ? { ...selectionStyle, ...draggingStyle, backgroundColor: brandColor, color: '#fff', borderColor: brandColor }
          : { ...selectionStyle, ...draggingStyle }
      }
    >
      <div
        className={cn(
          'absolute right-2 top-2 z-10 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-xs text-slate-600 shadow-sm',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        draggable
        onClick={(e) => {
          e.stopPropagation();
          handleSelectClick(e);
        }}
        onDragStart={(e) => onDragStart(e as any, element.id)}
        onDragEnd={onDragEnd}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        ⋮⋮
      </div>
      <div
        className={cn(
          'text-sm font-medium capitalize',
          element.type === 'button' ? 'text-white' : 'text-slate-800',
        )}
      >
        {element.type.replace('-', ' ')}
      </div>
      <p className={cn('text-sm', element.type === 'button' ? 'text-white/90' : 'text-slate-500')}>{content}</p>
    </div>
  );
}

function GroupCard({
  element,
  screen,
  brandColor,
  screenTextColor,
  selectedElementIds,
  onSelectGroup,
  onSelectChild,
  onChangeChild,
  onChangeChildProps,
  onResizeChildStyle,
  onPromptFocus,
  onPromptBlur,
  onChildDragStart,
  onChildDragEnd,
  onGroupDragStart,
  onGroupDragEnd,
  isDragging,
  draggingId,
  fallbackNewElement,
  activeDropIndex,
  onActivateDrop,
  onDeactivateDrop,
  onDropIn,
}: {
  element: BaseElement;
  screen: Screen;
  brandColor: string;
  screenTextColor: string;
  selectedElementIds: string[];
  onSelectGroup: (opts?: { append?: boolean; toggle?: boolean }) => void;
  onSelectChild: (childId: string, opts?: { append?: boolean; toggle?: boolean }) => void;
  onChangeChild: (childId: string, content: string) => void;
  onChangeChildProps: (childId: string, props: Record<string, unknown>) => void;
  onResizeChildStyle: (childId: string, style: Partial<BaseElement['style']>) => void;
  onPromptFocus?: (id: string) => void;
  onPromptBlur?: (id: string) => void;
  onChildDragStart: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onChildDragEnd: () => void;
  onGroupDragStart: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onGroupDragEnd: () => void;
  isDragging: boolean;
  draggingId: string | null;
  fallbackNewElement?: { type?: ElementType; content?: string } | null;
  activeDropIndex: number | null;
  onActivateDrop: (index: number) => void;
  onDeactivateDrop: () => void;
  onDropIn: (index: number, payload: { moveId?: string; type?: ElementType; content?: string }) => void;
}) {
  const props = (element.props ?? {}) as { children?: string[]; spacing?: number };
  const spacing = props.spacing ?? 12;
  const childrenIds = props.children ?? [];
  const childElementsOrdered = childrenIds
    .map((id) => screen.elements.find((el) => el.id === id))
    .filter((el): el is BaseElement => Boolean(el));
  const extraChildren = screen.elements.filter((el) => el.parentId === element.id && !childrenIds.includes(el.id));
  const allChildren = [...childElementsOrdered, ...extraChildren];

  const handleChildDrop = (idx: number, e: React.DragEvent<HTMLDivElement>) => {
    if (!isLetterDrag(e.dataTransfer, screen, draggingId, fallbackNewElement)) return;
    e.preventDefault();
    e.stopPropagation();
    const payload = parseDragPayload(e.dataTransfer, screen, draggingId, fallbackNewElement);
    onDropIn(idx, payload);
    onDeactivateDrop();
  };

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-dashed border-slate-300 bg-white/60 p-3',
        selectedElementIds.includes(element.id) && 'ring-2 ring-blue-400 border-blue-300',
      )}
      style={isDragging ? { opacity: 0.6 } : undefined}
      data-element-id={element.id}
      onClick={(e) => {
        e.stopPropagation();
        const opts = e.metaKey || e.ctrlKey ? { toggle: true } : e.shiftKey ? { append: true } : undefined;
        onSelectGroup(opts);
      }}
      onDragOver={(e) => {
        if (!isLetterDrag(e.dataTransfer, screen, draggingId, fallbackNewElement)) return;
        e.preventDefault();
        e.stopPropagation();
        const payload = parseDragPayload(e.dataTransfer, screen, draggingId, fallbackNewElement);
        e.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
      }}
      onDrop={(e) => {
        if (!isLetterDrag(e.dataTransfer, screen, draggingId, fallbackNewElement)) return;
        e.preventDefault();
        e.stopPropagation();
        const payload = parseDragPayload(e.dataTransfer, screen, draggingId, fallbackNewElement);
        onDropIn(allChildren.length, payload);
        onDeactivateDrop();
      }}
      onDragLeave={(e) => {
        const nextTarget = e.relatedTarget as Node | null;
        if (!nextTarget || !(e.currentTarget as HTMLElement).contains(nextTarget)) {
          onDeactivateDrop();
        }
      }}
      draggable
      onDragStartCapture={(e) => onGroupDragStart(e, element.id)}
      onDragStart={(e) => onGroupDragStart(e, element.id)}
      onDragEnd={onGroupDragEnd}
      aria-grabbed={isDragging}
    >
      <div
        className="flex flex-col w-full"
        style={{
          alignItems: 'stretch',
        }}
      >
        {allChildren.map((child, idx) => (
          <Fragment key={child.id}>
            <div
              className="relative w-full"
              style={{ height: idx === 0 ? 0 : Math.max(0, spacing) }}
              onDragOver={(e) => {
                if (!isLetterDrag(e.dataTransfer, screen, draggingId, fallbackNewElement)) return;
                e.preventDefault();
                e.stopPropagation();
                onActivateDrop(idx);
                const payload = parseDragPayload(e.dataTransfer, screen, draggingId, fallbackNewElement);
                e.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
              }}
              onDrop={(e) => handleChildDrop(idx, e)}
            >
              {activeDropIndex === idx && (
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-400/80" />
              )}
              <div
                className="absolute -top-3 inset-x-0 h-6"
                onDragOver={(e) => {
                  if (!isLetterDrag(e.dataTransfer, screen, draggingId, fallbackNewElement)) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onActivateDrop(idx);
                  const payload = parseDragPayload(e.dataTransfer, screen, draggingId, fallbackNewElement);
                  e.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
                }}
                onDrop={(e) => handleChildDrop(idx, e)}
              />
            </div>
            <div
              data-element-id={child.id}
              className="w-full"
              style={{ marginTop: idx === 0 ? 0 : Math.min(0, spacing) }}
            >
              <ElementCard
                element={child}
                selected={selectedElementIds.includes(child.id)}
                onSelect={() => onSelectChild(child.id)}
                onSelectMultiple={(opts) => onSelectChild(child.id, opts)}
                onChange={(value) => onChangeChild(child.id, value)}
                onChangeProps={(nextProps) => onChangeChildProps(child.id, nextProps)}
                brandColor={brandColor}
                screenBackground={screen.style?.background ?? '#ffffff'}
                screenTextColor={screenTextColor}
                onDragStart={onChildDragStart}
                onDragEnd={onChildDragEnd}
                isDragging={false}
                onPromptFocus={onPromptFocus}
                onPromptBlur={onPromptBlur}
                onResizeStyle={(style) => onResizeChildStyle(child.id, style)}
              />
            </div>
            {idx === allChildren.length - 1 && (
              <div
                className="relative w-full"
                style={{ height: Math.max(0, spacing) }}
                onDragOver={(e) => {
                  if (!isLetterDrag(e.dataTransfer, screen, draggingId, fallbackNewElement)) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onActivateDrop(idx + 1);
                  const payload = parseDragPayload(e.dataTransfer, screen, draggingId, fallbackNewElement);
                  e.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
                }}
                onDrop={(e) => handleChildDrop(idx + 1, e)}
              >
                {activeDropIndex === idx + 1 && (
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-400/80" />
                )}
                <div
                  className="absolute -top-3 inset-x-0 h-6"
                  onDragOver={(e) => {
                    if (!isLetterDrag(e.dataTransfer, screen, draggingId, fallbackNewElement)) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onActivateDrop(idx + 1);
                    const payload = parseDragPayload(e.dataTransfer, screen, draggingId, fallbackNewElement);
                    e.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
                  }}
                  onDrop={(e) => handleChildDrop(idx + 1, e)}
                />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function DropZone({
  index,
  isActive,
  onActivate,
  onDeactivate,
  onDrop,
  brandColor,
  draggingId,
  screen,
  fallbackNewElement,
}: {
  index: number;
  isActive: boolean;
  onActivate: (index: number) => void;
  onDeactivate: () => void;
  onDrop: (index: number, payload: { type?: ElementType; moveId?: string; content?: string }) => void;
  brandColor: string;
  draggingId: string | null;
  screen?: Screen;
  fallbackNewElement?: { type?: ElementType; content?: string } | null;
}) {
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!isLetterDrag(event.dataTransfer, screen, draggingId, fallbackNewElement)) return;
    event.preventDefault();
    const payload = parseDragPayload(event.dataTransfer, screen, draggingId, fallbackNewElement);
    event.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
    event.stopPropagation();
    onActivate(index);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!isLetterDrag(event.dataTransfer, screen, draggingId, fallbackNewElement)) return;
    event.preventDefault();
    event.stopPropagation();
    onDeactivate();
    const payload = parseDragPayload(event.dataTransfer, screen, draggingId, fallbackNewElement);
    onDrop(index, payload);
  };

  return (
    <div
      className={cn(
        'relative h-4 transition-all duration-150 ease-out',
        isActive && 'h-12 rounded-md border-2 bg-blue-50',
      )}
      style={isActive ? { borderColor: brandColor } : undefined}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-transparent',
          isActive && 'h-1.5',
        )}
        style={isActive ? { backgroundColor: brandColor } : undefined}
      />
    </div>
  );
}

export function Canvas() {
  const letter = useEditorStore((state) => state.letter);
  const deviceMode = useEditorStore((state) => state.deviceMode);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const draggingNewElement = useEditorStore((state) => state.draggingNewElement);
  const setDraggingNewElement = useEditorStore((state) => state.setDraggingNewElement);
  const selectElement = useEditorStore((state) => state.selectElement);
  const updateElementContent = useEditorStore((state) => state.updateElementContent);
  const updateElementStyle = useEditorStore((state) => state.updateElementStyle);
  const updateElementProps = useEditorStore((state) => state.updateElementProps);
  const addElement = useEditorStore((state) => state.addElement);
  const addElementToGroup = useEditorStore((state) => state.addElementToGroup);
  const removeElement = useEditorStore((state) => state.removeElement);
  const moveElement = useEditorStore((state) => state.moveElement);
  const moveElementInGroup = useEditorStore((state) => state.moveElementInGroup);
  const groupElements = useEditorStore((state) => state.groupElements);
  const ungroupElement = useEditorStore((state) => state.ungroupElement);
  const brand = useEditorStore((state) => state.brand);
  const selectScreen = useEditorStore((state) => state.selectScreen);
  const addScreen = useEditorStore((state) => state.addScreen);
  const duplicateScreen = useEditorStore((state) => state.duplicateScreen);
  const removeScreen = useEditorStore((state) => state.removeScreen);
  const moveScreen = useEditorStore((state) => state.moveScreen);
  const selectedScreenId = useEditorStore((state) => state.selectedScreenId);
  const updateScreen = useEditorStore((state) => state.updateScreen);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeDrop, setActiveDrop] = useState<{ screenId: string | null; index: number | null }>({
    screenId: null,
    index: null,
  });
  const [activeGroupDrop, setActiveGroupDrop] = useState<{ groupId: string | null; index: number | null }>({
    groupId: null,
    index: null,
  });
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [promptActiveId, setPromptActiveId] = useState<string | null>(null);

  const screens = useMemo(() => [...letter.screens].sort((a, b) => a.order - b.order), [letter.screens]);
  const brandColor = brand?.primaryColor ?? '#000000';
  const selectedElement = useMemo(
    () => screens.flatMap((s) => s.elements).find((el) => el.id === selectedElementId) || null,
    [screens, selectedElementId],
  );

  const frameClass = useMemo(
    () =>
      deviceMode === 'mobile'
        ? 'w-[380px] min-h-[680px] rounded-phone'
        : 'w-[900px] min-h-[620px] rounded-2xl',
    [deviceMode],
  );
  const headerWidthClass = deviceMode === 'mobile' ? 'w-[380px]' : 'w-[900px]';
  const currentScreenIndex = screens.findIndex((s) => s.id === selectedScreenId);

  const handleDropType = (
    type: ElementType,
    index: number,
    screenId: string,
    options?: { content?: string; props?: Record<string, unknown> },
  ) => {
    addElement(type, index, screenId, options);
  };

  const handleReorder = (moveId: string, index: number, screenId: string) => {
    moveElement(moveId, index, screenId);
  };

  const handleContainerDragOver = (event: DragEvent<HTMLDivElement>, screenId: string, elementsLength: number) => {
    // Only handle when hovering the container itself (empty area). Otherwise child drop targets manage the indicator.
    if (event.target !== event.currentTarget) return;
    const screen = screens.find((s) => s.id === screenId);
    if (!isLetterDrag(event.dataTransfer, screen, draggingId, draggingNewElement)) return;
    event.preventDefault();
    event.stopPropagation();
    const payload = parseDragPayload(event.dataTransfer, screen, draggingId, draggingNewElement);
    event.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
    setActiveDrop({ screenId, index: elementsLength });
  };

  const handleContainerDrop = (event: DragEvent<HTMLDivElement>, screenId: string, elementsLength: number) => {
    if (event.target !== event.currentTarget) return;
    const screen = screens.find((s) => s.id === screenId);
    if (!isLetterDrag(event.dataTransfer, screen, draggingId, draggingNewElement)) return;
    event.preventDefault();
    event.stopPropagation();
    const targetIndex = activeDrop.screenId === screenId && activeDrop.index !== null ? activeDrop.index : elementsLength;
    const payload = parseDragPayload(event.dataTransfer, screen, draggingId, draggingNewElement);
    const options = payload.content ? { content: payload.content } : undefined;
    setActiveDrop({ screenId: null, index: null });
    setActiveGroupDrop({ groupId: null, index: null });
    setDraggingNewElement(null);
    if (payload.moveId) {
      handleReorder(payload.moveId, targetIndex, screenId);
    } else if (payload.type) {
      addElement(payload.type, targetIndex, screenId, options);
    }
  };

  const handleCanvasDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setActiveDrop({ screenId: null, index: null });
      setActiveGroupDrop({ groupId: null, index: null });
    }
  };

  useLayoutEffect(() => {
    if (selectedElementIds.length < 2 && !(selectedElement && selectedElement.type === 'group')) {
      setToolbarPos(null);
      return;
    }
    const nodes: DOMRect[] = [];
    selectedElementIds.forEach((id) => {
      const el = document.querySelector<HTMLElement>(`[data-element-id="${id}"]`);
      if (el) nodes.push(el.getBoundingClientRect());
    });
    if (selectedElement && selectedElement.type === 'group' && !selectedElementIds.includes(selectedElement.id)) {
      const el = document.querySelector<HTMLElement>(`[data-element-id="${selectedElement.id}"]`);
      if (el) nodes.push(el.getBoundingClientRect());
    }
    if (!nodes.length) {
      setToolbarPos(null);
      return;
    }
    const minTop = Math.min(...nodes.map((r) => r.top));
    const minLeft = Math.min(...nodes.map((r) => r.left));
    const maxRight = Math.max(...nodes.map((r) => r.right));
    setToolbarPos({
      top: minTop - 8,
      left: (minLeft + maxRight) / 2,
    });
  }, [selectedElementIds, selectedElement]);

  const computeInsertIndexFromEvent = (event: React.DragEvent<HTMLElement>, index: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    return event.clientY < midpoint ? index : index + 1;
  };

  useEffect(() => {
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (!selectedElementId && selectedElementIds.length === 0) return;
      const target = event.target as HTMLElement | null;
      const isCmd = event.metaKey || event.ctrlKey;

      // Allow grouping shortcuts even when an input/textarea is focused (text elements use a textarea).
      if (isCmd && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey && selectedElementId) {
          const group = screens
            .flatMap((s) => s.elements)
            .find((el) => el.id === selectedElementId && el.type === 'group');
          if (group) ungroupElement(group.id);
        } else if (selectedElementIds.length >= 2) {
          groupElements(selectedElementIds);
        }
        return;
      }

      const isTypingTarget =
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'INPUT' ||
        target?.isContentEditable;
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // When typing (e.g. a text element textarea is focused), keep normal caret navigation unless
        // the user holds a modifier key to indicate "reorder".
        if (isTypingTarget && !(event.metaKey || event.ctrlKey || event.altKey)) return;
        event.preventDefault();
        if (!selectedElementId) return;
        const delta = event.key === 'ArrowUp' ? -1 : 1;
        const targetScreen = screens.find((s) => s.elements.some((el) => el.id === selectedElementId));
        if (!targetScreen) return;
        const el = targetScreen.elements.find((x) => x.id === selectedElementId);
        if (!el) return;
        if (el.parentId) {
          const group = targetScreen.elements.find((g) => g.id === el.parentId && g.type === 'group');
          const children = (((group?.props ?? {}) as any).children as string[] | undefined) ?? [];
          const idx = children.indexOf(el.id);
          if (idx === -1) return;
          const to = clamp(idx + delta, 0, children.length - 1);
          if (to !== idx) moveElementInGroup(el.parentId, el.id, to);
        } else {
          const root = targetScreen.elements.filter((x) => !x.parentId);
          const idx = root.findIndex((x) => x.id === el.id);
          if (idx === -1) return;
          const to = clamp(idx + delta, 0, root.length - 1);
          if (to !== idx) moveElement(el.id, to, targetScreen.id);
        }
        return;
      }
      if (isTypingTarget) return;
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        if (selectedElementId) {
          removeElement(selectedElementId);
        }
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKey, { capture: true } as any);
    };
  }, [removeElement, selectedElementId, selectedElementIds, screens, groupElements, ungroupElement]);

  return (
    <main
      className="flex-1 overflow-y-auto bg-slate-50 h-[calc(100vh-56px)]"
      onClick={() => {
        selectElement(null);
        setPromptActiveId(null);
      }}
    >
      {(selectedElementIds.length >= 2 || (selectedElement && selectedElement.type === 'group')) && (
        <div
          className="pointer-events-auto z-30 flex gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-md"
          style={
            toolbarPos
              ? {
                  position: 'fixed',
                  top: Math.max(toolbarPos.top, 12),
                  left: toolbarPos.left,
                  transform: 'translate(-50%, -100%)',
                }
              : { position: 'fixed', right: '24px', top: '16px' }
          }
        >
          {selectedElementIds.length >= 2 && (
            <Button size="sm" variant="secondary" onClick={() => groupElements(selectedElementIds)}>
              Group (⌘/Ctrl+G)
            </Button>
          )}
          {selectedElement && selectedElement.type === 'group' && (
            <Button size="sm" variant="outline" onClick={() => ungroupElement(selectedElement.id)}>
              Ungroup (⇧+⌘/Ctrl+G)
            </Button>
          )}
        </div>
      )}
      {/* Floating text toolbar removed; editing moves to side panel */}
      <div className="mx-auto w-full max-w-6xl px-6 py-4 space-y-8">
        {screens.map((screen, idx) => {
          const isScreenSelected = selectedScreenId === screen.id;
          const activeIndex = activeDrop.screenId === screen.id ? activeDrop.index : null;
          const canMoveUp = idx > 0;
          const canMoveDown = idx < screens.length - 1;
          const screenAccent = screen.style?.accentColor ?? brandColor;
          const screenBackground = screen.style?.background ?? '#ffffff';
          const screenBackgroundImage = screen.style?.backgroundImage;
          const overlayColor = screen.style?.backgroundOverlayColor ?? '#000000';
          const overlayOpacity = screen.style?.backgroundOverlayOpacity ?? (screenBackgroundImage ? 0.28 : 0);
          const screenTextColor = screen.style?.textColor ?? '#111827';
          const buttonColor = screen.style?.buttonColor ?? screenAccent;
          const buttonTextColor = getAccessibleTextColor(buttonColor, screen.style?.textColor);
          const rootElements = screen.elements.filter((el) => !el.parentId);
          const rootCount = rootElements.length;
          const elementSpacing = screen.style?.elementSpacing ?? 12;
          return (
            <div key={screen.id} className="space-y-2">
              <div className="flex justify-center">
                <div
                  className={cn(
                    headerWidthClass,
                    'flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700',
                  )}
                  style={{ boxShadow: isScreenSelected ? 'none' : 'none' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-slate-900">Page {idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-base hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeScreen(screen.id);
                      }}
                      aria-label="Delete screen"
                    >
                      🗑️
                    </button>
                    <button
                      type="button"
                      className="text-base hover:text-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateScreen(screen.id);
                      }}
                      aria-label="Duplicate screen"
                    >
                      ⧉
                    </button>
                    <button
                      type="button"
                      className={cn('text-base', canMoveDown ? 'hover:text-slate-900' : 'opacity-40 cursor-not-allowed')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canMoveDown) moveScreen(screen.id, 'down');
                      }}
                      aria-label="Move screen down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={cn('text-base', canMoveUp ? 'hover:text-slate-900' : 'opacity-40 cursor-not-allowed')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canMoveUp) moveScreen(screen.id, 'up');
                      }}
                      aria-label="Move screen up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="text-xl hover:text-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        addScreen();
                      }}
                      aria-label="Add screen"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div
                  className={cn(
                    frameClass,
                    'relative flex flex-col overflow-hidden border px-6 py-8 shadow-soft-lg transition',
                  )}
                  style={{
                    backgroundColor: screenBackground,
                    backgroundImage: screenBackgroundImage ? `url(${screenBackgroundImage})` : undefined,
                    backgroundSize: screen.style?.backgroundSize ?? 'cover',
                    backgroundPosition: screen.style?.backgroundPosition ?? 'center',
                    backgroundRepeat: 'no-repeat',
                    borderColor: isScreenSelected ? `${screenAccent}` : `${screenAccent}33`,
                    boxShadow: isScreenSelected ? `0 10px 25px ${screenAccent}22` : `0 10px 25px ${screenAccent}14`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectScreen(screen.id);
                    selectElement(null);
                  }}
                  onDragOver={(e) =>
                    handleContainerDragOver(e, screen.id, rootCount)
                  }
                  onDragLeave={handleCanvasDragLeave}
                  onDrop={(e) => handleContainerDrop(e, screen.id, rootCount)}
                  >
                  {overlayOpacity > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none rounded-inherit"
                      style={{ backgroundColor: hexToRgba(overlayColor, overlayOpacity) }}
                    />
                  )}
                  <div className="absolute inset-0 pointer-events-none rounded-inherit" />
                  <div
                    className={cn(
                      'flex min-h-[240px] flex-1 flex-col transition-colors py-24 w-full',
                      deviceMode === 'desktop' ? 'max-w-[760px] mx-auto' : '',
                    )}
                    style={{
                      alignItems:
                        screen.style?.alignItems === 'center'
                          ? 'center'
                          : screen.style?.alignItems === 'end'
                            ? 'flex-end'
                            : 'flex-start',
                      justifyContent:
                        screen.style?.justifyContent === 'end'
                          ? 'flex-end'
                          : screen.style?.justifyContent === 'start'
                            ? 'flex-start'
                            : 'center',
                    }}
                    onDragOver={(e) => {
                      // Allow dropping in the blank area between items / after the last item.
                      if (e.target !== e.currentTarget) return;
                      if (!isLetterDrag(e.dataTransfer, screen, draggingId, draggingNewElement)) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDrop({ screenId: screen.id, index: rootCount });
                      const payload = parseDragPayload(e.dataTransfer, screen, draggingId, draggingNewElement);
                      e.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
                    }}
                    onDrop={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (!isLetterDrag(e.dataTransfer, screen, draggingId, draggingNewElement)) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const payload = parseDragPayload(e.dataTransfer, screen, draggingId, draggingNewElement);
                      const options = payload.content ? { content: payload.content } : undefined;
                      setActiveDrop({ screenId: null, index: null });
                      setActiveGroupDrop({ groupId: null, index: null });
                      setDraggingNewElement(null);
                      if (payload.moveId) {
                        handleReorder(payload.moveId, rootCount, screen.id);
                      } else if (payload.type) {
                        handleDropType(payload.type, rootCount, screen.id, options);
                      }
                    }}
                  >
                    {rootCount === 0 ? (
                      <div
                        className={cn(
                          'rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500',
                          activeIndex === 0 && 'bg-blue-50',
                        )}
                        style={activeIndex === 0 ? { borderColor: screenAccent, color: screenAccent } : undefined}
                        onDragOver={(event) => {
                          if (!isLetterDrag(event.dataTransfer, screen, draggingId, draggingNewElement)) return;
                          event.preventDefault();
                          event.stopPropagation();
                          setActiveDrop({ screenId: screen.id, index: 0 });
                        }}
                        onDragLeave={() => setActiveDrop({ screenId: null, index: null })}
                        onDrop={(event) => {
                          if (!isLetterDrag(event.dataTransfer, screen, draggingId, draggingNewElement)) return;
                          event.preventDefault();
                          event.stopPropagation();
                          const payload = parseDragPayload(event.dataTransfer, screen, draggingId, draggingNewElement);
                          const options = payload.content ? { content: payload.content } : undefined;
                          setActiveDrop({ screenId: null, index: null });
                          setDraggingNewElement(null);
                          if (payload.moveId) {
                            handleReorder(payload.moveId, 0, screen.id);
                          } else if (payload.type) {
                            handleDropType(payload.type, 0, screen.id, options);
                          }
                        }}
                      >
                        Add elements from the left to start building this screen.
                      </div>
                    ) : (
                      rootElements.map((el, index) => (
                        <Fragment key={el.id}>
                          <DropZone
                            index={index}
                            isActive={activeDrop.screenId === screen.id && activeDrop.index === index}
                            onActivate={(idx) => setActiveDrop({ screenId: screen.id, index: idx })}
                            onDeactivate={() => setActiveDrop({ screenId: null, index: null })}
                            onDrop={(i, payload) => {
                              setDraggingNewElement(null);
                              if (payload.moveId) {
                                handleReorder(payload.moveId, i, screen.id);
                              } else if (payload.type) {
                                const options = payload.content ? { content: payload.content } : undefined;
                                handleDropType(payload.type, i, screen.id, options);
                              }
                            }}
                            brandColor={screenAccent}
                            draggingId={draggingId}
                            screen={screen}
                            fallbackNewElement={draggingNewElement}
                          />
                          <div
                            className={cn('relative', el.type === 'group' ? 'max-w-full' : 'w-full')}
                            data-element-id={el.id}
                            style={{ marginTop: index === 0 ? 0 : elementSpacing }}
                            onDragOver={(e) => {
                              if (!isLetterDrag(e.dataTransfer, screen, draggingId, draggingNewElement)) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const insertIndex = computeInsertIndexFromEvent(e, index);
                              setActiveDrop({ screenId: screen.id, index: insertIndex });
                              const payload = parseDragPayload(e.dataTransfer, screen, draggingId, draggingNewElement);
                              e.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
                            }}
                            onDrop={(e) => {
                              if (!isLetterDrag(e.dataTransfer, screen, draggingId, draggingNewElement)) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const insertIndex = computeInsertIndexFromEvent(e, index);
                              const payload = parseDragPayload(e.dataTransfer, screen, draggingId, draggingNewElement);
                              const options = payload.content ? { content: payload.content } : undefined;
                              setActiveDrop({ screenId: null, index: null });
                              setDraggingNewElement(null);
                              if (payload.moveId) {
                                handleReorder(payload.moveId, insertIndex, screen.id);
                              } else if (payload.type) {
                                handleDropType(payload.type, insertIndex, screen.id, options);
                              }
                            }}
                          >
                            {index > 0 && elementSpacing > 0 && (
                              <div
                                className="absolute inset-x-0"
                                style={{ top: -elementSpacing, height: elementSpacing }}
                                onDragOver={(e) => {
                                  if (!isLetterDrag(e.dataTransfer, screen, draggingId, draggingNewElement)) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveDrop({ screenId: screen.id, index });
                                  const payload = parseDragPayload(e.dataTransfer, screen, draggingId, draggingNewElement);
                                  e.dataTransfer.dropEffect = payload.moveId ? 'move' : 'copy';
                                }}
                                onDrop={(e) => {
                                  if (!isLetterDrag(e.dataTransfer, screen, draggingId, draggingNewElement)) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const payload = parseDragPayload(e.dataTransfer, screen, draggingId, draggingNewElement);
                                  const options = payload.content ? { content: payload.content } : undefined;
                                  setActiveDrop({ screenId: null, index: null });
                                  setActiveGroupDrop({ groupId: null, index: null });
                                  setDraggingNewElement(null);
                                  if (payload.moveId) {
                                    handleReorder(payload.moveId, index, screen.id);
                                  } else if (payload.type) {
                                    handleDropType(payload.type, index, screen.id, options);
                                  }
                                }}
                              />
                            )}
                            {el.type === 'group' ? (
                              <GroupCard
                                element={el}
                                screen={screen}
                                brandColor={screenAccent}
                                screenTextColor={screenTextColor}
                                selectedElementIds={selectedElementIds}
                                fallbackNewElement={draggingNewElement}
                                onSelectGroup={(opts) => {
                                  if (selectedScreenId !== screen.id) selectScreen(screen.id);
                                  selectElement(el.id, opts);
                                }}
                                onSelectChild={(childId, opts) => {
                                  if (selectedScreenId !== screen.id) selectScreen(screen.id);
                                  selectElement(childId, opts);
                                }}
                                onChangeChild={(childId, content) => updateElementContent(childId, content)}
                                onChangeChildProps={(childId, props) => updateElementProps(childId, props)}
                                onResizeChildStyle={(childId, style) => updateElementStyle(childId, style)}
                                onPromptFocus={(id) => {
                                  if (selectedScreenId !== screen.id) selectScreen(screen.id);
                                  selectElement(id);
                                  setPromptActiveId(id);
                                }}
                                onPromptBlur={(id) => {
                                  if (promptActiveId === id) setPromptActiveId(null);
                                }}
                                onChildDragStart={(event, id) => {
                                  event.dataTransfer?.setData(CANVAS_ELEMENT_DRAG_TYPE, id);
                                  event.dataTransfer?.setData('text/plain', id);
                                  event.dataTransfer.effectAllowed = 'move';
                                  setDraggingId(id);
                                }}
                                onChildDragEnd={() => setDraggingId(null)}
                                onGroupDragStart={(event, id) => {
                                  event.dataTransfer?.setData(CANVAS_ELEMENT_DRAG_TYPE, id);
                                  event.dataTransfer?.setData('text/plain', id);
                                  event.dataTransfer.effectAllowed = 'move';
                                  setDraggingId(id);
                                }}
                                onGroupDragEnd={() => setDraggingId(null)}
                                isDragging={draggingId === el.id}
                                draggingId={draggingId}
                                activeDropIndex={activeGroupDrop.groupId === el.id ? activeGroupDrop.index : null}
                                onActivateDrop={(idx) => setActiveGroupDrop({ groupId: el.id, index: idx })}
                                onDeactivateDrop={() => setActiveGroupDrop({ groupId: null, index: null })}
                                onDropIn={(idx, payload) => {
                                  setActiveGroupDrop({ groupId: null, index: null });
                                  setDraggingNewElement(null);
                                  if (payload.moveId) {
                                    moveElementInGroup(el.id, payload.moveId, idx);
                                  } else if (payload.type) {
                                    const options = payload.content ? { content: payload.content } : undefined;
                                    addElementToGroup(payload.type, el.id, idx, screen.id, options);
                                  }
                                }}
                              />
                            ) : (
                              <ElementCard
                                element={el}
                                selected={selectedElementIds.includes(el.id)}
                                onSelect={() => {
                                  if (selectedScreenId !== screen.id) selectScreen(screen.id);
                                  selectElement(el.id);
                                }}
                                onSelectMultiple={(opts) => {
                                  if (selectedScreenId !== screen.id) selectScreen(screen.id);
                                  selectElement(el.id, opts);
                                }}
                                onChange={(value) => updateElementContent(el.id, value)}
                                onChangeProps={(props) => updateElementProps(el.id, props)}
                                brandColor={screenAccent}
                                screenBackground={screenBackground}
                                screenTextColor={screenTextColor}
                                onDragStart={(event, id) => {
                                  event.dataTransfer?.setData(CANVAS_ELEMENT_DRAG_TYPE, id);
                                  event.dataTransfer?.setData('text/plain', id);
                                  event.dataTransfer.effectAllowed = 'move';
                                  setDraggingId(id);
                                }}
                                onDragEnd={() => setDraggingId(null)}
                                isDragging={draggingId === el.id}
                                onPromptFocus={(id) => {
                                  selectScreen(screen.id);
                                  selectElement(id);
                                  setPromptActiveId(id);
                                }}
                                onPromptBlur={(id) => {
                                  if (promptActiveId === id) setPromptActiveId(null);
                                }}
                                onResizeStyle={(style) => updateElementStyle(el.id, style)}
                              />
                            )}
                          </div>
                          {index === rootElements.length - 1 && (
                            <DropZone
                              index={index + 1}
                              isActive={
                                activeDrop.screenId === screen.id &&
                                activeDrop.index === index + 1
                              }
                              onActivate={(idx) => setActiveDrop({ screenId: screen.id, index: idx })}
                              onDeactivate={() => setActiveDrop({ screenId: null, index: null })}
                              onDrop={(i, payload) => {
                                setDraggingNewElement(null);
                                if (payload.moveId) {
                                  handleReorder(payload.moveId, i, screen.id);
                                } else if (payload.type) {
                                  const options = payload.content ? { content: payload.content } : undefined;
                                  handleDropType(payload.type, i, screen.id, options);
                                }
                              }}
                              brandColor={screenAccent}
                              draggingId={draggingId}
                              screen={screen}
                              fallbackNewElement={draggingNewElement}
                            />
                          )}
                        </Fragment>
                      ))
                    )}
                  </div>

                  {screen.mode === 'single-screen' && (
                    <div className="mt-6" />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex w-full justify-center pb-4">
                    <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 px-3">
                      {screens.length === 1 ? (
                      <Button
                        size="sm"
                        className="w-full"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <NavLabelInput
                          value={screen.navDoneLabel}
                          placeholder="Done"
                          onChange={(text) => updateScreen(screen.id, { navDoneLabel: text })}
                        />
                      </Button>
                    ) : (
                      <>
                        {idx === 0 ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-1/2"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <NavLabelInput
                                value={screen.navCloseLabel}
                                placeholder="Close"
                                onChange={(text) => updateScreen(screen.id, { navCloseLabel: text })}
                              />
                            </Button>
                            <Button
                              size="sm"
                              className="w-1/2"
                              style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = Math.min(screens.length - 1, currentScreenIndex + 1);
                                const target = screens[next];
                                if (target) selectScreen(target.id);
                              }}
                            >
                              <NavLabelInput
                                value={screen.navNextLabel}
                                placeholder="Next"
                                onChange={(text) => updateScreen(screen.id, { navNextLabel: text })}
                              />
                            </Button>
                          </>
                        ) : idx === screens.length - 1 ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-1/2"
                              onClick={(e) => {
                                e.stopPropagation();
                                const prev = Math.max(0, currentScreenIndex - 1);
                                const target = screens[prev];
                                if (target) selectScreen(target.id);
                              }}
                            >
                              <NavLabelInput
                                value={screen.navBackLabel}
                                placeholder="Back"
                                onChange={(text) => updateScreen(screen.id, { navBackLabel: text })}
                              />
                            </Button>
                            <Button
                              size="sm"
                              className="w-1/2"
                              style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <NavLabelInput
                                value={screen.navDoneLabel}
                                placeholder="Done"
                                onChange={(text) => updateScreen(screen.id, { navDoneLabel: text })}
                              />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-1/2"
                              onClick={(e) => {
                                e.stopPropagation();
                                const prev = Math.max(0, currentScreenIndex - 1);
                                const target = screens[prev];
                                if (target) selectScreen(target.id);
                              }}
                            >
                              <NavLabelInput
                                value={screen.navBackLabel}
                                placeholder="Back"
                                onChange={(text) => updateScreen(screen.id, { navBackLabel: text })}
                              />
                            </Button>
                            <Button
                              size="sm"
                              className="w-1/2"
                              style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = Math.min(screens.length - 1, currentScreenIndex + 1);
                                const target = screens[next];
                                if (target) selectScreen(target.id);
                              }}
                            >
                              <NavLabelInput
                                value={screen.navNextLabel}
                                placeholder="Next"
                                onChange={(text) => updateScreen(screen.id, { navNextLabel: text })}
                              />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-center">
          <Button variant="secondary" size="md" onClick={addScreen}>
            + Add screen
          </Button>
        </div>
      </div>
    </main>
  );
}
function NavLabelInput({
  value,
  placeholder,
  onChange,
}: {
  value?: string;
  placeholder: string;
  onChange: (next: string) => void;
}) {
  return (
    <input
      className="w-full bg-transparent text-center text-sm font-semibold placeholder:text-slate-500 focus:outline-none"
      value={value ?? placeholder}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
