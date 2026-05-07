export type SkillToolName = string;

export interface SkillRegistryEntry {
  id: string;
  displayName: string;
  description: string;
  entry: string;
  tools: SkillToolName[];
  tags: string[];
  version: string;
}

export interface SkillRegistryManifest {
  $schema?: string;
  version: string;
  skills: SkillRegistryEntry[];
}

export interface SkillRegistry {
  version: string;
  skills: SkillRegistryEntry[];
}
