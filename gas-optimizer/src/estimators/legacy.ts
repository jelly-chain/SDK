import { GasEstimate } from "../types.js";
export class LegacyEstimator { async estimate(_tx: Record<string, unknown>): Promise<GasEstimate> { return { gasLimit: "21000", gasPrice: "20000000000", estimatedCostUsd: 1.5, confidence: 0.8 }; } }
