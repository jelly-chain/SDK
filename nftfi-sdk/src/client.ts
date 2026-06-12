/**
 * NFTfi SDK - NFT lending, offers, loans
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface NFTfiLoan { loanId: string; nft: { address: string; tokenId: string }; lender: string; borrower: string; amount: bigint; interest: number; duration: number }

export class NFTfiSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "NFTfi"); }
  async createOffer(params: { nft: string; tokenId: string; amount: bigint; interest: number; duration: number }): Promise<{ offerId: string }> { return { offerId: "0x" + Date.now().toString(16) }; }
  async acceptOffer(offerId: string): Promise<{ loanId: string }> { return { loanId: "0x" + Date.now().toString(16) }; }
  async getActiveLoans(): Promise<NFTfiLoan[]> { return []; }
}
