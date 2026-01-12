// AI-AGENT-HEADER
// path: /src/eletters/translation.ts
// summary: Translation utilities for demo and local model (offline-first) workflows.
// last-reviewed: 2025-12-17
// line-range: 1-220

import type { BaseElement, ElementType, Letter, Screen } from '../types/editor';

export type TranslationLanguage = 'en' | 'de' | 'it' | 'fr';
export type TranslationEngine = 'demo' | 'local';
export type TranslationMode = 'auto' | TranslationEngine;
export type TranslationResult = { letter: Letter; engine: TranslationEngine };

export const translationLanguages: TranslationLanguage[] = ['en', 'de', 'it', 'fr'];

export const translationLabels: Record<TranslationLanguage, string> = {
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  fr: 'Francais',
};

const phraseMap: Record<TranslationLanguage, Record<string, string>> = {
  en: {},
  de: {
    'Add a title': 'Titel hinzufuegen',
    'Add a subtitle': 'Untertitel hinzufuegen',
    'Add a description': 'Beschreibung hinzufuegen',
    'Add a button label': 'Button-Text hinzufuegen',
    'Single choice question': 'Einzelauswahl Frage',
    'Multiple choice question': 'Mehrfachauswahl Frage',
    'Short text input': 'Kurze Texteingabe',
    'Upload a file': 'Datei hochladen',
    'Enter a date': 'Datum eingeben',
    'Rate your experience': 'Bewerte deine Erfahrung',
    'Rank your preferences': 'Praeferenzen ordnen',
    'Add a title label': 'Titelbeschriftung hinzufuegen',
    'Employee engagement pulse': 'Mitarbeiterengagement Puls',
    'How engaged do you feel?': 'Wie engagiert fuehlen Sie sich?',
    'What could improve your week?': 'Was koennte deine Woche verbessern?',
    'Employee Pulse Survey': 'Mitarbeiter-Impuls-Umfrage',
    'Customer Feedback Survey': 'Kundenfeedback-Umfrage',
    'Customer Feedback': 'Kundenfeedback',
    'How satisfied are you with your work overall?': 'Wie zufrieden sind Sie insgesamt mit Ihrer Arbeit?',
    'How would you describe your current workload?': 'Wie wuerden Sie Ihre aktuelle Arbeitsbelastung beschreiben?',
    'Which areas would most improve your experience?': 'Welche Bereiche wuerden Ihre Erfahrung am meisten verbessern?',
    'Rank what matters most to you (top = most important)': 'Ordnen Sie, was Ihnen am wichtigsten ist (oben = am wichtigsten)',
    'What is one thing we should improve next?': 'Was sollen wir als naechstes verbessern?',
    'Any additional comments?': 'Weitere Kommentare?',
    Continue: 'Weiter',
    Submit: 'Senden',
    Done: 'Fertig',
    Next: 'Weiter',
    Back: 'Zurueck',
    Close: 'Schliessen',
  },
  it: {
    'Add a title': 'Aggiungi un titolo',
    'Add a subtitle': 'Aggiungi un sottotitolo',
    'Add a description': 'Aggiungi una descrizione',
    'Add a button label': 'Aggiungi testo pulsante',
    'Single choice question': 'Domanda a scelta singola',
    'Multiple choice question': 'Domanda a scelta multipla',
    'Short text input': 'Risposta breve',
    'Upload a file': 'Carica un file',
    'Enter a date': 'Inserisci una data',
    'Rate your experience': 'Valuta la tua esperienza',
    'Rank your preferences': 'Ordina le preferenze',
    'Employee engagement pulse': 'Pulse di coinvolgimento dipendenti',
    'How engaged do you feel?': 'Quanto ti senti coinvolto?',
    'What could improve your week?': 'Cosa potrebbe migliorare la tua settimana?',
    'Employee Pulse Survey': 'Sondaggio pulse dipendenti',
    'Customer Feedback Survey': 'Sondaggio feedback clienti',
    'Customer Feedback': 'Feedback clienti',
    'How satisfied are you with your work overall?': 'Quanto sei soddisfatto del tuo lavoro nel complesso?',
    'How would you describe your current workload?': 'Come descriveresti il tuo carico di lavoro attuale?',
    'Which areas would most improve your experience?': 'Quali aree migliorerebbero di piu la tua esperienza?',
    'Rank what matters most to you (top = most important)': 'Ordina cio che conta di piu per te (in alto = piu importante)',
    'What is one thing we should improve next?': 'Qual e una cosa che dovremmo migliorare subito?',
    'Any additional comments?': 'Altri commenti?',
    Continue: 'Continua',
    Submit: 'Invia',
    Done: 'Fatto',
    Next: 'Avanti',
    Back: 'Indietro',
    Close: 'Chiudi',
  },
  fr: {
    'Add a title': 'Ajouter un titre',
    'Add a subtitle': 'Ajouter un sous-titre',
    'Add a description': 'Ajouter une description',
    'Add a button label': 'Ajouter texte du bouton',
    'Single choice question': 'Question a choix unique',
    'Multiple choice question': 'Question a choix multiple',
    'Short text input': 'Reponse courte',
    'Upload a file': 'Televerser un fichier',
    'Enter a date': 'Entrer une date',
    'Rate your experience': 'Evaluer votre experience',
    'Rank your preferences': 'Classer vos preferences',
    'Employee engagement pulse': "Pulse d'engagement employes",
    'How engaged do you feel?': 'A quel point vous sentez-vous engage?',
    'What could improve your week?': 'Qu est-ce qui pourrait ameliorer votre semaine?',
    'Employee Pulse Survey': 'Sondage pulse employes',
    'Customer Feedback Survey': 'Sondage feedback clients',
    'Customer Feedback': 'Feedback clients',
    'How satisfied are you with your work overall?': 'Dans l ensemble, a quel point etes-vous satisfait de votre travail?',
    'How would you describe your current workload?': 'Comment decririez-vous votre charge de travail actuelle?',
    'Which areas would most improve your experience?': 'Quelles zones amelioreraient le plus votre experience?',
    'Rank what matters most to you (top = most important)': 'Classez ce qui compte le plus pour vous (haut = plus important)',
    'What is one thing we should improve next?': 'Quelle est la prochaine chose a ameliorer?',
    'Any additional comments?': 'Autres commentaires?',
    Continue: 'Continuer',
    Submit: 'Envoyer',
    Done: 'Termine',
    Next: 'Suivant',
    Back: 'Retour',
    Close: 'Fermer',
  },
};

