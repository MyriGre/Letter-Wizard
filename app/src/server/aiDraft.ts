// AI-AGENT-HEADER
// path: /src/server/aiDraft.ts
// summary: Server-side AI draft generator that outputs builder-compatible Letter JSON.
// last-reviewed: 2025-12-17
// line-range: 1-260

import { nanoid } from 'nanoid';
import type { Letter } from '../types/editor';

const allowedElementTypes = new Set([
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
] as const);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeTitleFromPrompt(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'No title';
  const first = cleaned.split(/[.!?\n]/)[0] ?? cleaned;
  return first.slice(0, 64);
}

function createBaseLetter(title: string): Letter {
  return {
    id: `letter-${nanoid()}`,
    title: title || 'No title',
    language: 'en',
    screens: [
      {
        id: `screen-${nanoid()}`,
        order: 1,
        mode: 'scroll',
        style: { background: '#ffffff', elementSpacing: 12 },
        elements: [],
        navDoneLabel: 'Done',
      },
    ],
  };
}

function generateEmployeePulseSurvey(prompt: string): Letter {
  const letter = createBaseLetter('Employee Pulse Survey');
  const screen = letter.screens[0]!;

  screen.elements.push(
    { id: nanoid(), type: 'header', content: 'Employee Pulse Survey', style: { fontSize: 26, align: 'left' } },
    {
      id: nanoid(),
      type: 'rating',
      content: 'How satisfied are you with your work overall?',
      props: {
        max: 5,
        showPrompt: true,
        scaleType: 'stars',
        required: true,
        minLabel: 'Low',
        maxLabel: 'High',
      },
    },
    {
      id: nanoid(),
      type: 'single-choice',
      content: 'How would you describe your current workload?',
      props: {
        options: [{ label: 'Too low' }, { label: 'About right' }, { label: 'Slightly high' }, { label: 'Too high' }],
        optionFormat: 'text',
        showPrompt: true,
        required: true,
      },
    } as any,
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
        required: false,
        multiSelection: true,
      },
    } as any,
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
        required: false,
        randomize: false,
      },
    } as any,
    {
      id: nanoid(),
      type: 'input',
      content: 'What is one thing we should improve next?',
      props: { required: false, maxLength: 240, showPrompt: true },
    } as any,
    { id: nanoid(), type: 'button', content: 'Submit', style: { width: 260, height: 56, align: 'center' } },
  );

  return letter;
}

function extractQuotedThing(prompt: string): string | null {
  const match = prompt.match(/"([^"]{2,80})"/) || prompt.match(/'([^']{2,80})'/);
  return match?.[1]?.trim() || null;
}

function generateCustomerFeedbackSurvey(prompt: string): Letter {
  const thing = extractQuotedThing(prompt) || 'your product';
  const letter = createBaseLetter('Customer Feedback Survey');
  const screen = letter.screens[0]!;

  screen.elements.push(
    { id: nanoid(), type: 'header', content: 'Customer Feedback', style: { fontSize: 26, align: 'left' } },
    {
      id: nanoid(),
      type: 'rating',
      content: `Overall, how satisfied were you with ${thing}?`,
      props: {
        max: 5,
        showPrompt: true,
        scaleType: 'stars',
        required: true,
        minLabel: 'Low',
        maxLabel: 'High',
      },
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
        required: true,
      },
    } as any,
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
        required: false,
        multiSelection: true,
      },
    } as any,
    {
      id: nanoid(),
      type: 'rating',
      content: 'How likely are you to recommend it to a friend?',
      props: {
        max: 10,
        showPrompt: true,
        scaleType: 'numbers',
        required: false,
        minLabel: 'Not likely',
        maxLabel: 'Very likely',
      },
    },
    {
      id: nanoid(),
      type: 'input',
      content: 'Any additional comments?',
      props: { required: false, maxLength: 240, showPrompt: true },
    } as any,
    { id: nanoid(), type: 'button', content: 'Continue', style: { width: 260, height: 56, align: 'center' } },
  );

  return letter;
}

