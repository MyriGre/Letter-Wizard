// AI-AGENT-HEADER
// path: /src/server/aiDraft.ts
// summary: Server-side AI draft generator that outputs builder-compatible Letter JSON.
// last-reviewed: 2025-12-17
// line-range: 1-260

import { nanoid } from 'nanoid';
import type { Letter } from '../types/editor';
import { QUESTION_BANK } from '../data/questionBank';
import { QUESTIONNAIRE_TEMPLATES } from '../data/questionnaireTemplates';

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

const typeAliases: Record<string, string> = {
  title: 'header',
  heading: 'header',
  headline: 'header',
  subtitle: 'subheader',
  subheading: 'subheader',
  text: 'paragraph',
  body: 'paragraph',
  textbox: 'paragraph',
  'single-choice': 'single-choice',
  singlechoice: 'single-choice',
  single_choice: 'single-choice',
  'multiple-choice': 'multiple-choice',
  multiplechoice: 'multiple-choice',
  multiple_choice: 'multiple-choice',
  multichoice: 'multiple-choice',
  multi_choice: 'multiple-choice',
  'text-input': 'input',
  textinput: 'input',
  text_input: 'input',
  'short-text': 'input',
  'long-text': 'input',
  textarea: 'input',
  'file-upload': 'file',
  fileupload: 'file',
  file_upload: 'file',
  'date-input': 'date',
  date_input: 'date',
  datepicker: 'date',
  'image-upload': 'image',
};

function normalizeElementType(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return null;
  const dashed = cleaned.replace(/[_\s]+/g, '-').replace(/-+/g, '-');
  const mapped = typeAliases[dashed] ?? typeAliases[cleaned] ?? dashed;
  if (allowedElementTypes.has(mapped as any)) return mapped;
  return null;
}

function safeTitleFromPrompt(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'No title';
  const first = cleaned.split(/[.!?\n]/)[0] ?? cleaned;
  return first.slice(0, 64);
}

function getLocalizedText(
  value: { en: string; de?: string; fr?: string; it?: string } | undefined,
  language: string,
): string {
  if (!value) return '';
  const lang = language.toLowerCase();
  return (
    (value as any)[lang] ||
    value.en ||
    value.de ||
    value.fr ||
    value.it ||
    ''
  );
}

function getLocalizedOptions(
  value: { en: string[]; de?: string[]; fr?: string[]; it?: string[] } | undefined,
  language: string,
): string[] {
  if (!value) return [];
  const lang = language.toLowerCase();
  return (
    (value as any)[lang] ||
    value.en ||
    value.de ||
    value.fr ||
    value.it ||
    []
  );
}

function questionBankItemToElement(
  item: (typeof QUESTION_BANK)[number],
  language: string,
  required?: boolean,
): any {
  const text = getLocalizedText(item.text, language) || item.text.en;
  switch (item.type) {
    case 'single_choice': {
      const options = getLocalizedOptions(item.options, language).map((label) => ({ label }));
      return {
        id: nanoid(),
        type: 'single-choice',
        content: text,
        props: { options, optionFormat: 'text', showPrompt: true, required: Boolean(required) },
      };
    }
    case 'multiple_choice': {
      const options = getLocalizedOptions(item.options, language).map((label) => ({ label }));
      return {
        id: nanoid(),
        type: 'multiple-choice',
        content: text,
        props: { options, optionFormat: 'text', showPrompt: true, required: Boolean(required), multiSelection: true },
      };
    }
    case 'ranking': {
      const options = getLocalizedOptions(item.options, language).map((label) => ({ label }));
      return {
        id: nanoid(),
        type: 'ranking',
        content: text,
        props: { options, optionFormat: 'text', showPrompt: true, required: Boolean(required) },
      };
    }
    case 'rating': {
      const minLabel = item.scale?.minLabel ? getLocalizedText(item.scale.minLabel, language) : undefined;
      const maxLabel = item.scale?.maxLabel ? getLocalizedText(item.scale.maxLabel, language) : undefined;
      return {
        id: nanoid(),
        type: 'rating',
        content: text,
        props: {
          max: item.scale?.max ?? 5,
          showPrompt: true,
          scaleType: (item.scale?.max ?? 5) > 5 ? 'numbers' : 'stars',
          required: Boolean(required),
          minLabel,
          maxLabel,
        },
      };
    }
    case 'date_input':
      return {
        id: nanoid(),
        type: 'date',
        content: text,
        props: { showPrompt: true, required: Boolean(required) },
      };
    case 'file_upload':
      return {
        id: nanoid(),
        type: 'file',
        content: text,
        props: { showPrompt: true, required: Boolean(required) },
      };
    case 'text_input':
    default:
      return {
        id: nanoid(),
        type: 'input',
        content: text,
        props: { showPrompt: true, required: Boolean(required), maxLength: 240 },
      };
  }
}

function selectTemplateForPrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  if (/\b(team|employee|staff|workplace|workload|pulse|mood|feeling)\b/.test(lower)) {
    return QUESTIONNAIRE_TEMPLATES.find((tpl) => tpl.id === 'TPL_EMPLOYEE_PULSE') ?? null;
  }
  if (/\b(customer|client|feedback|support|service)\b/.test(lower)) {
    return QUESTIONNAIRE_TEMPLATES.find((tpl) => tpl.id === 'TPL_CUSTOMER_FEEDBACK_QUICK') ?? null;
  }
  if (/\b(satisfaction|csat|nps|recommend)\b/.test(lower)) {
    return QUESTIONNAIRE_TEMPLATES.find((tpl) => tpl.id === 'TPL_CUSTOMER_SATISFACTION_STANDARD') ?? null;
  }
  if (/\b(product|feature|usage|review)\b/.test(lower)) {
    return QUESTIONNAIRE_TEMPLATES.find((tpl) => tpl.id === 'TPL_PRODUCT_REVIEW_STANDARD') ?? null;
  }
  if (/\b(event|webinar|conference|attend|attendee)\b/.test(lower)) {
    return QUESTIONNAIRE_TEMPLATES.find((tpl) => tpl.id === 'TPL_EVENT_FEEDBACK_STANDARD') ?? null;
  }
  if (/\b(?:market|research|decision|provider|jtbd)\b/.test(lower)) {
    return QUESTIONNAIRE_TEMPLATES.find((tpl) => tpl.id === 'TPL_MARKET_RESEARCH_DISCOVERY') ?? null;
  }
  return null;
}

function inferTemplateFromLetter(letter: Letter) {
  const text = [
    letter.title,
    ...letter.screens.flatMap((screen) => (screen.elements ?? []).map((el) => el.content ?? '')),
  ]
    .join(' ')
    .toLowerCase();
  return selectTemplateForPrompt(text);
}

function desiredQuestionCountFromPrompt(prompt: string): number {
  const match = prompt.match(/\b(\d+)\s+questions?\b/i);
  if (match) {
    const value = Number(match[1]);
    if (!Number.isNaN(value)) return Math.max(1, Math.min(12, value));
  }
  if (/\b(short|quick|brief)\b/i.test(prompt)) return 5;
  if (/\b(survey|questionnaire|pulse|feedback|poll)\b/i.test(prompt)) return 5;
  return 3;
}

function buildLetterFromTemplate(
  template: (typeof QUESTIONNAIRE_TEMPLATES)[number],
  prompt: string,
  count: number,
  language = 'en',
): Letter {
  const baseTitle = getLocalizedText(template.name, language) || template.name.en;
  const title = /\b(mood|feeling)\b/i.test(prompt) ? 'Team mood pulse' : baseTitle;
  const letter = createBaseLetter(title);
  const screen = letter.screens[0]!;
  screen.elements.push({
    id: nanoid(),
    type: 'header',
    content: title,
    style: { fontSize: 26, align: 'left' },
  });

  const items = template.questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, count);

  for (const entry of items) {
    const item = QUESTION_BANK.find((q) => q.id === entry.questionId);
    if (!item) continue;
    screen.elements.push(questionBankItemToElement(item, language, entry.required));
  }

  screen.elements.push({ id: nanoid(), type: 'button', content: 'Continue', style: { width: 260, height: 56, align: 'center' } });
  return letter;
}

