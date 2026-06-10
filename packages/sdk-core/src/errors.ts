/**
 * Error hierarchy — standardized error handling across all SDKs
 */

export enum ErrorCode {
  // General
  UNKNOWN = "UNKNOWN",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_CONFIG = "INVALID_CONFIG",
  TIMEOUT = "TIMEOUT",
  RATE_LIMITED = "RATE_LIMITED",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",

  // Blockchain
  CHAIN_NOT_SUPPORTED = "CHAIN_NOT_SUPPORTED",
  RPC_ERROR = "RPC_ERROR",
  RPC_TIMEOUT = "RPC_TIMEOUT",
  BLOCK_NOT_FOUND = "BLOCK_NOT_FOUND",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  TRANSACTION_REVERTED = "TRANSACTION_REVERTED",
  GAS_ESTIMATION_FAILED = "GAS_ESTIMATION_FAILED",
  INSUFFICIENT_GAS = "INSUFFICIENT_GAS",
  NONCE_TOO_LOW = "NONCE_TOO_LOW",
  NONCE_TOO_HIGH = "NONCE_TOO_HIGH",
  REPLACEMENT_UNDERPRICED = "REPLACEMENT_UNDERPRICED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INSUFFICIENT_ALLOWANCE = "INSUFFICIENT_ALLOWANCE",
  CONTRACT_NOT_FOUND = "CONTRACT_NOT_FOUND",
  CONTRACT_EXECUTION_FAILED = "CONTRACT_EXECUTION_FAILED",

  // Trading
  SLIPPAGE_TOO_HIGH = "SLIPPAGE_TOO_HIGH",
  LIQUIDITY_TOO_LOW = "LIQUIDITY_TOO_LOW",
  PRICE_IMPACT_TOO_HIGH = "PRICE_IMPACT_TOO_HIGH",
  ORDER_FAILED = "ORDER_FAILED",
  ORDER_EXPIRED = "ORDER_EXPIRED",
  ORDER_FILLED = "ORDER_FILLED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
  POSITION_NOT_FOUND = "POSITION_NOT_FOUND",
  POSITION_CLOSED = "POSITION_CLOSED",
  LIQUIDATION_RISK = "LIQUIDATION_RISK",
  MAX_LEVERAGE_EXCEEDED = "MAX_LEVERAGE_EXCEEDED",
  FUNDING_RATE_TOO_HIGH = "FUNDING_RATE_TOO_HIGH",

  // Wallet
  WALLET_NOT_CONNECTED = "WALLET_NOT_CONNECTED",
  WALLET_DISCONNECTED = "WALLET_DISCONNECTED",
  SIGNATURE_FAILED = "SIGNATURE_FAILED",
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  WRONG_CHAIN = "WRONG_CHAIN",
  USER_REJECTED = "USER_REJECTED",

  // Bridge
  BRIDGE_NOT_SUPPORTED = "BRIDGE_NOT_SUPPORTED",
  BRIDGE_LIMIT_EXCEEDED = "BRIDGE_LIMIT_EXCEEDED",
  BRIDGE_TIMEOUT = "BRIDGE_TIMEOUT",
  BRIDGE_FAILED = "BRIDGE_FAILED",

  // API
  API_ERROR = "API_ERROR",
  API_TIMEOUT = "API_TIMEOUT",
  API_RESPONSE_INVALID = "API_RESPONSE_INVALID",
  API_KEY_INVALID = "API_KEY_INVALID",
  API_KEY_EXPIRED = "API_KEY_EXPIRED",
  API_QUOTA_EXCEEDED = "API_QUOTA_EXCEEDED",

  // Data
  DATA_NOT_FOUND = "DATA_NOT_FOUND",
  DATA_STALE = "DATA_STALE",
  DATA_INVALID = "DATA_INVALID",
  DATA_PARSE_ERROR = "DATA_PARSE_ERROR",

  // Security
  HONEYPOT_DETECTED = "HONEYPOT_DETECTED",
  RUGPULL_DETECTED = "RUGPULL_DETECTED",
  CONTRACT_NOT_VERIFIED = "CONTRACT_NOT_VERIFIED",
  HIGH_RISK_TOKEN = "HIGH_RISK_TOKEN",
}

