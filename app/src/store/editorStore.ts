// AI-AGENT-HEADER
// path: /src/store/editorStore.ts
// summary: Zustand store for letter, screen, selected element, and UI device mode.
// last-reviewed: 2025-12-08
// line-range: 1-200

import { nanoid } from 'nanoid';
import { create } from 'zustand';
import type { BaseElement, Brand, DeviceMode, ElementType, Letter, TextStyle, UploadItem } from '../types/editor';

type EditorState = {
  letter: Letter;
  deviceMode: DeviceMode;
  activeDraftId: string | null;
  selectedElementId: string | null;
  selectedElementIds: string[];
  selectedScreenId: string;
  brand: Brand;
  brandKits: Brand[];
  uploads: UploadItem[];
  draggingNewElement: { type: ElementType; content?: string } | null;
  setDraggingNewElement: (payload: { type: ElementType; content?: string } | null) => void;
  setActiveDraftId: (draftId: string | null) => void;
  setLetter: (letter: Letter) => void;
  updateLetterTitle: (title: string) => void;
  addElement: (
    type: ElementType,
    index?: number,
    screenId?: string,
    options?: { content?: string; props?: Record<string, unknown>; style?: BaseElement['style'] },
  ) => void;
  addElementToGroup: (
    type: ElementType,
    groupId: string,
    index: number,
    screenId?: string,
    options?: { content?: string; props?: Record<string, unknown>; style?: BaseElement['style'] },
  ) => void;
  removeElement: (id: string) => void;
  moveElement: (id: string, toIndex: number, screenId?: string) => void;
  moveElementInGroup: (groupId: string, childId: string, toIndex: number) => void;
  setElementType: (id: string, type: ElementType) => void;
  groupElements: (ids: string[]) => void;
  ungroupElement: (id: string) => void;
  addScreen: () => void;
  duplicateScreen: (screenId: string) => void;
  removeScreen: (screenId: string) => void;
  moveScreen: (screenId: string, direction: 'up' | 'down') => void;
  selectScreen: (screenId: string) => void;
  updateScreen: (screenId: string, patch: Partial<Letter['screens'][number]>) => void;
  selectElement: (id: string | null, options?: { append?: boolean; toggle?: boolean }) => void;
  setSelectedElements: (ids: string[]) => void;
  updateElementContent: (id: string, content: string) => void;
  updateElementStyle: (id: string, style: Partial<BaseElement['style']>) => void;
  updateElementProps: (id: string, props: Record<string, unknown>) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  updateBrand: (brand: Partial<Brand>) => void;
  addBrandKit: (kit: Omit<Brand, 'id'>) => string;
  updateBrandKit: (id: string, patch: Partial<Brand>) => void;
  setActiveBrand: (id: string) => void;
  addUpload: (item: Omit<UploadItem, 'id'>) => void;
};

const initialLetter: Letter = {
  id: 'letter-1',
  title: 'New Letter',
  language: 'en',
  screens: [
    {
      id: 'screen-1',
      order: 1,
      mode: 'scroll',
      elements: [],
      style: { justifyContent: 'center' },
    },
  ],
};

const defaultContent: Record<ElementType, string> = {
  header: 'Add a title',
  subheader: 'Add a subtitle',
  paragraph: 'Add a description',
  image: 'Image placeholder (URL)',
  video: 'Video placeholder (URL)',
  button: 'Add a button label',
  'single-choice': 'Single choice question',
  'multiple-choice': 'Multiple choice question',
  input: 'Short text input',
  file: 'Upload a file',
  date: 'Enter a date',
  'date-input': 'Enter a date',
  rating: 'Rate your experience',
  ranking: 'Rank your preferences',
  group: 'Group',
};

const defaultStyle: Partial<Record<ElementType, BaseElement['style']>> = {
  paragraph: { fontSize: 16, align: 'left', width: 540 },
  header: { fontSize: 26, align: 'left', width: 560 },
  subheader: { fontSize: 20, align: 'left', width: 560 },
  button: { fontSize: 18, align: 'center', width: 220, height: 56 },
  image: {},
  video: {},
};