const wordMap: Record<TranslationLanguage, Record<string, string>> = {
  en: {},
  de: {
    add: 'hinzufuegen',
    title: 'titel',
    subtitle: 'untertitel',
    description: 'beschreibung',
    button: 'button',
    label: 'text',
    single: 'einzel',
    multiple: 'mehrfach',
    choice: 'auswahl',
    question: 'frage',
    short: 'kurz',
    text: 'text',
    input: 'eingabe',
    upload: 'hochladen',
    file: 'datei',
    enter: 'eingeben',
    date: 'datum',
    rate: 'bewerte',
    your: 'deine',
    experience: 'erfahrung',
    rank: 'ordne',
    preferences: 'praeferenzen',
    done: 'fertig',
    next: 'weiter',
    back: 'zurueck',
    close: 'schliessen',
    submit: 'senden',
    feedback: 'feedback',
    employee: 'mitarbeiter',
    engagement: 'engagement',
    pulse: 'puls',
  },
  it: {
    add: 'aggiungi',
    title: 'titolo',
    subtitle: 'sottotitolo',
    description: 'descrizione',
    button: 'pulsante',
    label: 'testo',
    single: 'singola',
    multiple: 'multipla',
    choice: 'scelta',
    question: 'domanda',
    short: 'breve',
    text: 'testo',
    input: 'risposta',
    upload: 'carica',
    file: 'file',
    enter: 'inserisci',
    date: 'data',
    rate: 'valuta',
    your: 'la tua',
    experience: 'esperienza',
    rank: 'ordina',
    preferences: 'preferenze',
    done: 'fatto',
    next: 'avanti',
    back: 'indietro',
    close: 'chiudi',
    submit: 'invia',
    feedback: 'feedback',
    employee: 'dipendente',
    engagement: 'coinvolgimento',
    pulse: 'pulse',
  },
  fr: {
    add: 'ajouter',
    title: 'titre',
    subtitle: 'sous-titre',
    description: 'description',
    button: 'bouton',
    label: 'texte',
    single: 'unique',
    multiple: 'multiple',
    choice: 'choix',
    question: 'question',
    short: 'court',
    text: 'texte',
    input: 'reponse',
    upload: 'televerser',
    file: 'fichier',
    enter: 'entrer',
    date: 'date',
    rate: 'evaluer',
    your: 'votre',
    experience: 'experience',
    rank: 'classer',
    preferences: 'preferences',
    done: 'termine',
    next: 'suivant',
    back: 'retour',
    close: 'fermer',
    submit: 'envoyer',
    feedback: 'feedback',
    employee: 'employe',
    engagement: 'engagement',
    pulse: 'pulse',
  },
};

