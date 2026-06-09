import { GasEstimate } from "../types.js";
export class Eip1559Estimator { async estimate(_tx: Record<string, unknown>): Promise<GasEstimate> { return { gasLimit: "21000", maxFeePerGas: "30000000000", maxPriorityFeePerGas: "1500000000", estimatedCostUsd: 1.2, confidence: 0.9 }; } }
