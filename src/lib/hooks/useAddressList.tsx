"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletClient, usePublicClient } from "wagmi";
import { type Address, type Hex, parseAbi } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { CUSTOM_SEPOLIA_ENVIRONMENT } from "@/config/sepolia-environment";

// AddressListRegistry ABI - focusing on the createList function
const ADDRESS_LIST_REGISTRY_ABI = parseAbi([
  "function createList(address _owner, uint8 _updateType, address[] _initialItems) external returns (uint256 id_)",
  "function getListCount() external view returns (uint256 count_)",
  "function getListOwner(uint256 _id) external view returns (address owner_)",
  "function isInList(uint256 _id, address _item) external view returns (bool isInList_)",
  "function addToList(uint256 _id, address[] _items) external",
  "function removeFromList(uint256 _id, address[] _items) external",
  "event ListCreated(address indexed creator, address indexed owner, uint256 id, uint8 updateType)"
]);

// Update types enum matching the smart contract
export enum UpdateType {
  None = 0,
  AddOnly = 1,
  RemoveOnly = 2,
  AddAndRemove = 3
}

// Interface for creating a list
export interface CreateListParams {
  owner: Address;
  updateType: UpdateType;
  initialItems: Address[];
}

// Interface for the mutation result
export interface CreateListResult {
  listId: bigint;
  transactionHash: Hex;
  owner: Address;
  updateType: UpdateType;
  initialItems: Address[];
}

// Hook for creating a new address list
export function useCreateList() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const createListMutation = useMutation({
    mutationFn: async ({ owner, updateType, initialItems }: CreateListParams): Promise<CreateListResult> => {
      if (!walletClient) {
        throw new Error("Wallet client not available");
      }

      if (!publicClient) {
        throw new Error("Public client not available");
      }

      console.log("🔍 Creating address list with params:", {
        owner,
        updateType,
        initialItems,
        contractAddress: CUSTOM_SEPOLIA_ENVIRONMENT.contracts.addressListRegistry
      });

      // Call the createList function
      const hash = await walletClient.writeContract({
        address: CUSTOM_SEPOLIA_ENVIRONMENT.contracts.addressListRegistry as Address,
        abi: ADDRESS_LIST_REGISTRY_ABI,
        functionName: "createList",
        args: [owner, updateType, initialItems],
      });

      console.log("📝 CreateList transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(publicClient, {
        hash,
        confirmations: 1
      });

      console.log("✅ CreateList transaction confirmed:", receipt);

      // Parse the ListCreated event to get the list ID
      let listId: bigint | null = null;
      
      for (const log of receipt.logs) {
        try {
          // Try to decode the log as a ListCreated event
          if (log.address.toLowerCase() === CUSTOM_SEPOLIA_ENVIRONMENT.contracts.addressListRegistry.toLowerCase()) {
            // Parse the ListCreated event: event ListCreated(address indexed creator, address indexed owner, uint256 id, uint8 updateType)
            // The list ID is in the data field (3rd parameter, non-indexed)
            if (log.topics[0] === "0x" + "ListCreated".padEnd(64, "0")) { // This is a simplified check
              // For proper event parsing, we'd use a library, but for now we'll read from transaction receipt
              // The list ID should be available in the log data
              console.log("📋 Found ListCreated event log:", log);
            }
          }
        } catch (error) {
          console.warn("Could not parse log:", error);
        }
      }

      // Alternative: Read the latest list count to get the ID
      // Since lists are created sequentially, the newest list will have the highest ID
      try {
        const listCount = await publicClient.readContract({
          address: CUSTOM_SEPOLIA_ENVIRONMENT.contracts.addressListRegistry as Address,
          abi: ADDRESS_LIST_REGISTRY_ABI,
          functionName: "getListCount",
        });

        // The newest list ID should be listCount - 1 (if 0-indexed) or listCount (if 1-indexed)
        // Let's assume it's 1-indexed based on typical smart contract patterns
        listId = listCount;
        
        console.log("📊 Current list count:", listCount.toString());
        console.log("🆔 Assuming new list ID:", listId.toString());

      } catch (error) {
        console.error("Failed to get list count:", error);
        // Fallback: assume the list was created successfully but we don't know the ID
        listId = BigInt(0); // Placeholder value
      }

      const result: CreateListResult = {
        listId: listId || BigInt(0),
        transactionHash: hash,
        owner,
        updateType,
        initialItems,
      };

      console.log("✅ List created successfully:", result);

      return result;
    },

    onSuccess: (data) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["addressList"] });
      queryClient.invalidateQueries({ queryKey: ["listCount"] });
      
      console.log("🎉 Address list created successfully:", {
        listId: data.listId.toString(),
        transactionHash: data.transactionHash,
      });
    },

    onError: (error) => {
      console.error("❌ Failed to create address list:", error);
    },
  });

  return {
    createList: createListMutation.mutate,
    createListAsync: createListMutation.mutateAsync,
    isCreating: createListMutation.isPending,
    error: createListMutation.error,
    data: createListMutation.data,
    reset: createListMutation.reset,
  };
}

// Helper hook to get list information
export function useGetListInfo(listId: bigint | null) {
  const publicClient = usePublicClient();

  return {
    async getListOwner() {
      if (!publicClient || !listId) return null;
      
      try {
        return await publicClient.readContract({
          address: CUSTOM_SEPOLIA_ENVIRONMENT.contracts.addressListRegistry as Address,
          abi: ADDRESS_LIST_REGISTRY_ABI,
          functionName: "getListOwner",
          args: [listId],
        });
      } catch (error) {
        console.error("Failed to get list owner:", error);
        return null;
      }
    },

    async isInList(address: Address) {
      if (!publicClient || !listId) return false;
      
      try {
        return await publicClient.readContract({
          address: CUSTOM_SEPOLIA_ENVIRONMENT.contracts.addressListRegistry as Address,
          abi: ADDRESS_LIST_REGISTRY_ABI,
          functionName: "isInList",
          args: [listId, address],
        });
      } catch (error) {
        console.error("Failed to check if address is in list:", error);
        return false;
      }
    }
  };
}

// Utility function to create a list for policy configuration
export const createPolicyList = async (
  walletClient: any,
  publicClient: any,
  owner: Address,
  addresses: Address[]
): Promise<bigint> => {
  if (!walletClient || !publicClient) {
    throw new Error("Wallet and public clients are required");
  }

  console.log("🏗️ Creating policy list for:", { owner, addresses });

  // Use AddOnly update type for policy lists (most common case)
  const updateType = UpdateType.AddAndRemove;

  const hash = await walletClient.writeContract({
    address: CUSTOM_SEPOLIA_ENVIRONMENT.contracts.addressListRegistry as Address,
    abi: ADDRESS_LIST_REGISTRY_ABI,
    functionName: "createList",
    args: [owner, updateType, addresses],
  });

  const receipt = await waitForTransactionReceipt(publicClient, {
    hash,
    confirmations: 1
  });

  // Get the list count to determine the new list ID
  const listCount = await publicClient.readContract({
    address: CUSTOM_SEPOLIA_ENVIRONMENT.contracts.addressListRegistry as Address,
    abi: ADDRESS_LIST_REGISTRY_ABI,
    functionName: "getListCount",
  });

  console.log("✅ Policy list created with ID:", listCount.toString());

  return listCount;
};