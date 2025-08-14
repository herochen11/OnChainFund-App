import { platform } from "os";

export const version = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

export const isServer = typeof window === "undefined";
export const isBrowser = !isServer;

const mode = process.env.NODE_ENV ?? "development";
export const isDevelopment = mode === "development";
export const isProduction = mode === "production";

const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'OnChain Fund';
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const infuraApiKey = process.env.INFURA_API_KEY || '';

const platformConfig = {
    platformName,
    mode,
    walletConnectProjectId,
    pollingInterval: 15000,
    infuraApiKey
}

export default platformConfig;