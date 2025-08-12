/**
 * Utility functions for wallet address validation and management
 */

/**
 * Validates if a string is a valid Ethereum address
 * @param address - The address string to validate
 * @returns boolean - True if valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address) return false;
  
  // Check if it starts with 0x and has 42 characters total
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
}

/**
 * Formats a wallet address for display (shortens long addresses)
 * @param address - The full wallet address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Formatted address string
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validates and normalizes an Ethereum address
 * @param address - The address to validate and normalize
 * @returns Object with validation result and normalized address
 */
export function validateAndNormalizeAddress(address: string): {
  isValid: boolean;
  normalizedAddress: string;
  error?: string;
} {
  const trimmedAddress = address.trim();
  
  if (!trimmedAddress) {
    return {
      isValid: false,
      normalizedAddress: '',
      error: 'Address cannot be empty'
    };
  }
  
  // Convert to lowercase for consistency
  const normalizedAddress = trimmedAddress.toLowerCase();
  
  if (!isValidEthereumAddress(normalizedAddress)) {
    return {
      isValid: false,
      normalizedAddress: '',
      error: 'Invalid Ethereum address format. Must be 42 characters starting with 0x'
    };
  }
  
  return {
    isValid: true,
    normalizedAddress
  };
}

/**
 * Hook-like interface for managing wallet address lists
 * This can be used across different policy steps
 */
export interface WalletListManager {
  addresses: string[];
  addAddress: (address: string) => { success: boolean; error?: string };
  addOwnerWallet: (ownerAddress: string) => { success: boolean; error?: string };
  removeAddress: (address: string) => void;
  hasAddress: (address: string) => boolean;
  clearAddresses: () => void;
}

/**
 * Creates a wallet list manager with validation
 * @param initialAddresses - Initial list of addresses
 * @param setAddresses - State setter function
 * @returns WalletListManager interface
 */
export function createWalletListManager(
  addresses: string[],
  setAddresses: (addresses: string[]) => void
): WalletListManager {
  
  const addAddress = (address: string): { success: boolean; error?: string } => {
    const validation = validateAndNormalizeAddress(address);
    
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
    
    // Check for duplicates (case insensitive)
    const addressExists = addresses.some(
      existingAddr => existingAddr.toLowerCase() === validation.normalizedAddress
    );
    
    if (addressExists) {
      return { success: false, error: 'Address already exists in the list' };
    }
    
    setAddresses([...addresses, validation.normalizedAddress]);
    return { success: true };
  };
  
  const addOwnerWallet = (ownerAddress: string): { success: boolean; error?: string } => {
    if (!ownerAddress) {
      return { success: false, error: 'No wallet connected' };
    }
    
    return addAddress(ownerAddress);
  };
  
  const removeAddress = (addressToRemove: string): void => {
    setAddresses(addresses.filter(addr => 
      addr.toLowerCase() !== addressToRemove.toLowerCase()
    ));
  };
  
  const hasAddress = (address: string): boolean => {
    return addresses.some(addr => 
      addr.toLowerCase() === address.toLowerCase()
    );
  };
  
  const clearAddresses = (): void => {
    setAddresses([]);
  };
  
  return {
    addresses,
    addAddress,
    addOwnerWallet,
    removeAddress,
    hasAddress,
    clearAddresses
  };
}

/**
 * Common validation errors for user feedback
 */
export const AddressValidationErrors = {
  EMPTY: 'Address cannot be empty',
  INVALID_FORMAT: 'Invalid Ethereum address format',
  ALREADY_EXISTS: 'Address already exists in the list',
  NOT_CONNECTED: 'Please connect your wallet first'
} as const;
