import type { SkillMatch } from './matcher.js';
import type { SkillRegistryEntry } from './types.js';

export type SkillExecutionContext = {
  userQuery: string;
  matched: SkillMatch[];
  primary: SkillRegistryEntry;
};

export function buildSkillContext(userQuery: string, matches: SkillMatch[]): SkillExecutionContext {
  const primary = matches[0]?.skill ?? {
    id: 'unknown',
    displayName: 'Unknown',
    description: 'Unknown',
    entry: 'skills/unknown',
    tools: [],
    tags: [],
    version: '0.0.0',
  };

  return { userQuery, matched: matches, primary };
}
