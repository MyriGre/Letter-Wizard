export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "text_input"
  | "date_input"
  | "file_upload"
  | "ranking"
  | "rating";

export type QuestionCategory =
  | "customer_feedback"
  | "customer_satisfaction"
  | "employee_satisfaction"
  | "product_review"
  | "events"
  | "market_research";

export type LocalizedText = { en: string; de: string; fr: string; it: string };

export type LocalizedOptions = {
  en: string[];
  de: string[];
  fr: string[];
  it: string[];
};

export type RatingScale = {
  min: number;
  max: number;
  minLabel?: LocalizedText;
  maxLabel?: LocalizedText;
};

export type QuestionBankItem = {
  id: string;
  categories: QuestionCategory[];
  type: QuestionType;
  text: LocalizedText;
  options?: LocalizedOptions; // for single_choice, multiple_choice, ranking
  scale?: RatingScale; // for rating
  tags?: string[];
};

const SCALE_1_5_SAT: RatingScale = {
  min: 1,
  max: 5,
  minLabel: {
    en: "Very dissatisfied",
    de: "Sehr unzufrieden",
    fr: "Très insatisfait",
    it: "Molto insoddisfatto",
  },
  maxLabel: {
    en: "Very satisfied",
    de: "Sehr zufrieden",
    fr: "Très satisfait",
    it: "Molto soddisfatto",
  },
};

const SCALE_1_5_AGREE: RatingScale = {
  min: 1,
  max: 5,
  minLabel: {
    en: "Strongly disagree",
    de: "Stimme überhaupt nicht zu",
    fr: "Pas du tout d’accord",
    it: "Per niente d’accordo",
  },
  maxLabel: {
    en: "Strongly agree",
    de: "Stimme voll zu",
    fr: "Tout à fait d’accord",
    it: "Completamente d’accordo",
  },
};

