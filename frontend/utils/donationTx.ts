import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID } from '@/config/sui';

export async function buildCreateVaultTx(coinType: string): Promise<Transaction> {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::create_vault`,
    typeArguments: [coinType],
  });
  
  return tx;
}

export async function buildSetDonationConfigTx(
  vaultId: string,
  projectId: string,
  percentage: number,
  coinType: string
): Promise<Transaction> {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::set_donation_config`,
    typeArguments: [coinType],
    arguments: [
      tx.object(vaultId),
      tx.pure.id(projectId),
      tx.pure.u8(percentage),
    ],
  });
  
  return tx;
}
