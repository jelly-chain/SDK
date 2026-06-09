export interface GasEstimate { gasLimit: string; gasPrice?: string; maxFeePerGas?: string; maxPriorityFeePerGas?: string; estimatedCostUsd: number; confidence: number; }
export interface BatchTx { to: string; value: string; data: string; gasLimit?: string; }