export const QUESTION_BANK: QuestionBankItem[] = [
  // -----------------------------
  // Customer Feedback (8)
  // -----------------------------
  {
    id: "CF_001",
    categories: ["customer_feedback"],
    type: "text_input",
    text: {
      en: "What went well in your experience with us?",
      de: "Was ist in Ihrer Erfahrung mit uns gut gelaufen?",
      fr: "Qu’est-ce qui s’est bien passé dans votre expérience avec nous ?",
      it: "Che cosa è andato bene nella sua esperienza con noi?",
    },
    tags: ["open_feedback"],
  },
  {
    id: "CF_002",
    categories: ["customer_feedback"],
    type: "text_input",
    text: {
      en: "What could we improve?",
      de: "Was können wir verbessern?",
      fr: "Que pourrions-nous améliorer ?",
      it: "Che cosa potremmo migliorare?",
    },
    tags: ["improvement"],
  },
  {
    id: "CF_003",
    categories: ["customer_feedback"],
    type: "single_choice",
    text: {
      en: "How easy was it to get the help you needed?",
      de: "Wie einfach war es, die benötigte Hilfe zu erhalten?",
      fr: "Dans quelle mesure a-t-il été facile d’obtenir l’aide dont vous aviez besoin ?",
      it: "Quanto è stato facile ottenere l’aiuto necessario?",
    },
    options: {
      en: ["Very easy", "Easy", "Neither", "Difficult", "Very difficult"],
      de: ["Sehr einfach", "Einfach", "Weder noch", "Schwierig", "Sehr schwierig"],
      fr: ["Très facile", "Facile", "Ni facile ni difficile", "Difficile", "Très difficile"],
      it: ["Molto facile", "Facile", "Né facile né difficile", "Difficile", "Molto difficile"],
    },
    tags: ["support", "effort"],
  },
  {
    id: "CF_004",
    categories: ["customer_feedback"],
    type: "multiple_choice",
    text: {
      en: "Which areas should we focus on improving? (Select all that apply.)",
      de: "Welche Bereiche sollen wir bei Verbesserungen priorisieren? (Mehrfachauswahl.)",
      fr: "Sur quels domaines devrions-nous nous concentrer pour nous améliorer ? (Choix multiples.)",
      it: "Su quali aree dovremmo concentrarci per migliorare? (Selezioni tutte le opzioni pertinenti.)",
    },
    options: {
      en: ["Speed", "Quality", "Communication", "Pricing", "Ease of use", "Support"],
      de: ["Geschwindigkeit", "Qualität", "Kommunikation", "Preis", "Bedienbarkeit", "Support"],
      fr: ["Rapidité", "Qualité", "Communication", "Prix", "Facilité d’utilisation", "Support"],
      it: ["Velocità", "Qualità", "Comunicazione", "Prezzo", "Facilità d’uso", "Assistenza"],
    },
    tags: ["priorities"],
  },
  {
    id: "CF_005",
    categories: ["customer_feedback"],
    type: "rating",
    text: {
      en: "How satisfied are you with our communication?",
      de: "Wie zufrieden sind Sie mit unserer Kommunikation?",
      fr: "Dans quelle mesure êtes-vous satisfait de notre communication ?",
      it: "Quanto è soddisfatto della nostra comunicazione?",
    },
    scale: SCALE_1_5_SAT,
    tags: ["communication"],
  },
  {
    id: "CF_006",
    categories: ["customer_feedback"],
    type: "single_choice",
    text: {
      en: "Did you encounter any issues?",
      de: "Sind Probleme aufgetreten?",
      fr: "Avez-vous rencontré des problèmes ?",
      it: "Ha riscontrato problemi?",
    },
    options: {
      en: ["No", "Yes"],
      de: ["Nein", "Ja"],
      fr: ["Non", "Oui"],
      it: ["No", "Sì"],
    },
    tags: ["issues"],
  },
  {
    id: "CF_007",
    categories: ["customer_feedback"],
    type: "file_upload",
    text: {
      en: "If relevant, please upload a screenshot or file that helps explain your feedback.",
      de: "Falls relevant, laden Sie bitte einen Screenshot oder eine Datei hoch, die Ihr Feedback unterstützt.",
      fr: "Si pertinent, veuillez télécharger une capture d’écran ou un fichier qui aide à expliquer vos commentaires.",
      it: "Se pertinente, carichi uno screenshot o un file che aiuti a spiegare il suo feedback.",
    },
    tags: ["attachment"],
  },
  {
    id: "CF_008",
    categories: ["customer_feedback"],
    type: "rating",
    text: {
      en: "Overall, how satisfied are you with your experience?",
      de: "Wie zufrieden sind Sie insgesamt mit Ihrer Erfahrung?",
      fr: "Globalement, dans quelle mesure êtes-vous satisfait de votre expérience ?",
      it: "Nel complesso, quanto è soddisfatto della sua esperienza?",
    },
    scale: SCALE_1_5_SAT,
    tags: ["overall"],
  },

  // -----------------------------
  // Customer Satisfaction (8)
  // -----------------------------
  {
    id: "CS_001",
    categories: ["customer_satisfaction"],
    type: "rating",
    text: {
      en: "Overall, how satisfied are you with our service?",
      de: "Wie zufrieden sind Sie insgesamt mit unserem Service?",
      fr: "Globalement, dans quelle mesure êtes-vous satisfait de notre service ?",
      it: "Nel complesso, quanto è soddisfatto del nostro servizio?",
    },
    scale: SCALE_1_5_SAT,
    tags: ["csat"],
  },
  {
    id: "CS_002",
    categories: ["customer_satisfaction"],
    type: "rating",
    text: {
      en: "How likely are you to recommend us to others?",
      de: "Wie wahrscheinlich ist es, dass Sie uns anderen weiterempfehlen?",
      fr: "Quelle est la probabilité que vous nous recommandiez à d’autres ?",
      it: "Con quale probabilità ci raccomanderebbe ad altri?",
    },
    scale: {
      min: 0,
      max: 10,
      minLabel: { en: "Not likely", de: "Unwahrscheinlich", fr: "Peu probable", it: "Poco probabile" },
      maxLabel: { en: "Very likely", de: "Sehr wahrscheinlich", fr: "Très probable", it: "Molto probabile" },
    },
    tags: ["nps"],
  },
  {
    id: "CS_003",
    categories: ["customer_satisfaction"],
    type: "single_choice",
    text: {
      en: "How well did our service meet your expectations?",
      de: "Inwieweit hat unser Service Ihre Erwartungen erfüllt?",
      fr: "Dans quelle mesure notre service a-t-il répondu à vos attentes ?",
      it: "In che misura il nostro servizio ha soddisfatto le sue aspettative?",
    },
    options: {
      en: ["Exceeded expectations", "Met expectations", "Partly met expectations", "Did not meet expectations"],
      de: ["Übertroffen", "Erfüllt", "Teilweise erfüllt", "Nicht erfüllt"],
      fr: ["Au-delà des attentes", "Conforme aux attentes", "Partiellement conforme", "Pas conforme"],
      it: ["Ha superato le aspettative", "Ha soddisfatto le aspettative", "Le ha soddisfatte in parte", "Non le ha soddisfatte"],
    },
    tags: ["expectations"],
  },
  {
    id: "CS_004",
    categories: ["customer_satisfaction"],
    type: "multiple_choice",
    text: {
      en: "What influenced your satisfaction the most? (Select all that apply.)",
      de: "Was hat Ihre Zufriedenheit am stärksten beeinflusst? (Mehrfachauswahl.)",
      fr: "Qu’est-ce qui a le plus influencé votre satisfaction ? (Choix multiples.)",
      it: "Che cosa ha influenzato maggiormente la sua soddisfazione? (Selezioni tutte le opzioni pertinenti.)",
    },
    options: {
      en: ["Speed", "Quality", "Price", "Support", "Communication", "Ease of use"],
      de: ["Geschwindigkeit", "Qualität", "Preis", "Support", "Kommunikation", "Bedienbarkeit"],
      fr: ["Rapidité", "Qualité", "Prix", "Support", "Communication", "Facilité d’utilisation"],
      it: ["Velocità", "Qualità", "Prezzo", "Assistenza", "Comunicazione", "Facilità d’uso"],
    },
    tags: ["drivers"],
  },
  {
    id: "CS_005",
    categories: ["customer_satisfaction"],
    type: "text_input",
    text: {
      en: "What is one thing we could do to improve your experience?",
      de: "Was ist eine Sache, die wir tun könnten, um Ihre Erfahrung zu verbessern?",
      fr: "Quelle est une chose que nous pourrions faire pour améliorer votre expérience ?",
      it: "Qual è una cosa che potremmo fare per migliorare la sua esperienza?",
    },
    tags: ["improvement"],
  },
  {
    id: "CS_006",
    categories: ["customer_satisfaction"],
    type: "single_choice",
    text: {
      en: "How quickly were your requests handled?",
      de: "Wie schnell wurden Ihre Anliegen bearbeitet?",
      fr: "À quelle vitesse vos demandes ont-elles été traitées ?",
      it: "Quanto rapidamente sono state gestite le sue richieste?",
    },
    options: {
      en: ["Very quickly", "Quickly", "Acceptably", "Slowly", "Very slowly"],
      de: ["Sehr schnell", "Schnell", "Akzeptabel", "Langsam", "Sehr langsam"],
      fr: ["Très rapidement", "Rapidement", "De manière acceptable", "Lentement", "Très lentement"],
      it: ["Molto rapidamente", "Rapidamente", "In modo accettabile", "Lentamente", "Molto lentamente"],
    },
    tags: ["speed"],
  },
  {
    id: "CS_007",
    categories: ["customer_satisfaction"],
    type: "rating",
    text: {
      en: "How satisfied are you with the value for money?",
      de: "Wie zufrieden sind Sie mit dem Preis-Leistungs-Verhältnis?",
      fr: "Dans quelle mesure êtes-vous satisfait du rapport qualité-prix ?",
      it: "Quanto è soddisfatto del rapporto qualità-prezzo?",
    },
    scale: SCALE_1_5_SAT,
    tags: ["value"],
  },
  {
    id: "CS_008",
    categories: ["customer_satisfaction"],
    type: "text_input",
    text: {
      en: "Any additional comments you’d like to share?",
      de: "Möchten Sie noch etwas ergänzen?",
      fr: "Avez-vous d’autres commentaires à partager ?",
      it: "Vuole condividere ulteriori commenti?",
    },
    tags: ["open_feedback"],
  },

  // -----------------------------
  // Employee Satisfaction (8)
  // -----------------------------
  {
    id: "ES_001",
    categories: ["employee_satisfaction"],
    type: "rating",
    text: {
      en: "Overall, how satisfied are you with your current role?",
      de: "Wie zufrieden sind Sie insgesamt mit Ihrer aktuellen Rolle?",
      fr: "Globalement, dans quelle mesure êtes-vous satisfait de votre poste actuel ?",
      it: "Nel complesso, quanto è soddisfatto del suo ruolo attuale?",
    },
    scale: SCALE_1_5_SAT,
    tags: ["role"],
  },
  {
    id: "ES_002",
    categories: ["employee_satisfaction"],
    type: "rating",
    text: {
      en: "I have what I need to do my job well.",
      de: "Ich habe alles, was ich brauche, um meine Arbeit gut zu erledigen.",
      fr: "J’ai tout ce dont j’ai besoin pour bien faire mon travail.",
      it: "Ho ciò che mi serve per svolgere bene il mio lavoro.",
    },
    scale: SCALE_1_5_AGREE,
    tags: ["enablement"],
  },
  {
    id: "ES_003",
    categories: ["employee_satisfaction"],
    type: "rating",
    text: {
      en: "I feel comfortable speaking up and sharing ideas.",
      de: "Ich fühle mich wohl dabei, offen zu sprechen und Ideen zu teilen.",
      fr: "Je me sens à l’aise pour m’exprimer et partager des idées.",
      it: "Mi sento a mio agio nel parlare e condividere idee.",
    },
    scale: SCALE_1_5_AGREE,
    tags: ["psychological_safety"],
  },
  {
    id: "ES_004",
    categories: ["employee_satisfaction"],
    type: "multiple_choice",
    text: {
      en: "Which areas should we improve as an employer? (Select all that apply.)",
      de: "Welche Bereiche sollen wir als Arbeitgeber verbessern? (Mehrfachauswahl.)",
      fr: "Quels domaines devrions-nous améliorer en tant qu’employeur ? (Choix multiples.)",
      it: "Quali aree dovremmo migliorare come datore di lavoro? (Selezioni tutte le opzioni pertinenti.)",
    },
    options: {
      en: ["Workload", "Communication", "Career development", "Compensation & benefits", "Leadership", "Tools & processes"],
      de: ["Arbeitslast", "Kommunikation", "Weiterentwicklung", "Vergütung & Benefits", "Führung", "Tools & Prozesse"],
      fr: ["Charge de travail", "Communication", "Développement de carrière", "Rémunération & avantages", "Leadership", "Outils & processus"],
      it: ["Carico di lavoro", "Comunicazione", "Sviluppo di carriera", "Retribuzione e benefit", "Leadership", "Strumenti e processi"],
    },
    tags: ["improvement_areas"],
  },
  {
    id: "ES_005",
    categories: ["employee_satisfaction"],
    type: "single_choice",
    text: {
      en: "How manageable is your current workload?",
      de: "Wie gut ist Ihre aktuelle Arbeitslast zu bewältigen?",
      fr: "Dans quelle mesure votre charge de travail actuelle est-elle gérable ?",
      it: "Quanto è gestibile il suo attuale carico di lavoro?",
    },
    options: {
      en: ["Very manageable", "Manageable", "Sometimes too high", "Often too high", "Not manageable"],
      de: ["Sehr gut", "Gut", "Manchmal zu hoch", "Oft zu hoch", "Nicht zu bewältigen"],
      fr: ["Très gérable", "Gérable", "Parfois trop élevée", "Souvent trop élevée", "Pas gérable"],
      it: ["Molto gestibile", "Gestibile", "A volte troppo alto", "Spesso troppo alto", "Non gestibile"],
    },
    tags: ["workload"],
  },
  {
    id: "ES_006",
    categories: ["employee_satisfaction"],
    type: "text_input",
    text: {
      en: "What would improve your day-to-day work the most?",
      de: "Was würde Ihre tägliche Arbeit am meisten verbessern?",
      fr: "Qu’est-ce qui améliorerait le plus votre travail au quotidien ?",
      it: "Che cosa migliorerebbe maggiormente il suo lavoro quotidiano?",
    },
    tags: ["open_feedback"],
  },
  {
    id: "ES_007",
    categories: ["employee_satisfaction"],
    type: "ranking",
    text: {
      en: "Please rank these factors by importance to you.",
      de: "Bitte ordnen Sie diese Faktoren nach ihrer Wichtigkeit für Sie.",
      fr: "Veuillez classer ces facteurs par ordre d’importance pour vous.",
      it: "Classifichi questi fattori in ordine di importanza per lei.",
    },
    options: {
      en: ["Compensation", "Work-life balance", "Growth opportunities", "Team culture", "Meaningful work"],
      de: ["Vergütung", "Work-Life-Balance", "Entwicklungsmöglichkeiten", "Teamkultur", "Sinnvolle Arbeit"],
      fr: ["Rémunération", "Équilibre vie pro/vie perso", "Opportunités d’évolution", "Culture d’équipe", "Travail porteur de sens"],
      it: ["Retribuzione", "Equilibrio vita-lavoro", "Opportunità di crescita", "Cultura del team", "Lavoro significativo"],
    },
    tags: ["priorities"],
  },
  {
    id: "ES_008",
    categories: ["employee_satisfaction"],
    type: "rating",
    text: {
      en: "How likely are you to recommend our company as a place to work?",
      de: "Wie wahrscheinlich ist es, dass Sie unser Unternehmen als Arbeitgeber weiterempfehlen?",
      fr: "Quelle est la probabilité que vous recommandiez notre entreprise comme lieu de travail ?",
      it: "Con quale probabilità raccomanderebbe la nostra azienda come luogo di lavoro?",
    },
    scale: {
      min: 0,
      max: 10,
      minLabel: { en: "Not likely", de: "Unwahrscheinlich", fr: "Peu probable", it: "Poco probabile" },
      maxLabel: { en: "Very likely", de: "Sehr wahrscheinlich", fr: "Très probable", it: "Molto probabile" },
    },
    tags: ["eNPS"],
  },

  // -----------------------------
  // Product Review (8)
  // -----------------------------
  {
    id: "PR_001",
    categories: ["product_review"],
    type: "rating",
    text: {
      en: "How would you rate the overall quality of the product?",
      de: "Wie würden Sie die Gesamtqualität des Produkts bewerten?",
      fr: "Comment évalueriez-vous la qualité globale du produit ?",
      it: "Come valuterebbe la qualità complessiva del prodotto?",
    },
    scale: SCALE_1_5_SAT,
    tags: ["quality"],
  },
  {
    id: "PR_002",
    categories: ["product_review"],
    type: "single_choice",
    text: {
      en: "How often do you use the product?",
      de: "Wie häufig nutzen Sie das Produkt?",
      fr: "À quelle fréquence utilisez-vous le produit ?",
      it: "Con quale frequenza utilizza il prodotto?",
    },
    options: {
      en: ["Daily", "Weekly", "Monthly", "Less than monthly", "Not using currently"],
      de: ["Täglich", "Wöchentlich", "Monatlich", "Seltener", "Derzeit nicht"],
      fr: ["Quotidiennement", "Hebdomadairement", "Mensuellement", "Moins d’une fois par mois", "Je ne l’utilise pas actuellement"],
      it: ["Quotidianamente", "Settimanalmente", "Mensilmente", "Meno di una volta al mese", "Non lo uso attualmente"],
    },
    tags: ["usage"],
  },
  {
    id: "PR_003",
    categories: ["product_review"],
    type: "multiple_choice",
    text: {
      en: "Which features do you use most? (Select all that apply.)",
      de: "Welche Funktionen nutzen Sie am häufigsten? (Mehrfachauswahl.)",
      fr: "Quelles fonctionnalités utilisez-vous le plus ? (Choix multiples.)",
      it: "Quali funzionalità utilizza di più? (Selezioni tutte le opzioni pertinenti.)",
    },
    options: {
      en: ["Core feature", "Reporting/analytics", "Integrations", "Mobile use", "Notifications", "Other"],
      de: ["Kernfunktion", "Reports/Analytics", "Integrationen", "Mobile Nutzung", "Benachrichtigungen", "Andere"],
      fr: ["Fonction principale", "Rapports/analytics", "Intégrations", "Utilisation mobile", "Notifications", "Autre"],
      it: ["Funzionalità principale", "Report/analytics", "Integrazioni", "Uso mobile", "Notifiche", "Altro"],
    },
    tags: ["features"],
  },
  {
    id: "PR_004",
    categories: ["product_review"],
    type: "single_choice",
    text: {
      en: "Did you experience any problems with the product?",
      de: "Hatten Sie Probleme mit dem Produkt?",
      fr: "Avez-vous rencontré des problèmes avec le produit ?",
      it: "Ha riscontrato problemi con il prodotto?",
    },
    options: { en: ["No", "Yes"], de: ["Nein", "Ja"], fr: ["Non", "Oui"], it: ["No", "Sì"] },
    tags: ["issues"],
  },
  {
    id: "PR_005",
    categories: ["product_review"],
    type: "text_input",
    text: {
      en: "What is the main benefit you get from the product?",
      de: "Was ist der wichtigste Nutzen, den Sie aus dem Produkt ziehen?",
      fr: "Quel est le principal bénéfice que vous retirez du produit ?",
      it: "Qual è il principale beneficio che ottiene dal prodotto?",
    },
    tags: ["value"],
  },
  {
    id: "PR_006",
    categories: ["product_review"],
    type: "text_input",
    text: {
      en: "What should we improve in the product?",
      de: "Was sollen wir am Produkt verbessern?",
      fr: "Que devrions-nous améliorer dans le produit ?",
      it: "Che cosa dovremmo migliorare nel prodotto?",
    },
    tags: ["improvement"],
  },
  {
    id: "PR_007",
    categories: ["product_review"],
    type: "file_upload",
    text: {
      en: "If helpful, upload a screenshot or photo related to your feedback (optional).",
      de: "Wenn hilfreich, laden Sie einen Screenshot oder ein Foto zu Ihrem Feedback hoch (optional).",
      fr: "Si utile, téléchargez une capture d’écran ou une photo liée à vos commentaires (facultatif).",
      it: "Se utile, carichi uno screenshot o una foto relativa al suo feedback (facoltativo).",
    },
    tags: ["attachment"],
  },
  {
    id: "PR_008",
    categories: ["product_review"],
    type: "ranking",
    text: {
      en: "Please rank these aspects by importance to you.",
      de: "Bitte ordnen Sie diese Aspekte nach ihrer Wichtigkeit für Sie.",
      fr: "Veuillez classer ces aspects par ordre d’importance pour vous.",
      it: "Classifichi questi aspetti in ordine di importanza per lei.",
    },
    options: {
      en: ["Price", "Quality", "Ease of use", "Support", "Performance"],
      de: ["Preis", "Qualität", "Bedienbarkeit", "Support", "Performance"],
      fr: ["Prix", "Qualité", "Facilité d’utilisation", "Support", "Performance"],
      it: ["Prezzo", "Qualità", "Facilità d’uso", "Assistenza", "Prestazioni"],
    },
    tags: ["priorities"],
  },

  // -----------------------------
  // Events (8)
  // -----------------------------
  {
    id: "EV_001",
    categories: ["events"],
    type: "rating",
    text: {
      en: "How would you rate your overall experience at the event?",
      de: "Wie würden Sie Ihre Gesamterfahrung bei der Veranstaltung bewerten?",
      fr: "Comment évalueriez-vous votre expérience globale lors de l’événement ?",
      it: "Come valuterebbe la sua esperienza complessiva all’evento?",
    },
    scale: SCALE_1_5_SAT,
    tags: ["overall"],
  },
  {
    id: "EV_002",
    categories: ["events"],
    type: "date_input",
    text: {
      en: "On which date did you attend the event?",
      de: "An welchem Datum haben Sie an der Veranstaltung teilgenommen?",
      fr: "À quelle date avez-vous assisté à l’événement ?",
      it: "In quale data ha partecipato all’evento?",
    },
    tags: ["attendance"],
  },
  {
    id: "EV_003",
    categories: ["events"],
    type: "rating",
    text: {
      en: "How satisfied were you with the event organization?",
      de: "Wie zufrieden waren Sie mit der Organisation der Veranstaltung?",
      fr: "Dans quelle mesure avez-vous été satisfait de l’organisation de l’événement ?",
      it: "Quanto è rimasto soddisfatto dell’organizzazione dell’evento?",
    },
    scale: SCALE_1_5_SAT,
    tags: ["organization"],
  },
  {
    id: "EV_004",
    categories: ["events"],
    type: "rating",
    text: {
      en: "How relevant was the content for you?",
      de: "Wie relevant war der Inhalt für Sie?",
      fr: "Dans quelle mesure le contenu était-il pertinent pour vous ?",
      it: "Quanto è stato rilevante il contenuto per lei?",
    },
    scale: SCALE_1_5_SAT,
    tags: ["content"],
  },
  {
    id: "EV_005",
    categories: ["events"],
    type: "text_input",
    text: {
      en: "What was the most valuable part of the event for you?",
      de: "Was war der wertvollste Teil der Veranstaltung für Sie?",
      fr: "Quelle a été la partie la plus utile de l’événement pour vous ?",
      it: "Qual è stata la parte più preziosa dell’evento per lei?",
    },
    tags: ["value"],
  },
  {
    id: "EV_006",
    categories: ["events"],
    type: "text_input",
    text: {
      en: "What should we improve for future events?",
      de: "Was sollen wir bei zukünftigen Veranstaltungen verbessern?",
      fr: "Que devrions-nous améliorer pour les prochains événements ?",
      it: "Che cosa dovremmo migliorare per eventi futuri?",
    },
    tags: ["improvement"],
  },
  {
    id: "EV_007",
    categories: ["events"],
    type: "single_choice",
    text: {
      en: "Would you attend a similar event again?",
      de: "Würden Sie erneut an einer ähnlichen Veranstaltung teilnehmen?",
      fr: "Participeriez-vous à nouveau à un événement similaire ?",
      it: "Parteciperebbe di nuovo a un evento simile?",
    },
    options: {
      en: ["Yes", "No", "Not sure"],
      de: ["Ja", "Nein", "Unsicher"],
      fr: ["Oui", "Non", "Je ne sais pas"],
      it: ["Sì", "No", "Non sono sicuro/a"],
    },
    tags: ["return_intent"],
  },
  {
    id: "EV_008",
    categories: ["events"],
    type: "multiple_choice",
    text: {
      en: "Which parts did you participate in? (Select all that apply.)",
      de: "An welchen Teilen haben Sie teilgenommen? (Mehrfachauswahl.)",
      fr: "À quelles parties avez-vous participé ? (Choix multiples.)",
      it: "A quali parti ha partecipato? (Selezioni tutte le opzioni pertinenti.)",
    },
    options: {
      en: ["Keynote", "Workshop", "Networking", "Exhibition", "Q&A", "Other"],
      de: ["Keynote", "Workshop", "Networking", "Ausstellung", "Q&A", "Andere"],
      fr: ["Keynote", "Atelier", "Networking", "Exposition", "Questions/Réponses", "Autre"],
      it: ["Keynote", "Workshop", "Networking", "Esposizione", "Q&A", "Altro"],
    },
    tags: ["participation"],
  },

  // -----------------------------
  // Market Research (8)
  // -----------------------------
  {
    id: "MR_001",
    categories: ["market_research"],
    type: "single_choice",
    text: {
      en: "How often do you use products/services like this?",
      de: "Wie häufig nutzen Sie Produkte/Dienstleistungen dieser Art?",
      fr: "À quelle fréquence utilisez-vous des produits/services de ce type ?",
      it: "Con quale frequenza utilizza prodotti/servizi di questo tipo?",
    },
    options: {
      en: ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
      de: ["Täglich", "Wöchentlich", "Monatlich", "Selten", "Nie"],
      fr: ["Quotidiennement", "Hebdomadairement", "Mensuellement", "Rarement", "Jamais"],
      it: ["Quotidianamente", "Settimanalmente", "Mensilmente", "Raramente", "Mai"],
    },
    tags: ["usage_frequency"],
  },
  {
    id: "MR_002",
    categories: ["market_research"],
    type: "multiple_choice",
    text: {
      en: "Which factors matter most when choosing a provider? (Select all that apply.)",
      de: "Welche Faktoren sind bei der Wahl eines Anbieters am wichtigsten? (Mehrfachauswahl.)",
      fr: "Quels facteurs comptent le plus lors du choix d’un prestataire ? (Choix multiples.)",
      it: "Quali fattori contano di più nella scelta di un fornitore? (Selezioni tutte le opzioni pertinenti.)",
    },
    options: {
      en: ["Price", "Quality", "Trust", "Speed", "Features", "Customer support"],
      de: ["Preis", "Qualität", "Vertrauen", "Geschwindigkeit", "Funktionen", "Kundensupport"],
      fr: ["Prix", "Qualité", "Confiance", "Rapidité", "Fonctionnalités", "Support client"],
      it: ["Prezzo", "Qualità", "Fiducia", "Velocità", "Funzionalità", "Assistenza clienti"],
    },
    tags: ["decision_factors"],
  },
  {
    id: "MR_003",
    categories: ["market_research"],
    type: "ranking",
    text: {
      en: "Please rank these features by importance to you.",
      de: "Bitte ordnen Sie diese Funktionen nach ihrer Wichtigkeit für Sie.",
      fr: "Veuillez classer ces fonctionnalités par ordre d’importance pour vous.",
      it: "Classifichi queste funzionalità in ordine di importanza per lei.",
    },
    options: {
      en: ["Price", "Ease of use", "Performance", "Security", "Integrations"],
      de: ["Preis", "Bedienbarkeit", "Performance", "Sicherheit", "Integrationen"],
      fr: ["Prix", "Facilité d’utilisation", "Performance", "Sécurité", "Intégrations"],
      it: ["Prezzo", "Facilità d’uso", "Prestazioni", "Sicurezza", "Integrazioni"],
    },
    tags: ["feature_priority"],
  },
  {
    id: "MR_004",
    categories: ["market_research"],
    type: "text_input",
    text: {
      en: "What problem are you trying to solve with a solution like this?",
      de: "Welches Problem möchten Sie mit einer Lösung wie dieser lösen?",
      fr: "Quel problème essayez-vous de résoudre avec une solution comme celle-ci ?",
      it: "Quale problema sta cercando di risolvere con una soluzione di questo tipo?",
    },
    tags: ["jtbd"],
  },
  {
    id: "MR_005",
    categories: ["market_research"],
    type: "single_choice",
    text: {
      en: "How soon are you planning to make a decision?",
      de: "Wie bald planen Sie, eine Entscheidung zu treffen?",
      fr: "Dans quel délai prévoyez-vous de prendre une décision ?",
      it: "Quanto presto prevede di prendere una decisione?",
    },
    options: {
      en: ["Immediately", "Within 1 month", "1–3 months", "More than 3 months", "Not sure"],
      de: ["Sofort", "Innerhalb 1 Monat", "1–3 Monate", "Mehr als 3 Monate", "Unsicher"],
      fr: ["Immédiatement", "D’ici 1 mois", "1 à 3 mois", "Plus de 3 mois", "Je ne sais pas"],
      it: ["Subito", "Entro 1 mese", "1–3 mesi", "Più di 3 mesi", "Non sono sicuro/a"],
    },
    tags: ["timing"],
  },
  {
    id: "MR_006",
    categories: ["market_research"],
    type: "single_choice",
    text: {
      en: "What is your role related to this decision?",
      de: "Welche Rolle haben Sie in Bezug auf diese Entscheidung?",
      fr: "Quel est votre rôle par rapport à cette décision ?",
      it: "Qual è il suo ruolo rispetto a questa decisione?",
    },
    options: {
      en: ["Decision maker", "Influencer", "User", "Researching", "Other"],
      de: ["Entscheider/in", "Beeinflusser/in", "Nutzer/in", "Recherche", "Andere"],
      fr: ["Décideur", "Influenceur", "Utilisateur", "Recherche", "Autre"],
      it: ["Decisore", "Influencer", "Utente", "Ricerca", "Altro"],
    },
    tags: ["role"],
  },
  {
    id: "MR_007",
    categories: ["market_research"],
    type: "rating",
    text: {
      en: "How important is security/privacy for your decision?",
      de: "Wie wichtig sind Sicherheit/Datenschutz für Ihre Entscheidung?",
      fr: "Quelle importance la sécurité/confidentialité a-t-elle dans votre décision ?",
      it: "Quanto sono importanti sicurezza/privacy nella sua decisione?",
    },
    scale: {
      min: 1,
      max: 5,
      minLabel: { en: "Not important", de: "Unwichtig", fr: "Pas important", it: "Non importante" },
      maxLabel: { en: "Very important", de: "Sehr wichtig", fr: "Très important", it: "Molto importante" },
    },
    tags: ["security"],
  },
  {
    id: "MR_008",
    categories: ["market_research"],
    type: "text_input",
    text: {
      en: "Any additional input you’d like to share?",
      de: "Gibt es noch etwas, das Sie ergänzen möchten?",
      fr: "Avez-vous d’autres éléments à partager ?",
      it: "Vuole aggiungere altro?",
    },
    tags: ["open_feedback"],
  },
];
