import type { QuestionCategory, LocalizedText } from "./questionBank";

export type TemplateAudience = "customer" | "employee" | "event_attendee" | "market";

export type TemplateQuestion = {
  order: number;
  questionId: string; // must exist in QUESTION_BANK
  required?: boolean;
};

export type QuestionnaireTemplate = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  categories: QuestionCategory[];
  audience: TemplateAudience;
  estimatedMinutes: number;
  questions: TemplateQuestion[];
  tags?: string[];
};

export const QUESTIONNAIRE_TEMPLATES: QuestionnaireTemplate[] = [
  // 1) Customer Feedback — Quick pulse (general service feedback)
  {
    id: "TPL_CUSTOMER_FEEDBACK_QUICK",
    name: {
      en: "Customer feedback (quick)",
      de: "Kundenfeedback (kurz)",
      fr: "Retour client (rapide)",
      it: "Feedback clienti (rapido)",
    },
    description: {
      en: "A short, neutral feedback form to understand what went well, what to improve, and whether issues occurred.",
      de: "Kurzes, neutrales Feedback-Formular: Was lief gut, was verbessern, ob Probleme auftraten.",
      fr: "Formulaire court et neutre pour comprendre ce qui a bien fonctionné, ce qui peut être amélioré et s’il y a eu des problèmes.",
      it: "Modulo breve e neutro per capire cosa è andato bene, cosa migliorare e se ci sono stati problemi.",
    },
    categories: ["customer_feedback"],
    audience: "customer",
    estimatedMinutes: 2,
    questions: [
      { order: 1, questionId: "CF_008", required: true }, // overall satisfaction
      { order: 2, questionId: "CF_003", required: true }, // effort
      { order: 3, questionId: "CF_006", required: true }, // issues yes/no
      { order: 4, questionId: "CF_001" }, // what went well
      { order: 5, questionId: "CF_002" }, // improve
      { order: 6, questionId: "CF_007" }, // upload optional
    ],
    tags: ["quick", "service", "feedback"],
  },

  // 2) Customer Satisfaction — CSAT + NPS drivers (standard)
  {
    id: "TPL_CUSTOMER_SATISFACTION_STANDARD",
    name: {
      en: "Customer satisfaction (standard)",
      de: "Kundenzufriedenheit (Standard)",
      fr: "Satisfaction client (standard)",
      it: "Soddisfazione clienti (standard)",
    },
    description: {
      en: "A standard satisfaction template combining CSAT and recommendation likelihood, plus key drivers and open feedback.",
      de: "Standard-Template mit CSAT und Weiterempfehlung, plus Treiber und offene Rückmeldung.",
      fr: "Modèle standard combinant CSAT et probabilité de recommandation, avec facteurs clés et commentaires libres.",
      it: "Template standard con CSAT e propensione a raccomandare, con driver principali e commenti aperti.",
    },
    categories: ["customer_satisfaction"],
    audience: "customer",
    estimatedMinutes: 3,
    questions: [
      { order: 1, questionId: "CS_001", required: true }, // CSAT
      { order: 2, questionId: "CS_002", required: true }, // NPS
      { order: 3, questionId: "CS_003", required: true }, // expectations
      { order: 4, questionId: "CS_004" }, // drivers (multi)
      { order: 5, questionId: "CS_006" }, // speed
      { order: 6, questionId: "CS_007" }, // value for money
      { order: 7, questionId: "CS_005" }, // 1 improvement
      { order: 8, questionId: "CS_008" }, // additional comments
    ],
    tags: ["csat", "nps", "standard"],
  },

  // 3) Employee Pulse — 5–7 questions (common HR/Team pulse)
  {
    id: "TPL_EMPLOYEE_PULSE",
    name: {
      en: "Employee pulse (quick)",
      de: "Mitarbeiter-Pulse (kurz)",
      fr: "Pulse employés (rapide)",
      it: "Pulse dipendenti (rapido)",
    },
    description: {
      en: "A short employee pulse to track satisfaction, enablement, psychological safety, and workload.",
      de: "Kurzer Mitarbeiter-Pulse: Zufriedenheit, Enablement, psychologische Sicherheit und Arbeitslast.",
      fr: "Pulse court pour suivre la satisfaction, les moyens, la sécurité psychologique et la charge de travail.",
      it: "Pulse breve per monitorare soddisfazione, strumenti, sicurezza psicologica e carico di lavoro.",
    },
    categories: ["employee_satisfaction"],
    audience: "employee",
    estimatedMinutes: 3,
    questions: [
      { order: 1, questionId: "ES_001", required: true }, // overall role satisfaction
      { order: 2, questionId: "ES_002", required: true }, // I have what I need
      { order: 3, questionId: "ES_003", required: true }, // speak up
      { order: 4, questionId: "ES_005", required: true }, // workload
      { order: 5, questionId: "ES_006" }, // open improvement
      { order: 6, questionId: "ES_008" }, // eNPS (optional but valuable)
    ],
    tags: ["pulse", "hr", "team"],
  },

  // 4) Product Review — Feature use + issues + improvements (standard)
  {
    id: "TPL_PRODUCT_REVIEW_STANDARD",
    name: {
      en: "Product review (standard)",
      de: "Produktbewertung (Standard)",
      fr: "Avis produit (standard)",
      it: "Recensione prodotto (standard)",
    },
    description: {
      en: "Collect product feedback on quality, usage, feature adoption, issues, and improvement suggestions.",
      de: "Produktfeedback zu Qualität, Nutzung, Features, Problemen und Verbesserungen.",
      fr: "Recueillir des retours sur la qualité, l’usage, les fonctionnalités, les problèmes et les améliorations.",
      it: "Raccogli feedback su qualità, utilizzo, funzionalità, problemi e miglioramenti.",
    },
    categories: ["product_review"],
    audience: "customer",
    estimatedMinutes: 4,
    questions: [
      { order: 1, questionId: "PR_001", required: true }, // quality rating
      { order: 2, questionId: "PR_002", required: true }, // usage frequency
      { order: 3, questionId: "PR_003" }, // features used
      { order: 4, questionId: "PR_004", required: true }, // issues yes/no
      { order: 5, questionId: "PR_005" }, // main benefit
      { order: 6, questionId: "PR_006" }, // what improve
      { order: 7, questionId: "PR_007" }, // upload optional
    ],
    tags: ["product", "feedback"],
  },

  // 5) Event Feedback — Experience + content + improvements (standard)
  {
    id: "TPL_EVENT_FEEDBACK_STANDARD",
    name: {
      en: "Event feedback (standard)",
      de: "Event-Feedback (Standard)",
      fr: "Retour événement (standard)",
      it: "Feedback evento (standard)",
    },
    description: {
      en: "Measure overall experience, content relevance, organization, and improvements for future events.",
      de: "Gesamterlebnis, Inhaltsrelevanz, Organisation und Verbesserungen für zukünftige Events.",
      fr: "Évaluer l’expérience globale, la pertinence du contenu, l’organisation et les améliorations.",
      it: "Misura esperienza complessiva, rilevanza contenuti, organizzazione e miglioramenti futuri.",
    },
    categories: ["events"],
    audience: "event_attendee",
    estimatedMinutes: 3,
    questions: [
      { order: 1, questionId: "EV_001", required: true }, // overall
      { order: 2, questionId: "EV_004", required: true }, // content relevance
      { order: 3, questionId: "EV_003", required: true }, // organization
      { order: 4, questionId: "EV_005" }, // most valuable
      { order: 5, questionId: "EV_006" }, // improvements
      { order: 6, questionId: "EV_007" }, // attend again
    ],
    tags: ["event", "post_event"],
  },

  // 6) Market Research — JTBD light (discovery template)
  {
    id: "TPL_MARKET_RESEARCH_DISCOVERY",
    name: {
      en: "Market research (discovery)",
      de: "Marktforschung (Discovery)",
      fr: "Étude de marché (découverte)",
      it: "Ricerca di mercato (discovery)",
    },
    description: {
      en: "A lightweight discovery template to understand needs, decision factors, priorities, and timing.",
      de: "Leichtes Discovery-Template: Bedürfnisse, Entscheidungsfaktoren, Prioritäten und Zeitplan.",
      fr: "Modèle léger pour comprendre les besoins, facteurs de décision, priorités et calendrier.",
      it: "Template leggero per capire bisogni, fattori decisionali, priorità e tempistiche.",
    },
    categories: ["market_research"],
    audience: "market",
    estimatedMinutes: 4,
    questions: [
      { order: 1, questionId: "MR_004", required: true }, // problem to solve (JTBD)
      { order: 2, questionId: "MR_001", required: true }, // usage frequency
      { order: 3, questionId: "MR_002", required: true }, // decision factors
      { order: 4, questionId: "MR_003" }, // ranking features
      { order: 5, questionId: "MR_005" }, // decision timing
      { order: 6, questionId: "MR_006" }, // role in decision
      { order: 7, questionId: "MR_008" }, // open input
    ],
    tags: ["market", "jtbd", "discovery"],
  },
];
