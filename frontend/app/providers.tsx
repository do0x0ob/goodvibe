"use client";

// Initialize Buffer polyfill for stable-layer-sdk and pyth-sui-js
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  // Also set global for compatibility
  (globalThis as any).Buffer = Buffer;
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { useState } from "react";
import { modernTheme } from "@/config/walletTheme";
import { MockDataProvider } from "@/contexts/MockDataContext";
import "@mysten/dapp-kit/dist/index.css";

const networks = {
  mainnet: {
    url: getFullnodeUrl('mainnet'),
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="mainnet">
        <WalletProvider theme={modernTheme} autoConnect>
          <MockDataProvider>
            {children}
          </MockDataProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
