import type { SkillRegistryManifest } from './types.js';

// NOTE: we intentionally avoid external validation deps.

export function validateSkillRegistryManifest(input: unknown): asserts input is SkillRegistryManifest {
  if (!input || typeof input !== 'object') throw new Error('Skill registry must be an object');
  const obj = input as Record<string, unknown>;
  if (typeof obj.version !== 'string') throw new Error('Skill registry version must be a string');
  if (!Array.isArray(obj.skills)) throw new Error('Skill registry skills must be an array');
  for (const s of obj.skills) {
    if (!s || typeof s !== 'object') throw new Error('Skill entry must be an object');
    const e = s as Record<string, unknown>;
    for (const k of ['id', 'displayName', 'description', 'entry', 'tools', 'tags', 'version'] as const) {
      if (e[k] === undefined) throw new Error(`Skill entry missing ${k}`);
    }
    if (!Array.isArray(e.tools) || e.tools.length === 0) throw new Error('Skill entry tools must be a non-empty array');
    if (!Array.isArray(e.tags) || e.tags.length === 0) throw new Error('Skill entry tags must be a non-empty array');
  }
}
