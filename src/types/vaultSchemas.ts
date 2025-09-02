import { z } from 'zod';
import { type CreateVaultFormData } from './vault';

// Basic info validation schema
export const basicInfoSchema = z.object({
  vaultName: z.string().min(1, "Vault name is required"),
  vaultSymbol: z.string().min(1, "Vault symbol is required").max(10, "Symbol must be 10 characters or less"),
  denominationAsset: z.string().min(1, "Denomination asset is required"),
});

// Fee configuration validation schema
export const feeConfigSchema = z.object({
  management: z.object({
    enabled: z.boolean(),
    rate: z.string().default("0"),
    recipient: z.string().optional(),
  }).refine((data) => {
    if (data.enabled) {
      const rate = parseFloat(data.rate);
      return data.rate.trim() !== "" && !isNaN(rate) && rate > 0;
    }
    return true;
  }, {
    message: "Management fee rate is required when fee is enabled",
    path: ["rate"],
  }),
  performance: z.object({
    enabled: z.boolean(),
    rate: z.string().default("0"),
    recipient: z.string().optional(),
  }).refine((data) => {
    if (data.enabled) {
      const rate = parseFloat(data.rate);
      return data.rate.trim() !== "" && !isNaN(rate) && rate > 0;
    }
    return true;
  }, {
    message: "Performance fee rate is required when fee is enabled",
    path: ["rate"],
  }),
  entrance: z.object({
    enabled: z.boolean(),
    rate: z.string().default("0"),
    allocation: z.string().default("vault"),
    recipient: z.string().optional(),
  }).refine((data) => {
    if (data.enabled) {
      const rate = parseFloat(data.rate);
      return data.rate.trim() !== "" && !isNaN(rate) && rate > 0;
    }
    return true;
  }, {
    message: "Entrance fee rate is required when fee is enabled",
    path: ["rate"],
  }),
  exit: z.object({
    enabled: z.boolean(),
    inKindRate: z.string().default("0"),
    specificAssetRate: z.string().default("0"),
    allocation: z.string().default("vault"),
    recipient: z.string().optional(),
  })
    .refine((data) => {
      if (!data.enabled) return true;
      const inKindRate = parseFloat(data.inKindRate);
      return data.inKindRate.trim() !== "" && !isNaN(inKindRate) && inKindRate > 0;
    }, {
      message: "In-kind redemption rate is required when exit fee is enabled",
      path: ["inKindRate"],
    })
    .refine((data) => {
      if (!data.enabled) return true;
      const specificAssetRate = parseFloat(data.specificAssetRate);
      return data.specificAssetRate.trim() !== "" && !isNaN(specificAssetRate) && specificAssetRate > 0;
    }, {
      message: "Specific asset redemption rate is required when exit fee is enabled",
      path: ["specificAssetRate"],
    }),
});

