export const SUI_NETWORK = 'mainnet';

export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';
export const PLATFORM_ID = process.env.NEXT_PUBLIC_PLATFORM_ID || '';

export const USDC_TYPE =
  process.env.NEXT_PUBLIC_USDC_TYPE ||
  '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';

export const STABLE_COIN_TYPE =
  process.env.NEXT_PUBLIC_STABLE_COIN_TYPE ||
  '0x6d9fc33611f4881a3f5c0cd4899d95a862236ce52b3a38fef039077b0c5b5834::btc_usdc::BtcUSDC';

// Use StableLayer branded stablecoin for vault operations
export const VAULT_COIN_TYPE = STABLE_COIN_TYPE;

/** 最低支持金額（合約目前未定義，前端預設 1 USDC = 1e6） */
export const MIN_SUPPORT_AMOUNT = BigInt(1_000_000); // 1 USDC (6 decimals)

export const NETWORKS = {
  mainnet: {
    url: 'https://fullnode.mainnet.sui.io:443',
  },
};

export const NETWORK = NETWORKS.mainnet;
