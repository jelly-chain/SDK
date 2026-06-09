// chain-connector/src/balances.ts
// Native and token balance fetching across chains

import { Balance, TokenBalance, ChainId } from './types.js';
import { RpcClient } from './rpc.js';

export class BalanceFetcher {
  constructor(private rpcClients: Map<ChainId, RpcClient>) {}

  /**
   * Get native balance for any chain.
   */
  async getBalance(chainId: ChainId, address: string): Promise<Balance> {
    const client = this.rpcClients.get(chainId);
    if (!client) throw new Error(`No RPC client for chain: ${chainId}`);

    switch (chainId) {
      case 'ethereum':
      case 'bnb':
      case 'polygon':
      case 'arbitrum':
      case 'optimism':
      case 'base':
      case 'avalanche':
      case 'cronos':
      case 'fantom':
      case 'gnosis':
      case 'celo':
      case 'harmony':
        return this.getEvmBalance(client, address, chainId);

      case 'solana':
        return this.getSolanaBalance(client, address);

      case 'bitcoin':
      case 'dogecoin':
      case 'litecoin':
        return this.getUtxoBalance(client, address, chainId);

      case 'sui':
        return this.getSuiBalance(client, address);

      case 'ton':
        return this.getTonBalance(client, address);

      default:
        throw new Error(`Balance fetching not implemented for: ${chainId}`);
    }
  }

  /**
   * Get ERC20 / SPL token balance.
   */
  async getTokenBalance(chainId: ChainId, ownerAddress: string, tokenAddress: string): Promise<TokenBalance> {
    const client = this.rpcClients.get(chainId);
    if (!client) throw new Error(`No RPC client for chain: ${chainId}`);

    if (this.isEvm(chainId)) {
      return this.getErc20Balance(client, ownerAddress, tokenAddress);
    }
    if (chainId === 'solana') {
      return this.getSplBalance(client, ownerAddress, tokenAddress);
    }
    throw new Error(`Token balances not supported for: ${chainId}`);
  }

  private async getEvmBalance(client: RpcClient, address: string, chainId: ChainId): Promise<Balance> {
    const hexBalance = await client.call<string>('eth_getBalance', [address, 'latest']);
    const decimals = this.getEvmDecimals(chainId);
    return {
      value: BigInt(hexBalance).toString(),
      decimals,
      symbol: this.getEvmSymbol(chainId),
    };
  }

  private async getErc20Balance(client: RpcClient, owner: string, token: string): Promise<TokenBalance> {
    const data = '0x70a08231' + owner.slice(2).padStart(64, '0');
    const hexBalance = await client.call<string>('eth_call', [{ to: token, data }, 'latest']);
    return {
      contractAddress: token,
      name: 'Unknown',
      value: BigInt(hexBalance).toString(),
      decimals: 18, // Would query decimals() in production
      symbol: '???',
    };
  }

  private async getSolanaBalance(client: RpcClient, address: string): Promise<Balance> {
    const result = await client.call<{ value: number }>('getBalance', [address]);
    return {
      value: result.value.toString(),
      decimals: 9,
      symbol: 'SOL',
    };
  }

  private async getSplBalance(client: RpcClient, owner: string, mint: string): Promise<TokenBalance> {
    const result = await client.call<{ value: { amount: string; decimals: number }[] }>(
      'getTokenAccountsByOwner',
      [owner, { mint }, { encoding: 'jsonParsed' }]
    );
    const amount = result.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.amount || '0';
    return {
      contractAddress: mint,
      name: 'SPL Token',
      value: amount,
      decimals: result.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.decimals || 0,
      symbol: 'SPL',
    };
  }

  private async getUtxoBalance(client: RpcClient, address: string, chainId: ChainId): Promise<Balance> {
    // Placeholder: real impl uses electrum protocol or block explorer API
    return { value: '0', decimals: 8, symbol: chainId === 'bitcoin' ? 'BTC' : chainId === 'dogecoin' ? 'DOGE' : 'LTC' };
  }

  private async getSuiBalance(client: RpcClient, address: string): Promise<Balance> {
    const result = await client.call<{ totalBalance: string }>('suix_getBalance', [address]);
    return { value: result.totalBalance, decimals: 9, symbol: 'SUI' };
  }

  private async getTonBalance(client: RpcClient, address: string): Promise<Balance> {
    const result = await client.call<string>('getAddressBalance', [address]);
    return { value: result, decimals: 9, symbol: 'TON' };
  }

  private isEvm(chainId: ChainId): boolean {
    return ['ethereum', 'bnb', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'cronos', 'fantom', 'gnosis', 'celo', 'harmony'].includes(chainId);
  }

  private getEvmDecimals(chainId: ChainId): number {
    const map: Record<string, number> = { ethereum: 18, bnb: 18, polygon: 18, arbitrum: 18, optimism: 18, base: 18, avalanche: 18, cronos: 18, fantom: 18, gnosis: 18, celo: 18, harmony: 18 };
    return map[chainId] || 18;
  }

  private getEvmSymbol(chainId: ChainId): string {
    const map: Record<string, string> = { ethereum: 'ETH', bnb: 'BNB', polygon: 'MATIC', arbitrum: 'ETH', optimism: 'ETH', base: 'ETH', avalanche: 'AVAX', cronos: 'CRO', fantom: 'FTM', gnosis: 'xDAI', celo: 'CELO', harmony: 'ONE' };
    return map[chainId] || 'ETH';
  }
}