function reorderScreens(screens: Letter['screens']) {
  return screens
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s, idx) => ({ ...s, order: idx + 1 }));
}

export const useEditorStore = create<EditorState>((set) => ({
  letter: initialLetter,
  deviceMode: 'mobile',
  activeDraftId: null,
  selectedElementId: null,
  selectedElementIds: [],
  selectedScreenId: initialLetter.screens[0].id,
  draggingNewElement: null,
  setDraggingNewElement: (payload) => set({ draggingNewElement: payload }),
  setActiveDraftId: (draftId) => set({ activeDraftId: draftId }),
  setLetter: (letter) =>
    set(() => {
      const screens = [...(letter.screens ?? [])].sort((a, b) => a.order - b.order);
      const selectedScreenId = screens[0]?.id ?? initialLetter.screens[0].id;
      return {
        letter,
        selectedScreenId,
        selectedElementId: null,
        selectedElementIds: [],
        draggingNewElement: null,
      };
    }),
  updateLetterTitle: (title) =>
    set((state) => ({
      letter: { ...state.letter, title },
    })),
  brand: {
    id: 'brand-default',
    name: 'Neutral',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontHeader: 'Inter, system-ui, sans-serif',
    fontParagraph: 'Inter, system-ui, sans-serif',
    theme: 'Minimal',
  },
  brandKits: [
    {
      id: 'brand-default',
      name: 'Neutral',
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontHeader: 'Inter, system-ui, sans-serif',
      fontParagraph: 'Inter, system-ui, sans-serif',
      theme: 'Minimal',
    },
    {
      id: 'brand-post',
      name: 'Post',
      logoUrl: '/brand/post-logo.svg',
      primaryColor: '#FFCA28',
      secondaryColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontHeader: 'Inter, system-ui, sans-serif',
      fontParagraph: 'Inter, system-ui, sans-serif',
      theme: 'Minimal',
    },
  ],
  uploads: [],

  addElement: (type, index, screenId, options) =>
    set((state) => {
      const targetScreen =
        state.letter.screens.find((s) => s.id === (screenId ?? state.selectedScreenId)) ??
        state.letter.screens[0];
      const insertionIndex = Math.min(
        Math.max(index ?? targetScreen.elements.length, 0),
        targetScreen.elements.length,
      );
      const defaultStyleForType = defaultStyle[type] ?? { fontSize: 18, align: 'left' } satisfies TextStyle;
      const baseProps =
        type === 'single-choice' || type === 'multiple-choice'
          ? {
              options: [
                { label: 'Option A' },
                { label: 'Option B' },
                { label: 'Option C' },
              ],
              optionFormat: 'text',
              showPrompt: true,
            }
          : type === 'ranking'
            ? {
                options: [
                  { label: 'Item 1' },
                  { label: 'Item 2' },
                  { label: 'Item 3' },
                ],
                optionFormat: 'text',
                showPrompt: true,
              }
            : type === 'rating'
              ? {
                  max: 5,
                  showPrompt: true,
                  scaleType: 'stars',
                  required: false,
                  minLabel: 'Not relevant',
                  maxLabel: 'Very relevant',
              }
            : type === 'date'
                ? { required: false, mode: 'date', placeholder: 'Select date', showPrompt: true }
                : type === 'date-input'
                  ? { required: false, placeholder: 'Enter a date', showPrompt: true }
                  : type === 'file'
                    ? { required: false, maxSizeMb: 10, showPrompt: true, accept: 'any', customAccept: [] }
                    : type === 'input'
                      ? { required: false, maxLength: undefined, showPrompt: true }
              : undefined;
      const newElement: BaseElement = {
        id: nanoid(),
        type,
        content: options?.content ?? defaultContent[type],
        style: options?.style ?? defaultStyleForType,
        props: options?.props ?? baseProps,
      };
      const updatedScreens = state.letter.screens.map((s) => {
        if (s.id !== targetScreen.id) return s;
        const elements = [...s.elements];
        elements.splice(insertionIndex, 0, newElement);
        return { ...s, elements };
      });
      return {
        letter: { ...state.letter, screens: updatedScreens },
        selectedElementId: newElement.id,
        selectedScreenId: targetScreen.id,
      };
    }),

  addElementToGroup: (type, groupId, index, screenId, options) =>
    set((state) => {
      const targetScreen =
        state.letter.screens.find((s) => s.id === (screenId ?? state.selectedScreenId)) ??
        state.letter.screens[0];
      const group = targetScreen.elements.find((el) => el.id === groupId && el.type === 'group');
      if (!group) return {};

      const defaultStyleForType = defaultStyle[type] ?? { fontSize: 18, align: 'left' } satisfies TextStyle;
      const baseProps =
        type === 'single-choice' || type === 'multiple-choice'
          ? {
              options: [
                { label: 'Option A' },
                { label: 'Option B' },
                { label: 'Option C' },
              ],
              optionFormat: 'text',
              showPrompt: true,
            }
          : type === 'ranking'
            ? {
                options: [
                  { label: 'Item 1' },
                  { label: 'Item 2' },
                  { label: 'Item 3' },
                ],
                optionFormat: 'text',
                showPrompt: true,
              }
            : type === 'rating'
              ? {
                  max: 5,
                  showPrompt: true,
                  scaleType: 'stars',
                  required: false,
                  minLabel: 'Not relevant',
                  maxLabel: 'Very relevant',
                }
              : type === 'date'
                ? { required: false, mode: 'date', placeholder: 'Select date', showPrompt: true }
                : type === 'date-input'
                  ? { required: false, placeholder: 'Enter a date', showPrompt: true }
                  : type === 'file'
                    ? { required: false, maxSizeMb: 10, showPrompt: true, accept: 'any', customAccept: [] }
                    : type === 'input'
                      ? { required: false, maxLength: undefined, showPrompt: true }
                      : undefined;

      const newElement: BaseElement = {
        id: nanoid(),
        type,
        content: options?.content ?? defaultContent[type],
        style: options?.style ?? defaultStyleForType,
        props: options?.props ?? baseProps,
        parentId: groupId,
      };

      const nextChildren = Array.isArray((group.props as any)?.children) ? [...((group.props as any).children as string[])] : [];
      const insertionIndex = Math.min(Math.max(index, 0), nextChildren.length);
      nextChildren.splice(insertionIndex, 0, newElement.id);
      const nextGroup: BaseElement = {
        ...group,
        props: { ...(group.props ?? {}), children: nextChildren },
      };

      const updatedScreens = state.letter.screens.map((s) => {
        if (s.id !== targetScreen.id) return s;
        const elements = s.elements.map((el) => (el.id === nextGroup.id ? nextGroup : el));
        elements.push(newElement);
        return { ...s, elements };
      });

      return {
        letter: { ...state.letter, screens: updatedScreens },
        selectedElementId: newElement.id,
        selectedElementIds: [newElement.id],
        selectedScreenId: targetScreen.id,
      };
    }),

  removeElement: (id) =>
    set((state) => {
      let removed = false;
      const updatedScreens = state.letter.screens.map((s) => {
        const filtered = s.elements.filter((el) => el.id !== id && el.parentId !== id);
        if (filtered.length !== s.elements.length) removed = true;
        return { ...s, elements: filtered };
      });
      const nextSelected = removed && state.selectedElementIds.includes(id)
        ? state.selectedElementIds.filter((x) => x !== id)
        : state.selectedElementIds;
      return {
        letter: { ...state.letter, screens: updatedScreens },
        selectedElementId: nextSelected[nextSelected.length - 1] ?? state.selectedElementId,
        selectedElementIds: nextSelected,
      };
    }),

  moveElement: (id, toIndex, screenId) =>
    set((state) => {
      const sourceScreen = state.letter.screens.find((s) => s.elements.some((el) => el.id === id));
      if (!sourceScreen) return state;
      const targetScreen = screenId
        ? state.letter.screens.find((s) => s.id === screenId)
        : sourceScreen;
      if (!targetScreen) return state;
      const element = sourceScreen.elements.find((el) => el.id === id);
      if (!element) return state;

      const stripFromGroups = (elements: BaseElement[], childId: string) =>
        elements.map((el) => {
          if (el.type === 'group' && (el.props as any)?.children?.includes(childId)) {
            const props = (el.props ?? {}) as { children?: string[] };
            return { ...el, props: { ...props, children: (props.children ?? []).filter((c) => c !== childId) } };
          }
          if (el.id === childId && el.parentId) {
            return { ...el, parentId: undefined };
          }
          return el;
        });

      const isSameScreen = sourceScreen.id === targetScreen.id;
      if (isSameScreen) {
        const detachedElements = stripFromGroups(sourceScreen.elements, id);
        const root = detachedElements.filter((el) => !el.parentId);
        const children = detachedElements.filter((el) => el.parentId);
        const fromIndex = root.findIndex((el) => el.id === id);
        if (fromIndex === -1) return state;
        const boundedIndex = Math.max(0, Math.min(toIndex, root.length - 1));
        if (fromIndex === boundedIndex) return state;
        const reordered = [...root];
        const [item] = reordered.splice(fromIndex, 1);
        reordered.splice(boundedIndex, 0, item);
        const updatedScreens = state.letter.screens.map((s) =>
          s.id === targetScreen.id ? { ...s, elements: [...reordered, ...children] } : s,
        );
        return {
          letter: { ...state.letter, screens: updatedScreens },
          selectedElementId: id,
          selectedElementIds: state.selectedElementIds.includes(id) ? state.selectedElementIds : [id],
          selectedScreenId: targetScreen.id,
        };
      }

      const groupChildIds =
        element.type === 'group'
          ? Array.from(
              new Set([
                ...((((element.props ?? {}) as any).children as string[]) ?? []),
                ...sourceScreen.elements.filter((el) => el.parentId === element.id).map((el) => el.id),
              ]),
            )
          : [];
      const movedIds = new Set<string>([id, ...groupChildIds]);

      const movedElements = sourceScreen.elements
        .filter((el) => movedIds.has(el.id))
        .map((el) => {
          if (el.id === id) {
            const props = (el.props ?? {}) as { children?: string[] };
            return element.type === 'group'
              ? { ...el, parentId: undefined, props: { ...props, children: groupChildIds } }
              : { ...el, parentId: undefined };
          }
          if (element.type === 'group') return { ...el, parentId: id };
          return { ...el, parentId: undefined };
        });

      const cleanedSourceElements = stripFromGroups(sourceScreen.elements, id).filter((el) => !movedIds.has(el.id));
      const targetDetached = stripFromGroups(targetScreen.elements, id);
      const targetRoot = targetDetached.filter((el) => !el.parentId && !movedIds.has(el.id));
      const targetChildren = targetDetached.filter((el) => el.parentId && !movedIds.has(el.id));

      const insertIndex = Math.max(0, Math.min(toIndex, targetRoot.length));
      const movedRoot = movedElements.filter((el) => !el.parentId);
      const movedChildren = movedElements.filter((el) => el.parentId);
      const nextRoot = [...targetRoot];
      nextRoot.splice(insertIndex, 0, ...movedRoot);

      const updatedScreens = state.letter.screens.map((s) => {
        if (s.id === sourceScreen.id) return { ...s, elements: cleanedSourceElements };
        if (s.id === targetScreen.id) return { ...s, elements: [...nextRoot, ...targetChildren, ...movedChildren] };
        return s;
      });

      return {
        letter: { ...state.letter, screens: updatedScreens },
        selectedElementId: id,
        selectedElementIds: [id],
        selectedScreenId: targetScreen.id,
      };
    }),

  moveElementInGroup: (groupId, childId, toIndex) =>
    set((state) => {
      const updatedScreens = state.letter.screens.map((s) => {
        const group = s.elements.find((el) => el.id === groupId && el.type === 'group');
        if (!group) return s;
        const props = (group.props ?? {}) as { children?: string[]; spacing?: number; align?: string };
        const children = props.children ?? [];
        const nextChildren = children.filter((id) => id !== childId);
        const insertIndex = Math.max(0, Math.min(toIndex, nextChildren.length));
        nextChildren.splice(insertIndex, 0, childId);
        const cleanedElements = s.elements.map((el) => {
          if (el.type === 'group' && (el.props as any)?.children?.includes(childId) && el.id !== groupId) {
            const otherProps = (el.props ?? {}) as { children?: string[] };
            return { ...el, props: { ...otherProps, children: (otherProps.children ?? []).filter((c) => c !== childId) } };
          }
          return el;
        });
        return {
          ...s,
          elements: cleanedElements.map((el) => {
            if (el.id === childId) return { ...el, parentId: groupId };
            if (el.id === groupId) return { ...el, props: { ...props, children: nextChildren } };
            return el;
          }),
        };
      });
      return { letter: { ...state.letter, screens: updatedScreens } };
    }),

  setElementType: (id, type) =>
    set((state) => {
      const updatedScreens = state.letter.screens.map((screen) => ({
        ...screen,
        elements: screen.elements.map((el) => (el.id === id ? { ...el, type } : el)),
      }));
      return { letter: { ...state.letter, screens: updatedScreens } };
    }),

  groupElements: (ids) =>
    set((state) => {
      const targetScreen = state.letter.screens.find((s) => ids.every((id) => s.elements.some((el) => el.id === id)));
      if (!targetScreen) return state;
      const root = targetScreen.elements.filter((el) => !el.parentId);
      const selectedRoot = root.filter((el) => ids.includes(el.id));
      if (selectedRoot.length < 2) return state;
      const firstIndex = root.findIndex((el) => ids.includes(el.id));
      const groupId = nanoid();
      const groupedChildrenIds = selectedRoot.map((el) => el.id);
      const updatedElements = targetScreen.elements.map((el) =>
        ids.includes(el.id) ? { ...el, parentId: groupId } : el,
      );
      const rootWithoutSelected = root.filter((el) => !ids.includes(el.id));
      const newRoot: BaseElement[] = [];
      rootWithoutSelected.forEach((el, idx) => {
        if (idx === firstIndex) {
          newRoot.push({
            id: groupId,
            type: 'group',
            content: 'Group',
            props: { children: groupedChildrenIds, spacing: 12, align: 'start' },
            style: { width: 'auto' } as any,
          });
        }
        newRoot.push(el);
      });
      if (firstIndex >= rootWithoutSelected.length) {
        newRoot.push({
          id: groupId,
          type: 'group',
          content: 'Group',
          props: { children: groupedChildrenIds, spacing: 12, align: 'start' },
          style: { width: 'auto' } as any,
        });
      }
      const nonRoot = updatedElements.filter((el) => el.parentId);
      const updatedScreens = state.letter.screens.map((s) =>
        s.id === targetScreen.id ? { ...s, elements: [...newRoot, ...nonRoot] } : s,
      );
      return {
        letter: { ...state.letter, screens: updatedScreens },
        selectedElementId: groupId,
        selectedElementIds: [groupId],
        selectedScreenId: targetScreen.id,
      };
    }),

  ungroupElement: (id) =>
    set((state) => {
      const targetScreen = state.letter.screens.find((s) => s.elements.some((el) => el.id === id && el.type === 'group'));
      if (!targetScreen) return state;
      const groupEl = targetScreen.elements.find((el) => el.id === id);
      const childrenIds = ((groupEl?.props ?? {}) as { children?: string[] }).children ?? [];
      const root = targetScreen.elements.filter((el) => !el.parentId && el.id !== id);
      const nonRoot = targetScreen.elements.filter((el) => el.parentId);
      const childrenElements = targetScreen.elements
        .filter((el) => childrenIds.includes(el.id))
        .map((el) => ({ ...el, parentId: undefined }));
      const insertionIndex = root.findIndex((el) => el.id === id);
      const rootWithChildren: BaseElement[] = [];
      root.forEach((el, idx) => {
        if (idx === insertionIndex) {
          rootWithChildren.push(...childrenElements);
        }
        rootWithChildren.push(el);
      });
      if (insertionIndex === -1) rootWithChildren.push(...childrenElements);
      const updatedScreens = state.letter.screens.map((s) => {
        if (s.id !== targetScreen.id) return s;
        return {
          ...s,
          elements: [...rootWithChildren, ...nonRoot.filter((el) => !childrenIds.includes(el.id))],
        };
      });
      const nextSelected = state.selectedElementIds.filter((x) => x !== id);
      return {
        letter: { ...state.letter, screens: updatedScreens },
        selectedElementIds: nextSelected,
        selectedElementId: nextSelected[nextSelected.length - 1] ?? null,
      };
    }),

  addScreen: () =>
    set((state) => {
      const nextOrder = state.letter.screens.length + 1;
      const sourceScreen =
        state.letter.screens.find((screen) => screen.id === state.selectedScreenId) ??
        state.letter.screens.slice().sort((a, b) => a.order - b.order).at(-1);
      const inheritedStyle = sourceScreen?.style ? { ...sourceScreen.style } : { justifyContent: 'center' as const };
      const newScreen = {
        id: nanoid(),
        order: nextOrder,
        mode: sourceScreen?.mode ?? 'scroll',
        elements: [],
        style: inheritedStyle,
      };
      return {
        letter: { ...state.letter, screens: [...state.letter.screens, newScreen] },
        selectedScreenId: newScreen.id,
        selectedElementId: null,
      };
    }),

  duplicateScreen: (screenId) =>
    set((state) => {
      const screen = state.letter.screens.find((s) => s.id === screenId);
      if (!screen) return state;
      const clone = {
        ...screen,
        id: nanoid(),
        elements: screen.elements.map((el) => ({ ...el, id: nanoid() })),
        order: state.letter.screens.length + 1,
      };
      return {
        letter: { ...state.letter, screens: [...state.letter.screens, clone] },
        selectedScreenId: clone.id,
        selectedElementId: null,
      };
    }),

  removeScreen: (screenId) =>
    set((state) => {
      if (state.letter.screens.length <= 1) return state;
      const filtered = state.letter.screens.filter((s) => s.id !== screenId);
      const reOrdered = reorderScreens(filtered);
      const nextScreenId = reOrdered[0]?.id ?? state.selectedScreenId;
      return {
        letter: { ...state.letter, screens: reOrdered },
        selectedScreenId: nextScreenId ?? state.selectedScreenId,
        selectedElementId: null,
      };
    }),

  moveScreen: (screenId, direction) =>
    set((state) => {
      const screens = reorderScreens(state.letter.screens);
      const idx = screens.findIndex((s) => s.id === screenId);
      if (idx === -1) return state;
      const targetIdx = direction === 'up' ? Math.max(0, idx - 1) : Math.min(screens.length - 1, idx + 1);
      if (idx === targetIdx) return state;
      const [item] = screens.splice(idx, 1);
      screens.splice(targetIdx, 0, item);
      const reOrdered = screens.map((s, i) => ({ ...s, order: i + 1 }));
      return { letter: { ...state.letter, screens: reOrdered } };
    }),

  selectScreen: (screenId) => set({ selectedScreenId: screenId, selectedElementId: null, selectedElementIds: [] }),

  updateScreen: (screenId, patch) =>
    set((state) => ({
      letter: {
        ...state.letter,
        screens: state.letter.screens.map((s) => (s.id === screenId ? { ...s, ...patch } : s)),
      },
    })),

  selectElement: (id, options) =>
    set((state) => {
      const current = state.selectedElementIds;
      let nextIds: string[] = [];
      if (!id) {
        nextIds = [];
      } else if (options?.toggle) {
        nextIds = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      } else if (options?.append) {
        nextIds = current.includes(id) ? current : [...current, id];
      } else {
        nextIds = [id];
      }
      return { selectedElementId: nextIds[nextIds.length - 1] ?? null, selectedElementIds: nextIds };
    }),

  setSelectedElements: (ids) =>
    set({
      selectedElementIds: ids,
      selectedElementId: ids[ids.length - 1] ?? null,
    }),

  updateElementContent: (id, content) =>
    set((state) => ({
      letter: {
        ...state.letter,
        screens: state.letter.screens.map((screen) => ({
          ...screen,
          elements: screen.elements.map((el) => (el.id === id ? { ...el, content } : el)),
        })),
      },
    })),

  updateElementStyle: (id, style) =>
    set((state) => ({
      letter: {
        ...state.letter,
        screens: state.letter.screens.map((screen) => ({
          ...screen,
          elements: screen.elements.map((el) =>
            el.id === id ? { ...el, style: { ...el.style, ...style } } : el,
          ),
        })),
      },
    })),

  updateElementProps: (id, props) =>
    set((state) => ({
      letter: {
        ...state.letter,
        screens: state.letter.screens.map((screen) => ({
          ...screen,
          elements: screen.elements.map((el) =>
            el.id === id ? { ...el, props: { ...(el.props ?? {}), ...props } } : el,
          ),
        })),
      },
    })),

  setDeviceMode: (mode) =>
    set((state) => (state.deviceMode === mode ? state : { ...state, deviceMode: mode })),

  updateBrand: (brand) =>
    set((state) => {
      const activeId = state.brand.id ?? state.brandKits[0]?.id;
      const mergedActive = { ...state.brand, ...brand };
      let updatedKits =
        activeId
          ? state.brandKits.map((kit) => (kit.id === activeId ? { ...kit, ...brand, id: kit.id } : kit))
          : state.brandKits;
      const nextLogo = typeof brand.logoUrl === 'string' && brand.logoUrl.trim() ? brand.logoUrl : null;
      if (nextLogo) {
        updatedKits = updatedKits.map((kit) => {
          if (kit.id !== 'brand-post') return kit;
          if (kit.logoUrl && kit.logoUrl !== '/brand/post-logo.svg') return kit;
          return { ...kit, logoUrl: nextLogo };
        });
      }
      return {
        brand: mergedActive,
        brandKits: updatedKits,
      };
    }),

  addBrandKit: (kit) => {
    let newId = '';
    set((state) => {
      const id = nanoid();
      newId = id;
      const newKit: Brand = { ...kit, id };
      return {
        brandKits: [...state.brandKits, newKit],
        brand: newKit,
      };
    });
    return newId;
  },

  updateBrandKit: (id, patch) =>
    set((state) => {
      const updatedKits = state.brandKits.map((kit) => (kit.id === id ? { ...kit, ...patch, id } : kit));
      const active =
        state.brand.id === id ? { ...state.brand, ...patch, id } : state.brand;
      return { brandKits: updatedKits, brand: active };
    }),

  setActiveBrand: (id) =>
    set((state) => {
      const target = state.brandKits.find((kit) => kit.id === id);
      if (!target) return state;
      return { brand: target };
    }),

  addUpload: (item) =>
    set((state) => ({
      uploads: [...state.uploads, { ...item, id: nanoid() }],
    })),
}));