function generateGenericDraft(prompt: string): Letter {
  const title = safeTitleFromPrompt(prompt);
  const letter = createBaseLetter(title);
  const screen = letter.screens[0]!;
  screen.elements.push(
    { id: nanoid(), type: 'header', content: title, style: { fontSize: 26, align: 'left' } },
    {
      id: nanoid(),
      type: 'single-choice',
      content: 'How do you feel about this message?',
      props: { options: [{ label: 'Great' }, { label: 'Okay' }, { label: 'Not sure' }], optionFormat: 'text', showPrompt: true },
    } as any,
    { id: nanoid(), type: 'button', content: 'Continue', style: { width: 260, height: 56, align: 'center' } },
  );
  return letter;
}

function sanitizeLetter(input: unknown): Letter {
  const fallback = createBaseLetter('No title');
  if (!isObject(input)) return fallback;

  const maybeScreens = Array.isArray((input as any).screens) ? ((input as any).screens as any[]) : [];
  const title = typeof (input as any).title === 'string' ? (input as any).title : fallback.title;
  const id = typeof (input as any).id === 'string' ? (input as any).id : fallback.id;
  const language = typeof (input as any).language === 'string' ? (input as any).language : 'en';

  const screens: Letter['screens'] =
    maybeScreens.length > 0
      ? maybeScreens
          .map((s, idx) => {
            const sObj = isObject(s) ? s : {};
            const elementsRaw = Array.isArray((sObj as any).elements) ? ((sObj as any).elements as any[]) : [];
            const elements = elementsRaw
              .map((el) => {
                if (!isObject(el)) return null;
                const type = (el as any).type;
                if (typeof type !== 'string' || !allowedElementTypes.has(type as any)) return null;
                return {
                  id: typeof (el as any).id === 'string' ? (el as any).id : nanoid(),
                  type,
                  content: typeof (el as any).content === 'string' ? (el as any).content : undefined,
                  props: isObject((el as any).props) ? (el as any).props : undefined,
                  style: isObject((el as any).style) ? (el as any).style : undefined,
                  parentId: typeof (el as any).parentId === 'string' ? (el as any).parentId : undefined,
                } as any;
              })
              .filter(Boolean) as any[];

            return {
              id: typeof (sObj as any).id === 'string' ? (sObj as any).id : `screen-${nanoid()}`,
              order: typeof (sObj as any).order === 'number' ? (sObj as any).order : idx + 1,
              mode: ((sObj as any).mode === 'single-screen' ? 'single-screen' : 'scroll') as 'scroll' | 'single-screen',
              elements,
              style: isObject((sObj as any).style) ? (sObj as any).style : undefined,
              navDoneLabel: typeof (sObj as any).navDoneLabel === 'string' ? (sObj as any).navDoneLabel : 'Done',
            };
          })
          .sort((a, b) => a.order - b.order)
      : fallback.screens;

  return {
    id,
    title: title || 'No title',
    language,
    screens,
  };
}

const questionTypes = new Set([
  'single-choice',
  'multiple-choice',
  'input',
  'file',
  'date',
  'date-input',
  'rating',
  'ranking',
] as const);

function isQuestionElementType(type: unknown): boolean {
  return typeof type === 'string' && questionTypes.has(type as any);
}

function insertBeforePrimaryButton(letter: Letter, element: any) {
  const screen = letter.screens.slice().sort((a, b) => a.order - b.order)[0];
  if (!screen) return;
  const idx = screen.elements.findIndex((el) => el.type === 'button');
  if (idx === -1) screen.elements.push(element);
  else screen.elements.splice(idx, 0, element);
}

function summarizeQuestions(letter: Letter): { id: string; type: string; content: string }[] {
  const screen = letter.screens.slice().sort((a, b) => a.order - b.order)[0];
  if (!screen) return [];
  return screen.elements
    .filter((el) => questionTypes.has(el.type as any))
    .map((el) => ({ id: el.id, type: el.type, content: (el.content ?? '').toString() }));
}

