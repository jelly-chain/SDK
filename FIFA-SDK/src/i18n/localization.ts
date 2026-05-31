/**
 * Multi-language Support for Agent Responses
 * FIFA is global — agents should respond in user's language.
 */

export type SupportedLanguage =
  | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'nl' | 'ru'
  | 'zh' | 'ja' | 'ko' | 'ar' | 'tr' | 'pl' | 'sv' | 'da'
  | 'no' | 'fi' | 'cs' | 'ro' | 'hu' | 'hr' | 'uk' | 'id';

export interface TranslationEntry {
  key: string;
  translations: Record<SupportedLanguage, string>;
}

export interface LocalizedResponse {
  language: SupportedLanguage;
  title: string;
  body: string;
  confidence: string;
  disclaimer: string;
  riskFlags: string[];
  explanation: string;
}

const TEAM_NAMES: Record<string, Record<SupportedLanguage, string>> = {
  'brazil': {
    en: 'Brazil', es: 'Brasil', fr: 'Brésil', de: 'Brasilien', pt: 'Brasil',
    it: 'Brasile', nl: 'Brazilië', ru: 'Бразилия', zh: '巴西', ja: 'ブラジル',
    ko: '브라질', ar: 'البرازيل', tr: 'Brezilya', pl: 'Brazylia', sv: 'Brasilien',
    da: 'Brasilien', no: 'Brasil', fi: 'Brasilia', cs: 'Brazílie', ro: 'Brazilia',
    hu: 'Brazília', hr: 'Brazil', uk: 'Бразилія', id: 'Brasil',
  },
  'germany': {
    en: 'Germany', es: 'Alemania', fr: 'Allemagne', de: 'Deutschland', pt: 'Alemanha',
    it: 'Germania', nl: 'Duitsland', ru: 'Германия', zh: '德国', ja: 'ドイツ',
    ko: '독일', ar: 'ألمانيا', tr: 'Almanya', pl: 'Niemcy', sv: 'Tyskland',
    da: 'Tyskland', no: 'Tyskland', fi: 'Saksa', cs: 'Německo', ro: 'Germania',
    hu: 'Németország', hr: 'Njemačka', uk: 'Німеччина', id: 'Jerman',
  },
  'france': {
    en: 'France', es: 'Francia', fr: 'France', de: 'Frankreich', pt: 'França',
    it: 'Francia', nl: 'Frankrijk', ru: 'Франция', zh: '法国', ja: 'フランス',
    ko: '프랑스', ar: 'فرنسا', tr: 'Fransa', pl: 'Francja', sv: 'Frankrike',
    da: 'Frankrig', no: 'Frankrike', fi: 'Ranska', cs: 'Francie', ro: 'Franța',
    hu: 'Franciaország', hr: 'Francuska', uk: 'Франція', id: 'Prancis',
  },
  'spain': {
    en: 'Spain', es: 'España', fr: 'Espagne', de: 'Spanien', pt: 'Espanha',
    it: 'Spagna', nl: 'Spanje', ru: 'Испания', zh: '西班牙', ja: 'スペイン',
    ko: '스페인', ar: 'إسبانيا', tr: 'İspanya', pl: 'Hiszpania', sv: 'Spanien',
    da: 'Spanien', no: 'Spanien', fi: 'Espanja', cs: 'Španělsko', ro: 'Spania',
    hu: 'Spanyolország', hr: 'Španjolska', uk: 'Іспанія', id: 'Spanyol',
  },
  'argentina': {
    en: 'Argentina', es: 'Argentina', fr: 'Argentine', de: 'Argentinien', pt: 'Argentina',
    it: 'Argentina', nl: 'Argentinië', ru: 'Аргентина', zh: '阿根廷', ja: 'アルゼンチン',
    ko: '아르헨티나', ar: 'الأرجنتين', tr: 'Arjantin', pl: 'Argentyna', sv: 'Argentina',
    da: 'Argentina', no: 'Argentina', fi: 'Argentiina', cs: 'Argentina', ro: 'Argentina',
    hu: 'Argentína', hr: 'Argentina', uk: 'Аргентина', id: 'Argentina',
  },
};

