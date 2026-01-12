// AI-AGENT-HEADER
// path: /src/eletters/ai.ts
// summary: Stub AI generator that converts a prompt into a Letter JSON compatible with the builder.
// last-reviewed: 2025-12-17
// line-range: 1-160

import { nanoid } from 'nanoid';
import type { Letter } from '../types/editor';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleFromPrompt(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'No title';
  const first = cleaned.split(/[.!?\n]/)[0] ?? cleaned;
  return first.slice(0, 42);
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function insertBeforeButton(letter: Letter, element: any) {
  const screen = letter.screens.slice().sort((a, b) => a.order - b.order)[0];
  if (!screen) return;
  const idx = screen.elements.findIndex((el) => el.type === 'button');
  if (idx === -1) screen.elements.push(element);
  else screen.elements.splice(idx, 0, element);
}

function applyHeuristicEdit(current: Letter, instruction: string): Letter | null {
  const lower = instruction.trim().toLowerCase();
  if (!lower) return null;
  const splitMatch =
    /\bone\s+question\s+per\s+screen\b/.test(lower) ||
    /\bevery\s+question\s+on\s+(?:a|one)\s+separate\s+screen\b/.test(lower) ||
    /\beach\s+question\s+on\s+(?:a|one)\s+separate\s+screen\b/.test(lower) ||
    /\bseparate\s+screen\s+for\s+each\s+question\b/.test(lower);
  if (splitMatch) {
    const next = deepClone(current);
    const screensSorted = next.screens.slice().sort((a, b) => a.order - b.order);
    const first = screensSorted[0];
    if (!first) return null;
    const questionTypes = new Set(['single-choice', 'multiple-choice', 'input', 'file', 'date', 'date-input', 'rating', 'ranking']);
    const allQuestions = screensSorted.flatMap((s) => (s.elements ?? []).filter((el) => questionTypes.has(el.type as any)));
    if (allQuestions.length <= 1) return null;
    const firstQuestionIdx = (first.elements ?? []).findIndex((el) => questionTypes.has(el.type as any));
    const intro = firstQuestionIdx > 0 ? (first.elements ?? []).slice(0, firstQuestionIdx).filter((el) => el.type !== 'button') : [];
    const baseStyle = first.style ? { ...first.style } : { background: '#ffffff', elementSpacing: 12 };
    next.screens = allQuestions.map((q, idx) => ({
      id: `screen-${nanoid()}`,
      order: idx + 1,
      mode: 'single-screen',
      style: baseStyle,
      elements: idx === 0 ? [...intro, q] : [q],
    }));
    return next;
  }
  const addMatch =
    lower.match(/\badd\s+(?:a\s+)?question\b(?:\s+about|\s+for|\s+on)?\s*(.+)$/) ||
    lower.match(/\binclude\s+(?:a\s+)?question\b(?:\s+about|\s+for|\s+on)?\s*(.+)$/);
  if (!addMatch) return null;
  const next = deepClone(current);
  const topic = (addMatch[1] ?? '').trim().replace(/[.?!]$/g, '');
  const subject = topic || 'your experience';
  const isFavorite = /\bfavou?rite\b/.test(lower);
  if (isFavorite) {
    insertBeforeButton(next, {
      id: nanoid(),
      type: 'input',
      content: `What is your favourite ${subject.replace(/\bfavou?rite\b/i, '').trim() || 'wine'}?`,
      props: { required: false, maxLength: 120, showPrompt: true },
    });
    return next;
  }
  insertBeforeButton(next, {
    id: nanoid(),
    type: 'input',
    content: `Any feedback about ${subject}?`,
    props: { required: false, maxLength: 200, showPrompt: true },
  });
  return next;
}

export async function generateEletterFromPrompt(prompt: string, currentDraft?: Letter | null): Promise<Letter> {
  await sleep(900);
  const p = prompt.trim();
  if (currentDraft) {
    const edited = applyHeuristicEdit(currentDraft, p);
    if (edited) return edited;
  }
  const looksLikeEmployeeSurvey =
    /employee|employees|team|pulse|wellbeing|culture|engagement/i.test(p);
  const looksLikeFeedbackSurvey =
    /survey|questionnaire|feedback|review|rate|rating|satisfied|satisfaction|recommend|nps|customer|client|liked|like it|how did.*feel|how do.*feel|want to know/i.test(
      p,
    );

  const extractQuotedThing = (text: string) => {
    const match = text.match(/"([^"]{2,80})"/) || text.match(/'([^']{2,80})'/);
    return match?.[1]?.trim() || null;
  };

  if (looksLikeEmployeeSurvey) {
    return {
      id: `letter-${nanoid()}`,
      title: 'Employee Pulse Survey',
      language: 'en',
      screens: [
        {
          id: `screen-${nanoid()}`,
          order: 1,
          mode: 'scroll',
          style: { background: '#ffffff', elementSpacing: 12 },
          navDoneLabel: 'Done',
          elements: [
            { id: nanoid(), type: 'header', content: 'Employee Pulse Survey', style: { fontSize: 26, align: 'left' } },
            {
              id: nanoid(),
              type: 'rating',
              content: 'How satisfied are you with your work overall?',
              props: { max: 5, showPrompt: true, scaleType: 'stars', required: true, minLabel: 'Low', maxLabel: 'High' },
            },
            {
              id: nanoid(),
              type: 'single-choice',
              content: 'How would you describe your current workload?',
              props: {
                options: [{ label: 'Too low' }, { label: 'About right' }, { label: 'Slightly high' }, { label: 'Too high' }],
                optionFormat: 'text',
                showPrompt: true,
              },
            },
            {
              id: nanoid(),
              type: 'multiple-choice',
              content: 'Which areas would most improve your experience?',
              props: {
                options: [
                  { label: 'Communication & transparency' },
                  { label: 'Work-life balance' },
                  { label: 'Tools & processes' },
                  { label: 'Career growth' },
                  { label: 'Recognition & feedback' },
                ],
                optionFormat: 'text',
                showPrompt: true,
              },
            },
            {
              id: nanoid(),
              type: 'ranking',
              content: 'Rank what matters most to you (top = most important)',
              props: {
                options: [
                  { label: 'Flexible working hours' },
                  { label: 'Compensation & benefits' },
                  { label: 'Manager support' },
                  { label: 'Learning opportunities' },
                  { label: 'Team culture' },
                ],
                optionFormat: 'text',
                showPrompt: true,
              },
            },
            { id: nanoid(), type: 'input', content: 'What is one thing we should improve next?', props: { maxLength: 240, showPrompt: true } },
            { id: nanoid(), type: 'button', content: 'Submit', style: { width: 260, height: 56, align: 'center' } },
          ],
        },
      ],
    };
  }

  if (looksLikeFeedbackSurvey) {
    const thing = extractQuotedThing(p) || 'your product';
    return {
      id: `letter-${nanoid()}`,
      title: 'Customer Feedback Survey',
      language: 'en',
      screens: [
        {
          id: `screen-${nanoid()}`,
          order: 1,
          mode: 'scroll',
          style: { background: '#ffffff', elementSpacing: 12 },
          navDoneLabel: 'Done',
          elements: [
            { id: nanoid(), type: 'header', content: 'Customer Feedback', style: { fontSize: 26, align: 'left' } },
            {
              id: nanoid(),
              type: 'rating',
              content: `Overall, how satisfied were you with ${thing}?`,
              props: { max: 5, showPrompt: true, scaleType: 'stars', required: true, minLabel: 'Low', maxLabel: 'High' },
            },
            {
              id: nanoid(),
              type: 'single-choice',
              content: 'How would you describe the quality?',
              props: {
                options: [
                  { label: 'Excellent' },
                  { label: 'Good' },
                  { label: 'Okay' },
                  { label: 'Not good' },
                ],
                optionFormat: 'text',
                showPrompt: true,
              },
            },
            {
              id: nanoid(),
              type: 'multiple-choice',
              content: 'What did you like? (Select all that apply)',
              props: {
                options: [
                  { label: 'Taste / flavor' },
                  { label: 'Packaging' },
                  { label: 'Value for money' },
                  { label: 'Delivery / availability' },
                  { label: 'Brand experience' },
                ],
                optionFormat: 'text',
                showPrompt: true,
              },
            },
            {
              id: nanoid(),
              type: 'rating',
              content: 'How likely are you to recommend it to a friend?',
              props: { max: 10, showPrompt: true, scaleType: 'numbers', minLabel: 'Not likely', maxLabel: 'Very likely' },
            },
            { id: nanoid(), type: 'input', content: 'Any additional comments?', props: { maxLength: 240, showPrompt: true } },
            { id: nanoid(), type: 'button', content: 'Continue', style: { width: 260, height: 56, align: 'center' } },
          ],
        },
      ],
    };
  }

  const title = titleFromPrompt(p);

  return {
    id: `letter-${nanoid()}`,
    title,
    language: 'en',
    screens: [
      {
        id: `screen-${nanoid()}`,
        order: 1,
        mode: 'scroll',
        style: { background: '#ffffff', elementSpacing: 12 },
        elements: [
          { id: nanoid(), type: 'header', content: title, style: { fontSize: 26, align: 'left' } },
          { id: nanoid(), type: 'image', content: '', style: { height: 240 } },
          { id: nanoid(), type: 'button', content: 'Continue', style: { width: 260, height: 56, align: 'center' } },
        ],
      },
    ],
  };
}
