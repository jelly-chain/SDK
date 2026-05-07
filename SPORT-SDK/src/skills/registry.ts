import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SkillRegistry, SkillRegistryEntry, SkillRegistryManifest } from './types.js';
import { validateSkillRegistryManifest } from './validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');

function resolveSkillsFile(fileName: string): string {
  return path.join(SKILLS_DIR, fileName);
}

export async function loadSkillRegistry(manifestPath?: string): Promise<SkillRegistry> {
  const p = manifestPath ? path.resolve(manifestPath) : resolveSkillsFile('skill-registry.json');
  const raw = await fs.readFile(p, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  validateSkillRegistryManifest(parsed);

  const manifest = parsed as SkillRegistryManifest;
  return {
    version: manifest.version,
    skills: manifest.skills,
  };
}

export function getSkillEntry(registry: SkillRegistry, id: string): SkillRegistryEntry | undefined {
  return registry.skills.find((s) => s.id === id);
}

export function listSkillIds(registry: SkillRegistry): string[] {
  return registry.skills.map((s) => s.id);
}
