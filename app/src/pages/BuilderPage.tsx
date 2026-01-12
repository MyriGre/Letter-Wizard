// AI-AGENT-HEADER
// path: /src/pages/BuilderPage.tsx
// summary: Wraps the existing builder UI and loads/saves drafts from localStorage by draftId.
// last-reviewed: 2025-12-17
// line-range: 1-240

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Canvas } from '../components/Canvas';
import { RightPanel } from '../components/RightPanel';
import { useEditorStore } from '../store/editorStore';
import { getDraft, updateDraftJson, updateDraftName } from '../eletters/storage';
import type { BaseElement, ElementType, Letter } from '../types/editor';

const questionTypes = new Set<ElementType>([
  'single-choice',
  'multiple-choice',
  'input',
  'file',
  'date',
  'date-input',
  'rating',
  'ranking',
]);

const conditionalTypes = new Set<ElementType>(['single-choice', 'multiple-choice', 'rating', 'ranking']);

const questionTypeLabels: Record<ElementType, string> = {
  'single-choice': 'Single choice',
  'multiple-choice': 'Multiple choice',
  input: 'Text input',
  file: 'File upload',
  date: 'Date input',
  'date-input': 'Date input',
  rating: 'Rating',
  ranking: 'Ranking',
  header: 'Header',
  subheader: 'Subheader',
  paragraph: 'Paragraph',
  image: 'Image',
  video: 'Video',
  button: 'Button',
  group: 'Group',
};

type FlowItem = {
  id: string;
  screenLabel: string;
  badge: string;
  title: string;
  options: string[];
  isQuestion: boolean;
  questionOrder: number | null;
  questionType?: ElementType;
  scaleMax?: number;
};

type LogicConfig = {
  visibility: 'always' | 'conditional';
  sourceId: string | null;
  values: string[];
};

const extractOptionLabels = (element: BaseElement) => {
  const props = (element.props ?? {}) as Record<string, unknown>;
  const optionsRaw = Array.isArray(props.options) ? props.options : [];
  return optionsRaw
    .map((opt) => (typeof opt === 'string' ? opt : (opt as { label?: string }).label ?? ''))
    .filter(Boolean);
};

