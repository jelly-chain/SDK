import type { SkillRegistry, SkillRegistryEntry } from './types.js';

export type SkillMatch = {
  skill: SkillRegistryEntry;
  score: number;
  reasons: string[];
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function matchSkill(registry: SkillRegistry, query: string): SkillMatch[] {
  const qTokens = tokenize(query);

  const scored = registry.skills.map((s) => {
    const hay = [s.displayName, s.description, s.entry, ...s.tags].join(' ');
    const hTokens = new Set(tokenize(hay));

    let hits = 0;
    for (const t of qTokens) if (hTokens.has(t)) hits++;

    const score = hits;
    const reasons: string[] = [];
    for (const t of qTokens) {
      if (hTokens.has(t)) reasons.push(`matched:${t}`);
    }

    return { skill: s, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored.filter((s) => s.score > 0);
  return best.length ? best : scored.slice(0, 1);
}
