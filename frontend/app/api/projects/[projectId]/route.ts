import { NextRequest, NextResponse } from 'next/server';
import { PACKAGE_ID } from '@/config/sui';
import { suiClient } from '@/lib/sui/client';
import { getProjectById, getProjectUpdates, getProjectSupportersFromEvents } from '@/lib/sui/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    // Fetch project details
    const project = await getProjectById(suiClient, projectId, PACKAGE_ID);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch updates
    const updates = await getProjectUpdates(suiClient, projectId, PACKAGE_ID);

    // Fetch supporters
    const supporters = await getProjectSupportersFromEvents(suiClient, PACKAGE_ID, projectId);

    // Serialize BigInt fields
    const response = {
      project: {
        ...project,
        raisedAmount: project.raisedAmount.toString(),
        totalSupportAmount: project.totalSupportAmount?.toString(),
        balance: project.balance?.toString(),
        createdAt: project.createdAt?.toString(),
      },
      updates: updates.map(u => ({
        ...u,
        timestamp: u.timestamp,
      })),
      supporters: supporters.map(s => ({
        ...s,
        amount: s.amount.toString(),
        lastUpdated: s.lastUpdated,
      })),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[API] Error fetching project details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