function splitQuestionsIntoScreens(letter: Letter): { next: Letter; didChange: boolean } {
  const next: Letter = JSON.parse(JSON.stringify(letter)) as Letter;
  const screensSorted = next.screens.slice().sort((a, b) => a.order - b.order);
  if (screensSorted.length === 0) return { next, didChange: false };

  const questionElements: any[] = [];
  for (const s of screensSorted) {
    for (const el of s.elements ?? []) {
      if (isQuestionElementType(el?.type)) questionElements.push(el);
    }
  }
  if (questionElements.length <= 1) return { next, didChange: false };

  const first = screensSorted[0]!;
  const firstQuestionIdx = (first.elements ?? []).findIndex((el) => isQuestionElementType(el?.type));
  const intro =
    firstQuestionIdx > 0
      ? (first.elements ?? []).slice(0, firstQuestionIdx).filter((el) => el?.type !== 'button')
      : [];

  // Keep any non-question elements after the last question (except button) on the last screen.
  const flatAll = screensSorted.flatMap((s) => s.elements ?? []);
  let lastQuestionPos = -1;
  flatAll.forEach((el, i) => {
    if (isQuestionElementType(el?.type)) lastQuestionPos = i;
  });
  const trailing =
    lastQuestionPos >= 0
      ? flatAll.slice(lastQuestionPos + 1).filter((el) => el?.type && el.type !== 'button' && !isQuestionElementType(el.type))
      : [];

  const baseStyle = first.style ? { ...first.style } : { background: '#ffffff', elementSpacing: 12 };
  const newScreens = questionElements.map((q, idx) => {
    const elements = idx === 0 ? [...intro, q] : [q];
    if (idx === questionElements.length - 1 && trailing.length > 0) elements.push(...trailing);
    return {
      id: `screen-${nanoid()}`,
      order: idx + 1,
      mode: 'single-screen' as const,
      style: baseStyle,
      elements,
      navNextLabel: idx === 0 ? 'Next' : undefined,
      navBackLabel: idx > 0 ? 'Back' : undefined,
      navDoneLabel: idx === questionElements.length - 1 ? 'Done' : undefined,
      navCloseLabel: idx === 0 ? 'Close' : undefined,
    };
  });

  next.screens = newScreens;
  return { next, didChange: true };
}