const buildQuestionPreview = (element: BaseElement) => {
  const title = element.content ?? 'Untitled question';
  const typeLabel = questionTypeLabels[element.type as ElementType] ?? 'Question';
  const props = (element.props ?? {}) as Record<string, unknown>;
  if (element.type === 'rating') {
    const max = Math.max(1, Math.min(10, Number(props.max ?? 5)));
    const minLabel = typeof props.minLabel === 'string' ? props.minLabel : '';
    const maxLabel = typeof props.maxLabel === 'string' ? props.maxLabel : '';
    const labelLine = minLabel || maxLabel ? `${minLabel || 'Low'} → ${maxLabel || 'High'}` : `Scale 1–${max}`;
    return { title, typeLabel, options: [labelLine], type: element.type, scaleMax: max };
  }
  if (element.type === 'input') return { title, typeLabel, options: ['Short text'], type: element.type };
  if (element.type === 'file') return { title, typeLabel, options: ['Upload file'], type: element.type };
  if (element.type === 'date' || element.type === 'date-input') return { title, typeLabel, options: ['Pick a date'], type: element.type };
  if (element.type === 'single-choice' || element.type === 'multiple-choice' || element.type === 'ranking') {
    const options = extractOptionLabels(element);
    return { title, typeLabel, options: options.slice(0, 3), type: element.type };
  }
  return { title, typeLabel, options: [] as string[], type: element.type };
};
export function BuilderPage({ draftId }: { draftId: string | null }) {
  const brand = useEditorStore((state) => state.brand);
  const setLetter = useEditorStore((state) => state.setLetter);
  const setActiveDraftId = useEditorStore((state) => state.setActiveDraftId);
  const updateLetterTitle = useEditorStore((state) => state.updateLetterTitle);
  const letter = useEditorStore((state) => state.letter);

  const loadedDraft = useMemo(() => (draftId ? getDraft(draftId) : null), [draftId]);
  const lastSavedRef = useRef<Letter | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const [draftName, setDraftName] = useState<string>('No title');
  const [viewMode, setViewMode] = useState<'content' | 'logic'>('content');
  const [selectedFlowIndex, setSelectedFlowIndex] = useState<number | null>(null);
  const [logicVisibility, setLogicVisibility] = useState<'always' | 'conditional'>('always');
  const [conditionSourceId, setConditionSourceId] = useState<string | null>(null);
  const [conditionValueIds, setConditionValueIds] = useState<string[]>([]);
  const [logicByFlowId, setLogicByFlowId] = useState<Record<string, LogicConfig>>({});

  useEffect(() => {
    if (brand?.primaryColor) document.documentElement.style.setProperty('--brand-primary', brand.primaryColor);
    if (brand?.secondaryColor) document.documentElement.style.setProperty('--brand-secondary', brand.secondaryColor);
    if (brand?.fontFamily) document.documentElement.style.setProperty('--brand-font', brand.fontFamily);
    if (brand?.fontHeader) document.documentElement.style.setProperty('--brand-font-header', brand.fontHeader);
    if (brand?.fontParagraph) document.documentElement.style.setProperty('--brand-font-paragraph', brand.fontParagraph);
  }, [brand]);

  useEffect(() => {
    setActiveDraftId(draftId);
    if (loadedDraft?.json) {
      setLetter(loadedDraft.json);
      lastSavedRef.current = loadedDraft.json;
    }
    setDraftName(loadedDraft?.name ?? 'No title');
  }, [draftId, loadedDraft?.json, setActiveDraftId, setLetter]);

  const orderedScreens = useMemo(() => [...letter.screens].sort((a, b) => a.order - b.order), [letter.screens]);
  const logicSummary = useMemo(() => {
    const details = orderedScreens.map((screen, idx) => {
      const rootElements = (screen.elements ?? []).filter((el) => !el.parentId);
      const questions = rootElements.filter((el) => questionTypes.has(el.type as ElementType));
      return {
        screen,
        index: idx,
        questionCount: questions.length,
        question: questions[0] ?? null,
      };
    });
    const hasQuestions = details.some((d) => d.questionCount > 0);
    const hasMultiple = details.some((d) => d.questionCount > 1);
    return {
      details,
      hasQuestions,
      hasMultiple,
      eligible: hasQuestions && !hasMultiple,
    };
  }, [orderedScreens]);
  const logicDisabledReason = !logicSummary.hasQuestions
    ? 'Add at least one question to enable logic.'
    : logicSummary.hasMultiple
      ? 'Use one question per screen to enable logic.'
      : undefined;
  const logicAccent = '#0f172a';
  const flowItems = useMemo<FlowItem[]>(() => {
    let questionCounter = 0;
    return logicSummary.details.flatMap((detail) => {
      const rootElements = (detail.screen.elements ?? []).filter((el) => !el.parentId);
      const questions = rootElements.filter((el) => questionTypes.has(el.type as ElementType));
      const firstText =
        rootElements.find((el) => ['header', 'subheader', 'paragraph'].includes(el.type))?.content ??
        'Informative screen';
      if (questions.length === 0) {
        return [
          {
            id: `${detail.screen.id}-info`,
            screenLabel: `Screen ${detail.index + 1}`,
            badge: 'Informative',
            title: firstText,
            options: [] as string[],
            isQuestion: false,
            questionOrder: null as number | null,
          },
        ];
      }
      return questions.map((question, qIndex) => {
        const preview = buildQuestionPreview(question);
        const suffix = questions.length > 1 ? ` · Q${qIndex + 1}` : '';
        questionCounter += 1;
        return {
          id: `${detail.screen.id}-${question.id}`,
          screenLabel: `Screen ${detail.index + 1}${suffix}`,
          badge: preview.typeLabel,
          title: preview.title,
          options: preview.options,
          isQuestion: true,
          questionOrder: questionCounter,
          questionType: preview.type,
          scaleMax: preview.scaleMax,
        };
      });
    });
  }, [logicSummary.details]);
  const flowItemById = useMemo<Record<string, FlowItem>>(() => {
    return flowItems.reduce<Record<string, FlowItem>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [flowItems]);
  const flowCount = flowItems.length;
  const flowSelectedIndex =
    selectedFlowIndex === null ? null : Math.min(Math.max(selectedFlowIndex, 0), flowCount - 1);
  const flowSelected = flowSelectedIndex !== null ? flowItems[flowSelectedIndex] : null;

  useEffect(() => {
    if (viewMode !== 'logic') return;
    if (flowCount === 0) {
      setSelectedFlowIndex(null);
      return;
    }
    setSelectedFlowIndex((prev) => (prev === null ? 0 : Math.min(prev, flowCount - 1)));
  }, [flowCount, viewMode]);

  useEffect(() => {
    if (viewMode !== 'logic') return;
    if (!flowSelected) return;
    const saved = logicByFlowId[flowSelected.id];
    if (saved) {
      setLogicVisibility(saved.visibility);
      setConditionSourceId(saved.sourceId);
      setConditionValueIds(saved.values);
      return;
    }
    setLogicVisibility('always');
    setConditionSourceId(null);
    setConditionValueIds([]);
  }, [flowSelected?.id, viewMode]);

  const conditionCandidates = useMemo(() => {
    if (flowSelectedIndex === null) return [];
    return flowItems
      .slice(0, flowSelectedIndex)
      .filter((item) => item.isQuestion && conditionalTypes.has(item.questionType as ElementType));
  }, [flowItems, flowSelectedIndex]);
  const selectedCondition = useMemo(() => {
    if (!conditionCandidates.length) return null;
    return conditionCandidates.find((c) => c.id === conditionSourceId) ?? conditionCandidates[conditionCandidates.length - 1];
  }, [conditionCandidates, conditionSourceId]);

  useEffect(() => {
    if (viewMode !== 'logic') return;
    if (!conditionCandidates.length) {
      if (conditionSourceId !== null) {
        setConditionSourceId(null);
        setConditionValueIds([]);
      }
      return;
    }
    const isValid = conditionSourceId && conditionCandidates.some((c) => c.id === conditionSourceId);
    const fallbackId = conditionCandidates[conditionCandidates.length - 1].id;
    const desiredId = isValid ? conditionSourceId : fallbackId;
    if (desiredId !== conditionSourceId) {
      setConditionSourceId(desiredId);
      setConditionValueIds([]);
    }
  }, [conditionCandidates, conditionSourceId, viewMode]);

  useEffect(() => {
    if (viewMode !== 'logic') return;
    if (!flowSelected) return;
    setLogicByFlowId((prev) => ({
      ...prev,
      [flowSelected.id]: {
        visibility: logicVisibility,
        sourceId: conditionSourceId,
        values: conditionValueIds,
      },
    }));
  }, [conditionValueIds, conditionSourceId, flowSelected?.id, logicVisibility, viewMode]);

  useEffect(() => {
    if (!draftId) return;
    if (!letter) return;

    // Debounced persistence of the current draft while editing.
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      lastSavedRef.current = letter;
      updateDraftJson(draftId, letter);
    }, 350);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [draftId, letter]);

  if (draftId && !loadedDraft) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Draft not found</div>
          <div className="mt-1 text-sm text-slate-600">
            This eLetter draft no longer exists in local storage.
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Draft id: <span className="font-mono">{draftId}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-[700px] flex-col bg-slate-50">
      <TopBar
        showBackToDashboard
        draftName={draftName}
        draftStatus={loadedDraft?.status}
        viewMode={viewMode}
        logicEnabled={logicSummary.eligible}
        logicDisabledReason={logicDisabledReason}
        onViewModeChange={(mode) => {
          if (mode === 'logic' && !logicSummary.eligible) return;
          setViewMode(mode);
        }}
        onDraftNameCommit={(name) => {
          setDraftName(name);
          updateLetterTitle(name);
          if (draftId) updateDraftName(draftId, name);
        }}
      />
      <div className="flex flex-1 overflow-hidden">
        {viewMode === 'content' ? (
          <>
            <Sidebar />
            <Canvas />
            <RightPanel />
          </>
        ) : (
          <>
            <main className="flex-1 overflow-y-auto bg-slate-50 h-[calc(100vh-56px)]">
              <div className="mx-auto w-full max-w-6xl px-6 py-6 space-y-4">
                <div className="space-y-4">
                  {flowItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      Add a question to start building logic.
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      {flowItems.map((item, idx) => {
                        const condition = logicByFlowId[item.id];
                        const conditionSummary =
                          condition &&
                          condition.visibility === 'conditional' &&
                          condition.sourceId &&
                          condition.values.length
                            ? (() => {
                                const source = flowItemById[condition.sourceId];
                                if (!source) return null;
                                const sourceLabel = source.questionOrder ?? source.screenLabel;
                                return `Condition: Screen ${sourceLabel} is ${condition.values.join(', ')}`;
                              })()
                            : null;
                        return (
                          <Fragment key={item.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedFlowIndex(idx)}
                              className={`w-full max-w-3xl rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                                flowSelectedIndex === idx
                                  ? 'border-slate-900 shadow-md'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                <span>{item.screenLabel}</span>
                                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                                  {item.badge}
                                </span>
                              </div>
                              <div className="mt-3 text-base font-semibold text-slate-900">{item.title}</div>
                              {item.options?.length ? (
                                <div className="mt-2 space-y-1 text-sm text-slate-500">
                                  {item.options.map((opt) => (
                                    <div key={opt} className="truncate">
                                      • {opt}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                              {conditionSummary ? (
                                <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {conditionSummary}
                                </div>
                              ) : null}
                            </button>
                            {idx < flowItems.length - 1 && (
                              <div className="flex flex-col items-center py-3 text-slate-300">
                                <span className="h-6 w-px bg-slate-300" />
                                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-base text-slate-500">
                                  ↓
                                </span>
                                <span className="h-6 w-px bg-slate-300" />
                              </div>
                            )}
                          </Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </main>
            <aside className="sticky top-[56px] h-[calc(100vh-56px)] w-[320px] shrink-0 border-l border-slate-200 bg-white">
              <div className="p-4">
                {flowCount === 0 ? (
                  <div className="text-sm text-slate-500">Add a question to start building logic.</div>
                ) : flowSelectedIndex === 0 ? (
                  <div className="text-lg font-semibold text-slate-900">No logic possible - start screen.</div>
                ) : flowSelectedIndex === flowCount - 1 ? (
                  <div className="text-lg font-semibold text-slate-900">No logic possible - end screen.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {flowSelected?.isQuestion
                        ? `Logic for Question ${flowSelected.questionOrder ?? ''}`
                        : `Logic for ${flowSelected?.screenLabel ?? 'Screen'}`}
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="text-base font-semibold text-slate-900">Show this screen</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setLogicVisibility('always')}
                          className="rounded-full border px-4 py-2 text-sm font-semibold transition"
                          style={
                            logicVisibility === 'always'
                              ? {
                                backgroundColor: logicAccent,
                                borderColor: logicAccent,
                                  color: '#ffffff',
                                }
                              : { borderColor: logicAccent, color: logicAccent }
                          }
                        >
                          Always
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogicVisibility('conditional')}
                          className="rounded-full border px-4 py-2 text-sm font-semibold transition"
                          style={
                            logicVisibility === 'conditional'
                              ? {
                                backgroundColor: logicAccent,
                                borderColor: logicAccent,
                                  color: '#ffffff',
                                }
                              : { borderColor: logicAccent, color: logicAccent }
                          }
                        >
                          Just if (conditioned)
                        </button>
                      </div>
                    </div>
                    {logicVisibility === 'conditional' && (
                      <div className="space-y-3 pt-2">
                        <div className="text-base font-semibold text-slate-900">Screen</div>
                        {conditionCandidates.length === 0 ? (
                          <div className="text-sm text-slate-500">
                            No previous choice or rating questions available.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {conditionCandidates.map((candidate) => (
                              <button
                                key={candidate.id}
                                type="button"
                                onClick={() => {
                                  setConditionSourceId(candidate.id);
                                  setConditionValueIds([]);
                                }}
                                className="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition"
                                style={
                                  selectedCondition?.id === candidate.id
                                    ? {
                                        backgroundColor: logicAccent,
                                        borderColor: logicAccent,
                                        color: '#ffffff',
                                      }
                                    : {
                                        borderColor: logicAccent,
                                        color: logicAccent,
                                      }
                                }
                              >
                                {candidate.questionOrder ?? ''}
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedCondition && (
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-slate-900">is</div>
                            {selectedCondition.questionType === 'rating' ? (
                              <div className="flex flex-wrap gap-2">
                                {Array.from({ length: Math.max(1, selectedCondition.scaleMax ?? 5) }).map((_, idx) => {
                                  const valueId = String(idx + 1);
                                  const selected = conditionValueIds.includes(valueId);
                                  return (
                                    <button
                                      key={valueId}
                                      type="button"
                                      onClick={() => {
                                        setConditionValueIds((prev) =>
                                          selected ? prev.filter((id) => id !== valueId) : [...prev, valueId],
                                        );
                                      }}
                                      className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition"
                                      style={
                                        selected
                                          ? { backgroundColor: logicAccent, borderColor: logicAccent, color: '#fff' }
                                          : { borderColor: logicAccent, color: logicAccent }
                                      }
                                    >
                                      {valueId}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : selectedCondition.options?.length ? (
                              <div className="space-y-2">
                                {selectedCondition.options.map((opt) => {
                                  const selected = conditionValueIds.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => {
                                        setConditionValueIds((prev) =>
                                          selected ? prev.filter((id) => id !== opt) : [...prev, opt],
                                        );
                                      }}
                                      className="w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition"
                                      style={
                                        selected
                                          ? { borderColor: logicAccent, backgroundColor: logicAccent, color: '#fff' }
                                          : { borderColor: '#e2e8f0', color: '#0f172a', backgroundColor: '#fff' }
                                      }
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500">
                                Condition options will appear here.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
