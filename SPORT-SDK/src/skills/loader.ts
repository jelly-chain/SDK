import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { SkillRegistryEntry } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');

export async function readSkillMetadata(entry: SkillRegistryEntry): Promise<unknown | null> {
  const rel = path.posix.join(entry.entry, 'skill.metadata.json');
  const abs = path.join(SKILLS_DIR, rel);
  try {
    const raw = await fs.readFile(abs, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    // Missing metadata files should not crash skill loading.
    return null;
  }
}
