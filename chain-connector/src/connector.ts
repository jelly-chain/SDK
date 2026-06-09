// chain-connector/src/connector.ts
// Main ChainConnector class — unified interface for all chains

import { ChainId, ConnectorConfig, Balance, TokenBalance, TransactionRequest, TransactionResult } from './types.js';
import { RpcClient } from './rpc.js';
import { BalanceFetcher } from './balances.js';
import { buildChainConfigs } from './utils.js';

export class ChainConnector {
  private rpcClients: Map<ChainId, RpcClient> = new Map();
  private balanceFetcher: BalanceFetcher;

  constructor(config: ConnectorConfig) {
    const chainConfigs = buildChainConfigs(config);
    for (const [chainId, chainConf] of chainConfigs) {
      this.rpcClients.set(chainId, new RpcClient(chainConf.rpc));
    }
    this.balanceFetcher = new BalanceFetcher(this.rpcClients);
  }

  /**
   * Get native balance for an address on any chain.
   */
  async getBalance(chainId: ChainId, address: string): Promise<Balance> {
    return this.balanceFetcher.getBalance(chainId, address);
  }

  /**
   * Get token balance (ERC20, SPL, etc.).
   */
  async getTokenBalance(chainId: ChainId, owner: string, token: string): Promise<TokenBalance> {
    return this.balanceFetcher.getTokenBalance(chainId, owner, token);
  }

  /**
   * Send a signed transaction.
   */
  async sendTransaction(chainId: ChainId, signedTx: string): Promise<TransactionResult> {
    const client = this.rpcClients.get(chainId);
    if (!client) throw new Error(`No RPC client for chain: ${chainId}`);

    const hash = await client.call<string>('eth_sendRawTransaction', [signedTx]);
    return { hash, status: 'pending', confirmations: 0 };
  }

  /**
   * Get the current block number.
   */
  async getBlockNumber(chainId: ChainId): Promise<number> {
    const client = this.rpcClients.get(chainId);
    if (!client) throw new Error(`No RPC client for chain: ${chainId}`);
    const hex = await client.call<string>('eth_blockNumber', []);
    return parseInt(hex, 16);
  }

  /**
   * Get gas price (EVM chains).
   */
  async getGasPrice(chainId: ChainId): Promise<string> {
    const client = this.rpcClients.get(chainId);
    if (!client) throw new Error(`No RPC client for chain: ${chainId}`);
    return client.call<string>('eth_gasPrice', []);
  }

  /**
   * Estimate gas for a transaction.
   */
  async estimateGas(chainId: ChainId, tx: TransactionRequest): Promise<string> {
    const client = this.rpcClients.get(chainId);
    if (!client) throw new Error(`No RPC client for chain: ${chainId}`);
    return client.call<string>('eth_estimateGas', [tx]);
  }

  /**
   * Get transaction receipt.
   */
  async getTransactionReceipt(chainId: ChainId, hash: string): Promise<TransactionResult> {
    const client = this.rpcClients.get(chainId);
    if (!client) throw new Error(`No RPC client for chain: ${chainId}`);
    const receipt = await client.call<{
      status: string;
      blockNumber: string;
      gasUsed: string;
      transactionHash: string;
    }>('eth_getTransactionReceipt', [hash]);

    return {
      hash: receipt.transactionHash,
      status: receipt.status === '0x1' ? 'confirmed' : 'failed',
      blockNumber: parseInt(receipt.blockNumber, 16),
      gasUsed: receipt.gasUsed,
      confirmations: 0,
    };
  }

  /**
   * Check if a chain is supported.
   */
  hasChain(chainId: ChainId): boolean {
    return this.rpcClients.has(chainId);
  }

  /**
   * Get all supported chain IDs.
   */
  getSupportedChains(): ChainId[] {
    return Array.from(this.rpcClients.keys());
  }
}
