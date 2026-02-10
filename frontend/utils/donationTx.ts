import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, PLATFORM_ID, VAULT_COIN_TYPE } from '@/config/sui';

/**
 * Builds a transaction to create a new vault with an initial deposit
 * @param coinType - The coin type (e.g., STABLE_COIN_TYPE)
 * @param initialDepositCoin - The coin object ID for the initial deposit
 * @returns Transaction ready for signing
 */
export function buildCreateVaultTx(
  coinType: string,
  initialDepositCoin: string
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::create_vault`,
    typeArguments: [coinType],
    arguments: [
      tx.object(PLATFORM_ID),
      tx.object(initialDepositCoin),
    ],
  });
  
  return tx;
}

/**
 * Builds a transaction to update donation configuration
 * Updates global donation percentage and project allocations in one transaction
 * @param vaultId - Vault object ID
 * @param globalPercentage - Global donation percentage (0-100)
 * @param projectIds - Array of project IDs to allocate to
 * @param percentages - Array of percentages for each project (must sum to 100)
 * @param coinType - The coin type
 * @returns Transaction ready for signing
 */
export function buildUpdateDonationConfigTx(
  vaultId: string,
  globalPercentage: number,
  projectIds: string[],
  percentages: number[]
): Transaction {
  if (projectIds.length !== percentages.length) {
    throw new Error('projectIds and percentages arrays must have the same length');
  }
  
  const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
  if (totalPercentage !== 100) {
    throw new Error(`Total percentage must be 100, got ${totalPercentage}`);
  }
  
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::update_donation_config`,
    typeArguments: [VAULT_COIN_TYPE],
    arguments: [
      tx.object(vaultId),
      tx.pure.u8(globalPercentage),
      tx.pure.vector('address', projectIds),
      tx.pure.vector('u8', percentages),
    ],
  });
  
  return tx;
}