function applyEditInstruction(letter: Letter, instruction: string): { next: Letter; didChange: boolean } {
  const text = instruction.trim();
  if (!text) return { next: letter, didChange: false };

  const lower = text.toLowerCase();
  const next: Letter = JSON.parse(JSON.stringify(letter)) as Letter;

  const splitMatch =
    /\bone\s+question\s+per\s+screen\b/.test(lower) ||
    /\bevery\s+question\s+on\s+(?:a|one)\s+separate\s+screen\b/.test(lower) ||
    /\beach\s+question\s+on\s+(?:a|one)\s+separate\s+screen\b/.test(lower) ||
    /\bseparate\s+screen\s+for\s+each\s+question\b/.test(lower);
  if (splitMatch) {
    return splitQuestionsIntoScreens(next);
  }

  const questions = summarizeQuestions(next);
  const removeMatch =
    lower.match(/\bremove\s+(?:question\s*)?#?(\d+)\b/) ||
    lower.match(/\bdelete\s+(?:question\s*)?#?(\d+)\b/);
  if (removeMatch) {
    const idx = Number(removeMatch[1]) - 1;
    if (!Number.isNaN(idx) && idx >= 0 && idx < questions.length) {
      const toRemove = questions[idx]!.id;
      const screen = next.screens.slice().sort((a, b) => a.order - b.order)[0]!;
      screen.elements = screen.elements.filter((el) => el.id !== toRemove);
      return { next, didChange: true };
    }
  }

  const addMatch =
    lower.match(/\badd\s+(?:a\s+)?question\b(?:\s+about|\s+for|\s+on)?\s*(.+)$/) ||
    lower.match(/\binclude\s+(?:a\s+)?question\b(?:\s+about|\s+for|\s+on)?\s*(.+)$/);
  if (addMatch) {
    const topic = (addMatch[1] ?? '').trim();
    const cleanTopic = topic.replace(/[.?!]$/g, '').trim();
    const subject = cleanTopic || 'your experience';

    // Decide type heuristically.
    const wantsChoice = /\b(single choice|multiple choice|multi choice|select)\b/.test(lower);
    const wantsText = /\b(text|open|free text)\b/.test(lower);
    const isFavorite = /\bfavou?rite\b/.test(lower);

    if (wantsText || (!wantsChoice && isFavorite)) {
      insertBeforePrimaryButton(next, {
        id: nanoid(),
        type: 'input',
        content: `What is your favourite ${subject.replace(/\bfavou?rite\b/i, '').trim() || 'wine'}?`,
        props: { required: false, maxLength: 120, showPrompt: true },
      });
      return { next, didChange: true };
    }

    if (/\bmultiple\b/.test(lower)) {
      insertBeforePrimaryButton(next, {
        id: nanoid(),
        type: 'multiple-choice',
        content: `Which ${subject} do you prefer? (Select all that apply)`,
        props: {
          options: [{ label: 'Red' }, { label: 'White' }, { label: 'Rosé' }, { label: 'Sparkling' }],
          optionFormat: 'text',
          showPrompt: true,
        },
      });
      return { next, didChange: true };
    }

    insertBeforePrimaryButton(next, {
      id: nanoid(),
      type: 'single-choice',
      content: `Which ${subject} do you prefer?`,
      props: {
        options: [{ label: 'Red' }, { label: 'White' }, { label: 'Rosé' }, { label: 'Sparkling' }],
        optionFormat: 'text',
        showPrompt: true,
      },
    });
    return { next, didChange: true };
  }

  // Quick update: “make it 7 questions”
  const countMatch = lower.match(/\b(\d+)\s+questions?\b/);
  if (countMatch) {
    const desired = Math.max(1, Math.min(15, Number(countMatch[1])));
    if (!Number.isNaN(desired)) {
      const currentQuestions = summarizeQuestions(next);
      const toAdd = desired - currentQuestions.length;
      if (toAdd > 0) {
        for (let i = 0; i < Math.min(6, toAdd); i++) {
          insertBeforePrimaryButton(next, {
            id: nanoid(),
            type: 'input',
            content: `Additional comment ${i + 1}`,
            props: { required: false, maxLength: 160, showPrompt: true },
          });
        }
        return { next, didChange: true };
      }
    }
  }

  return { next, didChange: false };
}

async function tryGenerateWithOpenAI(prompt: string, apiKey?: string): Promise<Letter | null> {
  if (!apiKey) return null;
  try {
    // Optional dependency: if installed, we can use it. Otherwise we fall back to heuristic generation.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const OpenAI = (await import('openai')).default as any;
    const client = new OpenAI({ apiKey });
    const system = [
      'You generate JSON for an E-Letter Builder.',
      'Return ONLY valid JSON (no markdown).',
      'Use only these element types: header, subheader, paragraph, image, video, button, single-choice, multiple-choice, input, file, date, date-input, rating, ranking.',
      'Always return a single Letter object with screens[0].elements containing a reasonable draft.',
      'Keep it under 25 elements.',
    ].join('\n');
    const fullPrompt = `${system}\n\nUser request:\n${prompt}`;

    const resp = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    });
    const text = resp.output_text as string;
    const parsed = JSON.parse(text);
    return sanitizeLetter(parsed);
  } catch {
    return null;
  }
}

type DraftSource = 'gemini' | 'openai' | 'heuristic';
type DraftResult = { letter: Letter; source: DraftSource; warning?: string };