// Policy configuration validation schema
export const policyConfigSchema = z.object({
  // Investment/Deposit Controls
  minMaxInvestment: z.object({
    enabled: z.boolean(),
    settings: z.object({
      minInvestmentAmount: z.string(),
      maxInvestmentAmount: z.string(),
    }).optional(),
  }).refine((data) => {
    if (data.enabled && data.settings) {
      const minAmount = parseFloat(data.settings.minInvestmentAmount || "");
      const maxAmount = parseFloat(data.settings.maxInvestmentAmount || "");
      // Both values must be provided and valid
      const hasMin = data.settings.minInvestmentAmount.trim() !== "" && !isNaN(minAmount) && minAmount >= 0;
      const hasMax = data.settings.maxInvestmentAmount.trim() !== "" && !isNaN(maxAmount) && maxAmount > 0;
      return hasMin && hasMax && maxAmount > minAmount;
    }
    // When enabled, settings must be provided
    if (data.enabled && !data.settings) {
      return false;
    }
    return true;
  }, {
    message: "Both minimum and maximum investment amounts are required when deposit limits are enabled",
    path: ["settings"],
  }),

  allowedDepositRecipients: z.object({
    enabled: z.boolean(),
    settings: z.object({
      existingListIds: z.array(z.string()),
      newListsArgs: z.array(z.object({
        updateType: z.string(),
        initialItems: z.array(z.string()),
      })),
    }).optional(),
  }).refine((data) => {
    if (data.enabled) {
      // When enabled, must have settings with at least one address
      if (!data.settings || !data.settings.newListsArgs || data.settings.newListsArgs.length === 0) {
        return false;
      }
      const initialItems = data.settings.newListsArgs[0]?.initialItems || [];
      return initialItems.length > 0;
    }
    return true;
  }, {
    message: "At least one wallet address is required when limiting deposit wallets",
    path: ["settings"],
  }),

  // Trading/Adapter Controls
  cumulativeSlippageTolerance: z.object({
    enabled: z.boolean(),
    settings: z.object({
      slippageTolerance: z.string(),
    }).optional(),
  }).refine((data) => {
    if (data.enabled && data.settings) {
      const tolerance = parseFloat(data.settings.slippageTolerance);
      return !isNaN(tolerance) && tolerance >= 0 && tolerance <= 10000; // 0-100% in basis points
    }
    return true;
  }, {
    message: "Valid slippage tolerance (0-10000 basis points) is required when policy is enabled",
    path: ["settings"],
  }),

  allowedAdapters: z.object({
    enabled: z.boolean(),
    settings: z.object({
      existingListIds: z.array(z.string()),
      newListsArgs: z.array(z.object({
        updateType: z.string(),
        initialItems: z.array(z.string()),
      })),
    }).optional(),
  }),

  allowedAdapterIncomingAssets: z.object({
    enabled: z.boolean(),
    settings: z.object({
      existingListIds: z.array(z.string()),
      newListsArgs: z.array(z.object({
        updateType: z.string(),
        initialItems: z.array(z.string()),
      })),
    }).optional(),
  }),

  disallowedAdapterIncomingAssets: z.object({
    enabled: z.boolean(),
    settings: z.object({
      existingListIds: z.array(z.string()),
      newListsArgs: z.array(z.object({
        updateType: z.string(),
        initialItems: z.array(z.string()),
      })),
    }).optional(),
  }),

  allowedAdaptersPerManager: z.object({
    enabled: z.boolean(),
    settings: z.object({
      users: z.array(z.string()),
      listsData: z.array(z.object({
        existingListIds: z.array(z.string()),
        newListsArgs: z.array(z.object({
          updateType: z.string(),
          initialItems: z.array(z.string()),
        })),
      })),
    }).optional(),
  }),

  // External Position Controls
  allowedExternalPositionTypes: z.object({
    enabled: z.boolean(),
    settings: z.object({
      externalPositionTypeIds: z.array(z.string()),
    }).optional(),
  }),

  allowedExternalPositionTypesPerManager: z.object({
    enabled: z.boolean(),
    settings: z.object({
      users: z.array(z.string()),
      listsData: z.array(z.object({
        existingListIds: z.array(z.string()),
        newListsArgs: z.array(z.object({
          updateType: z.string(),
          initialItems: z.array(z.string()),
        })),
      })),
    }).optional(),
  }),

  // Redemption Controls
  allowedAssetsForRedemption: z.object({
    enabled: z.boolean(),
    settings: z.object({
      existingListIds: z.array(z.string()),
      newListsArgs: z.array(z.object({
        updateType: z.string(),
        initialItems: z.array(z.string()),
      })),
    }).optional(),
  }),

  allowedRedeemersForSpecificAssets: z.object({
    enabled: z.boolean(),
    settings: z.object({
      existingListIds: z.array(z.string()),
      newListsArgs: z.array(z.object({
        updateType: z.string(),
        initialItems: z.array(z.string()),
      })),
    }).optional(),
  }),

  minAssetBalancesPostRedemption: z.object({
    enabled: z.boolean(),
    settings: z.object({
      assetToMinBalance: z.array(z.object({
        asset: z.string(),
        minBalance: z.string(),
      })),
    }).optional(),
  }),

  noDepegOnRedeemSharesForSpecificAssets: z.object({
    enabled: z.boolean(),
    settings: z.object({
      assetConfigs: z.array(z.object({
        asset: z.string(),
        referenceAsset: z.string(),
        deviationToleranceInBps: z.string(),
      })),
    }).optional(),
  }),

  // Share Transfer Controls
  allowedSharesTransferRecipients: z.object({
    enabled: z.boolean(),
    settings: z.object({
      existingListIds: z.array(z.string()),
      newListsArgs: z.array(z.object({
        updateType: z.string(),
        initialItems: z.array(z.string()),
      })),
    }).optional(),
  }).refine((data) => {
    if (data.enabled) {
      // When enabled, must have settings with at least one address
      if (!data.settings || !data.settings.newListsArgs || data.settings.newListsArgs.length === 0) {
        return false;
      }
      const initialItems = data.settings.newListsArgs[0]?.initialItems || [];
      return initialItems.length > 0;
    }
    return true;
  }, {
    message: "At least one wallet address is required when limiting share transfer recipients",
    path: ["settings"],
  }),
});

