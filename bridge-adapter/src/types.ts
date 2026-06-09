export type BridgeName = "axelar" | "wormhole" | "layerzero" | "celer" | "socket" | "across" | "stargate" | "synapse";
export interface BridgeQuote { bridge: BridgeName; fromChain: string; toChain: string; token: string; amountIn: string; amountOut: string; fee: string; estimatedTimeMs: number; }
export interface BridgeTx { bridge: BridgeName; txHash: string; fromChain: string; toChain: string; status: "pending" | "completed" | "failed"; }
