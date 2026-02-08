import { NextResponse } from 'next/server';

// ==================== Mock Data ====================

const MOCK_VAULT_DATA = {
  vault: {
    id: 'mock-vault-1',
    owner: 'mock-owner-address',
    balance: BigInt(10000_000_000), // $10,000 USDC
    globalDonationPercentage: 50, // 50% of yield
    totalDonated: BigInt(2600_000_000), // $2,600 累積已捐
    createdAt: BigInt(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
  },
  // Dynamic Field allocations
  allocations: [
    {
      projectId: 'mock-1',
      percentage: 40,
      totalDonated: BigInt(1040_000_000), // $1,040
      lastDonationAt: BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: 'mock-2',
      percentage: 35,
      totalDonated: BigInt(910_000_000), // $910
      lastDonationAt: BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: 'mock-3',
      percentage: 25,
      totalDonated: BigInt(650_000_000), // $650
      lastDonationAt: BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ],
  // Calculated statistics
  stats: {
    estimatedAnnualYield: BigInt(520_000_000), // $520 (5.2% APY)
    donationPool: BigInt(260_000_000), // $260 (50% of yield)
    retainedYield: BigInt(260_000_000), // $260 (50% of yield)
    activeProjects: 3,
  },
};

// Simple cache
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// ==================== API Route ====================

export async function GET(request: Request) {
  const now = Date.now();
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('address');

  // Return cached data if valid
  if (cachedData && (now - lastFetchTime < CACHE_TTL)) {
    return NextResponse.json(cachedData);
  }

  try {
    // In real implementation:
    // 1. Query Vault object by owner address
    // 2. Query Dynamic Fields for allocations
    // 3. Calculate statistics

    // For now, return mock data with BigInt converted to string
    const vaultData = {
      vault: {
        id: MOCK_VAULT_DATA.vault.id,
        owner: MOCK_VAULT_DATA.vault.owner,
        balance: MOCK_VAULT_DATA.vault.balance.toString(),
        globalDonationPercentage: MOCK_VAULT_DATA.vault.globalDonationPercentage,
        totalDonated: MOCK_VAULT_DATA.vault.totalDonated.toString(),
        createdAt: MOCK_VAULT_DATA.vault.createdAt.toString(),
      },
      allocations: MOCK_VAULT_DATA.allocations.map(a => ({
        projectId: a.projectId,
        percentage: a.percentage,
        totalDonated: a.totalDonated.toString(),
        lastDonationAt: a.lastDonationAt.toString(),
      })),
      stats: {
        estimatedAnnualYield: MOCK_VAULT_DATA.stats.estimatedAnnualYield.toString(),
        donationPool: MOCK_VAULT_DATA.stats.donationPool.toString(),
        retainedYield: MOCK_VAULT_DATA.stats.retainedYield.toString(),
        activeProjects: MOCK_VAULT_DATA.stats.activeProjects,
      },
    };

    // Update cache
    cachedData = vaultData;
    lastFetchTime = now;

    return NextResponse.json(vaultData);
  } catch (error) {
    console.error('Error fetching vault data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vault data' },
      { status: 500 }
    );
  }
}
