import { NextRequest, NextResponse } from 'next/server';
import { SuiClient } from '@mysten/sui/client';
import { NETWORK } from '@/config/sui';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const client = new SuiClient({ url: NETWORK.url });

  try {
    // 1. 獲取所有 dynamic fields
    const dynamicFields = await client.getDynamicFields({
      parentId: projectId,
    });

    console.log('[DEBUG] Dynamic fields count:', dynamicFields.data.length);

    const fieldsDetails = [];

    // 2. 逐個解析
    for (const field of dynamicFields.data) {
      try {
        const name = (field as any).name;
        console.log('[DEBUG] Field name raw:', JSON.stringify(name, null, 2));

        // 嘗試獲取完整的 field object
        const fieldObj = await client.getDynamicFieldObject({
          parentId: projectId,
          name: name,
        });

        console.log('[DEBUG] Field object:', JSON.stringify(fieldObj.data, null, 2));

        fieldsDetails.push({
          name: name,
          objectType: (field as any).objectType,
          fieldObject: fieldObj.data,
        });
      } catch (err: any) {
        console.error('[DEBUG] Error processing field:', err);
        fieldsDetails.push({
          name: (field as any).name,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      projectId,
      fieldCount: dynamicFields.data.length,
      fields: fieldsDetails,
    });
  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
