// Step configuration for vault creation flow
export const VAULT_CREATION_STEPS = [
  {
    id: 'basic',
    title: 'Basic Info',
    description: 'Name, symbol & asset',
    isRequired: true,
  },
  {
    id: 'fees',
    title: 'Fee Setup',
    description: 'Management & performance',
    isRequired: false,
  },
  {
    id: 'deposits',
    title: 'Deposit Policies',
    description: 'Investment limits & restrictions',
    isRequired: false,
  },
  {
    id: 'transferability',
    title: 'Shares Transferability',
    description: 'Transfer ristriction',
    isRequired: false,
  },
  {
    id: 'redemptions',
    title: 'Redemption Policies',
    description: 'Exit rules & restrictions',
    isRequired: true,
  },
  {
    id: 'assets',
    title: 'Asset Management',
    description: 'Asset management policies',
    isRequired: false,
  },
  {
    id: 'review',
    title: 'Review & Deploy',
    description: 'Confirm & create vault',
    isRequired: true,
  }
] as const;

export type VaultCreationStepId = typeof VAULT_CREATION_STEPS[number]['id'];

// Step metadata for validation and navigation
export const STEP_METADATA = {
  basic: {
    requiredFields: ['vaultName', 'vaultSymbol', 'denominationAsset'] as const,
    validationSchema: 'basic' as const,
    canSkip: false,
  },
  fees: {
    requiredFields: [] as const, // Fees are optional
    validationSchema: 'fees' as const,
    canSkip: true,
  },
  deposits: {
    requiredFields: [] as const, // Policies are optional
    validationSchema: 'deposits' as const,
    canSkip: true,
  },
  transferability: {
    requiredFields: [] as const, // Policies are optional
    validationSchema: 'transferability' as const,
    canSkip: true,
  },
  redemptions: {
    requiredFields: ['sharesLockUpPeriod'] as const,
    validationSchema: 'redemptions' as const,
    canSkip: false,
  },
  assets: {
    requiredFields: [] as const, // Policies are optional
    validationSchema: 'assets' as const,
    canSkip: true,
  },
  review: {
    requiredFields: [] as const, // Review step has no specific fields
    validationSchema: null,
    canSkip: false,
  },
} as const;

// Helper function to get step by ID
export function getStepById(stepId: VaultCreationStepId) {
  const step = VAULT_CREATION_STEPS.find(step => step.id === stepId);
  if (!step) {
    throw new Error(`Step with id '${stepId}' not found`);
  }
  return step;
}

// Helper function to get step by ID (safe version that can return undefined)
export function findStepById(stepId: VaultCreationStepId) {
  return VAULT_CREATION_STEPS.find(step => step.id === stepId);
}

// Helper function to get step index
export function getStepIndex(stepId: VaultCreationStepId): number {
  const index = VAULT_CREATION_STEPS.findIndex(step => step.id === stepId);
  if (index === -1) {
    throw new Error(`Step with id '${stepId}' not found`);
  }
  return index;
}

// Helper function to get next step
export function getNextStep(currentStepId: VaultCreationStepId): VaultCreationStepId | null {
  const currentIndex = getStepIndex(currentStepId);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= VAULT_CREATION_STEPS.length) {
    return null; // No next step
  }

  return VAULT_CREATION_STEPS[nextIndex]!.id; // Safe to use ! because we checked the bounds
}

// Helper function to get previous step
export function getPreviousStep(currentStepId: VaultCreationStepId): VaultCreationStepId | null {
  const currentIndex = getStepIndex(currentStepId);
  const previousIndex = currentIndex - 1;

  if (previousIndex < 0) {
    return null; // No previous step
  }

  return VAULT_CREATION_STEPS[previousIndex]!.id; // Safe to use ! because we checked the bounds
}

// Helper function to check if step can be skipped
export function canSkipStep(stepId: VaultCreationStepId): boolean {
  return STEP_METADATA[stepId].canSkip;
}

// Helper function to get required fields for a step
export function getRequiredFields(stepId: VaultCreationStepId) {
  return STEP_METADATA[stepId].requiredFields;
}

// Helper function to get validation schema key for a step
export function getValidationSchema(stepId: VaultCreationStepId) {
  return STEP_METADATA[stepId].validationSchema;
}