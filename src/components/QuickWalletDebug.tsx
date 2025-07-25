"use client";

import { useAccount, useBalance } from "wagmi";
import { useState } from "react";

export function QuickWalletDebug() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { address, isConnected, connector } = useAccount();
  const { chain } = useAccount();
  const { data: balance, isLoading, error } = useBalance({ address });

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          🔍 Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Wallet Debug</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Connected:</span>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? '✅' : '❌'}
          </span>
        </div>

        {isConnected && (
          <>
            <div className="flex justify-between">
              <span>Wallet:</span>
              <span className="font-mono">{connector?.name}</span>
            </div>

            <div className="flex justify-between">
              <span>Chain:</span>
              <span className="font-mono">{chain?.name} ({chain?.id})</span>
            </div>

            <div>
              <div className="text-gray-600">Address:</div>
              <div className="font-mono text-xs break-all">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>

            <div className="flex justify-between">
              <span>Balance:</span>
              <span className="font-mono">
                {isLoading ? '⏳' : error ? '❌' : balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'N/A'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
