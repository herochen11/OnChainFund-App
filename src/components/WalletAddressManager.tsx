"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import {
  createWalletListManager,
  formatAddress,
  type WalletListManager
} from "@/lib/wallet-utils";
import { type Address } from "viem";

interface WalletAddressManagerProps {
  addresses: Address[];
  setAddresses: (addresses: Address[]) => void;
  placeholder?: string;
  showOwnerButton?: boolean;
  className?: string;
}

export function WalletAddressManager({
  addresses,
  setAddresses,
  placeholder = "Enter address ...",
  showOwnerButton = true,
  className = ""
}: WalletAddressManagerProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const [inputAddress, setInputAddress] = useState("");
  const [validationError, setValidationError] = useState<string>("");

  // Create wallet list manager
  const walletManager = createWalletListManager(addresses, setAddresses);

  const handleAddAddress = () => {
    const result = walletManager.addAddress(inputAddress);

    if (result.success) {
      setInputAddress("");
      setValidationError("");
    } else {
      setValidationError(result.error || "Failed to add address");
    }
  };

  const handleAddOwnerWallet = () => {
    if (!isConnected || !connectedAddress) {
      setValidationError("Please connect your wallet first");
      return;
    }

    const result = walletManager.addOwnerWallet(connectedAddress);

    if (!result.success) {
      setValidationError(result.error || "Failed to add owner wallet");
    } else {
      setValidationError("");
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAddress();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputAddress(e.target.value);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("");
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input and Buttons */}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputAddress}
          onChange={handleInputChange}
          onKeyPress={handleInputKeyPress}
          className={`flex-1 ${validationError ? 'border-red-500' : ''}`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddAddress}
          disabled={!inputAddress.trim()}
          className="text-blue-600"
        >
          Add
        </Button>
        {showOwnerButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOwnerWallet}
            disabled={!isConnected}
            className={`text-blue-600 ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Add Owner Wallet
          </Button>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <p className="text-red-500 text-sm">{validationError}</p>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <p className="text-red-500 text-sm">Please specify some addresses or choose "Disallow All"</p>
      ) : (
        <div className="space-y-2">
          {addresses.map((address, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <span className="font-mono text-sm" title={address}>
                {formatAddress(address)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => walletManager.removeAddress(address)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
