/**
 * Element SDK - NFT marketplace for Element
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export class ElementSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "Element"); }
}
