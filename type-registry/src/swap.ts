export interface SwapParams { tokenIn: string; tokenOut: string; amountIn: string; minAmountOut: string; recipient: string; deadline: number; }
export interface SwapResult { txHash: string; amountIn: string; amountOut: string; gasUsed: string; }
