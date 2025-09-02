import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type Deployment } from "@/lib/consts";
import { type Address, formatUnits } from "viem";
import { useEffect, useState } from "react";
import { Shield, ChevronDown, ChevronRight } from "lucide-react";
import { POLICY_TYPES, POLICY_CATEGORIES, type VaultPolicyData } from "@/types/policies";
import { getVaultPolicyInformation } from "@/lib/policyConfigGet";
import { getAssetDecimals } from "@/lib/assets";

interface PolicyTabProps {
  vault: Address;
  deployment: Deployment;
  comptrollerProxy?: Address | null;
}

interface PolicyCategoryProps {
  category: {
    id: string;
    label: string;
    description: string;
  };
  policies: typeof POLICY_TYPES;
  policyData: VaultPolicyData | null;
  enabledCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  deployment: Deployment; // Added deployment prop
}

interface PolicyDetailProps {
  policy: typeof POLICY_TYPES[number];
  enabled: boolean;
  settings?: any; // This will be typed properly when real data is implemented
  deployment: Deployment; // Added deployment prop
}

function PolicyDetail({ policy, enabled, settings, deployment }: PolicyDetailProps) {
  if (!enabled) {
    return null;
  }

  // Display settings data only for minMaxInvestment which has real data
  const getSettingsDisplay = (policyId: string, settings: any, deployment: Deployment) => {
    if (!settings || !settings.settings) return null;

    switch (policyId) {
      case 'minMaxInvestment':
        const { minInvestmentAmount, maxInvestmentAmount, assetSymbol, denominationAsset } = settings.settings;
        
        if (!denominationAsset) {
          return {
            summary: `Min: ${minInvestmentAmount} ${assetSymbol}, Max: ${maxInvestmentAmount} ${assetSymbol} (raw values)`
          };
        }

        try {
          // Get decimals from assets.ts - no async needed!
          const assetDecimals = getAssetDecimals(denominationAsset, deployment);
          console.log(`Using decimals for ${denominationAsset}:`, assetDecimals);

          // Format amounts using viem's formatUnits
          const minInvestmentAmountFormatted = formatUnits(BigInt(minInvestmentAmount), assetDecimals);
          const maxInvestmentAmountFormatted = formatUnits(BigInt(maxInvestmentAmount), assetDecimals);

          // Remove unnecessary trailing zeros and limit decimal places
          const minFormatted = parseFloat(minInvestmentAmountFormatted).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 6
          });
          const maxFormatted = parseFloat(maxInvestmentAmountFormatted).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 6
          });

          return {
            summary: `Min: ${minFormatted} ${assetSymbol}, Max: ${maxFormatted} ${assetSymbol}`,
            details: [
              `Minimum: ${minFormatted} ${assetSymbol}`,
              `Maximum: ${maxFormatted} ${assetSymbol}`
            ]
          };
        } catch (error) {
          console.error('Error formatting investment amounts:', error);
          return {
            summary: `Min: ${minInvestmentAmount} ${assetSymbol}, Max: ${maxInvestmentAmount} ${assetSymbol} (formatting error)`
          };
        }
      default:
        return null; // No detailed settings for other policies yet
    }
  };

  const settingsDisplay = getSettingsDisplay(policy.id, settings, deployment); // Pass deployment to the function

  return (
    <div className="ml-6 mt-3 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-200">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{policy.label}</h4>
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          Enabled
        </Badge>
      </div>

      {settingsDisplay ? (
        <div className="space-y-2 text-sm text-gray-600">
          <div className="text-gray-500">{settingsDisplay.summary}</div>
          {settingsDisplay.details && (
            <ul className="list-disc list-inside space-y-1 ml-2">
              {settingsDisplay.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Policy is active. Configuration details will be available in future updates.
        </div>
      )}
    </div>
  );
}

function PolicyCategory({ category, policies, policyData, enabledCount, isExpanded, onToggle, deployment }: PolicyCategoryProps) {
  const categoryPolicies = policies.filter(p => p.category === category.id);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{category.label}</h3>
            <p className="text-sm text-gray-500">
              {enabledCount} enabled
            </p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="pb-4">
          {categoryPolicies.map((policy) => {
            // Get enabled status from real data
            const policyConfig = policyData?.policies[policy.id as keyof typeof policyData.policies];
            const isEnabled = policyConfig?.enabled ?? false;

            return (
              <PolicyDetail
                key={policy.id}
                policy={policy}
                enabled={isEnabled}
                settings={policyConfig}
                deployment={deployment} // Pass deployment to PolicyDetail
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper function to get category enabled count
function getCategoryEnabledCount(categoryId: string, policyData: VaultPolicyData | null): number {
  if (!policyData) return 0;

  const categoryPolicies = POLICY_TYPES.filter(p => p.category === categoryId);
  return categoryPolicies.filter(p => {
    const policyConfig = policyData.policies[p.id as keyof typeof policyData.policies];
    return policyConfig?.enabled ?? false;
  }).length;
}

export function PolicyTab({ vault, deployment, comptrollerProxy }: PolicyTabProps) {
  const [policyData, setPolicyData] = useState<VaultPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['deposits', 'shares'])); // Start with deposits and shares expanded

  useEffect(() => {
    async function fetchPolicyData() {
      if (!vault) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getVaultPolicyInformation(vault, deployment);
        setPolicyData(data);
      } catch (err) {
        console.error("Failed to fetch policy data:", err);
        setError("Failed to load policy information");
      } finally {
        setLoading(false);
      }
    }

    fetchPolicyData();
  }, [vault, deployment]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (error) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Error loading policy information</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total enabled policies
  const totalEnabled = policyData ? policyData.totalEnabledCount : 0;

  return (
    <Card className="bg-white">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Policy Configuration</h2>
            <span className="text-sm font-medium text-gray-600">
              {totalEnabled} policies enabled
            </span>
          </div>
        </div>

        {/* Policy Categories */}
        <div>
          {POLICY_CATEGORIES.map((category) => {
            const enabledCount = policyData ? getCategoryEnabledCount(category.id, policyData) : 0;
            const isExpanded = expandedCategories.has(category.id);

            return (
              <PolicyCategory
                key={category.id}
                category={category}
                policies={POLICY_TYPES}
                policyData={policyData}
                enabledCount={enabledCount}
                isExpanded={isExpanded}
                onToggle={() => toggleCategory(category.id)}
                deployment={deployment} // Pass deployment prop to PolicyCategory
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total active policies: {totalEnabled} of {POLICY_TYPES.length}
            </span>
            <div className="flex items-center gap-2 text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Real policy data from blockchain</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

