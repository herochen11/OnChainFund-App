import type { Deployment } from "./consts";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { GraphQLClient, type RequestDocument, type Variables } from "graphql-request";
import { cache } from "react";

// Configuration for your custom subgraph endpoints
const CUSTOM_SUBGRAPH_ENDPOINTS = {
  ethereum: "YOUR_ETHEREUM_SUBGRAPH_URL_HERE",
  polygon: "YOUR_POLYGON_SUBGRAPH_URL_HERE",
  testnet: "https://api.studio.thegraph.com/query/118506/on-chain-fund-vault-core/version/latest", // Replace with your actual Sepolia subgraph URL
};

// Set to true to use your custom subgraphs, false to use original Enzyme subgraphs

function getSubgraphUrl(deployment: Deployment): string {
  const endpoints = CUSTOM_SUBGRAPH_ENDPOINTS;

  switch (deployment) {
    case "ethereum":
      return endpoints.ethereum;
    case "polygon":
      return endpoints.polygon;
    case "testnet":
      return endpoints.testnet;
  }
}

export const getCoreSubgrahClient = cache(function getCoreSubgrahClient(deployment: Deployment) {
  const url = getSubgraphUrl(deployment);

  return new GraphQLClient(url, {
    fetch: fetch,
    headers: {
      'Content-Type': 'application/json',
    }
  });
});

export async function queryCoreSubgraph<TType, TVariables extends Variables = Variables>({
  deployment,
  document,
  variables,
}: QuerySubgraphParams<TType, TVariables> & { deployment: Deployment }) {
  const client = getCoreSubgrahClient(deployment);
  return await client.request(document, variables);
}

// Simple fetch-based query function for your custom subgraph
export async function querySubgraph<TData = any>(
  deployment: Deployment,
  query: string,
  variables?: Record<string, any>
): Promise<TData> {
  const url = getSubgraphUrl(deployment);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

// rome-ignore lint/suspicious/noExplicitAny: this is fine ...
export type QuerySubgraphParams<TType, TVariables extends Variables = Variables> = TVariables extends Record<any, never>
  ? {
    variables?: never;
    document: RequestDocument | TypedDocumentNode<TType, TVariables>;
  }
  : {
    variables: TVariables;
    document: RequestDocument | TypedDocumentNode<TType, TVariables>;
  };

// Your vault data types
export interface VaultData {
  id: string;
  vaultProxy: string;
  comptrollerProxy: string;
  fundName: string;
  fundSymbol: string;
  denominationAsset: string;
  creator: {
    id: string;
  };
  createdAtTimestamp?: string;
}

export interface AllVaultsResponse {
  vaults: VaultData[];
}

export interface VaultsByCreatorResponse {
  vaults: VaultData[];
}