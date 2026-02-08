import { NextResponse } from 'next/server';

// ==================== Mock Dashboard Data ====================

const MOCK_DASHBOARD = {
  vault: {
    id: 'mock-vault-1',
    owner: 'mock-address',
    balance: BigInt(10000_000_000), // $10,000
    globalDonationPercentage: 50, // 50% of yield
    totalDonated: BigInt(2600_000_000), // $2,600 累積已捐
    createdAt: BigInt(Date.now() - 90 * 24 * 60 * 60 * 1000),
  },
  allocations: [
    {
      projectId: 'mock-1',
      percentage: 40,
      totalDonated: BigInt(1040_000_000),
      lastDonationAt: BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: 'mock-2',
      percentage: 35,
      totalDonated: BigInt(910_000_000),
      lastDonationAt: BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: 'mock-3',
      percentage: 25,
      totalDonated: BigInt(650_000_000),
      lastDonationAt: BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ],
  stats: {
    vaultBalance: BigInt(10000_000_000), // $10,000
    estimatedAnnualYield: BigInt(520_000_000), // $520 (5.2% APY)
    donationPool: BigInt(260_000_000), // $260 (50% of yield)
    retainedYield: BigInt(260_000_000), // $260
    totalDonated: BigInt(2600_000_000), // $2,600 累積
    activeProjects: 3,
  },
};

// Simple in-memory cache
let cachedDashboard: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// ==================== API Route ====================

export async function GET(request: Request) {
  console.log('Fetching dashboard data...');
  const now = Date.now();

  // Get user address from query params
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('address');

  // Return cached data if valid
  if (cachedDashboard && (now - lastFetchTime < CACHE_TTL)) {
    console.log('Returning cached dashboard data');
    return NextResponse.json(cachedDashboard);
  }

  try {
    // In real implementation:
    // 1. Query user's Vault by owner address
    // 2. Query all Dynamic Field allocations
    // 3. Calculate statistics (yield, donation pool, etc.)
    // 4. Query project objects for allocation details
    
    const dashboardData = {
      vault: {
        id: MOCK_DASHBOARD.vault.id,
        owner: MOCK_DASHBOARD.vault.owner,
        balance: MOCK_DASHBOARD.vault.balance.toString(),
        globalDonationPercentage: MOCK_DASHBOARD.vault.globalDonationPercentage,
        totalDonated: MOCK_DASHBOARD.vault.totalDonated.toString(),
        createdAt: MOCK_DASHBOARD.vault.createdAt.toString(),
      },
      allocations: MOCK_DASHBOARD.allocations.map(a => ({
        projectId: a.projectId,
        percentage: a.percentage,
        totalDonated: a.totalDonated.toString(),
        lastDonationAt: a.lastDonationAt.toString(),
      })),
      stats: {
        vaultBalance: MOCK_DASHBOARD.stats.vaultBalance.toString(),
        estimatedAnnualYield: MOCK_DASHBOARD.stats.estimatedAnnualYield.toString(),
        donationPool: MOCK_DASHBOARD.stats.donationPool.toString(),
        retainedYield: MOCK_DASHBOARD.stats.retainedYield.toString(),
        totalDonated: MOCK_DASHBOARD.stats.totalDonated.toString(),
        activeProjects: MOCK_DASHBOARD.stats.activeProjects,
      },
    };

    // Update cache
    cachedDashboard = dashboardData;
    lastFetchTime = now;

    console.log('Returning fresh dashboard data');
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