// Complete vault creation schema
export const createVaultSchema = z.object({
  // Basic information
  vaultName: z.string().min(1, "Vault name is required"),
  vaultSymbol: z.string().min(1, "Vault symbol is required").max(10, "Symbol must be 10 characters or less"),
  denominationAsset: z.string().min(1, "Denomination asset is required"),

  // Shares lock-up period (required)
  sharesLockUpPeriod: z.object({
    value: z.string().min(1, "Lock-up period value is required").refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "Lock-up period must be a valid positive number"),
    unit: z.enum(["minutes", "hours", "days", "weeks"], {
      required_error: "Time unit is required",
    }),
  }),

  // Fee configuration
  fees: feeConfigSchema,

  // Policy configuration
  policies: policyConfigSchema,
}) satisfies z.ZodType<CreateVaultFormData>;

// Individual step schemas for granular validation
export const stepSchemas = {
  basic: basicInfoSchema,
  fees: z.object({ fees: feeConfigSchema }),
  deposits: z.object({
    policies: z.object({
      minMaxInvestment: policyConfigSchema.shape.minMaxInvestment,
      allowedDepositRecipients: policyConfigSchema.shape.allowedDepositRecipients,
    })
  }),
  transferability: z.object({
    policies: z.object({
      allowedSharesTransferRecipients: policyConfigSchema.shape.allowedSharesTransferRecipients,
    })
  }),
  redemptions: z.object({
    sharesLockUpPeriod: z.object({
      value: z.string().min(1, "Lock-up period value is required").refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      }, "Lock-up period must be a valid positive number"),
      unit: z.enum(["minutes", "hours", "days", "weeks"], {
        required_error: "Time unit is required",
      }),
    }),
    policies: z.object({
      allowedAssetsForRedemption: policyConfigSchema.shape.allowedAssetsForRedemption,
      allowedRedeemersForSpecificAssets: policyConfigSchema.shape.allowedRedeemersForSpecificAssets,
      minAssetBalancesPostRedemption: policyConfigSchema.shape.minAssetBalancesPostRedemption,
      noDepegOnRedeemSharesForSpecificAssets: policyConfigSchema.shape.noDepegOnRedeemSharesForSpecificAssets,
    })
  }),
  assets: z.object({
    policies: z.object({
      cumulativeSlippageTolerance: policyConfigSchema.shape.cumulativeSlippageTolerance,
      allowedAdapters: policyConfigSchema.shape.allowedAdapters,
      allowedAdapterIncomingAssets: policyConfigSchema.shape.allowedAdapterIncomingAssets,
      disallowedAdapterIncomingAssets: policyConfigSchema.shape.disallowedAdapterIncomingAssets,
      allowedAdaptersPerManager: policyConfigSchema.shape.allowedAdaptersPerManager,
      allowedExternalPositionTypes: policyConfigSchema.shape.allowedExternalPositionTypes,
      allowedExternalPositionTypesPerManager: policyConfigSchema.shape.allowedExternalPositionTypesPerManager,
    })
  }),
} as const;

export type StepSchemaKey = keyof typeof stepSchemas;