export class SdkError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly retryable: boolean;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
      retryable?: boolean;
    }
  ) {
    super(message);
    this.name = "SdkError";
    this.code = code;
    this.cause = options?.cause;
    this.context = options?.context;
    this.retryable = options?.retryable ?? false;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, SdkError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      retryable: this.retryable,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  static from(error: unknown, code?: ErrorCode, retryable?: boolean): SdkError {
    if (error instanceof SdkError) return error;
    if (error instanceof Error) {
      return new SdkError(error.message, code ?? ErrorCode.UNKNOWN, {
        cause: error,
        retryable,
      });
    }
    return new SdkError(String(error), code ?? ErrorCode.UNKNOWN);
  }
}

export class ChainError extends SdkError {
  public readonly chainId: number;

  constructor(
    message: string,
    chainId: number,
    code: ErrorCode = ErrorCode.CHAIN_NOT_SUPPORTED,
    options?: { cause?: Error; context?: Record<string, unknown>; retryable?: boolean }
  ) {
    super(message, code, options);
    this.name = "ChainError";
    this.chainId = chainId;
    Object.setPrototypeOf(this, ChainError.prototype);
  }
}

export class TradingError extends SdkError {
  public readonly token?: string;
  public readonly venue?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.ORDER_FAILED,
    options?: {
      token?: string;
      venue?: string;
      cause?: Error;
      context?: Record<string, unknown>;
      retryable?: boolean;
    }
  ) {
    super(message, code, options);
    this.name = "TradingError";
    this.token = options?.token;
    this.venue = options?.venue;
    Object.setPrototypeOf(this, TradingError.prototype);
  }
}

export class RpcError extends ChainError {
  public readonly rpcUrl: string;
  public readonly statusCode?: number;
  public readonly rpcCode?: number;
  public readonly rpcMessage?: string;

  constructor(
    message: string,
    chainId: number,
    rpcUrl: string,
    options?: {
      statusCode?: number;
      rpcCode?: number;
      rpcMessage?: string;
      cause?: Error;
      retryable?: boolean;
    }
  ) {
    super(message, chainId, ErrorCode.RPC_ERROR, {
      cause: options?.cause,
      retryable: options?.retryable ?? true,
      context: { rpcUrl, statusCode: options?.statusCode, rpcCode: options?.rpcCode },
    });
    this.name = "RpcError";
    this.rpcUrl = rpcUrl;
    this.statusCode = options?.statusCode;
    this.rpcCode = options?.rpcCode;
    this.rpcMessage = options?.rpcMessage;
    Object.setPrototypeOf(this, RpcError.prototype);
  }
}

export class ApiError extends SdkError {
  public readonly statusCode: number;
  public readonly endpoint: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number,
    endpoint: string,
    options?: {
      requestId?: string;
      cause?: Error;
      context?: Record<string, unknown>;
      retryable?: boolean;
    }
  ) {
    const code = statusCode === 429 ? ErrorCode.RATE_LIMITED
      : statusCode === 401 ? ErrorCode.UNAUTHORIZED
      : statusCode === 403 ? ErrorCode.FORBIDDEN
      : statusCode === 404 ? ErrorCode.NOT_FOUND
      : statusCode >= 500 ? ErrorCode.API_ERROR
      : ErrorCode.API_ERROR;
    super(message, code, { ...options, retryable: options?.retryable ?? statusCode >= 500 });
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.requestId = options?.requestId;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class SecurityError extends SdkError {
  public readonly tokenAddress: string;
  public readonly riskType: string;
  public readonly riskScore: number;

  constructor(
    message: string,
    tokenAddress: string,
    riskType: string,
    riskScore: number,
    options?: { cause?: Error; context?: Record<string, unknown> }
  ) {
    const code = riskType === "honeypot" ? ErrorCode.HONEYPOT_DETECTED
      : riskType === "rugpull" ? ErrorCode.RUGPULL_DETECTED
      : ErrorCode.HIGH_RISK_TOKEN;
    super(message, code, { ...options, retryable: false });
    this.name = "SecurityError";
    this.tokenAddress = tokenAddress;
    this.riskType = riskType;
    this.riskScore = riskScore;
    Object.setPrototypeOf(this, SecurityError.prototype);
  }
}

export class ValidationError extends SdkError {
  public readonly field: string;
  public readonly value: unknown;
  public readonly constraint: string;

  constructor(
    message: string,
    field: string,
    value: unknown,
    constraint: string
  ) {
    super(message, ErrorCode.INVALID_INPUT, {
      context: { field, value, constraint },
      retryable: false,
    });
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
    this.constraint = constraint;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
