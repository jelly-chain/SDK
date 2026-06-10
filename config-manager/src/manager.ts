/**
 * ConfigManager — hierarchical configuration with env vars, secrets, validation, hot-reload, multi-environment
 * Types: ConfigValue, ConfigSchema, ConfigEnvironment, ConfigSnapshot, SecretRef, ConfigChangeEvent
 * Class: ConfigManager with 20+ methods for full config lifecycle management
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { SdkError, ErrorCode } from "@jellychain/sdk-core";

export type ConfigValue = string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };

export interface ConfigSchema {
  [key: string]: {
    type: "string" | "number" | "boolean" | "array" | "object";
    required?: boolean;
    default?: ConfigValue;
    description?: string;
    sensitive?: boolean;
    secret?: boolean;
    validator?: (value: ConfigValue) => boolean | string;
    env?: string;
    deprecated?: boolean;
    replacement?: string;
  };
}

export interface ConfigEnvironment {
  name: string;
  inherits?: string;
  values: Record<string, ConfigValue>;
  secrets: Record<string, string>;
}

export interface ConfigSnapshot {
  id: string;
  timestamp: number;
  environment: string;
  values: Record<string, ConfigValue>;
  hash: string;
}

export interface SecretRef {
  name: string;
  provider: "env" | "file" | "aws" | "gcp" | "azure" | "vault" | "custom";
  path: string;
  version?: string;
  lastRotated?: number;
  metadata: Record<string, string>;
}

export interface ConfigChangeEvent {
  key: string;
  oldValue: ConfigValue;
  newValue: ConfigValue;
  environment: string;
  timestamp: string;
  source: "api" | "env" | "file" | "secret" | "default";
}

export interface ConfigManagerConfig extends BaseSDKConfig {
  envPrefix?: string;
  schema?: ConfigSchema;
  environments?: ConfigEnvironment[];
  defaultEnvironment?: string;
  secretsDir?: string;
  hotReload?: boolean;
  configFile?: string;
}

export class ConfigManager extends BaseSDK {
  private config: Map<string, ConfigValue> = new Map();
  private schema: ConfigSchema = {};
  private environments: Map<string, ConfigEnvironment> = new Map();
  private secrets: Map<string, SecretRef> = new Map();
  private secretValues: Map<string, string> = new Map();
  private snapshots: ConfigSnapshot[] = [];
  private changeLog: ConfigChangeEvent[] = [];
  private currentEnv: string;
  private envPrefix: string;
  private hotReload: boolean;
  private watchers: Map<string, Array<(event: ConfigChangeEvent) => void>> = new Map();

  constructor(config?: ConfigManagerConfig) {
    super(config, "ConfigManager");
    this.envPrefix = config?.envPrefix || "JELLY_";
    this.schema = config?.schema || {};
    this.currentEnv = config?.defaultEnvironment || "development";
    this.hotReload = config?.hotReload ?? false;
    this.loadEnvironments(config?.environments || []);
    this.loadFromEnv();
  }

  private loadEnvironments(envs: ConfigEnvironment[]): void {
    for (const env of envs) this.environments.set(env.name, env);
    if (!this.environments.has("default")) {
      this.environments.set("default", { name: "default", values: {}, secrets: {} });
    }
  }

  private loadFromEnv(): void {
    if (typeof process !== "undefined" && process.env) {
      for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith(this.envPrefix)) {
          const configKey = key.slice(this.envPrefix.length).toLowerCase().replace(/_/g, ".");
          this.set(configKey, this.parseValue(value!), "env");
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

  // ── Core Get/Set ─────────────────────────────────────────────────────────

  get<T = ConfigValue>(key: string, defaultValue?: T): T {
    const secret = this.secretValues.get(key);
    if (secret !== undefined) return secret as T;
    const value = this.getNested(key);
    if (value !== undefined) return value as T;
    const env = this.environments.get(this.currentEnv);
    if (env?.values[key] !== undefined) return env.values[key] as T;
    if (defaultValue !== undefined) return defaultValue;
    const schemaDefault = this.schema[key]?.default;
    return schemaDefault !== undefined ? schemaDefault as T : undefined as T;
  }

  getRequired<T = ConfigValue>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) throw new SdkError(`Required config missing: ${key}`, ErrorCode.INVALID_CONFIG);
    return value;
  }

  getNumber(key: string, defaultValue = 0): number {
    const val = this.get<number>(key, defaultValue);
    return typeof val === "number" ? val : defaultValue;
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const val = this.get<boolean>(key, defaultValue);
    return typeof val === "boolean" ? val : defaultValue;
  }

  getString(key: string, defaultValue = ""): string {
    const val = this.get<string>(key, defaultValue);
    return typeof val === "string" ? val : defaultValue;
  }

  getArray<T = ConfigValue>(key: string, defaultValue: T[] = []): T[] {
    const val = this.get<ConfigValue[]>(key, defaultValue);
    return Array.isArray(val) ? val.map(v => v as T) : defaultValue;
  }

  getObject<T = Record<string, ConfigValue>>(key: string, defaultValue: T = {} as T): T {
    const val = this.get<Record<string, ConfigValue>>(key, defaultValue);
    return (typeof val === "object" && val !== null && !Array.isArray(val)) ? val as T : defaultValue;
  }

  set(key: string, value: ConfigValue, source = "api"): void {
    const oldValue = this.get(key);
    this.setNested(key, value);
    this.changeLog.push({ key, oldValue, newValue: value, environment: this.currentEnv, timestamp: new Date().toISOString(), source });
    this.emitWatchers(key, { key, oldValue, newValue: value, environment: this.currentEnv, timestamp: new Date().toISOString(), source });
    this.emit("configChanged", { key, oldValue, newValue: value });
  }

  delete(key: string): boolean {
    const existed = this.config.has(key);
    this.config.delete(key);
    return existed;
  }

  has(key: string): boolean {
    return this.config.has(key) || this.secretValues.has(key) || this.environments.get(this.currentEnv)?.values[key] !== undefined;
  }

  // ── Bulk Operations ─────────────────────────────────────────────────────

  load(obj: Record<string, ConfigValue>, prefix = "", source = "api"): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        this.load(value as Record<string, ConfigValue>, fullKey, source);
      } else {
        this.set(fullKey, value, source);
      }
    }
  }

  merge(obj: Record<string, ConfigValue>, strategy: "override" | "keep" = "override"): void {
    for (const [key, value] of Object.entries(obj)) {
      if (strategy === "keep" && this.has(key)) continue;
      this.set(key, value, "merge");
    }
  }

  getAll(): Record<string, ConfigValue> {
    const result: Record<string, ConfigValue> = {};
    for (const [key, value] of this.config) {
      if (!this.schema[key]?.sensitive) result[key] = value;
    }
    return result;
  }

  getPublic(): Record<string, ConfigValue> {
    const result: Record<string, ConfigValue> = {};
    for (const [key, value] of this.config) {
      if (!this.schema[key]?.sensitive && !this.schema[key]?.secret) result[key] = value;
    }
    return result;
  }

  // ── Schema ───────────────────────────────────────────────────────────────

  schemaRegister(key: string, def: ConfigSchema[string]): void {
    this.schema[key] = def;
    if (def.default !== undefined && !this.has(key)) {
      this.set(key, def.default, "default");
    }
  }

  schemaValidate(key: string, value: ConfigValue): { valid: boolean; error?: string } {
    const def = this.schema[key];
    if (!def) return { valid: true };
    if (def.type) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== def.type) return { valid: false, error: `Expected ${def.type}, got ${actualType}` };
    }
    if (def.validator) {
      const result = def.validator(value);
      if (result === false) return { valid: false, error: `Validation failed for ${key}` };
      if (typeof result === "string") return { valid: false, error: result };
    }
    return { valid: true };
  }

  validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    for (const [key, def] of Object.entries(this.schema)) {
      const value = this.get(key);
      if (def.required && value === undefined) errors.push(`Missing required: ${key}`);
      if (def.deprecated) warnings.push(`${key} is deprecated${def.replacement ? `, use ${def.replacement}` : ""}`);
      if (value !== undefined) {
        const result = this.schemaValidate(key, value);
        if (!result.valid) errors.push(`${key}: ${result.error}`);
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  getSchema(): ConfigSchema { return { ...this.schema }; }

  // ── Environments ─────────────────────────────────────────────────────────

  useEnvironment(name: string): void {
    const env = this.environments.get(name);
    if (!env) throw new SdkError(`Environment not found: ${name}`, ErrorCode.NOT_FOUND);
    this.currentEnv = name;
    this.load(env.values, "", "environment");
  }

  getCurrentEnvironment(): string { return this.currentEnv; }

  getEnvironments(): string[] { return [...this.environments.keys()]; }

  createEnvironment(name: string, inherits?: string): ConfigEnvironment {
    const env: ConfigEnvironment = { name, inherits, values: {}, secrets: {} };
    if (inherits) {
      const parent = this.environments.get(inherits);
      if (parent) env.values = { ...parent.values };
    }
    this.environments.set(name, env);
    return env;
  }

  // ── Secrets ──────────────────────────────────────────────────────────────

  setSecret(name: string, value: string, provider = "env"): void {
    this.secretValues.set(name, value);
    this.secrets.set(name, { name, provider, path: name, lastRotated: Date.now(), metadata: {} });
    this.set(name, "***", "secret");
  }

  getSecret(name: string): string | undefined { return this.secretValues.get(name); }

  rotateSecret(name: string, newValue: string, provider?: string): void {
    const ref = this.secrets.get(name);
    this.secretValues.set(name, newValue);
    if (ref) {
      ref.lastRotated = Date.now();
      if (provider) ref.provider = provider;
      this.secrets.set(name, ref);
    }
    this.emit("secretRotated", { name, timestamp: ref?.lastRotated });
  }

  getSecretRefs(): SecretRef[] { return [...this.secrets.values()]; }

  // ── Snapshots ────────────────────────────────────────────────────────────

  snapshot(): ConfigSnapshot {
    const values = this.getAll();
    const hash = this.hashConfig(values);
    const snap: ConfigSnapshot = { id: `snap-${Date.now()}`, timestamp: Date.now(), environment: this.currentEnv, values, hash };
    this.snapshots.push(snap);
    if (this.snapshots.length > 100) this.snapshots.shift();
    return snap;
  }

  restore(snapshotId: string): boolean {
    const snap = this.snapshots.find(s => s.id === snapshotId);
    if (!snap) return false;
    this.config.clear();
    this.load(snap.values, "", "restore");
    this.currentEnv = snap.environment;
    return true;
  }

  getSnapshots(): ConfigSnapshot[] { return [...this.snapshots]; }

  diff(snapshotId1: string, snapshotId2: string): { added: Record<string, ConfigValue>; removed: Record<string, ConfigValue>; changed: Record<string, { from: ConfigValue; to: ConfigValue }> } {
    const snap1 = this.snapshots.find(s => s.id === snapshotId1);
    const snap2 = this.snapshots.find(s => s.id === snapshotId2);
    if (!snap1 || !snap2) throw new SdkError("Snapshot not found", ErrorCode.NOT_FOUND);
    const added: Record<string, ConfigValue> = {};
    const removed: Record<string, ConfigValue> = {};
    const changed: Record<string, { from: ConfigValue; to: ConfigValue }> = {};
    for (const key of new Set([...Object.keys(snap1.values), ...Object.keys(snap2.values)])) {
      const v1 = snap1.values[key];
      const v2 = snap2.values[key];
      if (v1 === undefined && v2 !== undefined) added[key] = v2;
      else if (v1 !== undefined && v2 === undefined) removed[key] = v1;
      else if (JSON.stringify(v1) !== JSON.stringify(v2)) changed[key] = { from: v1!, to: v2! };
    }
    return { added, removed, changed };
  }

  // ── Change Tracking ──────────────────────────────────────────────────────

  getChangeLog(limit = 50): ConfigChangeEvent[] { return this.changeLog.slice(-limit); }

  watch(key: string, callback: (event: ConfigChangeEvent) => void): () => void {
    if (!this.watchers.has(key)) this.watchers.set(key, []);
    this.watchers.get(key)!.push(callback);
    return () => { const ws = this.watchers.get(key); if (ws) this.watchers.set(key, ws.filter(w => w !== callback)); };
  }

  private emitWatchers(key: string, event: ConfigChangeEvent): void {
    this.watchers.get(key)?.forEach(cb => { try { cb(event); } catch { /* */ } });
    this.watchers.get("*")?.forEach(cb => { try { cb(event); } catch { /* */ } });
  }

  // ── Dot-notation helpers ─────────────────────────────────────────────────

  private getNested(key: string): ConfigValue {
    return this.config.get(key);
  }

  private setNested(key: string, value: ConfigValue): void {
    this.config.set(key, value);
  }

  private hashConfig(values: Record<string, ConfigValue>): string {
    const str = JSON.stringify(values, Object.keys(values).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0; }
    return hash.toString(16);
  }
}
