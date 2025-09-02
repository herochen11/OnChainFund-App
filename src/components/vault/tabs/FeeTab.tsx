import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type Deployment } from "@/lib/consts";
import { getVaultFeeInformation, type VaultFeeData } from "@/lib/feeConfigGet";
import { formatUnits } from "viem";
import { type Address } from "viem";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, HelpCircle } from "lucide-react";

interface FeeTabProps {
  vault: Address;
  deployment: Deployment;
  comptrollerProxy?: Address | null;
}

interface FeeRowProps {
  feeType: string;
  settings: React.ReactNode;
  recipient?: React.ReactNode;
  enabled: boolean;
}

function FeeRow({ feeType, settings, recipient, enabled }: FeeRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-gray-100 last:border-b-0">
      {/* Fee Type Column */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{feeType}</span>
        {enabled && (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            Active
          </Badge>
        )}
      </div>

      {/* Settings Column */}
      <div className="space-y-2">
        {settings}
      </div>

      {/* Recipient Column */}
      <div className="flex items-center justify-between">
        {recipient}
      </div>
    </div>
  );
}

function AddressDisplay({ address, label }: { address: string; label?: string }) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
      <span className="text-sm text-gray-600">{label || shortAddress}</span>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Copy address"
      >
        <Copy className="w-3 h-3 text-gray-400" />
      </button>
      <button
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="View on explorer"
      >
        <ExternalLink className="w-3 h-3 text-gray-400" />
      </button>
    </div>
  );
}

function SettingItem({ label, value, helpText }: { label: string; value: string; helpText?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
      {helpText && (
        <span title={helpText}>
          <HelpCircle className="w-3 h-3 text-gray-400" />
        </span>
      )}
    </div>
  );
}

function LoadingFeeRow({ feeType }: { feeType: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{feeType}</span>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
      </div>
      <div>
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function FeeTab({ vault, deployment, comptrollerProxy }: FeeTabProps) {
  const [feeData, setFeeData] = useState<VaultFeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeeData() {
      if (!vault) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getVaultFeeInformation(vault, deployment);
        setFeeData(data);
      } catch (err) {
        console.error("Failed to fetch fee data:", err);
        setError("Failed to load fee information");
      } finally {
        setLoading(false);
      }
    }

    fetchFeeData();
  }, [vault, deployment]);

  if (error) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Error loading fee information</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Fee Type
          </div>
          <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Settings
          </div>
          <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Recipient
          </div>
        </div>

        {/* Fee Rows */}
        <div className="p-6">
          {loading ? (
            <>
              <LoadingFeeRow feeType="Management Fee" />
              <LoadingFeeRow feeType="Performance Fee" />
              <LoadingFeeRow feeType="Entrance Fee" />
              <LoadingFeeRow feeType="Exit Fee" />
            </>
          ) : (
            <>
              {/* Management Fee - Always show */}
              <FeeRow
                feeType="Management Fee"
                enabled={feeData?.fees.management.enabled ?? false}
                settings={
                  <SettingItem
                    label="Rate"
                    value={feeData?.fees.management.enabled
                      ? `${feeData.fees.management.rate}%`
                      : "0.00%"
                    }
                  />
                }
                recipient={
                  feeData?.fees.management.enabled && feeData.fees.management.recipient ? (
                    <AddressDisplay address={feeData.fees.management.recipient} />
                  ) : (
                    <span className="text-sm text-gray-400">Not configured</span>
                  )
                }
              />

              {/* Performance Fee - Always show */}
              <FeeRow
                feeType="Performance Fee"
                enabled={feeData?.fees.performance.enabled ?? false}
                settings={
                  <div className="space-y-1">
                    <SettingItem
                      label="Rate"
                      value={feeData?.fees.performance.enabled
                        ? `${feeData.fees.performance.rate}%`
                        : "0.00%"
                      }
                    />
                    {feeData?.fees.performance.enabled &&
                      feeData.fees.performance.highWaterMark != null &&
                      feeData.fees.performance.highWaterMark > 0n && (
                        <SettingItem
                          label="High watermark"
                          value={`${formatUnits(feeData.fees.performance.highWaterMark, 18)} USDC`}
                          helpText="Performance fee is only charged above this threshold"
                        />
                      )}
                  </div>
                }
                recipient={
                  feeData?.fees.performance.enabled && feeData.fees.performance.recipient ? (
                    <AddressDisplay address={feeData.fees.performance.recipient} />
                  ) : (
                    <span className="text-sm text-gray-400">Not configured</span>
                  )
                }
              />

              {/* Entrance Fee - Always show */}
              <FeeRow
                feeType="Entrance Fee"
                enabled={feeData?.fees.entrance.enabled ?? false}
                settings={
                  <SettingItem
                    label="Rate"
                    value={feeData?.fees.entrance.enabled
                      ? `${feeData.fees.entrance.rate}%`
                      : "0.00%"
                    }
                  />
                }
                recipient={
                  feeData?.fees.entrance.enabled ? (
                    feeData.fees.entrance.feeType === 'burn' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Vault</span>
                        <span title="Entrance fee tokens are burned">
                          <HelpCircle className="w-3 h-3 text-gray-400" />
                        </span>
                      </div>
                    ) : (
                      feeData.fees.entrance.recipient ? (
                        <AddressDisplay address={feeData.fees.entrance.recipient} />
                      ) : (
                        <span className="text-sm text-gray-400">Not configured</span>
                      )
                    )
                  ) : (
                    <span className="text-sm text-gray-400">Not configured</span>
                  )
                }
              />

              {/* Exit Fee - Always show */}
              <FeeRow
                feeType="Exit Fee"
                enabled={feeData?.fees.exit.enabled ?? false}
                settings={
                  <div className="space-y-1">
                    <SettingItem
                      label="Rate (in kind)"
                      value={feeData?.fees.exit.enabled
                        ? (feeData.fees.exit.inKindRate || feeData.fees.exit.rate || "0.00%")
                        : "0.00%"
                      }
                    />
                    <SettingItem
                      label="Rate (specific asset)"
                      value={feeData?.fees.exit.enabled
                        ? (feeData.fees.exit.specificAssetRate || feeData.fees.exit.rate || "0.00%")
                        : "0.00%"
                      }
                    />
                  </div>
                }
                recipient={
                  feeData?.fees.exit.enabled ? (
                    feeData.fees.exit.feeType === 'burn' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Vault</span>
                        <span title="Exit fee tokens are burned">
                          <HelpCircle className="w-3 h-3 text-gray-400" />
                        </span>
                      </div>
                    ) : (
                      feeData.fees.exit.recipient ? (
                        <AddressDisplay address={feeData.fees.exit.recipient} />
                      ) : (
                        <span className="text-sm text-gray-400">Not configured</span>
                      )
                    )
                  ) : (
                    <span className="text-sm text-gray-400">Not configured</span>
                  )
                }
              />
            </>
          )}
        </div>

        {/* Summary Footer */}
        {!loading && feeData && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Total active fees: {feeData.totalEnabledCount}
              </span>
              <span className="text-gray-500">
                Last updated: {new Date(feeData.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
