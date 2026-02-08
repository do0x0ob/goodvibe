export const SUI_NETWORK = 'mainnet';

export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';
export const PLATFORM_ID = process.env.NEXT_PUBLIC_PLATFORM_ID || '';

export const USDC_TYPE = '0xdba34cad82e8a9f99ca86cdc886ddccf5c56c9d7d4a4d4e3d1ec8f5e04e2d6e8::usdc::USDC';
export const STABLE_COIN_TYPE = '0x6d9fc491e63e72d92e6538abe68f5ed0f09b4b6e1f0ad74d1c1e13a2d18e5e3c::btc_usdc::BtcUSDC';

export const NETWORKS = {
  mainnet: {
    url: 'https://fullnode.mainnet.sui.io:443',
  },
};
