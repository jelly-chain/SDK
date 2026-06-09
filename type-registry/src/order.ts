export interface OrderParams { type: "limit" | "market" | "stop" | "oco"; side: "buy" | "sell"; token: string; amount: string; price?: string; stopPrice?: string; }
export interface OrderResult { orderId: string; status: "open" | "filled" | "cancelled"; filled: string; remaining: string; }
