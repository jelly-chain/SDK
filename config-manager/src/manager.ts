/**
 * ConfigManager — hierarchical configuration management with env vars,
 * secrets, validation, hot-reload, and multi-environment support
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { SdkError, ErrorCode } from "@jellychain/sdk-core";

export type ConfigValue = string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };
export type ConfigSchema = Record<string, { type: string; required?: boolean; default?: ConfigValue; description?: string; sensitive?: boolean; validator?: (value: ConfigValue) => boolean }>;

export class ConfigManager extends BaseSDK {
  private config: Map<string, ConfigValue> = new Map();
  private schema: ConfigSchema = {};
  private envPrefix = "JELLY_";
  private secrets: Map<string, string> = new Map();

  constructor(config?: BaseSDKConfig & { envPrefix?: string; schema?: ConfigSchema }) {
    super(config, "ConfigManager");
    if (config?.envPrefix) this.envPrefix = config.envPrefix;
    if (config?.schema) this.schema = config.schema;
    this.loadFromEnv();
  }

  private loadFromEnv(): void {
    if (typeof process !== "undefined" && process.env) {
      for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith(this.envPrefix)) {
          const configKey = key.slice(this.envPrefix.length).toLowerCase().replace(/_/g, ".");
          this.set(configKey, this.parseValue(value!));
        }
      }
    }
  }

  private parseValue(value: string): ConfigValue {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== "") return num;
    try { return JSON.parse(value); } catch { return value; }
  }

  get<T = ConfigValue>(key: string, defaultValue?: T): T {
    const value = this.getNested(this.config, key);
    if (value !== undefined) return value as T;
    if (defaultValue !== undefined) return defaultValue;
    const schemaDefault = this.schema[key]?.default;
    if (schemaDefault !== undefined) return schemaDefault as T;
    return undefined as T;
  }

  set(key: string, value: ConfigValue): void {
    this.setNested(this.config, key, value);
    this.emit("configChanged", { key, value });
  }

  has(key: string): boolean {
    return this.getNested(this.config, key) !== undefined;
  }

  delete(key: string): boolean {
    return this.deleteNested(this.config, key);
  }

  getAll(): Record<string, ConfigValue> {
    const result: Record<string, ConfigValue> = {};
    for (const [key, value] of this.config) {
      if (!this.schema[key]?.sensitive) result[key] = value;
    }
    return result;
  }

  getSecret(key: string): string | undefined {
    return this.secrets.get(key);
  }

  setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
    this.set(key, "***REDACTED***");
  }

  load(obj: Record<string, ConfigValue>, prefix = ""): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        this.load(value as Record<string, ConfigValue>, fullKey);
      } else {
        this.set(fullKey, value);
      }
    }
  }

  validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    for (const [key, def] of Object.entries(this.schema)) {
      const value = this.get(key);
      if (def.required && value === undefined) {
        errors.push(`Missing required config: ${key}`);
      }
      if (value !== undefined && def.type) {
        const actualType = Array.isArray(value) ? "array" : typeof value;
        if (actualType !== def.type) {
          errors.push(`Invalid type for ${key}: expected ${def.type}, got ${actualType}`);
        }
      }
      if (value !== undefined && def.validator && !def.validator(value)) {
        errors.push(`Validation failed for ${key}`);
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  schemaRegister(key: string, def: ConfigSchema[string]): void {
    this.schema[key] = def;
  }

  schemaGet(): ConfigSchema {
    return { ...this.schema };
  }

  snapshot(): string {
    return JSON.stringify({ config: this.getAll(), timestamp: Date.now() });
  }

  restore(snapshot: string): void {
    const data = JSON.parse(snapshot);
    if (data.config) this.load(data.config);
  }

  // ── Dot-notation helpers ────────────────────────────────────────────────

  private getNested(map: Map<string, ConfigValue>, key: string): ConfigValue {
    const parts = key.split(".");
    let current: ConfigValue = undefined;
    for (let i = 0; i < parts.length; i++) {
      const path = parts.slice(0, i + 1).join(".");
      const val = map.get(path);
      if (val !== undefined) current = val;
    }
    return current;
  }

  private setNested(map: Map<string, ConfigValue>, key: string, value: ConfigValue): void {
    map.set(key, value);
  }

  private deleteNested(map: Map<string, ConfigValue>, key: string): boolean {
    return map.delete(key);
  }
}
