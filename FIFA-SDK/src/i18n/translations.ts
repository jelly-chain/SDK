/**
 * Translation registry for common football terms across languages.
 */

export type SupportedLanguage =
  | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'nl' | 'ru'
  | 'zh' | 'ja' | 'ko' | 'ar' | 'tr' | 'pl';

export interface TranslationEntry {
  key: string;
  context?: string;
  translations: Record<SupportedLanguage, string>;
}

export const FOOTBALL_TERMS: TranslationEntry[] = [
  {
    key: 'goal',
    translations: {
      en: 'goal', es: 'gol', fr: 'but', de: 'Tor', pt: 'gol', it: 'gol', nl: 'doelpunt',
      ru: 'гол', zh: '进球', ja: 'ゴール', ko: '골', ar: 'هدف', tr: 'gol', pl: 'gol',
    },
  },
  {
    key: 'penalty',
    context: 'penalty kick',
    translations: {
      en: 'penalty', es: 'penalti', fr: 'penalty', de: 'Elfmeter', pt: 'pênalti', it: 'rigore', nl: 'strafschop',
      ru: 'пенальти', zh: '点球', ja: 'ペナルティ', ko: '페널티', ar: 'ركلة جزاء', tr: 'penaltı', pl: 'rzut karny',
    },
  },
  {
    key: 'red_card',
    translations: {
      en: 'red card', es: 'tarjeta roja', fr: 'carton rouge', de: 'Rote Karte', pt: 'cartão vermelho', it: 'cartellino rosso', nl: 'rode kaart',
      ru: 'красная карточка', zh: '红牌', ja: 'レッドカード', ko: '레드카드', ar: 'بطاقة حمراء', tr: 'kırmızı kart', pl: 'czerwona kartka',
    },
  },
  {
    key: 'yellow_card',
    translations: {
      en: 'yellow card', es: 'tarjeta amarilla', fr: 'carton jaune', de: 'Gelbe Karte', pt: 'cartão amarelo', it: 'cartellino giallo', nl: 'gele kaart',
      ru: 'жёлтая карточка', zh: '黄牌', ja: 'イエローカード', ko: '옐로카드', ar: 'بطاقة صفراء', tr: 'sarı kart', pl: 'żółta kartka',
    },
  },
  {
    key: 'own_goal',
    translations: {
      en: 'own goal', es: 'autogol', fr: 'but contre son camp', de: 'Eigentor', pt: 'gol contra', it: 'autogoal', nl: 'eigen doelpunt',
      ru: 'автогол', zh: '乌龙球', ja: 'オウンゴール', ko: '자책골', ar: 'هدف عكسي', tr: 'kendi kalesine gol', pl: 'gol samobójczy',
    },
  },
  {
    key: 'substitution',
    translations: {
      en: 'substitution', es: 'sustitución', fr: 'substitution', de: 'Auswechslung', pt: 'substituição', it: 'sostituzione', nl: 'wissel',
      ru: 'замена', zh: '换人', ja: '交代', ko: '교체', ar: 'تبديل', tr: 'değişiklik', pl: 'zmiana',
    },
  },
  {
    key: 'offside',
    translations: {
      en: 'offside', es: 'fuera de juego', fr: 'hors-jeu', de: 'Abseits', pt: 'impedimento', it: 'fuorigioco', nl: 'buitenspel',
      ru: 'вне игры', zh: '越位', ja: 'オフサイド', ko: '오프사이드', ar: 'تسلل', tr: 'ofsayt', pl: 'spalony',
    },
  },
  {
    key: 'corner_kick',
    translations: {
      en: 'corner kick', es: 'córner', fr: 'corner', de: 'Eckstoß', pt: 'escanteio', it: 'calcio d\'angolo', nl: 'hoekschop',
      ru: 'угловой', zh: '角球', ja: 'コーナーキック', ko: '코너킥', ar: 'ركلة ركنية', tr: 'korner', pl: 'rzut rożny',
    },
  },
  {
    key: 'free_kick',
    translations: {
      en: 'free kick', es: 'tiro libre', fr: 'coup franc', de: 'Freistoß', pt: 'cobrança de falta', it: 'calcio di punizione', nl: 'vrije trap',
      ru: 'штрафной удар', zh: '任意球', ja: 'フリーキック', ko: '프리킥', ar: 'ركلة حرة', tr: 'serbest vuruş', pl: 'rzut wolny',
    },
  },
  {
    key: 'extra_time',
    translations: {
      en: 'extra time', es: 'tiempo extra', fr: 'prolongation', de: 'Verlängerung', pt: 'prorrogação', it: 'tempi supplementari', nl: 'verlenging',
      ru: 'дополнительное время', zh: '加时赛', ja: '延長戦', ko: '연장전', ar: 'وقت إضافي', tr: 'uzatma', pl: 'dogrywka',
    },
  },
  {
    key: 'penalty_shootout',
    translations: {
      en: 'penalty shootout', es: 'tanda de penaltis', fr: 'séance de tirs au but', de: 'Elfmeterschießen', pt: 'disputa de pênaltis', it: 'calci di rigore', nl: 'strafschoppenreeks',
      ru: 'серия пенальти', zh: '点球大战', ja: 'PK戦', ko: '승부차기', ar: 'ركلات الترجيح', tr: 'penaltı atışları', pl: 'rzuty karne',
    },
  },
  {
    key: 'group_stage',
    translations: {
      en: 'group stage', es: 'fase de grupos', fr: 'phase de groupes', de: 'Gruppenphase', pt: 'fase de grupos', it: 'fase a gironi', nl: 'groepsfase',
      ru: 'групповой этап', zh: '小组赛', ja: 'グループステージ', ko: '조별리그', ar: 'مرحلة المجموعات', tr: 'grup aşaması', pl: 'faza grupowa',
    },
  },
  {
    key: 'knockout_stage',
    translations: {
      en: 'knockout stage', es: 'fase eliminatoria', fr: 'phase à élimination directe', de: 'K.o.-Runde', pt: 'fase eliminatória', it: 'fase a eliminazione diretta', nl: 'knock-outfase',
      ru: 'стадия плей-офф', zh: '淘汰赛', ja: 'ノックアウトステージ', ko: '토너먼트', ar: 'مرحلة خروج المغلوب', tr: 'eleme aşaması', pl: 'faza pucharowa',
    },
  },
  {
    key: 'world_cup',
    translations: {
      en: 'World Cup', es: 'Copa del Mundo', fr: 'Coupe du Monde', de: 'Weltmeisterschaft', pt: 'Copa do Mundo', it: 'Coppa del Mondo', nl: 'Wereldbeker',
      ru: 'Чемпионат мира', zh: '世界杯', ja: 'ワールドカップ', ko: '월드컵', ar: 'كأس العالم', tr: 'Dünya Kupası', pl: 'Mistrzostwa Świata',
    },
  },
  {
    key: 'qualifier',
    translations: {
      en: 'qualifier', es: 'clasificación', fr: 'qualifier', de: 'Qualifikation', pt: 'eliminatória', it: 'qualificazione', nl: 'kwalificatie',
      ru: 'квалификация', zh: '预选赛', ja: '予選', ko: '예선', ar: 'تصفيات', tr: 'eleme', pl: 'eliminacje',
    },
  },
  {
    key: 'semifinal',
    translations: {
      en: 'semifinal', es: 'semifinal', fr: 'demi-finale', de: 'Halbfinale', pt: 'semifinal', it: 'semifinale', nl: 'halve finale',
      ru: 'полуфинал', zh: '半决赛', ja: '準決勝', ko: '준결승', ar: 'نصف النهائي', tr: 'yarı final', pl: 'półfinał',
    },
  },
  {
    key: 'final',
    translations: {
      en: 'final', es: 'final', fr: 'finale', de: 'Finale', pt: 'final', it: 'finale', nl: 'finale',
      ru: 'финал', zh: '决赛', ja: '決勝', ko: '결승', ar: 'النهائي', tr: 'final', pl: 'finał',
    },
  },
];

export class FootballTermTranslator {
  private termMap: Map<string, TranslationEntry>;

  constructor() {
    this.termMap = new Map();
    for (const term of FOOTBALL_TERMS) {
      this.termMap.set(term.key, term);
    }
  }

  /** Translate a football term */
  translate(termKey: string, targetLang: SupportedLanguage, sourceLang: SupportedLanguage = 'en'): string | null {
    const entry = this.termMap.get(termKey);
    return entry?.translations[targetLang] ?? null;
  }

  /** Get all translations for a term */
  getAllTranslations(termKey: string): Record<SupportedLanguage, string> | null {
    return this.termMap.get(termKey)?.translations ?? null;
  }

  /** Find term key from a translated word */
  reverseLookup(word: string, lang: SupportedLanguage): string | null {
    const lower = word.toLowerCase();
    for (const [key, entry] of this.termMap) {
      if (entry.translations[lang]?.toLowerCase() === lower) return key;
    }
    return null;
  }

  /** List all available term keys */
  listKeys(): string[] {
    return Array.from(this.termMap.keys());
  }
}
