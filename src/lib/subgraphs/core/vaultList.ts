// Raw GraphQL query strings for your custom subgraph
export const VAULT_QUERIES = {
  ALL_VAULTS: `
    query AllVaults {
      vaults(first: 100, orderBy: createdAtTimestamp, orderDirection: desc) {
        id
        vaultProxy
        comptrollerProxy
        fundName
        fundSymbol
        denominationAsset
        creator {
          id
        }
        createdAtTimestamp
      }
    }
  `,
  
  VAULTS_BY_CREATOR: `
    query VaultsByCreator($creator: String!) {
      vaults(
        where: { creator: $creator }
        first: 100
        orderBy: createdAtTimestamp
        orderDirection: desc
      ) {
        id
        vaultProxy
        comptrollerProxy
        fundName
        fundSymbol
        denominationAsset
        creator {
          id
        }
        createdAtTimestamp
      }
    }
  `,
  
  VAULT_BY_PROXY: `
    query VaultByProxy($vaultProxy: String!) {
      vaults(where: { vaultProxy: $vaultProxy }) {
        id
        vaultProxy
        comptrollerProxy
        fundName
        fundSymbol
        denominationAsset
        creator {
          id
        }
        createdAtTimestamp
      }
    }
  `
};
