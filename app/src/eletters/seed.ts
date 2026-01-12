// AI-AGENT-HEADER
// path: /src/eletters/seed.ts
// summary: Seed/demo content for the E-Letter dashboard and template picker.
// last-reviewed: 2025-12-17
// line-range: 1-260

import { nanoid } from 'nanoid';
import type { BaseElement, Letter } from '../types/editor';
import type { EletterDraft, SavedDesign, Template } from './types';
import { QUESTION_BANK, type QuestionBankItem, type QuestionCategory } from '../data/questionBank';
import { QUESTIONNAIRE_TEMPLATES } from '../data/questionnaireTemplates';

export function createBlankLetter(): Letter {
  return {
    id: `letter-${nanoid()}`,
    title: 'No title',
    language: 'en',
    screens: [
      {
        id: `screen-${nanoid()}`,
        order: 1,
        mode: 'scroll',
        elements: [],
      },
    ],
  };
}

function templateBase(name: string, elements: Letter['screens'][number]['elements']): Letter {
  return {
    id: `letter-${nanoid()}`,
    title: name,
    language: 'en',
    screens: [
      {
        id: `screen-${nanoid()}`,
        order: 1,
        mode: 'scroll',
        elements,
        style: {
          background: '#ffffff',
          elementSpacing: 12,
        },
        navDoneLabel: 'Done',
      },
    ],
  };
}

export function getLibraryTemplates(): Template[] {
  const categoryLabels: Record<QuestionCategory, string> = {
    customer_feedback: 'Customer feedback',
    customer_satisfaction: 'Customer satisfaction',
    employee_satisfaction: 'Employee satisfaction',
    product_review: 'Product review',
    events: 'Events',
    market_research: 'Market research',
  };
  const questionLookup = new Map<string, QuestionBankItem>(
    QUESTION_BANK.map((item) => [item.id, item]),
  );

  const elementFromQuestion = (item: QuestionBankItem, required?: boolean): BaseElement => {
    const base = { id: nanoid(), content: item.text.en };
    const requiredValue = required ?? false;
    if (item.type === 'rating') {
      return {
        ...base,
        type: 'rating',
        props: {
          max: item.scale?.max ?? 5,
          showPrompt: true,
          scaleType: 'numbers',
          required: requiredValue,
          minLabel: item.scale?.minLabel?.en,
          maxLabel: item.scale?.maxLabel?.en,
        },
      };
    }
    if (item.type === 'ranking') {
      return {
        ...base,
        type: 'ranking',
        props: {
          options: item.options?.en.map((label) => ({ label })) ?? [],
          optionFormat: 'text',
          showPrompt: true,
          required: requiredValue,
        },
      };
    }
    if (item.type === 'single_choice' || item.type === 'multiple_choice') {
      return {
        ...base,
        type: item.type === 'single_choice' ? 'single-choice' : 'multiple-choice',
        props: {
          options: item.options?.en.map((label) => ({ label })) ?? [],
          optionFormat: 'text',
          showPrompt: true,
          required: requiredValue,
        },
      };
    }
    if (item.type === 'text_input') {
      return { ...base, type: 'input', props: { required: requiredValue, showPrompt: true } };
    }
    if (item.type === 'date_input') {
      return {
        ...base,
        type: 'date',
        props: { required: requiredValue, mode: 'date', placeholder: 'Select date', showPrompt: true },
      };
    }
    if (item.type === 'file_upload') {
      return {
        ...base,
        type: 'file',
        props: { required: requiredValue, maxSizeMb: 10, showPrompt: true, accept: 'any', customAccept: [] },
      };
    }
    return { ...base, type: 'input', props: { required: requiredValue, showPrompt: true } };
  };

  return QUESTIONNAIRE_TEMPLATES.map((template) => {
    const elements: BaseElement[] = template.questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((q) => {
        const item = questionLookup.get(q.questionId);
        if (!item) return null;
        return elementFromQuestion(item, q.required);
      })
      .filter((el): el is BaseElement => Boolean(el));

    const categoryLabel = template.categories.map((cat) => categoryLabels[cat]).join(' • ');
    const title = template.name.en;

    return {
      id: `tpl-${nanoid()}`,
      name: title,
      source: 'library',
      category: categoryLabel,
      json: templateBase(title, elements),
    };
  });
}

export function getSeedUserTemplates(): Template[] {
  return [
    {
      id: `tpl-${nanoid()}`,
      name: 'Simple newsletter',
      source: 'user',
      category: 'Marketing',
      json: templateBase('Simple newsletter', [
        { id: nanoid(), type: 'header', content: 'Monthly update', style: { fontSize: 26 } },
        { id: nanoid(), type: 'paragraph', content: 'Highlights, news and upcoming events.', style: { fontSize: 16 } },
        { id: nanoid(), type: 'image', content: '', style: { height: 240 } },
        { id: nanoid(), type: 'button', content: 'Read more', style: { width: 260, height: 56, align: 'center' } },
      ]),
    },
  ];
}