function appendQuestionsFromTemplate(
  letter: Letter,
  template: (typeof QUESTIONNAIRE_TEMPLATES)[number],
  count: number,
  language = 'en',
): Letter {
  const next: Letter = JSON.parse(JSON.stringify(letter)) as Letter;
  const screen = next.screens.slice().sort((a, b) => a.order - b.order)[0];
  if (!screen) return next;
  const existing = new Set(
    (screen.elements ?? [])
      .filter((el) => isQuestionElementType(el?.type))
      .map((el) => (el.content ?? '').toString().toLowerCase()),
  );
  const entries = template.questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((entry) => QUESTION_BANK.find((q) => q.id === entry.questionId))
    .filter(Boolean) as (typeof QUESTION_BANK)[number][];

  let added = 0;
  for (const item of entries) {
    if (added >= count) break;
    const text = (getLocalizedText(item.text, language) || item.text.en).toLowerCase();
    if (existing.has(text)) continue;
    insertBeforePrimaryButton(next, questionBankItemToElement(item, language));
    added += 1;
  }
  return next;
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

function extractTopicFromPrompt(prompt: string): string | null {
  const match = prompt.match(/\b(?:about|on|regarding|for)\s+([^.\n!?]+)\b/i);
  if (match?.[1]) return match[1].trim();
  return extractQuotedThing(prompt);
}

function buildFallbackQuestion(prompt: string): any {
  const lower = prompt.toLowerCase();
  const topic = extractTopicFromPrompt(prompt) || 'your experience';
  const cleanedTopic = topic.replace(/\s+$/g, '');

  if (/\b(likely|recommend|nps|score)\b/.test(lower)) {
    return {
      id: nanoid(),
      type: 'rating',
      content: `How likely are you to recommend ${cleanedTopic}?`,
      props: { max: 10, scaleType: 'numbers', showPrompt: true, minLabel: 'Not likely', maxLabel: 'Very likely' },
    };
  }

  if (/\b(rate|rating|satisfied|satisfaction|score)\b/.test(lower)) {
    return {
      id: nanoid(),
      type: 'rating',
      content: `How satisfied are you with ${cleanedTopic}?`,
      props: { max: 5, scaleType: 'stars', showPrompt: true, minLabel: 'Low', maxLabel: 'High' },
    };
  }

  if (/\b(multiple|multi|select all)\b/.test(lower)) {
    return {
      id: nanoid(),
      type: 'multiple-choice',
      content: `Which ${cleanedTopic} applies to you? (Select all that apply)`,
      props: {
        options: [{ label: 'Option A' }, { label: 'Option B' }, { label: 'Option C' }],
        optionFormat: 'text',
        showPrompt: true,
        multiSelection: true,
      },
    };
  }

  if (/\b(mood|feel|feeling)\b/.test(lower)) {
    return {
      id: nanoid(),
      type: 'single-choice',
      content: 'How would you describe your mood?',
      props: {
        options: [{ label: 'Great' }, { label: 'Okay' }, { label: 'Not sure' }],
        optionFormat: 'text',
        showPrompt: true,
      },
    };
  }

  if (/\b(yes\/no|yes or no|true\/false|true or false)\b/.test(lower)) {
    return {
      id: nanoid(),
      type: 'single-choice',
      content: `Is ${cleanedTopic} true for you?`,
      props: {
        options: [{ label: 'Yes' }, { label: 'No' }],
        optionFormat: 'text',
        showPrompt: true,
      },
    };
  }

  return {
    id: nanoid(),
    type: 'single-choice',
    content: `How do you feel about ${cleanedTopic}?`,
    props: {
      options: [{ label: 'Great' }, { label: 'Okay' }, { label: 'Not sure' }],
      optionFormat: 'text',
      showPrompt: true,
    },
  };
}

function ensureMinimumLetter(letter: Letter, prompt: string): Letter {
  const next: Letter = JSON.parse(JSON.stringify(letter)) as Letter;
  const titleValue = next.title?.trim() ?? '';
  const isPlaceholderTitle = titleValue === '' || /^no title$/i.test(titleValue) || /^untitled$/i.test(titleValue);
  if (isPlaceholderTitle) {
    next.title = safeTitleFromPrompt(prompt);
  }

  if (!Array.isArray(next.screens) || next.screens.length === 0) {
    next.screens = createBaseLetter(next.title).screens;
  }

  const screen = next.screens.slice().sort((a, b) => a.order - b.order)[0];
  if (!screen) return next;
  if (!Array.isArray(screen.elements)) screen.elements = [];

  const hasHeader = screen.elements.some((el) => el?.type === 'header');
  if (!hasHeader && next.title) {
    screen.elements.unshift({
      id: nanoid(),
      type: 'header',
      content: next.title,
      style: { fontSize: 26, align: 'left' },
    });
  }

  const hasQuestion = screen.elements.some((el) => isQuestionElementType(el?.type));
  if (!hasQuestion) {
    screen.elements.push(buildFallbackQuestion(prompt));
  }

  const hasButton = screen.elements.some((el) => el?.type === 'button');
  if (!hasButton) {
    screen.elements.push({
      id: nanoid(),
      type: 'button',
      content: 'Continue',
      style: { width: 260, height: 56, align: 'center' },
    });
  }

  return next;
}

function countQuestions(letter: Letter): number {
  return (letter.screens ?? []).reduce((sum, screen) => {
    const elements = screen.elements ?? [];
    return sum + elements.filter((el) => isQuestionElementType(el?.type)).length;
  }, 0);
}

function ensureSurveyDepth(letter: Letter, prompt: string): Letter {
  const lower = prompt.toLowerCase();
  if (!/\b(survey|questionnaire|pulse|feedback|poll|study)\b/.test(lower)) return letter;
  const desired = desiredQuestionCountFromPrompt(prompt);
  const current = countQuestions(letter);
  const toAdd = Math.max(0, Math.min(6, desired - current));
  if (toAdd === 0) return letter;

  const template = selectTemplateForPrompt(prompt) ?? inferTemplateFromLetter(letter);
  if (template) {
    return appendQuestionsFromTemplate(letter, template, toAdd, letter.language ?? 'en');
  }

  const next: Letter = JSON.parse(JSON.stringify(letter)) as Letter;
  for (let i = 0; i < toAdd; i++) {
    insertBeforePrimaryButton(next, {
      id: nanoid(),
      type: 'input',
      content: `Additional comment ${current + i + 1}`,
      props: { required: false, maxLength: 160, showPrompt: true },
    });
  }
  return next;
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
                const normalizedType = normalizeElementType((el as any).type);
                if (!normalizedType) return null;
                const propsRaw = isObject((el as any).props) ? { ...(el as any).props } : {};
                if (!propsRaw.options && Array.isArray((el as any).options)) {
                  propsRaw.options = (el as any).options;
                }
                if (Array.isArray(propsRaw.options)) {
                  propsRaw.options = propsRaw.options
                    .map((opt: any) => {
                      if (typeof opt === 'string') return { label: opt };
                      if (isObject(opt) && typeof (opt as any).label === 'string') return opt;
                      return null;
                    })
                    .filter(Boolean);
                }
                return {
                  id: typeof (el as any).id === 'string' ? (el as any).id : nanoid(),
                  type: normalizedType,
                  content: typeof (el as any).content === 'string' ? (el as any).content : undefined,
                  props: Object.keys(propsRaw).length > 0 ? propsRaw : undefined,
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

function hasGenericQuestions(letter: Letter): boolean {
  const genericPatterns = [
    /how do you feel about this message\?/i,
    /additional comment/i,
    /any additional comments\?/i,
  ];
  return (letter.screens ?? []).some((screen) =>
    (screen.elements ?? []).some(
      (el) => isQuestionElementType(el?.type) && genericPatterns.some((pattern) => pattern.test((el?.content ?? '').toString())),
    ),
  );
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

  const addCountMatch = lower.match(/\badd\s+(\d+)\s+(?:more\s+)?questions?\b/);
  if (addCountMatch) {
    const count = Math.max(1, Math.min(10, Number(addCountMatch[1])));
    if (!Number.isNaN(count)) {
      const template = inferTemplateFromLetter(next);
      if (template) {
        return {
          next: appendQuestionsFromTemplate(next, template, count, next.language ?? 'en'),
          didChange: true,
        };
      }
      for (let i = 0; i < count; i++) {
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

  // Quick update: “make it 7 questions”
  const countMatch = lower.match(/\b(?:make\s+it|set\s+to|total)\s+(\d+)\s+questions?\b/) || lower.match(/\b(\d+)\s+questions?\b/);
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
            content: `Additional comment ${currentQuestions.length + i + 1}`,
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

type PlanQuestion = {
  type: string;
  text: string;
  options?: string[];
  scale?: { min?: number; max?: number; minLabel?: string; maxLabel?: string };
  required?: boolean;
};

type QuestionPlan = { title?: string; questions: PlanQuestion[] };

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

async function getGeminiModelCandidates(
  apiKey: string,
  preferredModels: string[],
  modelOverride?: string,
): Promise<string[]> {
  const normalizeModel = (name: string) => name.replace(/^models\//, '').trim();
  const normalizedPreferred = preferredModels.map(normalizeModel).filter(Boolean);
  if (modelOverride) return [normalizeModel(modelOverride)];
  try {
    const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!listResp.ok) return normalizedPreferred.slice();
    const listData = (await listResp.json()) as {
      models?: { name?: string; supportedGenerationMethods?: string[] }[];
    };
    const supported = (listData.models ?? [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => normalizeModel(model.name ?? ''))
      .filter(Boolean);
    const supportedSet = new Set(supported);
    const filtered = normalizedPreferred.filter((name) => supportedSet.has(name));
    if (filtered.length > 0) return filtered;
    const geminiOnly = supported.filter((name) => name.startsWith('gemini-'));
    if (geminiOnly.length > 0) return geminiOnly.slice(0, 6);
  } catch {
    return normalizedPreferred.slice();
  }
  return normalizedPreferred.slice();
}

function planQuestionToElement(question: PlanQuestion): any | null {
  const text = question.text?.trim();
  if (!text) return null;
  const normalizedType = normalizeElementType(question.type);
  if (!normalizedType || !isQuestionElementType(normalizedType)) return null;

  if (normalizedType === 'rating') {
    const max = question.scale?.max ?? 5;
    return {
      id: nanoid(),
      type: 'rating',
      content: text,
      props: {
        max,
        showPrompt: true,
        scaleType: max > 5 ? 'numbers' : 'stars',
        required: Boolean(question.required),
        minLabel: question.scale?.minLabel,
        maxLabel: question.scale?.maxLabel,
      },
    };
  }

  if (normalizedType === 'single-choice' || normalizedType === 'multiple-choice' || normalizedType === 'ranking') {
    const options = (question.options ?? [])
      .map((label) => (typeof label === 'string' ? { label: label.trim() } : null))
      .filter(Boolean);
    const safeOptions = options.length > 1 ? options : [{ label: 'Option A' }, { label: 'Option B' }];
    return {
      id: nanoid(),
      type: normalizedType,
      content: text,
      props: {
        options: safeOptions,
        optionFormat: 'text',
        showPrompt: true,
        required: Boolean(question.required),
        ...(normalizedType === 'multiple-choice' ? { multiSelection: true } : {}),
      },
    };
  }

  return {
    id: nanoid(),
    type: normalizedType,
    content: text,
    props: { showPrompt: true, required: Boolean(question.required), maxLength: 240 },
  };
}

function buildLetterFromPlan(plan: QuestionPlan, prompt: string): Letter {
  const desired = desiredQuestionCountFromPrompt(prompt);
  const title = plan.title?.trim() || safeTitleFromPrompt(prompt);
  const letter = createBaseLetter(title);
  const screen = letter.screens[0]!;
  screen.elements.push({
    id: nanoid(),
    type: 'header',
    content: title,
    style: { fontSize: 26, align: 'left' },
  });
  const questions = (plan.questions ?? []).map(planQuestionToElement).filter(Boolean) as any[];
  const trimmed = questions.slice(0, desired);
  screen.elements.push(...trimmed);
  screen.elements.push({
    id: nanoid(),
    type: 'button',
    content: 'Continue',
    style: { width: 260, height: 56, align: 'center' },
  });
  return letter;
}

async function tryGenerateQuestionPlanWithGemini(
  prompt: string,
  apiKey?: string,
  modelOverride?: string,
): Promise<{ plan: QuestionPlan | null; error?: string }> {
  if (!apiKey) return { plan: null, error: 'Missing GEMINI_API_KEY.' };
  try {
    const desiredCount = desiredQuestionCountFromPrompt(prompt);
    const system = [
      'You are an expert survey designer.',
      `Generate exactly ${desiredCount} questions unless the user explicitly asks for a different number.`,
      'Return ONLY JSON with shape: { "title": string, "questions": [ { "type": string, "text": string, "options": string[], "scale": { "min": number, "max": number, "minLabel": string, "maxLabel": string }, "required": boolean } ] }',
      'Allowed types: single_choice, multiple_choice, rating, text_input, ranking, date_input, file_upload.',
      'For rating, always include a scale with min/max and labels.',
      'For choice types, include 3-6 options.',
      'No markdown, no commentary.',
    ].join('\n');
    const fullPrompt = `${system}\n\nUser request:\n${prompt}`;
    const preferredModels = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-pro-latest',
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-lite-001',
    ];
    const modelCandidates = await getGeminiModelCandidates(apiKey, preferredModels, modelOverride);
    let lastError: Error | null = null;
    for (const modelName of modelCandidates) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
              generationConfig: { temperature: 0.7, topP: 0.9 },
            }),
          },
        );
        if (!resp.ok) {
          const errText = await resp.text();
          let message = errText || `HTTP ${resp.status}`;
          try {
            const parsed = JSON.parse(errText);
            if (parsed?.error?.message) message = parsed.error.message;
          } catch {
            // keep raw text
          }
          throw new Error(message);
        }
        const data = (await resp.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? '').join('') ?? '';
        if (!text) throw new Error('Empty response');
        const parsed = JSON.parse(extractJsonCandidate(text)) as QuestionPlan;
        if (!parsed || !Array.isArray(parsed.questions)) throw new Error('Invalid plan format');
        return { plan: parsed };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Gemini request failed.');
      }
    }
    throw lastError ?? new Error('Gemini request failed.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini request failed.';
    return { plan: null, error: message };
  }
}

async function tryGenerateWithGemini(
  prompt: string,
  apiKey?: string,
  modelOverride?: string,
): Promise<{ letter: Letter | null; error?: string }> {
  if (!apiKey) return { letter: null, error: 'Missing GEMINI_API_KEY.' };
  try {
    const preferredModels = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-pro-latest',
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-lite-001',
    ];
    const desiredCount = desiredQuestionCountFromPrompt(prompt);
    const topicHints: string[] = [];
    if (/\b(team|employee|staff|workplace|workload|pulse|mood|feeling)\b/i.test(prompt)) {
      topicHints.push(
        'Focus on team mood, workload manageability, support/resources, psychological safety, and one open improvement question.',
      );
    }
    if (/\b(customer|client|feedback|service|support)\b/i.test(prompt)) {
      topicHints.push(
        'Include overall satisfaction, effort to get help, quality perception, and one open feedback question.',
      );
    }
    if (/\b(product|feature|usage|review)\b/i.test(prompt)) {
      topicHints.push('Cover product quality, usage frequency, and improvement ideas.');
    }
    const system = [
      'You are a survey designer that outputs JSON for our E-Letter Builder.',
      `Generate exactly ${desiredCount} questions unless the user explicitly asks for a different number.`,
      'Questions must be specific to the user prompt and avoid generic filler.',
      ...(topicHints.length ? topicHints : ['Keep questions relevant and practical.']),
      'Return ONLY valid JSON (no markdown, no commentary).',
      'Allowed element types: header, subheader, paragraph, image, video, button, single-choice, multiple-choice, input, file, date, date-input, rating, ranking.',
      'Output shape: { id, title, language, screens: [{ id, order, mode, style, elements: [...] }] }.',
      'For choice questions use props.options as array of { label } objects.',
      'For rating include props: max, scaleType ("stars" or "numbers"), minLabel, maxLabel.',
      'Keep it under 20 elements total.',
    ].join('\n');
    const fullPrompt = `${system}\n\nUser request:\n${prompt}`;

    const modelCandidates = await getGeminiModelCandidates(apiKey, preferredModels, modelOverride);

    let lastError: Error | null = null;
    for (const modelName of modelCandidates) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
              generationConfig: { temperature: 0.6, topP: 0.9 },
            }),
          },
        );
        if (!resp.ok) {
          const errText = await resp.text();
          let message = errText || `HTTP ${resp.status}`;
          try {
            const parsed = JSON.parse(errText);
            if (parsed?.error?.message) message = parsed.error.message;
          } catch {
            // keep raw text
          }
          throw new Error(message);
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

export async function translateTextsWithGemini(
  texts: string[],
  sourceLang: string,
  targetLang: string,
  opts?: { apiKey?: string; model?: string },
): Promise<{ translations: string[]; error?: string }> {
  const apiKey = opts?.apiKey;
  if (!apiKey) return { translations: texts, error: 'Missing GEMINI_API_KEY.' };
  if (!texts.length) return { translations: [] };

  const languageLabels: Record<string, string> = {
    en: 'English',
    de: 'German',
    it: 'Italian',
    fr: 'French',
  };
  const sourceLabel = languageLabels[sourceLang] ?? sourceLang;
  const targetLabel = languageLabels[targetLang] ?? targetLang;
  const system = [
    `Translate the following phrases from ${sourceLabel} to ${targetLabel}.`,
    'Return ONLY valid JSON in the shape: { "translations": ["..."] }.',
    'Keep the same order and number of items.',
    'Preserve placeholders like {name}, {{variable}}, %s, or {0}.',
    'Do not add commentary.',
  ].join('\n');
  const payload = `${system}\n\nInput JSON array:\n${JSON.stringify(texts)}`;
  const preferredModels = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
  ];
  const modelCandidates = await getGeminiModelCandidates(apiKey, preferredModels, opts?.model);
  let lastError: Error | null = null;
  for (const modelName of modelCandidates) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: payload }] }],
            generationConfig: { temperature: 0.2, topP: 0.9 },
          }),
        },
      );
      if (!resp.ok) {
        const errText = await resp.text();
        let message = errText || `HTTP ${resp.status}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) message = parsed.error.message;
        } catch {
          // keep raw text
        }
        throw new Error(message);
      }
      const data = (await resp.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? '').join('') ?? '';
      if (!text) throw new Error('Empty response');
      const parsed = JSON.parse(extractJsonCandidate(text)) as { translations?: unknown };
      if (!Array.isArray(parsed.translations)) throw new Error('Invalid translation format');
      const translations = texts.map((value, index) => {
        const translated = parsed.translations?.[index];
        return typeof translated === 'string' && translated.trim() ? translated : value;
      });
      return { translations };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Gemini request failed.');
    }
  }
  return { translations: texts, error: lastError?.message ?? 'Gemini request failed.' };
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
  opts?: { openAiKey?: string; geminiKey?: string; geminiModel?: string; currentDraftJson?: unknown },
): Promise<DraftResult> {
  const p = prompt.trim();
  if (!p) return { letter: createBaseLetter('No title'), source: 'heuristic' };

  if (opts?.currentDraftJson) {
    const current = sanitizeLetter(opts.currentDraftJson);
    const { next, didChange } = applyEditInstruction(current, p);
    if (didChange) return { letter: next, source: 'heuristic' };
  }

  const planResult = await tryGenerateQuestionPlanWithGemini(p, opts?.geminiKey, opts?.geminiModel);
  if (planResult.plan) {
    const fromPlan = buildLetterFromPlan(planResult.plan, p);
    const ensured = ensureSurveyDepth(ensureMinimumLetter(fromPlan, p), p);
    return { letter: ensured, source: 'gemini', warning: 'Generated via Gemini question plan.' };
  }

  const geminiResult = await tryGenerateWithGemini(p, opts?.geminiKey, opts?.geminiModel);
  if (geminiResult.letter) {
    const desiredCount = desiredQuestionCountFromPrompt(p);
    const template = selectTemplateForPrompt(p);
    const sanitized = ensureMinimumLetter(geminiResult.letter, p);
    const needsUpgrade =
      Boolean(template) &&
      (countQuestions(sanitized) < desiredCount || hasGenericQuestions(sanitized));
    if (template && needsUpgrade) {
      const bankDraft = buildLetterFromTemplate(template, p, desiredCount, sanitized.language ?? 'en');
      return { letter: bankDraft, source: 'gemini', warning: 'Enhanced with question bank for better quality.' };
    }
    const ensured = ensureSurveyDepth(sanitized, p);
    return { letter: ensured, source: 'gemini' };
  }

  const fromOpenAI = await tryGenerateWithOpenAI(p, opts?.openAiKey);
  if (fromOpenAI) {
    const ensured = ensureSurveyDepth(ensureMinimumLetter(fromOpenAI, p), p);
    return { letter: ensured, source: 'openai' };
  }

  const looksLikeEmployeeSurvey =
    /employee|employees|team|pulse|wellbeing|culture|engagement/i.test(p);
  const looksLikeFeedbackSurvey =
    /survey|questionnaire|feedback|review|rate|rating|satisfied|satisfaction|recommend|nps|customer|client|liked|like it|how did.*feel|how do.*feel|want to know/i.test(
      p,
    );

  const warning = geminiResult.error ? `Gemini unavailable: ${geminiResult.error}` : undefined;
  if (looksLikeEmployeeSurvey) {
    return {
      letter: ensureSurveyDepth(ensureMinimumLetter(generateEmployeePulseSurvey(p), p), p),
      source: 'heuristic',
      warning,
    };
  }
  if (looksLikeFeedbackSurvey) {
    return {
      letter: ensureSurveyDepth(ensureMinimumLetter(generateCustomerFeedbackSurvey(p), p), p),
      source: 'heuristic',
      warning,
    };
  }
  return { letter: ensureSurveyDepth(ensureMinimumLetter(generateGenericDraft(p), p), p), source: 'heuristic', warning };
}

export async function generateDraftJson(
  prompt: string,
  opts?: { openAiKey?: string; geminiKey?: string; geminiModel?: string; currentDraftJson?: unknown },
): Promise<Letter> {
  const result = await generateDraftResult(prompt, opts);
  return result.letter;
}
