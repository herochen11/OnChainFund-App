"use client";

import "@rainbow-me/rainbowkit/styles.css";
import platformConfig from "@/lib/environment";
import { getRpcUrl } from "@/lib/rpc";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import type { ReactNode } from "react";
import { WagmiProvider as WagmiProviderBase, createConfig, http } from "wagmi";
import { mainnet, polygon, sepolia } from "viem/chains";
import {
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
  injectedWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Define chains array with proper typing
const chains = [mainnet, polygon, sepolia];

// supported wallet setup
const getWallets = () => {
  const wallets = [
    metaMaskWallet,
    walletConnectWallet,
    coinbaseWallet,
    rainbowWallet,
    injectedWallet,
    trustWallet,
    ledgerWallet,
    safeWallet
  ];

  return wallets;
};

const wagmiConnectors = connectorsForWallets(
  [
    {
      groupName: 'Supported Wallets',
      wallets: getWallets(),
    },
  ],
  {
    appName: platformConfig.platformName,
    projectId: platformConfig.walletConnectProjectId,
  }
);

const WagmiConfig = createConfig({
  chains: chains as any, // Type assertion to resolve compatibility
  connectors: wagmiConnectors,
  transports: {
    [mainnet.id]: http(getRpcUrl("ethereum")),
    [polygon.id]: http(getRpcUrl("polygon")),
    [sepolia.id]: http(getRpcUrl("sepolia")),
  },
  ssr: true,
  syncConnectedChain: true, // Ensure Wagmi follows MetaMask's connected chain
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProviderBase config={WagmiConfig}>{children}
    </WagmiProviderBase>
  );
}
