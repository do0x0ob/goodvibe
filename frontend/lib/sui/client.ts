import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { NETWORKS, SUI_NETWORK } from '@/config/sui';

function getClientUrl() {
  if (SUI_NETWORK === 'mainnet') {
    return NETWORKS.mainnet.url;
  }
  return getFullnodeUrl(SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet');
}

export const suiClient = new SuiClient({
  url: getClientUrl(),
});

