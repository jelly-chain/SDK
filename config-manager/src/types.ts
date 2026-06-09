export interface ConfigSchema { [key: string]: { type: "string" | "number" | "boolean" | "array" | "object"; required?: boolean; default?: unknown; env?: string; }; }
export interface LoadedConfig { [key: string]: unknown; }
