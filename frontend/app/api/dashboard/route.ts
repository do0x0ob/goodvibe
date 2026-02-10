import { NextResponse } from 'next/server';
import { suiClient } from '@/lib/sui/client';
import { getUserSupportRecord, getSupportRecordBadges } from '@/lib/sui/queries';
import { PACKAGE_ID } from '@/config/sui';

type DashboardResponse = {
  supportedProjects: Array<{
    projectId: string;
    projectName: string;
    donationAmount: string;
  }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('address');

  try {
    if (!userAddress || !PACKAGE_ID) {
      return NextResponse.json({
        supportedProjects: [],
      });
    }

    const recordId = await getUserSupportRecord(suiClient, userAddress, PACKAGE_ID);

    if (!recordId) {
      return NextResponse.json({
        supportedProjects: [],
      });
    }

    const badges = await getSupportRecordBadges(suiClient, recordId);

    const dashboardData: DashboardResponse = {
      supportedProjects: badges.map((b) => ({
        projectId: b.projectId,
        projectName: b.projectName,
        donationAmount: b.donationAmount.toString(),
      })),
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', supportedProjects: [] },
      { status: 500 }
    );
  }
}