const UI_STRINGS: Record<string, Record<SupportedLanguage, string>> = {
  'prediction_title': {
    en: 'Prediction', es: 'Predicción', fr: 'Prédiction', de: 'Vorhersage', pt: 'Previsão',
    it: 'Previsione', nl: 'Voorspelling', ru: 'Прогноз', zh: '预测', ja: '予測',
    ko: '예측', ar: 'التوقع', tr: 'Tahmin', pl: 'Prognoza', sv: 'Förutsägelse',
    da: 'Forudsigelse', no: 'Spådom', fi: 'Ennuste', cs: 'Předpověď', ro: 'Predicție',
    hu: 'Előrejelzés', hr: 'Predviđanje', uk: 'Прогноз', id: 'Prediksi',
  },
  'confidence_label': {
    en: 'Confidence', es: 'Confianza', fr: 'Confiance', de: 'Konfidenz', pt: 'Confiança',
    it: 'Confidenza', nl: 'Vertrouwen', ru: 'Уверенность', zh: '置信度', ja: '確信度',
    ko: '신뢰도', ar: 'الثقة', tr: 'Güven', pl: 'Pewność', sv: 'Förtroende',
    da: 'Tillid', no: 'Tillit', fi: 'Luottamus', cs: 'Důvěra', ro: 'Încredere',
    hu: 'Bizalom', hr: 'Pouzdanje', uk: 'Впевненість', id: 'Kepercayaan',
  },
  'disclaimer': {
    en: 'This is model output, not financial advice. Verify independently.',
    es: 'Esto es resultado del modelo, no consejo financiero. Verifique de forma independiente.',
    fr: "Ceci est un résultat de modèle, pas un conseil financier. Vérifiez indépendamment.",
    de: 'Dies ist eine Modellausgabe, keine Anlageberatung. Überprüfen Sie eigenständig.',
    pt: 'Este é resultado do modelo, não aconselhamento financeiro. Verifique independentemente.',
    it: 'Questo è un output del modello, non un consiglio finanziario. Verifica indipendentemente.',
    nl: 'Dit is modeluitvoer, geen financieel advies. Verifieer onafhankelijk.',
    ru: 'Это результат модели, а не финансовый совет. Проверьте самостоятельно.',
    zh: '这是模型输出，不是财务建议。请独立验证。',
    ja: 'これはモデル出力であり、金融アドバイスではありません。独自に検証してください。',
    ko: '이것은 모델 출력이며 재정 조언이 아닙니다. 독립적으로 확인하세요.',
    ar: 'هذا نموذج إخراجي وليس نصيحة مالية. تحقق بشكل مستقل.',
    tr: 'Bu model çıktısıdır, finansal tavsiye değildir. Bağımsız olarak doğrulayın.',
    pl: 'To jest wynik modelu, nie porada finansowa. Zweryfikuj niezależnie.',
    sv: 'Detta är modellutdata, inte finansiell rådgivning.Verifiera oberoende.',
    da: 'Dette er modeloutput, ikke finansiel rådgivning. Verificer uafhængigt.',
    no: 'Dette er modelldata, ikke finansiell rådgivning. Verifiser uavhengig.',
    fi: 'Tämä on mallin tulos, ei taloudellista neuvontaa. Vahvista itsenäisesti.',
    cs: 'Toto je výstup modelu, ne finanční poradenství. Ověřte nezávisle.',
    ro: 'Acesta este un rezultat al modelului, nu un sfat financiar. Verificați independent.',
    hu: 'Ez modell kimenet, nem pénzügyi tanács. Ellenőrizze függetlenül.',
    hr: 'Ovo je izlaz modela, ne financijski savjet. Provjerite neovisno.',
    uk: 'Це результат моделі, а не фінансова порада. Перевірте самостійно.',
    id: 'Ini adalah output model, bukan saran keuangan. Verifikasi secara independen.',
  },
  'risk_flag_injury': {
    en: 'Injury concern', es: 'Preocupación por lesiones', fr: 'Préoccupation blessure',
    de: 'Verletzungsbedenken', pt: 'Preocupação com lesão', it: 'Preoccupazione infortuni',
    nl: 'Blessure zorg', ru: 'Проблема с травмами', zh: '伤病担忧', ja: '怪我の懸念',
    ko: '부상 우려', ar: 'إصابة مقلقة', tr: 'Sakatlık endişesi', pl: 'Obawy o kontuzje',
    sv: 'Skadefråga', da: 'Skade bekymring', no: 'Skade bekymring', fi: 'Loukkaantumishuoli',
    cs: 'Obavy ze zranění', ro: 'Îngrijorare accidentare', hu: 'Sérülési aggodalom',
    hr: 'Zabrinutost zbog ozljede', uk: 'Занепокоєння щодо травми', id: 'Kekhawatiran cedera',
  },
};

