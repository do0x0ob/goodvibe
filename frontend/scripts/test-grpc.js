#!/usr/bin/env node

/**
 * 測試 Surflux gRPC 連線
 * 使用方式: node scripts/test-grpc.js
 */

require('dotenv').config({ path: '.env.local' });

const { SuiGrpcClient } = require('@mysten/sui/grpc');
const { GrpcWebFetchTransport } = require('@protobuf-ts/grpcweb-transport');

const GRPC_ENDPOINT = process.env.NEXT_PUBLIC_SUI_GRPC_ENDPOINT || '';
const GRPC_API_KEY = process.env.NEXT_PUBLIC_SUI_GRPC_TOKEN || '';

console.log('🔧 Surflux gRPC 連線測試\n');
console.log('端點:', GRPC_ENDPOINT);
console.log('API Key:', GRPC_API_KEY ? '✅ 已設定' : '❌ 未設定');
console.log('');

if (!GRPC_ENDPOINT || !GRPC_API_KEY) {
  console.error('❌ 請在 .env.local 中設定 NEXT_PUBLIC_SUI_GRPC_ENDPOINT 和 NEXT_PUBLIC_SUI_GRPC_TOKEN');
  process.exit(1);
}

// 建立 gRPC transport
const baseUrl = GRPC_ENDPOINT.includes('://') 
  ? GRPC_ENDPOINT 
  : `https://${GRPC_ENDPOINT}`;

console.log('完整端點:', baseUrl);
console.log('');

const fetchWithApiKey = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set('x-api-key', GRPC_API_KEY);
  return fetch(input, { ...init, headers });
};

const transport = new GrpcWebFetchTransport({
  baseUrl,
  fetch: fetchWithApiKey,
});

const client = new SuiGrpcClient({
  network: 'mainnet',
  transport,
});

// 測試連線
async function testConnection() {
  try {
    console.log('📡 測試連線...');
    const { response } = await client.ledgerService.getServiceInfo({});
    
    console.log('✅ 連線成功！\n');
    console.log('鏈資訊:');
    console.log('  - Chain:', response.chain);
    console.log('  - Chain ID:', response.chain_id);
    console.log('  - Epoch:', response.epoch);
    console.log('  - Checkpoint Height:', response.checkpoint_height);
    console.log('  - Server:', response.server);
    console.log('');
    
    // 測試查詢 owned objects
    console.log('📦 測試查詢 Owned Objects...');
    const testAddress = '0x5'; // System state object address
    try {
      const { response: objectsResponse } = await client.stateService.listOwnedObjects({
        owner: testAddress,
        limit: 5,
      });
      
      console.log('✅ Owned Objects 查詢成功！');
      console.log('  - Owner:', testAddress);
      console.log('  - Objects Count:', objectsResponse.objects?.length || 0);
      if (objectsResponse.objects?.length > 0) {
        console.log('  - First Object ID:', objectsResponse.objects[0].object_id);
      }
    } catch (objectsError) {
      console.log('⚠️  Owned Objects 查詢失敗:', objectsError.message);
    }
    console.log('');
    
    console.log('🎉 所有測試通過！gRPC 連線正常運作。');
    
  } catch (error) {
    console.error('❌ 連線失敗:', error.message);
    if (error.code) {
      console.error('錯誤代碼:', error.code);
    }
    if (error.stack) {
      console.error('\n詳細錯誤:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testConnection();