const translatableContentTypes = new Set<ElementType>([
  'header',
  'subheader',
  'paragraph',
  'button',
  'single-choice',
  'multiple-choice',
  'input',
  'file',
  'date',
  'date-input',
  'rating',
  'ranking',
]);

const translatablePropKeys = ['placeholder', 'minLabel', 'maxLabel', 'label', 'alt'];

const nllbLangMap: Record<TranslationLanguage, string> = {
  en: 'eng_Latn',
  de: 'deu_Latn',
  it: 'ita_Latn',
  fr: 'fra_Latn',
};

const translationBackend =
  typeof import.meta.env?.VITE_TRANSLATION_BACKEND === 'string' &&
  ['opus', 'nllb'].includes(import.meta.env.VITE_TRANSLATION_BACKEND)
    ? (import.meta.env.VITE_TRANSLATION_BACKEND as 'opus' | 'nllb')
    : 'opus';

export const localTranslationLabel =
  translationBackend === 'nllb' ? 'NLLB 600M (quality)' : 'Opus MT (small)';

const defaultLocalModel =
  typeof import.meta.env?.VITE_TRANSLATION_MODEL === 'string' && import.meta.env.VITE_TRANSLATION_MODEL
    ? import.meta.env.VITE_TRANSLATION_MODEL
    : 'Xenova/nllb-200-distilled-600M';
const modelBasePath =
  typeof import.meta.env?.VITE_TRANSLATION_MODEL_BASE === 'string'
    ? import.meta.env.VITE_TRANSLATION_MODEL_BASE
    : '';
const allowRemoteModels = import.meta.env?.VITE_TRANSLATION_ALLOW_REMOTE !== 'false';

const opusPairModels: Record<string, string> = {
  'en-de': 'Xenova/opus-mt-en-de',
  'de-en': 'Xenova/opus-mt-de-en',
  'en-fr': 'Xenova/opus-mt-en-fr',
  'fr-en': 'Xenova/opus-mt-fr-en',
  'en-it': 'Xenova/opus-mt-en-it',
  'it-en': 'Xenova/opus-mt-it-en',
};

function applyCase(source: string, mapped: string) {
  if (source.toUpperCase() === source) return mapped.toUpperCase();
  const first = source[0];
  if (first && first.toUpperCase() === first) {
    return mapped[0]?.toUpperCase() + mapped.slice(1);
  }
  return mapped;
}

function translateTextDemo(input: string, lang: TranslationLanguage): string {
  if (lang === 'en') return input;
  const trimmed = input.trim();
  if (!trimmed) return input;
  const exact = phraseMap[lang]?.[trimmed];
  if (exact) return exact;
  const map = wordMap[lang] ?? {};
  let changed = false;
  const replaced = input.replace(/\b[\w']+\b/g, (token) => {
    const mapped = map[token.toLowerCase()];
    if (!mapped) return token;
    changed = true;
    return applyCase(token, mapped);
  });
  if (!changed) return input;
  return replaced;
}

function translatePropsDemo(props: Record<string, unknown>, lang: TranslationLanguage) {
  const next: Record<string, unknown> = { ...props };
  if (Array.isArray(next.options)) {
    next.options = next.options.map((opt) => {
      if (typeof opt === 'string') return translateTextDemo(opt, lang);
      if (opt && typeof opt === 'object' && 'label' in opt) {
        const label = (opt as { label?: unknown }).label;
        if (typeof label === 'string') {
          return { ...(opt as Record<string, unknown>), label: translateTextDemo(label, lang) };
        }
      }
      return opt;
    });
  }
  for (const key of translatablePropKeys) {
    const value = next[key];
    if (typeof value === 'string') next[key] = translateTextDemo(value, lang);
  }
  return next;
}