function extractJsonCandidate(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return trimmed.slice(start, end + 1);
  throw new Error('No JSON payload found');
}

async function tryGenerateWithGemini(
  prompt: string,
  apiKey?: string,
): Promise<{ letter: Letter | null; error?: string }> {
  if (!apiKey) return { letter: null, error: 'Missing GEMINI_API_KEY.' };
  try {
    const modelCandidates = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];
    const system = [
      'You generate JSON for an E-Letter Builder.',
      'Return ONLY valid JSON (no markdown).',
      'Use only these element types: header, subheader, paragraph, image, video, button, single-choice, multiple-choice, input, file, date, date-input, rating, ranking.',
      'Always return a single Letter object with screens[0].elements containing a reasonable draft.',
      'Keep it under 25 elements.',
    ].join('\n');
    const fullPrompt = `${system}\n\nUser request:\n${prompt}`;

    let lastError: Error | null = null;
    for (const modelName of modelCandidates) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
              generationConfig: { temperature: 0.4 },
            }),
          },
        );
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(errText || `HTTP ${resp.status}`);
        }
        const data = (await resp.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? '').join('') ?? '';
        if (!text) throw new Error('Empty response');
        const parsed = JSON.parse(extractJsonCandidate(text));
        return { letter: sanitizeLetter(parsed) };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Gemini request failed.');
      }
    }
    throw lastError ?? new Error('Gemini request failed.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini request failed.';
    return { letter: null, error: message };
  }
}

/* Legacy SDK path retained for reference:
        const resp = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { role: 'system', parts: [{ text: system }] },
          generationConfig: { temperature: 0.4 },
        });
        const text = resp.response?.text();
        if (!text) throw new Error('Empty response');
        const parsed = JSON.parse(extractJsonCandidate(text));
        return { letter: sanitizeLetter(parsed) };
*/

export async function generateDraftResult(
  prompt: string,
  opts?: { openAiKey?: string; geminiKey?: string; currentDraftJson?: unknown },
): Promise<DraftResult> {
  const p = prompt.trim();
  if (!p) return { letter: createBaseLetter('No title'), source: 'heuristic' };

  if (opts?.currentDraftJson) {
    const current = sanitizeLetter(opts.currentDraftJson);
    const { next, didChange } = applyEditInstruction(current, p);
    if (didChange) return { letter: next, source: 'heuristic' };
  }

  const geminiResult = await tryGenerateWithGemini(p, opts?.geminiKey);
  if (geminiResult.letter) {
    return { letter: geminiResult.letter, source: 'gemini' };
  }

  const fromOpenAI = await tryGenerateWithOpenAI(p, opts?.openAiKey);
  if (fromOpenAI) return { letter: fromOpenAI, source: 'openai' };

  const looksLikeEmployeeSurvey =
    /employee|employees|team|pulse|wellbeing|culture|engagement/i.test(p);
  const looksLikeFeedbackSurvey =
    /survey|questionnaire|feedback|review|rate|rating|satisfied|satisfaction|recommend|nps|customer|client|liked|like it|how did.*feel|how do.*feel|want to know/i.test(
      p,
    );

  const warning = geminiResult.error ? `Gemini unavailable: ${geminiResult.error}` : undefined;
  if (looksLikeEmployeeSurvey) {
    return { letter: generateEmployeePulseSurvey(p), source: 'heuristic', warning };
  }
  if (looksLikeFeedbackSurvey) {
    return { letter: generateCustomerFeedbackSurvey(p), source: 'heuristic', warning };
  }
  return { letter: generateGenericDraft(p), source: 'heuristic', warning };
}

export async function generateDraftJson(
  prompt: string,
  opts?: { openAiKey?: string; geminiKey?: string; currentDraftJson?: unknown },
): Promise<Letter> {
  const result = await generateDraftResult(prompt, opts);
  return result.letter;
}
