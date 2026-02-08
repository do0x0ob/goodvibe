import { NextResponse } from 'next/server';

// ==================== Mock Platform Statistics ====================

const MOCK_PLATFORM_STATS = {
  totalProjectsCreated: 12,
  totalVaultsCreated: 156,
  totalValueLocked: BigInt(1_500_000_000_000), // $1.5M TVL
  totalDonated: BigInt(78_000_000_000), // $78K total donated
  activeProjects: 12,
  activeDonors: 156,
  createdAt: BigInt(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
};

// Simple cache
let cachedStats: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (stats change less frequently)

// ==================== API Route ====================

export async function GET() {
  console.log('Fetching platform statistics...');
  const now = Date.now();

  // Return cached data if valid
  if (cachedStats && (now - lastFetchTime < CACHE_TTL)) {
    console.log('Returning cached platform stats');
    return NextResponse.json(cachedStats);
  }

  try {
    // In real implementation:
    // 1. Query DonationPlatform shared object
    // 2. Call platform::get_stats()
    // 3. Aggregate data from multiple sources

    const statsData = {
      totalProjectsCreated: MOCK_PLATFORM_STATS.totalProjectsCreated,
      totalVaultsCreated: MOCK_PLATFORM_STATS.totalVaultsCreated,
      totalValueLocked: MOCK_PLATFORM_STATS.totalValueLocked.toString(),
      totalDonated: MOCK_PLATFORM_STATS.totalDonated.toString(),
      activeProjects: MOCK_PLATFORM_STATS.activeProjects,
      activeDonors: MOCK_PLATFORM_STATS.activeDonors,
      createdAt: MOCK_PLATFORM_STATS.createdAt.toString(),
    };

    // Update cache
    cachedStats = statsData;
    lastFetchTime = now;

    console.log('Returning fresh platform stats');
    return NextResponse.json(statsData);
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform stats' },
      { status: 500 }
    );
  }
}