function translateElementDemo(element: BaseElement, lang: TranslationLanguage): BaseElement {
  const next: BaseElement = { ...element };
  if (typeof element.content === 'string' && translatableContentTypes.has(element.type)) {
    next.content = translateTextDemo(element.content, lang);
  }
  if (element.props) {
    next.props = translatePropsDemo(element.props as Record<string, unknown>, lang);
  }
  return next;
}

function translateScreenDemo(screen: Screen, lang: TranslationLanguage): Screen {
  return {
    ...screen,
    title: screen.title ? translateTextDemo(screen.title, lang) : screen.title,
    ctaLabel: screen.ctaLabel ? translateTextDemo(screen.ctaLabel, lang) : screen.ctaLabel,
    navNextLabel: screen.navNextLabel ? translateTextDemo(screen.navNextLabel, lang) : screen.navNextLabel,
    navBackLabel: screen.navBackLabel ? translateTextDemo(screen.navBackLabel, lang) : screen.navBackLabel,
    navDoneLabel: screen.navDoneLabel ? translateTextDemo(screen.navDoneLabel, lang) : screen.navDoneLabel,
    navCloseLabel: screen.navCloseLabel ? translateTextDemo(screen.navCloseLabel, lang) : screen.navCloseLabel,
    elements: screen.elements.map((el) => translateElementDemo(el, lang)),
  };
}

export function translateLetterDemo(letter: Letter, lang: TranslationLanguage): Letter {
  return {
    ...letter,
    language: lang,
    title: letter.title ? translateTextDemo(letter.title, lang) : letter.title,
    description: letter.description ? translateTextDemo(letter.description, lang) : letter.description,
    screens: letter.screens.map((screen) => translateScreenDemo(screen, lang)),
  };
}

let localTranslatorPromise: Promise<any> | null = null;
let localTranslatorModel: string | null = null;

async function getLocalTranslator(modelName: string) {
  if (localTranslatorPromise && localTranslatorModel === modelName) return localTranslatorPromise;
  localTranslatorModel = modelName;
  localTranslatorPromise = (async () => {
    const transformers = (await import('@xenova/transformers')) as any;
    const { pipeline, env } = transformers ?? {};
    if (!pipeline) throw new Error('Transformers pipeline unavailable');
    if (env) {
      env.allowRemoteModels = allowRemoteModels;
      if (modelBasePath) {
        env.allowLocalModels = true;
        env.localModelPath = modelBasePath;
      }
      if (!allowRemoteModels) {
        env.allowRemoteModels = false;
      }
    }
    return pipeline('translation', modelName);
  })();
  return localTranslatorPromise;
}

async function translateTextLocal(
  input: string,
  sourceLang: TranslationLanguage,
  targetLang: TranslationLanguage,
): Promise<string> {
  if (sourceLang === targetLang) return input;
  const trimmed = input.trim();
  if (!trimmed) return input;
  if (translationBackend === 'nllb') {
    const src = nllbLangMap[sourceLang];
    const tgt = nllbLangMap[targetLang];
    if (!src || !tgt) throw new Error('Unsupported language');
    const translator = await getLocalTranslator(defaultLocalModel);
    const output = await translator(trimmed, { src_lang: src, tgt_lang: tgt });
    const translated =
      Array.isArray(output) && typeof output[0]?.translation_text === 'string'
        ? output[0].translation_text
        : typeof output?.translation_text === 'string'
          ? output.translation_text
          : null;
    return translated && translated.trim() ? translated : input;
  }

  const translateWithOpus = async (value: string, from: TranslationLanguage, to: TranslationLanguage) => {
    if (from === to) return value;
    if (from !== 'en' && to !== 'en') {
      const toEnglish = await translateWithOpus(value, from, 'en');
      return translateWithOpus(toEnglish, 'en', to);
    }
    const model = opusPairModels[`${from}-${to}`];
    if (!model) throw new Error('Unsupported language pair');
    const translator = await getLocalTranslator(model);
    const output = await translator(value);
    const translated =
      Array.isArray(output) && typeof output[0]?.translation_text === 'string'
        ? output[0].translation_text
        : typeof output?.translation_text === 'string'
          ? output.translation_text
          : null;
    return translated && translated.trim() ? translated : value;
  };

  return translateWithOpus(trimmed, sourceLang, targetLang);
}

