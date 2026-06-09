/** Convert a string to a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Normalize a team/player name for matching. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract a group code (A-H) from text. */
export function groupCodeFromText(text: string): string | null {
  const match = text.match(/group\s*([A-Ha-h])/i);
  return match ? match[1].toUpperCase() : null;
}

/** Extract a season year from text. */
export function seasonYearFromText(text: string): number | null {
  const match = text.match(/\b(201[4-9]|202[0-9])\b/);
  if (match) {
    const year = parseInt(match[1]);
    if (year === 2018 || year === 2022 || year === 2026) return year;
  }
  return null;
}

/** Extract team names from a match description. */
export function extractTeamsFromText(text: string): string[] {
  const vsPatterns = ['vs', 'versus', 'v', '-', '—'];
  for (const pattern of vsPatterns) {
    const parts = text.split(new RegExp(`\\s+${pattern}\\s+`, 'i'));
    if (parts.length === 2) return [parts[0].trim(), parts[1].trim()];
  }
  return [];
}

/** Match type detection from text. */
export function detectMarketType(text: string): string | null {
  const lower = text.toLowerCase();
  if (/will\s+\w+\s+win\s+(the\s+)?(match|game|tie)/i.test(lower)) return 'match_winner';
  if (/group\s+[a-h]\s+winner/i.test(lower)) return 'group_winner';
  if (/qualif/i.test(lower)) return 'qualification';
  if (/win\s+(the\s+)?(world\s+)?cup|tournament\s+winner/i.test(lower)) return 'tournament_winner';
  if (/top\s+scorer|golden\s+boot/i.test(lower)) return 'top_scorer';
  return null;
}

/** Truncate text to a maximum length. */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/** Title case a string. */
export function titleCase(text: string): string {
  return text.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

/** Compare two names for fuzzy equality. */
export function namesMatch(a: string, b: string, threshold = 0.8): boolean {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  if (normA === normB) return true;
  const longer = Math.max(normA.length, normB.length);
  const distance = levenshteinDistance(normA, normB);
  return (longer - distance) / longer >= threshold;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}
