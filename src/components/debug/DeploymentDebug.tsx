"use client";

import { useDeployment } from "@/lib/hooks/useDeployment";
import { getAssetOptions } from "@/lib/assets";
import { useState } from "react";

export function DeploymentDebug() {
  const [isExpanded, setIsExpanded] = useState(false);
  const deploymentState = useDeployment();
  const assets = getAssetOptions(deploymentState.deployment);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-16 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          🌐 Network
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Network Debug</h3>
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
          <span className={deploymentState.isConnected ? 'text-green-600' : 'text-red-600'}>
            {deploymentState.isConnected ? '✅' : '❌'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Deployment:</span>
          <span className="font-mono">{deploymentState.deployment}</span>
        </div>

        {deploymentState.chainId && (
          <div className="flex justify-between">
            <span>Chain ID:</span>
            <span className="font-mono">{deploymentState.chainId}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Supported:</span>
          <span className={deploymentState.isSupported ? 'text-green-600' : 'text-red-600'}>
            {deploymentState.isSupported ? '✅' : '❌'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Switch Needed:</span>
          <span className={deploymentState.needsNetworkSwitch ? 'text-red-600' : 'text-green-600'}>
            {deploymentState.needsNetworkSwitch ? '❌' : '✅'}
          </span>
        </div>

        <div>
          <div className="text-gray-600 mb-1">Available Assets ({assets.length}):</div>
          <div className="max-h-20 overflow-y-auto">
            {assets.map((asset, index) => (
              <div key={index} className="text-xs text-gray-500">
                {asset.label.split(' - ')[0]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