export function getSeedDrafts(): EletterDraft[] {
  const now = Date.now();
  return [
    {
      id: `draft-${nanoid()}`,
      name: 'Welcome flow (Draft)',
      status: 'Draft',
      createdAt: now - 1000 * 60 * 60 * 26,
      updatedAt: now - 1000 * 60 * 8,
      json: templateBase('Welcome flow', [
        { id: nanoid(), type: 'header', content: 'Welcome', style: { fontSize: 26 } },
        { id: nanoid(), type: 'paragraph', content: 'Thanks for joining. Here is what happens next.', style: { fontSize: 16 } },
        { id: nanoid(), type: 'button', content: 'Continue', style: { width: 260, height: 56, align: 'center' } },
      ]),
    },
    {
      id: `draft-${nanoid()}`,
      name: 'Customer feedback (Running)',
      status: 'Running',
      createdAt: now - 1000 * 60 * 60 * 48,
      updatedAt: now - 1000 * 60 * 35,
      publishedAt: now - 1000 * 60 * 60 * 48,
      publishedBy: 'You',
      json: templateBase('Customer feedback', [
        { id: nanoid(), type: 'header', content: 'How did we do?', style: { fontSize: 26 } },
        { id: nanoid(), type: 'rating', content: 'Rate your experience', props: { max: 5, scaleType: 'stars', showPrompt: true } },
        { id: nanoid(), type: 'button', content: 'Submit', style: { width: 260, height: 56, align: 'center' } },
      ]),
      metrics: {
        sentCount: 1200,
        openedCount: 840,
        startedCount: 620,
        completedCount: 510,
        last24hOpens: Array.from({ length: 12 }, (_, i) => 40 + Math.max(0, 20 - i * 2)),
      },
    },
    {
      id: `draft-${nanoid()}`,
      name: 'Product update (Sent)',
      status: 'Sent',
      createdAt: now - 1000 * 60 * 60 * 80,
      updatedAt: now - 1000 * 60 * 60 * 24,
      publishedAt: now - 1000 * 60 * 60 * 80,
      publishedBy: 'You',
      json: templateBase('Product update', [
        { id: nanoid(), type: 'header', content: 'Product update', style: { fontSize: 26 } },
        { id: nanoid(), type: 'paragraph', content: 'Highlights from this month.', style: { fontSize: 16 } },
        { id: nanoid(), type: 'image', content: '' },
        { id: nanoid(), type: 'button', content: 'Read the full update', style: { width: 260, height: 56, align: 'center' } },
      ]),
      metrics: {
        sentCount: 1800,
        openedCount: 1260,
        last24hOpens: Array.from({ length: 12 }, (_, i) => 50 + Math.max(0, 24 - i * 2)),
      },
    },
    {
      id: `draft-${nanoid()}`,
      name: 'Policy change (Running)',
      status: 'Running',
      createdAt: now - 1000 * 60 * 60 * 30,
      updatedAt: now - 1000 * 60 * 60 * 6,
      publishedAt: now - 1000 * 60 * 60 * 30,
      publishedBy: 'You',
      json: templateBase('Policy change', [
        { id: nanoid(), type: 'header', content: 'Policy update', style: { fontSize: 26 } },
        { id: nanoid(), type: 'paragraph', content: 'Please review the updated policy details.', style: { fontSize: 16 } },
        { id: nanoid(), type: 'button', content: 'View policy', style: { width: 260, height: 56, align: 'center' } },
      ]),
      metrics: {
        sentCount: 600,
        openedCount: 420,
        last24hOpens: Array.from({ length: 12 }, (_, i) => 18 + Math.max(0, 10 - i)),
      },
    },
    {
      id: `draft-${nanoid()}`,
      name: 'Employee engagement (Sent)',
      status: 'Sent',
      createdAt: now - 1000 * 60 * 60 * 72,
      updatedAt: now - 1000 * 60 * 20,
      publishedAt: now - 1000 * 60 * 60 * 72,
      publishedBy: 'You',
      json: templateBase('Employee engagement', [
        { id: nanoid(), type: 'header', content: 'Employee engagement pulse', style: { fontSize: 26 } },
        { id: nanoid(), type: 'rating', content: 'How engaged do you feel?', props: { max: 5, scaleType: 'stars', showPrompt: true } },
        { id: nanoid(), type: 'input', content: 'What could improve your week?', props: { showPrompt: true } },
        { id: nanoid(), type: 'button', content: 'Submit', style: { width: 260, height: 56, align: 'center' } },
      ]),
      metrics: {
        sentCount: 900,
        openedCount: 700,
        startedCount: 540,
        completedCount: 460,
        last24hOpens: Array.from({ length: 12 }, (_, i) => 25 + Math.max(0, 14 - i * 2)),
      },
    },
  ];
}

export function getSeedDesigns(): SavedDesign[] {
  const now = Date.now();
  return [
    {
      id: `design-${nanoid()}`,
      name: 'Minimal light',
      createdAt: now - 1000 * 60 * 60 * 72,
      updatedAt: now - 1000 * 60 * 60 * 40,
      preview: { background: '#ffffff', accent: '#111827' },
    },
    {
      id: `design-${nanoid()}`,
      name: 'Bold dark',
      createdAt: now - 1000 * 60 * 60 * 120,
      updatedAt: now - 1000 * 60 * 60 * 60,
      preview: { background: '#0b1220', accent: '#10b981' },
    },
  ];
}