async function translatePropsLocal(
  props: Record<string, unknown>,
  translate: (value: string) => Promise<string>,
) {
  const next: Record<string, unknown> = { ...props };
  if (Array.isArray(next.options)) {
    const translatedOptions: unknown[] = [];
    for (const opt of next.options) {
      if (typeof opt === 'string') {
        translatedOptions.push(await translate(opt));
        continue;
      }
      if (opt && typeof opt === 'object' && 'label' in opt) {
        const label = (opt as { label?: unknown }).label;
        if (typeof label === 'string') {
          translatedOptions.push({ ...(opt as Record<string, unknown>), label: await translate(label) });
          continue;
        }
      }
      translatedOptions.push(opt);
    }
    next.options = translatedOptions;
  }
  for (const key of translatablePropKeys) {
    const value = next[key];
    if (typeof value === 'string') next[key] = await translate(value);
  }
  return next;
}

async function translateElementLocal(
  element: BaseElement,
  translate: (value: string) => Promise<string>,
): Promise<BaseElement> {
  const next: BaseElement = { ...element };
  if (typeof element.content === 'string' && translatableContentTypes.has(element.type)) {
    next.content = await translate(element.content);
  }
  if (element.props) {
    next.props = await translatePropsLocal(element.props as Record<string, unknown>, translate);
  }
  return next;
}

async function translateScreenLocal(
  screen: Screen,
  translate: (value: string) => Promise<string>,
): Promise<Screen> {
  const elements: BaseElement[] = [];
  for (const element of screen.elements) {
    elements.push(await translateElementLocal(element, translate));
  }
  return {
    ...screen,
    title: screen.title ? await translate(screen.title) : screen.title,
    ctaLabel: screen.ctaLabel ? await translate(screen.ctaLabel) : screen.ctaLabel,
    navNextLabel: screen.navNextLabel ? await translate(screen.navNextLabel) : screen.navNextLabel,
    navBackLabel: screen.navBackLabel ? await translate(screen.navBackLabel) : screen.navBackLabel,
    navDoneLabel: screen.navDoneLabel ? await translate(screen.navDoneLabel) : screen.navDoneLabel,
    navCloseLabel: screen.navCloseLabel ? await translate(screen.navCloseLabel) : screen.navCloseLabel,
    elements,
  };
}

export async function translateLetterLocal(letter: Letter, lang: TranslationLanguage): Promise<Letter> {
  const sourceLang = translationLanguages.includes((letter.language ?? 'en') as TranslationLanguage)
    ? ((letter.language ?? 'en') as TranslationLanguage)
    : 'en';
  const cache = new Map<string, string>();
  const translate = async (value: string) => {
    if (cache.has(value)) return cache.get(value) ?? value;
    const translated = await translateTextLocal(value, sourceLang, lang);
    cache.set(value, translated);
    return translated;
  };
  const screens: Screen[] = [];
  for (const screen of letter.screens) {
    screens.push(await translateScreenLocal(screen, translate));
  }
  return {
    ...letter,
    language: lang,
    title: letter.title ? await translate(letter.title) : letter.title,
    description: letter.description ? await translate(letter.description) : letter.description,
    screens,
  };
}

export async function translateLetterWithEngine(
  letter: Letter,
  lang: TranslationLanguage,
  mode: TranslationMode = 'auto',
): Promise<TranslationResult> {
  if (mode === 'local') {
    const local = await translateLetterLocal(letter, lang);
    return { letter: local, engine: 'local' };
  }
  if (mode === 'demo') {
    return { letter: translateLetterDemo(letter, lang), engine: 'demo' };
  }
  if (mode === 'local' || mode === 'auto') {
    try {
      const local = await translateLetterLocal(letter, lang);
      return { letter: local, engine: 'local' };
    } catch {
      if (mode === 'local') {
        return { letter: translateLetterDemo(letter, lang), engine: 'demo' };
      }
    }
  }
  return { letter: translateLetterDemo(letter, lang), engine: 'demo' };
}
