/**
 * TypeRegistry — shared types and interfaces across all Jelly Chain SDK packages
 * Central type definitions, type guards, validators, serialization, version management
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId, ChainFamily, TokenType, TokenStandard } from "@jellychain/shared-types";

export interface TypeDefinition {
  name: string; version: string; schema: TypeSchema;
  description?: string; deprecated?: boolean; replacement?: string;
  createdAt: number; updatedAt: number;
}

export interface TypeSchema {
  type: "object" | "array" | "string" | "number" | "boolean" | "enum" | "union" | "intersection";
  properties?: Record<string, TypeSchema>;
  items?: TypeSchema; enum?: string[];
  required?: string[]; additionalProperties?: boolean;
  minimum?: number; maximum?: number; pattern?: string;
  format?: string; default?: unknown;
}

export interface TypeGuard { name: string; check: (value: unknown) => boolean; errorMessage: string; }
export interface TypeValidator { name: string; validate: (value: unknown) => { valid: boolean; errors: string[] }; }
export interface TypeSerializer { name: string; serialize: (value: unknown) => string; deserialize: (data: string) => unknown; }
export interface TypeMigration { fromVersion: string; toVersion: string; migrate: (data: unknown) => unknown; }

export class TypeRegistry extends BaseSDK {
  private types: Map<string, TypeDefinition> = new Map();
  private guards: Map<string, TypeGuard> = new Map();
  private validators: Map<string, TypeValidator> = new Map();
  private serializers: Map<string, TypeSerializer> = new Map();
  private migrations: Map<string, TypeMigration[]> = new Map();

  constructor(config?: BaseSDKConfig) {
    super(config, "TypeRegistry");
    this.registerCoreTypes();
    this.registerCoreGuards();
    this.registerCoreValidators();
    this.registerCoreSerializers();
  }

  private registerCoreTypes(): void {
    this.registerType({ name: "ChainId", version: "1.0.0", schema: { type: "number", minimum: 0 }, description: "EVM chain ID", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "TokenRef", version: "1.0.0", schema: { type: "object", properties: { symbol: { type: "string" }, name: { type: "string" }, address: { type: "string" }, decimals: { type: "number", minimum: 0, maximum: 18 }, chainId: { type: "number" }, standard: { type: "string" }, logoUrl: { type: "string" }, coingeckoId: { type: "string" }, isStablecoin: { type: "boolean" }, isWrapped: { type: "boolean" } }, required: ["symbol", "decimals", "chainId"], description: "Token reference", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "TokenPrice", version: "1.0.0", schema: { type: "object", properties: { token: { type: "object" }, price: { type: "number", minimum: 0 }, priceChange24h: { type: "number" }, priceChange7d: { type: "number" }, priceChange30d: { type: "number" }, high24h: { type: "number" }, low24h: { type: "number" }, marketCap: { type: "number" }, fdv: { type: "number" }, volume24h: { type: "number" }, circulatingSupply: { type: "number" }, totalSupply: { type: "number" }, maxSupply: { type: "number" }, lastUpdated: { type: "number" } }, required: ["token", "price", "lastUpdated"], description: "Token price data", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "TradingSignal", version: "1.0.0", schema: { type: "object", properties: { id: { type: "string" }, type: { type: "string" }, direction: { type: "string", enum: ["bullish", "bearish", "neutral"] }, strength: { type: "number", minimum: 1, maximum: 5 }, timeframe: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 }, score: { type: "number", minimum: 0, maximum: 100 }, reasoning: { type: "array", items: { type: "string" } }, timestamp: { type: "number" }, expiresAt: { type: "number" }, status: { type: "string" } }, required: ["id", "type", "direction", "confidence", "timestamp"], description: "Trading signal", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "Prediction", version: "1.0.0", schema: { type: "object", properties: { id: { type: "string" }, statement: { type: "string" }, probability: { type: "number", minimum: 0, maximum: 1 }, confidence: { type: "number", minimum: 0, maximum: 1 }, direction: { type: "string" }, timeframe: { type: "string" }, targetDate: { type: "number" }, reasoning: { type: "array", items: { type: "string" } }, evidence: { type: "array", items: { type: "object" } }, sources: { type: "array", items: { type: "string" } }, methodology: { type: "string" }, baseRate: { type: "number" }, edge: { type: "number" }, expectedValue: { type: "number" }, kellyFraction: { type: "number" }, createdAt: { type: "number" }, updatedAt: { type: "number" }, resolvedAt: { type: "number" }, resolution: { type: "boolean" }, accuracy: { type: "number" } }, required: ["id", "statement", "probability", "confidence", "createdAt"], description: "Prediction data", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "AgentDefinition", version: "1.0.0", schema: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, description: { type: "string" }, version: { type: "string" }, author: { type: "string" }, capabilities: { type: "array", items: { type: "string" } }, config: { type: "object" }, skills: { type: "array", items: { type: "string" } }, tools: { type: "array", items: { type: "string" } }, permissions: { type: "array", items: { type: "object" } }, schedule: { type: "object" }, triggers: { type: "array", items: { type: "object" } }, metadata: { type: "object" }, createdAt: { type: "number" }, updatedAt: { type: "number" } }, required: ["id", "name", "version", "capabilities"], description: "Agent definition", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "BridgeQuote", version: "1.0.0", schema: { type: "object", properties: { bridge: { type: "string" }, fromChain: { type: "number" }, toChain: { type: "number" }, token: { type: "object" }, amount: { type: "string" }, receiveAmount: { type: "string" }, fee: { type: "number" }, feeUsd: { type: "number" }, estimatedTime: { type: "number" }, route: { type: "array", items: { type: "object" } }, validUntil: { type: "number" }, confidence: { type: "number" }, security: { type: "string" }, liquidityAvailable: { type: "string" } }, required: ["bridge", "fromChain", "toChain", "token", "amount", "receiveAmount", "estimatedTime"], description: "Bridge quote", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "SwapQuote", version: "1.0.0", schema: { type: "object", properties: { dex: { type: "string" }, chainId: { type: "number" }, tokenIn: { type: "object" }, tokenOut: { type: "object" }, amountIn: { type: "string" }, amountOut: { type: "string" }, priceImpact: { type: "number" }, fee: { type: "number" }, feePercent: { type: "number" }, route: { type: "array", items: { type: "object" } }, gasEstimate: { type: "number" }, gasPrice: { type: "number" }, slippage: { type: "number" }, validUntil: { type: "number" }, source: { type: "string" } }, required: ["dex", "chainId", "tokenIn", "tokenOut", "amountIn", "amountOut", "priceImpact"], description: "Swap quote", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "YieldOpportunity", version: "1.0.0", schema: { type: "object", properties: { protocol: { type: "string" }, chainId: { type: "number" }, pool: { type: "string" }, token: { type: "string" }, apy: { type: "number" }, apy7d: { type: "number" }, apy30d: { type: "number" }, tvl: { type: "number" }, rewardTokens: { type: "array", items: { type: "string" } }, rewardApy: { type: "number" }, totalApy: { type: "number" }, riskScore: { type: "number", minimum: 1, maximum: 5 }, utilization: { type: "number" }, capacity: { type: "string" }, lastHarvest: { type: "number" }, compoundFrequency: { type: "number" }, gasEstimate: { type: "number" }, netApyAfterGas: { type: "number" }, metadata: { type: "object" } }, required: ["protocol", "chainId", "pool", "token", "apy", "totalApy", "riskScore"], description: "Yield opportunity", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "Order", version: "1.0.0", schema: { type: "object", properties: { id: { type: "string" }, type: { type: "string" }, side: { type: "string", enum: ["buy", "sell"] }, tokenIn: { type: "string" }, tokenOut: { type: "string" }, amountIn: { type: "string" }, amountOutMin: { type: "string" }, price: { type: "number" }, stopPrice: { type: "number" }, status: { type: "string" }, chainId: { type: "number" }, venue: { type: "string" }, createdAt: { type: "number" }, updatedAt: { type: "number" }, expiresAt: { type: "number" }, fills: { type: "array", items: { type: "object" } }, metadata: { type: "object" } }, required: ["id", "type", "side", "tokenIn", "tokenOut", "amountIn", "status", "chainId", "venue", "createdAt"], description: "Order", createdAt: Date.now(), updatedAt: Date.now() });
    this.registerType({ name: "RiskLimit", version: "1.0.0", schema: { type: "object", properties: { factor: { type: "string" }, threshold: { type: "number" }, currentValue: { type: "number" }, utilization: { type: "number" }, level: { type: "string" }, action: { type: "string" } }, required: ["factor", "threshold", "currentValue", "utilization", "level", "action"], description: "Risk limit", createdAt: Date.now(), updatedAt: Date.now() });
  }

  private registerCoreGuards(): void {
    this.registerGuard({ name: "isTokenRef", check: (v: unknown) => typeof v === "object" && v !== null && "symbol" in v && "decimals" in v && "chainId" in v, errorMessage: "Invalid TokenRef: must have symbol, decimals, chainId" });
    this.registerGuard({ name: "isNumber", check: (v: unknown) => typeof v === "number" && !isNaN(v), errorMessage: "Expected a valid number" });
    this.registerGuard({ name: "isPositiveNumber", check: (v: unknown) => typeof v === "number" && v > 0, errorMessage: "Expected a positive number" });
    this.registerGuard({ name: "isProbability", check: (v: unknown) => typeof v === "number" && v >= 0 && v <= 1, errorMessage: "Expected a probability between 0 and 1" });
    this.registerGuard({ name: "isAddress", check: (v: unknown) => typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v), errorMessage: "Invalid Ethereum address" });
    this.registerGuard({ name: "isHexString", check: (v: unknown) => typeof v === "string" && /^0x[a-fA-F0-9]*$/.test(v), errorMessage: "Invalid hex string" });
    this.registerGuard({ name: "isChainId", check: (v: unknown) => typeof v === "number" && v > 0 && Number.isInteger(v), errorMessage: "Invalid chain ID" });
    this.registerGuard({ name: "isNonEmptyString", check: (v: unknown) => typeof v === "string" && v.length > 0, errorMessage: "Expected a non-empty string" });
    this.registerGuard({ name: "isTimestamp", check: (v: unknown) => typeof v === "number" && v > 0 && v < 9999999999999, errorMessage: "Invalid timestamp" });
    this.registerGuard({ name: "isBigInt", check: (v: unknown) => typeof v === "bigint" || (typeof v === "string" && /^\d+$/.test(v)), errorMessage: "Expected a bigint or numeric string" });
  }

  private registerCoreValidators(): void {
    this.registerValidator({ name: "tokenRef", validate: (v: unknown) => { const errors: string[] = []; const t = v as Record<string, unknown>; if (!t.symbol) errors.push("Missing symbol"); if (typeof t.decimals !== "number" || t.decimals < 0 || t.decimals > 18) errors.push("Invalid decimals"); if (typeof t.chainId !== "number" || t.chainId <= 0) errors.push("Invalid chainId"); return { valid: errors.length === 0, errors }; } });
    this.registerValidator({ name: "swapQuote", validate: (v: unknown) => { const errors: string[] = []; const q = v as Record<string, unknown>; if (!q.dex) errors.push("Missing dex"); if (!q.tokenIn) errors.push("Missing tokenIn"); if (!q.tokenOut) errors.push("Missing tokenOut"); if (typeof q.priceImpact !== "number" || q.priceImpact < 0 || q.priceImpact > 100) errors.push("Invalid priceImpact"); return { valid: errors.length === 0, errors }; } });
    this.registerValidator({ name: "bridgeQuote", validate: (v: unknown) => { const errors: string[] = []; const q = v as Record<string, unknown>; if (!q.bridge) errors.push("Missing bridge"); if (typeof q.fromChain !== "number") errors.push("Missing fromChain"); if (typeof q.toChain !== "number") errors.push("Missing toChain"); if (typeof q.estimatedTime !== "number" || q.estimatedTime <= 0) errors.push("Invalid estimatedTime"); return { valid: errors.length === 0, errors }; } });
    this.registerValidator({ name: "order", validate: (v: unknown) => { const errors: string[] = []; const o = v as Record<string, unknown>; if (!o.id) errors.push("Missing id"); if (!["market", "limit", "stop_loss", "take_profit", "twap", "vwap", "iceberg"].includes(o.type as string)) errors.push("Invalid order type"); if (!["buy", "sell"].includes(o.side as string)) errors.push("Invalid side"); return { valid: errors.length === 0, errors }; } });
    this.registerValidator({ name: "yieldOpportunity", validate: (v: unknown) => { const errors: string[] = []; const o = v as Record<string, unknown>; if (!o.protocol) errors.push("Missing protocol"); if (typeof o.apy !== "number") errors.push("Missing apy"); if (typeof o.riskScore !== "number" || o.riskScore < 1 || o.riskScore > 5) errors.push("Invalid riskScore"); return { valid: errors.length === 0, errors }; } });
  }

  private registerCoreSerializers(): void {
    this.registerSerializer({ name: "tokenRef", serialize: (v: unknown) => JSON.stringify(v), deserialize: (d: string) => JSON.parse(d) });
    this.registerSerializer({ name: "bigint", serialize: (v: unknown) => (v as bigint).toString(), deserialize: (d: string) => BigInt(d) });
    this.registerSerializer({ name: "base64", serialize: (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64"), deserialize: (d: string) => JSON.parse(Buffer.from(d, "base64").toString()) });
  }

  // ── Public API ─────────────────────────────────────────────────────────

  registerType(def: TypeDefinition): void { this.types.set(`${def.name}@${def.version}`, def); }
  getType(name: string, version = "1.0.0"): TypeDefinition | undefined { return this.types.get(`${name}@${version}`); }
  getTypes(): TypeDefinition[] { return [...this.types.values()]; }
  hasType(name: string, version?: string): boolean { return version ? this.types.has(`${name}@${version}`) : [...this.types.keys()].some(k => k.startsWith(`${name}@`)); }

  registerGuard(guard: TypeGuard): void { this.guards.set(guard.name, guard); }
  check(name: string, value: unknown): boolean { const guard = this.guards.get(name); return guard ? guard.check(value) : false; }
  getGuards(): TypeGuard[] { return [...this.guards.values()]; }

  registerValidator(validator: TypeValidator): void { this.validators.set(validator.name, validator); }
  validate(name: string, value: unknown): { valid: boolean; errors: string[] } { const v = this.validators.get(name); return v ? v.validate(value) : { valid: true, errors: [] }; }
  getValidators(): TypeValidator[] { return [...this.validators.values()]; }

  registerSerializer(serializer: TypeSerializer): void { this.serializers.set(serializer.name, serializer); }
  serialize(name: string, value: unknown): string { const s = this.serializers.get(name); if (!s) return JSON.stringify(value); return s.serialize(value); }
  deserialize(name: string, data: string): unknown { const s = this.serializers.get(name); if (!s) return JSON.parse(data); return s.deserialize(data); }

  registerMigration(migration: TypeMigration): void { const key = `${migration.fromVersion}->${migration.toVersion}`; if (!this.migrations.has(key)) this.migrations.set(key, []); this.migrations.get(key)!.push(migration); }
  migrate(name: string, fromVersion: string, toVersion: string, data: unknown): unknown { const key = `${fromVersion}->${toVersion}`; const migrations = this.migrations.get(key); if (!migrations || migrations.length === 0) return data; return migrations.reduce((d, m) => m.migrate(d), data); }

  validateAgainstSchema(name: string, value: unknown): { valid: boolean; errors: string[] } {
    const type = this.getType(name);
    if (!type) return { valid: false, errors: [`Type ${name} not found`] };
    return this.validateSchema(value, type.schema);
  }

  private validateSchema(value: unknown, schema: TypeSchema, path = ""): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (schema.type === "object" && typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      if (schema.required) { for (const key of schema.required) { if (obj[key] === undefined) errors.push(`${path}.${key} is required`); } }
      if (schema.properties) { for (const [key, propSchema] of Object.entries(schema.properties)) { if (obj[key] !== undefined) { const result = this.validateSchema(obj[key], propSchema, `${path}.${key}`); errors.push(...result.errors); } } }
    } else if (schema.type === "array" && Array.isArray(value)) {
      if (schema.items) { value.forEach((item, i) => { const result = this.validateSchema(item, schema.items!, `${path}[${i}]`); errors.push(...result.errors); }); }
    } else if (schema.type === "string" && typeof value !== "string") { errors.push(`${path}: expected string, got ${typeof value}`); }
    else if (schema.type === "number" && typeof value !== "number") { errors.push(`${path}: expected number, got ${typeof value}`); }
    else if (schema.type === "boolean" && typeof value !== "boolean") { errors.push(`${path}: expected boolean, got ${typeof value}`); }
    if (schema.minimum !== undefined && typeof value === "number" && value < schema.minimum) errors.push(`${path}: minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && typeof value === "number" && value > schema.maximum) errors.push(`${path}: maximum ${schema.maximum}`);
    if (schema.pattern && typeof value === "string" && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: does not match pattern ${schema.pattern}`);
    if (schema.enum && !schema.enum.includes(value as string)) errors.push(`${path}: must be one of ${schema.enum.join(", ")}`);
    return { valid: errors.length === 0, errors };
  }

  generateTypeScript(name: string): string {
    const type = this.getType(name);
    if (!type) return `// Type ${name} not found`;
    return this.schemaToTypeScript(name, type.schema);
  }

  private schemaToTypeScript(name: string, schema: TypeSchema): string {
    if (schema.type === "object") {
      const props = schema.properties ? Object.entries(schema.properties).map(([k, v]) => `  ${k}${schema.required?.includes(k) ? "" : "?"}: ${this.tsType(v)};`).join("\n") : "  [key: string]: unknown;";
      return `export interface ${name} {\n${props}\n}`;
    }
    return `export type ${name} = ${this.tsType(schema)};`;
  }

  private tsType(schema: TypeSchema): string {
    if (schema.type === "string") return "string";
    if (schema.type === "number") return "number";
    if (schema.type === "boolean") return "boolean";
    if (schema.type === "array") return `${this.tsType(schema.items!)}[]`;
    if (schema.type === "object") return "Record<string, unknown>";
    if (schema.enum) return schema.enum.map(e => `"${e}"`).join(" | ");
    return "unknown";
  }
}