export class LocalizationEngine {
  private defaultLanguage: SupportedLanguage;

  constructor(defaultLanguage: SupportedLanguage = 'en') {
    this.defaultLanguage = defaultLanguage;
  }

  /** Get team name in specified language */
  getTeamName(teamKey: string, lang?: SupportedLanguage): string {
    const language = lang ?? this.defaultLanguage;
    const names = TEAM_NAMES[teamKey.toLowerCase()];
    return names?.[language] ?? names?.['en'] ?? teamKey;
  }

  /** Get UI string in specified language */
  getString(key: string, lang?: SupportedLanguage): string {
    const language = lang ?? this.defaultLanguage;
    return UI_STRINGS[key]?.[language] ?? UI_STRINGS[key]?.['en'] ?? key;
  }

  /** Generate a localized prediction response */
  localize(params: {
    language: SupportedLanguage;
    prediction: string;
    confidence: number;
    explanation: string;
    riskFlags: string[];
  }): LocalizedResponse {
    const { language, prediction, confidence, explanation, riskFlags } = params;

    const confidenceLabel = this.getString('confidence_label', language);
    const disclaimer = this.getString('disclaimer', language);

    const localizedRiskFlags = riskFlags.map((flag) => {
      const key = `risk_flag_${flag}`;
      return this.getString(key, language) || flag;
    });

    const confidenceStr = confidence >= 0.8 ? 'Very High' :
      confidence >= 0.65 ? 'High' :
      confidence >= 0.5 ? 'Medium' :
      confidence >= 0.35 ? 'Low' : 'Uncertain';

    return {
      language,
      title: `${this.getString('prediction_title', language)}: ${prediction}`,
      body: prediction,
      confidence: `${confidenceLabel}: ${confidenceStr} (${(confidence * 100).toFixed(0)}%)`,
      disclaimer,
      riskFlags: localizedRiskFlags,
      explanation,
    };
  }

  /** Detect language from text (simple heuristic) */
  detectLanguage(text: string): SupportedLanguage {
    const lower = text.toLowerCase();

    // Simple keyword detection
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';

    if (/\b(el|la|los|las|es|son|está|hay)\b/.test(lower)) return 'es';
    if (/\b(le|la|les|des|est|sont|c'est)\b/.test(lower)) return 'fr';
    if (/\b(der|die|das|ist|sind|ein|eine)\b/.test(lower)) return 'de';
    if (/\b(os|as|um|uma|são|está|tem)\b/.test(lower)) return 'pt';
    if (/\b(il|lo|la|gli|le|è|sono)\b/.test(lower)) return 'it';
    if (/\b(de|het|een|is|zijn|van)\b/.test(lower)) return 'nl';
    if (/\b(ve|bir|bu|olan|için)\b/.test(lower)) return 'tr';
    if (/\b(jest|są|nie|się|na)\b/.test(lower)) return 'pl';

    return 'en'; // Default
  }

  /** Get all supported languages */
  getSupportedLanguages(): SupportedLanguage[] {
    return ['en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ru',
            'zh', 'ja', 'ko', 'ar', 'tr', 'pl', 'sv', 'da',
            'no', 'fi', 'cs', 'ro', 'hu', 'hr', 'uk', 'id'];
  }
}
