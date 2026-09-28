import { NextRequest, NextResponse } from 'next/server';
import { PACKAGE_ID } from '@/config/sui';
import { getSuiClient, suiClient } from '@/lib/sui/client';  // ✅ 使用 gRPC；餘額查詢用 JSON-RPC
import {
  getProjectById,
  getProjectUpdates,
  getProjectSupportersFromEvents,
  verifySupportersAgainstHoldings,
  sumVerifiedSupport,
} from '@/lib/sui/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    const client = getSuiClient();  // ✅ 使用 gRPC

    // Fetch project details
    const project = await getProjectById(client, projectId, PACKAGE_ID);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch updates
    const updates = await getProjectUpdates(client, projectId, PACKAGE_ID);

    // Fetch declared supporters, then cap each declaration at the brand coin the address actually holds
    const declared = await getProjectSupportersFromEvents(client, PACKAGE_ID, projectId);
    const supporters = await verifySupportersAgainstHoldings(
      declared,
      project.coinType,
      async (owner, coinType) => BigInt((await suiClient.getBalance({ owner, coinType })).totalBalance),
    );
    const verifiedSupportAmount = sumVerifiedSupport(supporters);

    // Serialize BigInt fields
    const response = {
      project: {
        ...project,
        raisedAmount: project.raisedAmount.toString(),
        totalSupportAmount: project.totalSupportAmount?.toString(),
        verifiedSupportAmount: verifiedSupportAmount.toString(),
        balance: project.balance?.toString(),
        createdAt: project.createdAt?.toString(),
      },
      updates: updates.map(u => ({
        ...u,
        timestamp: u.timestamp,
      })),
      supporters: supporters.map(s => ({
        address: s.address,
        amount: s.amount.toString(),
        heldAmount: s.heldAmount === null ? null : s.heldAmount.toString(),
        verifiedAmount: s.verifiedAmount.toString(),
        verification: s.verification,
        lastUpdated: s.lastUpdated,
      })),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
